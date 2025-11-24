/**
 * Shipping Service - Envia.com Integration
 * Estudio Artesana
 *
 * Este servicio maneja la integración completa con Envia.com para:
 * - Cotización de envíos
 * - Generación de guías
 * - Tracking de paquetes
 * - Webhooks de actualización
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.SHIPPING_PORT || 3001;

// =====================================================
// CONFIGURACIÓN DE SUPABASE
// =====================================================
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Usamos service role para operaciones backend
);

// =====================================================
// MIDDLEWARE DE SEGURIDAD
// =====================================================
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8000',
    credentials: true
}));

// Rate limiting
const shippingLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30, // máximo 30 requests por minuto
    message: {
        error: 'Demasiadas solicitudes. Intenta nuevamente en un momento.'
    }
});

app.use(express.json({ limit: '5mb' }));
app.use('/api/shipping', shippingLimiter);

// =====================================================
// CONFIGURACIÓN DE ENVIA.COM
// =====================================================
const ENVIA_CONFIG = {
    apiKey: process.env.ENVIA_API_KEY,
    baseUrl: process.env.ENVIA_BASE_URL || 'https://queries.envia.com/v2',
    originZip: process.env.ORIGIN_ZIP_CODE || '01000',
    webhookSecret: process.env.ENVIA_WEBHOOK_SECRET
};

// Validar configuración al inicio
if (!ENVIA_CONFIG.apiKey) {
    console.error('❌ ERROR: ENVIA_API_KEY no está configurada');
    console.error('⚠️  El servicio de envíos no funcionará sin esta API key');
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Realiza una petición a la API de Envia.com
 */
async function enviaApiRequest(endpoint, method = 'POST', body = null) {
    const url = `${ENVIA_CONFIG.baseUrl}${endpoint}`;

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ENVIA_CONFIG.apiKey}`
        }
    };

    if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
    }

    console.log(`📡 Envia API Request: ${method} ${endpoint}`);

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Envia API Error:', data);
        throw new Error(data.message || 'Error en API de Envia.com');
    }

    console.log('✅ Envia API Response OK');
    return data;
}

/**
 * Cachea una cotización de envío
 */
async function cacheShippingRate(rateData) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Cache por 24 horas

    const { error } = await supabase
        .from('shipping_rates_cache')
        .insert({
            origin_zip: rateData.originZip,
            destination_zip: rateData.destinationZip,
            weight: rateData.weight,
            carrier: rateData.carrier,
            service: rateData.service,
            service_display_name: rateData.serviceDisplayName,
            cost: rateData.cost,
            delivery_days: rateData.deliveryDays,
            delivery_date: rateData.deliveryDate,
            expires_at: expiresAt.toISOString(),
            raw_response: rateData.rawResponse || {}
        });

    if (error) {
        console.error('⚠️ Error cacheando cotización:', error);
    } else {
        console.log('✅ Cotización cacheada exitosamente');
    }
}

/**
 * Busca cotización en cache
 */
async function getCachedRate(originZip, destinationZip, weight, carrier) {
    const { data, error } = await supabase
        .from('shipping_rates_cache')
        .select('*')
        .eq('origin_zip', originZip)
        .eq('destination_zip', destinationZip)
        .eq('weight', weight)
        .eq('carrier', carrier)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (error || !data) {
        return null;
    }

    console.log('✅ Cotización encontrada en cache');
    return data;
}

// =====================================================
// ENDPOINT: POST /api/shipping/quote
// Cotizar envío
// =====================================================
app.post('/api/shipping/quote', async (req, res) => {
    try {
        console.log('📦 Recibida solicitud de cotización de envío');

        const { postalCode, items } = req.body;

        // Validación
        if (!postalCode || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere código postal y al menos un producto'
            });
        }

        // Calcular peso y dimensiones totales
        let totalWeight = 0;
        let totalLength = 0;
        let totalWidth = 0;
        let totalHeight = 0;

        items.forEach(item => {
            const weight = item.weight || 500; // Default 500g si no tiene peso
            const quantity = item.quantity || 1;

            totalWeight += weight * quantity;

            // Para dimensiones, usamos las máximas (simplificación)
            if (item.length) totalLength = Math.max(totalLength, item.length);
            if (item.width) totalWidth = Math.max(totalWidth, item.width);
            if (item.height) totalHeight = Math.max(totalHeight, item.height);
        });

        // Dimensiones por defecto si no se especifican
        if (!totalLength) totalLength = 30; // 30cm
        if (!totalWidth) totalWidth = 20;   // 20cm
        if (!totalHeight) totalHeight = 10; // 10cm

        console.log(`📊 Peso total: ${totalWeight}g, Dimensiones: ${totalLength}x${totalWidth}x${totalHeight}cm`);

        // Preparar request para Envia.com
        const enviaRequest = {
            origin: {
                postal_code: ENVIA_CONFIG.originZip,
                country: 'MX'
            },
            destination: {
                postal_code: postalCode,
                country: 'MX'
            },
            packages: [{
                weight: totalWeight,
                height: totalHeight,
                width: totalWidth,
                length: totalLength
            }]
        };

        // Llamar a Envia.com API
        const enviaResponse = await enviaApiRequest('/rates', 'POST', enviaRequest);

        // Procesar respuesta y cachear cada opción
        const shippingOptions = [];

        if (enviaResponse.data && Array.isArray(enviaResponse.data)) {
            for (const rate of enviaResponse.data) {
                const option = {
                    carrier: rate.carrier,
                    service: rate.service,
                    serviceDisplayName: rate.service_name || rate.service,
                    cost: parseFloat(rate.amount_local),
                    deliveryDays: rate.delivery_estimate?.days || 3,
                    deliveryDate: rate.delivery_estimate?.date,
                    logo: rate.carrier_logo,
                    rawResponse: rate
                };

                shippingOptions.push(option);

                // Cachear esta opción
                await cacheShippingRate({
                    originZip: ENVIA_CONFIG.originZip,
                    destinationZip: postalCode,
                    weight: totalWeight,
                    ...option
                });
            }
        }

        // Ordenar por precio (más barato primero)
        shippingOptions.sort((a, b) => a.cost - b.cost);

        console.log(`✅ ${shippingOptions.length} opciones de envío encontradas`);

        res.json({
            success: true,
            options: shippingOptions,
            packageInfo: {
                weight: totalWeight,
                dimensions: {
                    length: totalLength,
                    width: totalWidth,
                    height: totalHeight
                }
            }
        });

    } catch (error) {
        console.error('❌ Error cotizando envío:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al cotizar envío'
        });
    }
});

// =====================================================
// ENDPOINT: POST /api/shipping/create
// Crear guía de envío
// =====================================================
app.post('/api/shipping/create', async (req, res) => {
    try {
        console.log('📝 Recibida solicitud de creación de guía');

        const { orderId, carrier, service } = req.body;

        // Validación
        if (!orderId || !carrier) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere orderId y carrier'
            });
        }

        // Obtener información de la orden
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return res.status(404).json({
                success: false,
                error: 'Orden no encontrada'
            });
        }

        console.log(`📦 Procesando orden #${order.order_number}`);

        // Calcular peso de los items
        const items = order.items || [];
        const totalWeight = items.reduce((sum, item) => {
            return sum + ((item.weight || 500) * (item.quantity || 1));
        }, 0);

        // Preparar request para Envia.com
        const shipmentRequest = {
            origin: {
                name: 'Estudio Artesana',
                company: 'Estudio Artesana',
                email: process.env.ADMIN_EMAIL || 'contacto@estudioartesana.com',
                phone: order.business_phone || '5555555555',
                street: 'Calle Principal',
                number: '123',
                district: 'Centro',
                city: 'Ciudad de México',
                state: 'CDMX',
                country: 'MX',
                postalCode: ENVIA_CONFIG.originZip
            },
            destination: {
                name: order.customer_name,
                email: order.customer_email,
                phone: order.customer_phone,
                street: order.shipping_address,
                city: order.shipping_city,
                state: order.shipping_state,
                country: order.shipping_country || 'MX',
                postalCode: order.shipping_postal_code
            },
            packages: [{
                content: items.map(item => item.name).join(', ').substring(0, 100),
                amount: order.total_amount,
                weight: totalWeight,
                height: 10,
                width: 20,
                length: 30
            }],
            carrier: carrier,
            service: service,
            shipment: {
                type: 1 // Paquete
            }
        };

        // Crear shipment en Envia.com
        const enviaResponse = await enviaApiRequest('/shipments', 'POST', shipmentRequest);

        // Guardar shipment en DB
        const { data: shipment, error: shipmentError } = await supabase
            .from('shipments')
            .insert({
                order_id: orderId,
                envia_shipment_id: enviaResponse.data?.id,
                tracking_number: enviaResponse.data?.trackingNumber,
                carrier: carrier,
                carrier_service: service,
                status: 'label_created',
                shipping_cost: enviaResponse.data?.cost || order.shipping_cost || 0,
                label_url: enviaResponse.data?.labelUrl,
                tracking_url: enviaResponse.data?.trackingUrl,
                weight: totalWeight,
                tracking_events: []
            })
            .select()
            .single();

        if (shipmentError) {
            console.error('❌ Error guardando shipment:', shipmentError);
            throw new Error('Error guardando información de envío');
        }

        // Actualizar orden con info de tracking
        await supabase
            .from('orders')
            .update({
                carrier: carrier,
                carrier_service: service,
                tracking_number: enviaResponse.data?.trackingNumber,
                status: 'processing' // Cambiar status de orden
            })
            .eq('id', orderId);

        console.log('✅ Guía creada exitosamente');

        res.json({
            success: true,
            shipment: {
                id: shipment.id,
                trackingNumber: shipment.tracking_number,
                labelUrl: shipment.label_url,
                trackingUrl: shipment.tracking_url,
                carrier: shipment.carrier,
                status: shipment.status
            }
        });

    } catch (error) {
        console.error('❌ Error creando guía:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al crear guía de envío'
        });
    }
});

// =====================================================
// ENDPOINT: GET /api/shipping/track/:trackingNumber
// Rastrear paquete
// =====================================================
app.get('/api/shipping/track/:trackingNumber', async (req, res) => {
    try {
        const { trackingNumber } = req.params;

        console.log(`🔍 Rastreando paquete: ${trackingNumber}`);

        // Buscar shipment en DB
        const { data: shipment, error } = await supabase
            .from('shipments')
            .select('*')
            .eq('tracking_number', trackingNumber)
            .single();

        if (error || !shipment) {
            return res.status(404).json({
                success: false,
                error: 'Paquete no encontrado'
            });
        }

        // Obtener tracking actualizado de Envia.com
        const trackingData = await enviaApiRequest(`/shipments/${shipment.envia_shipment_id}/track`, 'GET');

        // Actualizar shipment en DB
        const updatedData = {
            status: trackingData.status || shipment.status,
            tracking_events: trackingData.events || [],
            updated_at: new Date().toISOString()
        };

        if (trackingData.deliveryDate) {
            updatedData.actual_delivery_date = trackingData.deliveryDate;
        }

        await supabase
            .from('shipments')
            .update(updatedData)
            .eq('id', shipment.id);

        console.log('✅ Tracking actualizado');

        res.json({
            success: true,
            tracking: {
                trackingNumber: shipment.tracking_number,
                carrier: shipment.carrier,
                status: updatedData.status,
                events: updatedData.tracking_events,
                estimatedDelivery: shipment.estimated_delivery_date,
                actualDelivery: updatedData.actual_delivery_date
            }
        });

    } catch (error) {
        console.error('❌ Error rastreando paquete:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al rastrear paquete'
        });
    }
});

// =====================================================
// ENDPOINT: POST /api/shipping/webhook
// Webhook de Envia.com para actualizaciones
// =====================================================
app.post('/api/shipping/webhook', async (req, res) => {
    try {
        console.log('📨 Webhook recibido de Envia.com');

        // Verificar signature (si Envia.com provee una)
        // const signature = req.headers['x-envia-signature'];
        // TODO: Validar signature

        const { shipmentId, status, events, trackingNumber } = req.body;

        // Actualizar shipment
        const { error } = await supabase
            .from('shipments')
            .update({
                status: status,
                tracking_events: events,
                updated_at: new Date().toISOString()
            })
            .eq('envia_shipment_id', shipmentId);

        if (error) {
            console.error('❌ Error actualizando shipment desde webhook:', error);
            return res.status(500).json({ success: false });
        }

        console.log(`✅ Shipment ${shipmentId} actualizado desde webhook`);

        res.json({ success: true });

    } catch (error) {
        console.error('❌ Error procesando webhook:', error);
        res.status(500).json({ success: false });
    }
});

// =====================================================
// ENDPOINT: GET /api/shipping/carriers
// Listar carriers disponibles
// =====================================================
app.get('/api/shipping/carriers', async (req, res) => {
    try {
        // Lista de carriers soportados por Envia.com
        const carriers = [
            { id: 'estafeta', name: 'Estafeta', logo: '/logos/estafeta.png' },
            { id: 'fedex', name: 'FedEx', logo: '/logos/fedex.png' },
            { id: 'dhl', name: 'DHL', logo: '/logos/dhl.png' },
            { id: 'redpack', name: 'Redpack', logo: '/logos/redpack.png' },
            { id: 'ups', name: 'UPS', logo: '/logos/ups.png' },
            { id: 'paquetexpress', name: 'Paquetexpress', logo: '/logos/paquetexpress.png' },
            { id: 'sendex', name: 'Sendex', logo: '/logos/sendex.png' }
        ];

        res.json({
            success: true,
            carriers
        });

    } catch (error) {
        console.error('❌ Error listando carriers:', error);
        res.status(500).json({
            success: false,
            error: 'Error al listar carriers'
        });
    }
});

// =====================================================
// ENDPOINT: GET /api/shipping/health
// Health check
// =====================================================
app.get('/api/shipping/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Shipping Service - Envia.com Integration',
        timestamp: new Date().toISOString(),
        enviaConfigured: !!ENVIA_CONFIG.apiKey
    });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ========================================');
    console.log('📦 Shipping Service - Envia.com');
    console.log('🚀 ========================================');
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/shipping/health`);
    console.log('');
    console.log('📡 Endpoints disponibles:');
    console.log('   POST   /api/shipping/quote');
    console.log('   POST   /api/shipping/create');
    console.log('   GET    /api/shipping/track/:trackingNumber');
    console.log('   POST   /api/shipping/webhook');
    console.log('   GET    /api/shipping/carriers');
    console.log('');

    if (!ENVIA_CONFIG.apiKey) {
        console.log('⚠️  ADVERTENCIA: ENVIA_API_KEY no configurada');
        console.log('⚠️  Configura las variables de entorno antes de usar');
    } else {
        console.log('✅ Envia.com API Key configurada');
    }
    console.log('========================================');
    console.log('');
});

module.exports = app;

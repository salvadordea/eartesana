/**
 * Payment Service - Openpay (BBVA) Integration
 *
 * Servicio backend para procesar pagos con Openpay
 * Soporta:
 * - Pagos con tarjeta (Checkout Hosted)
 * - Pagos en tiendas (OXXO, 7-Eleven)
 * - Webhooks para actualización de estado
 * - Validación de firmas HMAC SHA256
 *
 * Puerto: 3002
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

// =====================================================
// CONFIGURACIÓN
// =====================================================

const app = express();
const PORT = process.env.PAYMENT_PORT || 3002;

// Validar variables de entorno críticas
const requiredEnvVars = [
    'OPENPAY_MERCHANT_ID',
    'OPENPAY_PRIVATE_KEY',
    'OPENPAY_PUBLIC_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
    console.error('💡 Verifica tu archivo .env');
    process.exit(1);
}

// Openpay Config
const OPENPAY_CONFIG = {
    merchantId: process.env.OPENPAY_MERCHANT_ID,
    privateKey: process.env.OPENPAY_PRIVATE_KEY,
    publicKey: process.env.OPENPAY_PUBLIC_KEY,
    sandbox: process.env.OPENPAY_SANDBOX === 'true',
    webhookSecret: process.env.OPENPAY_WEBHOOK_SECRET,
    baseUrl: process.env.OPENPAY_SANDBOX === 'true'
        ? 'https://sandbox-api.openpay.mx/v1'
        : 'https://api.openpay.mx/v1'
};

// Supabase Client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('✅ Openpay Payment Service configurado');
console.log(`📦 Merchant ID: ${OPENPAY_CONFIG.merchantId}`);
console.log(`🧪 Modo: ${OPENPAY_CONFIG.sandbox ? 'SANDBOX' : 'PRODUCCIÓN'}`);

// =====================================================
// MIDDLEWARE
// =====================================================

// Security Headers
app.use(helmet());

// CORS
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por ventana
    message: {
        success: false,
        error: 'Demasiadas solicitudes, intenta más tarde'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// Request Logging
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// =====================================================
// UTILIDADES
// =====================================================

/**
 * Realiza request HTTP a la API de Openpay
 */
function openpayRequest(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
        const url = `${OPENPAY_CONFIG.baseUrl}/${OPENPAY_CONFIG.merchantId}${endpoint}`;
        const auth = Buffer.from(`${OPENPAY_CONFIG.privateKey}:`).toString('base64');

        const options = {
            method: method,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'User-Agent': 'EstudioArtesana-PaymentService/1.0'
            }
        };

        const req = https.request(url, options, (res) => {
            let body = '';

            res.on('data', chunk => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);

                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject({
                            statusCode: res.statusCode,
                            error: parsed
                        });
                    }
                } catch (e) {
                    reject({
                        statusCode: res.statusCode,
                        error: 'Invalid JSON response',
                        raw: body
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject({
                error: 'Network error',
                details: err.message
            });
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

/**
 * Valida firma de webhook
 */
function validateWebhookSignature(payload, signature) {
    if (!OPENPAY_CONFIG.webhookSecret) {
        console.warn('⚠️ OPENPAY_WEBHOOK_SECRET no configurado, webhook no validado');
        return true; // En desarrollo sin secret, permitir
    }

    const hmac = crypto.createHmac('sha256', OPENPAY_CONFIG.webhookSecret);
    const expectedSignature = hmac.update(JSON.stringify(payload)).digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

/**
 * Guarda transacción en Supabase
 */
async function saveTransaction(transactionData) {
    const { data, error } = await supabase
        .from('payment_transactions')
        .insert([{
            order_id: transactionData.order_id,
            transaction_id: transactionData.transaction_id,
            payment_method: 'openpay',
            amount: transactionData.amount,
            currency: 'MXN',
            status: transactionData.status,
            gateway_response: transactionData.gateway_response,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        console.error('❌ Error guardando transacción:', error);
        throw error;
    }

    console.log('✅ Transacción guardada:', data.id);
    return data;
}

/**
 * Envía email de forma no bloqueante
 */
async function sendEmail(endpoint, data) {
    return new Promise((resolve) => {
        const emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://localhost:3000';
        const url = new URL(endpoint, emailServiceUrl);
        const postData = JSON.stringify(data);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 10000 // 10 segundos
        };

        const req = http.request(url, options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`✅ Email ${endpoint} enviado exitosamente`);
                } else {
                    console.warn(`⚠️ Email ${endpoint} falló (status: ${res.statusCode})`);
                }
                resolve(); // No bloquear el flujo principal
            });
        });

        req.on('error', (err) => {
            console.warn(`⚠️ Email service no disponible para ${endpoint}:`, err.message);
            resolve(); // No bloquear el flujo principal
        });

        req.on('timeout', () => {
            console.warn(`⚠️ Email ${endpoint} timeout`);
            req.destroy();
            resolve();
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Actualiza estado de orden
 */
async function updateOrderStatus(orderId, status, paymentData = {}) {
    const updateData = {
        payment_status: status,
        updated_at: new Date().toISOString()
    };

    // Agregar datos adicionales según disponibilidad
    if (paymentData.reference) {
        updateData.payment_reference = paymentData.reference;
    }
    if (paymentData.barcode_url) {
        updateData.payment_barcode_url = paymentData.barcode_url;
    }
    if (paymentData.due_date) {
        updateData.payment_due_date = paymentData.due_date;
    }

    const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

    if (error) {
        console.error('❌ Error actualizando orden:', error);
        throw error;
    }

    console.log(`✅ Orden ${orderId} actualizada a estado: ${status}`);
    return data;
}

// =====================================================
// ENDPOINTS
// =====================================================

/**
 * GET /api/openpay/config
 * Devuelve configuración pública (NO expone private key)
 */
app.get('/api/openpay/config', (req, res) => {
    res.json({
        success: true,
        config: {
            merchantId: OPENPAY_CONFIG.merchantId,
            publicKey: OPENPAY_CONFIG.publicKey,
            sandbox: OPENPAY_CONFIG.sandbox
        }
    });
});

/**
 * POST /api/openpay/charge
 * Crea un cargo en Openpay (tarjeta o tienda)
 */
app.post('/api/openpay/charge', async (req, res) => {
    try {
        const { order_id, amount, customer, method, device_session_id } = req.body;

        // Validaciones básicas
        if (!order_id || !amount || !customer || !method) {
            return res.status(400).json({
                success: false,
                error: 'Datos incompletos: order_id, amount, customer, method son requeridos'
            });
        }

        if (!['card', 'store'].includes(method)) {
            return res.status(400).json({
                success: false,
                error: 'Método de pago inválido. Usar: card o store'
            });
        }

        // Construir payload según método
        let chargeData = {
            method: method,
            amount: parseFloat(amount),
            currency: 'MXN',
            description: `Orden #${order_id} - Estudio Artesana`,
            order_id: order_id.toString(),
            customer: {
                name: customer.name,
                email: customer.email,
                phone_number: customer.phone
            }
        };

        // Datos específicos por método
        if (method === 'card') {
            chargeData.redirect_url = `${process.env.FRONTEND_URL}/checkout-success.html?order_id=${order_id}`;
            chargeData.send_email = false; // Enviaremos nuestro propio email

            if (device_session_id) {
                chargeData.device_session_id = device_session_id;
            }
        } else if (method === 'store') {
            chargeData.due_date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 días
        }

        // Crear cargo en Openpay
        console.log('📤 Creando cargo en Openpay:', method);
        const charge = await openpayRequest('POST', '/charges', chargeData);

        console.log('✅ Cargo creado:', charge.id);

        // Guardar transacción en base de datos
        await saveTransaction({
            order_id: order_id,
            transaction_id: charge.id,
            amount: charge.amount,
            status: charge.status,
            gateway_response: charge
        });

        // Actualizar orden
        const paymentData = {};
        if (method === 'store') {
            paymentData.reference = charge.payment_method.reference;
            paymentData.barcode_url = charge.payment_method.barcode_url;
            paymentData.due_date = charge.due_date;
        }

        await updateOrderStatus(
            order_id,
            method === 'card' ? 'pending' : 'pending_payment',
            paymentData
        );

        // Respuesta según método
        const response = {
            success: true,
            transaction_id: charge.id,
            status: charge.status
        };

        if (method === 'card') {
            response.redirect_url = charge.payment_method.url;
        } else if (method === 'store') {
            response.payment_reference = charge.payment_method.reference;
            response.barcode_url = charge.payment_method.barcode_url;
            response.due_date = charge.due_date;
            response.redirect_url = `${process.env.FRONTEND_URL}/checkout-pending.html?order_id=${order_id}`;
        }

        res.json(response);

    } catch (error) {
        console.error('❌ Error creando cargo:', error);

        res.status(error.statusCode || 500).json({
            success: false,
            error: error.error?.description || error.error || 'Error procesando pago',
            details: error.error
        });
    }
});

/**
 * POST /api/openpay/webhook
 * Recibe notificaciones de Openpay
 */
app.post('/api/openpay/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-openpay-signature'];
        const payload = req.body;

        // Validar firma
        if (signature && !validateWebhookSignature(payload, signature)) {
            console.error('❌ Firma de webhook inválida');
            return res.status(401).json({
                success: false,
                error: 'Invalid signature'
            });
        }

        console.log('📥 Webhook recibido:', payload.type);

        const { type, transaction } = payload;

        // Mapear estados de Openpay a nuestros estados
        let orderStatus;
        switch (type) {
            case 'charge.succeeded':
                orderStatus = 'paid';

                // Enviar emails de confirmación (no bloqueante)
                try {
                    const { data: order } = await supabase
                        .from('orders')
                        .select('*')
                        .eq('id', transaction.order_id)
                        .single();

                    if (order) {
                        console.log('📧 Disparando emails de confirmación...');

                        // 1. Email de confirmación de pago al cliente
                        sendEmail('/api/email/payment-confirmed', {
                            orderNumber: order.order_number || `#${order.id}`,
                            customerEmail: order.customer_email,
                            customerName: order.customer_name,
                            amount: transaction.amount / 100, // Openpay envía en centavos
                            paymentMethod: transaction.method || 'openpay',
                            transactionId: transaction.id
                        });

                        // 2. Email de detalles del pedido al cliente
                        sendEmail('/api/email/order-confirmation', {
                            orderId: order.id,
                            customerEmail: order.customer_email
                        });

                        // 3. Email de notificación al admin
                        sendEmail('/api/email/admin-notification', {
                            orderId: order.id
                        });
                    }
                } catch (emailError) {
                    console.warn('⚠️ Error enviando emails (no crítico):', emailError.message);
                }

                break;

            case 'charge.failed':
                orderStatus = 'failed';
                break;
            case 'charge.cancelled':
                orderStatus = 'cancelled';
                break;
            case 'charge.refunded':
                orderStatus = 'refunded';
                break;
            default:
                console.log(`⚠️ Evento no manejado: ${type}`);
                return res.json({ success: true, message: 'Event not handled' });
        }

        // Actualizar transacción en base de datos
        const { error: txError } = await supabase
            .from('payment_transactions')
            .update({
                status: orderStatus,
                gateway_response: transaction,
                updated_at: new Date().toISOString()
            })
            .eq('transaction_id', transaction.id);

        if (txError) {
            console.error('❌ Error actualizando transacción:', txError);
        }

        // Actualizar orden
        await updateOrderStatus(transaction.order_id, orderStatus);

        res.json({ success: true });

    } catch (error) {
        console.error('❌ Error procesando webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando webhook'
        });
    }
});

/**
 * GET /api/openpay/verify/:transactionId
 * Consulta estado de una transacción
 */
app.get('/api/openpay/verify/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;

        if (!transactionId) {
            return res.status(400).json({
                success: false,
                error: 'Transaction ID requerido'
            });
        }

        // Consultar en Openpay
        const charge = await openpayRequest('GET', `/charges/${transactionId}`);

        // Actualizar en base de datos si el estado cambió
        const { data: localTx } = await supabase
            .from('payment_transactions')
            .select('status')
            .eq('transaction_id', transactionId)
            .single();

        if (localTx && localTx.status !== charge.status) {
            await supabase
                .from('payment_transactions')
                .update({
                    status: charge.status,
                    gateway_response: charge,
                    updated_at: new Date().toISOString()
                })
                .eq('transaction_id', transactionId);

            console.log(`🔄 Estado actualizado: ${localTx.status} → ${charge.status}`);
        }

        res.json({
            success: true,
            transaction: {
                id: charge.id,
                status: charge.status,
                amount: charge.amount,
                order_id: charge.order_id,
                method: charge.method,
                created_at: charge.creation_date
            }
        });

    } catch (error) {
        console.error('❌ Error verificando transacción:', error);

        res.status(error.statusCode || 500).json({
            success: false,
            error: error.error?.description || 'Error verificando transacción'
        });
    }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'payment-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: OPENPAY_CONFIG.sandbox ? 'sandbox' : 'production'
    });
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('💥 Error no manejado:', err);

    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// =====================================================
// INICIO DEL SERVIDOR
// =====================================================

app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('💳 OPENPAY PAYMENT SERVICE');
    console.log('═══════════════════════════════════════════════════');
    console.log(`🚀 Servidor corriendo en puerto: ${PORT}`);
    console.log(`🌐 Endpoints disponibles:`);
    console.log(`   GET  /api/openpay/config`);
    console.log(`   POST /api/openpay/charge`);
    console.log(`   POST /api/openpay/webhook`);
    console.log(`   GET  /api/openpay/verify/:transactionId`);
    console.log(`   GET  /health`);
    console.log(`🧪 Modo: ${OPENPAY_CONFIG.sandbox ? 'SANDBOX (desarrollo)' : 'PRODUCCIÓN'}`);
    console.log(`📦 Merchant: ${OPENPAY_CONFIG.merchantId}`);
    console.log(`🔐 CORS permitido: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM recibido, cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('👋 SIGINT recibido, cerrando servidor...');
    process.exit(0);
});

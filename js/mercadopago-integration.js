/**
 * INTEGRACIÓN MERCADOPAGO - ESTUDIO ARTESANA
 * ==========================================
 * Integra MercadoPago para procesamiento seguro de pagos
 * IMPORTANTE: NUNCA almacenar datos de tarjetas en la base de datos
 * 
 * 🔑 CONFIGURACIÓN DE CLAVES:
 * ==========================
 * 
 * CLAVES DE PRUEBA (DESARROLLO):
 * - Public Key: TEST-4e8f2c84-0e8c-4e8d-9f8a-1234567890ab
 * - Access Token: TEST-1234567890123456-123456-abcdef123456789012345678901234-123456789
 * 
 * CLAVES DE PRODUCCIÓN (CAMBIAR ANTES DE DEPLOY):
 * - Public Key: APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * - Access Token: APP_USR-1234567890123456-123456-abcdef123456789012345678901234-123456789
 * 
 * 📍 LUGARES DONDE CAMBIAR LAS CLAVES:
 * ===================================
 * 1. this.config.publicKey (línea ~50)
 * 2. this.config.accessToken (línea ~51) 
 * 3. Backend API endpoints (si se implementa)
 * 4. Variables de entorno del servidor
 * 
 * Funcionalidades:
 * - Checkout Pro (Redirección a MercadoPago) ✅
 * - Checkout API (Pago en sitio) ✅
 * - Webhooks para confirmación de pagos ✅
 * - Gestión de transacciones ✅
 */

class MercadoPagoIntegration {
    constructor() {
        // Configuración de Supabase
        this.baseUrl = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
        this.apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTg5MzUsImV4cCI6MjA3MzUzNDkzNX0.qEijwK3FlnqXP2qw0gl438Tt-Rd1vrfts1cXslUuteU';
        
        // Headers para peticiones API
        this.headers = {
            'Content-Type': 'application/json',
            'apikey': this.apiKey,
            'Authorization': `Bearer ${this.apiKey}`
        };
        
        // ==========================================
        // 🔑 CONFIGURACIÓN DE CLAVES MERCADOPAGO
        // ==========================================
        this.config = {
            // 🚨 CAMBIAR ESTAS CLAVES PARA PRODUCCIÓN 🚨
            
            // CLAVE PÚBLICA (Frontend) - CAMBIAR EN PRODUCCIÓN
            // DESARROLLO: TEST-xxxxx
            // PRODUCCIÓN: APP_USR-xxxxx
            publicKey: 'TEST-4e8f2c84-0e8c-4e8d-9f8a-1234567890ab',
            
            // ACCESS TOKEN (Backend) - CAMBIAR EN PRODUCCIÓN  
            // DESARROLLO: TEST-xxxxx
            // PRODUCCIÓN: APP_USR-xxxxx
            // ⚠️ IMPORTANTE: En producción debe estar en variables de entorno del servidor
            accessToken: 'TEST-1234567890123456-123456-abcdef123456789012345678901234-123456789',
            
            // URLs de API
            baseApiUrl: 'https://api.mercadopago.com',
            
            // Configuración de notificaciones
            webhookUrl: `${window.location.origin}/api/mercadopago-webhook`,
            
            // URLs de redirección - AJUSTAR SEGÚN TU DOMINIO
            successUrl: `${window.location.origin}/checkout-success.html`,
            failureUrl: `${window.location.origin}/checkout-failure.html`,
            pendingUrl: `${window.location.origin}/checkout-pending.html`,
            
            // Configuración de ambiente
            // DESARROLLO: 'sandbox'
            // PRODUCCIÓN: 'production'
            environment: 'sandbox'
        };
        
        // Estado de la integración
        this.mp = null; // Instancia de MercadoPago JS SDK
        this.isInitialized = false;
        
        console.log('💳 MercadoPago Integration inicializado');
        console.log('🔑 Usando claves de PRUEBA - Cambiar para producción');
        
        // Inicializar SDK
        this.initializeSDK();
    }

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================

    /**
     * Inicializar MercadoPago SDK
     */
    async initializeSDK() {
        try {
            // Verificar si ya está cargado
            if (window.MercadoPago) {
                this.mp = new window.MercadoPago(this.config.publicKey, {
                    locale: 'es-MX'
                });
                this.isInitialized = true;
                console.log('✅ MercadoPago SDK inicializado');
                return;
            }
            
            // Cargar SDK dinámicamente
            await this.loadMercadoPagoSDK();
            
            // Inicializar después de cargar
            this.mp = new window.MercadoPago(this.config.publicKey, {
                locale: 'es-MX'
            });
            
            this.isInitialized = true;
            console.log('✅ MercadoPago SDK cargado e inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando MercadoPago SDK:', error);
        }
    }

    /**
     * Cargar MercadoPago SDK dinámicamente
     */
    loadMercadoPagoSDK() {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            if (window.MercadoPago) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://sdk.mercadopago.com/js/v2';
            script.async = true;
            
            script.onload = () => {
                console.log('📦 MercadoPago SDK cargado');
                resolve();
            };
            
            script.onerror = () => {
                reject(new Error('Error cargando MercadoPago SDK'));
            };
            
            document.head.appendChild(script);
        });
    }

    // ==========================================
    // CHECKOUT PRO (REDIRECCIÓN)
    // ==========================================

    /**
     * Crear preferencia de pago y redireccionar a MercadoPago
     * Este es el método más seguro y recomendado
     */
    async createCheckoutPro(orderData) {
        try {
            console.log('🛒 Creando Checkout Pro para orden:', orderData.order_id);
            
            // Crear preferencia de pago
            const preference = await this.createPaymentPreference(orderData);
            
            if (!preference.success) {
                throw new Error(preference.message);
            }
            
            // Redireccionar a MercadoPago
            const redirectUrl = this.config.environment === 'sandbox' 
                ? preference.sandbox_init_point 
                : preference.init_point;
            
            window.location.href = redirectUrl;
            
            return {
                success: true,
                preference_id: preference.id,
                init_point: redirectUrl
            };
            
        } catch (error) {
            console.error('❌ Error creando Checkout Pro:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Crear preferencia de pago en MercadoPago
     */
    async createPaymentPreference(orderData) {
        try {
            // Preparar items para MercadoPago
            const items = orderData.items.map(item => ({
                id: item.product_id.toString(),
                title: item.product_snapshot.name,
                description: item.product_snapshot.description || '',
                picture_url: item.product_snapshot.image,
                category_id: 'art', // Categoría de arte/artesanías
                quantity: item.quantity,
                unit_price: parseFloat(item.unit_price),
                currency_id: 'MXN'
            }));
            
            // Agregar shipping cost como item si existe
            if (orderData.shipping_amount > 0) {
                items.push({
                    id: 'shipping',
                    title: 'Costo de envío',
                    description: 'Envío a domicilio',
                    quantity: 1,
                    unit_price: parseFloat(orderData.shipping_amount),
                    currency_id: 'MXN'
                });
            }
            
            // Preparar datos de la preferencia
            const preferenceData = {
                items: items,
                
                // Información del pagador
                payer: {
                    name: orderData.customer_info.name,
                    email: orderData.customer_info.email,
                    phone: {
                        area_code: '52', // Código de país México
                        number: orderData.customer_info.phone || ''
                    },
                    address: orderData.shipping_address ? {
                        street_name: orderData.shipping_address.address,
                        zip_code: orderData.shipping_address.postal_code
                    } : undefined
                },
                
                // URLs de retorno
                back_urls: {
                    success: `${this.config.successUrl}?order_id=${orderData.order_id}`,
                    failure: `${this.config.failureUrl}?order_id=${orderData.order_id}`,
                    pending: `${this.config.pendingUrl}?order_id=${orderData.order_id}`
                },
                
                auto_return: 'approved',
                
                // ID externo para tracking
                external_reference: orderData.order_id,
                
                // Configuración de notificaciones
                notification_url: this.config.webhookUrl,
                
                // Metadatos adicionales
                metadata: {
                    order_id: orderData.order_id,
                    customer_email: orderData.customer_info.email,
                    source: 'estudio_artesana_web'
                },
                
                // Configuración de experiencia
                payment_methods: {
                    excluded_payment_types: [], // Permitir todos los tipos
                    excluded_payment_methods: [], // No excluir métodos específicos
                    installments: 12 // Hasta 12 meses sin intereses
                },
                
                // Datos adicionales
                statement_descriptor: 'ESTUDIO ARTESANA',
                
                // Configuración de fechas
                expires: false, // No expira
                expiration_date_from: null,
                expiration_date_to: null
            };
            
            // Crear preferencia usando simulación de backend
            const response = await this.simulateCreatePreference(preferenceData);
            
            if (response.success) {
                // Guardar transaction record
                await this.createTransactionRecord(orderData.order_id, response.preference_id, 'mercadopago');
                
                return response;
            } else {
                throw new Error(response.message || 'Error creando preferencia');
            }
            
        } catch (error) {
            console.error('❌ Error creando preferencia de pago:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Simular creación de preferencia (reemplazar con backend real en producción)
     * 
     * 🚨 PARA PRODUCCIÓN:
     * ===================
     * Reemplazar esta función con una llamada real al backend:
     * 
     * const response = await fetch('/api/mercadopago/create-preference', {
     *     method: 'POST',
     *     headers: {
     *         'Content-Type': 'application/json',
     *         'Authorization': `Bearer ${userToken}`
     *     },
     *     body: JSON.stringify(preferenceData)
     * });
     */
    async simulateCreatePreference(preferenceData) {
        try {
            console.log('🧪 SIMULANDO creación de preferencia (reemplazar con backend real)');
            console.log('📦 Datos de preferencia:', preferenceData);
            
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Generar IDs únicos para la preferencia
            const preferenceId = 'TEST-PREF-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
            
            // URLs simuladas (en MercadoPago real serían diferentes)
            const baseCheckoutUrl = this.config.environment === 'sandbox' 
                ? 'https://sandbox.mercadopago.com.mx/checkout/v1/redirect'
                : 'https://www.mercadopago.com.mx/checkout/v1/redirect';
            
            return {
                success: true,
                id: preferenceId,
                init_point: `${baseCheckoutUrl}?pref_id=${preferenceId}`,
                sandbox_init_point: `https://sandbox.mercadopago.com.mx/checkout/v1/redirect?pref_id=${preferenceId}`,
                client_id: '1234567890',
                collector_id: 123456789,
                operation_type: 'regular_payment'
            };
            
        } catch (error) {
            console.error('❌ Error simulando preferencia:', error);
            return {
                success: false,
                message: 'Error en simulación de preferencia',
                error: error
            };
        }
    }

    // ==========================================
    // GESTIÓN DE TRANSACCIONES
    // ==========================================

    /**
     * Crear registro de transacción en Supabase
     */
    async createTransactionRecord(orderId, transactionId, paymentMethod) {
        try {
            const orderResponse = await fetch(`${this.baseUrl}/rest/v1/orders?id=eq.${orderId}&select=*`, {
                headers: this.headers
            });
            
            if (!orderResponse.ok) {
                throw new Error('Orden no encontrada');
            }
            
            const orders = await orderResponse.json();
            
            if (!orders || orders.length === 0) {
                throw new Error('Orden no encontrada');
            }
            
            const order = orders[0];
            
            const transactionData = {
                order_id: orderId,
                transaction_id: transactionId,
                payment_method: paymentMethod,
                amount: order.total_amount,
                currency: 'MXN',
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            const response = await fetch(`${this.baseUrl}/rest/v1/payment_transactions`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(transactionData)
            });
            
            if (response.ok) {
                console.log('✅ Registro de transacción creado');
            }
            
        } catch (error) {
            console.error('❌ Error creando registro de transacción:', error);
        }
    }

    /**
     * Actualizar registro de transacción
     */
    async updateTransactionRecord(transactionId, status, gatewayResponse = null) {
        try {
            const updateData = {
                status: status,
                processed_at: new Date().toISOString()
            };
            
            if (status === 'completed') {
                updateData.completed_at = new Date().toISOString();
            } else if (status === 'failed') {
                updateData.failed_at = new Date().toISOString();
            }
            
            if (gatewayResponse) {
                updateData.gateway_response = gatewayResponse;
            }
            
            const response = await fetch(`${this.baseUrl}/rest/v1/payment_transactions?transaction_id=eq.${transactionId}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify(updateData)
            });
            
            if (response.ok) {
                console.log(`✅ Transacción ${transactionId} actualizada a ${status}`);
            }
            
        } catch (error) {
            console.error('❌ Error actualizando transacción:', error);
        }
    }

    // ==========================================
    // WEBHOOKS Y CONFIRMACIÓN
    // ==========================================

    /**
     * Procesar confirmación de pago desde webhook
     * 
     * 🚨 PARA PRODUCCIÓN:
     * ===================
     * Esta función debe ejecutarse en el backend con el ACCESS TOKEN real:
     * 
     * const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
     *     headers: {
     *         'Authorization': `Bearer ${ACCESS_TOKEN}` // ⚠️ Solo en backend
     *     }
     * });
     */
    async processWebhookNotification(notification) {
        try {
            console.log('🔔 Procesando notificación webhook:', notification);
            
            // Verificar tipo de notificación
            if (notification.type !== 'payment') {
                return { success: false, message: 'Tipo de notificación no soportado' };
            }
            
            // Obtener información del pago desde MercadoPago
            const paymentInfo = await this.simulateGetPaymentInfo(notification.data.id);
            
            if (!paymentInfo.success) {
                throw new Error('Error obteniendo información del pago');
            }
            
            const payment = paymentInfo.payment;
            const orderId = payment.external_reference;
            
            // Actualizar estado de la orden basado en el estado del pago
            await this.updateOrderStatus(orderId, payment.status, payment);
            
            // Actualizar registro de transacción
            await this.updateTransactionRecord(payment.id.toString(), this.mapPaymentStatus(payment.status), payment);
            
            console.log(`✅ Pago ${payment.id} procesado exitosamente`);
            
            return {
                success: true,
                payment_id: payment.id,
                order_id: orderId,
                status: payment.status
            };
            
        } catch (error) {
            console.error('❌ Error procesando webhook:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Simular obtención de información de pago
     * 
     * 🚨 EN PRODUCCIÓN reemplazar con:
     * 
     * const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
     *     headers: {
     *         'Authorization': `Bearer ${this.config.accessToken}` // ⚠️ Solo en backend
     *     }
     * });
     */
    async simulateGetPaymentInfo(paymentId) {
        try {
            console.log('🧪 SIMULANDO obtención de info de pago:', paymentId);
            
            // Simular delay
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Simular respuesta de MercadoPago
            return {
                success: true,
                payment: {
                    id: paymentId,
                    status: 'approved', // approved, pending, rejected, etc.
                    status_detail: 'accredited',
                    external_reference: 'TEST-ORDER-' + Date.now(),
                    transaction_amount: 1000,
                    currency_id: 'MXN',
                    payment_method_id: 'visa',
                    payment_type_id: 'credit_card',
                    date_approved: new Date().toISOString(),
                    date_created: new Date().toISOString(),
                    collector_id: 123456789,
                    payer: {
                        email: 'test@example.com',
                        identification: {
                            type: 'CURP',
                            number: 'XXXX000000XXXXXXXX'
                        }
                    }
                }
            };
            
        } catch (error) {
            console.error('❌ Error simulando info de pago:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Actualizar estado de la orden basado en el pago
     */
    async updateOrderStatus(orderId, paymentStatus, paymentData) {
        try {
            let orderStatus = 'pending';
            let paymentStatusMapped = 'pending';
            
            // Mapear estados de MercadoPago a nuestros estados
            switch (paymentStatus) {
                case 'approved':
                    orderStatus = 'confirmed';
                    paymentStatusMapped = 'paid';
                    break;
                case 'pending':
                case 'in_process':
                    orderStatus = 'pending';
                    paymentStatusMapped = 'pending';
                    break;
                case 'rejected':
                case 'cancelled':
                    orderStatus = 'cancelled';
                    paymentStatusMapped = 'failed';
                    break;
                case 'refunded':
                    orderStatus = 'refunded';
                    paymentStatusMapped = 'refunded';
                    break;
            }
            
            // Actualizar orden
            await fetch(`${this.baseUrl}/rest/v1/orders?id=eq.${orderId}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify({
                    status: orderStatus,
                    payment_status: paymentStatusMapped,
                    confirmed_at: paymentStatus === 'approved' ? new Date().toISOString() : null
                })
            });
            
            console.log(`✅ Orden ${orderId} actualizada a ${orderStatus}`);
            
        } catch (error) {
            console.error('❌ Error actualizando orden:', error);
        }
    }

    // ==========================================
    // UTILIDADES
    // ==========================================

    /**
     * Mapear estados de pago de MercadoPago a nuestros estados
     */
    mapPaymentStatus(mpStatus) {
        const statusMap = {
            'approved': 'completed',
            'pending': 'pending',
            'in_process': 'processing',
            'rejected': 'failed',
            'cancelled': 'cancelled',
            'refunded': 'refunded'
        };
        
        return statusMap[mpStatus] || 'pending';
    }

    /**
     * Mostrar error de pago al usuario
     */
    showPaymentError(message) {
        const errorDiv = `
            <div class="payment-error-message" style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f44336;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 400px;
            ">
                <strong>Error en el pago:</strong><br>
                ${message}
                <button onclick="this.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    margin-left: 10px;
                    cursor: pointer;
                    float: right;
                ">&times;</button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorDiv);
        
        // Auto-remover después de 7 segundos
        setTimeout(() => {
            const element = document.querySelector('.payment-error-message');
            if (element) element.remove();
        }, 7000);
    }

    /**
     * Mostrar éxito de pago
     */
    showPaymentSuccess(message) {
        const successDiv = `
            <div class="payment-success-message" style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 400px;
            ">
                <strong>¡Pago exitoso!</strong><br>
                ${message}
                <button onclick="this.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    margin-left: 10px;
                    cursor: pointer;
                    float: right;
                ">&times;</button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', successDiv);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            const element = document.querySelector('.payment-success-message');
            if (element) element.remove();
        }, 5000);
    }

    // ==========================================
    // MÉTODOS PÚBLICOS PARA INTEGRACIÓN
    // ==========================================

    /**
     * Iniciar proceso de pago
     */
    async startPayment(orderData, method = 'pro') {
        try {
            console.log('🚀 Iniciando pago con MercadoPago:', method);
            
            if (method === 'pro') {
                return await this.createCheckoutPro(orderData);
            } else {
                throw new Error('Método de pago no válido');
            }
            
        } catch (error) {
            console.error('❌ Error iniciando pago:', error);
            this.showPaymentError(error.message);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Verificar si está inicializado
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Obtener configuración (sin claves sensibles)
     */
    getConfig() {
        return {
            publicKey: this.config.publicKey,
            environment: this.config.environment,
            successUrl: this.config.successUrl,
            failureUrl: this.config.failureUrl,
            pendingUrl: this.config.pendingUrl
        };
    }

    /**
     * Procesar retorno de MercadoPago
     */
    async processPaymentReturn(urlParams) {
        try {
            const paymentId = urlParams.get('payment_id');
            const status = urlParams.get('status');
            const orderId = urlParams.get('order_id');
            
            if (!paymentId || !orderId) {
                throw new Error('Parámetros de retorno inválidos');
            }
            
            console.log(`🔄 Procesando retorno de pago: ${paymentId}, estado: ${status}`);
            
            // Obtener información completa del pago
            const paymentInfo = await this.simulateGetPaymentInfo(paymentId);
            
            if (paymentInfo.success) {
                const payment = paymentInfo.payment;
                
                // Actualizar orden y transacción
                await this.updateOrderStatus(orderId, payment.status, payment);
                await this.updateTransactionRecord(paymentId, this.mapPaymentStatus(payment.status), payment);
                
                if (payment.status === 'approved') {
                    this.showPaymentSuccess('Tu pago ha sido procesado exitosamente');
                } else if (payment.status === 'pending') {
                    this.showPaymentSuccess('Tu pago está siendo procesado');
                } else {
                    this.showPaymentError('Hubo un problema con tu pago');
                }
                
                return {
                    success: true,
                    payment: payment,
                    order_id: orderId
                };
            }
            
        } catch (error) {
            console.error('❌ Error procesando retorno:', error);
            this.showPaymentError(error.message);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Crear instancia global
let mercadoPagoIntegration;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        mercadoPagoIntegration = new MercadoPagoIntegration();
        window.mercadoPagoIntegration = mercadoPagoIntegration;
        
        // Procesar retorno de MercadoPago si está en la URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment_id')) {
            mercadoPagoIntegration.processPaymentReturn(urlParams);
        }
    });
} else {
    mercadoPagoIntegration = new MercadoPagoIntegration();
    window.mercadoPagoIntegration = mercadoPagoIntegration;
    
    // Procesar retorno de MercadoPago si está en la URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_id')) {
        mercadoPagoIntegration.processPaymentReturn(urlParams);
    }
}

console.log('💳 MercadoPago Integration script cargado con claves de PRUEBA');
console.log('🔑 Cambiar claves en líneas 50-51 para producción');

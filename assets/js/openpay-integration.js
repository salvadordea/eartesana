/**
 * Openpay Integration - Frontend
 *
 * Clase para manejar pagos con Openpay (BBVA) desde el frontend
 * Soporta:
 * - Checkout Hosted (redirección para tarjetas)
 * - Pagos en tiendas (OXXO, 7-Eleven)
 * - Generación de deviceSessionId para anti-fraude
 *
 * Basado en la arquitectura de mercadopago-integration.js
 */

class OpenpayIntegration {
    constructor() {
        this.initialized = false;
        this.config = null;
        this.deviceSessionId = null;
        this.backendUrl = this.getBackendUrl();

        console.log('🏗️ OpenpayIntegration constructor llamado');
    }

    /**
     * Obtiene URL del backend según entorno
     */
    getBackendUrl() {
        // En producción, usar variable de entorno o dominio actual
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return window.BACKEND_CONFIG?.PAYMENT_URL || 'https://tu-app.railway.app';
        }

        // En desarrollo, usar localhost
        return 'http://localhost:3002';
    }

    /**
     * Inicializa el SDK de Openpay
     */
    async initializeSDK() {
        if (this.initialized) {
            console.log('✅ Openpay SDK ya inicializado');
            return true;
        }

        try {
            console.log('🔄 Inicializando Openpay SDK...');

            // 1. Cargar configuración desde backend
            const configResponse = await fetch(`${this.backendUrl}/api/openpay/config`);

            if (!configResponse.ok) {
                throw new Error(`Error obteniendo configuración: ${configResponse.status}`);
            }

            const configData = await configResponse.json();

            if (!configData.success || !configData.config) {
                throw new Error('Configuración de Openpay inválida');
            }

            this.config = configData.config;

            // 2. Cargar script de Openpay si no está cargado
            if (!window.OpenPay) {
                await this.loadOpenpayScript();
            }

            // 3. Inicializar OpenPay con credenciales públicas
            window.OpenPay.setId(this.config.merchantId);
            window.OpenPay.setApiKey(this.config.publicKey);
            window.OpenPay.setSandboxMode(this.config.sandbox);

            // 4. Generar Device Session ID para anti-fraude
            this.deviceSessionId = await this.generateDeviceSessionId();

            this.initialized = true;
            console.log('✅ Openpay SDK inicializado correctamente');
            console.log(`🧪 Modo: ${this.config.sandbox ? 'SANDBOX' : 'PRODUCCIÓN'}`);

            return true;

        } catch (error) {
            console.error('❌ Error inicializando Openpay SDK:', error);
            this.showError('No se pudo conectar con el sistema de pagos. Intenta más tarde.');
            return false;
        }
    }

    /**
     * Carga el script de Openpay dinámicamente
     */
    loadOpenpayScript() {
        return new Promise((resolve, reject) => {
            // Verificar si ya existe
            if (document.querySelector('script[src*="openpay"]')) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = this.config.sandbox
                ? 'https://resources.openpay.mx/openpay.v1.min.js'
                : 'https://resources.openpay.mx/openpay.v1.min.js';

            script.onload = () => {
                console.log('✅ Script de Openpay cargado');
                resolve();
            };

            script.onerror = () => {
                reject(new Error('Error cargando script de Openpay'));
            };

            document.head.appendChild(script);

            // También cargar script de device fingerprinting
            const deviceScript = document.createElement('script');
            deviceScript.type = 'text/javascript';
            deviceScript.src = this.config.sandbox
                ? 'https://resources.openpay.mx/openpay-data.v1.min.js'
                : 'https://resources.openpay.mx/openpay-data.v1.min.js';

            document.head.appendChild(deviceScript);
        });
    }

    /**
     * Genera Device Session ID para anti-fraude
     */
    async generateDeviceSessionId() {
        // Generar ID único basado en timestamp y random
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const sessionId = `${timestamp}-${random}`;

        // Si existe OpenPay.deviceData, usarlo para recolectar datos del dispositivo
        if (window.OpenPay && window.OpenPay.deviceData) {
            try {
                window.OpenPay.deviceData.setup('checkout-form', sessionId);
                console.log('✅ Device fingerprint configurado:', sessionId);
            } catch (e) {
                console.warn('⚠️ No se pudo configurar device fingerprint:', e);
            }
        }

        return sessionId;
    }

    /**
     * Punto de entrada principal - Inicia proceso de pago
     * @param {Object} orderData - Datos de la orden
     */
    async startPayment(orderData) {
        try {
            console.log('🚀 Iniciando pago con Openpay...', orderData);

            // Validar datos requeridos
            if (!orderData.order_id || !orderData.amount || !orderData.customer || !orderData.method) {
                throw new Error('Datos de orden incompletos');
            }

            // Asegurar que SDK está inicializado
            if (!this.initialized) {
                const initialized = await this.initializeSDK();
                if (!initialized) {
                    throw new Error('No se pudo inicializar el sistema de pagos');
                }
            }

            // Mostrar loading
            this.showLoading('Procesando pago...');

            // Crear cargo según método
            let result;
            if (orderData.method === 'card') {
                result = await this.createHostedCheckout(orderData);
            } else if (orderData.method === 'store') {
                result = await this.createStorePayment(orderData);
            } else {
                throw new Error('Método de pago no soportado: ' + orderData.method);
            }

            this.hideLoading();
            return result;

        } catch (error) {
            console.error('❌ Error en startPayment:', error);
            this.hideLoading();

            return {
                success: false,
                message: error.message || 'Error procesando el pago'
            };
        }
    }

    /**
     * Crea un cargo con Checkout Hosted (para tarjetas)
     */
    async createHostedCheckout(orderData) {
        try {
            const payload = {
                order_id: orderData.order_id,
                amount: orderData.amount,
                customer: {
                    name: orderData.customer.name,
                    email: orderData.customer.email,
                    phone: orderData.customer.phone || '5555555555'
                },
                method: 'card',
                device_session_id: this.deviceSessionId
            };

            console.log('📤 Creando cargo (tarjeta) en backend...');

            const response = await fetch(`${this.backendUrl}/api/openpay/charge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error creando cargo');
            }

            console.log('✅ Cargo creado, redirigiendo a Openpay...');

            return {
                success: true,
                redirect_url: data.redirect_url,
                transaction_id: data.transaction_id
            };

        } catch (error) {
            console.error('❌ Error en createHostedCheckout:', error);
            throw error;
        }
    }

    /**
     * Crea un cargo para pago en tienda (OXXO, 7-Eleven)
     */
    async createStorePayment(orderData) {
        try {
            const payload = {
                order_id: orderData.order_id,
                amount: orderData.amount,
                customer: {
                    name: orderData.customer.name,
                    email: orderData.customer.email,
                    phone: orderData.customer.phone || '5555555555'
                },
                method: 'store'
            };

            console.log('📤 Creando cargo (tienda) en backend...');

            const response = await fetch(`${this.backendUrl}/api/openpay/charge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error creando cargo');
            }

            console.log('✅ Referencia de pago generada');

            return {
                success: true,
                redirect_url: data.redirect_url,
                transaction_id: data.transaction_id,
                payment_reference: data.payment_reference,
                barcode_url: data.barcode_url,
                due_date: data.due_date
            };

        } catch (error) {
            console.error('❌ Error en createStorePayment:', error);
            throw error;
        }
    }

    /**
     * Procesa retorno desde Openpay (callback)
     * Se llama desde checkout-success.html o checkout-failure.html
     */
    async processPaymentReturn() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const orderId = urlParams.get('id') || urlParams.get('order_id');
            const transactionId = urlParams.get('transaction_id');

            if (!orderId) {
                throw new Error('No se encontró ID de orden');
            }

            console.log('🔄 Procesando retorno de pago:', { orderId, transactionId });

            // Si hay transaction_id, verificar estado
            if (transactionId) {
                const verification = await this.verifyTransaction(transactionId);
                return {
                    success: true,
                    order_id: orderId,
                    transaction: verification.transaction
                };
            }

            return {
                success: true,
                order_id: orderId
            };

        } catch (error) {
            console.error('❌ Error procesando retorno:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verifica el estado de una transacción
     */
    async verifyTransaction(transactionId) {
        try {
            console.log('🔍 Verificando transacción:', transactionId);

            const response = await fetch(`${this.backendUrl}/api/openpay/verify/${transactionId}`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error verificando transacción');
            }

            console.log('✅ Estado de transacción:', data.transaction.status);

            return data;

        } catch (error) {
            console.error('❌ Error verificando transacción:', error);
            throw error;
        }
    }

    /**
     * Muestra mensaje de error al usuario
     */
    showError(message) {
        // Buscar contenedor de errores existente
        let errorContainer = document.getElementById('payment-error');

        if (!errorContainer) {
            // Crear contenedor si no existe
            errorContainer = document.createElement('div');
            errorContainer.id = 'payment-error';
            errorContainer.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #ff4444;
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 10000;
                max-width: 90%;
                text-align: center;
                font-family: 'Lato', sans-serif;
            `;
            document.body.appendChild(errorContainer);
        }

        errorContainer.innerHTML = `
            <strong>⚠️ Error</strong><br>
            ${message}
        `;
        errorContainer.style.display = 'block';

        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }

    /**
     * Muestra indicador de carga
     */
    showLoading(message = 'Procesando...') {
        let loader = document.getElementById('payment-loader');

        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'payment-loader';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                font-family: 'Lato', sans-serif;
            `;
            document.body.appendChild(loader);
        }

        loader.innerHTML = `
            <div style="
                background: white;
                padding: 30px 40px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            ">
                <div style="
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #8B4513;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    margin: 0 auto 20px;
                    animation: spin 1s linear infinite;
                "></div>
                <p style="margin: 0; font-size: 16px; color: #333;">${message}</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        loader.style.display = 'flex';
    }

    /**
     * Oculta indicador de carga
     */
    hideLoading() {
        const loader = document.getElementById('payment-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    /**
     * Obtiene información de la orden desde URL params
     */
    getOrderFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            order_id: urlParams.get('order_id') || urlParams.get('id'),
            transaction_id: urlParams.get('transaction_id')
        };
    }
}

// =====================================================
// INICIALIZACIÓN AUTOMÁTICA
// =====================================================

// Crear instancia global
let openpayIntegration = null;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        openpayIntegration = new OpenpayIntegration();

        // Auto-inicializar SDK en página de checkout
        if (window.location.pathname.includes('checkout')) {
            await openpayIntegration.initializeSDK();
        }

        console.log('✅ OpenpayIntegration disponible globalmente');
    });
} else {
    openpayIntegration = new OpenpayIntegration();

    // Auto-inicializar SDK en página de checkout
    if (window.location.pathname.includes('checkout')) {
        openpayIntegration.initializeSDK();
    }

    console.log('✅ OpenpayIntegration disponible globalmente');
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.openpayIntegration = openpayIntegration;
    window.OpenpayIntegration = OpenpayIntegration;
}

// Compatibilidad con módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenpayIntegration;
}

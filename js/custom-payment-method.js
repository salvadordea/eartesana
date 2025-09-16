/**
 * SISTEMA DE PAGO "A CONVENIR" - ESTUDIO ARTESANA
 * ==============================================
 * Permite un método de pago personalizado donde el cliente puede coordinar
 * el pago directamente con el propietario (transferencia, efectivo, etc.)
 * 
 * Funcionalidades:
 * - Crear pedido con estado "pendiente de coordinación"
 * - Enviar notificación al propietario
 * - Tracking del pedido personalizado
 * - Actualización manual del estado de pago
 */

class CustomPaymentMethod {
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
        
        // Configuración del sistema
        this.config = {
            // Información de contacto del propietario
            ownerContact: {
                name: 'Estudio Artesana',
                email: 'ventas@estudioartesana.com',
                phone: '+52 123 456 7890',
                whatsapp: '+52 123 456 7890'
            },
            
            // Métodos de pago disponibles para coordinar
            availablePaymentMethods: [
                'Transferencia bancaria',
                'Depósito bancario',
                'PayPal',
                'Efectivo (entrega en persona)',
                'Tarjeta (por teléfono)',
                'Otro (especificar)'
            ],
            
            // URLs de redirección
            successUrl: `${window.location.origin}/custom-payment-success.html`,
            
            // Configuración de notificaciones
            notifications: {
                sendToOwner: true,
                sendToCustomer: true
            }
        };
        
        console.log('🤝 Custom Payment Method inicializado');
    }

    // ==========================================
    // CREACIÓN DE PEDIDO PERSONALIZADO
    // ==========================================

    /**
     * Procesar pago "a convenir" - crear pedido pendiente
     */
    async processCustomPayment(orderData, paymentPreferences = {}) {
        try {
            console.log('🤝 Procesando pago a convenir para orden:', orderData.order_id);
            
            // Crear registro de transacción personalizada
            const transaction = await this.createCustomTransaction(orderData, paymentPreferences);
            
            if (!transaction.success) {
                throw new Error(transaction.message);
            }
            
            // Actualizar estado de la orden
            await this.updateOrderForCustomPayment(orderData.order_id);
            
            // Enviar notificaciones
            await this.sendCustomPaymentNotifications(orderData, transaction.transaction, paymentPreferences);
            
            // Redirigir a página de éxito personalizada
            const successUrl = `${this.config.successUrl}?order_id=${orderData.order_id}&transaction_id=${transaction.transaction.id}`;
            
            return {
                success: true,
                message: 'Pedido creado exitosamente. Te contactaremos pronto para coordinar el pago.',
                order_id: orderData.order_id,
                transaction_id: transaction.transaction.id,
                redirect_url: successUrl,
                contact_info: this.config.ownerContact
            };
            
        } catch (error) {
            console.error('❌ Error procesando pago personalizado:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Crear registro de transacción personalizada
     */
    async createCustomTransaction(orderData, paymentPreferences) {
        try {
            // Preparar datos de la transacción personalizada
            const transactionData = {
                order_id: orderData.order_id,
                transaction_id: `CUSTOM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                payment_method: 'custom_arrangement',
                amount: orderData.total_amount,
                currency: 'MXN',
                status: 'pending',
                gateway_response: {
                    type: 'custom_payment',
                    customer_preferences: paymentPreferences,
                    created_at: new Date().toISOString(),
                    requires_coordination: true,
                    contact_info: this.config.ownerContact
                },
                created_at: new Date().toISOString()
            };
            
            // Guardar en base de datos
            const response = await fetch(`${this.baseUrl}/rest/v1/payment_transactions`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(transactionData)
            });
            
            if (!response.ok) {
                throw new Error(`Error creando transacción: ${response.status}`);
            }
            
            const createdTransactions = await response.json();
            
            console.log('✅ Transacción personalizada creada');
            
            return {
                success: true,
                transaction: createdTransactions[0]
            };
            
        } catch (error) {
            console.error('❌ Error creando transacción personalizada:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Actualizar orden para pago personalizado
     */
    async updateOrderForCustomPayment(orderId) {
        try {
            const updateData = {
                status: 'pending', // Estado especial para coordinación
                payment_status: 'pending',
                admin_notes: 'PAGO A CONVENIR - Requiere coordinación manual con el cliente'
            };
            
            const response = await fetch(`${this.baseUrl}/rest/v1/orders?id=eq.${orderId}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify(updateData)
            });
            
            if (response.ok) {
                console.log(`✅ Orden ${orderId} actualizada para pago personalizado`);
            }
            
        } catch (error) {
            console.error('❌ Error actualizando orden:', error);
        }
    }

    // ==========================================
    // SISTEMA DE NOTIFICACIONES
    // ==========================================

    /**
     * Enviar notificaciones sobre el pago personalizado
     */
    async sendCustomPaymentNotifications(orderData, transaction, paymentPreferences) {
        try {
            console.log('📧 Enviando notificaciones de pago personalizado...');
            
            // Notificar al propietario
            if (this.config.notifications.sendToOwner) {
                await this.sendOwnerNotification(orderData, transaction, paymentPreferences);
            }
            
            // Notificar al cliente
            if (this.config.notifications.sendToCustomer) {
                await this.sendCustomerNotification(orderData, transaction);
            }
            
        } catch (error) {
            console.error('❌ Error enviando notificaciones:', error);
        }
    }

    /**
     * Enviar notificación al propietario
     */
    async sendOwnerNotification(orderData, transaction, paymentPreferences) {
        try {
            const emailData = {
                to: this.config.ownerContact.email,
                subject: `🛒 Nuevo pedido para coordinación - ${orderData.order_number}`,
                template: 'custom_payment_owner_notification',
                data: {
                    order_number: orderData.order_number,
                    customer_info: orderData.customer_info,
                    shipping_address: orderData.shipping_address,
                    items: orderData.items,
                    total_amount: orderData.total_amount,
                    payment_preferences: paymentPreferences,
                    transaction_id: transaction.id,
                    order_created: new Date().toISOString()
                }
            };
            
            // Simular envío de email al propietario
            const emailSent = await this.simulateEmailSend(emailData);
            
            if (emailSent) {
                console.log('✅ Notificación enviada al propietario');
            }
            
        } catch (error) {
            console.error('❌ Error enviando notificación al propietario:', error);
        }
    }

    /**
     * Enviar notificación al cliente
     */
    async sendCustomerNotification(orderData, transaction) {
        try {
            const emailData = {
                to: orderData.customer_info.email,
                subject: `📦 Confirmación de pedido - ${orderData.order_number}`,
                template: 'custom_payment_customer_notification',
                data: {
                    customer_name: orderData.customer_info.name,
                    order_number: orderData.order_number,
                    items: orderData.items,
                    total_amount: orderData.total_amount,
                    contact_info: this.config.ownerContact,
                    transaction_id: transaction.id,
                    next_steps: [
                        'Te contactaremos en las próximas 24 horas',
                        'Coordinaremos el método de pago más conveniente para ti',
                        'Una vez confirmado el pago, prepararemos tu pedido'
                    ]
                }
            };
            
            // Simular envío de email al cliente
            const emailSent = await this.simulateEmailSend(emailData);
            
            if (emailSent) {
                console.log('✅ Notificación enviada al cliente');
            }
            
        } catch (error) {
            console.error('❌ Error enviando notificación al cliente:', error);
        }
    }

    /**
     * Simular envío de email (reemplazar con servicio real)
     */
    async simulateEmailSend(emailData) {
        try {
            console.log('📨 EMAIL SIMULADO:', {
                to: emailData.to,
                subject: emailData.subject,
                template: emailData.template,
                data: emailData.data
            });
            
            // Simular delay
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return true;
            
        } catch (error) {
            console.error('❌ Error simulando email:', error);
            return false;
        }
    }

    // ==========================================
    // GESTIÓN DE ESTADOS Y SEGUIMIENTO
    // ==========================================

    /**
     * Actualizar estado de pago personalizado (para administradores)
     */
    async updateCustomPaymentStatus(transactionId, newStatus, adminNotes = '') {
        try {
            console.log(`🔄 Actualizando pago personalizado ${transactionId} a ${newStatus}`);
            
            // Mapear estados personalizados
            const statusMap = {
                'payment_coordinated': 'processing',
                'payment_received': 'completed',
                'payment_failed': 'failed',
                'payment_cancelled': 'cancelled'
            };
            
            const mappedStatus = statusMap[newStatus] || newStatus;
            
            // Actualizar transacción
            const transactionUpdate = {
                status: mappedStatus,
                processed_at: new Date().toISOString()
            };
            
            if (mappedStatus === 'completed') {
                transactionUpdate.completed_at = new Date().toISOString();
            } else if (mappedStatus === 'failed') {
                transactionUpdate.failed_at = new Date().toISOString();
            }
            
            if (adminNotes) {
                transactionUpdate.gateway_response = {
                    ...transactionUpdate.gateway_response,
                    admin_notes: adminNotes,
                    status_updated_at: new Date().toISOString()
                };
            }
            
            await fetch(`${this.baseUrl}/rest/v1/payment_transactions?transaction_id=eq.${transactionId}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify(transactionUpdate)
            });
            
            // Actualizar orden correspondiente
            await this.updateOrderStatusFromPayment(transactionId, mappedStatus);
            
            console.log(`✅ Pago personalizado ${transactionId} actualizado`);
            
            return {
                success: true,
                message: `Estado actualizado a ${newStatus}`,
                status: mappedStatus
            };
            
        } catch (error) {
            console.error('❌ Error actualizando estado de pago:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Actualizar orden basado en el estado del pago
     */
    async updateOrderStatusFromPayment(transactionId, paymentStatus) {
        try {
            // Obtener información de la transacción
            const transactionResponse = await fetch(
                `${this.baseUrl}/rest/v1/payment_transactions?transaction_id=eq.${transactionId}&select=*`,
                { headers: this.headers }
            );
            
            if (!transactionResponse.ok) return;
            
            const transactions = await transactionResponse.json();
            if (!transactions || transactions.length === 0) return;
            
            const transaction = transactions[0];
            const orderId = transaction.order_id;
            
            // Mapear estado de pago a estado de orden
            let orderStatus = 'pending';
            let orderPaymentStatus = 'pending';
            
            switch (paymentStatus) {
                case 'completed':
                    orderStatus = 'confirmed';
                    orderPaymentStatus = 'paid';
                    break;
                case 'processing':
                    orderStatus = 'pending';
                    orderPaymentStatus = 'processing';
                    break;
                case 'failed':
                case 'cancelled':
                    orderStatus = 'cancelled';
                    orderPaymentStatus = 'failed';
                    break;
            }
            
            // Actualizar orden
            const orderUpdate = {
                status: orderStatus,
                payment_status: orderPaymentStatus
            };
            
            if (paymentStatus === 'completed') {
                orderUpdate.confirmed_at = new Date().toISOString();
            }
            
            await fetch(`${this.baseUrl}/rest/v1/orders?id=eq.${orderId}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify(orderUpdate)
            });
            
            console.log(`✅ Orden ${orderId} actualizada por cambio de pago`);
            
        } catch (error) {
            console.error('❌ Error actualizando orden por pago:', error);
        }
    }

    // ==========================================
    // INTERFAZ DE USUARIO
    // ==========================================

    /**
     * Mostrar formulario de preferencias de pago
     */
    showPaymentPreferencesForm(orderData) {
        const formHtml = `
            <div id="custom-payment-form" class="custom-payment-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div class="custom-payment-modal" style="
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                ">
                    <h3 style="margin-top: 0; color: #333;">
                        🤝 Coordinación de Pago
                    </h3>
                    
                    <p style="color: #666; margin-bottom: 20px;">
                        Te contactaremos para coordinar el método de pago más conveniente para ti.
                    </p>
                    
                    <form id="payment-preferences-form">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
                                Método de pago preferido:
                            </label>
                            <select name="preferred_payment_method" required style="
                                width: 100%;
                                padding: 10px;
                                border: 1px solid #ddd;
                                border-radius: 6px;
                                font-size: 14px;
                            ">
                                <option value="">Selecciona una opción</option>
                                ${this.config.availablePaymentMethods.map(method => 
                                    `<option value="${method}">${method}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
                                Mejor horario para contactarte:
                            </label>
                            <select name="preferred_contact_time" style="
                                width: 100%;
                                padding: 10px;
                                border: 1px solid #ddd;
                                border-radius: 6px;
                                font-size: 14px;
                            ">
                                <option value="morning">Mañana (9:00 - 12:00)</option>
                                <option value="afternoon">Tarde (12:00 - 18:00)</option>
                                <option value="evening">Noche (18:00 - 21:00)</option>
                                <option value="anytime">Cualquier horario</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
                                Método de contacto preferido:
                            </label>
                            <select name="preferred_contact_method" style="
                                width: 100%;
                                padding: 10px;
                                border: 1px solid #ddd;
                                border-radius: 6px;
                                font-size: 14px;
                            ">
                                <option value="whatsapp">WhatsApp</option>
                                <option value="phone">Llamada telefónica</option>
                                <option value="email">Correo electrónico</option>
                            </select>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">
                                Comentarios adicionales (opcional):
                            </label>
                            <textarea name="additional_comments" placeholder="Cualquier información adicional que nos ayude a coordinar mejor el pago..." style="
                                width: 100%;
                                padding: 10px;
                                border: 1px solid #ddd;
                                border-radius: 6px;
                                font-size: 14px;
                                height: 80px;
                                resize: vertical;
                                font-family: inherit;
                            "></textarea>
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" onclick="this.closest('.custom-payment-overlay').remove()" style="
                                padding: 10px 20px;
                                border: 1px solid #ddd;
                                background: white;
                                color: #666;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 14px;
                            ">
                                Cancelar
                            </button>
                            <button type="submit" style="
                                padding: 10px 20px;
                                border: none;
                                background: #4CAF50;
                                color: white;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 14px;
                                font-weight: bold;
                            ">
                                Confirmar Pedido
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', formHtml);
        
        // Configurar envío del formulario
        document.getElementById('payment-preferences-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const preferences = {
                preferred_payment_method: formData.get('preferred_payment_method'),
                preferred_contact_time: formData.get('preferred_contact_time'),
                preferred_contact_method: formData.get('preferred_contact_method'),
                additional_comments: formData.get('additional_comments')
            };
            
            // Procesar pago personalizado
            const result = await this.processCustomPayment(orderData, preferences);
            
            if (result.success) {
                // Remover formulario
                document.getElementById('custom-payment-form').remove();
                
                // Mostrar mensaje de éxito
                this.showSuccessMessage(result);
                
                // Redirigir después de un momento
                setTimeout(() => {
                    window.location.href = result.redirect_url;
                }, 3000);
            } else {
                this.showErrorMessage(result.message);
            }
        });
    }

    /**
     * Mostrar mensaje de éxito
     */
    showSuccessMessage(result) {
        const messageDiv = `
            <div class="custom-payment-success" style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 20px;
                border-radius: 8px;
                z-index: 10001;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 400px;
            ">
                <strong>¡Pedido confirmado!</strong><br>
                ${result.message}<br><br>
                <small>
                    <strong>Te contactaremos a:</strong><br>
                    📧 ${result.contact_info.email}<br>
                    📱 ${result.contact_info.phone}
                </small>
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
        
        document.body.insertAdjacentHTML('beforeend', messageDiv);
        
        // Auto-remover después de 8 segundos
        setTimeout(() => {
            const element = document.querySelector('.custom-payment-success');
            if (element) element.remove();
        }, 8000);
    }

    /**
     * Mostrar mensaje de error
     */
    showErrorMessage(message) {
        const errorDiv = `
            <div class="custom-payment-error" style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f44336;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 10001;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 400px;
            ">
                <strong>Error:</strong><br>
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
            const element = document.querySelector('.custom-payment-error');
            if (element) element.remove();
        }, 7000);
    }

    // ==========================================
    // MÉTODOS PÚBLICOS
    // ==========================================

    /**
     * Iniciar proceso de pago personalizado
     */
    async startCustomPayment(orderData) {
        try {
            console.log('🤝 Iniciando pago personalizado para:', orderData.order_id);
            
            // Mostrar formulario de preferencias
            this.showPaymentPreferencesForm(orderData);
            
            return {
                success: true,
                message: 'Formulario de coordinación mostrado'
            };
            
        } catch (error) {
            console.error('❌ Error iniciando pago personalizado:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Obtener información de contacto
     */
    getContactInfo() {
        return this.config.ownerContact;
    }

    /**
     * Obtener métodos de pago disponibles
     */
    getAvailablePaymentMethods() {
        return this.config.availablePaymentMethods;
    }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Crear instancia global
let customPaymentMethod;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        customPaymentMethod = new CustomPaymentMethod();
        window.customPaymentMethod = customPaymentMethod;
    });
} else {
    customPaymentMethod = new CustomPaymentMethod();
    window.customPaymentMethod = customPaymentMethod;
}

console.log('🤝 Custom Payment Method script cargado');

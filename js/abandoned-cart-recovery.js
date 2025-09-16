/**
 * SISTEMA DE RECUPERACIÓN DE CARRITOS ABANDONADOS - ESTUDIO ARTESANA
 * =================================================================
 * Detecta carritos inactivos y envía emails de recuperación con cupones
 * Funcionalidades:
 * - Detección automática de carritos abandonados
 * - Generación de cupones de recuperación
 * - Sistema de emails de seguimiento
 * - Tracking de conversiones
 */

class AbandonedCartRecovery {
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
        
        // Configuración de recovery
        this.config = {
            abandonmentThreshold: 2 * 60 * 60 * 1000, // 2 horas en ms
            maxRecoveryAttempts: 3,
            recoveryEmailIntervals: [
                1 * 60 * 60 * 1000,  // 1 hora después del abandono
                24 * 60 * 60 * 1000, // 24 horas después
                72 * 60 * 60 * 1000  // 72 horas después
            ],
            recoveryDiscountPercentage: 10 // 10% de descuento para recovery
        };
        
        console.log('📧 AbandonedCartRecovery inicializado');
    }

    // ==========================================
    // DETECCIÓN DE CARRITOS ABANDONADOS
    // ==========================================

    /**
     * Ejecutar proceso de detección de carritos abandonados
     * Esta función debería ejecutarse periódicamente (por ejemplo, cada hora)
     */
    async detectAbandonedCarts() {
        try {
            console.log('🔍 Detectando carritos abandonados...');
            
            // Marcar carritos como abandonados
            await this.markAbandonedCarts();
            
            // Crear registros de recuperación para carritos recién abandonados
            const newAbandonedCarts = await this.createRecoveryRecords();
            
            // Procesar emails de recuperación pendientes
            await this.processRecoveryEmails();
            
            console.log(`✅ Proceso completado. ${newAbandonedCarts.length} carritos abandonados detectados`);
            
            return {
                success: true,
                newAbandonedCarts: newAbandonedCarts.length,
                message: 'Proceso de detección completado'
            };
            
        } catch (error) {
            console.error('❌ Error en detección de carritos abandonados:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Marcar carritos como abandonados basado en última actividad
     */
    async markAbandonedCarts() {
        try {
            const thresholdTime = new Date(Date.now() - this.config.abandonmentThreshold);
            
            // Usar la función SQL que ya creamos en el esquema
            const response = await fetch(`${this.baseUrl}/rest/v1/rpc/mark_abandoned_carts`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({})
            });
            
            if (!response.ok) {
                throw new Error(`Error marcando carritos abandonados: ${response.status}`);
            }
            
            console.log('✅ Carritos marcados como abandonados');
            
        } catch (error) {
            console.error('❌ Error marcando carritos como abandonados:', error);
            throw error;
        }
    }

    /**
     * Crear registros de recuperación para carritos recién abandonados
     */
    async createRecoveryRecords() {
        try {
            // Buscar carritos abandonados sin registro de recuperación
            const response = await fetch(`${this.baseUrl}/rest/v1/carts?status=eq.abandoned&select=*,user_profiles(email,phone)`, {
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error(`Error obteniendo carritos abandonados: ${response.status}`);
            }
            
            const abandonedCarts = await response.json();
            const newRecords = [];
            
            for (const cart of abandonedCarts) {
                // Verificar si ya existe registro de recuperación
                const existingResponse = await fetch(
                    `${this.baseUrl}/rest/v1/abandoned_cart_recovery?cart_id=eq.${cart.id}`,
                    { headers: this.headers }
                );
                
                const existing = await existingResponse.json();
                
                if (!existing || existing.length === 0) {
                    // Determinar email y teléfono
                    const email = cart.guest_email || cart.user_profiles?.email;
                    const phone = cart.guest_phone || cart.user_profiles?.phone;
                    
                    if (email) {
                        // Crear cupón de recuperación
                        const recoveryCoupon = await this.createRecoveryCoupon(email);
                        
                        // Crear registro de recuperación
                        const recoveryRecord = {
                            cart_id: cart.id,
                            email: email,
                            phone: phone,
                            recovery_coupon_id: recoveryCoupon.id,
                            abandoned_at: cart.abandoned_at || new Date().toISOString(),
                            recovery_status: 'pending'
                        };
                        
                        const createResponse = await fetch(`${this.baseUrl}/rest/v1/abandoned_cart_recovery`, {
                            method: 'POST',
                            headers: this.headers,
                            body: JSON.stringify(recoveryRecord)
                        });
                        
                        if (createResponse.ok) {
                            newRecords.push({
                                ...recoveryRecord,
                                cart: cart,
                                coupon: recoveryCoupon
                            });
                        }
                    }
                }
            }
            
            console.log(`📝 ${newRecords.length} nuevos registros de recuperación creados`);
            return newRecords;
            
        } catch (error) {
            console.error('❌ Error creando registros de recuperación:', error);
            throw error;
        }
    }

    /**
     * Crear cupón de recuperación personalizado
     */
    async createRecoveryCoupon(email) {
        try {
            const couponCode = `RECOVER${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
            
            const coupon = {
                code: couponCode,
                name: 'Cupón de Recuperación de Carrito',
                description: `Descuento especial para recuperar tu carrito abandonado - ${email}`,
                type: 'percentage',
                value: this.config.recoveryDiscountPercentage,
                usage_limit: 1,
                usage_limit_per_customer: 1,
                minimum_amount: 200, // Mínimo $200 MXN
                is_active: true,
                starts_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
            };
            
            const response = await fetch(`${this.baseUrl}/rest/v1/coupons`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(coupon)
            });
            
            if (!response.ok) {
                throw new Error(`Error creando cupón: ${response.status}`);
            }
            
            const createdCoupons = await response.json();
            return createdCoupons[0];
            
        } catch (error) {
            console.error('❌ Error creando cupón de recuperación:', error);
            throw error;
        }
    }

    // ==========================================
    // PROCESAMIENTO DE EMAILS
    // ==========================================

    /**
     * Procesar envío de emails de recuperación
     */
    async processRecoveryEmails() {
        try {
            console.log('📨 Procesando emails de recuperación...');
            
            // Obtener registros pendientes de envío
            const response = await fetch(`${this.baseUrl}/rest/v1/abandoned_cart_recovery?recovery_status=eq.pending&select=*,carts(*,cart_items(*)),coupons(*)`, {
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error(`Error obteniendo registros de recuperación: ${response.status}`);
            }
            
            const recoveryRecords = await response.json();
            let emailsSent = 0;
            
            for (const record of recoveryRecords) {
                const shouldSendEmail = this.shouldSendRecoveryEmail(record);
                
                if (shouldSendEmail) {
                    const emailSent = await this.sendRecoveryEmail(record);
                    
                    if (emailSent.success) {
                        await this.updateRecoveryRecord(record.id, {
                            emails_sent: record.emails_sent + 1,
                            last_email_sent_at: new Date().toISOString(),
                            recovery_status: record.emails_sent >= this.config.maxRecoveryAttempts - 1 ? 'email_sent' : 'pending'
                        });
                        emailsSent++;
                    }
                }
            }
            
            console.log(`📧 ${emailsSent} emails de recuperación enviados`);
            
        } catch (error) {
            console.error('❌ Error procesando emails de recuperación:', error);
            throw error;
        }
    }

    /**
     * Determinar si se debe enviar email de recuperación
     */
    shouldSendRecoveryEmail(record) {
        const now = new Date();
        const abandonedAt = new Date(record.abandoned_at);
        const lastEmailSent = record.last_email_sent_at ? new Date(record.last_email_sent_at) : null;
        
        // No enviar si ya se alcanzó el máximo de intentos
        if (record.emails_sent >= this.config.maxRecoveryAttempts) {
            return false;
        }
        
        // Si nunca se ha enviado email, enviar después del primer intervalo
        if (!lastEmailSent) {
            const timeSinceAbandoned = now - abandonedAt;
            return timeSinceAbandoned >= this.config.recoveryEmailIntervals[0];
        }
        
        // Para emails subsecuentes, verificar intervalos
        const emailIndex = record.emails_sent;
        if (emailIndex < this.config.recoveryEmailIntervals.length) {
            const timeSinceLastEmail = now - lastEmailSent;
            const requiredInterval = this.config.recoveryEmailIntervals[emailIndex] - this.config.recoveryEmailIntervals[emailIndex - 1];
            return timeSinceLastEmail >= requiredInterval;
        }
        
        return false;
    }

    /**
     * Enviar email de recuperación
     */
    async sendRecoveryEmail(record) {
        try {
            console.log(`📧 Enviando email de recuperación a ${record.email}`);
            
            // Generar enlace de recuperación
            const recoveryLink = this.generateRecoveryLink(record);
            
            // Preparar datos del email
            const emailData = {
                to: record.email,
                subject: this.getEmailSubject(record.emails_sent),
                template: 'abandoned_cart_recovery',
                data: {
                    customer_email: record.email,
                    cart_items: record.carts?.cart_items || [],
                    coupon_code: record.coupons?.code,
                    discount_percentage: record.coupons?.value,
                    recovery_link: recoveryLink,
                    email_sequence: record.emails_sent + 1
                }
            };
            
            // En un entorno real, aquí integrarías con un servicio de email como:
            // - SendGrid
            // - Mailgun  
            // - Amazon SES
            // - Resend
            
            // Por ahora, simular el envío
            const emailSent = await this.simulateEmailSend(emailData);
            
            if (emailSent) {
                console.log(`✅ Email enviado exitosamente a ${record.email}`);
                return { success: true };
            } else {
                throw new Error('Error simulado en envío de email');
            }
            
        } catch (error) {
            console.error(`❌ Error enviando email a ${record.email}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Simular envío de email (reemplazar con servicio real)
     */
    async simulateEmailSend(emailData) {
        // En desarrollo, solo logear el contenido del email
        console.log('📨 EMAIL SIMULADO:', {
            to: emailData.to,
            subject: emailData.subject,
            coupon: emailData.data.coupon_code,
            items: emailData.data.cart_items.length,
            link: emailData.data.recovery_link
        });
        
        // Simular delay de envío
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // En desarrollo siempre "exitoso"
        return true;
    }

    /**
     * Generar enlace de recuperación del carrito
     */
    generateRecoveryLink(record) {
        const baseUrl = window.location.origin;
        const params = new URLSearchParams({
            cart_recovery: record.cart_id,
            token: record.id,
            coupon: record.coupons?.code || ''
        });
        
        return `${baseUrl}/tienda.html?${params.toString()}`;
    }

    /**
     * Obtener asunto del email según secuencia
     */
    getEmailSubject(emailSequence) {
        const subjects = [
            '🛒 ¿Olvidaste algo? Tu carrito te está esperando',
            '💝 ¡Oferta especial! Completa tu compra con descuento',
            '⏰ Última oportunidad - Tu carrito expira pronto'
        ];
        
        return subjects[emailSequence] || subjects[0];
    }

    /**
     * Actualizar registro de recuperación
     */
    async updateRecoveryRecord(recordId, updates) {
        try {
            const response = await fetch(`${this.baseUrl}/rest/v1/abandoned_cart_recovery?id=eq.${recordId}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) {
                throw new Error(`Error actualizando registro: ${response.status}`);
            }
            
        } catch (error) {
            console.error('❌ Error actualizando registro de recuperación:', error);
            throw error;
        }
    }

    // ==========================================
    // RECUPERACIÓN DE CARRITOS
    // ==========================================

    /**
     * Procesar recuperación de carrito desde enlace de email
     */
    async processCartRecovery(cartId, token, couponCode = null) {
        try {
            console.log(`🔄 Procesando recuperación de carrito ${cartId}`);
            
            // Verificar token de recuperación
            const recoveryResponse = await fetch(
                `${this.baseUrl}/rest/v1/abandoned_cart_recovery?id=eq.${token}&cart_id=eq.${cartId}`,
                { headers: this.headers }
            );
            
            if (!recoveryResponse.ok) {
                throw new Error('Token de recuperación inválido');
            }
            
            const recoveryRecords = await recoveryResponse.json();
            
            if (!recoveryRecords || recoveryRecords.length === 0) {
                throw new Error('Registro de recuperación no encontrado');
            }
            
            const recoveryRecord = recoveryRecords[0];
            
            // Verificar si no ha expirado
            const expiryDate = new Date(recoveryRecord.expires_at);
            if (expiryDate < new Date()) {
                throw new Error('El enlace de recuperación ha expirado');
            }
            
            // Obtener carrito abandonado
            const cartResponse = await fetch(
                `${this.baseUrl}/rest/v1/carts?id=eq.${cartId}&select=*,cart_items(*)`,
                { headers: this.headers }
            );
            
            if (!cartResponse.ok) {
                throw new Error('Carrito no encontrado');
            }
            
            const carts = await cartResponse.json();
            
            if (!carts || carts.length === 0) {
                throw new Error('Carrito no encontrado');
            }
            
            const cart = carts[0];
            
            // Restaurar carrito en el cliente (si CartManager está disponible)
            if (window.cartManager) {
                await this.restoreCartInClient(cart);
            }
            
            // Aplicar cupón automáticamente si se proporcionó
            if (couponCode && window.cartManager) {
                // TODO: Implementar aplicación de cupón
                console.log(`🎟️ Aplicando cupón ${couponCode}`);
            }
            
            // Marcar como recuperado
            await this.updateRecoveryRecord(recoveryRecord.id, {
                recovery_status: 'recovered',
                recovered_at: new Date().toISOString()
            });
            
            // Actualizar estado del carrito
            await fetch(`${this.baseUrl}/rest/v1/carts?id=eq.${cartId}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify({
                    status: 'active',
                    last_activity: new Date().toISOString()
                })
            });
            
            console.log('✅ Carrito recuperado exitosamente');
            
            return {
                success: true,
                message: 'Carrito recuperado exitosamente',
                cart: cart,
                coupon_code: couponCode
            };
            
        } catch (error) {
            console.error('❌ Error procesando recuperación:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Restaurar carrito abandonado en el cliente
     */
    async restoreCartInClient(abandonedCart) {
        try {
            if (!window.cartManager) return;
            
            // Limpiar carrito actual
            await window.cartManager.clearCart();
            
            // Restaurar items del carrito abandonado
            for (const item of abandonedCart.cart_items) {
                const productData = {
                    id: item.product_id,
                    name: item.product_snapshot.name,
                    price: item.unit_price,
                    image: item.product_snapshot.image,
                    slug: item.product_snapshot.slug,
                    description: item.product_snapshot.description
                };
                
                await window.cartManager.addProduct(
                    item.product_id,
                    item.variant_id,
                    item.quantity,
                    productData
                );
            }
            
            console.log('🔄 Carrito restaurado en cliente');
            
        } catch (error) {
            console.error('❌ Error restaurando carrito:', error);
        }
    }

    // ==========================================
    // UTILIDADES Y ESTADÍSTICAS
    // ==========================================

    /**
     * Obtener estadísticas de carritos abandonados
     */
    async getAbandonmentStats(days = 30) {
        try {
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
            
            // Total de carritos abandonados
            const abandonedResponse = await fetch(
                `${this.baseUrl}/rest/v1/carts?status=eq.abandoned&abandoned_at=gte.${startDate}&select=count`,
                { headers: this.headers }
            );
            
            // Total de carritos recuperados
            const recoveredResponse = await fetch(
                `${this.baseUrl}/rest/v1/abandoned_cart_recovery?recovery_status=eq.recovered&recovered_at=gte.${startDate}&select=count`,
                { headers: this.headers }
            );
            
            // Emails enviados
            const emailsResponse = await fetch(
                `${this.baseUrl}/rest/v1/abandoned_cart_recovery?last_email_sent_at=gte.${startDate}&select=emails_sent`,
                { headers: this.headers }
            );
            
            const abandoned = await abandonedResponse.json();
            const recovered = await recoveredResponse.json();
            const emails = await emailsResponse.json();
            
            const totalEmails = emails.reduce((sum, record) => sum + record.emails_sent, 0);
            const recoveryRate = abandoned.length > 0 ? (recovered.length / abandoned.length) * 100 : 0;
            
            return {
                total_abandoned: abandoned.length,
                total_recovered: recovered.length,
                recovery_rate: Math.round(recoveryRate * 100) / 100,
                emails_sent: totalEmails,
                period_days: days
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return null;
        }
    }

    /**
     * Limpiar registros expirados
     */
    async cleanupExpiredRecords() {
        try {
            console.log('🧹 Limpiando registros expirados...');
            
            const response = await fetch(`${this.baseUrl}/rest/v1/abandoned_cart_recovery?expires_at=lt.${new Date().toISOString()}`, {
                method: 'DELETE',
                headers: this.headers
            });
            
            if (response.ok) {
                console.log('✅ Registros expirados limpiados');
            }
            
        } catch (error) {
            console.error('❌ Error limpiando registros:', error);
        }
    }
}

// ==========================================
// INICIALIZACIÓN Y UTILIDADES GLOBALES
// ==========================================

/**
 * Procesar recuperación de carrito desde URL
 */
function processCartRecoveryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const cartRecovery = urlParams.get('cart_recovery');
    const token = urlParams.get('token');
    const coupon = urlParams.get('coupon');
    
    if (cartRecovery && token) {
        // Esperar a que CartManager esté listo
        const waitForCartManager = () => {
            if (window.abandonedCartRecovery) {
                window.abandonedCartRecovery.processCartRecovery(cartRecovery, token, coupon)
                    .then(result => {
                        if (result.success) {
                            // Mostrar mensaje de éxito
                            showRecoverySuccessMessage(result);
                            
                            // Limpiar URL
                            const cleanUrl = window.location.pathname + window.location.hash;
                            window.history.replaceState({}, document.title, cleanUrl);
                        } else {
                            showRecoveryErrorMessage(result.message);
                        }
                    });
            } else {
                setTimeout(waitForCartManager, 100);
            }
        };
        
        waitForCartManager();
    }
}

/**
 * Mostrar mensaje de recuperación exitosa
 */
function showRecoverySuccessMessage(result) {
    const message = `
        <div class="recovery-success-message" style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
            <strong>¡Carrito recuperado!</strong><br>
            ${result.coupon_code ? `Cupón ${result.coupon_code} aplicado` : 'Tus productos han sido restaurados'}
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                margin-left: 10px;
                cursor: pointer;
            ">&times;</button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', message);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        const element = document.querySelector('.recovery-success-message');
        if (element) element.remove();
    }, 5000);
}

/**
 * Mostrar mensaje de error en recuperación
 */
function showRecoveryErrorMessage(message) {
    const errorDiv = `
        <div class="recovery-error-message" style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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
            ">&times;</button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', errorDiv);
    
    // Auto-remover después de 7 segundos
    setTimeout(() => {
        const element = document.querySelector('.recovery-error-message');
        if (element) element.remove();
    }, 7000);
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Crear instancia global
let abandonedCartRecovery;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        abandonedCartRecovery = new AbandonedCartRecovery();
        window.abandonedCartRecovery = abandonedCartRecovery;
        
        // Procesar recuperación desde URL si está presente
        processCartRecoveryFromURL();
    });
} else {
    abandonedCartRecovery = new AbandonedCartRecovery();
    window.abandonedCartRecovery = abandonedCartRecovery;
    
    // Procesar recuperación desde URL si está presente
    processCartRecoveryFromURL();
}

console.log('📧 Abandoned Cart Recovery script cargado');

/**
 * COUPON SERVICE - Estudio Artesana
 * ===================================
 * Servicio para gestión y validación de cupones de descuento
 */

class CouponService {
    constructor() {
        this.supabase = null;
        this.appliedCoupon = null;
        this.initialized = false;

        this.init();
    }

    /**
     * Inicializar servicio con cliente de Supabase
     */
    async init() {
        // Esperar a que Supabase esté disponible
        if (window.SUPABASE_CONFIG && window.supabase) {
            try {
                this.supabase = window.supabase.createClient(
                    window.SUPABASE_CONFIG.url,
                    window.SUPABASE_CONFIG.anonKey
                );
                this.initialized = true;
                console.log('✅ CouponService initialized');

                // Cargar cupón aplicado desde sessionStorage
                this.loadAppliedCoupon();
            } catch (error) {
                console.error('❌ Error initializing CouponService:', error);
            }
        } else {
            // Reintentar después de un momento
            setTimeout(() => this.init(), 500);
        }
    }

    /**
     * Validar cupón usando la función de Supabase
     * @param {string} code - Código del cupón
     * @param {number} cartTotal - Total del carrito
     * @param {number} itemsCount - Cantidad de items en el carrito
     * @returns {Promise<Object>} Resultado de validación
     */
    async validateCoupon(code, cartTotal, itemsCount = 1) {
        if (!this.initialized) {
            throw new Error('CouponService not initialized');
        }

        try {
            // Normalizar código
            code = code.trim().toUpperCase();

            console.log('🎫 Validating coupon:', code);

            // Obtener usuario actual
            const { data: { user } } = await this.supabase.auth.getUser();
            const userId = user ? user.id : null;

            // Llamar a la función de validación en Supabase
            const { data, error } = await this.supabase.rpc('validate_coupon', {
                p_code: code,
                p_cart_total: cartTotal,
                p_user_id: userId,
                p_items_count: itemsCount
            });

            if (error) {
                console.error('❌ Error validating coupon:', error);
                throw new Error('Error al validar el cupón');
            }

            // Registrar intento
            await this.logAttempt(code, userId, data.valid, data.error || null);

            return data;

        } catch (error) {
            console.error('❌ Error in validateCoupon:', error);
            return {
                valid: false,
                error: 'VALIDATION_ERROR',
                message: 'Error al validar el cupón. Intenta nuevamente.'
            };
        }
    }

    /**
     * Aplicar cupón al carrito
     * @param {string} code - Código del cupón
     * @param {Object} cartData - Datos del carrito {total, items, itemsCount}
     * @returns {Promise<Object>} Cupón aplicado con descuento
     */
    async applyCoupon(code, cartData) {
        const { total, itemsCount = 1 } = cartData;

        // Validar cupón
        const validation = await this.validateCoupon(code, total, itemsCount);

        if (!validation.valid) {
            return validation;
        }

        // Guardar cupón aplicado
        this.appliedCoupon = {
            code: code,
            coupon: validation.coupon,
            discount: validation.discount,
            originalTotal: total,
            finalTotal: validation.finalTotal,
            appliedAt: new Date().toISOString()
        };

        // Guardar en sessionStorage
        this.saveAppliedCoupon();

        console.log('✅ Coupon applied:', this.appliedCoupon);

        return {
            valid: true,
            ...this.appliedCoupon
        };
    }

    /**
     * Obtener cupón actualmente aplicado
     * @returns {Object|null} Cupón aplicado
     */
    getAppliedCoupon() {
        return this.appliedCoupon;
    }

    /**
     * Remover cupón aplicado
     */
    removeCoupon() {
        this.appliedCoupon = null;
        sessionStorage.removeItem('appliedCoupon');
        console.log('🗑️ Coupon removed');
    }

    /**
     * Calcular descuento basado en cupón y total
     * @param {Object} coupon - Objeto del cupón
     * @param {number} total - Total del carrito
     * @returns {number} Descuento calculado
     */
    calculateDiscount(coupon, total) {
        let discount = 0;

        if (coupon.discount_type === 'percentage') {
            discount = (total * coupon.discount_value / 100);

            // Aplicar descuento máximo si existe
            if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
                discount = coupon.max_discount_amount;
            }
        } else {
            discount = coupon.discount_value;

            // El descuento no puede ser mayor al total
            if (discount > total) {
                discount = total;
            }
        }

        return Math.round(discount * 100) / 100; // Redondear a 2 decimales
    }

    /**
     * Registrar uso del cupón (llamar al confirmar orden)
     * @param {string} orderId - ID de la orden
     * @returns {Promise<boolean>} True si se registró exitosamente
     */
    async recordCouponUsage(orderId) {
        if (!this.appliedCoupon) {
            console.warn('⚠️ No coupon applied to record');
            return false;
        }

        if (!this.initialized) {
            throw new Error('CouponService not initialized');
        }

        try {
            const { data: { user } } = await this.supabase.auth.getUser();

            // Obtener IP del cliente (desde una API externa)
            let ipAddress = null;
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                ipAddress = ipData.ip;
            } catch (e) {
                console.warn('Could not fetch IP:', e);
            }

            const usageData = {
                coupon_id: this.appliedCoupon.coupon.id,
                user_id: user ? user.id : null,
                order_id: orderId,
                discount_applied: this.appliedCoupon.discount,
                cart_total: this.appliedCoupon.originalTotal,
                final_total: this.appliedCoupon.finalTotal,
                ip_address: ipAddress,
                user_agent: navigator.userAgent
            };

            const { data, error } = await this.supabase
                .from('coupon_usage')
                .insert([usageData])
                .select()
                .single();

            if (error) {
                console.error('❌ Error recording coupon usage:', error);
                return false;
            }

            console.log('✅ Coupon usage recorded:', data);

            // Limpiar cupón aplicado después de registrar
            this.removeCoupon();

            return true;

        } catch (error) {
            console.error('❌ Error in recordCouponUsage:', error);
            return false;
        }
    }

    /**
     * Registrar intento de aplicación de cupón
     * @private
     */
    async logAttempt(code, userId, success, failureReason) {
        try {
            // Obtener IP del cliente
            let ipAddress = null;
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                ipAddress = ipData.ip;
            } catch (e) {
                // Ignorar si no se puede obtener IP
            }

            await this.supabase.from('coupon_attempts').insert([{
                code_attempted: code,
                user_id: userId,
                ip_address: ipAddress,
                success: success,
                failure_reason: failureReason
            }]);
        } catch (error) {
            // No fallar si no se puede registrar el intento
            console.warn('Could not log coupon attempt:', error);
        }
    }

    /**
     * Obtener historial de uso de cupones del usuario actual
     * @returns {Promise<Array>} Historial de usos
     */
    async getUserCouponHistory() {
        if (!this.initialized) {
            throw new Error('CouponService not initialized');
        }

        try {
            const { data: { user } } = await this.supabase.auth.getUser();

            if (!user) {
                return [];
            }

            const { data, error } = await this.supabase
                .from('coupon_usage')
                .select(`
                    *,
                    coupons:coupon_id (
                        code,
                        description
                    )
                `)
                .eq('user_id', user.id)
                .order('used_at', { ascending: false });

            if (error) {
                console.error('Error fetching coupon history:', error);
                return [];
            }

            return data || [];

        } catch (error) {
            console.error('Error in getUserCouponHistory:', error);
            return [];
        }
    }

    /**
     * Verificar si usuario ya usó un cupón específico
     * @param {string} couponId - ID del cupón
     * @returns {Promise<number>} Cantidad de veces usado
     */
    async getUserCouponUsageCount(couponId) {
        if (!this.initialized) {
            throw new Error('CouponService not initialized');
        }

        try {
            const { data: { user } } = await this.supabase.auth.getUser();

            if (!user) {
                return 0;
            }

            const { count, error } = await this.supabase
                .from('coupon_usage')
                .select('*', { count: 'exact', head: true })
                .eq('coupon_id', couponId)
                .eq('user_id', user.id);

            if (error) {
                console.error('Error counting coupon usage:', error);
                return 0;
            }

            return count || 0;

        } catch (error) {
            console.error('Error in getUserCouponUsageCount:', error);
            return 0;
        }
    }

    /**
     * Guardar cupón aplicado en sessionStorage
     * @private
     */
    saveAppliedCoupon() {
        if (this.appliedCoupon) {
            sessionStorage.setItem('appliedCoupon', JSON.stringify(this.appliedCoupon));
        }
    }

    /**
     * Cargar cupón aplicado desde sessionStorage
     * @private
     */
    loadAppliedCoupon() {
        try {
            const saved = sessionStorage.getItem('appliedCoupon');
            if (saved) {
                this.appliedCoupon = JSON.parse(saved);
                console.log('📋 Applied coupon loaded from session:', this.appliedCoupon.code);
            }
        } catch (error) {
            console.warn('Error loading applied coupon:', error);
            sessionStorage.removeItem('appliedCoupon');
        }
    }

    /**
     * Obtener mensaje de error amigable
     * @param {string} errorCode - Código de error
     * @returns {string} Mensaje amigable
     */
    getErrorMessage(errorCode) {
        const messages = {
            'COUPON_NOT_FOUND': '❌ El cupón no existe',
            'COUPON_INACTIVE': '❌ El cupón está desactivado',
            'COUPON_NOT_STARTED': '⏰ El cupón aún no es válido',
            'COUPON_EXPIRED': '⌛ El cupón ha expirado',
            'COUPON_LIMIT_REACHED': '🚫 El cupón ha alcanzado su límite de usos',
            'USER_LIMIT_REACHED': '🚫 Ya has usado este cupón el máximo de veces permitido',
            'MIN_PURCHASE_NOT_MET': '💰 No cumples con el monto mínimo de compra',
            'MIN_ITEMS_NOT_MET': '🛒 No tienes suficientes productos en el carrito',
            'VALIDATION_ERROR': '⚠️ Error al validar el cupón'
        };

        return messages[errorCode] || '❌ Cupón inválido';
    }

    /**
     * Formatear descuento para mostrar
     * @param {Object} coupon - Objeto del cupón
     * @returns {string} Texto formateado del descuento
     */
    formatDiscount(coupon) {
        if (coupon.discount_type === 'percentage') {
            return `${coupon.discount_value}% de descuento`;
        } else {
            return `$${coupon.discount_value.toFixed(2)} de descuento`;
        }
    }
}

// Crear instancia global
window.CouponService = new CouponService();

console.log('✅ Coupon Service loaded');

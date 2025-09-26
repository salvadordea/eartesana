/**
 * STOCK VALIDATION UTILITY - ESTUDIO ARTESANA
 * ===========================================
 * Handles real-time stock validation for cart operations
 */

class StockValidator {
    constructor() {
        this.supabase = null;
        this.init();
    }

    async init() {
        // Wait for Supabase to be available
        await this.waitForSupabase();
        console.log('📦 Stock Validator initialized');
    }

    async waitForSupabase() {
        return new Promise((resolve) => {
            const checkSupabase = () => {
                if (window.supabase) {
                    this.supabase = window.supabase;
                    resolve();
                } else {
                    setTimeout(checkSupabase, 100);
                }
            };
            checkSupabase();
        });
    }

    /**
     * Check if variant has sufficient stock
     */
    async checkVariantStock(variantId, requestedQuantity) {
        try {
            console.log(`🔍 Checking stock for variant ${variantId}, requested: ${requestedQuantity}`);

            const { data: variant, error } = await this.supabase
                .from('product_variants')
                .select('stock, variant_name, product_id')
                .eq('id', variantId)
                .single();

            if (error) {
                console.error('❌ Error fetching variant stock:', error);
                return {
                    hasStock: false,
                    availableStock: 0,
                    error: 'Error verificando stock'
                };
            }

            if (!variant) {
                return {
                    hasStock: false,
                    availableStock: 0,
                    error: 'Variante no encontrada'
                };
            }

            const hasStock = variant.stock >= requestedQuantity;

            console.log(`📊 Stock check result: ${variant.stock} available, ${requestedQuantity} requested, sufficient: ${hasStock}`);

            return {
                hasStock,
                availableStock: variant.stock,
                variantName: variant.variant_name,
                error: null
            };

        } catch (error) {
            console.error('❌ Stock validation error:', error);
            return {
                hasStock: false,
                availableStock: 0,
                error: 'Error de conexión'
            };
        }
    }

    /**
     * Validate entire cart for stock availability
     */
    async validateCartStock(cartItems) {
        const results = [];
        let hasIssues = false;

        for (const item of cartItems) {
            const stockCheck = await this.checkVariantStock(item.variant_id, item.quantity);

            if (!stockCheck.hasStock) {
                hasIssues = true;
            }

            results.push({
                item,
                stockCheck,
                isValid: stockCheck.hasStock
            });
        }

        return {
            isValid: !hasIssues,
            results,
            issues: results.filter(r => !r.isValid)
        };
    }

    /**
     * Get stock status message for UI
     */
    getStockMessage(availableStock, requestedQuantity) {
        if (availableStock === 0) {
            return {
                message: 'Sin stock',
                type: 'error',
                canAdd: false
            };
        } else if (availableStock < requestedQuantity) {
            return {
                message: `Solo ${availableStock} disponibles`,
                type: 'warning',
                canAdd: true,
                maxQuantity: availableStock
            };
        } else if (availableStock <= 5) {
            return {
                message: `Últimas ${availableStock} unidades`,
                type: 'warning',
                canAdd: true
            };
        } else {
            return {
                message: 'En stock',
                type: 'success',
                canAdd: true
            };
        }
    }
}

// Make StockValidator globally available
window.stockValidator = new StockValidator();
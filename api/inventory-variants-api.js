/**
 * API para gestión de Variantes de Productos - Estudio Artesana
 * Maneja CRUD completo de variantes con actualización automática de stock
 */

class InventoryVariantsAPI {
    constructor() {
        this.baseURL = '/api/inventory';
    }

    // ====== PRODUCTOS PRINCIPALES ======

    /**
     * Obtener todos los productos con sus variantes
     */
    async getProductsWithVariants(filters = {}) {
        const params = new URLSearchParams(filters);
        try {
            const response = await fetch(`${this.baseURL}/products-with-variants?${params}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching products with variants:', error);
            throw error;
        }
    }

    /**
     * Obtener un producto específico con sus variantes
     */
    async getProductWithVariants(productId) {
        try {
            const response = await fetch(`${this.baseURL}/products/${productId}/variants`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching product variants:', error);
            throw error;
        }
    }

    // ====== VARIANTES ======

    /**
     * Crear nueva variante
     */
    async createVariant(productId, variantData) {
        try {
            const response = await fetch(`${this.baseURL}/products/${productId}/variants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(variantData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating variant:', error);
            throw error;
        }
    }

    /**
     * Actualizar variante existente
     */
    async updateVariant(productId, variantId, variantData) {
        try {
            const response = await fetch(`${this.baseURL}/products/${productId}/variants/${variantId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(variantData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating variant:', error);
            throw error;
        }
    }

    /**
     * Eliminar variante
     */
    async deleteVariant(productId, variantId) {
        try {
            const response = await fetch(`${this.baseURL}/products/${productId}/variants/${variantId}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting variant:', error);
            throw error;
        }
    }

    /**
     * Actualizar stock de una variante específica
     */
    async updateVariantStock(productId, variantId, newStock) {
        try {
            const response = await fetch(`${this.baseURL}/products/${productId}/variants/${variantId}/stock`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ stock: newStock })
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating variant stock:', error);
            throw error;
        }
    }

    /**
     * Actualizar stock masivo de variantes
     */
    async updateBulkVariantStock(productId, variants) {
        try {
            const response = await fetch(`${this.baseURL}/products/${productId}/variants/bulk-stock`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ variants })
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating bulk variant stock:', error);
            throw error;
        }
    }

    /**
     * Reordenar variantes
     */
    async reorderVariants(productId, variantOrders) {
        try {
            const response = await fetch(`${this.baseURL}/products/${productId}/variants/reorder`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orders: variantOrders })
            });
            return await response.json();
        } catch (error) {
            console.error('Error reordering variants:', error);
            throw error;
        }
    }

    // ====== TIPOS DE VARIANTES ======

    /**
     * Obtener tipos de variantes disponibles
     */
    async getVariantTypes() {
        try {
            const response = await fetch(`${this.baseURL}/variant-types`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching variant types:', error);
            throw error;
        }
    }

    /**
     * Crear nuevo tipo de variante
     */
    async createVariantType(typeData) {
        try {
            const response = await fetch(`${this.baseURL}/variant-types`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(typeData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating variant type:', error);
            throw error;
        }
    }

    // ====== ESTADÍSTICAS ======

    /**
     * Obtener resumen de inventario
     */
    async getInventorySummary() {
        try {
            const response = await fetch(`${this.baseURL}/summary`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching inventory summary:', error);
            throw error;
        }
    }

    /**
     * Obtener productos con bajo stock
     */
    async getLowStockProducts(threshold = 5) {
        try {
            const response = await fetch(`${this.baseURL}/low-stock?threshold=${threshold}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching low stock products:', error);
            throw error;
        }
    }

    // ====== UTILIDADES ======

    /**
     * Generar SKU automático para variante
     */
    async generateVariantSKU(productId, variantValue) {
        try {
            const response = await fetch(`${this.baseURL}/products/${productId}/generate-sku`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ variantValue })
            });
            return await response.json();
        } catch (error) {
            console.error('Error generating SKU:', error);
            throw error;
        }
    }

    /**
     * Validar SKU único
     */
    async validateSKU(sku, excludeVariantId = null) {
        try {
            const params = new URLSearchParams({ sku });
            if (excludeVariantId) params.append('exclude', excludeVariantId);
            
            const response = await fetch(`${this.baseURL}/validate-sku?${params}`);
            return await response.json();
        } catch (error) {
            console.error('Error validating SKU:', error);
            throw error;
        }
    }

    // ====== HISTORIAL DE MOVIMIENTOS ======

    /**
     * Registrar movimiento de stock
     */
    async recordStockMovement(variantId, movement) {
        try {
            const response = await fetch(`${this.baseURL}/variants/${variantId}/movements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(movement)
            });
            return await response.json();
        } catch (error) {
            console.error('Error recording stock movement:', error);
            throw error;
        }
    }

    /**
     * Obtener historial de movimientos
     */
    async getStockMovements(variantId, filters = {}) {
        const params = new URLSearchParams(filters);
        try {
            const response = await fetch(`${this.baseURL}/variants/${variantId}/movements?${params}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching stock movements:', error);
            throw error;
        }
    }
}

// Instancia global
window.inventoryVariantsAPI = new InventoryVariantsAPI();

// Ejemplo de uso:
/*
// Obtener productos con variantes
const products = await inventoryVariantsAPI.getProductsWithVariants();

// Crear nueva variante
const newVariant = await inventoryVariantsAPI.createVariant(productId, {
    variant_name: 'Color Rojo',
    variant_value: 'rojo',
    stock: 15,
    price: 350.00,
    sku: 'TARJ-BOTON-ROJO'
});

// Actualizar stock
await inventoryVariantsAPI.updateVariantStock(productId, variantId, 20);

// Obtener productos con bajo stock
const lowStockProducts = await inventoryVariantsAPI.getLowStockProducts(5);
*/

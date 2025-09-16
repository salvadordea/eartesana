/**
 * SISTEMA DE CARRITO DE COMPRAS - ESTUDIO ARTESANA
 * ===============================================
 * Maneja carritos persistentes para usuarios registrados e invitados
 * Funcionalidades:
 * - Carrito sin registro (localStorage + sessionStorage)
 * - Sincronización con base de datos para usuarios registrados
 * - Persistencia entre sesiones
 * - Detección de carritos abandonados
 */

class CartManager {
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
        
        // Estado del carrito
        this.cart = {
            id: null,
            items: [],
            totals: {
                items_count: 0,
                subtotal: 0,
                tax: 0,
                shipping: 0,
                discount: 0,
                total: 0
            },
            guest_info: {
                email: null,
                phone: null
            },
            session_id: null
        };
        
        // Eventos y callbacks
        this.callbacks = [];
        
        console.log('🛒 CartManager inicializado');
        
        // Inicializar carrito
        this.initialize();
    }

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================

    /**
     * Inicializar el carrito al cargar la página
     */
    async initialize() {
        try {
            // Generar o recuperar session_id
            this.generateSessionId();
            
            // Intentar cargar carrito existente
            await this.loadCart();
            
            // Configurar guardado automático cada 30 segundos
            this.setupAutoSave();
            
            // Configurar detección de abandono
            this.setupAbandonmentDetection();
            
            console.log('✅ Carrito inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando carrito:', error);
        }
    }

    /**
     * Generar o recuperar session_id único
     */
    generateSessionId() {
        let sessionId = sessionStorage.getItem('cart_session_id');
        
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
            sessionStorage.setItem('cart_session_id', sessionId);
        }
        
        this.cart.session_id = sessionId;
    }

    /**
     * Cargar carrito existente (localStorage o base de datos)
     */
    async loadCart() {
        try {
            // Si hay usuario autenticado, cargar desde DB
            if (window.authManager && window.authManager.isAuthenticated()) {
                await this.loadCartFromDatabase();
            } else {
                // Cargar desde localStorage
                this.loadCartFromLocalStorage();
            }
            
            // Notificar cambios
            this.notifyCartChange();
            
        } catch (error) {
            console.error('❌ Error cargando carrito:', error);
            // Fallback a localStorage
            this.loadCartFromLocalStorage();
        }
    }

    /**
     * Cargar carrito desde localStorage
     */
    loadCartFromLocalStorage() {
        const savedCart = localStorage.getItem('artesana_cart');
        
        if (savedCart) {
            try {
                const cartData = JSON.parse(savedCart);
                this.cart.items = cartData.items || [];
                this.cart.guest_info = cartData.guest_info || {};
                this.calculateTotals();
                
                console.log(`📦 Carrito cargado desde localStorage: ${this.cart.items.length} items`);
                
            } catch (error) {
                console.error('❌ Error parseando carrito desde localStorage:', error);
                this.cart.items = [];
            }
        }
    }

    /**
     * Cargar carrito desde base de datos (usuario registrado)
     */
    async loadCartFromDatabase() {
        try {
            const user = window.authManager.getCurrentUser();
            if (!user) return;

            // Buscar carrito activo del usuario
            const response = await fetch(`${this.baseUrl}/rest/v1/carts?user_id=eq.${user.id}&status=eq.active&select=*,cart_items(*)`, {
                headers: {
                    ...this.headers,
                    'Authorization': `Bearer ${window.authManager.getCurrentSession()?.access_token || this.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const carts = await response.json();
            
            if (carts && carts.length > 0) {
                const dbCart = carts[0];
                this.cart.id = dbCart.id;
                this.cart.guest_info.email = dbCart.guest_email;
                this.cart.guest_info.phone = dbCart.guest_phone;
                
                // Convertir items de DB a formato local
                this.cart.items = dbCart.cart_items.map(item => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.total_price,
                    product_snapshot: item.product_snapshot
                }));
                
                this.calculateTotals();
                
                // Sincronizar con localStorage
                await this.syncCartWithLocalStorage();
                
                console.log(`📦 Carrito cargado desde DB: ${this.cart.items.length} items`);
            }
            
        } catch (error) {
            console.error('❌ Error cargando carrito desde DB:', error);
            // Fallback a localStorage
            this.loadCartFromLocalStorage();
        }
    }

    // ==========================================
    // GESTIÓN DE PRODUCTOS
    // ==========================================

    /**
     * Agregar producto al carrito
     */
    async addProduct(productId, variantId = null, quantity = 1, productData = null) {
        try {
            console.log(`➕ Agregando producto ${productId} al carrito (cantidad: ${quantity})`);

            // Obtener información del producto si no se proporciona
            if (!productData) {
                productData = await this.getProductData(productId, variantId);
                if (!productData) {
                    throw new Error('No se pudo obtener información del producto');
                }
            }

            // Buscar si el producto ya existe en el carrito
            const existingItemIndex = this.cart.items.findIndex(item => 
                item.product_id == productId && 
                (item.variant_id || null) == (variantId || null)
            );

            if (existingItemIndex >= 0) {
                // Actualizar cantidad existente
                this.cart.items[existingItemIndex].quantity += quantity;
                this.cart.items[existingItemIndex].total_price = 
                    this.cart.items[existingItemIndex].quantity * this.cart.items[existingItemIndex].unit_price;
            } else {
                // Agregar nuevo item
                const newItem = {
                    product_id: productId,
                    variant_id: variantId,
                    quantity: quantity,
                    unit_price: productData.price,
                    total_price: quantity * productData.price,
                    product_snapshot: {
                        name: productData.name,
                        image: productData.image,
                        slug: productData.slug,
                        description: productData.short_description || productData.description
                    }
                };
                
                this.cart.items.push(newItem);
            }

            // Recalcular totales
            this.calculateTotals();

            // Guardar carrito
            await this.saveCart();

            // Notificar cambios
            this.notifyCartChange();

            console.log(`✅ Producto agregado al carrito. Total items: ${this.cart.totals.items_count}`);

            return {
                success: true,
                message: 'Producto agregado al carrito',
                cart: this.getCartSummary()
            };

        } catch (error) {
            console.error('❌ Error agregando producto al carrito:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Actualizar cantidad de un producto
     */
    async updateQuantity(productId, variantId = null, newQuantity) {
        try {
            const itemIndex = this.cart.items.findIndex(item => 
                item.product_id == productId && 
                (item.variant_id || null) == (variantId || null)
            );

            if (itemIndex < 0) {
                throw new Error('Producto no encontrado en el carrito');
            }

            if (newQuantity <= 0) {
                return await this.removeProduct(productId, variantId);
            }

            // Actualizar cantidad y precio
            this.cart.items[itemIndex].quantity = newQuantity;
            this.cart.items[itemIndex].total_price = 
                newQuantity * this.cart.items[itemIndex].unit_price;

            // Recalcular totales
            this.calculateTotals();

            // Guardar carrito
            await this.saveCart();

            // Notificar cambios
            this.notifyCartChange();

            return {
                success: true,
                message: 'Cantidad actualizada',
                cart: this.getCartSummary()
            };

        } catch (error) {
            console.error('❌ Error actualizando cantidad:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Remover producto del carrito
     */
    async removeProduct(productId, variantId = null) {
        try {
            const itemIndex = this.cart.items.findIndex(item => 
                item.product_id == productId && 
                (item.variant_id || null) == (variantId || null)
            );

            if (itemIndex < 0) {
                throw new Error('Producto no encontrado en el carrito');
            }

            // Remover item
            this.cart.items.splice(itemIndex, 1);

            // Recalcular totales
            this.calculateTotals();

            // Guardar carrito
            await this.saveCart();

            // Notificar cambios
            this.notifyCartChange();

            console.log(`🗑️ Producto ${productId} removido del carrito`);

            return {
                success: true,
                message: 'Producto removido del carrito',
                cart: this.getCartSummary()
            };

        } catch (error) {
            console.error('❌ Error removiendo producto:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Vaciar carrito completamente
     */
    async clearCart() {
        try {
            this.cart.items = [];
            this.calculateTotals();
            
            await this.saveCart();
            this.notifyCartChange();

            console.log('🧹 Carrito vaciado');

            return {
                success: true,
                message: 'Carrito vaciado',
                cart: this.getCartSummary()
            };

        } catch (error) {
            console.error('❌ Error vaciando carrito:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    // ==========================================
    // GESTIÓN DE DATOS DE INVITADO
    // ==========================================

    /**
     * Actualizar información de invitado
     */
    async updateGuestInfo(email, phone = null) {
        try {
            this.cart.guest_info.email = email;
            this.cart.guest_info.phone = phone;
            
            await this.saveCart();
            
            return {
                success: true,
                message: 'Información actualizada'
            };
            
        } catch (error) {
            console.error('❌ Error actualizando info de invitado:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ==========================================
    // CÁLCULOS Y TOTALES
    // ==========================================

    /**
     * Calcular totales del carrito
     */
    calculateTotals() {
        let itemsCount = 0;
        let subtotal = 0;

        this.cart.items.forEach(item => {
            itemsCount += item.quantity;
            subtotal += item.total_price;
        });

        // Por ahora, cálculos simples
        // TODO: Implementar cálculo de impuestos y envío
        const tax = 0; // subtotal * 0.16; // IVA en México
        const shipping = 0; // Se calculará más adelante
        const discount = 0; // Se calculará con cupones

        this.cart.totals = {
            items_count: itemsCount,
            subtotal: subtotal,
            tax: tax,
            shipping: shipping,
            discount: discount,
            total: subtotal + tax + shipping - discount
        };
    }

    // ==========================================
    // PERSISTENCIA
    // ==========================================

    /**
     * Guardar carrito (localStorage y/o base de datos)
     */
    async saveCart() {
        try {
            // Siempre guardar en localStorage
            this.saveCartToLocalStorage();

            // Si hay usuario registrado, guardar también en DB
            if (window.authManager && window.authManager.isAuthenticated()) {
                await this.saveCartToDatabase();
            }

        } catch (error) {
            console.error('❌ Error guardando carrito:', error);
        }
    }

    /**
     * Guardar en localStorage
     */
    saveCartToLocalStorage() {
        const cartData = {
            items: this.cart.items,
            guest_info: this.cart.guest_info,
            session_id: this.cart.session_id,
            last_updated: new Date().toISOString()
        };

        localStorage.setItem('artesana_cart', JSON.stringify(cartData));
    }

    /**
     * Guardar en base de datos
     */
    async saveCartToDatabase() {
        try {
            const user = window.authManager.getCurrentUser();
            const session = window.authManager.getCurrentSession();
            
            if (!user || !session) return;

            const authHeaders = {
                ...this.headers,
                'Authorization': `Bearer ${session.access_token}`
            };

            if (this.cart.id) {
                // Actualizar carrito existente
                await this.updateCartInDatabase(authHeaders);
            } else {
                // Crear nuevo carrito
                await this.createCartInDatabase(authHeaders, user.id);
            }

        } catch (error) {
            console.error('❌ Error guardando carrito en DB:', error);
        }
    }

    /**
     * Crear nuevo carrito en base de datos
     */
    async createCartInDatabase(authHeaders, userId) {
        // Crear carrito
        const cartResponse = await fetch(`${this.baseUrl}/rest/v1/carts`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                user_id: userId,
                session_id: this.cart.session_id,
                guest_email: this.cart.guest_info.email,
                guest_phone: this.cart.guest_info.phone,
                status: 'active'
            })
        });

        if (!cartResponse.ok) {
            throw new Error(`Error creando carrito: ${cartResponse.status}`);
        }

        const newCart = await cartResponse.json();
        this.cart.id = newCart[0].id;

        // Agregar items al carrito
        if (this.cart.items.length > 0) {
            await this.saveCartItemsToDatabase(authHeaders);
        }
    }

    /**
     * Actualizar carrito existente en base de datos
     */
    async updateCartInDatabase(authHeaders) {
        // Actualizar información del carrito
        await fetch(`${this.baseUrl}/rest/v1/carts?id=eq.${this.cart.id}`, {
            method: 'PATCH',
            headers: authHeaders,
            body: JSON.stringify({
                guest_email: this.cart.guest_info.email,
                guest_phone: this.cart.guest_info.phone,
                last_activity: new Date().toISOString()
            })
        });

        // Limpiar items existentes y agregar nuevos
        await fetch(`${this.baseUrl}/rest/v1/cart_items?cart_id=eq.${this.cart.id}`, {
            method: 'DELETE',
            headers: authHeaders
        });

        if (this.cart.items.length > 0) {
            await this.saveCartItemsToDatabase(authHeaders);
        }
    }

    /**
     * Guardar items del carrito en base de datos
     */
    async saveCartItemsToDatabase(authHeaders) {
        const cartItems = this.cart.items.map(item => ({
            cart_id: this.cart.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            product_snapshot: item.product_snapshot
        }));

        await fetch(`${this.baseUrl}/rest/v1/cart_items`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(cartItems)
        });
    }

    /**
     * Sincronizar carrito con localStorage después de cargar de DB
     */
    async syncCartWithLocalStorage() {
        this.saveCartToLocalStorage();
    }

    // ==========================================
    // UTILIDADES
    // ==========================================

    /**
     * Obtener información de un producto
     */
    async getProductData(productId, variantId = null) {
        try {
            let url = `${this.baseUrl}/rest/v1/products?id=eq.${productId}&select=*`;
            
            const response = await fetch(url, {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const products = await response.json();
            
            if (!products || products.length === 0) {
                throw new Error('Producto no encontrado');
            }

            const product = products[0];

            // Si hay variant_id, obtener información de la variante
            let price = product.price;
            let name = product.name;
            
            if (variantId) {
                const variantResponse = await fetch(`${this.baseUrl}/rest/v1/product_variants?id=eq.${variantId}`, {
                    headers: this.headers
                });
                
                if (variantResponse.ok) {
                    const variants = await variantResponse.json();
                    if (variants && variants.length > 0) {
                        price = variants[0].price;
                        name = variants[0].name;
                    }
                }
            }

            return {
                id: product.id,
                name: name,
                slug: product.slug,
                price: price,
                image: product.main_image_url,
                description: product.description,
                short_description: product.short_description
            };

        } catch (error) {
            console.error('❌ Error obteniendo datos del producto:', error);
            return null;
        }
    }

    /**
     * Obtener resumen del carrito
     */
    getCartSummary() {
        return {
            id: this.cart.id,
            items: this.cart.items,
            totals: this.cart.totals,
            guest_info: this.cart.guest_info
        };
    }

    /**
     * Obtener número de items en el carrito
     */
    getItemCount() {
        return this.cart.totals.items_count;
    }

    /**
     * Verificar si el carrito está vacío
     */
    isEmpty() {
        return this.cart.items.length === 0;
    }

    // ==========================================
    // EVENTOS Y CALLBACKS
    // ==========================================

    /**
     * Suscribirse a cambios del carrito
     */
    onCartChange(callback) {
        if (typeof callback === 'function') {
            this.callbacks.push(callback);
        }
        
        // Retornar función para desuscribirse
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1) {
                this.callbacks.splice(index, 1);
            }
        };
    }

    /**
     * Notificar cambios a todos los callbacks
     */
    notifyCartChange() {
        const cartData = this.getCartSummary();
        
        this.callbacks.forEach(callback => {
            try {
                callback(cartData);
            } catch (error) {
                console.error('❌ Error en callback del carrito:', error);
            }
        });

        // Actualizar elementos DOM con atributo data-cart-count
        this.updateCartCountElements();
    }

    /**
     * Actualizar elementos que muestran el contador del carrito
     */
    updateCartCountElements() {
        const elements = document.querySelectorAll('[data-cart-count]');
        elements.forEach(element => {
            element.textContent = this.cart.totals.items_count;
            
            // Mostrar/ocultar basado en si hay items
            if (this.cart.totals.items_count > 0) {
                element.style.display = '';
            } else {
                element.style.display = 'none';
            }
        });
    }

    // ==========================================
    // AUTO-GUARDADO Y DETECCIÓN DE ABANDONO
    // ==========================================

    /**
     * Configurar guardado automático cada 30 segundos
     */
    setupAutoSave() {
        setInterval(async () => {
            if (!this.isEmpty()) {
                await this.saveCart();
            }
        }, 30000); // 30 segundos
    }

    /**
     * Configurar detección de abandono del carrito
     */
    setupAbandonmentDetection() {
        let activityTimeout;

        const resetActivityTimer = () => {
            clearTimeout(activityTimeout);
            
            // Marcar como abandonado después de 2 horas de inactividad
            activityTimeout = setTimeout(() => {
                if (!this.isEmpty()) {
                    console.log('⏰ Carrito marcado como abandonado por inactividad');
                    this.markAsAbandoned();
                }
            }, 2 * 60 * 60 * 1000); // 2 horas
        };

        // Eventos que resetean el timer de actividad
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetActivityTimer, { passive: true });
        });

        // Iniciar timer
        resetActivityTimer();
    }

    /**
     * Marcar carrito como abandonado
     */
    async markAsAbandoned() {
        try {
            if (this.cart.id && window.authManager && window.authManager.isAuthenticated()) {
                const session = window.authManager.getCurrentSession();
                
                await fetch(`${this.baseUrl}/rest/v1/carts?id=eq.${this.cart.id}`, {
                    method: 'PATCH',
                    headers: {
                        ...this.headers,
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        status: 'abandoned',
                        abandoned_at: new Date().toISOString()
                    })
                });
                
                console.log('🏃 Carrito marcado como abandonado en DB');
            }
            
        } catch (error) {
            console.error('❌ Error marcando carrito como abandonado:', error);
        }
    }
}

// ==========================================
// INICIALIZACIÓN GLOBAL
// ==========================================

// Crear instancia global del carrito cuando se carga el script
let cartManager;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        cartManager = new CartManager();
        window.cartManager = cartManager;
    });
} else {
    cartManager = new CartManager();
    window.cartManager = cartManager;
}

console.log('🛒 Cart Manager script cargado');

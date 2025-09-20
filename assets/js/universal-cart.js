/**
 * UNIVERSAL CART MANAGER - ESTUDIO ARTESANA
 * =========================================
 * Maneja toda la funcionalidad del carrito de compras
 * Compatible con todas las páginas del sitio
 */

class UniversalCart {
    constructor() {
        this.cart = [];
        this.isModalLoaded = false;
        this.baseUrl = this.calculateBaseUrl();
        
        this.init();
    }

    /**
     * Calcula la URL base para encontrar archivos relativos
     */
    calculateBaseUrl() {
        const currentPath = window.location.pathname;
        const depth = (currentPath.match(/\//g) || []).length - 1;
        return depth === 0 ? './' : '../'.repeat(depth);
    }

    /**
     * Inicializa el gestor del carrito
     */
    init() {
        console.log('🛒 Universal Cart initialized');
        
        // Cargar carrito desde localStorage
        this.loadCart();
        
        // Inicializar después de que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeAfterDOMReady());
        } else {
            this.initializeAfterDOMReady();
        }
    }

    /**
     * Inicialización después de que el DOM esté listo
     */
    async initializeAfterDOMReady() {
        // Esperar a que el header se cargue
        await this.waitForHeader();
        
        // Cargar modal del carrito
        await this.loadCartModal();
        
        // Inicializar event listeners
        this.initializeEventListeners();
        
        // Actualizar contador inicial
        this.updateCartCounter();
        
        console.log('✅ Universal Cart fully initialized');
    }

    /**
     * Espera a que el header universal esté cargado
     */
    async waitForHeader() {
        return new Promise((resolve) => {
            const checkHeader = () => {
                const cartBtn = document.querySelector('.cart-btn, .cart-icon');
                if (cartBtn) {
                    resolve();
                } else {
                    setTimeout(checkHeader, 100);
                }
            };
            checkHeader();
        });
    }

    /**
     * Carga el modal del carrito dinámicamente
     */
    async loadCartModal() {
        if (this.isModalLoaded) return;

        try {
            const timestamp = new Date().getTime();
            const modalUrl = `${this.baseUrl}components/cart-modal.html?v=${timestamp}`;
            console.log('📦 Loading cart modal from:', modalUrl);
            
            const response = await fetch(modalUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            let modalHtml = await response.text();
            
            // Reemplazar placeholders
            const tiendaUrl = `${this.baseUrl}tienda.html`;
            modalHtml = modalHtml.replace(/{{TIENDA_URL}}/g, tiendaUrl);
            
            // Insertar modal en el body
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHtml;
            document.body.appendChild(modalContainer);
            
            this.isModalLoaded = true;
            console.log('✅ Cart modal loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading cart modal:', error);
            this.createFallbackModal();
        }
    }

    /**
     * Crea un modal básico si falla la carga del componente
     */
    createFallbackModal() {
        const fallbackModal = `
            <div id="cartModal" class="cart-modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000;">
                <div style="background: white; margin: 50px auto; padding: 20px; max-width: 500px; border-radius: 10px;">
                    <h2>🛒 Mi Carrito</h2>
                    <div id="cartItemsContainer">Carrito en desarrollo...</div>
                    <button id="closeCartModal" style="margin-top: 20px; padding: 10px 20px;">Cerrar</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', fallbackModal);
        this.isModalLoaded = true;
        console.log('⚠️ Using fallback cart modal');
    }

    /**
     * Inicializa todos los event listeners
     */
    initializeEventListeners() {
        // Event listener para abrir carrito (delegado)
        document.addEventListener('click', (e) => {
            // Abrir carrito
            if (e.target.closest('.cart-icon, .cart-btn')) {
                e.preventDefault();
                this.openCart();
            }
            
            // Cerrar carrito
            if (e.target.closest('#closeCartModal, .cart-modal-close')) {
                this.closeCart();
            }
            
            // Click fuera del modal para cerrar
            if (e.target.classList.contains('cart-modal-overlay')) {
                this.closeCart();
            }
            
            // Botones del carrito
            if (e.target.closest('#clearCartBtn')) {
                this.clearCart();
            }
            
            if (e.target.closest('#checkoutBtn')) {
                this.proceedToCheckout();
            }
            
            // Controles de cantidad
            if (e.target.closest('.cart-qty-btn')) {
                e.preventDefault();
                const button = e.target.closest('.cart-qty-btn');
                const isIncrease = button.classList.contains('cart-qty-increase');
                const itemId = button.dataset.itemId;
                
                console.log(`🔢 Quantity button clicked: ${isIncrease ? 'increase' : 'decrease'} for item ${itemId}`);
                
                if (isIncrease) {
                    this.increaseQuantityByItemId(itemId);
                } else {
                    this.decreaseQuantityByItemId(itemId);
                }
            }
            
            // Eliminar item
            if (e.target.closest('.cart-remove-btn')) {
                e.preventDefault();
                const button = e.target.closest('.cart-remove-btn');
                const itemId = button.dataset.itemId;
                console.log(`🗑️ Remove button clicked for item ${itemId}`);
                this.removeItemByItemId(itemId);
            }
        });

        // Event listener para cambios en input de cantidad
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('cart-qty-input')) {
                const itemId = e.target.dataset.itemId;
                const quantity = parseInt(e.target.value) || 1;
                
                console.log(`🔢 Input quantity changed for item ${itemId}: ${quantity}`);
                
                const item = this.cart.find(item => (item.id || item.productId) === itemId);
                if (item) {
                    item.quantity = Math.max(1, quantity);
                    this.saveCart();
                    this.updateCartCounter();
                    this.renderCartItems();
                    console.log(`📝 Updated quantity via input for ${itemId}: ${quantity}`);
                }
            }
        });

        console.log('🎯 Cart event listeners initialized');
    }

    /**
     * Carga el carrito desde localStorage
     */
    loadCart() {
        try {
            const cartData = localStorage.getItem('artesana_cart');
            this.cart = cartData ? JSON.parse(cartData) : [];
            console.log(`📦 Cart loaded: ${this.cart.length} items`);
        } catch (error) {
            console.error('❌ Error loading cart:', error);
            this.cart = [];
        }
    }

    /**
     * Guarda el carrito en localStorage
     */
    saveCart() {
        try {
            localStorage.setItem('artesana_cart', JSON.stringify(this.cart));
            console.log(`💾 Cart saved: ${this.cart.length} items`);
        } catch (error) {
            console.error('❌ Error saving cart:', error);
        }
    }

    /**
     * Agrega un producto al carrito
     */
    addItem(productId, variantId = null, quantity = 1, productData = {}) {
        const cartKey = variantId ? `${productId}-${variantId}` : productId.toString();
        
        // Buscar si el item ya existe
        const existingItemIndex = this.cart.findIndex(item => 
            item.cartKey === cartKey
        );

        if (existingItemIndex >= 0) {
            // Actualizar cantidad del item existente
            this.cart[existingItemIndex].quantity += quantity;
        } else {
            // Agregar nuevo item
            const newItem = {
                cartKey: cartKey,
                id: productData.id || productId, // Asegurar que id esté disponible
                productId: productId,
                variantId: variantId,
                name: productData.name || `Producto ${productId}`,
                price: productData.price || 0,
                image: productData.image || '',
                quantity: quantity,
                variant: productData.variant || null
            };
            
            console.log(`📋 Creating new cart item:`, {
                id: newItem.id,
                productId: newItem.productId,
                name: newItem.name
            });
            
            this.cart.push(newItem);
        }

        this.saveCart();
        this.updateCartCounter();
        
        console.log(`✅ Added to cart: ${productData.name || productId} (Qty: ${quantity})`);
        
        return {
            success: true,
            message: 'Producto agregado al carrito',
            cart: this.cart
        };
    }

    /**
     * Elimina un item del carrito
     */
    removeItem(productId, variantId = null) {
        const cartKey = variantId ? `${productId}-${variantId}` : productId.toString();
        
        const initialLength = this.cart.length;
        this.cart = this.cart.filter(item => item.cartKey !== cartKey);
        
        if (this.cart.length < initialLength) {
            this.saveCart();
            this.updateCartCounter();
            this.renderCartItems();
            console.log(`🗑️ Item removed from cart: ${cartKey}`);
        }
    }

    /**
     * Actualiza la cantidad de un item
     */
    updateQuantity(productId, variantId = null, quantity) {
        const cartKey = variantId ? `${productId}-${variantId}` : productId.toString();
        
        const item = this.cart.find(item => item.cartKey === cartKey);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveCart();
            this.updateCartCounter();
            this.renderCartItems();
            console.log(`📝 Updated quantity for ${cartKey}: ${quantity}`);
        }
    }

    /**
     * Incrementa la cantidad de un item
     */
    increaseQuantity(productId, variantId = null) {
        const cartKey = variantId ? `${productId}-${variantId}` : productId.toString();
        const item = this.cart.find(item => item.cartKey === cartKey);
        if (item) {
            this.updateQuantity(productId, variantId, item.quantity + 1);
        }
    }

    /**
     * Decrementa la cantidad de un item
     */
    decreaseQuantity(productId, variantId = null) {
        const cartKey = variantId ? `${productId}-${variantId}` : productId.toString();
        const item = this.cart.find(item => item.cartKey === cartKey);
        if (item && item.quantity > 1) {
            this.updateQuantity(productId, variantId, item.quantity - 1);
        }
    }

    /**
     * Vacía el carrito completamente
     */
    clearCart() {
        if (this.cart.length === 0) return;
        
        if (confirm('¿Estás seguro de que quieres vaciar tu carrito?')) {
            this.cart = [];
            this.saveCart();
            this.updateCartCounter();
            this.renderCartItems();
            console.log('🧹 Cart cleared');
        }
    }
    
    /**
     * Elimina un item del carrito por itemId
     */
    removeItemByItemId(itemId) {
        const initialLength = this.cart.length;
        this.cart = this.cart.filter(item => (item.id || item.productId) !== itemId);
        
        if (this.cart.length < initialLength) {
            this.saveCart();
            this.updateCartCounter();
            this.renderCartItems();
            console.log(`🗑️ Item removed from cart: ${itemId}`);
        }
    }
    
    /**
     * Incrementa la cantidad de un item por itemId
     */
    increaseQuantityByItemId(itemId) {
        console.log(`🔎 Searching for item with ID: ${itemId}`);
        console.log(`📦 Current cart:`, this.cart.map(item => ({ 
            id: item.id, 
            productId: item.productId, 
            name: item.name,
            searchKey: item.id || item.productId 
        })));
        
        const item = this.cart.find(item => (item.id || item.productId) === itemId);
        if (item) {
            item.quantity += 1;
            this.saveCart();
            this.updateCartCounter();
            this.renderCartItems();
            console.log(`➕ Increased quantity for ${itemId}: ${item.quantity}`);
        } else {
            console.error(`❌ Item not found with ID: ${itemId}`);
        }
    }
    
    /**
     * Decrementa la cantidad de un item por itemId
     */
    decreaseQuantityByItemId(itemId) {
        const item = this.cart.find(item => (item.id || item.productId) === itemId);
        if (item && item.quantity > 1) {
            item.quantity -= 1;
            this.saveCart();
            this.updateCartCounter();
            this.renderCartItems();
            console.log(`➖ Decreased quantity for ${itemId}: ${item.quantity}`);
        }
    }

    /**
     * Obtiene el carrito actual
     */
    getCart() {
        return this.cart;
    }

    /**
     * Calcula el total del carrito
     */
    getCartTotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    /**
     * Obtiene el número total de items
     */
    getCartItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    /**
     * Actualiza el contador del carrito en el header
     */
    updateCartCounter() {
        const totalItems = this.getCartItemCount();
        
        // Actualizar contador principal
        const cartCountElement = document.getElementById('cartCount');
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
            cartCountElement.style.display = totalItems > 0 ? 'flex' : 'none';
        }
        
        // Actualizar otros contadores
        const altCounters = document.querySelectorAll('.cart-counter, .cart-count');
        altCounters.forEach(counter => {
            if (counter.id !== 'cartCount') {
                counter.textContent = totalItems;
                counter.style.display = totalItems > 0 ? 'flex' : 'none';
            }
        });
        
        console.log(`🛒 Cart counter updated: ${totalItems} items`);
    }

    /**
     * Abre el modal del carrito
     */
    openCart() {
        console.log('🔍 Attempting to open cart modal...');
        const modal = document.getElementById('cartModal');
        console.log('🖼️ Modal element:', modal);
        
        if (modal) {
            console.log('📦 Current modal display:', window.getComputedStyle(modal).display);
            console.log('📦 Current modal classes:', modal.className);
            
            this.renderCartItems();
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevenir scroll
            
            console.log('📦 After adding active class:', modal.className);
            console.log('📦 After adding active display:', window.getComputedStyle(modal).display);
            console.log('✅ Cart modal opened successfully');
        } else {
            console.error('❌ Cart modal not found in DOM');
            console.log('🔍 Available elements with "Modal" in ID:');
            const allElements = document.querySelectorAll('[id*="Modal"], [id*="modal"]');
            allElements.forEach(el => console.log(`  - ${el.id}: ${el.tagName}`));
        }
    }

    /**
     * Cierra el modal del carrito
     */
    closeCart() {
        const modal = document.getElementById('cartModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Restaurar scroll
            console.log('📁 Cart modal closed');
        }
    }

    /**
     * Renderiza los items del carrito en el modal
     */
    renderCartItems() {
        const emptyState = document.getElementById('emptyCartState');
        const itemsContainer = document.getElementById('cartItemsContainer');
        const cartSubtotal = document.getElementById('cartSubtotal');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!itemsContainer) return;

        if (this.cart.length === 0) {
            // Mostrar estado vacío
            if (emptyState) emptyState.style.display = 'block';
            itemsContainer.classList.remove('has-items');
            if (cartSubtotal) cartSubtotal.textContent = '$0.00';
            if (cartTotal) cartTotal.textContent = '$0.00';
            return;
        }

        // Ocultar estado vacío y mostrar items
        if (emptyState) emptyState.style.display = 'none';
        itemsContainer.classList.add('has-items');

        // Renderizar items
        const itemsHTML = this.cart.map(item => this.renderCartItem(item)).join('');
        itemsContainer.innerHTML = itemsHTML;

        // Actualizar totales
        const total = this.getCartTotal();
        if (cartSubtotal) cartSubtotal.textContent = this.formatPrice(total);
        if (cartTotal) cartTotal.textContent = this.formatPrice(total);
    }

    /**
     * Renderiza un item individual del carrito
     */
    renderCartItem(item) {
        const variantText = item.variant ? ` - ${item.variant.name || 'Variante'}` : '';
        const imageUrl = item.image || `${this.baseUrl}assets/images/placeholder-product.jpg`;
        const itemId = item.id || item.productId;
        
        console.log(`🎨 Rendering cart item:`, {
            itemObject: item,
            calculatedItemId: itemId,
            itemId_field: item.id,
            productId_field: item.productId
        });
        
        return `
            <div class="cart-item" data-item-id="${itemId}" data-variant-id="${item.variantId || ''}">
                <div class="cart-item-image">
                    <img src="${imageUrl}" alt="${item.name}" onerror="this.src='${this.baseUrl}assets/images/placeholder-product.jpg'">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}${variantText}</div>
                    ${item.variant ? `<div class="cart-item-variant">${this.formatVariantDetails(item.variant)}</div>` : ''}
                    <div class="cart-item-price">${this.formatPrice(item.price)} c/u</div>
                </div>
                <div class="cart-item-controls">
                    <div class="cart-quantity-controls">
                        <button class="cart-qty-btn cart-qty-decrease" data-item-id="${itemId}" ${item.quantity <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" class="cart-qty-input" data-item-id="${itemId}" value="${item.quantity}" min="1" max="99">
                        <button class="cart-qty-btn cart-qty-increase" data-item-id="${itemId}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="cart-remove-btn" data-item-id="${itemId}" title="Eliminar producto">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Formatea los detalles de la variante
     */
    formatVariantDetails(variant) {
        const details = [];
        if (variant.color) details.push(`Color: ${variant.color}`);
        if (variant.size) details.push(`Talla: ${variant.size}`);
        if (variant.material) details.push(`Material: ${variant.material}`);
        return details.join(' • ');
    }

    /**
     * Formatea un precio como moneda
     */
    formatPrice(price) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(price);
    }

    /**
     * Procede al checkout
     */
    proceedToCheckout() {
        if (this.cart.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }
        
        console.log('🛒 Proceeding to checkout...');
        
        // Por ahora, simplemente loggeamos el carrito
        console.log('Cart contents:', this.cart);
        alert('Función de checkout en desarrollo. Revisa la consola para ver el contenido del carrito.');
        
        // TODO: Implementar página de checkout real
        // window.location.href = `${this.baseUrl}checkout.html`;
    }
}

// Crear instancia global del carrito
window.universalCart = new UniversalCart();

// También crear alias para fácil acceso
window.UniversalCart = {
    addItem: (productData) => {
        const result = window.universalCart.addItem(
            productData.id || productData.productId,
            productData.variantId,
            productData.quantity || 1,
            productData
        );
        return result.success;
    },
    showModal: () => window.universalCart.openCart(),
    hideModal: () => window.universalCart.closeCart(),
    clearCart: () => window.universalCart.clearCart(),
    getCart: () => window.universalCart.getCart(),
    updateCartCounter: () => window.universalCart.updateCartCounter(),
    
    // Debug functions (temporary)
    addTestItem: () => {
        console.log('🧪 Adding test item to cart...');
        const testId = `test-${Date.now()}`;
        const success = window.UniversalCart.addItem({
            id: testId,
            productId: testId, // Asegurar que ambos estén disponibles
            name: 'Producto de Prueba',
            price: 299.99,
            image: 'assets/images/placeholder-product.jpg',
            quantity: 1
        });
        console.log(`🧪 Test item added with ID: ${testId}`);
        return success;
    },
    debug: () => {
        console.log('🔍 Cart Debug Info:');
        console.log('- Cart instance:', window.universalCart);
        console.log('- Modal loaded:', window.universalCart.isModalLoaded);
        console.log('- Base URL:', window.universalCart.baseUrl);
        console.log('- Cart items:', window.universalCart.cart);
        console.log('- Modal element:', document.getElementById('cartModal'));
    },
    
    forceReset: () => {
        console.log('🧿 Force resetting cart...');
        // Limpiar localStorage completamente
        localStorage.removeItem('artesana_cart');
        // Limpiar instancia del carrito
        window.universalCart.cart = [];
        window.universalCart.updateCartCounter();
        window.universalCart.renderCartItems();
        console.log('✅ Cart completely reset');
    }
};

// También exportar para compatibilidad
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalCart;
}

console.log('🚀 Universal Cart script loaded');

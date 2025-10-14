/**
 * CART UI CONTROLLER - ESTUDIO ARTESANA
 * ====================================
 * Manages the cart sidebar/modal user interface and interactions
 */

class CartUI {
    constructor() {
        this.isOpen = false;
        this.cartManager = null;
        this.cartData = null;
        this.baseUrl = this.detectBaseUrl();

        // Animation settings
        this.animationDuration = 300;

        console.log('🛒 CartUI inicializado');

        // Wait for CartManager to be available
        this.waitForCartManager().then(() => {
            this.initialize();
        });
    }

    /**
     * Detect the correct base URL for loading components
     */
    detectBaseUrl() {
        const currentPath = window.location.pathname;

        // Count directory depth to determine base path
        if (currentPath.includes('/sobre-nosotros/') ||
            currentPath.includes('/mayoristas/')) {
            return '../../';
        } else if (currentPath.includes('/admin/')) {
            return '../';
        } else {
            return './';
        }
    }

    /**
     * Wait for CartManager to be available
     */
    async waitForCartManager() {
        return new Promise((resolve) => {
            const checkCartManager = () => {
                if (window.cartManager) {
                    this.cartManager = window.cartManager;
                    resolve();
                } else {
                    setTimeout(checkCartManager, 100);
                }
            };
            checkCartManager();
        });
    }

    /**
     * Initialize cart UI
     */
    async initialize() {
        try {
            console.log('🎨 Inicializando Cart UI...');

            // Load cart sidebar template
            await this.loadCartSidebar();

            // Set up event listeners
            this.setupEventListeners();

            // Subscribe to cart changes
            this.subscribeToCartChanges();

            // Initial cart data load
            this.updateCartUI(this.cartManager.getCartSummary());

            console.log('✅ Cart UI inicializado correctamente');

        } catch (error) {
            console.error('❌ Error inicializando Cart UI:', error);
        }
    }

    /**
     * Load cart sidebar template and inject into DOM
     */
    async loadCartSidebar() {
        try {
            const response = await fetch(`${this.baseUrl}components/cart-sidebar.html`);

            if (!response.ok) {
                throw new Error(`Error loading cart sidebar: ${response.status}`);
            }

            const cartSidebarHtml = await response.text();

            // Inject cart sidebar into body
            document.body.insertAdjacentHTML('beforeend', cartSidebarHtml);

            console.log('✅ Cart sidebar template cargado');

        } catch (error) {
            console.error('❌ Error cargando cart sidebar template:', error);
            // Create fallback cart sidebar
            this.createFallbackCartSidebar();
        }
    }

    /**
     * Create a basic fallback cart sidebar if template loading fails
     */
    createFallbackCartSidebar() {
        const fallbackHtml = `
            <div id="cartSidebarOverlay" class="cart-overlay">
                <div id="cartSidebar" class="cart-sidebar">
                    <div class="cart-header">
                        <h3>Mi Carrito</h3>
                        <button id="closeCartBtn">&times;</button>
                    </div>
                    <div class="cart-content">
                        <div id="cartEmpty" class="cart-empty">
                            <p>Tu carrito está vacío</p>
                        </div>
                        <div id="cartItems" class="cart-items" style="display: none;"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', fallbackHtml);
        console.log('⚠️ Using fallback cart sidebar');
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Cart icon click (open cart)
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCart();
            });
        }

        // Close cart button
        const closeCartBtn = document.getElementById('closeCartBtn');
        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', () => this.closeCart());
        }

        // Overlay click (close cart)
        const overlay = document.getElementById('cartSidebarOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeCart();
                }
            });
        }

        // Continue shopping buttons
        const continueShoppingBtns = document.querySelectorAll('#continueShoppingBtn, #continueShoppingFooterBtn');
        continueShoppingBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeCart());
        });

        // Proceed to checkout button
        const checkoutBtn = document.getElementById('proceedToCheckoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.proceedToCheckout());
        }

        // Retry button
        const retryBtn = document.getElementById('retryCartBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retryLoadCart());
        }

        // ESC key to close cart
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeCart();
            }
        });

        console.log('🎛️ Cart UI event listeners configurados');
    }

    /**
     * Subscribe to cart changes from CartManager
     */
    subscribeToCartChanges() {
        if (this.cartManager) {
            this.cartManager.onCartChange((cartData) => {
                console.log('🔄 Cart data updated:', cartData);
                this.updateCartUI(cartData);
            });
        }
    }

    /**
     * Open cart sidebar
     */
    openCart() {
        const overlay = document.getElementById('cartSidebarOverlay');
        const sidebar = document.getElementById('cartSidebar');

        if (overlay && sidebar) {
            this.isOpen = true;

            // Show overlay
            overlay.classList.add('active');

            // Animate sidebar
            sidebar.classList.add('open');

            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Update cart data
            if (this.cartManager) {
                this.updateCartUI(this.cartManager.getCartSummary());
            }

            console.log('🛒 Carrito abierto');
        }
    }

    /**
     * Close cart sidebar
     */
    closeCart() {
        const overlay = document.getElementById('cartSidebarOverlay');
        const sidebar = document.getElementById('cartSidebar');

        if (overlay && sidebar && this.isOpen) {
            this.isOpen = false;

            // Animate sidebar close
            sidebar.classList.remove('open');

            // Hide overlay after animation
            setTimeout(() => {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }, this.animationDuration);

            console.log('🛒 Carrito cerrado');
        }
    }

    /**
     * Update cart UI with new data
     */
    updateCartUI(cartData) {
        this.cartData = cartData;

        // Update cart counter in header
        this.updateCartCounter(cartData.totals.items_count);

        // Update cart content
        if (cartData.items.length === 0) {
            this.showEmptyCart();
        } else {
            this.showCartItems(cartData);
        }

        // Update totals
        this.updateCartTotals(cartData.totals);
    }

    /**
     * Update cart counter in header
     */
    updateCartCounter(itemCount) {
        const cartCounters = document.querySelectorAll('.cart-count, .cart-counter, [data-cart-count]');

        cartCounters.forEach(counter => {
            counter.textContent = itemCount;

            // Show/hide counter based on items
            if (itemCount > 0) {
                counter.style.display = '';
                counter.classList.add('has-items');
            } else {
                counter.style.display = 'none';
                counter.classList.remove('has-items');
            }
        });
    }

    /**
     * Show empty cart state
     */
    showEmptyCart() {
        const cartEmpty = document.getElementById('cartEmpty');
        const cartItems = document.getElementById('cartItems');
        const cartSummary = document.getElementById('cartSummary');
        const cartFooter = document.getElementById('cartFooter');
        const cartLoading = document.getElementById('cartLoading');

        if (cartLoading) cartLoading.style.display = 'none';
        if (cartEmpty) cartEmpty.style.display = 'block';
        if (cartItems) cartItems.style.display = 'none';
        if (cartSummary) cartSummary.style.display = 'none';
        if (cartFooter) cartFooter.style.display = 'none';
    }

    /**
     * Show cart items
     */
    showCartItems(cartData) {
        const cartEmpty = document.getElementById('cartEmpty');
        const cartItems = document.getElementById('cartItems');
        const cartSummary = document.getElementById('cartSummary');
        const cartFooter = document.getElementById('cartFooter');
        const cartLoading = document.getElementById('cartLoading');

        if (cartLoading) cartLoading.style.display = 'none';
        if (cartEmpty) cartEmpty.style.display = 'none';
        if (cartItems) cartItems.style.display = 'block';
        if (cartSummary) cartSummary.style.display = 'block';
        if (cartFooter) cartFooter.style.display = 'flex';

        // Render cart items
        this.renderCartItems(cartData.items);
    }

    /**
     * Render cart items
     */
    renderCartItems(items) {
        const cartItemsContainer = document.getElementById('cartItems');
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = '';

        items.forEach(item => {
            const itemElement = this.createCartItemElement(item);
            cartItemsContainer.appendChild(itemElement);
        });
    }

    /**
     * Create cart item DOM element
     */
    createCartItemElement(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.setAttribute('data-product-id', item.product_id);
        itemDiv.setAttribute('data-variant-id', item.variant_id || '');

        const productName = item.product_snapshot?.name || 'Producto';
        const productImage = item.product_snapshot?.image || 'assets/images/placeholder-product.jpg';
        const variantName = item.variant_id ? ` - ${item.variant_id}` : '';

        itemDiv.innerHTML = `
            <div class="item-image">
                <img src="${productImage}" alt="${productName}" loading="lazy">
            </div>
            <div class="item-details">
                <h4 class="item-name">${productName}</h4>
                ${variantName ? `<p class="item-variant">${variantName}</p>` : ''}
                <div class="item-price">
                    <span class="unit-price">${this.formatPrice(item.unit_price)}</span>
                    <span class="tax-note">IVA incluido</span>
                </div>
            </div>
            <div class="item-quantity">
                <button class="quantity-btn decrease-btn" type="button">
                    <i class="fas fa-minus"></i>
                </button>
                <input type="number" class="quantity-input" min="1" max="99" value="${item.quantity}" readonly>
                <button class="quantity-btn increase-btn" type="button">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="item-total">${this.formatPrice(item.total_price)}</div>
            <button class="item-remove" type="button">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;

        // Add event listeners to item
        this.attachItemEventListeners(itemDiv, item);

        return itemDiv;
    }

    /**
     * Attach event listeners to cart item
     */
    attachItemEventListeners(itemElement, item) {
        const decreaseBtn = itemElement.querySelector('.decrease-btn');
        const increaseBtn = itemElement.querySelector('.increase-btn');
        const removeBtn = itemElement.querySelector('.item-remove');

        // Decrease quantity
        decreaseBtn.addEventListener('click', () => {
            const newQuantity = Math.max(1, item.quantity - 1);
            this.updateItemQuantity(item.product_id, item.variant_id, newQuantity);
        });

        // Increase quantity
        increaseBtn.addEventListener('click', () => {
            const newQuantity = item.quantity + 1;
            this.updateItemQuantity(item.product_id, item.variant_id, newQuantity);
        });

        // Remove item
        removeBtn.addEventListener('click', () => {
            this.removeItem(item.product_id, item.variant_id);
        });
    }

    /**
     * Update item quantity with stock validation
     */
    async updateItemQuantity(productId, variantId, newQuantity) {
        if (this.cartManager) {
            // Validate stock before updating
            if (window.stockValidator && newQuantity > 0) {
                const stockCheck = await window.stockValidator.checkVariantStock(variantId, newQuantity);

                if (!stockCheck.hasStock) {
                    const stockMsg = window.stockValidator.getStockMessage(stockCheck.availableStock, newQuantity);
                    this.showNotification(stockMsg.message, 'error');

                    // If no stock at all, don't update
                    if (stockCheck.availableStock === 0) {
                        return;
                    }

                    // Otherwise, update to max available
                    newQuantity = stockCheck.availableStock;
                }
            }

            const result = await this.cartManager.updateQuantity(productId, variantId, newQuantity);

            if (result.success) {
                this.showNotification('Cantidad actualizada', 'success');
                // Refresh cart display to show any stock warnings
                this.updateCartUI(this.cartManager.getCartSummary());
            } else {
                this.showNotification('Error actualizando cantidad', 'error');
            }
        }
    }

    /**
     * Remove item from cart
     */
    async removeItem(productId, variantId) {
        if (this.cartManager) {
            const result = await this.cartManager.removeProduct(productId, variantId);

            if (result.success) {
                this.showNotification('Producto eliminado', 'success');
            } else {
                this.showNotification('Error eliminando producto', 'error');
            }
        }
    }

    /**
     * Update cart totals display
     */
    updateCartTotals(totals) {
        const subtotalElement = document.getElementById('cartSubtotal');
        const taxElement = document.getElementById('cartTax');
        const totalElement = document.getElementById('cartTotal');

        if (subtotalElement) subtotalElement.textContent = this.formatPrice(totals.subtotal);
        if (taxElement) taxElement.textContent = this.formatPrice(totals.tax);
        if (totalElement) totalElement.textContent = this.formatPrice(totals.total);
    }

    /**
     * Format price with currency
     */
    formatPrice(price) {
        if (!price) return '$0.00';

        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) return '$0.00';

        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(numPrice);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `cart-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
            </div>
            <div class="notification-content">
                <p>${message}</p>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Style notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10001;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease;
        `;

        // Add to DOM
        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
        }
    }

    /**
     * Proceed to checkout
     */
    proceedToCheckout() {
        if (this.cartData && this.cartData.items.length > 0) {
            // Navigate to checkout page
            window.location.href = `${this.baseUrl}checkout.html`;
        } else {
            this.showNotification('Tu carrito está vacío', 'info');
        }
        console.log('🛒 Procediendo al checkout...');
    }

    /**
     * Retry loading cart
     */
    retryLoadCart() {
        if (this.cartManager) {
            this.updateCartUI(this.cartManager.getCartSummary());
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        const cartLoading = document.getElementById('cartLoading');
        const cartEmpty = document.getElementById('cartEmpty');
        const cartItems = document.getElementById('cartItems');

        if (cartLoading) cartLoading.style.display = 'block';
        if (cartEmpty) cartEmpty.style.display = 'none';
        if (cartItems) cartItems.style.display = 'none';
    }

    /**
     * Show error state
     */
    showError(message) {
        const cartError = document.getElementById('cartError');
        const cartErrorMessage = document.getElementById('cartErrorMessage');
        const cartLoading = document.getElementById('cartLoading');
        const cartItems = document.getElementById('cartItems');
        const cartEmpty = document.getElementById('cartEmpty');

        if (cartError) cartError.style.display = 'block';
        if (cartErrorMessage) cartErrorMessage.textContent = message;
        if (cartLoading) cartLoading.style.display = 'none';
        if (cartItems) cartItems.style.display = 'none';
        if (cartEmpty) cartEmpty.style.display = 'none';
    }
}

// Initialize CartUI when DOM is ready
let cartUI;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        cartUI = new CartUI();
        window.cartUI = cartUI;
    });
} else {
    cartUI = new CartUI();
    window.cartUI = cartUI;
}

console.log('🛒 Cart UI script cargado');
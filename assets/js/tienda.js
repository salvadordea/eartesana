/**
 * Tienda JavaScript - Estudio Artesana
 * Handles shop functionality with WooCommerce integration
 */

class EstudioArtesanaTienda {
    constructor() {
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.totalProducts = 0;
        this.totalPages = 1;
        this.isLoading = false;
        this.currentFilters = {
            search: '',
            category: null,
            minPrice: null,
            maxPrice: null,
            onSale: false,
            featured: false,
            inStock: true,
            orderby: 'date',
            order: 'desc'
        };
        
        this.products = [];
        this.categories = [];
        this.cartItems = this.loadCartFromStorage();
        
        this.init();
    }
    
    init() {
        this.initializeElements();
        this.bindEvents();
        this.loadCategories();
        this.loadProducts();
        this.updateCartCount();
    }
    
    initializeElements() {
        // Main elements
        this.productsGrid = document.getElementById('productsGrid');
        this.productsLoading = document.getElementById('productsLoading');
        this.productsResults = document.getElementById('productsResults');
        this.pagination = document.getElementById('pagination');
        this.noResults = document.getElementById('noResults');
        this.apiError = document.getElementById('apiError');
        
        // Filter elements
        this.categoryFilters = document.getElementById('categoryFilters');
        this.productSearch = document.getElementById('productSearch');
        this.searchBtn = document.getElementById('searchBtn');
        this.minPrice = document.getElementById('minPrice');
        this.maxPrice = document.getElementById('maxPrice');
        this.applyPriceFilter = document.getElementById('applyPriceFilter');
        this.onSaleFilter = document.getElementById('onSaleFilter');
        this.featuredFilter = document.getElementById('featuredFilter');
        this.inStockFilter = document.getElementById('inStockFilter');
        this.clearFilters = document.getElementById('clearFilters');
        
        // Control elements
        this.sortProducts = document.getElementById('sortProducts');
        this.viewBtns = document.querySelectorAll('.view-btn');
        this.currentPageSpan = document.getElementById('currentPage');
        this.totalPagesSpan = document.getElementById('totalPages');
        this.cartCount = document.getElementById('cartCount');
        
        // Results elements
        this.resetSearch = document.getElementById('resetSearch');
        this.retryLoad = document.getElementById('retryLoad');
    }
    
    bindEvents() {
        // Search events
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.productSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // Price filter
        this.applyPriceFilter.addEventListener('click', () => this.handlePriceFilter());
        
        // Special filters
        this.onSaleFilter.addEventListener('change', () => this.handleSpecialFilters());
        this.featuredFilter.addEventListener('change', () => this.handleSpecialFilters());
        this.inStockFilter.addEventListener('change', () => this.handleSpecialFilters());
        
        // Clear filters
        this.clearFilters.addEventListener('click', () => this.handleClearFilters());
        
        // Sort dropdown
        this.sortProducts.addEventListener('change', () => this.handleSort());
        
        // View toggle
        this.viewBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleViewToggle(btn));
        });
        
        // Reset and retry buttons
        this.resetSearch?.addEventListener('click', () => this.handleResetSearch());
        this.retryLoad?.addEventListener('click', () => this.loadProducts());
    }
    
    // API Integration Methods
    
    async loadCategories() {
        try {
            this.categories = await window.WooAPI.getCategories({
                hide_empty: true,
                per_page: 50
            });
            this.renderCategories();
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categoryFilters.innerHTML = '<div class="filter-loading">Error cargando categorías</div>';
        }
    }
    
    async loadProducts(page = 1) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentPage = page;
        this.showLoading();
        
        try {
            const options = {
                page: this.currentPage,
                per_page: this.productsPerPage,
                ...this.currentFilters
            };
            
            // Map sort options
            const sortMap = {
                'date-desc': { orderby: 'date', order: 'desc' },
                'date-asc': { orderby: 'date', order: 'asc' },
                'price-asc': { orderby: 'price', order: 'asc' },
                'price-desc': { orderby: 'price', order: 'desc' },
                'title-asc': { orderby: 'title', order: 'asc' },
                'title-desc': { orderby: 'title', order: 'desc' },
                'popularity': { orderby: 'popularity', order: 'desc' }
            };
            
            const sortValue = this.sortProducts.value;
            if (sortMap[sortValue]) {
                options.orderby = sortMap[sortValue].orderby;
                options.order = sortMap[sortValue].order;
            }
            
            this.products = await window.WooAPI.getProducts(options);
            
            // Simulate total count (WooCommerce API doesn't return total by default)
            // In a real implementation, you might need to make additional API calls
            this.totalProducts = this.products.length;
            this.totalPages = Math.ceil(this.totalProducts / this.productsPerPage);
            
            this.renderProducts();
            this.renderPagination();
            this.updateResults();
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError();
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    // Rendering Methods
    
    renderCategories() {
        if (!this.categories || this.categories.length === 0) {
            this.categoryFilters.innerHTML = '<div class="filter-loading">No hay categorías</div>';
            return;
        }
        
        let html = `
            <div class="category-filter ${!this.currentFilters.category ? 'active' : ''}" data-category="">
                <span>Todas las categorías</span>
                <span class="category-count">${this.totalProducts}</span>
            </div>
        `;
        
        this.categories.forEach(category => {
            const isActive = this.currentFilters.category === category.id ? 'active' : '';
            html += `
                <div class="category-filter ${isActive}" data-category="${category.id}">
                    <span>${category.name}</span>
                    <span class="category-count">${category.count || 0}</span>
                </div>
            `;
        });
        
        this.categoryFilters.innerHTML = html;
        
        // Bind category filter events
        this.categoryFilters.querySelectorAll('.category-filter').forEach(filter => {
            filter.addEventListener('click', () => this.handleCategoryFilter(filter));
        });
    }
    
    renderProducts() {
        if (!this.products || this.products.length === 0) {
            this.showNoResults();
            return;
        }
        
        const isListView = this.productsGrid.classList.contains('list-view');
        let html = '';
        
        this.products.forEach(product => {
            html += this.createProductCard(product, isListView);
        });
        
        this.productsGrid.innerHTML = html;
        this.hideStates();
        
        // Bind product events
        this.bindProductEvents();
    }
    
    createProductCard(product, isListView = false) {
        const image = window.WooAPI.getProductImage(product);
        const isOnSale = window.WooAPI.isOnSale(product);
        const isInStock = window.WooAPI.isInStock(product);
        const discountPercentage = window.WooAPI.getDiscountPercentage(product);
        
        // Get price
        const currentPrice = product.sale_price || product.price;
        const originalPrice = product.regular_price;
        const formattedCurrentPrice = window.WooAPI.formatPrice(currentPrice);
        const formattedOriginalPrice = isOnSale ? window.WooAPI.formatPrice(originalPrice) : '';
        
        // Get category name
        const categoryName = product.categories && product.categories.length > 0 
            ? product.categories[0].name 
            : 'Sin categoría';
        
        // Create badges
        let badges = '';
        if (isOnSale && discountPercentage > 0) {
            badges += `<div class="product-badge sale">-${discountPercentage}%</div>`;
        }
        if (product.featured) {
            badges += `<div class="product-badge featured">Destacado</div>`;
        }
        if (!isInStock) {
            badges += `<div class="product-badge out-of-stock">Agotado</div>`;
        }
        
        // Create rating stars (placeholder - WooCommerce API might not include ratings)
        const rating = Math.floor(Math.random() * 2) + 4; // Placeholder rating 4-5
        const ratingCount = Math.floor(Math.random() * 50) + 5; // Placeholder count
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<i class="fas fa-star star ${i <= rating ? 'filled' : ''}"></i>`;
        }
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${image}" alt="${product.name}" loading="lazy">
                    ${badges ? `<div class="product-badges">${badges}</div>` : ''}
                    <div class="product-actions">
                        <button class="product-action quick-view" title="Vista rápida" data-product-id="${product.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="product-action add-to-wishlist" title="Agregar a favoritos" data-product-id="${product.id}">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-category">${categoryName}</div>
                    <h3 class="product-title">
                        <a href="#" data-product-id="${product.id}">${product.name}</a>
                    </h3>
                    <div class="product-rating">
                        <div class="stars">${starsHtml}</div>
                        <span class="rating-count">(${ratingCount})</span>
                    </div>
                    <div class="product-price">
                        <span class="current-price">${formattedCurrentPrice}</span>
                        ${isOnSale ? `<span class="original-price">${formattedOriginalPrice}</span>` : ''}
                        ${isOnSale && discountPercentage > 0 ? `<span class="discount-percentage">-${discountPercentage}%</span>` : ''}
                    </div>
                    <button class="add-to-cart-btn" ${!isInStock ? 'disabled' : ''} data-product-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i>
                        ${isInStock ? 'Agregar al Carrito' : 'Agotado'}
                    </button>
                </div>
            </div>
        `;
    }
    
    bindProductEvents() {
        // Add to cart buttons
        this.productsGrid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', (e) => {
                    const productId = e.target.closest('[data-product-id]').dataset.productId;
                    this.addToCart(productId);
                });
            }
        });
        
        // Product links
        this.productsGrid.querySelectorAll('.product-title a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = e.target.dataset.productId;
                this.viewProduct(productId);
            });
        });
        
        // Quick view buttons
        this.productsGrid.querySelectorAll('.quick-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('[data-product-id]').dataset.productId;
                this.quickView(productId);
            });
        });
        
        // Wishlist buttons
        this.productsGrid.querySelectorAll('.add-to-wishlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('[data-product-id]').dataset.productId;
                this.addToWishlist(productId);
            });
        });
    }
    
    renderPagination() {
        if (this.totalPages <= 1) {
            this.pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // Previous button
        html += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i> Anterior
            </button>
        `;
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            html += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
            html += `<button class="pagination-btn" data-page="${this.totalPages}">${this.totalPages}</button>`;
        }
        
        // Next button
        html += `
            <button class="pagination-btn" ${this.currentPage === this.totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                Siguiente <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        this.pagination.innerHTML = html;
        
        // Bind pagination events
        this.pagination.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.closest('[data-page]').dataset.page);
                if (page && page !== this.currentPage) {
                    this.loadProducts(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    }
    
    // Event Handlers
    
    handleSearch() {
        this.currentFilters.search = this.productSearch.value.trim();
        this.currentPage = 1;
        this.loadProducts();
    }
    
    handleCategoryFilter(filterElement) {
        // Remove active class from all filters
        this.categoryFilters.querySelectorAll('.category-filter').forEach(f => {
            f.classList.remove('active');
        });
        
        // Add active class to clicked filter
        filterElement.classList.add('active');
        
        // Set filter
        const categoryId = filterElement.dataset.category;
        this.currentFilters.category = categoryId || null;
        this.currentPage = 1;
        this.loadProducts();
    }
    
    handlePriceFilter() {
        const min = parseFloat(this.minPrice.value) || null;
        const max = parseFloat(this.maxPrice.value) || null;
        
        this.currentFilters.minPrice = min;
        this.currentFilters.maxPrice = max;
        this.currentPage = 1;
        this.loadProducts();
    }
    
    handleSpecialFilters() {
        this.currentFilters.onSale = this.onSaleFilter.checked;
        this.currentFilters.featured = this.featuredFilter.checked;
        this.currentFilters.inStock = this.inStockFilter.checked;
        this.currentPage = 1;
        this.loadProducts();
    }
    
    handleClearFilters() {
        // Reset all filters
        this.currentFilters = {
            search: '',
            category: null,
            minPrice: null,
            maxPrice: null,
            onSale: false,
            featured: false,
            inStock: true,
            orderby: 'date',
            order: 'desc'
        };
        
        // Reset UI
        this.productSearch.value = '';
        this.minPrice.value = '';
        this.maxPrice.value = '';
        this.onSaleFilter.checked = false;
        this.featuredFilter.checked = false;
        this.inStockFilter.checked = true;
        this.sortProducts.value = 'date-desc';
        
        // Reset category filters
        this.categoryFilters.querySelectorAll('.category-filter').forEach(f => {
            f.classList.remove('active');
        });
        this.categoryFilters.querySelector('[data-category=""]')?.classList.add('active');
        
        this.currentPage = 1;
        this.loadProducts();
    }
    
    handleSort() {
        const sortValue = this.sortProducts.value;
        const [orderby, order] = sortValue.split('-');
        
        this.currentFilters.orderby = orderby;
        this.currentFilters.order = order || 'desc';
        this.currentPage = 1;
        this.loadProducts();
    }
    
    handleViewToggle(clickedBtn) {
        // Remove active class from all view buttons
        this.viewBtns.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        clickedBtn.classList.add('active');
        
        // Toggle grid view
        const view = clickedBtn.dataset.view;
        if (view === 'list') {
            this.productsGrid.classList.add('list-view');
        } else {
            this.productsGrid.classList.remove('list-view');
        }
    }
    
    handleResetSearch() {
        this.handleClearFilters();
    }
    
    // Cart Methods
    
    addToCart(productId) {
        const product = this.products.find(p => p.id == productId);
        if (!product) return;
        
        // Check if product already in cart
        const existingItem = this.cartItems.find(item => item.id == productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cartItems.push({
                id: product.id,
                name: product.name,
                price: product.sale_price || product.price,
                image: window.WooAPI.getProductImage(product),
                quantity: 1
            });
        }
        
        this.saveCartToStorage();
        this.updateCartCount();
        
        // Show success message
        this.showCartMessage(`${product.name} agregado al carrito`);
    }
    
    loadCartFromStorage() {
        try {
            const cart = localStorage.getItem('estudio_artesana_cart');
            return cart ? JSON.parse(cart) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    }
    
    saveCartToStorage() {
        try {
            localStorage.setItem('estudio_artesana_cart', JSON.stringify(this.cartItems));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }
    
    updateCartCount() {
        const totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
        if (this.cartCount) {
            this.cartCount.textContent = totalItems;
            this.cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }
    
    // Placeholder methods for future implementation
    
    viewProduct(productId) {
        console.log('View product:', productId);
        // TODO: Navigate to product page or show product details
    }
    
    quickView(productId) {
        console.log('Quick view product:', productId);
        // TODO: Show product quick view modal
    }
    
    addToWishlist(productId) {
        console.log('Add to wishlist:', productId);
        // TODO: Implement wishlist functionality
    }
    
    // UI State Methods
    
    showLoading() {
        this.productsLoading.style.display = 'flex';
        this.hideStates();
    }
    
    hideLoading() {
        this.productsLoading.style.display = 'none';
    }
    
    showNoResults() {
        this.noResults.style.display = 'block';
        this.hideStates();
    }
    
    showError() {
        this.apiError.style.display = 'block';
        this.hideStates();
    }
    
    hideStates() {
        this.noResults.style.display = 'none';
        this.apiError.style.display = 'none';
    }
    
    updateResults() {
        const resultsCount = document.querySelector('.results-count');
        const showing = Math.min(this.currentPage * this.productsPerPage, this.totalProducts);
        const start = ((this.currentPage - 1) * this.productsPerPage) + 1;
        
        if (resultsCount) {
            resultsCount.textContent = `Mostrando ${start}-${showing} de ${this.totalProducts} productos`;
        }
        
        if (this.currentPageSpan) {
            this.currentPageSpan.textContent = this.currentPage;
        }
        
        if (this.totalPagesSpan) {
            this.totalPagesSpan.textContent = this.totalPages;
        }
    }
    
    showCartMessage(message) {
        // Create and show temporary message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'cart-message';
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background-color: var(--secondary-color);
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set WooCommerce API credentials from config
    if (window.EstudioArtesanaConfig && window.EstudioArtesanaConfig.woocommerce) {
        window.WooAPI.setCredentials(
            window.EstudioArtesanaConfig.woocommerce.consumerKey,
            window.EstudioArtesanaConfig.woocommerce.consumerSecret
        );
        
        // Set base URL if different from current origin
        window.WooAPI.config.baseURL = window.EstudioArtesanaConfig.woocommerce.baseURL;
    }
    
    // Initialize the shop
    new EstudioArtesanaTienda();
});

// Add CSS animations for cart messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .pagination-ellipsis {
        padding: 10px 5px;
        color: var(--light-text);
    }
`;
document.head.appendChild(style);

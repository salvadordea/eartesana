/**
 * Featured Products Management for Modern Homepage - Estudio Artesana
 * Loads and displays featured products with modern card design
 */

class FeaturedProductsManager {
    constructor() {
        this.products = [];
        this.isLoading = false;
        this.maxProducts = 6;
        this.init();
    }
    
    init() {
        this.loadFeaturedProducts();
    }
    
    async loadFeaturedProducts() {
        if (this.isLoading) return;
        
        const loadingElement = document.getElementById('featuredProductsLoading');
        const gridElement = document.getElementById('featuredProductsGrid');
        
        if (!loadingElement || !gridElement) return;
        
        try {
            this.isLoading = true;
            this.showLoading();
            
            // Check if WooAPI is available
            if (!window.WooAPI) {
                console.warn('WooCommerce API not available');
                this.hideLoading();
                return;
            }
            
            // Try to load featured products first
            let products = await window.WooAPI.getProducts({
                featured: true,
                per_page: this.maxProducts,
                status: 'publish',
                orderby: 'date',
                order: 'desc'
            });
            
            // If no featured products, get recent products
            if (!products || products.length === 0) {
                console.log('No featured products found, loading recent products...');
                products = await window.WooAPI.getProducts({
                    per_page: this.maxProducts,
                    status: 'publish',
                    orderby: 'date',
                    order: 'desc'
                });
            }
            
            if (products && products.length > 0) {
                this.products = products;
                this.renderProducts();
            } else {
                this.showEmptyState();
            }
            
        } catch (error) {
            console.error('Error loading featured products:', error);
            this.showErrorState();
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    renderProducts() {
        const gridElement = document.getElementById('featuredProductsGrid');
        if (!gridElement) return;
        
        const productsHTML = this.products.map((product, index) => 
            this.createProductCard(product, index)
        ).join('');
        
        gridElement.innerHTML = productsHTML;
        
        // Add click event listeners
        this.bindProductEvents();
        
        // Add animation delays
        this.addAnimationDelays();
    }
    
    createProductCard(product, index) {
        const imageUrl = this.getProductImage(product);
        const price = this.formatPrice(product.price);
        const title = this.truncateText(product.name, 50);
        const description = this.truncateText(this.stripHtml(product.short_description), 80);
        
        // Create badges
        let badges = '';
        if (product.on_sale) {
            badges += '<div class="product-badge sale">Oferta</div>';
        }
        if (product.featured) {
            badges += '<div class="product-badge featured">Destacado</div>';
        }
        
        return `
            <div class="featured-product-card fade-in delay-${Math.min(index + 1, 4)}" 
                 data-product-id="${product.id}"
                 data-product-url="${this.getProductUrl(product.id)}">
                
                <div class="featured-product-image">
                    <img src="${imageUrl}" 
                         alt="${product.name}" 
                         loading="lazy"
                         onerror="this.src='${this.getPlaceholderImage()}'">
                    ${badges ? `<div class="product-badges">${badges}</div>` : ''}
                </div>
                
                <div class="featured-product-content">
                    <h3 class="featured-product-title">${title}</h3>
                    <div class="featured-product-price">${price}</div>
                    ${description ? `<p class="featured-product-description">${description}</p>` : ''}
                </div>
            </div>
        `;
    }
    
    bindProductEvents() {
        const productCards = document.querySelectorAll('.featured-product-card');
        
        productCards.forEach(card => {
            card.addEventListener('click', () => {
                const productUrl = card.dataset.productUrl;
                if (productUrl) {
                    window.location.href = productUrl;
                }
            });
            
            // Add hover effect class
            card.addEventListener('mouseenter', () => {
                card.classList.add('hovered');
            });
            
            card.addEventListener('mouseleave', () => {
                card.classList.remove('hovered');
            });
        });
    }
    
    addAnimationDelays() {
        const cards = document.querySelectorAll('.featured-product-card');
        cards.forEach((card, index) => {
            // Add progressive animation delays
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }
    
    getProductImage(product) {
        if (product.images && product.images.length > 0) {
            return product.images[0].src;
        }
        return this.getPlaceholderImage();
    }
    
    getPlaceholderImage() {
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#f8f8f8;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#e8e8e8;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#bg)"/>
                <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="16" fill="#999999" text-anchor="middle" font-weight="bold">
                    ESTUDIO ARTESANA
                </text>
                <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="12" fill="#666666" text-anchor="middle">
                    Imagen no disponible
                </text>
            </svg>
        `)}`;
    }
    
    formatPrice(price) {
        if (!price || isNaN(price)) {
            return 'Precio no disponible';
        }
        
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(parseFloat(price));
    }
    
    stripHtml(html) {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
    
    getProductUrl(productId) {
        // Determine the correct path based on current location
        const currentPath = window.location.pathname;
        
        if (currentPath === '/' || currentPath === '/index.html' || 
            currentPath.endsWith('/EstArtesana/') || 
            currentPath.endsWith('/EstArtesana/index.html')) {
            return `producto.html?id=${productId}`;
        }
        
        // If we're in a subdirectory, go up one level
        if (currentPath.includes('/pages/') || currentPath.includes('/tienda/')) {
            return `../producto.html?id=${productId}`;
        }
        
        return `producto.html?id=${productId}`;
    }
    
    showLoading() {
        const loadingElement = document.getElementById('featuredProductsLoading');
        const gridElement = document.getElementById('featuredProductsGrid');
        
        if (loadingElement) loadingElement.style.display = 'flex';
        if (gridElement) gridElement.style.display = 'none';
    }
    
    hideLoading() {
        const loadingElement = document.getElementById('featuredProductsLoading');
        const gridElement = document.getElementById('featuredProductsGrid');
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (gridElement) gridElement.style.display = 'grid';
    }
    
    showEmptyState() {
        const gridElement = document.getElementById('featuredProductsGrid');
        if (gridElement) {
            gridElement.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <h3>No hay productos destacados</h3>
                    <p>Pronto tendremos productos increíbles para mostrar.</p>
                </div>
            `;
            gridElement.classList.add('empty');
        }
    }
    
    showErrorState() {
        const gridElement = document.getElementById('featuredProductsGrid');
        if (gridElement) {
            gridElement.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Error al cargar productos</h3>
                    <p>No se pudieron cargar los productos destacados. Intenta recargar la página.</p>
                    <button onclick="location.reload()" class="retry-btn">
                        <i class="fas fa-redo"></i> Intentar de nuevo
                    </button>
                </div>
            `;
            gridElement.classList.add('error');
        }
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the home page and the featured products section exists
    if (document.getElementById('featuredProductsGrid')) {
        window.FeaturedProductsManager = new FeaturedProductsManager();
    }
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeaturedProductsManager;
}

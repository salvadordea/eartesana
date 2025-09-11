/**
 * Categories JavaScript - Estudio Artesana
 * Handles categories page functionality with WooCommerce integration
 */

class EstudioArtesanaCategorias {
    constructor() {
        this.categories = [];
        this.isLoading = false;
        this.totalProducts = 0;
        
        this.init();
    }
    
    init() {
        this.initializeElements();
        this.bindEvents();
        this.loadCategories();
        this.initScrollAnimations();
    }
    
    initializeElements() {
        // Main elements
        this.categoriesGrid = document.getElementById('categoriesGrid');
        this.categoriesLoading = document.getElementById('categoriesLoading');
        this.noCategories = document.getElementById('noCategories');
        this.apiError = document.getElementById('apiError');
        this.retryLoad = document.getElementById('retryLoad');
        
        // Stats elements
        this.totalCategoriesSpan = document.getElementById('totalCategories');
        this.totalProductsSpan = document.getElementById('totalProducts');
    }
    
    bindEvents() {
        // Retry button
        this.retryLoad?.addEventListener('click', () => this.loadCategories());
        
        // Window scroll for animations
        window.addEventListener('scroll', this.debounce(() => {
            this.checkAnimations();
        }, 100));
    }
    
    async loadCategories() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // Load categories from WooCommerce
            this.categories = await window.WooAPI.getCategories({
                hide_empty: true,
                per_page: 50,
                orderby: 'count',
                order: 'desc'
            });
            
            // Calculate total products
            this.totalProducts = this.categories.reduce((sum, cat) => sum + (cat.count || 0), 0);
            
            this.renderCategories();
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError();
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    renderCategories() {
        if (!this.categories || this.categories.length === 0) {
            this.showNoCategories();
            return;
        }
        
        let html = '';
        
        this.categories.forEach((category, index) => {
            html += this.createCategoryCard(category, index);
        });
        
        this.categoriesGrid.innerHTML = html;
        this.hideStates();
        
        // Bind category click events
        this.bindCategoryEvents();
        
        // Trigger animations after a short delay
        setTimeout(() => {
            this.checkAnimations();
        }, 100);
    }
    
    createCategoryCard(category, index) {
        // Get category image from WooCommerce or use fallback
        const image = this.getCategoryImage(category);
        
        // Get category description or create one
        const description = this.getCategoryDescription(category);
        
        // Determine if this should be a featured category (first one or high product count)
        const isFeatured = index === 0 && category.count > 10;
        
        // Get badge text based on product count
        const badgeText = this.getBadgeText(category.count);
        
        return `
            <div class="category-card ${isFeatured ? 'featured' : ''}" data-category-id="${category.id}">
                <div class="category-image">
                    <img src="${image}" alt="${category.name}" loading="lazy">
                    ${badgeText ? `<div class="category-badge">${badgeText}</div>` : ''}
                </div>
                
                <div class="category-info">
                    <h3 class="category-name">${category.name}</h3>
                    <p class="category-count">${category.count} producto${category.count !== 1 ? 's' : ''}</p>
                    <p class="category-description">${description}</p>
                </div>
                
                <div class="category-overlay">
                    <h3 class="category-name">${category.name}</h3>
                    <p class="category-description">${description}</p>
                    <a href="../tienda/index.html?category=${category.id}" class="category-button">
                        Ver ${category.count} producto${category.count !== 1 ? 's' : ''}
                    </a>
                </div>
            </div>
        `;
    }
    
    getCategoryImage(category) {
        // Check if WooCommerce provides an image
        if (category.image && category.image.src) {
            return category.image.src;
        }
        
        // Fallback images based on category name (you can customize these)
        const categoryImages = {
            'joyeria': '../../assets/images/categories/joyeria.jpg',
            'joyería': '../../assets/images/categories/joyeria.jpg',
            'accesorios': '../../assets/images/categories/accesorios.jpg',
            'bolsas': '../../assets/images/categories/bolsas.jpg',
            'bolsas de mano': '../../assets/images/categories/bolsas-mano.jpg',
            'bolsas textil y piel': '../../assets/images/categories/bolsas-textil.jpg',
            'bolsas cruzadas': '../../assets/images/categories/bolsas-cruzadas.jpg',
            'portacel': '../../assets/images/categories/portacel.jpg',
            'cuadernos': '../../assets/images/categories/cuadernos.jpg',
            'libretas': '../../assets/images/categories/cuadernos.jpg'
        };
        
        const categoryName = category.name.toLowerCase();
        const matchedImage = categoryImages[categoryName];
        
        if (matchedImage) {
            return matchedImage;
        }
        
        // Ultimate fallback - generate a placeholder with the category name
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#2c2c2c;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#bg)"/>
                <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="16" fill="#D4AF37" text-anchor="middle" font-weight="bold">
                    ESTUDIO ARTESANA
                </text>
                <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" text-anchor="middle" font-weight="bold">
                    ${category.name.toUpperCase()}
                </text>
                <text x="50%" y="75%" font-family="Arial, sans-serif" font-size="12" fill="#cccccc" text-anchor="middle">
                    ${category.count} productos
                </text>
            </svg>
        `)}`;
    }
    
    getCategoryDescription(category) {
        // Use WooCommerce description if available
        if (category.description && category.description.trim()) {
            // Remove HTML tags and limit length
            return category.description.replace(/<[^>]*>/g, '').substring(0, 120) + '...';
        }
        
        // Fallback descriptions based on category name
        const descriptions = {
            'joyeria': 'Aretes, collares y pulseras únicos hechos a mano con técnicas tradicionales.',
            'joyería': 'Aretes, collares y pulseras únicos hechos a mano con técnicas tradicionales.',
            'accesorios': 'Complementos artesanales para completar tu estilo personal.',
            'bolsas': 'Bolsas artesanales de alta calidad con diseños únicos.',
            'bolsas de mano': 'Elegantes bolsas de mano perfectas para cualquier ocasión.',
            'bolsas textil y piel': 'Combinación perfecta de textiles y piel genuina.',
            'bolsas cruzadas': 'Prácticas y elegantes bolsas cruzadas para el día a día.',
            'portacel': 'Fundas y accesorios artesanales para tu teléfono móvil.',
            'cuadernos': 'Cuadernos y libretas artesanales para tus ideas más importantes.',
            'libretas': 'Libretas únicas hechas a mano con materiales de primera calidad.'
        };
        
        const categoryName = category.name.toLowerCase();
        return descriptions[categoryName] || `Descubre nuestra colección de ${category.name.toLowerCase()} artesanales únicos.`;
    }
    
    getBadgeText(productCount) {
        if (productCount >= 20) return 'Colección Grande';
        if (productCount >= 10) return 'Popular';
        if (productCount >= 5) return 'Nueva';
        return null;
    }
    
    bindCategoryEvents() {
        this.categoriesGrid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on a link
                if (e.target.tagName === 'A') return;
                
                const categoryId = card.dataset.categoryId;
                const categoryButton = card.querySelector('.category-button');
                
                if (categoryButton) {
                    window.location.href = categoryButton.href;
                }
            });
        });
    }
    
    updateStats() {
        if (this.totalCategoriesSpan) {
            this.totalCategoriesSpan.textContent = this.categories.length;
        }
        
        if (this.totalProductsSpan) {
            this.totalProductsSpan.textContent = this.totalProducts;
        }
    }
    
    // Animation Methods
    
    initScrollAnimations() {
        // Initial check
        this.checkAnimations();
    }
    
    checkAnimations() {
        const cards = this.categoriesGrid.querySelectorAll('.category-card:not(.animate-in)');
        
        cards.forEach(card => {
            if (this.isElementInViewport(card)) {
                card.classList.add('animate-in');
            }
        });
    }
    
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        
        return rect.top <= windowHeight * 0.8;
    }
    
    // UI State Methods
    
    showLoading() {
        this.categoriesLoading.style.display = 'flex';
        this.hideStates();
    }
    
    hideLoading() {
        this.categoriesLoading.style.display = 'none';
    }
    
    showNoCategories() {
        this.noCategories.style.display = 'block';
        this.hideStates();
    }
    
    showError() {
        this.apiError.style.display = 'block';
        this.hideStates();
    }
    
    hideStates() {
        this.noCategories.style.display = 'none';
        this.apiError.style.display = 'none';
    }
    
    // Utility Methods
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
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
        
        // Set base URL
        window.WooAPI.config.baseURL = window.EstudioArtesanaConfig.woocommerce.baseURL;
    }
    
    // Initialize the categories page
    new EstudioArtesanaCategorias();
});

// Add some additional CSS for better loading states
const style = document.createElement('style');
style.textContent = `
    .categories-grid .category-card {
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--secondary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .category-card:hover .category-info {
        opacity: 0;
    }
`;
document.head.appendChild(style);

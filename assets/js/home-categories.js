/**
 * Home Categories JavaScript - Estudio Artesana
 * Loads and displays categories dynamically on the homepage
 */

class HomeCategoriesLoader {
    constructor() {
        this.categories = [];
        this.isLoading = false;
        this.maxCategories = 999; // Show ALL categories on homepage by default
        
        this.init();
    }
    
    init() {
        this.initializeElements();
        this.loadHomeCategories();
    }
    
    initializeElements() {
        this.categoriesGrid = document.getElementById('homeCategoriesGrid');
        this.categoriesLoading = document.getElementById('homeCategoriesLoading');
    }
    
    async loadHomeCategories() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // Load categories from WooCommerce
            const allCategories = await window.WooAPI.getCategories({
                hide_empty: true,
                per_page: 50,
                orderby: 'count',
                order: 'desc'
            });
            
            // Take only the top categories for homepage
            this.categories = allCategories.slice(0, this.maxCategories);
            
            this.renderHomeCategories();
            
        } catch (error) {
            console.error('Error loading home categories:', error);
            this.hideLoading();
            // On error, hide the section gracefully
            if (this.categoriesGrid) {
                this.categoriesGrid.style.display = 'none';
            }
        } finally {
            this.isLoading = false;
        }
    }
    
    renderHomeCategories() {
        if (!this.categories || this.categories.length === 0) {
            this.hideLoading();
            return;
        }
        
        let html = '';
        
        this.categories.forEach((category, index) => {
            html += this.createHomeCategoryCard(category, index);
        });
        
        this.categoriesGrid.innerHTML = html;
        this.hideLoading();
        
        // Bind click events
        this.bindCategoryEvents();
        
        // Trigger animations
        setTimeout(() => {
            this.animateCards();
        }, 100);
    }
    
    createHomeCategoryCard(category, index) {
        const image = this.getCategoryImage(category);
        const badgeText = this.getBadgeText(category.count);
        
        return `
            <div class="home-category-card" data-category-id="${category.id}">
                <div class="home-category-image">
                    <img src="${image}" alt="${category.name}" loading="lazy">
                    ${badgeText ? `<div class="home-category-badge">${badgeText}</div>` : ''}
                </div>
                <div class="home-category-info">
                    <h3 class="home-category-name">${category.name}</h3>
                    <p class="home-category-count">${category.count} producto${category.count !== 1 ? 's' : ''}</p>
                </div>
            </div>
        `;
    }
    
    getCategoryImage(category) {
        // Check if WooCommerce provides an image
        if (category.image && category.image.src) {
            // Ensure the image URL is complete and accessible
            let imageUrl = category.image.src;
            
            // If it's a relative URL, make it absolute
            if (imageUrl.startsWith('/')) {
                imageUrl = window.EstudioArtesanaConfig.woocommerce.baseURL + imageUrl;
            }
            
            // Check different image sizes if available
            if (category.image.sizes) {
                // Try to get medium or large size first
                const preferredSizes = ['medium', 'medium_large', 'large', 'full'];
                for (let size of preferredSizes) {
                    if (category.image.sizes[size]) {
                        imageUrl = category.image.sizes[size];
                        break;
                    }
                }
            }
            
            return imageUrl;
        }
        
        // Fallback images based on category name
        const categoryImages = {
            'joyeria': 'assets/images/categories/joyeria.jpg',
            'joyería': 'assets/images/categories/joyeria.jpg', 
            'accesorios': 'assets/images/categories/accesorios.jpg',
            'bolsas': 'assets/images/categories/bolsas.jpg',
            'bolsas de mano': 'assets/images/categories/bolsas-mano.jpg',
            'bolsas textil y piel': 'assets/images/categories/bolsas-textil.jpg',
            'bolsas cruzadas': 'assets/images/categories/bolsas-cruzadas.jpg',
            'portacel': 'assets/images/categories/portacel.jpg',
            'cuadernos': 'assets/images/categories/cuadernos.jpg',
            'libretas': 'assets/images/categories/cuadernos.jpg'
        };
        
        const categoryName = category.name.toLowerCase();
        const matchedImage = categoryImages[categoryName];
        
        if (matchedImage) {
            return matchedImage;
        }
        
        // Generate SVG placeholder with category info
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#2c2c2c;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#bg)"/>
                <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="14" fill="#C0C0C0" text-anchor="middle" font-weight="bold">
                    ESTUDIO ARTESANA
                </text>
                <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="20" fill="#ffffff" text-anchor="middle" font-weight="bold">
                    ${category.name.toUpperCase()}
                </text>
                <text x="50%" y="75%" font-family="Arial, sans-serif" font-size="11" fill="#cccccc" text-anchor="middle">
                    ${category.count} productos disponibles
                </text>
            </svg>
        `)}`;
    }
    
    getBadgeText(productCount) {
        if (productCount >= 20) return 'Popular';
        if (productCount >= 10) return 'Nueva';
        return null;
    }
    
    bindCategoryEvents() {
        this.categoriesGrid.querySelectorAll('.home-category-card').forEach(card => {
            card.addEventListener('click', () => {
                const categoryId = card.dataset.categoryId;
                const category = this.categories.find(cat => cat.id == categoryId);
                
                if (category) {
                    // Navigate to shop with category filter using slug for better SEO
                    window.location.href = `${this.getTiendaPath()}?categoria=${category.slug}&nombre=${encodeURIComponent(category.name)}`;
                } else {
                    // Fallback to general shop page
                    window.location.href = this.getTiendaPath();
                }
            });
            
            // Add hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }
    
    animateCards() {
        const cards = this.categoriesGrid.querySelectorAll('.home-category-card');
        
        cards.forEach((card, index) => {
            // Add staggered animation delay
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    showLoading() {
        if (this.categoriesLoading) {
            this.categoriesLoading.style.display = 'flex';
        }
    }
    
    hideLoading() {
        if (this.categoriesLoading) {
            this.categoriesLoading.style.display = 'none';
        }
    }
    
    // Helper method to get correct path to tienda based on current location
    getTiendaPath() {
        const currentPath = window.location.pathname;
        
        // If we're in the root directory
        if (currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/EstArtesana/') || currentPath.endsWith('/EstArtesana/index.html')) {
            return 'pages/tienda/index.html';
        }
        
        // If we're in a pages subdirectory (tienda, sobre-nosotros, categorias, producto)
        if (currentPath.includes('/pages/')) {
            return '../tienda/index.html';
        }
        
        // Default fallback - assume we're in root
        return 'pages/tienda/index.html';
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
    
    // Initialize home categories loader
    new HomeCategoriesLoader();
});

// Add CSS for smooth animations
const style = document.createElement('style');
style.textContent = `
    .home-category-card {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s ease;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .home-categories-grid {
            grid-template-columns: 1fr;
            gap: 20px;
        }
        
        .section-title {
            font-size: 2rem;
        }
        
        .home-category-card {
            aspect-ratio: 3/2;
        }
    }
    
    @media (max-width: 480px) {
        .section-title {
            font-size: 1.8rem;
        }
        
        .view-all-btn {
            padding: 12px 24px;
            font-size: 0.9rem;
        }
        
        .home-category-name {
            font-size: 1.1rem;
        }
    }
`;
document.head.appendChild(style);

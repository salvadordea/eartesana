/**
 * Home Categories Manager - Gestión de categorías dinámicas para la página principal
 * Integrado con sistema de caché localStorage
 */

class HomeCategoriesManager {
    constructor() {
        this.container = null;
        this.isLoading = false;
        this.categoriesPerPage = 8;
        this.currentPage = 1;
        this.totalCategories = 0;
        this.viewAllContainer = null;
        
        // Verificar dependencias
        if (typeof window.categoriesCache === 'undefined') {
            console.error('CategoriesCache not found. Make sure categories-cache.js is loaded first.');
            return;
        }
        
        this.init();
    }

    /**
     * Inicializar el gestor de categorías
     */
    init() {
        this.container = document.getElementById('modern-categories-grid') || document.getElementById('homeCategoriesGrid');
        this.viewAllContainer = document.querySelector('.section-footer.centered');
        
        if (!this.container) {
            console.error('Categories container not found');
            return;
        }

        this.loadCategories();
    }

    /**
     * Cargar categorías usando el sistema de caché
     */
    async loadCategories() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();

        try {
            // Obtener configuración desde config.js
            const woocommerceApiUrl = this.getWooCommerceApiUrl();
            
            if (!woocommerceApiUrl) {
                throw new Error('WooCommerce API URL not configured');
            }

            // Usar el sistema de caché para obtener categorías
            const result = await window.categoriesCache.getCategories(woocommerceApiUrl);
            
            if (!result || !result.categories || result.categories.length === 0) {
                this.showEmptyState();
                return;
            }

            this.totalCategories = result.categories.length;
            console.log(`Loaded ${this.totalCategories} categories from ${result.source}`);
            
            // Renderizar categorías con paginación
            this.renderCategories(result.categories.slice(0, this.categoriesPerPage));
            this.renderViewAllButton();
            
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showErrorState(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Obtener la URL de la API de WooCommerce desde la configuración
     */
    getWooCommerceApiUrl() {
        // Intentar obtener desde config.js global nuevo
        if (typeof window.siteConfig !== 'undefined' && window.siteConfig.woocommerce) {
            const config = window.siteConfig.woocommerce;
            return `${config.apiUrl}/products/categories?consumer_key=${config.consumerKey}&consumer_secret=${config.consumerSecret}&per_page=50`;
        }
        
        // Intentar obtener desde configuración antigua
        if (typeof window.EstudioArtesanaConfig !== 'undefined' && window.EstudioArtesanaConfig.woocommerce) {
            const config = window.EstudioArtesanaConfig.woocommerce;
            return `${config.baseURL}/wp-json/wc/v3/products/categories?consumer_key=${config.consumerKey}&consumer_secret=${config.consumerSecret}&per_page=50`;
        }
        
        // URL por defecto como fallback
        return '/wp-json/wc/v3/products/categories?per_page=50';
    }

    /**
     * Mostrar estado de carga
     */
    showLoading() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="categories-loading">
                <div class="loading-spinner"></div>
                <p style="color: rgba(255, 255, 255, 0.8); font-family: var(--font-secondary); margin-top: 1rem;">Cargando categorías...</p>
            </div>
        `;
    }

    /**
     * Mostrar estado vacío
     */
    showEmptyState() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="categories-loading">
                <i class="fas fa-box-open" style="font-size: 3rem; color: var(--secondary-color); margin-bottom: 1rem;"></i>
                <p style="color: rgba(255, 255, 255, 0.8); font-family: var(--font-secondary);">No se encontraron categorías</p>
            </div>
        `;
    }

    /**
     * Mostrar estado de error
     */
    showErrorState(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="categories-loading">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 1rem;"></i>
                <p style="color: rgba(255, 255, 255, 0.8); font-family: var(--font-secondary); margin-bottom: 1rem;">Error al cargar categorías</p>
                <button onclick="homeCategoriesManager.retryLoad()" class="retry-btn" style="
                    background: var(--gradient-secondary); 
                    color: var(--white); 
                    border: none; 
                    padding: 0.5rem 1rem; 
                    border-radius: 0.25rem; 
                    cursor: pointer;
                    font-family: var(--font-secondary);
                ">Reintentar</button>
            </div>
        `;
    }

    /**
     * Reintentar carga
     */
    retryLoad() {
        this.loadCategories();
    }

    /**
     * Renderizar categorías en el grid
     */
    renderCategories(categories) {
        if (!this.container || !Array.isArray(categories)) return;
        
        this.container.innerHTML = categories.map((category, index) => {
            const imageUrl = this.getCategoryImageUrl(category);
            const categoryUrl = this.getCategoryUrl(category);
            
            return `
                <div class="modern-category-card fade-in delay-${Math.min(index + 1, 4)}" onclick="window.location.href='${categoryUrl}'" data-category-id="${category.id}">
                    <div class="modern-category-image">
                        <img src="${imageUrl}" alt="${category.name}" loading="lazy" onerror="this.src='${this.getDefaultCategoryImage()}'">
                    </div>
                    <div class="modern-category-content">
                        <h3 class="modern-category-title">${category.name}</h3>
                        ${category.count > 0 ? `<span class="modern-category-count"><i class="fas fa-box"></i> ${category.count} productos</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Activar animaciones
        this.activateAnimations();
    }

    /**
     * Obtener URL de imagen de categoría
     */
    getCategoryImageUrl(category) {
        if (category.image && category.image.src) {
            return category.image.src;
        }
        return this.getDefaultCategoryImage();
    }

    /**
     * Obtener imagen por defecto
     */
    getDefaultCategoryImage() {
        return 'https://via.placeholder.com/400x400/2c2c2c/C0C0C0?text=Sin+Imagen';
    }

    /**
     * Obtener URL de categoría
     */
    getCategoryUrl(category) {
        if (category.link) {
            return category.link;
        }
        return `/tienda/categoria/${category.slug}/`;
    }

    /**
     * Renderizar botón "Ver todas"
     */
    renderViewAllButton() {
        if (!this.viewAllContainer || this.totalCategories <= this.categoriesPerPage) {
            return;
        }
        
        this.viewAllContainer.innerHTML = `
            <a href="/tienda/" class="view-all-btn modern">
                <span>Ver todas las categorías</span>
                <i class="fas fa-arrow-right"></i>
            </a>
        `;
    }

    /**
     * Activar animaciones de entrada
     */
    activateAnimations() {
        const cards = this.container.querySelectorAll('.fade-in');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        cards.forEach(card => {
            card.style.animationPlayState = 'paused';
            observer.observe(card);
        });
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
        const description = this.getCategoryDescription(category);
        
        return `
            <div class="modern-category-card fade-in delay-${Math.min(index + 1, 4)}" data-category-id="${category.id}">
                <div class="modern-category-image">
                    <img src="${image}" alt="${category.name}" loading="lazy">
                    ${badgeText ? `<div class="category-badge">${badgeText}</div>` : ''}
                </div>
                <div class="modern-category-content">
                    <h3 class="modern-category-title">${category.name}</h3>
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
            'aretes de piel': 'assets/images/categories/aretes-piel.jpg',
            'aretes del piel': 'assets/images/categories/aretes-piel.jpg',
            'bolsas': 'assets/images/categories/bolsas.jpg',
            'bolsas de mano': 'assets/images/categories/bolsas-de-mano.jpg',
            'bolsas textil y piel': 'assets/images/categories/bolsas-textil.jpg',
            'bolsas cruzadas': 'assets/images/categories/bolsas-cruzadas.jpg',
            'bolsas grandes': 'assets/images/categories/bolsas-grandes.jpg',
            'botelleras': 'assets/images/categories/botelleras.jpg',
            'carteras': 'assets/images/categories/carteras.jpg',
            'hogar': 'assets/images/categories/hogar.jpg',
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
    
    getCategoryDescription(category) {
        // Generate descriptive text based on category name
        const descriptions = {
            'joyeria': 'Piezas únicas de joyería artesanal mexicana',
            'joyería': 'Piezas únicas de joyería artesanal mexicana',
            'accesorios': 'Complementos elegantes con diseño contemporáneo',
            'aretes de piel': 'Aretes artesanales elaborados en piel',
            'aretes del piel': 'Aretes artesanales elaborados en piel',
            'bolsas': 'Bolsas artesanales de alta calidad',
            'bolsas de mano': 'Bolsas de mano elegantes y funcionales',
            'bolsas textil y piel': 'Combinación perfecta de textil y piel',
            'bolsas cruzadas': 'Comodidad y estilo para el día a día',
            'bolsas grandes': 'Bolsas espaciosas para todas tus necesidades',
            'botelleras': 'Bolsas especiales para botellas y licores',
            'carteras': 'Carteras elegantes para el día a día',
            'hogar': 'Artículos decorativos para el hogar',
            'portacel': 'Fundas y accesorios para dispositivos móviles',
            'cuadernos': 'Libretas y cuadernos artesanales',
            'libretas': 'Libretas y cuadernos artesanales'
        };
        
        const categoryName = category.name.toLowerCase();
        return descriptions[categoryName] || `Descubre nuestra colección de ${category.name.toLowerCase()}`;
    }
    
    bindCategoryEvents() {
        this.categoriesGrid.querySelectorAll('.modern-category-card').forEach(card => {
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

    /**
     * Forzar actualización del caché
     */
    async forceRefresh() {
        if (this.isLoading) return;
        
        try {
            const woocommerceApiUrl = this.getWooCommerceApiUrl();
            if (!woocommerceApiUrl) {
                throw new Error('WooCommerce API URL not configured');
            }

            this.isLoading = true;
            this.showLoading();
            
            const result = await window.categoriesCache.forceRefresh(woocommerceApiUrl);
            
            if (result && result.categories) {
                this.totalCategories = result.categories.length;
                this.renderCategories(result.categories.slice(0, this.categoriesPerPage));
                this.renderViewAllButton();
                console.log('Categories cache refreshed successfully');
            }
        } catch (error) {
            console.error('Error refreshing categories:', error);
            this.showErrorState(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Obtener estadísticas del caché
     */
    getCacheStats() {
        return window.categoriesCache.getCacheStats();
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.homeCategoriesManager = new HomeCategoriesManager();
    });
} else {
    window.homeCategoriesManager = new HomeCategoriesManager();
}

// Función global para debug
window.refreshCategories = () => {
    if (window.homeCategoriesManager) {
        window.homeCategoriesManager.forceRefresh();
    }
};

// Función global para obtener estadísticas del caché
window.getCategoriesStats = () => {
    if (window.homeCategoriesManager) {
        return window.homeCategoriesManager.getCacheStats();
    }
};

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

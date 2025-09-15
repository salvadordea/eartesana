/**
 * Dropdown Categories - Estudio Artesana
 * Handles loading and displaying categories in the navigation dropdown
 */

class DropdownCategories {
    constructor() {
        this.categories = [];
        this.dropdownContainer = null;
        this.cacheKey = 'estudio_artesana_dropdown_categories';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeDropdown());
        } else {
            this.initializeDropdown();
        }
    }
    
    initializeDropdown() {
        this.dropdownContainer = document.getElementById('dropdownCategories');
        if (!this.dropdownContainer) {
            console.warn('Dropdown categories container not found');
            return;
        }
        
        // Setup dropdown toggle functionality
        this.setupDropdownToggle();
        
        // Load categories
        this.loadCategories();
    }
    
    setupDropdownToggle() {
        const dropdownItem = document.querySelector('.nav-item.dropdown');
        const dropdownMenu = document.getElementById('tiendaDropdown');
        
        if (!dropdownItem || !dropdownMenu) return;
        
        // Show/hide dropdown on hover
        dropdownItem.addEventListener('mouseenter', () => {
            dropdownMenu.style.display = 'block';
            dropdownMenu.classList.add('show');
        });
        
        dropdownItem.addEventListener('mouseleave', () => {
            dropdownMenu.style.display = 'none';
            dropdownMenu.classList.remove('show');
        });
    }
    
    async loadCategories() {
        if (this.isLoading) return;
        
        // Try to load from cache first
        const cachedData = this.getCachedCategories();
        if (cachedData) {
            console.log('Loading categories from cache');
            this.categories = cachedData;
            this.renderCategories();
            return;
        }
        
        // Load from API
        this.isLoading = true;
        this.showLoading();
        
        try {
            // Check if WooCommerce API is available
            if (typeof window.WooAPI === 'undefined') {
                console.warn('WooCommerce API not available, using placeholder categories');
                this.categories = this.getPlaceholderCategories();
            } else {
                console.log('Loading categories from WooCommerce API');
                this.categories = await window.WooAPI.getCategories({
                    hide_empty: false,
                    per_page: 20,
                    orderby: 'name',
                    order: 'asc'
                });
            }
            
            // Cache the results
            this.cacheCategories(this.categories);
            this.renderCategories();
            
        } catch (error) {
            console.error('Error loading categories for dropdown:', error);
            this.showError();
            // Fallback to placeholder categories
            this.categories = this.getPlaceholderCategories();
            this.renderCategories();
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    getPlaceholderCategories() {
        return [
            { id: 1, name: 'Bolsas', slug: 'bolsas', count: 12 },
            { id: 2, name: 'Accesorios', slug: 'accesorios', count: 8 },
            { id: 3, name: 'Cuadernos', slug: 'cuadernos', count: 6 },
            { id: 4, name: 'Decoración', slug: 'decoracion', count: 10 }
        ];
    }
    
    renderCategories() {
        if (!this.dropdownContainer || !this.categories.length) {
            this.showNoCategories();
            return;
        }
        
        let html = '';
        
        this.categories.forEach(category => {
            // Skip uncategorized and empty categories for dropdown
            if (category.slug === 'uncategorized' || category.count === 0) return;
            
            const categoryUrl = this.getTiendaPath() + `?category=${category.slug}`;
            html += `
                <a href="${categoryUrl}" class="dropdown-link category-link" data-category-id="${category.id}">
                    <span class="category-name">${category.name}</span>
                    <span class="category-count">(${category.count})</span>
                </a>
            `;
        });
        
        this.dropdownContainer.innerHTML = html;
        
        // Bind click events
        this.bindCategoryEvents();
    }
    
    bindCategoryEvents() {
        const categoryLinks = this.dropdownContainer.querySelectorAll('.category-link');
        
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const categoryId = e.target.closest('.category-link').dataset.categoryId;
                const categoryName = e.target.closest('.category-link').querySelector('.category-name').textContent;
                
                // Track category click if analytics available
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'category_click', {
                        category_id: categoryId,
                        category_name: categoryName,
                        source: 'dropdown'
                    });
                }
            });
        });
    }
    
    showLoading() {
        if (this.dropdownContainer) {
            this.dropdownContainer.innerHTML = `
                <div class="dropdown-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Cargando categorías...</span>
                </div>
            `;
        }
    }
    
    hideLoading() {
        const loadingElement = this.dropdownContainer?.querySelector('.dropdown-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
    
    showError() {
        if (this.dropdownContainer) {
            this.dropdownContainer.innerHTML = `
                <div class="dropdown-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Error al cargar categorías</span>
                </div>
            `;
        }
    }
    
    showNoCategories() {
        if (this.dropdownContainer) {
            this.dropdownContainer.innerHTML = `
                <div class="dropdown-empty">
                    <span>No hay categorías disponibles</span>
                </div>
            `;
        }
    }
    
    // Cache Management
    getCachedCategories() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            const now = new Date().getTime();
            
            // Check if cache is expired
            if (now - data.timestamp > this.cacheExpiry) {
                localStorage.removeItem(this.cacheKey);
                return null;
            }
            
            return data.categories;
        } catch (error) {
            console.error('Error reading cached categories:', error);
            localStorage.removeItem(this.cacheKey);
            return null;
        }
    }
    
    cacheCategories(categories) {
        try {
            const data = {
                categories: categories,
                timestamp: new Date().getTime()
            };
            
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error caching categories:', error);
        }
    }
    
    // Public methods
    refreshCategories() {
        // Clear cache and reload
        localStorage.removeItem(this.cacheKey);
        this.loadCategories();
    }
    
    getCategoriesCount() {
        return this.categories.length;
    }
    
    getCategoryBySlug(slug) {
        return this.categories.find(cat => cat.slug === slug);
    }
    
    // Helper method to get correct path to tienda based on current location
    getTiendaPath() {
        const currentPath = window.location.pathname;
        
        // If we're in the root directory
        if (currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/EstArtesana/') || currentPath.endsWith('/EstArtesana/index.html')) {
            return 'tienda/index.html';
        }
        
        // If we're in a pages subdirectory (tienda, sobre-nosotros, categorias, producto)
        if (currentPath.includes('/pages/')) {
            return '../../tienda/index.html';
        }
        
        // If we're in the tienda directory
        if (currentPath.includes('/tienda/')) {
            return 'index.html';
        }
        
        // Default fallback - assume we're in root
        return 'tienda/index.html';
    }
}

// Initialize dropdown categories when script loads
window.DropdownCategories = DropdownCategories;

// Auto-initialize if not in admin context
if (!window.location.pathname.includes('/admin/')) {
    window.dropdownCategories = new DropdownCategories();
}

/**
 * Categories Preloader - Estudio Artesana
 * Pre-loads and caches all categories for instant access
 */

class CategoriesPreloader {
    constructor() {
        this.storageKey = 'estudioartesana_categories';
        this.lastUpdateKey = 'estudioartesana_categories_timestamp';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        this.init();
    }
    
    init() {
        // Check if we have cached data and if it's still valid
        if (!this.isCacheValid()) {
            this.preloadCategories();
        }
        
        // Preload in background every hour
        setInterval(() => {
            this.preloadCategories(true); // Silent update
        }, 60 * 60 * 1000); // 1 hour
    }
    
    isCacheValid() {
        const cached = this.getCachedCategories();
        const lastUpdate = localStorage.getItem(this.lastUpdateKey);
        
        if (!cached || !lastUpdate) {
            return false;
        }
        
        const timeDiff = Date.now() - parseInt(lastUpdate);
        return timeDiff < this.cacheExpiry;
    }
    
    async preloadCategories(silent = false) {
        if (!silent) {
            console.log('🔄 Preloading categories...');
        }
        
        try {
            // Load ALL categories from WooCommerce
            const allCategories = await window.WooAPI.getCategories({
                hide_empty: false, // Include empty categories too
                per_page: 100, // Get more categories
                orderby: 'count',
                order: 'desc'
            });
            
            // Store in localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(allCategories));
            localStorage.setItem(this.lastUpdateKey, Date.now().toString());
            
            if (!silent) {
                console.log(`✅ Preloaded ${allCategories.length} categories`);
            }
            
            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('categoriesPreloaded', {
                detail: { categories: allCategories, count: allCategories.length }
            }));
            
        } catch (error) {
            console.error('❌ Error preloading categories:', error);
        }
    }
    
    getCachedCategories() {
        const cached = localStorage.getItem(this.storageKey);
        return cached ? JSON.parse(cached) : null;
    }
    
    // Get categories by filter criteria
    getFilteredCategories(options = {}) {
        const cached = this.getCachedCategories();
        if (!cached) return [];
        
        let filtered = [...cached];
        
        // Apply filters
        if (options.hide_empty) {
            filtered = filtered.filter(cat => cat.count > 0);
        }
        
        if (options.min_count) {
            filtered = filtered.filter(cat => cat.count >= options.min_count);
        }
        
        if (options.search) {
            const searchTerm = options.search.toLowerCase();
            filtered = filtered.filter(cat => 
                cat.name.toLowerCase().includes(searchTerm) ||
                cat.description.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply sorting
        if (options.orderby === 'count') {
            filtered.sort((a, b) => {
                return options.order === 'asc' ? a.count - b.count : b.count - a.count;
            });
        } else if (options.orderby === 'name') {
            filtered.sort((a, b) => {
                const comparison = a.name.localeCompare(b.name);
                return options.order === 'asc' ? comparison : -comparison;
            });
        }
        
        // Apply limit
        if (options.per_page && options.per_page > 0) {
            const page = options.page || 1;
            const startIndex = (page - 1) * options.per_page;
            filtered = filtered.slice(startIndex, startIndex + options.per_page);
        }
        
        return filtered;
    }
    
    // Get top categories for homepage (instant)
    getTopCategories(limit = 6) {
        return this.getFilteredCategories({
            hide_empty: true,
            orderby: 'count',
            order: 'desc',
            per_page: limit
        });
    }
    
    // Get all categories (instant)
    getAllCategories() {
        return this.getCachedCategories() || [];
    }
    
    // Get categories by parent (instant)
    getCategoriesByParent(parentId = 0) {
        const cached = this.getCachedCategories();
        if (!cached) return [];
        
        return cached.filter(cat => cat.parent === parentId);
    }
    
    // Force refresh cache
    async forceRefresh() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.lastUpdateKey);
        await this.preloadCategories();
    }
    
    // Get cache info
    getCacheInfo() {
        const cached = this.getCachedCategories();
        const lastUpdate = localStorage.getItem(this.lastUpdateKey);
        
        return {
            hasCache: !!cached,
            count: cached ? cached.length : 0,
            lastUpdate: lastUpdate ? new Date(parseInt(lastUpdate)) : null,
            isValid: this.isCacheValid(),
            expiresIn: lastUpdate ? 
                Math.max(0, this.cacheExpiry - (Date.now() - parseInt(lastUpdate))) : 0
        };
    }
}

// Initialize global preloader
window.CategoriesPreloader = new CategoriesPreloader();

// Enhanced categories loader that uses cache
class FastHomeCategoriesLoader extends HomeCategoriesLoader {
    constructor() {
        super();
        this.useCache = true;
    }
    
    async loadHomeCategories() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // Try to get from cache first
            if (this.useCache && window.CategoriesPreloader.isCacheValid()) {
                console.log('📦 Loading categories from cache');
                this.categories = window.CategoriesPreloader.getTopCategories(this.maxCategories);
                
                if (this.categories.length > 0) {
                    this.renderHomeCategories();
                    return;
                }
            }
            
            // Fallback to API call
            console.log('🌐 Loading categories from API');
            const allCategories = await window.WooAPI.getCategories({
                hide_empty: true,
                per_page: 50,
                orderby: 'count',
                order: 'desc'
            });
            
            this.categories = allCategories.slice(0, this.maxCategories);
            this.renderHomeCategories();
            
        } catch (error) {
            console.error('Error loading home categories:', error);
            this.hideLoading();
            
            // Try to show cached categories even if API fails
            if (window.CategoriesPreloader) {
                const cachedCategories = window.CategoriesPreloader.getTopCategories(this.maxCategories);
                if (cachedCategories.length > 0) {
                    console.log('📦 Using cached categories as fallback');
                    this.categories = cachedCategories;
                    this.renderHomeCategories();
                    return;
                }
            }
            
            // If all else fails, hide section
            if (this.categoriesGrid) {
                this.categoriesGrid.style.display = 'none';
            }
        } finally {
            this.isLoading = false;
        }
    }
}

// Replace the original loader when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the config to load
    setTimeout(() => {
        if (window.EstudioArtesanaConfig && window.EstudioArtesanaConfig.woocommerce) {
            // Override the original loader with the fast one
            window.homeCategoriesLoader = new FastHomeCategoriesLoader();
        }
    }, 100);
});

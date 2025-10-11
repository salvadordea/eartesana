/**
 * Products Cache Manager - Estudio Artesana
 * Adds persistent localStorage caching to reduce WooCommerce API calls
 * This helps stay within Supabase bandwidth limits
 */

class ProductsCache {
    constructor() {
        this.CACHE_VERSION = '1.0';
        this.CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours (aggressive caching)
        this.productsCacheKey = 'ea_products_cache';
        this.productsTimestampKey = 'ea_products_timestamp';
        this.singleProductPrefix = 'ea_product_';

        this.init();
    }

    init() {
        console.log('💾 Products Cache initialized');
        this.cleanExpiredCache();
    }

    // ==========================================
    // PRODUCTS LIST CACHING
    // ==========================================

    /**
     * Get cached products list
     * @param {Object} filters - Query filters (category, search, etc.)
     * @returns {Array|null} - Cached products or null
     */
    getCachedProducts(filters = {}) {
        const cacheKey = this.generateCacheKey(filters);
        const cached = localStorage.getItem(cacheKey);
        const timestamp = localStorage.getItem(cacheKey + '_time');

        if (!cached || !timestamp) {
            return null;
        }

        // Check if cache is still valid
        const age = Date.now() - parseInt(timestamp);
        if (age > this.CACHE_DURATION) {
            console.log('⏰ Products cache expired');
            this.removeCachedProducts(filters);
            return null;
        }

        console.log(`📦 Using cached products (age: ${Math.round(age / 1000 / 60)}min)`);
        return JSON.parse(cached);
    }

    /**
     * Save products to cache
     * @param {Object} filters - Query filters
     * @param {Array} products - Products array
     */
    setCachedProducts(filters = {}, products) {
        const cacheKey = this.generateCacheKey(filters);

        try {
            localStorage.setItem(cacheKey, JSON.stringify(products));
            localStorage.setItem(cacheKey + '_time', Date.now().toString());
            console.log(`💾 Cached ${products.length} products`);
        } catch (error) {
            console.warn('⚠️ Failed to cache products (localStorage full?):', error);
            this.cleanOldCache();
        }
    }

    /**
     * Remove cached products for specific filters
     */
    removeCachedProducts(filters = {}) {
        const cacheKey = this.generateCacheKey(filters);
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheKey + '_time');
    }

    /**
     * Generate unique cache key from filters
     */
    generateCacheKey(filters) {
        const sortedFilters = Object.keys(filters)
            .sort()
            .reduce((obj, key) => {
                obj[key] = filters[key];
                return obj;
            }, {});

        const filterString = JSON.stringify(sortedFilters);
        return `${this.productsCacheKey}_${btoa(filterString).substring(0, 20)}`;
    }

    // ==========================================
    // SINGLE PRODUCT CACHING
    // ==========================================

    /**
     * Get cached single product
     * @param {string|number} productId - Product ID or slug
     * @returns {Object|null} - Cached product or null
     */
    getCachedProduct(productId) {
        const cacheKey = `${this.singleProductPrefix}${productId}`;
        const cached = localStorage.getItem(cacheKey);
        const timestamp = localStorage.getItem(cacheKey + '_time');

        if (!cached || !timestamp) {
            return null;
        }

        // Check if cache is still valid
        const age = Date.now() - parseInt(timestamp);
        if (age > this.CACHE_DURATION) {
            console.log('⏰ Product cache expired:', productId);
            this.removeCachedProduct(productId);
            return null;
        }

        console.log(`📦 Using cached product: ${productId} (age: ${Math.round(age / 1000 / 60)}min)`);
        return JSON.parse(cached);
    }

    /**
     * Save single product to cache
     * @param {string|number} productId - Product ID or slug
     * @param {Object} product - Product data
     */
    setCachedProduct(productId, product) {
        const cacheKey = `${this.singleProductPrefix}${productId}`;

        try {
            localStorage.setItem(cacheKey, JSON.stringify(product));
            localStorage.setItem(cacheKey + '_time', Date.now().toString());
            console.log(`💾 Cached product: ${productId}`);
        } catch (error) {
            console.warn('⚠️ Failed to cache product:', error);
            this.cleanOldCache();
        }
    }

    /**
     * Remove cached product
     */
    removeCachedProduct(productId) {
        const cacheKey = `${this.singleProductPrefix}${productId}`;
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheKey + '_time');
    }

    // ==========================================
    // CACHE MANAGEMENT
    // ==========================================

    /**
     * Clear all products cache
     */
    clearAllCache() {
        const keys = Object.keys(localStorage);
        let cleared = 0;

        keys.forEach(key => {
            if (key.startsWith('ea_product') || key.startsWith(this.productsCacheKey)) {
                localStorage.removeItem(key);
                cleared++;
            }
        });

        console.log(`🧹 Cleared ${cleared} cache entries`);
    }

    /**
     * Clean expired cache entries
     */
    cleanExpiredCache() {
        const keys = Object.keys(localStorage);
        let cleaned = 0;

        keys.forEach(key => {
            if (key.endsWith('_time') && (key.startsWith('ea_product') || key.startsWith(this.productsCacheKey))) {
                const timestamp = parseInt(localStorage.getItem(key));
                const age = Date.now() - timestamp;

                if (age > this.CACHE_DURATION) {
                    const dataKey = key.replace('_time', '');
                    localStorage.removeItem(key);
                    localStorage.removeItem(dataKey);
                    cleaned++;
                }
            }
        });

        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
        }
    }

    /**
     * Clean oldest cache entries when storage is full
     */
    cleanOldCache() {
        console.log('🧹 Cleaning old cache to free space...');

        const cacheEntries = [];
        const keys = Object.keys(localStorage);

        // Collect all cache entries with timestamps
        keys.forEach(key => {
            if (key.endsWith('_time') && (key.startsWith('ea_product') || key.startsWith(this.productsCacheKey))) {
                cacheEntries.push({
                    key: key.replace('_time', ''),
                    timestamp: parseInt(localStorage.getItem(key))
                });
            }
        });

        // Sort by age (oldest first)
        cacheEntries.sort((a, b) => a.timestamp - b.timestamp);

        // Remove oldest 30%
        const toRemove = Math.ceil(cacheEntries.length * 0.3);
        for (let i = 0; i < toRemove; i++) {
            const entry = cacheEntries[i];
            localStorage.removeItem(entry.key);
            localStorage.removeItem(entry.key + '_time');
        }

        console.log(`🧹 Removed ${toRemove} oldest cache entries`);
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const keys = Object.keys(localStorage);
        let productsListCount = 0;
        let singleProductsCount = 0;
        let totalSize = 0;

        keys.forEach(key => {
            if (key.startsWith(this.productsCacheKey)) {
                productsListCount++;
                totalSize += localStorage.getItem(key).length;
            } else if (key.startsWith(this.singleProductPrefix)) {
                singleProductsCount++;
                totalSize += localStorage.getItem(key).length;
            }
        });

        // Calculate size in KB
        const sizeKB = Math.round(totalSize / 1024);

        return {
            productsLists: productsListCount / 2, // Divided by 2 because of _time entries
            singleProducts: singleProductsCount / 2,
            totalEntries: (productsListCount + singleProductsCount) / 2,
            sizeKB: sizeKB,
            cacheDuration: this.CACHE_DURATION / 1000 / 60, // in minutes
            version: this.CACHE_VERSION
        };
    }

    /**
     * Print cache stats to console
     */
    printStats() {
        const stats = this.getCacheStats();
        console.log('📊 Products Cache Stats:');
        console.log(`  - Products lists cached: ${stats.productsLists}`);
        console.log(`  - Single products cached: ${stats.singleProducts}`);
        console.log(`  - Total entries: ${stats.totalEntries}`);
        console.log(`  - Cache size: ${stats.sizeKB} KB`);
        console.log(`  - Cache duration: ${stats.cacheDuration} minutes`);
        console.log(`  - Version: ${stats.version}`);
    }
}

// Initialize global instance
window.ProductsCache = new ProductsCache();

// Auto-clean expired cache every 30 minutes
setInterval(() => {
    window.ProductsCache.cleanExpiredCache();
}, 30 * 60 * 1000);

console.log('✅ Products Cache Manager loaded');

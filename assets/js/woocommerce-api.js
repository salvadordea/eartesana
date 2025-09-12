/**
 * WooCommerce API Connector
 * Handles all communication with WooCommerce REST API
 */

class WooCommerceAPI {
    constructor(config = {}) {
        // Default configuration - should be updated with your actual site details
        this.config = {
            baseURL: config.baseURL || window.location.origin,
            apiPath: config.apiPath || '/wp-json/wc/v3',
            consumerKey: config.consumerKey || '', // Will be set from config
            consumerSecret: config.consumerSecret || '', // Will be set from config
            version: config.version || 'v3',
            timeout: config.timeout || 30000
        };
        
        // Initialize from global config if available (prefer WooCommerce settings)
        if (window.EstudioArtesanaConfig && window.EstudioArtesanaConfig.woocommerce) {
            const wc = window.EstudioArtesanaConfig.woocommerce;
            this.config.baseURL = wc.baseURL || this.config.baseURL;
            this.config.apiPath = '/wp-json/wc/v3';
            // If credentials exist in global config, set them
            if (wc.consumerKey && wc.consumerSecret) {
                this.config.consumerKey = wc.consumerKey;
                this.config.consumerSecret = wc.consumerSecret;
            }
        }
        
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }
    
    /**
     * Set API credentials
     */
    setCredentials(consumerKey, consumerSecret) {
        this.config.consumerKey = consumerKey;
        this.config.consumerSecret = consumerSecret;
    }
    
    /**
     * Generate authentication header
     */
    getAuthHeader() {
        if (!this.config.consumerKey || !this.config.consumerSecret) {
            console.warn('WooCommerce API credentials not set. Some features may not work.');
            return {};
        }
        
        const credentials = btoa(`${this.config.consumerKey}:${this.config.consumerSecret}`);
        return {
            'Authorization': `Basic ${credentials}`
        };
    }
    
    /**
     * Make API request
     */
    async makeRequest(endpoint, options = {}) {
        const {
            method = 'GET',
            params = {},
            useCache = true,
            headers = {}
        } = options;
        
        // Build URL
        const url = new URL(`${this.config.baseURL}${this.config.apiPath}${endpoint}`);
        
        // Add parameters
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        const cacheKey = url.toString();
        
        // Check cache for GET requests
        if (method === 'GET' && useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }
        
        try {
            const requestHeaders = {
                'Content-Type': 'application/json',
                ...headers
            };
            
            // Add authentication headers only if we have credentials
            const authHeaders = this.getAuthHeader();
            if (Object.keys(authHeaders).length > 0) {
                Object.assign(requestHeaders, authHeaders);
            }
            
            const response = await fetch(url.toString(), {
                method,
                headers: requestHeaders,
                timeout: this.config.timeout
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cache successful GET requests
            if (method === 'GET' && useCache) {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }
            
            return data;
            
        } catch (error) {
            console.error('WooCommerce API Error:', error);
            throw error;
        }
    }
    
    // PRODUCTS API
    
    /**
     * Get all products with pagination and filters
     */
    async getProducts(options = {}) {
        const {
            page = 1,
            per_page = 12,
            category = null,
            search = '',
            orderby = 'date',
            order = 'desc',
            min_price = null,
            max_price = null,
            on_sale = null,
            featured = null,
            status = 'publish'
        } = options;
        
        const params = {
            page,
            per_page,
            orderby,
            order,
            status
        };
        
        if (category) params.category = category;
        if (search) params.search = search;
        if (min_price) params.min_price = min_price;
        if (max_price) params.max_price = max_price;
        if (on_sale !== null) params.on_sale = on_sale;
        if (featured !== null) params.featured = featured;
        
        return await this.makeRequest('/products', { params });
    }
    
    /**
     * Get single product by ID
     */
    async getProduct(id) {
        return await this.makeRequest(`/products/${id}`);
    }
    
    /**
     * Get product variations
     */
    async getProductVariations(productId) {
        return await this.makeRequest(`/products/${productId}/variations`);
    }
    
    /**
     * Get single product variation
     */
    async getProductVariation(productId, variationId) {
        return await this.makeRequest(`/products/${productId}/variations/${variationId}`);
    }
    
    // CATEGORIES API
    
    /**
     * Get product categories
     */
    async getCategories(options = {}) {
        const {
            page = 1,
            per_page = 100,
            hide_empty = true,
            parent = null,
            orderby = 'name',
            order = 'asc'
        } = options;
        
        const params = {
            page,
            per_page,
            hide_empty,
            orderby,
            order
        };
        
        if (parent !== null) params.parent = parent;
        
        return await this.makeRequest('/products/categories', { params });
    }
    
    /**
     * Get single category by ID
     */
    async getCategory(id) {
        return await this.makeRequest(`/products/categories/${id}`);
    }
    
    // CART AND ORDERS API (for future implementation)
    
    /**
     * Get cart (requires WooCommerce REST API extensions or custom endpoint)
     */
    async getCart() {
        // This might require additional plugins or custom endpoints
        console.warn('Cart API not implemented. Consider using local storage or session management.');
        return null;
    }
    
    // UTILITY METHODS
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Format price with currency
     */
    formatPrice(price, currency = 'MXN') {
        const formatter = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency
        });
        return formatter.format(parseFloat(price));
    }
    
    /**
     * Get product image URL with fallback
     */
    getProductImage(product, size = 'medium') {
        if (product.images && product.images.length > 0) {
            return product.images[0].src;
        }
        
        // Fallback to placeholder
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVzdHVkaW8gQXJ0ZXNhbmE8L3RleHQ+PC9zdmc+';
    }
    
    /**
     * Check if product is on sale
     */
    isOnSale(product) {
        return product.sale_price && parseFloat(product.sale_price) < parseFloat(product.regular_price);
    }
    
    /**
     * Get discount percentage
     */
    getDiscountPercentage(product) {
        if (!this.isOnSale(product)) return 0;
        
        const regular = parseFloat(product.regular_price);
        const sale = parseFloat(product.sale_price);
        return Math.round(((regular - sale) / regular) * 100);
    }
    
    /**
     * Check if product is in stock
     */
    isInStock(product) {
        return product.stock_status === 'instock' && 
               (product.manage_stock === false || product.stock_quantity > 0);
    }
}

// Create global instance
window.WooAPI = new WooCommerceAPI();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WooCommerceAPI;
}

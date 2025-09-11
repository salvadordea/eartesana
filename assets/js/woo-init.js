/**
 * WooCommerce API Initializer
 * Creates a global WooAPI instance for all scripts to use
 */

// Wait for EstudioArtesanaConfig to be available
function initializeWooCommerceAPI() {
    return new Promise((resolve) => {
        function checkConfig() {
            if (typeof EstudioArtesanaConfig !== 'undefined' && 
                EstudioArtesanaConfig.woocommerce &&
                typeof WooCommerceAPI !== 'undefined') {
                
                try {
                    // Initialize global WooCommerce API instance
                    const config = EstudioArtesanaConfig.woocommerce;
                    window.WooAPI = new WooCommerceAPI({
                        baseURL: config.baseURL,
                        apiPath: '/wp-json/wc/v3'
                    });
                    
                    // Set credentials
                    window.WooAPI.setCredentials(config.consumerKey, config.consumerSecret);
                    
                    console.log('✅ WooCommerce API initialized globally');
                    resolve(window.WooAPI);
                    
                } catch (error) {
                    console.error('❌ Error initializing WooCommerce API:', error);
                    resolve(null);
                }
            } else {
                // Check again in 50ms
                setTimeout(checkConfig, 50);
            }
        }
        
        checkConfig();
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWooCommerceAPI);
} else {
    // DOM is already ready
    initializeWooCommerceAPI();
}

// Also make it available as a function for manual initialization
window.initializeWooCommerceAPI = initializeWooCommerceAPI;

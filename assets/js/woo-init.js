/**
 * WooCommerce API Initializer
 * Creates a global WooAPI instance for all scripts to use
 */

// Configuración fallback inline
const FALLBACK_WOOCOMMERCE_CONFIG = {
    baseURL: 'https://estudioartesana.com',
    consumerKey: 'ck_80b6b30ea578209890fd8725ab30cc53402185bc',
    consumerSecret: 'cs_b8a197caa4c8f71a9aa351ef867ee4b147f525a5'
};

// Wait for EstudioArtesanaConfig to be available
function initializeWooCommerceAPI() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 100; // 5 segundos máximo
        
        function checkConfig() {
            attempts++;
            
            // Verificar si ya tenemos window.WooAPI disponible
            if (window.WooAPI && typeof window.WooAPI.getProducts === 'function') {
                console.log('✅ WooCommerce API ya disponible');
                resolve(window.WooAPI);
                return;
            }
            
            let config = null;
            
            // Intento 1: Usar configuración global si existe
            if (typeof EstudioArtesanaConfig !== 'undefined' && EstudioArtesanaConfig.woocommerce) {
                config = EstudioArtesanaConfig.woocommerce;
                console.log('📝 Usando configuración global');
            } 
            // Intento 2: Usar configuración fallback
            else if (attempts > 20) {
                config = FALLBACK_WOOCOMMERCE_CONFIG;
                console.log('⚠️ Usando configuración fallback');
                // Crear el objeto global para compatibilidad
                if (typeof EstudioArtesanaConfig === 'undefined') {
                    window.EstudioArtesanaConfig = { woocommerce: config };
                }
            }
            
            // Si tenemos configuración, crear la API
            if (config && typeof WooCommerceAPI !== 'undefined') {
                try {
                    window.WooAPI = new WooCommerceAPI({
                        baseURL: config.baseURL,
                        apiPath: '/wp-json/wc/v3'
                    });
                    
                    window.WooAPI.setCredentials(config.consumerKey, config.consumerSecret);
                    console.log('✅ WooCommerce API initialized globally');
                    resolve(window.WooAPI);
                    return;
                } catch (error) {
                    console.error('❌ Error initializing WooCommerce API:', error);
                }
            }
            
            // Si llegamos al máximo de intentos, resolver con null
            if (attempts >= maxAttempts) {
                console.warn('⚠️ No se pudo inicializar WooCommerce API después de', maxAttempts, 'intentos');
                resolve(null);
                return;
            }
            
            // Intentar de nuevo
            setTimeout(checkConfig, 50);
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

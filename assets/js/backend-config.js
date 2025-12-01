// =====================================================
// BACKEND CONFIGURATION
// =====================================================
// Auto-detecta si estás en desarrollo o producción
// y configura las URLs del backend correctamente
//
// En desarrollo: usa localhost
// En producción: usa las URLs de Railway/tu servidor
// =====================================================

(function() {
    'use strict';

    // Detectar entorno
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('192.168.');

    // URLs del backend
    const PRODUCTION_BACKEND_URL = 'https://tu-app.up.railway.app'; // ← CAMBIAR ESTO después del deploy

    // Configuración de backend
    window.BACKEND_CONFIG = {
        // Email Service (puerto 3000)
        emailServiceUrl: isLocalhost
            ? 'http://localhost:3000'
            : PRODUCTION_BACKEND_URL,

        // Shipping Service (puerto 3001)
        shippingServiceUrl: isLocalhost
            ? 'http://localhost:3001'
            : PRODUCTION_BACKEND_URL,

        // Payment Service - Openpay (puerto 3002)
        PAYMENT_URL: isLocalhost
            ? 'http://localhost:3002'
            : PRODUCTION_BACKEND_URL,

        // Flags
        isProduction: !isLocalhost,
        isDevelopment: isLocalhost
    };

    // Log para debugging (solo en desarrollo)
    if (isLocalhost) {
        console.log('🔧 Backend Config (Development):', window.BACKEND_CONFIG);
    }

    // Advertencia si no se ha configurado la URL de producción
    if (!isLocalhost && PRODUCTION_BACKEND_URL.includes('tu-app')) {
        console.warn('⚠️ WARNING: Production backend URL not configured!');
        console.warn('Please update PRODUCTION_BACKEND_URL in assets/js/backend-config.js');
    }

})();

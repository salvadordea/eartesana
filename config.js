// Configuration file for Estudio Artesana Website
const EstudioArtesanaConfig = {
    // API Endpoints (para integración futura)
    api: {
        baseUrl: '/wp-json/wp/v2/',
        products: '/wp-json/wc/v3/products',
        mayoristas: '/wp-json/mayoristas/v1/',
        auth: '/wp-json/jwt-auth/v1/token'
    },
    
    // Carousel Settings
    carousel: {
        autoPlay: true,
        autoPlayInterval: 4000,
        pauseOnHover: true,
        swipeEnabled: true,
        keyboardNavigation: true
    },
    
    // Image Settings
    images: {
        lazyLoad: true,
        placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhcmdhbmRvLi4uPC90ZXh0Pjwvc3ZnPg==',
        formats: ['webp', 'jpg', 'png']
    },
    
    // Animation Settings
    animations: {
        enabled: true,
        duration: 600,
        easing: 'ease-in-out',
        threshold: 0.1
    },
    
    // Mobile Settings
    mobile: {
        breakpoint: 768,
        touchThreshold: 50,
        menuAnimation: true
    },
    
    // Search Settings
    search: {
        enabled: true,
        placeholder: 'Buscar productos...',
        minLength: 2,
        debounceTime: 300
    },
    
    // Product Categories
    categories: {
        accessories: {
            name: 'Accesorios',
            description: 'Collares, aretes y accesorios únicos',
            slug: 'accesorios',
            image: 'accessories-category.jpg'
        },
        notebooks: {
            name: 'Cuadernos',
            description: 'Cuadernos y libretas hechos a mano',
            slug: 'cuadernos',
            image: 'notebooks-category.jpg'
        },
        bags: {
            name: 'Bolsas',
            description: 'Bolsas y carteras de diseño único',
            slug: 'bolsas',
            image: 'bags-category.jpg'
        }
    },
    
    // WooCommerce API Configuration
    // USANDO SITIO EN LÍNEA: https://estudioartesana.com
    woocommerce: {
        // Sitio en producción
        baseURL: 'https://estudioartesana.com',
        consumerKey: 'ck_80b6b30ea578209890fd8725ab30cc53402185bc',
        consumerSecret: 'cs_b8a197caa4c8f71a9aa351ef867ee4b147f525a5',
        
        // Para desarrollo local (comentado)
        // baseURL: 'http://estudioartesana.local',
        // consumerKey: 'ck_f076c6425c99484dd5dc3e517473537d00eead69',
        // consumerSecret: 'cs_d40109bd2df9a8b5809e95dffccf38d60320244e'
    },
    
    // Contact Information
    contact: {
        email: 'info@estudioartesana.com',
        phone: '+52 123 456 7890',
        social: {
            instagram: 'https://instagram.com/estudioartesana',
            facebook: 'https://facebook.com/estudioartesana',
            whatsapp: 'https://wa.me/521234567890'
        }
    },
    
    // SEO Settings
    seo: {
        title: 'Estudio Artesana - Legado ancestral transformado en diseño',
        description: 'Descubre nuestra colección única de productos artesanales. Bolsas, accesorios y cuadernos hechos a mano con técnicas ancestrales.',
        keywords: 'artesanías, bolsas artesanales, accesorios, cuadernos, hecho a mano, diseño mexicano',
        ogImage: 'assets/images/hero-bag.jpg'
    },
    
    // Performance Settings
    performance: {
        prefetchLinks: true,
        lazyLoadImages: true,
        minifyAssets: true,
        enableServiceWorker: false // Set to true for PWA
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EstudioArtesanaConfig;
}

// Global access for vanilla JS
window.EstudioArtesanaConfig = EstudioArtesanaConfig;

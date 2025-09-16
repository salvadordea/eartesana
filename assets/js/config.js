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
    
    // Carousel Images (múltiples imágenes para el carrusel)
    carouselImages: [
        {
            id: 'hero1',
            cloudinaryId: 'hero-bag-main', // ID de imagen en Cloudinary
            localFallback: 'assets/images/hero-bag.jpg',
            title: 'Bolsas Artesanales Únicas',
            subtitle: 'Hechas a mano con técnicas ancestrales',
            ctaText: 'Ver Colección',
            ctaLink: 'tienda.html?category=bolsas'
        },
        {
            id: 'hero2', 
            cloudinaryId: 'hero-accessories',
            localFallback: 'assets/images/hero-accessories.jpg',
            title: 'Accesorios de Diseño',
            subtitle: 'Collares y aretes con identidad propia',
            ctaText: 'Explorar',
            ctaLink: 'tienda.html?category=accesorios'
        },
        {
            id: 'hero3',
            cloudinaryId: 'hero-notebooks',
            localFallback: 'assets/images/hero-notebooks.jpg', 
            title: 'Cuadernos Artesanales',
            subtitle: 'Para tus ideas más creativas',
            ctaText: 'Descubrir',
            ctaLink: 'tienda.html?category=cuadernos'
        },
        {
            id: 'hero4',
            cloudinaryId: 'hero-workshop',
            localFallback: 'assets/images/hero-workshop.jpg',
            title: 'Proceso Artesanal',
            subtitle: 'Cada pieza cuenta una historia',
            ctaText: 'Conocer Más',
            ctaLink: 'tienda.html'
        }
    ],

    // Product Categories
    categories: {
        accessories: {
            name: 'Accesorios',
            description: 'Collares, aretes y accesorios únicos',
            slug: 'accesorios',
            image: 'accessories-category.jpg',
            cloudinaryId: 'category-accessories',
            visible: true,
            order: 1
        },
        notebooks: {
            name: 'Cuadernos',
            description: 'Cuadernos y libretas hechos a mano',
            slug: 'cuadernos',
            image: 'notebooks-category.jpg',
            cloudinaryId: 'category-notebooks',
            visible: true,
            order: 2
        },
        bags: {
            name: 'Bolsas',
            description: 'Bolsas y carteras de diseño único',
            slug: 'bolsas',
            image: 'bags-category.jpg',
            cloudinaryId: 'category-bags',
            visible: true,
            order: 3
        },
        jewelry: {
            name: 'Joyería',
            description: 'Piezas únicas de joyería artesanal',
            slug: 'joyeria',
            image: 'jewelry-category.jpg',
            cloudinaryId: 'category-jewelry',
            visible: true,
            order: 4
        },
        textiles: {
            name: 'Textiles',
            description: 'Textiles y bordados tradicionales',
            slug: 'textiles',
            image: 'textiles-category.jpg',
            cloudinaryId: 'category-textiles',
            visible: false,
            order: 5
        }
    },
    
    // Cloudinary Configuration (para manejo de imágenes)
    cloudinary: {
        cloudName: 'dnnwltoob', // Tu Cloud Name de Cloudinary
        uploadPreset: 'unsigned', // Upload preset configurado como 'unsigned'
        apiKey: 'ms_ATx2d6jS-uLXKS1pRwuGitJg', // API Key (opcional, solo para eliminar imágenes)
        maxFileSize: 10 * 1024 * 1024, // 10MB máximo
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    },
    
    // Supabase Configuration (for admin authentication)
    supabase: {
        url: 'https://yrmfrfpyqctvwyhrhivl.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTg5MzUsImV4cCI6MjA3MzUzNDkzNX0.qEijwK3FlnqXP2qw0gl438Tt-Rd1vrfts1cXslUuteU'
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
    },
    
    // Promotional Banner Settings (Update monthly)
    promotion: {
        active: true,
        title: '¡OFERTA ESPECIAL!',
        description: '20% de descuento en tu primera compra',
        code: 'PRIMERA20',
        expiry: 'Válido hasta fin de mes',
        ctaText: '¡Compra Ahora!',
        ctaLink: 'tienda.html',
        icon: 'fas fa-gift', // FontAwesome icon class
        theme: 'default', // 'default', 'valentine', 'christmas', 'summer', etc.
        
        // Alternative promotions (switch between them)
        alternatives: {
            valentine: {
                title: '💝 SAN VALENTÍN ESPECIAL',
                description: '25% descuento en joyería y accesorios',
                code: 'AMOR25',
                expiry: 'Solo del 10 al 14 de febrero',
                icon: 'fas fa-heart',
                theme: 'valentine'
            },
            mother: {
                title: '🌸 DÍA DE LA MADRE',
                description: '30% descuento + envío gratis',
                code: 'MAMA30',
                expiry: 'Válido todo mayo',
                icon: 'fas fa-flower',
                theme: 'mother'
            },
            christmas: {
                title: '🎄 NAVIDAD MÁGICA',
                description: '40% descuento en compras mayores a $1000',
                code: 'NAVIDAD40',
                expiry: 'Del 1 al 25 de diciembre',
                icon: 'fas fa-gift',
                theme: 'christmas'
            },
            summer: {
                title: '☀️ VERANO ARTESANAL',
                description: '2x1 en bolsas seleccionadas',
                code: 'VERANO2X1',
                expiry: 'Junio, julio y agosto',
                icon: 'fas fa-sun',
                theme: 'summer'
            }
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EstudioArtesanaConfig;
}

// Global access for vanilla JS (solo en navegador)
if (typeof window !== 'undefined') {
    window.EstudioArtesanaConfig = EstudioArtesanaConfig;

    // Global Supabase configuration for AuthManager
    window.SUPABASE_CONFIG = {
        url: EstudioArtesanaConfig.supabase.url,
        anonKey: EstudioArtesanaConfig.supabase.anonKey
    };
}

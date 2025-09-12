/**
 * Category Images Configuration - Estudio Artesana
 * Maps category slugs to Cloudinary images
 */

// Cloudinary base URL for category images
const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/your-cloud-name/image/upload/';

// Category image mappings - update these URLs with your actual Cloudinary images
const CATEGORY_IMAGES = {
    // Main categories - Map to physical files in assets/images/categories/
    'backpacks': {
        url: 'assets/images/categories/backpacks.jpg',
        fallback: 'assets/images/categories/backpacks.jpg',
        alt: 'Mochilas artesanales'
    },
    'bolsas-cruzadas': {
        url: 'assets/images/categories/bolsas-cruzadas.jpg',
        fallback: 'assets/images/categories/bolsas-cruzadas.jpg',
        alt: 'Bolsas cruzadas de piel'
    },
    'bolsas-grandes': {
        url: 'assets/images/categories/bolsas-grandes.jpg',
        fallback: 'assets/images/categories/bolsas-grandes.jpg',
        alt: 'Bolsas grandes de piel'
    },
    'bolsas-de-mano': {
        url: 'assets/images/categories/bolsas-de-mano.jpg',
        fallback: 'assets/images/categories/bolsas-de-mano.jpg',
        alt: 'Bolsas de mano artesanales'
    },
    'bolsas-textil': {
        url: 'assets/images/categories/bolsas-textil.jpg',
        fallback: 'assets/images/categories/bolsas-textil.jpg',
        alt: 'Bolsas de textil'
    },
    'botelleras': {
        url: 'assets/images/categories/botelleras.jpg',
        fallback: 'assets/images/categories/botelleras.jpg',
        alt: 'Botelleras de piel'
    },
    'hogar': {
        url: 'assets/images/categories/hogar.jpg',
        fallback: 'assets/images/categories/hogar.jpg',
        alt: 'Artículos para el hogar'
    },
    'joyeria': {
        url: 'assets/images/categories/joyeria.jpg',
        fallback: 'assets/images/categories/joyeria.jpg',
        alt: 'Joyería artesanal'
    },
    'portacel': {
        url: 'assets/images/categories/portacel.jpg',
        fallback: 'assets/images/categories/portacel.jpg',
        alt: 'Porta celulares de piel'
    },
    'vestimenta': {
        url: 'assets/images/categories/vestimenta.jpg',
        fallback: 'assets/images/categories/vestimenta.jpg',
        alt: 'Vestimenta artesanal'
    },
    // Legacy mappings for backward compatibility
    'aretes-de-piel': {
        url: 'assets/images/categories/joyeria.jpg',
        fallback: 'assets/images/categories/joyeria.jpg',
        alt: 'Aretes de piel artesanales'
    },
    'bolsas': {
        url: 'assets/images/categories/bolsas-grandes.jpg',
        fallback: 'assets/images/categories/bolsas-grandes.jpg',
        alt: 'Bolsas de piel artesanales'
    },
    'accesorios': {
        url: 'assets/images/categories/portacel.jpg',
        fallback: 'assets/images/categories/portacel.jpg',
        alt: 'Accesorios de piel'
    },
    'cuadernos': {
        url: 'assets/images/categories/hogar.jpg',
        fallback: 'assets/images/categories/hogar.jpg',
        alt: 'Cuadernos de piel'
    },
    'carteras': {
        url: 'assets/images/categories/bolsas-de-mano.jpg',
        fallback: 'assets/images/categories/bolsas-de-mano.jpg',
        alt: 'Carteras de piel'
    },
    'cinturones': {
        url: 'assets/images/categories/vestimenta.jpg',
        fallback: 'assets/images/categories/vestimenta.jpg',
        alt: 'Cinturones de piel'
    }
};

/**
 * Get category image URL and metadata
 * @param {string} categorySlug - The category slug
 * @param {Object} category - The category object from WooCommerce API (optional)
 * @returns {Object} Image data with url, fallback, and alt text
 */
function getCategoryImage(categorySlug, category = null) {
    // Try to get mapped image first
    if (CATEGORY_IMAGES[categorySlug]) {
        return CATEGORY_IMAGES[categorySlug];
    }
    
    // Try to use WordPress image if available
    if (category && category.image && category.image.src) {
        return {
            url: category.image.src,
            fallback: 'assets/images/category-placeholder.jpg',
            alt: category.name || 'Categoría'
        };
    }
    
    // Default fallback
    return {
        url: 'assets/images/category-placeholder.jpg',
        fallback: 'assets/images/category-placeholder.jpg',
        alt: category ? category.name : 'Categoría'
    };
}

/**
 * Preload category images for better performance
 * @param {Array} categories - Array of category objects
 */
function preloadCategoryImages(categories) {
    categories.forEach(category => {
        const imageData = getCategoryImage(category.slug, category);
        
        // Create image element to preload
        const img = new Image();
        img.onload = () => {
            console.log(`Category image preloaded: ${category.slug}`);
        };
        img.onerror = () => {
            console.warn(`Failed to load category image: ${category.slug}, using fallback`);
        };
        img.src = imageData.url;
        
        // Also preload fallback if different
        if (imageData.url !== imageData.fallback) {
            const fallbackImg = new Image();
            fallbackImg.src = imageData.fallback;
        }
    });
}

/**
 * Create image element with error handling
 * @param {string} categorySlug - The category slug
 * @param {Object} category - The category object (optional)
 * @returns {HTMLImageElement} Image element with error handling
 */
function createCategoryImageElement(categorySlug, category = null) {
    const imageData = getCategoryImage(categorySlug, category);
    const img = document.createElement('img');
    
    img.src = imageData.url;
    img.alt = imageData.alt;
    img.loading = 'lazy';
    
    // Handle image load errors
    img.onerror = function() {
        console.warn(`Failed to load category image: ${categorySlug}, using fallback`);
        this.src = imageData.fallback;
        this.onerror = null; // Prevent infinite loop
    };
    
    return img;
}

// Export functions for use in other modules
window.CategoryImages = {
    getCategoryImage,
    preloadCategoryImages,
    createCategoryImageElement,
    CATEGORY_IMAGES
};

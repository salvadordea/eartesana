/**
 * Category Images Configuration - Estudio Artesana
 * Maps category slugs to Cloudinary images
 */

// Cloudinary base URL for category images
const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/your-cloud-name/image/upload/';

// Category image mappings - update these URLs with your actual Cloudinary images
const CATEGORY_IMAGES = {
    // Main categories
    'aretes-de-piel': {
        url: `${CLOUDINARY_BASE_URL}c_fill,w_400,h_300/v1/categories/aretes-de-piel`,
        fallback: 'assets/images/categories/aretes-de-piel.jpg',
        alt: 'Aretes de piel artesanales'
    },
    'bolsas': {
        url: `${CLOUDINARY_BASE_URL}c_fill,w_400,h_300/v1/categories/bolsas`,
        fallback: 'assets/images/categories/bolsas.jpg',
        alt: 'Bolsas de piel artesanales'
    },
    'accesorios': {
        url: `${CLOUDINARY_BASE_URL}c_fill,w_400,h_300/v1/categories/accesorios`,
        fallback: 'assets/images/categories/accesorios.jpg',
        alt: 'Accesorios de piel'
    },
    'joyeria': {
        url: `${CLOUDINARY_BASE_URL}c_fill,w_400,h_300/v1/categories/joyeria`,
        fallback: 'assets/images/categories/joyeria.jpg',
        alt: 'Joyería artesanal'
    },
    'cuadernos': {
        url: `${CLOUDINARY_BASE_URL}c_fill,w_400,h_300/v1/categories/cuadernos`,
        fallback: 'assets/images/categories/cuadernos.jpg',
        alt: 'Cuadernos de piel'
    },
    'carteras': {
        url: `${CLOUDINARY_BASE_URL}c_fill,w_400,h_300/v1/categories/carteras`,
        fallback: 'assets/images/categories/carteras.jpg',
        alt: 'Carteras de piel'
    },
    'cinturones': {
        url: `${CLOUDINARY_BASE_URL}c_fill,w_400,h_300/v1/categories/cinturones`,
        fallback: 'assets/images/categories/cinturones.jpg',
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

/**
 * SIMPLIFIED IMAGE DETECTOR - JPG ONLY
 * ====================================
 * Simplified version for when all images are converted to JPG format
 * Much faster and simpler than the multi-format detector
 */

class SimpleImageDetector {
    constructor() {
        // Cache for image existence results
        this.existsCache = new Map();
    }

    /**
     * Build JPG image URL with proper encoding
     * @param {string} basePath - Base path without extension
     * @returns {string} - Properly encoded JPG URL
     */
    buildImageUrl(basePath) {
        // Handle Supabase URLs specifically
        if (basePath.includes('supabase.co') || basePath.startsWith('https://')) {
            return this.encodeImageUrl(`${basePath}.jpg`);
        }

        // For relative paths, assume Supabase bucket
        const supabaseBase = 'https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images';
        return this.encodeImageUrl(`${supabaseBase}/${basePath}.jpg`);
    }

    /**
     * Properly encode image URL to handle spaces and special characters
     * @param {string} url - Original URL
     * @returns {string} - Encoded URL
     */
    encodeImageUrl(url) {
        const urlParts = url.split('/');
        const baseIndex = urlParts.findIndex(part => part === 'product-images');

        if (baseIndex !== -1 && baseIndex < urlParts.length - 1) {
            // Encode only the path parts after 'product-images'
            for (let i = baseIndex + 1; i < urlParts.length; i++) {
                if (i === urlParts.length - 1) {
                    // For the file name, encode everything except the extension
                    const fileName = urlParts[i];
                    const lastDotIndex = fileName.lastIndexOf('.');
                    if (lastDotIndex > 0) {
                        const name = fileName.substring(0, lastDotIndex);
                        const ext = fileName.substring(lastDotIndex);
                        urlParts[i] = encodeURIComponent(name) + ext;
                    } else {
                        urlParts[i] = encodeURIComponent(fileName);
                    }
                } else {
                    // For folder names, encode the entire segment
                    urlParts[i] = encodeURIComponent(urlParts[i]);
                }
            }
        }

        return urlParts.join('/');
    }

    /**
     * Load image with fallback to placeholder
     * @param {string} basePath - Base path without extension
     * @param {function} onSuccess - Callback with successful URL
     * @param {function} onError - Optional callback if image not found
     */
    loadImage(basePath, onSuccess, onError = null) {
        const cacheKey = basePath.toLowerCase().replace(/[^a-z0-9]/g, '_');

        // Check cache first
        if (this.existsCache.has(cacheKey)) {
            const cachedResult = this.existsCache.get(cacheKey);
            if (cachedResult) {
                onSuccess(cachedResult);
                return;
            }
        }

        const imageUrl = this.buildImageUrl(basePath);

        // Test if image exists
        const img = new Image();

        const timeout = setTimeout(() => {
            this.existsCache.set(cacheKey, null);
            const fallback = this.getDefaultPlaceholder();
            if (onError) {
                onError(fallback);
            } else {
                onSuccess(fallback);
            }
        }, 3000);

        img.onload = () => {
            clearTimeout(timeout);
            this.existsCache.set(cacheKey, imageUrl);
            onSuccess(imageUrl);
        };

        img.onerror = () => {
            clearTimeout(timeout);
            this.existsCache.set(cacheKey, null);
            const fallback = this.getDefaultPlaceholder();
            if (onError) {
                onError(fallback);
            } else {
                onSuccess(fallback);
            }
        };

        img.src = imageUrl;
    }

    /**
     * Get default placeholder image URL
     * @returns {string} - Placeholder URL
     */
    getDefaultPlaceholder() {
        return './assets/images/placeholder-product.jpg';
    }

    /**
     * Build product image path from components
     * @param {string} category - Product category
     * @param {string} product - Product name
     * @param {string} variant - Variant name (optional)
     * @returns {string} - Base path for image
     */
    buildProductPath(category, product, variant = null) {
        const parts = [category, product];
        if (variant) {
            parts.push(variant);
        }
        return parts.join('/');
    }

    /**
     * Build variant image path
     * @param {string} category - Product category
     * @param {string} product - Product name
     * @param {string} variant - Variant name
     * @returns {string} - Base path for variant image
     */
    buildVariantPath(category, product, variant) {
        return `${category}/${product}/${variant}`;
    }

    /**
     * Build principal/main image path
     * @param {string} category - Product category
     * @param {string} product - Product name
     * @returns {string} - Base path for main image
     */
    buildPrincipalPath(category, product) {
        return `${category}/${product}/principal`;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.existsCache.clear();
        console.log('🧹 Image cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} - Cache stats
     */
    getCacheStats() {
        const total = this.existsCache.size;
        const successful = Array.from(this.existsCache.values()).filter(v => v !== null).length;
        const failed = total - successful;

        return {
            total,
            successful,
            failed,
            hitRate: total > 0 ? (successful / total * 100).toFixed(1) + '%' : '0%'
        };
    }

    /**
     * Preload images for better user experience
     * @param {Array} imagePaths - Paths to preload
     */
    preloadImages(imagePaths) {
        imagePaths.forEach(basePath => {
            this.loadImage(basePath, () => {
                // Image loaded and cached
            });
        });
    }
}

// Create global instance
window.imageDetector = new SimpleImageDetector();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleImageDetector;
}
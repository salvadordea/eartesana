/**
 * UNIVERSAL IMAGE FORMAT DETECTOR
 * ==============================
 * Handles detection and loading of images in multiple formats (webp, png, jpg, jpeg)
 * with smart fallbacks and URL encoding for Supabase storage
 */

class ImageFormatDetector {
    constructor() {
        // Supported formats in order of preference (webp first for best compression)
        this.supportedFormats = ['webp', 'png', 'jpg', 'jpeg'];

        // Cache for format detection results to avoid repeated requests
        this.formatCache = new Map();

        // Batch processing queue for efficient loading
        this.batchQueue = [];
        this.batchTimeout = null;
    }

    /**
     * Main method: Find and return the best available image format
     * @param {string} basePath - Base path without extension (e.g., "category/product/variant")
     * @param {function} onSuccess - Callback with successful URL
     * @param {function} onError - Optional callback if no format found
     * @param {string} fallbackUrl - Optional fallback URL
     */
    async detectBestFormat(basePath, onSuccess, onError = null, fallbackUrl = null) {
        const cacheKey = this.getCacheKey(basePath);

        // Check cache first
        if (this.formatCache.has(cacheKey)) {
            const cachedUrl = this.formatCache.get(cacheKey);
            if (cachedUrl) {
                onSuccess(cachedUrl);
                return;
            }
        }

        // Try formats in order of preference
        for (const format of this.supportedFormats) {
            const testUrl = this.buildImageUrl(basePath, format);

            if (await this.checkImageExists(testUrl)) {
                // Cache successful result
                this.formatCache.set(cacheKey, testUrl);
                onSuccess(testUrl);
                return;
            }
        }

        // No format found, use fallback
        const finalFallback = fallbackUrl || this.getDefaultPlaceholder();
        this.formatCache.set(cacheKey, null); // Cache negative result

        if (onError) {
            onError(finalFallback);
        } else {
            onSuccess(finalFallback);
        }
    }

    /**
     * Batch detect multiple images for better performance
     * @param {Array} imagePaths - Array of base paths
     * @param {function} onComplete - Callback with results array
     */
    batchDetect(imagePaths, onComplete) {
        const promises = imagePaths.map(async (basePath) => {
            return new Promise((resolve) => {
                this.detectBestFormat(
                    basePath,
                    (url) => resolve({ basePath, url, found: true }),
                    (fallback) => resolve({ basePath, url: fallback, found: false })
                );
            });
        });

        Promise.allSettled(promises).then((results) => {
            const processedResults = results.map(result =>
                result.status === 'fulfilled' ? result.value :
                { basePath: '', url: this.getDefaultPlaceholder(), found: false }
            );
            onComplete(processedResults);
        });
    }

    /**
     * Build properly encoded image URL
     * @param {string} basePath - Base path without extension
     * @param {string} format - Image format (webp, png, jpg, jpeg)
     * @returns {string} - Properly encoded URL
     */
    buildImageUrl(basePath, format) {
        const fullPath = `${basePath}.${format}`;

        // Handle Supabase URLs specifically
        if (basePath.includes('supabase.co') || basePath.startsWith('https://')) {
            return this.encodeImageUrl(`${basePath}.${format}`);
        }

        // For relative paths, assume Supabase bucket
        const supabaseBase = 'https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images';
        return this.encodeImageUrl(`${supabaseBase}/${fullPath}`);
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
     * Check if an image URL exists
     * @param {string} url - Image URL to test
     * @returns {Promise<boolean>} - True if image exists
     */
    checkImageExists(url) {
        return new Promise((resolve) => {
            const img = new Image();

            const timeout = setTimeout(() => {
                resolve(false);
            }, 3000); // 3 second timeout

            img.onload = () => {
                clearTimeout(timeout);
                resolve(true);
            };

            img.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
            };

            img.src = url;
        });
    }

    /**
     * Get cache key for a base path
     * @param {string} basePath - Base image path
     * @returns {string} - Cache key
     */
    getCacheKey(basePath) {
        return basePath.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    /**
     * Get default placeholder image URL
     * @returns {string} - Placeholder URL
     */
    getDefaultPlaceholder() {
        return './assets/images/placeholder-product.jpg';
    }

    /**
     * Clear format cache (useful for testing or after bulk changes)
     */
    clearCache() {
        this.formatCache.clear();
        console.log('🧹 Image format cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} - Cache stats
     */
    getCacheStats() {
        const total = this.formatCache.size;
        const successful = Array.from(this.formatCache.values()).filter(v => v !== null).length;
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
            this.detectBestFormat(basePath,
                (url) => {
                    // Image found and cached
                    const img = new Image();
                    img.src = url;
                },
                () => {
                    // Failed to find, but cached negative result
                }
            );
        });
    }

    /**
     * Build product image path from components
     * @param {string} category - Product category
     * @param {string} product - Product name
     * @param {string} variant - Variant name (optional)
     * @returns {string} - Base path for image detection
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
}

// Create global instance
window.imageDetector = new ImageFormatDetector();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageFormatDetector;
}
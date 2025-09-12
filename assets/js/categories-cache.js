/**
 * Categories Cache Module - Sistema de caché localStorage para categorías
 * Compatible con WooCommerce REST API
 */

class CategoriesCache {
    constructor(config = {}) {
        this.cachePrefix = 'artesana_';
        this.categoriesKey = this.cachePrefix + 'categories';
        this.timestampKey = this.cachePrefix + 'categories_timestamp';
        this.cacheExpiry = config.cacheExpiry || (24 * 60 * 60 * 1000); // 24 horas por defecto
        this.maxRetries = config.maxRetries || 3;
        this.retryDelay = config.retryDelay || 1000; // 1 segundo
    }

    /**
     * Verifica si el caché está vigente
     */
    isCacheValid() {
        try {
            const timestamp = localStorage.getItem(this.timestampKey);
            if (!timestamp) return false;

            const cacheAge = Date.now() - parseInt(timestamp);
            return cacheAge < this.cacheExpiry;
        } catch (error) {
            console.error('Error checking cache validity:', error);
            return false;
        }
    }

    /**
     * Obtiene las categorías del caché
     */
    getCachedCategories() {
        try {
            if (!this.isCacheValid()) {
                this.clearCache();
                return null;
            }

            const cached = localStorage.getItem(this.categoriesKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Error retrieving cached categories:', error);
            this.clearCache();
            return null;
        }
    }

    /**
     * Guarda las categorías en el caché
     */
    setCachedCategories(categories) {
        try {
            if (!Array.isArray(categories)) {
                throw new Error('Categories must be an array');
            }

            localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
            localStorage.setItem(this.timestampKey, Date.now().toString());
            
            console.log(`Cached ${categories.length} categories`);
            return true;
        } catch (error) {
            console.error('Error caching categories:', error);
            // Si localStorage está lleno, intentar limpiar caché antiguo
            if (error.name === 'QuotaExceededError') {
                this.clearCache();
                try {
                    localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
                    localStorage.setItem(this.timestampKey, Date.now().toString());
                    return true;
                } catch (retryError) {
                    console.error('Error caching categories after cleanup:', retryError);
                }
            }
            return false;
        }
    }

    /**
     * Limpia el caché de categorías
     */
    clearCache() {
        try {
            localStorage.removeItem(this.categoriesKey);
            localStorage.removeItem(this.timestampKey);
            console.log('Categories cache cleared');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    /**
     * Obtiene categorías desde la API de WooCommerce con reintentos
     */
    async fetchCategoriesFromAPI(apiUrl, retryCount = 0) {
        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const categories = await response.json();
            
            if (!Array.isArray(categories)) {
                throw new Error('Invalid API response format');
            }

            return categories;
        } catch (error) {
            console.error(`API fetch attempt ${retryCount + 1} failed:`, error);
            
            if (retryCount < this.maxRetries) {
                console.log(`Retrying in ${this.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.fetchCategoriesFromAPI(apiUrl, retryCount + 1);
            }
            
            throw error;
        }
    }

    /**
     * Obtiene categorías con sistema de caché inteligente
     */
    async getCategories(apiUrl) {
        try {
            // Intentar obtener del caché primero
            const cachedCategories = this.getCachedCategories();
            if (cachedCategories && cachedCategories.length > 0) {
                console.log('Using cached categories');
                return {
                    categories: cachedCategories,
                    source: 'cache'
                };
            }

            // Si no hay caché válido, obtener de la API
            console.log('Fetching categories from API');
            const categories = await this.fetchCategoriesFromAPI(apiUrl);
            
            // Procesar y filtrar categorías
            const processedCategories = this.processCategories(categories);
            
            // Guardar en caché
            this.setCachedCategories(processedCategories);
            
            return {
                categories: processedCategories,
                source: 'api'
            };
        } catch (error) {
            console.error('Error getting categories:', error);
            
            // Como último recurso, intentar devolver caché expirado si existe
            const expiredCache = localStorage.getItem(this.categoriesKey);
            if (expiredCache) {
                try {
                    const categories = JSON.parse(expiredCache);
                    console.warn('Using expired cache as fallback');
                    return {
                        categories: categories,
                        source: 'expired_cache'
                    };
                } catch (parseError) {
                    console.error('Error parsing expired cache:', parseError);
                }
            }
            
            throw error;
        }
    }

    /**
     * Procesa y filtra las categorías obtenidas de la API
     */
    processCategories(rawCategories) {
        return rawCategories
            .filter(category => {
                // Filtrar categorías válidas
                return category.id && 
                       category.name && 
                       category.count > 0 && 
                       category.slug !== 'uncategorized';
            })
            .map(category => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
                count: category.count,
                description: category.description || '',
                image: category.image || null,
                parent: category.parent || 0,
                link: category.link || '',
                menu_order: category.menu_order || 0
            }))
            .sort((a, b) => {
                // Ordenar por menu_order y luego por nombre
                if (a.menu_order !== b.menu_order) {
                    return a.menu_order - b.menu_order;
                }
                return a.name.localeCompare(b.name);
            });
    }

    /**
     * Fuerza la actualización del caché
     */
    async forceRefresh(apiUrl) {
        this.clearCache();
        return await this.getCategories(apiUrl);
    }

    /**
     * Obtiene estadísticas del caché
     */
    getCacheStats() {
        const timestamp = localStorage.getItem(this.timestampKey);
        const cached = localStorage.getItem(this.categoriesKey);
        
        if (!timestamp || !cached) {
            return {
                isValid: false,
                isEmpty: true,
                lastUpdated: null,
                cacheAge: 0,
                categoriesCount: 0
            };
        }

        const lastUpdated = new Date(parseInt(timestamp));
        const cacheAge = Date.now() - parseInt(timestamp);
        const categoriesCount = JSON.parse(cached).length;

        return {
            isValid: this.isCacheValid(),
            isEmpty: false,
            lastUpdated: lastUpdated,
            cacheAge: cacheAge,
            categoriesCount: categoriesCount,
            expiresIn: this.cacheExpiry - cacheAge
        };
    }
}

// Exportar para uso global
window.CategoriesCache = CategoriesCache;

// Inicializar instancia global con configuración por defecto
window.categoriesCache = new CategoriesCache({
    cacheExpiry: 24 * 60 * 60 * 1000, // 24 horas
    maxRetries: 3,
    retryDelay: 1000
});

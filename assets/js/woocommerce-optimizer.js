/**
 * WooCommerce Performance Optimizer
 * Mejora el rendimiento de carga de categorías y productos
 */

class WooCommerceOptimizer {
    constructor() {
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            batchSize: 20,
            prefetchDelay: 100,
            cacheTimeout: 30 * 60 * 1000, // 30 minutos
            backgroundUpdateInterval: 10 * 60 * 1000 // 10 minutos
        };
        
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.backgroundWorker = null;
        
        this.init();
    }
    
    init() {
        // Optimizar configuración de WooAPI
        this.optimizeAPIConfig();
        
        // Iniciar worker en background
        this.startBackgroundWorker();
        
        // Escuchar eventos de red
        this.setupNetworkListeners();
        
        // Precargar datos críticos
        this.preloadCriticalData();
        
        console.log('🚀 WooCommerce Optimizer initialized');
    }
    
    optimizeAPIConfig() {
        if (!window.WooAPI) return;
        
        // Reducir timeout para requests más rápidos
        window.WooAPI.config.timeout = 15000; // 15 segundos en lugar de 30
        
        // Aumentar tamaño de caché
        window.WooAPI.cacheTimeout = this.config.cacheTimeout;
        
        // Interceptar requests para añadir optimizaciones
        const originalMakeRequest = window.WooAPI.makeRequest.bind(window.WooAPI);
        window.WooAPI.makeRequest = async (endpoint, options = {}) => {
            return await this.makeOptimizedRequest(originalMakeRequest, endpoint, options);
        };
    }
    
    async makeOptimizedRequest(originalMethod, endpoint, options = {}) {
        const startTime = performance.now();
        
        try {
            // Añadir parámetros de optimización específicos para WordPress
            if (options.params) {
                // Reducir datos innecesarios en respuestas
                options.params._fields = this.getOptimalFields(endpoint);
                
                // Usar compresión cuando sea posible
                if (!options.headers) options.headers = {};
                options.headers['Accept-Encoding'] = 'gzip, deflate';
            }
            
            const result = await originalMethod(endpoint, options);
            const endTime = performance.now();
            
            // Log performance para análisis
            this.logPerformance(endpoint, endTime - startTime, result?.length || 1);
            
            return result;
            
        } catch (error) {
            // Retry con backoff exponencial
            return await this.retryWithBackoff(originalMethod, endpoint, options);
        }
    }
    
    getOptimalFields(endpoint) {
        // Mapeo de campos optimales por endpoint para reducir payload
        const fieldMappings = {
            '/products/categories': 'id,name,slug,count,image,parent,description',
            '/products': 'id,name,slug,permalink,price,regular_price,sale_price,images,categories,stock_status,featured',
            default: null
        };
        
        return fieldMappings[endpoint] || fieldMappings.default;
    }
    
    async retryWithBackoff(originalMethod, endpoint, options, attempt = 1) {
        if (attempt > this.config.maxRetries) {
            throw new Error(`Failed after ${this.config.maxRetries} retries`);
        }
        
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await this.wait(delay);
        
        try {
            return await originalMethod(endpoint, options);
        } catch (error) {
            console.warn(`Retry ${attempt} failed for ${endpoint}:`, error.message);
            return await this.retryWithBackoff(originalMethod, endpoint, options, attempt + 1);
        }
    }
    
    startBackgroundWorker() {
        // Worker que actualiza caché en segundo plano
        this.backgroundWorker = setInterval(async () => {
            try {
                await this.backgroundCacheUpdate();
            } catch (error) {
                console.warn('Background cache update failed:', error);
            }
        }, this.config.backgroundUpdateInterval);
    }
    
    async backgroundCacheUpdate() {
        if (this.isProcessingQueue) return;
        
        console.log('🔄 Background cache update...');
        
        // Actualizar categorías más populares
        const topCategories = await this.getOptimizedCategories({
            hide_empty: true,
            per_page: 20,
            orderby: 'count',
            order: 'desc'
        });
        
        // Pre-cargar productos de categorías principales
        if (topCategories.length > 0) {
            const mainCategoryIds = topCategories.slice(0, 5).map(cat => cat.id);
            await this.prefetchCategoryProducts(mainCategoryIds);
        }
    }
    
    async getOptimizedCategories(options = {}) {
        // Intentar cache primero
        if (window.CategoriesPreloader?.isCacheValid()) {
            return window.CategoriesPreloader.getFilteredCategories(options);
        }
        
        // Caché no válido, hacer request optimizado
        const categories = await window.WooAPI.getCategories({
            ...options,
            _fields: 'id,name,slug,count,image,parent,description'
        });
        
        // Procesar y optimizar imágenes
        return this.processCategories(categories);
    }
    
    processCategories(categories) {
        return categories.map(category => {
            // Optimizar URLs de imágenes
            if (category.image?.src) {
                category.image.optimized_src = this.optimizeImageUrl(category.image.src);
            }
            
            // Añadir datos calculados útiles
            category.hasProducts = category.count > 0;
            category.displayName = category.name;
            
            // Limpiar descripción para mejor rendimiento
            if (category.description) {
                category.shortDescription = this.truncateText(category.description, 100);
            }
            
            return category;
        });
    }
    
    optimizeImageUrl(url, width = 300, height = 300) {
        // Añadir parámetros de optimización de WordPress/WooCommerce
        try {
            const urlObj = new URL(url);
            urlObj.searchParams.set('w', width);
            urlObj.searchParams.set('h', height);
            urlObj.searchParams.set('crop', '1');
            urlObj.searchParams.set('quality', '85');
            return urlObj.toString();
        } catch (e) {
            return url; // Return original if URL parsing fails
        }
    }
    
    async prefetchCategoryProducts(categoryIds) {
        const prefetchPromises = categoryIds.map(async (categoryId, index) => {
            // Escalonar requests para no saturar el servidor
            await this.wait(index * this.config.prefetchDelay);
            
            try {
                await window.WooAPI.getProducts({
                    category: categoryId,
                    per_page: 8,
                    orderby: 'popularity',
                    _fields: 'id,name,images,price,sale_price'
                });
            } catch (error) {
                console.warn(`Prefetch failed for category ${categoryId}:`, error);
            }
        });
        
        await Promise.allSettled(prefetchPromises);
    }
    
    async preloadCriticalData() {
        // Precargar datos críticos para la primera carga
        const criticalTasks = [
            // Categorías principales
            this.getOptimizedCategories({
                hide_empty: true,
                per_page: 12,
                orderby: 'count',
                order: 'desc'
            }),
            // Productos destacados
            window.WooAPI.getProducts({
                featured: true,
                per_page: 8,
                _fields: 'id,name,images,price,sale_price'
            })
        ];
        
        try {
            await Promise.allSettled(criticalTasks);
            console.log('✅ Critical data preloaded');
        } catch (error) {
            console.warn('⚠️ Critical data preload partially failed:', error);
        }
    }
    
    setupNetworkListeners() {
        // Detectar cambios de red para ajustar estrategia
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            const updateStrategy = () => {
                if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                    this.config.batchSize = 5;
                    this.config.prefetchDelay = 500;
                } else if (connection.effectiveType === '3g') {
                    this.config.batchSize = 10;
                    this.config.prefetchDelay = 200;
                } else {
                    this.config.batchSize = 20;
                    this.config.prefetchDelay = 100;
                }
            };
            
            connection.addEventListener('change', updateStrategy);
            updateStrategy(); // Set initial strategy
        }
    }
    
    logPerformance(endpoint, duration, itemCount) {
        const performance = {
            endpoint,
            duration: Math.round(duration),
            itemCount,
            timestamp: Date.now()
        };
        
        // Guardar en sessionStorage para análisis
        const perfLog = JSON.parse(sessionStorage.getItem('woo_perf_log') || '[]');
        perfLog.push(performance);
        
        // Mantener solo los últimos 50 registros
        if (perfLog.length > 50) {
            perfLog.splice(0, perfLog.length - 50);
        }
        
        sessionStorage.setItem('woo_perf_log', JSON.stringify(perfLog));
        
        // Log warnings para requests lentos
        if (duration > 3000) {
            console.warn(`🐌 Slow request: ${endpoint} took ${Math.round(duration)}ms`);
        }
    }
    
    // Utilidades
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    // API pública para diagnóstico
    getPerformanceStats() {
        const perfLog = JSON.parse(sessionStorage.getItem('woo_perf_log') || '[]');
        
        if (perfLog.length === 0) return null;
        
        const stats = {
            totalRequests: perfLog.length,
            averageTime: Math.round(perfLog.reduce((sum, p) => sum + p.duration, 0) / perfLog.length),
            slowRequests: perfLog.filter(p => p.duration > 3000).length,
            fastRequests: perfLog.filter(p => p.duration < 1000).length,
            endpoints: [...new Set(perfLog.map(p => p.endpoint))]
        };
        
        return stats;
    }
    
    async runDiagnostic() {
        console.log('🔍 Running WooCommerce diagnostic...');
        
        const results = {
            timestamp: new Date().toISOString(),
            tests: {}
        };
        
        // Test 1: Categories load time
        const categoriesStart = performance.now();
        try {
            const categories = await this.getOptimizedCategories({ per_page: 20 });
            results.tests.categories = {
                success: true,
                duration: Math.round(performance.now() - categoriesStart),
                count: categories.length
            };
        } catch (error) {
            results.tests.categories = {
                success: false,
                error: error.message
            };
        }
        
        // Test 2: Products load time
        const productsStart = performance.now();
        try {
            const products = await window.WooAPI.getProducts({ per_page: 12 });
            results.tests.products = {
                success: true,
                duration: Math.round(performance.now() - productsStart),
                count: products.length
            };
        } catch (error) {
            results.tests.products = {
                success: false,
                error: error.message
            };
        }
        
        // Test 3: Cache status
        const cacheInfo = window.CategoriesPreloader?.getCacheInfo();
        results.tests.cache = {
            hasCache: !!cacheInfo?.hasCache,
            isValid: !!cacheInfo?.isValid,
            count: cacheInfo?.count || 0,
            lastUpdate: cacheInfo?.lastUpdate
        };
        
        console.log('📊 Diagnostic results:', results);
        return results;
    }
    
    // Cleanup
    destroy() {
        if (this.backgroundWorker) {
            clearInterval(this.backgroundWorker);
            this.backgroundWorker = null;
        }
    }
}

// Optimizador de imágenes específico para categorías
class CategoryImageOptimizer {
    constructor() {
        this.imageCache = new Map();
        this.loadingImages = new Set();
    }
    
    async optimizeAndPreload(categories) {
        const imagePromises = categories.map(category => {
            if (category.image?.src && !this.loadingImages.has(category.image.src)) {
                return this.preloadImage(category.image.src);
            }
            return Promise.resolve();
        });
        
        await Promise.allSettled(imagePromises);
        return categories;
    }
    
    async preloadImage(src) {
        if (this.imageCache.has(src)) {
            return this.imageCache.get(src);
        }
        
        this.loadingImages.add(src);
        
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.imageCache.set(src, src);
                this.loadingImages.delete(src);
                resolve(src);
            };
            img.onerror = () => {
                this.loadingImages.delete(src);
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
        
        return promise;
    }
    
    createPlaceholder(width = 300, height = 300) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#f0f0f0');
        gradient.addColorStop(1, '#e0e0e0');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add text
        ctx.fillStyle = '#999';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Cargando...', width / 2, height / 2);
        
        return canvas.toDataURL();
    }
}

// Enhanced Categories Loader con todas las optimizaciones
class OptimizedCategoriesLoader {
    constructor() {
        this.optimizer = new WooCommerceOptimizer();
        this.imageOptimizer = new CategoryImageOptimizer();
        this.isLoading = false;
        this.loadedCategories = [];
    }
    
    async loadCategories(options = {}) {
        if (this.isLoading) {
            console.log('⏳ Categories already loading...');
            return this.loadedCategories;
        }
        
        this.isLoading = true;
        const startTime = performance.now();
        
        try {
            console.log('🚀 Loading optimized categories...');
            
            // Cargar con optimizaciones
            let categories = await this.optimizer.getOptimizedCategories({
                hide_empty: true,
                per_page: options.limit || 12,
                orderby: 'count',
                order: 'desc',
                ...options
            });
            
            // Optimizar imágenes
            categories = await this.imageOptimizer.optimizeAndPreload(categories);
            
            // Guardar para próximas llamadas
            this.loadedCategories = categories;
            
            const endTime = performance.now();
            console.log(`✅ Loaded ${categories.length} categories in ${Math.round(endTime - startTime)}ms`);
            
            return categories;
            
        } catch (error) {
            console.error('❌ Error loading optimized categories:', error);
            
            // Fallback a caché si existe
            const cachedCategories = window.CategoriesPreloader?.getTopCategories(options.limit || 12) || [];
            if (cachedCategories.length > 0) {
                console.log('📦 Using cached categories as fallback');
                return cachedCategories;
            }
            
            throw error;
        } finally {
            this.isLoading = false;
        }
    }
    
    async refreshCategories() {
        // Forzar actualización
        await window.CategoriesPreloader?.forceRefresh();
        this.loadedCategories = [];
        return await this.loadCategories();
    }
}

// Inicializar automáticamente
let wooOptimizer;
let optimizedLoader;

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.EstudioArtesanaConfig?.woocommerce && window.WooAPI) {
            wooOptimizer = new WooCommerceOptimizer();
            optimizedLoader = new OptimizedCategoriesLoader();
            
            // Hacer disponible globalmente
            window.WooOptimizer = wooOptimizer;
            window.OptimizedCategoriesLoader = optimizedLoader;
            
            console.log('🎯 WooCommerce optimization active');
        }
    }, 200);
});

// Cleanup al cerrar página
window.addEventListener('beforeunload', () => {
    if (wooOptimizer) {
        wooOptimizer.destroy();
    }
});

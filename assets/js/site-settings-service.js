/**
 * Site Settings Service - Estudio Artesana
 * =========================================
 * Servicio para manejar la configuración del sitio almacenada en Supabase
 *
 * Características:
 * - Carga configuración desde Supabase (compartida entre todos los usuarios)
 * - Cache local (localStorage) para rendimiento (5 minutos)
 * - Invalidación automática de cache
 * - Eventos para sincronización en tiempo real
 */

class SiteSettingsService {
    constructor() {
        this.supabase = null;
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos
        this.CACHE_KEY_PREFIX = 'site_settings_';
        this.initialized = false;

        this.init();
    }

    /**
     * Inicializar el servicio
     */
    async init() {
        // Esperar a que la configuración de Supabase esté disponible
        if (window.SUPABASE_CONFIG) {
            try {
                this.supabase = window.supabase.createClient(
                    window.SUPABASE_CONFIG.url,
                    window.SUPABASE_CONFIG.anonKey
                );
                this.initialized = true;
                console.log('✅ SiteSettingsService initialized');
            } catch (error) {
                console.error('❌ Error initializing SiteSettingsService:', error);
            }
        } else {
            // Reintentar después de un momento
            setTimeout(() => this.init(), 500);
        }
    }

    /**
     * Obtener configuración por clave (con cache)
     * @param {string} key - Clave de configuración (ej: 'contactInfo')
     * @param {boolean} forceRefresh - Forzar carga desde DB sin usar cache
     * @returns {Promise<Object|null>} - Valor de configuración
     */
    async getSetting(key, forceRefresh = false) {
        if (!this.initialized) {
            console.warn('⚠️ SiteSettingsService not initialized yet');
            await this.waitForInit();
        }

        const cacheKey = this.CACHE_KEY_PREFIX + key;

        // Usar cache si no se fuerza refresh
        if (!forceRefresh) {
            const cached = this.getCachedSetting(cacheKey);
            if (cached) {
                console.log(`📦 Using cached setting: ${key}`);
                return cached;
            }
        }

        // Cargar desde Supabase
        try {
            console.log(`🌐 Loading setting from Supabase: ${key}`);

            const { data, error } = await this.supabase
                .from('site_settings')
                .select('value')
                .eq('key', key)
                .single();

            if (error) {
                console.error(`❌ Error loading setting ${key}:`, error);
                return null;
            }

            if (!data) {
                console.warn(`⚠️ Setting not found: ${key}`);
                return null;
            }

            // Cachear resultado localmente
            this.cacheSetting(cacheKey, data.value);
            console.log(`✅ Setting loaded and cached: ${key}`);

            return data.value;

        } catch (error) {
            console.error(`❌ Unexpected error loading setting ${key}:`, error);
            return null;
        }
    }

    /**
     * Guardar/Actualizar configuración (solo para admin)
     * @param {string} key - Clave de configuración
     * @param {Object} value - Valor de configuración (será JSON)
     * @returns {Promise<Object>} - Configuración guardada
     */
    async setSetting(key, value) {
        if (!this.initialized) {
            throw new Error('SiteSettingsService not initialized');
        }

        try {
            console.log(`💾 Saving setting to Supabase: ${key}`);

            // Obtener usuario autenticado
            const { data: { user } } = await this.supabase.auth.getUser();

            const settingData = {
                key: key,
                value: value,
                updated_at: new Date().toISOString()
            };

            // Agregar updated_by si hay usuario
            if (user) {
                settingData.updated_by = user.id;
            }

            const { data, error } = await this.supabase
                .from('site_settings')
                .upsert(settingData)
                .select()
                .single();

            if (error) {
                throw new Error(`Error saving setting: ${error.message}`);
            }

            // Actualizar cache local
            const cacheKey = this.CACHE_KEY_PREFIX + key;
            this.cacheSetting(cacheKey, value);

            // Disparar evento para actualizar UI en tiempo real
            window.dispatchEvent(new CustomEvent('settingUpdated', {
                detail: { key, value, timestamp: new Date().toISOString() }
            }));

            // También disparar evento de storage para sincronizar pestañas
            try {
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'site_setting_' + key,
                    newValue: JSON.stringify(value)
                }));
            } catch (e) {
                console.warn('Could not dispatch storage event:', e);
            }

            console.log(`✅ Setting saved successfully: ${key}`);
            return data;

        } catch (error) {
            console.error(`❌ Error saving setting ${key}:`, error);
            throw error;
        }
    }

    /**
     * Obtener configuración desde cache local
     * @param {string} cacheKey - Clave de cache
     * @returns {Object|null} - Valor cacheado o null si expiró
     */
    getCachedSetting(cacheKey) {
        try {
            const cached = localStorage.getItem(cacheKey);
            const timestamp = localStorage.getItem(cacheKey + '_time');

            if (!cached || !timestamp) {
                return null;
            }

            // Verificar si el cache expiró
            const age = Date.now() - parseInt(timestamp);
            if (age > this.CACHE_DURATION) {
                console.log(`⏰ Cache expired for: ${cacheKey}`);
                this.clearCacheKey(cacheKey);
                return null;
            }

            return JSON.parse(cached);

        } catch (error) {
            console.warn('Error reading cache:', error);
            return null;
        }
    }

    /**
     * Guardar configuración en cache local
     * @param {string} cacheKey - Clave de cache
     * @param {Object} value - Valor a cachear
     */
    cacheSetting(cacheKey, value) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify(value));
            localStorage.setItem(cacheKey + '_time', Date.now().toString());
        } catch (error) {
            console.warn('Error saving to cache:', error);
        }
    }

    /**
     * Limpiar una clave específica del cache
     * @param {string} cacheKey - Clave de cache a limpiar
     */
    clearCacheKey(cacheKey) {
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheKey + '_time');
    }

    /**
     * Limpiar todo el cache de settings
     */
    clearAllCache() {
        console.log('🧹 Clearing all site settings cache...');

        const keys = Object.keys(localStorage);
        let cleared = 0;

        keys.forEach(key => {
            if (key.startsWith(this.CACHE_KEY_PREFIX)) {
                localStorage.removeItem(key);
                cleared++;
            }
        });

        console.log(`✅ Cleared ${cleared} cache entries`);
    }

    /**
     * Invalidar cache específico y recargar
     * @param {string} key - Clave de configuración
     * @returns {Promise<Object>} - Nueva configuración cargada
     */
    async refreshSetting(key) {
        console.log(`🔄 Refreshing setting: ${key}`);
        const cacheKey = this.CACHE_KEY_PREFIX + key;
        this.clearCacheKey(cacheKey);
        return await this.getSetting(key, true);
    }

    /**
     * Obtener información del cache
     * @returns {Object} - Estadísticas del cache
     */
    getCacheInfo() {
        const keys = Object.keys(localStorage);
        const settingsKeys = keys.filter(k => k.startsWith(this.CACHE_KEY_PREFIX) && !k.endsWith('_time'));

        const info = {
            totalSettings: settingsKeys.length,
            settings: [],
            totalSizeKB: 0
        };

        settingsKeys.forEach(key => {
            const value = localStorage.getItem(key);
            const timestamp = localStorage.getItem(key + '_time');
            const age = timestamp ? Date.now() - parseInt(timestamp) : null;
            const isExpired = age ? age > this.CACHE_DURATION : true;

            info.settings.push({
                key: key.replace(this.CACHE_KEY_PREFIX, ''),
                size: value ? value.length : 0,
                age: age ? Math.round(age / 1000) : null, // en segundos
                isExpired: isExpired
            });

            if (value) {
                info.totalSizeKB += value.length;
            }
        });

        info.totalSizeKB = Math.round(info.totalSizeKB / 1024);

        return info;
    }

    /**
     * Esperar a que el servicio esté inicializado
     * @returns {Promise<void>}
     */
    async waitForInit() {
        const maxWait = 5000; // 5 segundos máximo
        const startTime = Date.now();

        while (!this.initialized && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!this.initialized) {
            throw new Error('SiteSettingsService initialization timeout');
        }
    }

    /**
     * Imprimir estadísticas del cache en consola
     */
    printCacheStats() {
        const info = this.getCacheInfo();
        console.log('📊 Site Settings Cache Stats:');
        console.log(`  Total settings cached: ${info.totalSettings}`);
        console.log(`  Total cache size: ${info.totalSizeKB} KB`);
        console.log(`  Cache duration: ${this.CACHE_DURATION / 1000 / 60} minutes`);

        if (info.settings.length > 0) {
            console.log('\n  Settings:');
            info.settings.forEach(s => {
                const status = s.isExpired ? '⏰ EXPIRED' : '✅ VALID';
                console.log(`    - ${s.key}: ${s.size} bytes, age: ${s.age}s ${status}`);
            });
        }
    }
}

// Crear instancia global
window.SiteSettingsService = new SiteSettingsService();

// Event listener para actualizaciones de configuración
window.addEventListener('settingUpdated', (event) => {
    console.log('📢 Setting updated:', event.detail.key);
});

console.log('✅ Site Settings Service loaded');

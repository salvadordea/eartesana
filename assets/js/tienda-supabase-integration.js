/**
 * INTEGRACIÓN DE TIENDA CON SUPABASE
 * ==================================
 * Script que conecta la funcionalidad de la tienda con Supabase API
 */

// Global state management for persistent data across navigation
window.EstArtesanaGlobalState = window.EstArtesanaGlobalState || {
    products: [],
    categories: [],
    isDataLoaded: false,
    lastLoadTime: null,
    cacheExpiryMinutes: 5 // Cache expires after 5 minutes
};

class TiendaSupabaseIntegration {
    constructor() {
        this.currentFilters = {
            category: null,
            search: '',
            minPrice: null,
            maxPrice: null,
            onSale: false,
            featured: false,
            inStock: false // Changed: don't filter by stock by default
        };
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentSort = 'title-asc';
        this.allProducts = [];
        this.allCategories = [];

        // Optimistic Loading System
        this.isInitialized = false;
        this.pendingCategorySelection = null;
        this.initializationPromise = null;

        // Enhanced Performance Optimization
        this.filteredProductsCache = new Map(); // Cache filtered results
        this.preloadedCategories = new Set(); // Track preloaded categories
        this.searchCache = new Map(); // Cache search results
        this.categoryCache = new Map(); // Cache category-specific results
        this.lastCacheCleanup = Date.now(); // Track cache cleanup time

        // Check if we have cached data
        this.globalState = window.EstArtesanaGlobalState;
        this.hasCachedData = this.checkCachedData();

        console.log('🛒 Integración Tienda-Supabase inicializada');
        if (this.hasCachedData) {
            console.log('🚀 Datos en caché encontrados, inicialización rápida disponible');
        }
    }

    async init() {
        console.log('🔄 Inicializando tienda...');

        try {
            // Verificar que el API esté disponible
            if (!window.artesanaAPI) {
                throw new Error('API de Supabase no disponible');
            }

            // Leer filtros iniciales desde URL
            this.readInitialFiltersFromURL();

            // Load data - use cache if available for fast initialization
            if (this.hasCachedData) {
                console.log('⚡ Inicialización rápida usando datos en caché');

                // Load from cache immediately
                this.loadFromCache();

                // Set up UI immediately
                this.renderCategoriesGrid();
                this.setupEventListeners();
                this.initializeSearch();

                // Mark as initialized immediately
                this.isInitialized = true;
                this.executePendingActions();

                console.log('🚀 Tienda inicializada instantáneamente desde caché');

                // Apply URL filters if present
                if (this.currentFilters.category || this.currentFilters.search) {
                    console.log('🔍 Aplicando filtros desde URL:', this.currentFilters);
                    this.renderProducts();
                }

                // Start preloading popular categories in background
                this.preloadPopularCategories();

                // Optionally refresh data in background (without blocking UI)
                this.refreshDataInBackground();

            } else {
                console.log('📥 Primera carga - obteniendo datos frescos');

                // First time load or cache expired
                await this.loadCategories();
                await this.loadProducts();

                // Save to cache for next time
                this.saveToCache();

                // Configure event listeners
                this.setupEventListeners();
                this.initializeSearch();

                // Mark as initialized and execute pending actions
                this.isInitialized = true;
                this.executePendingActions();

                console.log('✅ Tienda inicializada correctamente con datos frescos');

                // Apply URL filters if present
                if (this.currentFilters.category || this.currentFilters.search) {
                    console.log('🔍 Aplicando filtros desde URL:', this.currentFilters);
                    this.renderProducts();
                }

                // Start preloading popular categories in background
                this.preloadPopularCategories();
            }

        } catch (error) {
            console.error('❌ Error inicializando tienda:', error);
            this.showError('Error cargando la tienda');
        }
    }

    readInitialFiltersFromURL() {
        try {
            const params = new URLSearchParams(window.location.search);

            // Leer parámetros de categoría
            const categoryParam = params.get('category') || params.get('categoria');
            if (categoryParam) {
                this.currentFilters.category = categoryParam;
                console.log(`🔍 Categoría desde URL: ${categoryParam}`);
            }

            // Leer parámetro de búsqueda
            const searchParam = params.get('search') || params.get('s');
            if (searchParam) {
                this.currentFilters.search = searchParam;
                console.log(`🔍 Búsqueda desde URL: ${searchParam}`);
            }

        } catch (error) {
            console.warn('⚠️ Error leyendo parámetros URL:', error);
        }
    }

    // Cache Management Methods
    checkCachedData() {
        if (!this.globalState.isDataLoaded) return false;

        // Check if cache has expired
        if (this.globalState.lastLoadTime) {
            const now = new Date();
            const cacheTime = new Date(this.globalState.lastLoadTime);
            const diffMinutes = (now - cacheTime) / (1000 * 60);

            if (diffMinutes > this.globalState.cacheExpiryMinutes) {
                console.log(`⏰ Cache expired (${diffMinutes.toFixed(1)} minutes old), will refresh data`);
                this.globalState.isDataLoaded = false;
                return false;
            }
        }

        return this.globalState.products.length > 0 && this.globalState.categories.length > 0;
    }

    loadFromCache() {
        console.log('⚡ Cargando datos desde caché...');

        this.allProducts = [...this.globalState.products];
        this.allCategories = [...this.globalState.categories];

        console.log(`📦 ${this.allProducts.length} productos cargados desde caché`);
        console.log(`📂 ${this.allCategories.length} categorías cargadas desde caché`);
    }

    saveToCache() {
        console.log('💾 Guardando datos en caché...');

        this.globalState.products = [...this.allProducts];
        this.globalState.categories = [...this.allCategories];
        this.globalState.isDataLoaded = true;
        this.globalState.lastLoadTime = new Date().toISOString();

        console.log('✅ Datos guardados en caché global');
    }

    async refreshDataInBackground() {
        console.log('🔄 Actualizando datos en segundo plano...');

        try {
            // Use requestIdleCallback for non-blocking background updates
            if ('requestIdleCallback' in window) {
                requestIdleCallback(async () => {
                    await this.performBackgroundRefresh();
                }, { timeout: 5000 });
            } else {
                // Fallback for browsers without requestIdleCallback
                setTimeout(() => this.performBackgroundRefresh(), 2000);
            }

        } catch (error) {
            console.warn('⚠️ Error iniciando actualización en segundo plano:', error);
        }
    }

    async performBackgroundRefresh() {
        try {
            // Load fresh data without affecting UI
            const freshProducts = [];
            const freshCategories = [];

            // Get fresh data with timeout to prevent hanging
            const fetchWithTimeout = (promise, timeout = 10000) => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), timeout)
                    )
                ]);
            };

            // Fetch categories and products in parallel
            const [categoriesResponse, productsResponse] = await Promise.allSettled([
                fetchWithTimeout(window.artesanaAPI.getCategories()),
                fetchWithTimeout(window.artesanaAPI.getProducts(1, 100))
            ]);

            // Process categories
            if (categoriesResponse.status === 'fulfilled') {
                freshCategories.push(...categoriesResponse.value.categories);
            } else {
                console.warn('⚠️ Background categories refresh failed:', categoriesResponse.reason);
            }

            // Process products
            if (productsResponse.status === 'fulfilled') {
                freshProducts.push(...productsResponse.value.products);
            } else {
                console.warn('⚠️ Background products refresh failed:', productsResponse.reason);
            }

            // Only update cache if we got fresh data
            if (freshCategories.length > 0 && freshProducts.length > 0) {
                // Update global cache
                this.globalState.products = freshProducts;
                this.globalState.categories = freshCategories;
                this.globalState.lastLoadTime = new Date().toISOString();

                // Invalidate old filtered caches to force refresh with new data
                this.invalidateCache();

                // Optionally update local arrays if user isn't actively interacting
                if (!this.isUserInteracting()) {
                    this.allProducts = [...freshProducts];
                    this.allCategories = [...freshCategories];
                    this.updateCategoryBadges(); // Update counts with fresh data
                }

                console.log('✅ Datos actualizados en segundo plano');
            } else {
                console.log('⚠️ No se obtuvieron datos frescos completos, manteniendo cache');
            }

        } catch (error) {
            console.warn('⚠️ Error actualizando datos en segundo plano:', error);
            // Fail silently - user already has cached data working
        }
    }

    // Check if user is actively interacting (to avoid disrupting experience)
    isUserInteracting() {
        // Check if user has active filters, search, or recent navigation
        const hasFilters = this.currentFilters.category ||
                          this.currentFilters.search ||
                          this.currentFilters.minPrice ||
                          this.currentFilters.maxPrice;

        // Check if user was active in the last 30 seconds
        const lastActivity = this.lastUserActivity || 0;
        const isRecentlyActive = (Date.now() - lastActivity) < 30000;

        return hasFilters || isRecentlyActive;
    }

    // Track user activity for smarter background updates
    trackUserActivity() {
        this.lastUserActivity = Date.now();
    }

    // Format price with comma separators and superscript cents
    formatPrice(price) {
        if (!price) return '$0.00';

        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) return '$0.00';

        // Format with comma separators
        const formatted = numPrice.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Split into dollars and cents
        const [dollars, cents] = formatted.split('.');

        // Return with superscript cents
        return `$${dollars}.<sup>${cents}</sup>`;
    }

    updateURL() {
        try {
            const params = new URLSearchParams();

            if (this.currentFilters.category) {
                params.set('category', this.currentFilters.category);
            }

            if (this.currentFilters.search) {
                params.set('search', this.currentFilters.search);
            }

            const newUrl = params.toString() ?
                `${window.location.pathname}?${params.toString()}` :
                window.location.pathname;

            window.history.replaceState({}, '', newUrl);

        } catch (error) {
            console.warn('⚠️ Error actualizando URL:', error);
        }
    }

    // Optimistic Loading Methods
    executePendingActions() {
        if (this.pendingCategorySelection) {
            console.log(`🚀 Ejecutando selección pendiente: ${this.pendingCategorySelection}`);

            const categoryName = this.pendingCategorySelection;
            this.pendingCategorySelection = null;

            // Clear any loading messages
            this.clearLoadingStates();

            // Execute the category selection
            this.selectCategoryImmediate(categoryName);
        }
    }

    clearLoadingStates() {
        // Clear category loading states
        const loadingMessages = document.querySelectorAll('.category-loading-message');
        loadingMessages.forEach(msg => msg.remove());

        // Clear product loading states
        const productsLoading = document.getElementById('productsLoading');
        if (productsLoading) {
            productsLoading.style.display = 'none';
        }
    }

    showCategoryLoadingState(categoryName) {
        // Hide categories grid
        this.hideCategoriesWithAnimation();

        // Show loading message in products container
        const productsContainer = document.getElementById('productsContainer');
        const productsGrid = document.getElementById('productsGrid');

        if (productsContainer && productsGrid) {
            // Clear existing content
            productsGrid.innerHTML = '';

            // Show loading message
            const loadingMessage = document.createElement('div');
            loadingMessage.className = 'category-loading-message';
            loadingMessage.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="display: inline-block; margin-bottom: 20px;">
                        <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #333; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
                    </div>
                    <h3>${window.t ? window.t('shop.loading_products_category') : 'Cargando productos de'} ${categoryName}...</h3>
                    <p>${window.t ? window.t('shop.please_wait') : 'Un momento por favor'}</p>
                </div>

                <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                </style>
            `;

            productsGrid.appendChild(loadingMessage);
            this.showProductsSection();
        }
    }

    // Métodos auxiliares para normalización de categorías
    normalizeCategoryName(categoryName) {
        if (!categoryName) return '';

        return categoryName
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ') // Reemplazar múltiples espacios por uno solo
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/ñ/g, 'n');
    }

    categoryNamesMatch(cat1, cat2) {
        // Mapeo de nombres alternativos comunes
        const categoryAliases = {
            'portacel': ['portacelular', 'porta cel', 'porta celular', 'portacell'],
            'bolsas de mano': ['bolsas mano', 'bolsademano'],
            'bolsas grandes': ['bolsas grande', 'bolsa grande'],
            'bolsas cruzadas': ['bolsas cruzada', 'bolsa cruzada'],
            'botelleras': ['botellera', 'porta botellas'],
            'joyeria': ['joyería', 'jewelry'],
            'accesorios': ['accesorio']
        };

        // Verificar si coinciden con alias
        for (const [canonical, aliases] of Object.entries(categoryAliases)) {
            if ((cat1 === canonical || aliases.includes(cat1)) &&
                (cat2 === canonical || aliases.includes(cat2))) {
                return true;
            }
        }

        // Verificar coincidencia parcial para categorías compuestas
        const words1 = cat1.split(' ');
        const words2 = cat2.split(' ');

        // Si una categoría está contenida en la otra
        if (words1.length > 1 && words2.length === 1) {
            return words1.includes(words2[0]);
        }
        if (words2.length > 1 && words1.length === 1) {
            return words2.includes(words1[0]);
        }

        return false;
    }

    async loadCategories() {
        console.log('📂 Cargando categorías...');
        
        try {
            const response = await window.artesanaAPI.getCategories();
            this.allCategories = response.categories;
            
            console.log('🔍 DIAGNÓSTICO - Categorías raw de Supabase:', this.allCategories);
            console.log('🔍 DIAGNÓSTICO - Nombres de categorías:', this.allCategories.map(cat => cat.name));
            
            this.renderCategoriesGrid();
            this.renderCategoriesFilters();
            
            console.log(`✅ ${this.allCategories.length} categorías cargadas`);
            
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
            this.showCategoriesError();
        }
    }

    async loadProducts() {
        console.log('📦 Cargando productos...');
        
        try {
            const response = await window.artesanaAPI.getProducts(1, 100); // Cargar todos los productos
            this.allProducts = response.products;
            
            console.log('🔍 DIAGNÓSTICO - Productos raw de Supabase:', this.allProducts);
            console.log('🔍 DIAGNÓSTICO - Primer producto:', this.allProducts[0]);
            console.log('🔍 DIAGNÓSTICO - Categorías del primer producto:', this.allProducts[0]?.categories);
            console.log('🔍 DIAGNÓSTICO - Category_ids del primer producto:', this.allProducts[0]?.category_ids);
            
            // Update category badges with real counts now that products are loaded
            this.updateCategoryBadges();

            // NO renderizar productos inicialmente, solo cargar los datos
            console.log(`✅ ${this.allProducts.length} productos cargados`);

        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.showProductsError();
        }
    }

    renderCategoriesGrid() {
        const categoriesGrid = document.getElementById('categoriesGrid');
        const categoriesLoading = document.getElementById('categoriesLoading');
        
        if (!categoriesGrid) return;

        // Ocultar loading
        if (categoriesLoading) categoriesLoading.style.display = 'none';
        
        // Filtrar categorías con productos y ordenar según el orden especificado
        const categoryOrder = [
            'Joyería',
            'Accesorios', 
            'BOLSAS DE MANO',
            'BOLSAS TEXTIL Y PIEL',
            'Bolsas Cruzadas',
            'PORTACEL',
            'Bolsas grandes',
            'BACKPACKS',
            'BOTELLERAS',
            'HOGAR',
            'VESTIMENTA'
        ];
        
        const categoriesWithProducts = this.allCategories
            .filter(cat => cat.name !== 'Uncategorized')
            .sort((a, b) => {
                const indexA = categoryOrder.indexOf(a.name);
                const indexB = categoryOrder.indexOf(b.name);
                
                console.log(`📊 Ordenando categorías: "${a.name}" (índice ${indexA}) vs "${b.name}" (índice ${indexB})`);
                
                // Si ambas categorías están en el orden, usar ese orden
                if (indexA !== -1 && indexB !== -1) {
                    const result = indexA - indexB;
                    console.log(`🔄 Ambas en orden personalizado: ${a.name} (${indexA}) vs ${b.name} (${indexB}) = ${result}`);
                    return result;
                }
                // Si solo una está en el orden, priorizarla
                if (indexA !== -1) {
                    console.log(`⬆️ Priorizando ${a.name} (está en orden personalizado)`);
                    return -1;
                }
                if (indexB !== -1) {
                    console.log(`⬇️ Priorizando ${b.name} (está en orden personalizado)`);
                    return 1;
                }
                // Si ninguna está en el orden, ordenar alfabéticamente
                const result = a.name.localeCompare(b.name);
                console.log(`🔤 Orden alfabético: ${a.name} vs ${b.name} = ${result}`);
                return result;
            });
        
        console.log('🎯 Orden final de categorías en grid:', categoriesWithProducts.map(cat => cat.name));

        categoriesGrid.innerHTML = categoriesWithProducts.map(category => {
            // Progressive enhancement: show placeholder count if products not loaded yet
            let badgeHTML = '';
            if (this.allProducts.length > 0) {
                // Products loaded - show real count
                const productCount = this.getProductCountForCategory(category.id);
                if (productCount > 0) {
                    badgeHTML = `<div class="category-badge">${productCount}</div>`;
                }
            } else {
                // Products not loaded yet - show placeholder
                badgeHTML = `<div class="category-badge category-badge-placeholder">⋯</div>`;
            }

            return `
                <div class="category-card" data-category-name="${category.name}">
                    <div class="category-image">
                        <img src="${category.image || 'assets/images/category-placeholder.jpg'}"
                             alt="${category.name}" loading="lazy">
                    </div>
                    <div class="category-info">
                        <h3 class="category-name" ${this.getCategoryTranslationKey(category.name) ? `data-translate="${this.getCategoryTranslationKey(category.name)}"` : ''}>${category.name}</h3>
                    </div>
                    ${badgeHTML}
                </div>
            `;
        }).join('');

        // Trigger translation system to translate dynamic content
        if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
            console.log('🌐 Applying translations to tienda categories');
            window.TranslationSystem.applyTranslations();
        }

        // Add event listeners to category cards
        this.attachCategoryCardListeners();

        categoriesGrid.style.display = 'grid';
    }

    updateCategoryBadges() {
        // Update placeholders with real product counts
        const categoryCards = document.querySelectorAll('.category-card[data-category-name]');

        categoryCards.forEach(card => {
            const categoryName = card.getAttribute('data-category-name');
            const category = this.allCategories.find(cat => cat.name === categoryName);

            if (category) {
                const productCount = this.getProductCountForCategory(category.id);
                const badge = card.querySelector('.category-badge');

                if (badge) {
                    if (productCount > 0) {
                        badge.textContent = productCount;
                        badge.className = 'category-badge'; // Remove placeholder class
                    } else {
                        badge.remove(); // Remove badge if no products
                    }
                }
            }
        });

        console.log('🔄 Category badges updated with real product counts');
    }

    attachCategoryCardListeners() {
        const categoryCards = document.querySelectorAll('.category-card[data-category-name]');

        categoryCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const categoryName = card.getAttribute('data-category-name');
                console.log(`🎯 Category card clicked: ${categoryName}`);

                if (categoryName) {
                    this.selectCategory(categoryName);
                }
            });

            // Add hover effect for better UX
            card.style.cursor = 'pointer';
        });

        console.log(`✅ Attached listeners to ${categoryCards.length} category cards`);
    }

    renderCategoriesFilters() {
        const filtersContainer = document.getElementById('sidebarCategoryFilters');
        const loading = document.getElementById('categoryFiltersLoading');
        
        if (!filtersContainer) return;

        // Ocultar loading
        if (loading) loading.style.display = 'none';

        // Aplicar el mismo orden para los filtros
        const categoryOrder = [
            'Joyería',
            'Accesorios', 
            'BOLSAS DE MANO',
            'BOLSAS TEXTIL Y PIEL',
            'Bolsas Cruzadas',
            'PORTACEL',
            'Bolsas grandes',
            'BACKPACKS',
            'BOTELLERAS',
            'HOGAR',
            'VESTIMENTA'
        ];
        
        const categoriesWithProducts = this.allCategories
            .filter(cat => cat.name !== 'Uncategorized')
            .sort((a, b) => {
                const indexA = categoryOrder.indexOf(a.name);
                const indexB = categoryOrder.indexOf(b.name);
                
                if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                }
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.name.localeCompare(b.name);
            });

        filtersContainer.innerHTML = `
            <div class="category-filter ${!this.currentFilters.category ? 'active' : ''}" data-category="" onclick="tiendaIntegration.handleCategoryFilterClick('')">
                <span class="category-filter-name" data-translate="categories.all">Todas las categorías</span>
                <span class="category-count">${this.allProducts.length}</span>
            </div>
            ${categoriesWithProducts.map(category => `
                <div class="category-filter ${this.currentFilters.category === category.name ? 'active' : ''}" 
                     data-category="${category.name}" onclick="tiendaIntegration.handleCategoryFilterClick('${category.name}')">
                    <span class="category-filter-name" ${this.getCategoryTranslationKey(category.name) ? `data-translate="${this.getCategoryTranslationKey(category.name)}"` : ''}>${category.name}</span>
                    <span class="category-count">${this.getProductCountForCategory(category.id)}</span>
                </div>
            `).join('')}
        `;

        // Trigger translation system to translate sidebar filters
        if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
            console.log('🌐 Applying translations to tienda sidebar filters');
            window.TranslationSystem.applyTranslations();
        }
    }

    // Map category names to translation keys
    getCategoryTranslationKey(categoryName) {
        const mapping = {
            'Joyería': 'categories.joyeria',
            'Accesorios': 'categories.accesorios',
            'BOLSAS DE MANO': 'categories.bolsas',
            'BOLSAS TEXTIL Y PIEL': 'categories.bolsas',
            'Bolsas Cruzadas': 'categories.bolsas',
            'Cuadernos': 'categories.cuadernos',
            'Decoración': 'categories.decoracion',
            'Textiles': 'categories.textiles',
            'Cerámica': 'categories.ceramica',
            'Bolsas': 'categories.bolsas'
        };

        return mapping[categoryName] || null;
    }

    getProductCountForCategory(categoryId) {
        const matchingProducts = this.allProducts.filter(product => {
            // Usar categories array desde products_full
            return product.categories && product.categories.some(cat => 
                // Buscar por ID en category_ids o por nombre
                (product.category_ids && product.category_ids.includes(categoryId)) ||
                cat.toLowerCase() === this.getCategoryNameById(categoryId)?.toLowerCase()
            );
        });
        
        console.log(`🔢 Conteo para categoría ID ${categoryId}: ${matchingProducts.length} productos`);
        return matchingProducts.length;
    }

    getCategoryIdByName(categoryName) {
        const category = this.allCategories.find(cat => cat.name === categoryName);
        return category ? category.id : null;
    }
    
    getCategoryNameById(categoryId) {
        const category = this.allCategories.find(cat => cat.id == categoryId);
        return category ? category.name : null;
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        const productsLoading = document.getElementById('productsLoading');
        const productsResults = document.getElementById('productsResults');

        if (!productsGrid) return;

        // Hide categories grid if a category filter is active
        if (this.currentFilters.category || this.currentFilters.search) {
            this.hideCategoriesWithAnimation();
        } else {
            this.showCategoriesWithAnimation();
        }

        // Aplicar filtros
        let filteredProducts = this.applyFilters(this.allProducts);
        
        // Aplicar ordenamiento
        filteredProducts = this.applySorting(filteredProducts);

        // Ocultar loading
        if (productsLoading) productsLoading.style.display = 'none';

        // Actualizar contador de resultados
        if (productsResults) {
            const resultsCount = productsResults.querySelector('.results-count');
            if (resultsCount) {
                resultsCount.textContent = `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`;
            }
        }

        // Renderizar productos
        if (filteredProducts.length === 0) {
            document.getElementById('noResults')?.style.setProperty('display', 'block');
            productsGrid.style.display = 'none';
            return;
        }

        document.getElementById('noResults')?.style.setProperty('display', 'none');
        
        productsGrid.innerHTML = filteredProducts.map(product => `
            <div class="product-card" onclick="window.location.href='producto.html?id=${product.id}'">
                <div class="product-image">
                    <img src="${product.mainImage || 'assets/images/product-placeholder.jpg'}" 
                         alt="${product.name}" loading="lazy">
                    ${product.onSale ? `<span class="sale-badge" data-translate="shop.sale">${window.t ? window.t('shop.sale') : 'En Oferta'}</span>` : ''}
                    ${product.featured ? `<span class="featured-badge" data-translate="shop.featured">${window.t ? window.t('shop.featured') : 'Destacado'}</span>` : ''}
                </div>
                <div class="product-info">
                    <div class="product-categories">
                        ${product.category_id ? 
                            `<span class="product-category">${this.getCategoryNameById(product.category_id)}</span>` :
                            `<span class="product-category" data-translate="categories.uncategorized">${window.t ? window.t('categories.uncategorized') : 'Sin categoría'}</span>`
                        }
                    </div>
                    <h3 class="product-title" data-product-id="${product.id}" data-original-name="${product.name}">${this.getTranslatedProductName(product)}</h3>
                    <div class="product-price">
                        ${product.onSale && product.salePrice ?
                            `<span class="sale-price">${this.formatPrice(product.salePrice)}</span>
                             <span class="regular-price">${this.formatPrice(product.price)}</span>` :
                            `<span class="current-price">${this.formatPrice(product.price)}</span>`
                        }
                    </div>
                    <div class="product-rating">
                        ${this.renderStars(product.averageRating || 4.8)}
                        <span class="rating-count">(${product.totalSales || 0})</span>
                    </div>
                    <div class="product-stock">
                        ${this.renderStockStatus(product.totalStock, product.hasVariants)}
                    </div>
                </div>
            </div>
        `).join('');

        // Trigger translation system to translate product content
        if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
            console.log('🌐 Applying translations to products grid');
            window.TranslationSystem.applyTranslations();
        }

        productsGrid.style.display = 'grid';
    }

    // Optimized instant product rendering with enhanced lazy loading
    renderProductsInstant() {
        const productsGrid = document.getElementById('productsGrid');
        const productsLoading = document.getElementById('productsLoading');
        const productsResults = document.getElementById('productsResults');

        if (!productsGrid) return;

        // Try to get cached results first with TTL
        const cacheKey = this.getCacheKey();
        let filteredProducts = this.getCachedResults(cacheKey);

        if (!filteredProducts) {
            // Apply filters and cache the result with timestamp
            filteredProducts = this.applyFilters(this.allProducts);
            filteredProducts = this.applySorting(filteredProducts);
            this.setCachedResults(cacheKey, filteredProducts);
            console.log(`🔄 Results computed and cached: ${filteredProducts.length} products`);
        } else {
            console.log(`⚡ Using cached results: ${filteredProducts.length} products`);
        }

        // Update results counter
        if (productsResults) {
            const resultsCount = productsResults.querySelector('.results-count');
            if (resultsCount) {
                resultsCount.textContent = `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`;
            }
        }

        // Handle no results
        if (filteredProducts.length === 0) {
            if (productsLoading) productsLoading.style.display = 'none';
            document.getElementById('noResults')?.style.setProperty('display', 'block');
            productsGrid.style.display = 'none';
            return;
        }

        document.getElementById('noResults')?.style.setProperty('display', 'none');

        // Show skeleton loading for instant feedback
        this.showSkeletonLoading(productsGrid, Math.min(12, filteredProducts.length));

        // Progressive loading with better UX
        setTimeout(() => {
            this.renderProductsProgressive(filteredProducts, productsGrid, productsLoading);
        }, 50); // Small delay to show skeleton briefly
    }

    // Progressive product rendering for better perceived performance
    renderProductsProgressive(filteredProducts, productsGrid, productsLoading) {
        // Hide loading spinner
        if (productsLoading) productsLoading.style.display = 'none';

        // Clear grid and show first batch
        productsGrid.innerHTML = '';

        const batchSize = 6; // Render 6 products at a time for smoother experience
        let currentIndex = 0;

        const renderBatch = () => {
            const fragment = document.createDocumentFragment();
            const endIndex = Math.min(currentIndex + batchSize, filteredProducts.length);

            for (let i = currentIndex; i < endIndex; i++) {
                const productCard = this.createProductCard(filteredProducts[i]);
                fragment.appendChild(productCard);
            }

            productsGrid.appendChild(fragment);

            // Trigger translation system to translate newly added products
            if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
                console.log('🌐 Applying translations to newly added products');
                window.TranslationSystem.applyTranslations();
            }

            productsGrid.style.display = 'grid';

            currentIndex = endIndex;

            // Continue rendering if more products remain
            if (currentIndex < filteredProducts.length) {
                // Use requestIdleCallback for non-blocking rendering
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(() => renderBatch(), { timeout: 100 });
                } else {
                    // Fallback for browsers without requestIdleCallback
                    setTimeout(renderBatch, 16); // ~60fps
                }
            } else {
                console.log(`✅ ${filteredProducts.length} products rendered progressively`);
            }
        };

        // Start progressive rendering
        renderBatch();
    }

    // Show skeleton loading for instant feedback
    showSkeletonLoading(productsGrid, count) {
        const skeletonHtml = Array(count).fill(0).map(() => `
            <div class="product-card skeleton-card">
                <div class="product-image skeleton-shimmer">
                    <div class="skeleton-placeholder"></div>
                </div>
                <div class="product-info">
                    <div class="skeleton-text skeleton-shimmer" style="width: 60%; height: 12px; margin-bottom: 8px;"></div>
                    <div class="skeleton-text skeleton-shimmer" style="width: 100%; height: 16px; margin-bottom: 12px;"></div>
                    <div class="skeleton-text skeleton-shimmer" style="width: 40%; height: 14px;"></div>
                </div>
            </div>
        `).join('');

        productsGrid.innerHTML = skeletonHtml;
        productsGrid.style.display = 'grid';

        // Add skeleton CSS if not already added
        this.addSkeletonCSS();
    }

    // Add skeleton loading styles
    addSkeletonCSS() {
        if (document.getElementById('skeleton-styles')) return;

        const style = document.createElement('style');
        style.id = 'skeleton-styles';
        style.textContent = `
            .skeleton-card {
                pointer-events: none;
            }

            .skeleton-shimmer {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }

            .skeleton-placeholder {
                width: 100%;
                height: 200px;
                border-radius: 4px;
            }

            .skeleton-text {
                border-radius: 4px;
            }

            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Optimized product card creation using DOM methods (faster than innerHTML)
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => window.location.href = `producto.html?id=${product.id}`;

        // Create image container
        const imageDiv = document.createElement('div');
        imageDiv.className = 'product-image';

        const img = document.createElement('img');
        img.src = product.mainImage || 'assets/images/product-placeholder.jpg';
        img.alt = product.name;
        img.loading = 'lazy';
        imageDiv.appendChild(img);

        // Add badges if present
        if (product.onSale) {
            const saleBadge = document.createElement('span');
            saleBadge.className = 'sale-badge';
            saleBadge.setAttribute('data-translate', 'shop.sale');
            saleBadge.textContent = window.t ? window.t('shop.sale') : 'En Oferta';
            imageDiv.appendChild(saleBadge);
        }

        if (product.featured) {
            const featuredBadge = document.createElement('span');
            featuredBadge.className = 'featured-badge';
            featuredBadge.setAttribute('data-translate', 'shop.featured');
            featuredBadge.textContent = window.t ? window.t('shop.featured') : 'Destacado';
            imageDiv.appendChild(featuredBadge);
        }

        // Create product info
        const infoDiv = document.createElement('div');
        infoDiv.className = 'product-info';

        // Category
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'product-categories';
        const categorySpan = document.createElement('span');
        categorySpan.className = 'product-category';
        if (product.category_id) {
            categorySpan.textContent = this.getCategoryNameById(product.category_id);
        } else {
            categorySpan.setAttribute('data-translate', 'categories.uncategorized');
            categorySpan.textContent = window.t ? window.t('categories.uncategorized') : 'Sin categoría';
        }
        categoryDiv.appendChild(categorySpan);

        // Title
        const title = document.createElement('h3');
        title.className = 'product-title';
        title.textContent = product.name;

        // Price
        const priceDiv = document.createElement('div');
        priceDiv.className = 'product-price';

        if (product.onSale && product.salePrice) {
            const salePrice = document.createElement('span');
            salePrice.className = 'sale-price';
            salePrice.innerHTML = this.formatPrice(product.salePrice);

            const regularPrice = document.createElement('span');
            regularPrice.className = 'regular-price';
            regularPrice.innerHTML = this.formatPrice(product.price);

            priceDiv.appendChild(salePrice);
            priceDiv.appendChild(regularPrice);
        } else {
            const currentPrice = document.createElement('span');
            currentPrice.className = 'current-price';
            currentPrice.innerHTML = this.formatPrice(product.price);
            priceDiv.appendChild(currentPrice);
        }

        // Rating (use innerHTML for stars as it's more readable)
        const ratingDiv = document.createElement('div');
        ratingDiv.className = 'product-rating';
        ratingDiv.innerHTML = `
            ${this.renderStars(product.averageRating || 4.8)}
            <span class="rating-count">(${product.totalSales || 0})</span>
        `;

        // Stock (use innerHTML for complex content)
        const stockDiv = document.createElement('div');
        stockDiv.className = 'product-stock';
        stockDiv.innerHTML = this.renderStockStatus(product.totalStock, product.hasVariants);

        // Add to Cart button
        const cartButton = document.createElement('button');
        cartButton.className = 'product-cart-btn';
        cartButton.setAttribute('data-translate', 'shop.add_to_cart');
        cartButton.innerHTML = `<i class="fas fa-shopping-cart"></i> ${window.t ? window.t('shop.add_to_cart') : 'Agregar al Carrito'}`;

        // Prevent card click when clicking cart button
        cartButton.onclick = (e) => {
            e.stopPropagation();
            this.addProductToCart(product);
        };

        // Assemble card
        infoDiv.appendChild(categoryDiv);
        infoDiv.appendChild(title);
        infoDiv.appendChild(priceDiv);
        infoDiv.appendChild(ratingDiv);
        infoDiv.appendChild(stockDiv);
        infoDiv.appendChild(cartButton);

        card.appendChild(imageDiv);
        card.appendChild(infoDiv);

        return card;
    }

    // Add product to cart from tienda grid
    async addProductToCart(product) {
        try {
            console.log('🛒 Adding product to cart from tienda:', product.name);

            if (window.cartManager) {
                // Use CartManager
                const productData = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.mainImage,
                    slug: product.slug,
                    short_description: product.shortDescription || product.description
                };

                const result = await window.cartManager.addProduct(
                    product.id,
                    null, // No variant for grid add to cart
                    1,    // Quantity 1
                    productData
                );

                if (result.success) {
                    this.showCartNotification('Producto agregado al carrito', 'success');

                    // Open cart sidebar briefly
                    if (window.cartUI) {
                        setTimeout(() => {
                            window.cartUI.openCart();
                        }, 300);
                    }
                } else {
                    this.showCartNotification(result.message || 'Error agregando producto', 'error');
                }

            } else {
                // Fallback to manual cart
                this.addToCartManual(product);
            }

        } catch (error) {
            console.error('❌ Error adding product to cart:', error);
            this.showCartNotification('Error agregando producto al carrito', 'error');
        }
    }

    // Manual cart implementation fallback
    addToCartManual(product) {
        try {
            let cart = JSON.parse(localStorage.getItem('artesana_cart') || '[]');

            const existingItemIndex = cart.findIndex(item => item.id === product.id);

            if (existingItemIndex >= 0) {
                cart[existingItemIndex].quantity += 1;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.mainImage,
                    quantity: 1
                });
            }

            localStorage.setItem('artesana_cart', JSON.stringify(cart));
            this.showCartNotification('Producto agregado al carrito', 'success');

        } catch (error) {
            console.error('❌ Error with manual cart:', error);
            this.showCartNotification('Error agregando producto', 'error');
        }
    }

    // Show cart notification
    showCartNotification(message, type = 'info') {
        // Use cartUI notification if available
        if (window.cartUI && window.cartUI.showNotification) {
            window.cartUI.showNotification(message, type);
            return;
        }

        // Fallback notification
        const notification = document.createElement('div');
        notification.className = `tienda-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
            </div>
            <span>${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 12px 18px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Load remaining products in background
    loadRemainingProducts(remainingProducts, productsGrid) {
        const fragment = document.createDocumentFragment();

        remainingProducts.forEach(product => {
            const productCard = this.createProductCard(product);
            fragment.appendChild(productCard);
        });

        // Add remaining products to grid
        productsGrid.appendChild(fragment);
    }

    // Search functionality
    searchProducts(query = null) {
        const searchInput = document.getElementById('searchInput');
        const searchQuery = query || (searchInput ? searchInput.value.trim() : '');

        console.log(`🔍 Búsqueda ejecutada: "${searchQuery}"`);

        // Update search filter
        this.currentFilters.search = searchQuery;
        this.updateURL();

        // Clear category filter if searching (show all categories in results)
        if (searchQuery) {
            this.currentFilters.category = null;
            // Update active filter in sidebar
            const categoryFilters = document.querySelectorAll('#sidebarCategoryFilters .category-filter');
            categoryFilters.forEach(filter => filter.classList.remove('active'));
            document.querySelector('#sidebarCategoryFilters .category-filter[data-category=""]')?.classList.add('active');
        }

        // Render results instantly using our optimized method
        this.renderProductsInstant();

        // Show products section and hide categories if search has results
        if (searchQuery) {
            this.hideCategoriesWithAnimation();
            this.showProductsSection();

            // Scroll to top for search results
            requestAnimationFrame(() => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        } else {
            // If search is cleared, show categories again
            this.showCategoriesWithAnimation();
            this.hideProductsSection();
        }
    }

    // Initialize search functionality
    initializeSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = searchInput?.parentElement.querySelector('button');

        if (searchInput) {
            // Handle Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.searchProducts();
                }
            });

            // Handle real-time search (debounced)
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchProducts(e.target.value);
                }, 300); // 300ms debounce
            });
        }

        if (searchButton) {
            searchButton.onclick = () => this.searchProducts();
        }

        // Make search function globally available for compatibility
        window.searchProducts = () => this.searchProducts();

        // Initialize view toggle
        this.setupViewToggle();

        console.log('🔍 Search functionality initialized');
    }

    // Setup view toggle functionality
    setupViewToggle() {
        const viewButtons = document.querySelectorAll('.view-btn');
        const productsGrid = document.getElementById('productsGrid');

        console.log(`🔍 View toggle setup - buttons: ${viewButtons.length}, grid:`, productsGrid);

        if (!viewButtons.length || !productsGrid) {
            console.warn('⚠️ View toggle elements not found');
            return;
        }

        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const viewType = btn.getAttribute('data-view');

                // Update button states
                viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update grid layout
                if (viewType === 'list') {
                    productsGrid.classList.add('list-view');
                    productsGrid.classList.remove('grid-view');
                } else {
                    productsGrid.classList.add('grid-view');
                    productsGrid.classList.remove('list-view');
                }

                console.log(`🔄 View changed to: ${viewType}`);
            });
        });

        // Set initial grid view
        productsGrid.classList.add('grid-view');
        console.log('👁️ View toggle initialized');
    }

    // Enhanced performance optimization methods
    getCacheKey() {
        return JSON.stringify({
            category: this.currentFilters.category,
            search: this.currentFilters.search,
            minPrice: this.currentFilters.minPrice,
            maxPrice: this.currentFilters.maxPrice,
            onSale: this.currentFilters.onSale,
            featured: this.currentFilters.featured,
            inStock: this.currentFilters.inStock,
            sort: this.currentSort
        });
    }

    // Smart cache management with TTL
    getCachedResults(key, ttlMinutes = 5) {
        const cached = this.filteredProductsCache.get(key);
        if (!cached) return null;

        const now = Date.now();
        const age = (now - cached.timestamp) / (1000 * 60);

        if (age > ttlMinutes) {
            this.filteredProductsCache.delete(key);
            return null;
        }

        return cached.data;
    }

    // Cache with timestamp for TTL
    setCachedResults(key, data) {
        this.filteredProductsCache.set(key, {
            data: data,
            timestamp: Date.now()
        });

        // Cleanup old cache entries periodically
        if (Date.now() - this.lastCacheCleanup > 300000) { // 5 minutes
            this.cleanupOldCache();
        }
    }

    // Remove expired cache entries
    cleanupOldCache() {
        const now = Date.now();
        const maxAge = 10 * 60 * 1000; // 10 minutes

        for (const [key, cached] of this.filteredProductsCache) {
            if (now - cached.timestamp > maxAge) {
                this.filteredProductsCache.delete(key);
            }
        }

        this.lastCacheCleanup = now;
        console.log('🧹 Cache cleanup completed');
    }

    // Invalidate specific cache entries
    invalidateCache(pattern = null) {
        if (pattern) {
            // Invalidate specific pattern (e.g., category-related caches)
            for (const key of this.filteredProductsCache.keys()) {
                if (key.includes(pattern)) {
                    this.filteredProductsCache.delete(key);
                }
            }
        } else {
            // Clear all caches
            this.filteredProductsCache.clear();
            this.searchCache.clear();
            this.categoryCache.clear();
        }
    }

    // Preload popular categories in background
    preloadPopularCategories() {
        if (!this.isInitialized || this.allProducts.length === 0) return;

        // List of popular categories to preload
        const popularCategories = ['Joyería', 'Bolsas Grandes', 'Accesorios', 'PORTACEL'];

        popularCategories.forEach(categoryName => {
            if (!this.preloadedCategories.has(categoryName)) {
                requestIdleCallback(() => {
                    console.log(`🔄 Preloading category: ${categoryName}`);

                    // Simulate filtering for this category
                    const tempFilters = { ...this.currentFilters, category: categoryName };
                    const filtered = this.allProducts.filter(product => {
                        return product.categories && product.categories.some(cat =>
                            cat.toLowerCase() === categoryName.toLowerCase()
                        );
                    });

                    const sorted = this.applySorting(filtered);
                    const cacheKey = JSON.stringify({ ...tempFilters, sort: this.currentSort });

                    this.filteredProductsCache.set(cacheKey, sorted);
                    this.preloadedCategories.add(categoryName);

                    console.log(`✅ Preloaded ${sorted.length} products for ${categoryName}`);
                });
            }
        });
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        let starsHtml = '';
        
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }
        
        if (halfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }
        
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }
        
        return starsHtml;
    }

    renderStockStatus(totalStock, hasVariants) {
        // For products with variants, don't show stock status in the product card
        // Stock status should only be shown when a specific variant is selected
        if (hasVariants) {
            return ''; // Return empty string - no stock indicator for variant products in grid
        }

        // Debug stock value for simple products only
        console.log(`🔍 Stock Debug - totalStock: ${totalStock}, type: ${typeof totalStock}, hasVariants: ${hasVariants}`);

        let stock = 0;

        // Handle different stock value types
        if (typeof totalStock === 'string') {
            stock = parseInt(totalStock, 10);
        } else if (typeof totalStock === 'number') {
            stock = Math.floor(totalStock);
        }

        // If still NaN, default to 0
        if (isNaN(stock)) {
            console.warn(`⚠️ Invalid stock value: ${totalStock}, defaulting to 0`);
            stock = 0;
        }

        console.log(`✅ Final stock value: ${stock}`);

        if (stock === 0) {
            return `<span class="stock-status out-of-stock" data-translate="shop.out_of_stock"><i class="fas fa-times-circle"></i> ${window.t ? window.t('shop.out_of_stock') : 'Sin stock'}</span>`;
        } else if (stock <= 3) {
            return `<span class="stock-status low-stock"><i class="fas fa-exclamation-triangle"></i> ${window.t ? window.t('shop.stock_low') : 'Stock bajo'} (${stock})</span>`;
        } else if (stock <= 10) {
            return `<span class="stock-status medium-stock"><i class="fas fa-check-circle"></i> ${window.t ? window.t('shop.available') : 'Disponible'} (${stock})</span>`;
        } else {
            return `<span class="stock-status in-stock" data-translate="shop.in_stock"><i class="fas fa-check-circle"></i> ${window.t ? window.t('shop.in_stock') : 'En stock'} (${stock})</span>`;
        }
    }

    applyFilters(products) {
        console.log('🔍 DIAGNÓSTICO - Aplicando filtros:', this.currentFilters);
        console.log('🔍 DIAGNÓSTICO - Total productos antes de filtrar:', products.length);
        
        const filteredProducts = products.filter(product => {
            // Filtro por categoría (mejorado para manejar inconsistencias)
            if (this.currentFilters.category) {
                const categoryMatches = product.categories && product.categories.some(cat => {
                    // Normalizar nombres de categoría para comparación flexible
                    const normalizedCat = this.normalizeCategoryName(cat);
                    const normalizedFilter = this.normalizeCategoryName(this.currentFilters.category);

                    // Comparación exacta normalizada
                    if (normalizedCat === normalizedFilter) return true;

                    // Comparación con nombres comunes alternativos
                    return this.categoryNamesMatch(normalizedCat, normalizedFilter);
                });

                if (!categoryMatches) {
                    // Solo mostrar logs en desarrollo, no en producción
                    if (window.location.hostname === 'localhost') {
                        console.log(`❌ Producto "${product.name}" NO coincide con categoría "${this.currentFilters.category}". Categorías del producto:`, product.categories);
                    }
                    return false;
                }
            }

            // Filtro por búsqueda
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase();
                const matchName = product.name.toLowerCase().includes(searchTerm);
                const matchDescription = product.description && product.description.toLowerCase().includes(searchTerm);
                // Para búsqueda en categorías, buscar en el array categories
                const matchCategories = product.categories && product.categories.some(cat =>
                    cat.toLowerCase().includes(searchTerm)
                );
                
                if (!matchName && !matchDescription && !matchCategories) {
                    return false;
                }
            }

            // Filtro por precio
            if (this.currentFilters.minPrice && product.price < this.currentFilters.minPrice) {
                return false;
            }
            if (this.currentFilters.maxPrice && product.price > this.currentFilters.maxPrice) {
                return false;
            }

            // Filtros especiales
            if (this.currentFilters.onSale && !product.onSale) {
                return false;
            }
            if (this.currentFilters.featured && !product.featured) {
                return false;
            }
            if (this.currentFilters.inStock && (product.totalStock || 0) <= 0) {
                return false;
            }

            return true;
        });
        
        console.log('🔍 DIAGNÓSTICO - Total productos después de filtrar:', filteredProducts.length);
        console.log('🔍 DIAGNÓSTICO - Productos filtrados:', filteredProducts.map(p => p.name));
        
        return filteredProducts;
    }

    applySorting(products) {
        return [...products].sort((a, b) => {
            switch (this.currentSort) {
                case 'title-asc':
                    return a.name.localeCompare(b.name);
                case 'title-desc':
                    return b.name.localeCompare(a.name);
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'date-desc':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'date-asc':
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                case 'popularity':
                    return (b.totalSales || 0) - (a.totalSales || 0);
                default:
                    return 0;
            }
        });
    }

    setupEventListeners() {
        // Búsqueda
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.trackUserActivity(); // Track user interaction
                this.currentFilters.search = e.target.value;

                if (e.target.value.trim() !== '') {
                    // Si hay búsqueda, ocultar categorías y mostrar productos
                    this.hideCategoriesWithAnimation();

                    setTimeout(() => {
                        this.renderProducts();
                        this.showProductsSection();
                    }, 500);
                } else {
                    // Si no hay búsqueda, mostrar categorías
                    this.showCategoriesWithAnimation();
                    this.hideProductsSection();
                }
            });
        }

        // Filtros de categoría (sidebar)
        const categoryFilters = document.getElementById('sidebarCategoryFilters');
        if (categoryFilters) {
            categoryFilters.addEventListener('change', (e) => {
                if (e.target.name === 'categoryFilter') {
                    this.currentFilters.category = e.target.value || null;
                    this.renderProducts();
                }
            });
        }

        // Filtros de precio
        const applyPriceFilter = document.getElementById('applyPriceFilter');
        if (applyPriceFilter) {
            applyPriceFilter.addEventListener('click', () => {
                this.trackUserActivity(); // Track user interaction
                const minPrice = document.getElementById('minPrice')?.value;
                const maxPrice = document.getElementById('maxPrice')?.value;

                this.currentFilters.minPrice = minPrice ? parseFloat(minPrice) : null;
                this.currentFilters.maxPrice = maxPrice ? parseFloat(maxPrice) : null;

                // Ocultar categorías y mostrar productos
                this.hideCategoriesWithAnimation();

                setTimeout(() => {
                    this.renderProducts();
                    this.showProductsSection();
                }, 500);
            });
        }

        // Filtros especiales
        const onSaleFilter = document.getElementById('onSaleFilter');
        const featuredFilter = document.getElementById('featuredFilter');
        const inStockFilter = document.getElementById('inStockFilter');

        if (onSaleFilter) {
            onSaleFilter.addEventListener('change', (e) => {
                this.trackUserActivity(); // Track user interaction
                this.currentFilters.onSale = e.target.checked;
                this.renderProducts();
            });
        }

        if (featuredFilter) {
            featuredFilter.addEventListener('change', (e) => {
                this.trackUserActivity(); // Track user interaction
                this.currentFilters.featured = e.target.checked;
                this.renderProducts();
            });
        }

        if (inStockFilter) {
            inStockFilter.addEventListener('change', (e) => {
                this.trackUserActivity(); // Track user interaction
                this.currentFilters.inStock = e.target.checked;
                this.renderProducts();
            });
        }

        // Ordenamiento
        const sortProducts = document.getElementById('sortProducts');
        if (sortProducts) {
            sortProducts.addEventListener('change', (e) => {
                this.trackUserActivity(); // Track user interaction
                this.currentSort = e.target.value;
                this.renderProducts();
            });
        }

        // Limpiar filtros
        const clearFilters = document.getElementById('clearFilters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // Reset search
        const resetSearch = document.getElementById('resetSearch');
        if (resetSearch) {
            resetSearch.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // Listen for language changes to refresh product translations
        window.addEventListener('languageChanged', (e) => {
            console.log('🌐 Language changed, refreshing product translations...');
            this.refreshProductTranslations();
        });
    }

    // Nueva función para seleccionar categoría con animación y optimistic loading
    selectCategory(categoryName) {
        console.log(`🎯 Categoría seleccionada: ${categoryName}`);

        // Check if tienda is initialized
        if (!this.isInitialized) {
            console.log(`⏳ Tienda no inicializada, guardando selección pendiente: ${categoryName}`);

            // Store pending selection
            this.pendingCategorySelection = categoryName;

            // Show loading state immediately
            this.showCategoryLoadingState(categoryName);

            return; // Exit early, will be executed later
        }

        // Execute immediately if initialized
        this.selectCategoryImmediate(categoryName);
    }

    // Immediate category selection (used after initialization)
    selectCategoryImmediate(categoryName) {
        console.log(`🚀 Ejecutando selección inmediata: ${categoryName}`);

        // Set filter immediately
        this.currentFilters.category = categoryName;
        this.updateURL();

        // Start rendering products immediately (no delay)
        this.renderProductsInstant();
        this.renderCategoriesFilters();

        // Hide categories and show products simultaneously
        this.hideCategoriesWithAnimation();
        this.showProductsSection();

        // Smooth scroll to top of page after category selection
        requestAnimationFrame(() => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Función legacy para compatibilidad
    filterByCategory(categoryName) {
        this.selectCategory(categoryName);
    }
    
    // Función para ocultar categorías con animación
    hideCategoriesWithAnimation() {
        const categoriesGrid = document.getElementById('categoriesGrid');
        const categoriesSection = document.querySelector('.categories-section-inline');
        
        if (!categoriesGrid) return;
        
        // Aplicar transición CSS definida en tienda.css
        categoriesGrid.classList.add('hidden');
        
        // Si existe una sección contenedora, también ocultarla
        if (categoriesSection) {
            categoriesSection.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            categoriesSection.style.transform = 'translateY(-20px)';
            categoriesSection.style.opacity = '0';
            
            setTimeout(() => {
                categoriesSection.style.display = 'none';
            }, 500);
        }
    }
    
    // Función para mostrar categorías con animación
    showCategoriesWithAnimation() {
        const categoriesGrid = document.getElementById('categoriesGrid');
        const categoriesSection = document.querySelector('.categories-section-inline');
        
        if (!categoriesGrid) return;
        
        // Mostrar sección si estaba oculta
        if (categoriesSection) {
            categoriesSection.style.display = 'block';
            categoriesSection.style.opacity = '0';
            categoriesSection.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                categoriesSection.style.opacity = '1';
                categoriesSection.style.transform = 'translateY(0)';
            }, 50);
        }
        
        // Remover clase hidden para mostrar con animación CSS
        categoriesGrid.classList.remove('hidden');
    }
    
    // Función para mostrar sección de productos
    showProductsSection() {
        const productsContainer = document.getElementById('productsContainer');
        const productsResults = document.getElementById('productsResults');
        
        if (productsContainer) {
            productsContainer.style.display = 'block';
        }
        
        if (productsResults) {
            productsResults.style.display = 'flex';
        }
    }

    resetFilters() {
        this.currentFilters = {
            category: null,
            search: '',
            minPrice: null,
            maxPrice: null,
            onSale: false,
            featured: false,
            inStock: false // Changed: don't filter by stock by default
        };

        // Reset form elements
        const searchInput = document.getElementById('searchInput');
        const minPrice = document.getElementById('minPrice');
        const maxPrice = document.getElementById('maxPrice');
        const onSaleFilter = document.getElementById('onSaleFilter');
        const featuredFilter = document.getElementById('featuredFilter');
        const inStockFilter = document.getElementById('inStockFilter');

        if (searchInput) searchInput.value = '';
        if (minPrice) minPrice.value = '';
        if (maxPrice) maxPrice.value = '';
        if (onSaleFilter) onSaleFilter.checked = false;
        if (featuredFilter) featuredFilter.checked = false;
        if (inStockFilter) inStockFilter.checked = false; // Changed: don't filter by stock initially

        // Mostrar categorías de nuevo con animación
        this.showCategoriesWithAnimation();
        
        // Ocultar sección de productos
        this.hideProductsSection();
        
        this.renderCategoriesFilters();
    }
    
    // Función para ocultar sección de productos
    hideProductsSection() {
        const productsContainer = document.getElementById('productsContainer');
        const productsResults = document.getElementById('productsResults');
        const productsGrid = document.getElementById('productsGrid');
        
        if (productsResults) {
            productsResults.style.display = 'none';
        }
        
        if (productsGrid) {
            productsGrid.innerHTML = '';
        }
    }
    
    // Función para manejar clicks en filtros de categoría del sidebar
    handleCategoryFilterClick(categoryName) {
        console.log(`🏷️ Filtro de categoría seleccionado: ${categoryName}`);

        // Check if tienda is initialized (same as selectCategory for consistency)
        if (!this.isInitialized && categoryName) {
            console.log(`⏳ Tienda no inicializada, guardando selección pendiente: ${categoryName}`);

            // Store pending selection
            this.pendingCategorySelection = categoryName;

            // Show loading state immediately
            this.showCategoryLoadingState(categoryName);

            return; // Exit early, will be executed later
        }

        // Actualizar filtro actual
        this.currentFilters.category = categoryName || null;
        this.updateURL();

        // Actualizar clases activas en la UI
        const categoryFilters = document.querySelectorAll('#sidebarCategoryFilters .category-filter');
        categoryFilters.forEach(filter => {
            filter.classList.remove('active');
        });

        // Agregar clase activa al filtro seleccionado
        const selectedFilter = document.querySelector(`#sidebarCategoryFilters .category-filter[data-category="${categoryName}"]`);
        if (selectedFilter) {
            selectedFilter.classList.add('active');
        }

        // Si no hay categoría seleccionada, mostrar categorías y ocultar productos
        if (!categoryName) {
            this.showCategoriesWithAnimation();
            this.hideProductsSection();
        } else {
            // Render products instantly (no delay)
            this.renderProductsInstant();

            // Hide categories and show products simultaneously
            this.hideCategoriesWithAnimation();
            this.showProductsSection();

            // Smooth scroll to top of page after category selection
            requestAnimationFrame(() => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }

    showError(message) {
        const apiError = document.getElementById('apiError');
        if (apiError) {
            apiError.querySelector('p').textContent = message;
            apiError.style.display = 'block';
        }
    }

    showCategoriesError() {
        const categoriesError = document.getElementById('categoriesError');
        const categoriesLoading = document.getElementById('categoriesLoading');
        
        if (categoriesLoading) categoriesLoading.style.display = 'none';
        if (categoriesError) categoriesError.style.display = 'block';
    }

    showProductsError() {
        const productsLoading = document.getElementById('productsLoading');
        const apiError = document.getElementById('apiError');

        if (productsLoading) productsLoading.style.display = 'none';
        if (apiError) apiError.style.display = 'block';
    }

    /**
     * Refresh product translations when language changes
     */
    refreshProductTranslations() {
        // Re-render products with new language
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid && productsGrid.style.display !== 'none') {
            console.log('🔄 Re-rendering products with new translations');
            this.renderProducts();
        }

        // Update category grid if visible
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (categoriesGrid && categoriesGrid.style.display !== 'none') {
            console.log('🔄 Re-rendering categories with new translations');
            this.renderCategoriesGrid();
        }
    }

    /**
     * Get translated product name based on current language
     * @param {Object} product - Product object with translations
     * @returns {String} - Translated product name
     */
    getTranslatedProductName(product) {
        if (!product) return '';

        // Use TranslationSystem if available
        if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
            return window.TranslationSystem.getProductField(product, 'name');
        }

        // Fallback to product name
        return product.name;
    }

    /**
     * Get translated product description
     * @param {Object} product - Product object with translations
     * @returns {String} - Translated product description
     */
    getTranslatedProductDescription(product) {
        if (!product) return '';

        // Use TranslationSystem if available
        if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
            return window.TranslationSystem.getProductField(product, 'description');
        }

        // Fallback to product description
        return product.description || '';
    }

    /**
     * Get translated product short description
     * @param {Object} product - Product object with translations
     * @returns {String} - Translated product short description
     */
    getTranslatedProductShortDescription(product) {
        if (!product) return '';

        // Use TranslationSystem if available
        if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
            return window.TranslationSystem.getProductField(product, 'shortDescription');
        }

        // Fallback to product short description
        return product.shortDescription || '';
    }
}

// Función global para búsqueda (llamada desde el HTML)
function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && window.tiendaIntegration) {
        window.tiendaIntegration.currentFilters.search = searchInput.value;
        window.tiendaIntegration.renderProducts();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que el API de Supabase esté disponible
    const initTienda = () => {
        if (window.artesanaAPI) {
            window.tiendaIntegration = new TiendaSupabaseIntegration();
            window.tiendaIntegration.init();
        } else {
            console.log('⏳ Esperando API de Supabase...');
            setTimeout(initTienda, 500);
        }
    };

    initTienda();
});

console.log('🛒 Script de integración tienda-Supabase cargado');

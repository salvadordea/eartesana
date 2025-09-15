/**
 * ESTUDIO ARTESANA - Integración Tienda HTML con API
 * =====================================================
 * Este script reemplaza los scripts de WooCommerce existentes
 * e integra la tienda HTML con nuestro backend API
 */

(function() {
    'use strict';

    // ==========================================
    // CONFIGURACIÓN GLOBAL
    // ==========================================
    
    const CONFIG = {
        // URL del API backend
        API_URL: 'http://localhost:3001/api',
        
        // Configuración de productos por página
        PRODUCTS_PER_PAGE: 12,
        
        // Cache TTL en minutos
        CACHE_TTL: 10,
        
        // Configuración de filtros por defecto
        DEFAULT_FILTERS: {
            sort: 'title-asc',
            inStock: true
        }
    };

    // Estado global de la aplicación
    const APP_STATE = {
        currentPage: 1,
        totalPages: 1,
        currentFilters: { ...CONFIG.DEFAULT_FILTERS },
        searchTerm: '',
        selectedCategory: null,
        isLoading: false,
        lastUpdate: null
    };

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================

    document.addEventListener('DOMContentLoaded', async function() {
        console.log('🎨 Iniciando integración Estudio Artesana...');
        
        // Esperar a que esté disponible la API
        await waitForAPI();
        
        // Inicializar componentes
        await initializeApp();
        
        console.log('✅ Integración completada');
    });

    async function waitForAPI() {
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            try {
                if (window.artesanaAPI) {
                    await window.artesanaAPI.testConnection();
                    console.log('✅ API conectada');
                    return;
                }
            } catch (error) {
                console.log(`⏳ Esperando API... (intento ${attempts + 1}/${maxAttempts})`);
            }
            
            attempts++;
            await sleep(1000);
        }
        
        console.error('❌ No se pudo conectar con la API después de', maxAttempts, 'intentos');
    }

    async function initializeApp() {
        try {
            // Cargar categorías en dropdown y grid
            await loadCategories();
            
            // Ocultar productos inicialmente - solo mostrar cuando se selecciona categoría
            updateProductsVisibility(false);
            
            // Configurar event listeners
            setupEventListeners();
            
            // Configurar filtros
            setupFilters();
            
        // Configurar carrito
        updateCartDisplay();
        
        // Configurar búsqueda para ocultar categorías
        setupSearchAnimation();
            
        } catch (error) {
            console.error('❌ Error inicializando aplicación:', error);
            showError('Error cargando la tienda. Por favor recarga la página.');
        }
    }

    // ==========================================
    // CARGA DE CATEGORÍAS
    // ==========================================

    async function loadCategories() {
        console.log('📂 Cargando categorías...');
        
        try {
            // Mostrar loading en categorías
            showCategoriesLoading(true);
            
            // Obtener categorías de la API
            const categories = await window.artesanaAPI.getCategories();
            
            if (categories && categories.length > 0) {
                // Renderizar categorías en dropdown
                renderCategoriesDropdown(categories);
                
                // Renderizar categorías en grid
                renderCategoriesGrid(categories);
                
                // Renderizar categorías en sidebar
                renderCategoriesSidebar(categories);
                
                console.log(`✅ ${categories.length} categorías cargadas`);
            } else {
                showCategoriesError('No se encontraron categorías');
            }
            
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
            showCategoriesError('Error cargando categorías');
        } finally {
            showCategoriesLoading(false);
        }
    }

    function renderCategoriesDropdown(categories) {
        const dropdown = document.getElementById('dropdownCategories');
        if (!dropdown) return;

        const categoriesHTML = categories.map(category => `
            <a href=\"#\" class=\"dropdown-link category-link\" data-category-id=\"${category.id}\">
                ${category.name} (${category.count})
            </a>
        `).join('');

        dropdown.innerHTML = categoriesHTML;

        // Event listeners para categorías del dropdown
        dropdown.querySelectorAll('.category-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const categoryId = e.target.dataset.categoryId;
                filterByCategory(categoryId);
            });
        });
    }

    function renderCategoriesSidebar(categories) {
        const sidebarContainer = document.getElementById('sidebarCategoryFilters');
        const loadingEl = document.getElementById('categoryFiltersLoading');
        
        if (!sidebarContainer) return;
        
        // Ocultar loading
        if (loadingEl) loadingEl.style.display = 'none';
        
        // Agregar "Todas las categorías" al principio
        const allCategoriesHTML = `
            <div class="category-filter active" data-category-id="" id="allCategoriesFilter">
                <span class="category-filter-name">Todas las categorías</span>
            </div>
        `;
        
        const categoriesHTML = categories.map(category => `
            <div class="category-filter" data-category-id="${category.id}">
                <span class="category-filter-name">${category.name}</span>
                <span class="category-count">${category.count}</span>
            </div>
        `).join('');
        
        sidebarContainer.innerHTML = allCategoriesHTML + categoriesHTML;
        
        // Event listeners para filtros de categorías
        sidebarContainer.querySelectorAll('.category-filter').forEach(filter => {
            filter.addEventListener('click', (e) => {
                const categoryId = e.target.closest('.category-filter').dataset.categoryId;
                selectCategoryFilter(categoryId);
            });
        });
    }
    
    function selectCategoryFilter(categoryId) {
        // Actualizar estado visual de filtros
        const filters = document.querySelectorAll('.category-filter');
        filters.forEach(filter => {
            filter.classList.remove('active');
        });
        
        const selectedFilter = document.querySelector(`[data-category-id="${categoryId}"]`);
        if (selectedFilter) {
            selectedFilter.classList.add('active');
        }
        
        // Aplicar filtro
        filterByCategory(categoryId);
    }

    function renderCategoriesGrid(categories) {
        const grid = document.getElementById('categoriesGrid');
        if (!grid) return;

        // Tomar solo las primeras 6 categorías para el grid 3x2
        const displayCategories = categories.slice(0, 6);

        const categoriesHTML = displayCategories.map(category => {
            // Obtener imagen de categoría (fallback a gradiente)
            const categoryImage = getCategoryImage(category.name);
            
            return `
                <div class="category-card" data-category-id="${category.id}" style="cursor: pointer;">
                    <div class="category-image">
                        ${categoryImage}
                    </div>
                    <div class="category-info">
                        <h3 class="category-name">${category.name}</h3>
                    </div>
                    <div class="category-badge">${category.count}</div>
                </div>
            `;
        }).join('');

        grid.innerHTML = categoriesHTML;

        // Crear hoja de estilos inline para forzar el grid
        const gridId = 'categoriesGrid';
        const existingStyle = document.getElementById('forcedCategoriesGridStyle');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        const styleElement = document.createElement('style');
        styleElement.id = 'forcedCategoriesGridStyle';
        styleElement.textContent = `
            #${gridId} {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 20px !important;
                margin-bottom: 30px !important;
                max-width: 100% !important;
                width: 100% !important;
            }
            
            #${gridId} .category-card {
                position: relative !important;
                background: #222 !important;
                border: 2px solid transparent !important;
                border-radius: 12px !important;
                overflow: hidden !important;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
                cursor: pointer !important;
                aspect-ratio: 1.3 !important;
                min-height: 200px !important;
                width: auto !important;
                display: block !important;
                transform: translateY(0) !important;
            }
            
            #${gridId} .category-card:hover {
                transform: translateY(-8px) scale(1.02) !important;
                border-color: #c0c0c0 !important;
                box-shadow: 0 15px 35px rgba(192, 192, 192, 0.25), 0 8px 25px rgba(0, 0, 0, 0.2) !important;
            }
            
            #${gridId} .category-image {
                position: relative !important;
                width: 100% !important;
                height: 100% !important;
                overflow: hidden !important;
            }
            
            #${gridId} .category-image img {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                transition: transform 0.4s ease !important;
                filter: brightness(0.85) !important;
            }
            
            #${gridId} .category-card:hover .category-image img {
                transform: scale(1.1) !important;
                filter: brightness(1) !important;
            }
            
            #${gridId} .category-info {
                position: absolute !important;
                bottom: 12px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                background: rgba(0, 0, 0, 0.6) !important;
                color: white !important;
                padding: 12px 18px !important;
                text-align: center !important;
                border-radius: 25px !important;
                border: 2px solid rgba(192, 192, 192, 0.8) !important;
                backdrop-filter: blur(10px) !important;
                display: block !important;
                min-width: 75% !important;
                max-width: 90% !important;
                max-height: 60px !important;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3) !important;
                transition: all 0.3s ease !important;
            }
            
            #${gridId} .category-card:hover .category-info {
                border-color: #c0c0c0 !important;
                background: rgba(192, 192, 192, 0.2) !important;
                transform: translateX(-50%) translateY(-3px) !important;
                box-shadow: 0 8px 20px rgba(192, 192, 192, 0.3) !important;
            }
            
            #${gridId} .category-name {
                margin: 0 !important;
                font-size: 0.85rem !important;
                font-weight: 700 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.3px !important;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8) !important;
                color: white !important;
                line-height: 1.1 !important;
                text-align: center !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
                hyphens: auto !important;
                width: 100% !important;
                display: block !important;
                font-family: 'Arial', sans-serif !important;
            }
            
            #${gridId} .category-badge {
                position: absolute !important;
                top: 15px !important;
                right: 15px !important;
                background: linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%) !important;
                color: white !important;
                padding: 8px 12px !important;
                border-radius: 20px !important;
                font-size: 0.85rem !important;
                font-weight: 800 !important;
                min-width: 30px !important;
                text-align: center !important;
                box-shadow: 0 4px 12px rgba(192, 192, 192, 0.4) !important;
                border: 2px solid rgba(255, 255, 255, 0.2) !important;
                z-index: 3 !important;
                transition: all 0.3s ease !important;
                backdrop-filter: blur(5px) !important;
            }
            
            #${gridId} .category-card:hover .category-badge {
                transform: scale(1.1) !important;
                box-shadow: 0 6px 18px rgba(192, 192, 192, 0.6) !important;
            }
            
            /* Responsive */
            @media (max-width: 992px) {
                #${gridId} {
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 15px !important;
                }
            }
            
            @media (max-width: 576px) {
                #${gridId} {
                    grid-template-columns: 1fr !important;
                    gap: 12px !important;
                }
                
                #${gridId} .category-card {
                    aspect-ratio: 1.5 !important;
                    min-height: 150px !important;
                }
            }
        `;
        
        document.head.appendChild(styleElement);

        // Solo aplicar estilos de contenedor - el responsive se maneja en CSS
        grid.style.cssText = `
            display: grid !important;
            margin-bottom: 30px !important;
            max-width: 100% !important;
        `;

        // Event listeners para categorías del grid
        grid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const categoryId = e.target.closest('[data-category-id]').dataset.categoryId;
                filterByCategory(categoryId);
            });
        });
    }

    function showCategoriesLoading(show) {
        const loading = document.getElementById('categoriesLoading');
        const grid = document.getElementById('categoriesGrid');
        
        if (loading) loading.style.display = show ? 'block' : 'none';
        if (grid) grid.style.display = show ? 'none' : 'block';
    }

    function showCategoriesError(message) {
        const error = document.getElementById('categoriesError');
        if (error) {
            error.style.display = 'block';
            error.querySelector('p').textContent = message;
        }
    }

    // ==========================================
    // CARGA DE PRODUCTOS
    // ==========================================

    async function loadProducts(page = 1) {
        if (APP_STATE.isLoading) return;
        
        console.log('📦 Cargando productos...', APP_STATE.currentFilters);
        
        APP_STATE.isLoading = true;
        APP_STATE.currentPage = page;
        
        try {
            // Mostrar loading
            showProductsLoading(true);
            
            // Preparar filtros para la API
            const apiFilters = {
                ...APP_STATE.currentFilters,
                limit: CONFIG.PRODUCTS_PER_PAGE,
                offset: (page - 1) * CONFIG.PRODUCTS_PER_PAGE
            };

            // Agregar filtros específicos
            if (APP_STATE.searchTerm) {
                apiFilters.search = APP_STATE.searchTerm;
            }
            
            if (APP_STATE.selectedCategory) {
                apiFilters.categoria = APP_STATE.selectedCategory;
            }

            // Llamar a la API
            const response = await window.artesanaAPI.getProducts(apiFilters);
            
            if (response && response.products) {
                // Calcular paginación
                APP_STATE.totalPages = Math.ceil(response.total / CONFIG.PRODUCTS_PER_PAGE);
                
                // Renderizar productos
                renderProducts(response.products);
                
                // Actualizar información de resultados
                updateProductsResults(response);
                
                // Actualizar paginación
                updatePagination();
                
                console.log(`✅ ${response.products.length} productos cargados`);
            } else {
                showNoResults();
            }
            
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            showProductsError();
        } finally {
            APP_STATE.isLoading = false;
            showProductsLoading(false);
        }
    }

    function renderProducts(products) {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        if (!products || products.length === 0) {
            showNoResults();
            return;
        }

        const productsHTML = products.map(product => createProductHTML(product)).join('');
        grid.innerHTML = productsHTML;

        // Agregar event listeners a los productos
        attachProductEvents(grid);
        
        // Actualizar estados de elementos
        updateProductsVisibility(true);
    }

    function createProductHTML(product) {
        // Badges según el estilo original
        const badges = [];
        if (product.onSale) {
            badges.push(`<div class=\"product-badge sale\">Oferta</div>`);
        }
        if (product.featured) {
            badges.push(`<div class=\"product-badge featured\">Destacado</div>`);
        }
        const badgesHTML = badges.length > 0 ? `<div class=\"product-badges\">${badges.join('')}</div>` : '';
        
        // Acciones del producto (overlays)
        const actionsHTML = `
            <div class=\"product-actions\">
                <button class=\"product-action quick-view-btn\" data-product-id=\"${product.id}\" title=\"Vista rápida\">
                    <i class=\"fas fa-eye\"></i>
                </button>
                <button class=\"product-action wishlist-btn\" data-product-id=\"${product.id}\" title=\"Agregar a favoritos\">
                    <i class=\"far fa-heart\"></i>
                </button>
            </div>
        `;
        
        // Precio según el estilo original
        const priceHTML = product.onSale ? `
            <div class=\"product-price\">
                <span class=\"current-price\">${product.formattedPrice}</span>
                <span class=\"original-price\">$${product.regularPrice.toFixed(2)}</span>
                <span class=\"discount-percentage\">-${Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)}%</span>
            </div>
        ` : `
            <div class=\"product-price\">
                <span class=\"current-price\">${product.formattedPrice}</span>
            </div>
        `;

        return `
            <div class=\"product-card\" data-product-id=\"${product.id}\">
                ${badgesHTML}
                ${actionsHTML}
                
                <div class=\"product-image\">
                    <img src=\"${product.mainImage}\" alt=\"${product.name}\" loading=\"lazy\" onerror=\"this.src='../assets/images/placeholder-product.jpg'\">
                </div>
                
                <div class=\"product-info\">
                    <div class=\"product-category\">Artesanal</div>
                    <h3 class=\"product-title\">
                        <a href=\"producto.html?id=${product.id}\">${product.name}</a>
                    </h3>
                    
                    <div class=\"product-rating\">
                        <div class=\"stars\">
                            <span class=\"star filled\">★</span>
                            <span class=\"star filled\">★</span>
                            <span class=\"star filled\">★</span>
                            <span class=\"star filled\">★</span>
                            <span class=\"star filled\">★</span>
                        </div>
                        <span class=\"rating-count\">(${Math.floor(Math.random() * 20) + 5})</span>
                    </div>
                    
                    ${priceHTML}
                    
                    <button class=\"add-to-cart-btn\" data-product-id=\"${product.id}\">
                        <i class=\"fas fa-shopping-cart\"></i>
                        Agregar al carrito
                    </button>
                </div>
            </div>
        `;
    }

    function attachProductEvents(container) {
        // Botones agregar al carrito
        container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('[data-product-id]').dataset.productId;
                addToCart(productId);
            });
        });

        // Botones vista rápida
        container.querySelectorAll('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('[data-product-id]').dataset.productId;
                showQuickView(productId);
            });
        });

        // Clics en imagen del producto
        container.querySelectorAll('.product-image img').forEach(img => {
            img.addEventListener('click', (e) => {
                const productId = e.target.closest('[data-product-id]').dataset.productId;
                window.location.href = `producto.html?id=${productId}`;
            });
        });
    }

    function updateProductsResults(response) {
        const resultsElement = document.getElementById('productsResults');
        if (!resultsElement) return;

        const count = response.count || 0;
        const total = response.total || 0;
        const start = ((APP_STATE.currentPage - 1) * CONFIG.PRODUCTS_PER_PAGE) + 1;
        const end = Math.min(start + count - 1, total);

        const countElement = resultsElement.querySelector('.results-count');
        if (countElement) {
            if (total === 0) {
                countElement.textContent = 'No se encontraron productos';
            } else {
                countElement.textContent = `Mostrando ${start}-${end} de ${total} productos`;
            }
        }

        // Actualizar números de página
        const currentPageElement = document.getElementById('currentPage');
        const totalPagesElement = document.getElementById('totalPages');
        
        if (currentPageElement) currentPageElement.textContent = APP_STATE.currentPage;
        if (totalPagesElement) totalPagesElement.textContent = APP_STATE.totalPages;
    }

    function showProductsLoading(show) {
        const loading = document.getElementById('productsLoading');
        const grid = document.getElementById('productsGrid');
        
        if (loading) loading.style.display = show ? 'flex' : 'none';
        if (grid) grid.style.display = show ? 'none' : 'grid';
    }

    function showNoResults() {
        updateProductsVisibility(false);
        const noResults = document.getElementById('noResults');
        if (noResults) noResults.style.display = 'block';
    }

    function showProductsError() {
        updateProductsVisibility(false);
        const apiError = document.getElementById('apiError');
        if (apiError) apiError.style.display = 'block';
    }

    function updateProductsVisibility(showProducts) {
        const elements = {
            grid: document.getElementById('productsGrid'),
            noResults: document.getElementById('noResults'),
            apiError: document.getElementById('apiError'),
            pagination: document.getElementById('pagination'),
            loading: document.getElementById('productsLoading')
        };

        if (showProducts) {
            if (elements.grid) elements.grid.style.display = 'grid';
            if (elements.pagination) elements.pagination.style.display = 'flex';
        } else {
            if (elements.grid) elements.grid.style.display = 'none';
            if (elements.pagination) elements.pagination.style.display = 'none';
            // Ocultar loading de productos cuando no se muestran productos
            if (elements.loading) elements.loading.style.display = 'none';
        }

        if (elements.noResults) elements.noResults.style.display = 'none';
        if (elements.apiError) elements.apiError.style.display = 'none';
    }

    // ==========================================
    // FILTROS Y BÚSQUEDA
    // ==========================================

    function setupFilters() {
        // Filtro de precio
        const applyPriceBtn = document.getElementById('applyPriceFilter');
        if (applyPriceBtn) {
            applyPriceBtn.addEventListener('click', applyPriceFilter);
        }

        // Checkboxes de filtros especiales
        const specialFilters = ['onSaleFilter', 'featuredFilter', 'inStockFilter'];
        specialFilters.forEach(filterId => {
            const checkbox = document.getElementById(filterId);
            if (checkbox) {
                checkbox.addEventListener('change', applySpecialFilters);
            }
        });

        // Ordenamiento
        const sortSelect = document.getElementById('sortProducts');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                APP_STATE.currentFilters.sort = e.target.value;
                loadProducts(1);
            });
        }

        // Búsqueda
        const searchInput = document.getElementById('productSearch');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    APP_STATE.searchTerm = e.target.value.trim();
                    loadProducts(1);
                }, 500);
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                if (searchInput) {
                    APP_STATE.searchTerm = searchInput.value.trim();
                    loadProducts(1);
                }
            });
        }

        // Limpiar filtros
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', clearAllFilters);
        }
    }

    function applyPriceFilter() {
        const minPrice = document.getElementById('minPrice')?.value;
        const maxPrice = document.getElementById('maxPrice')?.value;

        if (minPrice) APP_STATE.currentFilters.minPrice = parseFloat(minPrice);
        else delete APP_STATE.currentFilters.minPrice;

        if (maxPrice) APP_STATE.currentFilters.maxPrice = parseFloat(maxPrice);
        else delete APP_STATE.currentFilters.maxPrice;

        loadProducts(1);
    }

    function applySpecialFilters() {
        const onSale = document.getElementById('onSaleFilter')?.checked;
        const featured = document.getElementById('featuredFilter')?.checked;
        const inStock = document.getElementById('inStockFilter')?.checked;

        if (onSale) APP_STATE.currentFilters.onSale = 'true';
        else delete APP_STATE.currentFilters.onSale;

        if (featured) APP_STATE.currentFilters.featured = 'true';
        else delete APP_STATE.currentFilters.featured;

        APP_STATE.currentFilters.inStock = inStock ? 'true' : undefined;

        loadProducts(1);
    }

    function filterByCategory(categoryId) {
        APP_STATE.selectedCategory = categoryId;
        
        // Animar ocultación de categorías si se selecciona una categoría específica
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (categoriesGrid) {
            if (categoryId && categoryId !== '') {
                // Ocultar categorías con animación
                categoriesGrid.classList.add('hidden');
                // Cargar productos cuando se selecciona una categoría específica
                loadProducts(1);
            } else {
                // Mostrar categorías con animación y ocultar productos
                categoriesGrid.classList.remove('hidden');
                updateProductsVisibility(false);
                // Limpiar search también
                const searchInput = document.getElementById('productSearch');
                if (searchInput) searchInput.value = '';
                APP_STATE.searchTerm = '';
            }
        }
        
        // Actualizar filtro de categoría en sidebar
        updateCategorySidebarSelection(categoryId);
    }

    function clearAllFilters() {
        // Resetear estado
        APP_STATE.currentFilters = { ...CONFIG.DEFAULT_FILTERS };
        APP_STATE.searchTerm = '';
        APP_STATE.selectedCategory = null;

        // Limpiar inputs
        const inputs = ['minPrice', 'maxPrice', 'productSearch'];
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });

        // Resetear checkboxes
        const checkboxes = ['onSaleFilter', 'featuredFilter'];
        checkboxes.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.checked = false;
        });

        // Marcar "En stock" por defecto
        const inStockFilter = document.getElementById('inStockFilter');
        if (inStockFilter) inStockFilter.checked = true;

        // Resetear select de orden
        const sortSelect = document.getElementById('sortProducts');
        if (sortSelect) sortSelect.value = 'title-asc';

        // Mostrar categorías y ocultar productos (volver al estado inicial)
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (categoriesGrid) {
            categoriesGrid.classList.remove('hidden');
        }
        updateProductsVisibility(false);
        
        // Actualizar selección en sidebar (volver a "Todas las categorías")
        updateCategorySidebarSelection('');
    }

    // ==========================================
    // PAGINACIÓN
    // ==========================================

    function updatePagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination || APP_STATE.totalPages <= 1) {
            if (pagination) pagination.innerHTML = '';
            return;
        }

        const paginationHTML = createPaginationHTML();
        pagination.innerHTML = paginationHTML;

        // Event listeners para paginación
        pagination.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                if (page && page !== APP_STATE.currentPage) {
                    loadProducts(page);
                    scrollToTop();
                }
            });
        });
    }

    function createPaginationHTML() {
        let html = '';
        
        // Botón anterior
        if (APP_STATE.currentPage > 1) {
            html += `<button class=\"pagination-btn\" data-page=\"${APP_STATE.currentPage - 1}\">
                        <i class=\"fas fa-chevron-left\"></i> Anterior
                     </button>`;
        }

        // Números de página
        const startPage = Math.max(1, APP_STATE.currentPage - 2);
        const endPage = Math.min(APP_STATE.totalPages, APP_STATE.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === APP_STATE.currentPage;
            html += `<button class=\"pagination-btn ${isActive ? 'active' : ''}\" data-page=\"${i}\">${i}</button>`;
        }

        // Botón siguiente
        if (APP_STATE.currentPage < APP_STATE.totalPages) {
            html += `<button class=\"pagination-btn\" data-page=\"${APP_STATE.currentPage + 1}\">
                        Siguiente <i class=\"fas fa-chevron-right\"></i>
                     </button>`;
        }

        return html;
    }

    // ==========================================
    // CARRITO DE COMPRAS
    // ==========================================

    async function addToCart(productId) {
        try {
            // Usar la funcionalidad del API client
            if (window.artesanaAPI) {
                window.artesanaAPI.addToCart(productId);
                updateCartDisplay();
            }
        } catch (error) {
            console.error('❌ Error agregando al carrito:', error);
            showError('Error agregando producto al carrito');
        }
    }

    function updateCartDisplay() {
        if (window.artesanaAPI) {
            window.artesanaAPI.updateCartCounter();
        }
    }

    // ==========================================
    // VISTA RÁPIDA
    // ==========================================

    async function showQuickView(productId) {
        console.log('👁️ Vista rápida del producto:', productId);
        // TODO: Implementar modal de vista rápida
        // Por ahora, redirigir a la página del producto
        window.location.href = `producto.html?id=${productId}`;
    }

    // ==========================================
    // EVENT LISTENERS GLOBALES
    // ==========================================

    function setupEventListeners() {
        // Botón reintentar en error de API
        const retryBtn = document.getElementById('retryLoad');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => loadProducts());
        }

        // Botón resetear búsqueda
        const resetBtn = document.getElementById('resetSearch');
        if (resetBtn) {
            resetBtn.addEventListener('click', clearAllFilters);
        }

        // Toggle de vista (grid/list) - si existe
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                toggleProductsView(view);
            });
        });
    }

    function toggleProductsView(view) {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        // Actualizar clases CSS
        grid.className = grid.className.replace(/view-\w+/g, '');
        grid.classList.add(`view-${view}`);

        // Actualizar botones activos
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    }

    // ==========================================
    // IMÁGENES DE CATEGORÍAS
    // ==========================================

    function getCategoryImage(categoryName) {
        // Mapeo de nombres de categorías a imágenes reales existentes
        const categoryImages = {
            // Categorías con imágenes reales disponibles
            'bolsas de mano': '../assets/images/categories/bolsas-de-mano.jpg',
            'bolsas cruzadas': '../assets/images/categories/bolsas-cruzadas.jpg',
            'bolsas grandes': '../assets/images/categories/bolsas-grandes.jpg',
            'bolsas textil': '../assets/images/categories/bolsas-textil.jpg',
            'backpacks': '../assets/images/categories/backpacks.jpg',
            'mochilas': '../assets/images/categories/backpacks.jpg',
            'botelleras': '../assets/images/categories/botelleras.jpg',
            'joyeria': '../assets/images/categories/joyeria.jpg',
            'joyería': '../assets/images/categories/joyeria.jpg',
            'bisutería': '../assets/images/categories/joyeria.jpg',
            'portacel': '../assets/images/categories/portacel.jpg',
            'porta celular': '../assets/images/categories/portacel.jpg',
            'hogar': '../assets/images/categories/hogar.jpg',
            'vestimenta': '../assets/images/categories/vestimenta.jpg',
            'ropa': '../assets/images/categories/vestimenta.jpg',
            // Variaciones comunes
            'bolsa': '../assets/images/categories/bolsas-de-mano.jpg',
            'bolsas': '../assets/images/categories/bolsas-de-mano.jpg',
            'textil': '../assets/images/categories/bolsas-textil.jpg',
            'accesorios': '../assets/images/categories/joyeria.jpg',
            'casa': '../assets/images/categories/hogar.jpg'
        };

        // Buscar imagen por nombre (insensible a mayúsculas)
        const normalizedName = categoryName.toLowerCase().trim();
        
        // Buscar coincidencia exacta
        if (categoryImages[normalizedName]) {
            return `<img src="${categoryImages[normalizedName]}" alt="${categoryName}" onerror="this.style.display='none'; this.parentNode.style.background='linear-gradient(135deg, #8B4513 0%, #A0522D 100%)'">`;
        }

        // Buscar coincidencia parcial
        for (const key in categoryImages) {
            if (normalizedName.includes(key) || key.includes(normalizedName)) {
                return `<img src="${categoryImages[key]}" alt="${categoryName}" onerror="this.style.display='none'; this.parentNode.style.background='linear-gradient(135deg, #8B4513 0%, #A0522D 100%)'">`;
            }
        }

        // Gradientes por defecto según el tipo de categoría
        const gradients = [
            'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)', // Marrón artesanal
            'linear-gradient(135deg, #2E8B57 0%, #3CB371 100%)', // Verde natural
            'linear-gradient(135deg, #4682B4 0%, #5F9EA0 100%)', // Azul artesano
            'linear-gradient(135deg, #CD853F 0%, #DEB887 100%)', // Beige tierra
            'linear-gradient(135deg, #B22222 0%, #DC143C 100%)', // Rojo artesanal
            'linear-gradient(135deg, #483D8B 0%, #6A5ACD 100%)'  // Púrpura tradicional
        ];

        // Seleccionar gradiente basado en hash del nombre
        const hash = normalizedName.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        
        const gradient = gradients[Math.abs(hash) % gradients.length];
        
        return `<div style="width: 100%; height: 150px; background: ${gradient}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">${categoryName}</div>`;
    }

    // ==========================================
    // UTILIDADES
    // ==========================================

    function showError(message) {
        if (window.artesanaAPI && typeof window.artesanaAPI.showNotification === 'function') {
            window.artesanaAPI.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ==========================================
    // FUNCIONES DE ANIMACIÓN Y UTILIDADES
    // ==========================================
    
    function setupSearchAnimation() {
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.trim();
                const categoriesGrid = document.getElementById('categoriesGrid');
                
                if (categoriesGrid) {
                    if (searchTerm.length > 0) {
                        // Ocultar categorías cuando se busca
                        categoriesGrid.classList.add('hidden');
                    } else if (!APP_STATE.selectedCategory) {
                        // Mostrar categorías si no hay búsqueda ni categoría seleccionada
                        categoriesGrid.classList.remove('hidden');
                    }
                }
            });
        }
    }
    
    function updateCategorySidebarSelection(categoryId) {
        const sidebarFilters = document.querySelectorAll('#sidebarCategoryFilters .category-filter');
        
        sidebarFilters.forEach(filter => {
            const filterId = filter.dataset.categoryId;
            if (filterId === categoryId) {
                filter.classList.add('active');
            } else {
                filter.classList.remove('active');
            }
        });
    }

    // Exportar funciones para acceso global si es necesario
    window.EstudioArtesanaIntegration = {
        loadProducts,
        loadCategories,
        addToCart,
        clearAllFilters,
        filterByCategory
    };

})();

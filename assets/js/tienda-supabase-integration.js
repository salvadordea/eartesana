/**
 * INTEGRACIÓN DE TIENDA CON SUPABASE
 * ==================================
 * Script que conecta la funcionalidad de la tienda con Supabase API
 */

class TiendaSupabaseIntegration {
    constructor() {
        this.currentFilters = {
            category: null,
            search: '',
            minPrice: null,
            maxPrice: null,
            onSale: false,
            featured: false,
            inStock: true
        };
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentSort = 'title-asc';
        this.allProducts = [];
        this.allCategories = [];
        
        console.log('🛒 Integración Tienda-Supabase inicializada');
    }

    async init() {
        console.log('🔄 Inicializando tienda...');
        
        try {
            // Verificar que el API esté disponible
            if (!window.artesanaAPI) {
                throw new Error('API de Supabase no disponible');
            }

            // Leer parámetros URL antes de cargar datos
            this.readURLParameters();

            // Cargar datos iniciales
            await this.loadCategories();
            await this.loadProducts();
            
            // Si hay filtros desde URL, aplicarlos con efecto suave
            if (this.hasActiveFilters()) {
                console.log('🎯 Aplicando filtros desde URL:', this.currentFilters);
                this.applyURLFiltersWithTransition();
            }
            
            // Configurar event listeners
            this.setupEventListeners();
            
            console.log('✅ Tienda inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando tienda:', error);
            this.showError('Error cargando la tienda');
        }
    }

    readURLParameters() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const categorySlug = urlParams.get('categoria');
            const categoryName = urlParams.get('nombre');
            
            console.log('🔍 Parámetros URL detectados:');
            console.log('  - categoria:', categorySlug);
            console.log('  - nombre:', categoryName);
            
            if (categoryName) {
                // Usar el nombre decodificado de la URL
                this.currentFilters.category = decodeURIComponent(categoryName);
                console.log('✅ Filtro de categoría establecido:', this.currentFilters.category);
            }
        } catch (error) {
            console.warn('⚠️ Error leyendo parámetros URL:', error);
        }
    }

    hasActiveFilters() {
        return this.currentFilters.category || 
               this.currentFilters.search || 
               this.currentFilters.minPrice || 
               this.currentFilters.maxPrice || 
               this.currentFilters.onSale || 
               this.currentFilters.featured || 
               !this.currentFilters.inStock;
    }

    hideCategoriesSection() {
        const categoriesSection = document.querySelector('.categories-section-inline');
        if (categoriesSection) {
            categoriesSection.style.display = 'none';
            console.log('👁️ Sección de categorías ocultada');
        }
    }

    showCategoriesSection() {
        const categoriesSection = document.querySelector('.categories-section-inline');
        if (categoriesSection) {
            categoriesSection.style.display = 'block';
            console.log('👁️ Sección de categorías mostrada');
        }
    }

    applyURLFiltersWithTransition() {
        // Primero mostrar las categorías brevemente para el efecto
        this.showCategoriesSection();
        
        // Crear un overlay de carga elegante
        const loadingOverlay = this.createLoadingOverlay();
        document.body.appendChild(loadingOverlay);
        
        // Después de un breve momento, aplicar la transición
        setTimeout(() => {
            // Animar la transición de categorías a productos
            this.hideCategoriesWithTransition();
            
            // Actualizar breadcrumbs con animación
            this.updateBreadcrumbsWithAnimation();
            
            // Después de la transición, mostrar productos
            setTimeout(() => {
                this.renderProducts();
                this.showProductsSectionWithAnimation();
                
                // Remover overlay de carga
                setTimeout(() => {
                    loadingOverlay.style.opacity = '0';
                    setTimeout(() => {
                        if (loadingOverlay.parentNode) {
                            loadingOverlay.parentNode.removeChild(loadingOverlay);
                        }
                    }, 300);
                }, 500);
            }, 600);
        }, 800); // Mostrar categorías por 800ms para el efecto
    }

    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(2px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 1;
            transition: opacity 0.3s ease;
        `;
        
        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 30px 40px;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                text-align: center;
                transform: scale(1);
                animation: pulseScale 1.5s ease-in-out infinite;
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 3px solid #C0C0C0;
                    border-top: 3px solid transparent;
                    border-radius: 50%;
                    margin: 0 auto 15px;
                    animation: spin 1s linear infinite;
                "></div>
                <p style="
                    margin: 0;
                    color: #333;
                    font-weight: 600;
                    font-size: 16px;
                ">Cargando ${this.currentFilters.category}...</p>
            </div>
            
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes pulseScale {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
            </style>
        `;
        
        return overlay;
    }

    hideCategoriesWithTransition() {
        const categoriesSection = document.querySelector('.categories-section-inline');
        const categoriesGrid = document.getElementById('categoriesGrid');
        
        if (categoriesSection) {
            categoriesSection.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            categoriesSection.style.transform = 'translateY(-20px) scale(0.95)';
            categoriesSection.style.opacity = '0';
            categoriesSection.style.filter = 'blur(5px)';
            
            setTimeout(() => {
                categoriesSection.style.display = 'none';
            }, 600);
        }
        
        if (categoriesGrid) {
            const categoryCards = categoriesGrid.querySelectorAll('.category-card');
            categoryCards.forEach((card, index) => {
                setTimeout(() => {
                    card.style.transition = 'all 0.4s ease';
                    card.style.transform = 'translateY(-15px)';
                    card.style.opacity = '0';
                }, index * 50);
            });
        }
    }

    showProductsSectionWithAnimation() {
        const productsContainer = document.getElementById('productsContainer');
        const productsResults = document.getElementById('productsResults');
        const productsGrid = document.getElementById('productsGrid');
        
        if (productsContainer) {
            productsContainer.style.display = 'block';
            productsContainer.style.opacity = '0';
            productsContainer.style.transform = 'translateY(30px)';
            productsContainer.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                productsContainer.style.opacity = '1';
                productsContainer.style.transform = 'translateY(0)';
            }, 100);
        }
        
        if (productsResults) {
            productsResults.style.display = 'flex';
            productsResults.style.opacity = '0';
            productsResults.style.transform = 'translateY(20px)';
            productsResults.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                productsResults.style.opacity = '1';
                productsResults.style.transform = 'translateY(0)';
            }, 200);
        }
        
        // Animar las tarjetas de productos individualmente
        if (productsGrid) {
            const productCards = productsGrid.querySelectorAll('.product-card');
            productCards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px) scale(0.9)';
                card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0) scale(1)';
                }, 300 + (index * 100));
            });
        }
    }

    updateBreadcrumbsWithAnimation() {
        const breadcrumbNav = document.querySelector('.breadcrumb-nav');
        if (breadcrumbNav && this.currentFilters.category) {
            const shopTitle = document.querySelector('.shop-title h1');
            const shopDesc = document.querySelector('.shop-title p');
            
            // Animar breadcrumbs
            breadcrumbNav.style.transition = 'all 0.4s ease';
            breadcrumbNav.style.opacity = '0';
            breadcrumbNav.style.transform = 'translateX(-10px)';
            
            setTimeout(() => {
                breadcrumbNav.innerHTML = `
                    <a href="./index.html">Inicio</a>
                    <i class="fas fa-chevron-right"></i>
                    <a href="./tienda.html">Tienda</a>
                    <i class="fas fa-chevron-right"></i>
                    <span>${this.currentFilters.category}</span>
                `;
                
                breadcrumbNav.style.opacity = '1';
                breadcrumbNav.style.transform = 'translateX(0)';
            }, 200);
            
            // Animar título
            if (shopTitle) {
                shopTitle.style.transition = 'all 0.4s ease';
                shopTitle.style.opacity = '0';
                shopTitle.style.transform = 'translateY(-10px)';
                
                setTimeout(() => {
                    shopTitle.textContent = this.currentFilters.category;
                    shopTitle.style.opacity = '1';
                    shopTitle.style.transform = 'translateY(0)';
                }, 200);
            }
            
            // Animar descripción
            if (shopDesc) {
                shopDesc.style.transition = 'all 0.4s ease';
                shopDesc.style.opacity = '0';
                shopDesc.style.transform = 'translateY(-10px)';
                
                setTimeout(() => {
                    shopDesc.textContent = `Productos de ${this.currentFilters.category.toLowerCase()}`;
                    shopDesc.style.opacity = '1';
                    shopDesc.style.transform = 'translateY(0)';
                }, 300);
            }
            
            console.log('🍞 Breadcrumbs animados para categoría:', this.currentFilters.category);
        }
    }

    updateBreadcrumbs() {
        // Versión sin animación para uso interno
        const breadcrumbNav = document.querySelector('.breadcrumb-nav');
        if (breadcrumbNav && this.currentFilters.category) {
            const shopTitle = document.querySelector('.shop-title h1');
            const shopDesc = document.querySelector('.shop-title p');
            
            breadcrumbNav.innerHTML = `
                <a href="./index.html">Inicio</a>
                <i class="fas fa-chevron-right"></i>
                <a href="./tienda.html">Tienda</a>
                <i class="fas fa-chevron-right"></i>
                <span>${this.currentFilters.category}</span>
            `;
            
            if (shopTitle) {
                shopTitle.textContent = this.currentFilters.category;
            }
            if (shopDesc) {
                shopDesc.textContent = `Productos de ${this.currentFilters.category.toLowerCase()}`;
            }
            
            console.log('🍞 Breadcrumbs actualizados para categoría:', this.currentFilters.category);
        }
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
            const productCount = this.getProductCountForCategory(category.id);
            return `
                <div class="category-card" onclick="tiendaIntegration.selectCategory('${category.name}')">
                    <div class="category-image">
                        <img src="${category.image || 'assets/images/category-placeholder.jpg'}" 
                             alt="${category.name}" loading="lazy">
                    </div>
                    <div class="category-info">
                        <h3 class="category-name">${category.name}</h3>
                    </div>
                    ${productCount > 0 ? `<div class="category-badge">${productCount}</div>` : ''}
                </div>
            `;
        }).join('');

        categoriesGrid.style.display = 'grid';
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
                <span class="category-filter-name">Todas las categorías</span>
                <span class="category-count">${this.allProducts.length}</span>
            </div>
            ${categoriesWithProducts.map(category => `
                <div class="category-filter ${this.currentFilters.category === category.name ? 'active' : ''}" 
                     data-category="${category.name}" onclick="tiendaIntegration.handleCategoryFilterClick('${category.name}')">
                    <span class="category-filter-name">${category.name}</span>
                    <span class="category-count">${this.getProductCountForCategory(category.id)}</span>
                </div>
            `).join('')}
        `;
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
                    ${product.onSale ? '<span class="sale-badge">En Oferta</span>' : ''}
                    ${product.featured ? '<span class="featured-badge">Destacado</span>' : ''}
                </div>
                <div class="product-info">
                    <div class="product-categories">
                        ${product.category_id ? 
                            `<span class="product-category">${this.getCategoryNameById(product.category_id)}</span>` :
                            `<span class="product-category">Sin categoría</span>`
                        }
                    </div>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        ${product.onSale && product.salePrice ? 
                            `<span class="sale-price">$${product.salePrice}</span>
                             <span class="regular-price">$${product.price}</span>` :
                            `<span class="current-price">$${product.price}</span>`
                        }
                    </div>
                    <div class="product-rating">
                        ${this.renderStars(product.averageRating || 4.8)}
                        <span class="rating-count">(${product.totalSales || 0})</span>
                    </div>
                    ${!product.inStock ? '<span class="out-of-stock">Sin stock</span>' : ''}
                </div>
            </div>
        `).join('');

        productsGrid.style.display = 'grid';
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

    applyFilters(products) {
        console.log('🔍 DIAGNÓSTICO - Aplicando filtros:', this.currentFilters);
        console.log('🔍 DIAGNÓSTICO - Total productos antes de filtrar:', products.length);
        
        const filteredProducts = products.filter(product => {
            // Filtro por categoría usando categories array desde products_full
            if (this.currentFilters.category) {
                const categoryMatches = product.categories && product.categories.some(cat => 
                    cat.toLowerCase() === this.currentFilters.category.toLowerCase()
                );
                
                if (!categoryMatches) {
                    console.log(`❌ Producto "${product.name}" NO coincide con categoría "${this.currentFilters.category}". Categorías del producto:`, product.categories);
                    return false;
                } else {
                    console.log(`✅ Producto "${product.name}" SÍ coincide con categoría "${this.currentFilters.category}"`);
                }
            }

            // Filtro por búsqueda con fuzzy search
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase().trim();
                
                // Si es muy corto, usar búsqueda exacta
                if (searchTerm.length <= 2) {
                    const matchName = product.name.toLowerCase().includes(searchTerm);
                    const matchDescription = product.description && product.description.toLowerCase().includes(searchTerm);
                    const matchCategories = product.categories && product.categories.some(cat =>
                        cat.toLowerCase().includes(searchTerm)
                    );
                    
                    if (!matchName && !matchDescription && !matchCategories) {
                        return false;
                    }
                } else {
                    // Usar fuzzy search para términos más largos
                    if (!this.fuzzySearchMatch(product, searchTerm)) {
                        return false;
                    }
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
            if (this.currentFilters.inStock && !product.inStock) {
                return false;
            }

            return true;
        });
        
        console.log('🔍 DIAGNÓSTICO - Total productos después de filtrar:', filteredProducts.length);
        console.log('🔍 DIAGNÓSTICO - Productos filtrados:', filteredProducts.map(p => p.name));
        
        return filteredProducts;
    }

    // ========================================
    // FUZZY SEARCH IMPLEMENTATION
    // ========================================
    
    fuzzySearchMatch(product, searchTerm) {
        const searchWords = searchTerm.split(' ').filter(word => word.length > 0);
        
        // Campos donde buscar
        const searchFields = [
            product.name || '',
            product.description || '',
            ...(product.categories || [])
        ].map(field => field.toLowerCase());
        
        // Cada palabra del término de búsqueda debe coincidir en algún campo
        return searchWords.every(searchWord => {
            return searchFields.some(field => {
                return this.isWordMatch(field, searchWord);
            });
        });
    }
    
    isWordMatch(text, searchWord) {
        // 1. Búsqueda exacta (más rápida)
        if (text.includes(searchWord)) {
            return true;
        }
        
        // 2. Búsqueda por palabras individuales (para plurales)
        const textWords = text.split(/[\s,.-]+/).filter(word => word.length > 0);
        
        for (let textWord of textWords) {
            // Búsqueda exacta de palabra
            if (textWord === searchWord) {
                return true;
            }
            
            // 3. Similitud por plurales/singulares
            if (this.checkPluralSingular(textWord, searchWord)) {
                return true;
            }
            
            // 4. Distancia de Levenshtein para errores tipográficos
            if (searchWord.length >= 4 && textWord.length >= 4) {
                const distance = this.levenshteinDistance(textWord, searchWord);
                const maxDistance = Math.floor(Math.max(textWord.length, searchWord.length) * 0.2); // 20% de tolerancia
                
                if (distance <= maxDistance) {
                    return true;
                }
            }
            
            // 5. Búsqueda de subcadenas para palabras largas
            if (searchWord.length >= 4 && textWord.length >= 4) {
                if (textWord.includes(searchWord) || searchWord.includes(textWord)) {
                    return true;
                }
            }
        }
        
        // 6. Verificar sinónimos
        return this.checkSynonyms(text, searchWord);
    }
    
    checkPluralSingular(word1, word2) {
        const pluralRules = [
            // Español
            { singular: /(.+)s$/, plural: '$1es' }, // corazones -> corazón
            { singular: /(.+)es$/, plural: '$1' },   // aretes -> arete
            { singular: /(.+)as$/, plural: '$1a' },  // bolsas -> bolsa
            { singular: /(.+)os$/, plural: '$1o' },  // anillos -> anillo
            { singular: /(.+)s$/, plural: '$1' },    // collares -> collar
        ];
        
        // Verificar si word1 es plural de word2
        for (let rule of pluralRules) {
            if (rule.singular.test(word1)) {
                const singular = word1.replace(rule.singular, rule.plural);
                if (singular === word2) {
                    return true;
                }
            }
            if (rule.singular.test(word2)) {
                const singular = word2.replace(rule.singular, rule.plural);
                if (singular === word1) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    checkSynonyms(text, searchWord) {
        const synonyms = {
            'arete': ['pendiente', 'zarcillo', 'aro', 'aretes'],
            'aretes': ['pendientes', 'zarcillos', 'aros', 'arete'],
            'anillo': ['sortija', 'aro', 'anillos'],
            'anillos': ['sortijas', 'aros', 'anillo'],
            'collar': ['gargantilla', 'cadena', 'collares'],
            'collares': ['gargantillas', 'cadenas', 'collar'],
            'pulsera': ['brazalete', 'manilla', 'pulseras'],
            'pulseras': ['brazaletes', 'manillas', 'pulsera'],
            'bolsa': ['cartera', 'bolso', 'morral', 'bag', 'bolsas'],
            'bolsas': ['carteras', 'bolsos', 'morrales', 'bags', 'bolsa'],
            'backpack': ['mochila', 'morral', 'backpacks'],
            'backpacks': ['mochilas', 'morrales', 'backpack'],
            'joyeria': ['joyería', 'joyas', 'bisutería'],
            'joyas': ['joyería', 'bisutería', 'joyeria'],
            'accesorios': ['complementos', 'accesorio'],
            'accesorio': ['complemento', 'accesorios']
        };
        
        const searchSynonyms = synonyms[searchWord] || [];
        
        return searchSynonyms.some(synonym => {
            return text.includes(synonym);
        });
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
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
                this.currentFilters.onSale = e.target.checked;
                this.renderProducts();
            });
        }

        if (featuredFilter) {
            featuredFilter.addEventListener('change', (e) => {
                this.currentFilters.featured = e.target.checked;
                this.renderProducts();
            });
        }

        if (inStockFilter) {
            inStockFilter.addEventListener('change', (e) => {
                this.currentFilters.inStock = e.target.checked;
                this.renderProducts();
            });
        }

        // Ordenamiento
        const sortProducts = document.getElementById('sortProducts');
        if (sortProducts) {
            sortProducts.addEventListener('change', (e) => {
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
    }

    // Nueva función para seleccionar categoría con animación
    selectCategory(categoryName) {
        console.log(`🎯 Categoría seleccionada: ${categoryName}`);
        
        // Ocultar grid de categorías con animación
        this.hideCategoriesWithAnimation();
        
        // Establecer filtro de categoría y cargar productos después de la animación
        setTimeout(() => {
            this.currentFilters.category = categoryName;
            this.renderProducts();
            this.renderCategoriesFilters();
            this.showProductsSection();
        }, 500); // Esperar que termine la animación de ocultación
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
            inStock: true
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
        if (inStockFilter) inStockFilter.checked = true;

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
        
        // Actualizar filtro actual
        this.currentFilters.category = categoryName || null;
        
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
            // Ocultar categorías y mostrar productos filtrados
            this.hideCategoriesWithAnimation();
            
            setTimeout(() => {
                this.renderProducts();
                this.showProductsSection();
            }, 500);
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

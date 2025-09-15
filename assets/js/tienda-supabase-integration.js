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

            // Cargar datos iniciales
            await this.loadCategories();
            await this.loadProducts();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            console.log('✅ Tienda inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando tienda:', error);
            this.showError('Error cargando la tienda');
        }
    }

    async loadCategories() {
        console.log('📂 Cargando categorías...');
        
        try {
            const response = await window.artesanaAPI.getCategories();
            this.allCategories = response.categories;
            
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
        return this.allProducts.filter(product => {
            // Verificar tanto category_ids como categories
            const hasIdMatch = product.category_ids && product.category_ids.includes(categoryId);
            const hasCategoryMatch = product.categories && product.categories.some(cat => 
                this.getCategoryIdByName(cat) === categoryId
            );
            return hasIdMatch || hasCategoryMatch;
        }).length;
    }

    getCategoryIdByName(categoryName) {
        const category = this.allCategories.find(cat => cat.name === categoryName);
        return category ? category.id : null;
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
                        ${(product.categories || []).slice(0, 2).map(cat => 
                            `<span class="product-category">${cat}</span>`
                        ).join('')}
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
        return products.filter(product => {
            // Filtro por categoría
            if (this.currentFilters.category) {
                if (!product.categories || !product.categories.includes(this.currentFilters.category)) {
                    return false;
                }
            }

            // Filtro por búsqueda
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase();
                const matchName = product.name.toLowerCase().includes(searchTerm);
                const matchDescription = product.description && product.description.toLowerCase().includes(searchTerm);
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
            if (this.currentFilters.inStock && !product.inStock) {
                return false;
            }

            return true;
        });
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
            
            // Scroll suave a la sección de productos
            document.getElementById('productsContainer')?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
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
                
                // Scroll suave a la sección de productos
                document.getElementById('productsContainer')?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
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

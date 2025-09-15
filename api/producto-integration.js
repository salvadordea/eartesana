/**
 * ESTUDIO ARTESANA - Product Page Integration
 * ==========================================
 * Script para manejo de página individual de producto
 */

(function() {
    'use strict';

    // ==========================================
    // CONFIGURACIÓN GLOBAL
    // ==========================================
    
    const CONFIG = {
        API_URL: 'http://localhost:3001/api',
        CACHE_TTL: 10 // minutos
    };

    // Estado global
    const PRODUCT_STATE = {
        currentProduct: null,
        selectedVariants: {},
        selectedImage: 0,
        quantity: 1,
        isLoading: false,
        productId: null
    };

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================

    document.addEventListener('DOMContentLoaded', async function() {
        console.log('🔧 Inicializando página de producto...');
        
        // Obtener ID del producto de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (!productId) {
            console.error('❌ No se proporcionó ID de producto');
            showProductNotFound();
            return;
        }
        
        PRODUCT_STATE.productId = productId;
        console.log('🔍 Cargando producto ID:', productId);
        
        // Esperar a que la API esté disponible
        await waitForAPI();
        
        // Cargar producto
        await loadProduct(productId);
        
        // Configurar event listeners
        setupEventListeners();
        
        console.log('✅ Página de producto inicializada');
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
        
        console.error('❌ No se pudo conectar con la API');
        showProductError('Error de conexión con el servidor');
    }

    // ==========================================
    // CARGA DE PRODUCTO
    // ==========================================

    async function loadProduct(productId) {
        if (PRODUCT_STATE.isLoading) return;
        
        PRODUCT_STATE.isLoading = true;
        showProductLoading(true);
        
        try {
            console.log('📦 Cargando producto:', productId);
            
            const product = await window.artesanaAPI.getProduct(productId);
            
            if (!product) {
                showProductNotFound();
                return;
            }
            
            PRODUCT_STATE.currentProduct = product;
            
            // Renderizar producto
            renderProduct(product);
            
            // Cargar productos relacionados
            await loadRelatedProducts(product.categoria);
            
            // Actualizar breadcrumbs
            updateBreadcrumbs(product);
            
            console.log('✅ Producto cargado correctamente');
            
        } catch (error) {
            console.error('❌ Error cargando producto:', error);
            showProductError('Error al cargar el producto');
        } finally {
            PRODUCT_STATE.isLoading = false;
            showProductLoading(false);
        }
    }

    function renderProduct(product) {
        // Actualizar título de la página
        document.title = `${product.name} - Estudio Artesana`;
        
        // Renderizar imágenes
        renderProductImages(product);
        
        // Renderizar información
        renderProductInfo(product);
        
        // Renderizar variantes si las hay
        renderProductVariants(product);
        
        // Renderizar especificaciones
        renderProductSpecifications(product);
        
        // Mostrar contenido del producto
        showProductContent();
        
        // Mostrar tabs con información adicional
        showProductTabs();
    }

    function renderProductImages(product) {
        const mainImage = document.getElementById('mainProductImage');
        const thumbnails = document.getElementById('imageThumbnails');
        const badges = document.getElementById('imageBadges');
        
        if (!mainImage) return;
        
        // Configurar imagen principal
        const images = product.images || [product.mainImage];
        if (images.length > 0) {
            mainImage.src = images[0];
            mainImage.alt = product.name;
        }
        
        // Renderizar thumbnails si hay múltiples imágenes
        if (thumbnails && images.length > 1) {
            const thumbnailsHTML = images.map((image, index) => `
                <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <img src="${image}" alt="${product.name} - ${index + 1}" />
                </div>
            `).join('');
            
            thumbnails.innerHTML = thumbnailsHTML;
            
            // Event listeners para thumbnails
            thumbnails.querySelectorAll('.thumbnail').forEach(thumb => {
                thumb.addEventListener('click', (e) => {
                    const index = parseInt(e.currentTarget.dataset.index);
                    selectImage(index, images);
                });
            });
        }
        
        // Renderizar badges
        if (badges) {
            let badgesHTML = '';
            
            if (product.onSale) {
                badgesHTML += '<div class="product-badge sale">Oferta</div>';
            }
            if (product.featured) {
                badgesHTML += '<div class="product-badge featured">Destacado</div>';
            }
            if (product.isNew) {
                badgesHTML += '<div class="product-badge new">Nuevo</div>';
            }
            
            badges.innerHTML = badgesHTML;
        }
    }

    function selectImage(index, images) {
        if (!images || index >= images.length) return;
        
        const mainImage = document.getElementById('mainProductImage');
        const thumbnails = document.querySelectorAll('.thumbnail');
        
        if (mainImage) {
            mainImage.src = images[index];
        }
        
        // Actualizar thumbnail activo
        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
        
        PRODUCT_STATE.selectedImage = index;
    }

    function renderProductInfo(product) {
        // Título
        const title = document.getElementById('productTitle');
        if (title) title.textContent = product.name;
        
        // Precio
        const priceContainer = document.getElementById('productPrice');
        if (priceContainer) {
            let priceHTML = '';
            
            if (product.onSale) {
                priceHTML = `
                    <span class="current-price">${product.formattedPrice}</span>
                    <span class="original-price">$${product.regularPrice.toFixed(2)}</span>
                    <span class="discount-percentage">-${Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)}%</span>
                `;
            } else {
                priceHTML = `<span class="current-price">${product.formattedPrice}</span>`;
            }
            
            priceContainer.innerHTML = priceHTML;
        }
        
        // Descripción
        const description = document.getElementById('productDescription');
        if (description) {
            description.innerHTML = `<p>${product.description || 'Sin descripción disponible.'}</p>`;
        }
        
        // Meta información
        const sku = document.getElementById('productSku');
        const category = document.getElementById('productCategory');
        const stock = document.getElementById('productStock');
        
        if (sku) sku.textContent = product.sku || '-';
        if (category) category.textContent = product.categoria || '-';
        if (stock) {
            stock.textContent = product.inStock ? 'En stock' : 'Agotado';
            stock.className = product.inStock ? 'text-success' : 'text-danger';
        }
    }

    function renderProductVariants(product) {
        const variantsContainer = document.getElementById('productVariants');
        if (!variantsContainer || !product.variants || product.variants.length === 0) {
            return;
        }
        
        const variants = groupVariantsByType(product.variants);
        let hasVariants = false;
        
        // Colores
        if (variants.color && variants.color.length > 0) {
            const colorContainer = document.getElementById('colorVariants');
            if (colorContainer) {
                const colorsHTML = variants.color.map(variant => `
                    <div class="color-option" 
                         data-variant="${variant.name}" 
                         style="background-color: ${variant.value}"
                         title="${variant.name}">
                    </div>
                `).join('');
                
                colorContainer.querySelector('.color-options').innerHTML = colorsHTML;
                colorContainer.style.display = 'block';
                hasVariants = true;
            }
        }
        
        // Tallas
        if (variants.size && variants.size.length > 0) {
            const sizeContainer = document.getElementById('sizeVariants');
            if (sizeContainer) {
                const sizesHTML = variants.size.map(variant => `
                    <div class="size-option" data-variant="${variant.name}">
                        ${variant.name}
                    </div>
                `).join('');
                
                sizeContainer.querySelector('.size-options').innerHTML = sizesHTML;
                sizeContainer.style.display = 'block';
                hasVariants = true;
            }
        }
        
        // Otras opciones
        const otherVariants = Object.entries(variants).filter(([key]) => 
            key !== 'color' && key !== 'size'
        );
        
        if (otherVariants.length > 0) {
            const otherContainer = document.getElementById('otherVariants');
            if (otherContainer) {
                const otherHTML = otherVariants.flatMap(([type, options]) =>
                    options.map(variant => `
                        <div class="other-option" data-variant="${variant.name}" data-type="${type}">
                            ${variant.name}
                        </div>
                    `)
                ).join('');
                
                otherContainer.querySelector('.other-options').innerHTML = otherHTML;
                otherContainer.style.display = 'block';
                hasVariants = true;
            }
        }
        
        if (hasVariants) {
            variantsContainer.style.display = 'block';
            setupVariantEvents();
        }
    }

    function groupVariantsByType(variants) {
        const grouped = {};
        
        variants.forEach(variant => {
            const type = variant.type || 'other';
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push(variant);
        });
        
        return grouped;
    }

    function setupVariantEvents() {
        // Event listeners para opciones de variantes
        document.querySelectorAll('.color-option, .size-option, .other-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const element = e.currentTarget;
                const variantName = element.dataset.variant;
                const variantType = element.dataset.type || element.classList.contains('color-option') ? 'color' : 'size';
                
                // Toggle selección
                const siblings = element.parentNode.querySelectorAll(`.${element.classList[0]}`);
                siblings.forEach(sibling => sibling.classList.remove('selected'));
                element.classList.add('selected');
                
                // Actualizar estado
                PRODUCT_STATE.selectedVariants[variantType] = variantName;
                
                console.log('Variante seleccionada:', variantType, variantName);
            });
        });
    }

    function renderProductSpecifications(product) {
        const specsContainer = document.getElementById('specificationsGrid');
        if (!specsContainer || !product.specifications) return;
        
        const specsHTML = Object.entries(product.specifications).map(([key, value]) => `
            <div class="spec-item">
                <div class="spec-label">${key}</div>
                <div class="spec-value">${value}</div>
            </div>
        `).join('');
        
        specsContainer.innerHTML = specsHTML;
    }

    // ==========================================
    // PRODUCTOS RELACIONADOS
    // ==========================================

    async function loadRelatedProducts(categoryId) {
        if (!categoryId || !window.artesanaAPI) return;
        
        try {
            const filters = {
                categoria: categoryId,
                limit: 4,
                exclude: PRODUCT_STATE.productId
            };
            
            const response = await window.artesanaAPI.getProducts(filters);
            
            if (response && response.products && response.products.length > 0) {
                renderRelatedProducts(response.products);
                showRelatedProducts();
            }
            
        } catch (error) {
            console.error('❌ Error cargando productos relacionados:', error);
        }
    }

    function renderRelatedProducts(products) {
        const container = document.getElementById('relatedProductsGrid');
        if (!container) return;
        
        const productsHTML = products.map(product => `
            <div class="product-card" onclick="window.location.href='producto.html?id=${product.id}'">
                <div class="product-image">
                    <img src="${product.mainImage}" alt="${product.name}" loading="lazy" 
                         onerror="this.src='../assets/images/placeholder-product.jpg'">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">${product.formattedPrice}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = productsHTML;
    }

    // ==========================================
    // INTERACCIONES DEL USUARIO
    // ==========================================

    function setupEventListeners() {
        // Selector de cantidad
        const decreaseBtn = document.getElementById('decreaseQty');
        const increaseBtn = document.getElementById('increaseQty');
        const quantityInput = document.getElementById('quantity');
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => updateQuantity(-1));
        }
        
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => updateQuantity(1));
        }
        
        if (quantityInput) {
            quantityInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value) || 1;
                PRODUCT_STATE.quantity = Math.max(1, Math.min(99, value));
                e.target.value = PRODUCT_STATE.quantity;
            });
        }
        
        // Botón agregar al carrito
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', addToCart);
        }
        
        // Botón wishlist
        const wishlistBtn = document.getElementById('wishlistBtn');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', toggleWishlist);
        }
        
        // Tabs de información
        setupTabEvents();
    }

    function updateQuantity(delta) {
        const quantityInput = document.getElementById('quantity');
        if (!quantityInput) return;
        
        const currentQty = parseInt(quantityInput.value) || 1;
        const newQty = Math.max(1, Math.min(99, currentQty + delta));
        
        quantityInput.value = newQty;
        PRODUCT_STATE.quantity = newQty;
    }

    async function addToCart() {
        const product = PRODUCT_STATE.currentProduct;
        if (!product || !window.artesanaAPI) return;
        
        try {
            const addToCartBtn = document.getElementById('addToCartBtn');
            if (addToCartBtn) {
                addToCartBtn.disabled = true;
                addToCartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';
            }
            
            await window.artesanaAPI.addToCart(product.id, {
                quantity: PRODUCT_STATE.quantity,
                variants: PRODUCT_STATE.selectedVariants
            });
            
            // Actualizar contador del carrito
            if (window.artesanaAPI.updateCartCounter) {
                window.artesanaAPI.updateCartCounter();
            }
            
            // Mostrar mensaje de éxito
            showNotification('Producto agregado al carrito', 'success');
            
        } catch (error) {
            console.error('❌ Error agregando al carrito:', error);
            showNotification('Error al agregar al carrito', 'error');
        } finally {
            const addToCartBtn = document.getElementById('addToCartBtn');
            if (addToCartBtn) {
                addToCartBtn.disabled = false;
                addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Agregar al carrito';
            }
        }
    }

    function toggleWishlist() {
        const wishlistBtn = document.getElementById('wishlistBtn');
        if (!wishlistBtn) return;
        
        const isActive = wishlistBtn.classList.contains('active');
        
        if (isActive) {
            wishlistBtn.classList.remove('active');
            wishlistBtn.innerHTML = '<i class="far fa-heart"></i>';
            showNotification('Producto removido de favoritos', 'info');
        } else {
            wishlistBtn.classList.add('active');
            wishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';
            showNotification('Producto agregado a favoritos', 'success');
        }
    }

    // ==========================================
    // TABS DE INFORMACIÓN
    // ==========================================

    function setupTabEvents() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                switchTab(tabId, tabButtons, tabContents);
            });
        });
    }

    function switchTab(targetTab, buttons, contents) {
        // Actualizar botones
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === targetTab) {
                btn.classList.add('active');
            }
        });
        
        // Actualizar contenido
        contents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `tab-${targetTab}`) {
                content.classList.add('active');
            }
        });
    }

    // ==========================================
    // FUNCIONES DE ESTADO
    // ==========================================

    function showProductLoading(show) {
        const loading = document.getElementById('productLoading');
        const content = document.getElementById('productContent');
        const notFound = document.getElementById('productNotFound');
        
        if (loading) loading.style.display = show ? 'flex' : 'none';
        if (content) content.style.display = show ? 'none' : 'block';
        if (notFound) notFound.style.display = 'none';
    }

    function showProductContent() {
        const loading = document.getElementById('productLoading');
        const content = document.getElementById('productContent');
        const notFound = document.getElementById('productNotFound');
        
        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'block';
        if (notFound) notFound.style.display = 'none';
    }

    function showProductNotFound() {
        const loading = document.getElementById('productLoading');
        const content = document.getElementById('productContent');
        const notFound = document.getElementById('productNotFound');
        
        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'none';
        if (notFound) notFound.style.display = 'block';
    }

    function showProductError(message) {
        console.error('Error en producto:', message);
        showProductNotFound();
    }

    function showProductTabs() {
        const tabs = document.getElementById('productTabs');
        if (tabs) tabs.style.display = 'block';
    }

    function showRelatedProducts() {
        const related = document.getElementById('relatedProducts');
        if (related) related.style.display = 'block';
    }

    function updateBreadcrumbs(product) {
        const categorySpan = document.getElementById('breadcrumb-category');
        const productSpan = document.getElementById('breadcrumb-product');
        
        if (categorySpan) categorySpan.textContent = product.categoria || 'Categoría';
        if (productSpan) productSpan.textContent = product.name || 'Producto';
    }

    // ==========================================
    // UTILIDADES
    // ==========================================

    function showNotification(message, type = 'info') {
        if (window.artesanaAPI && typeof window.artesanaAPI.showNotification === 'function') {
            window.artesanaAPI.showNotification(message, type);
        } else {
            // Fallback simple
            const alertClass = type === 'error' ? 'alert' : 'alert';
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Exportar funciones globales
    window.ProductPageIntegration = {
        loadProduct,
        addToCart,
        toggleWishlist,
        updateQuantity
    };

})();

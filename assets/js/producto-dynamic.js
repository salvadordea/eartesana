/**
 * ESTUDIO ARTESANA - Página de Producto Dinámica
 * ===============================================
 * Maneja la carga dinámica de productos individuales desde la API
 */

class ProductoManager {
    constructor() {
        this.productId = null;
        this.product = null;
        this.selectedVariant = null;
        this.selectedQuantity = 1;
        this.currentImageIndex = 0;
        this.images = [];

        // Mapeos para Supabase bucket - copiados desde admin logic
        this.CATEGORY_MAPPING = {
            'Joyeria': 'Joyeria',
            'Portacel': 'Portacel',
            'Bolsas Grandes': 'Bolsas Grandes',
            'Bolsas Cruzadas': 'Bolsas Cruzadas',
            'Bolsas de mano': 'Bolsas de mano',
            'Bolsas de Textil y Piel': 'Bolsas de Textil y Piel',
            'Backpacks': 'Backpacks',
            'Botelleras': 'Botelleras',
            'Hogar': 'Hogar',
            'Accesorios': 'Accesorios'
        };

        this.COMPLETE_PRODUCT_MAPPING = {
            'Arete Piel Balancín Oval': 'Arete Piel Balancin Oval',
            'Arete Piel Gota': 'Arete Piel Gota',
            'Arete Piel Péndulo': 'Arete Piel Pendulo',
            'Brazalete Piel Pelo': 'Brazalete Piel Pelo',
            'Brazalete Liso': 'Brazalete Liso',
            'Brazalete Hombre': 'Brazalete Hombre',
            'Brazalete dos Lineas': 'Brazalete dos Lineas',
            'Brazalete lineas Delgadas': 'Brazalete lineas Delgadas',
            'Collar Piel Cuadro': 'Collar Piel Cuadro',
            'Collar Piel Oval': 'Collar Piel Oval',
            'Collar Nudo': 'Collar Nudo',
            'Collar Corto': 'Collar Corto',
            'Collar largo': 'Collar largo',
            'Collar Nudos Oval': 'Collar Nudos Oval',
            'Colgante Piel': 'Colgante Piel',
            'Anillo de Piel': 'Anillo de Piel',
            'Anillo Doble': 'Anillo Doble',
            'Bolsa Cruzada Broche': 'Bolsa Cruzada Broche',
            'Bolsa Cruzada Solapa': 'Bolsa Cruzada Solapa',
            'Bolsa Grande Broche': 'Bolsa Grande Broche',
            'Bolsa Grande': 'Bolsa Grande',
            'Bolsa de Mano': 'Bolsa de Mano',
            'Clutch Broche Grande': 'Clutch Broche Grande',
            'Clutch Broche Chico': 'Clutch Broche Chico',
            'Clutch Chica Plana': 'Clutch Chica Plana',
            'Cartera con Costura': 'Cartera con Costura',
            'Cangurera': 'Cangurera',
            'Portacel Piel liso': 'Portacel Piel liso',
            'Bolsa Cilindro Jareta': 'Bolsa Cilindro Jareta',
            'Monedero Clip': 'Monedero Clip',
            'Llavero Corto': 'Llavero Corto',
            'Portacables Grande': 'Portacables Grande',
            'Portapasaportes': 'Portapasaportes',
            'Monedero Cierre': 'Monedero Cierre',
            'Monedero Motita': 'Monedero Motita'
        };

        this.init();
    }

    init() {
        // Obtener ID del producto de la URL
        this.productId = this.getProductIdFromURL();
        
        if (!this.productId) {
            this.showError('No se especificó un producto válido');
            return;
        }

        console.log(`🔍 Cargando producto ID: ${this.productId}`);
        
        // Esperar a que la API esté disponible
        this.waitForAPI().then(() => {
            this.loadProduct();
        });

        // Inicializar event listeners
        this.initEventListeners();
    }

    async waitForAPI() {
        return new Promise((resolve) => {
            const checkAPI = () => {
                if (window.artesanaAPI) {
                    resolve();
                } else {
                    setTimeout(checkAPI, 100);
                }
            };
            checkAPI();
        });
    }

    getProductIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async loadProduct() {
        try {
            this.showLoading();
            
            console.log('🔍 Iniciando carga de producto, ID:', this.productId);
            console.log('🔍 artesanaAPI disponible:', !!window.artesanaAPI);
            
            if (!window.artesanaAPI) {
                throw new Error('artesanaAPI no está disponible');
            }
            
            if (typeof window.artesanaAPI.getProduct !== 'function') {
                throw new Error('artesanaAPI.getProduct no es una función');
            }
            
            console.log('🌐 Llamando a artesanaAPI.getProduct con ID:', this.productId);
            const response = await window.artesanaAPI.getProduct(this.productId);
            console.log('📦 Respuesta recibida:', response);
            
            if (!response) {
                this.showError('Producto no encontrado');
                return;
            }

            this.product = response;
            console.log('✅ Producto procesado:', this.product);
            
            this.renderProduct();
            this.loadRelatedProducts();
            
            console.log('✅ Producto cargado exitosamente:', this.product.name || 'Sin nombre');

        } catch (error) {
            console.error('❌ Error detallado cargando producto:', {
                error: error.message,
                stack: error.stack,
                productId: this.productId,
                artesanaAPIExists: !!window.artesanaAPI,
                artesanaAPIGetProduct: typeof window.artesanaAPI?.getProduct
            });
            this.showError(`Error cargando el producto: ${error.message}. Por favor, inténtalo de nuevo.`);
        }
    }

    showLoading() {
        const container = document.getElementById('productContainer');
        if (container) {
            container.innerHTML = `
                <div class="product-loading">
                    <div class="loading-spinner"></div>
                    <h3>Cargando producto...</h3>
                    <p>Obteniendo información del producto</p>
                </div>
            `;
        }
    }

    showError(message) {
        const container = document.getElementById('productContainer');
        if (container) {
            container.innerHTML = `
                <div class="product-error">
                    <div class="error-icon">⚠️</div>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button onclick="window.history.back()" class="btn btn-secondary">
                        Regresar
                    </button>
                </div>
            `;
        }

        // Ocultar loading de productos relacionados
        const relatedSection = document.getElementById('relatedProductsLoading');
        if (relatedSection) {
            relatedSection.style.display = 'none';
        }
    }

    renderProduct() {
        console.log(`🎨 renderProduct llamado, producto:`, this.product);
        console.log(`📦 Variaciones del producto:`, this.product.variations);

        this.updateBreadcrumb();
        this.renderProductImages();
        this.renderProductInfo();
        this.renderProductTabs();
        this.hideLoading();
    }

    updateBreadcrumb() {
        const breadcrumb = document.querySelector('.breadcrumb-nav');
        if (breadcrumb && this.product) {
            breadcrumb.innerHTML = `
                <a href="./index.html">Inicio</a>
                <i class="fas fa-chevron-right"></i>
                <a href="./tienda.html">Tienda</a>
                <i class="fas fa-chevron-right"></i>
                <a href="./tienda.html?categoria=${this.product.category}">${this.product.category || 'Productos'}</a>
                <i class="fas fa-chevron-right"></i>
                <span>${this.product.name || 'Producto'}</span>
            `;
        }
    }

    renderProductImages() {
        // Preparar array de imágenes
        this.images = [];
        
        if (this.product.mainImage) {
            this.images.push(this.product.mainImage);
        }
        
        if (this.product.images && this.product.images.length > 0) {
            this.product.images.forEach(img => {
                if (img && !this.images.includes(img)) {
                    this.images.push(img);
                }
            });
        }
        
        // Si no hay imágenes, usar placeholder
        if (this.images.length === 0) {
            this.images.push('./assets/images/placeholder-product.jpg');
        }

        // Renderizar imagen principal
        const mainImageContainer = document.getElementById('mainProductImage');
        if (mainImageContainer) {
            mainImageContainer.innerHTML = `
                <img src="${this.images[0]}" alt="${this.product.name}" id="currentProductImage">
                ${this.images.length > 1 ? `
                    <div class="image-navigation">
                        <button class="nav-btn prev-btn" onclick="productoManager.prevImage()">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="nav-btn next-btn" onclick="productoManager.nextImage()">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                ` : ''}
                <div class="image-zoom-hint">Click para ampliar</div>
            `;
        }

        // Renderizar thumbnails
        if (this.images.length > 1) {
            const thumbnailContainer = document.getElementById('productThumbnails');
            if (thumbnailContainer) {
                thumbnailContainer.innerHTML = this.images.map((img, index) => `
                    <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="productoManager.selectImage(${index})">
                        <img src="${img}" alt="Vista ${index + 1}">
                    </div>
                `).join('');
            }
        }
    }

    renderProductInfo() {
        // Título del producto
        const titleElement = document.getElementById('productTitle');
        if (titleElement) {
            titleElement.textContent = this.product.name || 'Producto sin nombre';
        }

        // Categoría
        const categoryElement = document.getElementById('productCategory');
        if (categoryElement && this.product.category) {
            categoryElement.innerHTML = `
                <a href="./tienda.html?categoria=${this.product.category}">
                    ${this.product.category}
                </a>
            `;
        }

        // Precio
        this.updatePriceDisplay();

        // Stock y disponibilidad
        this.updateStockDisplay();

        // Rating (si existe)
        this.updateRatingDisplay();

        // Variantes
        this.renderVariants();

        // Descripción corta
        const shortDescElement = document.getElementById('productShortDescription');
        if (shortDescElement) {
            const shortDesc = this.product.shortDescription || this.product.description || 'Sin descripción disponible.';

            // Replace the loading text with actual description
            shortDescElement.innerHTML = `<p>${shortDesc}</p>`;
            console.log(`📝 Short description updated: ${shortDesc}`);
        }
    }

    updatePriceDisplay() {
        const priceContainer = document.getElementById('productPrice');
        if (!priceContainer) return;

        const price = this.product.price || 0;
        const originalPrice = this.product.originalPrice;
        const onSale = this.product.onSale && originalPrice && originalPrice > price;

        let priceHTML = `<span class="current-price">${this.formatPrice(price)}</span>`;

        if (onSale) {
            priceHTML += `<span class="original-price">${this.formatPrice(originalPrice)}</span>`;
            const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
            priceHTML += `<span class="discount-badge">-${discount}%</span>`;
        }

        // Add tax disclaimer
        priceHTML += `<span class="tax-disclaimer">IVA incluido</span>`;

        priceContainer.innerHTML = priceHTML;
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

    updateStockDisplay(variantStock = null) {
        const stockElement = document.getElementById('productStock');
        if (!stockElement) return;

        // For products with variants, only show stock when a variant is selected
        const hasVariants = this.product.variations && this.product.variations.length > 0;

        if (hasVariants && variantStock === null) {
            // Hide stock indicator for variant products when no variant is selected
            stockElement.innerHTML = '';

            // Keep add to cart button enabled but with neutral text
            const addToCartBtn = document.getElementById('addToCartBtn');
            if (addToCartBtn) {
                addToCartBtn.disabled = false;
                addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Agregar al carrito';
            }
            return;
        }

        // Use variant stock if provided, otherwise use product stock
        const stock = variantStock !== null ? variantStock : (this.product.stock || 0);
        const inStock = stock > 0;

        stockElement.innerHTML = `
            <div class="stock-indicator ${inStock ? 'in-stock' : 'out-of-stock'}">
                <i class="fas ${inStock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                <span>${inStock ? `En stock (${stock} disponibles)` : 'Agotado'}</span>
            </div>
        `;

        // Update add to cart button
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.disabled = !inStock;
            addToCartBtn.innerHTML = inStock ? '<i class="fas fa-shopping-cart"></i> Agregar al carrito' : 'Agotado';
        }
    }

    updateRatingDisplay() {
        const ratingContainer = document.getElementById('productRating');
        if (!ratingContainer) return;

        const rating = this.product.rating || this.product.averageRating || 0;
        const reviewCount = this.product.reviewCount || 0;

        if (rating > 0) {
            const stars = this.generateStarsHTML(rating);
            ratingContainer.innerHTML = `
                <div class="rating-display">
                    <div class="stars">${stars}</div>
                    <span class="rating-score">${rating.toFixed(1)}</span>
                    <span class="review-count">(${reviewCount} reseña${reviewCount !== 1 ? 's' : ''})</span>
                </div>
            `;
        } else {
            ratingContainer.innerHTML = '<div class="no-rating">Sin calificaciones aún</div>';
        }
    }

    generateStarsHTML(rating) {
        let starsHTML = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHTML += '<i class="fas fa-star filled"></i>';
            } else if (i === fullStars && hasHalfStar) {
                starsHTML += '<i class="fas fa-star-half-alt filled"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }

        return starsHTML;
    }

    renderVariants() {
        if (!this.product.variations || this.product.variations.length === 0) {
            return;
        }

        const variantsContainer = document.getElementById('productVariants');
        if (!variantsContainer) return;

        console.log(`🎨 Renderizando ${this.product.variations.length} variantes:`, this.product.variations);

        // Simplificar: tratar todas las variantes como variantes con imágenes
        const variantsHTML = `
            <div class="variant-group">
                <h4>Variantes</h4>
                <div class="variant-options" data-variant-type="variant">
                    ${this.product.variations.map(variant => `
                        <div class="variant-option ${variant.inStock ? '' : 'unavailable'}"
                             data-variant-id="${variant.id}"
                             data-variant-name="${variant.name}"
                             onclick="productoManager.selectVariant('${variant.id}', 'variant')">
                            ${variant.name}
                            ${!variant.inStock ? '<span class="unavailable-text">No disponible</span>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        variantsContainer.innerHTML = variantsHTML;
    }

    // Eliminamos groupVariantsByType() ya que ahora manejamos las variantes directamente

    renderProductTabs() {
        // Tab de descripción
        const descriptionTab = document.getElementById('descriptionContent');
        if (descriptionTab) {
            descriptionTab.innerHTML = `
                <div class="product-description">
                    ${this.product.description || this.product.longDescription || 'Sin descripción disponible.'}
                </div>
            `;
        }

        // Tab de especificaciones
        const specsTab = document.getElementById('specificationsContent');
        if (specsTab && this.product.specifications) {
            specsTab.innerHTML = `
                <div class="product-specs">
                    ${Object.entries(this.product.specifications).map(([key, value]) => `
                        <div class="spec-row">
                            <span class="spec-label">${this.capitalizeFirst(key)}:</span>
                            <span class="spec-value">${value}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Tab de reseñas
        this.renderReviews();
    }

    renderReviews() {
        const reviewsTab = document.getElementById('reviewsContent');
        if (!reviewsTab) return;

        if (this.product.reviews && this.product.reviews.length > 0) {
            reviewsTab.innerHTML = `
                <div class="product-reviews">
                    ${this.product.reviews.map(review => `
                        <div class="review-item">
                            <div class="review-header">
                                <div class="reviewer-info">
                                    <span class="reviewer-name">${review.customerName || 'Cliente anónimo'}</span>
                                    <div class="review-rating">${this.generateStarsHTML(review.rating)}</div>
                                </div>
                                <span class="review-date">${this.formatDate(review.date)}</span>
                            </div>
                            <div class="review-content">
                                ${review.comment}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            reviewsTab.innerHTML = `
                <div class="no-reviews">
                    <p>Aún no hay reseñas para este producto.</p>
                    <p>¡Sé el primero en compartir tu opinión!</p>
                </div>
            `;
        }
    }

    async loadRelatedProducts() {
        try {
            const relatedContainer = document.getElementById('relatedProductsGrid');
            if (!relatedContainer) return;

            // Obtener productos relacionados por categoría
            const categoryName = this.product.categories && this.product.categories.length > 0 
                ? this.product.categories[0].name 
                : null;
            
            if (!categoryName) {
                document.getElementById('relatedProductsSection').style.display = 'none';
                return;
            }
            
            const response = await window.artesanaAPI.getProductsByCategory(categoryName, 4);

            if (response && response.products && response.products.length > 0) {
                // Filtrar el producto actual
                const related = response.products.filter(p => p.id !== this.product.id);

                if (related.length > 0) {
                    relatedContainer.innerHTML = related.map(product => this.renderRelatedProductCard(product)).join('');
                    document.getElementById('relatedProductsSection').style.display = 'block';
                } else {
                    document.getElementById('relatedProductsSection').style.display = 'none';
                }
            }

        } catch (error) {
            console.error('Error cargando productos relacionados:', error);
            document.getElementById('relatedProductsSection').style.display = 'none';
        } finally {
            const loading = document.getElementById('relatedProductsLoading');
            if (loading) loading.style.display = 'none';
        }
    }

    renderRelatedProductCard(product) {
        const price = product.price || 0;
        const imageUrl = product.mainImage || product.images?.[0] || './assets/images/placeholder-product.jpg';

        return `
            <div class="product-card related-product" onclick="window.location.href='./producto.html?id=${product.id}'">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <div class="product-price">
                        <span class="price">${this.formatPrice(price)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Event Listeners
    initEventListeners() {
        // Control de cantidad
        document.addEventListener('click', (e) => {
            if (e.target.matches('#decreaseQuantity')) {
                this.changeQuantity(-1);
            } else if (e.target.matches('#increaseQuantity')) {
                this.changeQuantity(1);
            } else if (e.target.matches('#addToCartBtn')) {
                this.addToCart();
            }
        });

        // Tab navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('.tab-button')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // Image zoom and reset to main image on double click
        document.addEventListener('click', (e) => {
            if (e.target.matches('#currentProductImage')) {
                this.openImageZoom();
            }
        });

        // Double click to reset to main image
        document.addEventListener('dblclick', (e) => {
            if (e.target.matches('#currentProductImage')) {
                this.resetToMainImage();
                // Deselect all variants
                document.querySelectorAll('.variant-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.selectedVariant = null;
                this.updateStockDisplay(); // Hide stock indicator when variants are deselected
                console.log(`🔄 Double-click: Reset to main image`);
            }
        });
    }

    // Image Navigation
    selectImage(index) {
        if (index < 0 || index >= this.images.length) return;
        
        this.currentImageIndex = index;
        
        // Actualizar imagen principal
        const mainImage = document.getElementById('currentProductImage');
        if (mainImage) {
            mainImage.src = this.images[index];
        }

        // Actualizar thumbnails activos
        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }

    nextImage() {
        const nextIndex = (this.currentImageIndex + 1) % this.images.length;
        this.selectImage(nextIndex);
    }

    prevImage() {
        const prevIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
        this.selectImage(prevIndex);
    }

    // Variant Selection
    selectVariant(variantId, type) {
        console.log(`🎯 selectVariant llamado: variantId=${variantId}, type=${type}`);

        const variantElement = document.querySelector(`[data-variant-id="${variantId}"]`);
        if (!variantElement) {
            console.log(`❌ No se encontró elemento con data-variant-id="${variantId}"`);
            return;
        }

        const isOutOfStock = variantElement.classList.contains('out-of-stock') ||
                            variantElement.classList.contains('unavailable');

        if (isOutOfStock) {
            console.log(`⚠️ Variante fuera de stock: ${variantId}`);
            return;
        }

        // Verificar si la variante ya está seleccionada para permitir deselección
        const isAlreadySelected = variantElement.classList.contains('selected');
        console.log(`🔄 Variante ${variantId} ya seleccionada: ${isAlreadySelected}`);

        // Remover selección previa de todas las variantes
        document.querySelectorAll('.variant-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        if (isAlreadySelected) {
            // Deseleccionar - volver a imagen principal
            this.selectedVariant = null;
            this.resetToMainImage();
            this.updateStockDisplay(); // Hide stock indicator when no variant is selected
            console.log(`🔄 Variante deseleccionada, volviendo a imagen principal`);
        } else {
            // Seleccionar nueva variante
            variantElement.classList.add('selected');

            // Actualizar variante seleccionada
            this.selectedVariant = this.product.variations.find(v => v.id === variantId);

            if (this.selectedVariant) {
                console.log(`✅ Variante seleccionada:`, this.selectedVariant);

                // Actualizar precio y stock si la variante lo requiere
                this.updatePriceWithVariant();
                this.updateStockDisplay(this.selectedVariant.stock);

                // Si la variante ya tiene una imagen URL (desde la API), usarla directamente
                if (this.selectedVariant.image) {
                    // Properly encode URL to handle spaces and special characters
                    const encodedImageUrl = this.encodeImageUrl(this.selectedVariant.image);
                    console.log(`🖼️ Usando imagen directa de la variante: ${this.selectedVariant.image}`);
                    console.log(`🔗 URL codificada: ${encodedImageUrl}`);

                    // Verificar si la imagen existe, si no, probar fallbacks
                    const testImage = new Image();
                    testImage.onload = () => {
                        const mainImage = document.getElementById('currentProductImage');
                        if (mainImage) {
                            mainImage.src = encodedImageUrl;
                            mainImage.alt = `${this.product.name} - ${this.selectedVariant.name}`;
                        }
                        console.log(`✅ Imagen directa cargada exitosamente`);
                    };

                    testImage.onerror = () => {
                        console.log(`⚠️ Imagen directa falló, probando fallbacks...`);
                        // Si la imagen directa no funciona, usar el sistema de fallback
                        this.updateMainImageForVariant(this.selectedVariant.name);
                    };

                    testImage.src = encodedImageUrl;
                } else if (this.selectedVariant.name) {
                    // Fallback: construir URL usando mapeos
                    console.log(`🖼️ Construyendo imagen para variante: ${this.selectedVariant.name}`);
                    this.updateMainImageForVariant(this.selectedVariant.name);
                } else {
                    console.log(`⚠️ selectedVariant sin image ni name:`, this.selectedVariant);
                }
            }
        }
    }

    // Old image detection functions removed - now using window.imageDetector

    updateMainImageForVariant(variantName) {
        console.log(`📸 updateMainImageForVariant llamado con variante: ${variantName}`);

        if (!variantName || !this.product) {
            console.log(`❌ Falta variantName (${variantName}) o product:`, this.product);
            return;
        }

        // Direct JPG loading since all images are now converted
        const mappedCategory = this.getMappedCategory();
        const mappedProduct = this.getMappedProduct();
        const variantClean = this.normalizeText(variantName);

        const jpgUrl = `${this.supabaseUrl}/storage/v1/object/public/product-images/${encodeURIComponent(mappedCategory)}/${encodeURIComponent(mappedProduct)}/${encodeURIComponent(variantClean)}.jpg`;

        const mainImage = document.getElementById('currentProductImage');
        if (mainImage) {
            mainImage.src = jpgUrl;
            mainImage.alt = `${this.product.name} - ${variantName}`;
            console.log(`✅ Imagen de variante cargada: ${jpgUrl}`);
        }
    }

    resetToMainImage() {
        // Direct JPG loading for main image
        if (!this.product) return;

        const mappedCategory = this.getMappedCategory();
        const mappedProduct = this.getMappedProduct();

        const jpgUrl = `${this.supabaseUrl}/storage/v1/object/public/product-images/${encodeURIComponent(mappedCategory)}/${encodeURIComponent(mappedProduct)}/Principal.jpg`;

        const mainImage = document.getElementById('currentProductImage');
        if (mainImage) {
            mainImage.src = jpgUrl;
            mainImage.alt = this.product.name;
            console.log(`✅ Imagen principal restaurada: ${jpgUrl}`);
        }
    }

    updatePriceWithVariant() {
        const basePrice = this.product.price || 0;
        const modifier = this.selectedVariant.priceModifier || 0;
        const finalPrice = basePrice + modifier;

        const currentPriceElement = document.querySelector('.current-price');
        if (currentPriceElement) {
            currentPriceElement.innerHTML = this.formatPrice(finalPrice);
        }
    }

    // Quantity Control
    changeQuantity(change) {
        const quantityInput = document.getElementById('quantityInput');
        if (!quantityInput) return;

        const currentQuantity = parseInt(quantityInput.value) || 1;
        const newQuantity = Math.max(1, currentQuantity + change);
        const maxStock = this.product.stock || 999;

        this.selectedQuantity = Math.min(newQuantity, maxStock);
        quantityInput.value = this.selectedQuantity;
    }

    // Cart Management
    async addToCart() {
        if (!this.product || (this.product.stock && this.product.stock <= 0)) {
            this.showNotification('Producto no disponible', 'error');
            return;
        }

        // Use the CartManager if available
        if (window.cartManager) {
            try {
                const variantId = this.selectedVariant?.id || null;
                const quantity = this.selectedQuantity || 1;

                // Prepare product data
                const productData = {
                    id: this.product.id,
                    name: this.product.name,
                    price: this.product.price,
                    image: this.images[0],
                    slug: this.product.slug,
                    short_description: this.product.shortDescription || this.product.description
                };

                const result = await window.cartManager.addProduct(
                    this.product.id,
                    variantId,
                    quantity,
                    productData
                );

                if (result.success) {
                    this.showNotification('Producto agregado al carrito', 'success');

                    // Open cart sidebar briefly to show the addition
                    if (window.cartUI) {
                        setTimeout(() => {
                            window.cartUI.openCart();
                        }, 500);
                    }
                } else {
                    this.showNotification(result.message || 'Error agregando producto', 'error');
                }

            } catch (error) {
                console.error('❌ Error agregando al carrito:', error);
                this.showNotification('Error agregando producto al carrito', 'error');
            }
        } else {
            // Fallback to manual cart implementation
            const cartItem = {
                id: this.product.id,
                name: this.product.name,
                price: this.product.price,
                image: this.images[0],
                quantity: this.selectedQuantity,
                variant: this.selectedVariant
            };
            this.addToCartManual(cartItem);
            this.showNotification('Producto agregado al carrito', 'success');
        }
    }

    addToCartManual(item) {
        let cart = JSON.parse(localStorage.getItem('artesana_cart') || '[]');
        
        const existingItemIndex = cart.findIndex(cartItem => 
            cartItem.id === item.id && 
            JSON.stringify(cartItem.variant) === JSON.stringify(item.variant)
        );

        if (existingItemIndex >= 0) {
            cart[existingItemIndex].quantity += item.quantity;
        } else {
            cart.push(item);
        }

        localStorage.setItem('artesana_cart', JSON.stringify(cart));
    }

    // Tab Management
    switchTab(tabName) {
        // Remover active de todos los tabs
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Activar tab seleccionado
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(`${tabName}Content`);

        if (tabButton) tabButton.classList.add('active');
        if (tabContent) tabContent.classList.add('active');
    }

    // Utility Methods
    encodeImageUrl(url) {
        // Split URL into parts and encode each path segment individually
        // This handles spaces and special characters properly
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

    hideLoading() {
        const loadingElements = document.querySelectorAll('.product-loading');
        loadingElements.forEach(el => el.style.display = 'none');

        // Mostrar todas las secciones principales
        const productView = document.getElementById('productView');
        const productTabs = document.getElementById('productTabs');
        
        if (productView) {
            productView.style.display = 'block';
        }
        
        if (productTabs) {
            productTabs.style.display = 'block';
        }
    }

    normalizeText(text) {
        // Normalizar texto removiendo acentos y caracteres especiales
        return text
            .normalize('NFD') // Descomponer caracteres con acentos
            .replace(/[\u0300-\u036f]/g, '') // Remover marcas diacríticas (acentos)
            .toLowerCase()
            .trim();
    }

    sanitizeProductName(productName) {
        return productName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
            .replace(/\s+/g, '-') // Reemplazar espacios con guiones
            .replace(/-+/g, '-') // Remover múltiples guiones consecutivos
            .replace(/^-|-$/g, ''); // Remover guiones al inicio y final
    }

    getMappedCategory() {
        console.log(`🔍 Analizando estructura de categorías del producto:`, {
            'product.categories': this.product.categories,
            'product.category': this.product.category,
            'product.category_ids': this.product.category_ids,
            'todas las propiedades': Object.keys(this.product)
        });

        // Intentar obtener la primera categoría del producto
        let categoryName = null;

        if (this.product.categories && this.product.categories.length > 0) {
            categoryName = this.product.categories[0];
            console.log(`📂 Categoria desde product.categories[0]: ${categoryName}`);
        } else if (this.product.category && this.product.category.name) {
            categoryName = this.product.category.name;
            console.log(`📂 Categoria desde product.category.name: ${categoryName}`);
        } else {
            // Fallback: usar el breadcrumb de categoría si está disponible
            const breadcrumbCategory = document.getElementById('breadcrumb-category');
            if (breadcrumbCategory && breadcrumbCategory.textContent && breadcrumbCategory.textContent !== 'Categoría') {
                categoryName = breadcrumbCategory.textContent;
                console.log(`📂 Categoria desde breadcrumb: ${categoryName}`);
            } else {
                // Último fallback: buscar en la URL si viene de tienda con filtro de categoría
                const urlParams = new URLSearchParams(window.location.search);
                const categoryFromUrl = urlParams.get('categoria');
                if (categoryFromUrl) {
                    categoryName = decodeURIComponent(categoryFromUrl);
                    console.log(`📂 Categoria desde URL: ${categoryName}`);
                }
            }
        }

        console.log(`🎯 Categoria detectada: "${categoryName}"`);
        console.log(`🗺️ Mapeos disponibles:`, Object.keys(this.CATEGORY_MAPPING));

        // Usar el mapeo de categorías como en admin
        if (categoryName && this.CATEGORY_MAPPING[categoryName]) {
            console.log(`📂 Categoria mapeada: ${categoryName} → ${this.CATEGORY_MAPPING[categoryName]}`);
            return this.CATEGORY_MAPPING[categoryName];
        }

        // Fallback si no encontramos mapeo
        console.log(`⚠️ Categoria no encontrada en mapeo: "${categoryName}", usando "Accesorios"`);
        return 'Accesorios'; // Fallback para Monedero Clip
    }

    getMappedProduct() {
        const productName = this.product.name;

        if (this.COMPLETE_PRODUCT_MAPPING[productName]) {
            console.log(`📦 Producto mapeado: ${productName} → ${this.COMPLETE_PRODUCT_MAPPING[productName]}`);
            return this.COMPLETE_PRODUCT_MAPPING[productName];
        }

        // Fallback: usar el nombre original
        console.log(`⚠️ Producto no encontrado en mapeo: ${productName}, usando nombre original`);
        return productName;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `product-notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    openImageZoom() {
        // Implementar zoom de imagen (modal o overlay)
        console.log('🔍 Abrir zoom de imagen');
        // Por ahora solo un placeholder
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.productoManager = new ProductoManager();
});

// Exportar para uso global
window.ProductoManager = ProductoManager;

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
        if (shortDescElement && this.product.shortDescription) {
            shortDescElement.textContent = this.product.shortDescription;
        }
    }

    updatePriceDisplay() {
        const priceContainer = document.getElementById('productPrice');
        if (!priceContainer) return;

        const price = this.product.price || 0;
        const originalPrice = this.product.originalPrice;
        const onSale = this.product.onSale && originalPrice && originalPrice > price;

        let priceHTML = `<span class="current-price">$${price.toFixed(2)}</span>`;

        if (onSale) {
            priceHTML += `<span class="original-price">$${originalPrice.toFixed(2)}</span>`;
            const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
            priceHTML += `<span class="discount-badge">-${discount}%</span>`;
        }

        priceContainer.innerHTML = priceHTML;
    }

    updateStockDisplay() {
        const stockElement = document.getElementById('productStock');
        if (!stockElement) return;

        const stock = this.product.stock || 0;
        const inStock = stock > 0;

        stockElement.innerHTML = `
            <div class="stock-indicator ${inStock ? 'in-stock' : 'out-of-stock'}">
                <i class="fas ${inStock ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                <span>${inStock ? `En stock (${stock} disponibles)` : 'Agotado'}</span>
            </div>
        `;

        // Actualizar botón de agregar al carrito
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.disabled = !inStock;
            addToCartBtn.textContent = inStock ? 'Agregar al Carrito' : 'Agotado';
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
        if (!this.product.variants || this.product.variants.length === 0) {
            return;
        }

        const variantsContainer = document.getElementById('productVariants');
        if (!variantsContainer) return;

        // Agrupar variantes por tipo (color, tamaño, etc.)
        const variantGroups = this.groupVariantsByType();

        let variantsHTML = '';
        Object.keys(variantGroups).forEach(type => {
            variantsHTML += `
                <div class="variant-group">
                    <h4>${this.capitalizeFirst(type)}</h4>
                    <div class="variant-options" data-variant-type="${type}">
                        ${variantGroups[type].map(variant => `
                            <div class="variant-option ${variant.available ? '' : 'unavailable'}" 
                                 data-variant-id="${variant.id}"
                                 onclick="productoManager.selectVariant('${variant.id}', '${type}')">
                                ${variant.name}
                                ${!variant.available ? '<span class="unavailable-text">No disponible</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        variantsContainer.innerHTML = variantsHTML;
    }

    groupVariantsByType() {
        const groups = {};
        
        this.product.variants.forEach(variant => {
            const type = variant.type || 'opciones';
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(variant);
        });

        return groups;
    }

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
                        <span class="price">$${price.toFixed(2)}</span>
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

        // Image zoom
        document.addEventListener('click', (e) => {
            if (e.target.matches('#currentProductImage')) {
                this.openImageZoom();
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
        // Remover selección previa del mismo tipo
        document.querySelectorAll(`[data-variant-type="${type}"] .variant-option`).forEach(opt => {
            opt.classList.remove('selected');
        });

        // Seleccionar nueva variante
        const variantElement = document.querySelector(`[data-variant-id="${variantId}"]`);
        if (variantElement && !variantElement.classList.contains('unavailable')) {
            variantElement.classList.add('selected');
            
            // Actualizar variante seleccionada
            this.selectedVariant = this.product.variants.find(v => v.id === variantId);
            
            // Actualizar precio si la variante tiene precio diferente
            if (this.selectedVariant && this.selectedVariant.priceModifier) {
                this.updatePriceWithVariant();
            }
        }
    }

    updatePriceWithVariant() {
        const basePrice = this.product.price || 0;
        const modifier = this.selectedVariant.priceModifier || 0;
        const finalPrice = basePrice + modifier;

        const currentPriceElement = document.querySelector('.current-price');
        if (currentPriceElement) {
            currentPriceElement.textContent = `$${finalPrice.toFixed(2)}`;
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
    addToCart() {
        if (!this.product || (this.product.stock && this.product.stock <= 0)) {
            this.showNotification('Producto no disponible', 'error');
            return;
        }

        const cartItem = {
            id: this.product.id,
            name: this.product.name,
            price: this.product.price,
            image: this.images[0],
            quantity: this.selectedQuantity,
            variant: this.selectedVariant
        };

        // Usar la funcionalidad del API client si está disponible
        if (window.artesanaAPI && window.artesanaAPI.addToCart) {
            window.artesanaAPI.addToCart(this.product.id, this.selectedQuantity);
        } else {
            // Implementación manual del carrito
            this.addToCartManual(cartItem);
        }

        this.showNotification('Producto agregado al carrito', 'success');
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

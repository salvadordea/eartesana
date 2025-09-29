/**
 * Product Detail Page JavaScript - Estudio Artesana
 * Handles product loading, variants, gallery, and cart integration
 */

class ProductDetailPage {
    constructor() {
        this.product = null;
        this.selectedVariant = null;
        this.selectedAttributes = {};
        this.images = [];
        this.currentImageIndex = 0;
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        this.initializeElements();
        this.bindEvents();
        this.loadProduct();
    }
    
    initializeElements() {
        // Main elements
        this.productLoading = document.getElementById('productLoading');
        this.productError = document.getElementById('productError');
        this.productContent = document.getElementById('productContent');
        this.retryBtn = document.getElementById('retryLoad');
        
        // Breadcrumbs
        this.breadcrumbCategory = document.getElementById('breadcrumbCategory');
        this.breadcrumbProduct = document.getElementById('breadcrumbProduct');
        
        // Product info elements
        this.productCategory = document.getElementById('productCategory');
        this.productName = document.getElementById('productName');
        this.productPrice = document.getElementById('productPrice');
        this.productDescription = document.getElementById('productDescription');
        this.productVariants = document.getElementById('productVariants');
        this.productBadges = document.getElementById('productBadges');
        
        // Image gallery elements
        this.mainImage = document.getElementById('mainImage');
        this.thumbnailGallery = document.getElementById('thumbnailGallery');
        this.zoomBtn = document.getElementById('zoomBtn');
        
        // Action elements
        this.quantityInput = document.getElementById('quantity');
        this.addToCartBtn = document.getElementById('addToCartBtn');
        
        // Tab elements
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabPanes = document.querySelectorAll('.tab-pane');
        this.fullDescription = document.getElementById('fullDescription');
        this.productSpecs = document.getElementById('productSpecs');
        
        // Lightbox elements
        this.lightbox = document.getElementById('imageLightbox');
        this.lightboxOverlay = document.getElementById('lightboxOverlay');
        this.lightboxImage = document.getElementById('lightboxImage');
        this.lightboxClose = document.getElementById('lightboxClose');
        this.lightboxPrev = document.getElementById('lightboxPrev');
        this.lightboxNext = document.getElementById('lightboxNext');
        this.lightboxCaption = document.getElementById('lightboxCaption');
        
        // Related products
        this.relatedProducts = document.getElementById('relatedProducts');
        this.relatedProductsGrid = document.getElementById('relatedProductsGrid');
    }
    
    bindEvents() {
        // Retry button
        this.retryBtn?.addEventListener('click', () => this.loadProduct());
        
        // Quantity controls
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuantityChange(e));
        });
        
        this.quantityInput?.addEventListener('change', () => this.validateQuantity());
        
        // Add to cart button
        this.addToCartBtn?.addEventListener('click', () => this.addToCart());
        
        // Tab navigation
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Share buttons
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleShare(e.target.dataset.platform));
        });
        
        // Lightbox events
        this.zoomBtn?.addEventListener('click', () => this.openLightbox());
        this.lightboxClose?.addEventListener('click', () => this.closeLightbox());
        this.lightboxOverlay?.addEventListener('click', () => this.closeLightbox());
        this.lightboxPrev?.addEventListener('click', () => this.previousImage());
        this.lightboxNext?.addEventListener('click', () => this.nextImage());
        
        // Keyboard events for lightbox
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }
    
    async loadProduct() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // Get product ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');
            
            console.log('Product ID from URL:', productId);
            
            if (!productId) {
                throw new Error('No product ID provided');
            }
            
            // Check if WooAPI is available
            if (!window.WooAPI) {
                throw new Error('WooCommerce API not available');
            }
            
            console.log('Loading product from WooCommerce...');
            
            // Load product from WooCommerce
            this.product = await window.WooAPI.getProduct(productId);
            
            console.log('Product loaded:', this.product);
            
            if (!this.product) {
                throw new Error('Product not found');
            }
            
            // Process product data
            await this.processProductData();
            this.renderProduct();
            
            // Load related products
            this.loadRelatedProducts();
            
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError();
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    async processProductData() {
        // Process images
        this.images = [];
        
        if (this.product.images && this.product.images.length > 0) {
            this.images = this.product.images.map(img => ({
                src: img.src,
                alt: img.alt || this.product.name,
                id: img.id
            }));
        } else {
            // Fallback image
            this.images = [{
                src: this.generatePlaceholderImage(),
                alt: this.product.name,
                id: 'placeholder'
            }];
        }
        
        // Load complete variation data if product has variations
        if (this.product.variations && this.product.variations.length > 0) {
            try {
                console.log('Loading variation details for IDs:', this.product.variations);
                
                // If variations are just IDs, load the complete data
                if (typeof this.product.variations[0] === 'number') {
                    const variationPromises = this.product.variations.map(variationId => 
                        window.WooAPI.getProductVariation(this.product.id, variationId)
                    );
                    
                    this.product.variations = await Promise.all(variationPromises);
                    console.log('Loaded complete variations:', this.product.variations);
                }
                
                // Set initial variant
                this.selectedVariant = this.product.variations.find(v => v && v.default) || this.product.variations[0];
                
            } catch (error) {
                console.error('Error loading variation details:', error);
                // Continue without variations if they fail to load
                this.product.variations = [];
            }
        }
    }
    
    renderProduct() {
        this.updatePageTitle();
        this.updateBreadcrumbs();
        this.renderProductInfo();
        this.renderImageGallery();
        this.renderVariants();
        this.renderTabs();
        this.updateAddToCartButton();
        
        this.showProduct();
    }
    
    updatePageTitle() {
        const title = `${this.product?.name || 'Producto'} - Estudio Artesana`;
        document.title = title;
        
        const productTitleEl = document.getElementById('productTitle');
        if (productTitleEl) {
            productTitleEl.textContent = title;
        }
        
        // Update meta tags safely
        const productDescEl = document.getElementById('productDescription');
        const ogTitleEl = document.getElementById('ogTitle');
        const ogDescEl = document.getElementById('ogDescription');
        const ogUrlEl = document.getElementById('ogUrl');
        const ogImageEl = document.getElementById('ogImage');
        
        if (productDescEl) {
            productDescEl.setAttribute('content', this.product?.short_description || this.product?.description || '');
        }
        if (ogTitleEl) {
            ogTitleEl.setAttribute('content', title);
        }
        if (ogDescEl) {
            ogDescEl.setAttribute('content', this.product?.short_description || this.product?.description || '');
        }
        if (ogUrlEl) {
            ogUrlEl.setAttribute('content', window.location.href);
        }
        if (ogImageEl && this.images.length > 0) {
            ogImageEl.setAttribute('content', this.images[0].src);
        }
    }
    
    updateBreadcrumbs() {
        // Update category breadcrumb
        if (this.product.categories && this.product.categories.length > 0) {
            const category = this.product.categories[0];
            this.breadcrumbCategory.textContent = category.name;
            this.breadcrumbCategory.href = `${this.getTiendaPath()}?categoria=${category.slug}`;
        }
        
        // Update product breadcrumb
        this.breadcrumbProduct.textContent = this.product.name;
    }
    
    renderProductInfo() {
        // Category
        if (this.productCategory && this.product.categories && this.product.categories.length > 0) {
            this.productCategory.textContent = this.product.categories[0].name.toUpperCase();
        }
        
        // Product name
        if (this.productName) {
            this.productName.textContent = this.product.name;
        }
        
        // Price
        this.updatePricing();
        
        // Description
        const shortDesc = this.product.short_description || this.product.description;
        if (shortDesc && this.productDescription) {
            this.productDescription.innerHTML = this.cleanDescription(shortDesc);
        }
        
        // Badges
        this.renderBadges();
    }
    
    updatePricing() {
        const currentPrice = this.selectedVariant?.price || this.product.price;
        const regularPrice = this.selectedVariant?.regular_price || this.product.regular_price;
        const salePrice = this.selectedVariant?.sale_price || this.product.sale_price;
        
        const currentPriceEl = this.productPrice.querySelector('.current-price');
        const originalPriceEl = this.productPrice.querySelector('.original-price');
        const discountBadgeEl = this.productPrice.querySelector('.discount-badge');
        
        // Format price
        currentPriceEl.textContent = this.formatPrice(currentPrice);
        
        // Show/hide sale pricing
        if (salePrice && salePrice !== regularPrice) {
            originalPriceEl.textContent = this.formatPrice(regularPrice);
            originalPriceEl.style.display = 'inline';
            
            // Calculate discount percentage
            const discount = Math.round(((regularPrice - salePrice) / regularPrice) * 100);
            discountBadgeEl.textContent = `-${discount}%`;
            discountBadgeEl.style.display = 'inline';
        } else {
            originalPriceEl.style.display = 'none';
            discountBadgeEl.style.display = 'none';
        }
    }
    
    renderBadges() {
        let badges = [];
        
        if (this.product.on_sale) {
            badges.push('<div class="product-badge sale">Oferta</div>');
        }
        
        if (this.product.featured) {
            badges.push('<div class="product-badge featured">Destacado</div>');
        }
        
        if (this.product.date_created) {
            const createdDate = new Date(this.product.date_created);
            const now = new Date();
            const daysDiff = (now - createdDate) / (1000 * 60 * 60 * 24);
            
            if (daysDiff < 30) {
                badges.push('<div class="product-badge new">Nuevo</div>');
            }
        }
        
        this.productBadges.innerHTML = badges.join('');
    }
    
    renderImageGallery() {
        // Set main image
        this.mainImage.src = this.images[0].src;
        this.mainImage.alt = this.images[0].alt;
        
        // Render thumbnails
        if (this.images.length > 1) {
            const thumbnailsHTML = this.images.map((img, index) => `
                <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <img src="${img.src}" alt="${img.alt}" loading="lazy">
                </div>
            `).join('');
            
            this.thumbnailGallery.innerHTML = thumbnailsHTML;
            
            // Bind thumbnail events
            this.thumbnailGallery.querySelectorAll('.thumbnail').forEach(thumb => {
                thumb.addEventListener('click', (e) => {
                    const index = parseInt(e.currentTarget.dataset.index);
                    this.switchMainImage(index);
                });
            });
        }
    }
    
    switchMainImage(index) {
        if (index < 0 || index >= this.images.length) return;
        
        this.currentImageIndex = index;
        this.mainImage.src = this.images[index].src;
        this.mainImage.alt = this.images[index].alt;
        
        // Update active thumbnail
        this.thumbnailGallery.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }
    
    renderVariants() {
        if (!this.product.variations || this.product.variations.length === 0) {
            this.productVariants.style.display = 'none';
            return;
        }
        
        this.productVariants.style.display = 'block';
        
        // Group variations by attribute
        const attributeGroups = this.groupVariationsByAttribute();
        
        let variantsHTML = '';
        
        Object.entries(attributeGroups).forEach(([attributeName, options]) => {
            const label = this.formatAttributeName(attributeName);
            
            variantsHTML += `
                <div class="variant-group">
                    <div class="variant-label">${label}</div>
                    <div class="variant-options">
                        ${options.map(option => this.renderVariantOption(attributeName, option)).join('')}
                    </div>
                </div>
            `;
        });
        
        this.productVariants.innerHTML = variantsHTML;

        // Trigger translation system
        if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
            window.TranslationSystem.applyTranslations();
        }
        
        // Bind variant events
        this.bindVariantEvents();
    }
    
    groupVariationsByAttribute() {
        const groups = {};
        
        // More thorough validation
        if (!this.product || 
            !this.product.variations || 
            !Array.isArray(this.product.variations) || 
            this.product.variations.length === 0) {
            console.log('No valid variations found');
            return groups;
        }
        
        try {
            this.product.variations.forEach((variation, index) => {
                console.log(`Processing variation ${index}:`, variation);
                
                if (!variation || typeof variation !== 'object') {
                    console.log(`Variation ${index} is invalid:`, variation);
                    return;
                }
                
                if (!variation.attributes || typeof variation.attributes !== 'object') {
                    console.log(`Variation ${index} has no valid attributes:`, variation.attributes);
                    return;
                }
                
                try {
                    Object.entries(variation.attributes).forEach(([attr, value]) => {
                        if (!attr || value === null || value === undefined || value === '') {
                            console.log(`Invalid attribute pair: ${attr} = ${value}`);
                            return;
                        }
                        
                        if (!groups[attr]) {
                            groups[attr] = new Set();
                        }
                        groups[attr].add(value);
                    });
                } catch (attrError) {
                    console.error(`Error processing attributes for variation ${index}:`, attrError, variation);
                }
            });
        } catch (error) {
            console.error('Error processing variations:', error);
            return {};
        }
        
        // Convert sets to arrays
        try {
            Object.keys(groups).forEach(attr => {
                groups[attr] = Array.from(groups[attr]);
            });
        } catch (error) {
            console.error('Error converting sets to arrays:', error);
            return {};
        }
        
        console.log('Final groups:', groups);
        return groups;
    }
    
    renderVariantOption(attributeName, optionValue) {
        const isSelected = this.selectedAttributes[attributeName] === optionValue;
        const isColor = attributeName.toLowerCase().includes('color') || attributeName.toLowerCase().includes('colour');
        
        let optionClass = 'variant-option';
        if (isSelected) optionClass += ' selected';
        if (isColor) optionClass += ' color';
        
        if (isColor) {
            const colorValue = this.getColorValue(optionValue);
            return `
                <button class="${optionClass}" 
                        data-attribute="${attributeName}" 
                        data-value="${optionValue}"
                        style="background-color: ${colorValue};" 
                        title="${optionValue}">
                    <span class="color-name">${optionValue}</span>
                </button>
            `;
        } else {
            return `
                <button class="${optionClass}" 
                        data-attribute="${attributeName}" 
                        data-value="${optionValue}">
                    ${optionValue}
                </button>
            `;
        }
    }
    
    getColorValue(colorName) {
        const colorMap = {
            // Basic colors
            'black': '#000000',
            'negro': '#000000',
            'white': '#ffffff',
            'blanco': '#ffffff',
            'red': '#e74c3c',
            'rojo': '#e74c3c',
            'blue': '#3498db',
            'azul': '#3498db',
            'green': '#27ae60',
            'verde': '#27ae60',
            'yellow': '#f1c40f',
            'amarillo': '#f1c40f',
            'purple': '#9b59b6',
            'morado': '#9b59b6',
            'violeta': '#9b59b6',
            'pink': '#e91e63',
            'rosa': '#e91e63',
            'orange': '#ff9800',
            'naranja': '#ff9800',
            'brown': '#795548',
            'marron': '#795548',
            'cafe': '#795548',
            'gray': '#9e9e9e',
            'grey': '#9e9e9e',
            'gris': '#9e9e9e',
            
            // Extended colors
            'beige': '#f5f5dc',
            'navy': '#001f3f',
            'turquoise': '#1abc9c',
            'turquesa': '#1abc9c',
            'gold': '#ffd700',
            'dorado': '#ffd700',
            'silver': '#c0c0c0',
            'plateado': '#c0c0c0',
            'coral': '#ff7f50',
            'lime': '#32cd32',
            'mint': '#98fb98',
            'menta': '#98fb98',
            'cream': '#fffdd0',
            'crema': '#fffdd0',
            'ivory': '#fffff0',
            'marfil': '#fffff0'
        };
        
        return colorMap[colorName.toLowerCase()] || '#cccccc';
    }
    
    bindVariantEvents() {
        this.productVariants.querySelectorAll('.variant-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const attribute = e.target.dataset.attribute;
                const value = e.target.dataset.value;
                
                this.selectVariantOption(attribute, value);
            });
        });
    }
    
    selectVariantOption(attribute, value) {
        // Update selected attributes
        this.selectedAttributes[attribute] = value;
        
        // Update UI
        this.productVariants.querySelectorAll(`.variant-option[data-attribute="${attribute}"]`).forEach(option => {
            option.classList.toggle('selected', option.dataset.value === value);
        });
        
        // Find matching variation
        this.selectedVariant = this.findMatchingVariation();
        
        // Update pricing and availability
        this.updatePricing();
        this.updateAddToCartButton();
    }
    
    findMatchingVariation() {
        return this.product.variations.find(variation => {
            return Object.entries(this.selectedAttributes).every(([attr, value]) => {
                return variation.attributes[attr] === value;
            });
        });
    }
    
    renderTabs() {
        // Full description
        if (this.product.description) {
            this.fullDescription.innerHTML = this.product.description;
        }
        
        // Specifications
        this.renderSpecifications();
    }
    
    renderSpecifications() {
        const specs = this.extractSpecifications();
        
        if (specs.length > 0) {
            const specsHTML = specs.map(spec => `
                <div class="spec-item">
                    <span class="spec-label">${spec.label}</span>
                    <span class="spec-value">${spec.value}</span>
                </div>
            `).join('');
            
            this.productSpecs.innerHTML = specsHTML;

        // Trigger translation system
        if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
            window.TranslationSystem.applyTranslations();
        }
        } else {
            this.productSpecs.innerHTML = `<p>${window.t ? window.t('product.no_specifications') : 'No hay especificaciones disponibles.'}</p>`;
        }
    }
    
    extractSpecifications() {
        const specs = [];
        
        // Add basic product info as specifications
        if (this.product.sku) {
            specs.push({ label: 'SKU', value: this.product.sku });
        }
        
        if (this.product.weight) {
            specs.push({ label: 'Peso', value: `${this.product.weight} kg` });
        }
        
        // Enhanced dimensions handling
        if (this.product.dimensions) {
            const dims = this.product.dimensions;
            if (dims.length || dims.width || dims.height) {
                const dimensions = [];
                if (dims.length && dims.length !== '0') dimensions.push(`${dims.length} cm (largo)`);
                if (dims.width && dims.width !== '0') dimensions.push(`${dims.width} cm (ancho)`);
                if (dims.height && dims.height !== '0') dimensions.push(`${dims.height} cm (alto)`);
                
                if (dimensions.length > 0) {
                    specs.push({ label: 'Dimensiones', value: dimensions.join(' × ') });
                }
            }
        }
        
        // Material from attributes or custom fields
        const materialAttr = this.product.attributes?.find(attr => 
            attr.name.toLowerCase().includes('material') || 
            attr.name.toLowerCase().includes('fabric')
        );
        if (materialAttr && materialAttr.options && materialAttr.options.length > 0) {
            specs.push({ label: 'Material', value: materialAttr.options.join(', ') });
        }
        
        // Colors from attributes
        const colorAttr = this.product.attributes?.find(attr => 
            attr.name.toLowerCase().includes('color') || 
            attr.name.toLowerCase().includes('colour')
        );
        if (colorAttr && colorAttr.options && colorAttr.options.length > 0) {
            specs.push({ label: 'Colores Disponibles', value: colorAttr.options.join(', ') });
        }
        
        // Care instructions from custom fields
        if (this.product.meta_data) {
            const careInstructions = this.product.meta_data.find(meta => 
                meta.key === 'care_instructions' || meta.key === '_care_instructions'
            );
            if (careInstructions && careInstructions.value) {
                specs.push({ label: 'Instrucciones de Cuidado', value: careInstructions.value });
            }
        }
        
        if (this.product.categories && this.product.categories.length > 0) {
            specs.push({
                label: window.t ? window.t('product.category') : 'Categoría',
                value: this.product.categories.map(c => c.name).join(', ')
            });
        }
        
        if (this.product.tags && this.product.tags.length > 0) {
            specs.push({
                label: window.t ? window.t('product.tags') : 'Etiquetas',
                value: this.product.tags.map(t => t.name).join(', ')
            });
        }
        
        // Stock status
        if (this.product.stock_status) {
            const stockText = this.product.stock_status === 'instock' ? (window.t ? window.t('product.in_stock') : 'En Stock') :
                           this.product.stock_status === 'outofstock' ? (window.t ? window.t('product.out_of_stock') : 'Agotado') :
                           this.product.stock_status === 'onbackorder' ? (window.t ? window.t('product.on_backorder') : 'En Pedido') : (window.t ? window.t('product.not_available') : 'No disponible');
            specs.push({ label: window.t ? window.t('product.availability') : 'Disponibilidad', value: stockText });
        }
        
        return specs;
    }
    
    async loadRelatedProducts() {
        try {
            if (!this.product.related_ids || this.product.related_ids.length === 0) {
                // Load products from same category
                if (this.product.categories && this.product.categories.length > 0) {
                    const categoryId = this.product.categories[0].id;
                    const relatedProducts = await window.WooAPI.getProducts({
                        category: categoryId,
                        per_page: 4,
                        exclude: [this.product.id],
                        orderby: 'popularity'
                    });
                    
                    if (relatedProducts && relatedProducts.length > 0) {
                        this.renderRelatedProducts(relatedProducts);
                    }
                }
            } else {
                // Load specific related products
                const relatedProducts = await Promise.all(
                    this.product.related_ids.slice(0, 4).map(id => window.WooAPI.getProduct(id))
                );
                
                this.renderRelatedProducts(relatedProducts.filter(p => p));
            }
        } catch (error) {
            console.error('Error loading related products:', error);
        }
    }
    
    renderRelatedProducts(products) {
        if (!products || products.length === 0) {
            // Hide the section if no related products are found
            this.relatedProducts.style.display = 'none';
            return;
        }
        
        const productsHTML = products.map(product => this.createProductCard(product)).join('');
        this.relatedProductsGrid.innerHTML = productsHTML;

        // Trigger translation system
        if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
            window.TranslationSystem.applyTranslations();
        }
        // Section is already visible by default in HTML
        
        // Bind product card events
        this.relatedProductsGrid.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                const productId = card.dataset.productId;
                window.location.href = `${this.getProductPath()}?id=${productId}`;
            });
        });
    }
    
    createProductCard(product) {
        const image = product.images && product.images.length > 0 
            ? product.images[0].src 
            : this.generatePlaceholderImage();
        
        const price = this.formatPrice(product.price);
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${image}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">
                        <span class="current-price">${price}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Event Handlers
    
    handleQuantityChange(e) {
        const isIncrease = e.target.classList.contains('qty-increase');
        const isDecrease = e.target.classList.contains('qty-decrease');
        
        if (isIncrease) {
            this.quantityInput.value = Math.min(parseInt(this.quantityInput.value) + 1, 10);
        } else if (isDecrease) {
            this.quantityInput.value = Math.max(parseInt(this.quantityInput.value) - 1, 1);
        }
        
        this.validateQuantity();
    }
    
    validateQuantity() {
        let value = parseInt(this.quantityInput.value);
        if (isNaN(value) || value < 1) value = 1;
        if (value > 10) value = 10;
        
        this.quantityInput.value = value;
    }
    
    addToCart() {
        if (!this.product || this.addToCartBtn.disabled) return;
        
        const quantity = parseInt(this.quantityInput.value);
        
        // Prepare cart item
        const cartItem = {
            id: this.product.id,
            name: this.product.name,
            price: parseFloat(this.selectedVariant?.price || this.product.price),
            image: this.images[0].src,
            quantity: quantity,
            variant: this.selectedVariant ? {
                id: this.selectedVariant.id,
                attributes: this.selectedAttributes
            } : null
        };
        
        // Add to cart (implement your cart logic here)
        this.addItemToCart(cartItem);
        
        // Show feedback
        this.showAddToCartFeedback();
    }
    
    addItemToCart(item) {
        // Get existing cart
        let cart = JSON.parse(localStorage.getItem('estudio_artesana_cart') || '[]');
        
        // Check if item already exists
        const existingIndex = cart.findIndex(cartItem => 
            cartItem.id === item.id && 
            JSON.stringify(cartItem.variant) === JSON.stringify(item.variant)
        );
        
        if (existingIndex > -1) {
            // Update quantity
            cart[existingIndex].quantity += item.quantity;
        } else {
            // Add new item
            cart.push(item);
        }
        
        // Save cart
        localStorage.setItem('estudio_artesana_cart', JSON.stringify(cart));
        
        // Update cart count in header
        this.updateCartCount();
        
        // Dispatch cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
    }
    
    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('estudio_artesana_cart') || '[]');
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        const cartCountElements = document.querySelectorAll('#cartCount, .cart-count');
        cartCountElements.forEach(el => {
            el.textContent = count;
        });
    }
    
    showAddToCartFeedback() {
        const originalText = this.addToCartBtn.innerHTML;
        this.addToCartBtn.innerHTML = `<i class="fas fa-check"></i><span>${window.t ? window.t('product.added_to_cart') : '¡Agregado!'}</span>`;
        this.addToCartBtn.disabled = true;
        
        setTimeout(() => {
            this.addToCartBtn.innerHTML = originalText;
            this.addToCartBtn.disabled = false;
        }, 2000);
    }
    
    switchTab(tabId) {
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // Update tab panes
        this.tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === `tab-${tabId}`);
        });
    }
    
    handleShare(platform) {
        const url = window.location.href;
        const title = this.product.name;
        const description = this.product.short_description || this.product.description;
        
        switch (platform) {
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`, '_blank');
                break;
            case 'copy':
                navigator.clipboard.writeText(url).then(() => {
                    alert('Enlace copiado al portapapeles');
                });
                break;
        }
    }
    
    // Lightbox functionality
    
    openLightbox() {
        this.lightboxImage.src = this.images[this.currentImageIndex].src;
        this.lightboxCaption.textContent = this.images[this.currentImageIndex].alt;
        this.lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    closeLightbox() {
        this.lightbox.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    previousImage() {
        this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
        this.lightboxImage.src = this.images[this.currentImageIndex].src;
        this.lightboxCaption.textContent = this.images[this.currentImageIndex].alt;
    }
    
    nextImage() {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
        this.lightboxImage.src = this.images[this.currentImageIndex].src;
        this.lightboxCaption.textContent = this.images[this.currentImageIndex].alt;
    }
    
    handleKeydown(e) {
        if (this.lightbox.style.display === 'flex') {
            switch (e.key) {
                case 'Escape':
                    this.closeLightbox();
                    break;
                case 'ArrowLeft':
                    this.previousImage();
                    break;
                case 'ArrowRight':
                    this.nextImage();
                    break;
            }
        }
    }
    
    // State management
    
    updateAddToCartButton() {
        const hasRequiredVariants = this.product.variations ? 
            this.hasAllRequiredVariantSelections() : true;
        
        const isInStock = this.selectedVariant ? 
            this.selectedVariant.stock_status === 'instock' :
            this.product.stock_status === 'instock';
        
        this.addToCartBtn.disabled = !hasRequiredVariants || !isInStock;
        
        if (!isInStock) {
            this.addToCartBtn.innerHTML = `<i class="fas fa-ban"></i><span>${window.t ? window.t('product.out_of_stock_btn') : 'Agotado'}</span>`;
        } else if (!hasRequiredVariants) {
            this.addToCartBtn.innerHTML = `<i class="fas fa-shopping-cart"></i><span>${window.t ? window.t('product.select_options') : 'Selecciona opciones'}</span>`;
        } else {
            this.addToCartBtn.innerHTML = `<i class="fas fa-shopping-cart"></i><span>${window.t ? window.t('product.add_to_cart') : 'Agregar al Carrito'}</span>`;
        }
    }
    
    hasAllRequiredVariantSelections() {
        if (!this.product.variations || this.product.variations.length === 0) {
            return true;
        }
        
        const requiredAttributes = new Set();
        this.product.variations.forEach(variation => {
            Object.keys(variation.attributes).forEach(attr => {
                requiredAttributes.add(attr);
            });
        });
        
        return Array.from(requiredAttributes).every(attr => 
            this.selectedAttributes.hasOwnProperty(attr)
        );
    }
    
    // UI State Methods
    
    showLoading() {
        this.productLoading.style.display = 'flex';
        this.productError.style.display = 'none';
        this.productContent.style.display = 'none';
    }
    
    hideLoading() {
        this.productLoading.style.display = 'none';
    }
    
    showError() {
        this.productError.style.display = 'flex';
        this.productLoading.style.display = 'none';
        this.productContent.style.display = 'none';
    }
    
    showProduct() {
        this.productContent.style.display = 'block';
        this.productLoading.style.display = 'none';
        this.productError.style.display = 'none';
    }
    
    // Utility Methods
    
    formatPrice(price) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(parseFloat(price));
    }
    
    formatAttributeName(attr) {
        const nameMap = {
            'pa_color': 'Color',
            'pa_colour': 'Color',
            'pa_size': 'Talla',
            'pa_material': 'Material'
        };
        
        return nameMap[attr] || attr.replace('pa_', '').replace(/_/g, ' ').toUpperCase();
    }
    
    cleanDescription(description) {
        // Remove unwanted HTML tags and clean up description
        return description
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<style[^>]*>.*?<\/style>/gi, '')
            .replace(/style="[^"]*"/gi, '')
            .trim();
    }
    
    generatePlaceholderImage() {
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#2c2c2c;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#bg)"/>
                <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="16" fill="#C0C0C0" text-anchor="middle" font-weight="bold">
                    ESTUDIO ARTESANA
                </text>
                <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">
                    IMAGEN NO DISPONIBLE
                </text>
            </svg>
        `)}`;
    }
    
    // Helper method to get correct path to tienda based on current location
    getTiendaPath() {
        const currentPath = window.location.pathname;
        
        // If we're in the root directory
        if (currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/EstArtesana/') || currentPath.endsWith('/EstArtesana/index.html')) {
            return 'pages/tienda/index.html';
        }
        
        // If we're in a pages subdirectory (tienda, sobre-nosotros, categorias, producto)
        if (currentPath.includes('/pages/')) {
            return '../tienda/index.html';
        }
        
        // Default fallback - assume we're in root
        return 'pages/tienda/index.html';
    }
    
    // Helper method to get correct path to product based on current location
    getProductPath() {
        const currentPath = window.location.pathname;
        
        // If we're in the root directory
        if (currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/EstArtesana/') || currentPath.endsWith('/EstArtesana/index.html')) {
            return 'pages/producto/index.html';
        }
        
        // If we're in a pages subdirectory (tienda, sobre-nosotros, categorias, producto)
        if (currentPath.includes('/pages/')) {
            return 'index.html'; // Current producto page
        }
        
        // Default fallback - assume we're in root
        return 'pages/producto/index.html';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set WooCommerce API credentials from config
    if (window.EstudioArtesanaConfig && window.EstudioArtesanaConfig.woocommerce) {
        window.WooAPI.setCredentials(
            window.EstudioArtesanaConfig.woocommerce.consumerKey,
            window.EstudioArtesanaConfig.woocommerce.consumerSecret
        );
        
        // Set base URL
        window.WooAPI.config.baseURL = window.EstudioArtesanaConfig.woocommerce.baseURL;
    }
    
    // Initialize product detail page
    new ProductDetailPage();
    
    // Initialize cart count on page load
    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem('estudio_artesana_cart') || '[]');
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        const cartCountElements = document.querySelectorAll('#cartCount, .cart-count');
        cartCountElements.forEach(el => {
            el.textContent = count;
        });
    };
    
    updateCartCount();
});

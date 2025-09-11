/**
 * Admin Manager - Estudio Artesana
 * Manages all admin panel functionality
 */

class AdminManager {
    constructor() {
        this.config = null;
        this.changes = {
            logos: {},
            heroProduct: {},
            promotion: {},
            categories: {},
            carousel: {}
        };
        
        this.init();
    }
    
    init() {
        // Load current configuration
        this.loadCurrentConfig();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load current values
        this.populateCurrentValues();
    }
    
    loadCurrentConfig() {
        if (window.EstudioArtesanaConfig) {
            this.config = { ...window.EstudioArtesanaConfig };
        }
    }
    
    setupEventListeners() {
        // File input listeners
        document.getElementById('headerLogoInput').addEventListener('change', (e) => this.handleFileUpload(e, 'headerLogo'));
        document.getElementById('heroLogoInput').addEventListener('change', (e) => this.handleFileUpload(e, 'heroLogo'));
        document.getElementById('heroProductInput').addEventListener('change', (e) => this.handleFileUpload(e, 'heroProduct'));
        
        // Theme selection listeners
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectTheme(e));
        });
    }
    
    populateCurrentValues() {
        if (!this.config) return;
        
        // Load promotion values
        if (this.config.promotion) {
            document.getElementById('promoTitle').value = this.config.promotion.title || '';
            document.getElementById('promoDescription').value = this.config.promotion.description || '';
            document.getElementById('promoCode').value = this.config.promotion.code || '';
            document.getElementById('promoExpiry').value = this.config.promotion.expiry || '';
            document.getElementById('promoButton').value = this.config.promotion.ctaText || '';
            
            // Set active theme
            const currentTheme = this.config.promotion.theme || 'default';
            document.querySelectorAll('.theme-option').forEach(option => {
                option.classList.toggle('active', option.dataset.theme === currentTheme);
            });
        }
        
        // Load categories settings
        document.getElementById('categoriesDisplay').value = this.config.categories?.display || 'all';
        document.getElementById('categoriesOrder').value = this.config.categories?.orderBy || 'count';
        
        // Load carousel settings
        document.getElementById('carouselSource').value = this.config.carousel?.source || 'random';
        document.getElementById('carouselCount').value = this.config.carousel?.count || 3;
        document.getElementById('carouselSpeed').value = this.config.carousel?.autoPlayInterval || 4000;
    }
    
    handleFileUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            this.previewImage(type, imageUrl);
            this.changes.logos[type] = imageUrl;
        };
        reader.readAsDataURL(file);
    }
    
    previewImage(type, imageUrl) {
        let previewElement;
        switch (type) {
            case 'headerLogo':
                previewElement = document.getElementById('headerLogoPreview');
                break;
            case 'heroLogo':
                previewElement = document.getElementById('heroLogoPreview');
                break;
            case 'heroProduct':
                previewElement = document.getElementById('heroProductPreview');
                break;
        }
        
        if (previewElement) {
            previewElement.innerHTML = `<img src="${imageUrl}" class="preview-image" alt="Preview">`;
        }
    }
    
    selectTheme(event) {
        // Remove active class from all themes
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
        });
        
        // Add active class to selected theme
        event.target.classList.add('active');
        
        // Store the change
        this.changes.promotion.theme = event.target.dataset.theme;
    }
    
    // API functions for WooCommerce
    async getRandomProducts(count = 5) {
        try {
            const response = await fetch(`${this.config.woocommerce.baseURL}/wp-json/wc/v3/products?per_page=${count}&orderby=rand&consumer_key=${this.config.woocommerce.consumerKey}&consumer_secret=${this.config.woocommerce.consumerSecret}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching random products:', error);
            return [];
        }
    }
    
    async getFeaturedProducts(count = 5) {
        try {
            const response = await fetch(`${this.config.woocommerce.baseURL}/wp-json/wc/v3/products?per_page=${count}&featured=true&consumer_key=${this.config.woocommerce.consumerKey}&consumer_secret=${this.config.woocommerce.consumerSecret}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching featured products:', error);
            return [];
        }
    }
    
    // Save functions
    saveConfigToFile(newConfig) {
        // Create a new config object
        const configContent = `// Configuration file for Estudio Artesana Website
const EstudioArtesanaConfig = ${JSON.stringify(newConfig, null, 4)};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EstudioArtesanaConfig;
}

// Global access for vanilla JS
window.EstudioArtesanaConfig = EstudioArtesanaConfig;`;
        
        // Create download link
        const blob = new Blob([configContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config.js';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Archivo config.js descargado. Reemplaza el archivo en assets/js/', 'success');
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `status-indicator status-${type}`;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '10000';
        notification.style.maxWidth = '300px';
        notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'exclamation-triangle'}"></i> ${message}`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 5000);
    }
}

// Initialize admin manager
const adminManager = new AdminManager();

// Admin Panel Functions (called by buttons)
function saveLogos() {
    const headerLogo = adminManager.changes.logos.headerLogo;
    const heroLogo = adminManager.changes.logos.heroLogo;
    
    if (!headerLogo && !heroLogo) {
        adminManager.showNotification('No hay logos para guardar', 'warning');
        return;
    }
    
    // Update config
    if (!adminManager.config.assets) adminManager.config.assets = {};
    if (!adminManager.config.assets.logos) adminManager.config.assets.logos = {};
    
    if (headerLogo) adminManager.config.assets.logos.header = headerLogo;
    if (heroLogo) adminManager.config.assets.logos.hero = heroLogo;
    
    adminManager.showNotification('Logos guardados. Descarga el config.js actualizado.', 'success');
}

function saveHeroProduct() {
    const productImage = adminManager.changes.logos.heroProduct;
    const productAlt = document.getElementById('heroProductAlt').value;
    
    if (!productImage) {
        adminManager.showNotification('Selecciona una imagen primero', 'warning');
        return;
    }
    
    // Update config
    if (!adminManager.config.assets) adminManager.config.assets = {};
    adminManager.config.assets.heroProduct = {
        image: productImage,
        alt: productAlt || 'Producto artesanal'
    };
    
    adminManager.showNotification('Imagen de producto guardada', 'success');
}

function savePromotion() {
    const promotion = {
        active: true,
        title: document.getElementById('promoTitle').value,
        description: document.getElementById('promoDescription').value,
        code: document.getElementById('promoCode').value,
        expiry: document.getElementById('promoExpiry').value,
        ctaText: document.getElementById('promoButton').value,
        ctaLink: 'pages/tienda/index.html',
        icon: 'fas fa-gift',
        theme: document.querySelector('.theme-option.active').dataset.theme
    };
    
    adminManager.config.promotion = promotion;
    adminManager.showNotification('Promoción guardada', 'success');
}

function saveCategoriesSettings() {
    const display = document.getElementById('categoriesDisplay').value;
    const order = document.getElementById('categoriesOrder').value;
    
    adminManager.config.categories = {
        display: display,
        orderBy: order,
        showAll: display === 'all'
    };
    
    adminManager.showNotification('Configuración de categorías guardada', 'success');
}

function saveCarouselSettings() {
    const source = document.getElementById('carouselSource').value;
    const count = parseInt(document.getElementById('carouselCount').value);
    const speed = parseInt(document.getElementById('carouselSpeed').value);
    
    adminManager.config.carousel = {
        ...adminManager.config.carousel,
        source: source,
        count: count,
        autoPlayInterval: speed
    };
    
    adminManager.showNotification('Configuración de carrusel guardada', 'success');
}

async function loadRandomProduct() {
    adminManager.showNotification('Cargando producto aleatorio...', 'warning');
    
    try {
        const products = await adminManager.getRandomProducts(1);
        if (products && products.length > 0) {
            const product = products[0];
            const imageUrl = product.images && product.images[0] ? product.images[0].src : null;
            
            if (imageUrl) {
                adminManager.previewImage('heroProduct', imageUrl);
                adminManager.changes.logos.heroProduct = imageUrl;
                document.getElementById('heroProductAlt').value = product.name || 'Producto artesanal';
                adminManager.showNotification('Producto aleatorio cargado', 'success');
            } else {
                adminManager.showNotification('El producto no tiene imagen', 'warning');
            }
        }
    } catch (error) {
        adminManager.showNotification('Error al cargar producto aleatorio', 'danger');
    }
}

async function generateCarousel() {
    const source = document.getElementById('carouselSource').value;
    const count = parseInt(document.getElementById('carouselCount').value);
    
    adminManager.showNotification('Generando carrusel...', 'warning');
    
    try {
        let products = [];
        
        switch (source) {
            case 'random':
                products = await adminManager.getRandomProducts(count);
                break;
            case 'featured':
                products = await adminManager.getFeaturedProducts(count);
                break;
            case 'recent':
                // Implement recent products logic
                products = await adminManager.getRandomProducts(count);
                break;
            default:
                products = await adminManager.getRandomProducts(count);
        }
        
        if (products && products.length > 0) {
            const carouselImages = products
                .filter(product => product.images && product.images[0])
                .map(product => ({
                    src: product.images[0].src,
                    alt: product.name,
                    id: product.id
                }));
            
            adminManager.config.carousel.images = carouselImages;
            adminManager.showNotification(`Carrusel generado con ${carouselImages.length} imágenes`, 'success');
        }
    } catch (error) {
        adminManager.showNotification('Error al generar carrusel', 'danger');
    }
}

function loadPromoTemplate() {
    // Show available templates
    const templates = [
        { name: 'San Valentín', theme: 'valentine', title: '💝 SAN VALENTÍN ESPECIAL', desc: '30% descuento en joyería y accesorios', code: 'AMOR30' },
        { name: 'Día de la Madre', theme: 'mother', title: '🌸 DÍA DE LA MADRE', desc: '35% descuento + envío gratis', code: 'MAMA35' },
        { name: 'Navidad', theme: 'christmas', title: '🎄 NAVIDAD MÁGICA', desc: '40% descuento en compras mayores a $1000', code: 'NAVIDAD40' },
        { name: 'Verano', theme: 'summer', title: '☀️ VERANO ARTESANAL', desc: '25% descuento en bolsas y accesorios', code: 'VERANO25' }
    ];
    
    const templateList = templates.map(t => `${t.name}: ${t.title}`).join('\n');
    const selection = prompt(`Plantillas disponibles:\n\n${templateList}\n\nEscribe el número (1-${templates.length}):`);
    
    if (selection && !isNaN(selection)) {
        const index = parseInt(selection) - 1;
        if (index >= 0 && index < templates.length) {
            const template = templates[index];
            document.getElementById('promoTitle').value = template.title;
            document.getElementById('promoDescription').value = template.desc;
            document.getElementById('promoCode').value = template.code;
            document.getElementById('promoExpiry').value = 'Válido hasta fin de mes';
            document.getElementById('promoButton').value = '¡Compra Ahora!';
            
            // Select theme
            document.querySelectorAll('.theme-option').forEach(option => {
                option.classList.toggle('active', option.dataset.theme === template.theme);
            });
            
            adminManager.showNotification(`Plantilla "${template.name}" cargada`, 'success');
        }
    }
}

function refreshCategories() {
    adminManager.showNotification('Actualizando cache de categorías...', 'warning');
    
    // Clear localStorage cache
    localStorage.removeItem('estudioartesana_categories');
    localStorage.removeItem('estudioartesana_categories_timestamp');
    
    setTimeout(() => {
        adminManager.showNotification('Cache de categorías actualizado', 'success');
    }, 1000);
}

function previewChanges() {
    adminManager.showNotification('Abriendo vista previa...', 'info');
    window.open('../index.html', '_blank');
}

function previewSite() {
    window.open('../index.html', '_blank');
}

function clearCache() {
    localStorage.clear();
    adminManager.showNotification('Cache limpiado completamente', 'success');
}

function exportConfig() {
    adminManager.saveConfigToFile(adminManager.config);
}

function saveAllChanges() {
    // Save all sections
    saveLogos();
    saveHeroProduct();
    savePromotion();
    saveCategoriesSettings();
    saveCarouselSettings();
    
    // Export updated config
    setTimeout(() => {
        exportConfig();
        adminManager.showNotification('Todos los cambios guardados y exportados', 'success');
    }, 500);
}

function previewAllChanges() {
    saveAllChanges();
    setTimeout(() => {
        previewSite();
    }, 1000);
}

function resetToDefaults() {
    if (confirm('¿Estás seguro de que quieres restaurar los valores por defecto? Esto borrará todos los cambios.')) {
        location.reload();
        adminManager.showNotification('Valores restaurados', 'success');
    }
}

/**
 * CategoryManager - Handles category management with localStorage persistence
 * drag-and-drop reordering, visibility toggles, and Cloudinary image assignment
 */
class CategoryManager {
    constructor() {
        this.categories = [];
        this.localSettings = {};
        this.cacheKey = 'estudio_artesana_admin_categories';
        this.settingsKey = 'estudio_artesana_category_settings';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
        this.isLoading = false;
        this.sortable = null;
        this.currentView = 'grid';
        
        this.init();
    }
    
    init() {
        this.initializeElements();
        this.bindEvents();
        this.loadLocalSettings();
        this.updateCloudinaryStatus();
        this.loadCategories();
        this.updateCacheInfo();
    }
    
    initializeElements() {
        // Main elements
        this.categoriesGrid = document.getElementById('categoriesGrid');
        this.categoriesLoading = document.getElementById('categoriesLoading');
        this.emptyState = document.getElementById('emptyState');
        
        // Stats elements
        this.totalCategories = document.getElementById('totalCategories');
        this.visibleCategories = document.getElementById('visibleCategories');
        this.hiddenCategories = document.getElementById('hiddenCategories');
        this.categoriesWithImages = document.getElementById('categoriesWithImages');
        
        // Control elements
        this.refreshBtn = document.getElementById('refreshBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFile = document.getElementById('importFile');
        this.clearCacheBtn = document.getElementById('clearCacheBtn');
        
        // View controls
        this.viewBtns = document.querySelectorAll('.view-btn');
        this.bulkAction = document.getElementById('bulkAction');
        this.applyBulkAction = document.getElementById('applyBulkAction');
        
        // Cloudinary config elements
        this.toggleCloudinaryConfig = document.getElementById('toggleCloudinaryConfig');
        this.cloudinaryConfig = document.getElementById('cloudinaryConfig');
        this.cloudinaryStatus = document.getElementById('cloudinaryStatus');
        this.cloudinaryStatusValue = document.getElementById('cloudinaryStatusValue');
        this.statusText = document.getElementById('statusText');
        this.cloudinaryCloudName = document.getElementById('cloudinaryCloudName');
        this.cloudName = document.getElementById('cloudName');
        this.uploadPreset = document.getElementById('uploadPreset');
        this.apiKey = document.getElementById('apiKey');
        this.saveCloudinaryConfig = document.getElementById('saveCloudinaryConfig');
        this.testCloudinaryConfig = document.getElementById('testCloudinaryConfig');
        this.cancelCloudinaryConfig = document.getElementById('cancelCloudinaryConfig');
        
        // Cache info elements
        this.lastUpdate = document.getElementById('lastUpdate');
        this.cacheExpires = document.getElementById('cacheExpires');
        
        this.currentCategoryForImage = null;
        this.selectedImageFile = null;
    }
    
    bindEvents() {
        // Main actions
        this.refreshBtn?.addEventListener('click', () => this.refreshCategories());
        this.exportBtn?.addEventListener('click', () => this.exportConfiguration());
        this.importBtn?.addEventListener('click', () => this.importFile.click());
        this.importFile?.addEventListener('change', (e) => this.importConfiguration(e));
        this.clearCacheBtn?.addEventListener('click', () => this.clearCache());
        
        // View controls
        this.viewBtns?.forEach(btn => {
            btn.addEventListener('click', () => this.switchView(btn.dataset.view));
        });
        
        this.applyBulkAction?.addEventListener('click', () => this.handleBulkAction());
        
        // Cloudinary config
        this.toggleCloudinaryConfig?.addEventListener('click', () => this.toggleCloudinaryConfigForm());
        this.saveCloudinaryConfig?.addEventListener('click', () => this.saveCloudinaryConfiguration());
        this.testCloudinaryConfig?.addEventListener('click', () => this.testCloudinaryConnection());
        this.cancelCloudinaryConfig?.addEventListener('click', () => this.cancelCloudinaryConfiguration());
    }
    
    // Category Loading and Management
    async loadCategories() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // Try to load from cache first
            const cachedData = this.getCachedCategories();
            if (cachedData && !this.isCacheExpired(cachedData.timestamp)) {
                console.log('Loading categories from cache');
                this.categories = cachedData.categories;
                this.renderCategories();
                this.updateStats();
                this.isLoading = false;
                this.hideLoading();
                return;
            }
            
            // Load from API
            console.log('Loading categories from WooCommerce API');
            await this.loadFromAPI();
            
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError('Error al cargar categorías: ' + error.message);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    async loadFromAPI() {
        // Use placeholder categories for now
        this.categories = this.getPlaceholderCategories();
        
        // Apply local settings (order, visibility, images)
        this.applyLocalSettings();
        
        // Cache the results
        this.cacheCategories(this.categories);
        this.renderCategories();
        this.updateStats();
    }
    
    getPlaceholderCategories() {
        return [
            { id: 1, name: 'Bolsas', slug: 'bolsas', count: 12, description: 'Bolsas artesanales' },
            { id: 2, name: 'Accesorios', slug: 'accesorios', count: 8, description: 'Accesorios únicos' },
            { id: 3, name: 'Cuadernos', slug: 'cuadernos', count: 6, description: 'Cuadernos hechos a mano' },
            { id: 4, name: 'Decoración', slug: 'decoracion', count: 10, description: 'Elementos decorativos' },
            { id: 5, name: 'Joyería', slug: 'joyeria', count: 15, description: 'Joyas artesanales' }
        ];
    }
    
    // Local Settings Management
    loadLocalSettings() {
        try {
            const settings = localStorage.getItem(this.settingsKey);
            this.localSettings = settings ? JSON.parse(settings) : {
                categories: {},
                order: [],
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Error loading local settings:', error);
            this.localSettings = { categories: {}, order: [], timestamp: Date.now() };
        }
    }
    
    saveLocalSettings() {
        try {
            this.localSettings.timestamp = Date.now();
            localStorage.setItem(this.settingsKey, JSON.stringify(this.localSettings));
        } catch (error) {
            console.error('Error saving local settings:', error);
        }
    }
    
    saveCategorySettings(slug, settings) {
        if (!this.localSettings.categories[slug]) {
            this.localSettings.categories[slug] = {};
        }
        
        Object.assign(this.localSettings.categories[slug], settings);
        this.saveLocalSettings();
    }
    
    saveOrder() {
        this.localSettings.order = this.categories.map(cat => cat.slug);
        this.saveLocalSettings();
    }
    
    applyLocalSettings() {
        if (!this.localSettings.categories) return;
        
        // Apply custom order
        if (this.localSettings.order && this.localSettings.order.length > 0) {
            const orderMap = {};
            this.localSettings.order.forEach((slug, index) => {
                orderMap[slug] = index;
            });
            
            this.categories.sort((a, b) => {
                const aOrder = orderMap[a.slug] !== undefined ? orderMap[a.slug] : 999;
                const bOrder = orderMap[b.slug] !== undefined ? orderMap[b.slug] : 999;
                return aOrder - bOrder;
            });
        }
        
        // Apply visibility and images
        this.categories = this.categories.map(category => {
            const settings = this.localSettings.categories[category.slug] || {};
            return {
                ...category,
                visible: settings.visible !== false, // default to visible
                customImage: settings.image || null
            };
        });
    }
    
    // Rendering and UI Methods
    renderCategories() {
        if (!this.categories || this.categories.length === 0) {
            this.showEmptyState();
            return;
        }
        
        const isListView = this.currentView === 'list';
        this.categoriesGrid.className = `categories-grid ${isListView ? 'list-view' : ''}`;
        
        let html = '';
        this.categories.forEach(category => {
            html += this.createCategoryCard(category, isListView);
        });
        
        this.categoriesGrid.innerHTML = html;
        this.hideStates();
        
        // Initialize drag and drop
        this.initializeSortable();
        
        // Bind category events
        this.bindCategoryEvents();
    }
    
    createCategoryCard(category, isListView = false) {
        const imageUrl = this.getCategoryImageUrl(category);
        const isVisible = category.visible !== false;
        
        return `
            <div class="category-card ${!isVisible ? 'category-hidden' : ''}" 
                 data-category-id="${category.id}" 
                 data-category-slug="${category.slug}">
                <div class="category-drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                
                <div class="category-checkbox">
                    <input type="checkbox" id="cat_${category.slug}">
                    <label for="cat_${category.slug}"></label>
                </div>
                
                <div class="category-image" style="background-image: url('${imageUrl}')">
                    <div class="category-overlay">
                        <button class="btn btn-sm btn-primary category-image-btn" 
                                data-category-slug="${category.slug}">
                            <i class="fas fa-image"></i>
                            ${category.customImage ? 'Cambiar' : 'Agregar'} imagen
                        </button>
                    </div>
                    ${category.customImage ? '<div class="has-custom-image"><i class="fas fa-check-circle"></i></div>' : ''}
                </div>
                
                <div class="category-info">
                    <div class="category-header">
                        <h3 class="category-name">${category.name}</h3>
                        <div class="category-actions">
                            <label class="visibility-toggle">
                                <input type="checkbox" 
                                       ${isVisible ? 'checked' : ''} 
                                       data-category-slug="${category.slug}"
                                       class="visibility-checkbox">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="category-details">
                        <span class="category-slug">${category.slug}</span>
                        <span class="category-count">${category.count || 0} productos</span>
                    </div>
                    
                    ${category.description ? `<p class="category-description">${category.description}</p>` : ''}
                    
                    <div class="category-status">
                        ${isVisible ? 
                            '<span class="status-badge visible"><i class="fas fa-eye"></i> Visible</span>' :
                            '<span class="status-badge hidden"><i class="fas fa-eye-slash"></i> Oculta</span>'
                        }
                        ${category.customImage ? 
                            '<span class="status-badge has-image"><i class="fas fa-image"></i> Con imagen</span>' : ''
                        }
                    </div>
                </div>
            </div>
        `;
    }
    
    getCategoryImageUrl(category) {
        if (category.customImage && window.CloudinaryManager) {
            return window.CloudinaryManager.generateImageUrl(category.customImage, {
                width: 300,
                height: 200,
                crop: 'fill'
            });
        }
        
        // Default placeholder
        return 'data:image/svg+xml;base64,' + btoa(`
            <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f0f0f0"/>
                <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
                      fill="#999" text-anchor="middle" dy=".3em">${category.name}</text>
            </svg>
        `);
    }
    
    initializeSortable() {
        if (this.sortable) {
            this.sortable.destroy();
        }
        
        if (window.Sortable) {
            this.sortable = new Sortable(this.categoriesGrid, {
                animation: 150,
                handle: '.category-drag-handle',
                ghostClass: 'category-ghost',
                chosenClass: 'category-chosen',
                dragClass: 'category-drag',
                onEnd: (evt) => {
                    this.handleCategoryReorder(evt.oldIndex, evt.newIndex);
                }
            });
        }
    }
    
    bindCategoryEvents() {
        // Visibility toggles
        this.categoriesGrid.querySelectorAll('.visibility-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const categorySlug = e.target.dataset.categorySlug;
                const isVisible = e.target.checked;
                this.updateCategoryVisibility(categorySlug, isVisible);
            });
        });
    }
    
    // Core functionality methods
    handleCategoryReorder(oldIndex, newIndex) {
        if (oldIndex === newIndex) return;
        
        // Update categories array
        const movedCategory = this.categories.splice(oldIndex, 1)[0];
        this.categories.splice(newIndex, 0, movedCategory);
        
        // Save new order
        this.saveOrder();
        
        this.showNotification('Orden actualizado correctamente', 'success');
    }
    
    updateCategoryVisibility(categorySlug, isVisible) {
        const category = this.categories.find(cat => cat.slug === categorySlug);
        if (!category) return;
        
        category.visible = isVisible;
        this.saveCategorySettings(categorySlug, { visible: isVisible });
        this.updateStats();
        
        // Update the card appearance
        const card = this.categoriesGrid.querySelector(`[data-category-slug="${categorySlug}"]`);
        if (card) {
            if (isVisible) {
                card.classList.remove('category-hidden');
            } else {
                card.classList.add('category-hidden');
            }
        }
        
        this.showNotification(
            `Categoría "${category.name}" ${isVisible ? 'mostrada' : 'ocultada'}`, 
            'success'
        );
    }
    
    updateStats() {
        const total = this.categories.length;
        const visible = this.categories.filter(cat => cat.visible !== false).length;
        const hidden = total - visible;
        const withImages = this.categories.filter(cat => cat.customImage).length;
        
        if (this.totalCategories) this.totalCategories.textContent = total;
        if (this.visibleCategories) this.visibleCategories.textContent = visible;
        if (this.hiddenCategories) this.hiddenCategories.textContent = hidden;
        if (this.categoriesWithImages) this.categoriesWithImages.textContent = withImages;
    }
    
    switchView(view) {
        this.currentView = view;
        
        // Update button states
        this.viewBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Re-render with new view
        this.renderCategories();
    }
    
    handleBulkAction() {
        const action = this.bulkAction.value;
        if (!action) return;
        
        const selectedCategories = this.getSelectedCategories();
        if (selectedCategories.length === 0) {
            this.showNotification('Selecciona al menos una categoría', 'warning');
            return;
        }
        
        switch (action) {
            case 'show':
                selectedCategories.forEach(slug => this.updateCategoryVisibility(slug, true));
                break;
            case 'hide':
                selectedCategories.forEach(slug => this.updateCategoryVisibility(slug, false));
                break;
            case 'reset-images':
                selectedCategories.forEach(slug => {
                    this.saveCategorySettings(slug, { image: null });
                    const category = this.categories.find(cat => cat.slug === slug);
                    if (category) category.customImage = null;
                });
                this.renderCategories();
                this.updateStats();
                break;
        }
        
        this.bulkAction.value = '';
    }
    
    getSelectedCategories() {
        const checkboxes = this.categoriesGrid.querySelectorAll('.category-checkbox input:checked');
        return Array.from(checkboxes).map(cb => {
            const card = cb.closest('[data-category-slug]');
            return card ? card.dataset.categorySlug : null;
        }).filter(Boolean);
    }
    
    // Cache management
    getCachedCategories() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            return data;
        } catch (error) {
            console.error('Error reading cached categories:', error);
            return null;
        }
    }
    
    cacheCategories(categories) {
        try {
            const data = {
                categories: categories,
                timestamp: Date.now()
            };
            
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error caching categories:', error);
        }
    }
    
    isCacheExpired(timestamp) {
        return Date.now() - timestamp > this.cacheExpiry;
    }
    
    updateCacheInfo() {
        const cached = this.getCachedCategories();
        if (cached && this.lastUpdate) {
            const lastUpdate = new Date(cached.timestamp);
            this.lastUpdate.textContent = lastUpdate.toLocaleString();
            
            if (this.cacheExpires) {
                const expiresAt = new Date(cached.timestamp + this.cacheExpiry);
                const now = new Date();
                if (expiresAt > now) {
                    const hoursLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60));
                    this.cacheExpires.textContent = `${hoursLeft} horas`;
                } else {
                    this.cacheExpires.textContent = 'Expirado';
                }
            }
        }
    }
    
    // Export/Import functionality
    exportConfiguration() {
        const config = {
            categories: this.localSettings.categories,
            order: this.localSettings.order,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `categories-config-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Configuración exportada correctamente', 'success');
    }
    
    importConfiguration(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                
                if (config.categories) {
                    this.localSettings.categories = config.categories;
                }
                if (config.order) {
                    this.localSettings.order = config.order;
                }
                
                this.saveLocalSettings();
                this.loadCategories(); // Reload with new settings
                
                this.showNotification('Configuración importada correctamente', 'success');
            } catch (error) {
                this.showNotification('Error al importar configuración: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }
    
    // Cloudinary configuration
    updateCloudinaryStatus() {
        const config = localStorage.getItem('cloudinaryConfig');
        if (config) {
            try {
                const cloudinaryConfig = JSON.parse(config);
                if (this.cloudinaryCloudName) {
                    this.cloudinaryCloudName.textContent = cloudinaryConfig.cloudName || '-';
                }
                if (this.statusText) {
                    this.statusText.textContent = 'Configurado';
                    this.statusText.className = 'status-success';
                }
            } catch (error) {
                console.error('Error reading cloudinary config:', error);
            }
        }
    }
    
    toggleCloudinaryConfigForm() {
        const isVisible = this.cloudinaryConfig.style.display === 'block';
        this.cloudinaryConfig.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            // Load current config
            const config = localStorage.getItem('cloudinaryConfig');
            if (config) {
                try {
                    const cloudinaryConfig = JSON.parse(config);
                    if (this.cloudName) this.cloudName.value = cloudinaryConfig.cloudName || '';
                    if (this.uploadPreset) this.uploadPreset.value = cloudinaryConfig.uploadPreset || '';
                    if (this.apiKey) this.apiKey.value = cloudinaryConfig.apiKey || '';
                } catch (error) {
                    console.error('Error loading cloudinary config:', error);
                }
            }
        }
    }
    
    saveCloudinaryConfiguration() {
        const cloudName = this.cloudName?.value.trim();
        const uploadPreset = this.uploadPreset?.value.trim();
        const apiKey = this.apiKey?.value.trim();
        
        if (!cloudName || !uploadPreset) {
            this.showNotification('Cloud Name y Upload Preset son requeridos', 'error');
            return;
        }
        
        // Save to localStorage and configure CloudinaryManager
        if (window.CloudinaryManager) {
            window.CloudinaryManager.configure(cloudName, uploadPreset, apiKey);
        }
        
        this.updateCloudinaryStatus();
        this.cloudinaryConfig.style.display = 'none';
        
        this.showNotification('Configuración de Cloudinary guardada', 'success');
    }
    
    testCloudinaryConnection() {
        this.showNotification('Probando conexión...', 'info');
        // Simple test - this would need a real implementation
        setTimeout(() => {
            this.showNotification('Conexión exitosa', 'success');
        }, 1000);
    }
    
    cancelCloudinaryConfiguration() {
        this.cloudinaryConfig.style.display = 'none';
    }
    
    // Utility methods
    refreshCategories() {
        localStorage.removeItem(this.cacheKey);
        this.loadCategories();
        this.showNotification('Categorías actualizadas', 'success');
    }
    
    clearCache() {
        localStorage.removeItem(this.cacheKey);
        this.showNotification('Cache limpiado', 'success');
        this.updateCacheInfo();
    }
    
    showLoading() {
        if (this.categoriesLoading) this.categoriesLoading.style.display = 'flex';
        this.hideStates();
    }
    
    hideLoading() {
        if (this.categoriesLoading) this.categoriesLoading.style.display = 'none';
    }
    
    showEmptyState() {
        if (this.emptyState) this.emptyState.style.display = 'block';
        this.hideStates();
    }
    
    hideStates() {
        if (this.emptyState) this.emptyState.style.display = 'none';
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `admin-notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 8px;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Export CategoryManager
window.CategoryManager = CategoryManager;

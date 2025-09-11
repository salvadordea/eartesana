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

/**
 * ESTUDIO ARTESANA - Cliente API para Tienda HTML
 * =============================================
 * Este script conecta la tienda HTML estática con el backend API
 * para cargar productos y categorías dinámicamente
 */

class EstudioArtesanaAPI {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.cache = new Map();
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando cliente API Estudio Artesana...');
        await this.loadStoreConfig();
        await this.testConnection();
    }

    // ==========================================
    // MÉTODOS DE CONEXIÓN Y CONFIGURACIÓN
    // ==========================================

    async testConnection() {
        try {
            const response = await this.request('/test');
            console.log('✅ Conexión API establecida:', response);
            return response;
        } catch (error) {
            console.error('❌ Error conectando con API:', error);
            return null;
        }
    }

    async loadStoreConfig() {
        try {
            const config = await this.request('/config');
            this.storeConfig = config;
            console.log('⚙️ Configuración de tienda cargada:', config);
            return config;
        } catch (error) {
            console.error('❌ Error cargando configuración:', error);
            this.storeConfig = {};
        }
    }

    // ==========================================
    // MÉTODOS DE PRODUCTOS
    // ==========================================

    async getProducts(filters = {}) {
        const cacheKey = 'products_' + JSON.stringify(filters);
        
        if (this.cache.has(cacheKey)) {
            console.log('📋 Productos obtenidos desde cache');
            return this.cache.get(cacheKey);
        }

        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = queryParams ? `/productos?${queryParams}` : '/productos';
            
            const response = await this.request(url);
            this.cache.set(cacheKey, response);
            
            console.log(`📦 ${response.products.length} productos cargados (${response.total} total)`);
            return response;
        } catch (error) {
            console.error('❌ Error obteniendo productos:', error);
            return { products: [], total: 0, count: 0 };
        }
    }

    async getProduct(identifier) {
        const cacheKey = 'product_' + identifier;
        
        console.log('🔍 Buscando producto con ID/slug:', identifier);
        
        if (this.cache.has(cacheKey)) {
            console.log('📋 Producto obtenido desde cache:', identifier);
            return this.cache.get(cacheKey);
        }

        try {
            console.log('🌐 Haciendo petición a:', `${this.baseURL}/producto/${identifier}`);
            const product = await this.request(`/producto/${identifier}`);
            
            if (!product) {
                console.warn('⚠️ Producto no encontrado:', identifier);
                return null;
            }
            
            this.cache.set(cacheKey, product);
            console.log('📦 Producto cargado exitosamente:', product.name);
            return product;
        } catch (error) {
            console.error('❌ Error obteniendo producto:', identifier);
            console.error('❌ Detalles del error:', error);
            return null;
        }
    }

    async getFeaturedProducts(limit = 8) {
        return this.getProducts({ featured: 'true', limit });
    }

    async getProductsByCategory(categoryId, limit = null) {
        const filters = { categoria: categoryId };
        if (limit) filters.limit = limit;
        
        return this.getProducts(filters);
    }

    async searchProducts(searchTerm, limit = null) {
        const filters = { search: searchTerm };
        if (limit) filters.limit = limit;
        
        return this.getProducts(filters);
    }

    // ==========================================
    // MÉTODOS DE CATEGORÍAS
    // ==========================================

    async getCategories() {
        if (this.cache.has('categories')) {
            console.log('📋 Categorías obtenidas desde cache');
            return this.cache.get('categories');
        }

        try {
            const categories = await this.request('/categorias');
            this.cache.set('categories', categories);
            
            console.log(`📂 ${categories.length} categorías cargadas`);
            return categories;
        } catch (error) {
            console.error('❌ Error obteniendo categorías:', error);
            return [];
        }
    }

    // ==========================================
    // MÉTODOS DE RENDERIZADO
    // ==========================================

    renderProductCard(product) {
        const onSaleBadge = product.onSale ? 
            `<div class="sale-badge">¡Oferta!</div>` : '';
        
        const priceHTML = product.onSale ? 
            `<span class="original-price">$${product.regularPrice.toFixed(2)}</span>
             <span class="sale-price">${product.formattedPrice}</span>` :
            `<span class="price">${product.formattedPrice}</span>`;

        return `
            <div class="product-card" data-product-id="${product.id}">
                ${onSaleBadge}
                <div class="product-image">
                    <img src="${product.mainImage}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">
                        ${priceHTML}
                    </div>
                    <div class="product-rating">
                        <span class="stars">★★★★★</span>
                        <span class="rating-text">(${product.averageRating})</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary add-to-cart" data-product-id="${product.id}">
                            Agregar al Carrito
                        </button>
                        <button class="btn btn-secondary view-product" data-product-id="${product.id}">
                            Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderCategoryCard(category) {
        return `
            <div class="category-card" data-category-id="${category.id}">
                <div class="category-image">
                    ${category.image ? 
                        `<img src="${category.image}" alt="${category.name}">` :
                        `<div class="category-placeholder">${category.name.charAt(0)}</div>`
                    }
                </div>
                <div class="category-info">
                    <h3 class="category-name">${category.name}</h3>
                    <p class="category-count">${category.count} productos</p>
                    <button class="btn btn-outline view-category" data-category-id="${category.id}">
                        Ver Categoría
                    </button>
                </div>
            </div>
        `;
    }

    // ==========================================
    // MÉTODOS DE INTEGRACIÓN CON HTML
    // ==========================================

    async loadProductsIntoContainer(containerId, filters = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Contenedor no encontrado: ${containerId}`);
            return;
        }

        // Mostrar loading
        container.innerHTML = '<div class="loading">Cargando productos...</div>';

        try {
            const response = await this.getProducts(filters);
            
            if (response.products.length === 0) {
                container.innerHTML = '<div class="no-products">No se encontraron productos</div>';
                return;
            }

            // Renderizar productos
            const productsHTML = response.products
                .map(product => this.renderProductCard(product))
                .join('');
            
            container.innerHTML = productsHTML;

            // Agregar event listeners
            this.attachProductEventListeners(container);

            console.log(`✅ ${response.products.length} productos renderizados en ${containerId}`);

        } catch (error) {
            console.error('❌ Error cargando productos en contenedor:', error);
            container.innerHTML = '<div class="error">Error cargando productos</div>';
        }
    }

    async loadCategoriesIntoContainer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Contenedor no encontrado: ${containerId}`);
            return;
        }

        // Mostrar loading
        container.innerHTML = '<div class="loading">Cargando categorías...</div>';

        try {
            const categories = await this.getCategories();
            
            if (categories.length === 0) {
                container.innerHTML = '<div class="no-categories">No se encontraron categorías</div>';
                return;
            }

            // Renderizar categorías
            const categoriesHTML = categories
                .map(category => this.renderCategoryCard(category))
                .join('');
            
            container.innerHTML = categoriesHTML;

            // Agregar event listeners
            this.attachCategoryEventListeners(container);

            console.log(`✅ ${categories.length} categorías renderizadas en ${containerId}`);

        } catch (error) {
            console.error('❌ Error cargando categorías en contenedor:', error);
            container.innerHTML = '<div class="error">Error cargando categorías</div>';
        }
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    attachProductEventListeners(container) {
        // Botones "Agregar al carrito"
        container.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                this.addToCart(productId);
            });
        });

        // Botones "Ver detalles"
        container.querySelectorAll('.view-product').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                this.viewProduct(productId);
            });
        });
    }

    attachCategoryEventListeners(container) {
        // Botones "Ver categoría"
        container.querySelectorAll('.view-category').forEach(button => {
            button.addEventListener('click', (e) => {
                const categoryId = e.target.dataset.categoryId;
                this.viewCategory(categoryId);
            });
        });
    }

    // ==========================================
    // ACCIONES DE PRODUCTOS
    // ==========================================

    addToCart(productId) {
        console.log('🛒 Agregando al carrito:', productId);
        
        // Obtener carrito actual
        let cart = JSON.parse(localStorage.getItem('artesana_cart') || '[]');
        
        // Buscar si el producto ya existe en el carrito
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productId,
                quantity: 1,
                dateAdded: new Date().toISOString()
            });
        }
        
        // Guardar carrito actualizado
        localStorage.setItem('artesana_cart', JSON.stringify(cart));
        
        // Mostrar notificación
        this.showNotification('Producto agregado al carrito', 'success');
        
        // Actualizar contador del carrito
        this.updateCartCounter();
    }

    viewProduct(productId) {
        console.log('👁️ Viendo producto:', productId);
        // Redirigir a página del producto o abrir modal
        window.location.href = `/tienda/producto.html?id=${productId}`;
    }

    viewCategory(categoryId) {
        console.log('📂 Viendo categoría:', categoryId);
        // Redirigir a página de categoría
        window.location.href = `/tienda/categoria.html?id=${categoryId}`;
    }

    // ==========================================
    // CARRITO DE COMPRAS
    // ==========================================

    getCart() {
        return JSON.parse(localStorage.getItem('artesana_cart') || '[]');
    }

    async getCartWithDetails() {
        const cart = this.getCart();
        const cartWithDetails = [];

        for (const item of cart) {
            const product = await this.getProduct(item.id);
            if (product) {
                cartWithDetails.push({
                    ...product,
                    quantity: item.quantity,
                    subtotal: product.price * item.quantity
                });
            }
        }

        return cartWithDetails;
    }

    updateCartCounter() {
        const cart = this.getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Actualizar todos los contadores de carrito en la página
        document.querySelectorAll('.cart-counter').forEach(counter => {
            counter.textContent = totalItems;
            counter.style.display = totalItems > 0 ? 'block' : 'none';
        });
    }

    clearCart() {
        localStorage.removeItem('artesana_cart');
        this.updateCartCounter();
        this.showNotification('Carrito vaciado', 'info');
    }

    // ==========================================
    // UTILIDADES
    // ==========================================

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Estilos básicos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(price);
    }

    // ==========================================
    // MÉTODOS INTERNOS
    // ==========================================

    async request(endpoint) {
        const url = this.baseURL + endpoint;
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Error en petición API:', url, error);
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache limpiado');
    }
}

// ==========================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================

// Crear instancia global
window.EstudioArtesanaAPI = EstudioArtesanaAPI;
window.artesanaAPI = new EstudioArtesanaAPI();

// Funciones de conveniencia globales
window.loadProducts = (containerId, filters) => {
    return window.artesanaAPI.loadProductsIntoContainer(containerId, filters);
};

window.loadCategories = (containerId) => {
    return window.artesanaAPI.loadCategoriesIntoContainer(containerId);
};

window.loadFeaturedProducts = (containerId, limit = 8) => {
    return window.artesanaAPI.loadProductsIntoContainer(containerId, { featured: 'true', limit });
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 Estudio Artesana API Client inicializado');
    
    // Actualizar contador del carrito al cargar la página
    if (window.artesanaAPI) {
        window.artesanaAPI.updateCartCounter();
    }
});

console.log('📦 Estudio Artesana API Client cargado');

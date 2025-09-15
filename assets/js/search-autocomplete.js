/**
 * Search Autocomplete Functionality
 * Maneja autocompletado en tiempo real para la barra de búsqueda
 */

class SearchAutocomplete {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.suggestionsContainer = document.getElementById('searchSuggestions');
        this.currentSuggestions = [];
        this.selectedIndex = -1;
        this.searchTimeout = null;
        this.isVisible = false;
        
        this.init();
    }

    init() {
        if (!this.searchInput || !this.suggestionsContainer) {
            console.warn('Search autocomplete elements not found');
            return;
        }

        this.bindEvents();
        this.setupClickOutside();
    }

    bindEvents() {
        // Evento input con debounce
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                this.hideSuggestions();
                return;
            }

            this.searchTimeout = setTimeout(() => {
                this.fetchSuggestions(query);
            }, 300);
        });

        // Eventos de teclado para navegación
        this.searchInput.addEventListener('keydown', (e) => {
            if (!this.isVisible) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateSuggestions(1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateSuggestions(-1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.selectSuggestion();
                    break;
                case 'Escape':
                    this.hideSuggestions();
                    this.searchInput.blur();
                    break;
            }
        });

        // Focus events
        this.searchInput.addEventListener('focus', () => {
            const query = this.searchInput.value.trim();
            if (query.length >= 2 && this.currentSuggestions.length > 0) {
                this.showSuggestions();
            }
        });
    }

    setupClickOutside() {
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !this.suggestionsContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    async fetchSuggestions(query) {
        try {
            this.showLoading();
            
            // Usar la API existente para buscar productos
            if (!window.artesanaAPI) {
                throw new Error('API no disponible');
            }

            const response = await window.artesanaAPI.searchProducts(query, 8);

            if (response && response.products && response.products.length > 0) {
                this.currentSuggestions = response.products.slice(0, 8); // Asegurar máximo 8
                this.renderSuggestions();
            } else {
                this.showNoResults();
            }

        } catch (error) {
            console.error('Error fetching suggestions:', error);
            this.showError();
        }
    }

    showLoading() {
        this.suggestionsContainer.innerHTML = `
            <div class="suggestion-loading">
                <div class="loading-spinner"></div>
                <span>Buscando...</span>
            </div>
        `;
        this.showSuggestions();
    }

    renderSuggestions() {
        if (this.currentSuggestions.length === 0) {
            this.showNoResults();
            return;
        }

        const suggestionsHTML = this.currentSuggestions.map((product, index) => `
            <div class="suggestion-item" data-index="${index}" data-id="${product.id}">
                <img src="${this.getProductImage(product)}" alt="${product.name || product.title}" class="suggestion-image" onerror="this.src='./assets/images/placeholder-product.jpg'">
                <div class="suggestion-content">
                    <div class="suggestion-title">${this.highlightText(product.name || product.title, this.searchInput.value)}</div>
                    <div class="suggestion-category">${product.category || 'Producto'}</div>
                </div>
                <div class="suggestion-price">$${this.formatPrice(product.price)}</div>
            </div>
        `).join('');

        this.suggestionsContainer.innerHTML = suggestionsHTML;
        this.bindSuggestionEvents();
        this.showSuggestions();
        this.selectedIndex = -1;
    }

    bindSuggestionEvents() {
        const suggestionItems = this.suggestionsContainer.querySelectorAll('.suggestion-item');
        
        suggestionItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                this.selectedIndex = index;
                this.selectSuggestion();
            });

            item.addEventListener('mouseenter', () => {
                this.updateSelection(index);
            });
        });
    }

    showNoResults() {
        this.suggestionsContainer.innerHTML = `
            <div class="suggestion-no-results">
                No se encontraron productos para "${this.searchInput.value}"
            </div>
        `;
        this.showSuggestions();
    }

    showError() {
        this.suggestionsContainer.innerHTML = `
            <div class="suggestion-no-results">
                Error al buscar productos. Inténtalo de nuevo.
            </div>
        `;
        this.showSuggestions();
    }

    showSuggestions() {
        this.suggestionsContainer.classList.add('visible');
        this.isVisible = true;
    }

    hideSuggestions() {
        this.suggestionsContainer.classList.remove('visible');
        this.isVisible = false;
        this.selectedIndex = -1;
        this.updateSelection(-1);
    }

    navigateSuggestions(direction) {
        if (this.currentSuggestions.length === 0) return;

        const newIndex = this.selectedIndex + direction;
        
        if (newIndex < -1) {
            this.selectedIndex = this.currentSuggestions.length - 1;
        } else if (newIndex >= this.currentSuggestions.length) {
            this.selectedIndex = -1;
        } else {
            this.selectedIndex = newIndex;
        }

        this.updateSelection(this.selectedIndex);
    }

    updateSelection(index) {
        const suggestionItems = this.suggestionsContainer.querySelectorAll('.suggestion-item');
        
        suggestionItems.forEach((item, i) => {
            item.classList.toggle('highlighted', i === index);
        });

        this.selectedIndex = index;
    }

    selectSuggestion() {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.currentSuggestions.length) {
            const selectedProduct = this.currentSuggestions[this.selectedIndex];
            
            // Determinar la ruta correcta basada en la ubicación actual
            const currentPath = window.location.pathname;
            let productUrl = 'producto.html';
            
            // Si estamos en un subdirectorio, necesitamos ir un nivel arriba
            if (currentPath.includes('/tienda/') || currentPath.includes('/pages/')) {
                productUrl = '../producto.html';
            }
            
            // Ir directamente a la página del producto
            window.location.href = `${productUrl}?id=${selectedProduct.id}`;
        } else if (this.searchInput.value.trim()) {
            // Si no hay selección pero hay texto, hacer búsqueda normal
            this.hideSuggestions();
            this.performSearch(this.searchInput.value.trim());
        }
    }

    performSearch(query) {
        // Usar la función de búsqueda existente
        if (typeof window.searchProducts === 'function') {
            window.searchProducts();
        } else {
            // Fallback: trigger manual search
            console.log('Performing search for:', query);
        }
    }

    getProductImage(product) {
        if (product.mainImage) {
            return product.mainImage;
        }
        if (product.images && product.images.length > 0) {
            return product.images[0];
        }
        if (product.image) {
            return product.image;
        }
        return './assets/images/placeholder-product.jpg';
    }

    formatPrice(price) {
        if (typeof price !== 'number') {
            return '0.00';
        }
        return price.toFixed(2);
    }

    highlightText(text, query) {
        if (!query || !text) return text;
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    // Método público para limpiar sugerencias
    clear() {
        this.hideSuggestions();
        this.currentSuggestions = [];
        this.selectedIndex = -1;
        clearTimeout(this.searchTimeout);
    }

    // Método público para destruir la instancia
    destroy() {
        this.clear();
        if (this.searchInput) {
            this.searchInput.removeEventListener('input', this.handleInput);
            this.searchInput.removeEventListener('keydown', this.handleKeydown);
            this.searchInput.removeEventListener('focus', this.handleFocus);
        }
    }
}

// Inicializar autocompletado cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que la API esté disponible
    const initAutocomplete = () => {
        if (window.artesanaAPI) {
            window.searchAutocomplete = new SearchAutocomplete();
            console.log('✅ Search Autocomplete initialized');
        } else {
            setTimeout(initAutocomplete, 500);
        }
    };

    // Pequeño delay para asegurar que la API esté lista
    setTimeout(initAutocomplete, 1000);
});

// Limpiar sugerencias al navegar
window.addEventListener('beforeunload', () => {
    if (window.searchAutocomplete) {
        window.searchAutocomplete.clear();
    }
});

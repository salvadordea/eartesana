/**
 * Search Autocomplete Functionality
 * Maneja autocompletado en tiempo real para la barra de búsqueda
 */

class SearchAutocomplete {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.mobileSearchInput = document.getElementById('mobileSearchInput');
        this.suggestionsContainer = document.getElementById('searchSuggestions');
        this.mobileSuggestionsContainer = document.getElementById('mobileSearchSuggestions');
        this.currentSuggestions = [];
        this.selectedIndex = -1;
        this.searchTimeout = null;
        this.isVisible = false;
        this.activeSuggestions = null; // Track which suggestions container is active
        this.activeInput = null; // Track which input is active
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupClickOutside();
        
        console.log('🔍 SearchAutocomplete initialized with:', {
            desktop: !!this.searchInput && !!this.suggestionsContainer,
            mobile: !!this.mobileSearchInput && !!this.mobileSuggestionsContainer
        });
    }

    bindEvents() {
        // Bind desktop search input
        if (this.searchInput) {
            this.bindInputEvents(this.searchInput, this.suggestionsContainer, 'desktop');
        }
        
        // Bind mobile search input
        if (this.mobileSearchInput) {
            this.bindInputEvents(this.mobileSearchInput, this.mobileSuggestionsContainer, 'mobile');
        }
    }
    
    bindInputEvents(input, suggestionsContainer, type) {
        // Evento input con debounce
        input.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            const query = e.target.value.trim();
            
            // Set active context
            this.activeInput = input;
            this.activeSuggestions = suggestionsContainer;
            
            if (query.length < 2) {
                this.hideSuggestions();
                return;
            }

            this.searchTimeout = setTimeout(() => {
                this.fetchSuggestions(query);
            }, 300);
        });

        // Eventos de teclado para navegación
        input.addEventListener('keydown', (e) => {
            if (!this.isVisible || this.activeInput !== input) return;

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
                    input.blur();
                    break;
            }
        });

        // Focus events
        input.addEventListener('focus', () => {
            this.activeInput = input;
            this.activeSuggestions = suggestionsContainer;
            
            const query = input.value.trim();
            if (query.length >= 2 && this.currentSuggestions.length > 0) {
                this.showSuggestions();
            }
        });
    }

    setupClickOutside() {
        document.addEventListener('click', (e) => {
            let isClickOutside = true;
            
            // Check desktop elements
            if (this.searchInput && this.suggestionsContainer) {
                if (this.searchInput.contains(e.target) || this.suggestionsContainer.contains(e.target)) {
                    isClickOutside = false;
                }
            }
            
            // Check mobile elements  
            if (this.mobileSearchInput && this.mobileSuggestionsContainer) {
                if (this.mobileSearchInput.contains(e.target) || this.mobileSuggestionsContainer.contains(e.target)) {
                    isClickOutside = false;
                }
            }
            
            if (isClickOutside) {
                this.hideSuggestions();
            }
        });
    }

    async fetchSuggestions(query) {
        if (!this.activeSuggestions) return;
        
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
        if (!this.activeSuggestions) return;
        
        this.activeSuggestions.innerHTML = `
            <div class="suggestion-loading">
                <div class="loading-spinner"></div>
                <span>Buscando...</span>
            </div>
        `;
        this.showSuggestions();
    }

    renderSuggestions() {
        if (!this.activeSuggestions || this.currentSuggestions.length === 0) {
            this.showNoResults();
            return;
        }

        const currentQuery = this.activeInput ? this.activeInput.value : '';
        const suggestionsHTML = this.currentSuggestions.map((product, index) => `
            <div class="suggestion-item" data-index="${index}" data-id="${product.id}">
                <img src="${this.getProductImage(product)}" alt="${product.name || product.title}" class="suggestion-image" onerror="this.src='./assets/images/placeholder-product.jpg'">
                <div class="suggestion-content">
                    <div class="suggestion-title">${this.highlightText(product.name || product.title, currentQuery)}</div>
                    <div class="suggestion-category">${product.category || 'Producto'}</div>
                </div>
                <div class="suggestion-price">$${this.formatPrice(product.price)}</div>
            </div>
        `).join('');

        this.activeSuggestions.innerHTML = suggestionsHTML;
        this.bindSuggestionEvents();
        this.showSuggestions();
        this.selectedIndex = -1;
    }

    bindSuggestionEvents() {
        if (!this.activeSuggestions) return;
        
        const suggestionItems = this.activeSuggestions.querySelectorAll('.suggestion-item');
        
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
        if (!this.activeSuggestions || !this.activeInput) return;
        
        this.activeSuggestions.innerHTML = `
            <div class="suggestion-no-results">
                No se encontraron productos para "${this.activeInput.value}"
            </div>
        `;
        this.showSuggestions();
    }

    showError() {
        if (!this.activeSuggestions) return;
        
        this.activeSuggestions.innerHTML = `
            <div class="suggestion-no-results">
                Error al buscar productos. Inténtalo de nuevo.
            </div>
        `;
        this.showSuggestions();
    }

    showSuggestions() {
        if (!this.activeSuggestions) return;
        
        this.activeSuggestions.classList.add('visible');
        this.isVisible = true;
    }

    hideSuggestions() {
        // Hide both containers
        if (this.suggestionsContainer) {
            this.suggestionsContainer.classList.remove('visible');
        }
        if (this.mobileSuggestionsContainer) {
            this.mobileSuggestionsContainer.classList.remove('visible');
        }
        
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
        if (!this.activeSuggestions) return;
        
        const suggestionItems = this.activeSuggestions.querySelectorAll('.suggestion-item');
        
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
        } else if (this.activeInput && this.activeInput.value.trim()) {
            // Si no hay selección pero hay texto, hacer búsqueda normal
            this.hideSuggestions();
            this.performSearch(this.activeInput.value.trim());
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
function initializeSearchAutocomplete() {
    const searchInput = document.getElementById('searchInput');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const mobileSuggestions = document.getElementById('mobileSearchSuggestions');
    
    console.log('🔍 Verificando elementos para autocompletado:', {
        searchInput: !!searchInput,
        searchSuggestions: !!searchSuggestions,
        mobileSearchInput: !!mobileSearchInput,
        mobileSuggestions: !!mobileSuggestions,
        artesanaAPI: !!window.artesanaAPI
    });
    
    // Verificar que al menos tengamos los elementos principales
    const hasDesktopElements = searchInput && searchSuggestions;
    const hasMobileElements = mobileSearchInput && mobileSuggestions;
    
    if (hasDesktopElements || hasMobileElements) {
        if (window.artesanaAPI && typeof window.artesanaAPI.searchProducts === 'function') {
            // Solo crear la instancia si no existe ya
            if (!window.searchAutocomplete) {
                try {
                    window.searchAutocomplete = new SearchAutocomplete();
                    console.log('✅ Search Autocomplete initialized successfully');
                    return true;
                } catch (error) {
                    console.error('❌ Error inicializando SearchAutocomplete:', error);
                    return false;
                }
            }
            return true;
        } else {
            console.log('⏳ Esperando artesanaAPI...');
            return false;
        }
    } else {
        console.log('⏳ Esperando elementos DOM...');
        return false;
    }
}

// Intentar inicializar con múltiples estrategias
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded - intentando inicializar autocompletado');
    
    // Intento inmediato
    if (!initializeSearchAutocomplete()) {
        // Intentos con delay creciente
        let attempts = 0;
        const maxAttempts = 10;
        
        const tryInit = () => {
            attempts++;
            console.log(`🔄 Intento ${attempts}/${maxAttempts} de inicialización`);
            
            if (initializeSearchAutocomplete()) {
                console.log('🎉 Autocompletado inicializado exitosamente');
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(tryInit, attempts * 500); // Delay creciente
            } else {
                console.warn('⚠️ No se pudo inicializar el autocompletado después de múltiples intentos');
            }
        };
        
        tryInit();
    }
});

// Limpiar sugerencias al navegar
window.addEventListener('beforeunload', () => {
    if (window.searchAutocomplete) {
        window.searchAutocomplete.clear();
    }
});

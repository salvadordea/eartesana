/**
 * UNIVERSAL HEADER LOADER - ESTUDIO ARTESANA
 * ===========================================
 * Carga el header universal y calcula automáticamente las rutas
 * según la ubicación actual del archivo
 */

class UniversalHeader {
    constructor() {
        this.currentPath = window.location.pathname;
        this.depth = this.calculateDepth();
        this.baseUrl = this.calculateBaseUrl();
        this.currentPage = this.detectCurrentPage();
        
        console.log('🎯 UniversalHeader inicializado:', {
            currentPath: this.currentPath,
            depth: this.depth,
            baseUrl: this.baseUrl,
            currentPage: this.currentPage
        });
    }

    /**
     * Calcula la profundidad del archivo actual (cuántas carpetas desde la raíz)
     */
    calculateDepth() {
        // Eliminar el nombre del archivo si existe
        let pathWithoutFile = this.currentPath;
        if (pathWithoutFile.includes('.html')) {
            pathWithoutFile = pathWithoutFile.substring(0, pathWithoutFile.lastIndexOf('/'));
        }
        
        // Contar las barras (menos 1 porque la primera siempre está)
        const depth = (pathWithoutFile.match(/\//g) || []).length - 1;
        return Math.max(0, depth);
    }

    /**
     * Calcula la URL base para llegar a la raíz del sitio
     */
    calculateBaseUrl() {
        if (this.depth === 0) return './';
        return '../'.repeat(this.depth);
    }

    /**
     * Detecta qué página estamos viendo para marcar el enlace activo
     */
    detectCurrentPage() {
        const path = this.currentPath.toLowerCase();

        if (path.includes('tienda') || path.includes('shop')) return 'tienda';
        if (path.includes('sobre-nosotros') || path.includes('about')) return 'sobre';
        if (path.includes('mayoristas') || path.includes('wholesale')) return 'mayoristas';
        if (path.includes('contacto') || path.includes('contact')) return 'contacto';
        if (path.includes('micuenta') || path.includes('mi-cuenta') || path.includes('registro') || path.includes('register')) return 'registro';
        if (path.includes('index.html') || path === '/' || path.endsWith('/')) return 'home';

        return 'home'; // Por defecto
    }

    /**
     * Genera las URLs adaptadas a la ubicación actual
     */
    generateUrls() {
        return {
            HOMEPAGE_URL: `${this.baseUrl}index.html`,
            TIENDA_URL: `${this.baseUrl}tienda.html`,
            SOBRE_NOSOTROS_URL: `${this.baseUrl}pages/sobre-nosotros/index.html`,
            MAYORISTAS_URL: `${this.baseUrl}pages/mayoristas/index.html`,
            CONTACTO_URL: `${this.baseUrl}index.html#contacto`,
            REGISTRO_URL: `${this.baseUrl}micuenta.html`,
            LOGO_URL: `${this.baseUrl}assets/images/logo.webp`
        };
    }

    /**
     * Genera las clases activas para los enlaces
     */
    generateActiveClasses() {
        return {
            HOME_ACTIVE: this.currentPage === 'home' ? 'active' : '',
            TIENDA_ACTIVE: this.currentPage === 'tienda' ? 'active' : '',
            SOBRE_ACTIVE: this.currentPage === 'sobre' ? 'active' : '',
            MAYORISTAS_ACTIVE: this.currentPage === 'mayoristas' ? 'active' : '',
            CONTACTO_ACTIVE: this.currentPage === 'contacto' ? 'active' : '',
            REGISTRO_ACTIVE: this.currentPage === 'registro' ? 'active' : ''
        };
    }

    /**
     * Carga el header desde el archivo universal
     */
    async loadHeader() {
        try {
            // Forzar recarga con timestamp para evitar cache
            const timestamp = new Date().getTime();
            const headerUrl = `${this.baseUrl}components/universal-header.html?v=${timestamp}`;
            console.log('📥 Cargando header desde:', headerUrl);
            
            const response = await fetch(headerUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            let headerHtml = await response.text();
            
            // Reemplazar placeholders con las URLs y clases correctas
            const urls = this.generateUrls();
            const activeClasses = this.generateActiveClasses();
            const replacements = { ...urls, ...activeClasses };
            
            // Hacer los reemplazos
            for (const [key, value] of Object.entries(replacements)) {
                const placeholder = `{{${key}}}`;
                headerHtml = headerHtml.replace(new RegExp(placeholder, 'g'), value);
            }
            
            // Insertar el header en el DOM
            const headerContainer = document.getElementById('universal-header-container');
            if (headerContainer) {
                headerContainer.innerHTML = headerHtml;
                console.log('✅ Header cargado exitosamente');

                // Inicializar funcionalidad del header
                this.initializeHeaderFunctionality();

                // Trigger translation system to translate header
                if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
                    console.log('🌐 Applying translations to universal header');
                    window.TranslationSystem.applyTranslations();
                }

            } else {
                console.error('❌ No se encontró el contenedor #universal-header-container');
            }
            
        } catch (error) {
            console.error('❌ Error cargando header:', error);
            
            // Fallback: mostrar header básico
            this.showFallbackHeader();
        }
    }

    /**
     * Muestra un header básico si falla la carga del universal
     */
    showFallbackHeader() {
        const headerContainer = document.getElementById('universal-header-container');
        if (headerContainer) {
            const urls = this.generateUrls();
            
            headerContainer.innerHTML = `
                <header class="header" style="background: #111; padding: 15px 0;">
                    <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="logo">
                            <a href="${urls.HOMEPAGE_URL}">
                                <img src="${urls.LOGO_URL}" alt="Estudio Artesana" style="height: 40px;" onerror="this.style.display='none'; this.parentNode.innerHTML='Estudio Artesana';">
                            </a>
                        </div>
                        <nav style="display: flex; gap: 20px;">
                            <a href="${urls.HOMEPAGE_URL}" style="color: #fff; text-decoration: none;">INICIO</a>
                            <a href="${urls.TIENDA_URL}" style="color: #fff; text-decoration: none;">TIENDA</a>
                            <a href="${urls.SOBRE_NOSOTROS_URL}" style="color: #fff; text-decoration: none;">SOBRE NOSOTROS</a>
                            <a href="${urls.MAYORISTAS_URL}" style="color: #fff; text-decoration: none;">MAYORISTAS</a>
                        </nav>
                    </div>
                </header>
            `;
            
            console.log('⚠️ Mostrado header básico de fallback');
        }
    }

    /**
     * Inicializa la funcionalidad del header (menú móvil, dropdowns, etc.)
     */
    initializeHeaderFunctionality() {
        // Menú móvil
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.nav');
        
        if (mobileToggle && nav) {
            mobileToggle.addEventListener('click', () => {
                nav.classList.toggle('mobile-active');
                mobileToggle.classList.toggle('active');
            });
        }

        // Dropdown de tienda
        const dropdown = document.querySelector('.nav-item.dropdown');
        if (dropdown) {
            const dropdownMenu = dropdown.querySelector('.dropdown-menu');
            
            dropdown.addEventListener('mouseenter', () => {
                dropdownMenu.style.display = 'block';
            });
            
            dropdown.addEventListener('mouseleave', () => {
                dropdownMenu.style.display = 'none';
            });
        }

        // Si existe el API client, cargar categorías en el dropdown
        if (window.artesanaAPI) {
            this.loadCategoriesInDropdown();
        } else {
            // Esperar a que esté disponible
            const checkAPI = setInterval(() => {
                if (window.artesanaAPI) {
                    this.loadCategoriesInDropdown();
                    clearInterval(checkAPI);
                }
            }, 500);
            
            // Timeout después de 10 segundos
            setTimeout(() => clearInterval(checkAPI), 10000);
        }

        // Listen for language changes to coordinate with translation system
        window.addEventListener('languageChanged', (event) => {
            console.log('🌐 Universal Header: Language changed, reloading categories...');

            // Wait a bit for translation system to finish, then reload categories
            setTimeout(() => {
                if (window.artesanaAPI) {
                    this.loadCategoriesInDropdown();
                }
            }, 200);
        });

        console.log('⚙️ Funcionalidad del header inicializada');
    }

    /**
     * Carga las categorías en el dropdown si está disponible el API
     */
    async loadCategoriesInDropdown() {
        try {
            const dropdownCategories = document.getElementById('dropdownCategories');
            if (!dropdownCategories) return;
            
            const categories = await window.artesanaAPI.getCategories();
            
            if (categories && categories.length > 0) {
                const categoriesHTML = categories.slice(0, 8).map(category => `
                    <a href="${this.generateUrls().TIENDA_URL}?categoria=${category.id}" class="dropdown-link" ${this.getCategoryTranslationKey(category.name) ? `data-translate="${this.getCategoryTranslationKey(category.name)}"` : ''}>
                        ${category.name} (${category.count})
                    </a>
                `).join('');
                
                dropdownCategories.innerHTML = categoriesHTML;

                // Trigger translation system to translate dropdown categories
                if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
                    console.log('🌐 Applying translations to header dropdown categories');
                    window.TranslationSystem.applyTranslations();
                }

                console.log('📂 Categorías cargadas en dropdown del header');
            }
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar categorías en header:', error.message);
        }
    }

    // Map category names to translation keys
    getCategoryTranslationKey(categoryName) {
        const mapping = {
            'Joyería': 'categories.joyeria',
            'Accesorios': 'categories.accesorios',
            'BOLSAS DE MANO': 'categories.bolsas',
            'BOLSAS TEXTIL Y PIEL': 'categories.bolsas',
            'Bolsas Cruzadas': 'categories.bolsas',
            'Cuadernos': 'categories.cuadernos',
            'Decoración': 'categories.decoracion',
            'Textiles': 'categories.textiles',
            'Cerámica': 'categories.ceramica',
            'Bolsas': 'categories.bolsas'
        };

        return mapping[categoryName] || null;
    }
}

// Función de inicialización global
window.initUniversalHeader = function() {
    const headerLoader = new UniversalHeader();
    headerLoader.loadHeader();
    
    // Hacer disponible globalmente para debugging
    window.universalHeader = headerLoader;
    
    return headerLoader;
};

// Auto-inicializar si el DOM ya está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initUniversalHeader);
} else {
    window.initUniversalHeader();
}

console.log('📦 Universal Header script cargado');

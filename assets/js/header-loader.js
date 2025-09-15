/**
 * Header Loader - Estudio Artesana
 * =================================
 * Carga el header dinámicamente en todas las páginas
 */

(function() {
    'use strict';

    // Configuración de rutas según la ubicación del archivo
    function getBasePath() {
        const path = window.location.pathname;
        
        if (path.includes('/tienda/')) return '../';
        if (path.includes('/pages/')) return '../';
        if (path.includes('/admin/')) return '../';
        
        return './';
    }

    function getActiveClass(page) {
        const path = window.location.pathname;
        const hash = window.location.hash;
        
        switch(page) {
            case 'home':
                return (path === '/' || path.endsWith('/index.html') || path === '') ? 'active' : '';
            case 'tienda':
                return (path.includes('/tienda/') || path.endsWith('/tienda.html')) ? 'active' : '';
            case 'sobre-nosotros':
                return path.includes('/sobre-nosotros/') ? 'active' : '';
            case 'mayoristas':
                return path.includes('/mayoristas/') ? 'active' : '';
            case 'contacto':
                return hash === '#contacto' ? 'active' : '';
            case 'registro':
                return hash === '#registro' ? 'active' : '';
            default:
                return '';
        }
    }

    async function loadHeader() {
        const basePath = getBasePath();
        
        try {
            // Cargar el template del header
            const response = await fetch(`${basePath}components/header.html`);
            if (!response.ok) throw new Error('No se pudo cargar el header');
            
            let headerHTML = await response.text();
            
            // Reemplazar placeholders con rutas correctas
            const replacements = {
                '{HOME_URL}': basePath + 'index.html',
                '{TIENDA_URL}': basePath + 'tienda.html',
                '{SOBRE_NOSOTROS_URL}': basePath + 'sobre-nosotros/index.html',
                '{MAYORISTAS_URL}': basePath + 'pages/mayoristas/index.html',
                '{CONTACTO_URL}': basePath + 'index.html#contacto',
                '{REGISTRO_URL}': basePath + 'index.html#registro',
                '{LOGO_PATH}': basePath + 'assets/images/logo.webp',
                '{HOME_ACTIVE}': getActiveClass('home'),
                '{TIENDA_ACTIVE}': getActiveClass('tienda'),
                '{SOBRE_NOSOTROS_ACTIVE}': getActiveClass('sobre-nosotros'),
                '{MAYORISTAS_ACTIVE}': getActiveClass('mayoristas'),
                '{CONTACTO_ACTIVE}': getActiveClass('contacto'),
                '{REGISTRO_ACTIVE}': getActiveClass('registro')
            };

            // Aplicar reemplazos
            Object.keys(replacements).forEach(placeholder => {
                headerHTML = headerHTML.replace(new RegExp(placeholder, 'g'), replacements[placeholder]);
            });

            // Insertar header en el DOM
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                headerContainer.innerHTML = headerHTML;
            } else {
                // Si no existe contenedor, insertar al inicio del body
                document.body.insertAdjacentHTML('afterbegin', headerHTML);
            }

            // Inicializar funcionalidad del header
            initializeHeaderFunctionality();
            
            console.log('✅ Header cargado correctamente');

        } catch (error) {
            console.error('❌ Error cargando header:', error);
            
            // Header de fallback
            const fallbackHeader = createFallbackHeader();
            document.body.insertAdjacentHTML('afterbegin', fallbackHeader);
        }
    }

    function initializeHeaderFunctionality() {
        // Mobile menu toggle
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.nav');
        
        if (mobileToggle && nav) {
            mobileToggle.addEventListener('click', () => {
                nav.classList.toggle('active');
                mobileToggle.classList.toggle('active');
            });
        }

        // Dropdown menu functionality
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) {
            dropdown.addEventListener('mouseenter', () => {
                dropdown.classList.add('active');
            });
            
            dropdown.addEventListener('mouseleave', () => {
                dropdown.classList.remove('active');
            });
        }

        // Search toggle
        const searchToggle = document.querySelector('.search-toggle');
        if (searchToggle) {
            searchToggle.addEventListener('click', () => {
                // Implementar funcionalidad de búsqueda si es necesario
                console.log('Búsqueda activada');
            });
        }

        // Actualizar contador del carrito
        updateCartCounter();
    }

    function updateCartCounter() {
        // Obtener carrito del localStorage
        const cart = JSON.parse(localStorage.getItem('artesana_cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        // Actualizar contador
        const cartCounter = document.getElementById('cartCount');
        if (cartCounter) {
            cartCounter.textContent = totalItems;
            cartCounter.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }

    function createFallbackHeader() {
        const basePath = getBasePath();
        return `
            <header class="header">
                <div class="container">
                    <div class="header-content">
                        <div class="logo">
                            <a href="${basePath}index.html">
                                <img src="${basePath}assets/images/logo.webp" alt="Estudio Artesana" class="logo-img">
                            </a>
                        </div>
                        <nav class="nav">
                            <ul class="nav-list">
                                <li class="nav-item">
                                    <a href="${basePath}index.html" class="nav-link ${getActiveClass('home')}">INICIO</a>
                                </li>
                                <li class="nav-item">
                                    <a href="${basePath}tienda.html" class="nav-link ${getActiveClass('tienda')}">TIENDA</a>
                                </li>
                                <li class="nav-item">
                                    <a href="${basePath}sobre-nosotros/index.html" class="nav-link ${getActiveClass('sobre-nosotros')}">SOBRE NOSOTROS</a>
                                </li>
                            </ul>
                        </nav>
                        <div class="header-icons">
                            <a href="#carrito" class="header-icon cart-icon">
                                <i class="fas fa-shopping-cart"></i>
                                <span class="cart-count" id="cartCount">0</span>
                            </a>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    // Función para actualizar el contador del carrito desde fuera
    window.updateHeaderCartCounter = updateCartCounter;

    // Cargar header cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHeader);
    } else {
        loadHeader();
    }

})();

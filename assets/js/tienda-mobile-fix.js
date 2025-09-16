/**
 * Tienda Mobile Fix - Correcciones específicas para la página de la tienda
 * Soluciona errores de main.js y asegura que la búsqueda móvil funcione correctamente
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Iniciando correcciones específicas de la tienda...');
    
    // ============================================
    // FIX 1: CORRECCIÓN DE ERRORES DE MAIN.JS
    // ============================================
    
    // Override de initHeaderScroll para evitar errores con header null
    function safeInitHeaderScroll() {
        const header = document.querySelector('.header');
        
        // Si no hay header, no ejecutar la función
        if (!header) {
            console.log('⚠️ Header no encontrado, omitiendo efectos de scroll');
            return;
        }
        
        let lastScrollY = 0;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 100) {
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
            
            // Hide header when scrolling down, show when scrolling up
            if (currentScrollY > lastScrollY && currentScrollY > 200) {
                header.classList.add('header-hidden');
            } else {
                header.classList.remove('header-hidden');
            }
            
            lastScrollY = currentScrollY;
        });
        
        console.log('✅ Header scroll effects inicializados correctamente');
    }
    
    // ============================================
    // FIX 2: FORZAR OCULTAMIENTO DE BÚSQUEDA EN MÓVIL
    // ============================================
    
    function forceMobileSearchHide() {
        const searchBar = document.getElementById('searchBarSection');
        const mobileToggle = document.querySelector('.mobile-search-toggle');
        
        if (searchBar && mobileToggle) {
            // Función para verificar y aplicar estilos móviles
            function checkAndApplyMobileStyles() {
                const isMobile = window.innerWidth <= 768;
                
                if (isMobile) {
                    // Forzar ocultamiento de la búsqueda superior
                    searchBar.style.display = 'none';
                    mobileToggle.style.display = 'block';
                    
                    console.log('📱 Estilos móviles aplicados - búsqueda superior oculta');
                } else {
                    // Mostrar búsqueda superior en desktop
                    searchBar.style.display = 'block';
                    mobileToggle.style.display = 'none';
                    
                    console.log('💻 Estilos desktop aplicados - búsqueda superior visible');
                }
            }
            
            // Aplicar al cargar
            checkAndApplyMobileStyles();
            
            // Aplicar al cambiar tamaño de ventana
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(checkAndApplyMobileStyles, 100);
            });
        }
    }
    
    // ============================================
    // FIX 3: MEJORAR FUNCIONALIDAD DE BÚSQUEDA MÓVIL
    // ============================================
    
    function enhanceMobileSearch() {
        const mobileToggle = document.getElementById('mobileSearchToggle');
        const mobileContainer = document.getElementById('mobileSearchContainer');
        const mobileInput = document.getElementById('mobileSearchInput');
        const desktopInput = document.getElementById('searchInput');
        
        if (mobileToggle && mobileContainer) {
            // Mejorar la funcionalidad de toggle
            mobileToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const isActive = this.classList.contains('active');
                
                if (isActive) {
                    // Ocultar
                    this.classList.remove('active');
                    mobileContainer.classList.remove('show');
                    console.log('📱 Búsqueda móvil cerrada');
                } else {
                    // Mostrar
                    this.classList.add('active');
                    mobileContainer.classList.add('show');
                    
                    // Focus después de la animación
                    setTimeout(() => {
                        if (mobileInput) {
                            mobileInput.focus();
                        }
                    }, 300);
                    
                    console.log('📱 Búsqueda móvil abierta');
                }
            });
            
            // Sincronización mejorada
            if (mobileInput && desktopInput) {
                mobileInput.addEventListener('input', function() {
                    desktopInput.value = this.value;
                });
                
                desktopInput.addEventListener('input', function() {
                    mobileInput.value = this.value;
                });
                
                console.log('🔄 Sincronización de búsqueda configurada');
            }
        }
    }
    
    // ============================================
    // FIX 4: VERIFICACIÓN DE ELEMENTOS CRÍTICOS
    // ============================================
    
    function verifyElements() {
        const elements = {
            'Botón móvil': document.getElementById('mobileSearchToggle'),
            'Container móvil': document.getElementById('mobileSearchContainer'),
            'Input móvil': document.getElementById('mobileSearchInput'),
            'Input desktop': document.getElementById('searchInput'),
            'Sección de búsqueda': document.getElementById('searchBarSection')
        };
        
        console.log('🔍 Verificando elementos críticos:');
        
        Object.entries(elements).forEach(([name, element]) => {
            if (element) {
                console.log(`✅ ${name}: Encontrado`);
            } else {
                console.warn(`❌ ${name}: No encontrado`);
            }
        });
    }
    
    // ============================================
    // FIX 5: APLICAR CSS ADICIONAL SI ES NECESARIO
    // ============================================
    
    function applyAdditionalCSS() {
        const additionalStyles = document.createElement('style');
        additionalStyles.textContent = `
            /* Asegurar que los estilos móviles se apliquen correctamente */
            @media (max-width: 768px) {
                .search-bar {
                    display: none !important;
                }
                
                .mobile-search-toggle {
                    display: block !important;
                }
                
                .mobile-search-container {
                    display: block !important;
                }
            }
            
            @media (min-width: 769px) {
                .search-bar {
                    display: block !important;
                }
                
                .mobile-search-toggle {
                    display: none !important;
                }
                
                .mobile-search-container {
                    display: none !important;
                }
            }
            
            /* Mejoras de animación */
            .mobile-search-container {
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            
            .mobile-search-btn .toggle-icon {
                transition: transform 0.3s ease !important;
            }
            
            .mobile-search-btn.active .toggle-icon {
                transform: rotate(180deg) !important;
            }
        `;
        
        document.head.appendChild(additionalStyles);
        console.log('🎨 Estilos adicionales aplicados');
    }
    
    // ============================================
    // EJECUTAR TODAS LAS CORRECCIONES
    // ============================================
    
    // Esperar un poco para asegurar que todos los elementos estén cargados
    setTimeout(() => {
        console.log('🚀 Ejecutando correcciones de la tienda...');
        
        // Verificar elementos
        verifyElements();
        
        // Aplicar correcciones
        safeInitHeaderScroll();
        forceMobileSearchHide();
        enhanceMobileSearch();
        applyAdditionalCSS();
        
        console.log('✅ Todas las correcciones aplicadas');
        
        // Verificar estado final
        const isMobile = window.innerWidth <= 768;
        console.log(`📱 Detectado: ${isMobile ? 'Móvil' : 'Desktop'} (${window.innerWidth}px)`);
        
    }, 500);
});

// ============================================
// FUNCIÓN GLOBAL PARA BÚSQUEDA MÓVIL
// ============================================

window.searchProductsMobile = function() {
    console.log('🔍 Ejecutando búsqueda móvil...');
    
    // Usar la función de búsqueda existente si está disponible
    if (typeof searchProducts === 'function') {
        searchProducts();
    } else if (typeof window.artesanaAPI !== 'undefined' && window.artesanaAPI.searchProducts) {
        // Usar API de búsqueda si está disponible
        const query = document.getElementById('mobileSearchInput')?.value || '';
        window.artesanaAPI.searchProducts(query);
    } else {
        console.log('⚠️ Función de búsqueda no encontrada, implementando búsqueda básica...');
        // Implementación básica de búsqueda
        const query = document.getElementById('mobileSearchInput')?.value || '';
        if (query.trim()) {
            console.log(`Buscando: "${query}"`);
            // Aquí se podría implementar lógica de búsqueda básica
        }
    }
};

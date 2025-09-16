/**
 * Fix para la navegación del panel de administración
 * Corrige el problema del enlace de inventario en el menú lateral
 */

// Función para arreglar la navegación de inventario
function fixInventoryNavigation() {
    // Buscar el enlace de inventario en el sidebar
    const inventarioLink = document.querySelector('a[href="inventario.html"]');
    
    if (inventarioLink) {
        // Cambiar la URL al nuevo panel mejorado
        inventarioLink.href = 'inventory-panel-improved.html';
        
        // Asegurar que se abra en la misma pestaña
        inventarioLink.target = '';
        
        // Agregar evento de clic para navegación suave
        inventarioLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'inventory-panel-improved.html';
        });
        
        console.log('✅ Navegación de inventario corregida');
    }
}

// Función para mejorar toda la navegación del sidebar
function improveAdminNavigation() {
    // Mapeo de rutas nuevas
    const navigationRoutes = {
        'inventario.html': 'inventory-panel-improved.html',
        // Agregar más rutas aquí cuando sea necesario
    };
    
    // Actualizar todos los enlaces del sidebar
    const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        if (href && navigationRoutes[href]) {
            link.href = navigationRoutes[href];
            console.log(`✅ Ruta actualizada: ${href} → ${navigationRoutes[href]}`);
        }
        
        // Agregar indicador visual para enlaces activos
        link.addEventListener('click', function() {
            // Remover clase active de todos los enlaces
            sidebarLinks.forEach(l => l.classList.remove('active'));
            // Agregar clase active al enlace clickeado
            this.classList.add('active');
        });
    });
}

// Función para añadir indicadores de estado
function addStatusIndicators() {
    const inventarioLink = document.querySelector('a[href*="inventory"]');
    
    if (inventarioLink) {
        // Crear indicador de "nuevo" o "mejorado"
        const indicator = document.createElement('span');
        indicator.style.cssText = `
            background: #28a745;
            color: white;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 10px;
            margin-left: 8px;
            font-weight: 500;
        `;
        indicator.textContent = 'MEJORADO';
        
        inventarioLink.appendChild(indicator);
    }
}

// Función para manejar errores de navegación
function handleNavigationErrors() {
    // Interceptar clics en enlaces rotos
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        
        if (link && link.href) {
            const url = new URL(link.href, window.location.origin);
            
            // Si es un enlace relativo que podría estar roto
            if (url.pathname.endsWith('.html')) {
                // Verificar si el archivo existe (simulado)
                if (url.pathname.includes('inventario.html')) {
                    e.preventDefault();
                    window.location.href = 'inventory-panel-improved.html';
                    return;
                }
            }
        }
    });
}

// Función para sincronizar el título de la página
function syncPageTitle() {
    const currentPage = window.location.pathname.split('/').pop();
    const titleElement = document.getElementById('pageTitle');
    
    const titles = {
        'inventory-panel-improved.html': 'Panel de Inventario',
        'dashboard.html': 'Dashboard',
        'index.html': 'Dashboard Principal'
    };
    
    if (titleElement && titles[currentPage]) {
        titleElement.textContent = titles[currentPage];
    }
}

// Función para añadir navegación breadcrumb
function addBreadcrumbNavigation() {
    const mainContent = document.querySelector('.main-content');
    const topBar = document.querySelector('.top-bar');
    
    if (mainContent && topBar) {
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'breadcrumb-nav';
        breadcrumb.style.cssText = `
            background: white;
            padding: 10px 30px;
            border-radius: 5px;
            margin-bottom: 15px;
            font-size: 14px;
            color: #6c757d;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `;
        
        const currentPage = window.location.pathname.split('/').pop();
        let breadcrumbText = '';
        
        switch (currentPage) {
            case 'inventory-panel-improved.html':
                breadcrumbText = '<i class="fas fa-home"></i> Dashboard / <i class="fas fa-boxes"></i> Panel de Inventario';
                break;
            case 'dashboard.html':
                breadcrumbText = '<i class="fas fa-home"></i> Dashboard Principal';
                break;
            default:
                breadcrumbText = '<i class="fas fa-home"></i> Dashboard';
        }
        
        breadcrumb.innerHTML = breadcrumbText;
        mainContent.insertBefore(breadcrumb, topBar.nextSibling);
    }
}

// Función principal de inicialización
function initializeNavigationFixes() {
    console.log('🔧 Inicializando correcciones de navegación...');
    
    // Ejecutar correcciones
    fixInventoryNavigation();
    improveAdminNavigation();
    addStatusIndicators();
    handleNavigationErrors();
    syncPageTitle();
    addBreadcrumbNavigation();
    
    console.log('✅ Correcciones de navegación completadas');
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNavigationFixes);
} else {
    initializeNavigationFixes();
}

// También ejecutar en cambios de URL (para SPAs)
window.addEventListener('popstate', syncPageTitle);

// Exportar funciones para uso manual
window.adminNavigationFix = {
    fixInventoryNavigation,
    improveAdminNavigation,
    addStatusIndicators,
    handleNavigationErrors,
    syncPageTitle,
    addBreadcrumbNavigation,
    init: initializeNavigationFixes
};

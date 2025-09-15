/**
 * ESTUDIO ARTESANA - Ribbon Banner Manager
 * ==========================================
 * Maneja el banner promocional superior
 */

class RibbonBannerManager {
    constructor() {
        this.ribbon = null;
        this.init();
    }

    init() {
        this.ribbon = document.getElementById('promotionalRibbon');
        if (this.ribbon) {
            this.setupEventListeners();
            this.checkVisibility();
        }
    }

    setupEventListeners() {
        // Event listener para el botón de cerrar
        const closeBtn = this.ribbon.querySelector('.ribbon-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeRibbon());
        }
    }

    checkVisibility() {
        // Verificar si el banner fue cerrado previamente
        const wasClosed = localStorage.getItem('promotionalRibbonClosed');
        if (wasClosed === 'true') {
            this.ribbon.style.display = 'none';
        }
    }

    closeRibbon() {
        if (this.ribbon) {
            this.ribbon.style.transform = 'translateY(-100%)';
            this.ribbon.style.opacity = '0';
            
            setTimeout(() => {
                this.ribbon.style.display = 'none';
            }, 300);

            // Recordar que fue cerrado
            localStorage.setItem('promotionalRibbonClosed', 'true');
        }
    }

    showRibbon() {
        if (this.ribbon) {
            this.ribbon.style.display = 'block';
            this.ribbon.style.transform = 'translateY(0)';
            this.ribbon.style.opacity = '1';
            
            // Remover del localStorage
            localStorage.removeItem('promotionalRibbonClosed');
        }
    }
}

// Función global para cerrar el ribbon (compatibilidad con onclick)
function closeRibbon() {
    if (window.ribbonBannerManager) {
        window.ribbonBannerManager.closeRibbon();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.ribbonBannerManager = new RibbonBannerManager();
});

// Exportar para uso global
window.RibbonBannerManager = RibbonBannerManager;

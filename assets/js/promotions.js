/**
 * Promotions Manager - Sistema dinámico de banner de promociones
 * Compatible con configuración en config.js
 */

class PromotionsManager {
    constructor() {
        this.container = null;
        this.currentPromotion = null;
        this.autoRotateInterval = null;
        this.autoRotateDelay = 15000; // 15 segundos por defecto
        
        this.init();
    }

    /**
     * Inicializar el gestor de promociones
     */
    init() {
        this.container = document.getElementById('monthly-promo-banner');
        
        if (!this.container) {
            console.warn('Promotion banner container not found');
            return;
        }

        this.loadPromotions();
        this.setupEventListeners();
    }

    /**
     * Cargar promociones desde la configuración
     */
    loadPromotions() {
        try {
            const promotions = this.getPromotionsConfig();
            
            if (!promotions || promotions.length === 0) {
                console.log('No promotions configured');
                this.hidePromotionBanner();
                return;
            }

            // Filtrar promociones activas
            const activePromotions = this.filterActivePromotions(promotions);
            
            if (activePromotions.length === 0) {
                console.log('No active promotions found');
                this.hidePromotionBanner();
                return;
            }

            // Mostrar la primera promoción activa
            this.currentPromotion = activePromotions[0];
            this.renderPromotion(this.currentPromotion);
            
            // Si hay múltiples promociones, configurar rotación automática
            if (activePromotions.length > 1) {
                this.setupAutoRotation(activePromotions);
            }

        } catch (error) {
            console.error('Error loading promotions:', error);
            this.hidePromotionBanner();
        }
    }

    /**
     * Obtener configuración de promociones
     */
    getPromotionsConfig() {
        // Intentar obtener desde config.js global
        if (typeof window.siteConfig !== 'undefined' && window.siteConfig.promotions) {
            return window.siteConfig.promotions;
        }
        
        // Fallback a configuración por defecto
        return [];
    }

    /**
     * Filtrar promociones activas basándose en fechas
     */
    filterActivePromotions(promotions) {
        const now = new Date();
        
        return promotions.filter(promotion => {
            if (!promotion.enabled) return false;
            
            // Si no hay fechas definidas, se considera activa
            if (!promotion.startDate && !promotion.endDate) return true;
            
            const startDate = promotion.startDate ? new Date(promotion.startDate) : null;
            const endDate = promotion.endDate ? new Date(promotion.endDate) : null;
            
            // Verificar si está dentro del rango de fechas
            if (startDate && now < startDate) return false;
            if (endDate && now > endDate) return false;
            
            return true;
        });
    }

    /**
     * Renderizar una promoción específica
     */
    renderPromotion(promotion) {
        if (!this.container || !promotion) return;

        const { text, discount, backgroundColor, textColor, link, animation } = promotion;
        
        // Aplicar estilos personalizados si están definidos
        if (backgroundColor) {
            this.container.style.background = backgroundColor;
        }
        if (textColor) {
            this.container.style.color = textColor;
        }

        // Crear contenido HTML
        const content = `
            <div class="promo-content">
                ${text ? `<span class="promo-text">${text}</span>` : ''}
                ${discount ? `<span class="promo-discount">${discount}</span>` : ''}
            </div>
            <button class="promo-close" onclick="promotionsManager.closePromotion()" aria-label="Cerrar promoción">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.container.innerHTML = content;
        
        // Agregar enlace si está definido
        if (link) {
            this.container.style.cursor = 'pointer';
            this.container.onclick = () => window.open(link, '_blank');
        }

        // Aplicar animación si está definida
        if (animation) {
            this.container.style.animation = animation;
        }

        // Mostrar el banner
        this.showPromotionBanner();
        
        console.log('Promotion rendered:', promotion.text || promotion.discount);
    }

    /**
     * Configurar rotación automática de promociones
     */
    setupAutoRotation(promotions) {
        if (promotions.length <= 1) return;

        let currentIndex = 0;
        
        this.autoRotateInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % promotions.length;
            this.currentPromotion = promotions[currentIndex];
            this.renderPromotion(this.currentPromotion);
        }, this.autoRotateDelay);
    }

    /**
     * Mostrar el banner de promociones
     */
    showPromotionBanner() {
        if (!this.container) return;
        
        this.container.style.display = 'block';
        this.container.classList.add('slideDown');
        
        // Remover la clase después de la animación
        setTimeout(() => {
            this.container.classList.remove('slideDown');
        }, 500);
    }

    /**
     * Ocultar el banner de promociones
     */
    hidePromotionBanner() {
        if (!this.container) return;
        
        this.container.style.display = 'none';
        this.clearAutoRotation();
    }

    /**
     * Cerrar promoción manualmente
     */
    closePromotion() {
        this.hidePromotionBanner();
        
        // Guardar en localStorage que el usuario cerró la promoción
        if (this.currentPromotion && this.currentPromotion.id) {
            localStorage.setItem(`promo_closed_${this.currentPromotion.id}`, 'true');
        }
    }

    /**
     * Verificar si una promoción fue cerrada por el usuario
     */
    isPromotionClosed(promotion) {
        if (!promotion.id) return false;
        return localStorage.getItem(`promo_closed_${promotion.id}`) === 'true';
    }

    /**
     * Limpiar rotación automática
     */
    clearAutoRotation() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
        }
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Listener para cambios de configuración en tiempo real (desarrollo)
        if (typeof window.siteConfig !== 'undefined') {
            // Recargar promociones si la configuración cambia
            const originalPromotions = JSON.stringify(this.getPromotionsConfig());
            setInterval(() => {
                const currentPromotions = JSON.stringify(this.getPromotionsConfig());
                if (currentPromotions !== originalPromotions) {
                    this.clearAutoRotation();
                    this.loadPromotions();
                }
            }, 30000); // Verificar cada 30 segundos
        }
    }

    /**
     * Recargar promociones manualmente
     */
    reload() {
        this.clearAutoRotation();
        this.loadPromotions();
    }

    /**
     * Obtener estadísticas de promociones
     */
    getStats() {
        const promotions = this.getPromotionsConfig();
        const activePromotions = this.filterActivePromotions(promotions);
        
        return {
            total: promotions.length,
            active: activePromotions.length,
            current: this.currentPromotion,
            autoRotating: !!this.autoRotateInterval
        };
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.promotionsManager = new PromotionsManager();
    });
} else {
    window.promotionsManager = new PromotionsManager();
}

// Funciones globales para debug
window.reloadPromotions = () => {
    if (window.promotionsManager) {
        window.promotionsManager.reload();
    }
};

window.getPromotionsStats = () => {
    if (window.promotionsManager) {
        return window.promotionsManager.getStats();
    }
};

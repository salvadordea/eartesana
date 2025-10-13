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

        // Event listener para copiar código de cupón
        const copyCodeBtn = this.ribbon.querySelector('.ribbon-copy-code');
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.copyCouponCode(copyCodeBtn.dataset.code);
            });
        }

        // Event listener para clic en el código de cupón
        const couponCode = this.ribbon.querySelector('.ribbon-coupon-code');
        if (couponCode) {
            couponCode.addEventListener('click', (e) => {
                e.preventDefault();
                this.copyCouponCode(couponCode.textContent);
            });
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

    /**
     * Copy coupon code to clipboard
     * @param {string} code - Coupon code to copy
     */
    async copyCouponCode(code) {
        try {
            await navigator.clipboard.writeText(code);

            // Visual feedback
            this.showCopyFeedback();

            console.log('✅ Coupon code copied:', code);
        } catch (err) {
            console.error('❌ Failed to copy code:', err);

            // Fallback for older browsers
            this.copyToClipboardFallback(code);
        }
    }

    /**
     * Show visual feedback when code is copied
     */
    showCopyFeedback() {
        const copyBtn = this.ribbon.querySelector('.ribbon-copy-code');
        const couponCode = this.ribbon.querySelector('.ribbon-coupon-code');

        if (copyBtn) {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
            copyBtn.style.background = '#28a745';

            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.background = '';
            }, 2000);
        } else if (couponCode) {
            const originalBg = couponCode.style.background;
            couponCode.style.background = '#28a745';
            couponCode.style.transition = 'background 0.3s';

            setTimeout(() => {
                couponCode.style.background = originalBg;
            }, 1500);
        }
    }

    /**
     * Fallback method for copying to clipboard (older browsers)
     * @param {string} text - Text to copy
     */
    copyToClipboardFallback(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            this.showCopyFeedback();
            console.log('✅ Coupon code copied (fallback):', text);
        } catch (err) {
            console.error('❌ Fallback copy failed:', err);
        }

        document.body.removeChild(textArea);
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

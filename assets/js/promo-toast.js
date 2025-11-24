/**
 * Promo Toast Manager - Minimalista
 * Sistema de notificación toast elegante para promociones
 */

class PromoToast {
    constructor() {
        this.toast = null;
        this.badge = null;
        this.isExpanded = false;
        this.isMinimized = false;
        this.autoMinimizeTimer = null;
        this.hasBeenShown = false;
        this.scrollThreshold = 150; // px de scroll para mostrar

        this.init();
    }

    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.toast = document.getElementById('promoToast');
        if (!this.toast) {
            console.warn('⚠️ Promo toast element not found');
            return;
        }

        this.badge = this.toast.querySelector('.toast-badge');

        // Verificar si fue cerrado permanentemente
        if (this.wasClosed()) {
            this.hidePermanently();
            return;
        }

        // Inicializar en estado minimizado
        this.toast.classList.add('minimized');
        this.isMinimized = true;

        // Escuchar scroll para mostrar
        this.initScrollTrigger();

        // Event listeners
        this.setupEventListeners();

        console.log('✅ Promo toast initialized');
    }

    initScrollTrigger() {
        let scrolled = false;

        window.addEventListener('scroll', () => {
            if (scrolled || this.hasBeenShown) return;

            if (window.scrollY > this.scrollThreshold) {
                scrolled = true;
                this.hasBeenShown = true;
                this.expand();

                // Auto-minimizar después de 8 segundos
                this.autoMinimizeTimer = setTimeout(() => {
                    this.minimize();
                }, 8000);
            }
        }, { passive: true });
    }

    setupEventListeners() {
        // Click en badge para expandir
        if (this.badge) {
            this.badge.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.isMinimized) {
                    this.expand();
                    // Auto-minimizar de nuevo después de 8s
                    this.autoMinimizeTimer = setTimeout(() => {
                        this.minimize();
                    }, 8000);
                }
            });
        }

        // Prevenir que el toast se cierre al hacer click dentro
        this.toast.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    expand() {
        if (!this.toast || this.isExpanded) return;

        this.toast.classList.remove('minimized');
        this.toast.classList.add('expanded');
        this.isMinimized = false;
        this.isExpanded = true;

        // Animación de entrada
        this.toast.style.animation = 'toastSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards';

        console.log('📢 Promo toast expanded');
    }

    minimize() {
        if (!this.toast || this.isMinimized) return;

        this.toast.classList.remove('expanded');
        this.toast.classList.add('minimized');
        this.isMinimized = true;
        this.isExpanded = false;

        // Limpiar timer
        if (this.autoMinimizeTimer) {
            clearTimeout(this.autoMinimizeTimer);
            this.autoMinimizeTimer = null;
        }

        console.log('🔽 Promo toast minimized');
    }

    close() {
        if (!this.toast) return;

        // Animación de salida
        this.toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';

        setTimeout(() => {
            this.toast.style.display = 'none';
            this.saveClosed();
        }, 300);

        // Limpiar timer
        if (this.autoMinimizeTimer) {
            clearTimeout(this.autoMinimizeTimer);
            this.autoMinimizeTimer = null;
        }

        console.log('✖️ Promo toast closed');
    }

    hidePermanently() {
        if (this.toast) {
            this.toast.style.display = 'none';
        }
    }

    saveClosed() {
        // Guardar por 1 hora
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1);

        localStorage.setItem('promoToastClosed', JSON.stringify({
            closed: true,
            expiry: expiry.toISOString()
        }));
    }

    wasClosed() {
        const data = localStorage.getItem('promoToastClosed');
        if (!data) return false;

        try {
            const parsed = JSON.parse(data);
            const expiry = new Date(parsed.expiry);
            const now = new Date();

            if (now > expiry) {
                // Expiró, limpiar
                localStorage.removeItem('promoToastClosed');
                return false;
            }

            return parsed.closed;
        } catch (e) {
            localStorage.removeItem('promoToastClosed');
            return false;
        }
    }

    async copyCode() {
        const codeElement = this.toast.querySelector('.toast-code');
        if (!codeElement) return;

        const code = codeElement.getAttribute('data-code') || codeElement.textContent;
        const copyBtn = this.toast.querySelector('.toast-copy-btn');

        try {
            await navigator.clipboard.writeText(code);

            // Feedback visual
            if (copyBtn) {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copiado';
                copyBtn.style.background = 'rgba(40, 167, 69, 0.2)';
                copyBtn.style.borderColor = 'rgba(40, 167, 69, 0.6)';
                copyBtn.style.color = '#28a745';

                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    copyBtn.style.background = '';
                    copyBtn.style.borderColor = '';
                    copyBtn.style.color = '';
                }, 2000);
            }

            // Expandir de nuevo si estaba minimizado
            if (this.isMinimized) {
                this.expand();
                setTimeout(() => this.minimize(), 3000);
            }

            console.log('📋 Promo code copied:', code);
        } catch (err) {
            console.error('❌ Failed to copy code:', err);
            // Fallback: mostrar alert
            alert('Código de promoción: ' + code);
        }
    }

    updateContent(promo) {
        if (!this.toast) return;

        const discountEl = this.toast.querySelector('.toast-discount');
        const codeEl = this.toast.querySelector('.toast-code');

        if (discountEl && promo.discount) {
            discountEl.textContent = promo.discount;
        }

        if (codeEl && promo.code) {
            // Validar longitud del código
            let displayCode = promo.code;
            if (promo.code.length > 20) {
                displayCode = promo.code.substring(0, 17) + '...';
            }

            codeEl.textContent = displayCode;
            codeEl.setAttribute('data-code', promo.code);
            codeEl.setAttribute('title', promo.code); // Tooltip completo
        }

        console.log('✅ Promo toast content updated:', promo);
    }

    // Método público para forzar actualización
    forceUpdate(promo) {
        this.updateContent(promo);

        // Si estaba cerrado, resetear
        localStorage.removeItem('promoToastClosed');

        if (this.toast) {
            this.toast.style.display = '';
            this.minimize();
        }
    }
}

// Funciones globales para event handlers inline
let promoToastInstance = null;

function expandPromoToast() {
    if (promoToastInstance) {
        promoToastInstance.expand();
    }
}

function closePromoToast() {
    if (promoToastInstance) {
        promoToastInstance.close();
    }
}

function copyPromoToast() {
    if (promoToastInstance) {
        promoToastInstance.copyCode();
    }
}

// Inicializar automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        promoToastInstance = new PromoToast();
    });
} else {
    promoToastInstance = new PromoToast();
}

// Exportar para uso en otros scripts
if (typeof window !== 'undefined') {
    window.PromoToast = PromoToast;
    window.promoToastInstance = promoToastInstance;
}

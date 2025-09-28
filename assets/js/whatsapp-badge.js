/**
 * Floating WhatsApp Badge - Sitewide Component
 * Displays a floating WhatsApp button that gets the number from admin settings
 */

class WhatsAppBadge {
    constructor() {
        this.storageKey = 'contactInfo';
        this.fallbackNumber = '+5212345678490';
        this.defaultMessage = '¡Hola! Me interesa conocer más sobre sus productos artesanales.';

        this.init();
    }

    /**
     * Get WhatsApp number from admin settings or use fallback
     */
    getWhatsAppNumber() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const contactData = JSON.parse(savedData);
                if (contactData.whatsappNumber) {
                    console.log('📱 WhatsApp: Número cargado desde admin:', contactData.whatsappNumber);
                    return contactData.whatsappNumber;
                }
            }
        } catch (error) {
            console.warn('⚠️ WhatsApp: Error al cargar número desde admin:', error);
        }

        console.log('📱 WhatsApp: Usando número por defecto');
        return this.fallbackNumber;
    }

    /**
     * Clean phone number for WhatsApp URL
     */
    cleanPhoneNumber(phone) {
        return phone.replace(/[^\d]/g, '');
    }

    /**
     * Generate WhatsApp URL with message
     */
    generateWhatsAppURL(phone, message) {
        const cleanPhone = this.cleanPhoneNumber(phone);
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    }

    /**
     * Create and inject the WhatsApp badge
     */
    createBadge() {
        // Check if badge already exists
        if (document.querySelector('.whatsapp-float')) {
            return;
        }

        const whatsappNumber = this.getWhatsAppNumber();
        const whatsappURL = this.generateWhatsAppURL(whatsappNumber, this.defaultMessage);

        // Create badge HTML
        const badge = document.createElement('a');
        badge.className = 'whatsapp-float';
        badge.href = whatsappURL;
        badge.target = '_blank';
        badge.rel = 'noopener noreferrer';
        badge.setAttribute('aria-label', 'Contactar por WhatsApp');
        badge.title = 'Contactar por WhatsApp';

        badge.innerHTML = `
            <i class="fab fa-whatsapp"></i>
            <span class="tooltip">¡Contáctanos por WhatsApp!</span>
        `;

        // Add click tracking
        badge.addEventListener('click', () => {
            console.log('📱 WhatsApp: Usuario hizo clic en el badge');

            // Optional: Send analytics event
            if (typeof gtag === 'function') {
                gtag('event', 'whatsapp_click', {
                    event_category: 'engagement',
                    event_label: 'floating_badge'
                });
            }
        });

        // Inject badge into page
        document.body.appendChild(badge);

        console.log('✅ WhatsApp badge creado y añadido a la página');
    }

    /**
     * Update badge with new WhatsApp number
     */
    updateBadge() {
        const badge = document.querySelector('.whatsapp-float');
        if (badge) {
            const whatsappNumber = this.getWhatsAppNumber();
            const whatsappURL = this.generateWhatsAppURL(whatsappNumber, this.defaultMessage);
            badge.href = whatsappURL;
            console.log('✅ WhatsApp badge actualizado con nuevo número');
        }
    }

    /**
     * Remove badge (if needed)
     */
    removeBadge() {
        const badge = document.querySelector('.whatsapp-float');
        if (badge) {
            badge.remove();
            console.log('🗑️ WhatsApp badge removido');
        }
    }

    /**
     * Initialize the WhatsApp badge
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createBadge());
        } else {
            this.createBadge();
        }

        // Listen for admin updates
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                console.log('📱 WhatsApp: Datos actualizados desde admin');
                this.updateBadge();
            }
        });

        // Listen for custom events (for same-tab updates)
        window.addEventListener('contactInfoUpdated', () => {
            console.log('📱 WhatsApp: Datos actualizados via evento personalizado');
            this.updateBadge();
        });
    }
}

// Create global instance
window.WhatsAppBadge = new WhatsAppBadge();

// Make it available for manual refresh
window.refreshWhatsAppBadge = function() {
    if (window.WhatsAppBadge) {
        window.WhatsAppBadge.updateBadge();
    }
};
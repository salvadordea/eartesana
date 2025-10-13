/**
 * Contact Data Loader - Cargar información de contacto desde el panel de admin
 * Este script lee los datos guardados desde el panel de administración y los aplica
 * automáticamente a los elementos correspondientes en index.html
 */

class ContactDataLoader {
    constructor() {
        this.storageKey = 'contactInfo';
        this.fallbackData = {
            // Trust Icons
            trustIcon1Text: 'Envío Gratis*',
            trustIcon1Icon: 'fas fa-truck',
            trustIcon2Text: 'Hecho a Mano',
            trustIcon2Icon: 'fas fa-hand-holding-heart',
            trustIcon3Text: 'Calidad Premium',
            trustIcon3Icon: 'fas fa-shield-alt',
            shippingDisclaimer: '*En compras superiores a $2,000.00',

            // Promotional Banner
            promoEnabled: true,
            promoDiscount: '25% OFF',
            promoDisclaimer: '*en tu primera compra',
            promoExpirationDate: null,

            // Social Media
            instagramUrl: '#',
            facebookUrl: '#',
            whatsappNumber: '+5212345678490',

            // Contact Cards
            locationText: 'Ciudad de México, México',
            phoneNumber: '+52 123 456 7890',
            contactEmail: 'info@estudioartesana.com',
            businessHours: 'Lun - Vie: 9:00 AM - 6:00 PM\nSáb: 10:00 AM - 4:00 PM'
        };
    }

    /**
     * Cargar datos desde Supabase (con fallback a localStorage)
     */
    async loadContactData() {
        // Intentar cargar desde Supabase primero
        if (window.SiteSettingsService) {
            try {
                const data = await window.SiteSettingsService.getSetting('contactInfo');
                if (data) {
                    console.log('📞 Datos de contacto cargados desde Supabase:', data);
                    const mergedData = { ...this.fallbackData, ...data };

                    // Guardar en localStorage para que otros servicios puedan usarlo
                    try {
                        localStorage.setItem(this.storageKey, JSON.stringify(mergedData));
                        console.log('💾 Datos guardados en localStorage para WhatsApp badge');

                        // Disparar evento personalizado para notificar a otros componentes
                        window.dispatchEvent(new CustomEvent('contactInfoUpdated', { detail: mergedData }));
                    } catch (e) {
                        console.warn('⚠️ Error al guardar en localStorage:', e);
                    }

                    return mergedData;
                }
            } catch (error) {
                console.warn('⚠️ Error al cargar desde Supabase, usando fallback:', error);
            }
        }

        // Fallback: Intentar desde localStorage (cache antiguo)
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const contactData = JSON.parse(savedData);
                console.log('📞 Datos de contacto cargados desde localStorage:', contactData);
                return { ...this.fallbackData, ...contactData };
            }
        } catch (error) {
            console.warn('⚠️ Error al cargar datos guardados:', error);
        }

        console.log('📞 Usando datos por defecto de contacto');
        return this.fallbackData;
    }

    /**
     * Aplicar datos de Trust Icons
     */
    applyTrustIcons(data) {
        // Trust Icon 1
        const trustIcon1 = document.querySelector('.trust-item:nth-child(1)');
        if (trustIcon1) {
            const icon = trustIcon1.querySelector('i');
            const text = trustIcon1.querySelector('span');
            if (icon) icon.className = data.trustIcon1Icon;
            if (text) text.textContent = data.trustIcon1Text;
        }

        // Trust Icon 2
        const trustIcon2 = document.querySelector('.trust-item:nth-child(2)');
        if (trustIcon2) {
            const icon = trustIcon2.querySelector('i');
            const text = trustIcon2.querySelector('span');
            if (icon) icon.className = data.trustIcon2Icon;
            if (text) text.textContent = data.trustIcon2Text;
        }

        // Trust Icon 3
        const trustIcon3 = document.querySelector('.trust-item:nth-child(3)');
        if (trustIcon3) {
            const icon = trustIcon3.querySelector('i');
            const text = trustIcon3.querySelector('span');
            if (icon) icon.className = data.trustIcon3Icon;
            if (text) text.textContent = data.trustIcon3Text;
        }

        // Shipping Disclaimer
        const disclaimer = document.querySelector('.shipping-disclaimer small');
        if (disclaimer && data.shippingDisclaimer) {
            disclaimer.textContent = data.shippingDisclaimer;
        }

        console.log('✅ Trust icons actualizados');
    }

    /**
     * Aplicar descuento promocional
     */
    applyPromoDiscount(data) {
        const promoBanner = document.getElementById('monthlyPromoBanner');

        // Check if promo is enabled
        const isEnabled = data.promoEnabled !== false; // Default to true if not specified

        // Check if promo has expired
        let isExpired = false;
        if (data.promoExpirationDate) {
            const expirationDate = new Date(data.promoExpirationDate);
            const now = new Date();
            isExpired = now > expirationDate;
        }

        // Show or hide banner based on enabled status and expiration
        if (promoBanner) {
            if (isEnabled && !isExpired) {
                promoBanner.style.display = 'flex';
                console.log('✅ Banner promocional activado');
            } else {
                promoBanner.style.display = 'none';
                if (isExpired) {
                    console.log('⏰ Banner promocional expirado');
                } else {
                    console.log('🚫 Banner promocional desactivado');
                }
                return; // Don't update content if hidden
            }
        }

        // Update discount text
        const promoDiscountElement = document.getElementById('promoDiscount') || document.querySelector('.promo-discount');
        if (promoDiscountElement && data.promoDiscount) {
            promoDiscountElement.textContent = data.promoDiscount;
        }

        // Update disclaimer text (if provided)
        const promoDisclaimerElement = document.getElementById('promoDisclaimer') || document.querySelector('.promo-disclaimer');
        if (promoDisclaimerElement) {
            if (data.promoDisclaimer) {
                promoDisclaimerElement.textContent = data.promoDisclaimer;
                promoDisclaimerElement.style.display = 'block';
            } else {
                promoDisclaimerElement.style.display = 'none';
            }
        }

        console.log('✅ Descuento promocional actualizado');
    }

    /**
     * Aplicar datos de redes sociales
     */
    applySocialMedia(data) {
        // Helper function to ensure URL has protocol
        const ensureProtocol = (url) => {
            if (!url || url === '#') return '#';
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return url;
            }
            return `https://${url}`;
        };

        // Instagram - Hero section
        const heroInstagramLink = document.getElementById('heroInstagramLink');
        if (heroInstagramLink && data.instagramUrl) {
            heroInstagramLink.href = ensureProtocol(data.instagramUrl);
        }

        // Facebook - Hero section
        const heroFacebookLink = document.getElementById('heroFacebookLink');
        if (heroFacebookLink && data.facebookUrl) {
            heroFacebookLink.href = ensureProtocol(data.facebookUrl);
        }

        // WhatsApp - Hero section
        const heroWhatsAppLink = document.getElementById('heroWhatsAppLink');
        if (heroWhatsAppLink && data.whatsappNumber) {
            const cleanNumber = data.whatsappNumber.replace(/[^\d]/g, '');
            heroWhatsAppLink.href = `https://wa.me/${cleanNumber}`;
        }

        console.log('✅ Enlaces de redes sociales actualizados');
    }

    /**
     * Aplicar datos de las tarjetas de contacto
     */
    applyContactCards(data) {
        // Ubicación - using ID for consistent access
        const locationText = document.getElementById('contactLocationText');
        if (locationText && data.locationText) {
            locationText.textContent = data.locationText;
        }

        // Teléfono - using ID for consistent access
        const phoneLink = document.getElementById('contactPhoneLink');
        if (phoneLink && data.phoneNumber) {
            const cleanPhone = data.phoneNumber.replace(/[^\d+]/g, '');
            phoneLink.href = `tel:${cleanPhone}`;
            phoneLink.textContent = data.phoneNumber;
        }

        // Email - using ID for consistent access
        const emailLink = document.getElementById('contactEmailLink');
        if (emailLink && data.contactEmail) {
            emailLink.href = `mailto:${data.contactEmail}`;
            emailLink.textContent = data.contactEmail;
        }

        // Horarios - using ID for consistent access
        const businessHours = document.getElementById('contactBusinessHours');
        if (businessHours && data.businessHours) {
            // Convertir \n a <br> para mostrar correctamente
            businessHours.innerHTML = data.businessHours.replace(/\n/g, '<br>');
        }

        console.log('✅ Tarjetas de contacto actualizadas');
    }

    /**
     * Inicializar y aplicar todos los datos
     */
    init() {
        console.log('🔄 Inicializando ContactDataLoader...');
        
        // Esperar a que el DOM esté completamente cargado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.applyData());
        } else {
            this.applyData();
        }
    }

    /**
     * Aplicar todos los datos cargados
     */
    async applyData() {
        const contactData = await this.loadContactData();

        try {
            this.applyTrustIcons(contactData);
            this.applyPromoDiscount(contactData);
            this.applySocialMedia(contactData);
            this.applyContactCards(contactData);

            console.log('✅ Todos los datos de contacto aplicados correctamente');
        } catch (error) {
            console.error('❌ Error al aplicar datos de contacto:', error);
        }
    }

    /**
     * Refrescar datos - útil para llamar desde el panel de admin
     */
    refresh() {
        console.log('🔄 Refrescando datos de contacto...');
        this.applyData();
        
        // También actualizar el footer si está disponible
        if (window.UniversalFooter) {
            window.UniversalFooter.refresh();
        }
    }
}

// Crear instancia global
window.ContactDataLoader = new ContactDataLoader();

// Auto-inicializar
window.ContactDataLoader.init();

// Escuchar cambios en localStorage para actualización en tiempo real
window.addEventListener('storage', (e) => {
    if (e.key === 'contactInfo') {
        console.log('📱 Datos de contacto actualizados desde otra pestaña');
        window.ContactDataLoader.refresh();
    }
});

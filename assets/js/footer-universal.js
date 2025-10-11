/**
 * Universal Footer - Footer universal para todas las páginas
 * Carga el footer dinámicamente desde un archivo HTML externo y sincroniza
 * los datos de contacto desde el panel de administración
 */

class UniversalFooter {
    constructor() {
        this.storageKey = 'contactInfo';
        this.footerPath = 'components/universal-footer.html'; // Ruta por defecto
        this.fallbackData = {
            // Social Media
            instagramUrl: '#',
            facebookUrl: '#',
            whatsappNumber: '+5212345678490',
            
            // Contact Info
            contactEmail: 'info@estudioartesana.com',
            phoneNumber: '+52 123 456 7890',
            locationText: 'Ciudad de México, México',
            businessHours: 'Lun - Vie: 9:00 AM - 6:00 PM\nSáb: 10:00 AM - 4:00 PM'
        };
        
        this.init();
    }
    
    /**
     * Determinar la ruta correcta del footer según la ubicación actual
     */
    getFooterPath() {
        const path = window.location.pathname;

        if (path.includes('/admin/')) {
            return '../components/universal-footer.html';
        } else if (path.includes('/pages/')) {
            return '../../components/universal-footer.html';
        } else {
            return 'components/universal-footer.html';
        }
    }
    
    /**
     * Ajustar rutas de enlaces según la ubicación de la página
     */
    adjustPaths(footerHTML) {
        const path = window.location.pathname;
        let adjustedHTML = footerHTML;
        
        if (path.includes('/admin/')) {
            // Desde admin, ajustar rutas
            adjustedHTML = adjustedHTML.replace(/href="([^"]*(?:index\.html|pages\/))/g, 'href="../$1');
            adjustedHTML = adjustedHTML.replace(/href="\.\.\/index\.html"/g, 'href="../index.html"');
        } else if (path.includes('/pages/')) {
            // Desde pages, ajustar rutas
            adjustedHTML = adjustedHTML.replace(/href="index\.html"/g, 'href="../index.html"');
            adjustedHTML = adjustedHTML.replace(/href="pages\//g, 'href="');
        }
        
        return adjustedHTML;
    }
    
    /**
     * Cargar datos de contacto desde Supabase (con fallback a localStorage)
     */
    async loadContactData() {
        // Intentar cargar desde Supabase primero
        if (window.SiteSettingsService) {
            try {
                const data = await window.SiteSettingsService.getSetting('contactInfo');
                if (data) {
                    console.log('👟 Footer: Datos cargados desde Supabase:', data);
                    return { ...this.fallbackData, ...data };
                }
            } catch (error) {
                console.warn('⚠️ Footer: Error al cargar desde Supabase:', error);
            }
        }

        // Fallback: Intentar desde localStorage (cache antiguo)
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const contactData = JSON.parse(savedData);
                console.log('👟 Footer: Datos cargados desde localStorage:', contactData);
                return { ...this.fallbackData, ...contactData };
            }
        } catch (error) {
            console.warn('⚠️ Footer: Error al cargar datos guardados:', error);
        }

        console.log('👟 Footer: Usando datos por defecto');
        return this.fallbackData;
    }
    
    /**
     * Aplicar datos de contacto al footer
     */
    async applyContactData() {
        const data = await this.loadContactData();

        try {
            // Redes sociales
            this.applySocialMediaToFooter(data);

            // Información de contacto
            this.applyContactInfoToFooter(data);

            console.log('✅ Footer: Datos de contacto aplicados');
        } catch (error) {
            console.error('❌ Footer: Error al aplicar datos:', error);
        }
    }
    
    /**
     * Aplicar datos de redes sociales al footer
     */
    applySocialMediaToFooter(data) {
        // Helper function to ensure URL has protocol
        const ensureProtocol = (url) => {
            if (!url || url === '#') return '#';
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return url;
            }
            return `https://${url}`;
        };

        // Facebook - using new footer IDs
        const facebookLink = document.getElementById('footerFacebookLink');
        if (facebookLink && data.facebookUrl) {
            facebookLink.href = ensureProtocol(data.facebookUrl);
            console.log('✅ Facebook actualizado:', data.facebookUrl);
        }

        // Instagram - using new footer IDs
        const instagramLink = document.getElementById('footerInstagramLink');
        if (instagramLink && data.instagramUrl) {
            instagramLink.href = ensureProtocol(data.instagramUrl);
            console.log('✅ Instagram actualizado:', data.instagramUrl);
        }

        // WhatsApp - using new footer IDs
        const whatsappLink = document.getElementById('footerWhatsAppLink');
        if (whatsappLink && data.whatsappNumber) {
            const cleanNumber = data.whatsappNumber.replace(/[^\d]/g, '');
            whatsappLink.href = `https://wa.me/${cleanNumber}`;
            console.log('✅ WhatsApp footer actualizado:', data.whatsappNumber);
        }
    }
    
    /**
     * Aplicar información de contacto al footer
     */
    applyContactInfoToFooter(data) {
        // Email - using new footer IDs
        const emailLink = document.getElementById('footerEmailLink');
        if (emailLink && data.contactEmail) {
            emailLink.href = `mailto:${data.contactEmail}`;
            emailLink.textContent = data.contactEmail;
            console.log('✅ Email actualizado:', data.contactEmail);
        }

        // Teléfono - using new footer IDs
        const phoneLink = document.getElementById('footerPhoneLink');
        if (phoneLink && data.phoneNumber) {
            const cleanPhone = data.phoneNumber.replace(/[^\d+]/g, '');
            phoneLink.href = `tel:${cleanPhone}`;
            phoneLink.textContent = data.phoneNumber;
            console.log('✅ Teléfono actualizado:', data.phoneNumber);
        }

        // Ubicación - using new footer IDs
        const locationText = document.getElementById('footerLocationText');
        if (locationText && data.locationText) {
            locationText.textContent = data.locationText;
            console.log('✅ Ubicación actualizada:', data.locationText);
        }

        // Horarios - using new footer IDs
        const businessHours = document.getElementById('footerBusinessHours');
        if (businessHours && data.businessHours) {
            const hours = data.businessHours.split('\n');
            businessHours.innerHTML = hours.map(hour => `<span>${hour}</span>`).join('');
            console.log('✅ Horarios actualizados');
        }
    }
    
    /**
     * Cargar e inyectar el footer
     */
    async loadFooter() {
        const footerPath = this.getFooterPath();
        
        try {
            const response = await fetch(footerPath);
            if (!response.ok) {
                throw new Error(`No se pudo cargar el footer: ${response.status}`);
            }
            
            const footerHTML = await response.text();
            const adjustedHTML = this.adjustPaths(footerHTML);
            
            // Inyectar el footer
            document.body.insertAdjacentHTML('beforeend', adjustedHTML);

            console.log('✅ Footer universal cargado correctamente');

            // Aplicar datos de contacto después de cargar
            setTimeout(() => {
                this.applyContactData();

                // Trigger translation system to translate footer if available
                if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
                    console.log('🌐 Applying translations to footer');
                    window.TranslationSystem.applyTranslations();
                }
            }, 100);
            
        } catch (error) {
            console.error('❌ Error al cargar footer universal:', error);
            console.warn('🔄 Intentando cargar footer desde ruta alternativa...');
            
            // Intentar con ruta alternativa
            try {
                const altResponse = await fetch('components/universal-footer.html');
                if (altResponse.ok) {
                    const altFooterHTML = await altResponse.text();
                    document.body.insertAdjacentHTML('beforeend', altFooterHTML);
                    console.log('✅ Footer cargado desde ruta alternativa');
                    setTimeout(() => {
                        this.applyContactData();

                        // Trigger translation system to translate footer if available
                        if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
                            console.log('🌐 Applying translations to footer (alternative path)');
                            window.TranslationSystem.applyTranslations();
                        }
                    }, 100);
                } else {
                    throw new Error('Footer no encontrado en rutas alternativas');
                }
            } catch (altError) {
                console.error('❌ No se pudo cargar el footer desde ninguna ruta:', altError);
            }
        }
    }
    
    /**
     * Refrescar datos del footer
     */
    refresh() {
        console.log('🔄 Refrescando datos del footer...');
        this.applyContactData();
    }
    
    /**
     * Inicializar el footer universal
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.loadFooter());
        } else {
            this.loadFooter();
        }
    }
}

// Crear instancia global
window.UniversalFooter = new UniversalFooter();

// Escuchar cambios en localStorage para actualización en tiempo real
window.addEventListener('storage', (e) => {
    if (e.key === 'contactInfo') {
        console.log('📱 Footer: Datos actualizados desde otra pestaña');
        if (window.UniversalFooter) {
            window.UniversalFooter.refresh();
        }
    }
});

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
     * Cargar datos de contacto desde localStorage o usar fallback
     */
    loadContactData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const contactData = JSON.parse(savedData);
                console.log('👟 Footer: Datos de contacto cargados desde admin:', contactData);
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
    applyContactData() {
        const data = this.loadContactData();
        
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
        // Facebook
        const facebookLink = document.querySelector('footer .social-links a[aria-label="Facebook"]');
        if (facebookLink && data.facebookUrl) {
            facebookLink.href = data.facebookUrl;
        }
        
        // Instagram
        const instagramLink = document.querySelector('footer .social-links a[aria-label="Instagram"]');
        if (instagramLink && data.instagramUrl) {
            instagramLink.href = data.instagramUrl;
        }
        
        // WhatsApp
        const whatsappLink = document.querySelector('footer .social-links a[aria-label="WhatsApp"]');
        if (whatsappLink && data.whatsappNumber) {
            const cleanNumber = data.whatsappNumber.replace(/[^\d]/g, '');
            whatsappLink.href = `https://wa.me/${cleanNumber}`;
        }
    }
    
    /**
     * Aplicar información de contacto al footer
     */
    applyContactInfoToFooter(data) {
        // Email
        const emailLink = document.querySelector('footer .footer-contact a[href^="mailto:"]');
        if (emailLink && data.contactEmail) {
            emailLink.href = `mailto:${data.contactEmail}`;
            emailLink.textContent = data.contactEmail;
        }
        
        // Teléfono
        const phoneLink = document.querySelector('footer .footer-contact a[href^="tel:"]');
        if (phoneLink && data.phoneNumber) {
            const cleanPhone = data.phoneNumber.replace(/[^\d+]/g, '');
            phoneLink.href = `tel:${cleanPhone}`;
            phoneLink.textContent = data.phoneNumber;
        }
        
        // Ubicación
        const locationElement = document.querySelector('footer .footer-contact .contact-item .contact-text');
        if (locationElement && data.locationText) {
            // Verificar que sea el elemento de ubicación
            const locationItem = locationElement.closest('.contact-item');
            if (locationItem && locationItem.querySelector('i.fa-map-marker-alt')) {
                locationElement.textContent = data.locationText;
            }
        }
        
        // Horarios
        const hoursElements = document.querySelectorAll('footer .footer-contact .contact-item .contact-text');
        hoursElements.forEach(element => {
            const hoursItem = element.closest('.contact-item');
            if (hoursItem && hoursItem.querySelector('i.fa-clock')) {
                if (data.businessHours) {
                    element.innerHTML = data.businessHours.replace(/\n/g, '<br>');
                }
            }
        });
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

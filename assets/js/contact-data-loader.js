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
     * Cargar datos desde localStorage o usar fallback
     */
    loadContactData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const contactData = JSON.parse(savedData);
                console.log('📞 Datos de contacto cargados desde panel de admin:', contactData);
                return { ...this.fallbackData, ...contactData };
            }
        } catch (error) {
            console.warn('⚠️ Error al cargar datos guardados del panel:', error);
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
     * Aplicar datos de redes sociales
     */
    applySocialMedia(data) {
        // Instagram
        const instagramLink = document.querySelector('.social-link[aria-label="Instagram"]');
        if (instagramLink && data.instagramUrl) {
            instagramLink.href = data.instagramUrl;
        }

        // Facebook
        const facebookLink = document.querySelector('.social-link[aria-label="Facebook"]');
        if (facebookLink && data.facebookUrl) {
            facebookLink.href = data.facebookUrl;
        }

        // WhatsApp - crear enlace correcto
        const whatsappLink = document.querySelector('.social-link[aria-label="WhatsApp"]');
        if (whatsappLink && data.whatsappNumber) {
            // Limpiar número y crear enlace de WhatsApp
            const cleanNumber = data.whatsappNumber.replace(/[^\d]/g, '');
            whatsappLink.href = `https://wa.me/${cleanNumber}`;
        }

        console.log('✅ Enlaces de redes sociales actualizados');
    }

    /**
     * Aplicar datos de las tarjetas de contacto
     */
    applyContactCards(data) {
        // Ubicación
        const locationCard = document.querySelector('.info-card-home:nth-child(1) .info-content-home p');
        if (locationCard && data.locationText) {
            locationCard.textContent = data.locationText;
        }

        // Teléfono
        const phoneCard = document.querySelector('.info-card-home:nth-child(2) .info-content-home p a');
        const phoneText = document.querySelector('.info-card-home:nth-child(2) .info-content-home p');
        if (phoneCard && data.phoneNumber) {
            phoneCard.href = `tel:${data.phoneNumber.replace(/[^\d+]/g, '')}`;
            phoneCard.textContent = data.phoneNumber;
        } else if (phoneText && data.phoneNumber) {
            phoneText.innerHTML = `<a href="tel:${data.phoneNumber.replace(/[^\d+]/g, '')}">${data.phoneNumber}</a>`;
        }

        // Email
        const emailCard = document.querySelector('.info-card-home:nth-child(3) .info-content-home p a');
        const emailText = document.querySelector('.info-card-home:nth-child(3) .info-content-home p');
        if (emailCard && data.contactEmail) {
            emailCard.href = `mailto:${data.contactEmail}`;
            emailCard.textContent = data.contactEmail;
        } else if (emailText && data.contactEmail) {
            emailText.innerHTML = `<a href="mailto:${data.contactEmail}">${data.contactEmail}</a>`;
        }

        // Horarios
        const hoursCard = document.querySelector('.info-card-home:nth-child(4) .info-content-home p');
        if (hoursCard && data.businessHours) {
            // Convertir \n a <br> para mostrar correctamente
            hoursCard.innerHTML = data.businessHours.replace(/\n/g, '<br>');
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
    applyData() {
        const contactData = this.loadContactData();
        
        try {
            this.applyTrustIcons(contactData);
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

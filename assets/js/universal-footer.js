/**
 * Universal Footer Loader
 * Carga el footer universal y sincroniza los datos de contacto desde el panel de admin
 */

class UniversalFooter {
    constructor() {
        this.componentPath = '/components/universal-footer.html';
        this.storageKey = 'contactInfo';
        this.fallbackData = {
            instagramUrl: '#',
            facebookUrl: '#',
            whatsappNumber: '+5212345678490',
            contactEmail: 'info@estudioartesana.com',
            phoneNumber: '+52 123 456 7890',
            locationText: 'Ciudad de México, México',
            businessHours: 'Lun - Vie: 9:00 AM - 6:00 PM\nSáb: 10:00 AM - 4:00 PM'
        };
    }

    /**
     * Detectar si estamos en una página interna para ajustar rutas
     */
    getBasePath() {
        const currentPath = window.location.pathname;
        
        // Si estamos en páginas internas, ajustar la ruta base
        if (currentPath.includes('/pages/')) {
            return '../..';
        } else if (currentPath.includes('/tienda/')) {
            return '..';
        } else if (currentPath.includes('/admin/')) {
            return '..';
        }
        
        return '.';
    }

    /**
     * Cargar el componente footer
     */
    async loadComponent() {
        const basePath = this.getBasePath();
        const componentPath = `${basePath}${this.componentPath}`;

        try {
            const response = await fetch(componentPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            return html;
        } catch (error) {
            console.warn('No se pudo cargar el footer universal:', error);
            return this.getFallbackFooter();
        }
    }

    /**
     * Footer de respaldo si no se puede cargar el componente
     */
    getFallbackFooter() {
        const basePath = this.getBasePath();
        
        return `
        <footer class="universal-footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-section brand-section">
                        <div class="footer-logo">
                            <h3>ESTUDIO ARTESANA</h3>
                        </div>
                        <p class="footer-description">
                            Creamos productos artesanales únicos que honran la tradición mexicana con un enfoque contemporáneo y elegante.
                        </p>
                        <div class="social-links">
                            <a href="#" class="social-link" aria-label="Facebook" id="footerFacebookLink">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                            <a href="#" class="social-link" aria-label="Instagram" id="footerInstagramLink">
                                <i class="fab fa-instagram"></i>
                            </a>
                            <a href="#" class="social-link" aria-label="WhatsApp" id="footerWhatsAppLink">
                                <i class="fab fa-whatsapp"></i>
                            </a>
                        </div>
                    </div>
                    
                    <div class="footer-section links-section">
                        <h4>Enlaces Rápidos</h4>
                        <ul class="footer-links">
                            <li><a href="${basePath}/index.html" class="footer-link">Inicio</a></li>
                            <li><a href="${basePath}/tienda/index.html" class="footer-link">Tienda</a></li>
                            <li><a href="${basePath}/pages/sobre-nosotros/index.html" class="footer-link">Nosotros</a></li>
                            <li><a href="${basePath}/pages/mayoristas/index.html" class="footer-link">Mayoristas</a></li>
                            <li><a href="#contacto" class="footer-link">Contacto</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-section legal-section">
                        <h4>Información</h4>
                        <ul class="footer-links">
                            <li><a href="${basePath}/pages/politicas/terminos.html" class="footer-link">Términos y Condiciones</a></li>
                            <li><a href="${basePath}/pages/politicas/privacidad.html" class="footer-link">Aviso de Privacidad</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-section contact-section">
                        <h4>Contacto</h4>
                        <div class="contact-info">
                            <div class="contact-item">
                                <i class="fas fa-envelope"></i>
                                <a href="mailto:info@estudioartesana.com" id="footerEmailLink">info@estudioartesana.com</a>
                            </div>
                            <div class="contact-item">
                                <i class="fas fa-phone"></i>
                                <a href="tel:+5212345678490" id="footerPhoneLink">+52 123 456 7890</a>
                            </div>
                            <div class="contact-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span id="footerLocationText">Ciudad de México, México</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="footer-bottom">
                    <div class="footer-bottom-content">
                        <p>&copy; 2025 Estudio Artesana. Todos los derechos reservados.</p>
                    </div>
                </div>
            </div>
        </footer>`;
    }

    /**
     * Cargar datos de contacto desde localStorage o usar fallback
     */
    loadContactData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const contactData = JSON.parse(savedData);
                console.log('📞 Footer: Datos de contacto cargados desde admin panel:', contactData);
                return { ...this.fallbackData, ...contactData };
            }
        } catch (error) {
            console.warn('⚠️ Footer: Error al cargar datos guardados:', error);
        }
        
        console.log('📞 Footer: Usando datos por defecto');
        return this.fallbackData;
    }

    /**
     * Ajustar rutas en el HTML cargado
     */
    adjustPaths(html) {
        const basePath = this.getBasePath();
        
        // Ajustar rutas href
        html = html.replace(/href="\/([^"]*?)"/g, `href="${basePath}/$1"`);
        
        // Ajustar rutas que empiezan con /pages, /tienda, etc.
        html = html.replace(/href="\/index\.html"/g, `href="${basePath}/index.html"`);
        
        return html;
    }

    /**
     * Aplicar datos de contacto al footer
     */
    applyContactData(contactData) {
        // Redes sociales
        const instagramLink = document.getElementById('footerInstagramLink');
        if (instagramLink && contactData.instagramUrl) {
            instagramLink.href = contactData.instagramUrl;
        }

        const facebookLink = document.getElementById('footerFacebookLink');
        if (facebookLink && contactData.facebookUrl) {
            facebookLink.href = contactData.facebookUrl;
        }

        const whatsappLink = document.getElementById('footerWhatsAppLink');
        if (whatsappLink && contactData.whatsappNumber) {
            const cleanNumber = contactData.whatsappNumber.replace(/[^\d]/g, '');
            whatsappLink.href = `https://wa.me/${cleanNumber}`;
        }

        // Información de contacto
        const emailLink = document.getElementById('footerEmailLink');
        if (emailLink && contactData.contactEmail) {
            emailLink.href = `mailto:${contactData.contactEmail}`;
            emailLink.textContent = contactData.contactEmail;
        }

        const phoneLink = document.getElementById('footerPhoneLink');
        if (phoneLink && contactData.phoneNumber) {
            phoneLink.href = `tel:${contactData.phoneNumber.replace(/[^\d+]/g, '')}`;
            phoneLink.textContent = contactData.phoneNumber;
        }

        const locationText = document.getElementById('footerLocationText');
        if (locationText && contactData.locationText) {
            locationText.textContent = contactData.locationText;
        }

        // Horarios de negocio
        const businessHours = document.getElementById('footerBusinessHours');
        if (businessHours && contactData.businessHours) {
            const hours = contactData.businessHours.split('\n');
            businessHours.innerHTML = hours.map(hour => `<span>${hour}</span>`).join('');
        }

        console.log('✅ Footer: Datos de contacto aplicados correctamente');
    }

    /**
     * Insertar el footer en la página
     */
    async insertFooter() {
        // Buscar donde insertar el footer
        let targetElement = document.querySelector('footer');
        
        if (!targetElement) {
            // Si no hay footer, buscar el final del body
            targetElement = document.body;
        }

        try {
            // Cargar el componente
            let footerHTML = await this.loadComponent();
            
            // Ajustar rutas si es necesario
            footerHTML = this.adjustPaths(footerHTML);

            // Si hay un footer existente, reemplazarlo
            if (document.querySelector('footer')) {
                document.querySelector('footer').outerHTML = footerHTML;
            } else {
                // Insertar al final del body
                document.body.insertAdjacentHTML('beforeend', footerHTML);
            }

            // Aplicar datos de contacto
            const contactData = this.loadContactData();
            this.applyContactData(contactData);

            console.log('✅ Footer universal cargado correctamente');

        } catch (error) {
            console.error('❌ Error al insertar footer:', error);
        }
    }

    /**
     * Inicializar el footer universal
     */
    async init() {
        console.log('🔄 Inicializando footer universal...');

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.insertFooter());
        } else {
            await this.insertFooter();
        }

        // Escuchar cambios en los datos de contacto
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                console.log('📱 Footer: Datos de contacto actualizados desde otra pestaña');
                const contactData = this.loadContactData();
                this.applyContactData(contactData);
            }
        });
    }

    /**
     * Refrescar datos - útil para llamar manualmente
     */
    refresh() {
        console.log('🔄 Footer: Refrescando datos de contacto...');
        const contactData = this.loadContactData();
        this.applyContactData(contactData);
    }
}

// Crear instancia global
window.UniversalFooter = new UniversalFooter();

// Auto-inicializar
window.UniversalFooter.init();

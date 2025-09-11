/**
 * Logo Manager - Estudio Artesana
 * Manages dynamic logo loading from admin panel
 */

class LogoManager {
    constructor() {
        this.config = null;
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.loadConfig();
            this.loadLogos();
        });
    }
    
    loadConfig() {
        if (window.EstudioArtesanaConfig) {
            this.config = window.EstudioArtesanaConfig;
        }
    }
    
    loadLogos() {
        this.loadHeroLogo();
        this.loadHeaderLogo();
    }
    
    loadHeroLogo() {
        const heroLogoImg = document.getElementById('heroLogoImg');
        if (!heroLogoImg) return;
        
        // Check if we have a hero logo configured
        if (this.config && this.config.assets && this.config.assets.logos && this.config.assets.logos.hero) {
            heroLogoImg.src = this.config.assets.logos.hero;
            heroLogoImg.style.display = 'block';
            console.log('✅ Hero logo loaded from config');
        } else {
            // Try to load a white logo if it exists
            this.tryLoadDefaultHeroLogo(heroLogoImg);
        }
    }
    
    tryLoadDefaultHeroLogo(logoElement) {
        // List of possible white logo filenames
        const possibleLogos = [
            'assets/images/logo-white.png',
            'assets/images/logo-blanco.png',
            'assets/images/logo_white.png',
            'assets/images/logo.png' // Will be made white with CSS
        ];
        
        this.tryLoadImages(possibleLogos, 0, logoElement);
    }
    
    tryLoadImages(imagePaths, index, logoElement) {
        if (index >= imagePaths.length) {
            // No logo found, hide the logo section
            console.warn('❌ No hero logo found');
            logoElement.style.display = 'none';
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            logoElement.src = imagePaths[index];
            logoElement.style.display = 'block';
            console.log(`✅ Hero logo loaded: ${imagePaths[index]}`);
        };
        img.onerror = () => {
            // Try next image
            this.tryLoadImages(imagePaths, index + 1, logoElement);
        };
        img.src = imagePaths[index];
    }
    
    loadHeaderLogo() {
        const headerLogoImg = document.querySelector('.logo-img');
        if (!headerLogoImg) return;
        
        // Check if we have a header logo configured
        if (this.config && this.config.assets && this.config.assets.logos && this.config.assets.logos.header) {
            headerLogoImg.src = this.config.assets.logos.header;
            console.log('✅ Header logo loaded from config');
        } else {
            // Keep the default logo
            console.log('📝 Using default header logo');
        }
    }
    
    // Method to update logos (called from admin)
    updateHeroLogo(logoUrl) {
        const heroLogoImg = document.getElementById('heroLogoImg');
        if (heroLogoImg && logoUrl) {
            heroLogoImg.src = logoUrl;
            heroLogoImg.style.display = 'block';
            console.log('✅ Hero logo updated');
        }
    }
    
    updateHeaderLogo(logoUrl) {
        const headerLogoImg = document.querySelector('.logo-img');
        if (headerLogoImg && logoUrl) {
            headerLogoImg.src = logoUrl;
            console.log('✅ Header logo updated');
        }
    }
}

// Initialize logo manager
window.LogoManager = new LogoManager();

// Make functions available globally for admin panel
window.updateHeroLogo = (logoUrl) => window.LogoManager.updateHeroLogo(logoUrl);
window.updateHeaderLogo = (logoUrl) => window.LogoManager.updateHeaderLogo(logoUrl);

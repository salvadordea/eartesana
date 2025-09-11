/**
 * Promo Manager - Estudio Artesana
 * Manages dynamic promotional banners
 */

class PromoManager {
    constructor() {
        this.config = null;
        this.currentPromo = null;
        
        this.init();
    }
    
    init() {
        // Wait for config to load
        document.addEventListener('DOMContentLoaded', () => {
            if (window.EstudioArtesanaConfig) {
                this.config = window.EstudioArtesanaConfig.promotion;
                this.loadPromotion();
            }
        });
    }
    
    loadPromotion() {
        if (!this.config || !this.config.active) {
            this.hidePromoBanner();
            return;
        }
        
        // Get current promotion (you can extend this to auto-detect by date)
        this.currentPromo = this.getCurrentPromo();
        
        if (this.currentPromo) {
            this.renderPromotion(this.currentPromo);
            this.applyTheme(this.currentPromo.theme || 'default');
        }
    }
    
    getCurrentPromo() {
        // For now, return the main promotion
        // You can extend this to switch based on current date/month
        return this.config;
        
        // Example of date-based switching:
        /*
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const day = now.getDate();
        
        // Valentine's Day (February 10-14)
        if (month === 2 && day >= 10 && day <= 14) {
            return this.config.alternatives.valentine;
        }
        
        // Mother's Day (May)
        if (month === 5) {
            return this.config.alternatives.mother;
        }
        
        // Christmas (December 1-25)
        if (month === 12 && day <= 25) {
            return this.config.alternatives.christmas;
        }
        
        // Summer (June, July, August)
        if (month >= 6 && month <= 8) {
            return this.config.alternatives.summer;
        }
        
        // Default promotion
        return this.config;
        */
    }
    
    renderPromotion(promo) {
        // Update banner content
        const elements = {
            title: document.getElementById('promoTitle'),
            description: document.getElementById('promoDescription'), 
            code: document.getElementById('promoCode'),
            expiry: document.getElementById('promoExpiry'),
            btn: document.getElementById('promoBtn'),
            icon: document.querySelector('.promo-icon i')
        };
        
        // Update content
        if (elements.title) elements.title.textContent = promo.title;
        if (elements.description) elements.description.textContent = promo.description;
        if (elements.code) elements.code.textContent = `Código: ${promo.code}`;
        if (elements.expiry) elements.expiry.textContent = promo.expiry;
        if (elements.btn) {
            elements.btn.textContent = promo.ctaText;
            elements.btn.href = promo.ctaLink;
        }
        if (elements.icon) {
            elements.icon.className = promo.icon;
        }
    }
    
    applyTheme(theme) {
        const banner = document.getElementById('promoBanner');
        if (!banner) return;
        
        // Remove existing theme classes
        banner.classList.remove('theme-valentine', 'theme-mother', 'theme-christmas', 'theme-summer');
        
        // Add new theme class
        if (theme !== 'default') {
            banner.classList.add(`theme-${theme}`);
        }
        
        // Apply theme-specific styles
        switch (theme) {
            case 'valentine':
                this.applyValentineTheme(banner);
                break;
            case 'mother':
                this.applyMotherTheme(banner);
                break;
            case 'christmas':
                this.applyChristmasTheme(banner);
                break;
            case 'summer':
                this.applySummerTheme(banner);
                break;
            default:
                // Default golden theme is already in CSS
                break;
        }
    }
    
    applyValentineTheme(banner) {
        banner.style.background = 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)';
    }
    
    applyMotherTheme(banner) {
        banner.style.background = 'linear-gradient(135deg, #f06292 0%, #c2185b 100%)';
    }
    
    applyChristmasTheme(banner) {
        banner.style.background = 'linear-gradient(135deg, #c62828 0%, #2e7d32 50%, #c62828 100%)';
    }
    
    applySummerTheme(banner) {
        banner.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
    }
    
    hidePromoBanner() {
        const banner = document.getElementById('promoBanner');
        if (banner) {
            banner.style.display = 'none';
        }
    }
    
    // Utility method to manually switch promotion (for admin use)
    switchPromotion(promoKey) {
        if (!this.config || !this.config.alternatives[promoKey]) {
            console.error('Promotion not found:', promoKey);
            return;
        }
        
        const promo = this.config.alternatives[promoKey];
        this.renderPromotion(promo);
        this.applyTheme(promo.theme);
        
        console.log('Switched to promotion:', promoKey);
    }
    
    // Get info about available promotions
    getAvailablePromotions() {
        if (!this.config) return {};
        
        return {
            current: this.config,
            alternatives: this.config.alternatives
        };
    }
}

// Initialize
window.PromoManager = new PromoManager();

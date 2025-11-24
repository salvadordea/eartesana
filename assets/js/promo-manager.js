/**
 * Promo Manager - Estudio Artesana
 * Manages dynamic promotional banners
 */

class PromoManager {
    constructor() {
        this.config = null;
        this.currentPromo = null;
        this.supabase = null;
        this.initialized = false;

        this.init();
    }

    async init() {
        // Wait for config to load
        document.addEventListener('DOMContentLoaded', async () => {
            if (window.EstudioArtesanaConfig) {
                this.config = window.EstudioArtesanaConfig.promotion;
            }

            // Initialize Supabase if available
            if (window.SUPABASE_CONFIG && window.supabase) {
                try {
                    this.supabase = window.supabase.createClient(
                        window.SUPABASE_CONFIG.url,
                        window.SUPABASE_CONFIG.anonKey
                    );
                    this.initialized = true;
                    console.log('✅ PromoManager: Supabase initialized');
                } catch (error) {
                    console.warn('⚠️ PromoManager: Supabase initialization failed:', error);
                }
            }

            await this.loadPromotion();
        });
    }
    
    async loadPromotion(force = false) {
        // Force reload clears cache
        if (force) {
            localStorage.removeItem('promoCache');
            console.log('🔄 PromoManager: Force reload - cache cleared');
        }

        // Try to load coupon from database first
        if (this.initialized) {
            const couponPromo = await this.loadCouponFromDatabase();
            if (couponPromo) {
                this.currentPromo = couponPromo;
                this.renderPromotion(couponPromo);
                this.applyTheme(couponPromo.theme || 'default');
                return;
            }
        }

        // Fallback to config.js promotion (with cache bust on force)
        if (force) {
            await this.reloadConfig();
        }

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

    /**
     * Force reload configuration from config.js
     */
    async reloadConfig() {
        console.log('🔄 PromoManager: Reloading config.js with cache bust...');

        // Reload config.js with timestamp to bypass cache
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `assets/js/config.js?v=${Date.now()}`;
            script.onload = () => {
                if (window.EstudioArtesanaConfig) {
                    this.config = window.EstudioArtesanaConfig.promotion;
                    console.log('✅ PromoManager: Config reloaded from config.js');
                }
                resolve();
            };
            script.onerror = () => {
                console.error('❌ PromoManager: Failed to reload config.js');
                reject();
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Public method to force update
     */
    async forceReload() {
        console.log('🔄 PromoManager: Force reload requested');
        await this.loadPromotion(true);
    }
    
    /**
     * Load active coupon from database for banner display
     * @returns {Promise<Object|null>} Coupon formatted as promotion
     */
    async loadCouponFromDatabase() {
        if (!this.supabase) {
            return null;
        }

        try {
            const now = new Date().toISOString();

            // Query active coupons enabled for banner
            const { data: coupons, error } = await this.supabase
                .from('coupons')
                .select('*')
                .eq('show_in_banner', true)
                .eq('is_active', true)
                .lte('valid_from', now)
                .gte('valid_until', now)
                .order('banner_priority', { ascending: false })
                .order('valid_until', { ascending: true })
                .limit(1);

            if (error) {
                console.error('❌ PromoManager: Error loading coupon:', error);
                return null;
            }

            if (!coupons || coupons.length === 0) {
                console.log('ℹ️ PromoManager: No active banner coupons found');
                return null;
            }

            const coupon = coupons[0];

            // Track banner view
            this.trackBannerView(coupon.id);

            // Format coupon as promotion object
            return this.formatCouponAsPromo(coupon);

        } catch (error) {
            console.error('❌ PromoManager: Error in loadCouponFromDatabase:', error);
            return null;
        }
    }

    /**
     * Format coupon data as promotion object
     * @param {Object} coupon - Coupon from database
     * @returns {Object} Promotion object
     */
    formatCouponAsPromo(coupon) {
        // Calculate days until expiry
        const now = new Date();
        const expiryDate = new Date(coupon.valid_until);
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        // Build expiry text
        let expiryText = '';
        if (daysLeft === 0) {
            expiryText = '¡Expira hoy!';
        } else if (daysLeft === 1) {
            expiryText = '¡Expira mañana!';
        } else if (daysLeft <= 7) {
            expiryText = `Expira en ${daysLeft} días`;
        } else {
            expiryText = `Válido hasta ${expiryDate.toLocaleDateString('es-MX')}`;
        }

        // Build discount text
        let discountText = '';
        if (coupon.discount_type === 'percentage') {
            discountText = `${coupon.discount_value}% OFF`;
        } else {
            discountText = `$${coupon.discount_value} OFF`;
        }

        // Build description
        let description = coupon.description || discountText;
        if (coupon.min_purchase_amount) {
            description += ` en compras mayores a $${coupon.min_purchase_amount}`;
        }

        return {
            id: coupon.id,
            title: '¡CUPÓN ESPECIAL!',
            description: description,
            code: coupon.code,
            expiry: expiryText,
            ctaText: '¡Compra Ahora!',
            ctaLink: 'tienda.html',
            icon: 'fas fa-ticket-alt',
            theme: 'default',
            discount: discountText,
            expiresInDays: daysLeft,
            isCoupon: true // Flag to identify database coupons
        };
    }

    /**
     * Track banner view in database
     * @param {string} couponId - Coupon ID
     */
    async trackBannerView(couponId) {
        if (!this.supabase) return;

        try {
            await this.supabase.rpc('increment_banner_views', {
                p_coupon_id: couponId
            });
        } catch (error) {
            console.warn('⚠️ Could not track banner view:', error);
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
        // Update promo toast content (new design)
        const toast = document.getElementById('promoToast');
        const discount = document.getElementById('promoDiscount');
        const code = document.getElementById('promoCode');

        if (!toast) {
            console.warn('⚠️ PromoManager: Toast element not found');
            return;
        }

        // Update discount text
        if (discount) {
            discount.textContent = promo.discount || promo.description;
        }

        // Update code with validation for length
        if (code) {
            let displayCode = promo.code;

            // Truncate very long codes
            if (promo.code.length > 20) {
                displayCode = promo.code.substring(0, 17) + '...';
                console.log('ℹ️ PromoManager: Code truncated for display');
            }

            code.textContent = displayCode;
            code.setAttribute('data-code', promo.code); // Store full code
            code.setAttribute('title', promo.code); // Tooltip shows full code
        }

        // Update toast instance if available
        if (window.promoToastInstance) {
            window.promoToastInstance.updateContent(promo);
        }

        console.log('✅ PromoManager: Toast rendered with promo:', promo.code);
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
        const toast = document.getElementById('promoToast');
        if (toast) {
            toast.style.display = 'none';
        }

        // Also hide via toast instance if available
        if (window.promoToastInstance) {
            window.promoToastInstance.hidePermanently();
        }

        console.log('ℹ️ PromoManager: Toast hidden (no active promotion)');
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

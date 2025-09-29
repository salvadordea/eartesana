/**
 * Translation System - Multi-language support for Estudio Artesana
 * Supports Spanish (default) and English with localStorage persistence
 */

class TranslationSystem {
    constructor() {
        this.currentLanguage = 'es'; // Default to Spanish
        this.translations = null;
        this.storageKey = 'preferredLanguage';
        this.showFeedback = false; // Set to true to enable language change feedback
        this.isInitialized = false;

        this.init();
    }

    /**
     * Initialize the translation system
     */
    async init() {
        try {
            // Load saved language preference
            const savedLanguage = localStorage.getItem(this.storageKey);
            if (savedLanguage && ['es', 'en'].includes(savedLanguage)) {
                this.currentLanguage = savedLanguage;
            }

            // Load translation data
            await this.loadTranslations();

            // Create language toggle
            this.createLanguageToggle();

            // Apply translations
            this.applyTranslations();

            // Update HTML lang attribute
            document.documentElement.lang = this.currentLanguage;

            // Mark as initialized
            this.isInitialized = true;

            console.log(`🌐 Translation system initialized - Language: ${this.currentLanguage}`);
        } catch (error) {
            console.error('❌ Error initializing translation system:', error);
        }
    }

    /**
     * Load translation data from JSON file
     */
    async loadTranslations() {
        try {
            const response = await fetch('assets/data/translations.json');
            if (!response.ok) {
                // Try alternative path for pages in subdirectories
                const altResponse = await fetch('../assets/data/translations.json');
                if (!altResponse.ok) {
                    const altResponse2 = await fetch('../../assets/data/translations.json');
                    if (!altResponse2.ok) {
                        throw new Error('Translations file not found');
                    }
                    this.translations = await altResponse2.json();
                } else {
                    this.translations = await altResponse.json();
                }
            } else {
                this.translations = await response.json();
            }

            console.log('✅ Translation data loaded');
        } catch (error) {
            console.error('❌ Error loading translations:', error);
            // Fallback - continue with Spanish only
            this.translations = { es: {} };
        }
    }

    /**
     * Create language toggle button
     */
    createLanguageToggle() {
        // Check if toggle already exists
        if (document.querySelector('.language-toggle')) {
            return;
        }

        // Create language toggle element
        const toggle = document.createElement('div');
        toggle.className = 'language-toggle';
        toggle.setAttribute('aria-label', 'Language Selector');
        toggle.innerHTML = `
            <div class="language-buttons">
                <button class="lang-btn ${this.currentLanguage === 'es' ? 'active' : ''}"
                        data-lang="es"
                        aria-label="Español"
                        title="Español">
                    <span class="flag-icon">🇪🇸</span>
                    <span class="lang-code">ES</span>
                </button>
                <button class="lang-btn ${this.currentLanguage === 'en' ? 'active' : ''}"
                        data-lang="en"
                        aria-label="English"
                        title="English">
                    <span class="flag-icon">🇺🇸</span>
                    <span class="lang-code">EN</span>
                </button>
            </div>
        `;

        // Add event listeners
        toggle.addEventListener('click', (e) => {
            const langBtn = e.target.closest('.lang-btn');
            if (langBtn) {
                const newLanguage = langBtn.dataset.lang;
                this.switchLanguage(newLanguage);
            }
        });

        // Wait for header to be available and insert toggle
        this.insertToggleIntoHeader(toggle);

        // Add CSS styles
        this.addToggleStyles();
    }

    /**
     * Insert language toggle into header with retry mechanism
     */
    insertToggleIntoHeader(toggle, attempts = 0) {
        const maxAttempts = 20; // Wait up to 10 seconds (500ms * 20)

        // Try to find header icons
        const headerIcons = document.querySelector('.header-icons');
        if (headerIcons) {
            const langContainer = document.createElement('div');
            langContainer.className = 'language-selector-container';
            langContainer.appendChild(toggle);

            // Insert before the first icon
            headerIcons.insertBefore(langContainer, headerIcons.firstChild);
            console.log('✅ Language toggle added to header-icons');
            return;
        }

        // Try fallback - navigation
        const nav = document.querySelector('.nav-list');
        if (nav) {
            const langItem = document.createElement('li');
            langItem.className = 'nav-item language-item';
            langItem.appendChild(toggle);
            nav.appendChild(langItem);
            console.log('✅ Language toggle added to navigation');
            return;
        }

        // If header not ready yet, retry
        if (attempts < maxAttempts) {
            setTimeout(() => {
                this.insertToggleIntoHeader(toggle, attempts + 1);
            }, 500);
        } else {
            // Final fallback - add to body
            console.warn('⚠️ Header not found after retries, adding toggle to body');
            document.body.appendChild(toggle);
        }
    }

    /**
     * Add CSS styles for language toggle
     */
    addToggleStyles() {
        if (document.getElementById('translation-styles')) {
            return;
        }

        const styles = document.createElement('style');
        styles.id = 'translation-styles';
        styles.textContent = `
            /* Language Selector Container */
            .language-selector-container {
                margin-right: 20px;
                display: flex;
                align-items: center;
            }

            .language-toggle {
                display: flex;
                align-items: center;
                gap: 14px;
                background: linear-gradient(135deg, rgba(44, 44, 44, 0.04) 0%, rgba(26, 26, 26, 0.06) 100%);
                border-radius: 28px;
                padding: 10px 18px;
                backdrop-filter: blur(15px);
                border: 1px solid rgba(44, 44, 44, 0.08);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
            }

            .language-toggle:hover {
                background: linear-gradient(135deg, rgba(192, 192, 192, 0.08) 0%, rgba(168, 168, 168, 0.10) 100%);
                border-color: rgba(192, 192, 192, 0.15);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
            }

            /* Language Label */
            .language-label {
                display: flex;
                align-items: center;
                gap: 7px;
                color: rgba(44, 44, 44, 0.7);
                font-size: 13px;
                font-weight: 500;
                white-space: nowrap;
            }

            .language-label .fa-globe {
                font-size: 15px;
                color: rgba(192, 192, 192, 0.8);
                transition: all 0.3s ease;
            }

            .language-toggle:hover .language-label .fa-globe {
                color: #C0C0C0;
                transform: rotate(180deg);
            }

            .lang-text {
                font-family: var(--font-secondary, Arial, sans-serif);
                letter-spacing: 0.4px;
                font-weight: 500;
            }

            /* Language Buttons Container */
            .language-buttons {
                display: flex;
                gap: 5px;
                background: rgba(44, 44, 44, 0.06);
                border-radius: 20px;
                padding: 4px;
                border: 1px solid rgba(44, 44, 44, 0.04);
            }

            .lang-btn {
                background: transparent;
                border: none;
                color: rgba(44, 44, 44, 0.6);
                padding: 7px 11px;
                border-radius: 16px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                text-transform: uppercase;
                letter-spacing: 0.6px;
                display: flex;
                align-items: center;
                gap: 5px;
                position: relative;
                overflow: hidden;
            }

            .lang-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(192, 192, 192, 0.1), rgba(192, 192, 192, 0.05));
                opacity: 0;
                transition: opacity 0.3s ease;
                border-radius: 14px;
            }

            .lang-btn:hover::before {
                opacity: 1;
            }

            .lang-btn:hover {
                color: rgba(44, 44, 44, 0.85);
                transform: translateY(-1px);
                background: rgba(192, 192, 192, 0.08);
            }

            .lang-btn.active {
                background: linear-gradient(135deg, #C0C0C0, #A8A8A8);
                color: #000;
                box-shadow: 0 3px 10px rgba(192, 192, 192, 0.25);
                transform: translateY(-1px);
            }

            .lang-btn.active::before {
                opacity: 0;
            }

            /* Flag Icons */
            .flag-icon {
                font-size: 14px;
                filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
            }

            .lang-code {
                font-weight: 700;
                font-size: 10px;
            }

            /* Navigation Fallback Styles */
            .language-item {
                display: flex;
                align-items: center;
            }

            .language-item .language-toggle {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 6px 12px;
            }

            /* Mobile Responsiveness */
            @media (max-width: 1024px) {
                .lang-text {
                    display: none;
                }

                .language-label {
                    gap: 0;
                }

                .language-toggle {
                    padding: 6px 12px;
                    gap: 8px;
                }
            }

            @media (max-width: 768px) {
                .language-selector-container {
                    position: fixed;
                    top: 15px;
                    right: 70px;
                    z-index: 1001;
                    margin-right: 0;
                }

                .language-toggle {
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(20px);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    padding: 8px 12px;
                }

                .language-label {
                    display: none;
                }

                .language-buttons {
                    background: rgba(255, 255, 255, 0.1);
                }

                .lang-btn {
                    padding: 5px 8px;
                }

                /* Hide fallback navigation item on mobile */
                .language-item {
                    display: none;
                }
            }

            @media (max-width: 480px) {
                .language-selector-container {
                    right: 15px;
                    top: 12px;
                }

                .language-toggle {
                    padding: 6px 8px;
                    gap: 6px;
                }

                .flag-icon {
                    font-size: 12px;
                }

                .lang-code {
                    font-size: 9px;
                }
            }

            /* Dark theme compatibility */
            .header.dark .language-toggle,
            body.dark .language-toggle {
                background: rgba(255, 255, 255, 0.05);
                border-color: rgba(255, 255, 255, 0.1);
            }

            /* Light theme adjustments */
            .header.light .language-toggle,
            body.light .language-toggle {
                background: rgba(0, 0, 0, 0.05);
                border-color: rgba(0, 0, 0, 0.1);
            }

            .header.light .language-label,
            body.light .language-label {
                color: rgba(0, 0, 0, 0.7);
            }

            .header.light .lang-btn,
            body.light .lang-btn {
                color: rgba(0, 0, 0, 0.6);
            }

            .header.light .lang-btn:hover,
            body.light .lang-btn:hover {
                color: rgba(0, 0, 0, 0.8);
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Switch language
     */
    async switchLanguage(newLanguage) {
        if (newLanguage === this.currentLanguage) {
            return;
        }

        // Add loading state to buttons
        const buttons = document.querySelectorAll('.lang-btn');
        buttons.forEach(btn => {
            btn.style.opacity = '0.6';
            btn.style.pointerEvents = 'none';
        });

        try {
            this.currentLanguage = newLanguage;

            // Save preference
            localStorage.setItem(this.storageKey, newLanguage);

            // Update active button with smooth transition
            document.querySelectorAll('.lang-btn').forEach(btn => {
                const isActive = btn.dataset.lang === newLanguage;
                btn.classList.toggle('active', isActive);

                // Update ARIA state
                btn.setAttribute('aria-pressed', isActive.toString());
            });

            // Update HTML lang attribute
            document.documentElement.lang = newLanguage;

            // Apply translations with small delay for smooth transition
            setTimeout(() => {
                this.applyTranslations();
            }, 100);

            // Show brief feedback (optional - can be removed if too intrusive)
            this.showLanguageChangeFeedback(newLanguage);

            console.log(`🌐 Language switched to: ${newLanguage}`);

            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: newLanguage, previousLanguage: this.currentLanguage }
            }));

        } catch (error) {
            console.error('❌ Error switching language:', error);
        } finally {
            // Restore button states
            setTimeout(() => {
                buttons.forEach(btn => {
                    btn.style.opacity = '';
                    btn.style.pointerEvents = '';
                });
            }, 200);
        }
    }

    /**
     * Show brief feedback when language changes
     */
    showLanguageChangeFeedback(language) {
        // Only show if enabled in configuration
        if (!this.showFeedback) return;

        const languageNames = {
            'es': this.t('common.spanish', 'Español'),
            'en': this.t('common.english', 'English')
        };

        const message = language === 'es'
            ? `Idioma cambiado a ${languageNames[language] || language}`
            : `Language changed to ${languageNames[language] || language}`;

        const feedback = document.createElement('div');
        feedback.className = 'language-change-feedback';
        feedback.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(feedback);

        // Auto remove after animation
        setTimeout(() => {
            feedback.classList.add('fade-out');
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 2000);

        // Add CSS for feedback if not already added
        if (!document.getElementById('language-feedback-styles')) {
            const feedbackStyles = document.createElement('style');
            feedbackStyles.id = 'language-feedback-styles';
            feedbackStyles.textContent = `
                .language-change-feedback {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    animation: slideInFade 0.3s ease-out;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .language-change-feedback.fade-out {
                    animation: slideOutFade 0.3s ease-in forwards;
                }

                .language-change-feedback i {
                    color: #4CAF50;
                }

                @keyframes slideInFade {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slideOutFade {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
            `;
            document.head.appendChild(feedbackStyles);
        }
    }

    /**
     * Get translation for a given key
     */
    t(key, fallback = '') {
        if (!this.translations || !this.translations[this.currentLanguage]) {
            return fallback || key;
        }

        const keys = key.split('.');
        let value = this.translations[this.currentLanguage];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return fallback || key;
            }
        }

        return value || fallback || key;
    }

    /**
     * Translate category name
     */
    translateCategory(categoryName) {
        if (!categoryName) return categoryName;

        // Normalize category name to lowercase and remove accents for consistent mapping
        const normalizedName = categoryName.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_');

        // Try direct category translation
        const categoryKey = `categories.${normalizedName}`;
        const translated = this.t(categoryKey);

        // If no direct translation found, return original name
        return translated === categoryKey ? categoryName : translated;
    }

    /**
     * Translate shop UI text
     */
    translateShopText(key, fallback = null) {
        return this.t(`shop.${key}`, fallback);
    }

    /**
     * Apply translations to elements with data-translate attribute
     */
    applyTranslations() {
        // Translate elements with data-translate attribute
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.dataset.translate;
            const translation = this.t(key);

            if (element.dataset.translateAttr) {
                // Translate attribute
                const attr = element.dataset.translateAttr;
                element.setAttribute(attr, translation);
            } else {
                // Translate text content based on element type
                if (element.tagName.toLowerCase() === 'option') {
                    element.textContent = translation;
                } else if (element.tagName.toLowerCase() === 'input' && element.type === 'button') {
                    element.value = translation;
                } else if (element.tagName.toLowerCase() === 'input' && element.hasAttribute('placeholder')) {
                    element.setAttribute('placeholder', translation);
                } else {
                    // For span elements inside buttons and links, preserve the parent structure
                    element.textContent = translation;
                }
            }
        });

        // Translate common navigation elements
        this.translateNavigation();

        // Translate hero section
        this.translateHero();

        // Translate common UI elements
        this.translateCommonElements();

        // Handle special cases
        this.translateSpecialElements();

        console.log('✅ Translations applied');
    }

    /**
     * Handle special translation cases
     */
    translateSpecialElements() {
        // Update the language selector text itself
        const langText = document.querySelector('.lang-text');
        if (langText) {
            langText.textContent = this.t('common.language', 'Language');
        }

        // Update document title if needed
        const currentTitle = document.title;
        if (currentTitle.includes('Estudio Artesana')) {
            if (this.currentLanguage === 'en') {
                document.title = currentTitle.replace(/Legado ancestral transformado en diseño/, 'Ancestral legacy transformed into design');
            } else {
                document.title = currentTitle.replace(/Ancestral legacy transformed into design/, 'Legado ancestral transformado en diseño');
            }
        }

        // Update meta descriptions
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            const spanishDesc = "Descubre piezas únicas que honran la tradición artesanal mexicana con un enfoque contemporáneo y elegante.";
            const englishDesc = "Discover unique pieces that honor Mexican artisanal tradition with a contemporary and elegant approach.";

            metaDescription.setAttribute('content', this.currentLanguage === 'en' ? englishDesc : spanishDesc);
        }
    }

    /**
     * Translate navigation elements
     */
    translateNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            // Skip if element already has data-translate attribute (avoid double translation)
            if (link.hasAttribute('data-translate')) {
                return;
            }

            // Skip dropdown category links (they are managed by universal header)
            if (link.classList.contains('dropdown-link') ||
                link.closest('.dropdown-categories') ||
                link.closest('#dropdownCategories')) {
                return;
            }

            const href = link.getAttribute('href');
            if (href && href.includes('index.html') || href === '#inicio') {
                link.textContent = this.t('navigation.inicio');
            } else if (href && href.includes('tienda')) {
                link.textContent = this.t('navigation.tienda');
            } else if (href && href.includes('sobre-nosotros')) {
                link.textContent = this.t('navigation.sobre_nosotros');
            } else if (href && href.includes('mayoristas')) {
                link.textContent = this.t('navigation.mayoristas');
            } else if (href && href.includes('contacto')) {
                link.textContent = this.t('navigation.contacto');
            } else if (href && href.includes('micuenta') || href.includes('mi-cuenta')) {
                link.textContent = this.t('navigation.mi_cuenta');
            }
        });
    }

    /**
     * Translate hero section
     */
    translateHero() {
        // Hero title
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle && !heroTitle.hasAttribute('data-translate')) {
            heroTitle.textContent = this.t('hero.title');
        }

        // Hero subtitle
        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (heroSubtitle && !heroSubtitle.hasAttribute('data-translate')) {
            heroSubtitle.textContent = this.t('hero.subtitle');
        }

        // Trust elements - only translate if they don't have data-translate attributes
        const trustItems = document.querySelectorAll('.trust-item span');
        trustItems.forEach((item, index) => {
            if (!item.hasAttribute('data-translate')) {
                if (index === 0) item.textContent = this.t('hero.trust_shipping');
                else if (index === 1) item.textContent = this.t('hero.trust_handmade');
                else if (index === 2) item.textContent = this.t('hero.trust_quality');
            }
        });

        // CTA buttons - only translate if they don't have data-translate attributes
        const ctaPrimary = document.querySelector('.btn-primary');
        if (ctaPrimary && !ctaPrimary.hasAttribute('data-translate') &&
            (ctaPrimary.textContent.includes('Explorar') || ctaPrimary.textContent.includes('Explore'))) {
            ctaPrimary.textContent = this.t('hero.cta_primary');
        }

        const ctaSecondary = document.querySelector('.btn-secondary');
        if (ctaSecondary && !ctaSecondary.hasAttribute('data-translate') &&
            (ctaSecondary.textContent.includes('Historia') || ctaSecondary.textContent.includes('Story'))) {
            ctaSecondary.textContent = this.t('hero.cta_secondary');
        }
    }

    /**
     * Translate common UI elements
     */
    translateCommonElements() {
        // Search placeholder - only if no data-translate attribute
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="Search"]');
        if (searchInput && !searchInput.hasAttribute('data-translate')) {
            searchInput.setAttribute('placeholder', this.t('common.search_placeholder'));
        }

        // Section titles - only if no data-translate attribute
        const featuredTitle = document.querySelector('h2');
        if (featuredTitle && !featuredTitle.hasAttribute('data-translate') &&
            (featuredTitle.textContent.includes('DESTACADOS') || featuredTitle.textContent.includes('FEATURED'))) {
            featuredTitle.textContent = this.t('sections.featured_products');
        }

        // View all button - only if no data-translate attribute
        const viewAllBtn = document.querySelector('.view-all-btn');
        if (viewAllBtn && !viewAllBtn.hasAttribute('data-translate')) {
            viewAllBtn.textContent = this.t('sections.view_all');
        }
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Check if language is supported
     */
    isLanguageSupported(lang) {
        return ['es', 'en'].includes(lang);
    }
}

// Create global instance
window.TranslationSystem = new TranslationSystem();

// Global translation function
window.t = function(key, fallback = '') {
    return window.TranslationSystem.t(key, fallback);
};

// Listen for language changes to update other components
window.addEventListener('languageChanged', (e) => {
    console.log(`🌐 Language changed to: ${e.detail.language}`);

    // Update other components that need translation
    if (window.ContactDataLoader) {
        window.ContactDataLoader.refresh();
    }
});
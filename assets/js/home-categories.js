/**
 * Home Categories JavaScript - Estudio Artesana
 * Loads and displays categories dynamically on the homepage using Supabase
 */

class HomeCategoriesLoader {
    constructor() {
        this.categories = [];
        this.allProducts = [];
        this.isLoading = false;
        
        console.log('🏠 Home Categories Loader inicializado');
    }
    
    async init() {
        // Esperar a que el API esté disponible
        if (!window.artesanaAPI) {
            console.log('⏳ Esperando API de Supabase...');
            setTimeout(() => this.init(), 500);
            return;
        }
        
        this.initializeElements();
        await this.loadHomeCategories();
    }
    
    initializeElements() {
        this.categoriesGrid = document.getElementById('homeCategoriesGrid');
        this.categoriesLoading = document.getElementById('homeCategoriesLoading');
    }
    
    async loadHomeCategories() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // Cargar categorías desde Supabase
            const categoriesResponse = await window.artesanaAPI.getCategories();
            
            // Cargar productos para obtener conteos
            const productsResponse = await window.artesanaAPI.getProducts(1, 100);
            this.allProducts = productsResponse.products;
            
            // Filtrar categorías activas y excluir 'Uncategorized'
            this.categories = categoriesResponse.categories
                .filter(cat => cat.name !== 'Uncategorized')
                .map(category => ({
                    ...category,
                    count: this.getProductCountForCategory(category.id),
                    slug: this.generateSlug(category.name)
                }))
                .filter(cat => cat.count > 0); // Solo categorías con productos
            
            console.log('🏠 Categorías cargadas para inicio:', this.categories);
            
            this.renderHomeCategories();
            
        } catch (error) {
            console.error('❌ Error cargando categorías del inicio:', error);
            this.hideLoading();
            // En error, ocultar la sección
            if (this.categoriesGrid) {
                this.categoriesGrid.style.display = 'none';
            }
        } finally {
            this.isLoading = false;
        }
    }
    
    renderHomeCategories() {
        if (!this.categories || this.categories.length === 0) {
            this.hideLoading();
            return;
        }
        
        let html = '';
        
        this.categories.forEach((category, index) => {
            html += this.createHomeCategoryCard(category, index);
        });
        
        this.categoriesGrid.innerHTML = html;
        this.hideLoading();

        // Trigger translation system to translate dynamic content
        if (window.TranslationSystem && window.TranslationSystem.isInitialized) {
            console.log('🌐 Applying translations to home categories');
            window.TranslationSystem.applyTranslations();
        }

        // Bind click events
        this.bindCategoryEvents();

        // Trigger animations
        setTimeout(() => {
            this.animateCards();
        }, 100);
    }
    
    createHomeCategoryCard(category, index) {
        const image = this.getCategoryImage(category);
        const badgeText = this.getBadgeText(category.count);
        const description = this.getCategoryDescription(category);
        const translationKey = this.getCategoryTranslationKey(category.name);

        return `
            <div class="modern-category-card fade-in delay-${Math.min(index + 1, 4)}" data-category-id="${category.id}">
                <div class="modern-category-image">
                    <img src="${image}" alt="${category.name}" loading="lazy">
                    ${badgeText ? `<div class="category-badge">${badgeText}</div>` : ''}
                </div>
                <div class="modern-category-content">
                    <h3 class="modern-category-title" ${translationKey ? `data-translate="${translationKey}"` : ''}>${category.name}</h3>
                </div>
            </div>
        `;
    }

    // Map category names to translation keys
    getCategoryTranslationKey(categoryName) {
        const mapping = {
            'Joyería': 'categories.joyeria',
            'Accesorios': 'categories.accesorios',
            'BOLSAS DE MANO': 'categories.bolsas',
            'BOLSAS TEXTIL Y PIEL': 'categories.bolsas',
            'Bolsas Cruzadas': 'categories.bolsas',
            'Cuadernos': 'categories.cuadernos',
            'Decoración': 'categories.decoracion',
            'Textiles': 'categories.textiles',
            'Cerámica': 'categories.ceramica',
            'Bolsas': 'categories.bolsas'
        };

        return mapping[categoryName] || null;
    }
    
    getCategoryImage(category) {
        // Usar la imagen desde Supabase si está disponible
        if (category.image) {
            return category.image;
        }
        
        // Fallback images basado en nombres de categorías (usando imágenes existentes)
        const categoryImages = {
            // Joyería
            'joyeria': 'assets/images/categories/joyeria.jpg',
            'joyería': 'assets/images/categories/joyeria.jpg',
            
            // Bolsas - mapear todas las variantes a las imágenes existentes
            'bolsas de mano': 'assets/images/categories/bolsas-de-mano.jpg',
            'bolsas textil y piel': 'assets/images/categories/bolsas-textil.jpg',
            'bolsas de textil y piel': 'assets/images/categories/bolsas-textil.jpg',
            'bolsas cruzadas': 'assets/images/categories/bolsas-cruzadas.jpg',
            'bolsas grandes': 'assets/images/categories/bolsas-grandes.jpg',
            
            // Backpacks
            'backpacks': 'assets/images/categories/backpacks.jpg',
            'backpack': 'assets/images/categories/backpacks.jpg',
            
            // Botelleras
            'botelleras': 'assets/images/categories/botelleras.jpg',
            
            // Hogar
            'hogar': 'assets/images/categories/hogar.jpg',
            
            // Portacel
            'portacel': 'assets/images/categories/portacel.jpg',
            
            // Vestimenta
            'vestimenta': 'assets/images/categories/vestimenta.jpg',
            
            // Accesorios - usar joyeria como fallback
            'accesorios': 'assets/images/categories/joyeria.jpg'
        };
        
        const categoryName = category.name.toLowerCase();
        const matchedImage = categoryImages[categoryName];
        
        if (matchedImage) {
            return matchedImage;
        }
        
        // Generate SVG placeholder with category info
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#2c2c2c;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#bg)"/>
                <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="14" fill="#C0C0C0" text-anchor="middle" font-weight="bold">
                    ESTUDIO ARTESANA
                </text>
                <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="20" fill="#ffffff" text-anchor="middle" font-weight="bold">
                    ${category.name.toUpperCase()}
                </text>
                <text x="50%" y="75%" font-family="Arial, sans-serif" font-size="11" fill="#cccccc" text-anchor="middle">
                    ${category.count} productos disponibles
                </text>
            </svg>
        `)}`;
    }
    
    getBadgeText(productCount) {
        if (productCount >= 20) return 'Popular';
        if (productCount >= 10) return 'Nueva';
        return null;
    }
    
    getCategoryDescription(category) {
        // Generate descriptive text based on category name
        const descriptions = {
            'joyeria': 'Piezas únicas de joyería artesanal mexicana',
            'joyería': 'Piezas únicas de joyería artesanal mexicana',
            'accesorios': 'Complementos elegantes con diseño contemporáneo',
            'aretes de piel': 'Aretes artesanales elaborados en piel',
            'aretes del piel': 'Aretes artesanales elaborados en piel',
            'bolsas': 'Bolsas artesanales de alta calidad',
            'bolsas de mano': 'Bolsas de mano elegantes y funcionales',
            'bolsas textil y piel': 'Combinación perfecta de textil y piel',
            'bolsas cruzadas': 'Comodidad y estilo para el día a día',
            'bolsas grandes': 'Bolsas espaciosas para todas tus necesidades',
            'botelleras': 'Bolsas especiales para botellas y licores',
            'carteras': 'Carteras elegantes para el día a día',
            'hogar': 'Artículos decorativos para el hogar',
            'portacel': 'Fundas y accesorios para dispositivos móviles',
            'cuadernos': 'Libretas y cuadernos artesanales',
            'libretas': 'Libretas y cuadernos artesanales'
        };
        
        const categoryName = category.name.toLowerCase();
        return descriptions[categoryName] || `Descubre nuestra colección de ${category.name.toLowerCase()}`;
    }
    
    bindCategoryEvents() {
        this.categoriesGrid.querySelectorAll('.modern-category-card').forEach(card => {
            card.addEventListener('click', () => {
                const categoryId = card.dataset.categoryId;
                const category = this.categories.find(cat => cat.id == categoryId);
                
                if (category) {
                    // Navigate to shop with category filter using name
                    window.location.href = `${this.getTiendaPath()}?category=${encodeURIComponent(category.name)}`;
                } else {
                    // Fallback to general shop page
                    window.location.href = this.getTiendaPath();
                }
            });
            
            // Add hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }
    
    animateCards() {
        const cards = this.categoriesGrid.querySelectorAll('.home-category-card');
        
        cards.forEach((card, index) => {
            // Add staggered animation delay
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    showLoading() {
        if (this.categoriesLoading) {
            this.categoriesLoading.style.display = 'flex';
        }
    }
    
    hideLoading() {
        if (this.categoriesLoading) {
            this.categoriesLoading.style.display = 'none';
        }
    }
    
    // Método para contar productos por categoría
    getProductCountForCategory(categoryId) {
        const matchingProducts = this.allProducts.filter(product => {
            return product.categories && product.categories.some(cat => {
                // Buscar por ID en category_ids o por nombre
                return (product.category_ids && product.category_ids.includes(categoryId)) ||
                       cat.toLowerCase() === this.getCategoryNameById(categoryId)?.toLowerCase();
            });
        });
        
        return matchingProducts.length;
    }
    
    // Obtener nombre de categoría por ID
    getCategoryNameById(categoryId) {
        const category = this.categories.find(cat => cat.id == categoryId);
        return category ? category.name : null;
    }
    
    // Generar slug para categoría
    generateSlug(name) {
        return name.toLowerCase()
            .replace(/ñ/g, 'n')
            .replace(/[áàäâ]/g, 'a')
            .replace(/[éèëê]/g, 'e')
            .replace(/[íìïî]/g, 'i')
            .replace(/[óòöô]/g, 'o')
            .replace(/[úùüû]/g, 'u')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    // Helper method to get correct path to tienda based on current location
    getTiendaPath() {
        // Para simplificar, desde el index.html la ruta siempre es tienda.html
        return 'tienda.html';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize home categories loader
    const homeCategoriesLoader = new HomeCategoriesLoader();
    homeCategoriesLoader.init();
});

// Add CSS for smooth animations
const style = document.createElement('style');
style.textContent = `
    .home-category-card {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s ease;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .home-categories-grid {
            grid-template-columns: 1fr;
            gap: 20px;
        }
        
        .section-title {
            font-size: 2rem;
        }
        
        .home-category-card {
            aspect-ratio: 3/2;
        }
    }
    
    @media (max-width: 480px) {
        .section-title {
            font-size: 1.8rem;
        }
        
        .view-all-btn {
            padding: 12px 24px;
            font-size: 0.9rem;
        }
        
        .home-category-name {
            font-size: 1.1rem;
        }
    }
`;
document.head.appendChild(style);

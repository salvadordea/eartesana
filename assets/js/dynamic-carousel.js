/**
 * Dynamic Carousel - Estudio Artesana
 * Loads random product images for the hero carousel
 */

class DynamicCarousel {
    constructor() {
        this.products = [];
        this.currentSlide = 0;
        this.autoPlayInterval = null;
        this.config = {
            count: 3,
            source: 'random',
            speed: 4000,
            images: []
        };
        
        this.init();
    }
    
    init() {
        this.loadConfig();
        this.initializeElements();
        this.loadCarouselImages();
    }
    
    loadConfig() {
        if (window.EstudioArtesanaConfig && window.EstudioArtesanaConfig.carousel) {
            this.config = { ...this.config, ...window.EstudioArtesanaConfig.carousel };
        }
    }
    
    initializeElements() {
        this.carouselTrack = document.querySelector('.carousel-track');
        this.carouselDots = document.querySelector('.carousel-dots');
        
        if (!this.carouselTrack || !this.carouselDots) {
            console.warn('Carousel elements not found');
            return;
        }
    }
    
    async loadCarouselImages() {
        try {
            // If we have pre-configured images, use those
            if (this.config.images && this.config.images.length > 0) {
                this.renderCarousel(this.config.images);
                return;
            }
            
            // Otherwise, fetch from WooCommerce
            await this.fetchProductImages();
        } catch (error) {
            console.error('Error loading carousel images:', error);
            this.loadFallbackImages();
        }
    }
    
    async fetchProductImages() {
        if (!window.WooAPI || !window.EstudioArtesanaConfig?.woocommerce) {
            console.warn('WooCommerce API not available');
            this.loadFallbackImages();
            return;
        }
        
        let products = [];
        
        try {
            switch (this.config.source) {
                case 'featured':
                    products = await window.WooAPI.getProducts({
                        featured: true,
                        per_page: this.config.count * 2, // Get more to filter later
                        status: 'publish'
                    });
                    break;
                    
                case 'recent':
                    products = await window.WooAPI.getProducts({
                        per_page: this.config.count * 2,
                        orderby: 'date',
                        order: 'desc',
                        status: 'publish'
                    });
                    break;
                    
                default: // 'random'
                    products = await window.WooAPI.getProducts({
                        per_page: this.config.count * 3, // Get more for better randomization
                        orderby: 'date',
                        order: 'desc',
                        status: 'publish'
                    });
                    // Randomize the results
                    products = this.shuffleArray(products);
                    break;
            }
            
            // Filter products with images
            const productsWithImages = products
                .filter(product => product.images && product.images.length > 0)
                .slice(0, this.config.count);
            
            if (productsWithImages.length > 0) {
                const carouselImages = productsWithImages.map(product => ({
                    src: product.images[0].src,
                    alt: product.name,
                    id: product.id,
                    name: product.name,
                    price: product.price
                }));
                
                this.renderCarousel(carouselImages);
            } else {
                this.loadFallbackImages();
            }
            
        } catch (error) {
            console.error('Error fetching products:', error);
            this.loadFallbackImages();
        }
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    loadFallbackImages() {
        // Default fallback images
        const fallbackImages = [
            { src: 'assets/images/product-1.jpg', alt: 'Producto artesanal 1', id: 'fallback-1' },
            { src: 'assets/images/product-2.jpg', alt: 'Producto artesanal 2', id: 'fallback-2' },
            { src: 'assets/images/product-3.jpg', alt: 'Producto artesanal 3', id: 'fallback-3' }
        ];
        
        this.renderCarousel(fallbackImages.slice(0, this.config.count));
    }
    
    renderCarousel(images) {
        if (!this.carouselTrack || !this.carouselDots) return;
        
        // Clear existing content
        this.carouselTrack.innerHTML = '';
        this.carouselDots.innerHTML = '';
        
        // Create slides
        images.forEach((image, index) => {
            // Create slide
            const slide = document.createElement('div');
            slide.className = `carousel-slide${index === 0 ? ' active' : ''}`;
            slide.innerHTML = `<img src="${image.src}" alt="${image.alt}" loading="lazy">`;
            this.carouselTrack.appendChild(slide);
            
            // Create dot
            const dot = document.createElement('button');
            dot.className = `carousel-dot${index === 0 ? ' active' : ''}`;
            dot.dataset.slide = index;
            dot.addEventListener('click', () => this.goToSlide(index));
            this.carouselDots.appendChild(dot);
        });
        
        this.products = images;
        this.currentSlide = 0;
        
        // Start autoplay
        this.startAutoPlay();
        
        console.log(`🎠 Carousel loaded with ${images.length} images`);
    }
    
    goToSlide(slideIndex) {
        if (!this.carouselTrack) return;
        
        const slides = this.carouselTrack.querySelectorAll('.carousel-slide');
        const dots = this.carouselDots.querySelectorAll('.carousel-dot');
        
        // Remove active class from current slide and dot
        slides[this.currentSlide]?.classList.remove('active');
        dots[this.currentSlide]?.classList.remove('active');
        
        // Add active class to new slide and dot
        this.currentSlide = slideIndex;
        slides[this.currentSlide]?.classList.add('active');
        dots[this.currentSlide]?.classList.add('active');
    }
    
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.products.length;
        this.goToSlide(nextIndex);
    }
    
    startAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
        }
        
        if (this.config.speed > 0 && this.products.length > 1) {
            this.autoPlayInterval = setInterval(() => {
                this.nextSlide();
            }, this.config.speed);
        }
    }
    
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    
    // Method to refresh carousel with new images
    async refreshCarousel() {
        console.log('🔄 Refreshing carousel...');
        this.stopAutoPlay();
        await this.fetchProductImages();
    }
    
    // Method to update config and refresh
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.refreshCarousel();
    }
}

// Initialize dynamic carousel
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for WooAPI to be ready
    setTimeout(() => {
        window.dynamicCarousel = new DynamicCarousel();
    }, 1000);
    
    // Add hover pause functionality
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => {
            if (window.dynamicCarousel) {
                window.dynamicCarousel.stopAutoPlay();
            }
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            if (window.dynamicCarousel) {
                window.dynamicCarousel.startAutoPlay();
            }
        });
    }
});

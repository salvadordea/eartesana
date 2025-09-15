/**
 * ESTUDIO ARTESANA - Hero Carousel Manager
 * ========================================
 * Maneja carruseles en la sección hero
 */

class HeroCarouselManager {
    constructor() {
        this.carousels = [];
        this.init();
    }

    init() {
        this.findCarousels();
        this.setupCarousels();
    }

    findCarousels() {
        const heroCarousels = document.querySelectorAll('.hero-carousel, .carousel-container');
        heroCarousels.forEach(carousel => {
            this.carousels.push(this.createCarouselInstance(carousel));
        });
    }

    createCarouselInstance(element) {
        return {
            element: element,
            currentSlide: 0,
            slides: element.querySelectorAll('.carousel-slide, .slide'),
            totalSlides: element.querySelectorAll('.carousel-slide, .slide').length,
            autoPlay: element.dataset.autoplay !== 'false',
            interval: parseInt(element.dataset.interval) || 5000,
            intervalId: null
        };
    }

    setupCarousels() {
        this.carousels.forEach(carousel => {
            if (carousel.totalSlides > 1) {
                this.setupCarousel(carousel);
            }
        });
    }

    setupCarousel(carousel) {
        // Agregar controles si no existen
        this.addControls(carousel);
        
        // Agregar indicadores si no existen
        this.addIndicators(carousel);
        
        // Setup event listeners
        this.setupEventListeners(carousel);
        
        // Iniciar autoplay si está habilitado
        if (carousel.autoPlay) {
            this.startAutoPlay(carousel);
        }

        // Mostrar primera slide
        this.showSlide(carousel, 0);
    }

    addControls(carousel) {
        if (!carousel.element.querySelector('.carousel-controls')) {
            const controls = document.createElement('div');
            controls.className = 'carousel-controls';
            controls.innerHTML = `
                <button class="carousel-btn prev-btn" aria-label="Anterior">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-btn next-btn" aria-label="Siguiente">
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;
            carousel.element.appendChild(controls);
        }
    }

    addIndicators(carousel) {
        if (!carousel.element.querySelector('.carousel-indicators') && carousel.totalSlides > 1) {
            const indicators = document.createElement('div');
            indicators.className = 'carousel-indicators';
            
            for (let i = 0; i < carousel.totalSlides; i++) {
                const indicator = document.createElement('button');
                indicator.className = 'carousel-indicator';
                indicator.dataset.slide = i;
                indicator.setAttribute('aria-label', `Ir a slide ${i + 1}`);
                indicators.appendChild(indicator);
            }
            
            carousel.element.appendChild(indicators);
        }
    }

    setupEventListeners(carousel) {
        // Botones de navegación
        const prevBtn = carousel.element.querySelector('.prev-btn');
        const nextBtn = carousel.element.querySelector('.next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevSlide(carousel));
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide(carousel));
        }

        // Indicadores
        const indicators = carousel.element.querySelectorAll('.carousel-indicator');
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(carousel, index));
        });

        // Pausa en hover
        carousel.element.addEventListener('mouseenter', () => this.pauseAutoPlay(carousel));
        carousel.element.addEventListener('mouseleave', () => this.resumeAutoPlay(carousel));

        // Touch/swipe support
        this.setupTouchEvents(carousel);
    }

    setupTouchEvents(carousel) {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        carousel.element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        carousel.element.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;

            const diffX = startX - endX;
            const diffY = startY - endY;

            // Solo procesar swipe horizontal si es más significativo que el vertical
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.nextSlide(carousel);
                } else {
                    this.prevSlide(carousel);
                }
            }
        });
    }

    showSlide(carousel, index) {
        // Ocultar todas las slides
        carousel.slides.forEach((slide, i) => {
            slide.classList.remove('active');
            slide.style.display = i === index ? 'block' : 'none';
        });

        // Mostrar slide actual
        if (carousel.slides[index]) {
            carousel.slides[index].classList.add('active');
        }

        // Actualizar indicadores
        const indicators = carousel.element.querySelectorAll('.carousel-indicator');
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });

        carousel.currentSlide = index;
    }

    nextSlide(carousel) {
        const nextIndex = (carousel.currentSlide + 1) % carousel.totalSlides;
        this.showSlide(carousel, nextIndex);
    }

    prevSlide(carousel) {
        const prevIndex = (carousel.currentSlide - 1 + carousel.totalSlides) % carousel.totalSlides;
        this.showSlide(carousel, prevIndex);
    }

    goToSlide(carousel, index) {
        this.showSlide(carousel, index);
    }

    startAutoPlay(carousel) {
        if (carousel.autoPlay && !carousel.intervalId) {
            carousel.intervalId = setInterval(() => {
                this.nextSlide(carousel);
            }, carousel.interval);
        }
    }

    pauseAutoPlay(carousel) {
        if (carousel.intervalId) {
            clearInterval(carousel.intervalId);
            carousel.intervalId = null;
        }
    }

    resumeAutoPlay(carousel) {
        if (carousel.autoPlay) {
            this.startAutoPlay(carousel);
        }
    }

    stopAutoPlay(carousel) {
        carousel.autoPlay = false;
        this.pauseAutoPlay(carousel);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.heroCarouselManager = new HeroCarouselManager();
});

// Exportar para uso global
window.HeroCarouselManager = HeroCarouselManager;

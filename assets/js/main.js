// Main JavaScript for Estudio Artesana Website
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initCarousel();
    initMobileMenu();
    initScrollEffects();
    initSmoothScrolling();
    initHeaderScroll();
});

// Carousel functionality
function initCarousel() {
    const carousel = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (!carousel || slides.length === 0) return;
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    // Auto-play interval
    let autoPlayInterval;
    
    function showSlide(index) {
        // Remove active class from all slides and dots
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Add active class to current slide and dot
        if (slides[index]) {
            slides[index].classList.add('active');
        }
        if (dots[index]) {
            dots[index].classList.add('active');
        }
        
        currentSlide = index;
    }
    
    function nextSlide() {
        const next = (currentSlide + 1) % totalSlides;
        showSlide(next);
    }
    
    function prevSlide() {
        const prev = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(prev);
    }
    
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 4000); // Change slide every 4 seconds
    }
    
    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }
    
    // Event listeners for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            stopAutoPlay();
            setTimeout(startAutoPlay, 8000); // Restart auto-play after 8 seconds
        });
    });
    
    // Pause auto-play on hover
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', stopAutoPlay);
        carouselContainer.addEventListener('mouseleave', startAutoPlay);
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            stopAutoPlay();
            setTimeout(startAutoPlay, 8000);
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            stopAutoPlay();
            setTimeout(startAutoPlay, 8000);
        }
    });
    
    // Touch/swipe support for mobile
    let startX = 0;
    let endX = 0;
    
    if (carouselContainer) {
        carouselContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        carouselContainer.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            handleSwipe();
        });
    }
    
    function handleSwipe() {
        const threshold = 50; // Minimum swipe distance
        const diff = startX - endX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                nextSlide(); // Swipe left - next slide
            } else {
                prevSlide(); // Swipe right - previous slide
            }
            stopAutoPlay();
            setTimeout(startAutoPlay, 8000);
        }
    }
    
    // Start auto-play
    startAutoPlay();
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.nav');
    const body = document.body;
    
    if (!mobileToggle || !nav) return;
    
    mobileToggle.addEventListener('click', () => {
        nav.classList.toggle('nav-open');
        mobileToggle.classList.toggle('active');
        body.classList.toggle('menu-open');
    });
    
    // Close menu when clicking on nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('nav-open');
            mobileToggle.classList.remove('active');
            body.classList.remove('menu-open');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !mobileToggle.contains(e.target)) {
            nav.classList.remove('nav-open');
            mobileToggle.classList.remove('active');
            body.classList.remove('menu-open');
        }
    });
}

// Scroll effects for animations
function initScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe product categories
    const productCategories = document.querySelectorAll('.product-category');
    productCategories.forEach(category => {
        category.style.opacity = '0';
        category.style.transform = 'translateY(30px)';
        category.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(category);
    });
    
    // Add CSS for animation
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId === '#' || targetId.length <= 1) return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const header = document.querySelector('.header');
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Header scroll effect
function initHeaderScroll() {
    const header = document.querySelector('.header');
    
    // Early return if header doesn't exist (e.g., in tienda.html with universal header)
    if (!header) {
        console.log('ℹ️ Header element not found, skipping header scroll effects');
        return;
    }
    
    let lastScrollY = 0;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
        
        // Hide header when scrolling down, show when scrolling up
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
        
        lastScrollY = currentScrollY;
    });
    
    // Add CSS for header effects
    const style = document.createElement('style');
    style.textContent = `
        .header-scrolled {
            background-color: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
        }
        
        .header-hidden {
            transform: translateY(-100%);
        }
        
        .header {
            transition: transform 0.3s ease, background-color 0.3s ease;
        }
        
        /* Mobile menu styles */
        @media (max-width: 768px) {
            .nav-open {
                display: block !important;
                position: fixed;
                top: 70px;
                left: 0;
                right: 0;
                background-color: white;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                z-index: 999;
                padding: 20px;
            }
            
            .nav-open .nav-list {
                flex-direction: column;
                gap: 20px;
            }
            
            .mobile-menu-toggle.active span:nth-child(1) {
                transform: rotate(45deg) translate(5px, 5px);
            }
            
            .mobile-menu-toggle.active span:nth-child(2) {
                opacity: 0;
            }
            
            .mobile-menu-toggle.active span:nth-child(3) {
                transform: rotate(-45deg) translate(7px, -6px);
            }
            
            body.menu-open {
                overflow: hidden;
            }
        }
    `;
    document.head.appendChild(style);
}

// Search functionality (basic implementation)
function initSearch() {
    const searchToggle = document.querySelector('.search-toggle');
    const searchOverlay = document.createElement('div');
    searchOverlay.className = 'search-overlay';
    searchOverlay.innerHTML = `
        <div class="search-container">
            <input type="text" class="search-input" placeholder="Buscar productos...">
            <button class="search-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(searchOverlay);
    
    const searchInput = searchOverlay.querySelector('.search-input');
    const searchClose = searchOverlay.querySelector('.search-close');
    
    // Add CSS for search overlay
    const style = document.createElement('style');
    style.textContent = `
        .search-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.9);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        }
        
        .search-overlay.active {
            display: flex;
        }
        
        .search-container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            width: 90%;
            max-width: 500px;
            position: relative;
        }
        
        .search-input {
            width: 100%;
            padding: 15px;
            font-size: 18px;
            border: 2px solid #ddd;
            border-radius: 5px;
            outline: none;
        }
        
        .search-input:focus {
            border-color: var(--secondary-color);
        }
        
        .search-close {
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
        }
        
        .search-close:hover {
            color: #333;
        }
    `;
    document.head.appendChild(style);
    
    if (searchToggle) {
        searchToggle.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            searchInput.focus();
        });
    }
    
    searchClose.addEventListener('click', () => {
        searchOverlay.classList.remove('active');
    });
    
    searchOverlay.addEventListener('click', (e) => {
        if (e.target === searchOverlay) {
            searchOverlay.classList.remove('active');
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchOverlay.classList.remove('active');
        }
    });
}

// Initialize search on load
document.addEventListener('DOMContentLoaded', initSearch);

// Utility function for lazy loading images
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Performance optimization: Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize lazy loading if needed
document.addEventListener('DOMContentLoaded', initLazyLoading);

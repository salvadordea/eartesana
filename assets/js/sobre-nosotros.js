/**
 * Sobre Nosotros JavaScript - Estudio Artesana
 * Manages the 9-image collage and About Us page functionality
 */

class AboutUsManager {
    constructor() {
        this.images = [];
        this.defaultImages = this.getDefaultImages();
        this.storageKey = 'estudio_artesana_about_images';
        
        this.init();
    }
    
    init() {
        this.initializeElements();
        this.loadImages();
        this.renderImages();
    }
    
    initializeElements() {
        this.collageGrid = document.getElementById('aboutImagesCollage');
    }
    
    getDefaultImages() {
        return [
            {
                id: 'about-1',
                src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=388&q=80',
                alt: 'Proceso artesanal - Preparación de materiales',
                title: 'Preparación de Materiales'
            },
            {
                id: 'about-2',
                src: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=358&q=80',
                alt: 'Artesano trabajando - Técnicas tradicionales',
                title: 'Técnicas Tradicionales'
            },
            {
                id: 'about-3',
                src: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=447&q=80',
                alt: 'Detalles de tejido - Precisión artesanal',
                title: 'Precisión Artesanal'
            },
            {
                id: 'about-4',
                src: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
                alt: 'Herramientas artesanales tradicionales',
                title: 'Herramientas Tradicionales'
            },
            {
                id: 'about-5',
                src: 'https://images.unsplash.com/photo-1582142306909-195724d75296?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
                alt: 'Taller artesanal - Espacio de creación',
                title: 'Nuestro Taller'
            },
            {
                id: 'about-6',
                src: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=386&q=80',
                alt: 'Selección de colores - Paleta artesanal',
                title: 'Paleta de Colores'
            },
            {
                id: 'about-7',
                src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
                alt: 'Productos terminados - Calidad artesanal',
                title: 'Productos Terminados'
            },
            {
                id: 'about-8',
                src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=420&q=80',
                alt: 'Equipo de artesanos - Trabajo colaborativo',
                title: 'Nuestro Equipo'
            },
            {
                id: 'about-9',
                src: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=386&q=80',
                alt: 'Control de calidad - Revisión detallada',
                title: 'Control de Calidad'
            }
        ];
    }
    
    loadImages() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Validate stored images
                if (Array.isArray(parsed) && parsed.length === 9) {
                    this.images = parsed;
                } else {
                    this.images = this.defaultImages;
                }
            } else {
                this.images = this.defaultImages;
            }
        } catch (error) {
            console.error('Error loading about images:', error);
            this.images = this.defaultImages;
        }
    }
    
    saveImages() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.images));
        } catch (error) {
            console.error('Error saving about images:', error);
        }
    }
    
    renderImages() {
        if (!this.collageGrid) return;
        
        let html = '';
        
        this.images.forEach((image, index) => {
            html += `
                <div class="collage-item" data-image-index="${index}">
                    <img src="${image.src}" 
                         alt="${image.alt}" 
                         title="${image.title}"
                         loading="lazy">
                </div>
            `;
        });
        
        this.collageGrid.innerHTML = html;
        
        // Add click handlers for lightbox effect
        this.bindImageEvents();
    }
    
    bindImageEvents() {
        this.collageGrid.querySelectorAll('.collage-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.openLightbox(index);
            });
            
            // Add hover effect
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'scale(1.02)';
                item.style.transition = 'transform 0.3s ease';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'scale(1)';
            });
        });
    }
    
    openLightbox(startIndex) {
        // Create lightbox overlay
        const overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'lightbox-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.addEventListener('click', () => this.closeLightbox(overlay));
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'lightbox-nav lightbox-prev';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'lightbox-nav lightbox-next';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'lightbox-image-container';
        
        const image = document.createElement('img');
        image.className = 'lightbox-image';
        
        const caption = document.createElement('div');
        caption.className = 'lightbox-caption';
        
        let currentIndex = startIndex;
        
        const updateImage = () => {
            const currentImage = this.images[currentIndex];
            image.src = currentImage.src;
            image.alt = currentImage.alt;
            caption.textContent = currentImage.title;
            
            // Update navigation
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex === this.images.length - 1;
        };
        
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateImage();
            }
        });
        
        nextBtn.addEventListener('click', () => {
            if (currentIndex < this.images.length - 1) {
                currentIndex++;
                updateImage();
            }
        });
        
        // Keyboard navigation
        const handleKeydown = (e) => {
            switch (e.key) {
                case 'Escape':
                    this.closeLightbox(overlay);
                    break;
                case 'ArrowLeft':
                    if (currentIndex > 0) {
                        currentIndex--;
                        updateImage();
                    }
                    break;
                case 'ArrowRight':
                    if (currentIndex < this.images.length - 1) {
                        currentIndex++;
                        updateImage();
                    }
                    break;
            }
        };
        
        document.addEventListener('keydown', handleKeydown);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeLightbox(overlay);
            }
        });
        
        // Assemble lightbox
        imageContainer.appendChild(image);
        imageContainer.appendChild(caption);
        
        lightbox.appendChild(closeBtn);
        lightbox.appendChild(prevBtn);
        lightbox.appendChild(imageContainer);
        lightbox.appendChild(nextBtn);
        
        overlay.appendChild(lightbox);
        overlay.handleKeydown = handleKeydown; // Store reference for cleanup
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        // Initialize
        updateImage();
    }
    
    closeLightbox(overlay) {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', overlay.handleKeydown);
        document.body.removeChild(overlay);
    }
    
    // Admin methods for updating images
    updateImage(index, imageData) {
        if (index >= 0 && index < 9) {
            this.images[index] = {
                ...this.images[index],
                ...imageData
            };
            this.saveImages();
            this.renderImages();
        }
    }
    
    resetToDefaults() {
        this.images = [...this.defaultImages];
        this.saveImages();
        this.renderImages();
    }
    
    exportConfiguration() {
        const config = {
            images: this.images,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `about-images-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    importConfiguration(configData) {
        try {
            if (configData.images && Array.isArray(configData.images) && configData.images.length === 9) {
                this.images = configData.images;
                this.saveImages();
                this.renderImages();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing configuration:', error);
            return false;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.aboutUsManager = new AboutUsManager();
    
    // Update cart count if available
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
});

// Add lightbox styles
const style = document.createElement('style');
style.textContent = `
    .lightbox-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    }
    
    .lightbox {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        align-items: center;
        gap: 20px;
    }
    
    .lightbox-close {
        position: absolute;
        top: -50px;
        right: -20px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        z-index: 10001;
        transition: background-color 0.3s ease;
    }
    
    .lightbox-close:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    .lightbox-nav {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        transition: all 0.3s ease;
        flex-shrink: 0;
    }
    
    .lightbox-nav:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
    }
    
    .lightbox-nav:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .lightbox-image-container {
        text-align: center;
        max-width: calc(90vw - 140px);
        max-height: 90vh;
    }
    
    .lightbox-image {
        max-width: 100%;
        max-height: calc(90vh - 60px);
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    
    .lightbox-caption {
        color: white;
        margin-top: 15px;
        font-size: 16px;
        font-weight: 500;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @media (max-width: 768px) {
        .lightbox {
            flex-direction: column;
            gap: 10px;
        }
        
        .lightbox-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .lightbox-prev {
            left: 10px;
        }
        
        .lightbox-next {
            right: 10px;
        }
        
        .lightbox-image-container {
            max-width: 90vw;
        }
        
        .lightbox-close {
            top: 20px;
            right: 20px;
        }
    }
`;
document.head.appendChild(style);

/**
 * About Us Admin Manager - Estudio Artesana
 * Manages the 9 images for the About Us page collage
 */

class AboutUsAdminManager {
    constructor() {
        this.images = [];
        this.defaultImages = this.getDefaultImages();
        this.storageKey = 'estudio_artesana_about_images';
        this.currentImageIndex = null;
        this.selectedFile = null;
        
        this.init();
    }
    
    init() {
        this.initializeElements();
        this.bindEvents();
        this.loadImages();
        this.updateCloudinaryStatus();
        this.renderImages();
        this.updateStats();
    }
    
    initializeElements() {
        this.aboutImagesAdmin = document.getElementById('aboutImagesAdmin');
        this.cloudinaryImages = document.getElementById('cloudinaryImages');
        this.lastModified = document.getElementById('lastModified');
        this.cloudinaryCloudName = document.getElementById('cloudinaryCloudName');
        this.statusText = document.getElementById('statusText');
        
        // Modal elements
        this.aboutImageModal = document.getElementById('aboutImageModal');
        this.modalImageTitle = document.getElementById('modalImageTitle');
        this.modalImageDescription = document.getElementById('modalImageDescription');
        this.aboutUploadArea = document.getElementById('aboutUploadArea');
        this.aboutImageInput = document.getElementById('aboutImageInput');
        this.currentAboutImageSection = document.getElementById('currentAboutImageSection');
        this.currentAboutImage = document.getElementById('currentAboutImage');
        this.aboutImagePreview = document.getElementById('aboutImagePreview');
        this.previewAboutImage = document.getElementById('previewAboutImage');
        this.aboutImageTitle = document.getElementById('aboutImageTitle');
        this.aboutImageAlt = document.getElementById('aboutImageAlt');
        this.aboutUploadProgress = document.getElementById('aboutUploadProgress');
        this.aboutProgressFill = document.getElementById('aboutProgressFill');
        this.aboutProgressText = document.getElementById('aboutProgressText');
        
        // Action buttons
        this.exportAboutBtn = document.getElementById('exportAboutBtn');
        this.importAboutBtn = document.getElementById('importAboutBtn');
        this.importAboutFile = document.getElementById('importAboutFile');
        this.resetAboutBtn = document.getElementById('resetAboutBtn');
        this.updateAllBtn = document.getElementById('updateAllBtn');
        
        // Modal buttons
        this.closeAboutModal = document.getElementById('closeAboutModal');
        this.cancelAboutBtn = document.getElementById('cancelAboutBtn');
        this.saveAboutBtn = document.getElementById('saveAboutBtn');
    }
    
    bindEvents() {
        // Action buttons
        this.exportAboutBtn?.addEventListener('click', () => this.exportConfiguration());
        this.importAboutBtn?.addEventListener('click', () => this.importAboutFile.click());
        this.importAboutFile?.addEventListener('change', (e) => this.importConfiguration(e));
        this.resetAboutBtn?.addEventListener('click', () => this.resetToDefaults());
        this.updateAllBtn?.addEventListener('click', () => this.updateAllImages());
        
        // Modal events
        this.closeAboutModal?.addEventListener('click', () => this.closeModal());
        this.cancelAboutBtn?.addEventListener('click', () => this.closeModal());
        this.saveAboutBtn?.addEventListener('click', () => this.uploadAndSaveImage());
        
        // Upload area events
        this.aboutUploadArea?.addEventListener('click', () => this.aboutImageInput.click());
        this.aboutUploadArea?.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.aboutUploadArea?.addEventListener('drop', (e) => this.handleDrop(e));
        this.aboutImageInput?.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Close modal on overlay click
        this.aboutImageModal?.addEventListener('click', (e) => {
            if (e.target === this.aboutImageModal) this.closeModal();
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.aboutImageModal.style.display === 'flex') {
                this.closeModal();
            }
        });
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
        if (!this.aboutImagesAdmin) return;
        
        let html = '';
        
        this.images.forEach((image, index) => {
            const isCloudinary = image.cloudinaryId ? true : false;
            html += `
                <div class="admin-about-image-card" data-index="${index}">
                    <div class="admin-image-number">${index + 1}</div>
                    <div class="admin-image-preview">
                        <img src="${image.src}" alt="${image.alt}" loading="lazy">
                        ${isCloudinary ? '<div class="cloudinary-badge"><i class="fas fa-cloud"></i></div>' : ''}
                    </div>
                    <div class="admin-image-info">
                        <h4>${image.title}</h4>
                        <p>${image.alt}</p>
                        <div class="admin-image-actions">
                            <button class="btn btn-sm btn-primary update-image-btn" data-index="${index}">
                                <i class="fas fa-edit"></i>
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        this.aboutImagesAdmin.innerHTML = html;
        
        // Bind update buttons
        this.aboutImagesAdmin.querySelectorAll('.update-image-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('[data-index]').dataset.index);
                this.openImageModal(index);
            });
        });
    }
    
    openImageModal(index) {
        this.currentImageIndex = index;
        const image = this.images[index];
        
        this.modalImageTitle.textContent = `Imagen #${index + 1}`;
        this.modalImageDescription.textContent = `Actualizar: ${image.title}`;
        
        this.currentAboutImage.src = image.src;
        this.currentAboutImageSection.style.display = 'block';
        
        this.aboutImageTitle.value = image.title;
        this.aboutImageAlt.value = image.alt;
        
        this.aboutImagePreview.style.display = 'none';
        this.aboutUploadProgress.style.display = 'none';
        this.saveAboutBtn.disabled = true;
        this.selectedFile = null;
        
        this.resetUploadArea();
        
        this.aboutImageModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        this.aboutImageModal.style.display = 'none';
        document.body.style.overflow = '';
        this.currentImageIndex = null;
        this.selectedFile = null;
        this.resetUploadArea();
    }
    
    handleDragOver(e) {
        e.preventDefault();
        this.aboutUploadArea.classList.add('drag-over');
    }
    
    handleDrop(e) {
        e.preventDefault();
        this.aboutUploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }
    
    processFile(file) {
        if (!this.validateFile(file)) return;
        
        this.selectedFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewAboutImage.src = e.target.result;
            this.aboutImagePreview.style.display = 'block';
            this.saveAboutBtn.disabled = false;
            
            this.aboutUploadArea.classList.add('has-file');
            this.aboutUploadArea.innerHTML = `
                <div class="upload-content">
                    <i class="fas fa-check-circle"></i>
                    <p><strong>${file.name}</strong> seleccionado</p>
                    <p class="upload-hint">Haz clic en "Guardar" para subir la imagen</p>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
    
    validateFile(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        
        if (!allowedTypes.includes(file.type)) {
            this.showNotification('Tipo de archivo no válido. Use JPG, PNG o WEBP.', 'error');
            return false;
        }
        
        if (file.size > maxSize) {
            this.showNotification('El archivo es muy grande. Máximo 5MB.', 'error');
            return false;
        }
        
        return true;
    }
    
    async uploadAndSaveImage() {
        if (!this.selectedFile || this.currentImageIndex === null) return;
        
        this.saveAboutBtn.disabled = true;
        this.aboutUploadProgress.style.display = 'block';
        
        try {
            this.updateProgress(0, 'Subiendo...');
            
            // Upload to Cloudinary if configured
            let imageUrl = this.selectedFile;
            let cloudinaryId = null;
            
            if (window.CloudinaryService && window.CloudinaryService.isConfigured) {
                const result = await window.CloudinaryService.uploadImage(this.selectedFile, {
                    folder: 'about-us',
                    public_id: `about-image-${this.currentImageIndex + 1}-${Date.now()}`
                });
                
                imageUrl = result.url;
                cloudinaryId = result.publicId;
                this.updateProgress(90, 'Guardando...');
            } else {
                // Fallback to local preview
                const reader = new FileReader();
                imageUrl = await new Promise(resolve => {
                    reader.onload = e => resolve(e.target.result);
                    reader.readAsDataURL(this.selectedFile);
                });
            }
            
            // Update image data
            this.images[this.currentImageIndex] = {
                ...this.images[this.currentImageIndex],
                src: imageUrl,
                title: this.aboutImageTitle.value.trim() || this.images[this.currentImageIndex].title,
                alt: this.aboutImageAlt.value.trim() || this.images[this.currentImageIndex].alt,
                cloudinaryId: cloudinaryId
            };
            
            this.saveImages();
            this.updateProgress(100, 'Completado');
            
            setTimeout(() => {
                this.closeModal();
                this.renderImages();
                this.updateStats();
                this.showNotification(
                    `Imagen #${this.currentImageIndex + 1} actualizada correctamente`,
                    'success'
                );
            }, 500);
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Error al subir la imagen: ' + error.message, 'error');
        } finally {
            this.aboutUploadProgress.style.display = 'none';
            this.saveAboutBtn.disabled = false;
        }
    }
    
    updateProgress(percentage, text) {
        this.aboutProgressFill.style.width = `${percentage}%`;
        this.aboutProgressText.textContent = `${text} ${percentage}%`;
    }
    
    resetUploadArea() {
        this.aboutUploadArea.classList.remove('has-file', 'drag-over');
        this.aboutUploadArea.innerHTML = `
            <div class="upload-content">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Arrastra una imagen aquí o haz clic para seleccionar</p>
                <p class="upload-hint">Formatos soportados: JPG, PNG, WEBP (máximo 5MB)</p>
            </div>
        `;
        
        if (this.aboutImageInput) {
            this.aboutImageInput.value = '';
        }
    }
    
    updateStats() {
        const cloudinaryCount = this.images.filter(img => img.cloudinaryId).length;
        if (this.cloudinaryImages) {
            this.cloudinaryImages.textContent = cloudinaryCount;
        }
        
        if (this.lastModified) {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    if (data.lastModified) {
                        const date = new Date(data.lastModified);
                        this.lastModified.textContent = date.toLocaleDateString();
                    } else {
                        this.lastModified.textContent = 'Hoy';
                    }
                } catch {
                    this.lastModified.textContent = 'Hoy';
                }
            }
        }
    }
    
    updateCloudinaryStatus() {
        if (window.CloudinaryService && window.CloudinaryService.isConfigured) {
            if (this.statusText) {
                this.statusText.textContent = 'Configurado';
                this.statusText.className = 'status-success';
            }
            if (this.cloudinaryCloudName) {
                this.cloudinaryCloudName.textContent = window.CloudinaryService.config.cloudName;
            }
        } else {
            if (this.statusText) {
                this.statusText.textContent = 'No configurado';
                this.statusText.className = 'status-error';
            }
        }
    }
    
    resetToDefaults() {
        if (confirm('¿Restablecer todas las imágenes a los valores por defecto?')) {
            this.images = [...this.defaultImages];
            this.saveImages();
            this.renderImages();
            this.updateStats();
            this.showNotification('Imágenes restablecidas a los valores por defecto', 'success');
        }
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
        
        this.showNotification('Configuración exportada correctamente', 'success');
    }
    
    importConfiguration(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                
                if (config.images && Array.isArray(config.images) && config.images.length === 9) {
                    this.images = config.images;
                    this.saveImages();
                    this.renderImages();
                    this.updateStats();
                    this.showNotification('Configuración importada correctamente', 'success');
                } else {
                    this.showNotification('Archivo de configuración inválido', 'error');
                }
            } catch (error) {
                this.showNotification('Error al importar configuración: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }
    
    updateAllImages() {
        this.showNotification('Función de actualización masiva en desarrollo', 'info');
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `admin-notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 8px;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.aboutUsAdminManager = new AboutUsAdminManager();
});

// Add CSS for the admin images grid
const style = document.createElement('style');
style.textContent = `
    .about-images-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        padding: 20px;
    }
    
    .admin-about-image-card {
        background: var(--white);
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        position: relative;
    }
    
    .admin-about-image-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .admin-image-number {
        position: absolute;
        top: 10px;
        left: 10px;
        background: var(--secondary-color);
        color: #000;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        z-index: 2;
    }
    
    .admin-image-preview {
        position: relative;
        height: 150px;
        overflow: hidden;
    }
    
    .admin-image-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .cloudinary-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background: #10b981;
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
    }
    
    .admin-image-info {
        padding: 15px;
    }
    
    .admin-image-info h4 {
        margin: 0 0 5px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--text-color);
    }
    
    .admin-image-info p {
        margin: 0 0 10px 0;
        font-size: 12px;
        color: var(--light-text);
        line-height: 1.3;
    }
    
    .admin-image-actions {
        display: flex;
        gap: 8px;
    }
    
    @media (max-width: 768px) {
        .about-images-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
    }
    
    @media (max-width: 480px) {
        .about-images-grid {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(style);

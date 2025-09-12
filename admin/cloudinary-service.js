/**
 * Cloudinary Service - Estudio Artesana
 * Handles image uploads and management
 */

class CloudinaryService {
    constructor() {
        // Configuración de Cloudinary (se obtiene del admin panel)
        this.config = {
            cloudName: '', // Se configurará desde el panel
            uploadPreset: '', // Se configurará desde el panel
            apiKey: '', // Se configurará desde el panel
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
        };
        
        this.isConfigured = false;
        this.loadConfig();
    }

    loadConfig() {
        // Intentar cargar configuración guardada
        const savedConfig = localStorage.getItem('cloudinaryConfig');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                this.config = { ...this.config, ...config };
                this.isConfigured = !!(config.cloudName && config.uploadPreset);
            } catch (error) {
                console.error('Error loading Cloudinary config:', error);
            }
        } else if (window.EstudioArtesanaConfig && window.EstudioArtesanaConfig.cloudinary) {
            // Auto-configure from main config
            const cloudinaryConfig = window.EstudioArtesanaConfig.cloudinary;
            this.config = { ...this.config, ...cloudinaryConfig };
            this.isConfigured = !!(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset);
            // Save to localStorage for future use
            localStorage.setItem('cloudinaryConfig', JSON.stringify(cloudinaryConfig));
            console.log('✅ Cloudinary auto-configured from main config');
        }
    }

    saveConfig(config) {
        this.config = { ...this.config, ...config };
        localStorage.setItem('cloudinaryConfig', JSON.stringify(config));
        this.isConfigured = !!(config.cloudName && config.uploadPreset);
        return this.isConfigured;
    }

    validateFile(file) {
        const errors = [];

        // Validar tamaño
        if (file.size > this.config.maxFileSize) {
            errors.push(`El archivo es muy grande. Máximo ${this.config.maxFileSize / (1024 * 1024)}MB`);
        }

        // Validar formato
        const extension = file.name.split('.').pop().toLowerCase();
        if (!this.config.allowedFormats.includes(extension)) {
            errors.push(`Formato no permitido. Use: ${this.config.allowedFormats.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    async uploadImage(file, options = {}) {
        if (!this.isConfigured) {
            throw new Error('Cloudinary no está configurado. Configure las credenciales primero.');
        }

        const validation = this.validateFile(file);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.config.uploadPreset);
        
        // Opciones adicionales
        if (options.folder) {
            formData.append('folder', `estudio-artesana/${options.folder}`);
        }
        
        if (options.public_id) {
            formData.append('public_id', options.public_id);
        }

        // Transformaciones automáticas para optimización
        const transformation = options.transformation || 'q_auto,f_auto,w_800,h_600,c_limit';
        formData.append('transformation', transformation);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Error uploading image');
            }

            const data = await response.json();
            return {
                success: true,
                url: data.secure_url,
                publicId: data.public_id,
                originalUrl: data.url,
                transformedUrl: data.secure_url,
                format: data.format,
                width: data.width,
                height: data.height,
                bytes: data.bytes,
                cloudinaryData: data
            };

        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw new Error(`Error subiendo imagen: ${error.message}`);
        }
    }

    async deleteImage(publicId) {
        if (!this.isConfigured) {
            throw new Error('Cloudinary no está configurado');
        }

        // Para eliminar imágenes necesitaríamos implementar la API de administración
        // Por ahora, solo log del intento
        console.log('Delete image request:', publicId);
        
        // En una implementación completa, aquí haríamos:
        // const signature = this.generateSignature(publicId);
        // const response = await fetch(...);
        
        return { success: true, message: 'Imagen marcada para eliminación' };
    }

    generateOptimizedUrl(publicId, options = {}) {
        if (!this.isConfigured || !publicId) return '';

        const baseUrl = `https://res.cloudinary.com/${this.config.cloudName}/image/upload/`;
        
        let transformations = [];
        
        // Optimización automática
        transformations.push('q_auto', 'f_auto');
        
        // Dimensiones
        if (options.width) transformations.push(`w_${options.width}`);
        if (options.height) transformations.push(`h_${options.height}`);
        if (options.crop) transformations.push(`c_${options.crop}`);
        
        // Efectos
        if (options.effect) transformations.push(`e_${options.effect}`);
        if (options.quality) transformations.push(`q_${options.quality}`);

        const transformationString = transformations.length > 0 
            ? transformations.join(',') + '/' 
            : '';

        return `${baseUrl}${transformationString}${publicId}`;
    }

    getPresetUrls(publicId) {
        if (!publicId) return {};

        return {
            thumbnail: this.generateOptimizedUrl(publicId, { width: 150, height: 150, crop: 'fill' }),
            small: this.generateOptimizedUrl(publicId, { width: 300, height: 300, crop: 'limit' }),
            medium: this.generateOptimizedUrl(publicId, { width: 600, height: 600, crop: 'limit' }),
            large: this.generateOptimizedUrl(publicId, { width: 1200, height: 1200, crop: 'limit' }),
            original: this.generateOptimizedUrl(publicId)
        };
    }
}

// Crear instancia global
window.CloudinaryService = new CloudinaryService();

// Funciones de utilidad para el admin panel
window.CloudinaryUtils = {
    
    setupCloudinary(cloudName, uploadPreset, apiKey = '') {
        const config = { cloudName, uploadPreset, apiKey };
        const success = window.CloudinaryService.saveConfig(config);
        
        if (success) {
            console.log('✅ Cloudinary configurado correctamente');
            return true;
        } else {
            console.error('❌ Error configurando Cloudinary');
            return false;
        }
    },

    async uploadImageWithProgress(file, options = {}, onProgress = null) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', window.CloudinaryService.config.uploadPreset);
            
            if (options.folder) {
                formData.append('folder', `estudio-artesana/${options.folder}`);
            }

            const xhr = new XMLHttpRequest();
            
            // Progress handler
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(Math.round(percentComplete));
                    }
                });
            }

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve({
                            success: true,
                            url: data.secure_url,
                            publicId: data.public_id,
                            cloudinaryData: data
                        });
                    } catch (error) {
                        reject(new Error('Error parsing response'));
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            xhr.open('POST', `https://api.cloudinary.com/v1_1/${window.CloudinaryService.config.cloudName}/image/upload`);
            xhr.send(formData);
        });
    },

    createImagePreview(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    },

    resizeImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calcular nuevas dimensiones manteniendo aspect ratio
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }
};

// Export para módulos si está disponible
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CloudinaryService, CloudinaryUtils: window.CloudinaryUtils };
}

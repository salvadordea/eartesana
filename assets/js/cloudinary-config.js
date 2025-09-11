// Cloudinary Configuration for Estudio Artesana
class CloudinaryManager {
    constructor() {
        // Configuración pública de Cloudinary
        this.cloudName = 'estudio-artesana'; // Cambiar por tu cloud name
        this.uploadPreset = 'artesana-preset'; // Cambiar por tu upload preset
        this.apiKey = ''; // Se configurará en el panel admin
        this.baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload/`;
        
        this.init();
    }

    init() {
        // Cargar configuración desde localStorage si existe
        const savedConfig = localStorage.getItem('cloudinaryConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            this.cloudName = config.cloudName || this.cloudName;
            this.uploadPreset = config.uploadPreset || this.uploadPreset;
            this.baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload/`;
        }
    }

    // Configurar credenciales (usado desde panel admin)
    configure(cloudName, uploadPreset, apiKey) {
        this.cloudName = cloudName;
        this.uploadPreset = uploadPreset;
        this.apiKey = apiKey;
        this.baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload/`;
        
        // Guardar configuración
        localStorage.setItem('cloudinaryConfig', JSON.stringify({
            cloudName,
            uploadPreset,
            apiKey
        }));
    }

    // Generar URL optimizada para imágenes
    generateImageUrl(publicId, transformations = {}) {
        if (!publicId) return this.getPlaceholderUrl();
        
        const defaultTransforms = {
            quality: 'auto',
            format: 'auto',
            width: 800,
            height: 600,
            crop: 'fill'
        };
        
        const transforms = { ...defaultTransforms, ...transformations };
        const transformString = this.buildTransformString(transforms);
        
        return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformString}/${publicId}`;
    }

    // Construir string de transformaciones
    buildTransformString(transforms) {
        const parts = [];
        
        if (transforms.width) parts.push(`w_${transforms.width}`);
        if (transforms.height) parts.push(`h_${transforms.height}`);
        if (transforms.crop) parts.push(`c_${transforms.crop}`);
        if (transforms.quality) parts.push(`q_${transforms.quality}`);
        if (transforms.format) parts.push(`f_${transforms.format}`);
        if (transforms.blur) parts.push(`e_blur:${transforms.blur}`);
        if (transforms.brightness) parts.push(`e_brightness:${transforms.brightness}`);
        if (transforms.contrast) parts.push(`e_contrast:${transforms.contrast}`);
        
        return parts.join(',');
    }

    // URLs para diferentes tamaños
    getImageUrls(publicId) {
        return {
            thumbnail: this.generateImageUrl(publicId, { width: 200, height: 200 }),
            small: this.generateImageUrl(publicId, { width: 400, height: 300 }),
            medium: this.generateImageUrl(publicId, { width: 800, height: 600 }),
            large: this.generateImageUrl(publicId, { width: 1200, height: 900 }),
            hero: this.generateImageUrl(publicId, { width: 1920, height: 1080 }),
            // Versiones WebP para mejor performance
            thumbnailWebp: this.generateImageUrl(publicId, { width: 200, height: 200, format: 'webp' }),
            smallWebp: this.generateImageUrl(publicId, { width: 400, height: 300, format: 'webp' }),
            mediumWebp: this.generateImageUrl(publicId, { width: 800, height: 600, format: 'webp' }),
        };
    }

    // Placeholder mientras cargan las imágenes
    getPlaceholderUrl(width = 800, height = 600) {
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f0f0f0"/>
                <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" 
                      fill="#999" text-anchor="middle" dy=".3em">Cargando...</text>
            </svg>
        `)}`;
    }

    // Subir imagen (para uso en panel admin)
    async uploadImage(file, options = {}) {
        if (!this.uploadPreset) {
            throw new Error('Upload preset no configurado');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.uploadPreset);
        
        if (options.folder) formData.append('folder', options.folder);
        if (options.public_id) formData.append('public_id', options.public_id);
        if (options.tags) formData.append('tags', options.tags.join(','));

        const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Error al subir imagen a Cloudinary');
        }

        return await response.json();
    }

    // Eliminar imagen (para uso en panel admin)
    async deleteImage(publicId) {
        if (!this.apiKey) {
            throw new Error('API Key no configurada');
        }

        const timestamp = Math.round(Date.now() / 1000);
        const signature = await this.generateSignature(publicId, timestamp);

        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('timestamp', timestamp);
        formData.append('api_key', this.apiKey);
        formData.append('signature', signature);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`, {
            method: 'POST',
            body: formData
        });

        return await response.json();
    }

    // Generar firma para API calls autenticadas
    async generateSignature(publicId, timestamp) {
        // Nota: En producción, la firma debería generarse en el servidor
        // por seguridad. Aquí es solo para demo.
        const params = `public_id=${publicId}&timestamp=${timestamp}`;
        const signature = await this.sha1(`${params}${this.apiSecret}`);
        return signature;
    }

    // Helper SHA1 (para firmas)
    async sha1(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Crear elemento de imagen responsiva con lazy loading
    createResponsiveImage(publicId, alt = '', className = '') {
        if (!publicId) {
            const img = document.createElement('img');
            img.src = this.getPlaceholderUrl();
            img.alt = alt;
            img.className = className;
            return img;
        }

        const urls = this.getImageUrls(publicId);
        
        const picture = document.createElement('picture');
        
        // WebP sources para navegadores compatibles
        const webpSource = document.createElement('source');
        webpSource.srcset = `
            ${urls.thumbnailWebp} 200w,
            ${urls.smallWebp} 400w,
            ${urls.mediumWebp} 800w
        `;
        webpSource.type = 'image/webp';
        webpSource.sizes = '(max-width: 480px) 200px, (max-width: 768px) 400px, 800px';
        
        // Fallback JPEG/PNG
        const fallbackSource = document.createElement('source');
        fallbackSource.srcset = `
            ${urls.thumbnail} 200w,
            ${urls.small} 400w,
            ${urls.medium} 800w
        `;
        fallbackSource.sizes = '(max-width: 480px) 200px, (max-width: 768px) 400px, 800px';
        
        // Imagen principal
        const img = document.createElement('img');
        img.src = urls.medium;
        img.alt = alt;
        img.className = className;
        img.loading = 'lazy'; // Lazy loading nativo
        
        picture.appendChild(webpSource);
        picture.appendChild(fallbackSource);
        picture.appendChild(img);
        
        return picture;
    }
}

// Instancia global
window.CloudinaryManager = new CloudinaryManager();

// Configuraciones predefinidas para diferentes usos
window.CloudinaryPresets = {
    hero: { width: 1920, height: 800, crop: 'fill', quality: 'auto', format: 'auto' },
    carousel: { width: 800, height: 400, crop: 'fill', quality: 'auto', format: 'auto' },
    category: { width: 400, height: 300, crop: 'fill', quality: 'auto', format: 'auto' },
    product: { width: 600, height: 600, crop: 'pad', quality: 'auto', format: 'auto' },
    thumbnail: { width: 200, height: 200, crop: 'fill', quality: 'auto', format: 'auto' },
    logo: { width: 200, height: 100, crop: 'fit', quality: 'auto', format: 'auto' }
};

/**
 * ACTUALIZACIÓN DE URLs DE IMÁGENES EN SUPABASE
 * =============================================
 * Script para cambiar URLs de WordPress por URLs locales
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// ==========================================
// CONFIGURACIÓN
// ==========================================

const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTg5MzUsImV4cCI6MjA3MzUzNDkzNX0.qEijwK3FlnqXP2qw0gl438Tt-Rd1vrfts1cXslUuteU';

const SUPABASE_HEADERS = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
};

// ==========================================
// MAPEO DE IMÁGENES LOCAL
// ==========================================

class ImageUpdater {
    constructor() {
        this.stats = {
            productsProcessed: 0,
            productsUpdated: 0,
            imagesProcessed: 0,
            imagesUpdated: 0,
            errors: 0
        };
    }

    async updateImageUrls() {
        console.log('🖼️ ACTUALIZANDO URLs DE IMÁGENES EN SUPABASE');
        console.log('===========================================\n');

        try {
            // 1. Obtener todos los productos
            const products = await this.getAllProducts();
            
            // 2. Actualizar imágenes principales de productos
            await this.updateProductMainImages(products);
            
            // 3. Actualizar imágenes de la tabla product_images
            await this.updateProductImages();
            
            // 4. Mostrar estadísticas
            this.showStats();
            
            console.log('\n✅ ACTUALIZACIÓN DE IMÁGENES COMPLETADA!');
            
        } catch (error) {
            console.error('❌ Error actualizando imágenes:', error);
        }
    }

    async getAllProducts() {
        console.log('📦 Obteniendo productos...');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name,main_image_url`, {
            method: 'GET',
            headers: SUPABASE_HEADERS
        });

        if (!response.ok) {
            throw new Error(`Error obteniendo productos: ${response.status}`);
        }

        const products = await response.json();
        console.log(`✅ ${products.length} productos obtenidos\n`);
        
        return products;
    }

    async updateProductMainImages(products) {
        console.log('🖼️ Actualizando imágenes principales de productos...\n');

        for (const product of products) {
            this.stats.productsProcessed++;
            
            if (!product.main_image_url) {
                console.log(`⏭️ Producto "${product.name}": Sin imagen principal`);
                continue;
            }

            const newImageUrl = this.convertToLocalImageUrl(product.main_image_url, product.name);
            
            if (newImageUrl === product.main_image_url) {
                console.log(`⏭️ Producto "${product.name}": Ya tiene URL local`);
                continue;
            }

            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}`, {
                    method: 'PATCH',
                    headers: SUPABASE_HEADERS,
                    body: JSON.stringify({
                        main_image_url: newImageUrl
                    })
                });

                if (response.ok) {
                    console.log(`✅ "${product.name}": ${newImageUrl}`);
                    this.stats.productsUpdated++;
                } else {
                    console.log(`❌ Error actualizando "${product.name}": ${response.status}`);
                    this.stats.errors++;
                }

            } catch (error) {
                console.log(`❌ Error con "${product.name}": ${error.message}`);
                this.stats.errors++;
            }
        }
    }

    async updateProductImages() {
        console.log('\n🖼️ Actualizando tabla product_images...\n');

        // Obtener todas las imágenes de productos
        const response = await fetch(`${SUPABASE_URL}/rest/v1/product_images?select=id,image_url,product_id`, {
            method: 'GET',
            headers: SUPABASE_HEADERS
        });

        if (!response.ok) {
            throw new Error(`Error obteniendo imágenes: ${response.status}`);
        }

        const images = await response.json();
        console.log(`📊 ${images.length} imágenes encontradas en product_images`);

        for (const image of images) {
            this.stats.imagesProcessed++;

            if (!image.image_url) {
                continue;
            }

            const newImageUrl = this.convertToLocalImageUrl(image.image_url);
            
            if (newImageUrl === image.image_url) {
                continue; // Ya es local
            }

            try {
                const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/product_images?id=eq.${image.id}`, {
                    method: 'PATCH',
                    headers: SUPABASE_HEADERS,
                    body: JSON.stringify({
                        image_url: newImageUrl
                    })
                });

                if (updateResponse.ok) {
                    console.log(`✅ Imagen ${image.id}: ${newImageUrl}`);
                    this.stats.imagesUpdated++;
                } else {
                    this.stats.errors++;
                }

            } catch (error) {
                this.stats.errors++;
            }
        }
    }

    convertToLocalImageUrl(originalUrl, productName = '') {
        // Si ya es una URL local, no cambiar
        if (!originalUrl || originalUrl.startsWith('assets/') || originalUrl.startsWith('./assets/') || originalUrl.startsWith('/assets/')) {
            return originalUrl;
        }

        // Si es de WordPress, convertir a local
        if (originalUrl.includes('wordpress.com') || originalUrl.includes('wp-content')) {
            // Extraer el nombre del archivo
            const fileName = originalUrl.split('/').pop().split('?')[0];
            
            // Crear ruta local
            return `assets/images/products/${fileName}`;
        }

        // Si es otra URL externa, también convertir
        if (originalUrl.startsWith('http')) {
            const fileName = originalUrl.split('/').pop().split('?')[0];
            
            // Si no tiene extensión, usar nombre del producto
            if (!fileName.includes('.') && productName) {
                const slugName = this.slugify(productName);
                return `assets/images/products/${slugName}.jpg`;
            }
            
            return `assets/images/products/${fileName}`;
        }

        // Si no es reconocida, devolver como está
        return originalUrl;
    }

    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/[^a-z0-9 -]/g, '') // Remover caracteres especiales
            .replace(/\s+/g, '-') // Espacios a guiones
            .replace(/-+/g, '-') // Múltiples guiones a uno
            .trim('-');
    }

    showStats() {
        console.log('\n📊 ESTADÍSTICAS DE ACTUALIZACIÓN:');
        console.log('==================================');
        console.log(`📦 Productos procesados: ${this.stats.productsProcessed}`);
        console.log(`✅ Productos actualizados: ${this.stats.productsUpdated}`);
        console.log(`🖼️ Imágenes procesadas: ${this.stats.imagesProcessed}`);
        console.log(`✅ Imágenes actualizadas: ${this.stats.imagesUpdated}`);
        console.log(`❌ Errores: ${this.stats.errors}`);
        
        const totalUpdated = this.stats.productsUpdated + this.stats.imagesUpdated;
        console.log(`🎯 Total actualizaciones: ${totalUpdated}`);
    }
}

// ==========================================
// EJECUTAR ACTUALIZACIÓN
// ==========================================

async function main() {
    console.log('ESTUDIO ARTESANA - ACTUALIZACIÓN DE IMÁGENES');
    console.log('============================================\n');
    
    const updater = new ImageUpdater();
    await updater.updateImageUrls();
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { ImageUpdater };

/**
 * CONFIGURACIÓN DE SUPABASE STORAGE PARA IMÁGENES
 * ==============================================
 * Script para crear buckets y migrar URLs de imágenes a Supabase Storage
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
// CONFIGURADOR DE STORAGE
// ==========================================

class SupabaseStorageSetup {
    constructor() {
        this.bucketName = 'product-images';
        this.stats = {
            bucketsCreated: 0,
            productsUpdated: 0,
            imagesUpdated: 0,
            errors: 0
        };
    }

    async setupStorage() {
        console.log('🗂️ CONFIGURANDO SUPABASE STORAGE');
        console.log('=================================\n');

        try {
            // 1. Verificar si el bucket ya existe
            await this.checkOrCreateBucket();
            
            // 2. Actualizar URLs de productos para usar Supabase Storage
            await this.updateProductImageUrls();
            
            // 3. Actualizar URLs en product_images
            await this.updateProductImagesTable();
            
            // 4. Mostrar instrucciones finales
            this.showInstructions();
            
            console.log('\n✅ CONFIGURACIÓN DE STORAGE COMPLETADA!');
            
        } catch (error) {
            console.error('❌ Error configurando storage:', error);
        }
    }

    async checkOrCreateBucket() {
        console.log('🪣 Verificando bucket de imágenes...');
        
        try {
            // Intentar obtener el bucket
            const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${this.bucketName}`, {
                method: 'GET',
                headers: SUPABASE_HEADERS
            });

            if (response.status === 404) {
                console.log('📦 Bucket no existe, creando...');
                await this.createBucket();
            } else if (response.ok) {
                console.log('✅ Bucket ya existe');
            } else {
                console.log('⚠️ Error verificando bucket:', response.status);
            }

        } catch (error) {
            console.log('⚠️ Error verificando bucket:', error.message);
        }
    }

    async createBucket() {
        try {
            const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
                method: 'POST',
                headers: SUPABASE_HEADERS,
                body: JSON.stringify({
                    name: this.bucketName,
                    public: true,
                    file_size_limit: 52428800, // 50MB
                    allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
                })
            });

            if (response.ok) {
                console.log('✅ Bucket creado exitosamente');
                this.stats.bucketsCreated++;
            } else {
                const errorText = await response.text();
                console.log('❌ Error creando bucket:', errorText);
                this.stats.errors++;
            }

        } catch (error) {
            console.log('❌ Error creando bucket:', error.message);
            this.stats.errors++;
        }
    }

    async updateProductImageUrls() {
        console.log('\n🖼️ Actualizando URLs de imágenes principales...');

        try {
            // Obtener todos los productos
            const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name,main_image_url`, {
                method: 'GET',
                headers: SUPABASE_HEADERS
            });

            if (!response.ok) {
                throw new Error(`Error obteniendo productos: ${response.status}`);
            }

            const products = await response.json();
            console.log(`📊 Procesando ${products.length} productos...`);

            for (const product of products) {
                if (product.main_image_url && !product.main_image_url.includes('supabase')) {
                    const newImageUrl = this.convertToSupabaseStorageUrl(product.main_image_url, product.name);
                    
                    try {
                        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}`, {
                            method: 'PATCH',
                            headers: SUPABASE_HEADERS,
                            body: JSON.stringify({
                                main_image_url: newImageUrl
                            })
                        });

                        if (updateResponse.ok) {
                            console.log(`✅ "${product.name}": ${newImageUrl}`);
                            this.stats.productsUpdated++;
                        } else {
                            this.stats.errors++;
                        }

                    } catch (error) {
                        this.stats.errors++;
                    }
                }
            }

        } catch (error) {
            console.error('❌ Error actualizando productos:', error);
        }
    }

    async updateProductImagesTable() {
        console.log('\n🖼️ Actualizando tabla product_images...');

        try {
            // Obtener todas las imágenes
            const response = await fetch(`${SUPABASE_URL}/rest/v1/product_images?select=id,image_url`, {
                method: 'GET',
                headers: SUPABASE_HEADERS
            });

            if (!response.ok) {
                throw new Error(`Error obteniendo imágenes: ${response.status}`);
            }

            const images = await response.json();
            console.log(`📊 Procesando ${images.length} imágenes...`);

            for (const image of images) {
                if (image.image_url && !image.image_url.includes('supabase')) {
                    const newImageUrl = this.convertToSupabaseStorageUrl(image.image_url);
                    
                    try {
                        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/product_images?id=eq.${image.id}`, {
                            method: 'PATCH',
                            headers: SUPABASE_HEADERS,
                            body: JSON.stringify({
                                image_url: newImageUrl
                            })
                        });

                        if (updateResponse.ok) {
                            console.log(`✅ Imagen ${image.id} actualizada`);
                            this.stats.imagesUpdated++;
                        } else {
                            this.stats.errors++;
                        }

                    } catch (error) {
                        this.stats.errors++;
                    }
                }
            }

        } catch (error) {
            console.error('❌ Error actualizando imágenes:', error);
        }
    }

    convertToSupabaseStorageUrl(originalUrl, productName = '') {
        if (!originalUrl) {
            return `${SUPABASE_URL}/storage/v1/object/public/${this.bucketName}/placeholder.jpg`;
        }

        // Si ya es una URL de Supabase Storage, mantenerla
        if (originalUrl.includes('supabase') && originalUrl.includes('storage')) {
            return originalUrl;
        }

        // Extraer el nombre del archivo
        let fileName = originalUrl.split('/').pop().split('?')[0];
        
        // Si no tiene extensión válida, usar el nombre del producto
        if (!fileName.includes('.') && productName) {
            const slugName = this.slugify(productName);
            fileName = `${slugName}.jpg`;
        }

        // Crear URL de Supabase Storage
        return `${SUPABASE_URL}/storage/v1/object/public/${this.bucketName}/${fileName}`;
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

    showInstructions() {
        console.log('\n📋 INSTRUCCIONES PARA COMPLETAR LA CONFIGURACIÓN:');
        console.log('================================================');
        console.log('');
        console.log('1. 📂 Ve a tu panel de Supabase:');
        console.log(`   ${SUPABASE_URL.replace('/rest/v1', '')}/project/default/storage/buckets`);
        console.log('');
        console.log('2. 🖼️ Sube tus imágenes al bucket "product-images":');
        console.log('   - Arrastra y suelta los archivos de imagen');
        console.log('   - O usa el botón "Upload file"');
        console.log('');
        console.log('3. ✅ Las imágenes estarán disponibles automáticamente en:');
        console.log(`   ${SUPABASE_URL}/storage/v1/object/public/${this.bucketName}/[nombre-archivo]`);
        console.log('');
        console.log('4. 🎯 BENEFICIOS DE SUPABASE STORAGE:');
        console.log('   ✓ CDN global automático');
        console.log('   ✓ Optimización de imágenes');
        console.log('   ✓ Transformaciones dinámicas');
        console.log('   ✓ Carga rápida desde cualquier ubicación');
        console.log('');
        
        console.log('📊 ESTADÍSTICAS:');
        console.log(`🪣 Buckets creados: ${this.stats.bucketsCreated}`);
        console.log(`📦 Productos actualizados: ${this.stats.productsUpdated}`);
        console.log(`🖼️ Imágenes actualizadas: ${this.stats.imagesUpdated}`);
        console.log(`❌ Errores: ${this.stats.errors}`);
    }
}

// ==========================================
// EJECUTAR CONFIGURACIÓN
// ==========================================

async function main() {
    console.log('ESTUDIO ARTESANA - SUPABASE STORAGE');
    console.log('===================================\n');
    
    const setup = new SupabaseStorageSetup();
    await setup.setupStorage();
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { SupabaseStorageSetup };

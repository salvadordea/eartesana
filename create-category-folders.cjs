/**
 * SCRIPT PARA CREAR ESTRUCTURA DE CARPETAS EN SUPABASE STORAGE
 * ===========================================================
 * Crea carpetas por categoría en el bucket Products para organizar mejor las imágenes
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Categorías principales que queremos crear
const CATEGORIES = [
    'aretes',
    'collares',
    'pulseras', 
    'anillos',
    'bolsas',
    'cuadernos',
    'llaveros',
    'otros'
];

async function createCategoryFolders() {
    console.log('📁 CREANDO ESTRUCTURA DE CARPETAS EN SUPABASE STORAGE');
    console.log('====================================================\n');

    try {
        // Verificar que el bucket Products existe
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
            throw new Error(`Error obteniendo buckets: ${bucketsError.message}`);
        }

        const productsBucket = buckets.find(bucket => bucket.name === 'product-images');
        let bucketName = 'product-images';
        
        if (!productsBucket) {
            // Intentar con Products
            const altBucket = buckets.find(bucket => bucket.name === 'Products');
            if (altBucket) {
                console.log('✅ Bucket "Products" encontrado');
                bucketName = 'Products';
            } else {
                console.log('❌ Creando bucket "product-images"...');
                const { data, error } = await supabase.storage.createBucket('product-images', {
                    public: true,
                    fileSizeLimit: 52428800, // 50MB
                    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
                });
                
                if (error) {
                    throw new Error(`Error creando bucket: ${error.message}`);
                }
                
                console.log('✅ Bucket "product-images" creado exitosamente');
            }
        } else {
            console.log('✅ Bucket "product-images" encontrado');
        }

        // Crear carpetas para cada categoría
        let foldersCreated = 0;
        let foldersExisting = 0;

        for (const category of CATEGORIES) {
            try {
                // Intentar subir un archivo placeholder para crear la carpeta
                const placeholderContent = new Blob(['placeholder'], { type: 'text/plain' });
                
                const { data, error } = await supabase.storage
                    .from(bucketName)
                    .upload(`${category}/.placeholder`, placeholderContent, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (error) {
                    if (error.message.includes('already exists')) {
                        console.log(`📂 Carpeta "${category}" ya existe`);
                        foldersExisting++;
                    } else {
                        console.log(`❌ Error creando carpeta "${category}": ${error.message}`);
                    }
                } else {
                    console.log(`✅ Carpeta "${category}" creada exitosamente`);
                    foldersCreated++;
                }

                // Crear subcarpetas para variantes
                const subfolders = ['thumbs', 'full', 'variants'];
                
                for (const subfolder of subfolders) {
                    try {
                        const { data: subData, error: subError } = await supabase.storage
                            .from(bucketName)
                            .upload(`${category}/${subfolder}/.placeholder`, placeholderContent, {
                                cacheControl: '3600',
                                upsert: true
                            });

                        if (subError && !subError.message.includes('already exists')) {
                            console.log(`   ⚠️ Error creando subcarpeta "${category}/${subfolder}": ${subError.message}`);
                        } else {
                            console.log(`   📁 Subcarpeta "${category}/${subfolder}" lista`);
                        }
                    } catch (subErr) {
                        console.log(`   ⚠️ Error en subcarpeta "${category}/${subfolder}": ${subErr.message}`);
                    }
                }

            } catch (err) {
                console.log(`❌ Error procesando categoría "${category}": ${err.message}`);
            }
        }

        // Crear carpeta general para variantes
        try {
            const placeholderContent = new Blob(['placeholder'], { type: 'text/plain' });
            
            await supabase.storage
                .from(bucketName)
                .upload('variants/.placeholder', placeholderContent, {
                    cacheControl: '3600',
                    upsert: true
                });
            
            console.log('✅ Carpeta "variants" creada para variantes sin categoría específica');
        } catch (err) {
            console.log('⚠️ Error creando carpeta variants:', err.message);
        }

        console.log('\n📊 RESUMEN:');
        console.log('===========');
        console.log(`✅ Carpetas creadas: ${foldersCreated}`);
        console.log(`📂 Carpetas existentes: ${foldersExisting}`);
        console.log(`📁 Total categorías procesadas: ${CATEGORIES.length}`);
        
        console.log('\n🎯 ESTRUCTURA CREADA:');
        console.log('=====================');
        CATEGORIES.forEach(category => {
            console.log(`📂 ${bucketName}/${category}/`);
            console.log(`   📁 thumbs/ - Para imágenes pequeñas`);
            console.log(`   📁 full/ - Para imágenes completas`);
            console.log(`   📁 variants/ - Para variantes específicas`);
        });
        
        console.log('\n🚀 ¡Estructura de carpetas lista!');
        console.log('Ahora puedes organizar las imágenes por categoría en Supabase Storage.');

    } catch (error) {
        console.error('❌ Error general:', error);
        process.exit(1);
    }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    createCategoryFolders().catch(console.error);
}

module.exports = { createCategoryFolders };

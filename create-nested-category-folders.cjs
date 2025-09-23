/**
 * SCRIPT PARA CREAR ESTRUCTURA DE CARPETAS ANIDADAS EN SUPABASE STORAGE
 * ====================================================================
 * Crea carpetas organizadas por categoría y subcategoría para mejor organización
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Estructura de categorías anidadas
const CATEGORY_STRUCTURE = {
    'Joyeria': [
        'Aretes/arete-geometrico-gigante',
        'Aretes/arete-piel-balancin-oval',
        'Aretes/arete-piel-gota',
        'Aretes/arete-piel-pendulo',
        'Aretes/arete-piel-poligono-chico',
        'Aretes/arete-poligono-grande',
        'Brazaletes/brazalete-dos-lineas',
        'Brazaletes/brazalete-hombre',
        'Brazaletes/brazalete-linea-ancha',
        'Brazaletes/brazalete-lineas-delgadas',
        'Brazaletes/brazalete-liso',
        'Brazaletes/brazalete-piel-pelo'
    ],
    'Backpacks': [
        'backpack-mini'
    ],
    'Bolsas Cruzadas': [
        'bolsa-boton-madera',
        'bolsa-mediana-con-bolsillo-piel-al-frente',
        'cangurera',
        'clutch-chica-con-base',
        'clutch-chica-plana',
        'clutch-grande-con-strap'
    ],
    'Bolsas de Textil y Piel': [
        'bolsa-cilindro-jareta',
        'bolsa-de-playa-gigante',
        'bolsa-de-playa-mediana',
        'bolsa-telar-de-pedal-cruzada'
    ],
    'Bolsas Grandes': [
        'bolsa-gigante-horizontal',
        'bolsa-gigante-vertical',
        'bolsa-gigante-vertical-pelo-y-miel',
        'bolsa-grande-con-jareta',
        'bolsas-gigante-plana'
    ],
    'Bolsas de mano': [
        'bolsa-ovalada-lisa',
        'cartera-tipo-sobre'
    ],
    'Botelleras': [
        'botelleras'
    ],
    'Accesorios': [
        'Carteras/cartera-con-costura',
        'Carteras/cartera-liga',
        'Llavero/llavero-corto',
        'Llavero/llavero-largo',
        'Monederos/monedero-cierre',
        'Monederos/monedero-clip',
        'Monederos/monedero-motita',
        'Monederos/monedero-triangulo',
        'Portacables/portacable-chico',
        'Portacables/portacables-grande',
        'Portapasaportes',
        'Tarjeteros/tarjetero-boton'
    ],
    'Portacel': [
        'portacel-grande',
        'portacel-pelo',
        'portacel-piel-liso',
        'portacel-piel-textil'
    ],
    'Hogar': [
        'portavasos'
    ]
};

async function createNestedCategoryFolders() {
    console.log('📁 CREANDO ESTRUCTURA DE CARPETAS ANIDADAS EN SUPABASE STORAGE');
    console.log('================================================================\n');

    try {
        // Verificar que el bucket existe
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
            throw new Error(`Error obteniendo buckets: ${bucketsError.message}`);
        }

        let bucketName = 'product-images';
        const productsBucket = buckets.find(bucket => bucket.name === 'product-images');
        
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

        let foldersCreated = 0;
        let foldersExisting = 0;
        const placeholderContent = new Blob(['placeholder'], { type: 'text/plain' });

        // Procesar cada categoría principal
        for (const [mainCategory, subCategories] of Object.entries(CATEGORY_STRUCTURE)) {
            console.log(`\n📂 Procesando categoría: ${mainCategory}`);
            console.log('─'.repeat(50));

            // Crear carpeta de categoría principal
            try {
                const { data, error } = await supabase.storage
                    .from(bucketName)
                    .upload(`${mainCategory}/.placeholder`, placeholderContent, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (error && !error.message.includes('already exists')) {
                    console.log(`❌ Error creando carpeta "${mainCategory}": ${error.message}`);
                } else {
                    console.log(`✅ Carpeta principal "${mainCategory}" lista`);
                }
            } catch (err) {
                console.log(`❌ Error procesando categoría "${mainCategory}": ${err.message}`);
            }

            // Procesar subcategorías/productos
            for (const subPath of subCategories) {
                const fullPath = `${mainCategory}/${subPath}`;
                
                try {
                    const { data, error } = await supabase.storage
                        .from(bucketName)
                        .upload(`${fullPath}/.placeholder`, placeholderContent, {
                            cacheControl: '3600',
                            upsert: true
                        });

                    if (error) {
                        if (error.message.includes('already exists')) {
                            console.log(`   📁 "${subPath}" ya existe`);
                            foldersExisting++;
                        } else {
                            console.log(`   ❌ Error creando "${subPath}": ${error.message}`);
                        }
                    } else {
                        console.log(`   ✅ "${subPath}" creada`);
                        foldersCreated++;
                    }

                    // Crear subcarpetas de organización (thumbs, full, variants)
                    const organizationFolders = ['thumbs', 'full', 'variants'];
                    
                    for (const orgFolder of organizationFolders) {
                        try {
                            await supabase.storage
                                .from(bucketName)
                                .upload(`${fullPath}/${orgFolder}/.placeholder`, placeholderContent, {
                                    cacheControl: '3600',
                                    upsert: true
                                });
                        } catch (orgErr) {
                            // Silenciar errores de subcarpetas de organización para no saturar el log
                        }
                    }

                } catch (err) {
                    console.log(`   ❌ Error procesando "${subPath}": ${err.message}`);
                }
            }
        }

        console.log('\n📊 RESUMEN:');
        console.log('===========');
        console.log(`✅ Carpetas creadas: ${foldersCreated}`);
        console.log(`📂 Carpetas existentes: ${foldersExisting}`);
        console.log(`📁 Total categorías principales: ${Object.keys(CATEGORY_STRUCTURE).length}`);
        
        const totalSubcategories = Object.values(CATEGORY_STRUCTURE).reduce((sum, subs) => sum + subs.length, 0);
        console.log(`🏷️ Total subcategorías/productos: ${totalSubcategories}`);
        
        console.log('\n🎯 ESTRUCTURA CREADA:');
        console.log('=====================');
        
        for (const [mainCategory, subCategories] of Object.entries(CATEGORY_STRUCTURE)) {
            console.log(`📂 ${bucketName}/${mainCategory}/`);
            subCategories.forEach(sub => {
                console.log(`   📁 ${sub}/`);
                console.log(`      📷 thumbs/ - Imágenes pequeñas`);
                console.log(`      🖼️ full/ - Imágenes completas`);
                console.log(`      🎨 variants/ - Variantes del producto`);
            });
            console.log('');
        }
        
        console.log('🚀 ¡Estructura de carpetas anidadas lista!');
        console.log('Ahora puedes organizar las imágenes por categoría y producto específico.');

    } catch (error) {
        console.error('❌ Error general:', error);
        process.exit(1);
    }
}

// Función para limpiar carpetas antiguas (opcional)
async function cleanOldFolders() {
    console.log('\n🧹 LIMPIANDO CARPETAS ANTIGUAS...');
    console.log('=================================');
    
    const oldFolders = [
        'aretes', 'collares', 'pulseras', 'anillos', 
        'bolsas', 'cuadernos', 'llaveros', 'otros'
    ];
    
    for (const folder of oldFolders) {
        try {
            // Listar archivos en la carpeta
            const { data: files, error } = await supabase.storage
                .from('product-images')
                .list(folder, { limit: 100 });
            
            if (error) {
                console.log(`⚠️ No se pudo acceder a carpeta "${folder}": ${error.message}`);
                continue;
            }
            
            if (files && files.length > 0) {
                console.log(`📁 Carpeta "${folder}" contiene ${files.length} archivos`);
                console.log(`   ⚠️ Revisa manualmente si necesitas mover estos archivos`);
            } else {
                console.log(`📂 Carpeta "${folder}" está vacía o no existe`);
            }
            
        } catch (err) {
            console.log(`❌ Error verificando carpeta "${folder}": ${err.message}`);
        }
    }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    createNestedCategoryFolders()
        .then(() => cleanOldFolders())
        .catch(console.error);
}

module.exports = { createNestedCategoryFolders, CATEGORY_STRUCTURE };

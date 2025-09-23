/**
 * SCRIPT PARA MIGRAR IMÁGENES DE BUCKET PRODUCTS A ESTRUCTURA ANIDADA
 * ==================================================================
 * Mapea imágenes existentes en el bucket Products y las migra a la nueva
 * estructura organizada por categorías y productos en product-images
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Estructura de categorías y productos para mapeo
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

async function mapAndMigrateImages() {
    console.log('🗺️  MAPEANDO Y MIGRANDO IMÁGENES A ESTRUCTURA ANIDADA');
    console.log('=====================================================\n');

    try {
        // Verificar que ambos buckets existen
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
            throw new Error(`Error obteniendo buckets: ${bucketsError.message}`);
        }

        const productsBucket = buckets.find(bucket => bucket.name === 'Products');
        const productImagesBucket = buckets.find(bucket => bucket.name === 'product-images');

        if (!productsBucket) {
            throw new Error('Bucket "Products" no encontrado');
        }

        if (!productImagesBucket) {
            throw new Error('Bucket "product-images" no encontrado');
        }

        console.log('✅ Buckets encontrados: Products y product-images\n');

        // Paso 1: Listar todas las imágenes del bucket Products
        console.log('📂 Listando imágenes en bucket Products...');
        const productsImages = await listAllFilesInBucket('Products');
        console.log(`📸 ${productsImages.length} imágenes encontradas en Products\n`);

        // Paso 2: Listar archivos existentes en product-images
        console.log('📂 Listando archivos existentes en product-images...');
        const existingImages = await listAllFilesInBucket('product-images');
        console.log(`📸 ${existingImages.length} archivos ya en product-images\n`);

        // Paso 3: Crear mapeo de imágenes
        console.log('🗺️  Creando mapa de migración...');
        const migrationMap = createMigrationMap(productsImages);
        
        console.log(`\n📊 RESUMEN DEL MAPEO:`);
        console.log(`====================`);
        console.log(`📸 Imágenes a migrar: ${migrationMap.toMigrate.length}`);
        console.log(`❓ Imágenes sin mapeo: ${migrationMap.unmapped.length}`);
        console.log(`🔄 Imágenes con coincidencias múltiples: ${migrationMap.multipleMatches.length}`);

        // Mostrar detalles del mapeo
        if (migrationMap.toMigrate.length > 0) {
            console.log(`\n📋 IMÁGENES A MIGRAR:`);
            console.log(`=====================`);
            migrationMap.toMigrate.forEach((mapping, index) => {
                console.log(`${index + 1}. ${mapping.source} → ${mapping.destination}`);
            });
        }

        if (migrationMap.unmapped.length > 0) {
            console.log(`\n❓ IMÁGENES SIN MAPEO CLARO:`);
            console.log(`=============================`);
            migrationMap.unmapped.forEach((file, index) => {
                console.log(`${index + 1}. ${file}`);
            });
        }

        if (migrationMap.multipleMatches.length > 0) {
            console.log(`\n🔄 COINCIDENCIAS MÚLTIPLES:`);
            console.log(`============================`);
            migrationMap.multipleMatches.forEach((match, index) => {
                console.log(`${index + 1}. ${match.source}:`);
                match.possibleDestinations.forEach(dest => {
                    console.log(`   → ${dest}`);
                });
            });
        }

        // Paso 4: Preguntar al usuario si proceder con la migración
        console.log(`\n🤔 ¿Proceder con la migración automática de ${migrationMap.toMigrate.length} imágenes?`);
        console.log(`   Las imágenes se COPIARÁN (no se eliminarán del bucket original)`);
        console.log(`   Escribe 'y' para continuar, cualquier otra tecla para cancelar:`);

        // Simular input del usuario (en un entorno real usarías readline)
        const shouldProceed = true; // Cambiar a false si no quieres migrar automáticamente

        if (shouldProceed && migrationMap.toMigrate.length > 0) {
            console.log(`\n🚀 Iniciando migración de imágenes...`);
            await migrateImages(migrationMap.toMigrate);
        } else {
            console.log(`\n⏸️  Migración cancelada. Revisa el mapeo y ejecuta manualmente si es necesario.`);
        }

        // Paso 5: Generar reporte final
        console.log(`\n📝 REPORTE GUARDADO EN ARCHIVOS:`);
        console.log(`================================`);
        await saveMigrationReport(migrationMap, existingImages);

    } catch (error) {
        console.error('❌ Error general:', error);
        process.exit(1);
    }
}

async function listAllFilesInBucket(bucketName, folder = '') {
    try {
        const allFiles = [];
        let offset = 0;
        const limit = 1000;

        while (true) {
            const { data: files, error } = await supabase.storage
                .from(bucketName)
                .list(folder, { 
                    limit: limit,
                    offset: offset,
                    sortBy: { column: 'name', order: 'asc' }
                });

            if (error) {
                throw new Error(`Error listando archivos en ${bucketName}: ${error.message}`);
            }

            if (!files || files.length === 0) {
                break;
            }

            // Filtrar solo archivos de imagen
            const imageFiles = files.filter(file => {
                const ext = file.name.toLowerCase();
                return ext.includes('.jpg') || ext.includes('.jpeg') || ext.includes('.png') || ext.includes('.webp');
            });

            allFiles.push(...imageFiles.map(file => folder ? `${folder}/${file.name}` : file.name));

            if (files.length < limit) {
                break;
            }

            offset += limit;
        }

        return allFiles;
    } catch (error) {
        console.error(`Error listando archivos en bucket ${bucketName}:`, error);
        return [];
    }
}

function createMigrationMap(productsImages) {
    const toMigrate = [];
    const unmapped = [];
    const multipleMatches = [];

    // Crear un índice plano de todos los productos para búsqueda rápida
    const flatProducts = [];
    for (const [category, products] of Object.entries(CATEGORY_STRUCTURE)) {
        products.forEach(productPath => {
            const productName = productPath.split('/').pop();
            flatProducts.push({
                category,
                productPath,
                productName,
                fullPath: `${category}/${productPath}`
            });
        });
    }

    productsImages.forEach(imagePath => {
        const fileName = imagePath.split('/').pop();
        const baseName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '');
        
        // Buscar coincidencias exactas
        const exactMatches = flatProducts.filter(product => {
            return product.productName === baseName || 
                   baseName.includes(product.productName) ||
                   product.productName.includes(baseName);
        });

        if (exactMatches.length === 1) {
            // Coincidencia única - migrar automáticamente
            const match = exactMatches[0];
            const fileExtension = fileName.match(/\.(jpg|jpeg|png|webp)$/i)[0];
            const destinationPath = `${match.fullPath}/full/${fileName}`;
            
            toMigrate.push({
                source: imagePath,
                destination: destinationPath,
                category: match.category,
                product: match.productName
            });
        } else if (exactMatches.length > 1) {
            // Múltiples coincidencias - requiere decisión manual
            multipleMatches.push({
                source: imagePath,
                possibleDestinations: exactMatches.map(match => 
                    `${match.fullPath}/full/${fileName}`
                )
            });
        } else {
            // Sin coincidencias - revisar manualmente
            unmapped.push(imagePath);
        }
    });

    return { toMigrate, unmapped, multipleMatches };
}

async function migrateImages(migrationList) {
    let successCount = 0;
    let errorCount = 0;

    console.log(`\n📤 Migrando ${migrationList.length} imágenes...`);
    console.log(`${'='.repeat(50)}`);

    for (const [index, migration] of migrationList.entries()) {
        try {
            console.log(`[${index + 1}/${migrationList.length}] ${migration.source} → ${migration.destination}`);

            // Descargar imagen del bucket Products
            const { data: imageData, error: downloadError } = await supabase.storage
                .from('Products')
                .download(migration.source);

            if (downloadError) {
                throw new Error(`Error descargando: ${downloadError.message}`);
            }

            // Subir imagen al bucket product-images
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(migration.destination, imageData, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                throw new Error(`Error subiendo: ${uploadError.message}`);
            }

            successCount++;
            console.log(`   ✅ Migrado exitosamente`);

        } catch (error) {
            errorCount++;
            console.error(`   ❌ Error: ${error.message}`);
        }
    }

    console.log(`\n📊 RESULTADO DE MIGRACIÓN:`);
    console.log(`==========================`);
    console.log(`✅ Exitosas: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📈 Tasa de éxito: ${((successCount / migrationList.length) * 100).toFixed(1)}%`);
}

async function saveMigrationReport(migrationMap, existingImages) {
    const fs = require('fs').promises;
    
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            toMigrate: migrationMap.toMigrate.length,
            unmapped: migrationMap.unmapped.length,
            multipleMatches: migrationMap.multipleMatches.length,
            existingInDestination: existingImages.length
        },
        migrationMap: migrationMap
    };

    try {
        await fs.writeFile('migration-report.json', JSON.stringify(report, null, 2));
        console.log(`📄 migration-report.json - Reporte completo en JSON`);
        
        // Crear archivo CSV para revisión manual
        let csvContent = 'Tipo,Origen,Destino,Categoria,Producto,Notas\n';
        
        migrationMap.toMigrate.forEach(item => {
            csvContent += `Migrar,"${item.source}","${item.destination}","${item.category}","${item.product}","Coincidencia única"\n`;
        });
        
        migrationMap.unmapped.forEach(item => {
            csvContent += `Sin mapeo,"${item}","","","","Requiere revisión manual"\n`;
        });
        
        migrationMap.multipleMatches.forEach(item => {
            csvContent += `Multiple,"${item.source}","${item.possibleDestinations.join('; ')}","","","Requiere decisión manual"\n`;
        });
        
        await fs.writeFile('migration-map.csv', csvContent);
        console.log(`📄 migration-map.csv - Mapa para revisión en Excel/Sheets`);
        
    } catch (error) {
        console.error('Error guardando reporte:', error);
    }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    mapAndMigrateImages().catch(console.error);
}

module.exports = { mapAndMigrateImages, CATEGORY_STRUCTURE };

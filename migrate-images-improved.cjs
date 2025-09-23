/**
 * SCRIPT MEJORADO PARA MIGRAR IMÁGENES CON MEJOR MAPEO DE NOMBRES
 * ==============================================================
 * Maneja variaciones de nomenclatura entre archivos y estructura de carpetas
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Estructura de categorías y productos con mapeos alternativos
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

function normalizeProductName(name) {
    return name.toLowerCase()
        .replace(/_/g, '-')                    // guiones bajos -> guiones
        .replace(/\s+/g, '-')                  // espacios -> guiones
        .replace(/[áàäâ]/g, 'a')               // acentos
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/-+/g, '-')                   // múltiples guiones -> uno solo
        .replace(/^-|-$/g, '');                // quitar guiones al inicio/final
}

function createImprovedMigrationMap(productsImages) {
    const toMigrate = [];
    const unmapped = [];
    const multipleMatches = [];

    // Crear índice mejorado con variaciones de nombres
    const flatProducts = [];
    for (const [category, products] of Object.entries(CATEGORY_STRUCTURE)) {
        products.forEach(productPath => {
            const productName = productPath.split('/').pop();
            const normalizedName = normalizeProductName(productName);
            
            flatProducts.push({
                category,
                productPath,
                productName,
                normalizedName,
                fullPath: `${category}/${productPath}`,
                // Crear variaciones adicionales del nombre
                variations: [
                    productName,
                    normalizedName,
                    productName.replace(/-/g, '_'),
                    normalizedName.replace(/-/g, '_')
                ]
            });
        });
    }

    console.log(`\n🔍 Procesando ${productsImages.length} imágenes con algoritmo mejorado...`);

    productsImages.forEach((imagePath, index) => {
        const fileName = imagePath.split('/').pop();
        const baseName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '');
        const normalizedBaseName = normalizeProductName(baseName);
        
        // Crear variaciones del nombre base del archivo
        const baseNameVariations = [
            baseName,
            normalizedBaseName,
            baseName.replace(/_/g, '-'),
            normalizedBaseName.replace(/_/g, '-')
        ];

        if (index % 20 === 0) {
            console.log(`   Procesando: ${Math.round((index/productsImages.length)*100)}%`);
        }

        // Buscar coincidencias con diferentes estrategias
        const matches = [];

        flatProducts.forEach(product => {
            let score = 0;
            
            // Estrategia 1: Coincidencia exacta con cualquier variación
            for (const baseVar of baseNameVariations) {
                for (const prodVar of product.variations) {
                    if (baseVar === prodVar) {
                        score = 100;
                        break;
                    }
                }
                if (score === 100) break;
            }

            // Estrategia 2: Coincidencia por contención (más flexible)
            if (score < 100) {
                for (const baseVar of baseNameVariations) {
                    for (const prodVar of product.variations) {
                        if (baseVar.includes(prodVar) && prodVar.length > 3) {
                            score = Math.max(score, 80);
                        }
                        if (prodVar.includes(baseVar) && baseVar.length > 3) {
                            score = Math.max(score, 70);
                        }
                    }
                }
            }

            // Estrategia 3: Coincidencia parcial por palabras
            if (score < 70) {
                const baseWords = normalizedBaseName.split('-').filter(w => w.length > 2);
                const prodWords = product.normalizedName.split('-').filter(w => w.length > 2);
                
                const matchedWords = baseWords.filter(word => prodWords.includes(word));
                if (matchedWords.length >= 2) {
                    score = Math.max(score, 60);
                } else if (matchedWords.length === 1 && matchedWords[0].length > 4) {
                    score = Math.max(score, 40);
                }
            }

            if (score >= 60) {
                matches.push({ product, score });
            }
        });

        // Procesar resultados
        matches.sort((a, b) => b.score - a.score);

        if (matches.length === 0) {
            unmapped.push(imagePath);
        } else if (matches.length === 1 || (matches.length > 1 && matches[0].score > matches[1].score + 10)) {
            // Coincidencia única o claramente mejor
            const bestMatch = matches[0];
            const fileExtension = fileName.match(/\.(jpg|jpeg|png|webp)$/i)[0];
            const destinationPath = `${bestMatch.product.fullPath}/full/${fileName}`;
            
            toMigrate.push({
                source: imagePath,
                destination: destinationPath,
                category: bestMatch.product.category,
                product: bestMatch.product.productName,
                score: bestMatch.score,
                matchType: bestMatch.score >= 100 ? 'Exacta' : 
                          bestMatch.score >= 80 ? 'Alta confianza' : 'Media confianza'
            });
        } else {
            // Múltiples coincidencias similares
            multipleMatches.push({
                source: imagePath,
                possibleDestinations: matches.slice(0, 3).map(match => ({
                    path: `${match.product.fullPath}/full/${fileName}`,
                    product: match.product.productName,
                    score: match.score
                }))
            });
        }
    });

    console.log(`   ✅ Procesamiento completo`);
    return { toMigrate, unmapped, multipleMatches };
}

async function executeImprovedMigration() {
    console.log('🗺️  MIGRACIÓN MEJORADA DE IMÁGENES A ESTRUCTURA ANIDADA');
    console.log('======================================================\n');

    try {
        // Verificar buckets
        const { data: buckets } = await supabase.storage.listBuckets();
        const productsBucket = buckets.find(bucket => bucket.name === 'Products');
        const productImagesBucket = buckets.find(bucket => bucket.name === 'product-images');

        if (!productsBucket || !productImagesBucket) {
            throw new Error('Buckets no encontrados');
        }

        console.log('✅ Buckets encontrados');

        // Listar imágenes
        console.log('\n📂 Listando imágenes en bucket Products...');
        const productsImages = await listAllFilesInBucket('Products');
        console.log(`📸 ${productsImages.length} imágenes encontradas`);

        // Crear mapeo mejorado
        console.log('\n🧠 Creando mapeo inteligente...');
        const migrationMap = createImprovedMigrationMap(productsImages);

        // Mostrar resumen
        console.log(`\n📊 RESUMEN MEJORADO:`);
        console.log(`===================`);
        console.log(`📸 Imágenes para migrar: ${migrationMap.toMigrate.length}`);
        console.log(`❓ Sin mapeo claro: ${migrationMap.unmapped.length}`);
        console.log(`🔄 Coincidencias múltiples: ${migrationMap.multipleMatches.length}`);

        // Agrupar por tipo de coincidencia
        const byMatchType = migrationMap.toMigrate.reduce((acc, item) => {
            acc[item.matchType] = (acc[item.matchType] || 0) + 1;
            return acc;
        }, {});

        console.log(`\n🎯 CALIDAD DE COINCIDENCIAS:`);
        console.log(`============================`);
        Object.entries(byMatchType).forEach(([type, count]) => {
            console.log(`${type}: ${count} imágenes`);
        });

        // Mostrar las mejores coincidencias
        if (migrationMap.toMigrate.length > 0) {
            console.log(`\n📋 MEJORES COINCIDENCIAS (Top 10):`);
            console.log(`===================================`);
            migrationMap.toMigrate
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .forEach((mapping, index) => {
                    console.log(`${index + 1}. [${mapping.score}] ${mapping.source} → ${mapping.product}`);
                });
        }

        // Mostrar coincidencias múltiples
        if (migrationMap.multipleMatches.length > 0) {
            console.log(`\n🔄 COINCIDENCIAS MÚLTIPLES (Top 5):`);
            console.log(`====================================`);
            migrationMap.multipleMatches.slice(0, 5).forEach((match, index) => {
                console.log(`${index + 1}. ${match.source}:`);
                match.possibleDestinations.forEach(dest => {
                    console.log(`   [${dest.score}] → ${dest.product}`);
                });
            });
        }

        // Guardar reporte mejorado
        await saveImprovedReport(migrationMap);

        // Proceder con migración de alta confianza
        const highConfidenceItems = migrationMap.toMigrate.filter(item => item.score >= 80);
        
        if (highConfidenceItems.length > 0) {
            console.log(`\n🚀 ¿Migrar automáticamente ${highConfidenceItems.length} imágenes de alta confianza (score ≥ 80)?`);
            console.log(`   Las imágenes se copiarán al bucket product-images`);
            
            const shouldProceed = true; // Cambiar a false para revisar manual
            
            if (shouldProceed) {
                console.log(`\n📤 Migrando imágenes de alta confianza...`);
                await migrateImages(highConfidenceItems);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
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

            if (error) throw error;
            if (!files || files.length === 0) break;

            const imageFiles = files.filter(file => {
                const ext = file.name.toLowerCase();
                return ext.includes('.jpg') || ext.includes('.jpeg') || ext.includes('.png') || ext.includes('.webp');
            });

            allFiles.push(...imageFiles.map(file => folder ? `${folder}/${file.name}` : file.name));

            if (files.length < limit) break;
            offset += limit;
        }

        return allFiles;
    } catch (error) {
        console.error(`Error listando archivos en bucket ${bucketName}:`, error);
        return [];
    }
}

async function migrateImages(migrationList) {
    let successCount = 0;
    let errorCount = 0;

    for (const [index, migration] of migrationList.entries()) {
        try {
            console.log(`[${index + 1}/${migrationList.length}] ${migration.source} → ${migration.destination}`);

            const { data: imageData, error: downloadError } = await supabase.storage
                .from('Products')
                .download(migration.source);

            if (downloadError) throw downloadError;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(migration.destination, imageData, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            successCount++;
            console.log(`   ✅ Migrado [${migration.matchType}]`);

        } catch (error) {
            errorCount++;
            console.error(`   ❌ Error: ${error.message}`);
        }
    }

    console.log(`\n📊 RESULTADO:`);
    console.log(`=============`);
    console.log(`✅ Exitosas: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📈 Tasa de éxito: ${((successCount / migrationList.length) * 100).toFixed(1)}%`);
}

async function saveImprovedReport(migrationMap) {
    const fs = require('fs').promises;
    
    try {
        // Reporte JSON detallado
        const report = {
            timestamp: new Date().toISOString(),
            algorithm: 'improved-fuzzy-matching',
            summary: {
                total: migrationMap.toMigrate.length + migrationMap.unmapped.length + migrationMap.multipleMatches.length,
                toMigrate: migrationMap.toMigrate.length,
                unmapped: migrationMap.unmapped.length,
                multipleMatches: migrationMap.multipleMatches.length
            },
            migrationMap: migrationMap
        };

        await fs.writeFile('improved-migration-report.json', JSON.stringify(report, null, 2));
        console.log(`\n📄 improved-migration-report.json - Reporte detallado guardado`);

        // CSV mejorado para revisión
        let csvContent = 'Tipo,Origen,Destino,Categoria,Producto,Score,TipoCoincidencia,Notas\n';
        
        migrationMap.toMigrate.forEach(item => {
            csvContent += `Migrar,"${item.source}","${item.destination}","${item.category}","${item.product}",${item.score},"${item.matchType}","${item.score >= 80 ? 'Alta confianza' : 'Revisar'}"\n`;
        });
        
        migrationMap.unmapped.forEach(item => {
            csvContent += `Sin mapeo,"${item}","","","",0,"","Requiere revisión manual"\n`;
        });
        
        migrationMap.multipleMatches.forEach(item => {
            const topMatch = item.possibleDestinations[0];
            csvContent += `Multiple,"${item.source}","${topMatch.path}","","${topMatch.product}",${topMatch.score},"Ambiguo","${item.possibleDestinations.length} opciones"\n`;
        });
        
        await fs.writeFile('improved-migration-map.csv', csvContent);
        console.log(`📄 improved-migration-map.csv - Mapa mejorado para revisión`);
        
    } catch (error) {
        console.error('Error guardando reporte:', error);
    }
}

// Ejecutar
if (require.main === module) {
    executeImprovedMigration().catch(console.error);
}

module.exports = { executeImprovedMigration };

const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuración API
const wcApi = new WooCommerceRestApi({
  url: 'https://estudioartesana.com',
  consumerKey: 'ck_80b6b30e9084b95b6e59d8eb06b31bb302ed82cb',
  consumerSecret: 'cs_03be64c45c1b7e83a8b7f75ca0d33e659a28d9ca',
  version: 'wc/v3'
});

// Función para crear directorio si no existe
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Función para descargar imagen con headers
function downloadImageWithHeaders(url, filePath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https:') ? https : http;
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://estudioartesana.com/',
                'Sec-Fetch-Dest': 'image',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'same-origin',
                'Connection': 'keep-alive'
            }
        };
        
        protocol.get(options, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                downloadImageWithHeaders(response.headers.location, filePath)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${url}`));
                return;
            }

            const fileStream = fs.createWriteStream(filePath);
            response.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                resolve(filePath);
            });
            
            fileStream.on('error', (err) => {
                fs.unlink(filePath, () => {});
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Función para obtener variaciones de un producto
async function getProductVariations(productId) {
    try {
        const response = await wcApi.get(`products/${productId}/variations`, {
            per_page: 100
        });
        return response.data;
    } catch (error) {
        console.error(`❌ Error obteniendo variaciones del producto ${productId}:`, error.response?.status || error.message);
        return [];
    }
}

// Función para limpiar nombres de archivos
function sanitizeFileName(name) {
    return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 150);
}

// Función principal
async function backupVariationImages() {
    console.log('🖼️  INICIANDO BACKUP DE IMÁGENES DE VARIACIONES...\n');
    
    // Buscar la carpeta de backup más reciente
    const backupDataDir = './backup-data';
    const backupFolders = fs.readdirSync(backupDataDir)
        .filter(folder => fs.statSync(path.join(backupDataDir, folder)).isDirectory())
        .sort()
        .reverse();
    
    if (backupFolders.length === 0) {
        console.error('❌ No se encontraron carpetas de backup');
        return;
    }
    
    const latestBackup = backupFolders[0];
    const backupDir = path.join(backupDataDir, latestBackup);
    const productsFile = path.join(backupDir, 'products', 'all-products.json');
    
    console.log(`📂 Usando backup: ${latestBackup}`);
    
    // Leer productos existentes
    if (!fs.existsSync(productsFile)) {
        console.error('❌ Archivo de productos no encontrado');
        return;
    }
    
    const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
    
    // Filtrar productos variables
    const variableProducts = products.filter(product => 
        product.type === 'variable' && product.variations && product.variations.length > 0
    );
    
    console.log(`📦 Total de productos: ${products.length}`);
    console.log(`🎨 Productos con variaciones: ${variableProducts.length}`);
    
    if (variableProducts.length === 0) {
        console.log('ℹ️  No se encontraron productos con variaciones');
        return;
    }
    
    // Crear directorios
    const variationImagesDir = path.join(backupDir, 'variation-images');
    ensureDirectoryExists(variationImagesDir);
    
    // Estadísticas
    let processedProducts = 0;
    let totalVariations = 0;
    let downloadedImages = 0;
    let errorCount = 0;
    const allVariationImages = [];
    const startTime = Date.now();
    
    // Procesar solo los primeros 3 productos para empezar (como prueba)
    const testProducts = variableProducts.slice(0, 3);
    console.log(`🧪 Probando con los primeros ${testProducts.length} productos...\n`);
    
    for (let i = 0; i < testProducts.length; i++) {
        const product = testProducts[i];
        
        try {
            console.log(`⬇️  [${i + 1}/${testProducts.length}] ${product.name}`);
            console.log(`   📊 Variaciones esperadas: ${product.variations.length}`);
            
            // Obtener detalles de las variaciones
            const variations = await getProductVariations(product.id);
            
            if (variations.length === 0) {
                console.log(`   ⚠️  No se pudieron obtener detalles de variaciones`);
                errorCount++;
                continue;
            }
            
            console.log(`   ✅ ${variations.length} variaciones obtenidas`);
            totalVariations += variations.length;
            
            // Crear directorio específico para este producto
            const productDir = path.join(variationImagesDir, `product-${product.id}-${sanitizeFileName(product.name)}`);
            ensureDirectoryExists(productDir);
            
            // Procesar cada variación
            for (let j = 0; j < variations.length; j++) {
                const variation = variations[j];
                
                // Obtener información de la variación
                const attributes = variation.attributes.map(attr => `${attr.name}: ${attr.option}`).join(', ');
                console.log(`     🎨 Variación ${j + 1}: ${attributes} ($${variation.price})`);
                
                // Verificar si tiene imágenes específicas
                if (variation.image && variation.image.src) {
                    const imageUrl = variation.image.src;
                    const imageExtension = path.extname(new URL(imageUrl).pathname) || '.jpg';
                    const colorName = variation.attributes.find(attr => attr.name === 'Color')?.option || `variation-${j + 1}`;
                    const fileName = `${product.id}_${variation.id}_${sanitizeFileName(colorName)}${imageExtension}`;
                    const filePath = path.join(productDir, fileName);
                    
                    try {
                        // Verificar si ya existe
                        if (fs.existsSync(filePath)) {
                            console.log(`       ⏭️  Ya existe: ${fileName}`);
                        } else {
                            console.log(`       ⬇️  Descargando: ${fileName}`);
                            await downloadImageWithHeaders(imageUrl, filePath);
                            downloadedImages++;
                            console.log(`       ✅ Descargada: ${fileName}`);
                        }
                        
                        // Guardar información de la imagen
                        allVariationImages.push({
                            productId: product.id,
                            productName: product.name,
                            variationId: variation.id,
                            attributes: variation.attributes,
                            imageUrl: imageUrl,
                            localFileName: fileName,
                            price: variation.price,
                            sku: variation.sku,
                            inStock: variation.in_stock
                        });
                        
                    } catch (downloadError) {
                        console.log(`       ❌ Error descargando: ${downloadError.message}`);
                        errorCount++;
                    }
                } else {
                    console.log(`       ⚠️  Sin imagen específica (usa imagen del producto padre)`);
                }
                
                // Pequeña pausa
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            processedProducts++;
            console.log(''); // Línea en blanco
            
        } catch (error) {
            console.error(`   ❌ Error procesando ${product.name}: ${error.message}`);
            errorCount++;
        }
        
        // Pausa entre productos
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('💾 GUARDANDO INFORMACIÓN...');
    
    // Guardar índice de imágenes de variaciones
    const indexFile = path.join(variationImagesDir, 'variation-images-index.json');
    fs.writeFileSync(indexFile, JSON.stringify(allVariationImages, null, 2));
    console.log(`✅ Guardado: variation-images-index.json`);
    
    // Crear resumen
    const summary = {
        extractionDate: new Date().toISOString(),
        durationSeconds: duration,
        statistics: {
            processedProducts: processedProducts,
            totalVariations: totalVariations,
            downloadedImages: downloadedImages,
            errors: errorCount
        },
        variationImages: allVariationImages
    };
    
    const summaryFile = path.join(variationImagesDir, 'variation-images-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`✅ Guardado: variation-images-summary.json`);
    
    console.log('\n📊 RESUMEN DE IMÁGENES DE VARIACIONES:');
    console.log('=====================================');
    console.log(`📦 Productos procesados: ${processedProducts}/${testProducts.length}`);
    console.log(`🎨 Variaciones encontradas: ${totalVariations}`);
    console.log(`🖼️  Imágenes descargadas: ${downloadedImages}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`⏱️  Tiempo total: ${duration} segundos`);
    console.log(`📁 Ubicación: ${variationImagesDir}`);
    
    if (downloadedImages > 0) {
        console.log('\n🎉 ¡PRUEBA EXITOSA!');
        console.log('✅ Algunas variaciones SÍ tienen imágenes específicas');
        console.log('💡 Para continuar con todos los productos, ejecuta el script completo');
    } else {
        console.log('\n🤔 RESULTADOS DE LA PRUEBA:');
        if (totalVariations > 0) {
            console.log('⚠️  Las variaciones no tienen imágenes específicas individuales');
            console.log('💡 Muchos productos usan la misma imagen para todas las variaciones');
            console.log('✅ Las imágenes principales ya descargadas son suficientes');
        } else {
            console.log('❌ No se pudieron obtener detalles de variaciones (problema de permisos)');
        }
    }
}

// Ejecutar
if (require.main === module) {
    backupVariationImages().catch(console.error);
}

module.exports = { backupVariationImages };

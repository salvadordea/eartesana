const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const fs = require('fs');
const path = require('path');

// Configuración API (misma que en backup principal)
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

// Función para extraer variaciones de un producto
async function extractProductVariations(productId) {
    try {
        const response = await wcApi.get(`products/${productId}/variations`, {
            per_page: 100, // Máximo de variaciones por producto
            page: 1
        });
        
        return response.data;
    } catch (error) {
        console.error(`❌ Error extrayendo variaciones del producto ${productId}:`, error.message);
        return [];
    }
}

// Función principal
async function backupProductVariations() {
    console.log('🎨 INICIANDO BACKUP DE VARIACIONES DE PRODUCTOS...\n');
    
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
        console.error('❌ Archivo de productos no encontrado:', productsFile);
        return;
    }
    
    const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
    console.log(`📦 Total de productos: ${products.length}`);
    
    // Filtrar productos variables (que tienen variaciones)
    const variableProducts = products.filter(product => 
        product.type === 'variable' && product.variations && product.variations.length > 0
    );
    
    console.log(`🎨 Productos con variaciones: ${variableProducts.length}`);
    
    if (variableProducts.length === 0) {
        console.log('ℹ️  No se encontraron productos con variaciones');
        return;
    }
    
    console.log('\\n📋 PRODUCTOS CON VARIACIONES DETECTADOS:');
    variableProducts.forEach(product => {
        console.log(`   • ${product.name} (${product.variations.length} variaciones)`);
    });
    console.log('');
    
    // Crear directorio para variaciones
    const variationsDir = path.join(backupDir, 'variations');
    ensureDirectoryExists(variationsDir);
    
    // Estadísticas
    let processedProducts = 0;
    let totalVariations = 0;
    let errors = 0;
    const startTime = Date.now();
    
    const allVariations = {};
    const variationsByProduct = {};
    
    // Procesar cada producto variable
    for (let i = 0; i < variableProducts.length; i++) {
        const product = variableProducts[i];
        
        try {
            console.log(`⬇️  Extrayendo [${i + 1}/${variableProducts.length}]: ${product.name}`);
            console.log(`   📊 Variaciones esperadas: ${product.variations.length}`);
            
            // Extraer variaciones del producto
            const variations = await extractProductVariations(product.id);
            
            if (variations.length > 0) {
                // Guardar variaciones por producto
                variationsByProduct[product.id] = {
                    productName: product.name,
                    productId: product.id,
                    totalVariations: variations.length,
                    variations: variations
                };
                
                // Añadir al conjunto global
                variations.forEach(variation => {
                    allVariations[variation.id] = {
                        ...variation,
                        parentProduct: {
                            id: product.id,
                            name: product.name
                        }
                    };
                });
                
                totalVariations += variations.length;
                processedProducts++;
                
                console.log(`   ✅ ${variations.length} variaciones extraídas`);
                // Mostrar algunas variaciones como ejemplo
                if (variations.length > 0) {
                    console.log(`   🎨 Ejemplos de variaciones:`);
                    variations.slice(0, 3).forEach(variation => {
                        const attributes = variation.attributes.map(attr => `${attr.name}: ${attr.option}`).join(', ');
                        console.log(`      - ${attributes} ($${variation.price})`);
                    });
                    if (variations.length > 3) {
                        console.log(`      ... y ${variations.length - 3} más`);
                    }
                }
                
            } else {
                console.log(`   ⚠️  No se pudieron extraer variaciones`);
                errors++;
            }
            
            // Pausa para no sobrecargar el servidor
            await new Promise(resolve => setTimeout(resolve, 300));
            
        } catch (error) {
            console.error(`   ❌ Error procesando ${product.name}: ${error.message}`);
            errors++;
        }
        
        console.log(''); // Línea en blanco para separar productos
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('💾 GUARDANDO ARCHIVOS DE VARIACIONES...');
    
    // Guardar archivo principal de variaciones
    const allVariationsFile = path.join(variationsDir, 'all-variations.json');
    fs.writeFileSync(allVariationsFile, JSON.stringify(Object.values(allVariations), null, 2));
    console.log(`✅ Guardado: all-variations.json (${Object.keys(allVariations).length} variaciones)`);
    
    // Guardar variaciones agrupadas por producto
    const byProductFile = path.join(variationsDir, 'variations-by-product.json');
    fs.writeFileSync(byProductFile, JSON.stringify(variationsByProduct, null, 2));
    console.log(`✅ Guardado: variations-by-product.json`);
    
    // Guardar archivos individuales por producto
    for (const [productId, productData] of Object.entries(variationsByProduct)) {
        const fileName = `product-${productId}-${productData.productName.replace(/[<>:\"/\\\\|?*]/g, '_')}.json`;
        const filePath = path.join(variationsDir, fileName);
        fs.writeFileSync(filePath, JSON.stringify(productData, null, 2));
    }
    console.log(`✅ Guardados: ${Object.keys(variationsByProduct).length} archivos individuales por producto`);
    
    // Crear resumen
    const summary = {
        extractionDate: new Date().toISOString(),
        durationSeconds: duration,
        statistics: {
            totalProducts: products.length,
            variableProducts: variableProducts.length,
            processedProducts: processedProducts,
            totalVariations: totalVariations,
            errors: errors
        },
        variationsByProduct: Object.fromEntries(
            Object.entries(variationsByProduct).map(([productId, data]) => [
                productId, 
                {
                    name: data.productName,
                    variationCount: data.totalVariations
                }
            ])
        )
    };
    
    const summaryFile = path.join(variationsDir, 'variations-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`✅ Guardado: variations-summary.json`);
    
    console.log('\\n📊 RESUMEN DE EXTRACCIÓN DE VARIACIONES:');
    console.log('=========================================');
    console.log(`📦 Productos totales: ${products.length}`);
    console.log(`🎨 Productos con variaciones: ${variableProducts.length}`);
    console.log(`✅ Productos procesados: ${processedProducts}`);
    console.log(`🌈 Total de variaciones extraídas: ${totalVariations}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`⏱️  Tiempo total: ${duration} segundos`);
    console.log(`📁 Ubicación: ${variationsDir}`);
    
    if (totalVariations > 0) {
        console.log('\\n🎉 ¡EXTRACCIÓN DE VARIACIONES COMPLETADA!');
        console.log('💾 Ahora tienes un backup completo con todas las variaciones de color y atributos');
    }
}

// Ejecutar
if (require.main === module) {
    backupProductVariations().catch(console.error);
}

module.exports = { backupProductVariations };

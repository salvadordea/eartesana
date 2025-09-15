const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Función para crear directorio si no existe
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Función para descargar una imagen simulando navegador
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
            // Seguir redirecciones
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                downloadImageWithHeaders(response.headers.location, filePath)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            // Verificar si la respuesta es exitosa
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${url}`));
                return;
            }

            // Crear stream de escritura
            const fileStream = fs.createWriteStream(filePath);
            
            response.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                resolve(filePath);
            });
            
            fileStream.on('error', (err) => {
                fs.unlink(filePath, () => {}); // Eliminar archivo parcial
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Función para limpiar nombres de archivos
function sanitizeFileName(name) {
    return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
}

// Función principal
async function downloadAllImagesWithHeaders() {
    console.log('🖼️  INICIANDO DESCARGA DE IMÁGENES (CON HEADERS)...\n');
    
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
    const imagesJsonPath = path.join(backupDataDir, latestBackup, 'media', 'product-images.json');
    
    console.log(`📂 Usando backup: ${latestBackup}`);
    
    // Leer el archivo de imágenes
    if (!fs.existsSync(imagesJsonPath)) {
        console.error('❌ Archivo de imágenes no encontrado:', imagesJsonPath);
        return;
    }
    
    const images = JSON.parse(fs.readFileSync(imagesJsonPath, 'utf8'));
    console.log(`🖼️  Imágenes encontradas: ${images.length}\n`);
    
    // Crear directorio de imágenes
    const imagesDir = path.join(backupDataDir, latestBackup, 'images');
    ensureDirectoryExists(imagesDir);
    
    // Estadísticas
    let downloaded = 0;
    let errors = 0;
    let skipped = 0;
    const startTime = Date.now();
    
    // Probar solo las primeras 5 imágenes para verificar si funciona
    const testImages = images.slice(0, 5);
    console.log('🧪 Probando con las primeras 5 imágenes...\n');
    
    // Descargar imágenes
    for (let i = 0; i < testImages.length; i++) {
        const image = testImages[i];
        
        try {
            // Generar nombre de archivo
            const url = new URL(image.src);
            const originalFileName = path.basename(url.pathname);
            const extension = path.extname(originalFileName) || '.jpg';
            
            const productName = sanitizeFileName(image.productName);
            const fileName = `${image.productId}_${image.imageId}_${productName}${extension}`;
            const filePath = path.join(imagesDir, fileName);
            
            // Verificar si ya existe
            if (fs.existsSync(filePath)) {
                console.log(`⏭️  Salteando (ya existe): ${fileName}`);
                skipped++;
                continue;
            }
            
            console.log(`⬇️  Probando [${i+1}/${testImages.length}]: ${fileName}`);
            
            await downloadImageWithHeaders(image.src, filePath);
            downloaded++;
            console.log(`✅ Descargado: ${fileName}`);
            
            // Pausa más larga para ser respetuoso con el servidor
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error(`❌ Error descargando ${image.src}: ${error.message}`);
            errors++;
        }
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n📊 RESUMEN DE PRUEBA:');
    console.log('=====================');
    console.log(`🖼️  Imágenes probadas: ${testImages.length}`);
    console.log(`✅ Descargadas exitosamente: ${downloaded}`);
    console.log(`⏭️  Ya existían: ${skipped}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`⏱️  Tiempo total: ${duration} segundos`);
    
    if (downloaded > 0) {
        console.log('\n🎉 ¡LA DESCARGA CON HEADERS FUNCIONA!');
        console.log('💭 ¿Quieres continuar con todas las imágenes? Ejecuta:');
        console.log('   npm run download:images:full');
    } else {
        console.log('\n❌ La descarga con headers tampoco funcionó');
        console.log('💡 Opciones alternativas:');
        console.log('   1. Descargar manualmente desde el navegador');
        console.log('   2. Contactar al administrador del sitio');
        console.log('   3. Usar herramientas especializadas como wget');
    }
    
    console.log(`\n📁 Ubicación: ${imagesDir}`);
}

// Ejecutar
if (require.main === module) {
    downloadAllImagesWithHeaders().catch(console.error);
}

module.exports = { downloadAllImagesWithHeaders };

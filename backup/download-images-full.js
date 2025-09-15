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

// Función principal para descargar TODAS las imágenes
async function downloadAllImagesFull() {
    console.log('🖼️  INICIANDO DESCARGA COMPLETA DE IMÁGENES...\n');
    
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
    console.log(`🖼️  Total de imágenes: ${images.length}`);
    console.log('⏱️  Tiempo estimado: ~2-3 minutos\n');
    
    // Crear directorio de imágenes
    const imagesDir = path.join(backupDataDir, latestBackup, 'images');
    ensureDirectoryExists(imagesDir);
    
    // Estadísticas
    let downloaded = 0;
    let errors = 0;
    let skipped = 0;
    const startTime = Date.now();
    const errorDetails = [];
    
    // Descargar TODAS las imágenes
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
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
            
            // Mostrar progreso cada 10 imágenes o en las últimas 10
            const shouldShowProgress = (i + 1) % 10 === 0 || i >= images.length - 10;
            if (shouldShowProgress) {
                console.log(`⬇️  Descargando [${i+1}/${images.length}]: ${fileName}`);
            }
            
            await downloadImageWithHeaders(image.src, filePath);
            downloaded++;
            
            if (shouldShowProgress) {
                console.log(`✅ Descargado: ${fileName}`);
            }
            
            // Pausa para ser respetuoso con el servidor
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            const errorMsg = `❌ Error en imagen ${i+1}: ${error.message}`;
            console.error(errorMsg);
            errorDetails.push({
                index: i + 1,
                productName: image.productName,
                url: image.src,
                error: error.message
            });
            errors++;
        }
        
        // Mostrar progreso cada 20 imágenes
        if ((i + 1) % 20 === 0) {
            const progress = Math.round(((i + 1) / images.length) * 100);
            console.log(`📊 Progreso: ${progress}% (${i + 1}/${images.length})`);
        }
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    const durationMinutes = Math.round(duration / 60 * 10) / 10;
    
    console.log('\n📊 RESUMEN FINAL DE DESCARGA:');
    console.log('=============================');
    console.log(`🖼️  Total de imágenes: ${images.length}`);
    console.log(`✅ Descargadas exitosamente: ${downloaded}`);
    console.log(`⏭️  Ya existían: ${skipped}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`⏱️  Tiempo total: ${duration} segundos (${durationMinutes} minutos)`);
    console.log(`📁 Ubicación: ${imagesDir}`);
    
    if (downloaded > 0) {
        console.log('\n🎉 ¡DESCARGA COMPLETADA!');
        console.log('💾 Las imágenes están disponibles localmente');
        
        // Crear un archivo de índice mejorado
        const indexPath = path.join(imagesDir, 'image-index.json');
        const imageIndex = images.map(img => ({
            ...img,
            localFileName: `${img.productId}_${img.imageId}_${sanitizeFileName(img.productName)}${path.extname(new URL(img.src).pathname) || '.jpg'}`,
            downloaded: true // Asumimos que se descargó si llegó aquí
        }));
        
        fs.writeFileSync(indexPath, JSON.stringify(imageIndex, null, 2));
        console.log(`📋 Índice de imágenes actualizado: image-index.json`);
        
        // Guardar lista de archivos descargados
        const downloadedFiles = fs.readdirSync(imagesDir).filter(file => file !== 'image-index.json');
        const downloadListPath = path.join(imagesDir, 'download-summary.txt');
        const summary = [
            '=== RESUMEN DE DESCARGA DE IMÁGENES ===',
            `Fecha: ${new Date().toLocaleString('es-ES')}`,
            `Total descargado: ${downloaded} imágenes`,
            `Errores: ${errors}`,
            `Duración: ${durationMinutes} minutos`,
            '',
            'ARCHIVOS DESCARGADOS:',
            ...downloadedFiles.map(file => `- ${file}`)
        ].join('\n');
        
        fs.writeFileSync(downloadListPath, summary);
        console.log(`📄 Resumen guardado: download-summary.txt`);
    }
    
    if (errors > 0) {
        console.log(`\n⚠️  Se produjeron ${errors} errores durante la descarga`);
        
        // Guardar detalles de errores
        const errorsPath = path.join(imagesDir, 'download-errors.json');
        fs.writeFileSync(errorsPath, JSON.stringify(errorDetails, null, 2));
        console.log(`📝 Detalles de errores guardados: download-errors.json`);
    }
}

// Ejecutar
if (require.main === module) {
    downloadAllImagesFull().catch(console.error);
}

module.exports = { downloadAllImagesFull };

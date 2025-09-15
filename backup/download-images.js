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

// Función para descargar una imagen
function downloadImage(url, filePath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https:') ? https : http;
        
        protocol.get(url, (response) => {
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
async function downloadAllImages() {
    console.log('🖼️  INICIANDO DESCARGA DE IMÁGENES...\n');
    
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
    const startTime = Date.now();
    
    // Descargar imágenes
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
                downloaded++;
                continue;
            }
            
            console.log(`⬇️  Descargando [${i+1}/${images.length}]: ${fileName}`);
            
            await downloadImage(image.src, filePath);
            downloaded++;
            console.log(`✅ Descargado: ${fileName}`);
            
            // Pausa pequeña para no sobrecargar el servidor
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`❌ Error descargando ${image.src}: ${error.message}`);
            errors++;
        }
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n📊 RESUMEN DE DESCARGA:');
    console.log('======================');
    console.log(`🖼️  Total de imágenes: ${images.length}`);
    console.log(`✅ Descargadas exitosamente: ${downloaded}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`⏱️  Tiempo total: ${duration} segundos`);
    console.log(`📁 Ubicación: ${imagesDir}`);
    
    if (downloaded > 0) {
        console.log('\n🎉 ¡DESCARGA COMPLETADA!');
        console.log('💾 Todas las imágenes están ahora disponibles localmente');
        
        // Crear un archivo de índice
        const indexPath = path.join(imagesDir, 'image-index.json');
        const imageIndex = images.map(img => ({
            ...img,
            localFileName: `${img.productId}_${img.imageId}_${sanitizeFileName(img.productName)}${path.extname(new URL(img.src).pathname) || '.jpg'}`
        }));
        
        fs.writeFileSync(indexPath, JSON.stringify(imageIndex, null, 2));
        console.log(`📋 Índice de imágenes creado: image-index.json`);
    }
}

// Ejecutar
if (require.main === module) {
    downloadAllImages().catch(console.error);
}

module.exports = { downloadAllImages };

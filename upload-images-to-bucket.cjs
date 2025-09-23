/**
 * SCRIPT PARA SUBIR IMÁGENES MASIVAMENTE AL BUCKET
 * ================================================
 * Sube todas las imágenes de scraper/ manteniendo estructura categoria/producto/variante.jpg
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configuración de Supabase
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuración
const BUCKET_NAME = 'product-images';
const SOURCE_DIR = 'scraper';
const BATCH_SIZE = 5; // Subir de 5 en 5 para no saturar
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

async function scanImageFiles(directory) {
    const imageFiles = [];
    
    async function walkDirectory(dir, relativePath = '') {
        try {
            const items = await fs.readdir(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                const itemRelativePath = path.join(relativePath, item.name).replace(/\\\\/g, '/');
                
                if (item.isDirectory()) {
                    // Recursión en subdirectorios
                    await walkDirectory(fullPath, itemRelativePath);
                } else if (item.isFile()) {
                    const ext = path.extname(item.name).toLowerCase();
                    if (IMAGE_EXTENSIONS.includes(ext)) {
                        // Parsear la estructura categoria/producto/archivo
                        // Normalizar separadores para Windows
                        const normalizedPath = itemRelativePath.replace(/\\/g, '/');
                        const pathParts = normalizedPath.split('/');
                        if (pathParts.length >= 3) {
                            const categoria = pathParts[0];
                            const producto = pathParts[1];
                            const archivo = pathParts[pathParts.length - 1];
                            
                            imageFiles.push({
                                localPath: fullPath,
                                bucketPath: normalizedPath, // Usar path normalizado para bucket
                                categoria,
                                producto,
                                archivo,
                                size: 0 // Se calculará después
                            });
                        } else {
                            // Para debugging - mostrar archivos que no cumplen la estructura
                            console.log(`   🔍 Archivo encontrado pero estructura no válida: ${itemRelativePath} (${pathParts.length} niveles)`);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn(`Advertencia al leer directorio ${dir}:`, error.message);
        }
    }
    
    await walkDirectory(directory);
    
    // Calcular tamaños de archivos
    for (const file of imageFiles) {
        try {
            const stats = await fs.stat(file.localPath);
            file.size = stats.size;
        } catch (error) {
            console.warn(`No se pudo obtener tamaño de ${file.localPath}:`, error.message);
        }
    }
    
    return imageFiles;
}

async function uploadFilesBatch(files) {
    const results = {
        successful: [],
        failed: []
    };
    
    for (const file of files) {
        try {
            console.log(`   📤 Subiendo: ${file.bucketPath}`);
            
            // Leer archivo
            const fileBuffer = await fs.readFile(file.localPath);
            
            // Determinar content type
            const ext = path.extname(file.archivo).toLowerCase();
            const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                              ext === '.png' ? 'image/png' :
                              ext === '.webp' ? 'image/webp' : 'image/jpeg';
            
            // Subir al bucket
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(file.bucketPath, fileBuffer, {
                    contentType,
                    upsert: true // Sobrescribir si ya existe
                });
            
            if (error) {
                throw error;
            }
            
            results.successful.push({
                ...file,
                uploadPath: data.path,
                uploadedAt: new Date().toISOString()
            });
            
            console.log(`   ✅ ${file.bucketPath} (${Math.round(file.size/1024)}KB)`);
            
        } catch (error) {
            console.log(`   ❌ ${file.bucketPath}: ${error.message}`);
            results.failed.push({
                ...file,
                error: error.message,
                failedAt: new Date().toISOString()
            });
        }
    }
    
    return results;
}

function generateSummary(allResults, totalFiles) {
    const successful = allResults.reduce((acc, r) => acc + r.successful.length, 0);
    const failed = allResults.reduce((acc, r) => acc + r.failed.length, 0);
    const totalSize = allResults.reduce((acc, r) => 
        acc + r.successful.reduce((s, f) => s + f.size, 0), 0);
    
    // Estadísticas por categoría
    const categoryStats = {};
    allResults.forEach(r => {
        r.successful.forEach(f => {
            if (!categoryStats[f.categoria]) {
                categoryStats[f.categoria] = { count: 0, size: 0 };
            }
            categoryStats[f.categoria].count++;
            categoryStats[f.categoria].size += f.size;
        });
    });
    
    return {
        total: totalFiles,
        successful,
        failed,
        totalSize,
        categoryStats
    };
}

async function saveUploadReport(summary, allResults) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Reporte detallado en JSON
    const detailedReport = {
        timestamp: new Date().toISOString(),
        summary,
        categories: summary.categoryStats,
        successful: allResults.reduce((acc, r) => acc.concat(r.successful), []),
        failed: allResults.reduce((acc, r) => acc.concat(r.failed), [])
    };
    
    await fs.writeFile(`upload-report-${timestamp}.json`, JSON.stringify(detailedReport, null, 2));
    
    // Reporte CSV simple
    let csvContent = 'Estado,Categoria,Producto,Archivo,RutaBucket,Tamaño,Error\\n';
    
    allResults.forEach(r => {
        r.successful.forEach(f => {
            csvContent += `exitoso,"${f.categoria}","${f.producto}","${f.archivo}","${f.bucketPath}",${f.size},""\\n`;
        });
        r.failed.forEach(f => {
            csvContent += `fallido,"${f.categoria}","${f.producto}","${f.archivo}","${f.bucketPath}",${f.size},"${f.error}"\\n`;
        });
    });
    
    await fs.writeFile(`upload-report-${timestamp}.csv`, csvContent);
    
    console.log(`\\n📊 Reportes guardados:`);
    console.log(`   📄 upload-report-${timestamp}.json`);
    console.log(`   📄 upload-report-${timestamp}.csv`);
}

async function executeUpload() {
    console.log('📤 SUBIDA MASIVA DE IMÁGENES AL BUCKET');
    console.log('=====================================\\n');
    
    try {
        // Verificar que existe la carpeta source
        try {
            await fs.access(SOURCE_DIR);
        } catch {
            throw new Error(`Carpeta fuente "${SOURCE_DIR}" no encontrada`);
        }
        
        // Verificar bucket
        console.log('🔍 Verificando bucket...');
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) throw error;
        
        const bucket = buckets.find(b => b.name === BUCKET_NAME);
        if (!bucket) {
            throw new Error(`Bucket "${BUCKET_NAME}" no encontrado`);
        }
        console.log('✅ Bucket encontrado\\n');
        
        // Escanear archivos
        console.log(`🔍 Escaneando imágenes en ${SOURCE_DIR}/...`);
        const imageFiles = await scanImageFiles(SOURCE_DIR);
        
        if (imageFiles.length === 0) {
            console.log('⚠️  No se encontraron imágenes para subir');
            return;
        }
        
        // Mostrar estadísticas iniciales
        const totalSize = imageFiles.reduce((acc, f) => acc + f.size, 0);
        const categoryCounts = {};
        imageFiles.forEach(f => {
            categoryCounts[f.categoria] = (categoryCounts[f.categoria] || 0) + 1;
        });
        
        console.log(`\\n📊 ARCHIVOS ENCONTRADOS:`);
        console.log(`========================`);
        console.log(`📸 Total: ${imageFiles.length} imágenes`);
        console.log(`💾 Tamaño: ${Math.round(totalSize / (1024 * 1024))} MB`);
        console.log(`\\n📂 Por categoría:`);
        Object.entries(categoryCounts).forEach(([cat, count]) => {
            console.log(`   ${cat}: ${count} imágenes`);
        });
        
        console.log(`\\n🚀 Iniciando subida en lotes de ${BATCH_SIZE}...\\n`);
        
        // Subir en lotes
        const allResults = [];
        let processed = 0;
        
        for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
            const batch = imageFiles.slice(i, i + BATCH_SIZE);
            console.log(`📦 Lote ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(imageFiles.length/BATCH_SIZE)} (${batch.length} archivos)`);
            
            const results = await uploadFilesBatch(batch);
            allResults.push(results);
            
            processed += batch.length;
            const progress = Math.round((processed / imageFiles.length) * 100);
            console.log(`   Progreso: ${processed}/${imageFiles.length} (${progress}%)\\n`);
            
            // Pequeña pausa para no saturar
            if (i + BATCH_SIZE < imageFiles.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Generar resumen final
        const summary = generateSummary(allResults, imageFiles.length);
        
        console.log(`🎉 SUBIDA COMPLETADA`);
        console.log(`===================`);
        console.log(`✅ Exitosas: ${summary.successful}/${summary.total}`);
        console.log(`❌ Fallidas: ${summary.failed}/${summary.total}`);
        console.log(`💾 Subido: ${Math.round(summary.totalSize / (1024 * 1024))} MB`);
        
        if (summary.failed > 0) {
            console.log(`\\n⚠️  Archivos fallidos:`);
            allResults.forEach(r => {
                r.failed.forEach(f => {
                    console.log(`   ❌ ${f.bucketPath}: ${f.error}`);
                });
            });
        }
        
        console.log(`\\n🏷️  Por categoría:`);
        Object.entries(summary.categoryStats).forEach(([cat, stats]) => {
            console.log(`   ${cat}: ${stats.count} archivos (${Math.round(stats.size/1024)}KB)`);
        });
        
        // Guardar reportes
        await saveUploadReport(summary, allResults);
        
        console.log(`\\n💡 Las imágenes están ahora disponibles en:`);
        console.log(`   https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images/`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Ejecutar
if (require.main === module) {
    executeUpload().catch(console.error);
}

module.exports = { executeUpload };

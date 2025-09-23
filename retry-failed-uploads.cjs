/**
 * SCRIPT PARA REINTENTAR ARCHIVOS FALLIDOS
 * ========================================
 * Reintenta solo los archivos que fallaron, normalizando nombres y con delay aumentado
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
const BATCH_SIZE = 3; // Reducir lote para ser más conservadores
const DELAY_BETWEEN_UPLOADS = 2000; // 2 segundos entre subidas
const DELAY_BETWEEN_BATCHES = 3000; // 3 segundos entre lotes

// Archivos que fallaron en la primera subida
const FAILED_FILES = [
    'Accesorios/Cartera Liga/Café.jpg',
    'Accesorios/Monedero Motita/Café Oscuro.jpg',
    'Accesorios/Monedero Motita/Café.jpg',
    'Accesorios/Portacable Chico/Café Oscuro.jpg',
    'Bolsas Cruzadas/Bolsa botón madera/Café.png',
    'Bolsas Cruzadas/Bolsa botón madera/Camel.png',
    'Bolsas Cruzadas/Bolsa botón madera/Gris.png',
    'Bolsas Cruzadas/Bolsa botón madera/Hueso.png',
    'Bolsas Cruzadas/Bolsa botón madera/Negro.png',
    'Bolsas Cruzadas/Bolsa botón madera/principal.jpg',
    'Bolsas Cruzadas/Bolsa botón madera/Rojo.png',
    'Bolsas Cruzadas/Cangurera/Café Claro.png',
    'Bolsas Cruzadas/Cangurera/Café Oscuro.png',
    'Bolsas Cruzadas/Cangurera/Oro Pálido.png',
    'Bolsas Cruzadas/Clutch Chica con Base/Café.png',
    'Bolsas Cruzadas/Clutch Chica Plana/Café.png',
    'Bolsas Cruzadas/Clutch Grande con strap/Café Claro.png',
    'Bolsas Cruzadas/Clutch Grande con strap/Café Oscuro.png',
    'Bolsas de mano/Cartera tipo Sobre/Café.png',
    'Bolsas Grandes/Bolsa grande con Jareta/Café.png',
    'Bolsas Grandes/Bolsas Gigante Plana/Café Claro.png',
    'Botelleras/Botelleras/Café Oscuro.jpg',
    'Joyeria/Arete Geometrico Gigante/Café.jpg',
    'Joyeria/Arete Piel Balancín Oval/Beige.jpg',
    'Joyeria/Arete Piel Balancín Oval/cobre.jpg',
    'Joyeria/Arete Piel Balancín Oval/Miel.jpg',
    'Joyeria/Arete Piel Balancín Oval/principal.jpg',
    'Joyeria/Arete Piel Balancín Oval/Tinta.jpg',
    'Joyeria/Arete Piel Gota/Café Oscuro.jpg',
    'Joyeria/Arete Piel Gota/Oro Pálido.jpg',
    'Joyeria/Arete Piel Péndulo/Beige.jpg',
    'Joyeria/Arete Piel Péndulo/Café Claro.jpg',
    'Joyeria/Arete Piel Péndulo/cobre.jpg',
    'Joyeria/Arete Piel Péndulo/Ladrillo.jpg',
    'Joyeria/Arete Piel Péndulo/Miel.jpg',
    'Joyeria/Arete Piel Péndulo/Negro.jpg',
    'Joyeria/Arete Piel Péndulo/principal.jpg',
    'Joyeria/Brazalete Liso/Café Claro.jpg',
    'Joyeria/Brazalete Liso/Oro Pálido.jpg',
    'Portacel/Portacel grande/Café Claro.jpeg',
    'Portacel/Portacel grande/Café Oscuro.jpeg',
    'Portacel/Portacel Piel liso/Café.png'
];

function normalizeFileName(fileName) {
    // Normalizar caracteres especiales y acentos
    return fileName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (acentos, tildes)
        .replace(/[^a-zA-Z0-9.\-_/\s]/g, '') // Solo permitir letras, números, puntos, guiones, espacios y barras
        .replace(/\s+/g, ' ') // Normalizar espacios múltiples
        .trim();
}

function normalizePath(bucketPath) {
    // Dividir el path en partes y normalizar cada una
    const parts = bucketPath.split('/');
    const normalizedParts = parts.map(part => {
        // Preservar la extensión del archivo
        if (part.includes('.')) {
            const lastDot = part.lastIndexOf('.');
            const nameWithoutExt = part.substring(0, lastDot);
            const extension = part.substring(lastDot);
            return normalizeFileName(nameWithoutExt) + extension;
        }
        return normalizeFileName(part);
    });
    
    return normalizedParts.join('/');
}

async function retryFailedFile(originalPath, localPath) {
    try {
        console.log(`   📤 Reintentando: ${originalPath}`);
        
        // Leer archivo
        const fileBuffer = await fs.readFile(localPath);
        
        // Normalizar el path del bucket
        const normalizedBucketPath = normalizePath(originalPath);
        
        console.log(`      🔧 Normalizado: ${normalizedBucketPath}`);
        
        // Determinar content type
        const ext = path.extname(normalizedBucketPath).toLowerCase();
        const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                          ext === '.png' ? 'image/png' :
                          ext === '.webp' ? 'image/webp' : 'image/jpeg';
        
        // Subir al bucket con path normalizado
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(normalizedBucketPath, fileBuffer, {
                contentType,
                upsert: true // Sobrescribir si ya existe
            });
        
        if (error) {
            throw error;
        }
        
        const fileSizeKB = Math.round(fileBuffer.length / 1024);
        console.log(`   ✅ ${normalizedBucketPath} (${fileSizeKB}KB)`);
        
        return {
            success: true,
            originalPath,
            normalizedPath: normalizedBucketPath,
            uploadedPath: data.path,
            size: fileBuffer.length
        };
        
    } catch (error) {
        console.log(`   ❌ ${originalPath}: ${error.message}`);
        return {
            success: false,
            originalPath,
            error: error.message
        };
    }
}

async function findLocalPath(bucketPath) {
    // Convertir bucket path a path local de Windows
    const localPath = path.join(SOURCE_DIR, bucketPath.replace(/\//g, path.sep));
    
    try {
        await fs.access(localPath);
        return localPath;
    } catch {
        console.warn(`   ⚠️  No se encontró archivo local: ${localPath}`);
        return null;
    }
}

async function retryFailedUploads() {
    console.log('🔄 REINTENTO DE ARCHIVOS FALLIDOS');
    console.log('=================================\n');
    
    console.log(`📋 Archivos a reintentar: ${FAILED_FILES.length}`);
    console.log(`⏱️  Delay entre subidas: ${DELAY_BETWEEN_UPLOADS}ms`);
    console.log(`📦 Tamaño de lote: ${BATCH_SIZE}`);
    console.log(`⏸️  Delay entre lotes: ${DELAY_BETWEEN_BATCHES}ms\n`);

    const results = {
        successful: [],
        failed: [],
        notFound: []
    };

    // Procesar en lotes
    for (let i = 0; i < FAILED_FILES.length; i += BATCH_SIZE) {
        const batch = FAILED_FILES.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(FAILED_FILES.length / BATCH_SIZE);
        
        console.log(`📦 Lote ${batchNumber}/${totalBatches} (${batch.length} archivos)`);
        
        // Procesar archivos del lote uno por uno con delay
        for (let j = 0; j < batch.length; j++) {
            const bucketPath = batch[j];
            
            // Encontrar archivo local
            const localPath = await findLocalPath(bucketPath);
            
            if (!localPath) {
                results.notFound.push({
                    originalPath: bucketPath,
                    reason: 'Archivo local no encontrado'
                });
                continue;
            }
            
            // Reintentar subida
            const result = await retryFailedFile(bucketPath, localPath);
            
            if (result.success) {
                results.successful.push(result);
            } else {
                results.failed.push(result);
            }
            
            // Delay entre archivos dentro del lote (excepto el último)
            if (j < batch.length - 1) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_UPLOADS));
            }
        }
        
        const progress = Math.round(((i + batch.length) / FAILED_FILES.length) * 100);
        console.log(`   Progreso: ${i + batch.length}/${FAILED_FILES.length} (${progress}%)\n`);
        
        // Delay entre lotes (excepto el último)
        if (i + BATCH_SIZE < FAILED_FILES.length) {
            console.log(`   ⏸️  Pausa entre lotes...`);
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
    }
    
    // Mostrar resumen
    console.log(`🎉 REINTENTO COMPLETADO`);
    console.log(`======================`);
    console.log(`✅ Exitosos: ${results.successful.length}/${FAILED_FILES.length}`);
    console.log(`❌ Fallidos: ${results.failed.length}/${FAILED_FILES.length}`);
    console.log(`🔍 No encontrados: ${results.notFound.length}/${FAILED_FILES.length}`);
    
    const totalSize = results.successful.reduce((acc, r) => acc + r.size, 0);
    console.log(`💾 Subido: ${Math.round(totalSize / (1024 * 1024))} MB`);
    
    if (results.failed.length > 0) {
        console.log(`\n⚠️  Archivos que aún fallan:`);
        results.failed.forEach(f => {
            console.log(`   ❌ ${f.originalPath}: ${f.error}`);
        });
    }
    
    if (results.notFound.length > 0) {
        console.log(`\n🔍 Archivos no encontrados localmente:`);
        results.notFound.forEach(f => {
            console.log(`   ❓ ${f.originalPath}: ${f.reason}`);
        });
    }
    
    if (results.successful.length > 0) {
        console.log(`\n✅ Archivos subidos exitosamente:`);
        results.successful.forEach(f => {
            console.log(`   🎯 ${f.originalPath} → ${f.normalizedPath}`);
        });
    }
    
    // Guardar reporte de reintento
    const retryReport = {
        timestamp: new Date().toISOString(),
        originalFailedCount: FAILED_FILES.length,
        results: {
            successful: results.successful.length,
            failed: results.failed.length,
            notFound: results.notFound.length
        },
        details: results
    };
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.writeFile(`retry-report-${timestamp}.json`, JSON.stringify(retryReport, null, 2));
    
    console.log(`\n📊 Reporte guardado: retry-report-${timestamp}.json`);
    
    if (results.successful.length > 0) {
        console.log(`\n💡 Nuevas imágenes disponibles en:`);
        console.log(`   https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images/`);
    }
}

// Ejecutar
if (require.main === module) {
    retryFailedUploads().catch(console.error);
}

module.exports = { retryFailedUploads };

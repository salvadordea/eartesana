/**
 * SCRIPT PARA ASIGNAR IMÁGENES A PRODUCTOS Y VARIANTES
 * ====================================================
 * Asigna automáticamente las imágenes del bucket a productos y variantes
 * - principal.jpg → imagen del producto
 * - otras imágenes → variantes por coincidencia de nombre
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BUCKET_NAME = 'product-images';
const BASE_URL = `https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/${BUCKET_NAME}`;

function normalizeForComparison(text) {
    return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9]/g, '') // Solo letras y números
        .trim();
}

function calculateSimilarity(str1, str2) {
    const norm1 = normalizeForComparison(str1);
    const norm2 = normalizeForComparison(str2);
    
    // Coincidencia exacta
    if (norm1 === norm2) return 100;
    
    // Coincidencia por inclusión
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
        const longer = norm1.length > norm2.length ? norm1 : norm2;
        const shorter = norm1.length > norm2.length ? norm2 : norm1;
        return Math.round((shorter.length / longer.length) * 90);
    }
    
    // Algoritmo de Levenshtein simplificado para palabras similares
    const maxLen = Math.max(norm1.length, norm2.length);
    if (maxLen === 0) return 100;
    
    const distance = levenshteinDistance(norm1, norm2);
    return Math.round(((maxLen - distance) / maxLen) * 100);
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

async function getAllImagesFromBucket() {
    console.log('📂 Listando todas las imágenes del bucket...');
    
    const allImages = [];
    
    async function listRecursive(prefix = '') {
        const { data: files, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list(prefix, { limit: 1000 });
        
        if (error) throw error;
        
        for (const file of files || []) {
            const fullPath = prefix ? `${prefix}/${file.name}` : file.name;
            
            // Si es archivo de imagen
            if (file.id && /\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
                allImages.push({
                    path: fullPath,
                    name: file.name,
                    url: `${BASE_URL}/${fullPath}`,
                    size: file.metadata?.size || 0
                });
            } 
            // Si es carpeta, recursar
            else if (!file.id) {
                await listRecursive(fullPath);
            }
        }
    }
    
    await listRecursive();
    
    console.log(`   ✅ Encontradas ${allImages.length} imágenes`);
    return allImages;
}

async function getAllProducts() {
    console.log('🛍️  Obteniendo productos de la base de datos...');
    
    const { data: products, error } = await supabase
        .from('products')
        .select(`
            id,
            name,
            slug,
            category_id,
            image_url,
            categories (
                id,
                name,
                slug
            )
        `);
    
    if (error) throw error;
    
    console.log(`   ✅ Encontrados ${products.length} productos`);
    return products;
}

async function getAllVariants() {
    console.log('🎨 Obteniendo variantes de la base de datos...');
    
    const { data: variants, error } = await supabase
        .from('product_variants')
        .select(`
            id,
            product_id,
            color,
            material,
            price,
            stock_quantity,
            image_url,
            products (
                id,
                name,
                slug,
                category_id,
                categories (
                    name,
                    slug
                )
            )
        `);
    
    if (error) throw error;
    
    console.log(`   ✅ Encontradas ${variants.length} variantes`);
    return variants;
}

function findProductImage(product, images) {
    const categoryName = product.categories.name;
    const productSlug = product.slug;
    
    // Buscar imagen principal: categoria/producto/principal.jpg
    const principalImage = images.find(img => {
        const pathParts = img.path.split('/');
        return pathParts.length >= 3 && 
               normalizeForComparison(pathParts[0]) === normalizeForComparison(categoryName) &&
               normalizeForComparison(pathParts[1]) === normalizeForComparison(productSlug) &&
               normalizeForComparison(pathParts[2]) === 'principaljpg';
    });
    
    if (principalImage) {
        return {
            image: principalImage,
            confidence: 100,
            reason: 'Imagen principal exacta'
        };
    }
    
    // Buscar imágenes en la carpeta del producto
    const productImages = images.filter(img => {
        const pathParts = img.path.split('/');
        return pathParts.length >= 3 && 
               normalizeForComparison(pathParts[0]) === normalizeForComparison(categoryName) &&
               normalizeForComparison(pathParts[1]) === normalizeForComparison(productSlug);
    });
    
    // Si hay imágenes en la carpeta pero no principal, usar la primera
    if (productImages.length > 0) {
        return {
            image: productImages[0],
            confidence: 75,
            reason: 'Primera imagen de la carpeta del producto'
        };
    }
    
    return null;
}

function findVariantImage(variant, images) {
    const categoryName = variant.products.categories.name;
    const productSlug = variant.products.slug;
    const variantName = variant.color || variant.material || '';
    
    if (!variantName) return null;
    
    // Buscar imágenes en la carpeta del producto
    const productImages = images.filter(img => {
        const pathParts = img.path.split('/');
        return pathParts.length >= 3 && 
               normalizeForComparison(pathParts[0]) === normalizeForComparison(categoryName) &&
               normalizeForComparison(pathParts[1]) === normalizeForComparison(productSlug) &&
               normalizeForComparison(pathParts[2]) !== 'principaljpg'; // Excluir principal
    });
    
    let bestMatch = null;
    let bestScore = 0;
    
    // Comparar nombre de variante con nombres de archivo
    for (const img of productImages) {
        const fileName = img.name.replace(/\.(jpg|jpeg|png|webp)$/i, '');
        const similarity = calculateSimilarity(variantName, fileName);
        
        if (similarity > bestScore) {
            bestScore = similarity;
            bestMatch = {
                image: img,
                confidence: similarity,
                reason: `Similitud ${similarity}% con "${fileName}"`
            };
        }
    }
    
    // Solo devolver coincidencias con confianza >= 60%
    return bestScore >= 60 ? bestMatch : null;
}

async function updateProductImage(productId, imageUrl) {
    const { error } = await supabase
        .from('products')
        .update({ image_url: imageUrl })
        .eq('id', productId);
    
    if (error) throw error;
}

async function updateVariantImage(variantId, imageUrl) {
    const { error } = await supabase
        .from('product_variants')
        .update({ image_url: imageUrl })
        .eq('id', variantId);
    
    if (error) throw error;
}

async function assignImagesToProductsAndVariants() {
    console.log('🖼️  ASIGNACIÓN DE IMÁGENES A PRODUCTOS Y VARIANTES');
    console.log('==================================================\n');
    
    try {
        // Obtener datos
        const [images, products, variants] = await Promise.all([
            getAllImagesFromBucket(),
            getAllProducts(),
            getAllVariants()
        ]);
        
        console.log('\n🎯 Iniciando asignación de imágenes...\n');
        
        const results = {
            productsUpdated: 0,
            productsSkipped: 0,
            variantsUpdated: 0,
            variantsSkipped: 0,
            errors: []
        };
        
        // Asignar imágenes a productos
        console.log('📦 Asignando imágenes a productos...');
        for (const product of products) {
            try {
                const match = findProductImage(product, images);
                
                if (match && match.confidence >= 75) {
                    await updateProductImage(product.id, match.image.url);
                    console.log(`   ✅ ${product.name}: ${match.image.path} (${match.confidence}%)`);
                    results.productsUpdated++;
                } else {
                    console.log(`   ⚠️  ${product.name}: No se encontró imagen principal`);
                    results.productsSkipped++;
                }
            } catch (error) {
                console.log(`   ❌ ${product.name}: ${error.message}`);
                results.errors.push(`Producto ${product.name}: ${error.message}`);
            }
            
            // Pequeña pausa para no saturar
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('\n🎨 Asignando imágenes a variantes...');
        for (const variant of variants) {
            try {
                const variantName = variant.color || variant.material || `Variante ${variant.id}`;
                const match = findVariantImage(variant, images);
                
                if (match && match.confidence >= 60) {
                    await updateVariantImage(variant.id, match.image.url);
                    console.log(`   ✅ ${variant.products.name} - ${variantName}: ${match.image.path} (${match.confidence}%)`);
                    results.variantsUpdated++;
                } else {
                    console.log(`   ⚠️  ${variant.products.name} - ${variantName}: No se encontró imagen coincidente`);
                    results.variantsSkipped++;
                }
            } catch (error) {
                console.log(`   ❌ ${variant.products.name} - ${variantName}: ${error.message}`);
                results.errors.push(`Variante ${variant.id}: ${error.message}`);
            }
            
            // Pequeña pausa para no saturar
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Mostrar resumen final
        console.log('\n🎉 ASIGNACIÓN COMPLETADA');
        console.log('========================');
        console.log(`📦 Productos actualizados: ${results.productsUpdated}/${products.length}`);
        console.log(`📦 Productos sin imagen: ${results.productsSkipped}/${products.length}`);
        console.log(`🎨 Variantes actualizadas: ${results.variantsUpdated}/${variants.length}`);
        console.log(`🎨 Variantes sin imagen: ${results.variantsSkipped}/${variants.length}`);
        
        if (results.errors.length > 0) {
            console.log(`\n❌ Errores (${results.errors.length}):`);
            results.errors.forEach(error => console.log(`   ${error}`));
        }
        
        // Guardar reporte
        const report = {
            timestamp: new Date().toISOString(),
            summary: results,
            totalImages: images.length,
            totalProducts: products.length,
            totalVariants: variants.length
        };
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fs = require('fs').promises;
        await fs.writeFile(`image-assignment-report-${timestamp}.json`, JSON.stringify(report, null, 2));
        
        console.log(`\n📊 Reporte guardado: image-assignment-report-${timestamp}.json`);
        console.log('\n💡 Las imágenes han sido asignadas a productos y variantes en la base de datos.');
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

// Ejecutar
if (require.main === module) {
    assignImagesToProductsAndVariants().catch(console.error);
}

module.exports = { assignImagesToProductsAndVariants };

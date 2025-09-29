// Script mejorado para obtener productos con variantes
// Incluye corrección de URLs de imágenes de variantes

// Función para obtener productos con sus variantes
async function getProductsWithVariants(supabase) {
    try {
        console.log('🔄 Fetching products with variants...');
        
        // 1. Obtener todos los productos activos
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select(`
                id, name, slug, description, price, regular_price, 
                total_stock, main_image_url, category_id, 
                has_variants, type, in_stock
            `)
            .eq('status', 'active')
            .eq('in_stock', true);
            
        if (productsError) throw productsError;
        
        console.log(`✅ Found ${products.length} active products`);
        
        // 2. Obtener todas las variantes activas
        const { data: variants, error: variantsError } = await supabase
            .from('product_variants')
            .select(`
                id, product_id, name, price, stock, image_url, 
                variant_name, variant_value, variant_type, sku
            `)
            .eq('is_active', true);
            
        if (variantsError) throw variantsError;
        
        console.log(`✅ Found ${variants.length} active variants`);
        
        // 3. Obtener categorías
        const { data: categories, error: categoriesError } = await supabase
            .from('categories')
            .select('id, name');
            
        if (categoriesError) throw categoriesError;
        
        // 4. Crear mapas para optimizar búsquedas
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.id] = cat.name;
        });
        
        const variantsByProduct = {};
        variants.forEach(variant => {
            if (!variantsByProduct[variant.product_id]) {
                variantsByProduct[variant.product_id] = [];
            }
            
            // Corregir URL de imagen de variante
            const correctedVariant = {
                ...variant,
                image_url: correctVariantImageUrl(variant.image_url)
            };
            
            variantsByProduct[variant.product_id].push(correctedVariant);
        });
        
        // 5. Combinar productos con sus variantes
        const productsWithVariants = products.map(product => {
            const productVariants = variantsByProduct[product.id] || [];
            
            // Calcular stock real desde variantes si existen
            let calculatedStock = product.total_stock;
            if (product.has_variants && productVariants.length > 0) {
                calculatedStock = productVariants.reduce((sum, v) => sum + v.stock, 0);
                
                // Verificar inconsistencia con total_stock
                if (calculatedStock !== product.total_stock) {
                    console.warn(`⚠️ Stock mismatch for product ${product.id}: DB=${product.total_stock}, Calculated=${calculatedStock}`);
                }
            }
            
            return {
                ...product,
                category: categoryMap[product.category_id] || 'Sin categoría',
                variants: productVariants,
                calculated_stock: calculatedStock,
                has_stock_mismatch: calculatedStock !== product.total_stock
            };
        });
        
        console.log(`✅ Combined ${productsWithVariants.length} products with variants`);
        
        return {
            products: productsWithVariants,
            stats: {
                totalProducts: products.length,
                totalVariants: variants.length,
                productsWithVariants: productsWithVariants.filter(p => p.has_variants).length,
                stockMismatches: productsWithVariants.filter(p => p.has_stock_mismatch).length
            }
        };
        
    } catch (error) {
        console.error('❌ Error fetching products with variants:', error);
        throw error;
    }
}

// Función para corregir URLs de imágenes de variantes
function correctVariantImageUrl(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') {
        return null;
    }
    
    try {
        // Si es un JSON string, parsearlo
        if (imageUrl.startsWith('{')) {
            const imageData = JSON.parse(imageUrl);
            const originalSrc = imageData.src;
            
            if (originalSrc && originalSrc.includes('wp-content/uploads')) {
                // Extraer el nombre del archivo del localFileName si existe
                if (imageData.localFileName) {
                    // Construir URL de Supabase usando el localFileName
                    const fileName = imageData.localFileName;
                    return `https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images/${fileName}`;
                } else {
                    // Extraer nombre del archivo de la URL original
                    const fileName = originalSrc.split('/').pop();
                    return `https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images/${fileName}`;
                }
            } else if (originalSrc && originalSrc.startsWith('http')) {
                return originalSrc; // Ya es una URL válida
            }
        } else if (imageUrl.startsWith('http')) {
            return imageUrl; // Ya es una URL válida
        }
        
        return null; // No se pudo procesar
        
    } catch (error) {
        console.warn('⚠️ Error processing variant image URL:', error);
        return null;
    }
}

// Función para obtener solo productos simples (sin variantes) - para casos más simples
async function getSimpleProducts(supabase) {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select(`
                id, name, price, total_stock, main_image_url, 
                description, slug, category_id
            `)
            .eq('status', 'active')
            .eq('in_stock', true);
            
        if (error) throw error;
        
        // Obtener categorías
        const { data: categories } = await supabase
            .from('categories')
            .select('id, name');
        
        const categoryMap = {};
        if (categories) {
            categories.forEach(cat => {
                categoryMap[cat.id] = cat.name;
            });
        }
        
        return products.map(product => ({
            ...product,
            category: categoryMap[product.category_id] || 'Sin categoría',
            stock: product.total_stock
        }));
        
    } catch (error) {
        console.error('❌ Error fetching simple products:', error);
        throw error;
    }
}

// Función para actualizar stock total basado en variantes
async function updateTotalStockFromVariants(supabase, productId) {
    try {
        // Obtener variantes del producto
        const { data: variants, error: variantsError } = await supabase
            .from('product_variants')
            .select('stock')
            .eq('product_id', productId)
            .eq('is_active', true);
            
        if (variantsError) throw variantsError;
        
        // Calcular stock total
        const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
        
        // Actualizar el producto
        const { data, error: updateError } = await supabase
            .from('products')
            .update({ total_stock: totalStock })
            .eq('id', productId);
            
        if (updateError) throw updateError;
        
        console.log(`✅ Updated total_stock for product ${productId}: ${totalStock}`);
        return totalStock;
        
    } catch (error) {
        console.error(`❌ Error updating stock for product ${productId}:`, error);
        throw error;
    }
}

// Función para sincronizar todos los stocks
async function syncAllProductStocks(supabase) {
    try {
        console.log('🔄 Syncing all product stocks from variants...');
        
        // Obtener productos que tienen variantes
        const { data: products, error } = await supabase
            .from('products')
            .select('id')
            .eq('has_variants', true)
            .eq('status', 'active');
            
        if (error) throw error;
        
        let updated = 0;
        for (const product of products) {
            try {
                await updateTotalStockFromVariants(supabase, product.id);
                updated++;
            } catch (err) {
                console.warn(`⚠️ Failed to update stock for product ${product.id}:`, err.message);
            }
        }
        
        console.log(`✅ Successfully updated stock for ${updated}/${products.length} products`);
        return updated;
        
    } catch (error) {
        console.error('❌ Error syncing product stocks:', error);
        throw error;
    }
}

// Exportar funciones para uso en el navegador
if (typeof window !== 'undefined') {
    window.ProductVariantsManager = {
        getProductsWithVariants,
        getSimpleProducts,
        updateTotalStockFromVariants,
        syncAllProductStocks,
        correctVariantImageUrl
    };
}

// Para uso en Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getProductsWithVariants,
        getSimpleProducts,
        updateTotalStockFromVariants,
        syncAllProductStocks,
        correctVariantImageUrl
    };
}

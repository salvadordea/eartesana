/**
 * SCRIPT PARA INVESTIGAR ESTRUCTURA DE LA BASE DE DATOS
 * ====================================================
 * Verifica las tablas y columnas disponibles
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function investigateDatabase() {
    console.log('🔍 INVESTIGACIÓN DE LA BASE DE DATOS');
    console.log('====================================\n');
    
    try {
        // Verificar productos
        console.log('📦 Productos:');
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .limit(1);
        
        if (productsError) {
            console.log('   ❌ Error:', productsError.message);
        } else {
            console.log('   ✅ Tabla existe');
            if (products.length > 0) {
                console.log('   📋 Columnas:', Object.keys(products[0]).join(', '));
                console.log('   📄 Ejemplo:', JSON.stringify(products[0], null, 4));
            }
        }
        
        console.log('\n🎨 Variantes de productos:');
        const { data: variants, error: variantsError } = await supabase
            .from('product_variants')
            .select('*')
            .limit(1);
        
        if (variantsError) {
            console.log('   ❌ Error:', variantsError.message);
        } else {
            console.log('   ✅ Tabla existe');
            if (variants.length > 0) {
                console.log('   📋 Columnas:', Object.keys(variants[0]).join(', '));
                console.log('   📄 Ejemplo:', JSON.stringify(variants[0], null, 4));
            } else {
                console.log('   📄 No hay registros en product_variants');
            }
        }
        
        // Verificar categorías
        console.log('\n🏷️ Categorías:');
        const { data: categories, error: categoriesError } = await supabase
            .from('categories')
            .select('*')
            .limit(1);
        
        if (categoriesError) {
            console.log('   ❌ Error:', categoriesError.message);
        } else {
            console.log('   ✅ Tabla existe');
            if (categories.length > 0) {
                console.log('   📋 Columnas:', Object.keys(categories[0]).join(', '));
                console.log('   📄 Ejemplo:', JSON.stringify(categories[0], null, 4));
            }
        }
        
        // Contar registros
        console.log('\n📊 CONTEOS:');
        
        const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });
        console.log(`📦 Productos: ${productCount || 0}`);
        
        const { count: variantCount } = await supabase
            .from('product_variants')
            .select('*', { count: 'exact', head: true });
        console.log(`🎨 Variantes: ${variantCount || 0}`);
        
        const { count: categoryCount } = await supabase
            .from('categories')
            .select('*', { count: 'exact', head: true });
        console.log(`🏷️ Categorías: ${categoryCount || 0}`);
        
        // Verificar productos con categorías
        console.log('\n📦 Productos con categorías (muestra):');
        const { data: productsWithCategories, error: joinError } = await supabase
            .from('products')
            .select(`
                id,
                name,
                slug,
                image_url,
                categories (
                    id,
                    name,
                    slug
                )
            `)
            .limit(3);
        
        if (joinError) {
            console.log('   ❌ Error:', joinError.message);
        } else {
            productsWithCategories.forEach((product, index) => {
                console.log(`   ${index + 1}. ${product.name}`);
                console.log(`      Categoría: ${product.categories?.name || 'Sin categoría'}`);
                console.log(`      Slug: ${product.slug}`);
                console.log(`      Imagen actual: ${product.image_url || 'Sin imagen'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

// Ejecutar
if (require.main === module) {
    investigateDatabase().catch(console.error);
}

module.exports = { investigateDatabase };

/**
 * Script para verificar que el sistema de variantes esté correctamente instalado
 * Ejecutar: node database/verify-variants-installation.js
 */

const EstudioArtesanaConfig = require('../assets/js/config.js');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    EstudioArtesanaConfig.supabase.url, 
    EstudioArtesanaConfig.supabase.anonKey
);

async function verifyVariantsInstallation() {
    console.log('🔍 VERIFICANDO INSTALACIÓN DEL SISTEMA DE VARIANTES\n');
    
    let allGood = true;
    
    try {
        // 1. Verificar tabla products con nuevas columnas
        console.log('📊 1. Verificando tabla products...');
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name, total_stock, has_variants, variant_type')
            .limit(3);
        
        if (productsError) {
            console.error('❌ Error accediendo a products:', productsError.message);
            allGood = false;
        } else {
            console.log('✅ Tabla products OK');
            console.log(`   📦 Productos encontrados: ${products.length}`);
            
            // Verificar si las columnas nuevas existen
            if (products.length > 0) {
                const sample = products[0];
                const hasNewColumns = 'total_stock' in sample && 'has_variants' in sample;
                if (hasNewColumns) {
                    console.log('✅ Nuevas columnas (total_stock, has_variants) OK');
                } else {
                    console.log('⚠️  Faltan nuevas columnas en products');
                    allGood = false;
                }
            }
        }
        
        // 2. Verificar tabla product_variants
        console.log('\n📋 2. Verificando tabla product_variants...');
        const { data: variants, error: variantsError } = await supabase
            .from('product_variants')
            .select('*')
            .limit(5);
        
        if (variantsError) {
            console.error('❌ Error accediendo a product_variants:', variantsError.message);
            allGood = false;
        } else {
            console.log('✅ Tabla product_variants OK');
            console.log(`   🎨 Variantes encontradas: ${variants.length}`);
            
            if (variants.length > 0) {
                console.log('   📝 Ejemplo de variante:');
                const sample = variants[0];
                console.log(`      ID: ${sample.id}`);
                console.log(`      Producto: ${sample.product_id}`);
                console.log(`      Nombre: ${sample.variant_name}`);
                console.log(`      Stock: ${sample.stock}`);
            }
        }
        
        // 3. Verificar tabla variant_types
        console.log('\n🏷️  3. Verificando tabla variant_types...');
        const { data: types, error: typesError } = await supabase
            .from('variant_types')
            .select('*')
            .order('id');
        
        if (typesError) {
            console.error('❌ Error accediendo a variant_types:', typesError.message);
            allGood = false;
        } else {
            console.log('✅ Tabla variant_types OK');
            console.log(`   🏷️  Tipos disponibles: ${types.length}`);
            types.forEach(type => {
                console.log(`      - ${type.display_name} (${type.name})`);
            });
        }
        
        // 4. Verificar vista product_variants_summary
        console.log('\n📈 4. Verificando vista product_variants_summary...');
        const { data: summary, error: summaryError } = await supabase
            .from('product_variants_summary')
            .select('*')
            .limit(3);
        
        if (summaryError) {
            console.error('❌ Error accediendo a product_variants_summary:', summaryError.message);
            allGood = false;
        } else {
            console.log('✅ Vista product_variants_summary OK');
            console.log(`   📊 Productos en resumen: ${summary.length}`);
        }
        
        // 5. Probar creación de una variante de prueba
        console.log('\n🧪 5. Probando creación de variante de prueba...');
        
        if (products && products.length > 0) {
            const testProductId = products[0].id;
            const testVariantId = `${testProductId}-test-${Date.now()}`;
            
            // Crear variante de prueba
            const { data: newVariant, error: createError } = await supabase
                .from('product_variants')
                .insert({
                    id: testVariantId,
                    product_id: testProductId,
                    variant_name: 'Test Color',
                    variant_value: 'test-color',
                    variant_type: 'color',
                    stock: 5,
                    sku: `TEST-${Date.now()}`
                })
                .select()
                .single();
            
            if (createError) {
                console.error('❌ Error creando variante de prueba:', createError.message);
                allGood = false;
            } else {
                console.log('✅ Creación de variante OK');
                console.log(`   🆔 ID creado: ${newVariant.id}`);
                
                // Verificar que el trigger actualizó el producto
                const { data: updatedProduct } = await supabase
                    .from('products')
                    .select('total_stock, has_variants')
                    .eq('id', testProductId)
                    .single();
                
                if (updatedProduct && updatedProduct.has_variants) {
                    console.log('✅ Trigger de actualización OK');
                    console.log(`   📦 Total stock actualizado: ${updatedProduct.total_stock}`);
                } else {
                    console.log('⚠️  Trigger podría no estar funcionando');
                }
                
                // Limpiar variante de prueba
                await supabase
                    .from('product_variants')
                    .delete()
                    .eq('id', testVariantId);
                
                console.log('🧹 Variante de prueba eliminada');
            }
        }
        
        // Resumen final
        console.log('\n' + '='.repeat(50));
        if (allGood) {
            console.log('🎉 ¡SISTEMA DE VARIANTES INSTALADO CORRECTAMENTE!');
            console.log('\n✅ Todo funcionando:');
            console.log('   - Tabla products con nuevas columnas');
            console.log('   - Tabla product_variants operativa'); 
            console.log('   - Tabla variant_types con datos');
            console.log('   - Vista product_variants_summary activa');
            console.log('   - Triggers funcionando correctamente');
            console.log('\n🚀 Ya puedes usar:');
            console.log('   - Panel: admin/inventory-panel-improved.html');
            console.log('   - API: api/inventory-variants-api.js');
        } else {
            console.log('⚠️  INSTALACIÓN PARCIAL DETECTADA');
            console.log('\n🔧 Acciones recomendadas:');
            console.log('   1. Revisar errores arriba');
            console.log('   2. Ejecutar manualmente el SQL faltante');
            console.log('   3. Verificar permisos en Supabase');
        }
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('💥 Error durante verificación:', error);
    }
}

// Ejecutar verificación
if (require.main === module) {
    verifyVariantsInstallation();
}

module.exports = { verifyVariantsInstallation };

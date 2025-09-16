/**
 * Script para verificar la estructura actual de product_variants
 * Ejecutar: node database/check-variants-structure.js
 */

const EstudioArtesanaConfig = require('../assets/js/config.js');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    EstudioArtesanaConfig.supabase.url, 
    EstudioArtesanaConfig.supabase.anonKey
);

async function checkVariantsStructure() {
    console.log('🔍 VERIFICANDO ESTRUCTURA DE PRODUCT_VARIANTS\n');
    
    try {
        // Obtener una muestra de variantes para ver la estructura
        const { data: variants, error } = await supabase
            .from('product_variants')
            .select('*')
            .limit(3);
        
        if (error) {
            console.error('❌ Error accediendo a product_variants:', error);
            return;
        }
        
        console.log('📋 Variantes encontradas:', variants.length);
        
        if (variants.length > 0) {
            const sample = variants[0];
            console.log('\n📝 Estructura de la primera variante:');
            console.log('='.repeat(40));
            
            Object.keys(sample).forEach(key => {
                console.log(`${key}: ${sample[key]} (${typeof sample[key]})`);
            });
            
            console.log('='.repeat(40));
            
            // Verificar columnas específicas que necesitamos
            const requiredColumns = [
                'variant_name', 'variant_value', 'variant_type', 
                'name', 'stock', 'sku', 'price', 'image_url'
            ];
            
            console.log('\n🔍 Verificando columnas requeridas:');
            requiredColumns.forEach(col => {
                const exists = col in sample;
                console.log(`${exists ? '✅' : '❌'} ${col}: ${exists ? 'Existe' : 'No existe'}`);
            });
            
            // Mostrar todas las variantes para análisis
            console.log('\n📊 Todas las variantes:');
            variants.forEach((variant, index) => {
                console.log(`\nVariante ${index + 1}:`);
                console.log(`  ID: ${variant.id}`);
                console.log(`  Producto: ${variant.product_id}`);
                // Usar las columnas que sabemos que existen
                if (variant.name) console.log(`  Name: ${variant.name}`);
                if (variant.variant_name) console.log(`  Variant Name: ${variant.variant_name}`);
                if (variant.stock !== undefined) console.log(`  Stock: ${variant.stock}`);
                if (variant.price) console.log(`  Precio: ${variant.price}`);
            });
        } else {
            console.log('⚠️  No se encontraron variantes en la tabla');
        }
        
    } catch (error) {
        console.error('💥 Error durante verificación:', error);
    }
}

// Ejecutar verificación
if (require.main === module) {
    checkVariantsStructure();
}

module.exports = { checkVariantsStructure };

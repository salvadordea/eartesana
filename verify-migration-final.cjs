const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyMigration() {
  console.log('🔍 VERIFICACIÓN FINAL DE LA MIGRACIÓN');
  console.log('=====================================\n');

  try {
    // Verificar estructura de URLs actuales
    const { data: products } = await supabase
      .from('products')
      .select('name, main_image_url')
      .not('main_image_url', 'is', null);

    const { data: variants } = await supabase
      .from('product_variants')
      .select(`
        name,
        image_url,
        products!inner(name)
      `)
      .not('image_url', 'is', null);

    console.log('📊 ESTADÍSTICAS FINALES:');
    console.log(`📦 Productos con imágenes: ${products.length}`);
    console.log(`🎨 Variantes con imágenes: ${variants.length}\n`);

    // Analizar patrones de URLs
    const newStructureProducts = products.filter(p => 
      p.main_image_url.includes('/Joyeria/') || 
      p.main_image_url.includes('/Portacel/') || 
      p.main_image_url.includes('/Bolsas') || 
      p.main_image_url.includes('/Backpacks/') || 
      p.main_image_url.includes('/Accesorios/') || 
      p.main_image_url.includes('/Botelleras/') || 
      p.main_image_url.includes('/Hogar/')
    ).length;

    const newStructureVariants = variants.filter(v => 
      v.image_url.includes('/Joyeria/') || 
      v.image_url.includes('/Portacel/') || 
      v.image_url.includes('/Bolsas') || 
      v.image_url.includes('/Backpacks/') || 
      v.image_url.includes('/Accesorios/') || 
      v.image_url.includes('/Botelleras/') || 
      v.image_url.includes('/Hogar/')
    ).length;

    console.log('✅ URLs CON NUEVA ESTRUCTURA:');
    console.log(`   📦 Productos: ${newStructureProducts}/${products.length} (${Math.round(newStructureProducts/products.length*100)}%)`);
    console.log(`   🎨 Variantes: ${newStructureVariants}/${variants.length} (${Math.round(newStructureVariants/variants.length*100)}%)\n`);

    // URLs con estructura antigua
    const oldStructureProducts = products.filter(p => 
      p.main_image_url.includes('_') && !p.main_image_url.includes('/')
    );

    const oldStructureVariants = variants.filter(v => 
      v.image_url.includes('/full/') || (v.image_url.includes('_') && !v.image_url.includes('/'))
    );

    console.log('⚠️ URLs CON ESTRUCTURA ANTIGUA:');
    console.log(`   📦 Productos: ${oldStructureProducts.length}`);
    if (oldStructureProducts.length > 0) {
      console.log('   Ejemplos:');
      oldStructureProducts.slice(0, 3).forEach(p => {
        console.log(`      - ${p.name}: ${p.main_image_url}`);
      });
    }

    console.log(`   🎨 Variantes: ${oldStructureVariants.length}`);
    if (oldStructureVariants.length > 0) {
      console.log('   Ejemplos:');
      oldStructureVariants.slice(0, 3).forEach(v => {
        console.log(`      - ${v.products.name} > ${v.name}: ${v.image_url}`);
      });
    }

    // URLs de placeholder
    const placeholderProducts = products.filter(p => 
      p.main_image_url.includes('placeholder')
    ).length;

    const placeholderVariants = variants.filter(v => 
      v.image_url.includes('placeholder')
    ).length;

    console.log(`\n📷 URLs DE PLACEHOLDER:`);
    console.log(`   📦 Productos: ${placeholderProducts}`);
    console.log(`   🎨 Variantes: ${placeholderVariants}`);

    // Buscar archivos antiguos en el bucket
    console.log('\n🗂️ ARCHIVOS ANTIGUOS EN EL BUCKET:');
    
    const { data: rootFiles } = await supabase
      .storage
      .from('product-images')
      .list('', { limit: 100 });

    const oldFiles = rootFiles?.filter(file => 
      !file.name.endsWith('/') && // No es carpeta
      (file.name.includes('_') || file.name.startsWith('full/')) && // Formato antiguo
      !file.name.startsWith('categories/') // No es carpeta de categorías
    ) || [];

    console.log(`   🗄️ Archivos con formato antiguo en la raíz: ${oldFiles.length}`);
    if (oldFiles.length > 0) {
      console.log('   Ejemplos:');
      oldFiles.slice(0, 5).forEach(file => {
        console.log(`      - ${file.name}`);
      });
    }

    // Verificar carpeta full
    const { data: fullFiles } = await supabase
      .storage
      .from('product-images')
      .list('full', { limit: 100 });

    console.log(`   📁 Archivos en carpeta 'full/': ${fullFiles?.length || 0}`);

    console.log('\n🎯 RESUMEN DE LA MIGRACIÓN:');
    console.log('========================');
    console.log(`✅ Productos migrados: ${newStructureProducts}/${products.length}`);
    console.log(`✅ Variantes migradas: ${newStructureVariants}/${variants.length}`);
    console.log(`⚠️ Archivos antiguos por limpiar: ${oldFiles.length + (fullFiles?.length || 0)}`);
    console.log(`📷 URLs con placeholder: ${placeholderProducts + placeholderVariants}`);

    if (newStructureProducts === products.length && newStructureVariants === variants.length) {
      console.log('\n🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!');
      console.log('   Todas las URLs apuntan a la nueva estructura organizada.');
    }

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

verifyMigration();

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyzeCurrentImages() {
  console.log('🔍 ANÁLISIS DE URLs DE IMÁGENES ACTUALES');
  console.log('=========================================\n');
  
  try {
    // Obtener productos con sus categorías
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        main_image_url,
        category_id,
        categories!inner(name, slug)
      `)
      .not('main_image_url', 'is', null)
      .limit(10);

    if (productsError) {
      console.error('❌ Error consultando productos:', productsError);
      return;
    }

    console.log('📦 URLs DE PRODUCTOS (muestra):');
    products.forEach(product => {
      console.log(`   🏷️ ${product.categories.name} > ${product.name}`);
      console.log(`   🔗 ${product.main_image_url}`);
      console.log('');
    });

    // Obtener variantes con imágenes
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select(`
        id,
        name,
        image_url,
        product_id,
        products!inner(name, slug, categories!inner(name, slug))
      `)
      .not('image_url', 'is', null)
      .limit(10);

    if (variantsError) {
      console.error('❌ Error consultando variantes:', variantsError);
      return;
    }

    console.log('🎨 URLs DE VARIANTES (muestra):');
    variants.forEach(variant => {
      console.log(`   🏷️ ${variant.products.categories.name} > ${variant.products.name} > ${variant.name}`);
      console.log(`   🔗 ${variant.image_url}`);
      console.log('');
    });

    // Analizar patrones de URLs
    console.log('📊 ANÁLISIS DE PATRONES:');
    console.log('========================\n');

    const allUrls = [
      ...products.map(p => ({ type: 'product', url: p.main_image_url, category: p.categories.name })),
      ...variants.map(v => ({ type: 'variant', url: v.image_url, category: v.products.categories.name }))
    ];

    // Extraer nombres de archivos
    const filePatterns = allUrls.map(item => {
      const filename = item.url.split('/').pop();
      return {
        ...item,
        filename,
        hasNumbers: /\d/.test(filename),
        hasUnderscore: /_/.test(filename),
        extension: filename.split('.').pop()
      };
    });

    console.log('📁 PATRONES DE NOMBRES DE ARCHIVO:');
    filePatterns.forEach(pattern => {
      console.log(`   ${pattern.type}: ${pattern.filename}`);
      console.log(`      - Categoría: ${pattern.category}`);
      console.log(`      - Tiene números: ${pattern.hasNumbers}`);
      console.log(`      - Tiene guión bajo: ${pattern.hasUnderscore}`);
      console.log(`      - Extensión: ${pattern.extension}`);
      console.log('');
    });

    // Verificar estructura actual en el bucket
    const { data: files, error: filesError } = await supabase
      .storage
      .from('product-images')
      .list('', { limit: 20 });

    if (filesError) {
      console.error('❌ Error listando archivos del bucket:', filesError);
      return;
    }

    console.log('📂 ESTRUCTURA ACTUAL DEL BUCKET:');
    files.forEach(file => {
      const prefix = file.name.endsWith('/') ? '📁' : '🖼️';
      console.log(`   ${prefix} ${file.name}`);
    });

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

analyzeCurrentImages();

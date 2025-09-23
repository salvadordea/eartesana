const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mapeo de nombres de categorías de DB a carpetas del bucket
const categoryMapping = {
  'Joyeria': 'Joyeria',
  'Portacel': 'Portacel', 
  'Bolsas Grandes': 'Bolsas Grandes',
  'Bolsas Cruzadas': 'Bolsas Cruzadas',
  'Bolsas de mano': 'Bolsas de mano',
  'Bolsas de Textil y Piel': 'Bolsas de Textil y Piel',
  'Backpacks': 'Backpacks',
  'Accesorios': 'Accesorios',
  'Botelleras': 'Botelleras',
  'Hogar': 'Hogar'
};

// Mapeo de nombres de productos de DB a carpetas del bucket
const productMapping = {
  // Joyeria
  'Arete Piel Balancín Oval': 'Arete Piel Balancin Oval',
  'Arete Piel Gota': 'Arete Piel Gota', 
  'Arete Piel Péndulo': 'Arete Piel Pendulo',
  'Brazalete Piel Pelo': 'Brazalete Piel Pelo',
  'Arete Geometrico Gigante': 'Arete Geometrico Gigante',
  'Arete Piel Polígono Chico': 'Arete Piel Poligono Chico',
  'Brazalete Hombre': 'Brazalete Hombre',
  'Brazalete Liso': 'Brazalete Liso',
  'Brazalete dos Lineas': 'Brazalete dos Lineas',
  'Brazalete lineas Delgadas': 'Brazalete lineas Delgadas',
  
  // Portacel
  'Portacel Pelo': 'Portacel Pelo',
  'Portacel grande': 'Portacel grande',
  'Portacel Piel Textil': 'Portacel Piel Textil',
  'Portacel Piel liso': 'Portacel Piel liso',
  
  // Bolsas
  'Bolsa Gigante horizontal': 'Bolsa Gigante horizontal',
  'Bolsa Gigante Vertical': 'Bolsa Gigante Vertical',
  'Bolsa grande con Jareta': 'Bolsa grande con Jareta',
  'Bolsas Gigante Plana': 'Bolsas Gigante Plana',
  'Bolsa Gigante vertical Pelo y Miel': 'Bolsa Gigante vertical Pelo y Miel',
  
  // Bolsas Cruzadas
  'Bolsa Mediana con bolsillo piel al frente': 'Bolsa Mediana con bolsillo piel al frente',
  'Bolsa boton madera': 'Bolsa boton madera',
  'Cangurera': 'Cangurera',
  'Clutch Chica Plana': 'Clutch Chica Plana',
  'Clutch Chica con Base': 'Clutch Chica con Base',
  'Clutch Grande con strap': 'Clutch Grande con strap',
  
  // Bolsas de mano
  'Bolsa Ovalada lisa': 'Bolsa Ovalada lisa',
  'Cartera tipo Sobre': 'Cartera tipo Sobre',
  
  // Textil y Piel
  'Bolsa Cilindro Jareta': 'Bolsa Cilindro Jareta',
  'Bolsa Telar de pedal cruzada': 'Bolsa Telar de pedal cruzada',
  'Bolsa de Playa Gigante': 'Bolsa de Playa Gigante',
  'Bolsa de Playa mediana': 'Bolsa de Playa mediana',
  
  // Backpacks
  'Backpack Mini': 'Backpack Mini',
  
  // Accesorios
  'Cartera Liga': 'Cartera Liga',
  'Cartera con Costura': 'Cartera con Costura',
  'Llavero Corto': 'Llavero Corto',
  'Monedero Cierre': 'Monedero Cierre',
  'Monedero Clip': 'Monedero Clip',
  'Monedero Motita': 'Monedero Motita',
  'Portacable Chico': 'Portacable Chico',
  'Portacables Grande': 'Portacables Grande',
  'Portapasaportes': 'Portapasaportes',
  'Tarjetero Boton': 'Tarjetero Boton',
  
  // Botelleras
  'Botelleras': 'Botelleras',
  
  // Hogar
  'Portavasos': 'Portavasos'
};

async function updateProductUrls() {
  console.log('🔄 ACTUALIZANDO URLs DE PRODUCTOS');
  console.log('==================================\n');

  try {
    // Obtener todos los productos con sus categorías
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
      .not('main_image_url', 'is', null);

    if (productsError) {
      console.error('❌ Error consultando productos:', productsError);
      return;
    }

    console.log(`📦 Encontrados ${products.length} productos con imágenes`);

    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      const categoryName = product.categories.name;
      const productName = product.name;
      
      const bucketCategory = categoryMapping[categoryName];
      const bucketProduct = productMapping[productName];
      
      if (bucketCategory && bucketProduct) {
        const newUrl = `https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images/${bucketCategory}/${bucketProduct}/principal.jpg`;
        
        // Actualizar en base de datos
        const { error: updateError } = await supabase
          .from('products')
          .update({ main_image_url: newUrl })
          .eq('id', product.id);

        if (updateError) {
          console.log(`   ❌ Error actualizando ${productName}: ${updateError.message}`);
        } else {
          console.log(`   ✅ ${categoryName} > ${productName}`);
          console.log(`      ${newUrl}`);
          updated++;
        }
      } else {
        console.log(`   ⚠️ Sin mapeo: ${categoryName} > ${productName}`);
        skipped++;
      }
    }

    console.log(`\n📊 Productos: ${updated} actualizados, ${skipped} sin mapeo`);

  } catch (error) {
    console.error('❌ Error general actualizando productos:', error);
  }
}

async function updateVariantUrls() {
  console.log('\n🔄 ACTUALIZANDO URLs DE VARIANTES');
  console.log('=================================\n');

  try {
    // Obtener todas las variantes con sus productos y categorías
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select(`
        id,
        name,
        image_url,
        product_id,
        variant_name,
        products!inner(name, slug, categories!inner(name, slug))
      `)
      .not('image_url', 'is', null);

    if (variantsError) {
      console.error('❌ Error consultando variantes:', variantsError);
      return;
    }

    console.log(`🎨 Encontradas ${variants.length} variantes con imágenes`);

    let updated = 0;
    let skipped = 0;

    for (const variant of variants) {
      const categoryName = variant.products.categories.name;
      const productName = variant.products.name;
      const variantName = variant.name || variant.variant_name;
      
      const bucketCategory = categoryMapping[categoryName];
      const bucketProduct = productMapping[productName];
      
      if (bucketCategory && bucketProduct && variantName) {
        const newUrl = `https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images/${bucketCategory}/${bucketProduct}/${variantName}.jpg`;
        
        // Actualizar en base de datos
        const { error: updateError } = await supabase
          .from('product_variants')
          .update({ image_url: newUrl })
          .eq('id', variant.id);

        if (updateError) {
          console.log(`   ❌ Error actualizando ${productName} > ${variantName}: ${updateError.message}`);
        } else {
          console.log(`   ✅ ${categoryName} > ${productName} > ${variantName}`);
          updated++;
        }
      } else {
        console.log(`   ⚠️ Sin mapeo: ${categoryName} > ${productName} > ${variantName || 'sin nombre'}`);
        skipped++;
      }
    }

    console.log(`\n📊 Variantes: ${updated} actualizadas, ${skipped} sin mapeo`);

  } catch (error) {
    console.error('❌ Error general actualizando variantes:', error);
  }
}

async function verifyUrls() {
  console.log('\n🔍 VERIFICANDO URLs ACTUALIZADAS');
  console.log('=================================\n');

  try {
    // Verificar algunas URLs de productos
    const { data: sampleProducts } = await supabase
      .from('products')
      .select('name, main_image_url')
      .not('main_image_url', 'is', null)
      .limit(5);

    console.log('📦 MUESTRA DE URLs DE PRODUCTOS:');
    sampleProducts?.forEach(product => {
      console.log(`   ${product.name}`);
      console.log(`   ${product.main_image_url}\n`);
    });

    // Verificar algunas URLs de variantes
    const { data: sampleVariants } = await supabase
      .from('product_variants')
      .select(`
        name,
        image_url,
        products!inner(name)
      `)
      .not('image_url', 'is', null)
      .limit(5);

    console.log('🎨 MUESTRA DE URLs DE VARIANTES:');
    sampleVariants?.forEach(variant => {
      console.log(`   ${variant.products.name} > ${variant.name}`);
      console.log(`   ${variant.image_url}\n`);
    });

  } catch (error) {
    console.error('❌ Error verificando URLs:', error);
  }
}

async function executeUpdate() {
  console.log('🚀 ACTUALIZACIÓN MASIVA DE URLs A NUEVA ESTRUCTURA');
  console.log('===================================================\n');

  await updateProductUrls();
  await updateVariantUrls();
  await verifyUrls();

  console.log('✅ ACTUALIZACIÓN COMPLETADA');
}

executeUpdate();

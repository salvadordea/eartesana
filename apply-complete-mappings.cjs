const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mapeo completo de DB → Bucket (incluyendo los que ya funcionaban + los nuevos)
const COMPLETE_PRODUCT_MAPPING = {
  // ✅ Mapeos que ya funcionaban
  'Arete Piel Balancín Oval': 'Arete Piel Balancin Oval',
  'Arete Piel Gota': 'Arete Piel Gota', 
  'Arete Piel Péndulo': 'Arete Piel Pendulo',
  'Brazalete Piel Pelo': 'Brazalete Piel Pelo',
  'Brazalete Liso': 'Brazalete Liso',
  'Brazalete Hombre': 'Brazalete Hombre',
  'Brazalete dos Lineas': 'Brazalete dos Lineas',
  'Brazalete lineas Delgadas': 'Brazalete lineas Delgadas',

  // ✅ Mapeos automáticos encontrados (coincidencias 100%)
  'Bolsa grande con Jareta': 'Bolsa grande con Jareta',
  'Bolsas Gigante Plana': 'Bolsas Gigante Plana',
  'Bolsa Gigante horizontal': 'Bolsa Gigante horizontal',
  'Portacel Pelo': 'Portacel Pelo',
  'Bolsa Gigante Vertical': 'Bolsa Gigante Vertical',
  'Bolsa Gigante vertical Pelo y Miel': 'Bolsa Gigante vertical Pelo y Miel',
  'Backpack Mini': 'Backpack Mini',
  'Portacel grande': 'Portacel grande',
  'Arete Geométrico Gigante': 'Arete Geometrico Gigante',
  'Bolsa de Playa Gigante': 'Bolsa de Playa Gigante',
  'Cartera tipo Sobre': 'Cartera tipo Sobre',
  'Tarjetero Boton': 'Tarjetero Boton',
  'Botelleras': 'Botelleras',
  'Arete Piel Poligono Chico': 'Arete Piel Poligono Chico',
  'Portavasos': 'Portavasos',
  'Clutch Grande con strap': 'Clutch Grande con strap',
  'Cartera Liga': 'Cartera Liga',
  'Bolsa botón madera': 'Bolsa boton madera',
  'Portacel Piel Textil': 'Portacel Piel Textil',
  'Portacable Chico': 'Portacable Chico',
  'Bolsa de Playa mediana': 'Bolsa de Playa mediana',
  'Bolsa Ovalada lisa': 'Bolsa Ovalada lisa',
  'Bolsa Mediana con bolsillo piel al frente': 'Bolsa Mediana con bolsillo piel al frente',
  'Bolsa Telar de pedal cruzada': 'Bolsa Telar de pedal cruzada',
  'Clutch Chica con Base': 'Clutch Chica con Base',
  'Clutch Chica Plana': 'Clutch Chica Plana',
  'Cartera con Costura': 'Cartera con Costura',
  'Cangurera': 'Cangurera',
  'Portacel Piel liso': 'Portacel Piel liso',
  'Bolsa Cilindro Jareta': 'Bolsa Cilindro Jareta',
  'Monedero Clip': 'Monedero Clip',
  'Llavero Corto': 'Llavero Corto',
  'Portacables Grande': 'Portacables Grande',
  'Portapasaportes': 'Portapasaportes',
  'Monedero Cierre': 'Monedero Cierre',
  'Monedero Motita': 'Monedero Motita'
};

const CATEGORY_MAPPING = {
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

async function applyCompleteMappings() {
  console.log('🚀 APLICANDO MAPEOS COMPLETOS A LA BASE DE DATOS');
  console.log('================================================\n');

  try {
    // 1. Actualizar productos
    console.log('📦 ACTUALIZANDO PRODUCTOS...\n');

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

    let updatedProducts = 0;
    let skippedProducts = 0;

    for (const product of products) {
      const categoryName = product.categories.name;
      const productName = product.name;
      
      const bucketCategory = CATEGORY_MAPPING[categoryName];
      const bucketProduct = COMPLETE_PRODUCT_MAPPING[productName];
      
      if (bucketCategory && bucketProduct) {
        const newUrl = `https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images/${bucketCategory}/${bucketProduct}/principal.jpg`;
        
        // Solo actualizar si la URL actual no coincide con la nueva
        if (product.main_image_url !== newUrl) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ main_image_url: newUrl })
            .eq('id', product.id);

          if (updateError) {
            console.log(`   ❌ Error actualizando ${productName}: ${updateError.message}`);
          } else {
            console.log(`   ✅ ${categoryName} > ${productName}`);
            updatedProducts++;
          }
        } else {
          console.log(`   ✓ ${categoryName} > ${productName} (ya correcto)`);
        }
      } else {
        console.log(`   ⚠️ Sin mapeo: ${categoryName} > ${productName}`);
        
        // Para productos sin mapeo, usar placeholder
        const placeholderUrl = 'https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images/placeholder-product.jpg';
        if (product.main_image_url !== placeholderUrl && !product.main_image_url.includes('placeholder')) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ main_image_url: placeholderUrl })
            .eq('id', product.id);

          if (!updateError) {
            console.log(`   📷 ${productName} → placeholder`);
          }
        }
        skippedProducts++;
      }
    }

    console.log(`\n📊 Productos: ${updatedProducts} actualizados, ${skippedProducts} sin mapeo\n`);

    // 2. Actualizar variantes
    console.log('🎨 ACTUALIZANDO VARIANTES...\n');

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

    let updatedVariants = 0;
    let skippedVariants = 0;

    for (const variant of variants) {
      const categoryName = variant.products.categories.name;
      const productName = variant.products.name;
      const variantName = variant.name || variant.variant_name;
      
      const bucketCategory = CATEGORY_MAPPING[categoryName];
      const bucketProduct = COMPLETE_PRODUCT_MAPPING[productName];
      
      if (bucketCategory && bucketProduct && variantName) {
        const newUrl = `https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images/${bucketCategory}/${bucketProduct}/${variantName}.jpg`;
        
        // Solo actualizar si la URL actual no coincide con la nueva
        if (variant.image_url !== newUrl) {
          const { error: updateError } = await supabase
            .from('product_variants')
            .update({ image_url: newUrl })
            .eq('id', variant.id);

          if (updateError) {
            console.log(`   ❌ Error actualizando ${productName} > ${variantName}: ${updateError.message}`);
          } else {
            console.log(`   ✅ ${categoryName} > ${productName} > ${variantName}`);
            updatedVariants++;
          }
        } else {
          console.log(`   ✓ ${categoryName} > ${productName} > ${variantName} (ya correcto)`);
        }
      } else {
        console.log(`   ⚠️ Sin mapeo: ${categoryName} > ${productName} > ${variantName || 'sin nombre'}`);
        skippedVariants++;
      }
    }

    console.log(`\n📊 Variantes: ${updatedVariants} actualizadas, ${skippedVariants} sin mapeo\n`);

    // 3. Resumen final
    console.log('🎯 RESUMEN FINAL:');
    console.log('================');
    console.log(`✅ Total productos en mapeo: ${Object.keys(COMPLETE_PRODUCT_MAPPING).length}`);
    console.log(`✅ Productos actualizados: ${updatedProducts}`);
    console.log(`✅ Variantes actualizadas: ${updatedVariants}`);
    console.log(`⚠️ Productos sin mapeo: ${skippedProducts} (usarán placeholder)`);
    console.log(`⚠️ Variantes sin mapeo: ${skippedVariants}`);

    console.log('\n🎉 MAPEO COMPLETO APLICADO EXITOSAMENTE!');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

applyCompleteMappings();

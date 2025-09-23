const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mapeo actual que sabemos que funciona
const workingMapping = {
  // Joyeria
  'Arete Piel Balancín Oval': 'Arete Piel Balancin Oval',
  'Arete Piel Gota': 'Arete Piel Gota', 
  'Arete Piel Péndulo': 'Arete Piel Pendulo',
  'Brazalete Piel Pelo': 'Brazalete Piel Pelo',
  'Brazalete Liso': 'Brazalete Liso',
  'Brazalete Hombre': 'Brazalete Hombre',
  'Brazalete dos Lineas': 'Brazalete dos Lineas',
  'Brazalete lineas Delgadas': 'Brazalete lineas Delgadas'
};

async function getAllProductsFromBucket() {
  console.log('📂 OBTENIENDO TODOS LOS PRODUCTOS DEL BUCKET...\n');
  
  const bucketProducts = new Map(); // categoria -> [productos]
  
  const categories = [
    'Joyeria', 'Portacel', 'Bolsas Grandes', 'Bolsas Cruzadas', 
    'Bolsas de mano', 'Bolsas de Textil y Piel', 'Backpacks', 
    'Accesorios', 'Botelleras', 'Hogar'
  ];

  for (const category of categories) {
    try {
      const { data: products, error } = await supabase
        .storage
        .from('product-images')
        .list(category, { limit: 100 });

      if (error) {
        console.log(`⚠️ Error listando ${category}:`, error);
        continue;
      }

      const productFolders = products.filter(item => 
        item.name.endsWith('/') || !item.name.includes('.')
      ).map(item => item.name.replace('/', ''));

      bucketProducts.set(category, productFolders);
      console.log(`📁 ${category}: ${productFolders.length} productos`);
      productFolders.forEach(product => {
        console.log(`   - ${product}`);
      });
      console.log('');
    } catch (error) {
      console.log(`❌ Error procesando ${category}:`, error);
    }
  }

  return bucketProducts;
}

async function getUnmappedProductsFromDB() {
  console.log('🔍 OBTENIENDO PRODUCTOS SIN MAPEO DE LA BASE DE DATOS...\n');

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      main_image_url,
      categories!inner(name, slug)
    `)
    .not('main_image_url', 'is', null);

  if (error) {
    console.error('❌ Error consultando productos:', error);
    return [];
  }

  // Productos que usan placeholder o estructura antigua
  const unmappedProducts = products.filter(product => 
    product.main_image_url.includes('placeholder') || 
    !Object.hasOwnProperty.call(workingMapping, product.name)
  );

  console.log(`📊 Total productos en DB: ${products.length}`);
  console.log(`❓ Productos sin mapeo correcto: ${unmappedProducts.length}\n`);

  return unmappedProducts;
}

function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s]/g, '') // solo letras, números y espacios
    .trim();
}

function findSimilarProducts(dbProductName, bucketProducts) {
  const normalizedDB = normalizeString(dbProductName);
  const matches = [];

  for (const [category, products] of bucketProducts) {
    for (const bucketProduct of products) {
      const normalizedBucket = normalizeString(bucketProduct);
      
      // Coincidencia exacta después de normalizar
      if (normalizedDB === normalizedBucket) {
        matches.push({ category, product: bucketProduct, score: 100 });
        continue;
      }
      
      // Coincidencias parciales
      const dbWords = normalizedDB.split(/\s+/);
      const bucketWords = normalizedBucket.split(/\s+/);
      
      let commonWords = 0;
      for (const dbWord of dbWords) {
        if (bucketWords.some(bucketWord => 
          bucketWord.includes(dbWord) || dbWord.includes(bucketWord)
        )) {
          commonWords++;
        }
      }
      
      const score = (commonWords / Math.max(dbWords.length, bucketWords.length)) * 100;
      
      if (score > 50) { // Solo matches con al menos 50% similitud
        matches.push({ category, product: bucketProduct, score: Math.round(score) });
      }
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

async function reviewUnmappedProducts() {
  console.log('🔍 REVISIÓN DE PRODUCTOS SIN MAPEO');
  console.log('===================================\n');

  const bucketProducts = await getAllProductsFromBucket();
  const unmappedProducts = await getUnmappedProductsFromDB();

  console.log('🎯 ANÁLISIS DE PRODUCTOS SIN MAPEO:');
  console.log('===================================\n');

  const suggestedMappings = {};

  for (const product of unmappedProducts) {
    console.log(`📦 PRODUCTO: ${product.name}`);
    console.log(`   Categoría DB: ${product.categories.name}`);
    console.log(`   URL actual: ${product.main_image_url}`);
    
    const matches = findSimilarProducts(product.name, bucketProducts);
    
    if (matches.length > 0) {
      console.log('   🎯 Coincidencias posibles:');
      matches.slice(0, 3).forEach((match, index) => {
        console.log(`      ${index + 1}. ${match.category}/${match.product} (${match.score}% similar)`);
        if (index === 0 && match.score > 80) {
          suggestedMappings[product.name] = match.product;
        }
      });
    } else {
      console.log('   ❌ Sin coincidencias encontradas');
      
      // Mostrar productos disponibles en la categoría correspondiente
      const categoryProducts = bucketProducts.get(product.categories.name);
      if (categoryProducts && categoryProducts.length > 0) {
        console.log(`   📁 Productos disponibles en ${product.categories.name}:`);
        categoryProducts.forEach(prod => {
          console.log(`      - ${prod}`);
        });
      }
    }
    console.log('');
  }

  console.log('💡 MAPEOS SUGERIDOS AUTOMÁTICAMENTE:');
  console.log('====================================');
  Object.entries(suggestedMappings).forEach(([dbName, bucketName]) => {
    console.log(`'${dbName}': '${bucketName}',`);
  });

  console.log('\n📝 PRODUCTOS QUE NECESITAN MAPEO MANUAL:');
  console.log('=======================================');
  const needsManualMapping = unmappedProducts.filter(p => 
    !suggestedMappings[p.name]
  );
  
  needsManualMapping.forEach(product => {
    const categoryProducts = bucketProducts.get(product.categories.name) || [];
    console.log(`\n📦 ${product.name} (${product.categories.name})`);
    console.log(`   Opciones en bucket:`);
    categoryProducts.forEach(prod => {
      console.log(`   - ${prod}`);
    });
  });

  return { suggestedMappings, needsManualMapping, bucketProducts };
}

reviewUnmappedProducts();

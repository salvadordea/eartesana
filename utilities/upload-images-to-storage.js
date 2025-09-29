const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODkzNSwiZXhwIjoyMDczNTM0OTM1fQ.2Mz8WaiP-I3MWFjt1VxbbK2Kg2AlMqZaMpmrd9XZO8s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadImageToStorage(filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, fileBuffer, {
        contentType: getContentType(filePath),
        upsert: true
      });

    if (error) {
      console.log(`❌ Error subiendo ${fileName}:`, error.message);
      return false;
    }

    console.log(`✅ Subido: ${fileName}`);
    return true;
  } catch (err) {
    console.log(`❌ Error leyendo archivo ${filePath}:`, err.message);
    return false;
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'image/jpeg';
  }
}

async function createBucketIfNotExists() {
  try {
    // Verificar si el bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Error listando buckets:', listError.message);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'product-images');
    
    if (bucketExists) {
      console.log('✅ Bucket "product-images" ya existe');
      return true;
    }
    
    // Crear el bucket
    console.log('🪣 Creando bucket "product-images"...');
    const { data, error } = await supabase.storage.createBucket('product-images', {
      public: true
    });
    
    if (error) {
      console.log('❌ Error creando bucket:', error.message);
      return false;
    }
    
    console.log('✅ Bucket "product-images" creado exitosamente');
    return true;
    
  } catch (err) {
    console.log('❌ Error en createBucketIfNotExists:', err.message);
    return false;
  }
}

async function uploadPlaceholderImages() {
  console.log('ESTUDIO ARTESANA - SUBIDA DE IMÁGENES');
  console.log('====================================\n');
  
  // Crear bucket si no existe
  const bucketReady = await createBucketIfNotExists();
  if (!bucketReady) {
    console.log('❌ No se pudo preparar el bucket. Abortando.');
    return;
  }
  
  console.log('\n📸 Subiendo imágenes...');
  
  // Subir imagen placeholder principal
  const placeholderPath = './assets/images/placeholder-product.jpg';
  if (fs.existsSync(placeholderPath)) {
    await uploadImageToStorage(placeholderPath, 'placeholder-product.jpg');
  }
  
  // Subir imágenes de categorías
  const categoriesDir = './assets/images/categories';
  if (fs.existsSync(categoriesDir)) {
    console.log('\n📂 Subiendo imágenes de categorías...');
    const categoryFiles = fs.readdirSync(categoriesDir);
    
    for (const file of categoryFiles) {
      if (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.webp')) {
        const fullPath = path.join(categoriesDir, file);
        await uploadImageToStorage(fullPath, `categories/${file}`);
      }
    }
  }
  
  console.log('\n✅ Subida de imágenes completada!');
  console.log('\n📋 PRÓXIMOS PASOS:');
  console.log('1. Las imágenes están ahora disponibles en Supabase Storage');
  console.log('2. El placeholder se usará para productos sin imagen específica');
  console.log('3. Puedes subir imágenes de productos manualmente al bucket "product-images"');
  console.log('4. O usar el panel de Supabase: https://yrmfrfpyqctvwyhrhivl.supabase.co/project/default/storage/buckets/product-images');
}

uploadPlaceholderImages().catch(console.error);

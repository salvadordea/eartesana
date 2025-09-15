const fs = require('fs');
const path = require('path');

// Función para limpiar slugs
function createSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .replace(/\s+/g, '-') // Espacios por guiones
    .replace(/-+/g, '-') // Múltiples guiones por uno
    .trim('-'); // Quitar guiones al inicio/final
}

// Función para generar precio aleatorio si no existe
function generatePrice(basePrice) {
  if (basePrice && basePrice !== '' && !isNaN(parseFloat(basePrice))) {
    return parseFloat(basePrice);
  }
  // Si no hay precio, generar uno basado en el tipo de producto
  return Math.floor(Math.random() * (2000 - 300) + 300); // Entre $300 y $2000
}

async function convertBackupToNextjs() {
  console.log('🔄 CONVIRTIENDO BACKUP A FORMATO NEXT.JS');
  console.log('=====================================\n');

  // Rutas
  const backupDir = '../backup/backup-data';
  const outputDir = './src/data';

  // Crear directorio de datos
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Buscar carpeta de backup más reciente
  const backupFolders = fs.readdirSync(backupDir)
    .filter(folder => fs.statSync(path.join(backupDir, folder)).isDirectory())
    .sort()
    .reverse();

  if (backupFolders.length === 0) {
    throw new Error('❌ No se encontraron carpetas de backup');
  }

  const latestBackup = backupFolders[0];
  const backupPath = path.join(backupDir, latestBackup);
  
  console.log(`📂 Procesando backup: ${latestBackup}`);

  // Leer datos originales
  const categoriesFile = path.join(backupPath, 'categories', 'all-categories.json');
  const productsFile = path.join(backupPath, 'products', 'all-products.json');
  const imagesIndexFile = path.join(backupPath, 'images', 'image-index.json');

  if (!fs.existsSync(categoriesFile) || !fs.existsSync(productsFile)) {
    throw new Error('❌ Archivos de backup no encontrados');
  }

  const originalCategories = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
  const originalProducts = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
  
  let imageIndex = [];
  if (fs.existsSync(imagesIndexFile)) {
    imageIndex = JSON.parse(fs.readFileSync(imagesIndexFile, 'utf8'));
  }

  console.log(`📊 Procesando: ${originalProducts.length} productos, ${originalCategories.length} categorías\n`);

  // 1. CONVERTIR CATEGORÍAS
  console.log('📂 Procesando categorías...');
  const categories = originalCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: createSlug(cat.name),
    description: cat.description || '',
    count: cat.count || 0,
    image: null // TODO: Agregar imágenes de categorías si las hay
  }));

  // 2. CONVERTIR PRODUCTOS
  console.log('📦 Procesando productos...');
  const products = originalProducts.map(product => {
    // Encontrar imágenes del producto
    const productImages = imageIndex
      .filter(img => img.productId === product.id)
      .map(img => ({
        id: img.imageId,
        src: img.src,
        alt: product.name,
        localFileName: img.localFileName || null
      }));

    // Procesar variaciones
    const variations = [];
    if (product.type === 'variable' && product.attributes) {
      product.attributes.forEach(attr => {
        if (attr.name === 'Color' && attr.options) {
          attr.options.forEach((option, index) => {
            variations.push({
              id: `${product.id}-${index}`,
              name: option,
              price: generatePrice(product.price),
              stock: Math.floor(Math.random() * 10) + 1, // Stock aleatorio entre 1-10
              image: productImages[index] || productImages[0] || null
            });
          });
        }
      });
    }

    // Si no hay variaciones, crear una por defecto
    if (variations.length === 0) {
      variations.push({
        id: `${product.id}-0`,
        name: 'Estándar',
        price: generatePrice(product.price),
        stock: Math.floor(Math.random() * 10) + 1,
        image: productImages[0] || null
      });
    }

    return {
      id: product.id,
      name: product.name,
      slug: createSlug(product.name),
      description: product.description?.replace(/<[^>]*>/g, '') || '', // Quitar HTML
      shortDescription: product.short_description?.replace(/<[^>]*>/g, '') || '',
      price: generatePrice(product.price),
      type: product.type,
      categories: product.categories?.map(cat => cat.id) || [],
      images: productImages,
      variations: variations,
      attributes: product.attributes || [],
      featured: product.featured || false,
      status: product.status === 'publish' ? 'active' : 'inactive',
      createdAt: product.date_created || new Date().toISOString(),
      updatedAt: product.date_modified || new Date().toISOString()
    };
  });

  // 3. CREAR INVENTARIO INICIAL
  console.log('📊 Creando inventario inicial...');
  const inventory = {};
  products.forEach(product => {
    product.variations.forEach(variation => {
      inventory[variation.id] = variation.stock;
    });
  });

  // 4. CREAR CONFIGURACIÓN DE LA TIENDA
  const storeConfig = {
    name: 'Estudio Artesana',
    description: 'Productos artesanales únicos hechos a mano',
    currency: 'MXN',
    currencySymbol: '$',
    language: 'es',
    country: 'MX',
    contact: {
      email: 'contacto@estudioartesana.com',
      phone: '+52 1 234 567 8900',
      address: 'México'
    },
    social: {
      instagram: 'https://instagram.com/estudioartesana',
      facebook: 'https://facebook.com/estudioartesana'
    },
    shipping: {
      freeShippingMinimum: 500,
      shippingCost: 100
    },
    mercadoPago: {
      publicKey: process.env.MP_PUBLIC_KEY || '',
      accessToken: process.env.MP_ACCESS_TOKEN || ''
    }
  };

  // 5. GUARDAR ARCHIVOS
  console.log('💾 Guardando archivos...');
  
  const files = [
    { name: 'categories.json', data: categories, description: 'Categorías' },
    { name: 'products.json', data: products, description: 'Productos' },
    { name: 'inventory.json', data: inventory, description: 'Inventario' },
    { name: 'store-config.json', data: storeConfig, description: 'Configuración' }
  ];

  files.forEach(file => {
    const filePath = path.join(outputDir, file.name);
    fs.writeFileSync(filePath, JSON.stringify(file.data, null, 2));
    console.log(`✅ ${file.description}: ${filePath}`);
  });

  // 6. COPIAR IMÁGENES
  console.log('\n🖼️  Copiando imágenes...');
  const imagesSourceDir = path.join(backupPath, 'images');
  const imagesDestDir = path.join('./public', 'images', 'products');

  if (fs.existsSync(imagesSourceDir)) {
    // Crear directorio de destino
    if (!fs.existsSync(imagesDestDir)) {
      fs.mkdirSync(imagesDestDir, { recursive: true });
    }

    // Copiar imágenes
    const imageFiles = fs.readdirSync(imagesSourceDir)
      .filter(file => file.match(/\.(jpg|jpeg|png|webp)$/i));

    let copiedImages = 0;
    imageFiles.forEach(file => {
      const sourcePath = path.join(imagesSourceDir, file);
      const destPath = path.join(imagesDestDir, file);
      
      try {
        fs.copyFileSync(sourcePath, destPath);
        copiedImages++;
      } catch (error) {
        console.log(`⚠️  Error copiando ${file}: ${error.message}`);
      }
    });

    console.log(`📸 Imágenes copiadas: ${copiedImages}/${imageFiles.length}`);
  }

  // 7. CREAR ARCHIVO DE ESTADÍSTICAS
  const stats = {
    conversionDate: new Date().toISOString(),
    originalBackup: latestBackup,
    summary: {
      categories: categories.length,
      products: products.length,
      variations: products.reduce((sum, p) => sum + p.variations.length, 0),
      images: imageIndex.length
    }
  };

  fs.writeFileSync(
    path.join(outputDir, 'conversion-stats.json'), 
    JSON.stringify(stats, null, 2)
  );

  console.log('\n🎉 CONVERSIÓN COMPLETADA');
  console.log('=======================');
  console.log(`📂 Categorías: ${categories.length}`);
  console.log(`📦 Productos: ${products.length}`);
  console.log(`🎨 Variaciones: ${stats.summary.variations}`);
  console.log(`🖼️  Imágenes: ${stats.summary.images}`);
  console.log(`📁 Datos guardados en: ${outputDir}`);

  return stats;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  convertBackupToNextjs()
    .then(() => {
      console.log('\n🚀 ¡Listo! Tu tienda está preparada para Next.js');
      console.log('Próximo paso: npm run dev');
    })
    .catch(error => {
      console.error('\n❌ Error en la conversión:', error.message);
      process.exit(1);
    });
}

module.exports = { convertBackupToNextjs };

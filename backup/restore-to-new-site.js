const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// CONFIGURACIÓN DEL SITIO NUEVO
// ⚠️  IMPORTANTE: Debes actualizar estas credenciales después de configurar WooCommerce
const NEW_SITE_CONFIG = {
  url: 'https://new.estudioartesana.com/backend',
  consumerKey: '', // ⚠️  PENDIENTE: Obtener de WooCommerce > Configuración > Avanzado > REST API
  consumerSecret: '', // ⚠️  PENDIENTE: Obtener de WooCommerce > Configuración > Avanzado > REST API
  version: 'wc/v3'
};

// Función para crear API client cuando tengamos las credenciales
function createApiClient() {
  if (!NEW_SITE_CONFIG.consumerKey || !NEW_SITE_CONFIG.consumerSecret) {
    throw new Error('⚠️  Credenciales de API no configuradas. Ve al paso 3 del plan de migración.');
  }
  
  return new WooCommerceRestApi(NEW_SITE_CONFIG);
}

// Función para subir una imagen al nuevo sitio
async function uploadImageToNewSite(imagePath, fileName) {
  // Esta función se implementará cuando tengamos acceso al servidor
  console.log(`📸 Preparando subida de imagen: ${fileName}`);
  
  // Por ahora, solo validamos que el archivo existe
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Imagen no encontrada: ${imagePath}`);
  }
  
  // TODO: Implementar subida real via FTP/SFTP o API de WordPress
  return {
    id: Date.now(), // Temporal
    src: `https://new.estudioartesana.com/backend/wp-content/uploads/${fileName}`,
    name: fileName
  };
}

// Función para crear categorías
async function createCategories(wcApi, categories) {
  console.log('\\n📂 CREANDO CATEGORÍAS...');
  console.log('========================');
  
  const createdCategories = [];
  
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    
    try {
      console.log(`⬇️  [${i + 1}/${categories.length}] ${category.name}`);
      
      const categoryData = {
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        parent: 0, // Por ahora, todas las categorías como principales
        display: 'default',
        image: null // TODO: Agregar imágenes de categorías si las hay
      };
      
      const response = await wcApi.post('products/categories', categoryData);
      
      createdCategories.push({
        originalId: category.id,
        newId: response.data.id,
        name: category.name,
        slug: category.slug
      });
      
      console.log(`   ✅ Creada: ID ${response.data.id}`);
      
      // Pausa para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`   ❌ Error creando categoría ${category.name}:`, error.response?.data?.message || error.message);
    }
  }
  
  console.log(`\\n📊 Categorías creadas: ${createdCategories.length}/${categories.length}`);
  return createdCategories;
}

// Función para crear productos
async function createProducts(wcApi, products, categoryMapping, imagesDir) {
  console.log('\\n📦 CREANDO PRODUCTOS...');
  console.log('=========================');
  
  const createdProducts = [];
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    try {
      console.log(`⬇️  [${i + 1}/${products.length}] ${product.name}`);
      console.log(`   💰 Precio: $${product.price}`);
      console.log(`   🎨 Tipo: ${product.type}`);
      
      // Mapear categorías al nuevo sitio
      const newCategories = product.categories.map(cat => {
        const mapping = categoryMapping.find(m => m.originalId === cat.id);
        return mapping ? { id: mapping.newId } : null;
      }).filter(Boolean);
      
      // Procesar imágenes
      const productImages = [];
      if (product.images && product.images.length > 0) {
        console.log(`   📸 Procesando ${product.images.length} imágenes...`);
        // TODO: Implementar subida de imágenes
      }
      
      // Preparar datos del producto
      const productData = {
        name: product.name,
        type: product.type,
        regular_price: product.regular_price || product.price,
        description: product.description,
        short_description: product.short_description,
        categories: newCategories,
        images: productImages,
        attributes: product.attributes || [],
        status: 'publish',
        manage_stock: product.manage_stock,
        stock_quantity: product.stock_quantity,
        weight: product.weight,
        dimensions: product.dimensions
      };
      
      // Si es un producto variable, agregar configuraciones especiales
      if (product.type === 'variable') {
        console.log(`   🎨 Producto variable con ${product.variations?.length || 0} variaciones`);
        // Las variaciones se crearán en una segunda pasada
      }
      
      const response = await wcApi.post('products', productData);
      
      createdProducts.push({
        originalId: product.id,
        newId: response.data.id,
        name: product.name,
        type: product.type,
        originalVariations: product.variations || []
      });
      
      console.log(`   ✅ Creado: ID ${response.data.id}`);
      
      // Pausa para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`   ❌ Error creando producto ${product.name}:`, error.response?.data?.message || error.message);
    }
  }
  
  console.log(`\\n📊 Productos creados: ${createdProducts.length}/${products.length}`);
  return createdProducts;
}

// Función principal de restauración
async function restoreToNewSite() {
  console.log('🚀 INICIANDO MIGRACIÓN A NEW.ESTUDIOARTESANA.COM');
  console.log('=================================================\\n');
  
  try {
    // Verificar que tenemos las credenciales
    console.log('🔍 Verificando configuración...');
    const wcApi = createApiClient();
    console.log('✅ Cliente API configurado correctamente\\n');
    
    // Buscar backup más reciente
    const backupDataDir = './backup-data';
    const backupFolders = fs.readdirSync(backupDataDir)
      .filter(folder => fs.statSync(path.join(backupDataDir, folder)).isDirectory())
      .sort()
      .reverse();
    
    if (backupFolders.length === 0) {
      throw new Error('❌ No se encontraron backups para restaurar');
    }
    
    const latestBackup = backupFolders[0];
    const backupDir = path.join(backupDataDir, latestBackup);
    
    console.log(`📂 Usando backup: ${latestBackup}`);
    console.log(`📁 Ruta: ${backupDir}\\n`);
    
    // Cargar datos del backup
    const categoriesFile = path.join(backupDir, 'categories', 'all-categories.json');
    const productsFile = path.join(backupDir, 'products', 'all-products.json');
    const imagesDir = path.join(backupDir, 'images');
    
    if (!fs.existsSync(categoriesFile) || !fs.existsSync(productsFile)) {
      throw new Error('❌ Archivos de backup no encontrados');
    }
    
    const categories = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
    const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
    
    console.log(`📊 DATOS A MIGRAR:`);
    console.log(`   📂 Categorías: ${categories.length}`);
    console.log(`   📦 Productos: ${products.length}`);
    console.log(`   🎨 Productos con variaciones: ${products.filter(p => p.type === 'variable').length}`);
    console.log(`   🖼️  Imágenes: ${fs.existsSync(imagesDir) ? fs.readdirSync(imagesDir).length : 0}\\n`);
    
    // Confirmar antes de proceder
    console.log('⚠️  ¿Estás listo para proceder con la migración?');
    console.log('   Este proceso creará productos y categorías en new.estudioartesana.com');
    console.log('   Presiona Ctrl+C para cancelar o continúa...\\n');
    
    // Esperar 3 segundos
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Comenzar migración
    const startTime = Date.now();
    
    // 1. Crear categorías
    const categoryMapping = await createCategories(wcApi, categories);
    
    // 2. Crear productos
    const productMapping = await createProducts(wcApi, products, categoryMapping, imagesDir);
    
    // 3. TODO: Crear variaciones para productos variables
    // 4. TODO: Subir imágenes
    // 5. TODO: Configurar opciones de WooCommerce
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\\n🎉 MIGRACIÓN COMPLETADA');
    console.log('=======================');
    console.log(`⏱️  Tiempo total: ${duration} segundos`);
    console.log(`📂 Categorías migradas: ${categoryMapping.length}`);
    console.log(`📦 Productos migrados: ${productMapping.length}`);
    console.log('\\n🌍 Tu nueva tienda está disponible en:');
    console.log('   https://new.estudioartesana.com/backend/wp-admin/');
    console.log('\\n📋 PRÓXIMOS PASOS:');
    console.log('   1. Verificar productos en el admin de WordPress');
    console.log('   2. Subir imágenes restantes');
    console.log('   3. Configurar el frontend');
    console.log('   4. Probar la funcionalidad completa');
    
  } catch (error) {
    console.error('\\n❌ ERROR EN LA MIGRACIÓN:', error.message);
    console.log('\\n💡 SOLUCIONES:');
    console.log('   1. Verifica que WooCommerce esté instalado y activo');
    console.log('   2. Configura las credenciales de API correctas');
    console.log('   3. Revisa los permisos del servidor');
  }
}

// Script de verificación previa
async function checkPrerequisites() {
  console.log('🔍 VERIFICANDO PREREQUISITOS PARA MIGRACIÓN');
  console.log('===========================================\\n');
  
  const checks = [
    {
      name: 'Backup de datos disponible',
      check: () => {
        const backupDataDir = './backup-data';
        return fs.existsSync(backupDataDir) && fs.readdirSync(backupDataDir).length > 0;
      }
    },
    {
      name: 'Imágenes descargadas',
      check: () => {
        const backupFolders = fs.readdirSync('./backup-data')
          .filter(folder => fs.statSync(path.join('./backup-data', folder)).isDirectory())
          .sort().reverse();
        
        if (backupFolders.length === 0) return false;
        
        const imagesDir = path.join('./backup-data', backupFolders[0], 'images');
        return fs.existsSync(imagesDir) && fs.readdirSync(imagesDir).length > 0;
      }
    },
    {
      name: 'Sitio nuevo accesible',
      check: async () => {
        try {
          const response = await fetch('https://new.estudioartesana.com/backend/');
          return response.status === 200;
        } catch {
          return false;
        }
      }
    },
    {
      name: 'Credenciales de API configuradas',
      check: () => {
        return NEW_SITE_CONFIG.consumerKey && NEW_SITE_CONFIG.consumerSecret;
      }
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const result = await check.check();
      console.log(`${result ? '✅' : '❌'} ${check.name}`);
      if (!result) allPassed = false;
    } catch (error) {
      console.log(`❌ ${check.name} (Error: ${error.message})`);
      allPassed = false;
    }
  }
  
  console.log(`\\n${allPassed ? '🎉' : '⚠️'} ${allPassed ? 'TODO LISTO' : 'CONFIGURACIÓN PENDIENTE'}`);
  
  if (!allPassed) {
    console.log('\\n📋 PASOS PENDIENTES:');
    console.log('   1. Instala y activa WooCommerce en new.estudioartesana.com/backend');
    console.log('   2. Crea credenciales de API en WooCommerce > Configuración > Avanzado > REST API');
    console.log('   3. Actualiza las credenciales en este script');
  }
  
  return allPassed;
}

// Exportar funciones
module.exports = {
  restoreToNewSite,
  checkPrerequisites,
  NEW_SITE_CONFIG
};

// Ejecutar verificación si se ejecuta directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--check')) {
    checkPrerequisites();
  } else if (args.includes('--migrate')) {
    restoreToNewSite();
  } else {
    console.log('🚀 SCRIPT DE MIGRACIÓN A NEW.ESTUDIOARTESANA.COM');
    console.log('===============================================');
    console.log('');
    console.log('Opciones disponibles:');
    console.log('  --check    Verificar prerequisitos');
    console.log('  --migrate  Ejecutar migración completa');
    console.log('');
    console.log('Ejemplo de uso:');
    console.log('  node restore-to-new-site.js --check');
    console.log('  node restore-to-new-site.js --migrate');
  }
}

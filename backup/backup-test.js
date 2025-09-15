/**
 * Test de Conexión WooCommerce
 * Prueba la conectividad antes del backup completo
 */

const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

const config = {
  url: 'https://estudioartesana.com',
  consumerKey: 'ck_80b6b30ea578209890fd8725ab30cc53402185bc',
  consumerSecret: 'cs_b8a197caa4c8f71a9aa351ef867ee4b147f525a5',
  version: 'wc/v3',
  queryStringAuth: true
};

async function testConnection() {
  console.log('🔍 PROBANDO CONEXIÓN WOOCOMMERCE...\n');
  console.log(`🌍 URL: ${config.url}`);
  console.log(`🔑 Consumer Key: ${config.consumerKey.substring(0, 10)}...`);
  
  const api = new WooCommerceRestApi(config);
  
  const tests = [
    {
      name: 'Conectividad básica',
      endpoint: '',
      expected: 'Acceso al API'
    },
    {
      name: 'Productos (muestra)',
      endpoint: 'products',
      params: { per_page: 3 },
      expected: 'Al menos 1 producto'
    },
    {
      name: 'Categorías',
      endpoint: 'products/categories',
      params: { per_page: 5 },
      expected: 'Lista de categorías'
    },
    {
      name: 'Configuración general',
      endpoint: 'settings',
      expected: 'Configuraciones de WooCommerce'
    }
  ];
  
  let successCount = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 Probando: ${test.name}...`);
      
      const startTime = Date.now();
      const response = await api.get(test.endpoint, test.params || {});
      const duration = Date.now() - startTime;
      
      if (response.data) {
        console.log(`✅ ${test.name}: OK (${duration}ms)`);
        
        // Información adicional según el endpoint
        if (test.endpoint === 'products' && Array.isArray(response.data)) {
          console.log(`   📦 ${response.data.length} productos encontrados`);
          if (response.data[0]) {
            console.log(`   📝 Ejemplo: "${response.data[0].name}"`);
          }
        }
        
        if (test.endpoint === 'products/categories' && Array.isArray(response.data)) {
          console.log(`   📂 ${response.data.length} categorías encontradas`);
          const withProducts = response.data.filter(cat => cat.count > 0);
          console.log(`   📊 ${withProducts.length} categorías con productos`);
        }
        
        if (test.endpoint === 'settings' && Array.isArray(response.data)) {
          console.log(`   ⚙️ ${response.data.length} grupos de configuración`);
        }
        
        successCount++;
      } else {
        console.log(`⚠️ ${test.name}: Respuesta vacía`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR`);
      console.log(`   💬 ${error.message}`);
      
      if (error.response) {
        console.log(`   📊 Status: ${error.response.status}`);
        console.log(`   📝 Status Text: ${error.response.statusText}`);
      }
    }
  }
  
  console.log('\n📊 RESUMEN DEL TEST:');
  console.log('==================');
  console.log(`✅ Exitosos: ${successCount}/${tests.length}`);
  console.log(`❌ Fallidos: ${tests.length - successCount}/${tests.length}`);
  
  if (successCount === tests.length) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
    console.log('✅ Listo para ejecutar backup completo');
    console.log('\n📝 Para ejecutar el backup completo:');
    console.log('   npm run backup');
  } else {
    console.log('\n⚠️  ALGUNOS TESTS FALLARON');
    console.log('🔧 Revisa la configuración antes de continuar');
    console.log('\n📋 Posibles soluciones:');
    console.log('1. Verificar credenciales en woocommerce-backup.js');
    console.log('2. Verificar que WooCommerce esté activo');
    console.log('3. Verificar permisos de API (Lectura mínimo)');
    console.log('4. Verificar que el sitio esté accesible');
  }
}

// Función de estimación de tiempo
async function estimateBackupTime() {
  console.log('\n⏱️  ESTIMANDO TIEMPO DE BACKUP...');
  
  const api = new WooCommerceRestApi(config);
  
  try {
    // Obtener conteos aproximados
    const productsResponse = await api.get('products', { per_page: 1 });
    const categoriesResponse = await api.get('products/categories', { per_page: 1 });
    
    const totalProducts = parseInt(productsResponse.headers['x-wp-total']) || 0;
    const totalCategories = parseInt(categoriesResponse.headers['x-wp-total']) || 0;
    
    // Estimación basada en 100 productos/minuto
    const estimatedMinutes = Math.ceil(totalProducts / 100) + 1;
    
    console.log(`📦 Productos estimados: ${totalProducts}`);
    console.log(`📂 Categorías estimadas: ${totalCategories}`);
    console.log(`⏱️  Tiempo estimado: ~${estimatedMinutes} minutos`);
    
    return { totalProducts, totalCategories, estimatedMinutes };
    
  } catch (error) {
    console.log('⚠️  No se pudo estimar el tiempo');
    return null;
  }
}

// Ejecutar tests
async function main() {
  await testConnection();
  await estimateBackupTime();
}

if (require.main === module) {
  main().catch(console.error);
}

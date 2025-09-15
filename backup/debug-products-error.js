/**
 * Diagnóstico específico para error 400 en productos
 * Investiga paso a paso el problema del endpoint /products
 */

const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

const config = {
  url: 'https://estudioartesana.com',
  consumerKey: 'ck_80b6b30ea578209890fd8725ab30cc53402185bc',
  consumerSecret: 'cs_b8a197caa4c8f71a9aa351ef867ee4b147f525a5',
  version: 'wc/v3',
  queryStringAuth: true
};

async function debugProductsError() {
  console.log('🔍 DIAGNÓSTICO ESPECÍFICO - ERROR 400 EN PRODUCTOS\n');
  console.log(`🌍 URL: ${config.url}`);
  console.log(`🔑 Consumer Key: ${config.consumerKey.substring(0, 15)}...`);
  console.log(`🔐 Consumer Secret: ${config.consumerSecret.substring(0, 15)}...\n`);
  
  const api = new WooCommerceRestApi(config);
  
  // Test 1: Endpoint básico sin parámetros
  console.log('📝 TEST 1: Endpoint básico /products');
  try {
    const response1 = await api.get('products');
    console.log('✅ Test 1 EXITOSO');
    console.log(`   📦 Productos encontrados: ${response1.data.length}`);
    console.log(`   📊 Status: ${response1.status}`);
    console.log(`   📋 Headers disponibles:`, Object.keys(response1.headers));
    
    if (response1.data.length > 0) {
      console.log(`   📝 Primer producto: "${response1.data[0].name}"`);
    }
  } catch (error) {
    console.log('❌ Test 1 FALLÓ');
    console.log(`   💬 Error: ${error.message}`);
    console.log(`   📊 Status: ${error.response?.status}`);
    console.log(`   📝 Status Text: ${error.response?.statusText}`);
    console.log(`   📋 Response Headers:`, error.response?.headers);
    console.log(`   📄 Response Data:`, error.response?.data);
  }
  
  // Test 2: Con parámetros básicos (como en backup-test.js que funcionó)
  console.log('\n📝 TEST 2: Con per_page=3 (mismo que test exitoso)');
  try {
    const response2 = await api.get('products', { per_page: 3 });
    console.log('✅ Test 2 EXITOSO');
    console.log(`   📦 Productos encontrados: ${response2.data.length}`);
  } catch (error) {
    console.log('❌ Test 2 FALLÓ');
    console.log(`   💬 Error: ${error.message}`);
    console.log(`   📊 Status: ${error.response?.status}`);
  }
  
  // Test 3: Con parámetros del backup (que falló)
  console.log('\n📝 TEST 3: Con parámetros del backup (status=any, type=any)');
  try {
    const response3 = await api.get('products', { 
      status: 'any',
      type: 'any',
      page: 1,
      per_page: 100
    });
    console.log('✅ Test 3 EXITOSO');
    console.log(`   📦 Productos encontrados: ${response3.data.length}`);
  } catch (error) {
    console.log('❌ Test 3 FALLÓ - ESTE ES EL PROBLEMA');
    console.log(`   💬 Error: ${error.message}`);
    console.log(`   📊 Status: ${error.response?.status}`);
    console.log(`   📋 Error data:`, JSON.stringify(error.response?.data, null, 2));
  }
  
  // Test 4: Probar parámetros individuales para identificar el culpable
  console.log('\n📝 TEST 4: Probando parámetros individuales...');
  
  const paramTests = [
    { name: 'solo status=any', params: { status: 'any' } },
    { name: 'solo type=any', params: { type: 'any' } },
    { name: 'solo per_page=100', params: { per_page: 100 } },
    { name: 'status=publish', params: { status: 'publish' } },
    { name: 'status=draft', params: { status: 'draft' } },
    { name: 'type=simple', params: { type: 'simple' } },
    { name: 'type=variable', params: { type: 'variable' } }
  ];
  
  for (const test of paramTests) {
    try {
      console.log(`   🧪 Probando: ${test.name}`);
      const response = await api.get('products', test.params);
      console.log(`   ✅ ${test.name}: OK (${response.data.length} productos)`);
    } catch (error) {
      console.log(`   ❌ ${test.name}: FALLA - ${error.response?.status}`);
    }
  }
  
  // Test 5: Verificar versión de WooCommerce
  console.log('\n📝 TEST 5: Verificando versión de WooCommerce');
  try {
    const systemStatus = await api.get('system_status');
    const wooVersion = systemStatus.data?.environment?.version;
    console.log(`   ✅ WooCommerce versión: ${wooVersion}`);
    
    // Verificar si hay plugins que puedan interferir
    const activePlugins = systemStatus.data?.active_plugins;
    if (activePlugins) {
      console.log(`   📋 Plugins activos: ${activePlugins.length}`);
      // Buscar plugins relacionados con seguridad/API
      const securityPlugins = activePlugins.filter(plugin => 
        plugin.name.toLowerCase().includes('security') ||
        plugin.name.toLowerCase().includes('firewall') ||
        plugin.name.toLowerCase().includes('api')
      );
      if (securityPlugins.length > 0) {
        console.log(`   ⚠️ Plugins de seguridad que podrían interferir:`);
        securityPlugins.forEach(plugin => console.log(`      - ${plugin.name}`));
      }
    }
  } catch (error) {
    console.log('   ⚠️ No se pudo obtener system_status');
  }
  
  // Test 6: Probar endpoint alternativo
  console.log('\n📝 TEST 6: Probando endpoints alternativos');
  
  const alternativeTests = [
    { name: 'products con filtro específico', endpoint: 'products', params: { featured: true } },
    { name: 'products con fecha', endpoint: 'products', params: { after: '2024-01-01T00:00:00' } },
    { name: 'products/attributes', endpoint: 'products/attributes' },
    { name: 'products/tags', endpoint: 'products/tags' }
  ];
  
  for (const test of alternativeTests) {
    try {
      console.log(`   🧪 Probando: ${test.name}`);
      const response = await api.get(test.endpoint, test.params || {});
      console.log(`   ✅ ${test.name}: OK (${response.data?.length || 'N/A'} registros)`);
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.response?.status} - ${error.message}`);
    }
  }
  
  // Test 7: Probar con autenticación diferente
  console.log('\n📝 TEST 7: Probando configuraciones de autenticación');
  
  // Configuración sin queryStringAuth
  const altConfig = {
    ...config,
    queryStringAuth: false
  };
  
  const altApi = new WooCommerceRestApi(altConfig);
  
  try {
    console.log('   🧪 Probando sin queryStringAuth');
    const response = await altApi.get('products', { per_page: 3 });
    console.log('   ✅ Sin queryStringAuth: OK');
  } catch (error) {
    console.log(`   ❌ Sin queryStringAuth: ${error.response?.status}`);
  }
}

// Test 8: Generar recomendaciones
function generateRecommendations() {
  console.log('\n📋 RECOMENDACIONES BASADAS EN DIAGNÓSTICO:');
  console.log('=====================================');
  console.log('');
  console.log('1. 🔍 Si el error persiste con status=any:');
  console.log('   - Cambiar a status=publish en woocommerce-backup.js');
  console.log('   - Remover parámetro type=any');
  console.log('');
  console.log('2. 🔐 Si hay problema de permisos:');
  console.log('   - Verificar permisos de API en WordPress admin');
  console.log('   - Regenerar claves con permisos "Read/Write"');
  console.log('');
  console.log('3. 🛡️ Si hay plugins de seguridad:');
  console.log('   - Temporalmente desactivar plugins de seguridad');
  console.log('   - Añadir excepción para API REST en firewall');
  console.log('');
  console.log('4. 📊 Si per_page=100 causa problemas:');
  console.log('   - Reducir a per_page=20 o per_page=50');
  console.log('   - Implementar paginación más pequeña');
  console.log('');
  console.log('5. 🔄 Próximo paso sugerido:');
  console.log('   - Modificar woocommerce-backup.js con los parámetros que funcionan');
  console.log('   - Re-ejecutar backup completo');
}

// Ejecutar diagnóstico
async function main() {
  try {
    await debugProductsError();
    generateRecommendations();
  } catch (error) {
    console.error('\n💥 ERROR CRÍTICO EN DIAGNÓSTICO:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

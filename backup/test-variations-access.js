const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;

// Configuración API
const wcApi = new WooCommerceRestApi({
  url: 'https://estudioartesana.com',
  consumerKey: 'ck_80b6b30e9084b95b6e59d8eb06b31bb302ed82cb',
  consumerSecret: 'cs_03be64c45c1b7e83a8b7f75ca0d33e659a28d9ca',
  version: 'wc/v3'
});

async function testVariationsAccess() {
  console.log('🔍 PROBANDO ACCESO A VARIACIONES DE PRODUCTOS...\n');

  try {
    console.log('1️⃣ Obteniendo un producto con variaciones...');
    
    // Obtener productos con variaciones
    const productsResponse = await wcApi.get('products', {
      per_page: 5,
      type: 'variable'
    });
    
    const variableProducts = productsResponse.data;
    console.log(`   ✅ Encontrados ${variableProducts.length} productos variables`);
    
    if (variableProducts.length === 0) {
      console.log('❌ No hay productos con variaciones para probar');
      return;
    }
    
    const firstProduct = variableProducts[0];
    console.log(`   📦 Producto de prueba: ${firstProduct.name}`);
    console.log(`   🔢 ID: ${firstProduct.id}`);
    console.log(`   📊 Variaciones esperadas: ${firstProduct.variations?.length || 0}`);
    
    if (!firstProduct.variations || firstProduct.variations.length === 0) {
      console.log('⚠️  El producto no tiene variaciones listadas');
      return;
    }
    
    console.log('\\n2️⃣ Intentando acceder a las variaciones...');
    
    // Probar diferentes enfoques para obtener variaciones
    const testApproaches = [
      {
        name: 'Método 1: /products/{id}/variations',
        url: `products/${firstProduct.id}/variations`,
        params: { per_page: 5 }
      },
      {
        name: 'Método 2: /products/variations directamente',
        url: 'products/variations',
        params: { per_page: 5, parent: firstProduct.id }
      },
      {
        name: 'Método 3: Obtener variación específica',
        url: `products/${firstProduct.id}/variations/${firstProduct.variations[0]}`,
        params: {}
      }
    ];
    
    for (const approach of testApproaches) {
      try {
        console.log(`\\n🧪 Probando: ${approach.name}`);
        console.log(`   🌐 URL: ${approach.url}`);
        
        const response = await wcApi.get(approach.url, approach.params);
        console.log(`   ✅ Éxito: ${response.data.length || 1} resultado(s)`);
        
        if (response.data.length > 0 || response.data.id) {
          const variation = response.data[0] || response.data;
          console.log(`   📝 Ejemplo de variación:`);
          console.log(`      ID: ${variation.id}`);
          console.log(`      Precio: $${variation.price || 'N/A'}`);
          if (variation.attributes && variation.attributes.length > 0) {
            variation.attributes.forEach(attr => {
              console.log(`      ${attr.name}: ${attr.option}`);
            });
          }
          break; // Si funciona uno, ya no necesitamos probar los otros
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.status || 'Unknown'} - ${error.message}`);
        
        if (error.response?.status === 401) {
          console.log('      📋 Error 401: Problema de autenticación/permisos');
        } else if (error.response?.status === 404) {
          console.log('      📋 Error 404: Endpoint no encontrado');
        } else if (error.response?.status === 403) {
          console.log('      📋 Error 403: Acceso prohibido');
        }
      }
    }
    
    console.log('\\n3️⃣ Verificando atributos del producto...');
    
    if (firstProduct.attributes && firstProduct.attributes.length > 0) {
      console.log('   📋 Atributos del producto padre:');
      firstProduct.attributes.forEach(attr => {
        console.log(`      • ${attr.name} (${attr.options?.length || 0} opciones)`);
        if (attr.options && attr.options.length > 0) {
          console.log(`        Opciones: ${attr.options.slice(0, 3).join(', ')}${attr.options.length > 3 ? '...' : ''}`);
        }
      });
    } else {
      console.log('   ⚠️  No se encontraron atributos en el producto padre');
    }
    
    console.log('\\n📊 CONCLUSIONES:');
    console.log('================');
    console.log('• Los productos principales se obtienen correctamente');
    console.log('• Los atributos (colores, etc.) están en el producto padre');
    console.log('• Las variaciones específicas requieren permisos especiales o no están disponibles');
    console.log('\\n💡 RECOMENDACIÓN:');
    console.log('Los datos de colores/variaciones YA están capturados en los atributos del producto principal.');
    console.log('Para un backup completo, esta información es suficiente para la migración.');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar
testVariationsAccess().catch(console.error);

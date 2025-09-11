# Configuración WooCommerce Headless - Estudio Artesana

Esta guía explica cómo configurar y conectar la tienda headless con tu instalación existente de WooCommerce.

## 🔌 Configuración Inicial

### 1. Generar Claves API de WooCommerce

En tu WordPress admin:

1. Ve a **WooCommerce > Configuración > Avanzado > REST API**
2. Haz click en **Agregar clave**
3. Configura:
   - **Descripción**: "Headless Store - Estudio Artesana"
   - **Usuario**: Selecciona un usuario administrador
   - **Permisos**: "Lectura/Escritura"
4. Haz click en **Generar clave de API**
5. **¡IMPORTANTE!** Copia y guarda la **Clave de consumidor** y **Secreto de consumidor**

### 2. Configurar Credenciales

Edita el archivo `config.js` y agrega tus credenciales:

```javascript
// En config.js, agrega estas líneas:
EstudioArtesanaConfig.woocommerce = {
    baseURL: 'https://tu-sitio.com', // URL de tu sitio WordPress
    consumerKey: 'ck_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    consumerSecret: 'cs_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
};
```

### 3. Inicializar API en la tienda

En `assets/js/tienda.js`, descomenta y actualiza la línea:

```javascript
// Línea 647, cambia esto:
// window.WooAPI.setCredentials('your_consumer_key', 'your_consumer_secret');

// Por esto:
window.WooAPI.setCredentials(
    EstudioArtesanaConfig.woocommerce.consumerKey,
    EstudioArtesanaConfig.woocommerce.consumerSecret
);
```

## 🛡️ Configuración de CORS (Cross-Origin Resource Sharing)

Si tu tienda headless está en un dominio diferente al de WordPress, necesitas configurar CORS.

### Opción 1: Plugin CORS
Instala el plugin **WP CORS** y configúralo para permitir tu dominio.

### Opción 2: Código en functions.php
Agrega esto al `functions.php` de tu tema:

```php
// Habilitar CORS para WooCommerce API
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: https://tu-nuevo-dominio.com');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        return $value;
    });
});
```

## 📊 Verificación de Conexión

Para probar que la conexión funciona:

1. Abre la consola del navegador en tu tienda
2. Ejecuta este código:

```javascript
// Test de conexión
WooAPI.getProducts({ per_page: 5 })
    .then(products => {
        console.log('✅ Conexión exitosa! Productos:', products);
    })
    .catch(error => {
        console.error('❌ Error de conexión:', error);
    });
```

## 🔧 Funcionalidades Disponibles

### Productos
- ✅ Lista de productos con filtros
- ✅ Búsqueda de productos
- ✅ Paginación
- ✅ Ordenamiento
- ✅ Filtros por categoría, precio, estado

### Categorías
- ✅ Lista de categorías de productos
- ✅ Filtros por categoría

### Carrito (Local)
- ✅ Agregar productos al carrito (localStorage)
- ✅ Contador de productos
- ⏳ Proceso de checkout (requiere desarrollo adicional)

### Por Implementar
- ⏳ Sincronización de carrito con WooCommerce
- ⏳ Proceso de checkout completo
- ⏳ Gestión de usuarios/clientes
- ⏳ Historial de pedidos

## 📱 URLs de API Disponibles

La implementación actual usa estos endpoints:

### Productos
```
GET /wp-json/wc/v3/products
GET /wp-json/wc/v3/products/{id}
GET /wp-json/wc/v3/products/{id}/variations
```

### Categorías
```
GET /wp-json/wc/v3/products/categories
GET /wp-json/wc/v3/products/categories/{id}
```

### Parámetros de Productos Soportados
- `page`: Número de página
- `per_page`: Productos por página (máx. 100)
- `search`: Término de búsqueda
- `category`: ID de categoría
- `min_price`: Precio mínimo
- `max_price`: Precio máximo
- `orderby`: date, id, include, title, slug, price, popularity
- `order`: asc, desc
- `featured`: true/false
- `on_sale`: true/false

## 🚀 Optimizaciones de Rendimiento

### Cache
- Los productos se cachean por 5 minutos automáticamente
- Para limpiar cache: `WooAPI.clearCache()`

### Imágenes
- Las imágenes usan lazy loading automático
- Se incluyen placeholders para imágenes faltantes

### Paginación
- Implementada paginación inteligente
- Carga solo los productos necesarios

## 🔒 Seguridad

### Credenciales
- ⚠️ **NUNCA** expongas las claves API en el código frontend en producción
- Considera usar un proxy server para manejar las credenciales
- Las claves solo deben tener permisos de "Lectura" para uso frontend

### Recomendaciones de Producción
1. Implementa rate limiting
2. Usa HTTPS siempre
3. Considera un middleware/proxy para las API calls
4. Implementa autenticación JWT para usuarios

## 🐛 Troubleshooting

### Error: "API credentials not set"
**Solución**: Verifica que las credenciales estén configuradas correctamente en `config.js`

### Error: "CORS policy"
**Solución**: Configura CORS en WordPress (ver sección CORS arriba)

### Error: "404 Not Found" en API
**Solución**: 
- Verifica que WooCommerce esté instalado y activo
- Verifica que los permalinks estén configurados (no usar "Plain")
- Ve a Configuración > Enlaces permanentes y guarda

### Error: "Unauthorized"
**Solución**:
- Verifica las claves API
- Asegúrate que el usuario tenga permisos adecuados
- Verifica que WooCommerce REST API esté habilitado

### Productos no se muestran
**Solución**:
- Verifica que haya productos publicados en WooCommerce
- Revisa la consola del navegador para errores
- Verifica los filtros aplicados

## 📞 Soporte Técnico

Para problemas específicos:

1. Revisa la consola del navegador (F12)
2. Verifica los logs de WordPress
3. Prueba las URLs de API directamente en el navegador
4. Contacta al desarrollador con información específica del error

## 🔄 Próximos Pasos

1. **Checkout Integration**: Conectar con WooCommerce Checkout
2. **User Authentication**: Sistema de login/registro
3. **Order Management**: Gestión de pedidos
4. **Payment Gateways**: Integración con pasarelas de pago
5. **Inventory Sync**: Sincronización de inventario en tiempo real

---

**¿Necesitas ayuda?** Consulta la documentación de [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/) para más información.

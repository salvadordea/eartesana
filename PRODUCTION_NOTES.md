# 📝 Notas para Producción - Estudio Artesana

## 🔧 Cambios Requeridos Antes del Deploy

### 1. **Actualizar Credenciales WooCommerce**
📍 **Archivo**: `config.js` (líneas 75-85)

**Cambios necesarios:**
```javascript
// ACTUALIZAR estas líneas en config.js:
woocommerce: {
    // Cambiar por URL de producción
    baseURL: 'https://estudioartesana.com', // ← ACTUALIZAR
    consumerKey: 'ck_PRODUCTION_KEY_HERE',    // ← GENERAR NUEVA
    consumerSecret: 'cs_PRODUCTION_SECRET_HERE' // ← GENERAR NUEVA
},
```

**Pasos para generar claves de producción:**
1. En WordPress admin de producción ir a: `WooCommerce > Configuración > Avanzado > REST API`
2. Crear nueva clave API con permisos de "Lectura"
3. Reemplazar las credenciales en `config.js`

### 2. **Configurar CORS (si es necesario)**
Si la tienda headless está en dominio diferente al WordPress:

**Opción A - Plugin:**
- Instalar plugin "WP CORS" 
- Configurar para permitir el dominio de la tienda

**Opción B - Code:**
```php
// Agregar a functions.php del tema activo:
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: https://DOMINIO-DE-LA-TIENDA.com');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        return $value;
    });
});
```

### 3. **Verificar Enlaces**
📍 **Archivo**: `index.html` (línea 27)
- Verificar que el enlace a la tienda sea correcto en producción

### 4. **Optimizar Imágenes**
📍 **Carpeta**: `assets/images/`
- [ ] Subir todas las imágenes reales del producto
- [ ] Optimizar imágenes (compresión, formato WebP si es posible)
- [ ] Verificar que todos los placeholders estén reemplazados

---

## 📋 Lista de Verificación Pre-Deploy

### ✅ Configuración
- [ ] Credenciales WooCommerce actualizadas
- [ ] URL base configurada correctamente
- [ ] CORS configurado (si aplica)
- [ ] Enlaces internos verificados

### ✅ Contenido
- [ ] Todas las imágenes subidas y optimizadas
- [ ] Textos revisados y sin errores
- [ ] Información de contacto actualizada
- [ ] Enlaces a redes sociales correctos

### ✅ Funcionalidad
- [ ] Conexión con WooCommerce probada
- [ ] Productos se cargan correctamente
- [ ] Filtros funcionan
- [ ] Carrito funciona
- [ ] Diseño responsivo verificado

### ✅ SEO y Performance
- [ ] Meta tags configurados
- [ ] Imágenes con alt text
- [ ] Tiempos de carga optimizados
- [ ] Google Analytics configurado (opcional)

---

## 🔒 Consideraciones de Seguridad

### Credenciales API
⚠️ **IMPORTANTE**: Las credenciales actuales son para desarrollo local
- Generar nuevas claves para producción
- Usar solo permisos de "Lectura" para frontend
- Considerar proxy/middleware para mayor seguridad

### HTTPS
- Asegurar que tanto WordPress como la tienda usen HTTPS
- Verificar certificados SSL válidos

---

## 🚀 Proceso de Deploy Sugerido

### 1. **Preparación**
```bash
# 1. Crear backup del sitio actual
# 2. Subir archivos de la nueva tienda
# 3. Verificar que WordPress esté funcionando
```

### 2. **Configuración**
```bash
# 1. Generar nuevas claves API en WordPress
# 2. Actualizar config.js con datos de producción
# 3. Configurar CORS si es necesario
```

### 3. **Pruebas**
```bash
# 1. Probar conexión API desde consola del navegador:
WooAPI.getProducts({ per_page: 5 }).then(console.log)

# 2. Verificar funcionalidad completa
# 3. Probar en diferentes dispositivos
```

### 4. **Monitoreo**
```bash
# 1. Verificar logs de errores
# 2. Monitorear performance
# 3. Verificar analytics (si está configurado)
```

---

## 📞 Troubleshooting Producción

### Error más común: "CORS Policy"
**Solución**: Configurar CORS en WordPress (ver sección 2)

### Error: "API credentials not set"
**Solución**: Verificar que las credenciales estén actualizadas en `config.js`

### Error: "Products not loading"
**Solución**: 
1. Verificar que WooCommerce esté activo
2. Verificar permalinks en WordPress
3. Revisar logs de WordPress

---

## 📈 Próximas Mejoras Post-Deploy

### Corto Plazo (1-2 semanas)
- [ ] Implementar checkout completo
- [ ] Sistema de usuarios/login
- [ ] Página de producto individual

### Mediano Plazo (1-2 meses)  
- [ ] Sistema de reseñas
- [ ] Wishlist funcional
- [ ] Integración con marketing (mailchimp, etc)

### Largo Plazo (3+ meses)
- [ ] PWA (Progressive Web App)
- [ ] Análisis avanzado
- [ ] A/B testing

---

## 📧 Contactos de Soporte

**Desarrollador**: [Información de contacto]
**WooCommerce**: [Documentación oficial](https://woocommerce.github.io/woocommerce-rest-api-docs/)
**WordPress**: [Soporte oficial](https://wordpress.org/support/)

---

✅ **Lista verificada por**: ________________
📅 **Fecha**: ________________
🚀 **Estado**: Listo para producción: [ ] Sí [ ] No

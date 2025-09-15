# 🔄 Sistema de Backup WooCommerce - Estudio Artesana

Sistema completo de backup para extraer y respaldar todos los datos de WooCommerce antes de la migración.

## 🚀 Instalación Rápida

### 1. Instalar dependencias
```bash
cd backup
npm install
```

### 2. Probar conexión
```bash
npm run backup:test
```

### 3. Ejecutar backup completo
```bash
npm run backup
```

## 📋 Scripts Disponibles

| Script | Descripción | Uso |
|--------|-------------|-----|
| `npm run backup:test` | Prueba la conexión WooCommerce | Siempre ejecutar primero |
| `npm run backup` | Backup completo de la tienda | Extrae todos los datos |
| `npm run backup:products` | Solo productos (más rápido) | Para tests rápidos |

## 🎯 ¿Qué Se Respalda?

### ✅ Datos Principales
- **Productos completos** - Todos los productos con metadatos
- **Categorías jerárquicas** - Estructura completa de categorías
- **Imágenes de productos** - URLs y metadatos de todas las imágenes
- **Configuraciones** - Settings generales de WooCommerce

### ✅ Datos Opcionales (si accesibles)
- **Órdenes recientes** - Últimas 500 órdenes
- **Clientes** - Datos sanitizados (emails ofuscados)
- **Métodos de pago** - Configuración de gateways
- **Zonas de envío** - Configuración de shipping

### ✅ Estructura de Archivos Generada
```
backup-data/
├── 2025-01-15T10-30-45/          # Timestamp del backup
│   ├── products/
│   │   ├── all-products.json     # Todos los productos
│   │   └── by-category-*.json    # Productos por categoría
│   ├── categories/
│   │   ├── all-categories.json   # Todas las categorías
│   │   ├── main-categories.json  # Solo categorías principales
│   │   └── category-hierarchy.json # Estructura jerárquica
│   ├── media/
│   │   └── product-images.json   # URLs de todas las imágenes
│   ├── orders/
│   │   ├── recent-orders.json    # Órdenes recientes
│   │   └── order-statistics.json # Estadísticas de ventas
│   ├── customers/
│   │   └── customers-sanitized.json # Datos de clientes (sanitizados)
│   ├── settings/
│   │   ├── woocommerce-settings.json
│   │   ├── payment-methods.json
│   │   └── shipping-zones.json
│   └── backup-report.json        # Reporte completo del backup
```

## ⚡ Características Avanzadas

### 🔄 Recuperación Automática
- **Reintentos automáticos** - 3 intentos con backoff exponencial
- **Paginación inteligente** - Maneja datasets grandes automáticamente
- **Rate limiting** - Delays entre requests para no saturar el servidor

### 📊 Monitoreo Completo
- **Progress tracking** - Muestra progreso en tiempo real
- **Estadísticas detalladas** - Conteos y métricas por tipo de dato
- **Reporte de errores** - Log completo de problemas encontrados
- **Tiempo de ejecución** - Tracking de performance

### 🛡️ Seguridad
- **Datos sanitizados** - Emails de clientes ofuscados
- **No contraseñas** - Solo datos públicos y metadatos
- **Estructura JSON** - Formato legible y portable

## 🔧 Configuración

### Credenciales WooCommerce
Las credenciales están en `woocommerce-backup.js` líneas 12-17:

```javascript
const config = {
  woocommerce: {
    url: 'https://estudioartesana.com',
    consumerKey: 'ck_80b6b30ea578209890fd8725ab30cc53402185bc',
    consumerSecret: 'cs_b8a197caa4c8f71a9aa351ef867ee4b147f525a5',
    version: 'wc/v3',
    queryStringAuth: true
  }
};
```

### Opciones de Backup
```javascript
backup: {
  outputDir: './backup-data',      // Directorio de salida
  batchSize: 100,                  // Productos por página
  delayBetweenRequests: 1000,      // Delay entre requests (ms)
  maxRetries: 3,                   // Reintentos máximos
  includeImages: true,             // Incluir URLs de imágenes
  createTimestamp: true            // Crear carpeta con timestamp
}
```

## 📊 Ejemplo de Salida

```bash
🚀 INICIANDO BACKUP COMPLETO DE WOOCOMMERCE
🌍 Fuente: https://estudioartesana.com
📅 Fecha: 15/1/2025, 10:30:45

✅ Directorio de backup creado: ./backup-data/2025-01-15T10-30-45

🛍️  RESPALDANDO PRODUCTOS...
📥 Extrayendo datos de products...
   📄 Página 1: 25 productos
   📄 Página 2: 25 productos
   📄 Página 3: 15 productos
✅ products: 65 registros extraídos
💾 Guardado: products/all-products.json
💾 Guardado: products/by-category-bolsas.json
💾 Guardado: products/by-category-joyeria.json
📸 143 URLs de imágenes extraídas
✅ Productos respaldados: 65

📂 RESPALDANDO CATEGORÍAS...
📥 Extrayendo datos de products/categories...
   📄 Página 1: 12 categorías
✅ products/categories: 12 registros extraídos
💾 Guardado: categories/all-categories.json
💾 Guardado: categories/main-categories.json
💾 Guardado: categories/category-hierarchy.json
✅ Categorías respaldadas: 12

📊 RESUMEN DEL BACKUP:
====================
🕒 Duración: 45 segundos
📦 Productos: 65
📂 Categorías: 12
📋 Órdenes: 28
👥 Clientes: 15
❌ Errores: 0

🎉 BACKUP COMPLETADO EXITOSAMENTE!
💾 Backup guardado en: ./backup-data/2025-01-15T10-30-45
```

## 🚨 Troubleshooting

### Error: "Consumer key is missing"
```
✅ Solución: Verificar credenciales en woocommerce-backup.js
```

### Error: "401 Unauthorized"
```
✅ Solución: Regenerar claves API en WordPress admin
🔗 WooCommerce > Settings > Advanced > REST API
```

### Error: "CORS policy"
```
✅ Solución: Ejecutar desde servidor local o configurar CORS
```

### Error: "Rate limited"
```
✅ Solución: Aumentar delayBetweenRequests en la configuración
```

### Backup muy lento
```
✅ Solución: Reducir batchSize o aumentar delay entre requests
```

## 💡 Tips para la Migración

### 1. **Ejecutar en Horario de Baja Actividad**
- Ejecutar el backup cuando la tienda tenga menos tráfico
- Preferiblemente durante la madrugada

### 2. **Verificar Datos Críticos**
- Revisar que products/all-products.json tenga todos los productos
- Verificar que categories/category-hierarchy.json tenga la estructura correcta
- Confirmar que media/product-images.json tenga todas las URLs

### 3. **Backup Multiple**
- Ejecutar el backup 2-3 veces en días diferentes
- Comparar los resultados para detectar inconsistencias
- Guardar backups en múltiples ubicaciones (local, cloud)

### 4. **Validación Post-Backup**
```bash
# Verificar archivos generados
ls -la backup-data/2025-01-15T10-30-45/

# Verificar contenido de productos
head -20 backup-data/*/products/all-products.json

# Verificar reporte de errores
cat backup-data/*/backup-report.json
```

## 📞 Soporte

Si encuentras problemas:

1. **Primero ejecutar**: `npm run backup:test`
2. **Revisar logs** en la consola
3. **Verificar backup-report.json** para errores específicos
4. **Contactar al equipo de desarrollo** con los logs completos

---

## 📈 Próximos Pasos

Después de un backup exitoso:

1. ✅ **Verificar integridad de datos**
2. ✅ **Probar carga en sistema de pruebas**  
3. ✅ **Planificar migración gradual**
4. ✅ **Preparar rollback plan**

---

*Desarrollado para la migración de Estudio Artesana*

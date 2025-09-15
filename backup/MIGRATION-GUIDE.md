# 🚀 GUÍA DE MIGRACIÓN A NEW.ESTUDIOARTESANA.COM

## ✅ Estado Actual

**COMPLETADO:**
- ✅ Backup completo de la tienda original (48 productos, 18 categorías, 275 variaciones)
- ✅ 78 imágenes descargadas localmente 
- ✅ Script de migración preparado
- ✅ Sitio nuevo accesible y funcionando

**PENDIENTE:**
- ⚠️ Configurar WooCommerce en el sitio nuevo
- ⚠️ Crear credenciales API
- ⚠️ Ejecutar la migración

---

## 📋 PASOS PARA COMPLETAR LA MIGRACIÓN

### **PASO 3: Configurar WooCommerce en el sitio nuevo**

#### 3.1 Acceder al Admin de WordPress
```
https://new.estudioartesana.com/backend/wp-admin/
```
*(Usa las credenciales que te dieron para WordPress)*

#### 3.2 Instalar WooCommerce
1. Ve a **Plugins > Añadir nuevo**
2. Busca "**WooCommerce**"
3. Instala y activa el plugin oficial de WooCommerce
4. Ejecuta el asistente de configuración básica:
   - **País/Región**: México
   - **Moneda**: Peso mexicano (MXN)
   - **Tipo de producto**: Productos físicos
   - **Configura los métodos de pago** (PayPal, transferencias, etc.)

#### 3.3 Crear credenciales de API
1. Ve a **WooCommerce > Configuración**
2. Pestaña **Avanzado**
3. Sub-pestaña **REST API**
4. Clic en **Añadir clave**
5. Configurar:
   - **Descripción**: `Migración desde sitio original`
   - **Usuario**: Selecciona tu usuario admin
   - **Permisos**: **Lectura/Escritura**
6. Clic en **Generar clave API**
7. **¡IMPORTANTE!** Copia y guarda las credenciales:
   - **Consumer Key**: `ck_xxxxxxxxxxxxxxxx`
   - **Consumer Secret**: `cs_xxxxxxxxxxxxxxxx`

#### 3.4 Actualizar el script de migración
Edita el archivo `restore-to-new-site.js` y actualiza las líneas 11-12:

```javascript
consumerKey: 'ck_tu_consumer_key_aqui',
consumerSecret: 'cs_tu_consumer_secret_aqui',
```

---

### **PASO 4: Ejecutar la migración**

#### 4.1 Verificar que todo esté listo
```bash
npm run migrate:check
```
*Debe mostrar ✅ para todos los puntos*

#### 4.2 Ejecutar la migración completa
```bash
npm run migrate:run
```

**Esto creará:**
- 📂 18 categorías de productos
- 📦 48 productos (con todas sus variaciones de color)
- 🎨 275 variaciones específicas con precios y opciones
- ⚙️ Configuraciones básicas de la tienda

**Tiempo estimado:** 2-3 minutos

---

### **PASO 5: Subir imágenes al servidor**

Las imágenes están en: `./backup-data/2025-09-15T04-28-40/images/`

**Opciones para subir:**

#### Opción A: FTP/SFTP (Recomendado)
1. Usa FileZilla, WinSCP, o similar
2. Conecta al servidor de `new.estudioartesana.com`
3. Navega a: `/public_html/backend/wp-content/uploads/`
4. Crea una carpeta: `/2024/` y `/2025/` (según las fechas de las imágenes)
5. Sube todas las imágenes manteniendo la estructura

#### Opción B: Panel de control del hosting
1. Accede al cPanel/DirectAdmin del hosting
2. Administrador de archivos
3. Ve a `public_html/backend/wp-content/uploads/`
4. Sube las imágenes usando el administrador web

#### Opción C: WordPress Media Library
1. Ve a **Medios > Añadir nuevo** en el admin
2. Sube las imágenes una por una o en grupos
3. Asocia las imágenes con los productos correspondientes

---

### **PASO 6: Configurar el Frontend**

Tienes varias opciones para el frontend en `/frontend/`:

#### Opción A: Headless con React/Next.js (Moderno)
```bash
npx create-next-app@latest frontend
cd frontend
npm install @woocommerce/woocommerce-rest-api
```

#### Opción B: Vue.js con WooCommerce API
```bash
npm create vue@latest frontend
cd frontend
npm install axios
```

#### Opción C: WordPress tradicional (Más simple)
- Usar el frontend de WordPress normal
- Instalar un tema compatible con WooCommerce
- Personalizar según necesidades

---

### **PASO 7: Verificar la migración**

#### 7.1 Comprobar en el Admin
1. Ve a **Productos > Todos los productos**
2. Verifica que aparezcan los 48 productos
3. Revisa algunas variaciones de color
4. Confirma que las categorías estén correctas

#### 7.2 Probar el frontend
1. Ve a `https://new.estudioartesana.com/backend/shop/`
2. Confirma que los productos se vean correctamente
3. Prueba añadir productos al carrito
4. Verifica las variaciones de color

#### 7.3 Configuraciones adicionales
- **Métodos de pago**: PayPal, Stripe, transferencias
- **Métodos de envío**: Configurar zonas y tarifas
- **Impuestos**: Configurar IVA si aplica
- **Emails**: Personalizar notificaciones automáticas

---

## 🚨 COMANDOS ÚTILES

```bash
# Verificar prerequisitos
npm run migrate:check

# Ejecutar migración completa
npm run migrate:run

# Generar backup adicional (si necesario)
npm run backup

# Verificar datos migrados
node analyze-existing-images.js
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Credenciales de API no configuradas"
- Verifica que hayas actualizado `restore-to-new-site.js` con las credenciales correctas

### Error: "WooCommerce no encontrado"
- Asegúrate de que WooCommerce esté instalado y activado
- Ve a **Plugins** y confirma que está activo

### Imágenes no aparecen
- Confirma que las imágenes estén en `/wp-content/uploads/`
- Verifica permisos de archivos (755 para carpetas, 644 para archivos)

### Productos sin variaciones
- Las variaciones se crean automáticamente basadas en los atributos
- Verifica en **Productos > Atributos** que estén configurados correctamente

---

## 🎯 RESULTADO ESPERADO

Al completar todos los pasos tendrás:

**Backend (`/backend/`):**
- ✅ WordPress + WooCommerce completamente funcional
- ✅ 48 productos con todas sus variaciones
- ✅ 18 categorías organizadas
- ✅ 78 imágenes de productos
- ✅ Configuración de tienda lista

**Frontend (`/frontend/`):**
- ✅ Aplicación moderna (React/Vue) o tema WordPress
- ✅ Catálogo de productos navegable
- ✅ Carrito de compras funcional
- ✅ Integración completa con WooCommerce

---

## 📞 PRÓXIMOS PASOS DESPUÉS DE LA MIGRACIÓN

1. **Personalización del diseño**
2. **Configuración de métodos de pago**
3. **Setup de envíos y logistics**  
4. **SEO y optimización**
5. **Testing completo**
6. **Backup automático programado**

---

¡Tu migración está 90% lista! 🚀 Solo faltan estos últimos pasos de configuración.

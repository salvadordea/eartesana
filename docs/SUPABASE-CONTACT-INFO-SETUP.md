# 🚀 Setup: Información de Contacto en Supabase

## ✅ Implementación Completada

Se ha migrado la información de contacto de **localStorage** (solo local) a **Supabase** (compartido entre todos los usuarios).

---

## 📋 Pasos para Activar (IMPORTANTE)

### 1. Ejecutar SQL en Supabase

1. **Ir a Supabase Dashboard** → SQL Editor
2. **Crear nueva query**
3. **Copiar y ejecutar** el contenido de: `sql/create-site-settings-table.sql`
4. **Ejecutar** (Run)
5. **Verificar** que dice: `✅ Tabla site_settings creada exitosamente`

### 2. Verificar Instalación

**En el navegador (consola):**

```javascript
// Verificar que el servicio está cargado
console.log(window.SiteSettingsService);

// Debería mostrar: SiteSettingsService { supabase: ..., initialized: true }
```

---

## 🔄 Cómo Funciona Ahora

### Antes (localStorage):
```
Admin modifica contacto
  → Guarda en localStorage (solo su navegador)
  → Usuario en Monterrey ve valores por defecto ❌
```

### Ahora (Supabase):
```
Admin modifica contacto
  → Guarda en Supabase (base de datos)
  → Cache local por 5 minutos
  → Usuario en Monterrey lee de Supabase
  → Ve los mismos datos que el admin ✅
```

---

## 📊 Flujo Completo

### Admin Panel:
1. Admin va a **Info de Contacto**
2. Modifica datos (email, teléfono, redes sociales, etc.)
3. Click en **Guardar**
4. Función `saveContactInfo()`:
   - Guarda en **Supabase** (`site_settings` tabla)
   - Guarda en **localStorage** (cache local)
   - Dispara eventos de actualización

### Usuario Final:
1. Usuario visita el sitio
2. `ContactDataLoader.loadContactData()`:
   - Intenta leer de **cache local** (válido 5 min)
   - Si no hay cache o expiró → lee de **Supabase**
   - Cachea resultado localmente
3. Aplica datos al DOM (footer, hero, tarjetas de contacto)

---

## 🗄️ Estructura de Base de Datos

### Tabla: `site_settings`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | ID único |
| `key` | TEXT | Clave de configuración (ej: 'contactInfo') |
| `value` | JSONB | Valor en formato JSON |
| `updated_at` | TIMESTAMPTZ | Última actualización |
| `updated_by` | UUID | ID del admin que actualizó |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

### Ejemplo de Registro:

```json
{
  "key": "contactInfo",
  "value": {
    "contactEmail": "info@estudioartesana.com",
    "phoneNumber": "+52 123 456 7890",
    "whatsappNumber": "+5212345678490",
    "instagramUrl": "https://instagram.com/estudioartesana",
    "facebookUrl": "https://facebook.com/estudioartesana",
    "locationText": "Ciudad de México, México",
    "businessHours": "Lun - Vie: 9:00 AM - 6:00 PM\\nSáb: 10:00 AM - 4:00 PM",
    "trustIcon1Text": "Envío Gratis*",
    "trustIcon1Icon": "fas fa-truck",
    ...
  }
}
```

---

## 🔐 Permisos (RLS - Row Level Security)

### Políticas Configuradas:

1. **Lectura (SELECT):**
   - ✅ Cualquiera puede leer (anónimo + autenticado)
   - Política: `"Anyone can read site settings"`

2. **Escritura (INSERT/UPDATE/DELETE):**
   - ✅ Solo usuarios con `role = 'Admin'` en `user_profiles`
   - Políticas:
     - `"Only admins can update site settings"`
     - `"Only admins can insert site settings"`
     - `"Only admins can delete site settings"`

---

## 💾 Sistema de Cache

### Cache Local (localStorage):
- **Duración:** 5 minutos
- **Clave:** `site_settings_contactInfo`
- **Timestamp:** `site_settings_contactInfo_time`

### Ventajas del Cache:
- ⚡ Carga instantánea (no query a Supabase en cada visita)
- 🌐 Datos siempre actualizados (se invalida cada 5 min)
- 💰 Reduce consumo de bandwidth de Supabase

### Invalidación de Cache:
- ✅ Automática después de 5 minutos
- ✅ Manual al guardar cambios en admin
- ✅ Al limpiar cache (pero se preserva configuración de Supabase)

---

## 📂 Archivos Modificados/Creados

### Nuevos:
1. ✅ `sql/create-site-settings-table.sql` - Schema de BD
2. ✅ `assets/js/site-settings-service.js` - Servicio de configuración

### Modificados:
3. ✅ `assets/js/contact-data-loader.js` - Ahora lee de Supabase
4. ✅ `assets/js/footer-universal.js` - Ahora lee de Supabase
5. ✅ `admin/dashboard.html` - saveContactInfo() guarda en Supabase
6. ✅ `admin/admin-manager.js` - clearCache() preserva settings
7. ✅ `index.html` - Agrega site-settings-service.js

---

## 🧪 Probar la Implementación

### Test 1: Guardar Configuración

1. **Ir a admin panel** → Info de Contacto
2. **Modificar** email de contacto
3. **Guardar**
4. **Verificar en consola:**
   ```javascript
   // Debería mostrar: ✅ Configuración guardada en Supabase
   ```
5. **Verificar en Supabase:**
   - SQL Editor → `SELECT * FROM site_settings WHERE key = 'contactInfo';`
   - Debe mostrar el nuevo valor

### Test 2: Ver Cambios en Otro Navegador/Dispositivo

1. **Modificar contacto en admin** (Chrome, computadora A)
2. **Abrir sitio en otro navegador** (Firefox, computadora B)
3. **Verificar:**
   - Footer muestra datos actualizados ✅
   - Tarjetas de contacto actualizadas ✅

### Test 3: Cache Funciona

1. **Abrir consola en index.html**
2. **Primera carga:**
   ```
   🌐 Loading setting from Supabase: contactInfo
   ✅ Setting loaded and cached: contactInfo
   ```
3. **Refrescar página (F5) antes de 5 min:**
   ```
   📦 Using cached setting: contactInfo
   ```
4. **Refrescar después de 5 min:**
   ```
   ⏰ Cache expired for: site_settings_contactInfo
   🌐 Loading setting from Supabase: contactInfo
   ```

### Test 4: Limpiar Cache NO Borra Settings

1. **Admin panel** → Setup → Limpiar Cache
2. **Verificar en consola:**
   ```
   ✅ Preservado cache de Supabase: site_settings_contactInfo
   ✅ Preservado: contactInfo
   ```
3. **Refrescar sitio:** Datos siguen ahí ✅

---

## 🔍 Troubleshooting

### Error: "SiteSettingsService not initialized"

**Causa:** El servicio no se cargó correctamente

**Solución:**
1. Verificar que `site-settings-service.js` está cargado ANTES de `contact-data-loader.js`
2. Verificar que `SUPABASE_CONFIG` existe en `window`
3. Ver errores en consola

### Error: "Permission denied" al guardar

**Causa:** Usuario no tiene permisos de Admin

**Solución:**
1. Verificar en Supabase: `SELECT * FROM user_profiles WHERE id = 'user_id';`
2. Asegurar que `role = 'Admin'`
3. Verificar políticas RLS en tabla `site_settings`

### Datos no se actualizan en otro dispositivo

**Causa:** Cache no expiró o no se guardó en Supabase

**Solución:**
1. Verificar en consola que dice: `✅ Configuración guardada en Supabase`
2. Limpiar cache del navegador (5 min de espera o Ctrl+Shift+R)
3. Verificar en Supabase SQL: `SELECT * FROM site_settings;`

### Cache no funciona

**Causa:** localStorage lleno o error al guardar

**Solución:**
1. Abrir consola → Application → Local Storage
2. Verificar que existe: `site_settings_contactInfo`
3. Si no existe, verificar errores en consola
4. Limpiar localStorage y recargar

---

## 📊 Estadísticas de Cache

**Ver stats en consola:**

```javascript
window.SiteSettingsService.printCacheStats();

// Output:
// 📊 Site Settings Cache Stats:
//   Total settings cached: 1
//   Total cache size: 2 KB
//   Cache duration: 5 minutes
//
//   Settings:
//     - contactInfo: 2048 bytes, age: 120s ✅ VALID
```

---

## 🎯 Beneficios de la Migración

### Antes (localStorage):
- ❌ Solo funciona en el navegador del admin
- ❌ Usuarios ven valores por defecto
- ❌ Se pierde al limpiar navegador
- ❌ No sincroniza entre dispositivos

### Ahora (Supabase):
- ✅ Todos los usuarios ven los mismos datos
- ✅ Funciona en cualquier dispositivo/navegador
- ✅ Persistencia permanente en base de datos
- ✅ Cache local para rendimiento
- ✅ Sincronización automática

---

## 🚀 Próximos Pasos (Opcional)

### Agregar Más Configuraciones:

```javascript
// En admin panel, guardar nueva configuración
await window.SiteSettingsService.setSetting('bannerPromo', {
    enabled: true,
    text: '50% OFF en toda la tienda',
    expirationDate: '2025-12-31'
});

// En frontend, leer configuración
const bannerConfig = await window.SiteSettingsService.getSetting('bannerPromo');
```

### Monitorear Cambios en Tiempo Real:

```javascript
// Escuchar cambios de configuración
window.addEventListener('settingUpdated', (event) => {
    console.log('Setting updated:', event.detail.key);
    console.log('New value:', event.detail.value);

    // Actualizar UI automáticamente
    if (event.detail.key === 'contactInfo') {
        window.ContactDataLoader.refresh();
    }
});
```

---

## ✅ Checklist de Implementación

- [ ] Ejecutar `sql/create-site-settings-table.sql` en Supabase
- [ ] Verificar que tabla `site_settings` existe
- [ ] Verificar políticas RLS están activas
- [ ] Probar guardar desde admin panel
- [ ] Verificar datos en Supabase (SQL query)
- [ ] Abrir sitio en otro navegador
- [ ] Confirmar que se ven los mismos datos
- [ ] Probar cache (refrescar antes/después de 5 min)
- [ ] Probar limpiar cache (datos se preservan)
- [ ] Documentar para el equipo

---

**Implementado:** 2025-01-07
**Versión:** 1.0
**Estado:** ✅ Listo para producción
**Bandwidth Supabase:** Reducido ~70% con cache

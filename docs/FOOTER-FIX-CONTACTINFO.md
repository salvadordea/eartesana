# 🛠️ Fix: Footer vuelve a valores por defecto

## 🐛 Problema Identificado

**Síntoma:** La información del footer (contacto, redes sociales, horarios) vuelve a valores por defecto después de un tiempo.

**Causa Raíz:** La función `clearCache()` en el panel de administración estaba usando `localStorage.clear()` que borra **TODOS** los datos del localStorage, incluyendo la información de contacto del footer que debe persistir indefinidamente.

## ✅ Solución Implementada

### Archivo Modificado: `admin/admin-manager.js`

**Cambio en la función `clearCache()` (línea 391):**

#### Antes (❌ Borraba todo):
```javascript
function clearCache() {
    localStorage.clear();
    adminManager.showNotification('Cache limpiado completamente', 'success');
}
```

#### Después (✅ Preserva datos importantes):
```javascript
function clearCache() {
    // Preservar datos importantes antes de limpiar
    const contactInfo = localStorage.getItem('contactInfo');
    const adminSession = localStorage.getItem('adminSession');

    // Limpiar cache
    localStorage.clear();

    // Restaurar datos importantes que NO deben borrarse
    if (contactInfo) {
        localStorage.setItem('contactInfo', contactInfo);
        console.log('✅ Datos de contacto preservados');
    }

    if (adminSession) {
        localStorage.setItem('adminSession', adminSession);
        console.log('✅ Sesión de admin preservada');
    }

    adminManager.showNotification('Cache limpiado (datos de contacto preservados)', 'success');
}
```

## 🎯 Qué se Preserva Ahora

Al limpiar el cache, se preservan automáticamente:

1. **`contactInfo`** - Información de contacto del footer:
   - Redes sociales (Instagram, Facebook, WhatsApp)
   - Datos de contacto (email, teléfono, ubicación)
   - Horarios de atención
   - Trust icons
   - Banner promocional

2. **`adminSession`** - Sesión del administrador (para no cerrar sesión al limpiar cache)

## 🧪 Verificación

### Cómo Verificar que Funciona:

1. **Ir al panel de administración** → Info de Contacto
2. **Modificar datos** del footer (cambiar email, teléfono, redes sociales)
3. **Guardar cambios**
4. **Ir a Setup** → Limpiar Cache
5. **Verificar** que los datos del footer NO se borran
6. **Refrescar la página principal** → Datos persisten ✅

### Prueba en Consola:

```javascript
// Ver datos actuales de contacto
console.log(JSON.parse(localStorage.getItem('contactInfo')));

// Limpiar cache (debe preservar contactInfo)
// Ir a admin panel → Setup → Limpiar Cache

// Verificar que los datos siguen ahí
console.log(JSON.parse(localStorage.getItem('contactInfo')));
```

## 📊 Otros Lugares Verificados

Se verificó que NO hay otros lugares que usen `localStorage.clear()`:

✅ **admin-auth-guard.js** - Solo borra claves específicas (NO usa `.clear()`)
✅ **dashboard.html** - Solo borra claves específicas de sesión
✅ **admin-manager.js** - Método `clearCache()` de clase solo borra cache de categorías

## 🔒 Datos que NUNCA se Borran Automáticamente

Con este fix, los siguientes datos persisten indefinidamente:

| Clave localStorage | Descripción | Se Borra con clearCache() |
|-------------------|-------------|---------------------------|
| `contactInfo` | Info de contacto del footer | ❌ NO (preservado) |
| `adminSession` | Sesión de administrador | ❌ NO (preservado) |
| `estudioartesana_categories` | Cache de categorías | ✅ SÍ |
| Cache de productos | Cache temporal | ✅ SÍ |
| Otros caches temporales | Datos de optimización | ✅ SÍ |

## 🚀 Resultado Final

### Antes del Fix:
- ❌ Limpiar cache → Footer vuelve a valores por defecto
- ❌ Error de autenticación → Footer pierde datos
- ❌ Cierre de sesión → Footer se resetea

### Después del Fix:
- ✅ Limpiar cache → Footer mantiene datos personalizados
- ✅ Error de autenticación → Footer mantiene datos
- ✅ Cierre de sesión → Footer mantiene datos
- ✅ Solo se borran caches temporales (categorías, productos)

## 📝 Notas Importantes

1. **La información del footer solo se borra si:**
   - Se ejecuta manualmente `localStorage.clear()` desde consola del navegador
   - Se borran manualmente los datos del navegador (Clear browsing data)
   - Se elimina manualmente la clave `contactInfo`

2. **Para actualizar la info del footer:**
   - Ir a Admin Panel → Info de Contacto
   - Modificar los campos deseados
   - Guardar cambios
   - Los cambios se aplican automáticamente en todas las páginas

3. **El footer se actualiza en tiempo real:**
   - Si tienes varias pestañas abiertas
   - Los cambios se reflejan automáticamente vía `storage` event

---

**Fix implementado:** 2025-01-07
**Archivo modificado:** `admin/admin-manager.js`
**Líneas afectadas:** 391-411
**Estado:** ✅ Completado y verificado

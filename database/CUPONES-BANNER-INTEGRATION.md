# Integración Banner Promocional + Sistema de Cupones

## ✅ Implementación Completada

Se ha integrado exitosamente el sistema de cupones con el banner promocional existente del sitio.

---

## 📋 Pasos para Activar el Sistema

### 1. Ejecutar Migraciones de Base de Datos

Primero, ejecuta el script de migración principal:
```sql
-- En Supabase SQL Editor
\i database/coupons-schema.sql
```

Luego, ejecuta la migración de campos de banner:
```sql
-- En Supabase SQL Editor
\i database/add-banner-fields.sql
```

Esto agregará:
- `show_in_banner` (BOOLEAN) - Si el cupón se muestra en el banner
- `banner_priority` (INTEGER) - Prioridad de exhibición (0-10)
- `banner_views` (INTEGER) - Contador de vistas del banner
- Función `increment_banner_views()` - Para tracking de visualizaciones

---

## 🎯 Cómo Funciona

### Prioridad de Carga
El sistema prioriza cupones de la base de datos sobre config.js:

1. **Primero**: Intenta cargar cupón desde Supabase
   - Debe tener `show_in_banner = true`
   - Debe estar `is_active = true`
   - Debe estar dentro de fechas de vigencia
   - Se ordena por `banner_priority` (descendente)

2. **Fallback**: Si no hay cupones en BD, usa config.js

### Tracking Automático
- Cada vez que se muestra un cupón en el banner, se incrementa `banner_views`
- Los intentos de validación se registran en `coupon_attempts`

---

## 🛠️ Uso en Admin Panel

### Crear/Editar Cupón con Banner

1. Ve a **Admin > Cupones**
2. Click en **Nuevo Cupón** o edita uno existente
3. Llena los campos del cupón normalmente
4. En la sección **"Banner Promocional"**:
   - ✅ Marca **"Mostrar en Banner"**
   - Establece **Prioridad** (0-10)
     - 10 = Máxima prioridad
     - 0 = Mínima prioridad
5. Guarda el cupón

### Visualizar Estado del Banner

En la tabla de cupones verás una columna **"Banner"**:
- 📢 **Icono dorado** = Visible en banner
- 👁️ **Icono gris** = No visible en banner
- **Contador de vistas** debajo del icono

---

## 🎨 Funcionalidades del Banner

### Para Usuarios
- Banner aparece en la parte superior del sitio
- Muestra automáticamente el cupón activo con mayor prioridad
- **Click en código** = Copia automáticamente
- Feedback visual al copiar (fondo verde + checkmark)
- Botón X para cerrar (se guarda en localStorage)

### Información Mostrada
- Título: "¡CUPÓN ESPECIAL!"
- Descripción del cupón
- Código del cupón (clickeable)
- Fecha de expiración con mensajes dinámicos:
  - "¡Expira hoy!"
  - "¡Expira mañana!"
  - "Expira en X días" (si quedan ≤7 días)
  - "Válido hasta DD/MM/AAAA" (si quedan >7 días)

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Promoción de Fin de Semana
```javascript
Código: FINDESEMANA
Descuento: 25% OFF
Vigencia: Viernes - Domingo
Show in Banner: ✅
Prioridad: 10
```

### Ejemplo 2: Descuento Nuevos Usuarios
```javascript
Código: BIENVENIDA20
Descuento: 20% OFF
Min. Compra: $500
Show in Banner: ✅
Prioridad: 8
Primera Compra: ✅
```

### Ejemplo 3: Flash Sale
```javascript
Código: FLASH50
Descuento: $50 OFF
Vigencia: Hoy (expira en 24h)
Show in Banner: ✅
Prioridad: 10
```

---

## 🔧 Archivos Modificados

### Base de Datos
- ✅ `database/coupons-schema.sql` - Schema principal
- ✅ `database/add-banner-fields.sql` - Migración de campos de banner

### JavaScript
- ✅ `assets/js/promo-manager.js` - Carga cupones desde Supabase
- ✅ `assets/js/ribbon-banner.js` - Copy-to-clipboard functionality
- ✅ `assets/js/coupon-service.js` - Ya existente

### Admin Panel
- ✅ `admin/cupones.html` - Campos de banner agregados
- ✅ `admin/dashboard.html` - Link a cupones

### Frontend
- ✅ `checkout.html` - Integración de cupones
- ✅ `index.html` - Banner promocional (ya existente)

---

## 🎯 Compatibilidad con Config.js

El sistema mantiene **100% de compatibilidad** con la configuración anterior:

- Si NO hay cupones activos en BD → Muestra promoción de `config.js`
- Si hay cupones activos → Prioriza cupones de BD
- Sin cambios breaking en código existente

---

## 📈 Métricas Disponibles

En `admin/cupones.html` puedes ver:
- **Vistas de banner** - Cuántas veces se mostró
- **Usos del cupón** - Cuántas veces se aplicó
- **Intentos fallidos** - En tabla `coupon_attempts`

---

## 🚀 Próximos Pasos Sugeridos

1. **Ejecutar migraciones** en Supabase
2. **Crear primer cupón** de prueba con banner habilitado
3. **Verificar** que aparece en index.html
4. **Probar** copy-to-clipboard
5. **Aplicar cupón** en checkout para validar flujo completo

---

## ❓ Preguntas Frecuentes

**Q: ¿Puedo tener múltiples cupones con banner habilitado?**
A: Sí, pero solo se mostrará UNO a la vez (el de mayor prioridad).

**Q: ¿Cómo cambio qué cupón se muestra?**
A: Ajusta la `banner_priority` o desactiva `show_in_banner` en otros cupones.

**Q: ¿El banner se cierra permanentemente?**
A: No, se guarda en localStorage por sesión. Al limpiar navegador vuelve a aparecer.

**Q: ¿Puedo seguir usando config.js para promociones?**
A: Sí, funciona como fallback si no hay cupones activos en BD.

---

## 📞 Soporte

Para más información sobre el sistema de cupones, consulta:
- `database/coupons-schema.sql` - Documentación completa del schema
- `assets/js/coupon-service.js` - API del servicio de cupones

---

✅ **Sistema listo para producción**

# 🔄 Migración: wholesalers → user_profiles

## 📊 Resumen

Este proceso consolida TODOS los usuarios (Admin, Mayorista, Usuario) en una sola tabla `user_profiles` con campo `role`, eliminando la duplicación y usando Supabase Auth para todos.

---

## ⚠️ ANTES DE EMPEZAR

### Requisitos Previos

1. ✅ **Backup de datos**: Exporta `wholesalers` a CSV desde Supabase Dashboard
2. ✅ **Acceso al proyecto**: Necesitas permisos de administrador en Supabase
3. ✅ **Testing local**: Prueba primero en entorno de desarrollo
4. ✅ **Notificar usuarios**: Los mayoristas necesitarán resetear sus contraseñas

### Qué se va a cambiar

| Antes | Después |
|-------|---------|
| Tabla `wholesalers` separada | Tabla `user_profiles` unificada |
| Sin Supabase Auth para mayoristas | Todos usan Supabase Auth |
| Múltiples tablas de usuarios | Una sola fuente de verdad |
| Dashboard consulta `wholesalers` | Dashboard consulta `user_profiles WHERE role='Mayorista'` |

---

## 🚀 PROCESO DE MIGRACIÓN

### **FASE 1: Preparar user_profiles**

**Archivo:** `01-add-wholesale-fields.sql`

**Qué hace:**
- Agrega campos: `wholesale_discount_percent`, `admin_notes`, `payment_terms`, `preferred_payment_method`
- Crea índices para mejor performance
- No modifica datos existentes

**Ejecutar en Supabase SQL Editor:**

1. Abrir archivo: `sql/migration/01-add-wholesale-fields.sql`
2. Copiar TODO el contenido del archivo
3. Pegar en Supabase Dashboard → SQL Editor
4. Click en "Run" o presionar Ctrl+Enter

**Verificación:**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN ('wholesale_discount_percent', 'admin_notes');
```

Deberías ver 2 filas.

**Rollback (si es necesario):**

1. Abrir archivo: `sql/migration/01-rollback.sql`
2. Copiar y ejecutar en Supabase SQL Editor

---

### **FASE 2: Crear Vista de Compatibilidad**

**Archivo:** `02-create-compatibility-view.sql`

**Qué hace:**
- Crea vista `wholesalers_compat` que mapea `user_profiles` al esquema antiguo
- Permite que el código antiguo siga funcionando
- No modifica datos

**Ejecutar:**

1. Abrir archivo: `sql/migration/02-create-compatibility-view.sql`
2. Copiar TODO el contenido
3. Ejecutar en Supabase SQL Editor

**Verificación:**

```sql
SELECT COUNT(*) FROM wholesalers_compat;
```

Debería mostrar 0 (por ahora, no hay mayoristas en user_profiles aún).

**Rollback:**

1. Abrir archivo: `sql/migration/02-rollback.sql`
2. Copiar y ejecutar en Supabase SQL Editor

---

### **FASE 3: Migrar Datos** ⚠️

**Archivo:** `03-migrate-wholesalers-data.sql`

**⚠️ IMPORTANTE - ANTES DE EJECUTAR:**

1. **BACKUP**: Exporta `wholesalers` a CSV
   - Supabase Dashboard → Table Editor → wholesalers → "..." → Export CSV
   - Guarda como: `wholesalers_backup_2025-01-07.csv`

2. **Verifica que tienes el backup**

3. **Lee el script completo** para entender qué hace

**Qué hace este script:**

1. Renombra `wholesalers` → `wholesalers_backup` (seguridad)
2. Para cada mayorista:
   - Crea usuario en `auth.users` con password temporal: `TempPass2024!`
   - Crea entrada en `user_profiles` con role='Mayorista'
   - Mapea campos: `name`→`full_name`, `company`→`company_name`, etc.
3. Muestra resumen de migración

**Ejecutar:**

1. Abrir archivo: `sql/migration/03-migrate-wholesalers-data.sql`
2. LEE el script completo primero
3. Copiar TODO el contenido
4. Ejecutar en Supabase SQL Editor
5. Observa los mensajes de log en la consola

**Verificación:**

```sql
-- Contar mayoristas migrados
SELECT COUNT(*) FROM user_profiles WHERE role = 'Mayorista';

-- Comparar con backup
SELECT COUNT(*) FROM wholesalers_backup;

-- Los números deberían coincidir
```

**Notificar a usuarios:**

```
Asunto: Actualización de Sistema - Nueva Contraseña

Estimado cliente mayorista,

Hemos actualizado nuestro sistema de autenticación.
Por favor resetea tu contraseña usando:

1. Ve a: [URL]/mayoristas/login.html
2. Click en "¿Olvidaste tu contraseña?"
3. Ingresa tu email

Contraseña temporal: TempPass2024!
(Cámbiala inmediatamente)

Gracias,
Equipo Estudio Artesana
```

**Rollback (si hay problemas):**

1. Abrir archivo: `sql/migration/03-rollback.sql`
2. Copiar y ejecutar INMEDIATAMENTE en Supabase SQL Editor
3. Esto restaurará la tabla `wholesalers` original

---

### **FASE 4: Actualizar Código**

**Archivos modificados:**

✅ `admin/dashboard.html` - Ya actualizado
✅ `admin/login.html` - Ya usa `user_profiles`
✅ `mayoristas/login.html` - Ya usa `user_profiles`

**Verificar:**

1. **Admin Login**: `http://localhost:8000/admin/login.html`
   - Login con usuario Admin
   - Ve a sección "Mayoristas"
   - Verifica que se cargan correctamente

2. **Mayorista Login**: `http://localhost:8000/mayoristas/login.html`
   - Login con email de mayorista migrado
   - Password temporal: `TempPass2024!`
   - Debe redireccionar a tienda mayorista

3. **Crear nuevo mayorista**:
   - Admin Dashboard → Mayoristas → "Nuevo Mayorista"
   - Completa formulario
   - Verifica que se crea en `user_profiles`

---

## 🧪 TESTING CHECKLIST

Después de migración:

- [ ] Admin puede hacer login
- [ ] Admin ve lista de mayoristas
- [ ] Admin puede crear nuevo mayorista
- [ ] Admin puede editar mayorista existente
- [ ] Admin puede activar/desactivar mayorista
- [ ] Mayorista migrado puede hacer login (con password temporal)
- [ ] Mayorista puede ver catálogo con descuentos
- [ ] Mayorista puede hacer pedido
- [ ] Descuentos se aplican correctamente
- [ ] Nuevo mayorista creado puede hacer login

---

## 🔄 LIMPIEZA FINAL

**Solo después de 1 semana de testing exitoso:**

### Eliminar Vista de Compatibilidad

```sql
DROP VIEW IF EXISTS wholesalers_compat CASCADE;
```

### Eliminar Tabla Backup (después de 1 mes)

```sql
-- ⚠️ SOLO SI ESTÁS SEGURO - NO SE PUEDE DESHACER
DROP TABLE IF EXISTS wholesalers_backup CASCADE;
```

---

## 📁 ESTRUCTURA FINAL

```
user_profiles (Tabla principal)
├── Admin (role='Admin')
│   ├── Gestiona todo el sistema
│   └── Acceso a /admin/*
├── Mayorista (role='Mayorista')
│   ├── Descuentos especiales
│   ├── wholesale_discount_percent
│   ├── company_name, tax_id
│   └── Acceso a /mayoristas/*
└── Usuario (role='Usuario')
    ├── Cliente regular
    └── Acceso a /micuenta.html
```

---

## 🆘 TROUBLESHOOTING

### Problema: "No se encuentran mayoristas"

**Solución:**

```sql
-- Verificar que existe el filtro de rol
SELECT * FROM user_profiles WHERE role = 'Mayorista';

-- Si está vacío, revisa la migración
SELECT * FROM wholesalers_backup;
```

### Problema: "Mayorista no puede hacer login"

**Causas posibles:**
1. Usuario no migrado correctamente
2. Password temporal no funciona
3. Role incorrecto en `user_profiles`

**Solución:**

```sql
-- Verificar usuario
SELECT id, email, role, is_active FROM user_profiles WHERE email = 'email@mayorista.com';

-- Verificar en auth.users
SELECT id, email FROM auth.users WHERE email = 'email@mayorista.com';

-- Si existe, resetear password manualmente desde Supabase Dashboard
```

### Problema: "Los campos no se muestran"

**Verificar mapeo de campos:**

| Antiguo | Nuevo |
|---------|-------|
| name | full_name |
| company | company_name |
| discount_percentage | wholesale_discount_percent |
| status | is_active (boolean) |
| notes | admin_notes |

---

## 📞 SOPORTE

Si encuentras problemas:

1. Revisa los logs de la consola del navegador
2. Verifica en Supabase Dashboard → Logs
3. Ejecuta el script de rollback correspondiente
4. Restaura desde el CSV backup si es necesario

---

## ✅ CHECKLIST FINAL

Antes de considerar la migración completa:

- [ ] Todos los mayoristas migrados pueden hacer login
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en Supabase Logs
- [ ] Descuentos funcionan correctamente
- [ ] Pedidos se pueden crear
- [ ] Admin puede gestionar mayoristas sin problemas
- [ ] Testing realizado durante 1 semana
- [ ] Usuarios notificados del cambio
- [ ] Backup CSV guardado de forma segura
- [ ] `wholesalers_backup` tabla existe como respaldo

**Solo entonces:**
- [ ] Eliminar vista de compatibilidad
- [ ] (Después de 1 mes) Eliminar `wholesalers_backup`

---

## 📊 MÉTRICAS DE ÉXITO

- ✅ 100% de mayoristas migrados
- ✅ 0 errores de login después de migración
- ✅ 0 pérdida de datos
- ✅ Descuentos funcionan igual que antes
- ✅ Performance igual o mejor
- ✅ Una sola tabla para todos los usuarios

---

**¡Migración completada! 🎉**

*Creado: 2025-01-07*
*Versión: 1.0*

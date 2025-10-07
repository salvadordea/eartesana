# ⚡ Quick Start - Migración wholesalers → user_profiles

## 🎯 En 5 pasos:

### 1️⃣ BACKUP (5 min)

```
1. Ve a Supabase Dashboard
2. Table Editor → wholesalers
3. Click "..." → Export CSV
4. Guarda como: wholesalers_backup_YYYY-MM-DD.csv
```

✅ **Verificar**: Tienes el archivo CSV guardado

---

### 2️⃣ FASE 1 - Agregar Campos (1 min)

**Abrir archivo:** `sql/migration/01-add-wholesale-fields.sql`

**Copiar TODO el contenido** y pegarlo en Supabase SQL Editor, luego ejecutar.

✅ **Verificar**:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name = 'wholesale_discount_percent';
```

---

### 3️⃣ FASE 2 - Vista de Compatibilidad (30 seg)

**Abrir archivo:** `sql/migration/02-create-compatibility-view.sql`

**Copiar TODO el contenido** y pegarlo en Supabase SQL Editor, luego ejecutar.

✅ **Verificar**:
```sql
SELECT * FROM wholesalers_compat LIMIT 1;
```

---

### 4️⃣ FASE 3 - Migrar Datos (2 min)

⚠️ **LEE EL SCRIPT PRIMERO**

**Abrir archivo:** `sql/migration/03-migrate-wholesalers-data.sql`

**Copiar TODO el contenido** y pegarlo en Supabase SQL Editor, luego ejecutar.

✅ **Verificar**:
```sql
-- Deben coincidir:
SELECT COUNT(*) FROM user_profiles WHERE role = 'Mayorista';
SELECT COUNT(*) FROM wholesalers_backup;
```

---

### 5️⃣ TESTING (10 min)

1. **Admin Login**: `http://localhost:8000/admin/login.html`
   - Login como admin
   - Ve a sección "Mayoristas"
   - ✅ Se muestran mayoristas migrados

2. **Mayorista Login**: `http://localhost:8000/mayoristas/login.html`
   - Login con email de mayorista
   - Password temporal: `TempPass2024!`
   - ✅ Funciona el login

3. **Crear nuevo mayorista**:
   - Admin Dashboard → Mayoristas → "Nuevo"
   - ✅ Se crea en user_profiles

---

## ✅ LISTO!

### Cambios aplicados:

- ✅ Tabla `wholesalers` renombrada a `wholesalers_backup`
- ✅ Mayoristas migrados a `user_profiles` con role='Mayorista'
- ✅ Admin Dashboard usa `user_profiles`
- ✅ Login de mayoristas funcional con Supabase Auth

### Próximos pasos:

1. **Notificar mayoristas** de password temporal
2. **Testing por 1 semana**
3. **Después**: Eliminar vista compatibilidad y tabla backup

---

## 🆘 Si algo sale mal:

**ROLLBACK - Restaurar todo (en orden inverso):**

1. Abrir `sql/migration/03-rollback.sql` → Copiar y ejecutar en Supabase
2. Abrir `sql/migration/02-rollback.sql` → Copiar y ejecutar en Supabase
3. Abrir `sql/migration/01-rollback.sql` → Copiar y ejecutar en Supabase

---

**Tiempo total: ~20 minutos**

# 🔒 Fix RLS Errors - Políticas de Seguridad

## 🎯 Problemas

### Error 1: "new row violates row-level security policy"
Al crear usuarios desde el panel de admin.

### Error 2: "infinite recursion detected in policy for relation user_profiles"
Al cargar usuarios en el panel de admin.

## ✅ Solución (1 paso - 2 minutos)

### ⚠️ IMPORTANTE: Usa el script correcto

**Archivo:** `sql/fix-rls-recursion.sql` ← **USA ESTE**

~~NO uses: `sql/setup-user-profiles-rls.sql`~~ (tiene el bug de recursión)

**Instrucciones:**
1. Abrir el archivo `sql/fix-rls-recursion.sql`
2. Copiar TODO el contenido
3. Ir a Supabase Dashboard → SQL Editor
4. Pegar y ejecutar

**Qué hace el script:**
- ✅ Elimina TODAS las políticas antiguas (que causaban recursión)
- ✅ Crea función helper `is_admin()` con SECURITY DEFINER (evita recursión)
- ✅ Crea políticas RLS simplificadas usando la función helper
- ✅ Crea trigger automático que genera perfil cuando se crea usuario Auth
- ✅ Permite a admins crear/ver/editar todos los usuarios
- ✅ Permite a usuarios ver/editar solo su propio perfil

---

## 🔍 Cómo Funciona

### El Problema de Recursión:
```
Policy: "Admin can view all" → Checks: SELECT role FROM user_profiles WHERE id = auth.uid()
                              → Triggers SAME policy again → Infinite loop! ❌
```

### La Solución (SECURITY DEFINER):
```
Policy: "Admin can view all" → Calls: is_admin(auth.uid())
                              → Function uses SECURITY DEFINER (bypasses RLS)
                              → Returns true/false → No recursion! ✅
```

### Flujo Completo:
```
Admin crea usuario → supabase.auth.signUp() → ✅ Usuario Auth creado
                   → Trigger automático → ✅ Perfil básico creado
                   → UPDATE profile → ✅ Admin completa datos (policy usa is_admin())
```

---

## 📋 Políticas RLS Creadas

### Para Usuarios Normales:
1. ✅ Pueden ver su propio perfil
2. ✅ Pueden actualizar su propio perfil (excepto rol)

### Para Administradores:
1. ✅ Pueden ver todos los perfiles
2. ✅ Pueden crear nuevos perfiles
3. ✅ Pueden actualizar cualquier perfil
4. ✅ Pueden eliminar perfiles (excepto el suyo propio)

### Para el Sistema:
1. ✅ Trigger automático crea perfil básico en cada signup
2. ✅ Extrae el rol de `user_meta_data` si existe
3. ✅ Por defecto asigna rol 'Usuario'

---

## 🧪 Testing

Después de ejecutar el script:

1. **Ir al panel de admin**: `http://localhost:8000/admin/usuarios.html`
2. **Click en "Nuevo Usuario"**
3. **Completar formulario**:
   - Email: test@example.com
   - Password: Test123!
   - Nombre: Usuario Test
   - Rol: Usuario (o el que quieras)
4. **Click "Crear Usuario"**
5. ✅ Debería crearse sin errores

---

## ✅ Verificación

**En Supabase Dashboard:**

1. **Ver políticas creadas**:
   ```sql
   SELECT policyname, cmd FROM pg_policies
   WHERE tablename = 'user_profiles'
   ORDER BY policyname;
   ```

2. **Verificar trigger**:
   ```sql
   SELECT trigger_name, event_manipulation
   FROM information_schema.triggers
   WHERE event_object_table = 'users'
   AND trigger_schema = 'auth';
   ```

3. **Probar creación manual**:
   ```sql
   -- Como admin, deberías poder hacer esto:
   SELECT * FROM user_profiles WHERE role = 'Admin';
   ```

---

## 🆘 Troubleshooting

### Problema: "Aún no puedo crear usuarios"

**Verificar que eres admin:**
```sql
SELECT id, email, role FROM user_profiles
WHERE email = 'tu-email@example.com';
```

El rol debe ser `'Admin'` (con mayúscula).

### Problema: "Function handle_new_user already exists"

**Solución:** El script usa `CREATE OR REPLACE`, así que debería funcionar. Si sigue fallando:
```sql
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
```

Luego ejecuta el script nuevamente.

### Problema: "El usuario se crea pero sin datos adicionales"

**Esto es normal.** El flujo es:
1. Trigger crea perfil básico (email, role por defecto)
2. Admin actualiza con datos completos (nombre, teléfono, descuento, etc.)

Si ves el mensaje "Usuario creado, pero algunos datos no se guardaron", verifica:
```sql
SELECT * FROM user_profiles WHERE email = 'nuevo-email@example.com';
```

Y edita el usuario desde el panel para completar los datos.

---

## 📊 Cambios en el Código

### `admin/usuarios.html` (actualizado automáticamente)

**Antes:**
```javascript
// Intentaba INSERT directo → RLS bloqueaba
await supabase.from('user_profiles').insert([...]);
```

**Ahora:**
```javascript
// 1. signUp crea usuario Auth → trigger crea perfil básico
await supabase.auth.signUp({ email, password, options: { data: { role } } });

// 2. UPDATE completa el perfil (RLS permite porque eres admin)
await supabase.from('user_profiles').update({ ...datos }).eq('id', userId);
```

---

## ✅ LISTO!

Después de ejecutar `sql/setup-user-profiles-rls.sql`, el panel de admin podrá crear usuarios sin problemas.

**Tiempo:** 2 minutos
**Dificultad:** Baja (solo copiar/pegar SQL)

---

**Fecha:** 2025-01-07
**Versión:** 1.0

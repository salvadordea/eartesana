# 🚀 Inicio Limpio - Solo Datos de Prueba

## ⚡ Para cuando NO tienes datos importantes

Si **todos tus datos son de prueba**, usa este proceso super simple.

---

## 📋 PROCESO (3 pasos - 2 minutos)

### 1️⃣ Ejecutar Script Limpio

**Archivo:** `sql/migration/00-clean-start.sql`

**Instrucciones:**
1. Abrir el archivo en tu editor
2. Copiar TODO el contenido
3. Ir a Supabase Dashboard → SQL Editor
4. Pegar y ejecutar

**Qué hace:**
- ✅ Agrega campos a `user_profiles` para mayoristas
- ✅ Elimina tabla `wholesalers` completamente
- ✅ Ya está listo para usar

---

### 2️⃣ Crear Primer Mayorista

**En Admin Dashboard:**

1. Ir a `http://localhost:8000/admin/login.html`
2. Login como admin
3. Click en sección "Mayoristas"
4. Click "Nuevo Mayorista"
5. Llenar formulario:
   - Nombre: Juan Pérez
   - Email: juan@empresa.com
   - Empresa: Empresa ABC
   - Teléfono: +52 123 456 7890
   - Descuento: 20%
   - Estado: Activo
6. Guardar

✅ **Se crea en `user_profiles` con role='Mayorista'**

---

### 3️⃣ Probar Login de Mayorista

**IMPORTANTE:** El mayorista necesita establecer su contraseña primero.

**Opción A: Desde Supabase Dashboard**
1. Supabase → Authentication → Users
2. Buscar email del mayorista
3. Click "..." → Reset password
4. Copiar link de reset
5. Enviar al mayorista (o usar tú mismo para prueba)

**Opción B: Usar Password Recovery**
1. Ir a `/mayoristas/login.html`
2. Click "¿Olvidaste tu contraseña?"
3. Ingresar email
4. Revisar email (o Supabase logs) para link

**Luego:**
1. Mayorista va a `/mayoristas/login.html`
2. Login con email y nueva contraseña
3. ✅ Funciona!

---

## ✅ LISTO!

### Estado Final:

- ✅ Tabla `wholesalers` eliminada
- ✅ `user_profiles` tiene campos para mayoristas
- ✅ Admin puede crear mayoristas desde dashboard
- ✅ Mayoristas usan Supabase Auth
- ✅ Sistema unificado funcionando

---

## 🎯 Crear Más Mayoristas

Siempre desde Admin Dashboard:
1. Mayoristas → "Nuevo Mayorista"
2. Llenar formulario
3. Guardar
4. Notificar al mayorista para que establezca su contraseña

---

## 📊 Ventajas de Este Enfoque

✅ **Ultra simple** - 1 script, 2 minutos
✅ **Sin migración compleja** - No hay datos que migrar
✅ **Sin errores de sintaxis** - Script mínimo y probado
✅ **Producción-ready** - Sistema correcto desde el inicio
✅ **Escalable** - Cuando crezca, ya está bien estructurado

---

## 🆘 Troubleshooting

### Problema: "No puedo crear mayorista"

**Verificar:**
```sql
-- ¿Existen los campos?
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name LIKE 'wholesale%';
```

### Problema: "Mayorista no puede hacer login"

**Verificar:**
```sql
-- ¿Existe el usuario?
SELECT id, email, role FROM user_profiles
WHERE email = 'email@mayorista.com';
```

**Solución:** Resetear password desde Supabase Dashboard

---

**Tiempo total: 2-5 minutos** ⚡

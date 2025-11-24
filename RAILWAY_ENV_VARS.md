# 🔐 Variables de Entorno para Railway - Configuración Exacta

## 📍 Dónde Configurarlas

1. Ve a https://railway.app
2. Abre tu proyecto
3. Click en tu servicio (backend)
4. Tab **"Variables"**
5. Click **"+ New Variable"** o **"Raw Editor"**

---

## ✅ OPCIÓN 1: Raw Editor (Recomendado - Más Rápido)

Click en **"Raw Editor"** y pega esto **COMPLETO**, reemplazando los valores entre `<...>`:

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://<tu-dominio>.vercel.app

EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<tu-email>@gmail.com
EMAIL_PASS=<tu-app-password-de-16-caracteres>
EMAIL_FROM=sistema@estudioartesana.com
ADMIN_EMAIL=<tu-email-admin>@estudioartesana.com

SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<empieza-con-eyJ...>

ENVIA_API_KEY=<tu-key-de-envia>
ENVIA_BASE_URL=https://queries.envia.com/api/1.0
ORIGIN_ZIP_CODE=01000
ORIGIN_COUNTRY=MX

DEFAULT_PACKAGE_LENGTH=30
DEFAULT_PACKAGE_WIDTH=20
DEFAULT_PACKAGE_HEIGHT=15
DEFAULT_PACKAGE_WEIGHT=500

SHIPPING_CACHE_TTL_HOURS=24
ENVIA_SANDBOX_MODE=false
```

---

## 📝 OPCIÓN 2: Una por Una

Si prefieres agregar una por una, aquí está cada variable explicada:

### **🖥️ Servidor**

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Indica que estamos en producción |
| `PORT` | `3000` | Puerto del servidor (Railway lo detecta automáticamente) |
| `FRONTEND_URL` | `https://tu-sitio.vercel.app` | URL de tu frontend en Vercel (actualizas después) |

### **📧 Email (Gmail)**

| Variable | Valor | Dónde Obtenerlo |
|----------|-------|-----------------|
| `EMAIL_SERVICE` | `gmail` | Fijo |
| `EMAIL_HOST` | `smtp.gmail.com` | Fijo |
| `EMAIL_PORT` | `587` | Fijo |
| `EMAIL_USER` | `tu-email@gmail.com` | Tu email de Gmail |
| `EMAIL_PASS` | `abcd efgh ijkl mnop` | **App Password** (ver abajo ⬇️) |
| `EMAIL_FROM` | `sistema@estudioartesana.com` | Email que aparece como remitente |
| `ADMIN_EMAIL` | `admin@estudioartesana.com` | Email que recibe las notificaciones |

#### 🔑 **Cómo obtener EMAIL_PASS (App Password de Gmail):**

1. Ve a https://myaccount.google.com/apppasswords
2. Si pide verificación en 2 pasos, actívala primero
3. En "Select app" → Elige **"Mail"**
4. En "Select device" → Elige **"Other"** → Escribe "Railway Backend"
5. Click **"Generate"**
6. Gmail te da una contraseña de 16 caracteres: `abcd efgh ijkl mnop`
7. **Copia esa contraseña** (con o sin espacios, da igual)
8. Pégala en `EMAIL_PASS`

### **🗄️ Supabase**

| Variable | Valor | Dónde Obtenerlo |
|----------|-------|-----------------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1Ni...` | Supabase → Settings → API → service_role key |

#### 📍 **Cómo obtener credenciales de Supabase:**

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Menú lateral → **Settings** (ícono de engranaje)
4. Click en **API**
5. Verás:
   ```
   Project URL: https://abcdefgh.supabase.co
   ```
   → Copia esto para `SUPABASE_URL`

6. Baja hasta **Project API keys**
7. Busca **`service_role`** (NO uses `anon` public)
8. Click en el ícono de ojo 👁️ para revelar la key
9. Copia el valor completo (empieza con `eyJ...`)
   → Pega esto en `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **IMPORTANTE:** Usa **service_role** (no anon). El backend necesita permisos completos.

### **📦 Envia.com**

| Variable | Valor | Dónde Obtenerlo |
|----------|-------|-----------------|
| `ENVIA_API_KEY` | `abc123xyz...` | Envia.com → Configuración → API |
| `ENVIA_BASE_URL` | `https://queries.envia.com/api/1.0` | Fijo (URL de producción) |
| `ORIGIN_ZIP_CODE` | `01000` | Tu código postal (bodega/almacén) |
| `ORIGIN_COUNTRY` | `MX` | Fijo |

#### 📍 **Cómo obtener ENVIA_API_KEY:**

1. Ve a https://ship.envia.com
2. Inicia sesión
3. Click en tu perfil (arriba derecha)
4. **Configuración** → **API**
5. Verás tu **API Key**
6. Click **"Copiar"**
7. Pégala en `ENVIA_API_KEY`

⚠️ **Modo Sandbox vs Producción:**
- En **pruebas**: Envia te da una API key de sandbox
- En **producción**: Necesitas activar tu cuenta y obtener la key de producción
- `ENVIA_SANDBOX_MODE=false` indica producción
- `ENVIA_SANDBOX_MODE=true` indica sandbox/pruebas

### **📏 Paquetes (Valores por Defecto)**

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DEFAULT_PACKAGE_LENGTH` | `30` | Largo en cm |
| `DEFAULT_PACKAGE_WIDTH` | `20` | Ancho en cm |
| `DEFAULT_PACKAGE_HEIGHT` | `15` | Alto en cm |
| `DEFAULT_PACKAGE_WEIGHT` | `500` | Peso en gramos |

Estos se usan cuando no se especifican dimensiones. Puedes ajustarlos según tus productos.

### **⚙️ Configuración**

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `SHIPPING_CACHE_TTL_HOURS` | `24` | Cuántas horas cachear cotizaciones |
| `ENVIA_SANDBOX_MODE` | `false` | `true` = pruebas, `false` = producción |

---

## ✅ Ejemplo Completo con Valores Reales

```env
# === SERVIDOR ===
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://estartesana.vercel.app

# === EMAIL ===
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=contacto@estudioartesana.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=sistema@estudioartesana.com
ADMIN_EMAIL=admin@estudioartesana.com

# === SUPABASE ===
SUPABASE_URL=https://xkcdabcdefgh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY2RhYmNkZWZnaCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2ODk1MjQ2NDAsImV4cCI6MjAwNTEwMDY0MH0.abc123xyz...

# === ENVIA.COM ===
ENVIA_API_KEY=sk_test_abc123xyz456
ENVIA_BASE_URL=https://queries.envia.com/api/1.0
ORIGIN_ZIP_CODE=01000
ORIGIN_COUNTRY=MX

# === PAQUETES ===
DEFAULT_PACKAGE_LENGTH=30
DEFAULT_PACKAGE_WIDTH=20
DEFAULT_PACKAGE_HEIGHT=15
DEFAULT_PACKAGE_WEIGHT=500

# === CONFIGURACIÓN ===
SHIPPING_CACHE_TTL_HOURS=24
ENVIA_SANDBOX_MODE=false
```

---

## 🔍 Verificar que Estén Correctas

Después de configurarlas en Railway:

### 1. **Verifica que se guardaron:**
   - En Railway → Variables
   - Debes ver todas las variables listadas
   - Los valores NO deben decir `<...>`

### 2. **Inicia el deploy:**
   - Railway deployará automáticamente
   - Ve a **Deployments**
   - Espera a que diga **"Success"**

### 3. **Verifica en los logs:**
   - Click en tu deployment
   - Ve a **View Logs**
   - Busca líneas como:
     ```
     ✅ Email service configured
     ✅ Supabase configured
     ✅ Envia.com configured
     Server running on port 3000
     ```

### 4. **Prueba el endpoint:**
   Abre en tu navegador:
   ```
   https://tu-proyecto.up.railway.app/api/shipping/carriers
   ```

   Debes ver:
   ```json
   {
     "success": true,
     "carriers": [...]
   }
   ```

---

## ⚠️ Errores Comunes

### ❌ **"Application failed to respond"**

**Causa:** Variable mal configurada o faltante

**Solución:**
1. Ve a Railway → Logs
2. Busca el error específico
3. Usualmente es `SUPABASE_SERVICE_ROLE_KEY` o `ENVIA_API_KEY`
4. Verifica que las copiaste completas (sin espacios extras)

### ❌ **"EAUTH" en logs**

**Causa:** Email password incorrecta

**Solución:**
1. Verifica `EMAIL_PASS`
2. Debe ser la **App Password** (16 caracteres)
3. NO tu contraseña normal de Gmail

### ❌ **"Invalid API key" de Envia**

**Causa:** API key incorrecta o en modo sandbox

**Solución:**
1. Verifica en https://ship.envia.com → API
2. Si estás en pruebas, usa `ENVIA_SANDBOX_MODE=true`
3. Si estás en producción, usa la API key de producción

---

## 🎯 Checklist de Verificación

Marca cuando tengas cada valor:

- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3000`
- [ ] `FRONTEND_URL` = tu URL de Vercel
- [ ] `EMAIL_USER` = tu email real
- [ ] `EMAIL_PASS` = App Password de 16 caracteres
- [ ] `SUPABASE_URL` = tu URL de Supabase (termina en .supabase.co)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = empieza con `eyJ...` (es LARGO)
- [ ] `ENVIA_API_KEY` = tu API key de Envia.com
- [ ] Todas las demás variables están configuradas

---

## 💡 Tips

1. **FRONTEND_URL:** Puedes configurarla como `*` temporalmente y actualizarla después del deploy de Vercel

2. **ORIGIN_ZIP_CODE:** Usa el código postal de donde enviarás los paquetes (tu bodega/casa)

3. **Service Role Key:** Es una clave LARGA (varios cientos de caracteres). Es normal.

4. **App Password:** Si Gmail no te deja crear App Passwords, activa primero la verificación en 2 pasos

5. **Sandbox Mode:**
   - `true` para pruebas (no genera guías reales, no cobra)
   - `false` para producción (genera guías reales, cobra)

---

## 📸 Captura de Referencia

En Railway, debería verse así:

```
Variables (23)

NODE_ENV                          production
PORT                             3000
FRONTEND_URL                     https://estartesana.vercel.app
EMAIL_SERVICE                    gmail
EMAIL_HOST                       smtp.gmail.com
...
(y así sucesivamente)
```

---

**¿Listo para configurarlas?** Copia el bloque de arriba (OPCIÓN 1) y pégalo en Railway → Raw Editor 🚀

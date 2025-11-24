# 🚂 Deploy Directo a Railway - Guía Rápida

Pasos específicos para subir el backend a Railway sin complicaciones.

---

## ✅ Pre-requisitos

- [ ] Cuenta de GitHub (con tu repositorio)
- [ ] Cuenta de Railway (https://railway.app - gratis con GitHub)
- [ ] API Key de Envia.com
- [ ] Credenciales de Supabase

---

## 🚀 PASO 1: Preparar el Repositorio

### 1.1 Asegúrate de que estos archivos existan en `backend/`:

```
backend/
├── email-service.js       ✅
├── shipping-service.js    ✅
├── package.json           ✅
├── .env.example           ✅
└── railway.json           ✅ (recién creado)
```

### 1.2 Commit y push al repositorio

```bash
cd C:\github\artesana\estartesana

git add .
git commit -m "Ready for Railway deploy"
git push origin main
```

---

## 🚂 PASO 2: Crear Proyecto en Railway

### 2.1 Ir a Railway
1. Abre https://railway.app
2. Click en **"Start a New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Conecta tu cuenta de GitHub si no lo has hecho
5. Selecciona el repositorio: **`artesana/estartesana`**

### 2.2 Configurar el proyecto
Railway detectará automáticamente que es un proyecto Node.js.

**IMPORTANTE:** Configura el **Root Directory**:
- Click en el servicio creado
- Ve a **Settings** → **Service Settings**
- En **Root Directory** escribe: `backend`
- Click **Save**

---

## ⚙️ PASO 3: Configurar Variables de Entorno

En Railway → Tu proyecto → **Variables**

Copia y pega estas variables, **reemplazando con tus valores reales**:

```env
# Node Environment
NODE_ENV=production

# Server Config
PORT=3000

# Frontend URL (actualizarás esto después de deploy en Vercel)
FRONTEND_URL=https://estartesana.vercel.app

# === EMAIL CONFIGURATION ===
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password-aqui
EMAIL_FROM=sistema@estudioartesana.com
ADMIN_EMAIL=admin@estudioartesana.com

# === SUPABASE ===
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# === ENVIA.COM ===
ENVIA_API_KEY=tu-envia-api-key-aqui
ENVIA_BASE_URL=https://queries.envia.com/api/1.0
ORIGIN_ZIP_CODE=01000
ORIGIN_COUNTRY=MX

# Package Defaults
DEFAULT_PACKAGE_LENGTH=30
DEFAULT_PACKAGE_WIDTH=20
DEFAULT_PACKAGE_HEIGHT=15
DEFAULT_PACKAGE_WEIGHT=500

# Cache
SHIPPING_CACHE_TTL_HOURS=24

# Sandbox Mode (false para producción)
ENVIA_SANDBOX_MODE=false
```

### 📝 **Cómo obtener cada valor:**

#### **Email (Gmail):**
1. Ve a https://myaccount.google.com/apppasswords
2. Crea una nueva "App Password"
3. Usa esa contraseña en `EMAIL_PASS`

#### **Supabase:**
1. Ve a tu proyecto en https://supabase.com
2. Settings → API
3. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

#### **Envia.com:**
1. Inicia sesión en https://ship.envia.com
2. Ve a Configuración → API
3. Copia tu API Key → `ENVIA_API_KEY`

---

## 🚀 PASO 4: Deploy

Railway empezará a deployar automáticamente después de configurar las variables.

### 4.1 Ver el Deploy
- Ve a **Deployments** para ver el progreso
- Espera a que diga **"Success"** (toma 2-3 minutos)

### 4.2 Obtener la URL
- Ve a **Settings** → **Domains**
- Railway te asigna una URL automáticamente:
  ```
  https://tu-proyecto-production.up.railway.app
  ```
- **¡COPIA ESTA URL!** La necesitarás en el siguiente paso

---

## 🔧 PASO 5: Actualizar Frontend Config

### 5.1 Editar `assets/js/backend-config.js`

En tu computadora local, abre:
```
C:\github\artesana\estartesana\assets\js\backend-config.js
```

Línea 18, reemplaza:
```javascript
// ANTES:
const PRODUCTION_BACKEND_URL = 'https://tu-app.up.railway.app';

// DESPUÉS (con tu URL real de Railway):
const PRODUCTION_BACKEND_URL = 'https://tu-proyecto-production.up.railway.app';
```

### 5.2 Commit y push
```bash
git add assets/js/backend-config.js
git commit -m "Update production backend URL"
git push origin main
```

---

## 🌐 PASO 6: Deploy Frontend en Vercel

### 6.1 Ir a Vercel
1. Abre https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import tu repositorio de GitHub
4. Configura:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (dejar vacío)
   - **Build Command:** (dejar vacío)
   - **Output Directory:** `./` (dejar vacío)

### 6.2 Deploy
- Click **"Deploy"**
- Espera 1-2 minutos
- Vercel te dará una URL: `https://estartesana.vercel.app`

---

## ✅ PASO 7: Actualizar CORS en Backend

### 7.1 Editar `backend/shipping-service.js`

Busca la línea ~40 donde dice `corsOptions`:

```javascript
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [
            'https://estartesana.vercel.app',        // ← Tu URL de Vercel
            'https://www.estudioartesana.com'        // ← Tu dominio personalizado (opcional)
          ]
        : '*',
    credentials: true,
    optionsSuccessStatus: 200
};
```

### 7.2 Lo mismo en `backend/email-service.js`

Busca la sección de CORS y actualiza igual.

### 7.3 Commit y push
```bash
git add backend/
git commit -m "Update CORS for production"
git push origin main
```

Railway re-deployará automáticamente (toma 1-2 minutos).

---

## 🧪 PASO 8: Probar que Todo Funcione

### 8.1 Probar Backend

Abre en tu navegador:
```
https://tu-proyecto-production.up.railway.app/api/shipping/carriers
```

Deberías ver:
```json
{
  "success": true,
  "carriers": [...]
}
```

### 8.2 Probar Frontend

1. Abre tu sitio en Vercel: `https://estartesana.vercel.app`
2. Ve al checkout
3. Intenta calcular envío
4. Si funciona → ✅ **¡TODO LISTO!**

### 8.3 Probar Admin

1. Ve a `https://estartesana.vercel.app/admin/pedidos.html`
2. Intenta generar una guía de envío
3. Debe funcionar sin errores

---

## 🔒 PASO 9: Configurar Webhook de Envia.com

1. Ve a https://ship.envia.com
2. Configuración → Webhooks
3. Agregar nuevo webhook:
   ```
   URL: https://tu-proyecto-production.up.railway.app/api/shipping/webhook
   ```
4. Selecciona eventos:
   - ✅ Shipment created
   - ✅ Shipment in transit
   - ✅ Shipment delivered
   - ✅ Shipment failed

---

## 📊 PASO 10: Monitoreo

### En Railway:
- **Metrics**: Ve uso de CPU, RAM, requests
- **Logs**: Ver logs en tiempo real
- **Deployments**: Historial de deploys

### En Vercel:
- **Analytics**: Tráfico del sitio
- **Logs**: Errores del frontend

---

## 🚨 Troubleshooting

### Error: "Application failed to respond"

**Causa:** El backend no arrancó correctamente

**Solución:**
1. Ve a Railway → Logs
2. Revisa el error
3. Usualmente es una variable de entorno faltante
4. Verifica que todas las variables estén configuradas

### Error: "CORS policy blocked"

**Causa:** El dominio de Vercel no está permitido en CORS

**Solución:**
1. Edita `backend/shipping-service.js`
2. Agrega tu dominio de Vercel al array de origins
3. Push y espera redeploy

### Error: "Cannot find module"

**Causa:** Dependencias no instaladas

**Solución:**
1. Verifica que `package.json` esté en `backend/`
2. Railway debe ejecutar `npm install` automáticamente
3. Revisa logs en Railway

### Backend funciona pero frontend no lo encuentra

**Causa:** `backend-config.js` no actualizado

**Solución:**
1. Verifica que `PRODUCTION_BACKEND_URL` tenga la URL correcta de Railway
2. Verifica que el archivo esté cargado en el HTML
3. Abre DevTools → Console para ver errores

---

## ✅ Checklist Final

- [ ] Backend deployado en Railway
- [ ] Variables de entorno configuradas
- [ ] URL de Railway copiada
- [ ] `backend-config.js` actualizado con URL de Railway
- [ ] Frontend deployado en Vercel
- [ ] CORS actualizado con dominio de Vercel
- [ ] Webhook de Envia.com configurado
- [ ] Pruebas de checkout funcionan
- [ ] Pruebas de admin funcionan
- [ ] **🎉 ¡PRODUCCIÓN LISTA!**

---

## 💰 Costos

- **Railway:** $5/mes (después del crédito inicial de $5)
- **Vercel:** Gratis
- **Supabase:** Gratis
- **Envia.com:** Por uso (~$50-150 MXN por guía)

**Total:** ~$5/mes + costo de envíos

---

## 📞 ¿Problemas?

Si algo no funciona:

1. **Revisa logs en Railway** (90% de los problemas se ven ahí)
2. **Abre DevTools en el navegador** → Console
3. **Verifica variables de entorno** (todas deben estar configuradas)
4. **Verifica CORS** (debe incluir tu dominio de Vercel)

---

## 🎯 Próximos Pasos

Una vez que todo funciona:

1. **Configura dominio personalizado** en Vercel (opcional)
2. **Prueba todo el flujo** de compra y envío
3. **Monitorea uso** en Railway dashboard
4. **¡Empieza a vender!** 🚀

---

**¡Éxito con tu deploy!** 🎉

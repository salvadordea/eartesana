# 🆓 Deploy 100% Gratuito - Opciones Sin Costo

Railway ya no es gratis, pero hay **excelentes alternativas gratuitas**.

---

## 🎯 **OPCIÓN 1: Render.com (Recomendada - Más Fácil)**

### ✅ **Ventajas:**
- ✅ **100% Gratis** (plan Free forever)
- ✅ Muy similar a Railway (fácil de usar)
- ✅ 750 horas gratis al mes (suficiente para 1 servicio 24/7)
- ✅ Deploy automático desde GitHub
- ✅ SSL gratis
- ✅ Buenos para Node.js

### ⚠️ **Limitaciones:**
- Después de 15 min de inactividad, se "duerme"
- Primera request tarda ~30 segundos en despertar
- Suficiente para MVP y sitios pequeños

### 📋 **Cómo Deployar en Render:**

1. **Ir a https://render.com**
2. **Sign up** con GitHub (gratis)
3. **New +** → **Web Service**
4. **Connect GitHub** → Selecciona tu repo `estartesana`
5. **Configurar:**
   ```
   Name: estartesana-backend
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```
6. **Plan:** Selecciona **Free**
7. **Advanced** → Agregar variables de entorno (mismo bloque que Railway)
8. **Create Web Service**

**URL resultante:** `https://estartesana-backend.onrender.com`

---

## 🎯 **OPCIÓN 2: Vercel Serverless Functions**

### ✅ **Ventajas:**
- ✅ **100% Gratis**
- ✅ TODO en Vercel (frontend + backend)
- ✅ Sin sleep/dormirse
- ✅ Respuestas instantáneas
- ✅ 100GB bandwidth gratis

### ⚠️ **Limitaciones:**
- Requiere reestructurar el código a serverless functions
- Timeout de 10 segundos por request (plan gratis)

### 📋 **Cómo Implementar:**

Necesitas crear una carpeta `api/` en la raíz con funciones serverless.

**Estructura:**
```
estartesana/
├── api/
│   ├── shipping/
│   │   ├── quote.js
│   │   ├── create.js
│   │   └── track.js
│   └── email/
│       └── send.js
├── assets/
├── backend/ (ya no se usa)
└── ...
```

Te ayudo a convertir el código si eliges esta opción.

---

## 🎯 **OPCIÓN 3: Cyclic.sh**

### ✅ **Ventajas:**
- ✅ **100% Gratis**
- ✅ No se duerme
- ✅ Deploy super rápido
- ✅ Específico para Node.js

### ⚠️ **Limitaciones:**
- Menos conocido
- 10,000 requests/mes (suficiente para empezar)

### 📋 **Cómo Deployar:**

1. **Ir a https://cyclic.sh**
2. **Sign in** con GitHub
3. **Deploy** → Selecciona tu repo
4. **Root Directory:** `backend`
5. **Variables de entorno** → Mismo bloque
6. **Deploy**

---

## 🎯 **OPCIÓN 4: Glitch.com**

### ✅ **Ventajas:**
- ✅ **100% Gratis**
- ✅ Editor en línea
- ✅ Muy fácil para principiantes

### ⚠️ **Limitaciones:**
- Se duerme después de 5 min de inactividad
- 4000 horas gratis/mes

---

## 🎯 **OPCIÓN 5: Fly.io**

### ✅ **Ventajas:**
- ✅ **Gratis** hasta cierto punto
- ✅ 3 VMs gratis
- ✅ No se duerme
- ✅ Muy rápido

### ⚠️ **Limitaciones:**
- Requiere tarjeta de crédito (pero no cobra si no excedes límites)
- Un poco más técnico

---

## 🏆 **MI RECOMENDACIÓN: Render.com**

Es la más fácil y no requiere cambiar tu código.

---

## 📦 **GUÍA PASO A PASO: RENDER.COM**

### **PASO 1: Crear Cuenta**

1. Ve a https://render.com
2. Click **Get Started**
3. Sign up con GitHub
4. Autoriza Render a acceder a tus repos

### **PASO 2: Crear Web Service**

1. Dashboard → **New +** → **Web Service**
2. **Connect a repository** → Selecciona `estartesana`
3. Click **Connect**

### **PASO 3: Configurar el Servicio**

```
Name: estartesana-backend
Region: Oregon (US West) - el más cercano a México
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### **PASO 4: Plan**

- Selecciona **Free** (no pide tarjeta)
- Click **Advanced**

### **PASO 5: Variables de Entorno**

Click **Add Environment Variable** y agrega **una por una**:

```
NODE_ENV = production
PORT = 3000
FRONTEND_URL = https://estartesana.vercel.app

EMAIL_SERVICE = gmail
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = tu-email@gmail.com
EMAIL_PASS = tu-app-password
EMAIL_FROM = sistema@estudioartesana.com
ADMIN_EMAIL = admin@estudioartesana.com

SUPABASE_URL = https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJ...

ENVIA_API_KEY = tu-api-key
ENVIA_BASE_URL = https://queries.envia.com/api/1.0
ORIGIN_ZIP_CODE = 01000
ORIGIN_COUNTRY = MX

DEFAULT_PACKAGE_LENGTH = 30
DEFAULT_PACKAGE_WIDTH = 20
DEFAULT_PACKAGE_HEIGHT = 15
DEFAULT_PACKAGE_WEIGHT = 500

SHIPPING_CACHE_TTL_HOURS = 24
ENVIA_SANDBOX_MODE = false
```

### **PASO 6: Deploy**

1. Click **Create Web Service**
2. Render empezará a deployar (tarda 3-5 minutos)
3. Ve el progreso en **Logs**
4. Cuando termine, verás **"Your service is live"**

### **PASO 7: Obtener URL**

Tu URL será:
```
https://estartesana-backend.onrender.com
```

### **PASO 8: Actualizar Frontend**

Edita `assets/js/backend-config.js` línea 18:

```javascript
const PRODUCTION_BACKEND_URL = 'https://estartesana-backend.onrender.com';
```

### **PASO 9: Actualizar CORS**

En `backend/shipping-service.js` y `backend/email-service.js`:

```javascript
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [
            'https://estartesana.vercel.app',
            'https://www.estudioartesana.com'
          ]
        : '*',
    credentials: true,
    optionsSuccessStatus: 200
};
```

### **PASO 10: Push a GitHub**

```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

Render re-deployará automáticamente.

---

## 🚨 **Limitación del Plan Gratis de Render**

### **El servicio se "duerme":**

Después de **15 minutos** sin recibir requests, Render pone tu servicio a "dormir".

**¿Qué significa?**
- La primera request después de dormir tarda **20-30 segundos**
- Las siguientes requests son instantáneas
- Si tu sitio recibe tráfico constante, nunca se duerme

**Soluciones:**

1. **Usar un ping service gratis:**
   - https://cron-job.org (gratis)
   - Configura que haga ping cada 10 minutos a:
     ```
     https://estartesana-backend.onrender.com/api/shipping/carriers
     ```
   - Mantiene tu servicio siempre despierto

2. **Avisar a los usuarios:**
   - En checkout: "Calculando envío, puede tardar un momento..."
   - Primera carga tarda, luego es rápido

3. **Upgrade a plan pago en futuro:**
   - Cuando tengas ventas, $7/mes quita el sleep
   - No es obligatorio para empezar

---

## 🎯 **Comparación Rápida**

| Servicio | Gratis | Sleep | Fácil | Sin Tarjeta |
|----------|--------|-------|-------|-------------|
| **Render** | ✅ | Sí (15min) | ⭐⭐⭐⭐⭐ | ✅ |
| **Cyclic** | ✅ | No | ⭐⭐⭐⭐ | ✅ |
| **Vercel Functions** | ✅ | No | ⭐⭐⭐ | ✅ |
| **Fly.io** | ✅ | No | ⭐⭐ | ❌ |
| **Glitch** | ✅ | Sí (5min) | ⭐⭐⭐⭐ | ✅ |

---

## 💡 **Mi Recomendación Final**

Para empezar **AHORA** sin costo:

1. **Render.com** - El código funciona sin cambios
2. **Configura cron-job.org** - Para evitar el sleep
3. **Deploy en Vercel** - El frontend
4. **¡Listo!** - 100% gratis

Cuando tengas ingresos, upgrade a Render por $7/mes (opcional).

---

## 📋 **Checklist para Render**

- [ ] Crear cuenta en https://render.com
- [ ] New Web Service → Conectar repo
- [ ] Root Directory: `backend`
- [ ] Configurar variables de entorno
- [ ] Plan: Free
- [ ] Deploy
- [ ] Copiar URL: `https://_____.onrender.com`
- [ ] Actualizar `backend-config.js`
- [ ] Actualizar CORS
- [ ] Push a GitHub
- [ ] (Opcional) Configurar cron-job.org

---

## 🆘 **¿Prefieres Otra Opción?**

Si quieres que te ayude a configurar:
- **Vercel Serverless** (sin sleep, pero requiere reestructurar)
- **Cyclic.sh** (sin sleep, fácil)
- **Otra alternativa**

Solo dime cuál prefieres y te hago la guía específica.

---

**¿Vamos con Render.com?** Es la más fácil y funciona con tu código actual sin cambios. 🚀

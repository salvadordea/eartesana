# 🚀 Guía de Deployment - Estudio Artesana

Esta guía explica cómo desplegar la aplicación completa en producción.

---

## 📋 Arquitectura de Producción

```
┌─────────────────────────────────────────────────────────────┐
│                        USUARIOS                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (Vercel/Netlify)                  │
│  - HTML/CSS/JS estáticos                                     │
│  - CDN global                                                │
│  - HTTPS automático                                          │
│  URL: https://estudioartesana.com                           │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             ▼                            ▼
┌────────────────────────┐   ┌──────────────────────────────┐
│   BACKEND SERVICES     │   │     SUPABASE (Database)      │
│   (Railway/Render)     │   │  - PostgreSQL Database       │
│  - Email Service       │   │  - Authentication            │
│  - Shipping Service    │   │  - Storage                   │
│  - APIs REST           │   │  - Realtime subscriptions    │
│  URL: api.domain.com   │   │  URL: *.supabase.co         │
└────────────┬───────────┘   └──────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  SERVICIOS EXTERNOS                          │
│  - Envia.com (Envíos)                                       │
│  - Gmail/SMTP (Emails)                                      │
│  - Cloudinary (Imágenes)                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Opciones de Deployment

### **OPCIÓN 1: Deployment Completo (Recomendado)**

| Componente | Plataforma | Costo | Configuración |
|------------|-----------|-------|---------------|
| **Frontend** | Vercel | Gratis | ⭐⭐⭐⭐⭐ Fácil |
| **Backend** | Railway | $5/mes | ⭐⭐⭐⭐ Fácil |
| **Database** | Supabase | Gratis | ⭐⭐⭐⭐⭐ Ya configurada |
| **Imágenes** | Cloudinary | Gratis | ⭐⭐⭐⭐⭐ Ya configurada |

**Total:** ~$5/mes

---

### **OPCIÓN 2: Todo en Vercel**

| Componente | Plataforma | Costo | Configuración |
|------------|-----------|-------|---------------|
| **Frontend** | Vercel | Gratis | ⭐⭐⭐⭐⭐ Fácil |
| **Backend** | Vercel Serverless | Gratis* | ⭐⭐⭐ Media |
| **Database** | Supabase | Gratis | ⭐⭐⭐⭐⭐ Ya configurada |

**Total:** Gratis (con límites)

*Límites: 100GB bandwidth, 100 serverless functions

---

### **OPCIÓN 3: VPS Tradicional**

| Componente | Plataforma | Costo | Configuración |
|------------|-----------|-------|---------------|
| **Todo** | DigitalOcean/Linode | $12/mes | ⭐⭐ Difícil |

**Requiere:** Configuración manual de nginx, PM2, SSL, etc.

---

## 🚀 OPCIÓN 1: Deployment con Vercel + Railway (Recomendado)

Esta es la opción **más fácil, rápida y económica** para producción.

---

### **PASO 1: Preparar el Proyecto**

#### 1.1 Actualizar URLs del backend

Crea un archivo de configuración para producción:

**`assets/js/config-production.js`**
```javascript
// Backend URLs para producción
const BACKEND_CONFIG = {
    emailServiceUrl: 'https://tu-app.up.railway.app',
    shippingServiceUrl: 'https://tu-app.up.railway.app'
};
```

#### 1.2 Modificar archivos que llaman al backend

En **`checkout.html`** línea ~1178:
```javascript
// Cambiar de:
backendUrl: 'http://localhost:3001'

// A:
backendUrl: window.BACKEND_CONFIG?.shippingServiceUrl || 'http://localhost:3001'
```

En **`admin/pedidos.html`** línea ~1751:
```javascript
// Cambiar de:
const response = await fetch('http://localhost:3001/api/shipping/create', {

// A:
const backendUrl = window.BACKEND_CONFIG?.shippingServiceUrl || 'http://localhost:3001';
const response = await fetch(`${backendUrl}/api/shipping/create`, {
```

Similar para los demás archivos del admin.

#### 1.3 Cargar configuración en producción

En todos los archivos HTML que usen el backend, agregar antes de los scripts:

```html
<!-- Solo en producción -->
<script src="./assets/js/config-production.js"></script>
```

O mejor aún, usar un script que detecte el entorno:

**`assets/js/backend-config.js`**
```javascript
// Auto-detecta si estás en producción o desarrollo
const BACKEND_CONFIG = {
    emailServiceUrl: window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://tu-app.up.railway.app',

    shippingServiceUrl: window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : 'https://tu-app.up.railway.app'
};

console.log('🔧 Backend config:', BACKEND_CONFIG);
```

---

### **PASO 2: Deploy del Backend en Railway**

#### 2.1 Crear cuenta en Railway
1. Ve a https://railway.app
2. Regístrate con GitHub (gratis)
3. Obtén $5 de crédito gratis

#### 2.2 Crear nuevo proyecto

```bash
# En la carpeta backend/
git init  # Si no tienes git inicializado
git add .
git commit -m "Initial backend commit"
```

#### 2.3 Configurar Railway

En Railway dashboard:

1. **New Project** → **Deploy from GitHub repo**
2. Selecciona tu repositorio
3. Configura **Root Directory**: `backend`
4. Railway detectará automáticamente `package.json`

#### 2.4 Configurar Variables de Entorno

En Railway → **Variables**:

```env
# Servidor
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://tu-dominio.vercel.app

# Email
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password
EMAIL_FROM=sistema@estudioartesana.com
ADMIN_EMAIL=admin@estudioartesana.com

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Envia.com
ENVIA_API_KEY=tu-envia-api-key
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

#### 2.5 Configurar Start Command

Railway necesita saber cómo iniciar tu app:

**Crear `backend/Procfile`:**
```
web: npm start
```

O en Railway → **Settings** → **Start Command**:
```
npm start
```

#### 2.6 Deploy automático

Railway desplegará automáticamente y te dará una URL:
```
https://tu-app.up.railway.app
```

---

### **PASO 3: Deploy del Frontend en Vercel**

#### 3.1 Crear cuenta en Vercel
1. Ve a https://vercel.com
2. Regístrate con GitHub (gratis)

#### 3.2 Importar proyecto

1. **New Project** → **Import Git Repository**
2. Selecciona tu repositorio
3. Configura:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: (vacío, son archivos estáticos)
   - **Output Directory**: `./`

#### 3.3 Configurar dominio

Vercel te da un dominio gratis:
```
https://estartesana.vercel.app
```

O conecta tu dominio personalizado:
1. **Settings** → **Domains**
2. Agrega `estudioartesana.com`
3. Configura DNS según instrucciones

#### 3.4 Actualizar backend-config.js

Ahora que tienes las URLs reales, actualiza:

**`assets/js/backend-config.js`**
```javascript
const BACKEND_CONFIG = {
    emailServiceUrl: window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : 'https://tu-app.up.railway.app',  // ← Tu URL real de Railway

    shippingServiceUrl: window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : 'https://tu-app.up.railway.app'   // ← Tu URL real de Railway
};
```

Haz commit y push, Vercel redesplegará automáticamente.

---

### **PASO 4: Configurar CORS en el Backend**

Para que el frontend en Vercel pueda llamar al backend en Railway:

**`backend/shipping-service.js`** y **`backend/email-service.js`**:

```javascript
// CORS Configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [
            'https://estartesana.vercel.app',
            'https://estudioartesana.com',
            'https://www.estudioartesana.com'
          ]
        : '*',
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

### **PASO 5: Configurar Webhooks de Envia.com**

En el panel de Envia.com:

1. Ve a **Configuración** → **Webhooks**
2. Agrega URL: `https://tu-app.up.railway.app/api/shipping/webhook`
3. Selecciona eventos:
   - Shipment created
   - Shipment in transit
   - Shipment delivered
   - Shipment failed

---

## 🔒 Seguridad en Producción

### 1. Variables de Entorno

✅ **NUNCA** subas `.env` a Git
✅ Usa variables de entorno en Railway/Vercel
✅ Rota las API keys regularmente

### 2. HTTPS

✅ Railway y Vercel incluyen SSL automático
✅ Fuerza HTTPS en producción

### 3. Rate Limiting

Ya configurado en los servicios backend:
```javascript
rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // 100 requests por IP
})
```

### 4. CORS

Configura origins específicos (arriba ⬆️)

---

## 📊 Monitoreo

### Railway Dashboard
- **Metrics**: CPU, RAM, requests
- **Logs**: Ver logs en tiempo real
- **Alerts**: Configura alertas por email

### Supabase Dashboard
- **Database**: Performance y queries
- **Auth**: Login attempts
- **Storage**: Uso de archivos

### Vercel Analytics
- **Pageviews**: Tráfico del sitio
- **Performance**: Core Web Vitals
- **Errors**: Client-side errors

---

## 🚨 Troubleshooting en Producción

### Error: "CORS policy blocked"

**Problema:** Frontend no puede llamar al backend

**Solución:**
1. Verifica `corsOptions` en `shipping-service.js`
2. Agrega tu dominio de Vercel a los origins permitidos
3. Redeploy el backend

### Error: "502 Bad Gateway"

**Problema:** El backend no está respondiendo

**Solución:**
1. Verifica logs en Railway
2. Revisa que las variables de entorno estén configuradas
3. Verifica que el puerto sea el correcto (`PORT=3000`)

### Error: "Database connection failed"

**Problema:** No puede conectar a Supabase

**Solución:**
1. Verifica `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
2. Revisa que la IP de Railway esté permitida en Supabase
3. Supabase permite todas las IPs por defecto

---

## 💰 Costos Estimados

### Plan Gratuito (Para empezar)

| Servicio | Límites Gratis | Costo |
|----------|---------------|-------|
| **Vercel** | 100GB bandwidth/mes | $0 |
| **Railway** | $5 crédito inicial | $0* |
| **Supabase** | 500MB DB, 1GB storage | $0 |
| **Envia.com** | Por uso (pagas por guía) | Variable |
| **Total** | | ~$0/mes |

*Railway: $5/mes después del crédito inicial

### Plan Escalado (Para crecimiento)

| Servicio | Plan | Costo |
|----------|------|-------|
| **Vercel** | Pro | $20/mes |
| **Railway** | Developer | $20/mes |
| **Supabase** | Pro | $25/mes |
| **Total** | | **$65/mes** |

---

## ✅ Checklist de Deployment

### Pre-deployment
- [ ] Actualizar `backend-config.js` con URLs reales
- [ ] Verificar que `.gitignore` excluya `.env`
- [ ] Probar todo localmente
- [ ] Ejecutar migración de Supabase

### Backend (Railway)
- [ ] Crear cuenta en Railway
- [ ] Conectar repositorio
- [ ] Configurar variables de entorno
- [ ] Verificar que inicie correctamente
- [ ] Probar endpoints con curl/Postman

### Frontend (Vercel)
- [ ] Crear cuenta en Vercel
- [ ] Importar proyecto
- [ ] Configurar dominio (opcional)
- [ ] Verificar que cargue correctamente
- [ ] Probar checkout y admin panel

### Post-deployment
- [ ] Configurar webhooks de Envia.com
- [ ] Probar flujo completo de compra
- [ ] Probar generación de guías
- [ ] Configurar monitoreo
- [ ] Documentar URLs de producción

---

## 📞 Soporte

Si tienes problemas durante el deployment:

1. Revisa los logs en Railway/Vercel
2. Verifica variables de entorno
3. Prueba endpoints individualmente
4. Consulta la documentación oficial:
   - [Railway Docs](https://docs.railway.app)
   - [Vercel Docs](https://vercel.com/docs)
   - [Supabase Docs](https://supabase.com/docs)

---

**Última actualización:** Enero 2025
**Autor:** Estudio Artesana Development Team

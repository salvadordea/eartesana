# ✅ Checklist de Deploy - Copia y Pega

Usa este archivo para marcar tu progreso. Simplemente cambia `[ ]` a `[x]` cuando completes cada paso.

---

## 📦 PREPARACIÓN

- [ ] Tengo cuenta de GitHub
- [ ] Tengo cuenta de Railway (https://railway.app)
- [ ] Tengo cuenta de Vercel (https://vercel.com)
- [ ] Tengo API Key de Envia.com
- [ ] Tengo credenciales de Supabase
- [ ] Mi código está en GitHub

---

## 🚂 RAILWAY (Backend)

### Crear Proyecto
- [ ] Fui a https://railway.app
- [ ] Creé nuevo proyecto desde GitHub
- [ ] Seleccioné mi repositorio `estartesana`
- [ ] Configuré **Root Directory**: `backend`

### Variables de Entorno
Copié todas estas variables en Railway → Variables:

- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `FRONTEND_URL=https://estartesana.vercel.app`
- [ ] `EMAIL_SERVICE=gmail`
- [ ] `EMAIL_HOST=smtp.gmail.com`
- [ ] `EMAIL_PORT=587`
- [ ] `EMAIL_USER=mi-email@gmail.com`
- [ ] `EMAIL_PASS=mi-app-password`
- [ ] `EMAIL_FROM=sistema@estudioartesana.com`
- [ ] `ADMIN_EMAIL=admin@estudioartesana.com`
- [ ] `SUPABASE_URL=https://...supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY=...`
- [ ] `ENVIA_API_KEY=...`
- [ ] `ENVIA_BASE_URL=https://queries.envia.com/api/1.0`
- [ ] `ORIGIN_ZIP_CODE=01000`
- [ ] `ORIGIN_COUNTRY=MX`
- [ ] `DEFAULT_PACKAGE_LENGTH=30`
- [ ] `DEFAULT_PACKAGE_WIDTH=20`
- [ ] `DEFAULT_PACKAGE_HEIGHT=15`
- [ ] `DEFAULT_PACKAGE_WEIGHT=500`
- [ ] `SHIPPING_CACHE_TTL_HOURS=24`
- [ ] `ENVIA_SANDBOX_MODE=false`

### Deploy
- [ ] El deploy terminó exitosamente
- [ ] Copié la URL de Railway: `https://______.up.railway.app`
- [ ] Probé la URL: `https://______.up.railway.app/api/shipping/carriers`
- [ ] La URL responde con JSON

---

## 💻 ACTUALIZAR CÓDIGO LOCAL

- [ ] Abrí `assets/js/backend-config.js`
- [ ] Cambié línea 18: `const PRODUCTION_BACKEND_URL = 'https://______.up.railway.app'`
- [ ] Guardé el archivo
- [ ] `git add .`
- [ ] `git commit -m "Update production backend URL"`
- [ ] `git push origin main`

---

## 🌐 VERCEL (Frontend)

- [ ] Fui a https://vercel.com
- [ ] Creé nuevo proyecto desde GitHub
- [ ] Seleccioné mi repositorio
- [ ] Framework Preset: **Other**
- [ ] Root Directory: `./ ` (vacío)
- [ ] Click **Deploy**
- [ ] Deploy completado
- [ ] Copié URL de Vercel: `https://______.vercel.app`

---

## 🔒 ACTUALIZAR CORS

- [ ] Abrí `backend/shipping-service.js`
- [ ] Busqué `corsOptions` (línea ~40)
- [ ] Agregué mi dominio de Vercel al array
- [ ] Guardé el archivo
- [ ] Lo mismo en `backend/email-service.js`
- [ ] `git add backend/`
- [ ] `git commit -m "Update CORS"`
- [ ] `git push origin main`
- [ ] Esperé 2 minutos a que Railway redeploy

---

## 🧪 PRUEBAS

### Backend
- [ ] `https://______.up.railway.app/api/shipping/carriers` → responde OK

### Frontend + Backend Integrados
- [ ] Abrí mi sitio: `https://______.vercel.app`
- [ ] Fui al checkout
- [ ] Ingresé código postal
- [ ] Click "Calcular envío"
- [ ] **Funcionó** → Vi opciones de envío

### Admin
- [ ] Fui a `https://______.vercel.app/admin/pedidos.html`
- [ ] Intenté generar guía de envío
- [ ] **Funcionó** → Se generó la guía

---

## 🎣 WEBHOOK ENVIA.COM

- [ ] Fui a https://ship.envia.com
- [ ] Configuración → Webhooks
- [ ] Agregué: `https://______.up.railway.app/api/shipping/webhook`
- [ ] Seleccioné eventos: created, in_transit, delivered, failed
- [ ] Guardé

---

## 🎉 FINAL

- [ ] **TODO FUNCIONA**
- [ ] Sitio en producción: `https://______.vercel.app`
- [ ] Backend funcionando: `https://______.up.railway.app`
- [ ] Checkout calcula envíos correctamente
- [ ] Admin genera guías correctamente
- [ ] Webhooks configurados

---

## 📝 MIS URLs (Para Referencia)

**Anota aquí tus URLs para no olvidarlas:**

```
Railway Backend: https://________________________________
Vercel Frontend: https://________________________________
Supabase URL: https://________________________________
```

---

## 🚨 Si algo falla:

1. **Railway Logs**: Ve a tu proyecto → Logs
2. **Browser Console**: Abre DevTools → Console
3. **Verifica variables**: Todas deben estar configuradas
4. **Verifica CORS**: Debe incluir tu dominio

---

**¡Cuando todo esté marcado, estás en PRODUCCIÓN!** 🚀

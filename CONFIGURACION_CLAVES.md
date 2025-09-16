# 🔑 CONFIGURACIÓN DE CLAVES Y ENDPOINTS - ESTUDIO ARTESANA

Este documento lista **TODAS** las ubicaciones donde se encuentran claves, tokens y configuraciones que deben cambiarse para producción.

## ⚠️ IMPORTANTE ANTES DE PRODUCCIÓN

**NUNCA** subir claves reales a repositorios públicos. Usar variables de entorno en producción.

---

## 📍 MERCADOPAGO - CAMBIAR CLAVES

### Archivo: `js/mercadopago-integration.js`

**Líneas a cambiar:**
- **Línea 54**: `publicKey: 'TEST-4e8f2c84-0e8c-4e8d-9f8a-1234567890ab'`
- **Línea 60**: `accessToken: 'TEST-1234567890123456-123456-abcdef123456789012345678901234-123456789'`
- **Línea 76**: `environment: 'sandbox'` → cambiar a `'production'`

**Claves reales:**
```javascript
// CAMBIAR ESTAS CLAVES PARA PRODUCCIÓN:
publicKey: 'APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
accessToken: 'APP_USR-1234567890123456-123456-abcdef123456789012345678901234-123456789',
environment: 'production'
```

**URLs a configurar (líneas 69-71):**
```javascript
successUrl: `https://tudominio.com/checkout-success.html`,
failureUrl: `https://tudominio.com/checkout-failure.html`,
pendingUrl: `https://tudominio.com/checkout-pending.html`,
```

---

## 🗄️ SUPABASE - CONFIGURACIÓN DE BASE DE DATOS

**Archivos que contienen configuración de Supabase:**

### 1. `js/cart-manager.js`
- **Líneas 15-16**: URL y API Key de Supabase

### 2. `js/abandoned-cart-recovery.js`
- **Líneas 15-16**: URL y API Key de Supabase

### 3. `js/mercadopago-integration.js`
- **Líneas 35-36**: URL y API Key de Supabase

### 4. `js/custom-payment-method.js`
- **Líneas 17-18**: URL y API Key de Supabase

### 5. `js/auth-manager.js`
- **Líneas 11-12**: URL y API Key de Supabase

**Configuración actual:**
```javascript
baseUrl: 'https://yrmfrfpyqctvwyhrhivl.supabase.co',
apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

---

## 📧 SISTEMA DE EMAILS - CONFIGURAR SERVICIO REAL

**Archivos que simulan envío de emails:**

### 1. `js/abandoned-cart-recovery.js`
- **Función `simulateEmailSend()` (línea ~344)**: Reemplazar con servicio real
- **Función `sendRecoveryEmail()` (línea ~297)**: Integrar con SendGrid/Mailgun

### 2. `js/custom-payment-method.js`
- **Función `simulateEmailSend()` (línea ~283)**: Reemplazar con servicio real

**Servicios recomendados:**
- SendGrid
- Mailgun
- Amazon SES
- Resend

---

## 🏪 INFORMACIÓN DE CONTACTO - ACTUALIZAR

### Archivo: `js/custom-payment-method.js`

**Líneas 30-35 - Información del propietario:**
```javascript
ownerContact: {
    name: 'Estudio Artesana',
    email: 'ventas@estudioartesana.com',    // ← CAMBIAR
    phone: '+52 123 456 7890',              // ← CAMBIAR
    whatsapp: '+52 123 456 7890'            // ← CAMBIAR
},
```

---

## 🚛 ENVIAYA API - CONFIGURAR CUANDO SE IMPLEMENTE

### Archivo: `js/enviaya-integration.js` (pendiente de crear)

**Configuraciones necesarias:**
```javascript
// Configuración EnvíaYa
enviaYaConfig: {
    apiKey: 'TU_API_KEY_ENVIAYA',
    apiSecret: 'TU_API_SECRET_ENVIAYA',
    environment: 'production', // o 'sandbox'
    baseUrl: 'https://api.enviaya.com.mx'
}
```

---

## 🌐 URLs Y DOMINIOS - ACTUALIZAR PARA PRODUCCIÓN

### URLs de redirección (múltiples archivos)

**Cambiar en todos los archivos:**
```javascript
// DE (desarrollo):
successUrl: `${window.location.origin}/checkout-success.html`

// A (producción):
successUrl: `https://tudominio.com/checkout-success.html`
```

**Archivos afectados:**
- `js/mercadopago-integration.js`
- `js/custom-payment-method.js`
- `js/abandoned-cart-recovery.js`

---

## 🔐 VARIABLES DE ENTORNO RECOMENDADAS

**Para el backend (cuando se implemente):**

```env
# MercadoPago
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890123456-123456-abcdef123456789012345678901234-123456789
MERCADOPAGO_ENVIRONMENT=production

# Supabase
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# EnvíaYa
ENVIAYA_API_KEY=tu_api_key
ENVIAYA_API_SECRET=tu_api_secret
ENVIAYA_ENVIRONMENT=production

# Email Service
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=ventas@tudominio.com

# URLs del sitio
SITE_URL=https://tudominio.com
```

---

## 📋 CHECKLIST ANTES DE PRODUCCIÓN

### ✅ MercadoPago
- [ ] Cambiar `publicKey` de TEST a APP_USR
- [ ] Cambiar `accessToken` de TEST a APP_USR
- [ ] Cambiar `environment` de 'sandbox' a 'production'
- [ ] Actualizar URLs de redirección

### ✅ Supabase
- [ ] Crear proyecto de producción en Supabase
- [ ] Ejecutar script `database/ecommerce_schema.sql`
- [ ] Actualizar URLs y claves en todos los archivos JS
- [ ] Configurar Row Level Security (RLS)

### ✅ Emails
- [ ] Contratar servicio de email (SendGrid, Mailgun, etc.)
- [ ] Reemplazar funciones `simulateEmailSend()`
- [ ] Crear templates de email
- [ ] Configurar dominio para emails

### ✅ Información de contacto
- [ ] Actualizar datos del propietario en `custom-payment-method.js`
- [ ] Verificar números de teléfono y emails

### ✅ URLs y dominios
- [ ] Cambiar todas las URLs de localhost a dominio real
- [ ] Configurar HTTPS
- [ ] Crear páginas de éxito/error de pagos

### ✅ EnvíaYa (cuando se implemente)
- [ ] Obtener credenciales de EnvíaYa
- [ ] Implementar integración completa
- [ ] Configurar webhooks de envío

---

## 🛠️ COMANDOS DE BÚSQUEDA ÚTILES

**Para encontrar todas las claves que cambiar:**

```bash
# Buscar claves de prueba de MercadoPago
grep -r "TEST-" js/

# Buscar URLs de Supabase
grep -r "supabase.co" js/

# Buscar funciones de email simulado
grep -r "simulateEmailSend" js/

# Buscar localhost y origins
grep -r "window.location.origin" js/
```

---

## 📞 SOPORTE

Si necesitas ayuda configurando alguna de estas integraciones:

1. **MercadoPago**: [Documentación oficial](https://www.mercadopago.com.mx/developers)
2. **Supabase**: [Documentación oficial](https://supabase.com/docs)
3. **EnvíaYa**: Contactar directamente con su equipo de desarrollo

---

**⚠️ RECORDATORIO FINAL:**

**NUNCA** commitear claves reales al repositorio. Usar siempre variables de entorno en producción y mantener las claves seguras.

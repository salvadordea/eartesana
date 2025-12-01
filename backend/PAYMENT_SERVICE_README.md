# Payment Service - Openpay Integration

Servicio backend para procesar pagos con Openpay (BBVA) en Estudio Artesana.

## 🎯 Características

- ✅ **Pagos con tarjeta** (Visa, Mastercard, Amex) vía Checkout Hosted
- ✅ **Pagos en tiendas** (OXXO, 7-Eleven) con referencia y código de barras
- ✅ **Webhooks** para actualización automática de estado
- ✅ **Validación HMAC** para seguridad de webhooks
- ✅ **Integración Supabase** para persistencia de transacciones
- ✅ **Rate limiting** y protección contra abuso
- ✅ **Logging detallado** para debugging

## 📋 Requisitos Previos

1. **Cuenta Openpay**: Crear cuenta en https://dashboard.openpay.mx
2. **Credenciales**: Obtener Merchant ID y API Keys (sandbox y producción)
3. **Dependencias instaladas**: `npm install`
4. **Supabase configurado**: Variables de entorno de Supabase

## 🚀 Instalación

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```bash
# Openpay Credentials
OPENPAY_MERCHANT_ID=mxxxxxxxx        # Tu Merchant ID
OPENPAY_PRIVATE_KEY=sk_xxxxx         # Tu Private API Key
OPENPAY_PUBLIC_KEY=pk_xxxxx          # Tu Public API Key
OPENPAY_SANDBOX=true                 # true para desarrollo, false para producción

# Webhook Secret (generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
OPENPAY_WEBHOOK_SECRET=xxxxx

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Frontend URL
FRONTEND_URL=http://localhost:8080
```

### 3. Aplicar migración de base de datos

Ejecutar en Supabase SQL Editor:

```bash
database/migrations/add_openpay_support.sql
```

### 4. Iniciar servicio

**Desarrollo (con auto-reload):**
```bash
npm run dev:payment
```

**Producción:**
```bash
npm run start:payment
```

**Todos los servicios juntos:**
```bash
npm run dev    # Desarrollo
npm start      # Producción
```

## 🔌 Endpoints API

### 1. GET /api/openpay/config

Obtiene configuración pública (merchant ID y public key).

**Response:**
```json
{
  "success": true,
  "config": {
    "merchantId": "mxxxxxxxx",
    "publicKey": "pk_xxxxx",
    "sandbox": true
  }
}
```

### 2. POST /api/openpay/charge

Crea un cargo en Openpay.

**Request Body:**
```json
{
  "order_id": "123",
  "amount": 1500.00,
  "customer": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "5555555555"
  },
  "method": "card",  // "card" o "store"
  "device_session_id": "xxxxx"  // Solo para tarjetas
}
```

**Response (tarjeta):**
```json
{
  "success": true,
  "transaction_id": "ch_xxxxx",
  "status": "pending",
  "redirect_url": "https://sandbox-dashboard.openpay.mx/paynet-pdf/xxxxx"
}
```

**Response (tienda):**
```json
{
  "success": true,
  "transaction_id": "ch_xxxxx",
  "status": "pending",
  "payment_reference": "123456789",
  "barcode_url": "https://sandbox-api.openpay.mx/barcode/xxxxx",
  "due_date": "2025-11-28T23:59:59Z",
  "redirect_url": "/checkout-pending.html?order_id=123"
}
```

### 3. POST /api/openpay/webhook

Recibe notificaciones de Openpay (eventos de transacciones).

**Headers:**
- `x-openpay-signature`: Firma HMAC SHA256

**Eventos soportados:**
- `charge.succeeded` → Pago exitoso
- `charge.failed` → Pago fallido
- `charge.cancelled` → Pago cancelado
- `charge.refunded` → Pago reembolsado

### 4. GET /api/openpay/verify/:transactionId

Verifica estado de una transacción.

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "ch_xxxxx",
    "status": "completed",
    "amount": 1500.00,
    "order_id": "123",
    "method": "card",
    "created_at": "2025-11-25T10:30:00Z"
  }
}
```

### 5. GET /health

Health check del servicio.

**Response:**
```json
{
  "success": true,
  "service": "payment-service",
  "status": "healthy",
  "timestamp": "2025-11-25T10:30:00Z",
  "environment": "sandbox"
}
```

## 🧪 Testing

### Tarjetas de prueba Openpay Sandbox

```
VISA Aprobada:        4111 1111 1111 1111
VISA Rechazada:       4000 0000 0000 0127
Mastercard Aprobada:  5555 5555 5555 4444
American Express:     3782 822463 10005

CVV: Cualquier 3 dígitos
Fecha: Cualquier fecha futura
Nombre: Cualquier texto
```

### Testing con cURL

**1. Obtener configuración:**
```bash
curl http://localhost:3002/api/openpay/config
```

**2. Crear cargo (tarjeta):**
```bash
curl -X POST http://localhost:3002/api/openpay/charge \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TEST-001",
    "amount": 1500.00,
    "customer": {
      "name": "Juan Pérez",
      "email": "juan@test.com",
      "phone": "5555555555"
    },
    "method": "card",
    "device_session_id": "test-session-id"
  }'
```

**3. Crear cargo (tienda):**
```bash
curl -X POST http://localhost:3002/api/openpay/charge \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TEST-002",
    "amount": 1500.00,
    "customer": {
      "name": "María García",
      "email": "maria@test.com",
      "phone": "5555555555"
    },
    "method": "store"
  }'
```

## 🔒 Seguridad

### Prácticas implementadas:

1. **Private Key segura**: NUNCA expuesta en frontend
2. **Validación de webhooks**: Firma HMAC SHA256
3. **CORS restrictivo**: Solo dominio autorizado
4. **Rate limiting**: 100 requests / 15 minutos
5. **Helmet headers**: Protección contra vulnerabilidades comunes
6. **Input validation**: Validación de todos los inputs
7. **HTTPS obligatorio** en producción

### ⚠️ IMPORTANTE:

- NUNCA commitear el archivo `.env`
- Cambiar `OPENPAY_WEBHOOK_SECRET` antes de producción
- Usar credenciales de PRODUCCIÓN solo en producción
- Configurar HTTPS en el servidor de producción
- Revisar logs regularmente

## 🌐 Deployment

### Railway (recomendado)

1. Crear proyecto en Railway
2. Conectar repositorio GitHub
3. Configurar variables de entorno en Railway dashboard
4. Deploy automático

**Variables de entorno en Railway:**
```bash
OPENPAY_MERCHANT_ID=mxxxxxxxx
OPENPAY_PRIVATE_KEY=sk_xxxxx
OPENPAY_PUBLIC_KEY=pk_xxxxx
OPENPAY_SANDBOX=false  # false en producción
OPENPAY_WEBHOOK_SECRET=xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
FRONTEND_URL=https://estudioartesana.com
PAYMENT_PORT=3002
```

### Configurar Webhooks en Openpay

1. Ir a https://dashboard.openpay.mx
2. Sección "Webhooks"
3. Agregar URL: `https://tu-app.railway.app/api/openpay/webhook`
4. Seleccionar eventos:
   - `charge.succeeded`
   - `charge.failed`
   - `charge.cancelled`
   - `charge.refunded`
5. Copiar Webhook Secret a `.env`

## 📊 Monitoreo

### Logs útiles:

```bash
# Ver logs del servicio
tail -f logs/payment-service.log

# Filtrar solo errores
tail -f logs/payment-service.log | grep ERROR

# Ver webhooks recibidos
tail -f logs/payment-service.log | grep "Webhook recibido"
```

### Consultas útiles en Supabase:

```sql
-- Ver últimas transacciones
SELECT * FROM payment_transactions
ORDER BY created_at DESC
LIMIT 10;

-- Ver transacciones por estado
SELECT status, COUNT(*) as total
FROM payment_transactions
WHERE payment_method = 'openpay'
GROUP BY status;

-- Ver pagos pendientes por vencer
SELECT * FROM payment_status_report
WHERE payment_due_date < NOW() + INTERVAL '1 day'
AND payment_status = 'pending_payment';
```

## 🛠️ Mantenimiento

### Limpiar pagos expirados (ejecutar diariamente):

```sql
SELECT cancel_expired_store_payments();
```

### Ver auditoría de cambios:

```sql
SELECT * FROM payment_audit_log
ORDER BY changed_at DESC
LIMIT 20;
```

## 📞 Soporte

- **Openpay Docs**: https://www.openpay.mx/docs/
- **Openpay Dashboard**: https://dashboard.openpay.mx
- **Soporte Openpay**: soporte@openpay.mx

## 📝 Licencia

MIT

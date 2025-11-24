# 🚀 Backend Services - Estudio Artesana

Servicios backend para Estudio Artesana: notificaciones por email y gestión de envíos con Envia.com.

---

## 📦 Servicios Incluidos

### 1. **Email Service** (Puerto 3000)
- Envío de notificaciones por email para pedidos mayoristas
- Integración con Nodemailer
- Rate limiting para prevenir spam

### 2. **Shipping Service** (Puerto 3001)
- Integración completa con Envia.com API
- Cotización de envíos en tiempo real
- Generación de guías de envío
- Seguimiento de paquetes
- Webhooks para actualizaciones automáticas

---

## 🚀 Inicio Rápido

### Opción 1: Usar el archivo .bat (Windows - Recomendado)

```bash
cd backend
start-backend.bat
```

Este script automáticamente:
- ✅ Verifica que Node.js esté instalado
- ✅ Instala dependencias si es necesario
- ✅ Crea archivo `.env` desde `.env.example`
- ✅ Inicia ambos servicios simultáneamente

### Opción 2: Usar NPM

```bash
cd backend

# Instalar dependencias
npm install

# Iniciar ambos servicios
npm start

# O en modo desarrollo (con auto-reload)
npm run dev
```

### Opción 3: Iniciar servicios individualmente

```bash
# Solo Email Service
npm run start:email

# Solo Shipping Service
npm run start:shipping

# Modo desarrollo individual
npm run dev:email
npm run dev:shipping
```

---

## ⚙️ Configuración

### 1. Copiar archivo de ejemplo

```bash
cp .env.example .env
```

### 2. Configurar variables de entorno

Edita el archivo `.env` con tus credenciales:

#### **Servidor**
```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:8080
```

#### **Email (Nodemailer)**
```env
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password
EMAIL_FROM=sistema@estudioartesana.com
ADMIN_EMAIL=admin@estudioartesana.com
```

#### **Supabase**
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

#### **Envia.com**
```env
ENVIA_API_KEY=tu-envia-api-key-aqui
ENVIA_BASE_URL=https://queries.envia.com/api/1.0
ORIGIN_ZIP_CODE=01000
ORIGIN_COUNTRY=MX
```

### 3. Obtener API Key de Envia.com

1. Regístrate en https://ship.envia.com
2. Ve a **Configuración** → **API**
3. Copia tu API Key
4. Pégala en `.env` como `ENVIA_API_KEY`

---

## 🌐 Endpoints Disponibles

### **Email Service** (http://localhost:3000)

#### `POST /api/email/send-wholesale-notification`
Envía notificación de pedido mayorista al admin.

**Request Body:**
```json
{
  "orderNumber": "WHS-2024-001",
  "customerName": "Juan Pérez",
  "customerEmail": "juan@example.com",
  "items": [
    {
      "name": "Botella Decorada",
      "quantity": 50,
      "price": 120
    }
  ],
  "total": 6000,
  "notes": "Pedido urgente"
}
```

---

### **Shipping Service** (http://localhost:3001)

#### `POST /api/shipping/quote`
Obtiene cotizaciones de envío.

**Request Body:**
```json
{
  "originZipCode": "01000",
  "destinationZipCode": "64000",
  "weight": 500,
  "dimensions": {
    "length": 30,
    "width": 20,
    "height": 15
  }
}
```

**Response:**
```json
{
  "success": true,
  "rates": [
    {
      "carrier": "Estafeta",
      "service": "Express",
      "cost": 120.50,
      "deliveryDays": 2,
      "serviceDisplayName": "Estafeta Express"
    }
  ]
}
```

#### `POST /api/shipping/create`
Genera guía de envío.

**Request Body:**
```json
{
  "orderId": 123,
  "carrier": "estafeta",
  "service": "express",
  "destination": {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "5512345678",
    "street": "Av. Reforma 123",
    "city": "CDMX",
    "state": "Ciudad de México",
    "zipCode": "01000",
    "country": "MX"
  },
  "package": {
    "weight": 500,
    "length": 30,
    "width": 20,
    "height": 15
  }
}
```

**Response:**
```json
{
  "success": true,
  "shipmentId": 456,
  "trackingNumber": "EST-123456789",
  "labelUrl": "https://envia.com/labels/EST-123456789.pdf",
  "trackingUrl": "https://envia.com/track/EST-123456789",
  "cost": 120.50
}
```

#### `GET /api/shipping/track/:trackingNumber`
Obtiene información de seguimiento.

**Response:**
```json
{
  "success": true,
  "trackingNumber": "EST-123456789",
  "status": "in_transit",
  "trackingEvents": [
    {
      "timestamp": "2025-01-23T10:00:00Z",
      "status": "En tránsito",
      "location": "CDMX, México",
      "description": "Paquete en ruta"
    }
  ]
}
```

#### `POST /api/shipping/webhook`
Recibe actualizaciones de Envia.com (configurado en su panel).

#### `GET /api/shipping/carriers`
Lista de paqueterías disponibles.

---

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Test del Email Service
curl -X POST http://localhost:3000/api/email/send-wholesale-notification \
  -H "Content-Type: application/json" \
  -d '{"orderNumber":"TEST-001","customerName":"Test","total":100}'

# Test del Shipping Service - Quote
curl -X POST http://localhost:3001/api/shipping/quote \
  -H "Content-Type: application/json" \
  -d '{"originZipCode":"01000","destinationZipCode":"64000","weight":500}'

# Test del Shipping Service - Tracking
curl http://localhost:3001/api/shipping/track/EST-123456789
```

---

## 📁 Estructura de Archivos

```
backend/
├── email-service.js          # Servicio de email
├── shipping-service.js       # Servicio de envíos
├── package.json              # Dependencias y scripts
├── .env.example              # Plantilla de variables de entorno
├── .env                      # Configuración local (no commitear)
├── start-backend.bat         # Script para iniciar servicios (Windows)
└── README.md                 # Esta documentación
```

---

## 🔧 Troubleshooting

### Error: "EADDRINUSE" (Puerto en uso)

**Solución:** Otro proceso está usando el puerto. Cambia el puerto en `.env`:
```env
PORT=3002  # Para email service
```

Para shipping service, edita `shipping-service.js` línea del puerto.

### Error: "Cannot find module"

**Solución:** Instala dependencias:
```bash
npm install
```

### Error: "EAUTH" (Email authentication failed)

**Solución:**
1. Verifica que `EMAIL_USER` y `EMAIL_PASS` sean correctos
2. Para Gmail, usa una **App Password** (no tu contraseña normal)
3. Habilita "Acceso de apps menos seguras" si es necesario

### Error: "ENVIA API KEY invalid"

**Solución:**
1. Verifica tu API key en https://ship.envia.com/settings/api
2. Asegúrate de que esté en modo **sandbox** si estás probando
3. Actualiza `ENVIA_API_KEY` en `.env`

---

## 📚 Recursos

- [Envia.com API Docs](https://docs.envia.com)
- [Nodemailer Documentation](https://nodemailer.com)
- [Express.js Guide](https://expressjs.com)
- [Supabase Documentation](https://supabase.com/docs)

---

## 📞 Soporte

Si tienes problemas, verifica:
1. ✅ Node.js instalado (v16+)
2. ✅ Archivo `.env` configurado correctamente
3. ✅ Dependencias instaladas (`npm install`)
4. ✅ Puertos 3000 y 3001 libres
5. ✅ Conexión a internet (para APIs de Envia.com)

---

**Autor:** Estudio Artesana Development Team
**Última actualización:** Enero 2025

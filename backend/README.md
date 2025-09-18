# 📧 Servicio de Notificaciones por Email - Estudio Artesana

Este servicio backend maneja el envío automático de notificaciones por email cuando se procesa un pedido mayorista en la plataforma de Estudio Artesana.

## 🚀 Características

- ✅ Notificaciones automáticas de pedidos mayoristas
- ✅ Plantillas HTML profesionales para emails
- ✅ Rate limiting para prevenir spam
- ✅ Soporte para múltiples servicios de email (Gmail, SendGrid, etc.)
- ✅ Configuración fácil con variables de entorno
- ✅ Modo de desarrollo con Ethereal Email
- ✅ Validación de datos robusta
- ✅ Manejo de errores completo

## 📋 Requisitos Previos

- Node.js >= 16.0.0
- npm >= 8.0.0
- Una cuenta de email para envío (Gmail recomendado)

## ⚡ Instalación Rápida

1. **Clonar y navegar al directorio:**
   ```bash
   cd backend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```

4. **Editar `.env` con tus credenciales:**
   ```env
   EMAIL_USER=tu-email@gmail.com
   EMAIL_PASS=tu-app-password
   ADMIN_EMAIL=admin@estudioartesana.com
   ```

5. **Iniciar el servidor:**
   ```bash
   npm run dev
   ```

## 🔧 Configuración Detallada

### Gmail (Recomendado para Producción)

1. **Habilitar 2FA en tu cuenta Gmail**
2. **Generar App Password:**
   - Ve a [Configuración de Google](https://myaccount.google.com/security)
   - Selecciona "Verificación en 2 pasos"
   - En la parte inferior, selecciona "Contraseñas de aplicaciones"
   - Genera una nueva contraseña para "Mail"

3. **Configurar `.env`:**
   ```env
   NODE_ENV=production
   EMAIL_SERVICE=gmail
   EMAIL_USER=tu-email@gmail.com
   EMAIL_PASS=tu-app-password-de-16-caracteres
   EMAIL_FROM=sistema@estudioartesana.com
   ADMIN_EMAIL=admin@estudioartesana.com
   ```

### Ethereal Email (Para Desarrollo)

Para testing sin enviar emails reales:

```env
NODE_ENV=development
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=ethereal.user@ethereal.email
EMAIL_PASS=ethereal.pass
```

## 📡 API Endpoints

### POST `/api/sendOrderEmail`

Envía una notificación de pedido mayorista.

**Headers:**
```
Content-Type: application/json
```

**Body Example:**
```json
{
  "to": "admin@estudioartesana.com",
  "subject": "Nuevo Pedido Mayorista #WS-2024-1234",
  "orderNumber": "WS-2024-1234",
  "customer": {
    "name": "Juan Pérez",
    "email": "juan@empresa.com",
    "phone": "+52 555 123 4567",
    "company": "Empresa Ejemplo SA"
  },
  "items": [
    {
      "name": "Producto Ejemplo",
      "quantity": 10,
      "regularPrice": 100.00,
      "wholesalePrice": 80.00
    }
  ],
  "totals": {
    "subtotal": 1000.00,
    "discount": 200.00,
    "tax": 128.00,
    "total": 928.00
  },
  "shipping": {
    "address": "Calle Principal 123",
    "city": "Ciudad de México",
    "state": "CDMX",
    "postalCode": "12345",
    "country": "México"
  },
  "billing": {
    "rfc": "XAXX010101000",
    "businessName": "Empresa Ejemplo SA"
  },
  "paymentMethod": "credit_30",
  "orderDate": "2024-01-15T10:30:00Z"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "messageId": "email-message-id",
  "message": "Notificación de pedido enviada exitosamente"
}
```

**Response Error (400/500):**
```json
{
  "success": false,
  "error": "Descripción del error"
}
```

### GET `/api/health`

Verificación de salud del servicio.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "Email Service - Estudio Artesana"
}
```

## 🛡️ Seguridad

- **Rate Limiting:** Máximo 10 emails por IP cada 15 minutos
- **CORS:** Configurado para permitir solo dominios autorizados
- **Helmet:** Headers de seguridad aplicados
- **Validación:** Datos de entrada validados estrictamente

## 📊 Monitoreo y Logs

El servicio registra:

- ✅ Emails enviados exitosamente
- ❌ Errores de envío
- 🔒 Intentos de acceso no autorizados
- 📈 Métricas de uso

Ejemplo de logs:
```
📧 Recibida solicitud de envío de email: {...}
✅ Email enviado exitosamente: message-id-123
❌ Error enviando email: Connection timeout
```

## 🧪 Testing

### Testing Manual

1. **Iniciar servidor en modo desarrollo:**
   ```bash
   npm run dev
   ```

2. **Enviar request de prueba:**
   ```bash
   curl -X POST http://localhost:3000/api/sendOrderEmail \
     -H "Content-Type: application/json" \
     -d @test-order.json
   ```

### Testing Automatizado

```bash
npm test
```

## 🚀 Despliegue

### Opción 1: Servidor VPS/Dedicado

```bash
# Clonar repositorio
git clone https://github.com/estudio-artesana/email-service.git
cd email-service

# Instalar dependencias de producción
npm install --only=production

# Configurar variables de entorno
cp .env.example .env
nano .env

# Iniciar con PM2
npm install -g pm2
pm2 start email-service.js --name "email-service"
pm2 save
pm2 startup
```

### Opción 2: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

### Opción 3: Heroku

1. **Crear aplicación en Heroku**
2. **Configurar variables de entorno en dashboard**
3. **Desplegar:**
   ```bash
   git add .
   git commit -m "Deploy email service"
   git push heroku main
   ```

## 🔧 Troubleshooting

### Error: "Invalid login"
- Verificar que la autenticación 2FA esté habilitada
- Usar App Password, no la contraseña regular
- Verificar que EMAIL_USER y EMAIL_PASS sean correctos

### Error: "Connection timeout"
- Verificar configuración de firewall
- Probar diferentes puertos (587, 465, 25)
- Verificar que el servicio de email permita conexiones externas

### Error: "Rate limit exceeded"
- El límite es de 10 emails por 15 minutos por IP
- Esperar o ajustar la configuración en `emailLimiter`

### Error: "CORS policy"
- Verificar que FRONTEND_URL en .env coincida con tu dominio
- Agregar dominios adicionales si es necesario

## 📝 Variables de Entorno

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `NODE_ENV` | Entorno de ejecución | `production` | No |
| `PORT` | Puerto del servidor | `3000` | No |
| `EMAIL_SERVICE` | Servicio de email | `gmail` | No |
| `EMAIL_USER` | Usuario del email | `tu-email@gmail.com` | Sí |
| `EMAIL_PASS` | Contraseña/App Password | `abcd efgh ijkl mnop` | Sí |
| `EMAIL_FROM` | Email remitente | `sistema@estudioartesana.com` | No |
| `ADMIN_EMAIL` | Email destinatario | `admin@estudioartesana.com` | No |
| `FRONTEND_URL` | URL del frontend | `https://estudioartesana.com` | No |

## 🤝 Contribución

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico:
- 📧 Email: soporte@estudioartesana.com
- 📞 Teléfono: +52 555 123 4567
- 🐛 Issues: [GitHub Issues](https://github.com/estudio-artesana/email-service/issues)

---

**Desarrollado con ❤️ por Estudio Artesana**

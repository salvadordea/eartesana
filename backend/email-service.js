/**
 * Email Service para Notificaciones de Pedidos Mayoristas
 * Estudio Artesana
 * 
 * Este archivo contiene el código backend necesario para manejar el envío de
 * notificaciones por email cuando se procesa un pedido mayorista.
 */

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));

// Rate limiting para prevenir spam
const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // máximo 10 emails por IP cada 15 minutos
    message: {
        error: 'Demasiadas solicitudes de email. Intenta nuevamente en 15 minutos.'
    }
});

app.use(express.json({ limit: '10mb' }));
app.use('/api/sendOrderEmail', emailLimiter);

// Configuración del transportador de email
const createEmailTransporter = () => {
    // Para desarrollo/testing - usando un servicio como Ethereal Email
    if (process.env.NODE_ENV !== 'production') {
        return nodemailer.createTransporter({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
                pass: process.env.EMAIL_PASS || 'ethereal.pass'
            }
        });
    }
    
    // Para producción - usando un servicio real como Gmail, SendGrid, etc.
    return nodemailer.createTransporter({
        service: 'gmail', // o tu servicio preferido
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // usar App Password para Gmail
        }
    });
};

// Función para generar el HTML del email
function generateOrderEmailHTML(orderData) {
    const {
        orderNumber,
        customer,
        items,
        totals,
        shipping,
        billing,
        paymentMethod,
        orderNotes,
        orderDate
    } = orderData;

    const paymentMethods = {
        'credit_30': 'Crédito a 30 días',
        'bank_transfer': 'Transferencia bancaria',
        'credit_card': 'Tarjeta de crédito'
    };

    const itemsHTML = items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$${item.regularPrice.toFixed(2)}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$${item.wholesalePrice.toFixed(2)}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">$${(item.wholesalePrice * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Nuevo Pedido Mayorista #${orderNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                .content { background: #f9f9f9; padding: 20px; }
                .section { margin: 20px 0; padding: 15px; background: white; border-radius: 5px; }
                .section h3 { margin: 0 0 15px 0; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th { background: #3498db; color: white; padding: 12px; text-align: left; }
                td { padding: 10px; border: 1px solid #ddd; }
                .totals { background: #ecf0f1; padding: 15px; border-radius: 5px; }
                .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
                .total-row.final { font-weight: bold; font-size: 18px; border-top: 2px solid #2c3e50; padding-top: 10px; }
                .urgent { background: #e74c3c; color: white; padding: 10px; border-radius: 5px; text-align: center; margin: 20px 0; }
                .footer { background: #34495e; color: white; padding: 15px; text-align: center; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛒 Nuevo Pedido Mayorista</h1>
                    <h2>Pedido #${orderNumber}</h2>
                    <p>Fecha: ${new Date(orderDate).toLocaleString('es-MX')}</p>
                </div>
                
                <div class="content">
                    <div class="urgent">
                        ⚡ PEDIDO MAYORISTA NUEVO - REQUIERE ATENCIÓN INMEDIATA
                    </div>

                    <div class="section">
                        <h3>📋 Información del Cliente</h3>
                        <p><strong>Nombre:</strong> ${customer.name}</p>
                        <p><strong>Email:</strong> ${customer.email}</p>
                        <p><strong>Teléfono:</strong> ${customer.phone}</p>
                        <p><strong>Empresa:</strong> ${customer.company}</p>
                    </div>

                    <div class="section">
                        <h3>🚚 Dirección de Envío</h3>
                        <p><strong>Dirección:</strong> ${shipping.address}</p>
                        <p><strong>Ciudad:</strong> ${shipping.city}, ${shipping.state}</p>
                        <p><strong>Código Postal:</strong> ${shipping.postalCode}</p>
                        <p><strong>País:</strong> ${shipping.country}</p>
                        ${shipping.notes ? `<p><strong>Notas de envío:</strong> ${shipping.notes}</p>` : ''}
                    </div>

                    <div class="section">
                        <h3>🧾 Información de Facturación</h3>
                        <p><strong>RFC:</strong> ${billing.rfc}</p>
                        <p><strong>Razón Social:</strong> ${billing.businessName}</p>
                        ${!billing.sameAsShipping ? '<p><em>Dirección de facturación diferente a la de envío</em></p>' : ''}
                    </div>

                    <div class="section">
                        <h3>🛍️ Productos Pedidos</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Precio Regular</th>
                                    <th>Precio Mayorista</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHTML}
                            </tbody>
                        </table>
                    </div>

                    <div class="section">
                        <h3>💰 Resumen de Totales</h3>
                        <div class="totals">
                            <div class="total-row">
                                <span>Subtotal:</span>
                                <span>$${totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div class="total-row">
                                <span>Descuento mayorista (20%):</span>
                                <span style="color: #e74c3c;">-$${totals.discount.toFixed(2)}</span>
                            </div>
                            <div class="total-row">
                                <span>IVA (16%):</span>
                                <span>$${totals.tax.toFixed(2)}</span>
                            </div>
                            <div class="total-row">
                                <span>Envío:</span>
                                <span style="color: #27ae60;">GRATIS</span>
                            </div>
                            <div class="total-row final">
                                <span>TOTAL:</span>
                                <span>$${totals.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <h3>💳 Método de Pago</h3>
                        <p><strong>${paymentMethods[paymentMethod] || paymentMethod}</strong></p>
                    </div>

                    ${orderNotes ? `
                    <div class="section">
                        <h3>📝 Notas del Pedido</h3>
                        <p>${orderNotes}</p>
                    </div>
                    ` : ''}

                    <div class="section">
                        <h3>🚀 Próximos Pasos</h3>
                        <ol>
                            <li><strong>Verificar disponibilidad de productos</strong></li>
                            <li><strong>Contactar al cliente para confirmar el pedido</strong></li>
                            <li><strong>Programar la preparación y envío</strong></li>
                            <li><strong>Enviar información de seguimiento</strong></li>
                        </ol>
                    </div>
                </div>

                <div class="footer">
                    <p>📧 Esta notificación fue generada automáticamente por el sistema de pedidos mayoristas de Estudio Artesana</p>
                    <p>🕒 Tiempo estimado de respuesta: Máximo 2 horas hábiles</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Endpoint para enviar notificación de pedido
app.post('/api/sendOrderEmail', async (req, res) => {
    try {
        console.log('📧 Recibida solicitud de envío de email:', req.body);

        // Validar datos requeridos
        if (!req.body.orderNumber || !req.body.customer || !req.body.items) {
            return res.status(400).json({
                success: false,
                error: 'Datos de pedido incompletos'
            });
        }

        const transporter = createEmailTransporter();
        
        // Configurar el email
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'sistema@estudioartesana.com',
            to: req.body.to || 'admin@estudioartesana.com',
            subject: req.body.subject || `Nuevo Pedido Mayorista #${req.body.orderNumber}`,
            html: generateOrderEmailHTML(req.body),
            // También incluir versión texto plano
            text: `
Nuevo Pedido Mayorista #${req.body.orderNumber}

Cliente: ${req.body.customer.name}
Email: ${req.body.customer.email}
Empresa: ${req.body.customer.company}

Total del pedido: $${req.body.totals.total.toFixed(2)}
Método de pago: ${req.body.paymentMethod}

Ver detalles completos en el panel de administración.
            `
        };

        // Enviar el email
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email enviado exitosamente:', info.messageId);

        // En desarrollo, mostrar el preview URL
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        res.json({
            success: true,
            messageId: info.messageId,
            message: 'Notificación de pedido enviada exitosamente',
            previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null
        });

    } catch (error) {
        console.error('❌ Error enviando email:', error);
        
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor enviando email',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Email Service - Estudio Artesana'
    });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error no manejado:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`📧 Servidor de email ejecutándose en puerto ${PORT}`);
    console.log(`🔗 Health check disponible en: http://localhost:${PORT}/api/health`);
});

module.exports = app;

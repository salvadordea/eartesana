/**
 * Payment Confirmed Email Template
 * Email de confirmación de pago recibido
 */

const baseTemplate = require('./base-template');

module.exports = ({ orderNumber, customerName, amount, paymentMethod, transactionId }) => {
    const paymentMethodDisplay = {
        'card': 'Tarjeta de Crédito/Débito',
        'store': 'Pago en Tienda (OXXO/7-Eleven)',
        'openpay': 'Openpay (BBVA)'
    }[paymentMethod] || paymentMethod;

    const content = `
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 10px;">✅</div>
            <h2 style="margin: 0; color: white; font-size: 26px;">Pago Confirmado</h2>
        </div>

        <h2>¡Excelente noticia, ${customerName}!</h2>

        <p>Tu pago ha sido procesado exitosamente. Ya puedes relajarte, tu pedido está en camino.</p>

        <div class="success-box">
            <table style="width: 100%;">
                <tr>
                    <td style="padding: 8px 0; color: #155724;"><strong>Pedido:</strong></td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #155724;">#${orderNumber}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #155724;"><strong>Monto Pagado:</strong></td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #155724; font-size: 20px;">$${amount.toFixed(2)} MXN</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #155724;"><strong>Método de Pago:</strong></td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #155724;">${paymentMethodDisplay}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #155724;"><strong>ID Transacción:</strong></td>
                    <td style="padding: 8px 0; text-align: right; font-family: monospace; color: #155724;">${transactionId}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #155724;"><strong>Fecha:</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #155724;">${new Date().toLocaleString('es-MX', {
                        dateStyle: 'long',
                        timeStyle: 'short'
                    })}</td>
                </tr>
            </table>
        </div>

        <hr class="divider">

        <h3 style="color: #8B4513; font-size: 18px;">¿Qué sigue ahora?</h3>

        <p><strong>1️⃣ Confirmación de Pedido</strong><br>
        Recibirás un email adicional con todos los detalles de tu pedido y productos.</p>

        <p><strong>2️⃣ Preparación</strong><br>
        Nuestro equipo comenzará a preparar tu pedido en las próximas horas.</p>

        <p><strong>3️⃣ Envío</strong><br>
        Una vez enviado, recibirás un email con el número de rastreo para seguir tu paquete en tiempo real.</p>

        <p><strong>4️⃣ Entrega</strong><br>
        Tu pedido llegará en 3-5 días hábiles aproximadamente.</p>

        <div class="info-box">
            <p style="margin: 0 0 10px 0;"><strong>💡 Información Importante:</strong></p>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Guarda este email como comprobante de pago</li>
                <li>El cargo aparecerá en tu estado de cuenta como "OPENPAY*ESTUDIOARTESANA"</li>
                <li>Tu pedido está protegido con garantía de satisfacción</li>
                <li>Si tienes dudas, contáctanos con tu número de pedido</li>
            </ul>
        </div>

        <hr class="divider">

        <div style="text-align: center; background: #f8f9fa; padding: 25px; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-size: 16px; color: #2c3e50;">
                <strong>¿Necesitas ayuda con tu pedido?</strong>
            </p>
            <p style="margin: 0 0 20px 0; color: #6c757d;">
                Estamos aquí para ayudarte en cada paso del proceso
            </p>
            <a href="https://wa.me/525512345678?text=Hola,%20tengo%20una%20pregunta%20sobre%20mi%20pedido%20${orderNumber}"
               class="button"
               style="background: #25D366; margin-right: 10px;">
                💬 WhatsApp
            </a>
            <a href="mailto:contacto@estudioartesana.com?subject=Consulta sobre Pedido ${orderNumber}"
               class="button">
                📧 Email
            </a>
        </div>

        <hr class="divider">

        <p style="text-align: center; color: #6c757d; font-size: 14px;">
            <strong>Gracias por confiar en Estudio Artesana</strong><br>
            Tu apoyo ayuda a preservar el arte y la artesanía mexicana.
        </p>

        <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 32px; margin: 0;">🎨 🇲🇽 ❤️</p>
        </div>
    `;

    return baseTemplate(content, { title: `Pago Confirmado - Pedido #${orderNumber}` });
};

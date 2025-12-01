/**
 * Order Confirmation Email Template
 * Email de confirmación de pedido enviado al cliente después del pago exitoso
 */

const baseTemplate = require('./base-template');

module.exports = (order) => {
    // Parse items if string
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    // Generate product rows
    const productRows = items.map(item => `
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid #e9ecef;">
                <strong>${item.name}</strong><br>
                <span style="color: #6c757d; font-size: 14px;">
                    ${item.variant ? `Variante: ${item.variant}` : ''}
                </span>
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #e9ecef; text-align: center;">
                ${item.quantity}
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #e9ecef; text-align: right;">
                $${item.price.toFixed(2)}
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #e9ecef; text-align: right;">
                <strong>$${(item.quantity * item.price).toFixed(2)}</strong>
            </td>
        </tr>
    `).join('');

    const content = `
        <h2>¡Gracias por tu pedido, ${order.customer_name}!</h2>

        <div class="success-box">
            <p style="margin: 0;"><strong>✅ Tu pago ha sido confirmado</strong></p>
            <p style="margin: 5px 0 0 0;">Pedido #${order.order_number || order.id}</p>
        </div>

        <p>Hemos recibido tu pedido y estamos preparándolo con todo el cuidado que merece. Te enviaremos actualizaciones sobre el estado de tu envío.</p>

        <hr class="divider">

        <h3 style="color: #8B4513; font-size: 18px;">Detalles del Pedido</h3>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
                <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px 15px; text-align: left; border-bottom: 2px solid #dee2e6;">Producto</th>
                    <th style="padding: 12px 15px; text-align: center; border-bottom: 2px solid #dee2e6;">Cant.</th>
                    <th style="padding: 12px 15px; text-align: right; border-bottom: 2px solid #dee2e6;">Precio</th>
                    <th style="padding: 12px 15px; text-align: right; border-bottom: 2px solid #dee2e6;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${productRows}
            </tbody>
        </table>

        <table style="width: 100%; max-width: 300px; margin-left: auto; margin-top: 20px;">
            <tr>
                <td style="padding: 8px 0; color: #6c757d;">Subtotal:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">$${order.subtotal_amount.toFixed(2)}</td>
            </tr>
            ${order.shipping_cost > 0 ? `
            <tr>
                <td style="padding: 8px 0; color: #6c757d;">Envío:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">$${order.shipping_cost.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${order.discount_amount > 0 ? `
            <tr>
                <td style="padding: 8px 0; color: #28a745;">Descuento:</td>
                <td style="padding: 8px 0; text-align: right; color: #28a745; font-weight: 600;">-$${order.discount_amount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr style="border-top: 2px solid #dee2e6;">
                <td style="padding: 12px 0; font-size: 18px; font-weight: bold;">Total:</td>
                <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #D4AF37;">$${order.total_amount.toFixed(2)} MXN</td>
            </tr>
        </table>

        <hr class="divider">

        <h3 style="color: #8B4513; font-size: 18px;">Información de Envío</h3>

        <div class="info-box">
            <p style="margin: 0 0 5px 0;"><strong>${order.customer_name}</strong></p>
            <p style="margin: 0; line-height: 1.6;">
                ${order.shipping_address || order.customer_address}<br>
                ${order.shipping_city || ''} ${order.shipping_state || ''}<br>
                C.P. ${order.shipping_postal_code || ''}<br>
                ${order.customer_phone || ''}
            </p>
        </div>

        ${order.tracking_number ? `
        <div class="success-box">
            <p style="margin: 0;"><strong>📦 Número de Rastreo:</strong> ${order.tracking_number}</p>
        </div>
        ` : ''}

        <hr class="divider">

        <h3 style="color: #8B4513; font-size: 18px;">¿Qué sigue?</h3>

        <p><strong>1. Preparación del Pedido</strong><br>
        Nuestro equipo empacará tu pedido con cuidado en las próximas 24-48 horas.</p>

        <p><strong>2. Envío</strong><br>
        Una vez enviado, recibirás un email con el número de rastreo para seguir tu paquete.</p>

        <p><strong>3. Entrega</strong><br>
        Tu pedido llegará en 3-5 días hábiles aproximadamente.</p>

        <div class="info-box">
            <p style="margin: 0;"><strong>💡 Tip:</strong> Guarda este email para futuras referencias de tu pedido.</p>
        </div>

        <hr class="divider">

        <p style="text-align: center; color: #6c757d;">
            ¿Tienes alguna pregunta sobre tu pedido?<br>
            Contáctanos y con gusto te ayudaremos.
        </p>
    `;

    return baseTemplate(content, { title: `Confirmación de Pedido #${order.order_number || order.id}` });
};

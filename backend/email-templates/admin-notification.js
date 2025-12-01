/**
 * Admin Notification Email Template
 * Email de notificación al administrador cuando hay un nuevo pedido
 */

const baseTemplate = require('./base-template');

module.exports = (order) => {
    // Parse items if string
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    // Generate product rows
    const productRows = items.map(item => `
        <tr>
            <td style="padding: 12px 15px; border-bottom: 1px solid #e9ecef;">
                <strong>${item.name}</strong><br>
                <span style="color: #6c757d; font-size: 13px;">
                    ${item.variant ? `Variante: ${item.variant}` : ''}
                </span>
            </td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #e9ecef; text-align: center;">
                ${item.quantity}
            </td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #e9ecef; text-align: right;">
                $${item.price.toFixed(2)}
            </td>
            <td style="padding: 12px 15px; border-bottom: 1px solid #e9ecef; text-align: right;">
                <strong>$${(item.quantity * item.price).toFixed(2)}</strong>
            </td>
        </tr>
    `).join('');

    const content = `
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <h2 style="margin: 0; color: white; font-size: 24px;">🚨 Nuevo Pedido Recibido</h2>
        </div>

        <div class="success-box">
            <p style="margin: 0;"><strong>Pedido #${order.order_number || order.id}</strong></p>
            <p style="margin: 5px 0 0 0;">Fecha: ${new Date(order.created_at).toLocaleString('es-MX', {
                dateStyle: 'long',
                timeStyle: 'short'
            })}</p>
        </div>

        <hr class="divider">

        <h3 style="color: #8B4513; font-size: 18px;">Información del Cliente</h3>

        <table style="width: 100%; margin: 15px 0;">
            <tr>
                <td style="padding: 8px 0; color: #6c757d; width: 140px;"><strong>Nombre:</strong></td>
                <td style="padding: 8px 0;">${order.customer_name}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6c757d;"><strong>Email:</strong></td>
                <td style="padding: 8px 0;"><a href="mailto:${order.customer_email}">${order.customer_email}</a></td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6c757d;"><strong>Teléfono:</strong></td>
                <td style="padding: 8px 0;"><a href="tel:${order.customer_phone}">${order.customer_phone || 'No proporcionado'}</a></td>
            </tr>
            ${order.customer_rfc ? `
            <tr>
                <td style="padding: 8px 0; color: #6c757d;"><strong>RFC:</strong></td>
                <td style="padding: 8px 0;">${order.customer_rfc}</td>
            </tr>
            ` : ''}
        </table>

        <hr class="divider">

        <h3 style="color: #8B4513; font-size: 18px;">Productos</h3>

        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
                <tr style="background-color: #f8f9fa;">
                    <th style="padding: 10px 15px; text-align: left; border-bottom: 2px solid #dee2e6; font-size: 13px;">Producto</th>
                    <th style="padding: 10px 15px; text-align: center; border-bottom: 2px solid #dee2e6; font-size: 13px;">Cant.</th>
                    <th style="padding: 10px 15px; text-align: right; border-bottom: 2px solid #dee2e6; font-size: 13px;">Precio</th>
                    <th style="padding: 10px 15px; text-align: right; border-bottom: 2px solid #dee2e6; font-size: 13px;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${productRows}
            </tbody>
        </table>

        <table style="width: 100%; max-width: 300px; margin-left: auto; margin-top: 15px;">
            <tr>
                <td style="padding: 6px 0; color: #6c757d; font-size: 14px;">Subtotal:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; font-size: 14px;">$${order.subtotal_amount.toFixed(2)}</td>
            </tr>
            ${order.shipping_cost > 0 ? `
            <tr>
                <td style="padding: 6px 0; color: #6c757d; font-size: 14px;">Envío:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 600; font-size: 14px;">$${order.shipping_cost.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${order.discount_amount > 0 ? `
            <tr>
                <td style="padding: 6px 0; color: #28a745; font-size: 14px;">Descuento:</td>
                <td style="padding: 6px 0; text-align: right; color: #28a745; font-weight: 600; font-size: 14px;">-$${order.discount_amount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr style="border-top: 2px solid #dee2e6;">
                <td style="padding: 10px 0; font-size: 16px; font-weight: bold;">Total:</td>
                <td style="padding: 10px 0; text-align: right; font-size: 16px; font-weight: bold; color: #D4AF37;">$${order.total_amount.toFixed(2)} MXN</td>
            </tr>
        </table>

        <hr class="divider">

        <h3 style="color: #8B4513; font-size: 18px;">Dirección de Envío</h3>

        <div class="info-box">
            <p style="margin: 0 0 5px 0;"><strong>${order.customer_name}</strong></p>
            <p style="margin: 0; line-height: 1.6;">
                ${order.shipping_address || order.customer_address}<br>
                ${order.shipping_city || ''} ${order.shipping_state || ''}<br>
                C.P. ${order.shipping_postal_code || ''}<br>
                Tel: ${order.customer_phone || 'No proporcionado'}
            </p>
        </div>

        <hr class="divider">

        <h3 style="color: #8B4513; font-size: 18px;">Información del Pago</h3>

        <table style="width: 100%; margin: 15px 0;">
            <tr>
                <td style="padding: 8px 0; color: #6c757d; width: 180px;"><strong>Método de Pago:</strong></td>
                <td style="padding: 8px 0;">${order.payment_method === 'openpay' ? 'Openpay (BBVA)' : order.payment_method}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6c757d;"><strong>Estado del Pago:</strong></td>
                <td style="padding: 8px 0;">
                    <span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: bold;">
                        ✅ PAGADO
                    </span>
                </td>
            </tr>
            ${order.payment_reference ? `
            <tr>
                <td style="padding: 8px 0; color: #6c757d;"><strong>Referencia de Pago:</strong></td>
                <td style="padding: 8px 0;">${order.payment_reference}</td>
            </tr>
            ` : ''}
            ${order.coupon_code ? `
            <tr>
                <td style="padding: 8px 0; color: #6c757d;"><strong>Cupón Usado:</strong></td>
                <td style="padding: 8px 0;">${order.coupon_code} (-$${order.discount_amount.toFixed(2)})</td>
            </tr>
            ` : ''}
        </table>

        ${order.special_instructions ? `
        <hr class="divider">

        <h3 style="color: #8B4513; font-size: 18px;">Instrucciones Especiales</h3>

        <div class="warning-box">
            <p style="margin: 0;">${order.special_instructions}</p>
        </div>
        ` : ''}

        <hr class="divider">

        <div style="text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #2c3e50;">
                Acciones Requeridas
            </p>
            <p style="margin: 0 0 15px 0; color: #6c757d;">
                1. Preparar productos para empaque<br>
                2. Generar guía de envío<br>
                3. Actualizar número de rastreo en el sistema
            </p>
            <a href="https://estudioartesana.com/admin/pedidos.html?order=${order.id}" class="button">
                Ver Pedido en Admin
            </a>
        </div>

        <div class="info-box" style="margin-top: 20px;">
            <p style="margin: 0;"><strong>📋 ID del Pedido:</strong> ${order.id}</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #6c757d;">
                Usa este ID para buscar el pedido en la base de datos
            </p>
        </div>
    `;

    return baseTemplate(content, { title: `🚨 Nuevo Pedido #${order.order_number || order.id}` });
};

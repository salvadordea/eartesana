/**
 * Welcome Email Template
 * Email de bienvenida enviado después del registro
 */

const baseTemplate = require('./base-template');

module.exports = ({ fullName, email, verificationUrl }) => {
    const content = `
        <h2>¡Bienvenido a Estudio Artesana, ${fullName}!</h2>

        <p>Gracias por unirte a nuestra comunidad de amantes del arte y la artesanía mexicana.</p>

        <div class="success-box">
            <p style="margin: 0;"><strong>✅ Tu cuenta ha sido creada exitosamente</strong></p>
        </div>

        <p>Para comenzar a disfrutar de todos los beneficios, necesitamos que verifiques tu dirección de email:</p>

        <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">
                Verificar mi Email
            </a>
        </div>

        <div class="info-box">
            <p style="margin: 0 0 10px 0;"><strong>¿Por qué verificar mi email?</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
                <li>Protege tu cuenta de accesos no autorizados</li>
                <li>Recibe notificaciones de tus pedidos</li>
                <li>Recupera tu contraseña si la olvidas</li>
                <li>Accede a promociones exclusivas</li>
            </ul>
        </div>

        <hr class="divider">

        <h3 style="color: #8B4513; font-size: 18px;">¿Qué puedes hacer en Estudio Artesana?</h3>

        <p><strong>🛍️ Explora nuestro catálogo</strong><br>
        Descubre piezas únicas de artesanía mexicana, desde textiles hasta cerámica.</p>

        <p><strong>💳 Compra segura</strong><br>
        Paga con tarjeta o en tiendas OXXO/7-Eleven de forma 100% segura.</p>

        <p><strong>📦 Envíos a todo México</strong><br>
        Recibe tus productos con envío rastreado en 3-5 días hábiles.</p>

        <p><strong>🎁 Ofertas exclusivas</strong><br>
        Recibe promociones especiales y descuentos para miembros.</p>

        <hr class="divider">

        <div class="warning-box">
            <p style="margin: 0;"><strong>⚠️ Importante:</strong> Este enlace de verificación expira en 24 horas. Si no verificas tu email a tiempo, deberás solicitar un nuevo enlace.</p>
        </div>

        <p style="font-size: 14px; color: #6c757d;">
            Si no creaste esta cuenta, por favor ignora este email.
        </p>
    `;

    return baseTemplate(content, { title: 'Bienvenido a Estudio Artesana' });
};

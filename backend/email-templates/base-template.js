/**
 * Base Email Template
 * Plantilla base reutilizable para todos los emails de Estudio Artesana
 */

module.exports = (content, { title = 'Estudio Artesana' } = {}) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', 'Helvetica', sans-serif;
            background-color: #f4f4f4;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .header h1 {
            color: #ffffff;
            margin: 10px 0 0 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
            color: #333333;
        }
        .content h2 {
            color: #2c3e50;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 20px;
        }
        .content p {
            margin: 15px 0;
            font-size: 16px;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #D4AF37;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
            transition: background-color 0.3s ease;
        }
        .button:hover {
            background-color: #B8941F;
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #D4AF37;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning-box {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .success-box {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            background-color: #2c2c2c;
            color: #999999;
            padding: 30px 20px;
            text-align: center;
            font-size: 13px;
        }
        .footer p {
            margin: 5px 0;
        }
        .footer a {
            color: #D4AF37;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .divider {
            border: none;
            border-top: 1px solid #e9ecef;
            margin: 30px 0;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 30px 20px !important;
            }
            .header h1 {
                font-size: 24px !important;
            }
            .content h2 {
                font-size: 20px !important;
            }
            .button {
                display: block;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="header-icon">🎨</div>
            <h1>${title}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p><strong>Estudio Artesana</strong></p>
            <p>Arte y Artesanía Mexicana</p>
            <p style="margin-top: 15px;">
                ¿Necesitas ayuda? Contáctanos por
                <a href="mailto:contacto@estudioartesana.com">email</a> o WhatsApp
            </p>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
                Este es un email automático, por favor no respondas a este mensaje.
            </p>
        </div>
    </div>
</body>
</html>
`;

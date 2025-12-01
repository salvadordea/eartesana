/**
 * Test Script para Email Service
 * ================================
 * Script para probar todos los endpoints de emails
 *
 * Uso: node backend/test-emails.js
 */

require('dotenv').config();

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3000';

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m'
};

/**
 * Función helper para hacer requests
 */
async function testEndpoint(name, endpoint, data) {
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.magenta}Testing:${colors.reset} ${name}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Data:`, JSON.stringify(data, null, 2));

    try {
        const response = await fetch(`${EMAIL_SERVICE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`${colors.green}✅ SUCCESS${colors.reset}`);
            console.log('Response:', JSON.stringify(result, null, 2));

            if (result.previewUrl) {
                console.log(`${colors.yellow}📧 Preview URL:${colors.reset} ${result.previewUrl}`);
            }

            return true;
        } else {
            console.log(`${colors.red}❌ FAILED${colors.reset}`);
            console.log('Error:', JSON.stringify(result, null, 2));
            return false;
        }

    } catch (error) {
        console.log(`${colors.red}❌ ERROR${colors.reset}`);
        console.error('Error:', error.message);
        return false;
    }
}

/**
 * Main test function
 */
async function runTests() {
    console.log(`\n${colors.green}╔════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║  Email Service Test Suite                 ║${colors.reset}`);
    console.log(`${colors.green}╚════════════════════════════════════════════╝${colors.reset}`);
    console.log(`\nEmail Service URL: ${EMAIL_SERVICE_URL}\n`);

    // Verificar que el servicio esté corriendo
    try {
        console.log(`${colors.blue}Verificando que el servicio esté corriendo...${colors.reset}`);
        const healthResponse = await fetch(`${EMAIL_SERVICE_URL}/api/health`);
        const health = await healthResponse.json();
        console.log(`${colors.green}✅ Servicio activo:${colors.reset}`, health);
    } catch (error) {
        console.log(`${colors.red}❌ El servicio no está corriendo en ${EMAIL_SERVICE_URL}${colors.reset}`);
        console.log(`${colors.yellow}Por favor inicia el servicio con: npm run dev:email${colors.reset}`);
        process.exit(1);
    }

    const results = [];

    // Test 1: Welcome Email
    results.push(await testEndpoint(
        'Welcome Email',
        '/api/email/welcome',
        {
            email: 'test@example.com',
            fullName: 'Juan Pérez'
        }
    ));

    // Wait 2 seconds between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Payment Confirmed Email
    results.push(await testEndpoint(
        'Payment Confirmed Email',
        '/api/email/payment-confirmed',
        {
            orderNumber: '#12345',
            customerEmail: 'test@example.com',
            customerName: 'María González',
            amount: 1250.00,
            paymentMethod: 'card',
            transactionId: 'openpay_test_12345'
        }
    ));

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Order Confirmation Email (requiere una orden real en Supabase)
    console.log(`\n${colors.yellow}⚠️  NOTA: El test de Order Confirmation requiere un orderId válido en Supabase${colors.reset}`);
    console.log(`${colors.yellow}   Puedes testearlo manualmente cuando tengas órdenes reales${colors.reset}`);

    // Test 4: Admin Notification Email (requiere una orden real en Supabase)
    console.log(`\n${colors.yellow}⚠️  NOTA: El test de Admin Notification requiere un orderId válido en Supabase${colors.reset}`);
    console.log(`${colors.yellow}   Puedes testearlo manualmente cuando tengas órdenes reales${colors.reset}`);

    // Summary
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.magenta}Test Summary${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

    const passed = results.filter(r => r).length;
    const failed = results.filter(r => !r).length;

    console.log(`Total Tests: ${results.length}`);
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

    if (failed === 0) {
        console.log(`\n${colors.green}🎉 ¡Todos los tests pasaron!${colors.reset}`);
    } else {
        console.log(`\n${colors.red}❌ Algunos tests fallaron. Revisa los errores arriba.${colors.reset}`);
    }

    // Instrucciones adicionales
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.magenta}Próximos Pasos${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`\n1. ${colors.yellow}Verifica los emails en Ethereal (links arriba)${colors.reset}`);
    console.log(`2. ${colors.yellow}Para producción, configura Gmail App Password en .env${colors.reset}`);
    console.log(`3. ${colors.yellow}Testea order-confirmation con un orderId real:${colors.reset}`);
    console.log(`   ${colors.blue}curl -X POST ${EMAIL_SERVICE_URL}/api/email/order-confirmation \\${colors.reset}`);
    console.log(`   ${colors.blue}-H "Content-Type: application/json" \\${colors.reset}`);
    console.log(`   ${colors.blue}-d '{"orderId":"uuid-aqui","customerEmail":"test@example.com"}'${colors.reset}`);
    console.log(`\n4. ${colors.yellow}Configura Supabase Auth:${colors.reset}`);
    console.log(`   - Dashboard > Authentication > Settings`);
    console.log(`   - Enable "Confirm email"`);
    console.log(`   - Add redirect URL: http://localhost:8080/auth-callback.html`);
    console.log(`\n${colors.green}¡Listo para producción!${colors.reset}\n`);
}

// Ejecutar tests
runTests().catch(error => {
    console.error(`${colors.red}Error fatal:${colors.reset}`, error);
    process.exit(1);
});

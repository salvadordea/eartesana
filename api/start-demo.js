const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🎨 ESTUDIO ARTESANA - DEMO INTEGRACIÓN');
console.log('=====================================');

// Verificar que existe la estructura necesaria
const checkPaths = [
    '../backup/backup-data',
    '../estudio-artesana-store/src/data',
    'server.js',
    'tienda-api-client.js',
    'tienda-integration.js'
];

console.log('🔍 Verificando archivos...');

let allFilesExist = true;
checkPaths.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${filePath}`);
    } else {
        console.log(`❌ ${filePath} - NO ENCONTRADO`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('\n❌ Faltan archivos necesarios. Verifica la estructura del proyecto.');
    process.exit(1);
}

console.log('\n🚀 Iniciando servidor API...');
console.log('=====================================');

// Ejecutar el servidor
const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname),
    stdio: 'inherit'
});

serverProcess.on('error', (error) => {
    console.error('❌ Error iniciando el servidor:', error);
});

serverProcess.on('close', (code) => {
    console.log(`\n📊 Servidor terminado con código: ${code}`);
});

// Manejar Ctrl+C
process.on('SIGINT', () => {
    console.log('\n🛑 Deteniendo servidor...');
    serverProcess.kill('SIGINT');
});

// Mostrar instrucciones después de 3 segundos
setTimeout(() => {
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('==================');
    console.log('1. 🌐 Abrir tienda HTML en navegador');
    console.log('2. 🔧 Modificar scripts según INSTRUCCIONES_INTEGRACION.md');
    console.log('3. 🧪 Probar filtros, búsqueda y carrito');
    console.log('\n🔗 URLs de prueba:');
    console.log('   • API Test: http://localhost:3001/api/test');
    console.log('   • Productos: http://localhost:3001/api/productos');
    console.log('   • Categorías: http://localhost:3001/api/categorias');
    console.log('\n💡 Presiona Ctrl+C para detener el servidor');
}, 3000);

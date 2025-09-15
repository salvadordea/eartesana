const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servidor API de Estudio Artesana...');
console.log('====================================================');

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

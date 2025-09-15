const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');

console.log('🎨 ESTUDIO ARTESANA - DEMO COMPLETO');
console.log('===================================');

// Configuración
const API_PORT = 3001;
const TIENDA_PORT = 8080;

// Verificar estructura del proyecto
const checkPaths = [
    'api/server.js',
    'api/tienda-api-client.js',
    'api/tienda-integration.js',
    'tienda/index.html',
    'backup/backup-data',
    'estudio-artesana-store/src/data'
];

console.log('🔍 Verificando estructura del proyecto...');
let allPathsExist = true;

checkPaths.forEach(filePath => {
    if (fs.existsSync(path.join(__dirname, filePath))) {
        console.log(`✅ ${filePath}`);
    } else {
        console.log(`❌ ${filePath} - NO ENCONTRADO`);
        allPathsExist = false;
    }
});

if (!allPathsExist) {
    console.log('\n❌ Faltan archivos necesarios. Verifica la estructura del proyecto.');
    process.exit(1);
}

// Crear servidor estático para la tienda HTML
function createStaticServer() {
    const app = express();
    
    // Servir archivos estáticos
    app.use(express.static(__dirname));
    
    // Configurar CORS para permitir conexiones con el API
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });
    
    // Ruta principal que sirve la tienda
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'tienda', 'index.html'));
    });
    
    // Ruta para la tienda
    app.get('/tienda', (req, res) => {
        res.sendFile(path.join(__dirname, 'tienda', 'index.html'));
    });
    
    return app;
}

// Función para verificar si un puerto está libre
function checkPort(port) {
    return new Promise((resolve) => {
        const server = http.createServer();
        
        server.listen(port, () => {
            server.close(() => resolve(true));
        });
        
        server.on('error', () => resolve(false));
    });
}

async function startServices() {
    console.log('\n🚀 Iniciando servicios...');
    console.log('==========================');
    
    // Verificar puertos disponibles
    const apiPortAvailable = await checkPort(API_PORT);
    const tiendaPortAvailable = await checkPort(TIENDA_PORT);
    
    if (!apiPortAvailable) {
        console.log(`❌ Puerto ${API_PORT} ocupado. Cierra otros servicios en este puerto.`);
        process.exit(1);
    }
    
    if (!tiendaPortAvailable) {
        console.log(`❌ Puerto ${TIENDA_PORT} ocupado. Cierra otros servicios en este puerto.`);
        process.exit(1);
    }
    
    // 1. Iniciar servidor API
    console.log(`📡 Iniciando servidor API en puerto ${API_PORT}...`);
    const apiProcess = spawn('node', ['api/server.js'], {
        cwd: __dirname,
        stdio: 'pipe'
    });
    
    // Capturar salida del API
    apiProcess.stdout.on('data', (data) => {
        console.log(`[API] ${data.toString().trim()}`);
    });
    
    apiProcess.stderr.on('data', (data) => {
        console.error(`[API ERROR] ${data.toString().trim()}`);
    });
    
    // Esperar 2 segundos para que el API se inicie
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Iniciar servidor estático para la tienda
    console.log(`🌐 Iniciando servidor de tienda en puerto ${TIENDA_PORT}...`);
    const staticApp = createStaticServer();
    const staticServer = staticApp.listen(TIENDA_PORT, () => {
        console.log(`✅ Servidor de tienda corriendo en http://localhost:${TIENDA_PORT}`);
    });
    
    // Mostrar URLs útiles
    setTimeout(() => {
        console.log('\n🎯 SERVICIOS ACTIVOS');
        console.log('====================');
        console.log(`🌐 Tienda HTML:     http://localhost:${TIENDA_PORT}`);
        console.log(`🌐 Tienda directa:  http://localhost:${TIENDA_PORT}/tienda`);
        console.log(`📡 API Backend:     http://localhost:${API_PORT}`);
        console.log(`🧪 API Test:        http://localhost:${API_PORT}/api/test`);
        console.log(`📦 Productos API:   http://localhost:${API_PORT}/api/productos`);
        console.log(`📂 Categorías API:  http://localhost:${API_PORT}/api/categorias`);
        
        console.log('\n📋 PASOS SIGUIENTES');
        console.log('===================');
        console.log('1. 🌐 Abrir http://localhost:8080 en tu navegador');
        console.log('2. 🔧 Modificar scripts en tienda/index.html según instrucciones');
        console.log('3. 🧪 Probar filtros, búsqueda y carrito de compras');
        console.log('4. 📱 La consola del navegador mostrará los logs de integración');
        
        console.log('\n💡 Presiona Ctrl+C para detener ambos servidores');
    }, 1000);
    
    // Manejar cierre limpio
    const cleanup = () => {
        console.log('\n🛑 Cerrando servicios...');
        
        if (apiProcess && !apiProcess.killed) {
            apiProcess.kill('SIGTERM');
            console.log('✅ Servidor API cerrado');
        }
        
        if (staticServer) {
            staticServer.close(() => {
                console.log('✅ Servidor de tienda cerrado');
                process.exit(0);
            });
        }
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
    
    // Manejar errores del proceso API
    apiProcess.on('error', (error) => {
        console.error('❌ Error en servidor API:', error.message);
    });
    
    apiProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`❌ Servidor API cerrado con código: ${code}`);
        }
    });
}

// Iniciar todo
startServices().catch(error => {
    console.error('❌ Error iniciando servicios:', error);
    process.exit(1);
});

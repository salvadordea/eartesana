const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

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
    'tienda/index-api.html',
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

// Servidor HTTP estático simple (sin Express para evitar dependencias)
function createSimpleStaticServer() {
    const server = http.createServer((req, res) => {
        let filePath = '.' + req.url;
        
        // Rutas especiales
        if (req.url === '/' || req.url === '') {
            filePath = './tienda/index-api.html';
        } else if (req.url === '/tienda' || req.url === '/tienda/') {
            filePath = './tienda/index-api.html';
        } else if (req.url.startsWith('/tienda/')) {
            filePath = '.' + req.url;
        }
        
        // Servir archivos
        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 - Archivo no encontrado</h1>', 'utf-8');
                } else {
                    res.writeHead(500);
                    res.end(`Error del servidor: ${err.code}`, 'utf-8');
                }
            } else {
                // Determinar Content-Type
                let contentType = 'text/html';
                const extname = path.extname(filePath).toLowerCase();
                const mimeTypes = {
                    '.html': 'text/html',
                    '.js': 'text/javascript',
                    '.css': 'text/css',
                    '.json': 'application/json',
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg',
                    '.gif': 'image/gif',
                    '.svg': 'image/svg+xml',
                    '.ico': 'image/x-icon',
                    '.webp': 'image/webp'
                };
                
                contentType = mimeTypes[extname] || 'application/octet-stream';
                
                // Headers CORS
                res.writeHead(200, { 
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                });
                res.end(content, 'utf-8');
            }
        });
    });
    
    return server;
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
        console.log('💡 Tip: Ejecuta "netstat -ano | findstr :3001" para ver qué proceso está usando el puerto');
        process.exit(1);
    }
    
    if (!tiendaPortAvailable) {
        console.log(`❌ Puerto ${TIENDA_PORT} ocupado. Cierra otros servicios en este puerto.`);
        console.log('💡 Tip: Ejecuta "netstat -ano | findstr :8080" para ver qué proceso está usando el puerto');
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
        const output = data.toString().trim();
        if (output) {
            console.log(`[API] ${output}`);
        }
    });
    
    apiProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        if (error) {
            console.error(`[API ERROR] ${error}`);
        }
    });
    
    // Esperar 3 segundos para que el API se inicie
    console.log('⏳ Esperando que el API se inicie...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 2. Iniciar servidor estático para la tienda
    console.log(`🌐 Iniciando servidor de tienda en puerto ${TIENDA_PORT}...`);
    const staticServer = createSimpleStaticServer();
    
    staticServer.listen(TIENDA_PORT, () => {
        console.log(`✅ Servidor de tienda corriendo en http://localhost:${TIENDA_PORT}`);
        showInfo();
    });
    
    staticServer.on('error', (error) => {
        console.error(`❌ Error en servidor de tienda:`, error.message);
    });
    
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
        } else {
            process.exit(0);
        }
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
    
    // Manejar errores del proceso API
    apiProcess.on('error', (error) => {
        console.error('❌ Error en servidor API:', error.message);
        if (error.code === 'ENOENT') {
            console.error('💡 Verifica que Node.js esté instalado correctamente');
        }
    });
    
    apiProcess.on('close', (code) => {
        if (code !== 0 && code !== null) {
            console.error(`❌ Servidor API cerrado inesperadamente con código: ${code}`);
        }
    });
}

function showInfo() {
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
        console.log('2. 🔧 La tienda ya está configurada para usar el API backend');
        console.log('3. 🧪 Probar filtros, búsqueda y carrito de compras');
        console.log('4. 📱 Abrir DevTools para ver los logs de integración');
        
        console.log('\n🔧 FUNCIONALIDADES DISPONIBLES');
        console.log('===============================');
        console.log('✅ Carga dinámica de 48 productos y 18 categorías');
        console.log('✅ Filtros por precio, categoría, ofertas, destacados');
        console.log('✅ Búsqueda en tiempo real');
        console.log('✅ Paginación automática');
        console.log('✅ Carrito de compras con localStorage');
        console.log('✅ Notificaciones elegantes');
        console.log('✅ Vista grid/lista');
        
        console.log('\n💡 Presiona Ctrl+C para detener ambos servidores');
        console.log('🚀 Para producción, revisa ESTRATEGIA_PRODUCCION.md');
    }, 1000);
}

// Iniciar todo
console.log('🚀 Iniciando Estudio Artesana Demo...\n');

startServices().catch(error => {
    console.error('❌ Error iniciando servicios:', error.message);
    
    if (error.code === 'EADDRINUSE') {
        console.error('💡 Otro servicio está usando uno de los puertos. Ciérralo antes de continuar.');
    }
    
    process.exit(1);
});

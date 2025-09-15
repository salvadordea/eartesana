const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Servir imágenes de productos
app.use('/images', express.static(path.join(__dirname, '../../backup/backup-data')));

// Cargar datos del backup convertido
let productos = [];
let categorias = [];
let inventario = {};
let storeConfig = {};

function loadData() {
    try {
        // Intentar cargar desde el proyecto Next.js convertido
        const nextjsDataPath = '../estudio-artesana-store/src/data';
        
        if (fs.existsSync(path.join(__dirname, nextjsDataPath, 'products.json'))) {
            productos = JSON.parse(fs.readFileSync(path.join(__dirname, nextjsDataPath, 'products.json'), 'utf8'));
            categorias = JSON.parse(fs.readFileSync(path.join(__dirname, nextjsDataPath, 'categories.json'), 'utf8'));
            inventario = JSON.parse(fs.readFileSync(path.join(__dirname, nextjsDataPath, 'inventory.json'), 'utf8'));
            storeConfig = JSON.parse(fs.readFileSync(path.join(__dirname, nextjsDataPath, 'store-config.json'), 'utf8'));
            
            console.log(`✅ Datos cargados: ${productos.length} productos, ${categorias.length} categorías`);
        } else {
            // Fallback: cargar desde backup original si no existe el convertido
            const backupPath = '../backup/backup-data';
            const folders = fs.readdirSync(path.join(__dirname, backupPath))
                .filter(f => fs.statSync(path.join(__dirname, backupPath, f)).isDirectory())
                .sort()
                .reverse();
            
            if (folders.length > 0) {
                const latestBackup = folders[0];
                const backupDataPath = path.join(__dirname, backupPath, latestBackup);
                
                productos = JSON.parse(fs.readFileSync(path.join(backupDataPath, 'products', 'all-products.json'), 'utf8'));
                categorias = JSON.parse(fs.readFileSync(path.join(backupDataPath, 'categories', 'all-categories.json'), 'utf8'));
                
                console.log(`✅ Datos cargados desde backup: ${productos.length} productos, ${categorias.length} categorías`);
            }
        }
    } catch (error) {
        console.error('❌ Error cargando datos:', error.message);
        productos = [];
        categorias = [];
    }
}

// Cargar datos al iniciar
loadData();

// Función para formatear precio
function formatPrice(price) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(price);
}

// Función para obtener imagen del producto
function getProductImage(product) {
    if (product.images && product.images.length > 0) {
        // Si hay imagen local del backup convertido
        if (product.images[0].localFileName) {
            return `/images/images/${product.images[0].localFileName}`;
        }
        // Si no, usar la URL original
        return product.images[0].src;
    }
    return '/images/placeholder-product.jpg';
}

// ==========================================
// RUTAS API
// ==========================================

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API funcionando correctamente',
        products: productos.length,
        categories: categorias.length,
        timestamp: new Date().toISOString()
    });
});

// Obtener todas las categorías
app.get('/api/categorias', (req, res) => {
    try {
        const categoriasConProductos = categorias.map(cat => {
            const productosEnCategoria = productos.filter(p => 
                p.categories && p.categories.includes(cat.id)
            );
            
            return {
                id: cat.id,
                name: cat.name,
                slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
                description: cat.description || '',
                count: productosEnCategoria.length,
                image: null // TODO: agregar imágenes de categorías si las hay
            };
        });
        
        res.json(categoriasConProductos);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo categorías' });
    }
});

// Obtener todos los productos con filtros
app.get('/api/productos', (req, res) => {
    try {
        let productosFormateados = productos.map(product => ({
            id: product.id,
            name: product.name,
            slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
            description: product.description || '',
            shortDescription: product.short_description || '',
            price: parseFloat(product.price) || 0,
            formattedPrice: formatPrice(parseFloat(product.price) || 0),
            regularPrice: parseFloat(product.regular_price) || parseFloat(product.price) || 0,
            salePrice: parseFloat(product.sale_price) || 0,
            onSale: !!(product.sale_price && parseFloat(product.sale_price) > 0),
            type: product.type || 'simple',
            status: product.status || 'active',
            featured: product.featured || false,
            categories: product.categories || [],
            images: product.images || [],
            mainImage: getProductImage(product),
            variations: product.variations || [],
            attributes: product.attributes || [],
            inStock: true, // Por defecto en stock
            totalSales: product.total_sales || 0,
            averageRating: '4.8', // Rating fijo por ahora
            dateCreated: product.date_created || new Date().toISOString(),
            permalink: `/tienda/producto/${product.slug || product.id}`
        }));

        // Filtros
        const { 
            categoria, 
            minPrice, 
            maxPrice, 
            onSale, 
            featured, 
            inStock, 
            search, 
            sort, 
            limit, 
            offset 
        } = req.query;

        // Filtrar por categoría
        if (categoria && categoria !== 'todos') {
            const categoriaId = parseInt(categoria);
            if (!isNaN(categoriaId)) {
                productosFormateados = productosFormateados.filter(p => 
                    p.categories.includes(categoriaId)
                );
            }
        }

        // Filtrar por precio
        if (minPrice) {
            const min = parseFloat(minPrice);
            productosFormateados = productosFormateados.filter(p => p.price >= min);
        }
        if (maxPrice) {
            const max = parseFloat(maxPrice);
            productosFormateados = productosFormateados.filter(p => p.price <= max);
        }

        // Filtrar por oferta
        if (onSale === 'true') {
            productosFormateados = productosFormateados.filter(p => p.onSale);
        }

        // Filtrar por destacados
        if (featured === 'true') {
            productosFormateados = productosFormateados.filter(p => p.featured);
        }

        // Filtrar por stock
        if (inStock === 'true') {
            productosFormateados = productosFormateados.filter(p => p.inStock);
        }

        // Búsqueda por texto
        if (search) {
            const searchTerm = search.toLowerCase();
            productosFormateados = productosFormateados.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm)
            );
        }

        // Ordenamiento
        switch (sort) {
            case 'price-asc':
                productosFormateados.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                productosFormateados.sort((a, b) => b.price - a.price);
                break;
            case 'title-asc':
                productosFormateados.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'title-desc':
                productosFormateados.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'date-desc':
                productosFormateados.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
                break;
            case 'date-asc':
                productosFormateados.sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));
                break;
            case 'popularity':
                productosFormateados.sort((a, b) => b.totalSales - a.totalSales);
                break;
            default:
                // Por defecto: título A-Z
                productosFormateados.sort((a, b) => a.name.localeCompare(b.name));
        }

        // Paginación
        const total = productosFormateados.length;
        const startIndex = parseInt(offset) || 0;
        const endIndex = limit ? startIndex + parseInt(limit) : undefined;
        
        if (limit) {
            productosFormateados = productosFormateados.slice(startIndex, endIndex);
        }

        res.json({
            products: productosFormateados,
            total: total,
            count: productosFormateados.length,
            filters: {
                categoria,
                minPrice,
                maxPrice,
                onSale,
                featured,
                inStock,
                search,
                sort
            }
        });

    } catch (error) {
        console.error('Error en /api/productos:', error);
        res.status(500).json({ error: 'Error obteniendo productos' });
    }
});

// Obtener producto específico por ID o slug
app.get('/api/producto/:identifier', (req, res) => {
    try {
        const { identifier } = req.params;
        
        // Buscar por ID o slug
        let producto = productos.find(p => 
            p.id.toString() === identifier || 
            p.slug === identifier ||
            p.name.toLowerCase().replace(/\s+/g, '-') === identifier
        );

        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Formatear producto completo
        const productoFormateado = {
            id: producto.id,
            name: producto.name,
            slug: producto.slug || producto.name.toLowerCase().replace(/\s+/g, '-'),
            description: producto.description || '',
            shortDescription: producto.short_description || '',
            price: parseFloat(producto.price) || 0,
            formattedPrice: formatPrice(parseFloat(producto.price) || 0),
            regularPrice: parseFloat(producto.regular_price) || parseFloat(producto.price) || 0,
            salePrice: parseFloat(producto.sale_price) || 0,
            onSale: !!(producto.sale_price && parseFloat(producto.sale_price) > 0),
            type: producto.type || 'simple',
            status: producto.status || 'active',
            featured: producto.featured || false,
            categories: producto.categories || [],
            images: producto.images || [],
            mainImage: getProductImage(producto),
            gallery: producto.images ? producto.images.map(img => ({
                id: img.id,
                src: img.localFileName ? `/images/images/${img.localFileName}` : img.src,
                alt: img.alt || producto.name
            })) : [],
            variations: producto.variations || [],
            attributes: producto.attributes || [],
            inStock: true,
            stockQuantity: 10, // Por defecto
            totalSales: producto.total_sales || 0,
            averageRating: '4.8',
            ratingCount: Math.floor(Math.random() * 20) + 5,
            dateCreated: producto.date_created || new Date().toISOString(),
            relatedProducts: [], // TODO: implementar productos relacionados
            crossSellProducts: [],
            upsellProducts: [],
            permalink: `/tienda/producto/${producto.slug || producto.id}`
        };

        res.json(productoFormateado);

    } catch (error) {
        console.error('Error en /api/producto:', error);
        res.status(500).json({ error: 'Error obteniendo producto' });
    }
});

// Configuración de la tienda
app.get('/api/config', (req, res) => {
    res.json({
        name: 'Estudio Artesana',
        description: 'Productos artesanales únicos hechos a mano',
        currency: 'MXN',
        currencySymbol: '$',
        freeShippingMinimum: 500,
        shippingCost: 100,
        ...storeConfig
    });
});

// Estadísticas para dashboard
app.get('/api/stats', (req, res) => {
    try {
        const stats = {
            totalProducts: productos.length,
            totalCategories: categorias.length,
            activeProducts: productos.filter(p => p.status === 'publish').length,
            featuredProducts: productos.filter(p => p.featured).length,
            variableProducts: productos.filter(p => p.type === 'variable').length,
            totalVariations: productos.reduce((sum, p) => sum + (p.variations?.length || 0), 0)
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
    console.log('\n🚀 SERVIDOR API ESTUDIO ARTESANA');
    console.log('================================');
    console.log(`📡 API corriendo en: http://localhost:${PORT}`);
    console.log(`📊 Productos cargados: ${productos.length}`);
    console.log(`📂 Categorías cargadas: ${categorias.length}`);
    console.log('\n📋 ENDPOINTS DISPONIBLES:');
    console.log(`   GET  /api/test               - Test de conexión`);
    console.log(`   GET  /api/productos          - Todos los productos (con filtros)`);
    console.log(`   GET  /api/producto/:id       - Producto específico`);
    console.log(`   GET  /api/categorias         - Todas las categorías`);
    console.log(`   GET  /api/config             - Configuración de tienda`);
    console.log(`   GET  /api/stats              - Estadísticas`);
    console.log('\n🖼️  Imágenes servidas desde: /images/');
    console.log('\n💡 Para la tienda HTML: http://localhost:8080 (servidor separado)');
});

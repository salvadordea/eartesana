# 🚀 INTEGRACIÓN API CON TIENDA HTML ESTÁTICA

## Resumen de la Solución

Hemos creado un **backend API** que sirve los productos y categorías desde el backup de WooCommerce convertido, y un **cliente JavaScript** que conecta la tienda HTML estática existente con este backend.

## Arquitectura de la Solución

```
TIENDA HTML ESTÁTICA (Puerto 8080)
    ↓ JavaScript Cliente
BACKEND API (Puerto 3001)
    ↓ Lee datos de
BACKUP CONVERTIDO (JSON)
    ↑ Imágenes servidas desde
BACKUP ORIGINAL (Carpeta images)
```

## 📁 Archivos Creados

### 1. Backend API
- **`server.js`** - Servidor Express con endpoints para productos, categorías, etc.
- **`run-server.js`** - Script para ejecutar el servidor con mejor logging
- **`package.json`** - Dependencias del proyecto (express, cors, multer, mercadopago)

### 2. Cliente JavaScript
- **`tienda-api-client.js`** - Cliente API completo con funcionalidades de tienda
- **`tienda-integration.js`** - Script de integración específico para la tienda HTML

## 🔧 Cómo Integrar

### Paso 1: Iniciar el Servidor API

```bash
cd api
node run-server.js
```

El servidor se ejecutará en `http://localhost:3001` y cargará automáticamente:
- ✅ 48 productos del backup convertido
- ✅ 18 categorías 
- ✅ Imágenes servidas desde `/images/`

### Paso 2: Modificar la Tienda HTML

En el archivo `tienda/index.html`, **reemplazar los scripts existentes** de WooCommerce:

**ELIMINAR estas líneas:**
```html
<!-- WooCommerce API Scripts -->
<script src="../assets/js/woocommerce-api.js"></script>
<script src="../assets/js/woo-init.js"></script>

<!-- Category Images System -->
<script src="../assets/js/category-images.js"></script>

<!-- Categories System -->
<script src="../assets/js/dropdown-categories.js"></script>

<!-- WooCommerce Optimizer -->
<script src="../assets/js/woocommerce-optimizer.js"></script>
```

**AGREGAR estos scripts nuevos:**
```html
<!-- API Backend Integration -->
<script src="../api/tienda-api-client.js"></script>
<script src="../api/tienda-integration.js"></script>
```

### Paso 3: Actualizar Contador de Carrito

En el header, asegurar que el contador de carrito tenga la clase correcta:

```html
<span class="cart-count cart-counter" id="cartCount">0</span>
```

## 🎯 Funcionalidades Implementadas

### Backend API Endpoints

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/test` | Test de conexión |
| `GET /api/productos` | Todos los productos con filtros |
| `GET /api/producto/:id` | Producto específico |
| `GET /api/categorias` | Todas las categorías |
| `GET /api/config` | Configuración de tienda |
| `GET /api/stats` | Estadísticas |

### Filtros Disponibles

**Productos (`/api/productos`):**
- `categoria` - Filtrar por ID de categoría
- `minPrice` / `maxPrice` - Rango de precios
- `onSale` - Solo productos en oferta
- `featured` - Solo productos destacados
- `inStock` - Solo productos en stock
- `search` - Búsqueda por texto
- `sort` - Ordenamiento (price-asc, price-desc, title-asc, etc.)
- `limit` / `offset` - Paginación

### Cliente JavaScript Features

✅ **Carga dinámica de productos y categorías**
✅ **Filtros en tiempo real** (precio, categoría, ofertas)
✅ **Búsqueda instantánea**
✅ **Paginación automática**
✅ **Carrito de compras** (localStorage)
✅ **Notificaciones elegantes**
✅ **Vista de grid/lista**
✅ **Cache inteligente**
✅ **Manejo de errores**

## 🛒 Carrito de Compras

El carrito usa `localStorage` con la clave `artesana_cart`:
```javascript
// Estructura del carrito
[
  {
    id: "123",
    quantity: 2,
    dateAdded: "2025-09-15T02:00:00Z"
  }
]
```

### Funciones del Carrito

```javascript
// Agregar al carrito
window.artesanaAPI.addToCart(productId);

// Obtener carrito simple
window.artesanaAPI.getCart();

// Obtener carrito con detalles de productos
await window.artesanaAPI.getCartWithDetails();

// Limpiar carrito
window.artesanaAPI.clearCart();
```

## 🎨 Estilos CSS Necesarios

Para que la integración se vea perfecta, agrega estos estilos a `tienda.css`:

```css
/* Loading states */
.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #8B4513;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Product badges */
.product-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    z-index: 2;
}

.sale-badge {
    background: #ff4444;
    color: white;
}

.featured-badge {
    background: #ffa500;
    color: white;
    top: 10px;
    left: 10px;
}

/* Price styles */
.price-container .price-original {
    text-decoration: line-through;
    color: #999;
    font-size: 0.9em;
}

.price-container .price-sale {
    color: #ff4444;
    font-weight: bold;
    margin-left: 8px;
}

/* Category cards inline */
.category-card-inline {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    text-align: center;
    transition: transform 0.3s ease;
}

.category-card-inline:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

/* Notification styles */
.notification {
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-weight: 500;
}

/* Pagination */
.pagination {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 30px;
}

.page-btn {
    padding: 8px 12px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.page-btn:hover {
    background: #f5f5f5;
}

.page-btn.active {
    background: #8B4513;
    color: white;
    border-color: #8B4513;
}
```

## 🚦 Estado de la Integración

### ✅ Completado
- [x] Servidor API funcional con 48 productos y 18 categorías
- [x] Cliente JavaScript completo
- [x] Sistema de filtros y búsqueda
- [x] Carrito de compras con localStorage
- [x] Paginación
- [x] Manejo de errores y loading states

### 🔄 Pendiente
- [ ] Modal de vista rápida de productos
- [ ] Página individual de producto (`producto.html`)
- [ ] Página de carrito de compras
- [ ] Integración con Mercado Pago
- [ ] Sistema de favoritos/wishlist

## 🧪 Testing

### Verificar la Integración

1. **Iniciar API**: `cd api && node run-server.js`
2. **Abrir tienda HTML** con los scripts modificados
3. **Verificar en consola**:
   - ✅ "API funcionando correctamente"
   - ✅ "X productos cargados, Y categorías"
   - ✅ "Integración completada"

### URLs de Prueba

- **API Test**: `http://localhost:3001/api/test`
- **Productos**: `http://localhost:3001/api/productos`
- **Categorías**: `http://localhost:3001/api/categorias`

## 📞 Próximos Pasos

1. **Implementar la integración** siguiendo estos pasos
2. **Crear página de producto individual**
3. **Implementar carrito completo**
4. **Integrar Mercado Pago** para pagos
5. **Optimizar rendimiento** y agregar más features

---

💡 **Nota**: Esta solución mantiene completamente la tienda HTML estática actual, solo reemplaza la conexión a WooCommerce con nuestro backend API local que sirve los datos del backup convertido.

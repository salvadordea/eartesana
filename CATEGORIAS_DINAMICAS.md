# Categorías Dinámicas - Homepage

## Descripción

El sistema de categorías dinámicas carga automáticamente las categorías de productos desde WooCommerce y las muestra en la sección "Nuestras Categorías" de la homepage. Este sistema es completamente autónomo y se actualiza automáticamente cuando cambian los productos en WooCommerce.

## Archivos Incluidos

### JavaScript
- `assets/js/home-categories.js` - Script principal que maneja la carga y visualización de categorías
- `assets/js/woocommerce-api.js` - Conector API de WooCommerce 
- `assets/js/config.js` - Configuración con credenciales API

### HTML
- Sección integrada en `index.html` con IDs:
  - `homeCategoriesGrid` - Contenedor del grid de categorías
  - `homeCategoriesLoading` - Estado de carga

### CSS
- Estilos integrados en `assets/css/styles.css`:
  - `.home-categories-grid` - Grid responsive
  - `.home-category-card` - Tarjetas individuales
  - `.home-category-image`, `.home-category-info` - Elementos de la tarjeta
  - `.home-category-badge` - Badges para categorías populares

## Funcionamiento

### 1. Inicialización
- Se ejecuta automáticamente cuando se carga el DOM
- Configura las credenciales API desde `config.js`
- Inicializa la clase `HomeCategoriesLoader`

### 2. Carga de Datos
- Conecta con WooCommerce REST API
- Obtiene categorías ordenadas por cantidad de productos
- Filtra solo categorías no vacías
- Muestra máximo 6 categorías principales

### 3. Visualización
- Genera tarjetas HTML dinámicamente
- Maneja imágenes de categorías (WooCommerce o fallbacks)
- Agrega badges para categorías populares
- Implementa animaciones de aparición

### 4. Interactividad
- Click en categoría navega a tienda filtrada
- Efectos hover y animaciones
- Manejo de estados de carga y error

## Características

### Imágenes Inteligentes
1. **Prioridad 1**: Imagen de WooCommerce (si está configurada)
2. **Prioridad 2**: Imagen local basada en nombre de categoría
3. **Prioridad 3**: SVG generado dinámicamente con info de la categoría

### Mapeo de Imágenes Locales
```javascript
const categoryImages = {
    'joyeria': 'assets/images/categories/joyeria.jpg',
    'joyería': 'assets/images/categories/joyeria.jpg', 
    'accesorios': 'assets/images/categories/accesorios.jpg',
    'bolsas': 'assets/images/categories/bolsas.jpg',
    // ... más categorías
};
```

### Badges Automáticos
- **"Popular"**: 20+ productos
- **"Nueva"**: 10-19 productos
- Sin badge: < 10 productos

### Diseño Responsive
- Desktop: Grid de 3 columnas
- Tablet: Grid de 2 columnas  
- Mobile: 1 columna

### Gestión de Estados
- **Carga**: Spinner animado
- **Error**: Oculta sección graciosamente
- **Sin datos**: Oculta sección
- **Éxito**: Muestra grid con animaciones

## Configuración de Imágenes

### Estructura Recomendada
```
assets/images/categories/
├── joyeria.jpg
├── accesorios.jpg
├── bolsas.jpg
├── bolsas-mano.jpg
├── bolsas-textil.jpg
├── bolsas-cruzadas.jpg
├── portacel.jpg
└── cuadernos.jpg
```

### Especificaciones de Imagen
- **Formato**: JPG, PNG, WebP
- **Tamaño**: 400x300px mínimo
- **Relación de aspecto**: 4:3
- **Optimización**: Compresión web
- **Alt text**: Automático basado en nombre de categoría

## Personalización

### Cambiar Límite de Categorías
```javascript
this.maxCategories = 8; // Cambiar de 6 a 8
```

### Modificar Criterios de Badge
```javascript
getBadgeText(productCount) {
    if (productCount >= 50) return 'Bestseller';
    if (productCount >= 25) return 'Popular';
    if (productCount >= 10) return 'Nueva';
    return null;
}
```

### Personalizar Navegación
```javascript
// Cambiar destino del click
window.location.href = `pages/tienda/?filter=category&id=${categoryId}`;
```

## Troubleshooting

### Las categorías no se cargan
1. Verificar credenciales API en `config.js`
2. Comprobar conectividad con WooCommerce
3. Revisar consola del navegador para errores

### Imágenes no aparecen
1. Verificar que las imágenes existen en la ruta especificada
2. Comprobar nombres de archivos (case-sensitive)
3. Verificar configuración de imágenes en WooCommerce

### Estilos no se aplican
1. Verificar que `styles.css` está cargado
2. Comprobar orden de los estilos CSS
3. Verificar que los IDs HTML coinciden con el JavaScript

## Mantenimiento

### Agregar Nueva Categoría
1. **Automático**: Se agrega automáticamente cuando se crea en WooCommerce
2. **Imagen local**: Agregar imagen a `assets/images/categories/`
3. **Mapeo**: Actualizar `categoryImages` en `home-categories.js` si es necesario

### Actualizar Estilos
- Los estilos están en `assets/css/styles.css`
- Buscar secciones: `.home-category-*`
- Los estilos responsive están incluidos

### Performance
- Sistema de caché integrado (5 minutos)
- Lazy loading de imágenes automático
- Animaciones optimizadas con CSS transforms

## API Endpoints Utilizados

- `GET /wp-json/wc/v3/products/categories`
- Parámetros:
  - `hide_empty=true`
  - `per_page=50`
  - `orderby=count`
  - `order=desc`

## Compatibilidad

- **WooCommerce**: 3.5+
- **WordPress**: 5.0+
- **Navegadores**: Modernos (ES6+)
- **Mobile**: Responsive completo
- **SEO**: Amigable (lazy loading, alt tags)

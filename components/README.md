# 🎯 HEADER UNIVERSAL - ESTUDIO ARTESANA

Sistema de header universal que se adapta automáticamente a cualquier ubicación del sitio web.

## ✨ Características

- **🔄 Auto-detección de rutas**: Calcula automáticamente la profundidad y rutas correctas
- **📱 Responsive**: Se adapta a diferentes tamaños de pantalla
- **🎨 Consistente**: Mantiene el mismo diseño en todas las páginas
- **⚙️ Funcionalidad completa**: Menú móvil, dropdown de categorías, carrito
- **🔧 Fallback**: Si no puede cargar, muestra un header básico

## 📂 Archivos

```
components/
├── universal-header.html     # Template del header con placeholders
└── README.md                # Esta documentación

assets/js/
└── universal-header.js      # Script que carga y configura el header
```

## 🚀 Cómo usar

### 1. Agregar contenedor en tu HTML

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <!-- tus meta tags y CSS -->
</head>
<body>
    <!-- Header Universal Container -->
    <div id="universal-header-container">
        <!-- El header se carga dinámicamente aquí -->
    </div>
    
    <!-- resto de tu contenido -->
    
    <script src="../assets/js/universal-header.js"></script>
</body>
</html>
```

### 2. El script se inicializa automáticamente

No necesitas hacer nada más. El script:
- Detecta automáticamente dónde está el archivo
- Calcula las rutas correctas según la profundidad
- Carga el header y lo configura
- Marca como activo el enlace correspondiente

## 🔧 Cómo funciona

### Detección automática de ubicación

```javascript
// Ejemplos de detección automática:
/index.html          → depth: 0 → baseUrl: "./"
/tienda/index.html   → depth: 1 → baseUrl: "../" 
/pages/about/index.html → depth: 2 → baseUrl: "../../"
```

### Placeholders automáticos

El sistema reemplaza automáticamente estos placeholders:

**URLs:**
- `{{HOMEPAGE_URL}}` → Calculado según profundidad
- `{{TIENDA_URL}}` → Siempre apunta a `/tienda/index-api.html`
- `{{LOGO_URL}}` → Ruta correcta al logo
- etc.

**Clases activas:**
- `{{HOME_ACTIVE}}` → "active" si estás en home, "" si no
- `{{TIENDA_ACTIVE}}` → "active" si estás en tienda, "" si no
- etc.

## 📋 Ejemplo de implementación

### Para una página en la raíz:
```html
<!-- /index.html -->
<div id="universal-header-container"></div>
<script src="./assets/js/universal-header.js"></script>
```

### Para una página en subcarpeta:
```html
<!-- /tienda/index-api.html -->
<div id="universal-header-container"></div>
<script src="../assets/js/universal-header.js"></script>
```

### Para una página en subcarpeta anidada:
```html
<!-- /pages/sobre-nosotros/index.html -->
<div id="universal-header-container"></div>
<script src="../../assets/js/universal-header.js"></script>
```

## 🔍 Debug

Para ver cómo está funcionando:

```javascript
// En la consola del navegador:
console.log(window.universalHeader);

// Ver la configuración actual:
console.log(window.universalHeader.currentPath);
console.log(window.universalHeader.depth);
console.log(window.universalHeader.baseUrl);
console.log(window.universalHeader.generateUrls());
```

## ⚠️ Fallback

Si no puede cargar el header universal (por ejemplo, si el archivo no existe), automáticamente muestra un header básico con navegación mínima.

## ✅ Ventajas

1. **Sin duplicación**: Un solo archivo de template
2. **Mantenimiento fácil**: Cambios en un solo lugar
3. **Rutas automáticas**: No más errores de rutas rotas
4. **Robustez**: Fallback si algo falla
5. **Consistencia**: Mismo comportamiento en todas las páginas

## 🔧 Personalización

Para personalizar el header para páginas específicas:

```javascript
// Después de que se carga el header
document.addEventListener('DOMContentLoaded', function() {
    // Agregar funcionalidad específica de página
    if (window.universalHeader && window.universalHeader.currentPage === 'tienda') {
        // Código específico para la tienda
    }
});
```

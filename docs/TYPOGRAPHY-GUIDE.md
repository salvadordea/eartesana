# 📝 Guía de Tipografía - Estudio Artesana

## ✅ Sistema Tipográfico Homologado

### Fuentes Principales

El sitio utiliza un sistema de **dos fuentes** cargadas centralizadamente desde `assets/css/styles.css`:

#### 1. **Crimson Text** (Serif) - Fuente Principal
- **Familia**: 'Crimson Text', serif
- **Variable CSS**: `var(--font-primary)`
- **Pesos disponibles**: 400 (regular), 600 (semi-bold), 400 italic
- **Uso**: Títulos, encabezados, elementos de marca

#### 2. **Lato** (Sans-serif) - Fuente Secundaria
- **Familia**: 'Lato', sans-serif
- **Variable CSS**: `var(--font-secondary)`
- **Pesos disponibles**: 300 (light), 400 (regular), 700 (bold)
- **Uso**: Cuerpo de texto, navegación, UI, botones, formularios

---

## 📋 Guía de Uso

### Cuándo usar `var(--font-primary)` (Crimson Text)

✅ **Títulos y Encabezados**
```css
h1, h2, h3 {
    font-family: var(--font-primary);
}
```

✅ **Elementos de Marca**
```css
.logo-text,
.hero-title,
.section-title,
.page-title {
    font-family: var(--font-primary);
}
```

✅ **Elementos Elegantes/Destacados**
```css
.quote,
.featured-title,
.category-title {
    font-family: var(--font-primary);
}
```

### Cuándo usar `var(--font-secondary)` (Lato)

✅ **Cuerpo de Texto**
```css
body, p {
    font-family: var(--font-secondary);
}
```

✅ **Navegación**
```css
.nav-link,
.menu-item,
.breadcrumb {
    font-family: var(--font-secondary);
}
```

✅ **Elementos de UI**
```css
button,
.btn,
input,
select,
textarea,
.card-text {
    font-family: var(--font-secondary);
}
```

---

## 🎨 Jerarquía Tipográfica

### Títulos (usando Crimson Text)
```css
h1 {
    font-family: var(--font-primary);
    font-size: 3rem;
    font-weight: 600;
}

h2 {
    font-family: var(--font-primary);
    font-size: 2.5rem;
    font-weight: 600;
}

h3 {
    font-family: var(--font-primary);
    font-size: 2rem;
    font-weight: 400;
}
```

### Cuerpo (usando Lato)
```css
body {
    font-family: var(--font-secondary);
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.6;
}

.lead-text {
    font-family: var(--font-secondary);
    font-size: 1.125rem;
    font-weight: 300;
}
```

---

## 🚫 Evitar

❌ **NO usar fuentes hardcodeadas**
```css
/* INCORRECTO */
.elemento {
    font-family: 'Crimson Text', serif;
}

/* CORRECTO */
.elemento {
    font-family: var(--font-primary);
}
```

❌ **NO cargar fuentes desde HTML**
```html
<!-- INCORRECTO -->
<link href="https://fonts.googleapis.com/css2?family=Crimson+Text..." rel="stylesheet">

<!-- CORRECTO: Las fuentes ya están cargadas en styles.css -->
```

❌ **NO usar fuentes adicionales sin consultar**
```css
/* EVITAR */
font-family: 'Courier New', monospace;  /* ❌ */
font-family: Arial, sans-serif;         /* ❌ */

/* USAR */
font-family: var(--font-secondary);     /* ✅ */
font-family: monospace;                 /* ✅ (solo para código) */
```

---

## 📂 Archivos Actualizados

### Archivos CSS con variables estandarizadas:
- ✅ `assets/css/styles.css` - Carga centralizada de fuentes
- ✅ `assets/css/contact.css` - Variables estandarizadas
- ✅ `assets/css/mayoristas-checkout.css` - Fuentes actualizadas
- ✅ `assets/css/mayoristas-login.css` - Fuentes actualizadas

### Archivos HTML actualizados (links removidos):
- ✅ `index.html`
- ✅ `checkout.html`
- ✅ `micuenta.html`
- ✅ `producto.html`
- ✅ `tienda.html`
- ✅ `pages/*/index.html` (todos)
- ✅ `mayoristas/*.html` (todos)
- ✅ `admin/categorias.html`
- ✅ `admin/sobre-nosotros.html`

---

## 🔧 Implementación Técnica

### Carga de Fuentes (styles.css)
```css
/* Google Fonts - Carga centralizada */
@import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Lato:wght@300;400;700&display=swap');

:root {
    --font-primary: 'Crimson Text', serif;
    --font-secondary: 'Lato', sans-serif;
}

body {
    font-family: var(--font-secondary);
}
```

### Variables CSS Disponibles
```css
:root {
    /* Tipografía */
    --font-primary: 'Crimson Text', serif;      /* Para títulos */
    --font-secondary: 'Lato', sans-serif;       /* Para texto */

    /* Colores */
    --primary-color: #2c2c2c;
    --secondary-color: #C0C0C0;
    --text-color: #333;

    /* Otras */
    --transition: all 0.3s ease;
    --shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
```

---

## ✨ Ventajas del Sistema Actual

1. ✅ **Carga Optimizada**: Una sola petición HTTP para ambas fuentes
2. ✅ **Consistencia**: Variables CSS garantizan uniformidad
3. ✅ **Mantenimiento**: Cambiar fuentes en un solo lugar
4. ✅ **Rendimiento**: Sin cargas duplicadas ni redundantes
5. ✅ **Escalabilidad**: Fácil agregar nuevas fuentes si es necesario
6. ✅ **Profesionalismo**: Diseño cohesivo y elegante

---

## 🎯 Ejemplos Prácticos

### Ejemplo 1: Card de Producto
```css
.product-card {
    /* Título del producto - elegante */
    .product-title {
        font-family: var(--font-primary);
        font-size: 1.5rem;
        font-weight: 600;
    }

    /* Descripción - legible */
    .product-description {
        font-family: var(--font-secondary);
        font-size: 0.95rem;
        font-weight: 400;
    }

    /* Precio - destacado */
    .product-price {
        font-family: var(--font-primary);
        font-size: 1.8rem;
        font-weight: 600;
    }
}
```

### Ejemplo 2: Hero Section
```css
.hero-section {
    /* Título principal - impactante */
    .hero-title {
        font-family: var(--font-primary);
        font-size: 4rem;
        font-weight: 600;
        letter-spacing: -0.02em;
    }

    /* Subtítulo - complementario */
    .hero-subtitle {
        font-family: var(--font-secondary);
        font-size: 1.25rem;
        font-weight: 300;
    }

    /* CTA Button */
    .hero-cta {
        font-family: var(--font-secondary);
        font-size: 1rem;
        font-weight: 700;
        text-transform: uppercase;
    }
}
```

### Ejemplo 3: Navegación
```css
.navigation {
    font-family: var(--font-secondary);

    .nav-link {
        font-size: 0.95rem;
        font-weight: 400;
        letter-spacing: 0.5px;
    }

    .nav-link.active {
        font-weight: 700;
    }
}
```

---

## 📞 Soporte

Para dudas sobre tipografía o sugerencias de mejora, consultar este documento o contactar al equipo de desarrollo.

**Última actualización**: 2025-01-10
**Versión**: 1.0
**Estado**: ✅ Implementado y documentado

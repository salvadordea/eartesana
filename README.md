# 🎨 Estudio Artesana - Nueva Homepage

Una homepage moderna y profesional con panel de administración integrado para el sitio web de Estudio Artesana.

## ✨ Características Principales

### 🎛️ Panel de Administración
- **Interfaz visual**: Gestiona todo sin tocar código
- **Gestión de logos**: Header y Hero (convertido a blanco automáticamente)
- **Promociones dinámicas**: 5 temas estacionales con plantillas pre-hechas
- **Carrusel de productos**: Imágenes aleatorias desde WooCommerce
- **Categorías configurables**: Mostrar todas o limitadas
- **Vista previa en tiempo real**: Ve cambios antes de aplicar

### 🚀 Rendimiento Extremo
- **Cache inteligente**: LocalStorage de 24 horas para categorías
- **Carga instantánea**: Primera visita normal, siguientes instantáneas
- **Fallbacks robustos**: Si falla internet, usa datos guardados
- **Lazy loading**: Imágenes optimizadas

### 🎨 Diseño Moderno
- **Fondo negro elegante**: Look premium profesional
- **Responsive completo**: Perfecto en móviles, tablets y desktop
- **Animaciones suaves**: Efectos visuales profesionales
- **Tipografía premium**: Crimson Text + Lato

### 🛍️ Integración WooCommerce
- **API REST completa**: Conecta con tu tienda WooCommerce
- **Productos dinámicos**: Carrusel y héroe con productos reales
- **Todas las categorías**: Muestra automáticamente todas las categorías con productos
- **Imágenes inteligentes**: WooCommerce → Local → SVG generado automáticamente

## 🚀 Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/estudio-artesana-homepage.git
cd estudio-artesana-homepage
```

### 2. Configurar WooCommerce API
1. Edita `assets/js/config.js`
2. Actualiza la sección `woocommerce`:
```javascript
woocommerce: {
    baseURL: 'https://tu-sitio.com',
    consumerKey: 'tu_consumer_key',
    consumerSecret: 'tu_consumer_secret'
}
```

### 3. Subir logos (opcional)
- Coloca tu logo en `assets/images/` con nombres:
  - `logo.png` (header)
  - `logo-white.png` (hero, blanco)

### 4. ¡Listo!
- Abre `index.html` para la homepage
- Abre `admin/index.html` para el panel de admin

## 📁 Estructura del Proyecto

```
estudio-artesana-homepage/
├── admin/                      # Panel de administración
│   ├── index.html             # Interfaz del admin
│   └── admin-manager.js       # Lógica del admin
├── assets/
│   ├── css/
│   │   └── styles.css         # Estilos principales
│   ├── js/
│   │   ├── config.js          # Configuración principal ⚙️
│   │   ├── woocommerce-api.js # Conector WooCommerce
│   │   ├── home-categories.js # Gestor de categorías
│   │   ├── categories-preloader.js # Sistema de precarga
│   │   ├── promo-manager.js   # Gestor de promociones
│   │   ├── dynamic-carousel.js # Carrusel dinámico
│   │   ├── logo-manager.js    # Gestor de logos
│   │   └── main.js            # JavaScript principal
│   └── images/
│       ├── categories/        # Imágenes de categorías
│       └── logo.png          # Logos del sitio
├── pages/
│   └── tienda/               # Página de tienda (separada)
├── index.html                # Homepage principal
├── GUIA_ADMIN_PANEL.md      # Guía del panel de admin
├── GUIA_PROMOCIONES.md      # Cómo cambiar promociones
└── README.md                # Este archivo
```

## 🎛️ Uso del Panel de Admin

### Acceso
- URL: `admin/index.html`
- No requiere login (para uso local)

### Secciones Principales

#### 1. 🖼️ Gestión de Logo
- **Logo Header**: Barra superior
- **Logo Hero**: Sección principal (se convierte a blanco)
- **Vista previa**: Instantánea al seleccionar archivo

#### 2. 🛍️ Imagen Producto Principal
- **Manual**: Sube tu propia imagen
- **Aleatorio**: Toma foto random de WooCommerce
- **Descripción SEO**: Texto alternativo

#### 3. 🎉 Promoción del Mes
- **5 temas de color**: Default, San Valentín, Día Madre, Navidad, Verano
- **Plantillas pre-hechas**: 4 promociones estacionales
- **Campos editables**: Título, descripción, código, expiración, botón

#### 4. 📂 Gestión de Categorías
- **Cantidad**: Todas / Top 6 / Top 12 / Top 18
- **Ordenamiento**: Por cantidad / nombre / ID
- **Cache**: Actualización manual disponible

#### 5. 🎠 Carrusel de Productos
- **Fuentes**: Aleatorios, destacados, recientes, manual
- **Configuración**: 3-8 imágenes, velocidad 3-5 segundos
- **Botón mágico**: "Generar Nuevo" para cambiar todo

### Flujo de Trabajo
1. **Hacer cambios** en las secciones necesarias
2. **Vista previa** para revisar
3. **"Guardar Todos los Cambios"** (descarga `config.js`)
4. **Reemplazar** `assets/js/config.js` con el descargado

## 🔧 Troubleshooting

### El logo no aparece
1. Verificar que el archivo existe en `assets/images/`
2. Nombres válidos: `logo.png`, `logo-white.png`, etc.
3. Usar el admin panel para subir directamente
4. Ver consola del navegador (F12) para mensajes de error

### Las categorías no cargan
1. Verificar credenciales WooCommerce en `config.js`
2. Usar botón "Actualizar Cache" en admin
3. Ver consola para errores de API

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor:

1. **Fork** del repositorio
2. **Crear rama** para tu feature: `git checkout -b feature/nueva-caracteristica`
3. **Commit** de cambios: `git commit -m 'Agregar nueva característica'`
4. **Push** a la rama: `git push origin feature/nueva-caracteristica`
5. **Pull Request** para revisión

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

*Desarrollado con ❤️ para Estudio Artesana*

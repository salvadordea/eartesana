# 🎯 Guía para Actualizar Promociones Mensualmente

## Resumen Rápido

Para cambiar la promoción cada mes, solo necesitas editar **UN archivo**: `assets/js/config.js`

## 📝 Cómo Cambiar la Promoción

### 1. Abrir el archivo de configuración
Ubicación: `assets/js/config.js`
Buscar la sección: `promotion: {`

### 2. Modificar los valores actuales
```javascript
promotion: {
    active: true, // true = mostrar banner, false = ocultar banner
    title: '¡OFERTA ESPECIAL!', // ← Cambiar aquí
    description: '20% de descuento en tu primera compra', // ← Cambiar aquí  
    code: 'PRIMERA20', // ← Cambiar aquí
    expiry: 'Válido hasta fin de mes', // ← Cambiar aquí
    ctaText: '¡Compra Ahora!', // ← Texto del botón
    ctaLink: 'pages/tienda/index.html', // ← Enlace del botón
    icon: 'fas fa-gift', // ← Icono (ver lista abajo)
    theme: 'default' // ← Tema de colores
}
```

## 🎨 Ejemplos de Promociones por Mes

### Enero - Año Nuevo
```javascript
title: '🎊 ¡FELIZ AÑO NUEVO!',
description: '25% descuento para empezar el año con estilo',
code: 'NUEVO2025',
expiry: 'Válido todo enero',
icon: 'fas fa-sparkles',
theme: 'default'
```

### Febrero - San Valentín
```javascript
title: '💝 SAN VALENTÍN ESPECIAL',
description: '30% descuento en joyería y accesorios',
code: 'AMOR30',
expiry: 'Del 10 al 14 de febrero',
icon: 'fas fa-heart',
theme: 'valentine'
```

### Marzo - Primavera
```javascript
title: '🌸 PRIMAVERA ARTESANAL',
description: '2x1 en productos seleccionados',
code: 'PRIMAVERA2X1',
expiry: 'Todo el mes de marzo',
icon: 'fas fa-leaf',
theme: 'default'
```

### Abril - Pascua
```javascript
title: '🐰 PASCUA CREATIVA',
description: '20% descuento + envío gratis',
code: 'PASCUA20',
expiry: 'Hasta el 20 de abril',
icon: 'fas fa-gift',
theme: 'default'
```

### Mayo - Día de la Madre
```javascript
title: '🌸 DÍA DE LA MADRE',
description: '35% descuento + envío gratis',
code: 'MAMA35',
expiry: 'Válido todo mayo',
icon: 'fas fa-heart',
theme: 'mother'
```

### Junio - Verano
```javascript
title: '☀️ VERANO ARTESANAL', 
description: '25% descuento en bolsas y accesorios',
code: 'VERANO25',
expiry: 'Junio, julio y agosto',
icon: 'fas fa-sun',
theme: 'summer'
```

### Septiembre - Independencia
```javascript
title: '🇲🇽 FIESTAS PATRIAS',
description: '30% descuento en toda la tienda',
code: 'PATRIA30',
expiry: 'Del 10 al 20 de septiembre',
icon: 'fas fa-flag',
theme: 'default'
```

### Octubre - Día de Muertos
```javascript
title: '💀 DÍA DE MUERTOS',
description: '25% descuento en productos mexicanos',
code: 'MUERTOS25',
expiry: 'Del 28 de octubre al 2 de noviembre',
icon: 'fas fa-skull',
theme: 'default'
```

### Noviembre - Black Friday
```javascript
title: '🛍️ BLACK FRIDAY',
description: '50% descuento en productos seleccionados',
code: 'BLACKFRIDAY50',
expiry: 'Solo el 29 de noviembre',
icon: 'fas fa-tags',
theme: 'default'
```

### Diciembre - Navidad
```javascript
title: '🎄 NAVIDAD MÁGICA',
description: '40% descuento en compras mayores a $1000',
code: 'NAVIDAD40',
expiry: 'Del 1 al 25 de diciembre',
icon: 'fas fa-gift',
theme: 'christmas'
```

## 🎨 Temas de Colores Disponibles

- `'default'` - Dorado (tema principal)
- `'valentine'` - Rosa/Rojo (San Valentín)
- `'mother'` - Rosa suave (Día de la Madre)
- `'christmas'` - Rojo y Verde (Navidad)
- `'summer'` - Naranja (Verano)

## 🎯 Iconos Disponibles (FontAwesome)

### Celebraciones
- `'fas fa-gift'` - Regalo 🎁
- `'fas fa-heart'` - Corazón ❤️
- `'fas fa-sparkles'` - Brillos ✨
- `'fas fa-star'` - Estrella ⭐

### Estaciones
- `'fas fa-sun'` - Sol ☀️
- `'fas fa-leaf'` - Hoja 🍃
- `'fas fa-snowflake'` - Copo de nieve ❄️
- `'fas fa-flower'` - Flor 🌸

### Comerciales
- `'fas fa-percentage'` - Porcentaje %
- `'fas fa-tags'` - Etiquetas 🏷️
- `'fas fa-fire'` - Fuego 🔥
- `'fas fa-bolt'` - Rayo ⚡

### México
- `'fas fa-flag'` - Bandera 🏴
- `'fas fa-skull'` - Calavera 💀

## 🚀 Pasos Completos para Actualizar

### Paso 1: Abrir archivo
1. Navegar a: `assets/js/config.js`
2. Buscar la línea que dice: `promotion: {`

### Paso 2: Cambiar valores
1. Cambiar `title:` por el título del mes
2. Cambiar `description:` por la descripción de la oferta
3. Cambiar `code:` por el código de descuento
4. Cambiar `expiry:` por las fechas válidas
5. (Opcional) Cambiar `icon:` y `theme:`

### Paso 3: Guardar y probar
1. Guardar el archivo
2. Refrescar la página web
3. Ver que la promoción se actualice automáticamente

## 📱 Ejemplo de Cambio Rápido

Si hoy es **15 de febrero** y quieres activar la promo de San Valentín:

```javascript
// Cambiar estas líneas en config.js:
title: '💝 SAN VALENTÍN ESPECIAL',
description: '30% descuento en joyería y accesorios',
code: 'AMOR30',
expiry: 'Solo hasta el 14 de febrero',
theme: 'valentine'
```

¡Guarda el archivo y listo! 🎉

## ⚡ Cambios Avanzados (Opcional)

### Desactivar completamente el banner
```javascript
active: false, // El banner desaparece completamente
```

### Cambiar el enlace del botón
```javascript
ctaLink: 'pages/tienda/index.html?categoria=joyeria', // Enlace directo a categoría
```

### Usar texto personalizado en el botón
```javascript
ctaText: 'Ver Ofertas', // En lugar de "¡Compra Ahora!"
```

## 🔄 Automatización Futura

El sistema ya incluye código para cambiar promociones automáticamente por fechas. Si en el futuro quieres que las promociones cambien solas, solo necesitas descomentar el código en `promo-manager.js`.

## 💡 Consejos

1. **Siempre hacer backup** del archivo `config.js` antes de cambios
2. **Probar en navegador** después de cada cambio
3. **Usar códigos únicos** para cada mes (ENERO25, FEBRERO25, etc.)
4. **Mantener fechas actualizadas** para crear urgencia
5. **Cambiar el tema** según la temporada para mayor impacto visual

¡Es súper fácil! Solo un archivo, unos minutos al mes, y tendrás promociones siempre frescas 🎯

# Imágenes de Categorías

## Instrucciones

Coloca aquí las imágenes de las categorías de productos. El sistema buscará automáticamente las imágenes basándose en el nombre de la categoría.

## Archivos Requeridos

### Categorías Principales
- `joyeria.jpg` - Para categoría "Joyería" o "joyería"
- `accesorios.jpg` - Para categoría "Accesorios"
- `bolsas.jpg` - Para categoría "Bolsas" 
- `bolsas-mano.jpg` - Para categoría "Bolsas de mano"
- `bolsas-textil.jpg` - Para categoría "Bolsas textil y piel"
- `bolsas-cruzadas.jpg` - Para categoría "Bolsas cruzadas"
- `portacel.jpg` - Para categoría "Portacel"
- `cuadernos.jpg` - Para categorías "Cuadernos" o "Libretas"

## Especificaciones

- **Formato**: JPG preferido (también PNG, WebP)
- **Tamaño recomendado**: 400x300px mínimo
- **Relación de aspecto**: 4:3 (ancho x alto)
- **Peso del archivo**: Menos de 200KB por imagen
- **Calidad**: Optimizada para web

## Nombres de Archivo

Los nombres de archivo deben coincidir exactamente con el mapeo en `home-categories.js`. Si tienes categorías con nombres diferentes, actualiza el mapeo en ese archivo.

## Fallback

Si no se encuentra una imagen local, el sistema generará automáticamente un SVG con el nombre de la categoría y número de productos.

## Ejemplo de Resultado

```
assets/images/categories/
├── README_IMAGENES.md (este archivo)
├── joyeria.jpg ✓
├── accesorios.jpg ✓
├── bolsas.jpg ✓
├── bolsas-mano.jpg ✓
├── bolsas-textil.jpg ✓
├── bolsas-cruzadas.jpg ✓
├── portacel.jpg ✓
└── cuadernos.jpg ✓
```

## Agregar Nuevas Categorías

1. Agrega la imagen en esta carpeta
2. Actualiza el mapeo en `assets/js/home-categories.js`
3. La categoría aparecerá automáticamente si tiene productos

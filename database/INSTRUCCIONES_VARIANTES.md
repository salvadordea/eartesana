# 🚀 INSTALACIÓN DEL SISTEMA DE VARIANTES - ESTUDIO ARTESANA

## 📋 Resumen
Este sistema permite que los productos tengan múltiples variantes (colores, tamaños, materiales, etc.) cada una con su propio stock y precio opcional.

## 🎯 Lo que incluye:
- ✅ Tabla `product_variants` para almacenar variantes
- ✅ Triggers automáticos para actualizar stock total
- ✅ API JavaScript completa para gestión
- ✅ Panel de administración visual mejorado
- ✅ Políticas de seguridad RLS para Supabase

---

## 🚀 PASO 1: EJECUTAR EL ESQUEMA SQL

### Opción A: Método Automático (Recomendado)

```bash
# 1. Instalar dependencias (si no lo has hecho)
npm install @supabase/supabase-js

# 2. Ejecutar migración automática
node database/run-variants-migration.js
```

### Opción B: Método Manual (Si falla el automático)

1. Ve a [supabase.com](https://supabase.com)
2. Abre tu proyecto
3. Ve a **SQL Editor**
4. Copia y pega todo el contenido de `database/inventory_variants_schema.sql`
5. Presiona **Run**

---

## 📊 PASO 2: VERIFICAR LA INSTALACIÓN

Después de ejecutar el SQL, deberías tener:

### Nuevas Tablas:
- ✅ `product_variants` - Para las variantes de productos
- ✅ `variant_types` - Para tipos de variantes (Color, Talla, etc.)

### Nuevas Columnas en `products`:
- ✅ `total_stock` - Stock total calculado automáticamente
- ✅ `has_variants` - Si el producto tiene variantes
- ✅ `variant_type` - Tipo principal de variante

### Verificar en Supabase:
```sql
-- Ver estructura de variantes
SELECT * FROM product_variants LIMIT 5;

-- Ver productos con nuevas columnas  
SELECT id, name, total_stock, has_variants FROM products LIMIT 5;

-- Ver tipos de variantes
SELECT * FROM variant_types;
```

---

## 🛠️ PASO 3: USAR EL SISTEMA

### 🎨 Panel de Administración
1. Abre `admin/inventory-panel-improved.html`
2. Ya puedes:
   - ➕ Agregar variantes a productos
   - ✏️ Editar variantes existentes
   - 📦 Actualizar stock por variante
   - 🗑️ Eliminar variantes
   - 👀 Ver el stock total actualizado automáticamente

### 💻 API JavaScript
```javascript
// Crear una variante
await inventoryVariantsAPI.createVariant(productId, {
    variant_name: "Color Rojo",
    variant_value: "rojo", 
    variant_type: "color",
    stock: 10,
    price: 299.99
});

// Actualizar stock
await inventoryVariantsAPI.updateVariantStock(productId, variantId, 15);

// Obtener producto con variantes
const product = await inventoryVariantsAPI.getProductWithVariants(productId);
```

---

## 🎯 EJEMPLOS DE USO

### Ejemplo 1: Bolsa con Colores
```
Producto: "Bolsa Artesanal Maya"
├── Variante 1: Color Negro (Stock: 5)
├── Variante 2: Color Café (Stock: 8) 
└── Variante 3: Color Miel (Stock: 3)
Total Stock: 16
```

### Ejemplo 2: Cuaderno con Tamaños
```
Producto: "Cuaderno Hecho a Mano"
├── Variante 1: Tamaño A5 (Stock: 12)
├── Variante 2: Tamaño A4 (Stock: 7)
└── Variante 3: Tamaño Pocket (Stock: 20)
Total Stock: 39
```

---

## 🔧 TROUBLESHOOTING

### ❌ "Error: relation 'products' does not exist"
**Solución:** Tu base de datos no tiene la tabla `products`. Ejecuta primero:
```sql
-- Ejecutar uno de los esquemas base:
-- schema.sql O supabase_schema.sql
```

### ❌ "Error: column 'total_stock' already exists"
**Solución:** Normal, significa que ya tienes el esquema parcialmente instalado.

### ❌ No se pueden crear triggers
**Solución:** Ejecuta manualmente en el SQL Editor de Supabase.

### ❌ El panel no carga productos
**Solución:** Verifica:
1. ✅ Conexión a Supabase en `config.js`
2. ✅ Tabla `products` tiene datos
3. ✅ API `inventory-variants-api.js` está cargada

---

## 📈 FUNCIONALIDADES INCLUIDAS

### ✅ Gestión de Variantes
- [x] Crear variantes por producto
- [x] Múltiples tipos (color, talla, material, etc.)
- [x] SKU único por variante
- [x] Stock individual por variante
- [x] Precio opcional por variante
- [x] Imagen opcional por variante
- [x] Ordenamiento de variantes

### ✅ Automatización
- [x] Stock total se calcula automáticamente
- [x] Flag `has_variants` se actualiza automáticamente
- [x] Triggers para mantener consistencia
- [x] Validaciones de integridad

### ✅ Seguridad
- [x] Políticas RLS configuradas
- [x] Acceso público solo a variantes activas
- [x] Gestión admin protegida

### ✅ API Completa
- [x] CRUD completo de variantes
- [x] Actualización de stock
- [x] Generación automática de SKU
- [x] Listado con filtros
- [x] Estadísticas de inventario

---

## 🎉 ¡LISTO!

Tu sistema de variantes ya está instalado y funcionando. 

### Próximos pasos:
1. 🛒 Integrar con el sistema de carrito de compras
2. 🎨 Agregar selector de variantes en la tienda
3. 📊 Crear reportes de inventario por variante
4. 🔄 Configurar notificaciones de stock bajo

---

## 📞 Soporte

Si tienes algún problema:
1. Revisa que Supabase esté configurado correctamente
2. Verifica que la tabla `products` existe y tiene datos
3. Revisa la consola del navegador para errores JavaScript
4. Ejecuta los SQL manualmente si la migración automática falla

**¡Todo está listo para que Estudio Artesana tenga un sistema de inventario con variantes profesional!** 🎨✨

-- ===================================================================
-- MIGRACIÓN: Agregar category_id directo a la tabla products
-- ===================================================================
-- Este script migra de la estructura con tabla intermedia product_categories
-- a una estructura simplificada con category_id directo en products
-- ===================================================================

-- 1. Agregar la columna category_id a la tabla products
ALTER TABLE products 
ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;

-- 2. Migrar datos existentes de product_categories a products.category_id
UPDATE products 
SET category_id = pc.category_id
FROM product_categories pc 
WHERE products.id = pc.product_id;

-- 3. Crear índice para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- 4. Opcional: Eliminar tabla product_categories (descomenta si estás seguro)
-- DROP TABLE IF EXISTS product_categories;

-- ===================================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- ===================================================================

-- Verificar que los datos se migraron correctamente
SELECT 
    'Productos con categoría migrados' as descripcion,
    COUNT(*) as cantidad
FROM products 
WHERE category_id IS NOT NULL
UNION ALL
SELECT 
    'Productos sin categoría' as descripcion,
    COUNT(*) as cantidad
FROM products 
WHERE category_id IS NULL
UNION ALL
SELECT 
    'Total de productos' as descripcion,
    COUNT(*) as cantidad
FROM products;

-- Verificar integridad de referencias
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.category_id,
    c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.name
LIMIT 10;

-- ===================================================================
-- ROLLBACK (en caso de necesitar revertir)
-- ===================================================================

-- Si necesitas revertir la migración, ejecuta esto:
-- 
-- -- Recrear tabla product_categories
-- CREATE TABLE IF NOT EXISTS product_categories (
--     id SERIAL PRIMARY KEY,
--     product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
--     category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     UNIQUE(product_id, category_id)
-- );
--
-- -- Migrar datos de vuelta
-- INSERT INTO product_categories (product_id, category_id)
-- SELECT id, category_id 
-- FROM products 
-- WHERE category_id IS NOT NULL;
--
-- -- Eliminar columna
-- ALTER TABLE products DROP COLUMN IF EXISTS category_id;
--
-- -- Eliminar índice
-- DROP INDEX IF EXISTS idx_products_category_id;

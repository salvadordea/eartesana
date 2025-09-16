-- ================================================
-- COMPLETAR INSTALACIÓN DEL SISTEMA DE VARIANTES
-- ================================================
-- Ejecuta estos comandos UNO POR UNO en Supabase SQL Editor

-- 1. AGREGAR COLUMNAS A LA TABLA PRODUCTS
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS total_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS variant_type VARCHAR(50) DEFAULT NULL;

-- 2. CREAR TABLA VARIANT_TYPES
CREATE TABLE IF NOT EXISTS variant_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INSERTAR TIPOS DE VARIANTES
INSERT INTO variant_types (name, display_name) VALUES
('color', 'Color'),
('talla', 'Talla'),
('material', 'Material'),
('tamaño', 'Tamaño'),
('acabado', 'Acabado')
ON CONFLICT (name) DO NOTHING;

-- 4. CREAR FUNCIÓN PARA ACTUALIZAR STOCK TOTAL
CREATE OR REPLACE FUNCTION update_product_total_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE products 
        SET 
            total_stock = (
                SELECT COALESCE(SUM(stock), 0) 
                FROM product_variants 
                WHERE product_id = NEW.product_id AND is_active = TRUE
            ),
            has_variants = TRUE,
            updated_at = NOW()
        WHERE id = NEW.product_id;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE products 
        SET 
            total_stock = (
                SELECT COALESCE(SUM(stock), 0) 
                FROM product_variants 
                WHERE product_id = OLD.product_id AND is_active = TRUE
            ),
            has_variants = (
                SELECT COUNT(*) > 0 
                FROM product_variants 
                WHERE product_id = OLD.product_id AND is_active = TRUE
            ),
            updated_at = NOW()
        WHERE id = OLD.product_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. CREAR TRIGGERS (si no existen ya)
DROP TRIGGER IF EXISTS trigger_update_product_stock_insert ON product_variants;
CREATE TRIGGER trigger_update_product_stock_insert
    AFTER INSERT ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_product_total_stock();

DROP TRIGGER IF EXISTS trigger_update_product_stock_update ON product_variants;
CREATE TRIGGER trigger_update_product_stock_update
    AFTER UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_product_total_stock();

DROP TRIGGER IF EXISTS trigger_update_product_stock_delete ON product_variants;
CREATE TRIGGER trigger_update_product_stock_delete
    AFTER DELETE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_product_total_stock();

-- 6. CREAR VISTA PRODUCT_VARIANTS_SUMMARY
CREATE OR REPLACE VIEW product_variants_summary AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    array_agg(DISTINCT jsonb_build_object(
        'id', pc.category_id,
        'name', c.name
    )) FILTER (WHERE c.name IS NOT NULL) as categories,
    p.price as base_price,
    p.has_variants,
    p.total_stock,
    COUNT(pv.id) as variant_count,
    array_agg(
        pv.variant_name || ' (Stock: ' || pv.stock || ')'
        ORDER BY pv.sort_order
    ) FILTER (WHERE pv.id IS NOT NULL) as variants_summary,
    array_agg(
        jsonb_build_object(
            'id', pv.id,
            'name', pv.variant_name,
            'value', pv.variant_value,
            'type', pv.variant_type,
            'sku', pv.sku,
            'stock', pv.stock,
            'price', pv.price,
            'image_url', pv.image_url,
            'sort_order', pv.sort_order
        )
        ORDER BY pv.sort_order
    ) FILTER (WHERE pv.id IS NOT NULL) as variants
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.product_id
LEFT JOIN categories c ON pc.category_id = c.id
LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = TRUE
GROUP BY p.id, p.name, p.price, p.has_variants, p.total_stock;

-- 7. POLÍTICAS RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_types ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública de variantes activas
CREATE POLICY "Public can view active variants" ON product_variants
    FOR SELECT USING (is_active = true);

-- Política para lectura pública de tipos de variantes
CREATE POLICY "Public can view variant types" ON variant_types
    FOR SELECT USING (is_active = true);

-- 8. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_products_has_variants ON products(has_variants);
CREATE INDEX IF NOT EXISTS idx_products_total_stock ON products(total_stock);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON product_variants(stock);
CREATE INDEX IF NOT EXISTS idx_product_variants_sort ON product_variants(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_variants_type ON product_variants(variant_type);

-- 9. ACTUALIZAR STOCK DE PRODUCTOS EXISTENTES CON VARIANTES
UPDATE products 
SET 
    total_stock = (
        SELECT COALESCE(SUM(pv.stock), 0) 
        FROM product_variants pv 
        WHERE pv.product_id = products.id AND pv.is_active = TRUE
    ),
    has_variants = (
        SELECT COUNT(*) > 0 
        FROM product_variants pv 
        WHERE pv.product_id = products.id AND pv.is_active = TRUE
    );

-- ================================================
-- FIN DE INSTALACIÓN
-- ================================================

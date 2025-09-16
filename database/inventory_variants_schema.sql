-- =====================================================
-- SISTEMA DE VARIANTES DE PRODUCTOS - ESTUDIO ARTESANA
-- ESQUEMA PARA POSTGRESQL/SUPABASE
-- =====================================================

-- 1. Tabla de Productos (existente - modificaciones)
-- Agregar campos para el producto principal
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS total_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS variant_type VARCHAR(50) DEFAULT NULL; -- 'color', 'talla', 'material', etc.

-- 2. Nueva tabla para Variantes de Productos
CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(50) PRIMARY KEY, -- Formato: "660-0", "660-1" para compatibilidad
    product_id BIGINT NOT NULL,
    variant_name VARCHAR(100) NOT NULL, -- "Color Rojo", "Talla M", etc.
    variant_value VARCHAR(100) NOT NULL, -- "rojo", "mediana", etc.
    variant_type VARCHAR(50) DEFAULT 'color', -- 'color', 'talla', 'material', etc.
    sku VARCHAR(100) UNIQUE, -- SKU específico de la variante
    stock INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2), -- Precio específico (opcional, puede heredar del producto)
    image_url TEXT, -- Imagen específica de la variante
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0, -- Para ordenar las variantes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Relaciones
    CONSTRAINT fk_product_variants_product_id 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 3. Tabla para Tipos de Variantes (opcional - para mejor organización)
CREATE TABLE IF NOT EXISTS variant_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- 'color', 'talla', 'material'
    display_name VARCHAR(100) NOT NULL, -- 'Color', 'Talla', 'Material'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar tipos de variantes comunes (con ON CONFLICT para evitar duplicados)
INSERT INTO variant_types (name, display_name) VALUES
('color', 'Color'),
('talla', 'Talla'),
('material', 'Material'),
('tamaño', 'Tamaño'),
('acabado', 'Acabado')
ON CONFLICT (name) DO NOTHING;

-- 4. Función para actualizar stock total del producto
CREATE OR REPLACE FUNCTION update_product_total_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT y UPDATE, usar NEW
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
    
    -- Para DELETE, usar OLD
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

-- 5. Triggers para actualizar stock total automáticamente
CREATE TRIGGER trigger_update_product_stock_insert
    AFTER INSERT ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_product_total_stock();

CREATE TRIGGER trigger_update_product_stock_update
    AFTER UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_product_total_stock();

CREATE TRIGGER trigger_update_product_stock_delete
    AFTER DELETE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_product_total_stock();

-- 6. Trigger para actualizar updated_at en variantes
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Vistas útiles para consultas
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

-- 8. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_products_has_variants ON products(has_variants);
CREATE INDEX IF NOT EXISTS idx_products_total_stock ON products(total_stock);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON product_variants(stock);
CREATE INDEX IF NOT EXISTS idx_product_variants_sort ON product_variants(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_variants_type ON product_variants(variant_type);

-- 9. Políticas RLS (Row Level Security) para Supabase
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_types ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública de variantes activas
CREATE POLICY "Public can view active variants" ON product_variants
    FOR SELECT USING (is_active = true);

-- Política para lectura pública de tipos de variantes
CREATE POLICY "Public can view variant types" ON variant_types
    FOR SELECT USING (is_active = true);

-- Políticas para administradores (asumiendo que existe user_profiles con role)
CREATE POLICY "Admins can manage variants" ON product_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

CREATE POLICY "Admins can manage variant types" ON variant_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

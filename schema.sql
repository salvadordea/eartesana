-- ESQUEMA DE BASE DE DATOS PARA ESTUDIO ARTESANA EN SUPABASE
-- ===========================================================

-- 1. CATEGORÍAS DE PRODUCTOS
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PRODUCTOS PRINCIPALES
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    short_description TEXT DEFAULT '',
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    regular_price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    on_sale BOOLEAN DEFAULT false,
    type VARCHAR(50) DEFAULT 'variable',
    status VARCHAR(20) DEFAULT 'active',
    featured BOOLEAN DEFAULT false,
    in_stock BOOLEAN DEFAULT true,
    total_sales INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 4.8,
    main_image_url TEXT,
    permalink TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RELACIÓN MUCHOS A MUCHOS: PRODUCTOS ↔ CATEGORÍAS
CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, category_id)
);

-- 4. IMÁGENES DE PRODUCTOS
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255) DEFAULT '',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. VARIANTES DE PRODUCTOS (colores, tamaños, etc.)
CREATE TABLE product_variants (
    id VARCHAR(50) PRIMARY KEY, -- Usamos VARCHAR para mantener IDs como "660-0"
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Estándar',
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ÍNDICES PARA MEJORAR RENDIMIENTO
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_in_stock ON products(in_stock);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_product_categories_product ON product_categories(product_id);
CREATE INDEX idx_product_categories_category ON product_categories(category_id);
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_products_slug ON products(slug);

-- 7. TRIGGERS PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. VISTA PARA OBTENER PRODUCTOS CON SUS CATEGORÍAS E IMÁGENES
CREATE OR REPLACE VIEW products_full AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.short_description,
    p.price,
    p.regular_price,
    p.sale_price,
    p.on_sale,
    p.type,
    p.status,
    p.featured,
    p.in_stock,
    p.total_sales,
    p.average_rating,
    p.main_image_url,
    p.permalink,
    p.created_at,
    p.updated_at,
    -- Categorías como array
    COALESCE(
        array_agg(c.name ORDER BY c.display_order) FILTER (WHERE c.name IS NOT NULL), 
        ARRAY[]::TEXT[]
    ) as categories,
    -- IDs de categorías como array
    COALESCE(
        array_agg(c.id ORDER BY c.display_order) FILTER (WHERE c.id IS NOT NULL), 
        ARRAY[]::INTEGER[]
    ) as category_ids,
    -- Imágenes como array
    COALESCE(
        array_agg(pi.image_url ORDER BY pi.display_order) FILTER (WHERE pi.image_url IS NOT NULL), 
        ARRAY[]::TEXT[]
    ) as images
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.product_id
LEFT JOIN categories c ON pc.category_id = c.id
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id, p.name, p.slug, p.description, p.short_description, 
         p.price, p.regular_price, p.sale_price, p.on_sale, p.type, 
         p.status, p.featured, p.in_stock, p.total_sales, p.average_rating,
         p.main_image_url, p.permalink, p.created_at, p.updated_at;

-- 9. POLÍTICAS RLS (Row Level Security) - OPCIONAL
-- Si quisieras activar seguridad a nivel de fila más adelante:
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública (solo si activas RLS)
-- CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
-- CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
-- CREATE POLICY "Enable read access for all users" ON product_categories FOR SELECT USING (true);
-- CREATE POLICY "Enable read access for all users" ON product_images FOR SELECT USING (true);
-- CREATE POLICY "Enable read access for all users" ON product_variants FOR SELECT USING (true);

-- ¡ESQUEMA COMPLETADO! 
-- Ahora puedes ejecutar el script de migración: node migrate-to-supabase.js

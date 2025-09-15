-- ===========================================
-- ESTUDIO ARTESANA - ESQUEMA SUPABASE
-- ===========================================

-- 1. TABLA DE CATEGORÍAS
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id BIGINT REFERENCES categories(id),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE PRODUCTOS  
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    regular_price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    on_sale BOOLEAN DEFAULT false,
    type VARCHAR(50) DEFAULT 'simple', -- 'simple', 'variable'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'draft'
    featured BOOLEAN DEFAULT false,
    in_stock BOOLEAN DEFAULT true,
    total_sales INTEGER DEFAULT 0,
    average_rating DECIMAL(2,1) DEFAULT 4.8,
    main_image_url TEXT,
    permalink TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE IMÁGENES DE PRODUCTOS
CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE RELACIÓN PRODUCTO-CATEGORÍA (muchos a muchos)
CREATE TABLE product_categories (
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- 5. TABLA DE ATRIBUTOS (Color, Tamaño, etc.)
CREATE TABLE attributes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) DEFAULT 'select', -- 'select', 'color', 'text'
    position INTEGER DEFAULT 0,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE VALORES DE ATRIBUTOS
CREATE TABLE attribute_values (
    id BIGSERIAL PRIMARY KEY,
    attribute_id BIGINT NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    color_code VARCHAR(7), -- Para colores hex: #FF0000
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE VARIANTES DE PRODUCTOS
CREATE TABLE product_variants (
    id VARCHAR(50) PRIMARY KEY, -- Formato: "660-0", "660-1"
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA DE RELACIÓN VARIANTE-ATRIBUTO
CREATE TABLE variant_attributes (
    variant_id VARCHAR(50) NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    attribute_id BIGINT NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    attribute_value_id BIGINT NOT NULL REFERENCES attribute_values(id) ON DELETE CASCADE,
    PRIMARY KEY (variant_id, attribute_id)
);

-- ===========================================
-- ÍNDICES PARA RENDIMIENTO
-- ===========================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_on_sale ON products(on_sale);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_slug ON products(slug);

-- Índices para relaciones
CREATE INDEX idx_product_categories_product ON product_categories(product_id);
CREATE INDEX idx_product_categories_category ON product_categories(category_id);
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);

-- Índices para categorías
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);

-- ===========================================
-- FUNCIONES Y TRIGGERS
-- ===========================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variants_updated_at 
    BEFORE UPDATE ON product_variants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- POLÍTICAS RLS (Row Level Security)
-- ===========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_attributes ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública (todos pueden ver productos activos)
CREATE POLICY "Public can view active categories" ON categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view product images" ON product_images
    FOR SELECT USING (true);

CREATE POLICY "Public can view product categories" ON product_categories
    FOR SELECT USING (true);

CREATE POLICY "Public can view attributes" ON attributes
    FOR SELECT USING (visible = true);

CREATE POLICY "Public can view attribute values" ON attribute_values
    FOR SELECT USING (true);

CREATE POLICY "Public can view active variants" ON product_variants
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view variant attributes" ON variant_attributes
    FOR SELECT USING (true);

-- ===========================================
-- DATOS INICIALES
-- ===========================================

-- Insertar atributo Color (basado en tu estructura actual)
INSERT INTO attributes (name, slug, type, position, visible) 
VALUES ('Color', 'pa_color', 'color', 0, true);

-- Insertar algunos valores de color comunes
INSERT INTO attribute_values (attribute_id, value, slug, position) VALUES 
(1, 'Negro', 'negro', 1),
(1, 'Blanco', 'blanco', 2),
(1, 'Miel', 'miel', 3),
(1, 'Café', 'cafe', 4),
(1, 'Gris', 'gris', 5),
(1, 'Cobre', 'cobre', 6),
(1, 'Tinta', 'tinta', 7),
(1, 'Ladrillo', 'ladrillo', 8),
(1, 'Azul', 'azul', 9),
(1, 'Verde', 'verde', 10);

-- ===========================================
-- VISTAS ÚTILES
-- ===========================================

-- Vista de productos con sus categorías
CREATE VIEW products_with_categories AS
SELECT 
    p.*,
    array_agg(DISTINCT jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'slug', c.slug
    )) FILTER (WHERE c.id IS NOT NULL) as categories
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.product_id
LEFT JOIN categories c ON pc.category_id = c.id
WHERE p.status = 'active'
GROUP BY p.id;

-- Vista de productos con imágenes
CREATE VIEW products_with_images AS
SELECT 
    p.*,
    array_agg(
        pi.image_url ORDER BY pi.display_order
    ) FILTER (WHERE pi.image_url IS NOT NULL) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.status = 'active'
GROUP BY p.id;

-- Vista completa de productos (la más útil para el frontend)
CREATE VIEW products_complete AS
SELECT 
    p.*,
    -- Categorías
    COALESCE(
        array_agg(DISTINCT jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug
        )) FILTER (WHERE c.id IS NOT NULL),
        ARRAY[]::jsonb[]
    ) as categories,
    -- Imágenes
    COALESCE(
        array_agg(pi.image_url ORDER BY pi.display_order) 
        FILTER (WHERE pi.image_url IS NOT NULL),
        ARRAY[]::text[]
    ) as images,
    -- Variantes con atributos
    COALESCE(
        array_agg(DISTINCT jsonb_build_object(
            'id', pv.id,
            'name', pv.name,
            'price', pv.price,
            'stock', pv.stock,
            'image', pv.image_url
        )) FILTER (WHERE pv.id IS NOT NULL),
        ARRAY[]::jsonb[]
    ) as variations
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.product_id
LEFT JOIN categories c ON pc.category_id = c.id AND c.is_active = true
LEFT JOIN product_images pi ON p.id = pi.product_id
LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
WHERE p.status = 'active'
GROUP BY p.id;

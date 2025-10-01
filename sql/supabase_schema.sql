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

-- 3. TABLA DE TRADUCCIONES DE PRODUCTOS
CREATE TABLE product_translations (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL CHECK (language_code IN ('es', 'en')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, language_code)
);

-- 4. TABLA DE IMÁGENES DE PRODUCTOS
CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE RELACIÓN PRODUCTO-CATEGORÍA (muchos a muchos)
CREATE TABLE product_categories (
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- 6. TABLA DE ATRIBUTOS (Color, Tamaño, etc.)
CREATE TABLE attributes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) DEFAULT 'select', -- 'select', 'color', 'text'
    position INTEGER DEFAULT 0,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE VALORES DE ATRIBUTOS
CREATE TABLE attribute_values (
    id BIGSERIAL PRIMARY KEY,
    attribute_id BIGINT NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    color_code VARCHAR(7), -- Para colores hex: #FF0000
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA DE VARIANTES DE PRODUCTOS
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

-- 9. TABLA DE RELACIÓN VARIANTE-ATRIBUTO
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
CREATE INDEX idx_product_translations_product ON product_translations(product_id);
CREATE INDEX idx_product_translations_language ON product_translations(language_code);
CREATE INDEX idx_product_translations_product_lang ON product_translations(product_id, language_code);
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);

-- Índices para categorías
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);

-- Índices para usuarios
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);
CREATE INDEX idx_user_profiles_wholesale ON user_profiles(wholesale_approved);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_wholesale_applications_user ON wholesale_applications(user_id);
CREATE INDEX idx_wholesale_applications_status ON wholesale_applications(status);

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

CREATE TRIGGER update_product_translations_updated_at
    BEFORE UPDATE ON product_translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para tablas de usuarios
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wholesale_applications_updated_at 
    BEFORE UPDATE ON wholesale_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil de usuario automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'Usuario')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar last_login
CREATE OR REPLACE FUNCTION public.update_user_last_login(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_profiles 
    SET last_login = NOW() 
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- POLÍTICAS RLS (Row Level Security)
-- ===========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_attributes ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tablas de usuarios
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_applications ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública (todos pueden ver productos activos)
CREATE POLICY "Public can view active categories" ON categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (status = 'active');

CREATE POLICY "Public can view product translations" ON product_translations
    FOR SELECT USING (true);

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
-- POLÍTICAS RLS PARA USUARIOS
-- ===========================================

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can create profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Políticas para user_sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all sessions" ON user_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Políticas para wholesale_applications
CREATE POLICY "Users can view own applications" ON wholesale_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" ON wholesale_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending applications" ON wholesale_applications
    FOR UPDATE USING (
        auth.uid() = user_id AND status = 'pending'
    );

CREATE POLICY "Admins can manage all applications" ON wholesale_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- ===========================================
-- POLÍTICAS RLS PARA ADMINISTRADORES - PRODUCTOS Y VARIANTES
-- ===========================================

-- Admins pueden crear productos
CREATE POLICY "Admins can create products" ON products
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admins pueden actualizar productos
CREATE POLICY "Admins can update products" ON products
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admins pueden eliminar productos
CREATE POLICY "Admins can delete products" ON products
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admins pueden crear variantes
CREATE POLICY "Admins can create product_variants" ON product_variants
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admins pueden actualizar variantes
CREATE POLICY "Admins can update product_variants" ON product_variants
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admins pueden eliminar variantes
CREATE POLICY "Admins can delete product_variants" ON product_variants
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admins pueden crear categorías
CREATE POLICY "Admins can create categories" ON categories
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admins pueden actualizar categorías
CREATE POLICY "Admins can update categories" ON categories
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admins pueden eliminar categorías
CREATE POLICY "Admins can delete categories" ON categories
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admins pueden gestionar traducciones
CREATE POLICY "Admins can manage product_translations" ON product_translations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admins pueden gestionar imágenes
CREATE POLICY "Admins can manage product_images" ON product_images
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admins pueden gestionar relaciones producto-categoría
CREATE POLICY "Admins can manage product_categories" ON product_categories
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Admins pueden gestionar atributos (si la tabla existe)
-- NOTA: Descomentar estas políticas una vez que las tablas attributes,
-- attribute_values y variant_attributes estén creadas

-- CREATE POLICY "Admins can manage attributes" ON attributes
--     FOR ALL
--     USING (
--         EXISTS (
--             SELECT 1 FROM user_profiles
--             WHERE id = auth.uid() AND role = 'Admin'
--         )
--     );

-- CREATE POLICY "Admins can manage attribute_values" ON attribute_values
--     FOR ALL
--     USING (
--         EXISTS (
--             SELECT 1 FROM user_profiles
--             WHERE id = auth.uid() AND role = 'Admin'
--         )
--     );

-- CREATE POLICY "Admins can manage variant_attributes" ON variant_attributes
--     FOR ALL
--     USING (
--         EXISTS (
--             SELECT 1 FROM user_profiles
--             WHERE id = auth.uid() AND role = 'Admin'
--         )
--     );

-- ===========================================
-- TABLAS DE USUARIOS
-- ===========================================

-- 9. TABLA DE USUARIOS EXTENDIDA (extiende auth.users de Supabase)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'Usuario' CHECK (role IN ('Admin', 'Mayorista', 'Usuario')),
    avatar_url TEXT,
    
    -- Información adicional
    company_name VARCHAR(255), -- Para mayoristas
    tax_id VARCHAR(50), -- RFC o tax ID para mayoristas
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'México',
    
    -- Configuraciones de cuenta
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    newsletter_subscribed BOOLEAN DEFAULT false,
    
    -- Información de mayorista
    wholesale_approved BOOLEAN DEFAULT false,
    wholesale_application_date TIMESTAMPTZ,
    wholesale_approved_date TIMESTAMPTZ,
    wholesale_discount_percent DECIMAL(5,2) DEFAULT 0.00, -- Descuento en porcentaje
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- 10. TABLA DE SESIONES DE USUARIO (para tracking)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    is_active BOOLEAN DEFAULT true
);

-- 11. TABLA DE APLICACIONES DE MAYORISTA
CREATE TABLE wholesale_applications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) NOT NULL,
    business_type VARCHAR(100),
    business_address TEXT NOT NULL,
    business_phone VARCHAR(20),
    business_email VARCHAR(255),
    website_url TEXT,
    years_in_business INTEGER,
    expected_monthly_volume DECIMAL(10,2),
    
    -- Documentos
    business_license_url TEXT,
    tax_document_url TEXT,
    references TEXT, -- Referencias comerciales
    
    -- Estado de la aplicación
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES user_profiles(id),
    review_notes TEXT,
    
    -- Fechas
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

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
    ) as variations,
    -- Traducciones (JSON object con traducciones por idioma)
    COALESCE(
        jsonb_object_agg(
            pt.language_code,
            jsonb_build_object(
                'name', pt.name,
                'description', pt.description,
                'short_description', pt.short_description
            )
        ) FILTER (WHERE pt.language_code IS NOT NULL),
        '{}'::jsonb
    ) as translations
FROM products p
LEFT JOIN product_categories pc ON p.id = pc.product_id
LEFT JOIN categories c ON pc.category_id = c.id AND c.is_active = true
LEFT JOIN product_images pi ON p.id = pi.product_id
LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
LEFT JOIN product_translations pt ON p.id = pt.product_id
WHERE p.status = 'active'
GROUP BY p.id;

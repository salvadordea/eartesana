-- ===========================================
-- PRODUCT TRANSLATIONS TABLE
-- ===========================================
-- This migration adds support for multilingual product content
-- allowing products to have translations in multiple languages

-- 1. Create product_translations table
CREATE TABLE IF NOT EXISTS product_translations (
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

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_translations_product_id ON product_translations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_translations_language ON product_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_product_translations_product_lang ON product_translations(product_id, language_code);

-- 3. Add trigger to update updated_at timestamp
CREATE TRIGGER update_product_translations_updated_at
    BEFORE UPDATE ON product_translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable RLS (Row Level Security)
ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies (allow public read access)
CREATE POLICY "Public can view product translations" ON product_translations
    FOR SELECT USING (true);

-- 6. Create policy for admins to manage translations
CREATE POLICY "Admins can manage product translations" ON product_translations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- 7. Create helpful view for products with translations
CREATE OR REPLACE VIEW products_with_translations AS
SELECT
    p.*,
    -- JSON object with translations by language code
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
LEFT JOIN product_translations pt ON p.id = pt.product_id
GROUP BY p.id;

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE product_translations IS 'Stores translations for product content (name, descriptions) in multiple languages';
COMMENT ON COLUMN product_translations.product_id IS 'Reference to the product being translated';
COMMENT ON COLUMN product_translations.language_code IS 'ISO language code (es, en)';
COMMENT ON COLUMN product_translations.name IS 'Translated product name';
COMMENT ON COLUMN product_translations.description IS 'Translated full product description';
COMMENT ON COLUMN product_translations.short_description IS 'Translated short description for product listings';
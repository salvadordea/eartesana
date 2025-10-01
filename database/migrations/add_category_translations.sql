-- ===========================================
-- CATEGORY TRANSLATIONS TABLE
-- ===========================================
-- This migration adds support for multilingual category content

-- 1. Create category_translations table
CREATE TABLE IF NOT EXISTS category_translations (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL CHECK (language_code IN ('es', 'en')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, language_code)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_category_translations_category_id ON category_translations(category_id);
CREATE INDEX IF NOT EXISTS idx_category_translations_language ON category_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_category_translations_category_lang ON category_translations(category_id, language_code);

-- 3. Add trigger to update updated_at timestamp
CREATE TRIGGER update_category_translations_updated_at
    BEFORE UPDATE ON category_translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable RLS (Row Level Security)
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies (allow public read access)
CREATE POLICY "Public can view category translations" ON category_translations
    FOR SELECT USING (true);

-- 6. Create policy for admins to manage translations
CREATE POLICY "Admins can manage category translations" ON category_translations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- 7. Populate Spanish translations from existing categories
INSERT INTO category_translations (category_id, language_code, name, description)
SELECT
    id,
    'es',
    name,
    description
FROM categories
WHERE is_active = true
ON CONFLICT (category_id, language_code) DO NOTHING;

-- 8. Populate English translations with proper names
INSERT INTO category_translations (category_id, language_code, name, description)
SELECT
    c.id,
    'en',
    CASE
        WHEN LOWER(c.name) LIKE '%joyer%' THEN 'Jewelry'
        WHEN LOWER(c.name) = 'accesorios' THEN 'Accessories'
        WHEN LOWER(c.name) LIKE '%bolsa%mano%' OR c.name = 'BOLSAS DE MANO' THEN 'Handbags'
        WHEN LOWER(c.name) LIKE '%bolsa%textil%' OR c.name = 'BOLSAS TEXTIL Y PIEL' THEN 'Textile & Leather Bags'
        WHEN LOWER(c.name) LIKE '%bolsa%cruzada%' OR c.name = 'Bolsas Cruzadas' THEN 'Crossbody Bags'
        WHEN LOWER(c.name) = 'portacel' THEN 'Phone Cases'
        WHEN LOWER(c.name) LIKE '%bolsa%grande%' OR c.name = 'Bolsas grandes' THEN 'Large Bags'
        WHEN LOWER(c.name) LIKE '%backpack%' OR LOWER(c.name) LIKE '%mochila%' THEN 'Backpacks'
        WHEN LOWER(c.name) LIKE '%boteller%' THEN 'Bottle Holders'
        WHEN LOWER(c.name) = 'hogar' THEN 'Home'
        WHEN LOWER(c.name) = 'vestimenta' THEN 'Clothing'
        WHEN LOWER(c.name) = 'cuadernos' THEN 'Notebooks'
        WHEN LOWER(c.name) LIKE '%decoraci%' THEN 'Decoration'
        WHEN LOWER(c.name) = 'textiles' THEN 'Textiles'
        WHEN LOWER(c.name) LIKE '%cer%mica%' THEN 'Ceramics'
        ELSE c.name
    END,
    CASE
        WHEN LOWER(c.name) LIKE '%joyer%' THEN 'Handcrafted jewelry pieces with traditional Mexican designs'
        WHEN LOWER(c.name) = 'accesorios' THEN 'Handcrafted leather accessories for everyday use'
        WHEN LOWER(c.name) LIKE '%bolsa%' THEN 'Handcrafted leather bags combining tradition and contemporary design'
        WHEN LOWER(c.name) = 'portacel' THEN 'Handcrafted leather phone cases'
        WHEN LOWER(c.name) LIKE '%backpack%' OR LOWER(c.name) LIKE '%mochila%' THEN 'Handcrafted backpacks for daily adventures'
        WHEN LOWER(c.name) LIKE '%boteller%' THEN 'Stylish bottle holders for your beverages'
        WHEN LOWER(c.name) = 'hogar' THEN 'Handcrafted home decor items'
        WHEN LOWER(c.name) = 'vestimenta' THEN 'Traditional handcrafted clothing'
        ELSE c.description
    END
FROM categories c
WHERE c.is_active = true
ON CONFLICT (category_id, language_code) DO NOTHING;

-- 9. Verify the translations
SELECT
    c.name as original_spanish,
    ct_en.name as english_translation,
    ct_en.description as english_description
FROM categories c
JOIN category_translations ct_en ON c.id = ct_en.category_id
WHERE ct_en.language_code = 'en' AND c.is_active = true
ORDER BY c.display_order, c.name;

-- 10. Show summary
SELECT
    'Total Categories' as metric,
    COUNT(*) as count
FROM categories
WHERE is_active = true
UNION ALL
SELECT
    'Spanish Translations' as metric,
    COUNT(*) as count
FROM category_translations
WHERE language_code = 'es'
UNION ALL
SELECT
    'English Translations' as metric,
    COUNT(*) as count
FROM category_translations
WHERE language_code = 'en'
UNION ALL
SELECT
    'Categories WITHOUT translations' as metric,
    COUNT(*) as count
FROM categories c
WHERE c.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM category_translations ct
    WHERE ct.category_id = c.id
);

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE category_translations IS 'Stores translations for category names and descriptions in multiple languages';
COMMENT ON COLUMN category_translations.category_id IS 'Reference to the category being translated';
COMMENT ON COLUMN category_translations.language_code IS 'ISO language code (es, en)';
COMMENT ON COLUMN category_translations.name IS 'Translated category name';
COMMENT ON COLUMN category_translations.description IS 'Translated category description';

-- ===========================================
-- POPULATE PRODUCT TRANSLATIONS
-- ===========================================
-- This script populates the product_translations table with
-- existing product data (Spanish) and placeholder English translations

-- Step 1: Insert Spanish translations from existing products
INSERT INTO product_translations (product_id, language_code, name, description, short_description)
SELECT
    id,
    'es',
    name,
    description,
    short_description
FROM products
ON CONFLICT (product_id, language_code) DO NOTHING;

-- Step 2: Insert English placeholder translations
-- These will be the same as Spanish initially and should be updated later
INSERT INTO product_translations (product_id, language_code, name, description, short_description)
SELECT
    id,
    'en',
    name, -- Will need manual translation later
    description, -- Will need manual translation later
    short_description -- Will need manual translation later
FROM products
ON CONFLICT (product_id, language_code) DO NOTHING;

-- Step 3: Verify the translations were inserted
SELECT
    COUNT(*) as total_translations,
    language_code,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as with_name,
    COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as with_description,
    COUNT(CASE WHEN short_description IS NOT NULL THEN 1 END) as with_short_description
FROM product_translations
GROUP BY language_code;

-- ===========================================
-- SAMPLE ENGLISH TRANSLATIONS FOR COMMON PRODUCTS
-- ===========================================
-- You can add specific English translations here for known products
-- Example:

-- UPDATE product_translations
-- SET
--     name = 'Leather Handbag',
--     description = 'Handmade leather handbag with traditional Mexican craftsmanship.',
--     short_description = 'Handmade leather handbag'
-- WHERE product_id = (SELECT id FROM products WHERE slug = 'bolsa-de-piel' LIMIT 1)
--   AND language_code = 'en';
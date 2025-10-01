-- ===========================================
-- CHECK AND POPULATE PRODUCT TRANSLATIONS
-- ===========================================
-- This script checks if translations exist and populates them if needed

-- Step 1: Check current state
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PRODUCT TRANSLATIONS STATUS CHECK';
    RAISE NOTICE '========================================';
END $$;

-- Count existing translations
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '❌ NO TRANSLATIONS FOUND - Need to populate'
        ELSE '✅ Translations exist: ' || COUNT(*)::text || ' records'
    END as status
FROM product_translations;

-- Count by language
SELECT
    COALESCE(language_code, 'NONE') as language,
    COUNT(*) as count
FROM product_translations
GROUP BY language_code
ORDER BY language_code;

-- Count products without translations
SELECT
    COUNT(*) as products_without_translations
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM product_translations pt
    WHERE pt.product_id = p.id
);

-- Step 2: Populate translations if empty
DO $$
DECLARE
    translation_count INTEGER;
    product_count INTEGER;
BEGIN
    -- Check if translations table is empty
    SELECT COUNT(*) INTO translation_count FROM product_translations;
    SELECT COUNT(*) INTO product_count FROM products;

    IF translation_count = 0 AND product_count > 0 THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE 'POPULATING TRANSLATIONS...';
        RAISE NOTICE '========================================';

        -- Insert Spanish translations from existing products
        INSERT INTO product_translations (product_id, language_code, name, description, short_description)
        SELECT
            id,
            'es',
            name,
            description,
            short_description
        FROM products
        ON CONFLICT (product_id, language_code) DO NOTHING;

        RAISE NOTICE '✅ Spanish translations inserted';

        -- Insert English placeholder translations
        INSERT INTO product_translations (product_id, language_code, name, description, short_description)
        SELECT
            id,
            'en',
            name,
            description,
            short_description
        FROM products
        ON CONFLICT (product_id, language_code) DO NOTHING;

        RAISE NOTICE '✅ English placeholder translations inserted';
        RAISE NOTICE '⚠️  English translations need to be updated manually';

    ELSIF translation_count > 0 THEN
        RAISE NOTICE '✅ Translations already exist, skipping population';
    ELSE
        RAISE NOTICE '⚠️  No products found in database';
    END IF;
END $$;

-- Step 3: Verify final state
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FINAL STATUS';
    RAISE NOTICE '========================================';
END $$;

SELECT
    language_code,
    COUNT(*) as total_translations,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as with_name,
    COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as with_description,
    COUNT(CASE WHEN short_description IS NOT NULL THEN 1 END) as with_short_description
FROM product_translations
GROUP BY language_code
ORDER BY language_code;

-- Show sample translations
SELECT
    p.name as product_name,
    pt.language_code,
    pt.name as translated_name,
    LEFT(pt.short_description, 50) as short_desc_preview
FROM products p
JOIN product_translations pt ON p.id = pt.product_id
ORDER BY p.id, pt.language_code
LIMIT 10;

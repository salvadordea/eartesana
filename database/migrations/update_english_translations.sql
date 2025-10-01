-- ===========================================
-- UPDATE ENGLISH TRANSLATIONS FOR PRODUCTS
-- ===========================================
-- This script updates the English translations for all products
-- Currently they are placeholders (Spanish text), this will translate them properly

-- Update translations for Jewelry (Joyería) products
UPDATE product_translations
SET
    name = CASE
        WHEN LOWER(name) LIKE '%arete%geométrico%gigante%' THEN 'Giant Geometric Earrings'
        WHEN LOWER(name) LIKE '%arete%geométrico%' THEN 'Geometric Earrings'
        WHEN LOWER(name) LIKE '%arete%' THEN 'Earrings'
        WHEN LOWER(name) LIKE '%collar%' THEN 'Necklace'
        WHEN LOWER(name) LIKE '%pulsera%' THEN 'Bracelet'
        WHEN LOWER(name) LIKE '%anillo%' THEN 'Ring'
        ELSE name
    END,
    description = CASE
        WHEN LOWER(name) LIKE '%arete%' THEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            description,
            'artesanal', 'handcrafted'),
            'hecho a mano', 'handmade'),
            'Diseño único', 'Unique design'),
            'piel', 'leather'),
            'plata', 'silver')
        ELSE description
    END,
    short_description = CASE
        WHEN LOWER(name) LIKE '%arete%geométrico%gigante%' THEN 'Handcrafted giant geometric earrings'
        WHEN LOWER(name) LIKE '%arete%geométrico%' THEN 'Handcrafted geometric earrings'
        WHEN LOWER(name) LIKE '%arete%' THEN 'Handcrafted earrings'
        WHEN LOWER(name) LIKE '%collar%' THEN 'Handcrafted necklace'
        WHEN LOWER(name) LIKE '%pulsera%' THEN 'Handcrafted bracelet'
        ELSE short_description
    END
WHERE language_code = 'en'
  AND (LOWER(name) LIKE '%arete%' OR LOWER(name) LIKE '%collar%' OR LOWER(name) LIKE '%pulsera%' OR LOWER(name) LIKE '%anillo%');

-- Update translations for Bags (Bolsas) products
UPDATE product_translations
SET
    name = CASE
        WHEN LOWER(name) LIKE '%bolsa%mano%' OR LOWER(name) LIKE '%bolsa de mano%' THEN REPLACE(REPLACE(name, 'Bolsa de Mano', 'Handbag'), 'bolsa de mano', 'handbag')
        WHEN LOWER(name) LIKE '%bolsa%grande%' OR LOWER(name) LIKE '%bolsas grandes%' THEN REPLACE(REPLACE(name, 'Bolsa Grande', 'Large Bag'), 'bolsa grande', 'large bag')
        WHEN LOWER(name) LIKE '%bolsa%cruzada%' OR LOWER(name) LIKE '%bolsas cruzadas%' THEN REPLACE(REPLACE(name, 'Bolsa Cruzada', 'Crossbody Bag'), 'bolsa cruzada', 'crossbody bag')
        WHEN LOWER(name) LIKE '%bolsa%piel%' THEN REPLACE(REPLACE(name, 'Bolsa de Piel', 'Leather Bag'), 'bolsa de piel', 'leather bag')
        WHEN LOWER(name) LIKE '%bolsa%' THEN REPLACE(name, 'Bolsa', 'Bag')
        WHEN LOWER(name) LIKE '%mochila%' OR LOWER(name) LIKE '%backpack%' THEN REPLACE(name, 'Mochila', 'Backpack')
        ELSE name
    END,
    description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        description,
        'artesanal', 'handcrafted'),
        'hecho a mano', 'handmade'),
        'piel genuina', 'genuine leather'),
        'piel', 'leather'),
        'cuero', 'leather'),
        'bordado', 'embroidered'),
        'textil', 'textile'),
        'Diseño único', 'Unique design'),
        'Hecho en México', 'Made in Mexico'),
        'tradicional', 'traditional'),
    short_description = CASE
        WHEN LOWER(name) LIKE '%bolsa%mano%' THEN 'Handcrafted leather handbag'
        WHEN LOWER(name) LIKE '%bolsa%grande%' THEN 'Handcrafted large bag'
        WHEN LOWER(name) LIKE '%bolsa%cruzada%' THEN 'Handcrafted crossbody bag'
        WHEN LOWER(name) LIKE '%mochila%' THEN 'Handcrafted backpack'
        ELSE 'Handcrafted leather bag'
    END
WHERE language_code = 'en'
  AND (LOWER(name) LIKE '%bolsa%' OR LOWER(name) LIKE '%mochila%' OR LOWER(name) LIKE '%backpack%');

-- Update translations for Phone Cases (Portacel) products
UPDATE product_translations
SET
    name = REPLACE(REPLACE(REPLACE(
        name,
        'Portacel', 'Phone Case'),
        'portacel', 'phone case'),
        'Porta Celular', 'Phone Holder'),
    description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        description,
        'portacel', 'phone case'),
        'celular', 'phone'),
        'artesanal', 'handcrafted'),
        'piel', 'leather'),
        'hecho a mano', 'handmade'),
    short_description = 'Handcrafted leather phone case'
WHERE language_code = 'en'
  AND LOWER(name) LIKE '%portacel%';

-- Update translations for Bottle Holders (Botelleras) products
UPDATE product_translations
SET
    name = REPLACE(REPLACE(
        name,
        'Botellera', 'Bottle Holder'),
        'botellera', 'bottle holder'),
    description = REPLACE(REPLACE(REPLACE(REPLACE(
        description,
        'botellera', 'bottle holder'),
        'artesanal', 'handcrafted'),
        'piel', 'leather'),
        'hecho a mano', 'handmade'),
    short_description = 'Handcrafted leather bottle holder'
WHERE language_code = 'en'
  AND LOWER(name) LIKE '%boteller%';

-- Update translations for Accessories (Accesorios) products
UPDATE product_translations
SET
    name = CASE
        WHEN LOWER(name) LIKE '%llavero%' THEN REPLACE(name, 'Llavero', 'Keychain')
        WHEN LOWER(name) LIKE '%cartera%' THEN REPLACE(name, 'Cartera', 'Wallet')
        WHEN LOWER(name) LIKE '%billetera%' THEN REPLACE(name, 'Billetera', 'Wallet')
        WHEN LOWER(name) LIKE '%cinturón%' OR LOWER(name) LIKE '%cinto%' THEN REPLACE(REPLACE(name, 'Cinturón', 'Belt'), 'Cinto', 'Belt')
        ELSE name
    END,
    description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        description,
        'artesanal', 'handcrafted'),
        'hecho a mano', 'handmade'),
        'piel', 'leather'),
        'Diseño único', 'Unique design'),
        'tradicional', 'traditional'),
    short_description = CASE
        WHEN LOWER(name) LIKE '%llavero%' THEN 'Handcrafted leather keychain'
        WHEN LOWER(name) LIKE '%cartera%' OR LOWER(name) LIKE '%billetera%' THEN 'Handcrafted leather wallet'
        WHEN LOWER(name) LIKE '%cinturón%' OR LOWER(name) LIKE '%cinto%' THEN 'Handcrafted leather belt'
        ELSE 'Handcrafted leather accessory'
    END
WHERE language_code = 'en'
  AND (LOWER(name) LIKE '%llavero%' OR LOWER(name) LIKE '%cartera%' OR LOWER(name) LIKE '%billetera%' OR LOWER(name) LIKE '%cinturón%' OR LOWER(name) LIKE '%cinto%');

-- Update translations for Home (Hogar) products
UPDATE product_translations
SET
    name = CASE
        WHEN LOWER(name) LIKE '%cojín%' OR LOWER(name) LIKE '%cojin%' THEN REPLACE(REPLACE(name, 'Cojín', 'Cushion'), 'Cojin', 'Cushion')
        WHEN LOWER(name) LIKE '%tapete%' THEN REPLACE(name, 'Tapete', 'Rug')
        WHEN LOWER(name) LIKE '%manta%' THEN REPLACE(name, 'Manta', 'Blanket')
        ELSE name
    END,
    description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        description,
        'artesanal', 'handcrafted'),
        'hecho a mano', 'handmade'),
        'textil', 'textile'),
        'Diseño único', 'Unique design'),
        'tradicional', 'traditional'),
    short_description = 'Handcrafted home decor'
WHERE language_code = 'en'
  AND (LOWER(name) LIKE '%cojín%' OR LOWER(name) LIKE '%tapete%' OR LOWER(name) LIKE '%manta%');

-- Update translations for Clothing (Vestimenta) products
UPDATE product_translations
SET
    name = CASE
        WHEN LOWER(name) LIKE '%blusa%' THEN REPLACE(name, 'Blusa', 'Blouse')
        WHEN LOWER(name) LIKE '%vestido%' THEN REPLACE(name, 'Vestido', 'Dress')
        WHEN LOWER(name) LIKE '%falda%' THEN REPLACE(name, 'Falda', 'Skirt')
        WHEN LOWER(name) LIKE '%reboza%' OR LOWER(name) LIKE '%rebozo%' THEN REPLACE(REPLACE(name, 'Reboza', 'Shawl'), 'Rebozo', 'Shawl')
        ELSE name
    END,
    description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        description,
        'artesanal', 'handcrafted'),
        'hecho a mano', 'handmade'),
        'bordado', 'embroidered'),
        'textil', 'textile'),
        'tradicional', 'traditional'),
    short_description = 'Handcrafted traditional clothing'
WHERE language_code = 'en'
  AND (LOWER(name) LIKE '%blusa%' OR LOWER(name) LIKE '%vestido%' OR LOWER(name) LIKE '%falda%' OR LOWER(name) LIKE '%rebozo%');

-- Generic cleanup: translate common Spanish words remaining in descriptions
UPDATE product_translations
SET
    description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            description,
            'elaborado', 'crafted'),
            'elaborada', 'crafted'),
            'fabricado', 'made'),
            'fabricada', 'made'),
            'con técnicas', 'with techniques'),
            'técnicas tradicionales', 'traditional techniques'),
            'materiales naturales', 'natural materials'),
            'alta calidad', 'high quality'),
            'único', 'unique'),
            'única', 'unique'),
            'mexicano', 'Mexican'),
            'mexicana', 'Mexican'),
            'artesano', 'artisan'),
            'artesanos', 'artisans'),
            'pieza', 'piece')
WHERE language_code = 'en';

-- Verify the updates
SELECT
    p.id,
    p.name as original_spanish,
    pt_en.name as english_translation,
    LEFT(pt_en.short_description, 60) as english_short_desc
FROM products p
JOIN product_translations pt_en ON p.id = pt_en.product_id
WHERE pt_en.language_code = 'en'
ORDER BY p.id
LIMIT 20;

-- Show summary
SELECT
    'Total English Translations' as metric,
    COUNT(*) as count
FROM product_translations
WHERE language_code = 'en'
UNION ALL
SELECT
    'Translated Names (different from Spanish)' as metric,
    COUNT(*) as count
FROM product_translations pt_en
JOIN product_translations pt_es ON pt_en.product_id = pt_es.product_id
WHERE pt_en.language_code = 'en'
  AND pt_es.language_code = 'es'
  AND pt_en.name != pt_es.name;

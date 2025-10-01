# Product Translation System - Implementation Guide

This document explains how to set up and use the product translation system for Estudio Artesana.

## Overview

The translation system allows products to have multilingual content (names, descriptions) stored in the database. Currently supports:
- Spanish (es) - default language
- English (en)

## Database Setup

### 1. Create the translations table

Run the migration script to create the `product_translations` table:

```sql
-- Run this in your Supabase SQL Editor
\i database/migrations/add_product_translations.sql
```

This will create:
- `product_translations` table with columns: id, product_id, language_code, name, description, short_description
- Indexes for performance
- RLS policies for security
- Updated views that include translations

### 2. Populate existing products

Run the population script to copy existing Spanish product data into the translations table:

```sql
-- Run this in your Supabase SQL Editor
\i database/migrations/populate_product_translations.sql
```

This will:
- Copy all existing Spanish product content to translations table with `language_code = 'es'`
- Create placeholder English translations (initially same as Spanish)
- Display a count of inserted translations

## Adding English Translations

### Option 1: Update via Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor
2. Open the `product_translations` table
3. Filter by `language_code = 'en'`
4. Edit each product's English translations manually

### Option 2: Bulk Update via SQL

```sql
-- Example: Update a specific product
UPDATE product_translations
SET
    name = 'Leather Handbag',
    description = 'Beautiful handmade leather handbag crafted with traditional Mexican techniques.',
    short_description = 'Handmade leather handbag'
WHERE product_id = (SELECT id FROM products WHERE slug = 'bolsa-de-piel' LIMIT 1)
  AND language_code = 'en';

-- Example: Batch update multiple products
UPDATE product_translations pt
SET
    name = CASE pt.product_id
        WHEN 1 THEN 'Leather Handbag'
        WHEN 2 THEN 'Silver Necklace'
        WHEN 3 THEN 'Handmade Notebook'
        ELSE pt.name
    END,
    description = CASE pt.product_id
        WHEN 1 THEN 'Beautiful handmade leather handbag...'
        WHEN 2 THEN 'Elegant silver necklace...'
        WHEN 3 THEN 'Traditional handmade notebook...'
        ELSE pt.description
    END
WHERE language_code = 'en' AND product_id IN (1, 2, 3);
```

### Option 3: CSV Import

1. Export current products and translations to CSV
2. Fill in English translations in Excel/Sheets
3. Import back to Supabase using the CSV import feature

## Frontend Integration

The translation system is already integrated into your frontend:

### Automatic Translation

Products are automatically translated based on the user's selected language:

1. **Translation System** (`assets/js/translation-system.js`):
   - Provides `translateProduct(product)` method
   - Provides `getProductField(product, field)` helper

2. **Product Rendering** (`assets/js/tienda-supabase-integration.js`):
   - Products are rendered with `getTranslatedProductName(product)`
   - Automatically switches when language changes

3. **API Client** (`js/supabase-api-client.js`):
   - Fetches translations alongside product data
   - Includes translations in product object

### Language Switching

When users click the language toggle (ES/EN), the system:
1. Updates the current language preference
2. Dispatches a `languageChanged` event
3. Re-renders all products with new translations
4. Saves preference to localStorage

## Data Structure

### Product Object (from API)

```javascript
{
  id: 123,
  name: "Bolsa de Piel",  // Original Spanish name
  description: "...",      // Original Spanish description
  shortDescription: "...", // Original Spanish short description
  translations: {
    "es": {
      name: "Bolsa de Piel",
      description: "Hermosa bolsa de piel hecha a mano...",
      short_description: "Bolsa de piel artesanal"
    },
    "en": {
      name: "Leather Handbag",
      description: "Beautiful handmade leather handbag...",
      short_description: "Artisan leather handbag"
    }
  }
  // ... other fields
}
```

### Using Translations in Code

```javascript
// Get translated product name
const translatedName = window.TranslationSystem.getProductField(product, 'name');

// Get translated description
const translatedDesc = window.TranslationSystem.getProductField(product, 'description');

// Get full translated product object
const translated = window.TranslationSystem.translateProduct(product);
console.log(translated.name);        // Translated name
console.log(translated.description); // Translated description
```

## Adding New Languages

To add a new language (e.g., French - 'fr'):

1. **Update database constraint**:
```sql
ALTER TABLE product_translations
DROP CONSTRAINT IF EXISTS product_translations_language_code_check;

ALTER TABLE product_translations
ADD CONSTRAINT product_translations_language_code_check
CHECK (language_code IN ('es', 'en', 'fr'));
```

2. **Add French translations**:
```sql
INSERT INTO product_translations (product_id, language_code, name, description, short_description)
SELECT id, 'fr', name, description, short_description
FROM products;
```

3. **Update frontend**:
   - Add French translations to `assets/data/translations.json`
   - Update language toggle in `translation-system.js` to include French button

## Testing

### Verify Database Setup

```sql
-- Check translations count by language
SELECT language_code, COUNT(*) as count
FROM product_translations
GROUP BY language_code;

-- View translations for a specific product
SELECT
    p.id,
    p.name as original_name,
    pt.language_code,
    pt.name as translated_name,
    pt.short_description
FROM products p
LEFT JOIN product_translations pt ON p.id = pt.product_id
WHERE p.id = 1
ORDER BY pt.language_code;

-- Check products without translations
SELECT p.id, p.name
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM product_translations pt
    WHERE pt.product_id = p.id
);
```

### Frontend Testing

1. Open the shop page (tienda.html)
2. Click the language toggle (ES/EN)
3. Verify product names change
4. Check browser console for translation logs
5. Verify language preference persists after page reload

## Troubleshooting

### Products not translating?

1. Check browser console for errors
2. Verify product has translations in database:
   ```sql
   SELECT * FROM product_translations WHERE product_id = [YOUR_PRODUCT_ID];
   ```
3. Ensure TranslationSystem is initialized:
   ```javascript
   console.log(window.TranslationSystem.isInitialized);
   ```

### English showing Spanish text?

This means English translations haven't been added yet. The system falls back to Spanish (original) content when translations are missing.

### Language not switching?

1. Check localStorage for `preferredLanguage` key
2. Clear browser cache and try again
3. Check browser console for language change events

## Performance Notes

- Translations are fetched alongside products (single query)
- No additional API calls needed for translations
- Translations cached in memory along with products
- Language switching is instant (no database queries)

## Future Enhancements

Potential improvements:
1. Admin panel for managing translations
2. Automatic translation via API (Google Translate, DeepL)
3. Translation progress tracking
4. Variant name translations
5. Category description translations
6. SEO metadata translations

---

For questions or issues, check the main documentation or contact the development team.
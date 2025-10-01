-- ===========================================
-- ADD SHIPPING FIELDS TO PRODUCTS TABLE
-- ===========================================
-- Adds weight and dimensions fields needed for shipping calculations

-- Add weight column (in grams)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS weight INTEGER;

-- Add dimensions column (text field for storing dimensions like "20cm x 15cm x 5cm")
ALTER TABLE products
ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100);

-- Add SKU column if it doesn't exist (for product identification)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sku VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN products.weight IS 'Product weight in grams';
COMMENT ON COLUMN products.dimensions IS 'Product dimensions (e.g., "20cm x 15cm x 5cm")';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - unique product identifier';

-- Create index on SKU for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Verify columns were added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name IN ('weight', 'dimensions', 'sku')
ORDER BY column_name;

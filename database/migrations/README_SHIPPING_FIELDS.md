# Add Shipping Fields to Products

## What This Migration Does

Adds essential shipping and logistics fields to the `products` table:
- **`sku`** - Stock Keeping Unit (unique product identifier)
- **`weight`** - Product weight in grams (for shipping calculations)
- **`dimensions`** - Product dimensions as text (e.g., "20cm x 15cm x 5cm")

## Why These Fields Are Important

### Weight
- Required for accurate shipping cost calculations
- Used by carriers (FedEx, UPS, DHL, etc.) to determine rates
- Helps prevent underpaying or overpaying for shipping

### Dimensions
- Needed for volumetric weight calculations
- Some items are light but bulky (charged by volume, not weight)
- Required for packaging selection

### SKU
- Unique identifier for inventory management
- Used for barcode scanning and warehouse operations
- Makes it easier to track products across systems

## How to Apply

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy contents of** `add_shipping_fields_to_products.sql`
3. **Paste and execute**
4. **Verify** - Should see 3 columns added (sku, weight, dimensions)

## Verification

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name IN ('weight', 'dimensions', 'sku')
ORDER BY column_name;
```

Expected output:
```
 column_name |     data_type     | character_maximum_length
-------------+-------------------+------------------------
 dimensions  | character varying |                     100
 sku         | character varying |                     100
 weight      | integer           |                    NULL
```

## Impact on Existing Code

✅ **Admin Panel** - Forms now have SKU, Weight, and Dimensions fields
✅ **CSV Export** - Now includes these fields
✅ **Database** - Backward compatible (nullable columns)
✅ **Existing Products** - Will have NULL values (can be updated later)

## Using the Fields

### In Admin Panel

When creating/editing a product:
1. **SKU**: Enter unique product code (e.g., "TRJ-BTN-001")
2. **Weight**: Enter weight in grams (e.g., 250 for 250g)
3. **Dimensions**: Enter as text (e.g., "20cm x 15cm x 5cm")

### For Shipping Calculations

```javascript
// Example: Calculate shipping cost
const product = await getProduct(productId);
const weight = product.weight; // in grams
const dimensions = product.dimensions; // "20cm x 15cm x 5cm"

// Use these values with shipping API
const shippingCost = await calculateShipping({
    weight: weight,
    dimensions: parseDimensions(dimensions),
    destination: customerAddress
});
```

## Future Enhancements

Consider adding:
- Weight unit (g, kg, lb, oz)
- Structured dimensions (length, width, height as separate fields)
- Packaging type (box, envelope, tube, etc.)
- Fragile flag (for special handling)

## Files Updated

1. `add_shipping_fields_to_products.sql` - Migration script
2. `sql/supabase_schema.sql` - Updated schema with new fields
3. `admin/inventario.html` - Form fields and save logic restored
4. `README_SHIPPING_FIELDS.md` - This documentation

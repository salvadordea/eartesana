# 📦 Shipping Integration with Envia.com - Database Migration

## Overview

This migration adds the necessary database tables and fields to support full shipping integration with Envia.com for Estudio Artesana's e-commerce platform.

---

## 🗄️ Tables Created

### 1. `shipments`
Stores complete shipping information for each order.

**Key Fields:**
- `order_id` - Reference to the order
- `envia_shipment_id` - Unique ID from Envia.com
- `tracking_number` - Carrier's tracking number
- `carrier` - Shipping company (Estafeta, FedEx, etc.)
- `status` - Current shipping status
- `shipping_cost` - Cost of shipping in MXN
- `label_url` - PDF label download URL
- `tracking_url` - Public tracking page URL
- `tracking_events` - JSONB array of tracking history

**Status Values:**
- `pending` - Label not created yet
- `label_created` - Label generated, awaiting pickup
- `in_transit` - Package in transit
- `out_for_delivery` - Out for delivery
- `delivered` - Successfully delivered
- `failed` - Delivery failed
- `returned` - Returned to sender
- `cancelled` - Shipment cancelled

### 2. `shipping_rates_cache`
Caches shipping rate quotes to improve performance and reduce API calls.

**Key Fields:**
- `origin_zip` - Sender postal code
- `destination_zip` - Recipient postal code
- `weight` - Package weight in grams
- `carrier` - Shipping carrier
- `cost` - Shipping cost in MXN
- `delivery_days` - Estimated delivery time
- `expires_at` - Cache expiration timestamp

**Cache Strategy:**
- Default TTL: 24 hours
- Composite index on (origin_zip, destination_zip, weight, carrier)
- Auto-cleanup with `clean_expired_shipping_cache()` function

### 3. `orders` Table Updates
Added shipping-related fields to existing orders table:

**New Columns:**
- `carrier` - Selected shipping carrier
- `carrier_service` - Service type (Express, Standard, etc.)
- `shipping_cost` - Final shipping cost
- `estimated_delivery` - Estimated delivery date
- `actual_delivery` - Actual delivery date
- `tracking_number` - Denormalized for quick access

---

## 🚀 How to Apply

### Step 1: Open Supabase Dashboard
Navigate to your Supabase project → SQL Editor

### Step 2: Run Migration
1. Copy contents of `add_shipping_tables.sql`
2. Paste in SQL Editor
3. Click "Run"

### Step 3: Verify
Run the verification queries at the end of the migration file to confirm all tables and columns were created successfully.

---

## 🔒 Security (RLS Policies)

### Shipments Table:
- ✅ Admins can manage all shipments
- ✅ Users can view their own order's shipments
- ❌ Public cannot access shipments

### Shipping Rates Cache:
- ✅ Admins can manage cache
- ✅ Public can read non-expired cache (for quotes)
- ❌ Public cannot write to cache

---

## 📊 Indexes Created

**Performance Optimizations:**

1. `idx_shipments_order_id` - Fast order→shipment lookup
2. `idx_shipments_tracking_number` - Fast tracking queries
3. `idx_shipments_status` - Filter by shipment status
4. `idx_shipments_created_at` - Sort by date
5. `idx_shipments_carrier` - Filter by carrier
6. `idx_shipping_cache_lookup` - Fast quote cache lookup
7. `idx_shipping_cache_expires` - Cache cleanup efficiency
8. `idx_orders_tracking_number` - Fast tracking from orders

---

## 🔧 Automatic Functions

### 1. `update_shipments_updated_at()`
**Trigger:** Automatically updates `updated_at` timestamp on shipment modifications

**Usage:** Automatic (no manual calls needed)

### 2. `clean_expired_shipping_cache()`
**Purpose:** Deletes expired cache entries to keep table lean

**Usage:**
```sql
SELECT clean_expired_shipping_cache();
-- Returns: count of deleted rows
```

**Recommendation:** Run daily via cron job or scheduled task

---

## 💾 Data Types Reference

| Field Type | Supabase Type | Description |
|------------|---------------|-------------|
| IDs | UUID | Universally unique identifiers |
| Strings | VARCHAR | Limited text (carrier names, etc.) |
| Money | DECIMAL(10,2) | Currency values (MXN) |
| Weight | INTEGER | Grams |
| Dimensions | DECIMAL(10,2) | Centimeters |
| Timestamps | TIMESTAMP | Date/time with timezone |
| JSON Data | JSONB | Structured data (tracking events) |

---

## 🧪 Testing the Migration

### Test 1: Verify Tables Exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('shipments', 'shipping_rates_cache')
ORDER BY table_name;
```

**Expected Output:**
```
shipments
shipping_rates_cache
```

### Test 2: Verify Orders Table Updates
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name IN ('carrier', 'shipping_cost', 'tracking_number')
ORDER BY column_name;
```

**Expected Output:**
```
carrier          | character varying
shipping_cost    | numeric
tracking_number  | character varying
```

### Test 3: Verify Indexes
```sql
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('shipments', 'shipping_rates_cache', 'orders')
  AND indexname LIKE 'idx_%'
ORDER BY indexname;
```

### Test 4: Test RLS Policies
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('shipments', 'shipping_rates_cache')
ORDER BY tablename, policyname;
```

---

## 📝 Example Data

### Insert Test Shipment
```sql
INSERT INTO shipments (
    order_id,
    envia_shipment_id,
    tracking_number,
    carrier,
    carrier_service,
    status,
    shipping_cost,
    weight,
    label_url
) VALUES (
    'your-order-uuid-here',
    'ENV-2024-123456',
    'EST-987654321',
    'Estafeta',
    'Express',
    'label_created',
    120.00,
    500,
    'https://envia.com/labels/ENV-2024-123456.pdf'
);
```

### Insert Test Cache Entry
```sql
INSERT INTO shipping_rates_cache (
    origin_zip,
    destination_zip,
    weight,
    carrier,
    service,
    cost,
    delivery_days,
    expires_at
) VALUES (
    '01000',
    '64000',
    500,
    'Estafeta',
    'Express',
    120.00,
    2,
    NOW() + INTERVAL '24 hours'
);
```

---

## 🔄 Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Drop tables
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS shipping_rates_cache CASCADE;

-- Remove columns from orders
ALTER TABLE orders
DROP COLUMN IF EXISTS carrier,
DROP COLUMN IF EXISTS carrier_service,
DROP COLUMN IF EXISTS shipping_cost,
DROP COLUMN IF EXISTS estimated_delivery,
DROP COLUMN IF EXISTS actual_delivery,
DROP COLUMN IF EXISTS tracking_number;

-- Drop functions
DROP FUNCTION IF EXISTS update_shipments_updated_at() CASCADE;
DROP FUNCTION IF EXISTS clean_expired_shipping_cache() CASCADE;
```

⚠️ **WARNING:** This will permanently delete all shipping data!

---

## 🔗 Related Files

After running this migration, you'll work with:

1. **Backend:**
   - `backend/shipping-service.js` - Envia.com API integration
   - `backend/.env` - Add `ENVIA_API_KEY`

2. **Frontend:**
   - `assets/js/shipping-calculator.js` - Calculate shipping costs
   - `checkout.html` - Display shipping options

3. **Admin:**
   - `admin/pedidos.html` - Generate shipping labels
   - `admin/envios/` - Shipping management dashboard

---

## 📞 Support

If you encounter issues:

1. Check Supabase logs for errors
2. Verify RLS policies are not blocking queries
3. Ensure UUID extension is enabled: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
4. Check that user_profiles table exists (required for RLS policies)

---

## 📅 Migration History

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-23 | 1.0.0 | Initial shipping tables creation |

---

**Author:** Estudio Artesana Development Team
**Status:** ✅ Ready for Production
**Dependencies:** Envia.com API Account Required

-- ================================================
-- FIX INVENTORY RLS POLICY - CRITICAL REPAIR
-- ================================================
-- This fixes the admin role check in RLS policy that was preventing inventory updates

-- 1. DROP ALL EXISTING ADMIN POLICIES (SAFE CLEANUP)
DROP POLICY IF EXISTS "Solo admins pueden modificar product_variants" ON product_variants;
DROP POLICY IF EXISTS "Admin users can modify product_variants" ON product_variants;

-- 2. CREATE CORRECTED POLICY THAT CHECKS user_metadata
CREATE POLICY "Admin users can modify product_variants" ON product_variants
    FOR ALL
    USING ((auth.jwt() -> 'user_metadata' ->> 'role'::text) = 'admin'::text);

-- 3. ADD STOCK CONSTRAINT TO PREVENT NEGATIVE VALUES (drop first if exists)
ALTER TABLE product_variants
DROP CONSTRAINT IF EXISTS check_stock_non_negative;

ALTER TABLE product_variants
ADD CONSTRAINT check_stock_non_negative CHECK (stock >= 0);

-- 4. VERIFY THE FIXES
SELECT
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'product_variants'
  AND policyname = 'Admin users can modify product_variants';

-- 5. CHECK CONSTRAINT WAS ADDED
SELECT
    conname,
    contype,
    consrc
FROM pg_constraint
WHERE conrelid = 'product_variants'::regclass
  AND conname = 'check_stock_non_negative';

-- ================================================
-- INSTRUCTIONS
-- ================================================
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire script
-- 3. Run it
-- 4. Verify the policy shows up in the results
-- 5. Test inventory update in admin/inventario.html
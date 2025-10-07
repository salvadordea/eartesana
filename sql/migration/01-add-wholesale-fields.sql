-- ================================================================
-- MIGRATION PHASE 1: Add Wholesale Fields to user_profiles
-- ================================================================
-- Purpose: Prepare user_profiles table to hold all mayorista data
-- Safe: Only adds columns, doesn't modify existing data
-- Rollback: See 01-rollback.sql
-- ================================================================

-- Add wholesale-specific fields to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS wholesale_discount_percent INTEGER DEFAULT 0
  CHECK (wholesale_discount_percent >= 0 AND wholesale_discount_percent <= 100),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'Pago a 30 días',
ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT DEFAULT 'transferencia'
  CHECK (preferred_payment_method IN ('transferencia', 'efectivo_contra_entrega', 'tarjeta'));

-- Add index for better performance on mayorista queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_wholesale_discount ON user_profiles(wholesale_discount_percent)
  WHERE role = 'Mayorista';

-- Update the role check constraint to ensure it includes all three roles
-- (This should already exist, but we ensure it's correct)
DO $$
BEGIN
  -- Check if constraint exists and drop it if needed to recreate
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_role_check'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_role_check;
  END IF;

  -- Add the constraint with correct values
  ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('Admin', 'Mayorista', 'Usuario'));
END $$;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.wholesale_discount_percent IS 'Discount percentage for wholesale customers (0-100)';
COMMENT ON COLUMN user_profiles.admin_notes IS 'Internal notes from admin about this user';
COMMENT ON COLUMN user_profiles.payment_terms IS 'Payment terms for wholesale customers (e.g., "Pago a 30 días")';
COMMENT ON COLUMN user_profiles.preferred_payment_method IS 'Preferred payment method for wholesale orders';

-- Verify the changes
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN (
    'wholesale_discount_percent',
    'admin_notes',
    'payment_terms',
    'preferred_payment_method'
  )
ORDER BY column_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Phase 1 Complete: Wholesale fields added to user_profiles';
  RAISE NOTICE '   - wholesale_discount_percent (0-100)';
  RAISE NOTICE '   - admin_notes (text)';
  RAISE NOTICE '   - payment_terms (text)';
  RAISE NOTICE '   - preferred_payment_method (enum)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Next: Run 02-create-compatibility-view.sql';
END $$;

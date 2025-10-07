-- ================================================================
-- ROLLBACK for Phase 1: Remove Wholesale Fields
-- ================================================================
-- Use this ONLY if you need to revert Phase 1 changes
-- ================================================================

-- Drop the columns added in Phase 1
ALTER TABLE user_profiles
DROP COLUMN IF EXISTS wholesale_discount_percent,
DROP COLUMN IF EXISTS admin_notes,
DROP COLUMN IF EXISTS payment_terms,
DROP COLUMN IF EXISTS preferred_payment_method;

-- Drop the indexes
DROP INDEX IF EXISTS idx_user_profiles_wholesale_discount;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '⏪ Phase 1 Rolled Back: Wholesale fields removed from user_profiles';
END $$;

-- ================================================================
-- MIGRATION PHASE 2: Create Compatibility View
-- ================================================================
-- Purpose: Create a view that maps user_profiles to old wholesalers schema
-- Safe: Allows old code to keep working while we migrate
-- Rollback: See 02-rollback.sql
-- ================================================================

-- Drop view if it exists (for re-running)
DROP VIEW IF EXISTS wholesalers_compat CASCADE;

-- Create compatibility view that mimics the old wholesalers table
CREATE VIEW wholesalers_compat AS
SELECT
  -- Map user_profiles fields to old wholesalers fields
  id,
  full_name AS name,
  email,
  company_name AS company,
  phone,
  wholesale_discount_percent AS discount_percentage,

  -- Map is_active to status string
  CASE
    WHEN is_active THEN 'active'::TEXT
    ELSE 'inactive'::TEXT
  END AS status,

  admin_notes AS notes,
  created_at,
  updated_at,

  -- Additional fields that might be useful
  role, -- Always 'Mayorista' in this view
  payment_terms,
  preferred_payment_method
FROM user_profiles
WHERE role = 'Mayorista';

-- Grant permissions
GRANT SELECT ON wholesalers_compat TO authenticated;
GRANT ALL ON wholesalers_compat TO service_role;

-- Add comment
COMMENT ON VIEW wholesalers_compat IS
'Compatibility view: Maps user_profiles (Mayorista role) to old wholesalers table schema.
Used during migration to keep old code working. Will be dropped after full migration.';

-- Test the view
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM wholesalers_compat;
  RAISE NOTICE '✅ Phase 2 Complete: Compatibility view created';
  RAISE NOTICE '   - View name: wholesalers_compat';
  RAISE NOTICE '   - Current mayoristas in view: %', v_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Old code can now query wholesalers_compat instead of wholesalers';
  RAISE NOTICE '📊 Next: Run 03-migrate-wholesalers-data.sql';
END $$;

-- Show the view structure
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'wholesalers_compat'
ORDER BY ordinal_position;

-- ================================================================
-- ROLLBACK for Phase 2: Drop Compatibility View
-- ================================================================
-- Use this ONLY if you need to revert Phase 2 changes
-- ================================================================

-- Drop the compatibility view
DROP VIEW IF EXISTS wholesalers_compat CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '⏪ Phase 2 Rolled Back: Compatibility view dropped';
END $$;

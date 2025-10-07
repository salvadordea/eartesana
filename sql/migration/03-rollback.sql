-- ================================================================
-- ROLLBACK for Phase 3: Restore wholesalers table
-- ================================================================
-- Use this ONLY if migration failed and you need to restore
-- WARNING: This will DELETE migrated data from user_profiles!
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '⚠️  ROLLBACK WARNING';
  RAISE NOTICE '   This will:';
  RAISE NOTICE '   1. Delete migrated mayoristas from user_profiles';
  RAISE NOTICE '   2. Restore original wholesalers table';
  RAISE NOTICE '';
  RAISE NOTICE '   Waiting 5 seconds... (Ctrl+C to cancel)';
END $$;

-- SELECT pg_sleep(5);

-- Delete migrated mayoristas from user_profiles
-- (Only those that came from wholesalers_backup)
DELETE FROM user_profiles
WHERE role = 'Mayorista'
  AND email IN (SELECT email FROM wholesalers_backup);

-- Restore original table name
ALTER TABLE IF EXISTS wholesalers_backup RENAME TO wholesalers;

-- Restore index names
ALTER INDEX IF EXISTS idx_wholesalers_backup_email RENAME TO idx_wholesalers_email;
ALTER INDEX IF EXISTS idx_wholesalers_backup_status RENAME TO idx_wholesalers_status;
ALTER INDEX IF EXISTS idx_wholesalers_backup_company RENAME TO idx_wholesalers_company;

-- Restore trigger name
ALTER TRIGGER IF EXISTS update_wholesalers_backup_updated_at ON wholesalers
  RENAME TO update_wholesalers_updated_at;

DO $$
BEGIN
  RAISE NOTICE '⏪ Phase 3 Rolled Back';
  RAISE NOTICE '   - Mayoristas removed from user_profiles';
  RAISE NOTICE '   - wholesalers table restored';
  RAISE NOTICE '   - You can now re-run the migration after fixing issues';
END $$;

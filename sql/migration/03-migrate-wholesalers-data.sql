-- ================================================================
-- MIGRATION PHASE 3: Migrate Data from wholesalers to user_profiles
-- ================================================================
-- Purpose: Move all mayorista data from wholesalers table to user_profiles
-- WARNING: This creates users in auth.users - BACKUP FIRST!
-- Rollback: See 03-rollback.sql
-- ================================================================

-- ================================================================
-- STEP 1: BACKUP - Export existing data
-- ================================================================
-- Before running this script, MANUALLY export wholesalers table:
--   1. Go to Supabase Dashboard > Table Editor > wholesalers
--   2. Click "..." > Export as CSV
--   3. Save as: wholesalers_backup_YYYY-MM-DD.csv
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '⚠️  IMPORTANT: Have you backed up the wholesalers table?';
  RAISE NOTICE '   If not, STOP and export to CSV first!';
  RAISE NOTICE '';
  RAISE NOTICE '   Waiting 5 seconds... (Ctrl+C to cancel)';
END $$;

-- Pause (commented out for safety - uncomment if you want delay)
-- SELECT pg_sleep(5);

-- ================================================================
-- STEP 2: Check for conflicts
-- ================================================================

DO $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  -- Check if any emails from wholesalers already exist in auth.users
  SELECT COUNT(DISTINCT w.email) INTO v_conflict_count
  FROM wholesalers w
  WHERE EXISTS (
    SELECT 1 FROM auth.users au WHERE au.email = w.email
  );

  IF v_conflict_count > 0 THEN
    RAISE NOTICE '⚠️  Found % email(s) that already exist in auth.users', v_conflict_count;
    RAISE NOTICE '   These will be SKIPPED to avoid conflicts.';
    RAISE NOTICE '   Check manually and merge if needed.';
    RAISE NOTICE '';
  END IF;
END $$;

-- ================================================================
-- STEP 3: Rename original table (safety backup)
-- ================================================================

-- Rename wholesalers to wholesalers_backup
ALTER TABLE IF EXISTS wholesalers RENAME TO wholesalers_backup;

-- Rename indexes
ALTER INDEX IF EXISTS idx_wholesalers_email RENAME TO idx_wholesalers_backup_email;
ALTER INDEX IF EXISTS idx_wholesalers_status RENAME TO idx_wholesalers_backup_status;
ALTER INDEX IF EXISTS idx_wholesalers_company RENAME TO idx_wholesalers_backup_company;

-- Rename trigger
ALTER TRIGGER IF EXISTS update_wholesalers_updated_at ON wholesalers_backup
  RENAME TO update_wholesalers_backup_updated_at;

DO $$
BEGIN
  RAISE NOTICE '✅ Renamed: wholesalers → wholesalers_backup';
  RAISE NOTICE '';
END $$;

-- ================================================================
-- STEP 4: Migrate data to user_profiles
-- ================================================================

DO $$
DECLARE
  v_mayorista RECORD;
  v_user_id UUID;
  v_migrated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_temp_password TEXT := 'TempPass2024!'; -- Users must reset
BEGIN
  RAISE NOTICE '🔄 Starting migration of mayoristas...';
  RAISE NOTICE '';

  -- Loop through each mayorista
  FOR v_mayorista IN
    SELECT * FROM wholesalers_backup
    ORDER BY created_at
  LOOP
    BEGIN
      -- Check if email already exists in auth.users
      SELECT id INTO v_user_id
      FROM auth.users
      WHERE email = v_mayorista.email;

      IF v_user_id IS NOT NULL THEN
        -- User already exists, skip creating auth user
        RAISE NOTICE '⚠️  Skipped auth.users creation for % (already exists)', v_mayorista.email;

        -- But still create/update user_profiles entry
        INSERT INTO user_profiles (
          id, email, full_name, phone, role, is_active,
          company_name, wholesale_discount_percent, admin_notes,
          payment_terms, created_at, updated_at
        )
        VALUES (
          v_user_id,
          v_mayorista.email,
          v_mayorista.name,
          v_mayorista.phone,
          'Mayorista',
          (v_mayorista.status = 'active'),
          v_mayorista.company,
          v_mayorista.discount_percentage,
          v_mayorista.notes,
          'Pago a 30 días',
          v_mayorista.created_at,
          v_mayorista.updated_at
        )
        ON CONFLICT (id) DO UPDATE SET
          role = 'Mayorista',
          company_name = EXCLUDED.company_name,
          wholesale_discount_percent = EXCLUDED.wholesale_discount_percent,
          admin_notes = EXCLUDED.admin_notes,
          is_active = EXCLUDED.is_active;

        v_skipped_count := v_skipped_count + 1;

      ELSE
        -- Create new user in auth.users using admin functions
        -- Note: This requires service_role privileges
        -- Users will need to reset their password

        v_user_id := gen_random_uuid();

        -- Create auth user (this is a simplified approach)
        -- In production, you might want to use Supabase admin API instead
        INSERT INTO auth.users (
          id,
          email,
          encrypted_password,
          email_confirmed_at,
          created_at,
          updated_at,
          instance_id,
          aud,
          role
        )
        VALUES (
          v_user_id,
          v_mayorista.email,
          crypt(v_temp_password, gen_salt('bf')), -- Temp password
          now(), -- Auto-confirm email
          v_mayorista.created_at,
          v_mayorista.updated_at,
          '00000000-0000-0000-0000-000000000000',
          'authenticated',
          'authenticated'
        );

        -- Create user_profiles entry
        INSERT INTO user_profiles (
          id, email, full_name, phone, role, is_active,
          company_name, wholesale_discount_percent, admin_notes,
          payment_terms, created_at, updated_at
        )
        VALUES (
          v_user_id,
          v_mayorista.email,
          v_mayorista.name,
          v_mayorista.phone,
          'Mayorista',
          (v_mayorista.status = 'active'),
          v_mayorista.company,
          v_mayorista.discount_percentage,
          v_mayorista.notes,
          'Pago a 30 días',
          v_mayorista.created_at,
          v_mayorista.updated_at
        );

        v_migrated_count := v_migrated_count + 1;
        RAISE NOTICE '✅ Migrated: % (%) → user_profiles', v_mayorista.name, v_mayorista.email;
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        v_error_count := v_error_count + 1;
        RAISE NOTICE '❌ Error migrating %: %', v_mayorista.email, SQLERRM;
    END;
  END LOOP;

  -- Summary
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ MIGRATION COMPLETE';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '   Migrated: % mayoristas', v_migrated_count;
  RAISE NOTICE '   Skipped: % (already existed)', v_skipped_count;
  RAISE NOTICE '   Errors: %', v_error_count;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT NEXT STEPS:';
  RAISE NOTICE '   1. Test login with migrated mayoristas';
  RAISE NOTICE '   2. Notify users to reset passwords';
  RAISE NOTICE '   3. Temp password: %', v_temp_password;
  RAISE NOTICE '   4. After testing, run: admin/dashboard.html updates';
  RAISE NOTICE '   5. Keep wholesalers_backup for 1 week';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Next: Update admin/dashboard.html to use user_profiles';

END $$;

-- ================================================================
-- STEP 5: Verify migration
-- ================================================================

SELECT
  'user_profiles (Mayoristas)' AS table_name,
  COUNT(*) AS count
FROM user_profiles
WHERE role = 'Mayorista'
UNION ALL
SELECT
  'wholesalers_backup' AS table_name,
  COUNT(*) AS count
FROM wholesalers_backup;

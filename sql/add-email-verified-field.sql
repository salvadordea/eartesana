-- ================================================================
-- Add email_verified field to user_profiles
-- ================================================================
-- This adds a field to track email verification status
-- ================================================================

-- Add email_verified column if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified
ON user_profiles(email_verified);

-- Update existing users to check their auth.users email_confirmed_at status
-- This syncs the verification status from auth.users to user_profiles
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT up.id, au.email_confirmed_at
    FROM user_profiles up
    JOIN auth.users au ON up.id = au.id
  LOOP
    UPDATE user_profiles
    SET email_verified = (user_record.email_confirmed_at IS NOT NULL)
    WHERE id = user_record.id;
  END LOOP;

  RAISE NOTICE '✅ email_verified field added and synced';
END $$;

-- Verify
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name = 'email_verified';

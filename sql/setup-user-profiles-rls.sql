-- ================================================================
-- Setup RLS Policies for user_profiles
-- ================================================================
-- This script creates proper Row Level Security policies
-- to allow admin users to create and manage user profiles
-- ================================================================

-- First, ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- DROP existing policies (if any)
-- ================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON user_profiles;

-- ================================================================
-- CREATE RLS Policies
-- ================================================================

-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- 2. Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()) -- Can't change their own role
);

-- 3. Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'Admin'
  )
);

-- 4. Admins can insert new profiles
CREATE POLICY "Admins can insert profiles"
ON user_profiles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'Admin'
  )
);

-- 5. Admins can update any profile
CREATE POLICY "Admins can update all profiles"
ON user_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'Admin'
  )
);

-- 6. Admins can delete profiles (except their own)
CREATE POLICY "Admins can delete profiles"
ON user_profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'Admin'
  )
  AND id != auth.uid() -- Can't delete themselves
);

-- 7. Allow profile creation during signup (for the trigger)
-- This policy allows the system to auto-create profile when user signs up
CREATE POLICY "Allow profile creation on signup"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ================================================================
-- CREATE TRIGGER for auto-creating profiles
-- ================================================================

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, is_active, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Usuario'),
    true,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- Verification
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS Policies created successfully';
  RAISE NOTICE '✅ Auto-profile trigger created';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Active Policies on user_profiles:';
END $$;

-- Show all policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

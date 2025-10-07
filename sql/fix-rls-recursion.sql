-- ================================================================
-- FIX RLS Infinite Recursion
-- ================================================================
-- This fixes the "infinite recursion detected in policy" error
-- by using a simpler approach with SECURITY DEFINER functions
-- ================================================================

-- ================================================================
-- STEP 1: Drop ALL existing policies to start fresh
-- ================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;

-- ================================================================
-- STEP 2: Create helper function to check if user is admin
-- ================================================================
-- This function uses SECURITY DEFINER to bypass RLS when checking role
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- STEP 3: Create NEW simplified policies (no recursion)
-- ================================================================

-- Policy 1: Anyone can view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Admins can view all profiles (using helper function)
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
USING (public.is_admin(auth.uid()));

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy 4: Admins can update any profile (using helper function)
CREATE POLICY "Admins can update all profiles"
ON user_profiles FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Policy 5: Admins can insert new profiles (using helper function)
CREATE POLICY "Admins can insert profiles"
ON user_profiles FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Policy 6: Allow auto-insert during signup (for trigger)
CREATE POLICY "Allow profile creation on signup"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 7: Admins can delete profiles (using helper function)
CREATE POLICY "Admins can delete profiles"
ON user_profiles FOR DELETE
USING (public.is_admin(auth.uid()) AND id != auth.uid());

-- ================================================================
-- STEP 4: Ensure trigger exists for auto-creating profiles
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- STEP 5: Ensure RLS is enabled
-- ================================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- Verification
-- ================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies fixed - no more recursion!';
  RAISE NOTICE '✅ Helper function is_admin() created';
  RAISE NOTICE '✅ Auto-profile trigger ready';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Test now:';
  RAISE NOTICE '   1. Login as admin';
  RAISE NOTICE '   2. Go to /admin/usuarios.html';
  RAISE NOTICE '   3. Create a new user';
  RAISE NOTICE '';
END $$;

-- Show active policies
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

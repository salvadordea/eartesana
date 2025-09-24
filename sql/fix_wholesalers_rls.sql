-- Fix Row Level Security policies for wholesalers table
-- This script fixes the RLS issues that prevent CRUD operations

-- Drop existing policies
DROP POLICY IF EXISTS "Service role can manage wholesalers" ON public.wholesalers;
DROP POLICY IF EXISTS "Wholesalers can read own data" ON public.wholesalers;

-- Disable RLS temporarily to ensure we can create proper policies
ALTER TABLE public.wholesalers DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.wholesalers ENABLE ROW LEVEL SECURITY;

-- Create new policies that work correctly

-- Policy 1: Allow service role to do everything (admin access)
CREATE POLICY "Enable all operations for service role" ON public.wholesalers
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy 2: Allow authenticated users to read their own data (for future wholesaler login)
CREATE POLICY "Enable read access for authenticated users on own data" ON public.wholesalers
    FOR SELECT
    TO authenticated
    USING (auth.email() = email);

-- Policy 3: Allow anon role to read (if needed for public access)
-- CREATE POLICY "Enable read access for anon" ON public.wholesalers
--     FOR SELECT
--     TO anon
--     USING (true);

-- Grant proper permissions
GRANT ALL PRIVILEGES ON public.wholesalers TO service_role;
GRANT SELECT ON public.wholesalers TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Also ensure the trigger function has proper permissions
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO service_role;

-- Verify the policies are created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'wholesalers';
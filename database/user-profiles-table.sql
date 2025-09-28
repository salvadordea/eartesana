-- ================================================
-- USER PROFILES TABLE - CORE USER DATA
-- ================================================
-- Base user profiles table required by the regular users system
-- This extends Supabase auth.users with application-specific data

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Basic profile information
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),

    -- User role and status
    role VARCHAR(50) NOT NULL DEFAULT 'Usuario' CHECK (role IN ('Admin', 'Mayorista', 'Usuario')),
    is_active BOOLEAN DEFAULT true,

    -- Address information (basic)
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'México',
    postal_code VARCHAR(20),
    address_line1 TEXT,
    address_line2 TEXT,

    -- Account metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,

    -- Verification status
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,

    -- Profile preferences
    profile_image_url TEXT,
    birth_date DATE,
    gender VARCHAR(20),

    -- Business fields (for mayoristas)
    company_name VARCHAR(255),
    tax_id VARCHAR(50),
    business_type VARCHAR(50)
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX idx_user_profiles_full_name ON user_profiles(full_name);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and edit their own profile
CREATE POLICY "Users can manage own profile" ON user_profiles
    FOR ALL USING (auth.uid() = id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (
        auth.jwt() -> 'user_metadata' ->> 'role' = 'Admin'
    );

-- ================================================
-- TRIGGER FOR AUTOMATIC TIMESTAMPS
-- ================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- CREATE PROFILES FOR EXISTING AUTH USERS
-- ================================================

-- Insert profiles for existing auth users with role normalization
INSERT INTO user_profiles (id, email, role, is_active, created_at)
SELECT
    id,
    email,
    CASE
        WHEN LOWER(COALESCE(raw_user_meta_data ->> 'role', 'usuario')) = 'admin' THEN 'Admin'
        WHEN LOWER(COALESCE(raw_user_meta_data ->> 'role', 'usuario')) = 'mayorista' THEN 'Mayorista'
        ELSE 'Usuario'
    END as role,
    true,
    created_at
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.users.id
);

-- ================================================
-- VERIFICATION QUERY
-- ================================================

-- Check that the table was created successfully
SELECT
    tablename,
    schemaname,
    tableowner,
    rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles';

-- Check existing users were migrated
SELECT
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'Admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role = 'Mayorista' THEN 1 END) as mayoristas,
    COUNT(CASE WHEN role = 'Usuario' THEN 1 END) as usuarios
FROM user_profiles;
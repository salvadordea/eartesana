-- ===========================================
-- SCRIPT DE VERIFICACIÓN - ESQUEMA USUARIOS
-- ===========================================
-- Este script verifica que todas las tablas y políticas estén correctamente creadas

-- 1. VERIFICAR TABLAS CREADAS
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'user_profiles',
    'user_sessions', 
    'wholesale_applications',
    'categories',
    'products',
    'product_images',
    'product_categories',
    'attributes',
    'attribute_values',
    'product_variants',
    'variant_attributes'
)
ORDER BY tablename;

-- 2. VERIFICAR POLÍTICAS RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. VERIFICAR FUNCIONES CREADAS
SELECT 
    proname as function_name,
    prorettype::regtype as return_type,
    proargtypes::regtype[] as argument_types
FROM pg_proc 
WHERE proname IN (
    'update_updated_at_column',
    'handle_new_user',
    'update_user_last_login'
);

-- 4. VERIFICAR TRIGGERS
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 5. VERIFICAR ÍNDICES
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN (
    'user_profiles',
    'user_sessions', 
    'wholesale_applications',
    'categories',
    'products',
    'product_images',
    'product_categories',
    'attributes',
    'attribute_values',
    'product_variants',
    'variant_attributes'
)
ORDER BY tablename, indexname;

-- 6. VERIFICAR ESTRUCTURA DE TABLA user_profiles
\d public.user_profiles;

-- 7. VERIFICAR ESTRUCTURA DE TABLA wholesale_applications
\d public.wholesale_applications;

-- 8. VERIFICAR ESTRUCTURA DE TABLA user_sessions
\d public.user_sessions;

-- 9. VERIFICAR QUE RLS ESTÉ HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'user_profiles',
    'user_sessions', 
    'wholesale_applications'
);

-- 10. VERIFICAR CONSTRAINTS
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_catalog = kcu.constraint_catalog
    AND tc.constraint_schema = kcu.constraint_schema
    AND tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.referential_constraints rc
    ON tc.constraint_catalog = rc.constraint_catalog
    AND tc.constraint_schema = rc.constraint_schema
    AND tc.constraint_name = rc.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
    ON rc.unique_constraint_catalog = ccu.constraint_catalog
    AND rc.unique_constraint_schema = ccu.constraint_schema
    AND rc.unique_constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('user_profiles', 'user_sessions', 'wholesale_applications')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ===========================================
-- RESULTADOS ESPERADOS
-- ===========================================

/*
TABLAS ESPERADAS:
- user_profiles (con campos role, wholesale_approved, etc.)
- user_sessions (para tracking de sesiones)
- wholesale_applications (solicitudes de mayoristas)
- categories, products, etc. (tablas de productos existentes)

POLÍTICAS RLS ESPERADAS:
- Users can view own profile
- Users can update own profile
- Anyone can create profile
- Admins can view all profiles
- Users can view own sessions
- Users can insert own sessions
- Users can update own sessions
- Admins can manage all sessions
- Users can view own applications
- Users can create own applications
- Users can update own pending applications
- Admins can manage all applications

FUNCIONES ESPERADAS:
- update_updated_at_column()
- handle_new_user()
- update_user_last_login(UUID)

TRIGGERS ESPERADOS:
- update_user_profiles_updated_at
- update_wholesale_applications_updated_at
- on_auth_user_created

ÍNDICES ESPERADOS:
- idx_user_profiles_email
- idx_user_profiles_role
- idx_user_profiles_active
- idx_user_profiles_wholesale
- idx_user_sessions_user
- idx_user_sessions_active
- idx_wholesale_applications_user
- idx_wholesale_applications_status
*/

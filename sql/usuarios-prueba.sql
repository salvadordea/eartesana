-- ===========================================
-- USUARIOS DE PRUEBA - ESTUDIO ARTESANA
-- ===========================================
-- Este script crea usuarios de prueba para el sistema
-- IMPORTANTE: Ejecutar DESPUÉS del schema principal

-- ===========================================
-- 1. USUARIO ADMINISTRADOR
-- ===========================================

-- Email: estudio@artesana.com
-- Password: ZaqXsw124!
-- Rol: Admin

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'estudio@artesana.com',
    crypt('ZaqXsw124!', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Estudio Artesana Admin","role":"Admin"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
) ON CONFLICT (email) DO NOTHING;

-- Crear perfil para el administrador
INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    is_active,
    email_verified,
    created_at,
    updated_at
) 
SELECT 
    u.id,
    'estudio@artesana.com',
    'Estudio Artesana Admin',
    'Admin',
    TRUE,
    TRUE,
    NOW(),
    NOW()
FROM auth.users u 
WHERE u.email = 'estudio@artesana.com'
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- 2. USUARIO MAYORISTA DE PRUEBA
-- ===========================================

-- Email: mayorista@prueba.com
-- Password: mayoristas123
-- Rol: Mayorista (pre-aprobado)

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'mayorista@prueba.com',
    crypt('mayoristas123', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Mayorista de Prueba","role":"Mayorista"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
) ON CONFLICT (email) DO NOTHING;

-- Crear perfil para el mayorista
INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    phone,
    role,
    company_name,
    tax_id,
    address,
    city,
    state,
    country,
    is_active,
    email_verified,
    wholesale_approved,
    wholesale_approved_date,
    wholesale_discount_percent,
    created_at,
    updated_at
) 
SELECT 
    u.id,
    'mayorista@prueba.com',
    'Mayorista de Prueba',
    '+52 123 456 7890',
    'Mayorista',
    'Tienda Mayorista S.A.',
    'RFC123456789',
    'Avenida Comercial 123, Colonia Centro',
    'Ciudad de México',
    'CDMX',
    'México',
    TRUE,
    TRUE,
    TRUE,  -- Pre-aprobado
    NOW(),
    15.00,  -- 15% de descuento
    NOW(),
    NOW()
FROM auth.users u 
WHERE u.email = 'mayorista@prueba.com'
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- 3. USUARIO REGULAR DE PRUEBA
-- ===========================================

-- Email: usuario@prueba.com
-- Password: usuario123
-- Rol: Usuario

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'usuario@prueba.com',
    crypt('usuario123', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Usuario de Prueba","role":"Usuario"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
) ON CONFLICT (email) DO NOTHING;

-- Crear perfil para el usuario regular
INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    phone,
    role,
    address,
    city,
    state,
    country,
    is_active,
    email_verified,
    newsletter_subscribed,
    created_at,
    updated_at
) 
SELECT 
    u.id,
    'usuario@prueba.com',
    'Usuario de Prueba',
    '+52 987 654 3210',
    'Usuario',
    'Calle Residencial 456, Colonia Ejemplo',
    'Guadalajara',
    'Jalisco',
    'México',
    TRUE,
    TRUE,
    TRUE,
    NOW(),
    NOW()
FROM auth.users u 
WHERE u.email = 'usuario@prueba.com'
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- VERIFICACIÓN DE USUARIOS CREADOS
-- ===========================================

-- Ver usuarios creados
SELECT 
    u.email,
    u.created_at as usuario_creado,
    up.full_name,
    up.role,
    up.wholesale_approved,
    up.wholesale_discount_percent
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE u.email IN ('estudio@artesana.com', 'mayorista@prueba.com', 'usuario@prueba.com')
ORDER BY up.role DESC, u.email;

-- ===========================================
-- NOTAS IMPORTANTES
-- ===========================================

/*
USUARIOS CREADOS:

1. ADMINISTRADOR
   Email: estudio@artesana.com
   Password: ZaqXsw124!
   Rol: Admin
   - Acceso completo al sistema
   - Puede aprobar solicitudes de mayoristas
   - Gestión de usuarios

2. MAYORISTA (PRE-APROBADO)
   Email: mayorista@prueba.com
   Password: mayoristas123
   Rol: Mayorista
   - Descuento: 15%
   - Precios especiales automáticos
   - Empresa: Tienda Mayorista S.A.

3. USUARIO REGULAR
   Email: usuario@prueba.com
   Password: usuario123
   Rol: Usuario
   - Acceso estándar
   - Precios regulares
   - Puede solicitar ser mayorista

PRÓXIMOS PASOS:
1. Ejecutar este script en Supabase
2. Probar login con cada usuario
3. Verificar funcionalidades según rol
4. Personalizar descuentos mayoristas si es necesario

IMPORTANTE:
- Cambiar contraseñas en producción
- El mayorista ya está pre-aprobado con 15% descuento
- Los usuarios tienen email_verified = true para pruebas
*/

-- ===========================================
-- AÑADIR POLÍTICAS RLS PARA ADMINISTRADORES (VERSIÓN SEGURA)
-- ===========================================
-- Esta versión usa bloques DO para manejar errores si las tablas no existen
-- Es seguro ejecutar incluso si algunas tablas no están creadas aún

-- ===========================================
-- FUNCIÓN AUXILIAR PARA CREAR POLÍTICAS DE FORMA SEGURA
-- ===========================================

-- Esta función intenta crear una política y captura errores si la tabla no existe
CREATE OR REPLACE FUNCTION create_admin_policy_safe(
    p_table_name text,
    p_policy_name text,
    p_operation text,
    p_using_clause text DEFAULT NULL,
    p_with_check_clause text DEFAULT NULL
) RETURNS void AS $$
DECLARE
    v_sql text;
BEGIN
    -- Verificar si la tabla existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = p_table_name
    ) THEN
        RAISE NOTICE 'Tabla % no existe, saltando...', p_table_name;
        RETURN;
    END IF;

    -- Construir el SQL dinámico
    v_sql := format('CREATE POLICY "%s" ON %I FOR %s',
                    p_policy_name, p_table_name, p_operation);

    IF p_using_clause IS NOT NULL THEN
        v_sql := v_sql || ' USING (' || p_using_clause || ')';
    END IF;

    IF p_with_check_clause IS NOT NULL THEN
        v_sql := v_sql || ' WITH CHECK (' || p_with_check_clause || ')';
    END IF;

    -- Ejecutar
    BEGIN
        EXECUTE v_sql;
        RAISE NOTICE '✓ Política % creada en tabla %', p_policy_name, p_table_name;
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE '⚠ Política % ya existe en tabla %', p_policy_name, p_table_name;
        WHEN OTHERS THEN
            RAISE NOTICE '✗ Error creando política % en tabla %: %', p_policy_name, p_table_name, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- POLÍTICAS PARA PRODUCTOS
-- ===========================================

SELECT create_admin_policy_safe(
    'products',
    'Admins can create products',
    'INSERT',
    NULL,
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')'
);

SELECT create_admin_policy_safe(
    'products',
    'Admins can update products',
    'UPDATE',
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')',
    NULL
);

SELECT create_admin_policy_safe(
    'products',
    'Admins can delete products',
    'DELETE',
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')',
    NULL
);

-- ===========================================
-- POLÍTICAS PARA VARIANTES DE PRODUCTOS
-- ===========================================

SELECT create_admin_policy_safe(
    'product_variants',
    'Admins can create product_variants',
    'INSERT',
    NULL,
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')'
);

SELECT create_admin_policy_safe(
    'product_variants',
    'Admins can update product_variants',
    'UPDATE',
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')',
    NULL
);

SELECT create_admin_policy_safe(
    'product_variants',
    'Admins can delete product_variants',
    'DELETE',
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')',
    NULL
);

-- ===========================================
-- POLÍTICAS PARA CATEGORÍAS
-- ===========================================

SELECT create_admin_policy_safe(
    'categories',
    'Admins can create categories',
    'INSERT',
    NULL,
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')'
);

SELECT create_admin_policy_safe(
    'categories',
    'Admins can update categories',
    'UPDATE',
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')',
    NULL
);

SELECT create_admin_policy_safe(
    'categories',
    'Admins can delete categories',
    'DELETE',
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')',
    NULL
);

-- ===========================================
-- POLÍTICAS PARA TRADUCCIONES DE PRODUCTOS
-- ===========================================

SELECT create_admin_policy_safe(
    'product_translations',
    'Admins can manage product_translations',
    'ALL',
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')',
    NULL
);

-- ===========================================
-- POLÍTICAS PARA IMÁGENES DE PRODUCTOS
-- ===========================================

SELECT create_admin_policy_safe(
    'product_images',
    'Admins can manage product_images',
    'ALL',
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')',
    NULL
);

-- ===========================================
-- POLÍTICAS PARA RELACIONES PRODUCTO-CATEGORÍA
-- ===========================================

SELECT create_admin_policy_safe(
    'product_categories',
    'Admins can manage product_categories',
    'ALL',
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')',
    NULL
);

-- ===========================================
-- POLÍTICAS PARA ATRIBUTOS (SI EXISTEN)
-- ===========================================

SELECT create_admin_policy_safe(
    'attributes',
    'Admins can manage attributes',
    'ALL',
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')',
    NULL
);

SELECT create_admin_policy_safe(
    'attribute_values',
    'Admins can manage attribute_values',
    'ALL',
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')',
    NULL
);

SELECT create_admin_policy_safe(
    'variant_attributes',
    'Admins can manage variant_attributes',
    'ALL',
    'EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = ''Admin'')',
    NULL
);

-- ===========================================
-- LIMPIEZA
-- ===========================================

-- Eliminar la función auxiliar después de usarla
DROP FUNCTION IF EXISTS create_admin_policy_safe(text, text, text, text, text);

-- ===========================================
-- VERIFICACIÓN
-- ===========================================

-- Mostrar todas las políticas de administrador creadas
SELECT
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%Admin%'
ORDER BY tablename, policyname;

-- Contar políticas creadas
SELECT
    COUNT(*) as total_admin_policies,
    COUNT(DISTINCT tablename) as tables_with_policies
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%Admin%';

-- NOTA: Este script ahora es 100% seguro para ejecutar.
-- Si una tabla no existe, simplemente la saltará con un mensaje NOTICE.

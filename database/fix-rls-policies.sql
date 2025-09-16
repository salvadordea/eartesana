-- ================================================
-- ARREGLAR POLÍTICAS RLS PARA PERMITIR GESTIÓN ADMIN
-- ================================================

-- 1. ELIMINAR POLÍTICAS RESTRICTIVAS EXISTENTES
DROP POLICY IF EXISTS "Public can view active variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can manage variants" ON product_variants;

-- 2. CREAR POLÍTICAS MÁS PERMISIVAS PARA DESARROLLO/ADMIN

-- Permitir lectura pública de variantes activas
CREATE POLICY "Public can view active variants" ON product_variants
    FOR SELECT USING (is_active = true);

-- Permitir inserción desde aplicaciones (más permisivo para desarrollo)
CREATE POLICY "Allow variant creation" ON product_variants
    FOR INSERT WITH CHECK (true);

-- Permitir actualización de variantes existentes
CREATE POLICY "Allow variant updates" ON product_variants
    FOR UPDATE USING (true);

-- Permitir eliminación de variantes
CREATE POLICY "Allow variant deletion" ON product_variants
    FOR DELETE USING (true);

-- 3. TAMBIÉN PARA VARIANT_TYPES
DROP POLICY IF EXISTS "Public can view variant types" ON variant_types;
DROP POLICY IF EXISTS "Admins can manage variant types" ON variant_types;

CREATE POLICY "Public can view variant types" ON variant_types
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow variant types management" ON variant_types
    FOR ALL USING (true);

-- ================================================
-- VERIFICACIÓN FINAL
-- ================================================

-- Mostrar las políticas actuales
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('product_variants', 'variant_types');

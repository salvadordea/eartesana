-- =============================================
-- MIGRATION: Add Banner Fields to Coupons
-- Estudio Artesana
-- =============================================
-- This migration adds fields to control which coupons
-- are displayed in the promotional banner

-- Add show_in_banner field
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS show_in_banner BOOLEAN DEFAULT false;

-- Add banner_priority field (higher priority = shown first)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS banner_priority INTEGER DEFAULT 0;

-- Add banner_views counter
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS banner_views INTEGER DEFAULT 0;

-- Add index for banner queries
CREATE INDEX IF NOT EXISTS idx_coupons_banner ON coupons(show_in_banner, banner_priority DESC)
    WHERE show_in_banner = true AND is_active = true;

-- Add comments
COMMENT ON COLUMN coupons.show_in_banner IS 'Si está habilitado, el cupón se muestra en el banner promocional';
COMMENT ON COLUMN coupons.banner_priority IS 'Prioridad de exhibición (0-10, más alto = mayor prioridad)';
COMMENT ON COLUMN coupons.banner_views IS 'Contador de veces que el banner fue visto';

-- =============================================
-- FUNCTION: Increment banner views
-- =============================================
CREATE OR REPLACE FUNCTION increment_banner_views(p_coupon_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE coupons
    SET banner_views = banner_views + 1
    WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_banner_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_banner_views(UUID) TO anon;

-- =============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =============================================
-- Actualizar cupón BIENVENIDA20 para mostrarlo en banner
UPDATE coupons
SET show_in_banner = true,
    banner_priority = 10
WHERE code = 'BIENVENIDA20';

COMMENT ON TABLE coupons IS 'Tabla de cupones de descuento con integración a banner promocional';

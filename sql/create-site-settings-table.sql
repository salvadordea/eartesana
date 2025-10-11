-- =====================================================
-- TABLA DE CONFIGURACIÓN DEL SITIO (SITE SETTINGS)
-- =====================================================
-- Esta tabla almacena la configuración global del sitio
-- que debe ser accesible para todos los usuarios
-- Incluye: información de contacto, redes sociales, etc.

CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios en la tabla
COMMENT ON TABLE site_settings IS 'Configuración global del sitio accesible para todos los usuarios';
COMMENT ON COLUMN site_settings.key IS 'Clave única de configuración (ej: contactInfo, bannerPromo)';
COMMENT ON COLUMN site_settings.value IS 'Valor de configuración en formato JSON';
COMMENT ON COLUMN site_settings.updated_by IS 'ID del usuario admin que hizo la última actualización';

-- Insertar configuración inicial con valores por defecto
INSERT INTO site_settings (key, value) VALUES
('contactInfo', '{
    "trustIcon1Text": "Envío Gratis*",
    "trustIcon1Icon": "fas fa-truck",
    "trustIcon2Text": "Hecho a Mano",
    "trustIcon2Icon": "fas fa-hand-holding-heart",
    "trustIcon3Text": "Calidad Premium",
    "trustIcon3Icon": "fas fa-shield-alt",
    "shippingDisclaimer": "*En compras superiores a $2,000.00",
    "promoEnabled": true,
    "promoDiscount": "25% OFF",
    "promoDisclaimer": "*en tu primera compra",
    "promoExpirationDate": null,
    "instagramUrl": "#",
    "facebookUrl": "#",
    "whatsappNumber": "+5212345678490",
    "contactEmail": "info@estudioartesana.com",
    "phoneNumber": "+52 123 456 7890",
    "locationText": "Ciudad de México, México",
    "businessHours": "Lun - Vie: 9:00 AM - 6:00 PM\\nSáb: 10:00 AM - 4:00 PM"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede LEER la configuración (público y autenticados)
CREATE POLICY "Anyone can read site settings"
    ON site_settings FOR SELECT
    TO public
    USING (true);

-- Política: Solo ADMINS pueden ACTUALIZAR la configuración
CREATE POLICY "Only admins can update site settings"
    ON site_settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'Admin'
        )
    );

-- Política: Solo ADMINS pueden INSERTAR nueva configuración
CREATE POLICY "Only admins can insert site settings"
    ON site_settings FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'Admin'
        )
    );

-- Política: Solo ADMINS pueden ELIMINAR configuración
CREATE POLICY "Only admins can delete site settings"
    ON site_settings FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'Admin'
        )
    );

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
CREATE INDEX IF NOT EXISTS idx_site_settings_updated_at ON site_settings(updated_at DESC);

-- =====================================================
-- TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_site_settings_timestamp
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_site_settings_updated_at();

-- =====================================================
-- GRANT PERMISOS
-- =====================================================

-- Permitir SELECT a usuarios anónimos (para lectura pública)
GRANT SELECT ON site_settings TO anon;

-- Permitir todas las operaciones a usuarios autenticados (controlado por RLS)
GRANT ALL ON site_settings TO authenticated;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que la tabla se creó correctamente
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'site_settings'
    ) THEN
        RAISE NOTICE '✅ Tabla site_settings creada exitosamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Tabla site_settings no fue creada';
    END IF;
END $$;

-- =====================================================
-- NOTAS DE USO
-- =====================================================

/*
EJEMPLOS DE USO:

1. LEER CONFIGURACIÓN (JavaScript):
   const { data } = await supabase
       .from('site_settings')
       .select('value')
       .eq('key', 'contactInfo')
       .single();

2. ACTUALIZAR CONFIGURACIÓN (Solo Admin):
   const { data } = await supabase
       .from('site_settings')
       .upsert({
           key: 'contactInfo',
           value: { ... },
           updated_by: auth.user.id
       });

3. VERIFICAR PERMISOS:
   - Usuarios anónimos: Solo lectura ✅
   - Usuarios autenticados no-admin: Solo lectura ✅
   - Usuarios admin: CRUD completo ✅

4. CACHE:
   - Implementar cache local (localStorage) por 5 minutos
   - Reducir queries a Supabase
   - Invalidar cache al actualizar
*/

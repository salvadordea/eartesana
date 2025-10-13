-- =============================================
-- SISTEMA DE CUPONES DE DESCUENTO
-- Estudio Artesana
-- =============================================

-- Crear enum para tipos de descuento
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');

-- =============================================
-- TABLA: coupons
-- =============================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Información básica del cupón
    code TEXT UNIQUE NOT NULL,
    description TEXT,

    -- Configuración de descuento
    discount_type discount_type NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_purchase_amount NUMERIC(10, 2),
    max_discount_amount NUMERIC(10, 2),

    -- Límites de uso
    usage_limit_total INTEGER CHECK (usage_limit_total > 0),
    usage_limit_per_user INTEGER DEFAULT 1 CHECK (usage_limit_per_user > 0),
    current_usage_count INTEGER DEFAULT 0 CHECK (current_usage_count >= 0),

    -- Fechas de vigencia
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Estado
    is_active BOOLEAN DEFAULT true,

    -- Restricciones adicionales
    eligible_user_ids UUID[] DEFAULT NULL,
    first_purchase_only BOOLEAN DEFAULT false,
    applicable_categories TEXT[] DEFAULT NULL,
    applicable_product_ids UUID[] DEFAULT NULL,
    minimum_items_count INTEGER CHECK (minimum_items_count > 0),

    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Validaciones
    CONSTRAINT valid_dates CHECK (valid_from < valid_until),
    CONSTRAINT valid_percentage CHECK (
        discount_type != 'percentage' OR discount_value <= 100
    )
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_coupons_code ON coupons(UPPER(code));
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX idx_coupons_active_valid ON coupons(is_active, valid_from, valid_until);

-- =============================================
-- TABLA: coupon_usage
-- =============================================
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referencias
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    order_id UUID,

    -- Información de uso
    discount_applied NUMERIC(10, 2) NOT NULL,
    cart_total NUMERIC(10, 2) NOT NULL,
    final_total NUMERIC(10, 2) NOT NULL,

    -- Metadata
    ip_address TEXT,
    user_agent TEXT,

    -- Auditoría
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_order ON coupon_usage(order_id);
CREATE INDEX idx_coupon_usage_date ON coupon_usage(used_at DESC);

-- =============================================
-- TABLA: coupon_attempts (para detectar abuso)
-- =============================================
CREATE TABLE IF NOT EXISTS coupon_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code_attempted TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    ip_address TEXT,
    success BOOLEAN DEFAULT false,
    failure_reason TEXT,

    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para análisis de intentos
CREATE INDEX idx_coupon_attempts_code ON coupon_attempts(code_attempted);
CREATE INDEX idx_coupon_attempts_user ON coupon_attempts(user_id);
CREATE INDEX idx_coupon_attempts_ip ON coupon_attempts(ip_address);
CREATE INDEX idx_coupon_attempts_date ON coupon_attempts(attempted_at DESC);

-- =============================================
-- FUNCTION: Actualizar timestamp updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION: Incrementar contador de uso
-- =============================================
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coupons
    SET current_usage_count = current_usage_count + 1
    WHERE id = NEW.coupon_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_usage_on_insert
    AFTER INSERT ON coupon_usage
    FOR EACH ROW
    EXECUTE FUNCTION increment_coupon_usage();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_attempts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS: coupons
-- =============================================

-- SELECT: Usuarios autenticados pueden ver cupones activos y válidos
CREATE POLICY "select_active_coupons"
    ON coupons FOR SELECT
    USING (
        is_active = true
        AND valid_from <= NOW()
        AND valid_until >= NOW()
    );

-- SELECT: Admins pueden ver todos los cupones
CREATE POLICY "select_all_coupons_admin"
    ON coupons FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'Admin'
        )
    );

-- INSERT: Solo admins pueden crear cupones
CREATE POLICY "insert_coupons_admin"
    ON coupons FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'Admin'
        )
    );

-- UPDATE: Solo admins pueden actualizar cupones
CREATE POLICY "update_coupons_admin"
    ON coupons FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'Admin'
        )
    );

-- DELETE: Solo admins pueden eliminar cupones
CREATE POLICY "delete_coupons_admin"
    ON coupons FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'Admin'
        )
    );

-- =============================================
-- POLÍTICAS: coupon_usage
-- =============================================

-- SELECT: Usuarios pueden ver solo sus propios usos
CREATE POLICY "select_own_usage"
    ON coupon_usage FOR SELECT
    USING (user_id = auth.uid());

-- SELECT: Admins pueden ver todos los usos
CREATE POLICY "select_all_usage_admin"
    ON coupon_usage FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'Admin'
        )
    );

-- INSERT: Usuarios autenticados pueden registrar uso
CREATE POLICY "insert_usage_authenticated"
    ON coupon_usage FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (user_id = auth.uid() OR user_id IS NULL)
    );

-- UPDATE/DELETE: Solo admins
CREATE POLICY "update_usage_admin"
    ON coupon_usage FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'Admin'
        )
    );

CREATE POLICY "delete_usage_admin"
    ON coupon_usage FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'Admin'
        )
    );

-- =============================================
-- POLÍTICAS: coupon_attempts
-- =============================================

-- INSERT: Cualquiera puede registrar intentos
CREATE POLICY "insert_attempts_public"
    ON coupon_attempts FOR INSERT
    WITH CHECK (true);

-- SELECT: Solo admins pueden ver intentos
CREATE POLICY "select_attempts_admin"
    ON coupon_attempts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'Admin'
        )
    );

-- =============================================
-- FUNCIÓN: Validar y obtener cupón
-- =============================================
CREATE OR REPLACE FUNCTION validate_coupon(
    p_code TEXT,
    p_cart_total NUMERIC,
    p_user_id UUID DEFAULT NULL,
    p_items_count INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
    v_coupon coupons%ROWTYPE;
    v_usage_count INTEGER;
    v_discount NUMERIC;
    v_result JSON;
BEGIN
    -- Normalizar código a mayúsculas
    p_code := UPPER(TRIM(p_code));

    -- Buscar cupón
    SELECT * INTO v_coupon
    FROM coupons
    WHERE UPPER(code) = p_code;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'COUPON_NOT_FOUND',
            'message', 'El cupón no existe'
        );
    END IF;

    -- Verificar si está activo
    IF v_coupon.is_active = false THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'COUPON_INACTIVE',
            'message', 'El cupón está desactivado'
        );
    END IF;

    -- Verificar fechas de vigencia
    IF NOW() < v_coupon.valid_from THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'COUPON_NOT_STARTED',
            'message', 'El cupón aún no es válido'
        );
    END IF;

    IF NOW() > v_coupon.valid_until THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'COUPON_EXPIRED',
            'message', 'El cupón ha expirado'
        );
    END IF;

    -- Verificar límite total de usos
    IF v_coupon.usage_limit_total IS NOT NULL
       AND v_coupon.current_usage_count >= v_coupon.usage_limit_total THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'COUPON_LIMIT_REACHED',
            'message', 'El cupón ha alcanzado su límite de usos'
        );
    END IF;

    -- Verificar límite de usos por usuario
    IF p_user_id IS NOT NULL AND v_coupon.usage_limit_per_user IS NOT NULL THEN
        SELECT COUNT(*) INTO v_usage_count
        FROM coupon_usage
        WHERE coupon_id = v_coupon.id
        AND user_id = p_user_id;

        IF v_usage_count >= v_coupon.usage_limit_per_user THEN
            RETURN json_build_object(
                'valid', false,
                'error', 'USER_LIMIT_REACHED',
                'message', 'Ya has usado este cupón el máximo de veces permitido'
            );
        END IF;
    END IF;

    -- Verificar monto mínimo de compra
    IF v_coupon.min_purchase_amount IS NOT NULL
       AND p_cart_total < v_coupon.min_purchase_amount THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'MIN_PURCHASE_NOT_MET',
            'message', format('Compra mínima requerida: $%.2f', v_coupon.min_purchase_amount)
        );
    END IF;

    -- Verificar cantidad mínima de items
    IF v_coupon.minimum_items_count IS NOT NULL
       AND p_items_count < v_coupon.minimum_items_count THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'MIN_ITEMS_NOT_MET',
            'message', format('Se requieren al menos %s productos', v_coupon.minimum_items_count)
        );
    END IF;

    -- Calcular descuento
    IF v_coupon.discount_type = 'percentage' THEN
        v_discount := (p_cart_total * v_coupon.discount_value / 100);

        -- Aplicar descuento máximo si existe
        IF v_coupon.max_discount_amount IS NOT NULL
           AND v_discount > v_coupon.max_discount_amount THEN
            v_discount := v_coupon.max_discount_amount;
        END IF;
    ELSE
        v_discount := v_coupon.discount_value;

        -- El descuento no puede ser mayor al total del carrito
        IF v_discount > p_cart_total THEN
            v_discount := p_cart_total;
        END IF;
    END IF;

    -- Retornar cupón válido con descuento calculado
    RETURN json_build_object(
        'valid', true,
        'coupon', row_to_json(v_coupon),
        'discount', v_discount,
        'finalTotal', p_cart_total - v_discount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DATOS DE PRUEBA (OPCIONAL - COMENTAR EN PRODUCCIÓN)
-- =============================================

-- Cupón de bienvenida (20% de descuento)
INSERT INTO coupons (
    code, description, discount_type, discount_value,
    min_purchase_amount, max_discount_amount,
    valid_from, valid_until, is_active
) VALUES (
    'BIENVENIDA20',
    'Descuento de bienvenida del 20%',
    'percentage',
    20.00,
    500.00,
    200.00,
    NOW(),
    NOW() + INTERVAL '30 days',
    true
);

-- Cupón de monto fijo
INSERT INTO coupons (
    code, description, discount_type, discount_value,
    min_purchase_amount, usage_limit_total,
    valid_from, valid_until, is_active
) VALUES (
    'DESCUENTO100',
    'Descuento fijo de $100',
    'fixed_amount',
    100.00,
    300.00,
    50,
    NOW(),
    NOW() + INTERVAL '60 days',
    true
);

-- Cupón de primera compra
INSERT INTO coupons (
    code, description, discount_type, discount_value,
    first_purchase_only, usage_limit_per_user,
    valid_from, valid_until, is_active
) VALUES (
    'PRIMERACOMPRA',
    'Descuento especial para tu primera compra',
    'percentage',
    25.00,
    true,
    1,
    NOW(),
    NOW() + INTERVAL '90 days',
    true
);

-- =============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================

COMMENT ON TABLE coupons IS 'Tabla de cupones de descuento';
COMMENT ON TABLE coupon_usage IS 'Registro de uso de cupones';
COMMENT ON TABLE coupon_attempts IS 'Log de intentos de aplicación de cupones';

COMMENT ON COLUMN coupons.code IS 'Código único del cupón (se normaliza a mayúsculas)';
COMMENT ON COLUMN coupons.discount_type IS 'Tipo de descuento: percentage o fixed_amount';
COMMENT ON COLUMN coupons.discount_value IS 'Valor del descuento (porcentaje o monto fijo)';
COMMENT ON COLUMN coupons.usage_limit_total IS 'Límite total de usos del cupón (NULL = ilimitado)';
COMMENT ON COLUMN coupons.usage_limit_per_user IS 'Usos permitidos por usuario';
COMMENT ON COLUMN coupons.current_usage_count IS 'Contador actual de usos (auto-incrementa)';

-- =============================================
-- FIN DEL SCHEMA
-- =============================================

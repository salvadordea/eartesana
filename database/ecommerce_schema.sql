-- ===========================================
-- ESTUDIO ARTESANA - ESQUEMA E-COMMERCE COMPLETO
-- ===========================================

-- Este archivo extiende el esquema existente con funcionalidades de e-commerce:
-- - Sistema de carritos persistentes
-- - Gestión de pedidos
-- - Pasarelas de pago
-- - Sistema de envíos
-- - Carritos abandonados y recuperación
-- - Cupones y descuentos

-- ===========================================
-- TABLAS DE CARRITO DE COMPRAS
-- ===========================================

-- 1. CARRITOS (SESIÓN)
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Puede ser NULL para carritos de invitados
    session_id VARCHAR(255), -- Para carritos sin usuario registrado
    guest_email VARCHAR(255), -- Email del invitado (opcional)
    guest_phone VARCHAR(20), -- Teléfono del invitado (opcional)
    
    -- Estado del carrito
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted', 'expired')),
    
    -- Datos calculados (se actualizan con triggers)
    total_items INTEGER DEFAULT 0,
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Información de envío (si ya se completó)
    shipping_address JSONB, -- {name, address, city, state, postal_code, country, phone}
    billing_address JSONB,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    converted_at TIMESTAMPTZ, -- Cuando se convirtió en pedido
    abandoned_at TIMESTAMPTZ -- Cuando se marcó como abandonado
);

-- 2. ELEMENTOS DEL CARRITO
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id VARCHAR(50) REFERENCES product_variants(id) ON DELETE CASCADE, -- NULL para productos simples
    
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Instantánea del producto (para mantener consistencia)
    product_snapshot JSONB, -- {name, image, description, etc.}
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SISTEMA DE CUPONES Y DESCUENTOS
-- ===========================================

-- 3. CUPONES
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Tipo de descuento
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
    value DECIMAL(10,2) NOT NULL, -- Porcentaje (0-100) o monto fijo
    
    -- Límites de uso
    usage_limit INTEGER, -- NULL = sin límite
    usage_limit_per_customer INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    
    -- Condiciones
    minimum_amount DECIMAL(10,2), -- Monto mínimo de compra
    maximum_discount_amount DECIMAL(10,2), -- Máximo descuento (para porcentajes)
    
    -- Validez
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Metadatos
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USO DE CUPONES
CREATE TABLE coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cart_id UUID REFERENCES carts(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SISTEMA DE PEDIDOS
-- ===========================================

-- 5. PEDIDOS
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- Número de pedido legible (ORD-2024-0001)
    
    -- Cliente
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_email VARCHAR(255), -- Para pedidos de invitados
    guest_phone VARCHAR(20),
    
    -- Estado del pedido
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'failed', 'refunded')),
    
    -- Montos
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Información del cliente
    customer_info JSONB NOT NULL, -- {name, email, phone}
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    
    -- Información de envío
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(255),
    estimated_delivery_date DATE,
    delivered_at TIMESTAMPTZ,
    
    -- Notas
    customer_notes TEXT,
    admin_notes TEXT,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- 6. ELEMENTOS DEL PEDIDO
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    variant_id VARCHAR(50) REFERENCES product_variants(id),
    
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Instantánea del producto en el momento de la compra
    product_snapshot JSONB NOT NULL, -- {name, image, description, sku, etc.}
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SISTEMA DE PAGOS
-- ===========================================

-- 7. TRANSACCIONES DE PAGO
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Información de la transacción
    transaction_id VARCHAR(255) UNIQUE, -- ID de la pasarela de pago
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('mercadopago', 'custom_arrangement', 'bank_transfer', 'cash')),
    gateway_response JSONB, -- Respuesta completa de la pasarela
    
    -- Montos
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MXN',
    
    -- Estado
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    
    -- Fechas
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ
);

-- ===========================================
-- SISTEMA DE ENVÍOS (ENVIAYA)
-- ===========================================

-- 8. INFORMACIÓN DE ENVÍOS
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Información de EnvíaYa
    enviaya_shipment_id VARCHAR(255),
    enviaya_tracking_number VARCHAR(255),
    enviaya_label_url TEXT,
    
    -- Información del envío
    carrier VARCHAR(100), -- DHL, FedEx, etc.
    service_type VARCHAR(100), -- Estándar, Express, etc.
    
    -- Direcciones
    pickup_address JSONB,
    delivery_address JSONB NOT NULL,
    
    -- Paquete
    package_info JSONB, -- {weight, dimensions, declared_value}
    
    -- Costos
    shipping_cost DECIMAL(10,2),
    insurance_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'booked', 'picked_up', 'in_transit', 'delivered', 'exception', 'cancelled')),
    
    -- Fechas
    estimated_pickup_date DATE,
    actual_pickup_date DATE,
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- SISTEMA DE CARRITOS ABANDONADOS
-- ===========================================

-- 9. CARRITOS ABANDONADOS (PARA RECOVERY)
CREATE TABLE abandoned_cart_recovery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    
    -- Información de contacto
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    
    -- Estado de recuperación
    recovery_status VARCHAR(20) DEFAULT 'pending' CHECK (recovery_status IN ('pending', 'email_sent', 'recovered', 'expired')),
    
    -- Emails enviados
    emails_sent INTEGER DEFAULT 0,
    last_email_sent_at TIMESTAMPTZ,
    
    -- Cupón de recuperación
    recovery_coupon_id UUID REFERENCES coupons(id),
    
    -- Fechas
    abandoned_at TIMESTAMPTZ DEFAULT NOW(),
    recovered_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- ===========================================
-- TABLAS DE CONFIGURACIÓN
-- ===========================================

-- 10. CONFIGURACIÓN DE ENVÍOS
CREATE TABLE shipping_zones (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    countries JSONB, -- Array de países
    states JSONB, -- Array de estados (para México)
    postal_codes JSONB, -- Array de códigos postales
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shipping_methods (
    id BIGSERIAL PRIMARY KEY,
    zone_id BIGINT NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    carrier VARCHAR(100), -- DHL, FedEx, etc.
    service_type VARCHAR(100),
    
    -- Costos
    base_cost DECIMAL(10,2) NOT NULL,
    cost_per_kg DECIMAL(10,2) DEFAULT 0,
    free_shipping_threshold DECIMAL(10,2), -- Envío gratis arriba de X cantidad
    
    -- Tiempos
    estimated_days_min INTEGER,
    estimated_days_max INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- ÍNDICES PARA RENDIMIENTO
-- ===========================================

-- Carritos
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_session_id ON carts(session_id);
CREATE INDEX idx_carts_status ON carts(status);
CREATE INDEX idx_carts_last_activity ON carts(last_activity);

-- Elementos del carrito
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Cupones
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user_id ON coupon_usage(user_id);

-- Pedidos
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Elementos del pedido
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Transacciones
CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_method ON payment_transactions(payment_method);

-- Envíos
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking ON shipments(enviaya_tracking_number);
CREATE INDEX idx_shipments_status ON shipments(status);

-- Carritos abandonados
CREATE INDEX idx_abandoned_recovery_cart_id ON abandoned_cart_recovery(cart_id);
CREATE INDEX idx_abandoned_recovery_email ON abandoned_cart_recovery(email);
CREATE INDEX idx_abandoned_recovery_status ON abandoned_cart_recovery(recovery_status);

-- ===========================================
-- TRIGGERS Y FUNCIONES
-- ===========================================

-- Función para actualizar totales del carrito
CREATE OR REPLACE FUNCTION calculate_cart_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular totales cuando se modifica un item del carrito
    UPDATE carts SET
        total_items = (
            SELECT COALESCE(SUM(quantity), 0)
            FROM cart_items
            WHERE cart_id = COALESCE(NEW.cart_id, OLD.cart_id)
        ),
        subtotal = (
            SELECT COALESCE(SUM(total_price), 0)
            FROM cart_items
            WHERE cart_id = COALESCE(NEW.cart_id, OLD.cart_id)
        ),
        total_amount = (
            SELECT COALESCE(SUM(total_price), 0)
            FROM cart_items
            WHERE cart_id = COALESCE(NEW.cart_id, OLD.cart_id)
        ),
        updated_at = NOW(),
        last_activity = NOW()
    WHERE id = COALESCE(NEW.cart_id, OLD.cart_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular totales del carrito
CREATE TRIGGER trigger_calculate_cart_totals
    AFTER INSERT OR UPDATE OR DELETE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION calculate_cart_totals();

-- Función para detectar carritos abandonados
CREATE OR REPLACE FUNCTION mark_abandoned_carts()
RETURNS void AS $$
BEGIN
    -- Marcar carritos como abandonados después de 2 horas de inactividad
    UPDATE carts SET
        status = 'abandoned',
        abandoned_at = NOW()
    WHERE status = 'active'
        AND last_activity < NOW() - INTERVAL '2 hours'
        AND total_items > 0;
        
    -- Crear registros de recuperación para carritos abandonados con email
    INSERT INTO abandoned_cart_recovery (cart_id, email, phone)
    SELECT 
        c.id,
        COALESCE(c.guest_email, up.email),
        COALESCE(c.guest_phone, up.phone)
    FROM carts c
    LEFT JOIN user_profiles up ON c.user_id = up.id
    WHERE c.status = 'abandoned'
        AND c.abandoned_at >= NOW() - INTERVAL '1 hour'  -- Solo los recién abandonados
        AND (c.guest_email IS NOT NULL OR up.email IS NOT NULL)
        AND NOT EXISTS (
            SELECT 1 FROM abandoned_cart_recovery acr 
            WHERE acr.cart_id = c.id
        );
END;
$$ LANGUAGE plpgsql;

-- Función para generar número de pedido
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Generar número de pedido único
    NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                      LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Secuencia para números de pedido
CREATE SEQUENCE order_number_seq START 1;

-- Trigger para generar número de pedido
CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Triggers para updated_at
CREATE TRIGGER update_carts_updated_at 
    BEFORE UPDATE ON carts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at 
    BEFORE UPDATE ON cart_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at 
    BEFORE UPDATE ON shipments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- POLÍTICAS RLS (Row Level Security)
-- ===========================================

-- Habilitar RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_cart_recovery ENABLE ROW LEVEL SECURITY;

-- Políticas para carritos
CREATE POLICY "Users can manage own carts" ON carts
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can view public cart info" ON carts
    FOR SELECT USING (true);

-- Políticas para items del carrito
CREATE POLICY "Users can manage own cart items" ON cart_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM carts c 
            WHERE c.id = cart_items.cart_id 
            AND (c.user_id = auth.uid() OR c.user_id IS NULL)
        )
    );

-- Políticas para cupones (público para lectura, admin para escritura)
CREATE POLICY "Anyone can view active coupons" ON coupons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Políticas para pedidos
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can manage all orders" ON orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Políticas similares para otras tablas...

-- ===========================================
-- DATOS DE CONFIGURACIÓN INICIAL
-- ===========================================

-- Zona de envío para México
INSERT INTO shipping_zones (name, countries, states) VALUES
('México Nacional', '["MX"]', '["*"]');

-- Métodos de envío básicos
INSERT INTO shipping_methods (zone_id, name, description, base_cost, estimated_days_min, estimated_days_max) VALUES
(1, 'Envío Estándar', 'Envío estándar nacional', 99.00, 3, 7),
(1, 'Envío Express', 'Envío express nacional', 199.00, 1, 3);

-- Cupón de bienvenida
INSERT INTO coupons (code, name, description, type, value, minimum_amount, usage_limit_per_customer) VALUES
('BIENVENIDO10', 'Cupón de Bienvenida', 'Descuento del 10% para nuevos clientes', 'percentage', 10.00, 500.00, 1);

-- ===========================================
-- VISTAS ÚTILES
-- ===========================================

-- Vista de carritos activos con detalles
CREATE VIEW active_carts_detailed AS
SELECT 
    c.*,
    COUNT(ci.id) as items_count,
    array_agg(
        jsonb_build_object(
            'id', ci.id,
            'product_id', ci.product_id,
            'variant_id', ci.variant_id,
            'quantity', ci.quantity,
            'unit_price', ci.unit_price,
            'total_price', ci.total_price,
            'product_name', ci.product_snapshot->>'name',
            'product_image', ci.product_snapshot->>'image'
        )
    ) as items
FROM carts c
LEFT JOIN cart_items ci ON c.id = ci.cart_id
WHERE c.status = 'active'
GROUP BY c.id;

-- Vista de pedidos con información completa
CREATE VIEW orders_complete AS
SELECT 
    o.*,
    COUNT(oi.id) as items_count,
    array_agg(
        jsonb_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'variant_id', oi.variant_id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'product_snapshot', oi.product_snapshot
        )
    ) as items,
    pt.status as payment_status_details,
    pt.payment_method,
    s.tracking_number,
    s.status as shipping_status
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN payment_transactions pt ON o.id = pt.order_id
LEFT JOIN shipments s ON o.id = s.order_id
GROUP BY o.id, pt.status, pt.payment_method, s.tracking_number, s.status;

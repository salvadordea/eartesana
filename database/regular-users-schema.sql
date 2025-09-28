-- ================================================
-- REGULAR USERS MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ================================================
-- Complete schema for regular user account features:
-- Cart persistence, orders, addresses, wishlists, preferences

-- ================================================
-- 1. USER CARTS - PERSISTENT CART STORAGE
-- ================================================

CREATE TABLE user_carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id VARCHAR(50) REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),

    -- Product snapshot at time of adding to cart
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    product_image TEXT,
    variant_name VARCHAR(255),

    -- Cart metadata
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, product_id, variant_id)
);

-- ================================================
-- 2. ORDERS - PURCHASE RECORDS
-- ================================================

CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL, -- Format: ORD-2024-001234
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Order status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'processing', 'shipped', 'delivered',
        'cancelled', 'refunded'
    )),

    -- Customer info at time of order
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),

    -- Shipping address
    shipping_address_line1 TEXT NOT NULL,
    shipping_address_line2 TEXT,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(20) NOT NULL,
    shipping_country VARCHAR(100) NOT NULL DEFAULT 'México',

    -- Billing info (if different)
    billing_same_as_shipping BOOLEAN DEFAULT true,
    billing_address_line1 TEXT,
    billing_address_line2 TEXT,
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100),

    -- Order totals
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- Payment info (NO sensitive payment data)
    payment_method VARCHAR(50), -- 'credit_card', 'transfer', 'cash'
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'paid', 'partially_paid', 'failed', 'refunded'
    )),

    -- Order dates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    -- Additional info
    notes TEXT,
    tracking_number VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 3. ORDER ITEMS - INDIVIDUAL ORDER LINE ITEMS
-- ================================================

CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id VARCHAR(50) REFERENCES product_variants(id) ON DELETE RESTRICT,

    -- Product snapshot at time of purchase
    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255),
    product_image TEXT,

    -- Pricing and quantity
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    total_price DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 4. USER ADDRESSES - MULTIPLE SHIPPING ADDRESSES
-- ================================================

CREATE TABLE user_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Address details
    address_name VARCHAR(100), -- 'Casa', 'Trabajo', 'Casa de mamá'
    recipient_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'México',

    -- Address preferences
    is_default BOOLEAN DEFAULT false,
    address_type VARCHAR(50) DEFAULT 'shipping' CHECK (address_type IN (
        'shipping', 'billing', 'both'
    )),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 5. USER WISHLISTS - SAVED PRODUCTS
-- ================================================

CREATE TABLE user_wishlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id VARCHAR(50) REFERENCES product_variants(id) ON DELETE CASCADE,

    -- Wishlist metadata
    added_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,

    UNIQUE(user_id, product_id, variant_id)
);

-- ================================================
-- 6. USER PREFERENCES - SETTINGS AND PREFERENCES
-- ================================================

CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Communication preferences
    email_marketing BOOLEAN DEFAULT true,
    email_order_updates BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,

    -- Shopping preferences
    preferred_language VARCHAR(10) DEFAULT 'es',
    preferred_currency VARCHAR(10) DEFAULT 'MXN',

    -- UI preferences
    theme VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'auto'
    items_per_page INTEGER DEFAULT 12 CHECK (items_per_page BETWEEN 6 AND 48),

    -- Privacy preferences
    profile_visibility VARCHAR(20) DEFAULT 'private', -- 'public', 'private'
    show_purchase_history BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 7. LOYALTY POINTS (OPTIONAL FUTURE FEATURE)
-- ================================================

CREATE TABLE loyalty_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

    -- Points transaction
    points INTEGER NOT NULL, -- Can be negative for redemptions
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'earned_purchase', 'earned_bonus', 'redeemed', 'expired', 'adjustment'
    )),
    description TEXT NOT NULL,

    -- Points metadata
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) -- Admin who made adjustment
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- User carts indexes
CREATE INDEX idx_user_carts_user_id ON user_carts(user_id);
CREATE INDEX idx_user_carts_product_id ON user_carts(product_id);
CREATE INDEX idx_user_carts_added_at ON user_carts(added_at);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- User addresses indexes
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_user_addresses_is_default ON user_addresses(is_default);

-- Wishlist indexes
CREATE INDEX idx_user_wishlists_user_id ON user_wishlists(user_id);
CREATE INDEX idx_user_wishlists_product_id ON user_wishlists(product_id);
CREATE INDEX idx_user_wishlists_added_at ON user_wishlists(added_at);

-- Loyalty points indexes
CREATE INDEX idx_loyalty_points_user_id ON loyalty_points(user_id);
CREATE INDEX idx_loyalty_points_expires_at ON loyalty_points(expires_at);
CREATE INDEX idx_loyalty_points_created_at ON loyalty_points(created_at);

-- ================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ================================================

-- Update timestamps automatically
CREATE TRIGGER update_user_carts_updated_at
    BEFORE UPDATE ON user_carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_addresses_updated_at
    BEFORE UPDATE ON user_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_part TEXT;
    new_number TEXT;
    max_existing INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;

    -- Get the highest order number for this year
    SELECT COALESCE(
        MAX(
            CASE
                WHEN order_number ~ ('^ORD-' || year_part || '-[0-9]+$')
                THEN SUBSTRING(order_number FROM '^ORD-' || year_part || '-([0-9]+)$')::INTEGER
                ELSE 0
            END
        ),
        0
    ) INTO max_existing
    FROM orders
    WHERE order_number LIKE 'ORD-' || year_part || '-%';

    sequence_part := LPAD((max_existing + 1)::TEXT, 6, '0');
    new_number := 'ORD-' || year_part || '-' || sequence_part;

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user's total loyalty points
CREATE OR REPLACE FUNCTION get_user_loyalty_points(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_points INTEGER;
BEGIN
    SELECT COALESCE(SUM(points), 0)
    INTO total_points
    FROM loyalty_points
    WHERE user_id = user_uuid
    AND (expires_at IS NULL OR expires_at > NOW());

    RETURN total_points;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

-- User carts policies
CREATE POLICY "Users can manage own cart" ON user_carts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all carts" ON user_carts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'Admin')
    );

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders" ON orders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'Admin')
    );

-- Order items policies
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
    );

CREATE POLICY "Admins can manage all order items" ON order_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'Admin')
    );

-- User addresses policies
CREATE POLICY "Users can manage own addresses" ON user_addresses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses" ON user_addresses
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'Admin')
    );

-- Wishlist policies
CREATE POLICY "Users can manage own wishlist" ON user_wishlists
    FOR ALL USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Loyalty points policies
CREATE POLICY "Users can view own loyalty points" ON loyalty_points
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage loyalty points" ON loyalty_points
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'Admin')
    );

-- ================================================
-- INITIAL DATA AND SETUP
-- ================================================

-- Create default preferences for existing users
INSERT INTO user_preferences (user_id)
SELECT id FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM user_preferences WHERE user_id = auth.users.id
);

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Check all tables were created
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename IN (
    'user_carts', 'orders', 'order_items', 'user_addresses',
    'user_wishlists', 'user_preferences', 'loyalty_points'
)
ORDER BY tablename;

-- Check RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN (
    'user_carts', 'orders', 'order_items', 'user_addresses',
    'user_wishlists', 'user_preferences', 'loyalty_points'
)
ORDER BY tablename;
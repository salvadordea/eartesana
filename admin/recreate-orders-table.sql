-- RECREATE orders table from scratch
-- ⚠️ WARNING: This will DELETE all existing data in the orders table!
-- Run this in Supabase SQL Editor

-- Drop existing table and all dependencies
DROP TABLE IF EXISTS orders CASCADE;

-- Create orders table with correct structure
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,

    -- Order identification
    order_number VARCHAR(50) UNIQUE,

    -- Customer info
    user_id UUID REFERENCES auth.users(id),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    company_name VARCHAR(255),

    -- Shipping address
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100) DEFAULT 'México',
    shipping_notes TEXT,

    -- Billing info
    billing_rfc VARCHAR(50),
    billing_business_name VARCHAR(255),

    -- Order details
    items JSONB NOT NULL, -- Store order items as JSON

    -- Totals
    subtotal DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,

    -- Payment & status
    payment_method VARCHAR(50), -- 'transferencia', 'credit', 'cash'
    order_type VARCHAR(50) DEFAULT 'retail', -- 'wholesale', 'retail'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'shipped', 'completed', 'cancelled'

    -- Additional notes
    order_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to do everything
CREATE POLICY "Admins can do everything with orders"
ON orders
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'Admin'
    )
);

-- Policy: Mayoristas can view their own orders
CREATE POLICY "Mayoristas can view their own orders"
ON orders
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role IN ('Mayorista', 'Admin')
    )
);

-- Policy: Allow inserting orders for authenticated users
CREATE POLICY "Authenticated users can create orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON orders TO authenticated;
GRANT ALL ON orders TO service_role;
GRANT USAGE, SELECT ON SEQUENCE orders_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE orders_id_seq TO service_role;

-- Add comment to table
COMMENT ON TABLE orders IS 'Orders table for both retail and wholesale purchases';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Orders table recreated successfully!';
END $$;

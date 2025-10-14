-- Update existing orders table to support wholesale orders
-- Run this in Supabase SQL Editor

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Order identification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='order_number') THEN
        ALTER TABLE orders ADD COLUMN order_number VARCHAR(50) UNIQUE;
    END IF;

    -- Customer info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='user_id') THEN
        ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='customer_name') THEN
        ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='customer_phone') THEN
        ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='company_name') THEN
        ALTER TABLE orders ADD COLUMN company_name VARCHAR(255);
    END IF;

    -- Shipping address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='shipping_address') THEN
        ALTER TABLE orders ADD COLUMN shipping_address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='shipping_city') THEN
        ALTER TABLE orders ADD COLUMN shipping_city VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='shipping_state') THEN
        ALTER TABLE orders ADD COLUMN shipping_state VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='shipping_postal_code') THEN
        ALTER TABLE orders ADD COLUMN shipping_postal_code VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='shipping_country') THEN
        ALTER TABLE orders ADD COLUMN shipping_country VARCHAR(100) DEFAULT 'México';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='shipping_notes') THEN
        ALTER TABLE orders ADD COLUMN shipping_notes TEXT;
    END IF;

    -- Billing info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='billing_rfc') THEN
        ALTER TABLE orders ADD COLUMN billing_rfc VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='billing_business_name') THEN
        ALTER TABLE orders ADD COLUMN billing_business_name VARCHAR(255);
    END IF;

    -- Order details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='items') THEN
        ALTER TABLE orders ADD COLUMN items JSONB;
    END IF;

    -- Totals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='subtotal') THEN
        ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='discount_amount') THEN
        ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='tax_amount') THEN
        ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='total') THEN
        ALTER TABLE orders ADD COLUMN total DECIMAL(10,2);
    END IF;

    -- Payment & status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='payment_method') THEN
        ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='order_type') THEN
        ALTER TABLE orders ADD COLUMN order_type VARCHAR(50) DEFAULT 'retail';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='status') THEN
        ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    END IF;

    -- Notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='order_notes') THEN
        ALTER TABLE orders ADD COLUMN order_notes TEXT;
    END IF;

    -- Timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='created_at') THEN
        ALTER TABLE orders ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='orders' AND column_name='updated_at') THEN
        ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Enable Row Level Security if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Admins can do everything with orders" ON orders;
DROP POLICY IF EXISTS "Mayoristas can view their own orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;

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

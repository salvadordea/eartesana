-- =====================================================
-- Migration: Add Shipping Tables for Envia.com Integration
-- Description: Creates tables for shipments, rate caching, and updates orders table
-- Created: 2025-01-23
-- Author: Estudio Artesana
-- =====================================================

-- =====================================================
-- 1. CREATE SHIPMENTS TABLE
-- =====================================================
-- Stores information about each shipment created through Envia.com

CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Order reference
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,

    -- Envia.com specific data
    envia_shipment_id VARCHAR(100) UNIQUE,
    tracking_number VARCHAR(100),

    -- Carrier information
    carrier VARCHAR(50) NOT NULL,
    carrier_service VARCHAR(100),

    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Guía no creada aún
        'label_created',-- Guía creada, esperando recolección
        'in_transit',   -- En tránsito
        'out_for_delivery', -- Salió para entrega
        'delivered',    -- Entregado
        'failed',       -- Fallo en la entrega
        'returned',     -- Devuelto al remitente
        'cancelled'     -- Cancelado
    )),

    -- Cost and delivery information
    shipping_cost DECIMAL(10,2) NOT NULL,
    estimated_delivery_date TIMESTAMP,
    actual_delivery_date TIMESTAMP,

    -- URLs and documents
    label_url TEXT,          -- URL del PDF de la etiqueta
    tracking_url TEXT,       -- URL de tracking en sitio del carrier

    -- Package details
    weight INTEGER,          -- Peso en gramos
    length DECIMAL(10,2),    -- Largo en cm
    width DECIMAL(10,2),     -- Ancho en cm
    height DECIMAL(10,2),    -- Alto en cm

    -- Tracking events (stored as JSONB for flexibility)
    tracking_events JSONB DEFAULT '[]'::jsonb,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Notes and additional info
    notes TEXT
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON shipments(carrier);

-- Add comment to table
COMMENT ON TABLE shipments IS 'Stores shipping information and tracking data for orders sent through Envia.com';

-- =====================================================
-- 2. CREATE SHIPPING RATES CACHE TABLE
-- =====================================================
-- Caches shipping rate quotes to reduce API calls and improve performance

CREATE TABLE IF NOT EXISTS shipping_rates_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Route information
    origin_zip VARCHAR(10) NOT NULL,
    destination_zip VARCHAR(10) NOT NULL,

    -- Package details
    weight INTEGER NOT NULL,        -- Peso en gramos
    length DECIMAL(10,2),
    width DECIMAL(10,2),
    height DECIMAL(10,2),

    -- Carrier and service
    carrier VARCHAR(50) NOT NULL,
    service VARCHAR(100),
    service_display_name VARCHAR(200),

    -- Pricing and timing
    cost DECIMAL(10,2) NOT NULL,
    delivery_days INTEGER,
    delivery_date TIMESTAMP,

    -- Cache management
    cached_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,

    -- Additional data from Envia API (stored as JSONB)
    raw_response JSONB
);

-- Create composite index for fast lookups
CREATE INDEX IF NOT EXISTS idx_shipping_cache_lookup
ON shipping_rates_cache(origin_zip, destination_zip, weight, carrier);

-- Create index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_shipping_cache_expires
ON shipping_rates_cache(expires_at);

-- Add comment to table
COMMENT ON TABLE shipping_rates_cache IS 'Caches shipping rate quotes from Envia.com to reduce API calls and improve performance';

-- =====================================================
-- 3. UPDATE ORDERS TABLE
-- =====================================================
-- Add shipping-related fields to existing orders table

-- Add carrier information
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS carrier VARCHAR(50),
ADD COLUMN IF NOT EXISTS carrier_service VARCHAR(100);

-- Add shipping cost
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0;

-- Add delivery estimates
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP,
ADD COLUMN IF NOT EXISTS actual_delivery TIMESTAMP;

-- Add tracking reference (denormalized for quick access)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);

-- Create index on tracking number for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);

-- Add comments to new columns
COMMENT ON COLUMN orders.carrier IS 'Shipping carrier name (e.g., Estafeta, FedEx)';
COMMENT ON COLUMN orders.carrier_service IS 'Specific service type (e.g., Express, Standard)';
COMMENT ON COLUMN orders.shipping_cost IS 'Cost of shipping in MXN';
COMMENT ON COLUMN orders.estimated_delivery IS 'Estimated delivery date/time';
COMMENT ON COLUMN orders.tracking_number IS 'Tracking number for the shipment';

-- =====================================================
-- 4. CREATE FUNCTION TO AUTO-UPDATE TIMESTAMPS
-- =====================================================
-- Automatically update the updated_at field on shipments

CREATE OR REPLACE FUNCTION update_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamps
DROP TRIGGER IF EXISTS trigger_update_shipments_timestamp ON shipments;
CREATE TRIGGER trigger_update_shipments_timestamp
    BEFORE UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_shipments_updated_at();

-- =====================================================
-- 5. CREATE FUNCTION TO CLEAN EXPIRED CACHE
-- =====================================================
-- Function to clean up expired cache entries

CREATE OR REPLACE FUNCTION clean_expired_shipping_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM shipping_rates_cache
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION clean_expired_shipping_cache() IS 'Deletes expired shipping rate cache entries. Returns count of deleted rows.';

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on new tables

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything on shipments
CREATE POLICY "Admins can manage all shipments"
ON shipments
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- Policy: Users can view their own order's shipment
CREATE POLICY "Users can view their own order shipments"
ON shipments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = shipments.order_id
        AND orders.user_id = auth.uid()
    )
);

-- Policy: Admins can manage cache
CREATE POLICY "Admins can manage shipping cache"
ON shipping_rates_cache
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- Policy: Public can read cache (for quote calculations)
CREATE POLICY "Public can read shipping cache"
ON shipping_rates_cache
FOR SELECT
TO anon, authenticated
USING (expires_at > NOW());

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the migration was successful

-- Verify shipments table
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'shipments' ORDER BY ordinal_position;

-- Verify shipping_rates_cache table
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'shipping_rates_cache' ORDER BY ordinal_position;

-- Verify orders table updates
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'orders' AND column_name IN ('carrier', 'shipping_cost', 'tracking_number')
-- ORDER BY ordinal_position;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Cache expires after 24 hours by default (set in application code)
-- 2. Run clean_expired_shipping_cache() periodically (e.g., daily cron job)
-- 3. Tracking events are stored as JSONB for flexibility
-- 4. All monetary values are in MXN (Mexican Pesos)
-- 5. Weights are in grams, dimensions in centimeters

-- =====================================================
-- END OF MIGRATION
-- =====================================================

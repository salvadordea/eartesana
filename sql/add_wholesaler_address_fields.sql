-- Add address and billing fields to wholesalers table
-- This allows wholesalers to store their shipping and billing information

ALTER TABLE public.wholesalers
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_city TEXT,
ADD COLUMN IF NOT EXISTS shipping_state TEXT,
ADD COLUMN IF NOT EXISTS shipping_zipcode TEXT,
ADD COLUMN IF NOT EXISTS shipping_country TEXT DEFAULT 'México',

ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS billing_city TEXT,
ADD COLUMN IF NOT EXISTS billing_state TEXT,
ADD COLUMN IF NOT EXISTS billing_zipcode TEXT,
ADD COLUMN IF NOT EXISTS billing_country TEXT DEFAULT 'México',

ADD COLUMN IF NOT EXISTS rfc TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_wholesalers_rfc ON public.wholesalers(rfc);

-- Add comments
COMMENT ON COLUMN public.wholesalers.shipping_address IS 'Primary shipping address';
COMMENT ON COLUMN public.wholesalers.billing_address IS 'Billing address (can be same as shipping)';
COMMENT ON COLUMN public.wholesalers.rfc IS 'RFC for invoicing (Mexican tax ID)';
COMMENT ON COLUMN public.wholesalers.business_name IS 'Razón Social for invoicing';
COMMENT ON COLUMN public.wholesalers.contact_name IS 'Primary contact person name';
COMMENT ON COLUMN public.wholesalers.contact_phone IS 'Primary contact phone number';

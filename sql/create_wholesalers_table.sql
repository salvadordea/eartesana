-- Create wholesalers table for mayoristas management
-- This table will store wholesale customer information with authentication

CREATE TABLE IF NOT EXISTS public.wholesalers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    company TEXT NOT NULL,
    phone TEXT,
    password TEXT NOT NULL, -- Store hashed password
    discount_percentage INTEGER DEFAULT 20 CHECK (discount_percentage >= 0 AND discount_percentage <= 50),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    notes TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wholesalers_email ON public.wholesalers(email);
CREATE INDEX IF NOT EXISTS idx_wholesalers_status ON public.wholesalers(status);
CREATE INDEX IF NOT EXISTS idx_wholesalers_company ON public.wholesalers(company);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_wholesalers_updated_at
    BEFORE UPDATE ON public.wholesalers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.wholesalers ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (admin access)
CREATE POLICY "Service role can manage wholesalers" ON public.wholesalers
    FOR ALL USING (auth.role() = 'service_role');

-- Create policy for authenticated wholesalers to read their own data
CREATE POLICY "Wholesalers can read own data" ON public.wholesalers
    FOR SELECT USING (auth.email() = email);

-- Grant necessary permissions
GRANT ALL ON public.wholesalers TO service_role;
GRANT SELECT ON public.wholesalers TO authenticated;

-- Insert some sample data for testing (optional, remove after testing)
INSERT INTO public.wholesalers (name, email, company, phone, password, discount_percentage, status, notes) VALUES
    ('María González', 'maria@empresaabc.com', 'Empresa ABC S.A.', '+34 600 123 456', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 25, 'active', 'Cliente VIP desde 2022'),
    ('Carlos Ruiz', 'carlos@distribuidoraruiz.com', 'Distribuidora Ruiz', '+34 610 987 654', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 20, 'active', 'Pedidos regulares mensuales')
ON CONFLICT (email) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE public.wholesalers IS 'Table storing wholesale customers (mayoristas) information and authentication';
COMMENT ON COLUMN public.wholesalers.discount_percentage IS 'Default discount percentage (0-50%)';
COMMENT ON COLUMN public.wholesalers.status IS 'Status: active, suspended, or inactive';
COMMENT ON COLUMN public.wholesalers.password IS 'Hashed password for authentication';
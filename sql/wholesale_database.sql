-- =============================================================================
-- ESTRUCTURA DE BASE DE DATOS PARA MAYORISTAS - ESTUDIO ARTESANA
-- =============================================================================

-- 1) TABLA DE MAYORISTAS
-- -----------------------------------------------------------------------------
create table if not exists public.wholesale_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Datos fiscales
  company_name text not null,
  rfc text not null,
  tax_street text,
  tax_ext_number text,
  tax_int_number text,
  tax_neighborhood text,
  tax_city text,
  tax_state text,
  tax_postal_code text,
  tax_country text default 'MX',

  -- Datos de envío
  shipping_contact_name text,
  shipping_phone text,
  shipping_email text,
  shipping_street text,
  shipping_ext_number text,
  shipping_int_number text,
  shipping_neighborhood text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text default 'MX',

  -- Configuración comercial
  wholesale_discount numeric(5,2) not null default 20.00,  -- porcentaje
  payment_terms text default 'Pago a 30 días',
  preferred_payment_method text default 'transferencia',    -- 'transferencia' | 'efectivo_contra_entrega'
  status text not null default 'active',                    -- 'active' | 'inactive' | 'suspended'

  -- Contacto general
  contact_name text,
  contact_phone text,
  contact_email text,

  -- Metadatos
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices y restricciones para wholesale_customers
create unique index if not exists idx_wholesale_customers_user_id on public.wholesale_customers(user_id);
create index if not exists idx_wholesale_customers_rfc on public.wholesale_customers(rfc);
create index if not exists idx_wholesale_customers_status on public.wholesale_customers(status);

-- 2) TABLA DE PEDIDOS MAYORISTAS
-- -----------------------------------------------------------------------------
create table if not exists public.wholesale_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id),
  wholesale_customer_id uuid not null references public.wholesale_customers(id),

  -- Datos del pedido
  items jsonb not null,  -- Array de productos/variantes con cantidades y precios
  subtotal numeric(10,2) not null,
  discount_percentage numeric(5,2) not null default 20.00,
  discount_amount numeric(10,2) not null,
  total numeric(10,2) not null,
  
  -- Método de pago y estado
  payment_method text not null check (payment_method in ('transferencia', 'efectivo_contra_entrega')),
  payment_status text not null default 'pendiente' check (payment_status in ('pendiente', 'pagado', 'cancelado')),
  
  -- Estado del pedido
  order_status text not null default 'recibido' check (order_status in ('recibido', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado')),
  
  -- Datos de facturación (copiados del mayorista al crear el pedido)
  billing_company_name text not null,
  billing_rfc text not null,
  billing_address jsonb not null,  -- Dirección fiscal completa
  
  -- Datos de envío (copiados del mayorista al crear el pedido)
  shipping_contact_name text not null,
  shipping_phone text,
  shipping_email text,
  shipping_address jsonb not null,  -- Dirección de envío completa
  
  -- Notas y observaciones
  customer_notes text,
  internal_notes text,
  
  -- Fechas
  estimated_delivery_date date,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para wholesale_orders
create index if not exists idx_wholesale_orders_user_id on public.wholesale_orders(user_id);
create index if not exists idx_wholesale_orders_customer_id on public.wholesale_orders(wholesale_customer_id);
create index if not exists idx_wholesale_orders_status on public.wholesale_orders(order_status);
create index if not exists idx_wholesale_orders_payment_status on public.wholesale_orders(payment_status);
create index if not exists idx_wholesale_orders_created_at on public.wholesale_orders(created_at);

-- 3) FUNCIÓN PARA GENERAR NÚMEROS DE PEDIDO
-- -----------------------------------------------------------------------------
create or replace function public.generate_order_number()
returns text
language plpgsql
security definer
as $$
declare
  new_number text;
  counter int;
begin
  -- Formato: WS-YYYYMM-0001
  select coalesce(max(
    cast(split_part(order_number, '-', 3) as int)
  ), 0) + 1
  into counter
  from public.wholesale_orders
  where order_number like 'WS-' || to_char(now(), 'YYYYMM') || '-%';
  
  new_number := 'WS-' || to_char(now(), 'YYYYMM') || '-' || lpad(counter::text, 4, '0');
  
  return new_number;
end;
$$;

-- 4) TRIGGER PARA UPDATED_AT
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers para updated_at
drop trigger if exists trg_wholesale_customers_updated_at on public.wholesale_customers;
create trigger trg_wholesale_customers_updated_at
before update on public.wholesale_customers
for each row execute function public.set_updated_at();

drop trigger if exists trg_wholesale_orders_updated_at on public.wholesale_orders;
create trigger trg_wholesale_orders_updated_at
before update on public.wholesale_orders
for each row execute function public.set_updated_at();

-- 5) ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------

-- RLS para wholesale_customers
alter table public.wholesale_customers enable row level security;

create policy "wholesale_customers_select_own"
on public.wholesale_customers
for select
to authenticated
using (auth.uid() = user_id);

create policy "wholesale_customers_insert_own"
on public.wholesale_customers
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "wholesale_customers_update_own"
on public.wholesale_customers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- RLS para wholesale_orders
alter table public.wholesale_orders enable row level security;

create policy "wholesale_orders_select_own"
on public.wholesale_orders
for select
to authenticated
using (auth.uid() = user_id);

create policy "wholesale_orders_insert_own"
on public.wholesale_orders
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "wholesale_orders_update_own"
on public.wholesale_orders
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 6) FUNCIONES UTILITARIAS
-- -----------------------------------------------------------------------------

-- Upsert de mayorista
create or replace function public.upsert_wholesale_customer(p_user_id uuid, p_data jsonb)
returns public.wholesale_customers
language sql
security definer
as $$
  insert into public.wholesale_customers (
    user_id, company_name, rfc,
    tax_street, tax_ext_number, tax_int_number, tax_neighborhood, tax_city, tax_state, tax_postal_code, tax_country,
    shipping_contact_name, shipping_phone, shipping_email, shipping_street, shipping_ext_number, shipping_int_number,
    shipping_neighborhood, shipping_city, shipping_state, shipping_postal_code, shipping_country,
    wholesale_discount, payment_terms, preferred_payment_method,
    contact_name, contact_phone, contact_email, status
  )
  values (
    p_user_id,
    coalesce(p_data->>'company_name',''), coalesce(p_data->>'rfc',''),
    p_data->>'tax_street', p_data->>'tax_ext_number', p_data->>'tax_int_number', p_data->>'tax_neighborhood',
    p_data->>'tax_city', p_data->>'tax_state', p_data->>'tax_postal_code', coalesce(p_data->>'tax_country','MX'),
    p_data->>'shipping_contact_name', p_data->>'shipping_phone', p_data->>'shipping_email',
    p_data->>'shipping_street', p_data->>'shipping_ext_number', p_data->>'shipping_int_number',
    p_data->>'shipping_neighborhood', p_data->>'shipping_city', p_data->>'shipping_state',
    p_data->>'shipping_postal_code', coalesce(p_data->>'shipping_country','MX'),
    coalesce((p_data->>'wholesale_discount')::numeric, 20.00),
    coalesce(p_data->>'payment_terms','Pago a 30 días'),
    coalesce(p_data->>'preferred_payment_method','transferencia'),
    p_data->>'contact_name', p_data->>'contact_phone', p_data->>'contact_email',
    coalesce(p_data->>'status','active')
  )
  on conflict (user_id) do update set
    company_name = excluded.company_name,
    rfc = excluded.rfc,
    tax_street = excluded.tax_street,
    tax_ext_number = excluded.tax_ext_number,
    tax_int_number = excluded.tax_int_number,
    tax_neighborhood = excluded.tax_neighborhood,
    tax_city = excluded.tax_city,
    tax_state = excluded.tax_state,
    tax_postal_code = excluded.tax_postal_code,
    tax_country = excluded.tax_country,
    shipping_contact_name = excluded.shipping_contact_name,
    shipping_phone = excluded.shipping_phone,
    shipping_email = excluded.shipping_email,
    shipping_street = excluded.shipping_street,
    shipping_ext_number = excluded.shipping_ext_number,
    shipping_int_number = excluded.shipping_int_number,
    shipping_neighborhood = excluded.shipping_neighborhood,
    shipping_city = excluded.shipping_city,
    shipping_state = excluded.shipping_state,
    shipping_postal_code = excluded.shipping_postal_code,
    shipping_country = excluded.shipping_country,
    wholesale_discount = excluded.wholesale_discount,
    payment_terms = excluded.payment_terms,
    preferred_payment_method = excluded.preferred_payment_method,
    contact_name = excluded.contact_name,
    contact_phone = excluded.contact_phone,
    contact_email = excluded.contact_email,
    status = excluded.status,
    updated_at = now()
  returning *;
$$;

-- Obtener perfil del mayorista logueado
create or replace function public.get_my_wholesale_customer()
returns public.wholesale_customers
language sql
security definer
set search_path = public
as $$
  select *
  from public.wholesale_customers
  where user_id = auth.uid()
  limit 1;
$$;

-- Crear pedido mayorista
create or replace function public.create_wholesale_order(p_order_data jsonb)
returns public.wholesale_orders
language plpgsql
security definer
as $$
declare
  v_customer public.wholesale_customers;
  v_order_number text;
  v_order public.wholesale_orders;
begin
  -- Obtener datos del mayorista
  select * into v_customer
  from public.wholesale_customers
  where user_id = auth.uid();
  
  if v_customer.id is null then
    raise exception 'No se encontró perfil de mayorista para este usuario';
  end if;
  
  -- Generar número de pedido
  v_order_number := public.generate_order_number();
  
  -- Crear pedido
  insert into public.wholesale_orders (
    order_number, user_id, wholesale_customer_id,
    items, subtotal, discount_percentage, discount_amount, total,
    payment_method, billing_company_name, billing_rfc, billing_address,
    shipping_contact_name, shipping_phone, shipping_email, shipping_address,
    customer_notes
  ) values (
    v_order_number, auth.uid(), v_customer.id,
    p_order_data->'items',
    (p_order_data->>'subtotal')::numeric,
    (p_order_data->>'discount_percentage')::numeric,
    (p_order_data->>'discount_amount')::numeric,
    (p_order_data->>'total')::numeric,
    p_order_data->>'payment_method',
    v_customer.company_name,
    v_customer.rfc,
    jsonb_build_object(
      'street', v_customer.tax_street,
      'ext_number', v_customer.tax_ext_number,
      'int_number', v_customer.tax_int_number,
      'neighborhood', v_customer.tax_neighborhood,
      'city', v_customer.tax_city,
      'state', v_customer.tax_state,
      'postal_code', v_customer.tax_postal_code,
      'country', v_customer.tax_country
    ),
    coalesce(v_customer.shipping_contact_name, v_customer.contact_name),
    coalesce(v_customer.shipping_phone, v_customer.contact_phone),
    coalesce(v_customer.shipping_email, v_customer.contact_email),
    jsonb_build_object(
      'street', v_customer.shipping_street,
      'ext_number', v_customer.shipping_ext_number,
      'int_number', v_customer.shipping_int_number,
      'neighborhood', v_customer.shipping_neighborhood,
      'city', v_customer.shipping_city,
      'state', v_customer.shipping_state,
      'postal_code', v_customer.shipping_postal_code,
      'country', v_customer.shipping_country
    ),
    p_order_data->>'customer_notes'
  ) returning * into v_order;
  
  return v_order;
end;
$$;

-- =============================================================================
-- DATOS DE EJEMPLO (OPCIONAL - COMENTAR SI NO SE NECESITA)
-- =============================================================================

-- Ejemplo de mayorista para testing
-- insert into public.wholesale_customers (
--   user_id, company_name, rfc, 
--   tax_street, tax_city, tax_state, tax_postal_code,
--   shipping_contact_name, shipping_phone, shipping_email,
--   shipping_street, shipping_city, shipping_state, shipping_postal_code,
--   contact_name, contact_phone, contact_email
-- ) values (
--   '00000000-0000-0000-0000-000000000000'::uuid, -- Reemplazar con un user_id real
--   'Distribuidora Ejemplo SA de CV',
--   'DEJ123456789',
--   'Av. Revolución 123',
--   'Ciudad de México',
--   'CDMX',
--   '01000',
--   'Juan Pérez',
--   '+52 55 1234 5678',
--   'juan@ejemplo.com',
--   'Calle Comercio 456',
--   'Ciudad de México',
--   'CDMX',
--   '02000',
--   'Juan Pérez',
--   '+52 55 1234 5678',
--   'juan@ejemplo.com'
-- );

-- =============================================================================
-- FIN DEL SCRIPT
-- =============================================================================

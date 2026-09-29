-- ==============================================================================
-- R&C COMMODITIES — ORDER PERSISTENCE, DELIVERY & ROW LEVEL SECURITY (RLS) FIX
-- Migration: 20260928_orders_persistence_and_rls.sql
-- ==============================================================================
-- This migration guarantees reliable order persistence for R&C Commodities:
-- 1. Updates schema on public.orders, public.order_items, and public.customers
--    to store customer details, delivery address, and payment method directly.
-- 2. Configures Row Level Security (RLS) policies so:
--    - Storefront customers (anon & authenticated) can INSERT orders, order_items, and customer details.
--    - Storefront customers can SELECT the created orders (enables Supabase RETURNING / .select()).
--    - Administrators have full access (ALL) to view, update, and manage orders and statuses.
-- 3. Sets standard default delivery method to 'Nationwide Delivery'.
-- ==============================================================================

-- 1. ENSURE CUSTOMERS TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- 2. ENSURE ORDERS TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  delivery_method TEXT NOT NULL DEFAULT 'Nationwide Delivery',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all checkout and audit fields exist on orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'eft';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ALTER COLUMN delivery_method SET DEFAULT 'Nationwide Delivery';

-- 3. ENSURE ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ==============================================================================
-- 4. CONFIGURE ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all order management tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. CUSTOMERS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can create customer record" ON public.customers;
DROP POLICY IF EXISTS "Public can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Public can select customers" ON public.customers;
DROP POLICY IF EXISTS "Admins have full access to customers" ON public.customers;

-- Anyone can insert customer details during checkout
CREATE POLICY "Public can insert customers"
  ON public.customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow reading customer records (needed for checkout order return and admin)
CREATE POLICY "Public can select customers"
  ON public.customers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admins full access
CREATE POLICY "Admins have full access to customers"
  ON public.customers
  FOR ALL
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- ------------------------------------------------------------------------------
-- B. ORDERS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can select orders" ON public.orders;
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;

-- Allow checkout to insert orders
CREATE POLICY "Public can insert orders"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow reading orders (needed for .insert().select() and confirmation lookup)
CREATE POLICY "Public can select orders"
  ON public.orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Administrators have full management access (status updates, notes, etc.)
CREATE POLICY "Admins have full access to orders"
  ON public.orders
  FOR ALL
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- ------------------------------------------------------------------------------
-- C. ORDER ITEMS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can select order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins have full access to order items" ON public.order_items;

-- Allow inserting line items for orders
CREATE POLICY "Public can insert order items"
  ON public.order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow reading line items
CREATE POLICY "Public can select order items"
  ON public.order_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Administrators have full management access to order items
CREATE POLICY "Admins have full access to order items"
  ON public.order_items
  FOR ALL
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- ------------------------------------------------------------------------------
-- 5. STOCK DECREMENT RPC FOR ORDERS
-- ------------------------------------------------------------------------------
-- Safe SECURITY DEFINER function to decrement stock upon verified order placement
CREATE OR REPLACE FUNCTION public.decrement_order_stock(items_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  item_record JSONB;
  target_product_id UUID;
  target_accessory_id UUID;
  qty INT;
  curr_stock INT;
BEGIN
  FOR item_record IN SELECT * FROM jsonb_array_elements(items_data)
  LOOP
    qty := COALESCE((item_record->>'quantity')::INT, 1);
    
    -- Handle physical tyre product
    IF item_record->>'productId' IS NOT NULL THEN
      target_product_id := (item_record->>'productId')::UUID;
      UPDATE public.products
      SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - qty),
          updated_at = now()
      WHERE id = target_product_id;
    END IF;

    -- Handle combo component tyres
    IF item_record->>'frontProductId' IS NOT NULL THEN
      UPDATE public.products
      SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - qty),
          updated_at = now()
      WHERE id = (item_record->>'frontProductId')::UUID;
    END IF;

    IF item_record->>'rearProductId' IS NOT NULL THEN
      UPDATE public.products
      SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - qty),
          updated_at = now()
      WHERE id = (item_record->>'rearProductId')::UUID;
    END IF;

    -- Handle accessory
    IF item_record->>'accessoryId' IS NOT NULL THEN
      target_accessory_id := (item_record->>'accessoryId')::UUID;
      UPDATE public.accessories
      SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - qty),
          updated_at = now()
      WHERE id = target_accessory_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_order_stock(JSONB) TO anon, authenticated, service_role;

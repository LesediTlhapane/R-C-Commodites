-- ==============================================================================
-- R&C COMMODITIES — FIX CHECKOUT & ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Run this script in your Supabase project SQL Editor (https://supabase.com/dashboard)
-- 
-- This script:
-- 1. Keeps Row Level Security (RLS) ENABLED on all tables (strict security).
-- 2. Grants INSERT and SELECT permissions to public visitors (anon) so checkout works.
-- 3. Grants full management permissions to authenticated admins (public.is_admin()).
-- 4. Installs the atomic stock decrement function (decrement_order_stock).
-- ==============================================================================

-- 1. Ensure Table Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.customers TO anon, authenticated;
GRANT ALL ON public.orders TO anon, authenticated;
GRANT ALL ON public.order_items TO anon, authenticated;
GRANT SELECT ON public.accessories TO anon, authenticated;
GRANT ALL ON public.accessories TO authenticated;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. CUSTOMERS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can create customer record" ON public.customers;
DROP POLICY IF EXISTS "Public can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Public can select customers" ON public.customers;
DROP POLICY IF EXISTS "Admins have full access to customers" ON public.customers;

-- Anyone can submit their customer details during checkout
CREATE POLICY "Public can insert customers"
  ON public.customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow reading customer records (required for order confirmation screen)
CREATE POLICY "Public can select customers"
  ON public.customers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Administrators have full management access
CREATE POLICY "Admins have full access to customers"
  ON public.customers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. ORDERS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can select orders" ON public.orders;
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;

-- Allow checkout visitors to place orders
CREATE POLICY "Public can insert orders"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow reading orders (needed for Supabase .insert().select() and confirmation lookup)
CREATE POLICY "Public can select orders"
  ON public.orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Administrators have full access to manage orders
CREATE POLICY "Admins have full access to orders"
  ON public.orders
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. ORDER ITEMS POLICIES
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

-- Administrators have full access to order items
CREATE POLICY "Admins have full access to order items"
  ON public.order_items
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. ACCESSORIES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow accessories select" ON public.accessories;
DROP POLICY IF EXISTS "Allow public read on accessories" ON public.accessories;
DROP POLICY IF EXISTS "Allow accessories insert" ON public.accessories;
DROP POLICY IF EXISTS "Allow accessories update" ON public.accessories;
DROP POLICY IF EXISTS "Allow accessories delete" ON public.accessories;

CREATE POLICY "Allow accessories select"
  ON public.accessories
  FOR SELECT
  TO anon, authenticated
  USING (active = true OR public.is_admin());

CREATE POLICY "Allow accessories insert"
  ON public.accessories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow accessories update"
  ON public.accessories
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow accessories delete"
  ON public.accessories
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. ATOMIC STOCK DECREMENT FUNCTION
-- ------------------------------------------------------------------------------
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

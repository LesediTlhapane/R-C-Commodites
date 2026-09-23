-- ==============================================================================
-- R&C COMMODITIES — ADMIN SECURITY & ROW LEVEL SECURITY (RLS) FOUNDATION
-- Migration: 20260922_admin_security_foundation.sql
-- ==============================================================================
-- This script configures the RBAC (Role-Based Access Control) architecture
-- and enforces Row Level Security (RLS) across all core e-commerce tables:
--   - user_roles
--   - products
--   - combos
--   - orders
--   - order_items
--   - customers
--   - inventory_history
-- ==============================================================================

-- 1. USER ROLES TABLE
-- Links directly to auth.users.id to prevent client-side role forgery.
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Index for high-performance role checks during RLS evaluation
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON public.user_roles(user_id, role);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. SECURITY DEFINER HELPER FUNCTIONS
-- This function runs with elevated privileges to check admin status safely in RLS policies without infinite recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
BEGIN
  -- If not logged in, not an admin
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

-- Grant execute to authenticated and anon so PostgREST can evaluate policies using this function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- Helper to quickly assign admin status by email (callable via Supabase SQL Editor)
CREATE OR REPLACE FUNCTION public.assign_admin(admin_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_id UUID;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = trim(admin_email);
  
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'User % not found in auth.users. Please create the user in Supabase Auth first.', admin_email;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN 'Admin role successfully granted to ' || admin_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_admin(TEXT) TO authenticated, anon, service_role;

-- Policy: Users can view their own role
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Only administrators can assign or alter roles
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
CREATE POLICY "Admins can manage all user roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 3. PRODUCTS TABLE RLS
-- Customers can read products. Only authorized admins can modify.
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

    -- Public / Customer Read
    DROP POLICY IF EXISTS "Allow public read on products" ON public.products;
    CREATE POLICY "Allow public read on products"
      ON public.products
      FOR SELECT
      TO anon, authenticated
      USING (true);

    -- Admin Insert
    DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
    CREATE POLICY "Admins can insert products"
      ON public.products
      FOR INSERT
      TO authenticated
      WITH CHECK (
        public.is_admin() OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
      );

    -- Admin Update
    DROP POLICY IF EXISTS "Admins can update products" ON public.products;
    CREATE POLICY "Admins can update products"
      ON public.products
      FOR UPDATE
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

    -- Admin Delete
    DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
    CREATE POLICY "Admins can delete products"
      ON public.products
      FOR DELETE
      TO authenticated
      USING (
        public.is_admin() OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
      );
  END IF;
END $$;

-- ==============================================================================
-- 4. COMBOS TABLE RLS
-- Customers can read active combos. Only authorized admins can modify.
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'combos') THEN
    ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;

    -- Public / Customer Read
    DROP POLICY IF EXISTS "Allow public read on combos" ON public.combos;
    CREATE POLICY "Allow public read on combos"
      ON public.combos
      FOR SELECT
      TO anon, authenticated
      USING (true);

    -- Admin Insert
    DROP POLICY IF EXISTS "Admins can insert combos" ON public.combos;
    CREATE POLICY "Admins can insert combos"
      ON public.combos
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin());

    -- Admin Update
    DROP POLICY IF EXISTS "Admins can update combos" ON public.combos;
    CREATE POLICY "Admins can update combos"
      ON public.combos
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());

    -- Admin Delete
    DROP POLICY IF EXISTS "Admins can delete combos" ON public.combos;
    CREATE POLICY "Admins can delete combos"
      ON public.combos
      FOR DELETE
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- ==============================================================================
-- 5. ORDERS & ORDER ITEMS RLS
-- Customers cannot view other customers' orders. Admins have full access.
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

    -- Admins can read all orders
    DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
    CREATE POLICY "Admins have full access to orders"
      ON public.orders
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());

    -- Public/Guest/Customer can create an order at checkout
    DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
    CREATE POLICY "Public can create orders"
      ON public.orders
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

    -- Admins have full access to order items
    DROP POLICY IF EXISTS "Admins have full access to order items" ON public.order_items;
    CREATE POLICY "Admins have full access to order items"
      ON public.order_items
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());

    -- Public/Customer can insert items during checkout
    DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
    CREATE POLICY "Public can create order items"
      ON public.order_items
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- 6. CUSTOMERS TABLE RLS
-- Protect customer personally identifiable information (PII).
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

    -- Admins can view/manage all customers
    DROP POLICY IF EXISTS "Admins have full access to customers" ON public.customers;
    CREATE POLICY "Admins have full access to customers"
      ON public.customers
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());

    -- Checkout can insert new customer contact details
    DROP POLICY IF EXISTS "Public can create customer record" ON public.customers;
    CREATE POLICY "Public can create customer record"
      ON public.customers
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- 7. INVENTORY HISTORY RLS
-- Strict admin-only access for stock auditing and inventory changes.
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_history') THEN
    ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Admins only on inventory_history" ON public.inventory_history;
    CREATE POLICY "Admins only on inventory_history"
      ON public.inventory_history
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
  END IF;
END $$;

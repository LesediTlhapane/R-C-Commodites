-- ==============================================================================
-- R&C COMMODITIES — FIX PRODUCTS UPDATE RLS & ADMIN AUTHORIZATION
-- Migration: 20260923_fix_products_update_rls.sql
-- ==============================================================================
-- Resolves the issue where authenticated administrators receive 0 rows updated
-- ("No product was updated. Please check that the product exists and that your
-- administrator account is authorized to modify inventory.")
--
-- This script:
-- 1. Sets up public.user_roles with proper indexes and RLS.
-- 2. Defines public.is_admin() with explicit search_path (public, auth) and grants execution.
-- 3. Configures public.assign_admin() helper.
-- 4. Re-creates public.products UPDATE policy with dual validation (is_admin() + direct user_roles check).
-- 5. Re-creates public.inventory_history policy so stock adjustment audit logging succeeds.
-- 6. Automatically assigns admin role to registered admin accounts if present in auth.users.
-- ==============================================================================

-- 1. Ensure user_roles table exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON public.user_roles(user_id, role);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Define is_admin() SECURITY DEFINER function with explicit search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
BEGIN
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

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- 3. Define assign_admin helper
CREATE OR REPLACE FUNCTION public.assign_admin(admin_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_id UUID;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE lower(email) = lower(trim(admin_email));
  
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

-- 4. Policies on user_roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
CREATE POLICY "Admins can manage all user roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Policies on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on products" ON public.products;
CREATE POLICY "Allow public read on products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (true);

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

-- 6. Policies on inventory_history
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

-- 7. Grant admin role to existing administrators in auth.users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE lower(email) IN ('leseditlhapane5@gmail.com', 'admin@rc-commodities.co.za', 'costa08@gmail.com', 'costa@rc-commodities.co.za')
ON CONFLICT (user_id, role) DO NOTHING;

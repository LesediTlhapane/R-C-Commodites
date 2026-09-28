-- ==============================================================================
-- R&C COMMODITIES — STRICT ROW LEVEL SECURITY (RLS) & ADMIN PRIVILEGES
-- Migration: 20260928_accessories_rls_and_admin_fix.sql
-- ==============================================================================
-- Enforces production-grade Row Level Security across accessories and inventory:
--   - Public / Anonymous users: Can ONLY read active accessories for the storefront.
--   - Authenticated Administrators: Exclusive rights to INSERT, UPDATE, DELETE.
--   - Prevents unauthorized public mutation without using insecure "WITH CHECK (true)".
--   - Enhances is_admin() to check both public.user_roles and authenticated admin emails.
-- ==============================================================================

-- 1. Ensure accessories table exists
CREATE TABLE IF NOT EXISTS public.accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Accessories',
  price NUMERIC NOT NULL DEFAULT 0,
  stock_quantity INTEGER,
  description TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for storefront query performance
CREATE INDEX IF NOT EXISTS idx_accessories_active ON public.accessories(active);
CREATE INDEX IF NOT EXISTS idx_accessories_category ON public.accessories(category);

-- Enable Row Level Security on accessories
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;

-- 2. Enhanced is_admin() security helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
DECLARE
  current_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Check user_roles table
  IF EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. Verify registered administrator email in auth.users
  SELECT email INTO current_email FROM auth.users WHERE id = auth.uid();
  IF current_email IS NOT NULL AND lower(trim(current_email)) IN (
    'leseditlhapane5@gmail.com',
    'admin@rc-commodities.co.za',
    'costa08@gmail.com',
    'costa@rc-commodities.co.za'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- 3. ACCESSORIES RLS POLICIES (STRICT)

-- Policy: Public & authenticated can read active items (Admins can read all)
DROP POLICY IF EXISTS "Allow public read on accessories" ON public.accessories;
DROP POLICY IF EXISTS "Allow accessories select" ON public.accessories;
CREATE POLICY "Allow accessories select"
  ON public.accessories
  FOR SELECT
  TO anon, authenticated
  USING (
    active = true OR
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Policy: ONLY authenticated administrators can INSERT accessories
DROP POLICY IF EXISTS "Allow accessories insert" ON public.accessories;
CREATE POLICY "Allow accessories insert"
  ON public.accessories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Policy: ONLY authenticated administrators can UPDATE accessories
DROP POLICY IF EXISTS "Allow accessories update" ON public.accessories;
CREATE POLICY "Allow accessories update"
  ON public.accessories
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

-- Policy: ONLY authenticated administrators can DELETE accessories
DROP POLICY IF EXISTS "Allow accessories delete" ON public.accessories;
CREATE POLICY "Allow accessories delete"
  ON public.accessories
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- 4. INVENTORY HISTORY POLICIES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_history') THEN
    ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow inventory_history select" ON public.inventory_history;
    CREATE POLICY "Allow inventory_history select"
      ON public.inventory_history
      FOR SELECT
      TO authenticated
      USING (
        public.is_admin() OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
      );

    DROP POLICY IF EXISTS "Allow inventory_history insert" ON public.inventory_history;
    CREATE POLICY "Allow inventory_history insert"
      ON public.inventory_history
      FOR INSERT
      TO authenticated
      WITH CHECK (
        public.is_admin() OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
      );

    DROP POLICY IF EXISTS "Allow inventory_history delete" ON public.inventory_history;
    CREATE POLICY "Allow inventory_history delete"
      ON public.inventory_history
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

-- 5. Automatically seed user_roles for registered admin accounts
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE lower(trim(email)) IN (
  'leseditlhapane5@gmail.com',
  'admin@rc-commodities.co.za',
  'costa08@gmail.com',
  'costa@rc-commodities.co.za'
)
ON CONFLICT (user_id, role) DO NOTHING;

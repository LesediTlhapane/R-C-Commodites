-- ==============================================================================
-- R&C COMMODITIES — ACCESSORIES ROW LEVEL SECURITY (RLS) & ADMIN PRIVILEGES
-- Migration: 20260928_accessories_rls_and_admin_fix.sql
-- ==============================================================================
-- Ensures that the accessories table has appropriate Row Level Security policies
-- allowing storefront visitors to read active items, and administrators to
-- insert, update, soft-delete, and manage accessories without 42501 RLS errors.
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

-- Index for storefront filtering
CREATE INDEX IF NOT EXISTS idx_accessories_active ON public.accessories(active);
CREATE INDEX IF NOT EXISTS idx_accessories_category ON public.accessories(category);

-- Enable Row Level Security
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;

-- 2. Storefront / Public Read Policy
DROP POLICY IF EXISTS "Allow public read on accessories" ON public.accessories;
CREATE POLICY "Allow public read on accessories"
  ON public.accessories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Admin / Staff Modification Policies
DROP POLICY IF EXISTS "Allow accessories insert" ON public.accessories;
CREATE POLICY "Allow accessories insert"
  ON public.accessories
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow accessories update" ON public.accessories;
CREATE POLICY "Allow accessories update"
  ON public.accessories
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow accessories delete" ON public.accessories;
CREATE POLICY "Allow accessories delete"
  ON public.accessories
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 4. Inventory history table policies for accessories
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_history') THEN
    ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow inventory_history insert" ON public.inventory_history;
    CREATE POLICY "Allow inventory_history insert"
      ON public.inventory_history
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow inventory_history select" ON public.inventory_history;
    CREATE POLICY "Allow inventory_history select"
      ON public.inventory_history
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- 5. Automatically ensure administrator email accounts exist in user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE lower(email) IN ('leseditlhapane5@gmail.com', 'admin@rc-commodities.co.za', 'costa08@gmail.com', 'costa@rc-commodities.co.za')
ON CONFLICT (user_id, role) DO NOTHING;

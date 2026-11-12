-- ==============================================================================
-- R&C COMMODITIES — PRODUCT CATALOGUE EXPANSION & CUSTOMER INVOICES
-- Migration: 20261111_catalogue_expansion_and_invoices.sql
-- ==============================================================================
-- 1. Adds category, subcategory, and SKU to products & accessories
-- 2. Adds invoice tracking fields (invoice_number, invoice_issued_at, invoice_access_token_hash) to orders
-- 3. Adds product_type and sku metadata to order_items
-- 4. Preserves all existing RLS security policies and relationships
-- ==============================================================================

-- 1. EXTEND PRODUCTS TABLE
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Tyres';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory TEXT;

CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_range ON public.products(range);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- 2. EXTEND ACCESSORIES TABLE
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.accessories ADD COLUMN IF NOT EXISTS sku TEXT;

CREATE INDEX IF NOT EXISTS idx_accessories_category ON public.accessories(category);
CREATE INDEX IF NOT EXISTS idx_accessories_subcategory ON public.accessories(subcategory);
CREATE INDEX IF NOT EXISTS idx_accessories_sku ON public.accessories(sku);

-- 3. EXTEND ORDERS TABLE FOR SECURE INVOICING
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_issued_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_access_token_hash TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_token_hash TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON public.orders(invoice_number);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_access_token_hash ON public.orders(invoice_access_token_hash);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_token_hash ON public.orders(invoice_token_hash);

-- 4. EXTEND ORDER_ITEMS TABLE
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'tyre';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS sku TEXT;
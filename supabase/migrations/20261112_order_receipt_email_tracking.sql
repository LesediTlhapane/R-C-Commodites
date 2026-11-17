-- Track receipt email delivery so order approval does not send duplicate receipts.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS receipt_email_sent_at TIMESTAMPTZ;

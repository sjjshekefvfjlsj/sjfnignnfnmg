-- Customers: add category for routes vs VIP
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'route';

-- Invoices: payment breakdown + work day link
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_cash numeric NOT NULL DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_instapay numeric NOT NULL DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_credit numeric NOT NULL DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS work_day_id uuid;

-- Settings: invoice size + footer
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS invoice_width text NOT NULL DEFAULT '80';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS invoice_footer text;

-- Work days (daily sessions / reports)
CREATE TABLE IF NOT EXISTS public.work_days (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  status text NOT NULL DEFAULT 'active',
  total_sales numeric NOT NULL DEFAULT 0,
  total_cash numeric NOT NULL DEFAULT 0,
  total_instapay numeric NOT NULL DEFAULT 0,
  total_credit numeric NOT NULL DEFAULT 0,
  total_quantity numeric NOT NULL DEFAULT 0,
  invoice_count integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_days TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_days TO authenticated;
GRANT ALL ON public.work_days TO service_role;

ALTER TABLE public.work_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read work_days" ON public.work_days FOR SELECT USING (true);
CREATE POLICY "Public can insert work_days" ON public.work_days FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update work_days" ON public.work_days FOR UPDATE USING (true);
CREATE POLICY "Public can delete work_days" ON public.work_days FOR DELETE USING (true);

-- Credit payments (settling آجل balances)
CREATE TABLE IF NOT EXISTS public.credit_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  work_day_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_payments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_payments TO authenticated;
GRANT ALL ON public.credit_payments TO service_role;

ALTER TABLE public.credit_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read credit_payments" ON public.credit_payments FOR SELECT USING (true);
CREATE POLICY "Public can insert credit_payments" ON public.credit_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update credit_payments" ON public.credit_payments FOR UPDATE USING (true);
CREATE POLICY "Public can delete credit_payments" ON public.credit_payments FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_invoices_work_day ON public.invoices(work_day_id);
CREATE INDEX IF NOT EXISTS idx_credit_payments_customer ON public.credit_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_category ON public.customers(category);
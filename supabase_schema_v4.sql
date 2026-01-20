-- =================================================================
--  DATABASE SCHEMA FOR INTERIOR/FURNITURE COMPANY MANAGEMENT
-- =================================================================
--  Author: Senior Database Architect
--  Version: 4.0 (Revised)
--  Notes: This schema generalizes carpenters to workers with trades,
--         and consolidates payments into a single, flexible table.
-- =================================================================

-- =================================================================
--  EXISTING TABLES (from v3)
--  We are keeping the existing tables for profiles, products,
--  customers, inventory_history, customer_material_issue, and
--  project_finance. They are not redefined here, but are part
--  of the complete schema.
-- =================================================================

-- =================================================================
--  TABLE 7: VENDORS
--  Stores information about material suppliers.
-- =================================================================
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.vendors IS 'Stores information about material suppliers.';

-- =================================================================
--  TABLE 8: WORKERS
--  Stores information about non-employee workers and their trades.
-- =================================================================
CREATE TABLE public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  trade TEXT, -- e.g., Carpenter, False Ceiling, Fabrication
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.workers IS 'Stores information about non-employee workers and their trades.';
COMMENT ON COLUMN public.workers.trade IS 'The specific skill or trade of the worker.';

-- =================================================================
--  TABLE 9: PAYMENTS
--  A unified table to track payments to both workers and vendors.
-- =================================================================
CREATE TABLE public.payments (
  id BIGSERIAL PRIMARY KEY,
  payee_type TEXT NOT NULL CHECK (payee_type IN ('worker', 'vendor')),
  worker_id UUID REFERENCES public.workers(id),
  vendor_id UUID REFERENCES public.vendors(id),
  customer_id UUID REFERENCES public.customers(id), -- For project context
  amount NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT check_one_payee CHECK 
    ((payee_type = 'worker' AND worker_id IS NOT NULL AND vendor_id IS NULL) OR
     (payee_type = 'vendor' AND vendor_id IS NOT NULL AND worker_id IS NULL))
);
COMMENT ON TABLE public.payments IS 'Unified table for payments to workers and vendors.';
COMMENT ON COLUMN public.payments.customer_id IS 'Optional: links the payment to a specific project/customer.';

-- =================================================================
--  TABLE 10: PROJECT VENDOR PURCHASES
--  Logs materials purchased directly from a vendor for a specific project.
-- =================================================================
CREATE TABLE public.project_vendor_purchases (
  id BIGSERIAL PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  item_description TEXT NOT NULL,
  quantity INT NOT NULL,
  unit TEXT,
  rate NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  purchased_by UUID NOT NULL REFERENCES public.profiles(id),
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.project_vendor_purchases IS 'Logs materials purchased directly from a vendor for a specific project.';

-- =================================================================
--  INDEXES FOR PERFORMANCE
-- =================================================================
CREATE INDEX ON public.payments (worker_id);
CREATE INDEX ON public.payments (vendor_id);
CREATE INDEX ON public.payments (customer_id);
CREATE INDEX ON public.project_vendor_purchases (customer_id);
CREATE INDEX ON public.project_vendor_purchases (vendor_id);

-- =================================================================
--  ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- VENDORS RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can see vendors" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Admins can do anything with vendors" ON public.vendors FOR ALL USING (public.get_my_role() = 'admin');

-- WORKERS RLS
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can see workers" ON public.workers FOR SELECT USING (true);
CREATE POLICY "Admins can do anything with workers" ON public.workers FOR ALL USING (public.get_my_role() = 'admin');

-- PAYMENTS RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = paid_by);
CREATE POLICY "Users see payments they created" ON public.payments FOR SELECT USING (auth.uid() = paid_by);
CREATE POLICY "Admins have full access to payments" ON public.payments FOR ALL USING (public.get_my_role() = 'admin');

-- PROJECT VENDOR PURCHASES RLS
ALTER TABLE public.project_vendor_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can create vendor purchases" ON public.project_vendor_purchases FOR INSERT WITH CHECK (auth.uid() = purchased_by);
CREATE POLICY "Users see vendor purchases they created" ON public.project_vendor_purchases FOR SELECT USING (auth.uid() = purchased_by);
CREATE POLICY "Admins have full access to vendor purchases" ON public.project_vendor_purchases FOR ALL USING (public.get_my_role() = 'admin');

-- =================================================================
--  END OF SCHEMA V4 (Revised)
-- =================================================================
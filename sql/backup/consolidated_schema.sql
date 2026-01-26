-- =================================================================
--  CONSOLIDATED DATABASE SCHEMA FOR INTERIOR/FURNITURE COMPANY MANAGEMENT
-- =================================================================
--  Author: Gemini (Consolidated from various schema versions and migrations)
--  Version: 5.0 (Consolidated)
--  Notes: This schema represents the final state after separating
--         customers and projects into distinct tables, adding email
--         to customers, and updating all related foreign key references
--         and RLS policies.
-- =================================================================

-- Drop all existing public schema objects for a clean slate (optional, but recommended for full re-creation)
-- This section should be executed only if you intend to completely reset your database.
-- DROP TABLE IF EXISTS public.project_vendor_purchases CASCADE;
-- DROP TABLE IF EXISTS public.payments CASCADE;
-- DROP TABLE IF EXISTS public.workers CASCADE;
-- DROP TABLE IF EXISTS public.vendors CASCADE;
-- DROP TABLE IF EXISTS public.project_finance CASCADE;
-- DROP TABLE IF EXISTS public.customer_material_issue CASCADE;
-- DROP TABLE IF EXISTS public.inventory_history CASCADE;
-- DROP TABLE IF EXISTS public.projects CASCADE; -- New projects table
-- DROP TABLE IF EXISTS public.customers CASCADE;
-- DROP TABLE IF EXISTS public.inventory CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
-- DROP FUNCTION IF EXISTS public.update_inventory_quantity() CASCADE;
-- DROP FUNCTION IF EXISTS public.log_material_issue_to_inventory() CASCADE;
-- DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
-- DROP TRIGGER IF EXISTS on_inventory_history_insert ON public.inventory_history CASCADE;
-- DROP TRIGGER IF EXISTS on_customer_material_issue_insert ON public.customer_material_issue CASCADE;


-- =================================================================
--  TABLE 1: PROFILES
--  Stores user-specific data, linked to Supabase Auth.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  full_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores user-specific data like roles, linked to Supabase Auth.';
COMMENT ON COLUMN public.profiles.role IS 'User role: ''admin'' or ''employee''';

-- =================================================================
--  TABLE 2: INVENTORY
--  Stores inventory of materials.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT CHECK (unit IN ('sheet', 'sq ft', 'piece')),
  total_quantity INT NOT NULL DEFAULT 0,
  cost_price NUMERIC(10, 2),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.inventory IS 'Inventory of materials.';
COMMENT ON COLUMN public.inventory.cost_price IS 'Cost price of the inventory item, visible only to admins.';
COMMENT ON COLUMN public.inventory.total_quantity IS 'Cached total quantity. Updated via triggers from inventory_history.';

-- =================================================================
--  TABLE 3: CUSTOMERS (Refactored - now purely customer info with email)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT, -- Added email column
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.customers IS 'Stores pure customer contact and address information.';

-- =================================================================
--  TABLE 4: PROJECTS (New Table)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  project_value NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Moved from customers
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')), -- Moved from customers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.projects IS 'Stores project information, linked to a customer.';

-- =================================================================
--  TABLE 5: VENDORS
--  Stores information about material suppliers.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.vendors IS 'Stores information about material suppliers.';

-- =================================================================
--  TABLE 6: WORKERS
--  Stores information about non-employee workers and their trades.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  trade TEXT, -- e.g., Carpenter, False Ceiling, Fabrication
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.workers IS 'Stores information about non-employee workers and their trades.';
COMMENT ON COLUMN public.workers.trade IS 'The specific skill or trade of the worker.';


-- =================================================================
--  TABLE 7: INVENTORY HISTORY (FK updated to projects.id)
--  Tracks all stock movements for auditing.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.inventory_history (
  id BIGSERIAL PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory(id),
  quantity_change INT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('purchase', 'issued_to_project', 'correction', 'initial_stock')),
  related_project_id UUID REFERENCES public.projects(id), -- Changed from related_customer_id
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.inventory_history IS 'Tracks every stock movement for auditing purposes. Source of truth for quantity.';
COMMENT ON COLUMN public.inventory_history.quantity_change IS 'Positive for adding stock, negative for deducting.';

-- =================================================================
--  TABLE 8: CUSTOMER MATERIAL ISSUE (FK updated to projects.id)
--  Logs materials issued to a specific project.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.customer_material_issue (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id), -- Changed from customer_id
  inventory_item_id UUID NOT NULL REFERENCES public.inventory(id),
  quantity INT NOT NULL,
  rate_at_issue NUMERIC(10, 2) NOT NULL,
  issued_by UUID NOT NULL REFERENCES public.profiles(id),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.customer_material_issue IS 'Logs materials issued to a specific project.';
COMMENT ON COLUMN public.customer_material_issue.rate_at_issue IS 'The sale price of the material at the time of issue.';

-- =================================================================
--  TABLE 9: PROJECT FINANCE (FK updated to projects.id)
--  Snapshots financial data when a project is closed.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.project_finance (
  project_id UUID PRIMARY KEY REFERENCES public.projects(id), -- Changed from customer_id
  total_material_cost NUMERIC(12,2) NOT NULL,
  project_value NUMERIC(12,2) NOT NULL,
  profit NUMERIC(12,2) NOT NULL,
  closed_at TIMESTAMPTZ DEFAULT NOW(),
  closed_by UUID REFERENCES public.profiles(id)
);
COMMENT ON TABLE public.project_finance IS 'Locks financial data upon project closure for accounting.';

-- =================================================================
--  TABLE 10: PAYMENTS (FK updated to projects.id)
--  A unified table to track payments to both workers and vendors.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id BIGSERIAL PRIMARY KEY,
  payee_type TEXT NOT NULL CHECK (payee_type IN ('worker', 'vendor')),
  worker_id UUID REFERENCES public.workers(id),
  vendor_id UUID REFERENCES public.vendors(id),
  project_id UUID REFERENCES public.projects(id), -- Changed from customer_id
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
COMMENT ON COLUMN public.payments.project_id IS 'Optional: links the payment to a specific project.';

-- =================================================================
--  TABLE 11: PROJECT VENDOR PURCHASES (FK updated to projects.id)
--  Logs materials purchased directly from a vendor for a specific project.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.project_vendor_purchases (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id), -- Changed from customer_id
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
CREATE INDEX IF NOT EXISTS ON public.inventory_history (inventory_item_id);
CREATE INDEX IF NOT EXISTS ON public.inventory_history (related_project_id);
CREATE INDEX IF NOT EXISTS ON public.customer_material_issue (project_id);
CREATE INDEX IF NOT EXISTS ON public.customer_material_issue (inventory_item_id);
CREATE INDEX IF NOT EXISTS ON public.payments (worker_id);
CREATE INDEX IF NOT EXISTS ON public.payments (vendor_id);
CREATE INDEX IF NOT EXISTS ON public.payments (project_id);
CREATE INDEX IF NOT EXISTS ON public.project_vendor_purchases (project_id);
CREATE INDEX IF NOT EXISTS ON public.project_vendor_purchases (vendor_id);

-- =================================================================
--  TRIGGERS & FUNCTIONS FOR DATA INTEGRITY
-- =================================================================

-- Helper function to get role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Function to update inventory quantity from inventory history
CREATE OR REPLACE FUNCTION public.update_inventory_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.inventory
  SET total_quantity = total_quantity + NEW.quantity_change
  WHERE id = NEW.inventory_item_id;
  RETURN NEW;
END;
$$;

-- Trigger to call the function after a new history record
CREATE TRIGGER IF NOT EXISTS on_inventory_history_insert
  AFTER INSERT ON public.inventory_history
  FOR EACH ROW EXECUTE PROCEDURE public.update_inventory_quantity();
COMMENT ON TRIGGER on_inventory_history_insert ON public.inventory_history IS 'Automatically updates the total_quantity in the inventory table.';


-- Function to create an inventory history record when material is issued
CREATE OR REPLACE FUNCTION public.log_material_issue_to_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE NOTICE 'log_material_issue_to_inventory function called for project_id: %, inventory_item_id: %, quantity: %, issued_by: %', NEW.project_id, NEW.inventory_item_id, NEW.quantity, NEW.issued_by;
  INSERT INTO public.inventory_history (inventory_item_id, quantity_change, reason, related_project_id, created_by)
  VALUES (NEW.inventory_item_id, -NEW.quantity, 'issued_to_project', NEW.project_id, NEW.issued_by);
  RETURN NEW;
END;
$$;

-- Trigger to call the function after material is issued
CREATE TRIGGER IF NOT EXISTS on_customer_material_issue_insert
  AFTER INSERT ON public.customer_material_issue
  FOR EACH ROW EXECUTE PROCEDURE public.log_material_issue_to_inventory();
COMMENT ON TRIGGER on_customer_material_issue_insert ON public.customer_material_issue IS 'Atomically creates a corresponding inventory_history record.';

-- Function and Trigger to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', 'employee');
  RETURN NEW;
END;
$$;

CREATE TRIGGER IF NOT EXISTS on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- =================================================================
--  ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can see own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Admins can see all profiles" ON public.profiles FOR SELECT USING (public.get_my_role() = 'admin');
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- INVENTORY RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "All users can see inventory (except cost price)" ON public.inventory FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admins can do anything with inventory" ON public.inventory FOR ALL USING (public.get_my_role() = 'admin');

-- CUSTOMERS RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "All users can see customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admins can do anything with customers" ON public.customers FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY IF NOT EXISTS "Employees can create customers" ON public.customers FOR INSERT WITH CHECK (public.get_my_role() = 'employee');

-- PROJECTS RLS (New)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "All users can see projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Employees can create projects" ON public.projects FOR INSERT WITH CHECK (public.get_my_role() = 'employee');
CREATE POLICY IF NOT EXISTS "Admins can do anything with projects" ON public.projects FOR ALL USING (public.get_my_role() = 'admin');

-- CUSTOMER MATERIAL ISSUE RLS (Updated for project_id FK)
ALTER TABLE public.customer_material_issue ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Employees can create material issues" ON public.customer_material_issue FOR INSERT WITH CHECK (auth.uid() = issued_by);
CREATE POLICY IF NOT EXISTS "Users see material issues they created" ON public.customer_material_issue FOR SELECT USING (auth.uid() = issued_by);
CREATE POLICY IF NOT EXISTS "Admins have full access to material issues" ON public.customer_material_issue FOR ALL USING (public.get_my_role() = 'admin');

-- INVENTORY HISTORY RLS (Updated for related_project_id FK)
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users see their own inventory history" ON public.inventory_history FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY IF NOT EXISTS "Admins see all inventory history" ON public.inventory_history FOR ALL USING (public.get_my_role() = 'admin');

-- PROJECT FINANCE RLS (Updated for project_id FK)
ALTER TABLE public.project_finance ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Admins have full access to project finance" ON public.project_finance FOR ALL USING (public.get_my_role() = 'admin');

-- VENDORS RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "All users can see vendors" ON public.vendors FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admins can do anything with vendors" ON public.vendors FOR ALL USING (public.get_my_role() = 'admin');

-- WORKERS RLS
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "All users can see workers" ON public.workers FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Admins can do anything with workers" ON public.workers FOR ALL USING (public.get_my_role() = 'admin');

-- PAYMENTS RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Employees can create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = paid_by);
CREATE POLICY IF NOT EXISTS "Users see payments they created" ON public.payments FOR SELECT USING (auth.uid() = paid_by);
CREATE POLICY IF NOT EXISTS "Admins have full access to payments" ON public.payments FOR ALL USING (public.get_my_role() = 'admin');

-- PROJECT VENDOR PURCHASES RLS
ALTER TABLE public.project_vendor_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Employees can create vendor purchases" ON public.project_vendor_purchases FOR INSERT WITH CHECK (auth.uid() = purchased_by);
CREATE POLICY IF NOT EXISTS "Users see vendor purchases they created" ON public.project_vendor_purchases FOR SELECT USING (auth.uid() = purchased_by);
CREATE POLICY IF NOT EXISTS "Admins have full access to vendor purchases" ON public.project_vendor_purchases FOR ALL USING (public.get_my_role() = 'admin');



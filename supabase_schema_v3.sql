-- =================================================================
--  DATABASE SCHEMA FOR INTERIOR/FURNITURE COMPANY MANAGEMENT
-- =================================================================
--  Author: Senior Database Architect
--  Version: 3.0
--  Notes: This schema incorporates critical fixes for data integrity
--         and financial tracking, making it production-safe for MVP.
-- =================================================================

-- =================================================================
--  TABLE 1: PROFILES
--  Stores user-specific data, linked to Supabase Auth.
-- =================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  full_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores user-specific data like roles, linked to Supabase Auth.';

-- =================================================================
--  TABLE 2: PRODUCTS
--  Stores inventory of products/materials.
-- =================================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT CHECK (unit IN ('sheet', 'sq ft', 'piece')),
  total_quantity INT NOT NULL DEFAULT 0,
  cost_price NUMERIC(10, 2),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.products IS 'Inventory of products and materials.';
COMMENT ON COLUMN public.products.cost_price IS 'Cost price of the product, visible only to admins.';
COMMENT ON COLUMN public.products.total_quantity IS 'Cached total quantity. Updated via triggers from inventory_history.';


-- =================================================================
--  TABLE 3: CUSTOMERS
--  Stores customer/site/project information.
-- =================================================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  project_value NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.customers IS 'Customer and project site information.';

-- =================================================================
--  TABLE 4: INVENTORY HISTORY
--  Tracks all stock movements for auditing.
-- =================================================================
CREATE TABLE public.inventory_history (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity_change INT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('purchase', 'issued_to_customer', 'correction', 'initial_stock')),
  related_customer_id UUID REFERENCES public.customers(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.inventory_history IS 'Tracks every stock movement for auditing purposes. Source of truth for quantity.';

-- =================================================================
--  TABLE 5: CUSTOMER MATERIAL ISSUE
--  Logs materials issued to a specific customer/site.
-- =================================================================
CREATE TABLE public.customer_material_issue (
  id BIGSERIAL PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  rate_at_issue NUMERIC(10, 2) NOT NULL,
  issued_by UUID NOT NULL REFERENCES public.profiles(id),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMENT ON TABLE public.customer_material_issue IS 'Logs materials issued to a customer site. Inserting here triggers inventory change.';

-- =================================================================
--  TABLE 6: PROJECT FINANCE (NEW)
--  Snapshots financial data when a project is closed.
-- =================================================================
CREATE TABLE public.project_finance (
  customer_id UUID PRIMARY KEY REFERENCES public.customers(id),
  total_material_cost NUMERIC(12,2) NOT NULL,
  project_value NUMERIC(12,2) NOT NULL,
  profit NUMERIC(12,2) NOT NULL,
  closed_at TIMESTAMPTZ DEFAULT NOW(),
  closed_by UUID REFERENCES public.profiles(id)
);
COMMENT ON TABLE public.project_finance IS 'Locks financial data upon project closure for accounting.';

-- =================================================================
--  INDEXES FOR PERFORMANCE
-- =================================================================
CREATE INDEX ON public.inventory_history (product_id);
CREATE INDEX ON public.customer_material_issue (customer_id);
CREATE INDEX ON public.customer_material_issue (product_id);

-- =================================================================
--  TRIGGERS & FUNCTIONS FOR DATA INTEGRITY
-- =================================================================

-- 1. Function to update product quantity from inventory history
CREATE OR REPLACE FUNCTION public.update_product_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET total_quantity = total_quantity + NEW.quantity_change
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

-- Trigger to call the function after a new history record
CREATE TRIGGER on_inventory_history_insert
  AFTER INSERT ON public.inventory_history
  FOR EACH ROW EXECUTE PROCEDURE public.update_product_quantity();

COMMENT ON TRIGGER on_inventory_history_insert ON public.inventory_history IS 'Automatically updates the total_quantity in the products table.';


-- 2. Function to create an inventory history record when material is issued
CREATE OR REPLACE FUNCTION public.log_material_issue_to_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.inventory_history (product_id, quantity_change, reason, related_customer_id, created_by)
  VALUES (NEW.product_id, -NEW.quantity, 'issued_to_customer', NEW.customer_id, NEW.issued_by);
  RETURN NEW;
END;
$$;

-- Trigger to call the function after material is issued
CREATE TRIGGER on_customer_material_issue_insert
  AFTER INSERT ON public.customer_material_issue
  FOR EACH ROW EXECUTE PROCEDURE public.log_material_issue_to_inventory();

COMMENT ON TRIGGER on_customer_material_issue_insert ON public.customer_material_issue IS 'Atomically creates a corresponding inventory_history record.';

-- =================================================================
--  ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- Helper function to get role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can see all profiles" ON public.profiles FOR SELECT USING (public.get_my_role() = 'admin');
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- PRODUCTS RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- NOTE: For MVP, SELECT is open. In V2, might restrict by branch/role.
CREATE POLICY "All users can see products (except cost price)" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can do anything with products" ON public.products FOR ALL USING (public.get_my_role() = 'admin');

-- CUSTOMERS RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can see customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Admins can do anything with customers" ON public.customers FOR ALL USING (public.get_my_role() = 'admin');

-- CUSTOMER MATERIAL ISSUE RLS
ALTER TABLE public.customer_material_issue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can create material issues" ON public.customer_material_issue FOR INSERT WITH CHECK (auth.uid() = issued_by);
CREATE POLICY "Users see material issues they created" ON public.customer_material_issue FOR SELECT USING (auth.uid() = issued_by);
CREATE POLICY "Admins have full access to material issues" ON public.customer_material_issue FOR ALL USING (public.get_my_role() = 'admin');

-- INVENTORY HISTORY RLS
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their own inventory history" ON public.inventory_history FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Admins see all inventory history" ON public.inventory_history FOR ALL USING (public.get_my_role() = 'admin');

-- PROJECT FINANCE RLS
ALTER TABLE public.project_finance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to project finance" ON public.project_finance FOR ALL USING (public.get_my_role() = 'admin');


-- =================================================================
--  END OF SCHEMA V3
-- =================================================================

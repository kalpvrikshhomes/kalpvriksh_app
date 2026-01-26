-- =================================================================
--  DATABASE SCHEMA FOR INTERIOR/FURNITURE COMPANY MANAGEMENT
-- =================================================================
--  Author: Senior Database Architect
--  Version: 2.0
--  Notes: This schema is designed for an internal MVP system.
-- =================================================================

-- =================================================================
--  TABLE 1: PROFILES
--  Stores user-specific data, linked to Supabase Auth.
-- =================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'employee',
  full_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Stores user-specific data like roles, linked to Supabase Auth.';
COMMENT ON COLUMN public.profiles.role IS 'User role: ''admin'' or ''employee''';

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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity_change INT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('purchase', 'issued_to_customer', 'correction')),
  related_customer_id UUID REFERENCES public.customers(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.inventory_history IS 'Tracks every stock movement for auditing purposes.';
COMMENT ON COLUMN public.inventory_history.quantity_change IS 'Positive for adding stock, negative for deducting.';

-- =================================================================
--  TABLE 5: CUSTOMER MATERIAL ISSUE
--  Logs materials issued to a specific customer/site.
-- =================================================================
CREATE TABLE public.customer_material_issue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  rate_at_issue NUMERIC(10, 2),
  issued_by UUID NOT NULL REFERENCES public.profiles(id),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.customer_material_issue IS 'Logs materials issued to a customer site.';
COMMENT ON COLUMN public.customer_material_issue.rate_at_issue IS 'The sale price of the material at the time of issue.';


-- =================================================================
--  ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- Helper function to get the role of the current user
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can see all profiles" ON public.profiles
  FOR SELECT USING (public.get_my_role() = 'admin');

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- PRODUCTS RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can see products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admins can add, update, and delete products" ON public.products
  FOR ALL USING (public.get_my_role() = 'admin');

-- CUSTOMERS RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can see customers" ON public.customers
  FOR SELECT USING (true);

CREATE POLICY "Admins can add, update, and delete customers" ON public.customers
  FOR ALL USING (public.get_my_role() = 'admin');

-- CUSTOMER MATERIAL ISSUE RLS
ALTER TABLE public.customer_material_issue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can create material issue records" ON public.customer_material_issue
  FOR INSERT WITH CHECK (auth.uid() = issued_by);

CREATE POLICY "Users can see material issues they created" ON public.customer_material_issue
  FOR SELECT USING (auth.uid() = issued_by);

CREATE POLICY "Admins have full access to material issues" ON public.customer_material_issue
  FOR ALL USING (public.get_my_role() = 'admin');

-- INVENTORY HISTORY RLS
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own inventory history records" ON public.inventory_history
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Admins can see all inventory history" ON public.inventory_history
  FOR SELECT USING (public.get_my_role() = 'admin');

-- Note: Logic for auto-updating total_quantity in products table
-- upon changes in inventory_history or customer_material_issue
-- should be handled by database triggers or application logic.

-- =================================================================
--  END OF SCHEMA
-- =================================================================

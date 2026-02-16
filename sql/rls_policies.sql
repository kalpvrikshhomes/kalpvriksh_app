-- ----------------------------------------------------------------
-- 00. RLS HELPER FUNCTION (FIXED PRO VERSION)
-- ----------------------------------------------------------------
-- This function securely retrieves the role of the currently logged-in user.
-- IMPORTANT: Using LANGUAGE sql and STABLE (not SECURITY DEFINER)
-- ensures it respects RLS and does not bypass security.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS role_type
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;


-- ----------------------------------------------------------------
-- 01. ENABLE RLS ON ALL TABLES
-- ----------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_finance ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------------
-- 02. PROFILES TABLE POLICIES (FIXED PRO VERSION)
-- ----------------------------------------------------------------
-- Admin can read all profiles
CREATE POLICY "Admin read all profiles"
ON profiles FOR SELECT
USING (get_my_role() = 'admin');

-- User can read own profile
CREATE POLICY "User read own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- User can update own profile
CREATE POLICY "User update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());


-- ----------------------------------------------------------------
-- 03. INVENTORY ITEMS TABLE POLICIES (STRICT PRO VERSION)
-- ----------------------------------------------------------------
-- Admin has full access to inventory
CREATE POLICY "Admin full inventory access"
ON inventory_items FOR ALL
USING (get_my_role() = 'admin')
WITH CHECK (get_my_role() = 'admin');

-- Employees can only read inventory items (no insert/update)
CREATE POLICY "Employee read inventory"
ON inventory_items FOR SELECT
USING (get_my_role() = 'employee');


-- ----------------------------------------------------------------
-- 04. CUSTOMERS & PROJECTS TABLES POLICIES
-- These are operational data that employees should be able to manage
-- ----------------------------------------------------------------
-- Admin full access
CREATE POLICY "Admin full customers"
  ON customers FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Employee read and create access for customers
CREATE POLICY "Employee read customers"
  ON customers FOR SELECT
  USING (get_my_role() = 'employee');
CREATE POLICY "Employee create customers"
  ON customers FOR INSERT
  WITH CHECK (get_my_role() = 'employee');

-- Admin full access
CREATE POLICY "Admin full projects"
  ON projects FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Employee read and create access for projects
CREATE POLICY "Employee read projects"
  ON projects FOR SELECT
  USING (get_my_role() = 'employee');
CREATE POLICY "Employee create projects"
  ON projects FOR INSERT
  WITH CHECK (get_my_role() = 'employee');


-- ----------------------------------------------------------------
-- 05. VENDORS & WORKERS TABLES POLICIES (ADMIN-ONLY MASTER DATA)
-- ----------------------------------------------------------------
-- Admin full access to vendors
CREATE POLICY "Admin full vendors"
  ON vendors FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Employee read access for vendors
CREATE POLICY "Employee read vendors"
  ON vendors FOR SELECT
  USING (get_my_role() = 'employee');

-- Admin full access to workers
CREATE POLICY "Admin full workers"
  ON workers FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Employee read access for workers
CREATE POLICY "Employee read workers"
  ON workers FOR SELECT
  USING (get_my_role() = 'employee');


-- ----------------------------------------------------------------
-- 06. INVENTORY HISTORY (AUDIT TRAIL)
-- ----------------------------------------------------------------
-- Admin full access to inventory history
CREATE POLICY "Admin full inventory history access"
  ON inventory_history FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Employees can only read inventory history
CREATE POLICY "Employee read inventory history"
  ON inventory_history FOR SELECT
  USING (get_my_role() = 'employee');


-- ----------------------------------------------------------------
-- 07. MATERIAL ISSUES (EMPLOYEE OPERATIONAL)
-- ----------------------------------------------------------------
-- Admin full access to material issues
CREATE POLICY "Admin full material issues access"
  ON material_issues FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Employees can insert new material issues, and read their own
CREATE POLICY "Employee insert material issues"
  ON material_issues FOR INSERT
  WITH CHECK (get_my_role() = 'employee');
CREATE POLICY "Employee read own issues"
  ON material_issues FOR SELECT
  USING (get_my_role() = 'admin' OR issued_by = auth.uid());


-- ----------------------------------------------------------------
-- 08. VENDOR PURCHASES & ITEMS (ADMIN FULL ACCESS, EMPLOYEE CREATE/READ OWN)
-- ----------------------------------------------------------------
-- Admin full access to vendor purchases
CREATE POLICY "Admin full vendor purchases"
  ON vendor_purchases FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Employee can read and create their own vendor purchases
CREATE POLICY "Employee read own vendor purchases"
  ON vendor_purchases FOR SELECT
  USING (get_my_role() = 'admin' OR get_my_role() = 'employee'); -- Employees can see all purchases for operational context.
CREATE POLICY "Employee create vendor purchases"
  ON vendor_purchases FOR INSERT
  WITH CHECK (get_my_role() = 'employee');

-- Admin full access to vendor purchase items
CREATE POLICY "Admin full vendor purchase items"
  ON vendor_purchase_items FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Employee can read and create vendor purchase items (related to their purchases)
CREATE POLICY "Employee read vendor purchase items"
  ON vendor_purchase_items FOR SELECT
  USING (get_my_role() = 'admin' OR get_my_role() = 'employee');
CREATE POLICY "Employee create vendor purchase items"
  ON vendor_purchase_items FOR INSERT
  WITH CHECK (get_my_role() = 'employee');


-- ----------------------------------------------------------------
-- 09. PAYMENTS TABLES (ADMIN ONLY)
-- ----------------------------------------------------------------
-- Admin full access to worker payments
CREATE POLICY "Admin full worker payments"
  ON worker_payments FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');
-- No employee access

-- Admin full access to project payments
CREATE POLICY "Admin full project payments"
  ON project_payments FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');
-- No employee access


-- ----------------------------------------------------------------
-- 10. PROJECT FINANCE (ABSOLUTE ADMIN ONLY)
-- ----------------------------------------------------------------
-- Admin can read project finance
CREATE POLICY "Admin read project finance"
  ON project_finance FOR SELECT
  USING (get_my_role() = 'admin');
-- No employee access, no insert/update except triggers
-- =================================================================
--  SAMPLE DATA FOR INTERIOR/FURNITURE COMPANY MANAGEMENT
-- =================================================================
--  Author: Gemini
--  Version: 1.0
--  Notes: This script provides sample data for the tables
--         defined in supabase_schema_v3.sql.
-- =================================================================

-- =================================================================
--  SAMPLE DATA FOR PROFILES
-- =================================================================
--  Note: Assumes auth.users entries with these IDs exist.
--  Replace with actual UUIDs from your Supabase auth.users table.
-- =================================================================
INSERT INTO public.profiles (id, role, full_name) VALUES
('8a76f7a7-1d95-45a2-a8d0-226811d26868', 'admin', 'Admin User'),
('1b3e3431-4e43-4f0b-9b4b-4028682b6b6e', 'employee', 'Employee User');

-- =================================================================
--  SAMPLE DATA FOR PRODUCTS
-- =================================================================
INSERT INTO public.products (name, category, unit, total_quantity, cost_price, image_url) VALUES
('Plywood', 'Boards', 'sheet', 100, 25.50, 'https://example.com/plywood.jpg'),
('Veneer', 'Finishes', 'sq ft', 500, 5.00, 'https://example.com/veneer.jpg'),
('Screws', 'Hardware', 'piece', 1000, 0.10, 'https://example.com/screws.jpg');

-- =================================================================
--  SAMPLE DATA FOR CUSTOMERS
-- =================================================================
INSERT INTO public.customers (name, phone, address, project_value, status) VALUES
('John Doe', '123-456-7890', '123 Main St, Anytown, USA', 50000.00, 'ongoing'),
('Jane Smith', '098-765-4321', '456 Oak Ave, Othertown, USA', 75000.00, 'ongoing');

-- =================================================================
--  SAMPLE DATA FOR INVENTORY HISTORY (INITIAL STOCK)
-- =================================================================
--  Note: This will trigger the update_product_quantity function
--  and set the initial stock levels in the products table.
--  The created_by UUIDs should correspond to a user in public.profiles
-- =================================================================
INSERT INTO public.inventory_history (product_id, quantity_change, reason, created_by)
SELECT id, 100, 'initial_stock', '8a76f7a7-1d95-45a2-a8d0-226811d26868' FROM public.products WHERE name = 'Plywood';

INSERT INTO public.inventory_history (product_id, quantity_change, reason, created_by)
SELECT id, 500, 'initial_stock', '8a76f7a7-1d95-45a2-a8d0-226811d26868' FROM public.products WHERE name = 'Veneer';

INSERT INTO public.inventory_history (product_id, quantity_change, reason, created_by)
SELECT id, 1000, 'initial_stock', '8a76f7a7-1d95-45a2-a8d0-226811d26868' FROM public.products WHERE name = 'Screws';

-- =================================================================
--  END OF SAMPLE DATA
-- =================================================================

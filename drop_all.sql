-- =================================================================
--  DROP ALL TABLES AND FUNCTIONS SCRIPT
-- =================================================================
--  Author: Senior Database Architect
--  Version: 1.0
--  Notes: Use this script to completely reset your public schema
--         before running a new schema script.
-- =================================================================

-- Drop tables in reverse order of creation to respect foreign keys
DROP TABLE IF EXISTS public.project_finance;
DROP TABLE IF EXISTS public.customer_material_issue;
DROP TABLE IF EXISTS public.inventory_history;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.profiles;

-- Drop functions
DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.update_product_quantity();
DROP FUNCTION IF EXISTS public.log_material_issue_to_inventory();

-- Confirmation message
SELECT 'All tables and functions from the previous schema have been dropped.' AS status;

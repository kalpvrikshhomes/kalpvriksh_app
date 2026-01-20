-- =================================================================
--  SCHEMA MIGRATION: V4 to V5 - Foreign Key Updates for Projects
-- =================================================================
--  Author: Gemini
--  Version: 1.0
--  Notes: This script modifies tables introduced in supabase_schema_v4.sql
--         to update foreign key references from `customers.id` to `projects.id`.
--
--  PREREQUISITES:
--  - `supabase_schema_v4.sql` must have been run.
--  - `create_projects_table.sql` must have been run.
-- =================================================================

-- 1. Modify `public.payments` to reference `projects.id`
--    First, drop existing foreign key constraint if it exists
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_customer_id_fkey;

--    Rename the column (if you wish, or keep as customer_id and reference projects)
--    Keeping as customer_id for now, but referencing projects for project context
--    If the intention is to only link payments to projects, then rename to project_id.
--    Based on previous context, customer_id was 'For project context', so linking to project.
ALTER TABLE public.payments
RENAME COLUMN customer_id TO project_id;

--    Add new foreign key constraint referencing `public.projects`
ALTER TABLE public.payments
ADD CONSTRAINT payments_project_id_fkey
FOREIGN KEY (project_id) REFERENCES public.projects(id);

COMMENT ON COLUMN public.payments.project_id IS 'Optional: links the payment to a specific project.';


-- 2. Modify `public.project_vendor_purchases` to reference `projects.id`
--    First, drop existing foreign key constraint if it exists
ALTER TABLE public.project_vendor_purchases
DROP CONSTRAINT IF EXISTS project_vendor_purchases_customer_id_fkey;

--    Rename the column
ALTER TABLE public.project_vendor_purchases
RENAME COLUMN customer_id TO project_id;

--    Add new foreign key constraint referencing `public.projects`
ALTER TABLE public.project_vendor_purchases
ADD CONSTRAINT project_vendor_purchases_project_id_fkey
FOREIGN KEY (project_id) REFERENCES public.projects(id);

COMMENT ON COLUMN public.project_vendor_purchases.project_id IS 'The project for which this vendor purchase was made.';

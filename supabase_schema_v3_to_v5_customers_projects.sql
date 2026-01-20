-- =================================================================
--  SCHEMA MIGRATION: V3 to V5 - Separate Customers and Projects
-- =================================================================
--  Author: Gemini
--  Version: 1.0
--  Notes: This script modifies existing tables from supabase_schema_v3.sql
--         to support a separate `projects` table.
--         - Removes project-related columns from `customers`.
--         - Updates foreign key references to `projects.id` where applicable.
--
--  PREREQUISITES:
--  - `supabase_schema_v3.sql` must have been run.
--  - `create_projects_table.sql` must have been run.
-- =================================================================

-- 1. Remove project-related columns from `public.customers`
--    Ensure no dependent objects prevent dropping.
ALTER TABLE public.customers
DROP COLUMN IF EXISTS project_value,
DROP COLUMN IF EXISTS status;

-- 2. Modify `public.inventory_history` to reference `projects.id`
--    First, drop existing foreign key constraint if it exists
ALTER TABLE public.inventory_history
DROP CONSTRAINT IF EXISTS inventory_history_related_customer_id_fkey;

--    Rename the column
ALTER TABLE public.inventory_history
RENAME COLUMN related_customer_id TO related_project_id;

--    Add new foreign key constraint referencing `public.projects`
ALTER TABLE public.inventory_history
ADD CONSTRAINT inventory_history_related_project_id_fkey
FOREIGN KEY (related_project_id) REFERENCES public.projects(id);

-- 3. Modify `public.customer_material_issue` to reference `projects.id`
--    First, drop existing foreign key constraint if it exists
ALTER TABLE public.customer_material_issue
DROP CONSTRAINT IF EXISTS customer_material_issue_customer_id_fkey;

--    Rename the column
ALTER TABLE public.customer_material_issue
RENAME COLUMN customer_id TO project_id;

--    Add new foreign key constraint referencing `public.projects`
ALTER TABLE public.customer_material_issue
ADD CONSTRAINT customer_material_issue_project_id_fkey
FOREIGN KEY (project_id) REFERENCES public.projects(id);

-- 4. Modify `public.project_finance` to reference `projects.id`
--    First, drop existing primary key constraint which is also a FK
ALTER TABLE public.project_finance
DROP CONSTRAINT IF EXISTS project_finance_pkey;

ALTER TABLE public.project_finance
DROP CONSTRAINT IF EXISTS project_finance_customer_id_fkey;

--    Rename the column
ALTER TABLE public.project_finance
RENAME COLUMN customer_id TO project_id;

--    Add new primary key and foreign key constraint referencing `public.projects`
ALTER TABLE public.project_finance
ADD CONSTRAINT project_finance_pkey PRIMARY KEY (project_id);

ALTER TABLE public.project_finance
ADD CONSTRAINT project_finance_project_id_fkey
FOREIGN KEY (project_id) REFERENCES public.projects(id);

-- 5. Update comments for clarity
COMMENT ON TABLE public.customers IS 'Stores pure customer contact and address information.';
COMMENT ON COLUMN public.inventory_history.related_project_id IS 'The project to which this inventory change is related.';
COMMENT ON TABLE public.customer_material_issue IS 'Logs materials issued to a specific project.';
COMMENT ON COLUMN public.customer_material_issue.project_id IS 'The project to which materials were issued.';
COMMENT ON TABLE public.project_finance IS 'Locks financial data upon project closure for accounting, now linked to projects.';
COMMENT ON COLUMN public.project_finance.project_id IS 'The project this financial record is for.';

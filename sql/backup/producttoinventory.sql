-- SQL commands to rename the 'products' table to 'inventory' and update all related references.
-- This script is designed to be run directly in the Supabase SQL Editor.

-- 1. Rename the 'products' table to 'inventory'
ALTER TABLE public.products RENAME TO inventory;
COMMENT ON TABLE public.inventory IS 'Inventory of materials.';


-- 2. Update foreign key references and column names in 'inventory_history'
-- Drop existing foreign key constraint
ALTER TABLE public.inventory_history DROP CONSTRAINT IF EXISTS inventory_history_product_id_fkey;
-- Rename the column
ALTER TABLE public.inventory_history RENAME COLUMN product_id TO inventory_item_id;
-- Add new foreign key constraint
ALTER TABLE public.inventory_history ADD CONSTRAINT inventory_history_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory(id);
-- Update index
DROP INDEX IF EXISTS public.inventory_history_product_id_idx;
CREATE INDEX IF NOT EXISTS ix_inventory_history_inventory_item_id ON public.inventory_history (inventory_item_id);


-- 3. Update foreign key references and column names in 'customer_material_issue'
-- Drop existing foreign key constraint
ALTER TABLE public.customer_material_issue DROP CONSTRAINT IF EXISTS customer_material_issue_product_id_fkey;
-- Rename the column
ALTER TABLE public.customer_material_issue RENAME COLUMN product_id TO inventory_item_id;
-- Add new foreign key constraint
ALTER TABLE public.customer_material_issue ADD CONSTRAINT customer_material_issue_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory(id);
-- Update index
DROP INDEX IF EXISTS public.customer_material_issue_product_id_idx;
CREATE INDEX IF NOT EXISTS ix_customer_material_issue_inventory_item_id ON public.customer_material_issue (inventory_item_id);


-- 4. Rename and update the function that updates inventory quantity
-- Drop the old function (CASCADE will drop dependent objects like the trigger)
DROP FUNCTION IF EXISTS public.update_product_quantity() CASCADE;

-- Create the new function with the updated table and column names
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

-- 5. Recreate the trigger to use the new function name
-- Drop the old trigger if it exists (it might have been dropped by CASCADE from the function drop)
DROP TRIGGER IF EXISTS on_inventory_history_insert ON public.inventory_history;
-- Create the new trigger
CREATE TRIGGER on_inventory_history_insert
  AFTER INSERT ON public.inventory_history
  FOR EACH ROW EXECUTE PROCEDURE public.update_inventory_quantity();

-- Update the comment for the trigger
COMMENT ON TRIGGER on_inventory_history_insert ON public.inventory_history IS 'Automatically updates the total_quantity in the inventory table.';


-- 6. Update the function log_material_issue_to_inventory to use inventory_item_id
-- Drop the old function
DROP FUNCTION IF EXISTS public.log_material_issue_to_inventory() CASCADE;

-- Create the new function
CREATE OR REPLACE FUNCTION public.log_material_issue_to_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.inventory_history (inventory_item_id, quantity_change, reason, related_project_id, created_by)
  VALUES (NEW.inventory_item_id, -NEW.quantity, 'issued_to_project', NEW.project_id, NEW.issued_by);
  RETURN NEW;
END;
$$;


-- 7. Update RLS Policies for the renamed 'inventory' table
-- Drop old policies that were on the 'products' table (which is now 'inventory')
DROP POLICY IF EXISTS "All users can see products (except cost price)" ON public.inventory;
DROP POLICY IF EXISTS "Admins can do anything with products" ON public.inventory;

-- Create the new policies for the 'inventory' table
CREATE POLICY "All users can see inventory (except cost price)" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Admins can do anything with inventory" ON public.inventory FOR ALL USING (public.get_my_role() = 'admin');

-- 8. Update column comments on the inventory table
COMMENT ON COLUMN public.inventory.cost_price IS 'Cost price of the inventory item, visible only to admins.';
COMMENT ON COLUMN public.inventory.total_quantity IS 'Cached total quantity. Updated via triggers from inventory_history.';

-- This script ensures that all references are updated to the new 'inventory' table name and 'inventory_item_id' column.
-- Please execute this script in your Supabase SQL Editor.

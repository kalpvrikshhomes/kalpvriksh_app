-- SQL script to correct the inventory_history_reason_check constraint and log_material_issue_to_inventory function

-- 1. Drop the existing CHECK constraint on inventory_history.reason
ALTER TABLE public.inventory_history
DROP CONSTRAINT IF EXISTS inventory_history_reason_check;

-- 2. Re-add the CHECK constraint with the correct allowed values
ALTER TABLE public.inventory_history
ADD CONSTRAINT inventory_history_reason_check
CHECK (reason IN ('purchase', 'issued_to_project', 'correction', 'initial_stock'));

-- 3. Re-create the log_material_issue_to_inventory function to ensure consistency
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

-- Note: You might also need to re-create the trigger if it was also inconsistent,
-- but typically CREATE OR REPLACE FUNCTION is sufficient if the trigger already exists
-- and references the function.
-- If issues persist, consider dropping and re-creating the trigger:
-- DROP TRIGGER IF EXISTS on_customer_material_issue_insert ON public.customer_material_issue CASCADE;
-- CREATE TRIGGER on_customer_material_issue_insert
--   AFTER INSERT ON public.customer_material_issue
--   FOR EACH ROW EXECUTE PROCEDURE public.log_material_issue_to_inventory();


-- Update the log_material_issue_to_inventory function with a RAISE NOTICE
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

-- Drop the existing trigger if it exists, then re-create it without IF NOT EXISTS
DROP TRIGGER IF EXISTS on_customer_material_issue_insert ON public.customer_material_issue CASCADE;
CREATE TRIGGER on_customer_material_issue_insert
  AFTER INSERT ON public.customer_material_issue
  FOR EACH ROW EXECUTE PROCEDURE public.log_material_issue_to_inventory();

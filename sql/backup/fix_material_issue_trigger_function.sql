-- FIX: Update the log_material_issue_to_inventory function
-- REASON: The existing function in the database is using an incorrect 'reason' ('issued')
-- when inserting into the inventory_history table. This violates the check constraint.
-- This script updates the function to use the correct reason ('issued_to_project').

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

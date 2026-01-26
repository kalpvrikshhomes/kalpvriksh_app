-- FIX: Add RLS policies to allow material issuance to update inventory
-- REASON: The triggers for material issuance require INSERT on inventory_history
-- and UPDATE on inventory. The existing RLS policies do not allow employees
-- to perform these actions. These policies grant the necessary permissions.

CREATE POLICY IF NOT EXISTS "Allow employees to insert into inventory_history via trigger"
ON public.inventory_history
FOR INSERT
WITH CHECK (public.get_my_role() IN ('admin', 'employee'));

CREATE POLICY IF NOT EXISTS "Allow employees to update inventory via trigger"
ON public.inventory
FOR UPDATE
USING (public.get_my_role() IN ('admin', 'employee'))
WITH CHECK (public.get_my_role() IN ('admin', 'employee'));

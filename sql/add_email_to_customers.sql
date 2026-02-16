-- This migration adds the 'email' column to the 'customers' table.
-- The application's customer management page includes a field for email,
-- but the original database schema was missing this column, causing an error
-- when trying to insert a new customer.

ALTER TABLE public.customers
ADD COLUMN email text;

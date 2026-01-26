-- =================================================================
--  TRIGGER TO CREATE A PROFILE FOR A NEW USER
-- =================================================================
--  Author: Gemini
--  Version: 1.0
--  Notes: This script creates a trigger that fires after a new user
--         is created in auth.users and creates a corresponding
--         entry in public.profiles.
-- =================================================================

-- 1. Create the function to be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', 'employee');
  RETURN NEW;
END;
$$;

-- 2. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();



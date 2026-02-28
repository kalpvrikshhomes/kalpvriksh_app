-- Allow anonymous users to read visualization categories
DROP POLICY IF EXISTS "Allow authenticated users to read categories" ON public.visualization_categories;
CREATE POLICY "Allow anon and auth users to read categories"
ON public.visualization_categories
FOR SELECT
USING (true);

-- Allow anonymous users to read visualizations
DROP POLICY IF EXISTS "Allow authenticated users to read visualizations" ON public.visualizations;
CREATE POLICY "Allow anon and auth users to read visualizations"
ON public.visualizations
FOR SELECT
USING (true);

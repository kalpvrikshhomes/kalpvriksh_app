CREATE POLICY "Employees can create customers" ON public.customers FOR INSERT WITH CHECK (public.get_my_role() = 'employee');

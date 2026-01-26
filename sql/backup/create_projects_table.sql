CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  project_value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.projects IS 'Stores project information.';

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can see projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Employees can create projects" ON public.projects FOR INSERT WITH CHECK (public.get_my_role() = 'employee');
CREATE POLICY "Admins can do anything with projects" ON public.projects FOR ALL USING (public.get_my_role() = 'admin');

-- Create the table for visualization categories
CREATE TABLE
  public.visualization_categories (
    id UUID DEFAULT uuid_generate_v4 () NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT visualization_categories_pkey PRIMARY KEY (id),
    CONSTRAINT visualization_categories_name_key UNIQUE (name)
  );

-- Create the table for visualizations
CREATE TABLE
  public.visualizations (
    id UUID DEFAULT uuid_generate_v4 () NOT NULL,
    category_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT visualizations_pkey PRIMARY KEY (id),
    CONSTRAINT visualizations_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.visualization_categories (id) ON DELETE CASCADE
  );

-- RLS Policies for visualization_categories
ALTER TABLE public.visualization_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read categories" ON public.visualization_categories FOR
SELECT
  USING (auth.role () = 'authenticated');

CREATE POLICY "Allow authenticated users to insert categories" ON public.visualization_categories FOR INSERT
WITH
  CHECK (auth.role () = 'authenticated');

CREATE POLICY "Allow authenticated users to update categories" ON public.visualization_categories FOR
UPDATE USING (auth.role () = 'authenticated');

CREATE POLICY "Allow authenticated users to delete categories" ON public.visualization_categories FOR DELETE USING (auth.role () = 'authenticated');

-- RLS Policies for visualizations
ALTER TABLE public.visualizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read visualizations" ON public.visualizations FOR
SELECT
  USING (auth.role () = 'authenticated');

CREATE POLICY "Allow authenticated users to insert visualizations" ON public.visualizations FOR INSERT
WITH
  CHECK (auth.role () = 'authenticated');

CREATE POLICY "Allow authenticated users to update visualizations" ON public.visualizations FOR
UPDATE USING (auth.role () = 'authenticated');

CREATE POLICY "Allow authenticated users to delete visualizations" ON public.visualizations FOR DELETE USING (auth.role () = 'authenticated');

-- Add comment on table
COMMENT ON TABLE public.visualization_categories IS 'Stores categories for 3D visualizations';
COMMENT ON TABLE public.visualizations IS 'Stores 3D visualizations with their images and details';

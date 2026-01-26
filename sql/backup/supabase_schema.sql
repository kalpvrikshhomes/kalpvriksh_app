
-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category TEXT,
  image_url TEXT,
  variants JSONB, -- Stores an array of variant objects, e.g., [{"size": "S", "color": "Red", "stock": 10, "additional_price": 0}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the products table (optional, but good practice for Supabase)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous and authenticated access (example policies, adjust as needed)
CREATE POLICY "Public products are viewable by everyone." ON products
  FOR SELECT USING (TRUE);

-- Optional: Policy for authenticated users to insert (adjust roles as needed)
-- CREATE POLICY "Authenticated users can insert products." ON products
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Optional: Policy for authenticated users to update (adjust roles as needed)
-- CREATE POLICY "Authenticated users can update their own products." ON products
--   FOR UPDATE USING (auth.uid() = user_id); -- Assuming a user_id column in products table

-- Optional: Policy for authenticated users to delete (adjust roles as needed)
-- CREATE POLICY "Authenticated users can delete their own products." ON products
--   FOR DELETE USING (auth.uid() = user_id); -- Assuming a user_id column in products table


-- Add 2 mock data entries to the products table
INSERT INTO products (name, description, price, category, image_url, variants)
VALUES
  ('Elegant Lamp Shade', 'A beautifully crafted lamp shade to enhance your living space. Made with high-quality linen.', 45.99, 'Lighting', '/placeholder.jpg', '[{"color": "Cream", "material": "Linen", "stock": 20, "additional_price": 0}, {"color": "White", "material": "Cotton", "stock": 15, "additional_price": 5}]'),
  ('Modern Coffee Table', 'Sleek and minimalist coffee table perfect for contemporary interiors. Features a tempered glass top.', 199.50, 'Furniture', '/placeholder.jpg', '[{"material": "Glass & Metal", "color": "Black", "stock": 10, "additional_price": 0}, {"material": "Glass & Wood", "color": "Brown", "stock": 8, "additional_price": 20}]');


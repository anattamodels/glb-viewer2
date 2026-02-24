DROP POLICY IF EXISTS "Users can manage own galleries" ON galleries;
DROP POLICY IF EXISTS "Users can manage own items" ON items;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS galleries;

CREATE TABLE galleries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  glb_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "galleries_all" ON galleries FOR ALL USING (true);
CREATE POLICY "items_all" ON items FOR ALL USING (true);

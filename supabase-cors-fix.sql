-- Allow CORS for Supabase Storage
-- Run this in Supabase SQL Editor

-- First, delete existing CORS policies if any
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create new policy with proper CORS
CREATE POLICY "Allow all" ON storage.objects
FOR ALL
USING ( bucket_id = 'glb-files' )
WITH CHECK ( bucket_id = 'glb-files' );

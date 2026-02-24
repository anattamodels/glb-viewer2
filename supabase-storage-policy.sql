CREATE POLICY "Public Access" ON storage.objects
FOR ALL
USING ( bucket_id = 'glb-files' )
WITH CHECK ( bucket_id = 'glb-files' );

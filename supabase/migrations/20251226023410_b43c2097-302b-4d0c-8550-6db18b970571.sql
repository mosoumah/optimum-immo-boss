-- Create the logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);

-- Allow authenticated users to upload logos
CREATE POLICY "Users can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Allow authenticated users to update their logos
CREATE POLICY "Users can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'logos');

-- Allow public to view logos
CREATE POLICY "Anyone can view logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

-- Allow authenticated users to delete their logos
CREATE POLICY "Users can delete logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'logos');
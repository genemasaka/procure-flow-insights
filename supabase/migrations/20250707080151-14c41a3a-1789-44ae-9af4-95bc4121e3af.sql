
-- Create storage bucket for contract documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract-documents',
  'contract-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
);

-- Create RLS policies for the storage bucket
CREATE POLICY "Allow authenticated users to upload contract documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contract-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view contract documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'contract-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete contract documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'contract-documents' AND auth.role() = 'authenticated');

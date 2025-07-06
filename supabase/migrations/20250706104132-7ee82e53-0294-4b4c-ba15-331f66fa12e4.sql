
-- Add contract_content column to store the actual contract text
ALTER TABLE public.contracts 
ADD COLUMN contract_content TEXT;

-- Add an index for better search performance on contract content
CREATE INDEX idx_contracts_content_search ON public.contracts USING gin(to_tsvector('english', contract_content));

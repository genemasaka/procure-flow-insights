
-- Create contracts table to store contract information
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  counterparty TEXT NOT NULL,
  contract_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  effective_date DATE,
  expiration_date DATE,
  renewal_notice_days INTEGER DEFAULT 30,
  contract_value DECIMAL(15,2),
  currency TEXT DEFAULT 'USD',
  hs_codes TEXT[],
  file_path TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deadlines table for tracking contract obligations
CREATE TABLE public.deadlines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'renewal', 'payment', 'notice', 'milestone'
  due_date DATE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'overdue'
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI insights table for storing AI-generated contract insights
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'risk', 'opportunity', 'anomaly', 'trend'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT NOT NULL, -- 'high', 'medium', 'low'
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  actionable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document uploads table for tracking file processing
CREATE TABLE public.document_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  extracted_text TEXT,
  ai_analysis JSONB,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (we'll implement auth later)
CREATE POLICY "Allow all operations on contracts" ON public.contracts FOR ALL USING (true);
CREATE POLICY "Allow all operations on deadlines" ON public.deadlines FOR ALL USING (true);
CREATE POLICY "Allow all operations on ai_insights" ON public.ai_insights FOR ALL USING (true);
CREATE POLICY "Allow all operations on document_uploads" ON public.document_uploads FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_expiration_date ON public.contracts(expiration_date);
CREATE INDEX idx_deadlines_due_date ON public.deadlines(due_date);
CREATE INDEX idx_deadlines_status ON public.deadlines(status);
CREATE INDEX idx_deadlines_contract_id ON public.deadlines(contract_id);
CREATE INDEX idx_ai_insights_contract_id ON public.ai_insights(contract_id);
CREATE INDEX idx_document_uploads_status ON public.document_uploads(processing_status);

-- Insert sample data
INSERT INTO public.contracts (title, counterparty, contract_type, status, effective_date, expiration_date, renewal_notice_days, contract_value, currency) VALUES
('Global Maritime Services Agreement', 'Global Maritime Ltd', 'Service Agreement', 'active', '2024-01-15', '2024-12-15', 30, 850000.00, 'USD'),
('Equipment Lease Contract', 'TechEquip Solutions', 'Lease Agreement', 'active', '2023-08-15', '2024-08-15', 60, 120000.00, 'USD'),
('Manufacturing Supply Contract', 'ACME Manufacturing', 'Supply Agreement', 'active', '2024-01-01', '2024-12-31', 30, 300000.00, 'USD'),
('Cloud Services Agreement', 'CloudTech Inc', 'Service Agreement', 'active', '2023-09-01', '2024-09-01', 45, 45000.00, 'USD');

-- Insert corresponding deadlines
INSERT INTO public.deadlines (contract_id, title, description, type, due_date, priority) VALUES
((SELECT id FROM public.contracts WHERE title = 'Global Maritime Services Agreement'), 'Contract Renewal Notice', 'Send 30-day renewal notice required', 'notice', '2024-11-15', 'high'),
((SELECT id FROM public.contracts WHERE title = 'Equipment Lease Contract'), 'Equipment Lease Renewal', 'Lease agreement expires, renewal decision needed', 'renewal', '2024-08-15', 'medium'),
((SELECT id FROM public.contracts WHERE title = 'Manufacturing Supply Contract'), 'Quarterly Payment Due', 'Q4 payment milestone - $300,000', 'payment', '2024-10-31', 'high'),
((SELECT id FROM public.contracts WHERE title = 'Cloud Services Agreement'), 'Compliance Review', 'Annual compliance audit required', 'milestone', '2024-09-01', 'low');

-- Insert sample AI insights
INSERT INTO public.ai_insights (contract_id, insight_type, title, description, impact, confidence, actionable) VALUES
((SELECT id FROM public.contracts WHERE title = 'Global Maritime Services Agreement'), 'risk', 'High Renewal Concentration', '68% of contracts by value expire in Q4 2024, creating significant renewal risk and potential service disruption.', 'high', 92, true),
((SELECT id FROM public.contracts WHERE title = 'Equipment Lease Contract'), 'anomaly', 'Unusual Payment Terms Detected', 'TechEquip Solutions contract has 45-day payment terms vs. industry standard 30 days.', 'medium', 87, true),
((SELECT id FROM public.contracts WHERE title = 'Global Maritime Services Agreement'), 'opportunity', 'Bulk Renewal Savings', 'Consolidating 3 shipping contracts with Global Maritime could yield 15-20% cost savings.', 'high', 78, true),
((SELECT id FROM public.contracts WHERE title = 'Manufacturing Supply Contract'), 'trend', 'Contract Value Inflation', 'Average contract values increased 12% YoY, outpacing industry inflation by 3%.', 'medium', 95, false);

-- Adicionar colunas faltantes na tabela leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS segmento TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS prazo_recebimento TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS share_debito_pix INTEGER DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS share_credito_vista INTEGER DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS share_parcelado_2a6 INTEGER DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS share_parcelado_7a12 INTEGER DEFAULT 0;

-- Criar tabela para armazenar precificação de leads
CREATE TABLE IF NOT EXISTS public.lead_precificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  taxa_antecipacao NUMERIC,
  taxa_pix NUMERIC,
  -- Taxas Visa
  visa_debito NUMERIC,
  visa_credito_vista NUMERIC,
  visa_parcelado_2a6 NUMERIC,
  visa_parcelado_7a12 NUMERIC,
  visa_parcelado_13a18 NUMERIC,
  -- Taxas Master
  master_debito NUMERIC,
  master_credito_vista NUMERIC,
  master_parcelado_2a6 NUMERIC,
  master_parcelado_7a12 NUMERIC,
  master_parcelado_13a18 NUMERIC,
  -- Taxas Elo
  elo_debito NUMERIC,
  elo_credito_vista NUMERIC,
  elo_parcelado_2a6 NUMERIC,
  elo_parcelado_7a12 NUMERIC,
  elo_parcelado_13a18 NUMERIC,
  -- Taxas Outras bandeiras
  outras_debito NUMERIC,
  outras_credito_vista NUMERIC,
  outras_parcelado_2a6 NUMERIC,
  outras_parcelado_7a12 NUMERIC,
  outras_parcelado_13a18 NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on lead_precificacao
ALTER TABLE public.lead_precificacao ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lead_precificacao
CREATE POLICY "Users can view their own precificacao" 
ON public.lead_precificacao 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own precificacao" 
ON public.lead_precificacao 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own precificacao" 
ON public.lead_precificacao 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own precificacao" 
ON public.lead_precificacao 
FOR DELETE 
USING (auth.uid() = user_id);
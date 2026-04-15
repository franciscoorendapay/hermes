-- Add complemento field to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS endereco_complemento TEXT;

-- Create lead_credenciamento table for accreditation data
CREATE TABLE public.lead_credenciamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Dados do Responsável
  responsavel_nome TEXT,
  responsavel_cpf TEXT,
  responsavel_data_nascimento DATE,
  data_abertura_empresa DATE,
  
  -- Dados Bancários
  banco_nome TEXT,
  banco_codigo TEXT,
  conta_tipo TEXT,
  conta_operacao TEXT,
  agencia TEXT,
  agencia_digito TEXT,
  conta_numero TEXT,
  conta_digito TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(lead_id)
);

-- Enable RLS
ALTER TABLE public.lead_credenciamento ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own credenciamento"
  ON public.lead_credenciamento FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own credenciamento"
  ON public.lead_credenciamento FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credenciamento"
  ON public.lead_credenciamento FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credenciamento"
  ON public.lead_credenciamento FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_lead_credenciamento_updated_at
  BEFORE UPDATE ON public.lead_credenciamento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
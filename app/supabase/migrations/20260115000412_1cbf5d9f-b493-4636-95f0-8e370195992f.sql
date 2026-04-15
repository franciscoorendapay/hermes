-- Tabela de leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cod_lead SERIAL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome_fantasia TEXT NOT NULL,
  nome1 TEXT,
  razao_social TEXT,
  doc TEXT,
  email TEXT,
  telefone TEXT,
  tpv NUMERIC DEFAULT 0,
  funil_app INTEGER DEFAULT 1,
  credenciado INTEGER DEFAULT 0,
  mcc TEXT,
  endereco_cep TEXT,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_estado TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  observacao TEXT,
  data_registro TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de visitas
CREATE TABLE public.visitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL,
  observacao TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  data_visita TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users can view their own leads"
ON public.leads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads"
ON public.leads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
ON public.leads FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
ON public.leads FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for visitas
CREATE POLICY "Users can view their own visitas"
ON public.visitas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own visitas"
ON public.visitas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visitas"
ON public.visitas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visitas"
ON public.visitas FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create ordens_servico table for service orders
CREATE TABLE public.ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'bobinas',
  quantidade integer NOT NULL CHECK (quantidade >= 1 AND quantidade <= 10),
  status text NOT NULL DEFAULT 'pendente',
  observacao text,
  atendido_por uuid,
  data_atendimento timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_ordens_servico_updated_at
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

-- Comerciais can view their own orders
CREATE POLICY "Comerciais podem ver suas ordens"
  ON public.ordens_servico FOR SELECT
  USING (auth.uid() = user_id);

-- Comerciais can create their own orders
CREATE POLICY "Comerciais podem criar ordens"
  ON public.ordens_servico FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Logistica can view all orders
CREATE POLICY "Logistica pode ver todas ordens"
  ON public.ordens_servico FOR SELECT
  USING (has_role(auth.uid(), 'logistica'));

-- Logistica can update all orders
CREATE POLICY "Logistica pode atualizar ordens"
  ON public.ordens_servico FOR UPDATE
  USING (has_role(auth.uid(), 'logistica'));

-- Managers can view subordinate orders
CREATE POLICY "Gestores podem ver ordens subordinados"
  ON public.ordens_servico FOR SELECT
  USING (
    is_manager(auth.uid()) 
    AND (
      can_view_user(auth.uid(), user_id) 
      OR has_role(auth.uid(), 'diretor') 
      OR has_role(auth.uid(), 'nacional')
    )
  );
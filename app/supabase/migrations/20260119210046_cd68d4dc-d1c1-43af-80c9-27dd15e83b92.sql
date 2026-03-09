-- Tabela para armazenar configuração de SLA por tipo de ordem
CREATE TABLE public.sla_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL UNIQUE,
  prazo_dias INTEGER NOT NULL DEFAULT 1,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO public.sla_config (tipo, prazo_dias, descricao) VALUES
  ('bobinas', 1, 'Envio de Bobinas'),
  ('troca_equipamento', 2, 'Troca de Equipamento'),
  ('retirada_equipamento', 3, 'Retirada de Equipamento'),
  ('entrega_equipamento', 2, 'Entrega de Equipamento');

-- Habilitar RLS
ALTER TABLE public.sla_config ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver (para calcular prazo ao criar ordem)
CREATE POLICY "Usuarios autenticados podem ver SLA"
  ON public.sla_config FOR SELECT
  TO authenticated
  USING (true);

-- Apenas diretores podem gerenciar SLA
CREATE POLICY "Apenas diretores podem gerenciar SLA"
  ON public.sla_config FOR ALL
  USING (has_role(auth.uid(), 'diretor'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_sla_config_updated_at
  BEFORE UPDATE ON public.sla_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
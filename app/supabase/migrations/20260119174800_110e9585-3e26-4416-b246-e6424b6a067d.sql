-- Adicionar campos para rastrear prazo e pontualidade de entrega
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS prazo_entrega timestamp with time zone,
ADD COLUMN IF NOT EXISTS entregue_no_prazo boolean;
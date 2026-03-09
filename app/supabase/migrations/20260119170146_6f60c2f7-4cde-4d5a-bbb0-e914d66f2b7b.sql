-- Add column to track if reminder was added to route
ALTER TABLE public.lembretes 
ADD COLUMN adicionado_rota BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.lembretes.adicionado_rota IS 
  'Indica se o lembrete foi adicionado à rota de visitas';
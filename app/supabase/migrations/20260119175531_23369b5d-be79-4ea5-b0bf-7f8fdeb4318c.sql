-- Permitir logística ver leads credenciados (para joins nas ordens)
CREATE POLICY "Logistica pode ver leads credenciados"
ON public.leads FOR SELECT
USING (
  has_role(auth.uid(), 'logistica'::user_role) 
  AND funil_app = 5 
  AND credenciado = 1
);
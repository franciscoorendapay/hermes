-- Adicionar política para gestores verem leads de subordinados
CREATE POLICY "Managers can view subordinate leads" ON public.leads
FOR SELECT USING (
  is_manager(auth.uid()) AND (
    can_view_user(auth.uid(), user_id) 
    OR has_role(auth.uid(), 'diretor'::user_role) 
    OR has_role(auth.uid(), 'nacional'::user_role)
  )
);

-- Adicionar política para gestores verem visitas de subordinados
CREATE POLICY "Managers can view subordinate visitas" ON public.visitas
FOR SELECT USING (
  is_manager(auth.uid()) AND (
    can_view_user(auth.uid(), user_id)
    OR has_role(auth.uid(), 'diretor'::user_role)
    OR has_role(auth.uid(), 'nacional'::user_role)
  )
);
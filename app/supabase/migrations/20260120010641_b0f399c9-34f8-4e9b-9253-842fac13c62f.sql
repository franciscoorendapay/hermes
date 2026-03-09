-- Add RLS policy for managers to view subordinate lembretes
CREATE POLICY "Managers can view subordinate lembretes" ON lembretes
  FOR SELECT USING (
    is_manager(auth.uid()) AND (
      can_view_user(auth.uid(), user_id)
      OR has_role(auth.uid(), 'diretor'::user_role)
      OR has_role(auth.uid(), 'nacional'::user_role)
    )
  );
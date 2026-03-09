-- 1. Create function to validate access to lead
CREATE OR REPLACE FUNCTION public.can_access_lead(_user_id uuid, _lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = _user_id
  );
$$;

-- 2. Drop existing lead_credenciamento policies
DROP POLICY IF EXISTS "Users can view their own credenciamento" ON public.lead_credenciamento;
DROP POLICY IF EXISTS "Users can create their own credenciamento" ON public.lead_credenciamento;
DROP POLICY IF EXISTS "Users can update their own credenciamento" ON public.lead_credenciamento;
DROP POLICY IF EXISTS "Users can delete their own credenciamento" ON public.lead_credenciamento;

-- 3. Create new secure policies for lead_credenciamento
CREATE POLICY "Users can view their own credenciamento" ON public.lead_credenciamento
  FOR SELECT USING (
    auth.uid() = user_id AND can_access_lead(auth.uid(), lead_id)
  );

CREATE POLICY "Users can create their own credenciamento" ON public.lead_credenciamento
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND can_access_lead(auth.uid(), lead_id)
  );

CREATE POLICY "Users can update their own credenciamento" ON public.lead_credenciamento
  FOR UPDATE USING (
    auth.uid() = user_id AND can_access_lead(auth.uid(), lead_id)
  );

CREATE POLICY "Users can delete their own credenciamento" ON public.lead_credenciamento
  FOR DELETE USING (
    auth.uid() = user_id AND can_access_lead(auth.uid(), lead_id)
  );

-- 4. Also secure lead_precificacao with the same pattern
DROP POLICY IF EXISTS "Users can view their own precificacao" ON public.lead_precificacao;
DROP POLICY IF EXISTS "Users can create their own precificacao" ON public.lead_precificacao;
DROP POLICY IF EXISTS "Users can update their own precificacao" ON public.lead_precificacao;
DROP POLICY IF EXISTS "Users can delete their own precificacao" ON public.lead_precificacao;

CREATE POLICY "Users can view their own precificacao" ON public.lead_precificacao
  FOR SELECT USING (
    auth.uid() = user_id AND can_access_lead(auth.uid(), lead_id)
  );

CREATE POLICY "Users can create their own precificacao" ON public.lead_precificacao
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND can_access_lead(auth.uid(), lead_id)
  );

CREATE POLICY "Users can update their own precificacao" ON public.lead_precificacao
  FOR UPDATE USING (
    auth.uid() = user_id AND can_access_lead(auth.uid(), lead_id)
  );

CREATE POLICY "Users can delete their own precificacao" ON public.lead_precificacao
  FOR DELETE USING (
    auth.uid() = user_id AND can_access_lead(auth.uid(), lead_id)
  );
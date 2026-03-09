
-- Enum para cargos
CREATE TYPE public.user_role AS ENUM (
  'comercial',
  'regional', 
  'nacional',
  'diretor'
);

-- Tabela de profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  regiao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tabela de roles (separada de profiles por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'comercial',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Tabela de hierarquia (quem gerencia quem)
CREATE TABLE public.user_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subordinate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(manager_id, subordinate_id)
);

ALTER TABLE public.user_hierarchy ENABLE ROW LEVEL SECURITY;

-- Tabela de metas mensais
CREATE TABLE public.metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  meta_clientes INTEGER DEFAULT 0,
  meta_valor NUMERIC DEFAULT 0,
  meta_visitas INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mes, ano)
);

ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- Função para buscar role do usuário (security definer)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

-- Função para verificar se tem role específica
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Função para verificar se é gestor de alguém
CREATE OR REPLACE FUNCTION public.is_manager_of(_manager_id UUID, _user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_hierarchy
    WHERE manager_id = _manager_id AND subordinate_id = _user_id
  );
$$;

-- Função recursiva para buscar todos os subordinados
CREATE OR REPLACE FUNCTION public.get_subordinates(_manager_id UUID)
RETURNS TABLE(user_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE subordinates AS (
    SELECT subordinate_id FROM public.user_hierarchy WHERE manager_id = _manager_id
    UNION
    SELECT h.subordinate_id FROM public.user_hierarchy h
    INNER JOIN subordinates s ON h.manager_id = s.subordinate_id
  )
  SELECT subordinate_id FROM subordinates;
$$;

-- Função para verificar se é gestor (regional, nacional ou diretor)
CREATE OR REPLACE FUNCTION public.is_manager(_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('regional', 'nacional', 'diretor')
  );
$$;

-- Função para verificar se pode ver dados de outro usuário
CREATE OR REPLACE FUNCTION public.can_view_user(_viewer_id UUID, _target_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    _viewer_id = _target_id -- Pode ver a si mesmo
    OR public.has_role(_viewer_id, 'diretor') -- Diretor vê tudo
    OR public.has_role(_viewer_id, 'nacional') -- Nacional vê tudo
    OR EXISTS ( -- É gestor direto ou indireto
      SELECT 1 FROM public.get_subordinates(_viewer_id) WHERE user_id = _target_id
    );
$$;

-- RLS Policies para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Managers can view subordinate profiles" ON public.profiles
  FOR SELECT USING (public.can_view_user(auth.uid(), id));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies para user_roles (apenas gestores podem ver)
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Managers can view subordinate roles" ON public.user_roles
  FOR SELECT USING (public.can_view_user(auth.uid(), user_id));

CREATE POLICY "Directors can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'diretor'));

CREATE POLICY "Nationals can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'nacional'));

-- RLS Policies para user_hierarchy
CREATE POLICY "Directors can manage hierarchy" ON public.user_hierarchy
  FOR ALL USING (public.has_role(auth.uid(), 'diretor'));

CREATE POLICY "Nationals can manage hierarchy" ON public.user_hierarchy
  FOR ALL USING (public.has_role(auth.uid(), 'nacional'));

CREATE POLICY "Managers can view their subordinates" ON public.user_hierarchy
  FOR SELECT USING (auth.uid() = manager_id);

-- RLS Policies para metas
CREATE POLICY "Users can view own metas" ON public.metas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Managers can view subordinate metas" ON public.metas
  FOR SELECT USING (public.can_view_user(auth.uid(), user_id));

CREATE POLICY "Managers can create metas for subordinates" ON public.metas
  FOR INSERT WITH CHECK (
    public.is_manager(auth.uid()) AND 
    (public.can_view_user(auth.uid(), user_id) OR public.has_role(auth.uid(), 'diretor') OR public.has_role(auth.uid(), 'nacional'))
  );

CREATE POLICY "Managers can update subordinate metas" ON public.metas
  FOR UPDATE USING (
    public.is_manager(auth.uid()) AND 
    (public.can_view_user(auth.uid(), user_id) OR public.has_role(auth.uid(), 'diretor') OR public.has_role(auth.uid(), 'nacional'))
  );

-- Trigger para updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at em metas
CREATE TRIGGER update_metas_updated_at
  BEFORE UPDATE ON public.metas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar profile automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)), new.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'comercial');
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

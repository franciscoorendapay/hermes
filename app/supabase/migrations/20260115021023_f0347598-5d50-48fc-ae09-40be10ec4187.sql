-- Criar bucket para documentos de credenciamento
INSERT INTO storage.buckets (id, name, public)
VALUES ('credenciamento-docs', 'credenciamento-docs', false);

-- RLS: Usuários podem fazer upload de seus próprios documentos
CREATE POLICY "Users can upload their own docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'credenciamento-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Usuários podem visualizar seus próprios documentos
CREATE POLICY "Users can view their own docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'credenciamento-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Usuários podem deletar seus próprios documentos
CREATE POLICY "Users can delete their own docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'credenciamento-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: Usuários podem atualizar seus próprios documentos
CREATE POLICY "Users can update their own docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'credenciamento-docs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Adicionar campos para URLs dos documentos
ALTER TABLE public.lead_credenciamento
ADD COLUMN doc_cnpj_url TEXT,
ADD COLUMN doc_foto_url TEXT,
ADD COLUMN doc_residencia_url TEXT,
ADD COLUMN doc_atividade_url TEXT,
ADD COLUMN documentos_pendentes BOOLEAN DEFAULT true;
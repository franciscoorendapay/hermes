-- Tornar lead_id opcional na tabela lembretes
ALTER TABLE lembretes ALTER COLUMN lead_id DROP NOT NULL;

-- Adicionar colunas para dados do estabelecimento (agendamentos sem lead)
ALTER TABLE lembretes ADD COLUMN estabelecimento_nome TEXT;
ALTER TABLE lembretes ADD COLUMN estabelecimento_endereco TEXT;
ALTER TABLE lembretes ADD COLUMN estabelecimento_lat DOUBLE PRECISION;
ALTER TABLE lembretes ADD COLUMN estabelecimento_lng DOUBLE PRECISION;
ALTER TABLE lembretes ADD COLUMN estabelecimento_cep TEXT;
ALTER TABLE lembretes ADD COLUMN estabelecimento_numero TEXT;
ALTER TABLE lembretes ADD COLUMN estabelecimento_bairro TEXT;
ALTER TABLE lembretes ADD COLUMN estabelecimento_cidade TEXT;
ALTER TABLE lembretes ADD COLUMN estabelecimento_estado TEXT;
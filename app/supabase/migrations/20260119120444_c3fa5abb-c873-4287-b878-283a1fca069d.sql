-- Add quantity of equipment field to leads table
ALTER TABLE public.leads ADD COLUMN qtd_equipamentos integer DEFAULT NULL;
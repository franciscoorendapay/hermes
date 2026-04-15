-- Add column to differentiate between explicit reminders and scheduled visits
ALTER TABLE public.lembretes 
ADD COLUMN tipo TEXT DEFAULT 'lembrete' CHECK (tipo IN ('lembrete', 'agendamento'));

-- Update existing records: those with establishment data are scheduled visits (agendamentos)
UPDATE public.lembretes 
SET tipo = 'agendamento' 
WHERE estabelecimento_nome IS NOT NULL AND lead_id IS NULL;

COMMENT ON COLUMN public.lembretes.tipo IS 
  'Tipo do registro: lembrete (explícito via ReminderForm) ou agendamento (visita planejada via roteirização)';
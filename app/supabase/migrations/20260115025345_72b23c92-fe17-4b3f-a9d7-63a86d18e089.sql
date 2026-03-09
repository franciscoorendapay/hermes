-- Create lembretes table for lead reminders
CREATE TABLE public.lembretes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  data_lembrete DATE NOT NULL,
  hora_lembrete TIME NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lembretes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own lembretes"
ON public.lembretes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lembretes"
ON public.lembretes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lembretes"
ON public.lembretes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lembretes"
ON public.lembretes
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lembretes_updated_at
BEFORE UPDATE ON public.lembretes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
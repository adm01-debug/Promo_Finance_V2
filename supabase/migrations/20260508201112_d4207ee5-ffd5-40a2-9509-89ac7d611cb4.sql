-- Add valor_bloqueado to bloqueios_duplicidade
ALTER TABLE public.bloqueios_duplicidade 
ADD COLUMN IF NOT EXISTS valor_bloqueado NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'exact';

-- Add fuzzy_matching to configuracoes_duplicidade
ALTER TABLE public.configuracoes_duplicidade 
ADD COLUMN IF NOT EXISTS fuzzy_matching BOOLEAN DEFAULT false;

-- Update existing records if any (optional but good practice)
UPDATE public.bloqueios_duplicidade 
SET valor_bloqueado = (dados_tentativa->>'valor')::numeric 
WHERE valor_bloqueado = 0 AND dados_tentativa->>'valor' IS NOT NULL;

-- Update rules to match frontend expected fields
ALTER TABLE public.regras_conciliacao ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update attachments to match frontend expected fields
ALTER TABLE public.anexos_financeiros ADD COLUMN IF NOT EXISTS url_publica TEXT;

-- Update automation logs to match frontend expected fields
ALTER TABLE public.logs_baixa_automatica ADD COLUMN IF NOT EXISTS mensagem TEXT;

-- Ensure RLS allows these new fields
-- (Already handled by previous migrations using owner-scoped policies)

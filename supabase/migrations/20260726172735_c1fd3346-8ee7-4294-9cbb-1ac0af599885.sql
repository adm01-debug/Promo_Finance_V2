CREATE TABLE public.integration_secrets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave text NOT NULL UNIQUE,
  valor text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.integration_secrets TO service_role;

ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy para anon/authenticated: acesso exclusivo do backend (service_role).

CREATE TRIGGER trg_integration_secrets_updated_at
BEFORE UPDATE ON public.integration_secrets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.integration_secrets (chave, descricao)
VALUES ('conformidade_cron', 'Segredo de autenticação do cron mensal gerar-snapshots-conformidade')
ON CONFLICT (chave) DO NOTHING;
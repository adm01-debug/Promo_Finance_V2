-- ============ Tokens de integração (somente serviços internos) ============
CREATE TABLE IF NOT EXISTS public.bling_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bling_tokens TO service_role;
ALTER TABLE public.bling_tokens ENABLE ROW LEVEL SECURITY;
-- Sem policies: inacessível via API; apenas service_role (bypass RLS) opera.

CREATE TABLE IF NOT EXISTS public.bitrix_oauth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.bitrix_oauth_tokens TO service_role;
ALTER TABLE public.bitrix_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_bling_tokens_created ON public.bling_tokens (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bitrix_tokens_created ON public.bitrix_oauth_tokens (created_at DESC);

-- ============ Logs de sincronização Bling ============
CREATE TABLE IF NOT EXISTS public.bling_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('manual','automatica','webhook','retry')),
  modulo TEXT NOT NULL CHECK (char_length(modulo) BETWEEN 2 AND 80),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','executando','sucesso','erro','parcial')),
  registros_processados INTEGER NOT NULL DEFAULT 0 CHECK (registros_processados >= 0),
  registros_com_erro INTEGER NOT NULL DEFAULT 0 CHECK (registros_com_erro >= 0),
  detalhes JSONB,
  mensagem_erro TEXT,
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bling_sync_periodo_valido CHECK (finalizado_em IS NULL OR finalizado_em >= iniciado_em)
);
CREATE INDEX IF NOT EXISTS idx_bling_sync_logs_modulo ON public.bling_sync_logs (modulo);
CREATE INDEX IF NOT EXISTS idx_bling_sync_logs_created ON public.bling_sync_logs (created_at DESC);
GRANT SELECT, INSERT ON public.bling_sync_logs TO authenticated;
GRANT ALL ON public.bling_sync_logs TO service_role;
ALTER TABLE public.bling_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bling_sync_logs_select" ON public.bling_sync_logs
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'financeiro')
    OR public.has_role(auth.uid(), 'operacional')
  );
CREATE POLICY "bling_sync_logs_insert" ON public.bling_sync_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro')
  );

-- ============ Eventos de webhook Bling ============
CREATE TABLE IF NOT EXISTS public.bling_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  module TEXT NOT NULL,
  resource_id TEXT,
  payload JSONB,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retries INTEGER NOT NULL DEFAULT 0 CHECK (retries >= 0 AND retries <= 50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bling_webhook_processed_coerente CHECK (processed = false OR processed_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_bling_webhook_events_processed ON public.bling_webhook_events (processed);
CREATE INDEX IF NOT EXISTS idx_bling_webhook_events_resource ON public.bling_webhook_events (module, resource_id);
CREATE INDEX IF NOT EXISTS idx_bling_webhook_events_created ON public.bling_webhook_events (created_at DESC);
GRANT SELECT ON public.bling_webhook_events TO authenticated;
GRANT ALL ON public.bling_webhook_events TO service_role;
ALTER TABLE public.bling_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bling_webhook_events_admin_select" ON public.bling_webhook_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ Chaves de API por empresa ============
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  key_prefix TEXT NOT NULL CHECK (key_prefix ~ '^[A-Za-z0-9_-]{4,16}$'),
  key_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT api_keys_hash_unico UNIQUE (key_hash),
  CONSTRAINT api_keys_nome_unico_por_empresa UNIQUE (empresa_id, name)
);
CREATE INDEX IF NOT EXISTS idx_api_keys_empresa ON public.api_keys (empresa_id, created_at DESC);
GRANT SELECT, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select" ON public.api_keys
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND public.empresa_acessivel(empresa_id));
CREATE POLICY "api_keys_delete" ON public.api_keys
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND public.empresa_acessivel(empresa_id));

CREATE TRIGGER trg_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_bling_tokens_updated_at
  BEFORE UPDATE ON public.bling_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_bitrix_tokens_updated_at
  BEFORE UPDATE ON public.bitrix_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
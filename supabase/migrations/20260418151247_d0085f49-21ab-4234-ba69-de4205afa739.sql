-- Tabela de ações recomendadas (Centro de Ações Inteligentes)
CREATE TABLE IF NOT EXISTS public.acoes_recomendadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  urgencia TEXT NOT NULL DEFAULT 'media' CHECK (urgencia IN ('baixa','media','alta','critica')),
  impacto_estimado NUMERIC,
  impacto_tipo TEXT CHECK (impacto_tipo IN ('reais','percentual','score')),
  link_resolucao TEXT,
  fonte TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  gerado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acoes_recomendadas_empresa ON public.acoes_recomendadas(empresa_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_acoes_recomendadas_expires ON public.acoes_recomendadas(expires_at);

ALTER TABLE public.acoes_recomendadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read acoes_recomendadas"
ON public.acoes_recomendadas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin manage acoes_recomendadas"
ON public.acoes_recomendadas FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger: notificação push automática ao criar alerta crítico
CREATE OR REPLACE FUNCTION public.fn_notificar_alerta_critico_push()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
BEGIN
  IF NEW.prioridade = 'critica' THEN
    v_url := current_setting('app.settings.supabase_url', true);
    v_key := current_setting('app.settings.service_role_key', true);

    IF v_url IS NULL OR v_key IS NULL THEN
      v_url := 'https://iikqosstymnnxaujzadw.supabase.co';
    END IF;

    BEGIN
      PERFORM net.http_post(
        url := v_url || '/functions/v1/enviar-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(v_key, '')
        ),
        body := jsonb_build_object(
          'titulo', NEW.titulo,
          'mensagem', NEW.mensagem,
          'user_id', NEW.user_id,
          'url', NEW.acao_url
        )
      );
    EXCEPTION WHEN OTHERS THEN
      NULL; -- não bloqueia inserção
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notificar_alerta_critico_push ON public.alertas;
CREATE TRIGGER trg_notificar_alerta_critico_push
AFTER INSERT ON public.alertas
FOR EACH ROW
EXECUTE FUNCTION public.fn_notificar_alerta_critico_push();
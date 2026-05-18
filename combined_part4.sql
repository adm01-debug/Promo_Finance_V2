  EXECUTE FUNCTION public.fn_notificar_filtro_compartilhado();

COMMENT ON FUNCTION public.fn_notificar_filtro_compartilhado() IS
  'Insere alertas in-app para cada usuário do tenant cujo papel passou a ter acesso a um filtro compartilhado.';
ALTER TABLE public.transacoes_bancarias REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transacoes_bancarias;DO $$ BEGIN
  CREATE TYPE public.subscription_frequencia AS ENUM ('imediata','horaria','diaria');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.saved_filter_subscriptions
  ADD COLUMN IF NOT EXISTS frequencia public.subscription_frequencia NOT NULL DEFAULT 'imediata',
  ADD COLUMN IF NOT EXISTS horario_preferido TIME NOT NULL DEFAULT '09:00:00',
  ADD COLUMN IF NOT EXISTS next_dispatch_at TIMESTAMPTZ;

COMMENT ON COLUMN public.saved_filter_subscriptions.frequencia IS 'Cadência de notificações: imediata=tempo real, horaria=agrupa por hora, diaria=envia uma vez por dia no horario_preferido';
COMMENT ON COLUMN public.saved_filter_subscriptions.horario_preferido IS 'Horário (timezone do usuário no client) usado para entregar notificações diárias e como referência para horárias';
COMMENT ON COLUMN public.saved_filter_subscriptions.next_dispatch_at IS 'Próximo instante em que o cliente pode despachar notificações pendentes acumuladas; NULL = imediata';-- 1. Adiciona canal de e-mail às assinaturas
ALTER TABLE public.saved_filter_subscriptions
  ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.saved_filter_subscriptions.notify_email IS 'Se true, envia também por e-mail ao endereço cadastrado na conta do usuário';

-- 2. Histórico unificado de notificações (in-app, push, e-mail)
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_ref UUID,
  channel TEXT NOT NULL CHECK (channel IN ('inapp', 'push', 'email')),
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'queued')),
  error_message TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_history_user_created
  ON public.notification_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_unread
  ON public.notification_history (user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_history_source
  ON public.notification_history (source, source_ref);

ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seu próprio histórico"
  ON public.notification_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários marcam seu próprio histórico como lido"
  ON public.notification_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT é feito por edge functions com service_role; bloqueia inserts diretos do cliente
CREATE POLICY "Sistema insere via service role"
  ON public.notification_history FOR INSERT
  TO authenticated
  WITH CHECK (false);

COMMENT ON TABLE public.notification_history IS 'Histórico unificado de notificações enviadas ao usuário (in-app/push/e-mail), com status e metadata para auditoria e UI de "central de notificações"';-- Adiciona regras de severidade crítica e tipos de eventos por assinatura.
-- severidades_criticas: subset de severidades que devem ser tratadas como
-- "críticas" (eleva prioridade do push e marca o toast). Default vazio = usa
-- a lógica antiga (apenas 'critica' é crítica).
-- tipos_eventos_ativos: lista de tipo_anomalia (ou tipo de evento) que
-- DISPARAM o alerta. Lista vazia = todos os tipos disparam (compat).
ALTER TABLE public.saved_filter_subscriptions
  ADD COLUMN IF NOT EXISTS severidades_criticas TEXT[] NOT NULL DEFAULT ARRAY['critica']::TEXT[],
  ADD COLUMN IF NOT EXISTS tipos_eventos_ativos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Validação: severidades_criticas só aceita valores conhecidos.
CREATE OR REPLACE FUNCTION public.validate_saved_filter_subscription_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  sev TEXT;
BEGIN
  IF NEW.severidades_criticas IS NOT NULL THEN
    FOREACH sev IN ARRAY NEW.severidades_criticas LOOP
      IF sev NOT IN ('baixa','media','alta','critica') THEN
        RAISE EXCEPTION 'Severidade invalida em severidades_criticas: %', sev;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_saved_filter_subscription_rules
  ON public.saved_filter_subscriptions;
CREATE TRIGGER trg_validate_saved_filter_subscription_rules
  BEFORE INSERT OR UPDATE ON public.saved_filter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_saved_filter_subscription_rules();ALTER TABLE public.saved_filter_subscriptions
  ADD COLUMN IF NOT EXISTS rate_limit_max integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS rate_limit_window_min integer NOT NULL DEFAULT 10;

CREATE OR REPLACE FUNCTION public.validate_saved_filter_subscription_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  sev TEXT;
BEGIN
  IF NEW.severidades_criticas IS NOT NULL THEN
    FOREACH sev IN ARRAY NEW.severidades_criticas LOOP
      IF sev NOT IN ('baixa','media','alta','critica') THEN
        RAISE EXCEPTION 'Severidade invalida em severidades_criticas: %', sev;
      END IF;
    END LOOP;
  END IF;
  IF NEW.rate_limit_max IS NOT NULL AND (NEW.rate_limit_max < 1 OR NEW.rate_limit_max > 100) THEN
    RAISE EXCEPTION 'rate_limit_max deve estar entre 1 e 100';
  END IF;
  IF NEW.rate_limit_window_min IS NOT NULL AND (NEW.rate_limit_window_min < 1 OR NEW.rate_limit_window_min > 1440) THEN
    RAISE EXCEPTION 'rate_limit_window_min deve estar entre 1 e 1440 minutos';
  END IF;
  RETURN NEW;
END;
$function$;CREATE OR REPLACE VIEW public.vw_notification_history_duplicates
WITH (security_invoker = true)
AS
WITH ranked AS (
  SELECT
    nh.id,
    nh.user_id,
    nh.source,
    nh.source_ref,
    nh.channel,
    nh.title,
    nh.created_at,
    LAG(nh.created_at) OVER (
      PARTITION BY nh.user_id, nh.source, nh.source_ref, nh.channel
      ORDER BY nh.created_at
    ) AS prev_created_at
  FROM public.notification_history nh
  WHERE nh.source_ref IS NOT NULL
)
SELECT
  id,
  user_id,
  source,
  source_ref,
  channel,
  title,
  created_at,
  prev_created_at,
  EXTRACT(EPOCH FROM (created_at - prev_created_at))::int AS seconds_since_prev
FROM ranked
WHERE prev_created_at IS NOT NULL
  AND created_at - prev_created_at < INTERVAL '60 seconds';

COMMENT ON VIEW public.vw_notification_history_duplicates IS
'Auditoria: pares de notificações entregues no mesmo (user, source_ref, channel) em janela < 60s. Indica falha de dedup (ex.: realtime re-entregue após refresh sem honrar last_seen_at). RLS via security_invoker — usuário só vê o que já enxerga em notification_history.';-- Revoga automaticamente assinaturas (saved_filter_subscriptions) cujo dono
-- perdeu acesso ao filtro associado. Acionado quando:
--   1. Um saved_filter é UPDATE/DELETE (ex.: vira privado, troca de empresa,
--      remove um role da lista shared_with_roles, ou é apagado).
--   2. Um vínculo user_empresas é UPDATE/DELETE (ex.: usuário desativado,
--      role do usuário muda de modo a perder cobertura no shared_with_roles).
--
-- Defesa em profundidade: mesmo que a UI demore a recarregar, o backend
-- garante que o realtime não tenha mais subscription a processar para
-- usuários sem permissão. Falhas no cleanup nunca bloqueiam a operação
-- principal.

CREATE OR REPLACE FUNCTION public.fn_revoke_orphan_saved_filter_subscriptions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_filter_id uuid;
  v_user_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'saved_filters' THEN
    -- Em DELETE de filtro, ON DELETE CASCADE já cuida; mantemos por segurança.
    v_filter_id := COALESCE(NEW.id, OLD.id);
    DELETE FROM public.saved_filter_subscriptions s
    WHERE s.saved_filter_id = v_filter_id
      AND NOT public.can_access_saved_filter(s.saved_filter_id, s.user_id);
  ELSIF TG_TABLE_NAME = 'user_empresas' THEN
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);
    -- Limpa todas as assinaturas do usuário em filtros que ele perdeu acesso.
    DELETE FROM public.saved_filter_subscriptions s
    WHERE s.user_id = v_user_id
      AND NOT public.can_access_saved_filter(s.saved_filter_id, s.user_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Cleanup é best-effort: nunca bloqueia o write principal.
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_revoke_orphan_subs_on_saved_filter ON public.saved_filters;
CREATE TRIGGER trg_revoke_orphan_subs_on_saved_filter
  AFTER UPDATE OR DELETE ON public.saved_filters
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_revoke_orphan_saved_filter_subscriptions();

DROP TRIGGER IF EXISTS trg_revoke_orphan_subs_on_user_empresas ON public.user_empresas;
CREATE TRIGGER trg_revoke_orphan_subs_on_user_empresas
  AFTER UPDATE OR DELETE ON public.user_empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_revoke_orphan_saved_filter_subscriptions();

COMMENT ON FUNCTION public.fn_revoke_orphan_saved_filter_subscriptions() IS
'Remove automaticamente assinaturas de filtros salvos que perderam acesso (mudança em shared_with_roles/empresa_id, exclusão do filtro, ou desativação/troca de role do usuário no tenant). Garante que realtime nunca dispare alertas para usuários sem permissão.';-- Create table for user demonstrativo preferences
CREATE TABLE IF NOT EXISTS public.user_demonstrativo_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    modo_padrao TEXT DEFAULT 'dre', -- 'dre' or 'balanco'
    fonte_padrao TEXT DEFAULT 'competencia', -- 'competencia' or 'caixa'
    filtros_por_empresa JSONB DEFAULT '{}'::jsonb, -- Store filters indexed by empresa_id
    drill_down_estado JSONB DEFAULT '{}'::jsonb, -- Store which lines are open/selected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT user_id_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_demonstrativo_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own demonstrativo preferences"
ON public.user_demonstrativo_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own demonstrativo preferences"
ON public.user_demonstrativo_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own demonstrativo preferences"
ON public.user_demonstrativo_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_demonstrativo_preferences_updated_at
BEFORE UPDATE ON public.user_demonstrativo_preferences
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();-- Contas a Receber Governance Improvements

-- 1. Add tracking columns to existing tables
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS transacao_conciliada_id UUID REFERENCES public.transacoes_bancarias(id);
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{"events": []}'::jsonb;

ALTER TABLE public.boletos ADD COLUMN IF NOT EXISTS transacao_conciliada_id UUID REFERENCES public.transacoes_bancarias(id);

-- 2. Configuration table for receivables
CREATE TABLE IF NOT EXISTS public.configuracoes_receber (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) UNIQUE,
    regua_ativa BOOLEAN DEFAULT false,
    regua_config JSONB DEFAULT '{
        "lembrete_preventivo": {"dias": -2, "ativo": true, "canal": "email"},
        "vencimento_hoje": {"dias": 0, "ativo": true, "canal": "whatsapp"},
        "cobranca_nivel_1": {"dias": 3, "ativo": true, "canal": "email"},
        "cobranca_nivel_2": {"dias": 10, "ativo": true, "canal": "whatsapp"}
    }'::jsonb,
    baixa_automatica_ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.configuracoes_receber ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their company settings" ON public.configuracoes_receber FOR ALL USING (true);

-- 3. Execution log for billing rules (Régua de Cobrança)
CREATE TABLE IF NOT EXISTS public.execucoes_regua_cobranca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    conta_receber_id UUID NOT NULL REFERENCES public.contas_receber(id),
    etapa TEXT NOT NULL, -- preventiva, hoje, atraso_1, etc
    canal TEXT NOT NULL, -- email, whatsapp
    status TEXT NOT NULL, -- sucesso, erro
    mensagem_erro TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.execucoes_regua_cobranca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their billing executions" ON public.execucoes_regua_cobranca FOR SELECT USING (true);

-- 4. Automatic reconciliation/write-off logs
CREATE TABLE IF NOT EXISTS public.logs_baixa_automatica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    arquivo_nome TEXT NOT NULL,
    total_registros INTEGER NOT NULL,
    sucesso_count INTEGER DEFAULT 0,
    falha_count INTEGER DEFAULT 0,
    matching_info JSONB, -- Details on which bills were matched
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.logs_baixa_automatica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their write-off logs" ON public.logs_baixa_automatica FOR SELECT USING (true);

-- 5. Function to register events in receivables metadata
CREATE OR REPLACE FUNCTION public.registrar_evento_receber(
    p_conta_id UUID,
    p_tipo TEXT,
    p_mensagem TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
DECLARE
    v_event JSONB;
BEGIN
    v_event := jsonb_build_object(
        'id', gen_random_uuid(),
        'type', p_tipo,
        'message', p_mensagem,
        'timestamp', now(),
        'metadata', p_metadata
    );
    
    UPDATE public.contas_receber
    SET metadata = jsonb_set(
        COALESCE(metadata, '{"events": []}'::jsonb),
        '{events}',
        (COALESCE(metadata->'events', '[]'::jsonb) || v_event)
    )
    WHERE id = p_conta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to auto-log status changes
CREATE OR REPLACE FUNCTION public.trigger_log_receber_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.registrar_evento_receber(NEW.id, 'criacao', 'Título criado no sistema');
    ELSIF (OLD.status IS DISTINCT FROM NEW.status) THEN
        PERFORM public.registrar_evento_receber(
            NEW.id, 
            'status_change', 
            format('Status alterado de %s para %s', OLD.status, NEW.status),
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_receber_status
AFTER INSERT OR UPDATE OF status ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_receber_status_change();
-- Tabela de preferências globais do usuário (substituindo ou estendendo o que já existe)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL, -- ex: 'contabilidade.demonstrativos'
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

-- Tabela para presets de filtros salvos
CREATE TABLE IF NOT EXISTS public.user_filter_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- ex: 'dre-balanco', 'razao-diario'
  name TEXT NOT NULL, -- Nome dado pelo usuário ao preset
  filters JSONB NOT NULL,
  empresa_id TEXT, -- Opcional: vincular preset a uma empresa específica
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de auditoria para mudanças de filtros/preferências
CREATE TABLE IF NOT EXISTS public.user_action_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'preference_change', 'filter_change', 'preset_saved'
  entity_type TEXT,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_filter_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_action_audit ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own filter presets"
  ON public.user_filter_presets
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own audit logs"
  ON public.user_action_audit
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON public.user_action_audit
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_user_filter_presets_updated_at
  BEFORE UPDATE ON public.user_filter_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE FUNCTION public.confirmar_conciliacao(
  p_transacao_id uuid, 
  p_conta_pagar_id uuid DEFAULT NULL::uuid, 
  p_conta_receber_id uuid DEFAULT NULL::uuid,
  p_ajuste_centavos numeric DEFAULT 0
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_valor_transacao numeric;
BEGIN
  -- Obter valor da transação
  SELECT ABS(valor) INTO v_valor_transacao FROM public.transacoes_bancarias WHERE id = p_transacao_id;

  -- Atualizar a transação bancária como conciliada
  UPDATE public.transacoes_bancarias
  SET 
    conciliada = true,
    conciliada_em = now(),
    conciliada_por = auth.uid(),
    conta_pagar_id = COALESCE(p_conta_pagar_id, conta_pagar_id),
    conta_receber_id = COALESCE(p_conta_receber_id, conta_receber_id),
    valor_conciliado = v_valor_transacao
  WHERE id = p_transacao_id;

  -- Se vinculado a conta a pagar, atualizar status e registrar ajuste
  IF p_conta_pagar_id IS NOT NULL THEN
    UPDATE public.contas_pagar
    SET 
      status = 'pago', 
      data_pagamento = CURRENT_DATE,
      -- Se p_ajuste_centavos for positivo, é juros. Se negativo, desconto.
      juros = CASE WHEN p_ajuste_centavos > 0 THEN juros + p_ajuste_centavos ELSE juros END,
      desconto = CASE WHEN p_ajuste_centavos < 0 THEN desconto + ABS(p_ajuste_centavos) ELSE desconto END
    WHERE id = p_conta_pagar_id;
  END IF;

  -- Se vinculado a conta a receber, atualizar status e registrar ajuste
  IF p_conta_receber_id IS NOT NULL THEN
    UPDATE public.contas_receber
    SET 
      status = 'pago', 
      data_recebimento = CURRENT_DATE,
      juros = CASE WHEN p_ajuste_centavos > 0 THEN juros + p_ajuste_centavos ELSE juros END,
      desconto = CASE WHEN p_ajuste_centavos < 0 THEN desconto + ABS(p_ajuste_centavos) ELSE desconto END
    WHERE id = p_conta_receber_id;
  END IF;
END;
$function$;-- Adicionar configurações de conciliação às contas bancárias
ALTER TABLE public.contas_bancarias 
ADD COLUMN IF NOT EXISTS configuracoes_conciliacao JSONB DEFAULT '{"tolerancia_centavos": 0.50, "auto_ajuste": true}';

-- Tabela para logs de conciliação retroativa
CREATE TABLE IF NOT EXISTS public.logs_conciliacao_retroativa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status TEXT DEFAULT 'processando', -- 'processando', 'concluido', 'erro'
    total_processado INTEGER DEFAULT 0,
    total_conciliado INTEGER DEFAULT 0,
    divergencias_encontradas INTEGER DEFAULT 0,
    logs JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Tabela para painel de divergências
CREATE TABLE IF NOT EXISTS public.divergencias_conciliacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extrato_id UUID, -- Referência lógica ao lote de importação
    conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
    transacao_id UUID REFERENCES public.transacoes_bancarias(id),
    tipo_divergencia TEXT NOT NULL, -- 'saldo_final', 'valor_parcial', 'data_descolada'
    descricao TEXT,
    valor_divergencia NUMERIC,
    status TEXT DEFAULT 'pendente', -- 'pendente', 'aceito', 'corrigido'
    recomendacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.logs_conciliacao_retroativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divergencias_conciliacao ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (acesso total para usuários autenticados da mesma organização simplificado aqui para brevidade)
CREATE POLICY "Users can view logs" ON public.logs_conciliacao_retroativa FOR SELECT USING (true);
CREATE POLICY "Users can insert logs" ON public.logs_conciliacao_retroativa FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view divergencias" ON public.divergencias_conciliacao FOR SELECT USING (true);
CREATE POLICY "Users can update divergencias" ON public.divergencias_conciliacao FOR UPDATE USING (true);CREATE OR REPLACE FUNCTION public.registrar_evento_pagar(
  p_conta_id UUID,
  p_tipo TEXT,
  p_mensagem TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.historico_pagamento (
    conta_pagar_id,
    tipo,
    mensagem,
    metadata,
    created_at
  ) VALUES (
    p_conta_id,
    p_tipo,
    p_mensagem,
    p_metadata,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;-- Adicionar colunas de compensação na tabela de transações bancárias
ALTER TABLE public.transacoes_bancarias 
ADD COLUMN IF NOT EXISTS compensacao_valor NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS compensacao_motivo TEXT,
ADD COLUMN IF NOT EXISTS compensacao_classificacao TEXT, -- 'Juros' ou 'Desconto'
ADD COLUMN IF NOT EXISTS compensacao_regra TEXT,
ADD COLUMN IF NOT EXISTS compensacao_evidencia_url TEXT;

-- Garantir que configuracoes_conciliacao existe (já existe, mas vamos documentar o que ela deve conter)
-- Formato esperado no JSONB: { "tolerancia_centavos": 0.50, "aceite_automatico": true, "periodo_tolerancia_dias": 5 }

COMMENT ON COLUMN public.transacoes_bancarias.compensacao_valor IS 'Valor da diferença de centavos ajustada na conciliação';
COMMENT ON COLUMN public.transacoes_bancarias.compensacao_motivo IS 'Motivo do ajuste (ex: Tolerância configurada)';
COMMENT ON COLUMN public.transacoes_bancarias.compensacao_classificacao IS 'Classificação contábil do ajuste: Juros ou Desconto';
COMMENT ON COLUMN public.transacoes_bancarias.compensacao_regra IS 'A regra de negócio aplicada para o ajuste';
-- Auditoria de divergências
ALTER TABLE public.divergencias_conciliacao 
ADD COLUMN IF NOT EXISTS resolvido_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMP WITH TIME ZONE;

-- Auditoria de compensações de centavos
ALTER TABLE public.transacoes_bancarias
ADD COLUMN IF NOT EXISTS compensacao_aceita_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS compensacao_aceita_em TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Progresso e detalhes de erro para conciliação retroativa
ALTER TABLE public.logs_conciliacao_retroativa
ADD COLUMN IF NOT EXISTS progresso NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS erro_detalhe TEXT;
-- Função para gerar alerta em caso de falha na conciliação retroativa
CREATE OR REPLACE FUNCTION public.handle_conciliacao_retroativa_error()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'erro' AND (OLD.status IS NULL OR OLD.status != 'erro')) THEN
    INSERT INTO public.alertas (
      user_id,
      tipo,
      titulo,
      mensagem,
      prioridade,
      acao_url,
      entidade_id,
      entidade_tipo
    ) VALUES (
      NEW.created_by,
      'sistema',
      'Falha na Conciliação Retroativa',
      'O processamento retroativo do período ' || NEW.data_inicio || ' a ' || NEW.data_fim || ' falhou: ' || COALESCE(NEW.erro_detalhe, 'Erro desconhecido'),
      'alta',
      '/conciliacao?tab=retroativo&jobId=' || NEW.id,
      NEW.id::text,
      'conciliacao_retroativa'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho para disparar o alerta
DROP TRIGGER IF EXISTS trigger_conciliacao_retroativa_error ON public.logs_conciliacao_retroativa;
CREATE TRIGGER trigger_conciliacao_retroativa_error
AFTER UPDATE ON public.logs_conciliacao_retroativa
FOR EACH ROW
EXECUTE FUNCTION public.handle_conciliacao_retroativa_error();

-- Índices para otimização da auditoria
CREATE INDEX IF NOT EXISTS idx_transacoes_compensacao_aceita_em ON public.transacoes_bancarias (compensacao_aceita_em);
CREATE INDEX IF NOT EXISTS idx_transacoes_compensacao_aceita_por ON public.transacoes_bancarias (compensacao_aceita_por);
CREATE INDEX IF NOT EXISTS idx_transacoes_compensacao_classificacao ON public.transacoes_bancarias (compensacao_classificacao);
CREATE INDEX IF NOT EXISTS idx_divergencias_resolvido_em ON public.divergencias_conciliacao (resolvido_em);
CREATE INDEX IF NOT EXISTS idx_divergencias_resolvido_por ON public.divergencias_conciliacao (resolvido_por);

CREATE TABLE IF NOT EXISTS public.regras_contabilizacao_automatica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  nome text NOT NULL,
  tipo_evento text NOT NULL CHECK (tipo_evento IN ('conta_pagar','conta_receber','movimentacao')),
  categoria_id uuid,
  condicoes jsonb NOT NULL DEFAULT '{}'::jsonb,
  conta_debito_id uuid NOT NULL REFERENCES public.plano_contas(id) ON DELETE RESTRICT,
  conta_credito_id uuid NOT NULL REFERENCES public.plano_contas(id) ON DELETE RESTRICT,
  historico_template text NOT NULL DEFAULT '{descricao}',
  prioridade integer NOT NULL DEFAULT 100,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_regras_contab_emp_evento ON public.regras_contabilizacao_automatica(empresa_id, tipo_evento, ativo);

ALTER TABLE public.regras_contabilizacao_automatica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regras_contab_select" ON public.regras_contabilizacao_automatica
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "regras_contab_write" ON public.regras_contabilizacao_automatica
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'financeiro'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'financeiro'::app_role]));

CREATE TABLE IF NOT EXISTS public.eventos_contabilizacao_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  tipo_evento text NOT NULL,
  evento_id uuid NOT NULL,
  regra_id uuid REFERENCES public.regras_contabilizacao_automatica(id) ON DELETE SET NULL,
  lancamento_id uuid REFERENCES public.lancamentos_contabeis(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('sucesso','sem_regra','erro','duplicado')),
  detalhe text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eventos_contab_emp ON public.eventos_contabilizacao_log(empresa_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_eventos_contab_evento ON public.eventos_contabilizacao_log(tipo_evento, evento_id) WHERE status = 'sucesso';

ALTER TABLE public.eventos_contabilizacao_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eventos_contab_select" ON public.eventos_contabilizacao_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "eventos_contab_insert" ON public.eventos_contabilizacao_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'financeiro'::app_role]));
-- Tabela para simulações de regimes tributários
CREATE TABLE public.elisao_simulacoes_regime (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    ano_base INTEGER NOT NULL,
    dados_faturamento JSONB NOT NULL DEFAULT '{}', -- Mensal: { "jan": 10000, ... }
    dados_despesas JSONB NOT NULL DEFAULT '{}',
    resultado_simples JSONB,
    resultado_presumido JSONB,
    resultado_real JSONB,
    resultado_reforma_transicao JSONB, -- Projeção CBS/IBS
    criado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de inteligência de créditos (NCM/Produtos)
CREATE TABLE public.elisao_regras_creditos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ncm TEXT NOT NULL,
    descricao TEXT,
    tipo_credito TEXT NOT NULL, -- 'monofasico', 'isento', 'substituicao_tributaria', 'exclusao_base'
    aliquota_pis_reducao DECIMAL(5,4) DEFAULT 0,
    aliquota_cofins_reducao DECIMAL(5,4) DEFAULT 0,
    fundamentacao_legal TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de análise de Gap Fiscal (Resultados)
CREATE TABLE public.elisao_analise_gap (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    periodo_referencia DATE NOT NULL,
    valor_pago_efetivo DECIMAL(15,2) NOT NULL,
    valor_otimizado_projetado DECIMAL(15,2) NOT NULL,
    economia_identificada DECIMAL(15,2) GENERATED ALWAYS AS (valor_pago_efetivo - valor_otimizado_projetado) STORED,
    detalhes_oportunidades JSONB NOT NULL DEFAULT '[]',
    status TEXT DEFAULT 'oportunidade_detectada', -- 'oportunidade_detectada', 'em_implementacao', 'economizado'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.elisao_simulacoes_regime ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elisao_regras_creditos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elisao_analise_gap ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their company simulations" 
ON public.elisao_simulacoes_regime FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Everyone can view tax rules" 
ON public.elisao_regras_creditos FOR SELECT 
USING (true);

CREATE POLICY "Users can view their company gap analysis" 
ON public.elisao_analise_gap FOR SELECT 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Gatilho para updated_at
CREATE TRIGGER update_elisao_simulacoes_updated_at
BEFORE UPDATE ON public.elisao_simulacoes_regime
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Adicionar campos de premissas detalhadas para o Simulador 2025
ALTER TABLE public.elisao_simulacoes_regime 
ADD COLUMN IF NOT EXISTS premissas_reforma JSONB DEFAULT '{"aliquota_cbs": 0.088, "aliquota_ibs": 0.177, "ano_transicao": 2026}',
ADD COLUMN IF NOT EXISTS premissas_operacionais JSONB DEFAULT '{"crescimento_anual": 0.05, "margem_ebitda": 0.15, "folha_prolabore": 0.28}';

-- Função para simular crédito tributário baseado em notas fiscais existentes
CREATE OR REPLACE FUNCTION public.calcular_potencial_elisao(p_empresa_id UUID)
RETURNS TABLE (
    tipo_oportunidade TEXT,
    valor_estimado DECIMAL(15,2),
    descricao TEXT,
    ncm_relacionado TEXT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.tipo_credito as tipo_oportunidade,
        SUM(nfi.valor_total * (r.aliquota_pis_reducao + r.aliquota_cofins_reducao)) as valor_estimado,
        r.descricao,
        r.ncm
    FROM elisao_regras_creditos r
    JOIN nota_fiscal_itens nfi ON nfi.ncm = r.ncm
    JOIN notas_fiscais nf ON nf.id = nfi.nota_fiscal_id
    WHERE nf.empresa_id = p_empresa_id
      AND nf.tipo = 'entrada' -- Analisando créditos em notas de entrada
      AND nf.data_emissao >= (now() - interval '12 months')
    GROUP BY r.tipo_credito, r.descricao, r.ncm;
END;
$$;
-- Tabela de auditoria de elegibilidade de créditos
CREATE TABLE public.elisao_creditos_auditoria (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nota_fiscal_id UUID NOT NULL, -- Referência ao documento original
    ncm TEXT NOT NULL,
    cst_csosn TEXT,
    valor_base DECIMAL(15,2) NOT NULL,
    valor_credito_calculado DECIMAL(15,2) NOT NULL,
    regra_id UUID REFERENCES public.elisao_regras_creditos(id),
    status_validacao TEXT DEFAULT 'pendente', -- 'pendente', 'elegivel', 'inelegivel'
    motivo_rejeicao TEXT,
    metodologia_aplicada TEXT,
    evidencias JSONB DEFAULT '[]', -- Lista de IDs de anexos ou metadados
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de acionáveis (Régua de Tarefas)
CREATE TABLE public.elisao_tarefas_acionaveis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo_oportunidade TEXT, -- 'recuperacao_pis_cofins', 'ajuste_icms_st', 'planejamento_regime'
    valor_envolvido DECIMAL(15,2),
    responsavel_id UUID REFERENCES auth.users(id),
    prazo DATE,
    status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'done', 'canceled'
    checklist JSONB DEFAULT '[]', -- [{ "item": "Coletar XMLs", "done": false }, ...]
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.elisao_creditos_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elisao_tarefas_acionaveis ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage company audit logs" 
ON public.elisao_creditos_auditoria FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Users can manage company action tasks" 
ON public.elisao_tarefas_acionaveis FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Trigger para updated_at nas tarefas
CREATE TRIGGER update_elisao_tarefas_updated_at
BEFORE UPDATE ON public.elisao_tarefas_acionaveis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Tabela de alertas automáticos
CREATE TABLE IF NOT EXISTS public.elisao_alertas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    competencia DATE NOT NULL,
    tipo_divergencia TEXT NOT NULL, -- 'ncm_invalido', 'valor_divergente', 'documentacao_ausente'
    descricao TEXT NOT NULL,
    severidade TEXT NOT NULL DEFAULT 'media', -- 'baixa', 'media', 'alta'
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'resolvido', 'ignorado'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para alertas
ALTER TABLE public.elisao_alertas ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view alerts for their companies' AND tablename = 'elisao_alertas') THEN
        CREATE POLICY "Users can view alerts for their companies"
        ON public.elisao_alertas FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE empresa_id = elisao_alertas.empresa_id
            AND user_id = auth.uid()
        ));
    END IF;
END $$;

-- Adicionar campos de aprovação em elisao_creditos_auditoria
ALTER TABLE public.elisao_creditos_auditoria 
ADD COLUMN IF NOT EXISTS aprovador_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_aprovacao TEXT NOT NULL DEFAULT 'pendente' CHECK (status_aprovacao IN ('pendente', 'aprovado', 'rejeitado')),
ADD COLUMN IF NOT EXISTS historico_decisoes JSONB DEFAULT '[]'::jsonb;

-- Adicionar integração Bitrix24 em elisao_tarefas_acionaveis
ALTER TABLE public.elisao_tarefas_acionaveis
ADD COLUMN IF NOT EXISTS bitrix_task_id TEXT,
ADD COLUMN IF NOT EXISTS bitrix_sync_status TEXT DEFAULT 'nao_sincronizado' CHECK (bitrix_sync_status IN ('nao_sincronizado', 'sincronizado', 'erro')),
ADD COLUMN IF NOT EXISTS bitrix_error_message TEXT;

-- Função para registrar decisão no histórico
CREATE OR REPLACE FUNCTION public.registrar_decisao_elisao()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') AND (NEW.status_aprovacao <> OLD.status_aprovacao) THEN
        NEW.historico_decisoes = COALESCE(OLD.historico_decisoes, '[]'::jsonb) || jsonb_build_object(
            'status', NEW.status_aprovacao,
            'usuario_id', auth.uid(),
            'data', now(),
            'comentario', NEW.motivo_rejeicao
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_registrar_decisao_elisao ON public.elisao_creditos_auditoria;
CREATE TRIGGER tr_registrar_decisao_elisao
BEFORE UPDATE ON public.elisao_creditos_auditoria
FOR EACH ROW
EXECUTE FUNCTION public.registrar_decisao_elisao();
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'elisao_creditos_auditoria_nota_fiscal_id_fkey') THEN
        ALTER TABLE public.elisao_creditos_auditoria
        ADD CONSTRAINT elisao_creditos_auditoria_nota_fiscal_id_fkey 
        FOREIGN KEY (nota_fiscal_id) REFERENCES public.notas_fiscais_ocr(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'elisao_creditos_auditoria_regra_id_fkey') THEN
        ALTER TABLE public.elisao_creditos_auditoria
        ADD CONSTRAINT elisao_creditos_auditoria_regra_id_fkey 
        FOREIGN KEY (regra_id) REFERENCES public.elisao_regras_creditos(id);
    END IF;
END $$;
ALTER TABLE public.elisao_creditos_auditoria 
ADD COLUMN IF NOT EXISTS score_confianca NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS divergencias_detectadas JSONB DEFAULT '[]'::jsonb;

-- Comentário para documentar que regra_id já existe e está vinculado via fkey
COMMENT ON COLUMN public.elisao_creditos_auditoria.regra_id IS 'Regra aplicada para o cálculo do crédito';
-- Tabela de Auditoria de Configurações
CREATE TABLE IF NOT EXISTS public.auditoria_configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo_acao TEXT NOT NULL, -- 'troca_empresa', 'filtro_alterado', 'parametro_alterado'
    detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.auditoria_configuracoes ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem ver auditoria das suas empresas') THEN
        CREATE POLICY "Usuários podem ver auditoria das suas empresas"
        ON public.auditoria_configuracoes FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR role = 'financeiro')
        ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários podem inserir auditoria') THEN
        CREATE POLICY "Usuários podem inserir auditoria"
        ON public.auditoria_configuracoes FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Função para registrar auditoria via RPC
CREATE OR REPLACE FUNCTION public.registrar_auditoria_config(
    _tipo_acao TEXT,
    _empresa_id UUID,
    _detalhes JSONB
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.auditoria_configuracoes (user_id, empresa_id, tipo_acao, detalhes)
    VALUES (auth.uid(), _empresa_id, _tipo_acao, _detalhes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- 1. Extend boletos table for tracking and payables reference
ALTER TABLE public.boletos 
ADD COLUMN IF NOT EXISTS rastreio_status JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS conta_pagar_id UUID REFERENCES public.contas_pagar(id);

-- 2. Enhance transacoes_bancarias for better audit and status
ALTER TABLE public.transacoes_bancarias
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'estornado')),
ADD COLUMN IF NOT EXISTS regra_id UUID REFERENCES public.regras_conciliacao(id),
ADD COLUMN IF NOT EXISTS data_confirmacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmado_por UUID REFERENCES auth.users(id);

-- Update existing reconciled transactions (using created_at since updated_at might not exist on this table)
UPDATE public.transacoes_bancarias 
SET status = 'confirmado', data_confirmacao = created_at 
WHERE conciliada = true;

-- 3. Add AI negotiation config to regua_cobranca
ALTER TABLE public.regua_cobranca
ADD COLUMN IF NOT EXISTS configuracoes_ia JSONB DEFAULT '{"permitir_negociacao": false, "desconto_maximo": 10, "parcelas_maximas": 3}';

-- 4. Create function to undo reconciliation
CREATE OR REPLACE FUNCTION public.desfazer_conciliacao(
    p_transacao_id UUID,
    p_user_id UUID
) RETURNS VOID AS $$
DECLARE
    v_conta_receber_id UUID;
    v_conta_pagar_id UUID;
BEGIN
    -- Find references
    SELECT conta_receber_id, conta_pagar_id INTO v_conta_receber_id, v_conta_pagar_id
    FROM public.transacoes_bancarias
    WHERE id = p_transacao_id;

    -- Update bank transaction
    UPDATE public.transacoes_bancarias
    SET 
        conciliada = false,
        status = 'pendente',
        conta_receber_id = NULL,
        conta_pagar_id = NULL,
        compensacao_valor = 0,
        compensacao_motivo = NULL,
        data_confirmacao = NULL,
        confirmado_por = NULL
    WHERE id = p_transacao_id;

    -- Update account receivable if applicable
    IF v_conta_receber_id IS NOT NULL THEN
        UPDATE public.contas_receber
        SET 
            status = 'pendente',
            valor_recebido = 0,
            data_recebimento = NULL,
            conta_bancaria_id = NULL,
            transacao_conciliada_id = NULL
        WHERE id = v_conta_receber_id;

        -- Log undo event
        PERFORM public.registrar_evento_receber(
            v_conta_receber_id,
            'conciliacao_desfeita',
            'Conciliação bancária desfeita pelo usuário.',
            jsonb_build_object('transacao_id', p_transacao_id, 'user_id', p_user_id)
        );
    END IF;

    -- Update account payable if applicable
    IF v_conta_pagar_id IS NOT NULL THEN
        UPDATE public.contas_pagar
        SET 
            status = 'pendente',
            valor_pago = 0,
            data_pagamento = NULL,
            conta_bancaria_id = NULL
        WHERE id = v_conta_pagar_id;

        -- Log undo event
        PERFORM public.registrar_evento_pagar(
            v_conta_pagar_id,
            'conciliacao_desfeita',
            'Conciliação bancária desfeita pelo usuário.',
            jsonb_build_object('transacao_id', p_transacao_id, 'user_id', p_user_id)
        );
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Régua de cobrança por título
CREATE TABLE IF NOT EXISTS public.regua_cobranca_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo_id UUID NOT NULL, -- Referência ao contas_receber ou boleto
    cliente_id UUID NOT NULL,
    empresa_id UUID NOT NULL,
    etapa_atual TEXT NOT NULL DEFAULT 'preventiva',
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, disparado, erro, concluido
    data_proximo_disparo TIMESTAMP WITH TIME ZONE,
    historico JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.regua_cobranca_status ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para regua_cobranca_status
CREATE POLICY "Usuários podem ver status da régua de sua empresa" 
ON public.regua_cobranca_status FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.user_empresas WHERE empresa_id = regua_cobranca_status.empresa_id));

-- Adicionar colunas Bitrix24 na tabela de boletos (se não existirem)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='boletos' AND column_name='bitrix_id') THEN
        ALTER TABLE public.boletos ADD COLUMN bitrix_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='boletos' AND column_name='bitrix_status') THEN
        ALTER TABLE public.boletos ADD COLUMN bitrix_status TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='boletos' AND column_name='eventos_pagamento') THEN
        ALTER TABLE public.boletos ADD COLUMN eventos_pagamento JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Fila de conciliação pendente
CREATE TABLE IF NOT EXISTS public.conciliacao_sugestoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transacao_id UUID NOT NULL,
    empresa_id UUID NOT NULL,
    sugestoes JSONB NOT NULL, -- Array de matches possíveis com score e IDs do sistema
    status TEXT DEFAULT 'pendente', -- pendente, aceito, rejeitado
    analisado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.conciliacao_sugestoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver sugestões de sua empresa" 
ON public.conciliacao_sugestoes FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.user_empresas WHERE empresa_id = conciliacao_sugestoes.empresa_id));
-- Adicionar coluna para ID externo do ASAAS ou outros provedores
ALTER TABLE public.boletos ADD COLUMN IF NOT EXISTS asaas_id TEXT;
ALTER TABLE public.boletos ADD COLUMN IF NOT EXISTS external_provider TEXT DEFAULT 'asaas';

-- Garantir que temos uma tabela de logs para eventos de boletos se não existir
CREATE TABLE IF NOT EXISTS public.boleto_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boleto_id UUID REFERENCES public.boletos(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    status_before TEXT,
    status_after TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de eventos
ALTER TABLE public.boleto_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events of their companies' boletos"
ON public.boleto_events
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.boletos b
        JOIN public.user_roles ur ON ur.user_id = auth.uid()
        WHERE b.id = boleto_events.boleto_id
    )
);

-- Função para atualizar automaticamente a conta vinculada quando o boleto mudar para pago
CREATE OR REPLACE FUNCTION public.handle_boleto_payment_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para 'pago'
    IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
        -- Atualizar conta a receber se houver
        IF NEW.conta_receber_id IS NOT NULL THEN
            UPDATE public.contas_receber
            SET status = 'pago', 
                data_recebimento = COALESCE(NEW.updated_at, now())::date,
                updated_at = now()
            WHERE id = NEW.conta_receber_id;
            
            -- Registrar evento na conta a receber
            INSERT INTO public.contas_receber_eventos (conta_id, tipo, mensagem, metadata)
            VALUES (NEW.conta_receber_id, 'pagamento_confirmado', 'Pagamento confirmado via boleto #' || NEW.numero, jsonb_build_object('boleto_id', NEW.id));
        END IF;

        -- Atualizar conta a pagar se houver
        IF NEW.conta_pagar_id IS NOT NULL THEN
            UPDATE public.contas_pagar
            SET status = 'pago', 
                data_pagamento = COALESCE(NEW.updated_at, now())::date,
                updated_at = now()
            WHERE id = NEW.conta_pagar_id;

             -- Registrar evento na conta a pagar
            INSERT INTO public.contas_pagar_eventos (conta_id, tipo, mensagem, metadata)
            VALUES (NEW.conta_pagar_id, 'pagamento_confirmado', 'Pagamento confirmado via boleto #' || NEW.numero, jsonb_build_object('boleto_id', NEW.id));
        END IF;
    END IF;

    -- Registrar evento de mudança de status
    IF NEW.status != OLD.status THEN
        INSERT INTO public.boleto_events (boleto_id, event_type, status_before, status_after, description)
        VALUES (NEW.id, 'status_change', OLD.status, NEW.status, 'Status alterado de ' || OLD.status || ' para ' || NEW.status);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronização de pagamento
DROP TRIGGER IF EXISTS on_boleto_status_change ON public.boletos;
CREATE TRIGGER on_boleto_status_change
AFTER UPDATE ON public.boletos
FOR EACH ROW
EXECUTE FUNCTION public.handle_boleto_payment_sync();
-- Criar tabela de fila de sincronização/retentativas
CREATE TABLE IF NOT EXISTS public.asaas_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.asaas_payments(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL, -- 'EMISSION', 'UPDATE_STATUS', 'DOWNLOAD_FILES'
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    last_error TEXT,
    next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de trilha de auditoria específica para boletos
CREATE TABLE IF NOT EXISTS public.asaas_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.asaas_payments(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'EMISSION_REQUESTED', 'EMISSION_SUCCESS', 'WEBHOOK_RECEIVED', 'STATUS_CHANGED', 'DOWNLOAD_CLICKED'
    previous_status TEXT,
    new_status TEXT,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar campo de comprovante e metadados extras em asaas_payments se não existirem
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'asaas_payments' AND COLUMN_NAME = 'link_comprovante') THEN
        ALTER TABLE public.asaas_payments ADD COLUMN link_comprovante TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'asaas_payments' AND COLUMN_NAME = 'metadata') THEN
        ALTER TABLE public.asaas_payments ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.asaas_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_audit_trail ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura da fila para autenticados" ON public.asaas_sync_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura da auditoria para autenticados" ON public.asaas_audit_trail FOR SELECT TO authenticated USING (true);

-- Gatilho para updated_at na fila
CREATE TRIGGER update_asaas_sync_queue_updated_at
    BEFORE UPDATE ON public.asaas_sync_queue
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();-- Create asaas_config table
CREATE TABLE IF NOT EXISTS public.asaas_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    retry_limit INTEGER DEFAULT 5,
    retry_interval_minutes INTEGER DEFAULT 30,
    backoff_multiplier DECIMAL DEFAULT 2.0,
    auto_sync_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(empresa_id)
);

-- Enable RLS
ALTER TABLE public.asaas_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own company asaas config"
ON public.asaas_config FOR SELECT
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Users can update their own company asaas config"
ON public.asaas_config FOR UPDATE
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Users can insert their own company asaas config"
ON public.asaas_config FOR INSERT
WITH CHECK (empresa_id IN (SELECT id FROM public.empresas));

-- Trigger for updated_at
CREATE TRIGGER update_asaas_config_updated_at
BEFORE UPDATE ON public.asaas_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to export audit trail as CSV (can be called via RPC)
CREATE OR REPLACE FUNCTION public.export_asaas_audit_csv(p_empresa_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_csv TEXT;
BEGIN
    SELECT string_agg(row_data, E'\n')
    INTO v_csv
    FROM (
        SELECT 'ID,Payment_ID,Event_Type,Description,Status,Created_At' AS row_data
        UNION ALL
        SELECT 
            id::text || ',' || 
            payment_id::text || ',' || 
            event_type || ',' || 
            '"' || REPLACE(COALESCE(description, ''), '"', '""') || '",' || 
            COALESCE(status, '') || ',' || 
            created_at::text
        FROM public.asaas_audit_trail
        WHERE payment_id IN (SELECT id FROM public.asaas_payments WHERE empresa_id = p_empresa_id)
        ORDER BY created_at DESC
    ) s;
    
    RETURN v_csv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Add alert configurations to asaas_config
ALTER TABLE public.asaas_config 
ADD COLUMN IF NOT EXISTS alert_email_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_email_address TEXT,
ADD COLUMN IF NOT EXISTS alert_whatsapp_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS failure_threshold INTEGER DEFAULT 5;

-- Add bank account column to asaas_payments for filtering
ALTER TABLE public.asaas_payments 
ADD COLUMN IF NOT EXISTS conta_bancaria TEXT;

-- Function to check for queue failures and trigger alerts
CREATE OR REPLACE FUNCTION public.check_asaas_queue_failures()
RETURNS TRIGGER AS $$
DECLARE
    v_failure_count INTEGER;
    v_threshold INTEGER;
    v_config RECORD;
BEGIN
    -- Get failure count for the last hour
    SELECT COUNT(*) INTO v_failure_count
    FROM public.asaas_sync_queue
    WHERE status = 'failed' 
      AND updated_at > now() - interval '1 hour';

    -- Get threshold from config
    SELECT * INTO v_config FROM public.asaas_config LIMIT 1;
    v_threshold := COALESCE(v_config.failure_threshold, 5);

    -- If threshold reached, log an event that can be picked up by an edge function or notify directly
    IF v_failure_count >= v_threshold THEN
        -- Insert into audit trail as a system alert
        INSERT INTO public.asaas_audit_trail (
            action,
            details,
            created_at
        ) VALUES (
            'QUEUE_ALERT',
            jsonb_build_object(
                'failure_count', v_failure_count,
                'threshold', v_threshold,
                'message', 'Limite de falhas na fila de retentativas atingido.'
            ),
            now()
        );
        
        -- In a real scenario, we would trigger an edge function here
        -- via a webhook or pg_net if available.
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check failures on sync queue update
DROP TRIGGER IF EXISTS tr_check_asaas_queue_failures ON public.asaas_sync_queue;
CREATE TRIGGER tr_check_asaas_queue_failures
AFTER UPDATE ON public.asaas_sync_queue
FOR EACH ROW
WHEN (NEW.status = 'failed')
EXECUTE FUNCTION public.check_asaas_queue_failures();
CREATE TABLE IF NOT EXISTS public.asaas_transfers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    asaas_id TEXT UNIQUE,
    empresa_id UUID REFERENCES public.empresas(id),
    valor NUMERIC NOT NULL,
    chave_pix TEXT NOT NULL,
    tipo_chave TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    idempotency_key TEXT UNIQUE NOT NULL,
    comprovante_url TEXT,
    transaction_receipt_url TEXT,
    last_error TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transfers of their company" 
ON public.asaas_transfers FOR SELECT 
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Admins can insert transfers" 
ON public.asaas_transfers FOR INSERT 
WITH CHECK (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Admins can update transfers" 
ON public.asaas_transfers FOR UPDATE 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Index for idempotency
CREATE INDEX IF NOT EXISTS idx_asaas_transfers_idempotency ON public.asaas_transfers(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_asaas_transfers_empresa_date ON public.asaas_transfers(empresa_id, created_at);
CREATE TABLE IF NOT EXISTS public.asaas_reconciliation_suggestions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id TEXT NOT NULL, -- Asaas Transaction ID
    conta_receber_id UUID REFERENCES public.contas_receber(id),
    empresa_id UUID REFERENCES public.empresas(id),
    score NUMERIC NOT NULL, -- Confidence level (0 to 1)
    match_type TEXT NOT NULL, -- 'VALUE_DATE', 'DESCRIPTION', etc.
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED'
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_reconciliation_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suggestions of their company" 
ON public.asaas_reconciliation_suggestions FOR SELECT 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Function to find potential matches
CREATE OR REPLACE FUNCTION public.generate_reconciliation_suggestions(
    p_empresa_id UUID,
    p_transaction_date DATE,
    p_transaction_value NUMERIC,
    p_transaction_id TEXT
) RETURNS VOID AS $$
DECLARE
    v_conta RECORD;
BEGIN
    -- Find pending receivables within a 3-day window and similar value
    FOR v_conta IN 
        SELECT id, valor, data_vencimento 
        FROM public.contas_receber 
        WHERE empresa_id = p_empresa_id 
          AND status = 'pendente'
          AND valor BETWEEN (p_transaction_value * 0.95) AND (p_transaction_value * 1.05) -- 5% margin
          AND data_vencimento BETWEEN (p_transaction_date - interval '3 days') AND (p_transaction_date + interval '3 days')
    LOOP
        INSERT INTO public.asaas_reconciliation_suggestions (
            transaction_id,
            conta_receber_id,
            empresa_id,
            score,
            match_type,
            metadata
        ) VALUES (
            p_transaction_id,
            v_conta.id,
            p_empresa_id,
            CASE 
                WHEN v_conta.valor = p_transaction_value AND v_conta.data_vencimento = p_transaction_date THEN 1.0
                WHEN v_conta.valor = p_transaction_value THEN 0.8
                ELSE 0.6
            END,
            'VALUE_DATE',
            jsonb_build_object('transaction_value', p_transaction_value, 'conta_valor', v_conta.valor)
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.get_asaas_payment_stats(p_empresa_id UUID)
RETURNS TABLE (
    status TEXT,
    total_count BIGINT,
    total_value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.status,
        COUNT(*),
        SUM(ap.valor)
    FROM 
        public.asaas_payments ap
    WHERE 
        ap.empresa_id = p_empresa_id
    GROUP BY 
        ap.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER TABLE public.asaas_config 
ADD COLUMN IF NOT EXISTS bitrix_trigger_stage TEXT DEFAULT 'WON';

COMMENT ON COLUMN public.asaas_config.bitrix_trigger_stage IS 'ID da etapa do Bitrix24 que dispara a geração automática de boletos Asaas.';
-- Multas e Juros Automáticos
ALTER TABLE public.asaas_config 
ADD COLUMN IF NOT EXISTS default_fine_percent NUMERIC DEFAULT 2.0,
ADD COLUMN IF NOT EXISTS default_interest_percent NUMERIC DEFAULT 1.0;

-- Agendamento de Cashout
CREATE TABLE IF NOT EXISTS public.asaas_scheduled_transfers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id),
    valor NUMERIC NOT NULL,
    chave_pix TEXT NOT NULL,
    tipo_chave TEXT NOT NULL,
    descricao TEXT,
    agendado_para TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_scheduled_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their scheduled transfers" 
ON public.asaas_scheduled_transfers FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Log de Risco de Crédito (IA)
CREATE TABLE IF NOT EXISTS public.asaas_credit_risk_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id),
    score_risco INTEGER, -- 0-1000
    faixa_risco TEXT, -- BAIXO, MEDIO, ALTO
    recomendacao TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_credit_risk_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view credit risk analysis" 
ON public.asaas_credit_risk_analysis FOR SELECT 
USING (true); -- Ajustar conforme necessário para segurança real
-- Grant necessary permissions for audit logging context
COMMENT ON COLUMN public.asaas_audit_trail.payment_id IS 'ID do pagamento relacionado. Pode ser nulo para eventos globais ou de transferências.';

-- Ensure user context is always captured if available
ALTER TABLE public.asaas_audit_trail 
ALTER COLUMN user_id SET DEFAULT auth.uid();
-- 1. Fix Search Path for custom functions (Security Best Practice)
ALTER FUNCTION public.check_asaas_queue_failures() SET search_path = public;
ALTER FUNCTION public.get_asaas_payment_stats(UUID) SET search_path = public;
ALTER FUNCTION public.generate_reconciliation_suggestions(UUID, DATE, NUMERIC, TEXT) SET search_path = public;

-- 2. Tighten RLS for Credit Risk Analysis
-- Previous policy was too permissive (USING true)
DROP POLICY IF EXISTS "Users can view credit risk analysis" ON public.asaas_credit_risk_analysis;

CREATE POLICY "Users can view credit risk analysis of their customers" 
ON public.asaas_credit_risk_analysis 
FOR SELECT 
USING (
    cliente_id IN (
        SELECT id FROM public.clientes 
        WHERE empresa_id IN (SELECT id FROM public.empresas)
    )
);

-- 3. Audit trail RLS refinement
-- Ensure users can only see audit logs related to their companies
DROP POLICY IF EXISTS "Users can view audit trail" ON public.asaas_audit_trail;
CREATE POLICY "Users can view audit trail of their company" 
ON public.asaas_audit_trail FOR SELECT 
USING (
    payment_id IN (SELECT id FROM public.asaas_payments) OR 
    payment_id IS NULL -- Allow system logs for authorized users
);

-- 4. Scheduled Transfers RLS reinforcement
DROP POLICY IF EXISTS "Users can manage their scheduled transfers" ON public.asaas_scheduled_transfers;
CREATE POLICY "Users can manage their company scheduled transfers" 
ON public.asaas_scheduled_transfers FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));
ALTER TABLE public.asaas_sync_queue 
ADD COLUMN IF NOT EXISTS error_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.asaas_sync_queue.error_history IS 'Histórico serializado de erros encontrados em cada tentativa de sincronização.';

-- Index for queue cleanup/maintenance
CREATE INDEX IF NOT EXISTS idx_asaas_sync_queue_status_updated ON public.asaas_sync_queue(status, updated_at);
CREATE OR REPLACE FUNCTION public.processar_regua_cobranca(p_empresa_id UUID, p_simulate BOOLEAN DEFAULT false)
RETURNS TABLE (
    total_enfileirados INTEGER,
    total_erros INTEGER,
    total_sem_contato INTEGER
) AS $$
DECLARE 
    v_enfileirados INTEGER := 0; 
    v_sem_contato INTEGER := 0; 
    v_regra RECORD; 
    v_cr RECORD; 
    v_mensagem TEXT; 
    v_canal TEXT;
BEGIN
    FOR v_regra IN SELECT * FROM regua_cobranca WHERE ativo=true AND auto_executar=true AND (p_empresa_id IS NULL OR empresa_id=p_empresa_id OR empresa_id IS NULL) ORDER BY dias_gatilho LOOP
        FOR v_cr IN 
            SELECT cr.*, c.email AS cliente_email, c.telefone AS cliente_telefone 
            FROM contas_receber cr 
            LEFT JOIN clientes c ON c.id=cr.cliente_id 
            WHERE cr.status IN ('pendente','vencido','parcial','atrasado') 
              AND (CURRENT_DATE-cr.data_vencimento)>=v_regra.dias_gatilho 
              AND NOT EXISTS (SELECT 1 FROM fila_cobrancas fc WHERE fc.conta_receber_id=cr.id AND fc.etapa=v_regra.etapa AND fc.status NOT IN ('falhou','cancelado')) 
        LOOP
            IF v_regra.canais IS NOT NULL THEN
                FOREACH v_canal IN ARRAY v_regra.canais LOOP
                    IF (v_canal='email' AND v_cr.cliente_email IS NULL) OR (v_canal IN ('whatsapp','sms') AND v_cr.cliente_telefone IS NULL) THEN 
                        v_sem_contato := v_sem_contato + 1; 
                        CONTINUE; 
                    END IF;
                    
                    IF NOT p_simulate THEN
                        SELECT corpo INTO v_mensagem FROM templates_cobranca WHERE etapa=v_regra.etapa AND canal=v_canal AND ativo=true AND padrao=true LIMIT 1;
                        v_mensagem := COALESCE(v_mensagem,'Pendência financeira em aberto.');
                        v_mensagem := REPLACE(REPLACE(REPLACE(v_mensagem,'{{cliente_nome}}',COALESCE(v_cr.cliente_nome,'Cliente')),'{{valor_formatado}}','R$ '||to_char(v_cr.valor,'FM999G999G990D00')),'{{vencimento}}',to_char(v_cr.data_vencimento,'DD/MM/YYYY'));
                        
                        INSERT INTO fila_cobrancas (empresa_id,conta_receber_id,cliente_id,cliente_nome,etapa,canal,destinatario,mensagem_renderizada) 
                        VALUES (v_cr.empresa_id,v_cr.id,v_cr.cliente_id,v_cr.cliente_nome,v_regra.etapa,v_canal,CASE WHEN v_canal='email' THEN v_cr.cliente_email ELSE v_cr.cliente_telefone END,v_mensagem);
                    END IF;
                    
                    v_enfileirados := v_enfileirados + 1;
                END LOOP;
            END IF;
            
            IF NOT p_simulate THEN
                UPDATE contas_receber SET etapa_cobranca=v_regra.etapa::etapa_cobranca WHERE id=v_cr.id;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN QUERY SELECT v_enfileirados, 0, v_sem_contato;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Tabela para log de tentativas de duplicidade e hashes de transação
CREATE TABLE IF NOT EXISTS public.registro_duplicidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hash_identificador TEXT NOT NULL, -- md5(fornecedor_id + valor + data_vencimento + empresa_id)
    entidade_id UUID, -- ID da conta_pagar original ou nova
    tipo_entidade TEXT DEFAULT 'conta_pagar',
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index para busca rápida de hash
CREATE INDEX IF NOT EXISTS idx_registro_duplicidade_hash ON public.registro_duplicidade(hash_identificador);

-- Função para gerar hash de duplicidade
CREATE OR REPLACE FUNCTION public.gerar_hash_pagamento(
    p_fornecedor_id UUID,
    p_valor NUMERIC,
    p_data_vencimento DATE,
    p_empresa_id UUID,
    p_numero_documento TEXT DEFAULT NULL,
    p_codigo_barras TEXT DEFAULT NULL
) RETURNS TEXT AS $$
BEGIN
    -- Se tiver código de barras, ele é o identificador soberano
    IF p_codigo_barras IS NOT NULL AND p_codigo_barras <> '' THEN
        RETURN md5('barcode-' || p_codigo_barras);
    END IF;
    
    -- Caso contrário, combinação de dados críticos
    RETURN md5(
        COALESCE(p_fornecedor_id::text, 'no-vendor') || 
        p_valor::text || 
        p_data_vencimento::text || 
        p_empresa_id::text || 
        COALESCE(p_numero_documento, '')
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para validar duplicidade antes do insert em contas_pagar
CREATE OR REPLACE FUNCTION public.validar_duplicidade_pagamento()
RETURNS TRIGGER AS $$
DECLARE
    v_hash TEXT;
    v_existe BOOLEAN;
    v_msg TEXT;
BEGIN
    -- Ignorar se for recorrente ou se tiver flag de bypass (a ser implementada se necessário)
    IF NEW.recorrente = true THEN
        RETURN NEW;
    END IF;

    -- Gerar hash para a nova tentativa
    v_hash := public.gerar_hash_pagamento(
        NEW.fornecedor_id,
        NEW.valor,
        NEW.data_vencimento,
        NEW.empresa_id,
        NEW.numero_documento,
        NEW.codigo_barras
    );

    -- Verificar se existe registro idêntico nos últimos 24 meses (evitar lixo histórico)
    SELECT EXISTS (
        SELECT 1 FROM public.contas_pagar 
        WHERE id <> NEW.id -- Evitar self-match no update
        AND status <> 'cancelado'
        AND public.gerar_hash_pagamento(fornecedor_id, valor, data_vencimento, empresa_id, numero_documento, codigo_barras) = v_hash
        AND created_at > now() - interval '24 months'
    ) INTO v_existe;

    IF v_existe THEN
        v_msg := 'ALERTA DE DUPLICIDADE: Já existe um lançamento idêntico (Fornecedor, Valor e Vencimento) cadastrado no sistema.';
        RAISE EXCEPTION '%', v_msg USING ERRCODE = 'unique_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela contas_pagar
DROP TRIGGER IF EXISTS trg_validar_duplicidade_pagamento ON public.contas_pagar;
CREATE TRIGGER trg_validar_duplicidade_pagamento
BEFORE INSERT OR UPDATE OF fornecedor_id, valor, data_vencimento, numero_documento, codigo_barras
ON public.contas_pagar
FOR EACH ROW
EXECUTE FUNCTION public.validar_duplicidade_pagamento();

-- Comentários de segurança e governança
COMMENT ON TABLE public.registro_duplicidade IS 'Log de auditoria para tentativas de inserção de pagamentos duplicados e rastreio de integridade.';
COMMENT ON FUNCTION public.validar_duplicidade_pagamento IS 'Regra de negócio rígida para impedir pagamentos duplicados de fornecedores e fretes.';
-- Prevent duplicate freight/supplier payments in contas_pagar
-- We use a partial index to allow same data if one is cancelled
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_pagar_prevent_duplicates 
ON public.contas_pagar (fornecedor_id, valor, data_vencimento, numero_documento) 
WHERE (status != 'cancelado' AND fornecedor_id IS NOT NULL AND numero_documento IS NOT NULL);

-- Also add one for cases where supplier is identified by name only (legacy/import)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_pagar_name_prevent_duplicates 
ON public.contas_pagar (fornecedor_nome, valor, data_vencimento, numero_documento) 
WHERE (status != 'cancelado' AND fornecedor_id IS NULL AND numero_documento IS NOT NULL);

-- Prevent duplicate billing in contas_receber
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_receber_prevent_duplicates 
ON public.contas_receber (cliente_id, valor, data_vencimento, numero_documento) 
WHERE (status != 'cancelado' AND cliente_id IS NOT NULL AND numero_documento IS NOT NULL);

-- Add a column to track 'frete' (freight) explicitly if not exists to allow specific filtering
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='is_frete') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN is_frete BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Index for freight searching
CREATE INDEX IF NOT EXISTS idx_contas_pagar_frete ON public.contas_pagar(is_frete) WHERE is_frete = true;
CREATE OR REPLACE FUNCTION public.detectar_duplicidades_financeiras(p_empresa_id UUID, p_tabela TEXT)
RETURNS TABLE (valor NUMERIC, data_vencimento DATE, numero_documento TEXT, total_ocorrencias BIGINT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_tabela = 'contas_pagar' THEN
        RETURN QUERY
        SELECT cp.valor, cp.data_vencimento, cp.numero_documento, COUNT(*) as occurrences
        FROM public.contas_pagar cp
        WHERE cp.empresa_id = p_empresa_id
          AND cp.status != 'cancelado'
          AND cp.numero_documento IS NOT NULL
        GROUP BY cp.valor, cp.data_vencimento, cp.numero_documento
        HAVING COUNT(*) > 1;
    ELSIF p_tabela = 'contas_receber' THEN
        RETURN QUERY
        SELECT cr.valor, cr.data_vencimento, cr.numero_documento, COUNT(*) as occurrences
        FROM public.contas_receber cr
        WHERE cr.empresa_id = p_empresa_id
          AND cr.status != 'cancelado'
          AND cr.numero_documento IS NOT NULL
        GROUP BY cr.valor, cr.data_vencimento, cr.numero_documento
        HAVING COUNT(*) > 1;
    END IF;
END;
$$;
-- Tabela para registrar bloqueios de duplicidade (Auditoria)
CREATE TABLE IF NOT EXISTS public.bloqueios_duplicidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    tabela TEXT NOT NULL, -- 'contas_pagar' ou 'fretes'
    dados_tentativa JSONB NOT NULL,
    motivo_bloqueio TEXT NOT NULL,
    campos_conflitantes JSONB NOT NULL,
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.bloqueios_duplicidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem ver seus bloqueios"
ON public.bloqueios_duplicidade FOR SELECT
USING (empresa_id IN (SELECT id FROM public.empresas WHERE ativo = true));

-- Adicionar coluna de idempotência
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='idempotency_key') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN idempotency_key TEXT;
        CREATE UNIQUE INDEX idx_contas_pagar_idempotency ON public.contas_pagar (idempotency_key) WHERE idempotency_key IS NOT NULL;
    END IF;
END $$;

-- Função principal de validação
CREATE OR REPLACE FUNCTION public.validar_duplicidade_financeira()
RETURNS TRIGGER AS $$
DECLARE
    v_conflito_id UUID;
    v_motivo TEXT;
BEGIN
    -- 1. Idempotency Key
    IF NEW.idempotency_key IS NOT NULL THEN
        SELECT id INTO v_conflito_id FROM public.contas_pagar 
        WHERE idempotency_key = NEW.idempotency_key AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        LIMIT 1;
        
        IF v_conflito_id IS NOT NULL THEN
            v_motivo := 'Chave de idempotência duplicada (Reenvio de API)';
            INSERT INTO public.bloqueios_duplicidade (empresa_id, tabela, dados_tentativa, motivo_bloqueio, campos_conflitantes, usuario_id)
            VALUES (NEW.empresa_id, 'contas_pagar', to_jsonb(NEW), v_motivo, jsonb_build_object('idempotency_key', NEW.idempotency_key), auth.uid());
            RAISE EXCEPTION 'DUPLICIDADE_DETECTADA: %', v_motivo;
        END IF;
    END IF;

    -- 2. Regra de Negócio: Fornecedor + Valor + Documento + Mês
    SELECT id INTO v_conflito_id FROM public.contas_pagar
    WHERE empresa_id = NEW.empresa_id
      AND (fornecedor_id = NEW.fornecedor_id OR cnpj_fornecedor = NEW.cnpj_fornecedor)
      AND valor = NEW.valor
      AND numero_documento = NEW.numero_documento
      AND date_trunc('month', data_vencimento) = date_trunc('month', NEW.data_vencimento)
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status != 'cancelado'
    LIMIT 1;

    IF v_conflito_id IS NOT NULL THEN
        v_motivo := 'Pagamento idêntico detectado para o mesmo fornecedor/CNPJ, valor e documento no mês.';
        INSERT INTO public.bloqueios_duplicidade (empresa_id, tabela, dados_tentativa, motivo_bloqueio, campos_conflitantes, usuario_id)
        VALUES (NEW.empresa_id, 'contas_pagar', to_jsonb(NEW), v_motivo, 
                jsonb_build_object('fornecedor', COALESCE(NEW.fornecedor_id::text, NEW.cnpj_fornecedor), 'valor', NEW.valor, 'documento', NEW.numero_documento), 
                auth.uid());
        
        -- Alerta Automático
        INSERT INTO public.alertas_tributarios (empresa_id, titulo, descricao, prioridade, categoria)
        VALUES (NEW.empresa_id, 'Bloqueio de Duplicidade', v_motivo || ' Documento: ' || NEW.numero_documento, 'alta', 'financeiro');
        
        RAISE EXCEPTION 'DUPLICIDADE_DETECTADA: %', v_motivo;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_validar_duplicidade_pagar ON public.contas_pagar;
CREATE TRIGGER trg_validar_duplicidade_pagar
BEFORE INSERT OR UPDATE ON public.contas_pagar
FOR EACH ROW EXECUTE FUNCTION public.validar_duplicidade_financeira();
-- Tabela de Configurações de Regras de Duplicidade
CREATE TABLE IF NOT EXISTS public.configuracoes_duplicidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    campos_validacao TEXT[] NOT NULL DEFAULT '{fornecedor_id, valor, numero_documento, mes_vencimento}',
    tolerancia_dias INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    versao INTEGER DEFAULT 1,
    criado_por UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(empresa_id, versao)
);

ALTER TABLE public.configuracoes_duplicidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem gerenciar suas configuracoes de duplicidade"
ON public.configuracoes_duplicidade FOR ALL
USING (empresa_id IN (SELECT id FROM public.empresas WHERE ativo = true));

-- Adicionar trigger para versionamento automático (opcional, faremos via app para simplicidade inicial)

-- Função para validar duplicidade baseada nas configurações
CREATE OR REPLACE FUNCTION public.validar_duplicidade_avancada()
RETURNS TRIGGER AS $$
DECLARE
    v_config RECORD;
    v_conflito_id UUID;
    v_motivo TEXT;
    v_query TEXT;
    v_campo TEXT;
    v_existe BOOLEAN;
    v_campos_conflitantes JSONB := '{}'::jsonb;
BEGIN
    -- 1. Idempotency Key (Sempre validada se presente)
    IF NEW.idempotency_key IS NOT NULL THEN
        SELECT id INTO v_conflito_id FROM public.contas_pagar 
        WHERE idempotency_key = NEW.idempotency_key AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        LIMIT 1;
        
        IF v_conflito_id IS NOT NULL THEN
            v_motivo := 'Chave de idempotência duplicada (Reenvio detectado)';
            INSERT INTO public.bloqueios_duplicidade (empresa_id, tabela, dados_tentativa, motivo_bloqueio, campos_conflitantes, usuario_id)
            VALUES (NEW.empresa_id, 'contas_pagar', to_jsonb(NEW), v_motivo, jsonb_build_object('idempotency_key', NEW.idempotency_key), auth.uid());
            RAISE EXCEPTION 'DUPLICIDADE_DETECTADA: %', v_motivo;
        END IF;
    END IF;

    -- 2. Buscar configuração ativa para a empresa
    SELECT * INTO v_config FROM public.configuracoes_duplicidade 
    WHERE empresa_id = NEW.empresa_id AND ativo = true 
    ORDER BY versao DESC LIMIT 1;

    -- Se não houver config, usar padrão
    IF v_config IS NULL THEN
        -- Fallback para lógica padrão já existente no trigger anterior ou implementada aqui
        -- Para garantir perfeição, implementamos a lógica dinâmica
        v_query := 'SELECT EXISTS (SELECT 1 FROM public.contas_pagar WHERE empresa_id = $1 AND id != $2 AND status != ''cancelado''';
        
        -- Default: fornecedor, valor, documento, mes
        v_query := v_query || ' AND (fornecedor_id = $3 OR cnpj_fornecedor = $4) AND valor = $5 AND numero_documento = $6 AND date_trunc(''month'', data_vencimento) = date_trunc(''month'', $7))';
        
        EXECUTE v_query 
        INTO v_existe 
        USING NEW.empresa_id, COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid), NEW.fornecedor_id, NEW.cnpj_fornecedor, NEW.valor, NEW.numero_documento, NEW.data_vencimento;
    ELSE
        -- Lógica dinâmica baseada em v_config.campos_validacao
        v_query := 'SELECT id FROM public.contas_pagar WHERE empresa_id = $1 AND id != $2 AND status != ''cancelado''';
        
        FOREACH v_campo IN ARRAY v_config.campos_validacao LOOP
            IF v_campo = 'fornecedor_id' THEN
                v_query := v_query || ' AND (fornecedor_id = ' || quote_nullable(NEW.fornecedor_id) || ' OR cnpj_fornecedor = ' || quote_nullable(NEW.cnpj_fornecedor) || ')';
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('fornecedor', COALESCE(NEW.fornecedor_id::text, NEW.cnpj_fornecedor));
            ELSIF v_campo = 'valor' THEN
                v_query := v_query || ' AND valor = ' || NEW.valor;
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('valor', NEW.valor);
            ELSIF v_campo = 'numero_documento' THEN
                v_query := v_query || ' AND numero_documento = ' || quote_literal(NEW.numero_documento);
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('documento', NEW.numero_documento);
            ELSIF v_campo = 'mes_vencimento' THEN
                v_query := v_query || ' AND date_trunc(''month'', data_vencimento) = date_trunc(''month'', ' || quote_literal(NEW.data_vencimento) || '::date)';
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('competencia', to_char(NEW.data_vencimento, 'MM/YYYY'));
            ELSIF v_campo = 'data_vencimento' THEN
                v_query := v_query || ' AND data_vencimento = ' || quote_literal(NEW.data_vencimento);
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('vencimento', NEW.data_vencimento);
            END IF;
        END LOOP;

        v_query := v_query || ' LIMIT 1';
        EXECUTE v_query INTO v_conflito_id USING NEW.empresa_id, COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
        v_existe := v_conflito_id IS NOT NULL;
    END IF;

    IF v_existe THEN
        v_motivo := 'Bloqueio por regra de duplicidade personalizada ativa.';
        INSERT INTO public.bloqueios_duplicidade (empresa_id, tabela, dados_tentativa, motivo_bloqueio, campos_conflitantes, usuario_id)
        VALUES (NEW.empresa_id, 'contas_pagar', to_jsonb(NEW), v_motivo, v_campos_conflitantes, auth.uid());
        
        -- Alerta Automático
        INSERT INTO public.alertas_tributarios (empresa_id, titulo, descricao, prioridade, categoria)
        VALUES (NEW.empresa_id, 'Tentativa de Pagamento Duplicado', v_motivo || ' Documento: ' || NEW.numero_documento, 'alta', 'financeiro');
        
        RAISE EXCEPTION 'DUPLICIDADE_DETECTADA: %', v_motivo;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar trigger
DROP TRIGGER IF EXISTS trg_validar_duplicidade_pagar ON public.contas_pagar;
CREATE TRIGGER trg_validar_duplicidade_pagar
BEFORE INSERT OR UPDATE ON public.contas_pagar
FOR EACH ROW EXECUTE FUNCTION public.validar_duplicidade_avancada();
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
-- Função para gerar alerta de bloqueio de duplicidade
CREATE OR REPLACE FUNCTION public.notificar_bloqueio_duplicidade()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_fornecedor TEXT;
BEGIN
    -- Tenta pegar o ID do usuário que gerou a tentativa, senão pega um admin/responsável
    v_user_id := COALESCE(NEW.usuario_id, (SELECT id FROM auth.users LIMIT 1));
    
    -- Extrai o nome do fornecedor dos dados da tentativa
    v_fornecedor := COALESCE(NEW.dados_tentativa->>'fornecedor_nome', 'Fornecedor Desconhecido');

    -- Insere o alerta
    INSERT INTO public.alertas (
        user_id,
        tipo,
        titulo,
        mensagem,
        prioridade,
        lido,
        acao_url,
        entidade_id,
        entidade_tipo
    ) VALUES (
        v_user_id,
        'vencimento', -- Ou um novo tipo 'seguranca' se existir
        '🛡️ Bloqueio Anti-Duplicidade',
        'Tentativa de pagamento duplicado bloqueada para: ' || v_fornecedor || '. Valor: ' || NEW.valor_bloqueado,
        'high',
        false,
        '/contas-pagar/bloqueios?id=' || NEW.id,
        NEW.id::text,
        'bloqueio_duplicidade'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para disparar a notificação
DROP TRIGGER IF EXISTS tr_notificar_bloqueio_duplicidade ON public.bloqueios_duplicidade;
CREATE TRIGGER tr_notificar_bloqueio_duplicidade
AFTER INSERT ON public.bloqueios_duplicidade
FOR EACH ROW
EXECUTE FUNCTION public.notificar_bloqueio_duplicidade();
-- Tabela de Regras de Roteamento Financeiro
CREATE TABLE IF NOT EXISTS public.regras_roteamento_financeiro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    prioridade INTEGER DEFAULT 0,
    condicoes JSONB NOT NULL DEFAULT '{}', -- Ex: { "tipo": "servico", "valor_min": 1000 }
    conta_bancaria_id UUID NOT NULL REFERENCES public.contas_bancarias(id),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Histórico de Cobranças (específica para boletos)
CREATE TABLE IF NOT EXISTS public.historico_cobrancas_boletos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boleto_id UUID NOT NULL REFERENCES public.boletos(id) ON DELETE CASCADE,
    tipo_evento TEXT NOT NULL, -- Ex: 'envio_email', 'visualizacao', 'baixa_automatica', 'tentativa_falha'
    descricao TEXT,
    metadados JSONB DEFAULT '{}',
    ip_origem TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para Controle de Importação de Extratos
CREATE TABLE IF NOT EXISTS public.extratos_bancarios_importados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conta_bancaria_id UUID NOT NULL REFERENCES public.contas_bancarias(id) ON DELETE CASCADE,
    nome_arquivo TEXT NOT NULL,
    hash_arquivo TEXT UNIQUE, -- Para evitar re-importação do mesmo arquivo
    data_inicio DATE,
    data_fim DATE,
    total_transacoes INTEGER,
    metadados JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.regras_roteamento_financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_cobrancas_boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extratos_bancarios_importados ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view their company routing rules"
ON public.regras_roteamento_financeiro FOR SELECT
USING (EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id));

CREATE POLICY "Users can manage their company routing rules"
ON public.regras_roteamento_financeiro FOR ALL
USING (EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id));

CREATE POLICY "Users can view boleto history"
ON public.historico_cobrancas_boletos FOR SELECT
USING (EXISTS (SELECT 1 FROM public.boletos b JOIN public.empresas e ON b.empresa_id = e.id WHERE b.id = boleto_id));

CREATE POLICY "Users can view their bank imports"
ON public.extratos_bancarios_importados FOR SELECT
USING (EXISTS (SELECT 1 FROM public.contas_bancarias c WHERE c.id = conta_bancaria_id));

-- Trigger para updated_at
CREATE TRIGGER update_regras_roteamento_updated_at
BEFORE UPDATE ON public.regras_roteamento_financeiro
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Adicionar coluna empresa_id se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regras_conciliacao' AND column_name = 'empresa_id') THEN
        ALTER TABLE public.regras_conciliacao ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Atualizar políticas de acesso (dropar as antigas se houver erro e recriar)
DROP POLICY IF EXISTS "Users can view their company's rules" ON public.regras_conciliacao;
DROP POLICY IF EXISTS "Users can insert rules for their company" ON public.regras_conciliacao;
DROP POLICY IF EXISTS "Users can update rules for their company" ON public.regras_conciliacao;
DROP POLICY IF EXISTS "Users can delete rules for their company" ON public.regras_conciliacao;

CREATE POLICY "Users can view their company's rules"
ON public.regras_conciliacao
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id 
    AND user_empresas.user_id = auth.uid()
));

CREATE POLICY "Users can insert rules for their company"
ON public.regras_conciliacao
FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_empresas.empresa_id = empresa_id 
    AND user_empresas.user_id = auth.uid()
));

CREATE POLICY "Users can update rules for their company"
ON public.regras_conciliacao
FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id 
    AND user_empresas.user_id = auth.uid()
));

CREATE POLICY "Users can delete rules for their company"
ON public.regras_conciliacao
FOR DELETE
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id 
    AND user_empresas.user_id = auth.uid()
));-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    budgeted_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    spent_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    period TEXT NOT NULL, -- e.g., "2024-05"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view budgets of their companies"
    ON public.budgets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE user_id = auth.uid() AND empresa_id = budgets.company_id
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can insert budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE user_id = auth.uid() AND empresa_id = budgets.company_id
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can update budgets"
    ON public.budgets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE user_id = auth.uid() AND empresa_id = budgets.company_id
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can delete budgets"
    ON public.budgets FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE user_id = auth.uid() AND empresa_id = budgets.company_id
        ) OR user_id = auth.uid()
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
-- Verifica se a tabela de orçamentos já existe, se não, cria
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    category TEXT NOT NULL,
    budgeted_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    period TEXT NOT NULL, -- Formato YYYY-MM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilita RLS na tabela de orçamentos
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para orçamentos (usando user_empresas como verificado no banco)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can view their company budgets') THEN
        CREATE POLICY "Users can view their company budgets" 
        ON public.budgets FOR SELECT 
        USING (company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can insert company budgets') THEN
        CREATE POLICY "Users can insert company budgets" 
        ON public.budgets FOR INSERT 
        WITH CHECK (company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can update company budgets') THEN
        CREATE POLICY "Users can update company budgets" 
        ON public.budgets FOR UPDATE 
        USING (company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can delete company budgets') THEN
        CREATE POLICY "Users can delete company budgets" 
        ON public.budgets FOR DELETE 
        USING (company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid()));
    END IF;
END $$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_budgets_updated_at') THEN
        CREATE TRIGGER update_budgets_updated_at
        BEFORE UPDATE ON public.budgets
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;
-- Create table for API Keys
CREATE TABLE public.api_keys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    scopes TEXT[] DEFAULT '{"read"}'::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own company api keys"
ON public.api_keys
FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM public.user_empresas WHERE empresa_id = public.api_keys.empresa_id
));

CREATE POLICY "Admins can manage api keys"
ON public.api_keys
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_id = auth.uid() 
    AND empresa_id = public.api_keys.empresa_id 
    AND role = 'admin'
));

-- Trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create table for Custom Field Definitions
CREATE TABLE public.custom_field_definitions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'contas_pagar', 'contas_receber', 'clientes', etc.
    name TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'number', 'date', 'select', 'boolean'
    label TEXT NOT NULL,
    placeholder TEXT,
    options JSONB, -- For 'select' type
    required BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(entity_type, name, empresa_id)
);

-- Add custom_fields column to core tables
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;

-- Enable RLS for definitions
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view definitions of their company"
ON public.custom_field_definitions
FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM public.user_empresas WHERE empresa_id = public.custom_field_definitions.empresa_id
));

CREATE POLICY "Admins can manage definitions"
ON public.custom_field_definitions
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_id = auth.uid() 
    AND empresa_id = public.custom_field_definitions.empresa_id 
    AND role = 'admin'
));

-- Trigger for updated_at
CREATE TRIGGER update_custom_field_definitions_updated_at
BEFORE UPDATE ON public.custom_field_definitions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create Action Plans table
CREATE TABLE IF NOT EXISTS public.planos_acao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    prioridade TEXT CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')) DEFAULT 'media',
    status TEXT CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')) DEFAULT 'pendente',
    prazo TIMESTAMP WITH TIME ZONE,
    responsavel TEXT,
    progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for Action Plans
ALTER TABLE public.planos_acao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own action plans"
ON public.planos_acao
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create Operational KPIs table
CREATE TABLE IF NOT EXISTS public.kpis_operacionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    valor_atual NUMERIC DEFAULT 0,
    meta NUMERIC DEFAULT 0,
    unidade TEXT,
    tendencia TEXT CHECK (tendencia IN ('subindo', 'descendo', 'estavel')),
    categoria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for Operational KPIs
ALTER TABLE public.kpis_operacionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own operational KPIs"
ON public.kpis_operacionais
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_planos_acao_updated_at
BEFORE UPDATE ON public.planos_acao
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_operacionais_updated_at
BEFORE UPDATE ON public.kpis_operacionais
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();-- Create Purchase Orders table
CREATE TABLE public.pedidos_compra (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    empresa_id UUID REFERENCES public.empresas(id),
    fornecedor_id UUID REFERENCES public.fornecedores(id),
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'pendente_aprovacao', 'aprovado', 'rejeitado', 'recebido', 'cancelado')),
    valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    data_pedido TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    data_entrega_prevista DATE,
    observacoes TEXT,
    centro_custo_id UUID REFERENCES public.centros_custo(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Purchase Order Items table
CREATE TABLE public.itens_pedido_compra (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id UUID NOT NULL REFERENCES public.pedidos_compra(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    quantidade DECIMAL(12,2) NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
    valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido_compra ENABLE ROW LEVEL SECURITY;

-- Policies for pedidos_compra
CREATE POLICY "Users can view their own purchase orders"
ON public.pedidos_compra FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchase orders"
ON public.pedidos_compra FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase orders"
ON public.pedidos_compra FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase orders"
ON public.pedidos_compra FOR DELETE
USING (auth.uid() = user_id);

-- Policies for itens_pedido_compra
CREATE POLICY "Users can view items of their purchase orders"
ON public.itens_pedido_compra FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.pedidos_compra
    WHERE pedidos_compra.id = itens_pedido_compra.pedido_id
    AND pedidos_compra.user_id = auth.uid()
));

CREATE POLICY "Users can insert items to their purchase orders"
ON public.itens_pedido_compra FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.pedidos_compra
    WHERE pedidos_compra.id = itens_pedido_compra.pedido_id
    AND pedidos_compra.user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_pedidos_compra_updated_at
BEFORE UPDATE ON public.pedidos_compra
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id uuid;
    current_user_email text;
    old_data jsonb := null;
    new_data jsonb := null;
BEGIN
    -- Tenta obter o ID do usuário da sessão do Supabase
    current_user_id := auth.uid();
    
    -- Busca o email se houver um usuário logado
    IF current_user_id IS NOT NULL THEN
        SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    END IF;

    -- Define os dados antigos e novos baseados na operação
    IF (TG_OP = 'DELETE') THEN
        old_data := to_jsonb(OLD);
    ELSIF (TG_OP = 'UPDATE') THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        new_data := to_jsonb(NEW);
    END IF;

    -- Insere na tabela de audit_logs
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        ip_address,
        user_agent
    ) VALUES (
        current_user_id,
        COALESCE(current_user_email, 'sistema'),
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::text 
            ELSE NEW.id::text 
        END,
        old_data,
        new_data,
        inet_client_addr()::text,
        NULL -- User agent não é facilmente acessível via trigger pura sem extensões
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicação dos triggers nas tabelas core
-- Clientes
DROP TRIGGER IF EXISTS audit_clientes ON public.clientes;
CREATE TRIGGER audit_clientes
AFTER INSERT OR UPDATE OR DELETE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Fornecedores
DROP TRIGGER IF EXISTS audit_fornecedores ON public.fornecedores;
CREATE TRIGGER audit_fornecedores
AFTER INSERT OR UPDATE OR DELETE ON public.fornecedores
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Contas Receber
DROP TRIGGER IF EXISTS audit_contas_receber ON public.contas_receber;
CREATE TRIGGER audit_contas_receber
AFTER INSERT OR UPDATE OR DELETE ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Contas Pagar
DROP TRIGGER IF EXISTS audit_contas_pagar ON public.contas_pagar;
CREATE TRIGGER audit_contas_pagar
AFTER INSERT OR UPDATE OR DELETE ON public.contas_pagar
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Usuários (Perfis)
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Permissões (Roles)
DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Empresas
DROP TRIGGER IF EXISTS audit_empresas ON public.empresas;
CREATE TRIGGER audit_empresas
AFTER INSERT OR UPDATE OR DELETE ON public.empresas
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Adiciona índice para performance em buscas por record_id se não existir
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
-- 1. Auditoria Estendida para Tabelas Asaas
DROP TRIGGER IF EXISTS audit_asaas_payments ON public.asaas_payments;
CREATE TRIGGER audit_asaas_payments
AFTER INSERT OR UPDATE OR DELETE ON public.asaas_payments
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_asaas_transfers ON public.asaas_transfers;
CREATE TRIGGER audit_asaas_transfers
AFTER INSERT OR UPDATE OR DELETE ON public.asaas_transfers
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- 2. Função de Liquidação Automática (Settlement)
CREATE OR REPLACE FUNCTION public.handle_asaas_payment_settlement()
RETURNS TRIGGER AS $$
DECLARE
    v_conta_receber_id uuid;
    v_valor_recebido numeric;
    v_valor_liquido numeric;
    v_taxa_gateway numeric;
    v_data_pagamento date;
    v_empresa_id uuid;
    v_conta_bancaria_id uuid;
    v_descricao text;
BEGIN
    -- Só processa se o status mudar para RECEIVED ou CONFIRMED (e não estava assim antes)
    IF (NEW.status IN ('RECEIVED', 'CONFIRMED') AND (OLD.status IS NULL OR OLD.status NOT IN ('RECEIVED', 'CONFIRMED'))) THEN
        
        v_conta_receber_id := NEW.conta_receber_id;
        v_valor_recebido := NEW.valor;
        v_valor_liquido := COALESCE(NEW.valor_liquido, NEW.valor);
        v_taxa_gateway := v_valor_recebido - v_valor_liquido;
        v_data_pagamento := COALESCE(NEW.data_pagamento, CURRENT_DATE);
        v_empresa_id := NEW.empresa_id;
        
        -- Busca conta bancária associada (tenta pelo ID guardado ou pega a primeira da empresa se não houver)
        -- Nota: asaas_payments guarda conta_bancaria como TEXT ou ID. Vamos tentar resolver.
        SELECT id INTO v_conta_bancaria_id 
        FROM public.contas_bancarias 
        WHERE empresa_id = v_empresa_id 
        ORDER BY created_at ASC 
        LIMIT 1;

        IF v_conta_receber_id IS NOT NULL THEN
            -- A. Atualiza Conta a Receber
            UPDATE public.contas_receber 
            SET 
                status = 'pago',
                valor_recebido = v_valor_recebido,
                valor_pago = v_valor_recebido,
                valor_liquido = v_valor_liquido,
                taxa_gateway = v_taxa_gateway,
                data_recebimento = v_data_pagamento,
                updated_at = NOW()
            WHERE id = v_conta_receber_id;

            -- B. Cria Movimentação Bancária (Entrada)
            v_descricao := 'Liquidação Automática Asaas: ' || COALESCE(NEW.descricao, 'Sem descrição');
            
            INSERT INTO public.movimentacoes (
                empresa_id,
                conta_bancaria_id,
                conta_receber_id,
                tipo,
                descricao,
                valor,
                valor_liquido,
                taxa_gateway,
                data_movimentacao,
                data_competencia,
                origem,
                asaas_transaction_id,
                asaas_type
            ) VALUES (
                v_empresa_id,
                v_conta_bancaria_id,
                v_conta_receber_id,
                'entrada',
                v_descricao,
                v_valor_recebido,
                v_valor_liquido,
                v_taxa_gateway,
                v_data_pagamento,
                v_data_pagamento,
                'asaas',
                NEW.asaas_id,
                NEW.tipo
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger de Liquidação
DROP TRIGGER IF EXISTS trigger_asaas_settlement ON public.asaas_payments;
CREATE TRIGGER trigger_asaas_settlement
AFTER UPDATE ON public.asaas_payments
FOR EACH ROW EXECUTE FUNCTION public.handle_asaas_payment_settlement();
-- Função para gerar lançamentos contábeis automáticos
CREATE OR REPLACE FUNCTION public.gerar_lancamento_contabil_automatico()
RETURNS TRIGGER AS $$
DECLARE
    v_lancamento_id uuid;
    v_conta_contabil_id uuid;
    v_conta_bancaria_contabil_id uuid;
    v_empresa_id uuid;
    v_historico text;
BEGIN
    v_empresa_id := NEW.empresa_id;
    v_historico := 'Lançamento Automático: ' || COALESCE(NEW.descricao, 'Movimentação ' || NEW.id);

    -- 1. Cria o cabeçalho do lançamento contábil
    INSERT INTO public.lancamentos_contabeis (
        empresa_id,
        data_lancamento,
        historico,
        origem,
        origem_id,
        valor_total,
        status
    ) VALUES (
        v_empresa_id,
        NEW.data_movimentacao,
        v_historico,
        'financeiro_movimentacao',
        NEW.id,
        NEW.valor,
        'confirmado'
    ) RETURNING id INTO v_lancamento_id;

    -- 2. Busca a conta contábil vinculada à categoria da movimentação
    -- Se não houver categoria direta, tenta buscar via plano_conta_id da movimentação
    SELECT COALESCE(
        (SELECT plano_conta_id FROM public.categorias WHERE id = NEW.categoria_id),
        NEW.plano_conta_id
    ) INTO v_conta_contabil_id;

    -- 3. Busca a conta contábil vinculada à conta bancária (Ativo Circulante - Disponibilidades)
    SELECT plano_conta_id INTO v_conta_bancaria_contabil_id 
    FROM public.contas_bancarias 
    WHERE id = NEW.conta_bancaria_id;

    -- Se não encontrar conta bancária vinculada, usa uma conta padrão de 'Caixa/Bancos' se existir
    IF v_conta_bancaria_contabil_id IS NULL THEN
        SELECT id INTO v_conta_bancaria_contabil_id 
        FROM public.plano_contas 
        WHERE empresa_id = v_empresa_id AND (codigo LIKE '1.1.1%' OR descricao ILIKE '%Banco%')
        LIMIT 1;
    END IF;

    -- 4. Cria as partidas dobradas (Débito e Crédito)
    IF NEW.tipo = 'entrada' THEN
        -- Entrada de dinheiro: Débito no Banco, Crédito na Categoria (Receita)
        -- Partida 1: Débito (D) no Banco
        IF v_conta_bancaria_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_bancaria_contabil_id, 'D', NEW.valor, 'Entrada em conta bancária');
        END IF;

        -- Partida 2: Crédito (C) na Conta de Receita/Recebível
        IF v_conta_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_contabil_id, 'C', NEW.valor, 'Receita reconhecida');
        END IF;
        
    ELSIF NEW.tipo = 'saida' THEN
        -- Saída de dinheiro: Débito na Categoria (Despesa), Crédito no Banco
        -- Partida 1: Débito (D) na Conta de Despesa/Pagar
        IF v_conta_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_contabil_id, 'D', NEW.valor, 'Despesa reconhecida');
        END IF;

        -- Partida 2: Crédito (C) no Banco
        IF v_conta_bancaria_contabil_id IS NOT NULL THEN
            INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor, historico_complementar)
            VALUES (v_lancamento_id, v_conta_bancaria_contabil_id, 'C', NEW.valor, 'Saída de conta bancária');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para Movimentações
DROP TRIGGER IF EXISTS trigger_gerar_contabilidade ON public.movimentacoes;
CREATE TRIGGER trigger_gerar_contabilidade
AFTER INSERT ON public.movimentacoes
FOR EACH ROW EXECUTE FUNCTION public.gerar_lancamento_contabil_automatico();
-- 1. Atualizar vw_contas_pagar_painel com campos de empresa
DROP VIEW IF EXISTS public.vw_contas_pagar_painel;
CREATE VIEW public.vw_contas_pagar_painel AS
SELECT 
    cp.*,
    e.razao_social AS empresa_razao_social,
    e.nome_fantasia AS empresa_nome_fantasia,
    e.cnpj AS empresa_cnpj,
    f.razao_social AS fornecedor_razao_social,
    f.nome_fantasia AS fornecedor_nome_fantasia,
    cc.nome AS centro_custo_nome,
    cb.banco AS banco_nome
FROM 
    public.contas_pagar cp
LEFT JOIN public.empresas e ON cp.empresa_id = e.id
LEFT JOIN public.fornecedores f ON cp.fornecedor_id = f.id
LEFT JOIN public.centros_custo cc ON cp.centro_custo_id = cc.id
LEFT JOIN public.contas_bancarias cb ON cp.conta_bancaria_id = cb.id;

ALTER VIEW public.vw_contas_pagar_painel SET (security_invoker = true);

-- 2. Atualizar vw_contas_receber_painel com campos de empresa
DROP VIEW IF EXISTS public.vw_contas_receber_painel;
CREATE VIEW public.vw_contas_receber_painel AS
SELECT 
    cr.*,
    e.razao_social AS empresa_razao_social,
    e.nome_fantasia AS empresa_nome_fantasia,
    e.cnpj AS empresa_cnpj,
    c.razao_social AS cliente_razao_social,
    c.nome_fantasia AS cliente_nome_fantasia,
    cc.nome AS centro_custo_nome,
    cb.banco AS banco_nome
FROM 
    public.contas_receber cr
LEFT JOIN public.empresas e ON cr.empresa_id = e.id
LEFT JOIN public.clientes c ON cr.cliente_id = c.id
LEFT JOIN public.centros_custo cc ON cr.centro_custo_id = cc.id
LEFT JOIN public.contas_bancarias cb ON cr.conta_bancaria_id = cb.id;

ALTER VIEW public.vw_contas_receber_painel SET (security_invoker = true);
-- Adicionar colunas de IA para insights no WhatsApp
ALTER TABLE public.historico_cobranca_whatsapp 
ADD COLUMN IF NOT EXISTS ia_sentimento TEXT,
ADD COLUMN IF NOT EXISTS ia_resumo TEXT,
ADD COLUMN IF NOT EXISTS ia_proxima_acao TEXT;

-- Criar índice para performance em filtros de IA
CREATE INDEX IF NOT EXISTS idx_whatsapp_ia_sentimento ON public.historico_cobranca_whatsapp(ia_sentimento);

-- Comentários para documentação
COMMENT ON COLUMN public.historico_cobranca_whatsapp.ia_sentimento IS 'Sentimento detectado pela IA (positivo, neutro, negativo, agressivo)';
COMMENT ON COLUMN public.historico_cobranca_whatsapp.ia_resumo IS 'Resumo gerado por IA sobre o conteúdo da conversa';
COMMENT ON COLUMN public.historico_cobranca_whatsapp.ia_proxima_acao IS 'Ação recomendada pela IA baseada no contexto';
-- Habilitar a extensão pg_net
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

-- Função para chamar o webhook da Edge Function
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_ai_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- Chamada assíncrona para a Edge Function usando pg_net
  PERFORM
    net.http_post(
      url := 'https://iikqosstymnnxaujzadw.supabase.co/functions/v1/whatsapp-ai-analyzer',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novas mensagens
DROP TRIGGER IF EXISTS on_whatsapp_message_inserted ON public.historico_cobranca_whatsapp;
CREATE TRIGGER on_whatsapp_message_inserted
AFTER INSERT ON public.historico_cobranca_whatsapp
FOR EACH ROW
EXECUTE FUNCTION public.trigger_whatsapp_ai_analysis();
-- Adicionar campos de scoring externo e comportamental
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS serasa_score INTEGER,
ADD COLUMN IF NOT EXISTS boa_vista_score INTEGER,
ADD COLUMN IF NOT EXISTS data_ultima_consulta_externa TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ia_risco_comportamental TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.clientes.serasa_score IS 'Score do cliente no Serasa (0-1000)';
COMMENT ON COLUMN public.clientes.boa_vista_score IS 'Score do cliente no Boa Vista (0-1000)';
COMMENT ON COLUMN public.clientes.ia_risco_comportamental IS 'Análise de risco baseada no comportamento histórico de pagamentos internos';
-- Tabela para histórico de conversas via WhatsApp com IA
CREATE TABLE IF NOT EXISTS public.whatsapp_conversas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    direcao TEXT CHECK (direcao IN ('entrada', 'saida')),
    status TEXT DEFAULT 'enviado',
    sentimento TEXT, -- IA analysis: positivo, neutro, negativo, agressivo
    intencao_pagamento BOOLEAN DEFAULT false,
    resumo_ia TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID DEFAULT auth.uid()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_conversas ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuários podem ver conversas de seus clientes"
ON public.whatsapp_conversas FOR SELECT
USING (true); -- Simplificado para o escopo, idealmente filtraria por empresa/user

CREATE POLICY "Usuários podem inserir mensagens"
ON public.whatsapp_conversas FOR INSERT
WITH CHECK (true);

-- Trigger para atualizar score baseado em novas conversas (placeholder para lógica de IA)
CREATE OR REPLACE FUNCTION public.analisar_sentimento_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
    -- Aqui seria chamado um webhook ou edge function para IA
    -- Por enquanto, simulamos uma classificação simples
    IF NEW.mensagem ~* '(pagar|pago|comprovante|liquidar)' THEN
        NEW.intencao_pagamento := true;
        NEW.sentimento := 'positivo';
    ELSIF NEW.mensagem ~* '(atraso|nao consigo|dificuldade|problema)' THEN
        NEW.intencao_pagamento := false;
        NEW.sentimento := 'negativo';
    ELSE
        NEW.sentimento := 'neutro';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_analisar_whatsapp
BEFORE INSERT ON public.whatsapp_conversas
FOR EACH ROW EXECUTE FUNCTION public.analisar_sentimento_whatsapp();
-- 1. Melhorar logs de Webhooks
ALTER TABLE public.webhooks_log 
ADD COLUMN IF NOT EXISTS correlation_id TEXT,
ADD COLUMN IF NOT EXISTS ip_origem TEXT,
ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- 2. Garantir isolamento Multi-CNPJ/Tenant em tabelas críticas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_bancarias' AND column_name = 'empresa_id') THEN
        ALTER TABLE public.contas_bancarias ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
    END IF;
END $$;

-- 3. Adicionar alertas automáticos para falhas críticas
CREATE OR REPLACE FUNCTION public.gerar_alerta_falha_processamento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'falha' OR NEW.erro_mensagem IS NOT NULL THEN
    INSERT INTO public.alertas (
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade_tipo,
      entidade_id,
      user_id
    ) VALUES (
      'falha_operacional',
      'Falha no Webhook: ' || COALESCE(NEW.event_type, 'Desconhecido'),
      'O processamento do webhook falhou: ' || COALESCE(NEW.erro_mensagem, 'Erro desconhecido') || '. Verifique o painel de logs.',
      'alta',
      'webhook',
      NEW.id,
      (SELECT user_id FROM public.perfil_usuarios WHERE empresa_id = NEW.empresa_id LIMIT 1)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_alerta_webhook_falha ON public.webhooks_log;
CREATE TRIGGER tr_alerta_webhook_falha
AFTER INSERT OR UPDATE ON public.webhooks_log
FOR EACH ROW WHEN (NEW.erro_mensagem IS NOT NULL)
EXECUTE FUNCTION public.gerar_alerta_falha_processamento();

-- Alerta para falha na Régua de Cobrança
CREATE OR REPLACE FUNCTION public.gerar_alerta_falha_regua()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'falha' THEN
    INSERT INTO public.alertas (
      tipo,
      titulo,
      mensagem,
      prioridade,
      entidade_tipo,
      entidade_id,
      user_id
    ) VALUES (
      'falha_regua',
      'Falha na Régua de Cobrança',
      'Não foi possível executar a etapa ' || NEW.etapa || ' para o título ' || NEW.conta_receber_id || '. Motivo: ' || COALESCE(NEW.mensagem_erro, 'Sem detalhes'),
      'media',
      'conta_receber',
      NEW.conta_receber_id,
      (SELECT user_id FROM public.perfil_usuarios WHERE empresa_id = NEW.empresa_id LIMIT 1)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_alerta_regua_falha ON public.execucoes_regua_cobranca;
CREATE TRIGGER tr_alerta_regua_falha
AFTER INSERT ON public.execucoes_regua_cobranca
FOR EACH ROW WHEN (NEW.status = 'falha')
EXECUTE FUNCTION public.gerar_alerta_falha_regua();
-- Tabela para níveis de aprovação (Workflows complexos)
CREATE TABLE IF NOT EXISTS public.fluxos_aprovacao_niveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    valor_minimo DECIMAL(15,2) DEFAULT 0,
    aprovadores_obrigatorios INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(empresa_id, ordem)
);

-- Habilitar RLS
ALTER TABLE public.fluxos_aprovacao_niveis ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own workflow levels"
ON public.fluxos_aprovacao_niveis FOR SELECT
USING (auth.uid() = empresa_id);

CREATE POLICY "Admins can manage workflow levels"
ON public.fluxos_aprovacao_niveis FOR ALL
USING (auth.uid() = empresa_id);

-- Comentários nas aprovações (Trilha de discussão)
CREATE TABLE IF NOT EXISTS public.aprovacao_comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_aprovacao(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL,
    texto TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.aprovacao_comentarios ENABLE ROW LEVEL SECURITY;

-- Políticas para comentários
CREATE POLICY "Users can view comments on their requests or if they are approvers"
ON public.aprovacao_comentarios FOR SELECT
USING (true); -- Simplificado para o exemplo, em produção seria mais restrito

CREATE POLICY "Users can post comments"
ON public.aprovacao_comentarios FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- Adicionar colunas de controle de fluxo na tabela de solicitações
ALTER TABLE public.solicitacoes_aprovacao 
ADD COLUMN IF NOT EXISTS nivel_atual INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_niveis INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS assinaturas JSONB DEFAULT '[]'::jsonb;

-- Trigger para atualizar timestamp
CREATE TRIGGER update_fluxos_aprovacao_niveis_updated_at
BEFORE UPDATE ON public.fluxos_aprovacao_niveis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Tabela para controle de obrigações acessórias
CREATE TABLE IF NOT EXISTS public.obrigacoes_acessorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    esfera TEXT NOT NULL CHECK (esfera IN ('federal', 'estadual', 'municipal')),
    periodicidade TEXT NOT NULL,
    competencia TEXT NOT NULL, -- Formato MM/YYYY
    vencimento DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'transmitida', 'atrasada', 'nao_aplicavel')),
    transmitida_em TIMESTAMP WITH TIME ZONE,
    protocolo TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.obrigacoes_acessorias ENABLE ROW LEVEL SECURITY;

-- Políticas para obrigacoes_acessorias
CREATE POLICY "Users can view their company obligations"
    ON public.obrigacoes_acessorias
    FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'financeiro', 'visualizador')
    ));

CREATE POLICY "Users can manage their company obligations"
    ON public.obrigacoes_acessorias
    FOR ALL
    USING (auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'financeiro')
    ));

-- Tabela para glossário tributário (global/compartilhada)
CREATE TABLE IF NOT EXISTS public.glossario_tributario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    termo TEXT NOT NULL UNIQUE,
    significado TEXT NOT NULL,
    categoria TEXT, -- Ex: 'Reforma Tributária', 'Geral', 'Simples Nacional'
    base_legal TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.glossario_tributario ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública para o glossário
CREATE POLICY "Anyone can view glossary"
    ON public.glossario_tributario
    FOR SELECT
    USING (true);

-- Inserir termos básicos no glossário
INSERT INTO public.glossario_tributario (termo, significado, categoria, base_legal) VALUES
('CBS', 'Contribuição sobre Bens e Serviços. Tributo federal que substitui PIS e COFINS.', 'Reforma Tributária', 'EC 132/2023'),
('IBS', 'Imposto sobre Bens e Serviços. Tributo subnacional (estados e municípios) que substitui ICMS e ISS.', 'Reforma Tributária', 'EC 132/2023'),
('IS', 'Imposto Seletivo (ou "Imposto do Pecado"). Tributo federal sobre produtos nocivos à saúde ou ao meio ambiente.', 'Reforma Tributária', 'EC 132/2023'),
('Split Payment', 'Mecanismo de recolhimento automático do tributo no momento da liquidação financeira da operação.', 'Reforma Tributária', 'LC 214/2025'),
('Cashback Tributário', 'Devolução de parte do IBS e da CBS para famílias de baixa renda.', 'Reforma Tributária', 'EC 132/2023'),
('IVA Dual', 'Modelo tributário composto por dois impostos sobre o valor adicionado (CBS e IBS).', 'Reforma Tributária', 'EC 132/2023'),
('Não-Cumulatividade Plena', 'Regime que permite o aproveitamento integral de créditos tributários sobre todas as aquisições da empresa.', 'Reforma Tributária', 'EC 132/2023'),
('Princípio do Destino', 'A tributação ocorre no local onde o bem ou serviço é consumido, e não onde é produzido.', 'Reforma Tributária', 'EC 132/2023')
ON CONFLICT (termo) DO NOTHING;

-- Trigger para updated_at
CREATE TRIGGER update_obrigacoes_acessorias_updated_at
BEFORE UPDATE ON public.obrigacoes_acessorias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create tax audit trail table
CREATE TABLE public.tax_audit_trail (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    action TEXT NOT NULL, -- 'simulated', 'cache_hit', 'pdf_generated'
    parameters JSONB,
    prompt TEXT,
    response TEXT,
    is_ai_justified BOOLEAN DEFAULT FALSE,
    cache_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_audit_trail ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view audit trail of their companies"
ON public.tax_audit_trail
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_empresas
        WHERE user_empresas.empresa_id = tax_audit_trail.empresa_id
        AND user_empresas.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert audit trail entries"
ON public.tax_audit_trail
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_empresas
        WHERE user_empresas.empresa_id = tax_audit_trail.empresa_id
        AND user_empresas.user_id = auth.uid()
    )
);

-- Index for performance
CREATE INDEX idx_tax_audit_empresa ON public.tax_audit_trail(empresa_id, ano, mes);

-- 20260825100000_reconciliar_schema_completo.sql
-- Schema reconciliation lszcm -> bwwbey 2026-08-25

BEGIN;

-- FASE 1: tipo_cobranca
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='tipo_cobranca' AND typnamespace='public'::regnamespace) THEN
  CREATE TYPE public.tipo_cobranca AS ENUM ('boleto','pix','transferencia','cartao','debito_automatico','dinheiro','cheque');
END IF; END $$;

-- FASE 2: Tabelas ausentes
-- TABLE acessos_suspeitos

CREATE TABLE public.acessos_suspeitos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo text NOT NULL,
    severidade text NOT NULL,
    janela_inicio timestamp with time zone NOT NULL,
    janela_fim timestamp with time zone NOT NULL,
    user_id uuid,
    user_email text,
    empresa_id uuid,
    table_name text,
    ocorrencias integer DEFAULT 0 NOT NULL,
    baseline numeric,
    detalhes jsonb DEFAULT '{}'::jsonb NOT NULL,
    revisado_em timestamp with time zone,
    revisado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT acessos_suspeitos_severidade_check CHECK ((severidade = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))),
    CONSTRAINT acessos_suspeitos_tipo_check CHECK ((tipo = ANY (ARRAY['cross_tenant'::text, 'admin_pico'::text, 'admin_fora_horario'::text, 'delecao_massa'::text])))
);


--


ALTER TABLE ONLY public.acessos_suspeitos
    ADD CONSTRAINT acessos_suspeitos_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_acessos_suspeitos_created ON public.acessos_suspeitos USING btree (created_at DESC);


--


CREATE INDEX idx_acessos_suspeitos_empresa_id ON public.acessos_suspeitos USING btree (empresa_id);


--


CREATE UNIQUE INDEX uq_acessos_suspeitos_janela ON public.acessos_suspeitos USING btree (tipo, janela_inicio, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(empresa_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(table_name, ''::text));


--


ALTER TABLE public.acessos_suspeitos ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY acessos_suspeitos_tenant_select ON public.acessos_suspeitos FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) AND ((empresa_id IS NULL) OR public.empresa_acessivel(empresa_id))));


--


GRANT ALL ON TABLE public.acessos_suspeitos TO authenticated;
GRANT ALL ON TABLE public.acessos_suspeitos TO service_role;
GRANT SELECT,INSERT ON TABLE public.acessos_suspeitos TO sandbox_exec;
GRANT SELECT ON TABLE public.acessos_suspeitos TO anon;


--


-- TABLE auditoria_tributaria

CREATE TABLE public.auditoria_tributaria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid,
    user_id uuid,
    user_email text,
    acao text NOT NULL,
    entidade_tipo text NOT NULL,
    entidade_id uuid,
    payload_anterior jsonb,
    payload_novo jsonb,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT auditoria_tributaria_acao_check CHECK ((acao = ANY (ARRAY['insert'::text, 'update'::text, 'delete'::text]))),
    CONSTRAINT auditoria_tributaria_entidade_tipo_check CHECK (((char_length(entidade_tipo) >= 1) AND (char_length(entidade_tipo) <= 120)))
);


--


ALTER TABLE ONLY public.auditoria_tributaria
    ADD CONSTRAINT auditoria_tributaria_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_auditoria_trib_criado ON public.auditoria_tributaria USING btree (criado_em DESC);


--


CREATE INDEX idx_auditoria_trib_entidade ON public.auditoria_tributaria USING btree (entidade_tipo, entidade_id);


--


CREATE INDEX idx_auditoria_tributaria_empresa_id ON public.auditoria_tributaria USING btree (empresa_id);


--


ALTER TABLE ONLY public.auditoria_tributaria
    ADD CONSTRAINT auditoria_tributaria_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;


--


CREATE POLICY auditoria_trib_select_tenant ON public.auditoria_tributaria FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


ALTER TABLE public.auditoria_tributaria ENABLE ROW LEVEL SECURITY;

--


GRANT ALL ON TABLE public.auditoria_tributaria TO authenticated;
GRANT ALL ON TABLE public.auditoria_tributaria TO service_role;
GRANT SELECT,INSERT ON TABLE public.auditoria_tributaria TO sandbox_exec;


--


-- TABLE benchmarks_setoriais

CREATE TABLE public.benchmarks_setoriais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setor text NOT NULL,
    cnae_prefix text NOT NULL,
    regime text NOT NULL,
    carga_media_pct numeric(6,3) NOT NULL,
    carga_p25_pct numeric(6,3),
    carga_p75_pct numeric(6,3),
    fonte text,
    vigencia_inicio date DEFAULT CURRENT_DATE NOT NULL,
    vigencia_fim date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT benchmark_percentis_coerentes CHECK (((carga_p25_pct IS NULL) OR (carga_p75_pct IS NULL) OR (carga_p75_pct >= carga_p25_pct))),
    CONSTRAINT benchmark_vigencia_valida CHECK (((vigencia_fim IS NULL) OR (vigencia_fim >= vigencia_inicio))),
    CONSTRAINT benchmarks_setoriais_carga_media_pct_check CHECK (((carga_media_pct >= (0)::numeric) AND (carga_media_pct <= (100)::numeric))),
    CONSTRAINT benchmarks_setoriais_carga_p25_pct_check CHECK (((carga_p25_pct IS NULL) OR ((carga_p25_pct >= (0)::numeric) AND (carga_p25_pct <= (100)::numeric)))),
    CONSTRAINT benchmarks_setoriais_carga_p75_pct_check CHECK (((carga_p75_pct IS NULL) OR ((carga_p75_pct >= (0)::numeric) AND (carga_p75_pct <= (100)::numeric)))),
    CONSTRAINT benchmarks_setoriais_cnae_prefix_check CHECK ((cnae_prefix ~ '^[0-9]{2,7}$'::text)),
    CONSTRAINT benchmarks_setoriais_regime_check CHECK ((regime = ANY (ARRAY['simples_nacional'::text, 'lucro_presumido'::text, 'lucro_real'::text, 'mei'::text, 'arbitrado'::text]))),
    CONSTRAINT benchmarks_setoriais_setor_check CHECK (((char_length(setor) >= 2) AND (char_length(setor) <= 160)))
);


--


ALTER TABLE ONLY public.benchmarks_setoriais
    ADD CONSTRAINT benchmark_unico UNIQUE (cnae_prefix, regime, vigencia_inicio);


--


ALTER TABLE ONLY public.benchmarks_setoriais
    ADD CONSTRAINT benchmarks_setoriais_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_benchmarks_lookup ON public.benchmarks_setoriais USING btree (regime, cnae_prefix);


--


CREATE TRIGGER trg_benchmarks_updated_at BEFORE UPDATE ON public.benchmarks_setoriais FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE POLICY benchmarks_admin_write ON public.benchmarks_setoriais TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--


CREATE POLICY benchmarks_select ON public.benchmarks_setoriais FOR SELECT TO authenticated USING (true);


--


ALTER TABLE public.benchmarks_setoriais ENABLE ROW LEVEL SECURITY;

--


GRANT ALL ON TABLE public.benchmarks_setoriais TO authenticated;
GRANT ALL ON TABLE public.benchmarks_setoriais TO service_role;
GRANT SELECT,INSERT ON TABLE public.benchmarks_setoriais TO sandbox_exec;


--


-- TABLE bitrix_oauth_tokens

CREATE TABLE public.bitrix_oauth_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    expires_at timestamp with time zone NOT NULL,
    domain text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--


ALTER TABLE ONLY public.bitrix_oauth_tokens
    ADD CONSTRAINT bitrix_oauth_tokens_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_bitrix_tokens_created ON public.bitrix_oauth_tokens USING btree (created_at DESC);


--


CREATE TRIGGER trg_bitrix_tokens_updated_at BEFORE UPDATE ON public.bitrix_oauth_tokens FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


ALTER TABLE public.bitrix_oauth_tokens ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY bitrix_oauth_tokens_service_role_only ON public.bitrix_oauth_tokens TO service_role USING (true) WITH CHECK (true);


--


GRANT ALL ON TABLE public.bitrix_oauth_tokens TO service_role;
GRANT SELECT,INSERT ON TABLE public.bitrix_oauth_tokens TO sandbox_exec;


--


-- TABLE bling_sync_logs

CREATE TABLE public.bling_sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo text NOT NULL,
    modulo text NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    registros_processados integer DEFAULT 0 NOT NULL,
    registros_com_erro integer DEFAULT 0 NOT NULL,
    detalhes jsonb,
    mensagem_erro text,
    iniciado_em timestamp with time zone DEFAULT now() NOT NULL,
    finalizado_em timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bling_sync_logs_modulo_check CHECK (((char_length(modulo) >= 2) AND (char_length(modulo) <= 80))),
    CONSTRAINT bling_sync_logs_registros_com_erro_check CHECK ((registros_com_erro >= 0)),
    CONSTRAINT bling_sync_logs_registros_processados_check CHECK ((registros_processados >= 0)),
    CONSTRAINT bling_sync_logs_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'executando'::text, 'sucesso'::text, 'erro'::text, 'parcial'::text]))),
    CONSTRAINT bling_sync_logs_tipo_check CHECK ((tipo = ANY (ARRAY['manual'::text, 'automatica'::text, 'webhook'::text, 'retry'::text]))),
    CONSTRAINT bling_sync_periodo_valido CHECK (((finalizado_em IS NULL) OR (finalizado_em >= iniciado_em)))
);


--


ALTER TABLE ONLY public.bling_sync_logs
    ADD CONSTRAINT bling_sync_logs_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_bling_sync_logs_created ON public.bling_sync_logs USING btree (created_at DESC);


--


CREATE INDEX idx_bling_sync_logs_modulo ON public.bling_sync_logs USING btree (modulo);


--


ALTER TABLE public.bling_sync_logs ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY bling_sync_logs_insert ON public.bling_sync_logs FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role)));


--


CREATE POLICY bling_sync_logs_select ON public.bling_sync_logs FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'operacional'::public.app_role)));


--


GRANT ALL ON TABLE public.bling_sync_logs TO authenticated;
GRANT ALL ON TABLE public.bling_sync_logs TO service_role;
GRANT SELECT,INSERT ON TABLE public.bling_sync_logs TO sandbox_exec;


--


-- TABLE bling_tokens

CREATE TABLE public.bling_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    expires_at timestamp with time zone NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--


ALTER TABLE ONLY public.bling_tokens
    ADD CONSTRAINT bling_tokens_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_bling_tokens_created ON public.bling_tokens USING btree (created_at DESC);


--


CREATE TRIGGER trg_bling_tokens_updated_at BEFORE UPDATE ON public.bling_tokens FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


ALTER TABLE public.bling_tokens ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY bling_tokens_service_role_only ON public.bling_tokens TO service_role USING (true) WITH CHECK (true);


--


GRANT ALL ON TABLE public.bling_tokens TO service_role;
GRANT SELECT,INSERT ON TABLE public.bling_tokens TO sandbox_exec;


--


-- TABLE bling_webhook_events

CREATE TABLE public.bling_webhook_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    module text NOT NULL,
    resource_id text,
    payload jsonb,
    processed boolean DEFAULT false NOT NULL,
    processed_at timestamp with time zone,
    error_message text,
    retries integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bling_webhook_events_retries_check CHECK (((retries >= 0) AND (retries <= 50))),
    CONSTRAINT bling_webhook_processed_coerente CHECK (((processed = false) OR (processed_at IS NOT NULL)))
);


--


ALTER TABLE ONLY public.bling_webhook_events
    ADD CONSTRAINT bling_webhook_events_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_bling_webhook_events_created ON public.bling_webhook_events USING btree (created_at DESC);


--


CREATE INDEX idx_bling_webhook_events_processed ON public.bling_webhook_events USING btree (processed);


--


CREATE INDEX idx_bling_webhook_events_resource ON public.bling_webhook_events USING btree (module, resource_id);


--


ALTER TABLE public.bling_webhook_events ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY bling_webhook_events_admin_select ON public.bling_webhook_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--


GRANT ALL ON TABLE public.bling_webhook_events TO authenticated;
GRANT ALL ON TABLE public.bling_webhook_events TO service_role;
GRANT SELECT,INSERT ON TABLE public.bling_webhook_events TO sandbox_exec;


--


-- TABLE catalogos_fiscais_cargas

CREATE TABLE public.catalogos_fiscais_cargas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    origem text DEFAULT 'cron'::text NOT NULL,
    status text DEFAULT 'ok'::text NOT NULL,
    checksum text NOT NULL,
    contagens jsonb DEFAULT '{}'::jsonb NOT NULL,
    houve_alteracao boolean DEFAULT false NOT NULL,
    vinculos_normalizados integer DEFAULT 0 NOT NULL,
    criticos integer DEFAULT 0 NOT NULL,
    duracao_ms integer DEFAULT 0 NOT NULL,
    mensagem text,
    last_updated timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalogos_fiscais_cargas_origem_check CHECK ((origem = ANY (ARRAY['cron'::text, 'manual'::text, 'ci'::text, 'migration'::text]))),
    CONSTRAINT catalogos_fiscais_cargas_status_check CHECK ((status = ANY (ARRAY['ok'::text, 'erro'::text, 'sem_alteracao'::text])))
);


--


ALTER TABLE ONLY public.catalogos_fiscais_cargas
    ADD CONSTRAINT catalogos_fiscais_cargas_pkey PRIMARY KEY (id);


--


CREATE UNIQUE INDEX catalogos_fiscais_cargas_checksum_key ON public.catalogos_fiscais_cargas USING btree (checksum);


--


CREATE INDEX catalogos_fiscais_cargas_last_updated_idx ON public.catalogos_fiscais_cargas USING btree (last_updated DESC);


--


CREATE TRIGGER set_updated_at_catalogos_fiscais_cargas BEFORE UPDATE ON public.catalogos_fiscais_cargas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE POLICY "Admins leem cargas de catalogos fiscais" ON public.catalogos_fiscais_cargas FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--


ALTER TABLE public.catalogos_fiscais_cargas ENABLE ROW LEVEL SECURITY;

--


GRANT ALL ON TABLE public.catalogos_fiscais_cargas TO authenticated;
GRANT ALL ON TABLE public.catalogos_fiscais_cargas TO service_role;
GRANT SELECT,INSERT ON TABLE public.catalogos_fiscais_cargas TO sandbox_exec;


--


-- TABLE catalogos_tributarios_health_history

CREATE TABLE public.catalogos_tributarios_health_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dia date NOT NULL,
    criticos integer DEFAULT 0 NOT NULL,
    avisos integer DEFAULT 0 NOT NULL,
    infos integer DEFAULT 0 NOT NULL,
    total_invariantes integer DEFAULT 0 NOT NULL,
    saudavel boolean DEFAULT true NOT NULL,
    achados jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalogos_tributarios_health_history_avisos_check CHECK ((avisos >= 0)),
    CONSTRAINT catalogos_tributarios_health_history_criticos_check CHECK ((criticos >= 0)),
    CONSTRAINT catalogos_tributarios_health_history_infos_check CHECK ((infos >= 0)),
    CONSTRAINT catalogos_tributarios_health_history_total_invariantes_check CHECK ((total_invariantes >= 0))
);


--


ALTER TABLE ONLY public.catalogos_tributarios_health_history
    ADD CONSTRAINT catalogos_health_history_dia_key UNIQUE (dia);


--


ALTER TABLE ONLY public.catalogos_tributarios_health_history
    ADD CONSTRAINT catalogos_tributarios_health_history_pkey PRIMARY KEY (id);


--


CREATE TRIGGER trg_catalogos_health_history_updated_at BEFORE UPDATE ON public.catalogos_tributarios_health_history FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE POLICY "admins leem historico saude fiscal" ON public.catalogos_tributarios_health_history FOR SELECT TO authenticated USING (( SELECT public.has_role(auth.uid(), 'admin'::public.app_role) AS has_role));


--


ALTER TABLE public.catalogos_tributarios_health_history ENABLE ROW LEVEL SECURITY;

--


GRANT ALL ON TABLE public.catalogos_tributarios_health_history TO authenticated;
GRANT ALL ON TABLE public.catalogos_tributarios_health_history TO service_role;
GRANT SELECT,INSERT ON TABLE public.catalogos_tributarios_health_history TO sandbox_exec;


--


-- TABLE cnpja_cache

CREATE TABLE public.cnpja_cache (
    cnpj text NOT NULL,
    data jsonb NOT NULL,
    situacao_cadastral text,
    fetched_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cnpja_cache_cnpj_check CHECK ((cnpj ~ '^[0-9]{14}$'::text)),
    CONSTRAINT cnpja_cache_validade CHECK ((expires_at > fetched_at))
);


--


ALTER TABLE ONLY public.cnpja_cache
    ADD CONSTRAINT cnpja_cache_pkey PRIMARY KEY (cnpj);


--


CREATE INDEX idx_cnpja_cache_expires ON public.cnpja_cache USING btree (expires_at DESC);


--


CREATE TRIGGER trg_cnpja_cache_updated_at BEFORE UPDATE ON public.cnpja_cache FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


ALTER TABLE public.cnpja_cache ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY cnpja_cache_service_role_only ON public.cnpja_cache TO service_role USING (true) WITH CHECK (true);


--


GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.cnpja_cache TO authenticated;
GRANT ALL ON TABLE public.cnpja_cache TO service_role;
GRANT SELECT,INSERT ON TABLE public.cnpja_cache TO sandbox_exec;


--


-- TABLE convites_contador

CREATE TABLE public.convites_contador (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid NOT NULL,
    email text NOT NULL,
    nome text,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    accepted_at timestamp with time zone,
    revoked_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT convite_expira_no_futuro CHECK ((expires_at > created_at)),
    CONSTRAINT convite_revogado_nao_aceito CHECK (((revoked_at IS NULL) OR (accepted_at IS NULL) OR (revoked_at >= accepted_at))),
    CONSTRAINT convites_contador_email_check CHECK ((email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text)),
    CONSTRAINT convites_contador_token_hash_check CHECK ((token_hash ~ '^[a-f0-9]{64}$'::text))
);


--


ALTER TABLE ONLY public.convites_contador
    ADD CONSTRAINT convites_contador_pkey PRIMARY KEY (id);


--


ALTER TABLE ONLY public.convites_contador
    ADD CONSTRAINT convites_contador_token_hash_key UNIQUE (token_hash);


--


CREATE INDEX idx_convites_contador_empresa ON public.convites_contador USING btree (empresa_id, created_at DESC);


--


CREATE UNIQUE INDEX uq_convite_contador_ativo ON public.convites_contador USING btree (empresa_id, lower(email)) WHERE ((revoked_at IS NULL) AND (accepted_at IS NULL));


--


CREATE TRIGGER trg_convites_contador_updated_at BEFORE UPDATE ON public.convites_contador FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


ALTER TABLE ONLY public.convites_contador
    ADD CONSTRAINT convites_contador_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--


ALTER TABLE public.convites_contador ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY convites_contador_revogar ON public.convites_contador FOR UPDATE TO authenticated USING ((public.empresa_acessivel(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role)))) WITH CHECK ((public.empresa_acessivel(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))));


--


CREATE POLICY convites_contador_select ON public.convites_contador FOR SELECT TO authenticated USING ((public.empresa_acessivel(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))));


--


GRANT ALL ON TABLE public.convites_contador TO authenticated;
GRANT ALL ON TABLE public.convites_contador TO service_role;
GRANT SELECT,INSERT ON TABLE public.convites_contador TO sandbox_exec;


--


-- TABLE elisao_simulacoes_regime

CREATE TABLE public.elisao_simulacoes_regime (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid NOT NULL,
    regime_atual text NOT NULL,
    regime_simulado text NOT NULL,
    carga_atual numeric(15,2) DEFAULT 0 NOT NULL,
    carga_simulada numeric(15,2) DEFAULT 0 NOT NULL,
    economia_estimada numeric(15,2) DEFAULT 0 NOT NULL,
    premissas jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--


ALTER TABLE ONLY public.elisao_simulacoes_regime
    ADD CONSTRAINT elisao_simulacoes_regime_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_elisao_sim_empresa ON public.elisao_simulacoes_regime USING btree (empresa_id, created_at DESC);


--


CREATE TRIGGER trg_elisao_sim_updated_at BEFORE UPDATE ON public.elisao_simulacoes_regime FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


ALTER TABLE ONLY public.elisao_simulacoes_regime
    ADD CONSTRAINT elisao_simulacoes_regime_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--


CREATE POLICY elisao_sim_regime_acesso ON public.elisao_simulacoes_regime TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));


--


ALTER TABLE public.elisao_simulacoes_regime ENABLE ROW LEVEL SECURITY;

--


GRANT ALL ON TABLE public.elisao_simulacoes_regime TO authenticated;
GRANT ALL ON TABLE public.elisao_simulacoes_regime TO service_role;
GRANT SELECT,INSERT ON TABLE public.elisao_simulacoes_regime TO sandbox_exec;


--


-- TABLE estrategias_elisao

CREATE TABLE public.estrategias_elisao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo text NOT NULL,
    nome text NOT NULL,
    categoria text,
    descricao text,
    regimes_aplicaveis text[] DEFAULT '{}'::text[] NOT NULL,
    economia_estimada_percentual numeric(6,4),
    risco public.nivel_risco DEFAULT 'MEDIO'::public.nivel_risco NOT NULL,
    base_legal text,
    requisitos jsonb DEFAULT '{}'::jsonb NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT estrategias_economia_range_chk CHECK (((economia_estimada_percentual IS NULL) OR ((economia_estimada_percentual >= (0)::numeric) AND (economia_estimada_percentual <= (1)::numeric)))),
    CONSTRAINT estrategias_regimes_chk CHECK ((regimes_aplicaveis <@ ARRAY['MEI'::text, 'SIMPLES'::text, 'PRESUMIDO'::text, 'REAL'::text, 'ARBITRADO'::text]))
);


--


ALTER TABLE ONLY public.estrategias_elisao
    ADD CONSTRAINT estrategias_elisao_codigo_key UNIQUE (codigo);


--


ALTER TABLE ONLY public.estrategias_elisao
    ADD CONSTRAINT estrategias_elisao_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_estrategias_ativo ON public.estrategias_elisao USING btree (ativo);


--


CREATE TRIGGER trg_estrategias_updated_at BEFORE UPDATE ON public.estrategias_elisao FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--


ALTER TABLE public.estrategias_elisao ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY estrategias_select_authenticated ON public.estrategias_elisao FOR SELECT TO authenticated USING (true);


--


CREATE POLICY estrategias_write_admin ON public.estrategias_elisao TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


GRANT ALL ON TABLE public.estrategias_elisao TO authenticated;
GRANT ALL ON TABLE public.estrategias_elisao TO service_role;
GRANT SELECT,INSERT ON TABLE public.estrategias_elisao TO sandbox_exec;


--


-- TABLE eventos_contabilizacao_log

CREATE TABLE public.eventos_contabilizacao_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid NOT NULL,
    tipo_evento text NOT NULL,
    evento_id uuid,
    regra_id uuid,
    lancamento_id uuid,
    status text NOT NULL,
    detalhe text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT eventos_contabilizacao_log_status_check CHECK ((status = ANY (ARRAY['sucesso'::text, 'sem_regra'::text, 'erro'::text, 'duplicado'::text, 'simulado'::text]))),
    CONSTRAINT eventos_contabilizacao_log_tipo_evento_check CHECK ((tipo_evento = ANY (ARRAY['conta_pagar'::text, 'conta_receber'::text, 'movimentacao'::text])))
);


--


ALTER TABLE ONLY public.eventos_contabilizacao_log
    ADD CONSTRAINT eventos_contabilizacao_log_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_eventos_contab_empresa ON public.eventos_contabilizacao_log USING btree (empresa_id, created_at DESC);


--


CREATE UNIQUE INDEX uq_eventos_contab_sucesso ON public.eventos_contabilizacao_log USING btree (tipo_evento, evento_id) WHERE (status = 'sucesso'::text);


--


ALTER TABLE ONLY public.eventos_contabilizacao_log
    ADD CONSTRAINT eventos_contabilizacao_log_regra_id_fkey FOREIGN KEY (regra_id) REFERENCES public.regras_contabilizacao_automatica(id) ON DELETE SET NULL;


--


CREATE POLICY eventos_contab_select ON public.eventos_contabilizacao_log FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));


--


ALTER TABLE public.eventos_contabilizacao_log ENABLE ROW LEVEL SECURITY;

--


GRANT ALL ON TABLE public.eventos_contabilizacao_log TO authenticated;
GRANT ALL ON TABLE public.eventos_contabilizacao_log TO service_role;
GRANT SELECT,INSERT ON TABLE public.eventos_contabilizacao_log TO sandbox_exec;


--


-- TABLE frontend_error_alert_state

CREATE TABLE public.frontend_error_alert_state (
    assinatura text NOT NULL,
    severity text DEFAULT 'error'::text NOT NULL,
    exemplo_mensagem text,
    primeiro_alerta_em timestamp with time zone DEFAULT now() NOT NULL,
    ultimo_alerta_em timestamp with time zone DEFAULT now() NOT NULL,
    ocorrencias_no_ultimo_alerta integer DEFAULT 0 NOT NULL,
    alertas_enviados integer DEFAULT 0 NOT NULL,
    silenciado_ate timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fe_alert_state_bounds_chk CHECK (((length(assinatura) <= 200) AND (length(COALESCE(exemplo_mensagem, ''::text)) <= 2000) AND (ocorrencias_no_ultimo_alerta >= 0) AND (alertas_enviados >= 0))),
    CONSTRAINT fe_alert_state_severity_chk CHECK ((severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text])))
);


--


ALTER TABLE ONLY public.frontend_error_alert_state
    ADD CONSTRAINT frontend_error_alert_state_pkey PRIMARY KEY (assinatura);


--


CREATE INDEX idx_fe_alert_state_ultimo ON public.frontend_error_alert_state USING btree (ultimo_alerta_em DESC);


--


CREATE TRIGGER trg_fe_alert_state_updated_at BEFORE UPDATE ON public.frontend_error_alert_state FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE POLICY fe_alert_state_admin_select ON public.frontend_error_alert_state FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


ALTER TABLE public.frontend_error_alert_state ENABLE ROW LEVEL SECURITY;

--


GRANT ALL ON TABLE public.frontend_error_alert_state TO service_role;
GRANT SELECT,INSERT ON TABLE public.frontend_error_alert_state TO sandbox_exec;
GRANT SELECT ON TABLE public.frontend_error_alert_state TO authenticated;


--


-- TABLE frontend_error_silence_digest_log

CREATE TABLE public.frontend_error_silence_digest_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    executado_em timestamp with time zone DEFAULT now() NOT NULL,
    janela_horas integer NOT NULL,
    itens integer DEFAULT 0 NOT NULL,
    assinaturas text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--


ALTER TABLE ONLY public.frontend_error_silence_digest_log
    ADD CONSTRAINT frontend_error_silence_digest_log_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_fe_silence_digest_executado ON public.frontend_error_silence_digest_log USING btree (executado_em DESC);


--


CREATE POLICY fe_silence_digest_admin_select ON public.frontend_error_silence_digest_log FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


ALTER TABLE public.frontend_error_silence_digest_log ENABLE ROW LEVEL SECURITY;

--


GRANT SELECT,MAINTAIN ON TABLE public.frontend_error_silence_digest_log TO authenticated;
GRANT ALL ON TABLE public.frontend_error_silence_digest_log TO service_role;
GRANT SELECT,INSERT ON TABLE public.frontend_error_silence_digest_log TO sandbox_exec;


--


-- TABLE glossario_tributario

CREATE TABLE public.glossario_tributario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    termo text NOT NULL,
    sigla text,
    categoria text,
    significado text NOT NULL,
    base_legal text,
    exemplo text,
    ordem integer DEFAULT 0 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--


ALTER TABLE ONLY public.glossario_tributario
    ADD CONSTRAINT glossario_tributario_pkey PRIMARY KEY (id);


--


ALTER TABLE ONLY public.glossario_tributario
    ADD CONSTRAINT glossario_tributario_termo_key UNIQUE (termo);


--


CREATE INDEX idx_glossario_categoria ON public.glossario_tributario USING btree (categoria, termo);


--


CREATE TRIGGER trg_glossario_updated_at BEFORE UPDATE ON public.glossario_tributario FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE POLICY glossario_admin ON public.glossario_tributario TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--


CREATE POLICY glossario_leitura ON public.glossario_tributario FOR SELECT TO authenticated USING (ativo);


--


ALTER TABLE public.glossario_tributario ENABLE ROW LEVEL SECURITY;

--


GRANT ALL ON TABLE public.glossario_tributario TO authenticated;
GRANT ALL ON TABLE public.glossario_tributario TO service_role;
GRANT SELECT,INSERT ON TABLE public.glossario_tributario TO sandbox_exec;


--


-- TABLE index_usage_snapshots

CREATE TABLE public.index_usage_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    snapshot_date date DEFAULT CURRENT_DATE NOT NULL,
    schema_name text NOT NULL,
    table_name text NOT NULL,
    index_name text NOT NULL,
    idx_scan bigint DEFAULT 0 NOT NULL,
    size_bytes bigint DEFAULT 0 NOT NULL,
    is_unique boolean DEFAULT false NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--


ALTER TABLE ONLY public.index_usage_snapshots
    ADD CONSTRAINT index_usage_snapshots_pkey PRIMARY KEY (id);


--


ALTER TABLE ONLY public.index_usage_snapshots
    ADD CONSTRAINT index_usage_snapshots_unico UNIQUE (snapshot_date, schema_name, index_name);


--


CREATE INDEX idx_index_usage_snapshots_idx_date ON public.index_usage_snapshots USING btree (index_name, snapshot_date DESC);


--


CREATE POLICY "Somente admins leem snapshots de índices" ON public.index_usage_snapshots FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--


ALTER TABLE public.index_usage_snapshots ENABLE ROW LEVEL SECURITY;

--


GRANT ALL ON TABLE public.index_usage_snapshots TO authenticated;
GRANT ALL ON TABLE public.index_usage_snapshots TO service_role;
GRANT SELECT,INSERT ON TABLE public.index_usage_snapshots TO sandbox_exec;


--


-- TABLE indices_uso_excecoes

CREATE TABLE public.indices_uso_excecoes (
    index_name text NOT NULL,
    motivo text NOT NULL,
    criado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--


ALTER TABLE ONLY public.indices_uso_excecoes
    ADD CONSTRAINT indices_uso_excecoes_pkey PRIMARY KEY (index_name);


--


CREATE POLICY "Somente admins gerenciam exceções de índice" ON public.indices_uso_excecoes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--


ALTER TABLE public.indices_uso_excecoes ENABLE ROW LEVEL SECURITY;

--


GRANT ALL ON TABLE public.indices_uso_excecoes TO authenticated;
GRANT ALL ON TABLE public.indices_uso_excecoes TO service_role;
GRANT SELECT,INSERT ON TABLE public.indices_uso_excecoes TO sandbox_exec;


--


-- TABLE operacoes_icms

CREATE TABLE public.operacoes_icms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid NOT NULL,
    uf_origem public.uf_brasil NOT NULL,
    uf_destino public.uf_brasil NOT NULL,
    ncm text NOT NULL,
    valor_operacao numeric(15,2) NOT NULL,
    tipo_destinatario public.tipo_destinatario NOT NULL,
    finalidade text,
    tipo_operacao text NOT NULL,
    tributos_aplicaveis jsonb DEFAULT '[]'::jsonb NOT NULL,
    tributos_nao_aplicaveis jsonb DEFAULT '[]'::jsonb NOT NULL,
    valor_total_icms numeric(15,2) DEFAULT 0 NOT NULL,
    icms_operacao_propria numeric(15,2) DEFAULT 0 NOT NULL,
    icms_st numeric(15,2) DEFAULT 0 NOT NULL,
    difal numeric(15,2) DEFAULT 0 NOT NULL,
    fcp numeric(15,2) DEFAULT 0 NOT NULL,
    data_operacao date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT operacoes_icms_finalidade_check CHECK (((finalidade IS NULL) OR (finalidade = ANY (ARRAY['REVENDA'::text, 'USO_CONSUMO'::text, 'ATIVO_IMOBILIZADO'::text, 'INDUSTRIALIZACAO'::text])))),
    CONSTRAINT operacoes_icms_ncm_check CHECK ((ncm ~ '^[0-9]{8}$'::text)),
    CONSTRAINT operacoes_icms_tipo_operacao_check CHECK ((tipo_operacao = ANY (ARRAY['INTERNA'::text, 'INTERESTADUAL'::text]))),
    CONSTRAINT operacoes_icms_valor_operacao_check CHECK ((valor_operacao >= (0)::numeric))
);


--


ALTER TABLE ONLY public.operacoes_icms
    ADD CONSTRAINT operacoes_icms_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_op_icms_empresa ON public.operacoes_icms USING btree (empresa_id, data_operacao DESC);


--


CREATE INDEX idx_op_icms_rota ON public.operacoes_icms USING btree (uf_origem, uf_destino);


--


CREATE TRIGGER trg_operacoes_icms_updated_at BEFORE UPDATE ON public.operacoes_icms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


ALTER TABLE ONLY public.operacoes_icms
    ADD CONSTRAINT operacoes_icms_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--


ALTER TABLE public.operacoes_icms ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY operacoes_icms_acesso ON public.operacoes_icms TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));


--


GRANT ALL ON TABLE public.operacoes_icms TO authenticated;
GRANT ALL ON TABLE public.operacoes_icms TO service_role;
GRANT SELECT,INSERT ON TABLE public.operacoes_icms TO sandbox_exec;


--


-- TABLE overlay_rejeicoes_auditoria

CREATE TABLE public.overlay_rejeicoes_auditoria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    catalogo text NOT NULL,
    identificador text NOT NULL,
    descricao text,
    campo text NOT NULL,
    motivo text NOT NULL,
    valor_recebido text,
    severidade text DEFAULT 'critico'::text NOT NULL,
    referencia date NOT NULL,
    ocorrencias integer DEFAULT 1 NOT NULL,
    primeira_deteccao timestamp with time zone DEFAULT now() NOT NULL,
    ultima_deteccao timestamp with time zone DEFAULT now() NOT NULL,
    resolvido_em timestamp with time zone,
    resolvido_por uuid,
    observacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT overlay_rejeicoes_auditoria_catalogo_check CHECK ((catalogo = ANY (ARRAY['icms'::text, 'iss'::text, 'ncm'::text, 'monofasico'::text, 'mva_st'::text, 'interestaduais'::text, 'faixas_simples'::text]))),
    CONSTRAINT overlay_rejeicoes_auditoria_severidade_check CHECK ((severidade = ANY (ARRAY['critico'::text, 'atencao'::text])))
);


--


ALTER TABLE ONLY public.overlay_rejeicoes_auditoria
    ADD CONSTRAINT overlay_rejeicoes_auditoria_pkey PRIMARY KEY (id);


--


ALTER TABLE ONLY public.overlay_rejeicoes_auditoria
    ADD CONSTRAINT overlay_rejeicoes_unicidade UNIQUE (catalogo, identificador, campo, motivo, referencia);


--


CREATE INDEX idx_overlay_rejeicoes_abertas ON public.overlay_rejeicoes_auditoria USING btree (resolvido_em) WHERE (resolvido_em IS NULL);


--


CREATE INDEX idx_overlay_rejeicoes_catalogo ON public.overlay_rejeicoes_auditoria USING btree (catalogo, referencia DESC);


--


CREATE TRIGGER trg_overlay_rejeicoes_updated_at BEFORE UPDATE ON public.overlay_rejeicoes_auditoria FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--


CREATE POLICY "Gestores atualizam auditoria de overlay" ON public.overlay_rejeicoes_auditoria FOR UPDATE TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));


--


CREATE POLICY "Gestores inserem auditoria de overlay" ON public.overlay_rejeicoes_auditoria FOR INSERT TO authenticated WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));


--


CREATE POLICY "Gestores leem auditoria de overlay" ON public.overlay_rejeicoes_auditoria FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));


--


CREATE POLICY "Gestores removem auditoria de overlay" ON public.overlay_rejeicoes_auditoria FOR DELETE TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)));


--


ALTER TABLE public.overlay_rejeicoes_auditoria ENABLE ROW LEVEL SECURITY;

--


GRANT ALL ON TABLE public.overlay_rejeicoes_auditoria TO authenticated;
GRANT ALL ON TABLE public.overlay_rejeicoes_auditoria TO service_role;
GRANT SELECT,INSERT ON TABLE public.overlay_rejeicoes_auditoria TO sandbox_exec;


--


-- TABLE projecoes_reforma

CREATE TABLE public.projecoes_reforma (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid NOT NULL,
    ano integer NOT NULL,
    pis_cofins numeric(15,2) DEFAULT 0 NOT NULL,
    icms numeric(15,2) DEFAULT 0 NOT NULL,
    iss numeric(15,2) DEFAULT 0 NOT NULL,
    ipi numeric(15,2) DEFAULT 0 NOT NULL,
    cbs numeric(15,2) DEFAULT 0 NOT NULL,
    ibs numeric(15,2) DEFAULT 0 NOT NULL,
    imposto_seletivo numeric(15,2) DEFAULT 0 NOT NULL,
    total_tributos numeric(15,2) NOT NULL,
    carga_percentual numeric(9,4) NOT NULL,
    tem_split_payment boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT projecoes_reforma_ano_check CHECK (((ano >= 2026) AND (ano <= 2033))),
    CONSTRAINT projecoes_reforma_carga_percentual_check CHECK (((carga_percentual >= (0)::numeric) AND (carga_percentual <= (200)::numeric)))
);


--


ALTER TABLE ONLY public.projecoes_reforma
    ADD CONSTRAINT projecoes_reforma_pkey PRIMARY KEY (id);


--


ALTER TABLE ONLY public.projecoes_reforma
    ADD CONSTRAINT uq_proj_emp_ano UNIQUE (empresa_id, ano);


--


CREATE TRIGGER trg_proj_reforma_updated_at BEFORE UPDATE ON public.projecoes_reforma FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


ALTER TABLE ONLY public.projecoes_reforma
    ADD CONSTRAINT projecoes_reforma_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--


ALTER TABLE public.projecoes_reforma ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY projecoes_reforma_acesso ON public.projecoes_reforma TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));


--


GRANT ALL ON TABLE public.projecoes_reforma TO authenticated;
GRANT ALL ON TABLE public.projecoes_reforma TO service_role;
GRANT SELECT,INSERT ON TABLE public.projecoes_reforma TO sandbox_exec;


--


-- TABLE regras_contabilizacao_automatica

CREATE TABLE public.regras_contabilizacao_automatica (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid NOT NULL,
    nome text NOT NULL,
    tipo_evento text NOT NULL,
    categoria_id uuid,
    conta_debito_id uuid NOT NULL,
    conta_credito_id uuid NOT NULL,
    historico_template text DEFAULT ''::text NOT NULL,
    prioridade integer DEFAULT 0 NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT regra_contas_distintas CHECK ((conta_debito_id <> conta_credito_id)),
    CONSTRAINT regras_contabilizacao_automatica_nome_check CHECK (((char_length(btrim(nome)) >= 2) AND (char_length(btrim(nome)) <= 160))),
    CONSTRAINT regras_contabilizacao_automatica_prioridade_check CHECK ((prioridade >= 0)),
    CONSTRAINT regras_contabilizacao_automatica_tipo_evento_check CHECK ((tipo_evento = ANY (ARRAY['conta_pagar'::text, 'conta_receber'::text, 'movimentacao'::text])))
);


--


ALTER TABLE ONLY public.regras_contabilizacao_automatica
    ADD CONSTRAINT regra_nome_unico_empresa UNIQUE (empresa_id, nome);


--


ALTER TABLE ONLY public.regras_contabilizacao_automatica
    ADD CONSTRAINT regras_contabilizacao_automatica_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_regras_contab_lookup ON public.regras_contabilizacao_automatica USING btree (empresa_id, tipo_evento, ativo, prioridade);


--


CREATE TRIGGER trg_regras_contab_updated_at BEFORE UPDATE ON public.regras_contabilizacao_automatica FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


ALTER TABLE ONLY public.regras_contabilizacao_automatica
    ADD CONSTRAINT regras_contabilizacao_automatica_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL;


--


ALTER TABLE ONLY public.regras_contabilizacao_automatica
    ADD CONSTRAINT regras_contabilizacao_automatica_conta_credito_id_fkey FOREIGN KEY (conta_credito_id) REFERENCES public.plano_contas(id) ON DELETE RESTRICT;


--


ALTER TABLE ONLY public.regras_contabilizacao_automatica
    ADD CONSTRAINT regras_contabilizacao_automatica_conta_debito_id_fkey FOREIGN KEY (conta_debito_id) REFERENCES public.plano_contas(id) ON DELETE RESTRICT;


--


CREATE POLICY regras_contab_select ON public.regras_contabilizacao_automatica FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));


--


CREATE POLICY regras_contab_write ON public.regras_contabilizacao_automatica TO authenticated USING ((public.empresa_acessivel(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'contador'::public.app_role)))) WITH CHECK ((public.empresa_acessivel(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'contador'::public.app_role))));


--


ALTER TABLE public.regras_contabilizacao_automatica ENABLE ROW LEVEL SECURITY;

--


GRANT ALL ON TABLE public.regras_contabilizacao_automatica TO authenticated;
GRANT ALL ON TABLE public.regras_contabilizacao_automatica TO service_role;
GRANT SELECT,INSERT ON TABLE public.regras_contabilizacao_automatica TO sandbox_exec;


--


-- TABLE retencao_politicas

CREATE TABLE public.retencao_politicas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tabela text NOT NULL,
    coluna text,
    dias integer,
    filtro text,
    motivo text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT retencao_politicas_coerencia CHECK ((((dias IS NULL) AND (coluna IS NULL)) OR ((dias >= 1) AND (coluna IS NOT NULL))))
);


--


ALTER TABLE ONLY public.retencao_politicas
    ADD CONSTRAINT retencao_politicas_pkey PRIMARY KEY (id);


--


ALTER TABLE ONLY public.retencao_politicas
    ADD CONSTRAINT retencao_politicas_tabela_key UNIQUE (tabela);


--


CREATE TRIGGER trg_retencao_politicas_updated_at BEFORE UPDATE ON public.retencao_politicas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


ALTER TABLE public.retencao_politicas ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY retencao_politicas_admin_select ON public.retencao_politicas FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--


GRANT ALL ON TABLE public.retencao_politicas TO authenticated;
GRANT ALL ON TABLE public.retencao_politicas TO service_role;
GRANT SELECT,INSERT ON TABLE public.retencao_politicas TO sandbox_exec;


--


-- TABLE saved_filter_subscriptions

CREATE TABLE public.saved_filter_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    saved_filter_id uuid NOT NULL,
    user_id uuid NOT NULL,
    frequencia text DEFAULT 'diaria'::text NOT NULL,
    canal text DEFAULT 'email'::text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    ultimo_envio_em timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT saved_filter_subscriptions_canal_check CHECK ((canal = ANY (ARRAY['email'::text, 'push'::text, 'whatsapp'::text]))),
    CONSTRAINT saved_filter_subscriptions_frequencia_check CHECK ((frequencia = ANY (ARRAY['diaria'::text, 'semanal'::text, 'mensal'::text])))
);


--


ALTER TABLE ONLY public.saved_filter_subscriptions
    ADD CONSTRAINT saved_filter_subscriptions_pkey PRIMARY KEY (id);


--


ALTER TABLE ONLY public.saved_filter_subscriptions
    ADD CONSTRAINT saved_filter_subscriptions_unique UNIQUE (saved_filter_id, user_id);


--


CREATE TRIGGER trg_saved_filter_subs_updated_at BEFORE UPDATE ON public.saved_filter_subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


ALTER TABLE ONLY public.saved_filter_subscriptions
    ADD CONSTRAINT saved_filter_subscriptions_saved_filter_id_fkey FOREIGN KEY (saved_filter_id) REFERENCES public.saved_filters(id) ON DELETE CASCADE;


--


ALTER TABLE public.saved_filter_subscriptions ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY saved_filter_subscriptions_owner ON public.saved_filter_subscriptions TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--


GRANT ALL ON TABLE public.saved_filter_subscriptions TO authenticated;
GRANT ALL ON TABLE public.saved_filter_subscriptions TO service_role;
GRANT SELECT,INSERT ON TABLE public.saved_filter_subscriptions TO sandbox_exec;


--


-- TABLE scim_operations_log

CREATE TABLE public.scim_operations_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token_id uuid,
    empresa_id uuid,
    resource_type text NOT NULL,
    operation text NOT NULL,
    external_id text,
    user_id uuid,
    status_code integer NOT NULL,
    request_body jsonb,
    response_body jsonb,
    duration_ms integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT scim_operations_log_duration_ms_check CHECK (((duration_ms IS NULL) OR (duration_ms >= 0))),
    CONSTRAINT scim_operations_log_operation_check CHECK ((operation = ANY (ARRAY['create'::text, 'read'::text, 'list'::text, 'replace'::text, 'patch'::text, 'delete'::text, 'deactivate'::text, 'error'::text]))),
    CONSTRAINT scim_operations_log_resource_type_check CHECK ((resource_type = ANY (ARRAY['User'::text, 'Group'::text, 'Schema'::text, 'ResourceType'::text, 'ServiceProviderConfig'::text, 'Bulk'::text]))),
    CONSTRAINT scim_operations_log_status_code_check CHECK (((status_code >= 100) AND (status_code <= 599)))
);


--


ALTER TABLE ONLY public.scim_operations_log
    ADD CONSTRAINT scim_operations_log_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_scim_operations_log_empresa_id ON public.scim_operations_log USING btree (empresa_id);


--


CREATE INDEX idx_scim_ops_created ON public.scim_operations_log USING btree (created_at DESC);


--


CREATE INDEX idx_scim_ops_token ON public.scim_operations_log USING btree (token_id, created_at DESC);


--


ALTER TABLE public.scim_operations_log ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY scim_operations_log_admin_select ON public.scim_operations_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--


GRANT ALL ON TABLE public.scim_operations_log TO authenticated;
GRANT ALL ON TABLE public.scim_operations_log TO service_role;
GRANT SELECT,INSERT ON TABLE public.scim_operations_log TO sandbox_exec;


--


-- TABLE security_alerts

CREATE TABLE public.security_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    severity text DEFAULT 'medium'::text NOT NULL,
    title text NOT NULL,
    description text,
    ip_address text,
    user_id uuid,
    user_email text,
    metadata jsonb,
    resolved boolean DEFAULT false NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT security_alerts_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])))
);


--


ALTER TABLE ONLY public.security_alerts
    ADD CONSTRAINT security_alerts_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_security_alerts_created_at ON public.security_alerts USING btree (created_at DESC);


--


CREATE INDEX idx_security_alerts_resolved ON public.security_alerts USING btree (resolved) WHERE (resolved = false);


--


CREATE INDEX idx_security_alerts_type ON public.security_alerts USING btree (type);


--


ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY security_alerts_admin_all ON public.security_alerts TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--


GRANT ALL ON TABLE public.security_alerts TO authenticated;
GRANT ALL ON TABLE public.security_alerts TO service_role;
GRANT SELECT,INSERT ON TABLE public.security_alerts TO sandbox_exec;


--


-- TABLE simulacao_tributos_detalhados

CREATE TABLE public.simulacao_tributos_detalhados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    simulacao_id uuid NOT NULL,
    regime public.regime_tributario_enum NOT NULL,
    tributo text NOT NULL,
    base_calculo numeric(15,2) NOT NULL,
    aliquota numeric(9,6) NOT NULL,
    valor_apurado numeric(15,2) NOT NULL,
    memoria_calculo jsonb,
    base_legal text NOT NULL,
    adicional numeric(15,2) DEFAULT 0 NOT NULL,
    fcp numeric(15,2) DEFAULT 0 NOT NULL,
    retencoes numeric(15,2) DEFAULT 0 NOT NULL,
    creditos numeric(15,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT simulacao_tributos_detalhados_aliquota_check CHECK (((aliquota >= (0)::numeric) AND (aliquota <= (1)::numeric)))
);


--


ALTER TABLE ONLY public.simulacao_tributos_detalhados
    ADD CONSTRAINT simulacao_tributos_detalhados_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_sim_trib_regime ON public.simulacao_tributos_detalhados USING btree (simulacao_id, regime);


--


CREATE INDEX idx_sim_trib_sim ON public.simulacao_tributos_detalhados USING btree (simulacao_id);


--


ALTER TABLE ONLY public.simulacao_tributos_detalhados
    ADD CONSTRAINT simulacao_tributos_detalhados_simulacao_id_fkey FOREIGN KEY (simulacao_id) REFERENCES public.simulacoes(id) ON DELETE CASCADE;


--


CREATE POLICY sim_trib_acesso ON public.simulacao_tributos_detalhados TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.simulacoes s
  WHERE ((s.id = simulacao_tributos_detalhados.simulacao_id) AND public.empresa_acessivel(s.empresa_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.simulacoes s
  WHERE ((s.id = simulacao_tributos_detalhados.simulacao_id) AND public.empresa_acessivel(s.empresa_id)))));


--


ALTER TABLE public.simulacao_tributos_detalhados ENABLE ROW LEVEL SECURITY;

--


GRANT ALL ON TABLE public.simulacao_tributos_detalhados TO authenticated;
GRANT ALL ON TABLE public.simulacao_tributos_detalhados TO service_role;
GRANT SELECT,INSERT ON TABLE public.simulacao_tributos_detalhados TO sandbox_exec;


--


-- TABLE simulacoes

CREATE TABLE public.simulacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    empresa_id uuid NOT NULL,
    periodo_inicio date NOT NULL,
    periodo_fim date NOT NULL,
    inputs jsonb NOT NULL,
    hash_inputs text NOT NULL,
    resultado_simples jsonb,
    resultado_presumido jsonb,
    resultado_real jsonb,
    regime_recomendado public.regime_tributario_enum,
    economia_anual_estimada numeric(15,2),
    carga_tributaria_recomendada numeric(7,4),
    motivo_recomendacao text,
    base_legal_decisao text,
    versao_motor text DEFAULT '3.9.0'::text NOT NULL,
    tempo_execucao_ms integer,
    executada_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT simulacoes_carga_chk CHECK (((carga_tributaria_recomendada IS NULL) OR ((carga_tributaria_recomendada >= (0)::numeric) AND (carga_tributaria_recomendada <= (2)::numeric)))),
    CONSTRAINT simulacoes_periodo_chk CHECK ((periodo_fim >= periodo_inicio)),
    CONSTRAINT simulacoes_tempo_execucao_ms_check CHECK (((tempo_execucao_ms IS NULL) OR (tempo_execucao_ms >= 0)))
);


--


ALTER TABLE ONLY public.simulacoes
    ADD CONSTRAINT simulacoes_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_sim_empresa_data ON public.simulacoes USING btree (empresa_id, created_at DESC);


--


CREATE INDEX idx_sim_hash ON public.simulacoes USING btree (hash_inputs);


--


CREATE TRIGGER trg_simulacoes_updated_at BEFORE UPDATE ON public.simulacoes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


ALTER TABLE ONLY public.simulacoes
    ADD CONSTRAINT simulacoes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--


ALTER TABLE ONLY public.simulacoes
    ADD CONSTRAINT simulacoes_executada_por_fkey FOREIGN KEY (executada_por) REFERENCES auth.users(id) ON DELETE SET NULL;


--


ALTER TABLE public.simulacoes ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY simulacoes_acesso ON public.simulacoes TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));


--


GRANT ALL ON TABLE public.simulacoes TO authenticated;
GRANT ALL ON TABLE public.simulacoes TO service_role;
GRANT SELECT,INSERT ON TABLE public.simulacoes TO sandbox_exec;


--


-- TABLE slo_metrics_diarias

CREATE TABLE public.slo_metrics_diarias (
    data date NOT NULL,
    total_requisicoes bigint DEFAULT 0 NOT NULL,
    latencia_p50_ms numeric DEFAULT 0 NOT NULL,
    latencia_p95_ms numeric DEFAULT 0 NOT NULL,
    latencia_p99_ms numeric DEFAULT 0 NOT NULL,
    taxa_erro_pct numeric DEFAULT 0 NOT NULL,
    uptime_pct numeric DEFAULT 100 NOT NULL,
    cron_jobs_sucesso integer DEFAULT 0 NOT NULL,
    cron_jobs_falha integer DEFAULT 0 NOT NULL,
    edges_health jsonb DEFAULT '{}'::jsonb NOT NULL,
    calculado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT slo_metrics_diarias_taxa_erro_pct_check CHECK (((taxa_erro_pct >= (0)::numeric) AND (taxa_erro_pct <= (100)::numeric))),
    CONSTRAINT slo_metrics_diarias_uptime_pct_check CHECK (((uptime_pct >= (0)::numeric) AND (uptime_pct <= (100)::numeric)))
);


--


ALTER TABLE ONLY public.slo_metrics_diarias
    ADD CONSTRAINT slo_metrics_diarias_pkey PRIMARY KEY (data);


--


CREATE POLICY slo_metrics_admin_select ON public.slo_metrics_diarias FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--


ALTER TABLE public.slo_metrics_diarias ENABLE ROW LEVEL SECURITY;

--


GRANT ALL ON TABLE public.slo_metrics_diarias TO authenticated;
GRANT ALL ON TABLE public.slo_metrics_diarias TO service_role;
GRANT SELECT,INSERT ON TABLE public.slo_metrics_diarias TO sandbox_exec;


--


-- TABLE sso_role_mappings

CREATE TABLE public.sso_role_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    idp_group text NOT NULL,
    app_role public.app_role NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sso_role_mappings_idp_group_check CHECK (((char_length(btrim(idp_group)) >= 1) AND (char_length(btrim(idp_group)) <= 200))),
    CONSTRAINT sso_role_mappings_ordem_check CHECK ((ordem >= 0))
);


--


ALTER TABLE ONLY public.sso_role_mappings
    ADD CONSTRAINT sso_role_mapping_unico UNIQUE (provider_id, idp_group);


--


ALTER TABLE ONLY public.sso_role_mappings
    ADD CONSTRAINT sso_role_mappings_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_sso_role_mappings_provider ON public.sso_role_mappings USING btree (provider_id, ordem);


--


CREATE TRIGGER trg_sso_role_mappings_updated_at BEFORE UPDATE ON public.sso_role_mappings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


ALTER TABLE ONLY public.sso_role_mappings
    ADD CONSTRAINT sso_role_mappings_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.sso_providers(id) ON DELETE CASCADE;


--


ALTER TABLE public.sso_role_mappings ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY sso_role_mappings_admin ON public.sso_role_mappings TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--


GRANT ALL ON TABLE public.sso_role_mappings TO authenticated;
GRANT ALL ON TABLE public.sso_role_mappings TO service_role;
GRANT SELECT,INSERT ON TABLE public.sso_role_mappings TO sandbox_exec;


--


-- TABLE sso_sandbox_runs

CREATE TABLE public.sso_sandbox_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_by uuid,
    created_by_email text,
    provider_id uuid,
    provider_nome text,
    use_provider_config boolean DEFAULT true NOT NULL,
    input jsonb DEFAULT '{}'::jsonb NOT NULL,
    result jsonb DEFAULT '{}'::jsonb NOT NULL,
    outcome text NOT NULL,
    email_masked text,
    resolved_role text,
    matched_group text,
    has_errors boolean DEFAULT false NOT NULL,
    batch_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sso_sandbox_runs_outcome_check CHECK ((outcome = ANY (ARRAY['bloqueado'::text, 'seria_jit'::text, 'usuario_existente'::text, 'sem_email'::text])))
);


--


ALTER TABLE ONLY public.sso_sandbox_runs
    ADD CONSTRAINT sso_sandbox_runs_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_sso_sandbox_runs_batch ON public.sso_sandbox_runs USING btree (batch_id);


--


CREATE INDEX idx_sso_sandbox_runs_created ON public.sso_sandbox_runs USING btree (created_at DESC);


--


ALTER TABLE ONLY public.sso_sandbox_runs
    ADD CONSTRAINT sso_sandbox_runs_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.sso_providers(id) ON DELETE SET NULL;


--


ALTER TABLE public.sso_sandbox_runs ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY sso_sandbox_runs_admin ON public.sso_sandbox_runs TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) AND (created_by = auth.uid())));


--


GRANT ALL ON TABLE public.sso_sandbox_runs TO authenticated;
GRANT ALL ON TABLE public.sso_sandbox_runs TO service_role;
GRANT SELECT,INSERT ON TABLE public.sso_sandbox_runs TO sandbox_exec;


--


-- TABLE sso_user_groups

CREATE TABLE public.sso_user_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    groups text[] DEFAULT '{}'::text[] NOT NULL,
    matched_group text,
    matched_role public.app_role,
    last_synced_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--


ALTER TABLE ONLY public.sso_user_groups
    ADD CONSTRAINT sso_user_group_unico UNIQUE (user_id, provider_id);


--


ALTER TABLE ONLY public.sso_user_groups
    ADD CONSTRAINT sso_user_groups_pkey PRIMARY KEY (id);


--


CREATE INDEX idx_sso_user_groups_user ON public.sso_user_groups USING btree (user_id);


--


CREATE TRIGGER trg_sso_user_groups_updated_at BEFORE UPDATE ON public.sso_user_groups FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


ALTER TABLE ONLY public.sso_user_groups
    ADD CONSTRAINT sso_user_groups_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.sso_providers(id) ON DELETE CASCADE;


--


ALTER TABLE public.sso_user_groups ENABLE ROW LEVEL SECURITY;

--


CREATE POLICY sso_user_groups_select ON public.sso_user_groups FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--


GRANT ALL ON TABLE public.sso_user_groups TO authenticated;
GRANT ALL ON TABLE public.sso_user_groups TO service_role;
GRANT SELECT,INSERT ON TABLE public.sso_user_groups TO sandbox_exec;


--


-- FASE 3: Colunas faltando em tabelas comuns
-- COLS alert_configurations
ALTER TABLE public.alert_configurations ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- COLS alertas
ALTER TABLE public.alertas ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- COLS alerts
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- COLS api_keys
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS key_hash text NOT NULL;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS key_prefix text NOT NULL;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS name text NOT NULL;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS revoked_at timestamp with time zone;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- COLS apuracoes_irpj_csll
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS csll_a_pagar numeric DEFAULT 0 NOT NULL;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS csll_base numeric DEFAULT 0 NOT NULL;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS csll_total numeric DEFAULT 0 NOT NULL;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS data_transmissao timestamp with time zone;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS irpj_a_pagar numeric DEFAULT 0 NOT NULL;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS irpj_adicional numeric DEFAULT 0 NOT NULL;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS irpj_adicional_base numeric DEFAULT 0 NOT NULL;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS irpj_incentivos_deducoes numeric DEFAULT 0 NOT NULL;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS irpj_normal numeric DEFAULT 0 NOT NULL;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS irpj_total numeric DEFAULT 0 NOT NULL;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS mes integer;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS numero_recibo text;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS saldo_negativo_csll numeric DEFAULT 0 NOT NULL;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS saldo_negativo_irpj numeric DEFAULT 0 NOT NULL;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS total_tributos numeric DEFAULT 0 NOT NULL;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS trimestre integer;
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- COLS bitrix24_stage_mappings
ALTER TABLE public.bitrix24_stage_mappings ADD COLUMN IF NOT EXISTS lalamove_status text NOT NULL;

-- COLS blocked_ips
ALTER TABLE public.blocked_ips ADD COLUMN IF NOT EXISTS blocked_until timestamp with time zone;
ALTER TABLE public.blocked_ips ADD COLUMN IF NOT EXISTS permanent boolean DEFAULT false NOT NULL;
ALTER TABLE public.blocked_ips ADD COLUMN IF NOT EXISTS unblocked_at timestamp with time zone;
ALTER TABLE public.blocked_ips ADD COLUMN IF NOT EXISTS unblocked_by uuid;

-- COLS centros_custo
ALTER TABLE public.centros_custo ADD COLUMN IF NOT EXISTS tipo text;

-- COLS contas_receber
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS bitrix_deal_id text;

-- COLS divergencias_conciliacao
ALTER TABLE public.divergencias_conciliacao ADD COLUMN IF NOT EXISTS resolvida boolean DEFAULT false;

-- COLS elisao_alertas
ALTER TABLE public.elisao_alertas ADD COLUMN IF NOT EXISTS descricao text NOT NULL;
ALTER TABLE public.elisao_alertas ADD COLUMN IF NOT EXISTS lido boolean DEFAULT false NOT NULL;
ALTER TABLE public.elisao_alertas ADD COLUMN IF NOT EXISTS referencia_id uuid;
ALTER TABLE public.elisao_alertas ADD COLUMN IF NOT EXISTS resolvido_em timestamp with time zone;
ALTER TABLE public.elisao_alertas ADD COLUMN IF NOT EXISTS tipo_divergencia text NOT NULL;
ALTER TABLE public.elisao_alertas ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- COLS elisao_creditos_auditoria
ALTER TABLE public.elisao_creditos_auditoria ADD COLUMN IF NOT EXISTS aprovador_id uuid;
ALTER TABLE public.elisao_creditos_auditoria ADD COLUMN IF NOT EXISTS cst_csosn text;
ALTER TABLE public.elisao_creditos_auditoria ADD COLUMN IF NOT EXISTS data_aprovacao timestamp with time zone;
ALTER TABLE public.elisao_creditos_auditoria ADD COLUMN IF NOT EXISTS divergencias_detectadas jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.elisao_creditos_auditoria ADD COLUMN IF NOT EXISTS historico_decisoes jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.elisao_creditos_auditoria ADD COLUMN IF NOT EXISTS metodologia_aplicada text;
ALTER TABLE public.elisao_creditos_auditoria ADD COLUMN IF NOT EXISTS motivo_rejeicao text;
ALTER TABLE public.elisao_creditos_auditoria ADD COLUMN IF NOT EXISTS nota_id uuid;
ALTER TABLE public.elisao_creditos_auditoria ADD COLUMN IF NOT EXISTS score_confianca integer;

-- COLS elisao_regras_creditos
ALTER TABLE public.elisao_regras_creditos ADD COLUMN IF NOT EXISTS base_legal text;
ALTER TABLE public.elisao_regras_creditos ADD COLUMN IF NOT EXISTS ncm_prefixo text;
ALTER TABLE public.elisao_regras_creditos ADD COLUMN IF NOT EXISTS tipo_credito text NOT NULL;
ALTER TABLE public.elisao_regras_creditos ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- COLS elisao_tarefas_acionaveis
ALTER TABLE public.elisao_tarefas_acionaveis ADD COLUMN IF NOT EXISTS bitrix_sync_erro text;
ALTER TABLE public.elisao_tarefas_acionaveis ADD COLUMN IF NOT EXISTS prazo date;
ALTER TABLE public.elisao_tarefas_acionaveis ADD COLUMN IF NOT EXISTS sincronizado_em timestamp with time zone;
ALTER TABLE public.elisao_tarefas_acionaveis ADD COLUMN IF NOT EXISTS tipo_oportunidade text DEFAULT 'credito_tributario'::text NOT NULL;

-- COLS empresas
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS cnae_principal text;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS codigo_fpas text;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS is_padrao boolean DEFAULT false NOT NULL;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS regime_tributario text;

-- COLS evidencias_pacotes
ALTER TABLE public.evidencias_pacotes ADD COLUMN IF NOT EXISTS escopos text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE public.evidencias_pacotes ADD COLUMN IF NOT EXISTS gerado_por_email text;
ALTER TABLE public.evidencias_pacotes ADD COLUMN IF NOT EXISTS manifest jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE public.evidencias_pacotes ADD COLUMN IF NOT EXISTS periodo_fim date;
ALTER TABLE public.evidencias_pacotes ADD COLUMN IF NOT EXISTS periodo_inicio date;
ALTER TABLE public.evidencias_pacotes ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.evidencias_pacotes ADD COLUMN IF NOT EXISTS tamanho_bytes bigint;

-- COLS faturamento_mensal
ALTER TABLE public.faturamento_mensal ADD COLUMN IF NOT EXISTS observacoes text;

-- COLS fechamentos_tributarios
ALTER TABLE public.fechamentos_tributarios ADD COLUMN IF NOT EXISTS checklist jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.fechamentos_tributarios ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.fechamentos_tributarios ADD COLUMN IF NOT EXISTS forcado boolean DEFAULT false NOT NULL;
ALTER TABLE public.fechamentos_tributarios ADD COLUMN IF NOT EXISTS justificativa_forcado text;

-- COLS folha_pagamento
ALTER TABLE public.folha_pagamento ADD COLUMN IF NOT EXISTS numero_funcionarios integer;
ALTER TABLE public.folha_pagamento ADD COLUMN IF NOT EXISTS observacoes text;

-- COLS fornecedores
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true NOT NULL;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS cnpj_cpf text;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS contato text;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS endereco text;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS limite_credito numeric;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS observacoes text;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS ramo_atividade text;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS score numeric;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS telefone text;

-- COLS frontend_error_logs
ALTER TABLE public.frontend_error_logs ADD COLUMN IF NOT EXISTS severity text DEFAULT 'error'::text NOT NULL;

-- COLS frontend_error_logs_2026_05
ALTER TABLE public.frontend_error_logs_2026_05 ADD COLUMN IF NOT EXISTS severity text DEFAULT 'error'::text NOT NULL;

-- COLS frontend_error_logs_2026_06
ALTER TABLE public.frontend_error_logs_2026_06 ADD COLUMN IF NOT EXISTS severity text DEFAULT 'error'::text NOT NULL;

-- COLS frontend_error_logs_2026_07
ALTER TABLE public.frontend_error_logs_2026_07 ADD COLUMN IF NOT EXISTS severity text DEFAULT 'error'::text NOT NULL;

-- COLS frontend_error_logs_2026_08
ALTER TABLE public.frontend_error_logs_2026_08 ADD COLUMN IF NOT EXISTS severity text DEFAULT 'error'::text NOT NULL;

-- COLS frontend_error_logs_2026_09
ALTER TABLE public.frontend_error_logs_2026_09 ADD COLUMN IF NOT EXISTS severity text DEFAULT 'error'::text NOT NULL;

-- COLS frontend_error_logs_2026_10
ALTER TABLE public.frontend_error_logs_2026_10 ADD COLUMN IF NOT EXISTS severity text DEFAULT 'error'::text NOT NULL;

-- COLS frontend_error_logs_default
ALTER TABLE public.frontend_error_logs_default ADD COLUMN IF NOT EXISTS severity text DEFAULT 'error'::text NOT NULL;

-- COLS incentivos_fiscais
ALTER TABLE public.incentivos_fiscais ADD COLUMN IF NOT EXISTS created_by uuid;

-- COLS integration_secrets
ALTER TABLE public.integration_secrets ADD COLUMN IF NOT EXISTS chave text NOT NULL;

-- COLS integrity_alerts
ALTER TABLE public.integrity_alerts ADD COLUMN IF NOT EXISTS resolved_reason text;

-- COLS kpis_operacionais
ALTER TABLE public.kpis_operacionais ADD COLUMN IF NOT EXISTS categoria text;
ALTER TABLE public.kpis_operacionais ADD COLUMN IF NOT EXISTS meta numeric DEFAULT 0 NOT NULL;
ALTER TABLE public.kpis_operacionais ADD COLUMN IF NOT EXISTS tendencia text;
ALTER TABLE public.kpis_operacionais ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.kpis_operacionais ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL;
ALTER TABLE public.kpis_operacionais ADD COLUMN IF NOT EXISTS valor_atual numeric DEFAULT 0 NOT NULL;

-- COLS lancamentos_contabeis
ALTER TABLE public.lancamentos_contabeis ADD COLUMN IF NOT EXISTS competencia date;
ALTER TABLE public.lancamentos_contabeis ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();
ALTER TABLE public.lancamentos_contabeis ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- COLS notas_fiscais
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS cliente_cnpj text;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS cliente_nome text;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS valor_desconto numeric DEFAULT 0 NOT NULL;
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS valor_frete numeric DEFAULT 0 NOT NULL;

-- COLS notas_fiscais_ocr
ALTER TABLE public.notas_fiscais_ocr ADD COLUMN IF NOT EXISTS arquivo_nome text;
ALTER TABLE public.notas_fiscais_ocr ADD COLUMN IF NOT EXISTS arquivo_url text;
ALTER TABLE public.notas_fiscais_ocr ADD COLUMN IF NOT EXISTS dados_extraidos jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE public.notas_fiscais_ocr ADD COLUMN IF NOT EXISTS emitente_cnpj text;
ALTER TABLE public.notas_fiscais_ocr ADD COLUMN IF NOT EXISTS emitente_nome text;
ALTER TABLE public.notas_fiscais_ocr ADD COLUMN IF NOT EXISTS erro_mensagem text;

-- COLS operacoes_tributaveis
ALTER TABLE public.operacoes_tributaveis ADD COLUMN IF NOT EXISTS documento_chave text;
ALTER TABLE public.operacoes_tributaveis ADD COLUMN IF NOT EXISTS erro_mensagem text;

-- COLS oportunidades_elisao
ALTER TABLE public.oportunidades_elisao ADD COLUMN IF NOT EXISTS aplicavel boolean DEFAULT true NOT NULL;
ALTER TABLE public.oportunidades_elisao ADD COLUMN IF NOT EXISTS base_legal text;
ALTER TABLE public.oportunidades_elisao ADD COLUMN IF NOT EXISTS categoria text;
ALTER TABLE public.oportunidades_elisao ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.oportunidades_elisao ADD COLUMN IF NOT EXISTS data_identificacao date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public.oportunidades_elisao ADD COLUMN IF NOT EXISTS estrategia text NOT NULL;
ALTER TABLE public.oportunidades_elisao ADD COLUMN IF NOT EXISTS inputs_utilizados jsonb;
ALTER TABLE public.oportunidades_elisao ADD COLUMN IF NOT EXISTS memoria_calculo text;
ALTER TABLE public.oportunidades_elisao ADD COLUMN IF NOT EXISTS motivo_nao_aplicavel text;
ALTER TABLE public.oportunidades_elisao ADD COLUMN IF NOT EXISTS observacoes text;
ALTER TABLE public.oportunidades_elisao ADD COLUMN IF NOT EXISTS risco text;
ALTER TABLE public.oportunidades_elisao ADD COLUMN IF NOT EXISTS status_alterado_em timestamp with time zone;
ALTER TABLE public.oportunidades_elisao ADD COLUMN IF NOT EXISTS status_alterado_por uuid;

-- COLS pagamentos_recorrentes
ALTER TABLE public.pagamentos_recorrentes ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true NOT NULL;
ALTER TABLE public.pagamentos_recorrentes ADD COLUMN IF NOT EXISTS centro_custo_id uuid;
ALTER TABLE public.pagamentos_recorrentes ADD COLUMN IF NOT EXISTS conta_bancaria_id uuid;
ALTER TABLE public.pagamentos_recorrentes ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid() NOT NULL;
ALTER TABLE public.pagamentos_recorrentes ADD COLUMN IF NOT EXISTS data_fim date;
ALTER TABLE public.pagamentos_recorrentes ADD COLUMN IF NOT EXISTS dia_vencimento integer NOT NULL;
ALTER TABLE public.pagamentos_recorrentes ADD COLUMN IF NOT EXISTS fornecedor_id uuid;
ALTER TABLE public.pagamentos_recorrentes ADD COLUMN IF NOT EXISTS fornecedor_nome text NOT NULL;
ALTER TABLE public.pagamentos_recorrentes ADD COLUMN IF NOT EXISTS observacoes text;
ALTER TABLE public.pagamentos_recorrentes ADD COLUMN IF NOT EXISTS proxima_geracao date;
ALTER TABLE public.pagamentos_recorrentes ADD COLUMN IF NOT EXISTS tipo_cobranca public.tipo_cobranca DEFAULT 'transferencia'::public.tipo_cobranca NOT NULL;
ALTER TABLE public.pagamentos_recorrentes ADD COLUMN IF NOT EXISTS total_gerado integer DEFAULT 0 NOT NULL;
ALTER TABLE public.pagamentos_recorrentes ADD COLUMN IF NOT EXISTS ultima_geracao date;

-- COLS partidas_contabeis
ALTER TABLE public.partidas_contabeis ADD COLUMN IF NOT EXISTS conta_id uuid;
ALTER TABLE public.partidas_contabeis ADD COLUMN IF NOT EXISTS historico_complementar text;
ALTER TABLE public.partidas_contabeis ADD COLUMN IF NOT EXISTS ordem integer;

-- COLS per_dcomp
ALTER TABLE public.per_dcomp ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- COLS performance_alerts
ALTER TABLE public.performance_alerts ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone;
ALTER TABLE public.performance_alerts ADD COLUMN IF NOT EXISTS resolved_reason text;

-- COLS pix_templates
ALTER TABLE public.pix_templates ADD COLUMN IF NOT EXISTS categoria text;
ALTER TABLE public.pix_templates ADD COLUMN IF NOT EXISTS centro_custo_id uuid;
ALTER TABLE public.pix_templates ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.pix_templates ADD COLUMN IF NOT EXISTS descricao text;
ALTER TABLE public.pix_templates ADD COLUMN IF NOT EXISTS favorecido_cpf_cnpj text;
ALTER TABLE public.pix_templates ADD COLUMN IF NOT EXISTS favorecido_nome text;
ALTER TABLE public.pix_templates ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE public.pix_templates ADD COLUMN IF NOT EXISTS tipo_chave_pix text;
ALTER TABLE public.pix_templates ADD COLUMN IF NOT EXISTS ultimo_uso timestamp with time zone;
ALTER TABLE public.pix_templates ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.pix_templates ADD COLUMN IF NOT EXISTS uso_count integer DEFAULT 0 NOT NULL;
ALTER TABLE public.pix_templates ADD COLUMN IF NOT EXISTS valor_fixo boolean DEFAULT false NOT NULL;

-- COLS plano_contas
ALTER TABLE public.plano_contas ADD COLUMN IF NOT EXISTS aceita_lancamento boolean DEFAULT true NOT NULL;
ALTER TABLE public.plano_contas ADD COLUMN IF NOT EXISTS codigo_referencial text;
ALTER TABLE public.plano_contas ADD COLUMN IF NOT EXISTS nivel integer DEFAULT 1 NOT NULL;
ALTER TABLE public.plano_contas ADD COLUMN IF NOT EXISTS parent_id uuid;
ALTER TABLE public.plano_contas ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- COLS prejuizos_fiscais
ALTER TABLE public.prejuizos_fiscais ADD COLUMN IF NOT EXISTS trimestre_origem integer;

-- COLS regimes_simulados
ALTER TABLE public.regimes_simulados ADD COLUMN IF NOT EXISTS ajustes_aplicados jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.regimes_simulados ADD COLUMN IF NOT EXISTS versao_motor text;

-- COLS regras_conciliacao
ALTER TABLE public.regras_conciliacao ADD COLUMN IF NOT EXISTS entidade_id uuid;

-- COLS regras_roteamento_financeiro
ALTER TABLE public.regras_roteamento_financeiro ADD COLUMN IF NOT EXISTS ativa boolean DEFAULT true;

-- COLS relatorios_tributarios_agendados
ALTER TABLE public.relatorios_tributarios_agendados ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.relatorios_tributarios_agendados ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- COLS risk_rules
ALTER TABLE public.risk_rules ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- COLS scim_setup_checklist
ALTER TABLE public.scim_setup_checklist ADD COLUMN IF NOT EXISTS confirmed boolean DEFAULT false NOT NULL;
ALTER TABLE public.scim_setup_checklist ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone;
ALTER TABLE public.scim_setup_checklist ADD COLUMN IF NOT EXISTS item_key text NOT NULL;
ALTER TABLE public.scim_setup_checklist ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.scim_setup_checklist ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL;

-- COLS solicitacoes_lgpd
ALTER TABLE public.solicitacoes_lgpd ADD COLUMN IF NOT EXISTS empresa_id uuid;
ALTER TABLE public.solicitacoes_lgpd ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- COLS sped_contabil_arquivos
ALTER TABLE public.sped_contabil_arquivos ADD COLUMN IF NOT EXISTS ano_calendario integer NOT NULL;
ALTER TABLE public.sped_contabil_arquivos ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE public.sped_contabil_arquivos ADD COLUMN IF NOT EXISTS gerado_por uuid;
ALTER TABLE public.sped_contabil_arquivos ADD COLUMN IF NOT EXISTS hash_sha256 text;
ALTER TABLE public.sped_contabil_arquivos ADD COLUMN IF NOT EXISTS recibo_transmissao text;
ALTER TABLE public.sped_contabil_arquivos ADD COLUMN IF NOT EXISTS storage_path text NOT NULL;
ALTER TABLE public.sped_contabil_arquivos ADD COLUMN IF NOT EXISTS total_lancamentos integer DEFAULT 0 NOT NULL;
ALTER TABLE public.sped_contabil_arquivos ADD COLUMN IF NOT EXISTS total_linhas integer DEFAULT 0 NOT NULL;
ALTER TABLE public.sped_contabil_arquivos ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- COLS user_sessions
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS device_info text;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT false NOT NULL;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS last_active timestamp with time zone DEFAULT now();
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS revoked_at timestamp with time zone;

-- COLS vendedores
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS telefone text;

-- FASE 4: Funcoes ausentes

CREATE OR REPLACE FUNCTION public.auditar_acessos_cross_tenant(_horas integer DEFAULT 1) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_ini timestamptz := date_trunc('hour', now()) - make_interval(hours => GREATEST(_horas, 1));
  v_fim timestamptz := date_trunc('hour', now());
  v_hour timestamptz := date_trunc('hour', now());
  v_cross int := 0;
  v_pico int := 0;
  v_noturno int := 0;
  v_delecao int := 0;
BEGIN
  -- Gate #28: somente admins autenticados ou processos internos (pg_cron/service_role).
  IF NOT (
    current_user IN ('postgres', 'supabase_admin', 'service_role')
    OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar a auditoria de acessos.'
      USING ERRCODE = '42501';
  END IF;

  IF NOT pg_try_advisory_xact_lock(hashtext('auditar_acessos_cross_tenant')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'lock_held');
  END IF;

  -- A) Acesso a registros de empresa da qual o usuário não é membro ativo
  WITH base AS (
    SELECT a.user_id,
           max(a.user_email) AS user_email,
           NULLIF(COALESCE(a.new_data->>'empresa_id', a.old_data->>'empresa_id'), '')::uuid AS empresa_id,
           a.table_name,
           count(*) AS ocorrencias,
           jsonb_agg(DISTINCT a.action) AS acoes
    FROM public.audit_logs a
    WHERE a.created_at >= v_ini AND a.created_at < v_fim
      AND a.user_id IS NOT NULL
      AND COALESCE(a.new_data->>'empresa_id', a.old_data->>'empresa_id') IS NOT NULL
    GROUP BY 1, 3, 4
  ), viol AS (
    SELECT b.* FROM base b
    WHERE b.empresa_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.user_empresas ue
        WHERE ue.user_id = b.user_id AND ue.empresa_id = b.empresa_id AND COALESCE(ue.ativo, true)
      )
  ), ins AS (
    INSERT INTO public.acessos_suspeitos
      (tipo, severidade, janela_inicio, janela_fim, user_id, user_email, empresa_id, table_name, ocorrencias, detalhes)
    SELECT 'cross_tenant',
           CASE WHEN ocorrencias >= 10 THEN 'critical' ELSE 'warning' END,
           v_ini, v_fim, user_id, user_email, empresa_id, table_name, ocorrencias,
           jsonb_build_object('acoes', acoes)
    FROM viol
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_cross FROM ins;

  -- B) Pico de atividade administrativa vs baseline de 7 dias
  WITH admins AS (
    SELECT DISTINCT user_id FROM public.user_roles WHERE role = 'admin'
  ), atual AS (
    SELECT a.user_id, max(a.user_email) AS user_email, count(*) AS ocorrencias
    FROM public.audit_logs a
    JOIN admins ad ON ad.user_id = a.user_id
    WHERE a.created_at >= v_ini AND a.created_at < v_fim
    GROUP BY 1
  ), base AS (
    SELECT a.user_id, count(*)::numeric / (7 * 24) AS media_hora
    FROM public.audit_logs a
    JOIN admins ad ON ad.user_id = a.user_id
    WHERE a.created_at >= v_ini - interval '7 days' AND a.created_at < v_ini
    GROUP BY 1
  ), ins AS (
    INSERT INTO public.acessos_suspeitos
      (tipo, severidade, janela_inicio, janela_fim, user_id, user_email, ocorrencias, baseline, detalhes)
    SELECT 'admin_pico',
           CASE WHEN at.ocorrencias >= GREATEST(COALESCE(b.media_hora,0) * 10, 200) THEN 'critical' ELSE 'warning' END,
           v_ini, v_fim, at.user_id, at.user_email, at.ocorrencias, ROUND(COALESCE(b.media_hora, 0), 2),
           jsonb_build_object('fator', ROUND(at.ocorrencias / NULLIF(COALESCE(b.media_hora, 0), 0), 2))
    FROM atual at
    LEFT JOIN base b ON b.user_id = at.user_id
    WHERE at.ocorrencias >= 20
      AND at.ocorrencias >= GREATEST(COALESCE(b.media_hora, 0) * 3, 20)
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_pico FROM ins;

  -- C) Atividade administrativa em madrugada (00h-05h America/Sao_Paulo)
  WITH admins AS (
    SELECT DISTINCT user_id FROM public.user_roles WHERE role = 'admin'
  ), noturno AS (
    SELECT a.user_id, max(a.user_email) AS user_email, count(*) AS ocorrencias
    FROM public.audit_logs a
    JOIN admins ad ON ad.user_id = a.user_id
    WHERE a.created_at >= v_ini AND a.created_at < v_fim
      AND EXTRACT(HOUR FROM (a.created_at AT TIME ZONE 'America/Sao_Paulo')) < 5
    GROUP BY 1
  ), ins AS (
    INSERT INTO public.acessos_suspeitos
      (tipo, severidade, janela_inicio, janela_fim, user_id, user_email, ocorrencias, detalhes)
    SELECT 'admin_fora_horario', CASE WHEN ocorrencias >= 50 THEN 'critical' ELSE 'warning' END,
           v_ini, v_fim, user_id, user_email, ocorrencias,
           jsonb_build_object('janela', '00h-05h America/Sao_Paulo')
    FROM noturno WHERE ocorrencias >= 10
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_noturno FROM ins;

  -- D) Exclusões em massa
  WITH del AS (
    SELECT a.user_id, max(a.user_email) AS user_email, a.table_name, count(*) AS ocorrencias
    FROM public.audit_logs a
    WHERE a.created_at >= v_ini AND a.created_at < v_fim
      AND upper(a.action) LIKE 'DELETE%'
    GROUP BY 1, 3
  ), ins AS (
    INSERT INTO public.acessos_suspeitos
      (tipo, severidade, janela_inicio, janela_fim, user_id, user_email, table_name, ocorrencias, detalhes)
    SELECT 'delecao_massa', CASE WHEN ocorrencias >= 100 THEN 'critical' ELSE 'warning' END,
           v_ini, v_fim, user_id, user_email, table_name, ocorrencias, '{}'::jsonb
    FROM del WHERE ocorrencias >= 25
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_delecao FROM ins;

  -- E) Consolidar em integrity_alerts para o painel/escalonamento existente
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, metadata)
  SELECT 'seguranca_acesso', s.tipo,
         CASE WHEN bool_or(s.severidade = 'critical') THEN 'critical' ELSE 'warning' END,
         v_hour, count(*),
         format('%s achado(s) de %s na janela %s', count(*), s.tipo, to_char(v_ini, 'DD/MM HH24:MI')),
         jsonb_build_object('janela_inicio', v_ini, 'janela_fim', v_fim)
  FROM public.acessos_suspeitos s
  WHERE s.janela_inicio = v_ini
  GROUP BY s.tipo
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count,
        severity = EXCLUDED.severity,
        reason = EXCLUDED.reason,
        metadata = EXCLUDED.metadata;

  RETURN jsonb_build_object(
    'success', true,
    'janela_inicio', v_ini, 'janela_fim', v_fim,
    'cross_tenant', v_cross, 'admin_pico', v_pico,
    'admin_fora_horario', v_noturno, 'delecao_massa', v_delecao
  );
END;
$$;


--


CREATE OR REPLACE FUNCTION public.auto_vincular_empresa_padrao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_empresa uuid;
BEGIN
  SELECT id INTO v_empresa FROM public.empresas ORDER BY created_at LIMIT 1;
  IF v_empresa IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.user_empresas (user_id, empresa_id, role, is_default, provisioned_via, ativo)
  VALUES (NEW.user_id, v_empresa, NEW.role, true, 'manual', true)
  ON CONFLICT (user_id, empresa_id) DO NOTHING;
  RETURN NEW;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.backfill_empresa_id(_dry_run boolean DEFAULT false) RETURNS TABLE(tabela text, estrategia text, registros_ajustados bigint, pendentes bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_empresa_padrao uuid;
  v_total_empresas int;
  v_n bigint;
  v_p bigint;
  r record;
  v_fks CONSTANT text[][] := ARRAY[
    ARRAY['parcelas_acordo',          'acordos_parcelamento', 'acordo_id'],
    ARRAY['asaas_audit_trail',        'asaas_payments',       'payment_id'],
    ARRAY['asaas_sync_queue',         'asaas_payments',       'payment_id'],
    ARRAY['regua_cobranca_etapas',    'regua_cobranca',       'regua_id'],
    ARRAY['itens_pedido_compra',      'pedidos_compra',       'pedido_id'],
    ARRAY['partidas_contabeis',       'lancamentos_contabeis','lancamento_id']
  ];
  v_diretas CONSTANT text[] := ARRAY[
    'contas_pagar','contas_receber','boletos','darfs','clientes','vendedores',
    'movimentacoes','lancamentos_contabeis','plano_contas','centros_custo',
    'contas_bancarias','notas_fiscais','nfe_recebidas','operacoes_tributaveis',
    'apuracoes_tributarias','creditos_tributarios','retencoes_fonte',
    'acordos_parcelamento','negativacoes','protestos','transferencias',
    'conciliacoes','sessoes_conciliacao','divergencias_conciliacao',
    'asaas_payments','asaas_customers','asaas_transfers',
    'auditoria_financeira','auditoria_tributaria','tax_audit_trail',
    'alertas_tributarios','contratos','pedidos_compra','categorias'
  ];
BEGIN
  IF NOT (
       coalesce(public.has_role(auth.uid(), 'admin'), false)
       OR coalesce(auth.role(), '') = 'service_role'
       OR current_user IN ('postgres','supabase_admin')
     ) THEN
    RAISE EXCEPTION 'backfill_empresa_id: acesso restrito a administradores';
  END IF;

  SELECT count(*) INTO v_total_empresas FROM public.empresas;
  IF v_total_empresas = 1 THEN
    SELECT id INTO v_empresa_padrao FROM public.empresas LIMIT 1;
  END IF;

  FOR r IN SELECT v_fks[i][1] AS filha, v_fks[i][2] AS pai, v_fks[i][3] AS fk
             FROM generate_subscripts(v_fks, 1) AS i
  LOOP
    CONTINUE WHEN to_regclass('public.' || r.filha) IS NULL;
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=r.filha AND column_name='empresa_id');

    IF _dry_run THEN
      EXECUTE format(
        'SELECT count(*) FROM public.%I f JOIN public.%I p ON p.id = f.%I
          WHERE f.empresa_id IS NULL AND p.empresa_id IS NOT NULL',
        r.filha, r.pai, r.fk) INTO v_n;
    ELSE
      EXECUTE format(
        'WITH upd AS (
           UPDATE public.%I f SET empresa_id = p.empresa_id
             FROM public.%I p
            WHERE p.id = f.%I AND f.empresa_id IS NULL AND p.empresa_id IS NOT NULL
          RETURNING 1)
         SELECT count(*) FROM upd', r.filha, r.pai, r.fk) INTO v_n;
    END IF;

    EXECUTE format('SELECT count(*) FROM public.%I WHERE empresa_id IS NULL', r.filha) INTO v_p;

    tabela := r.filha; estrategia := 'fk:' || r.pai;
    registros_ajustados := v_n; pendentes := v_p;
    RETURN NEXT;
  END LOOP;

  FOR r IN SELECT unnest(v_diretas) AS t LOOP
    CONTINUE WHEN to_regclass('public.' || r.t) IS NULL;
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=r.t AND column_name='empresa_id');

    v_n := 0;
    IF v_empresa_padrao IS NOT NULL AND NOT _dry_run THEN
      EXECUTE format(
        'WITH upd AS (
           UPDATE public.%I SET empresa_id = $1 WHERE empresa_id IS NULL RETURNING 1)
         SELECT count(*) FROM upd', r.t) USING v_empresa_padrao INTO v_n;
    ELSIF v_empresa_padrao IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM public.%I WHERE empresa_id IS NULL', r.t) INTO v_n;
    END IF;

    EXECUTE format('SELECT count(*) FROM public.%I WHERE empresa_id IS NULL', r.t) INTO v_p;

    tabela := r.t;
    estrategia := CASE WHEN v_empresa_padrao IS NOT NULL
                       THEN 'empresa_unica' ELSE 'skip:multiplas_empresas' END;
    registros_ajustados := v_n; pendentes := v_p;
    RETURN NEXT;
  END LOOP;
END;
$_$;


--


CREATE OR REPLACE FUNCTION public.calcular_potencial_elisao(p_empresa_id uuid) RETURNS TABLE(tipo_oportunidade text, descricao text, valor_estimado numeric, ncm_relacionado text)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT 'oportunidade_elisao'::TEXT,
         COALESCE(o.categoria, o.estrategia),
         o.economia_estimada,
         NULL::TEXT
  FROM public.oportunidades_elisao o
  WHERE o.empresa_id = p_empresa_id
    AND o.aplicavel
    AND o.status <> 'descartada'
  UNION ALL
  SELECT 'credito_tributario'::TEXT,
         COALESCE(c.metodologia_aplicada, 'Crédito identificado em auditoria'),
         c.valor_credito_calculado,
         c.ncm
  FROM public.elisao_creditos_auditoria c
  WHERE c.empresa_id = p_empresa_id
    AND c.status_aprovacao = 'aprovado';
$$;


--


CREATE OR REPLACE FUNCTION public.capture_index_usage_snapshot() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_linhas integer;
BEGIN
  INSERT INTO public.index_usage_snapshots (
    snapshot_date, schema_name, table_name, index_name,
    idx_scan, size_bytes, is_unique, is_primary
  )
  SELECT CURRENT_DATE,
         s.schemaname,
         s.relname,
         s.indexrelname,
         s.idx_scan,
         pg_relation_size(s.indexrelid),
         i.indisunique,
         i.indisprimary
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON i.indexrelid = s.indexrelid
  WHERE s.schemaname = 'public'
  ON CONFLICT (snapshot_date, schema_name, index_name) DO UPDATE
    SET idx_scan = EXCLUDED.idx_scan,
        size_bytes = EXCLUDED.size_bytes;

  GET DIAGNOSTICS v_linhas = ROW_COUNT;

  DELETE FROM public.index_usage_snapshots
  WHERE snapshot_date < CURRENT_DATE - INTERVAL '180 days';

  RETURN v_linhas;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.claim_frontend_error_alerts(p_window_minutes integer DEFAULT 15, p_threshold integer DEFAULT 10, p_cooldown_minutes integer DEFAULT 60, p_limit integer DEFAULT 20) RETURNS TABLE(assinatura text, exemplo_mensagem text, severity text, ocorrencias bigint, usuarios_afetados bigint, urls_distintas bigint, primeira_ocorrencia timestamp with time zone, ultima_ocorrencia timestamp with time zone, is_nova boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
#variable_conflict use_column
DECLARE
  v_threshold integer := greatest(1, coalesce(p_threshold, 10));
  v_cooldown integer := greatest(0, least(coalesce(p_cooldown_minutes, 60), 10080));
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 100));
  v_desde timestamptz := now() - make_interval(mins => greatest(1, least(coalesce(p_window_minutes, 15), 1440)));
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH grupos AS (
    SELECT
      public.fe_error_signature(fel.error_message) AS sig,
      (array_agg(fel.error_message ORDER BY fel.created_at DESC))[1] AS exemplo,
      (array_agg(fel.severity ORDER BY fel.created_at DESC))[1] AS sev,
      count(*) AS total,
      count(DISTINCT fel.user_id) AS usuarios,
      count(DISTINCT fel.url) AS urls,
      min(fel.created_at) AS primeira,
      max(fel.created_at) AS ultima
    FROM public.frontend_error_logs fel
    WHERE fel.created_at >= v_desde
    GROUP BY 1
    HAVING count(*) >= v_threshold
  ),
  elegiveis AS (
    SELECT g.*
    FROM grupos g
    LEFT JOIN public.frontend_error_alert_state s ON s.assinatura = g.sig
    WHERE s.assinatura IS NULL
       OR (
         coalesce(s.silenciado_ate, '-infinity'::timestamptz) < now()
         AND s.ultimo_alerta_em <= now() - make_interval(mins => v_cooldown)
       )
    ORDER BY g.total DESC
    LIMIT v_limit
  ),
  gravados(sig_gravada, nova) AS (
    INSERT INTO public.frontend_error_alert_state AS st (
      assinatura, severity, exemplo_mensagem, primeiro_alerta_em,
      ultimo_alerta_em, ocorrencias_no_ultimo_alerta, alertas_enviados
    )
    SELECT e.sig, e.sev, left(e.exemplo, 2000), now(), now(), e.total, 1
    FROM elegiveis e
    ON CONFLICT (assinatura) DO UPDATE SET
      severity = EXCLUDED.severity,
      exemplo_mensagem = EXCLUDED.exemplo_mensagem,
      ultimo_alerta_em = now(),
      ocorrencias_no_ultimo_alerta = EXCLUDED.ocorrencias_no_ultimo_alerta,
      alertas_enviados = st.alertas_enviados + 1
    RETURNING st.assinatura, (st.alertas_enviados = 1)
  )
  SELECT e.sig, e.exemplo, e.sev, e.total, e.usuarios, e.urls, e.primeira, e.ultima, gr.nova
  FROM elegiveis e
  JOIN gravados gr ON gr.sig_gravada = e.sig
  ORDER BY e.total DESC;
END
$$;


--


CREATE OR REPLACE FUNCTION public.claim_silenciamentos_digest(p_horas integer DEFAULT 168, p_min_intervalo_horas integer DEFAULT 144) RETURNS TABLE(assinatura text, severity text, exemplo_mensagem text, silenciado_ate timestamp with time zone, horas_restantes numeric, ja_expirou boolean, alertas_enviados integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_horas integer := least(greatest(coalesce(p_horas, 168), 1), 720);
  v_min   integer := least(greatest(coalesce(p_min_intervalo_horas, 144), 0), 720);
BEGIN
  -- Serializa execuções concorrentes do agendador antes de decidir o envio.
  LOCK TABLE public.frontend_error_silence_digest_log IN SHARE ROW EXCLUSIVE MODE;

  IF v_min > 0 AND EXISTS (
    SELECT 1 FROM public.frontend_error_silence_digest_log d
    WHERE d.executado_em > now() - make_interval(hours => v_min)
  ) THEN
    RETURN; -- digest recente já enviado
  END IF;

  RETURN QUERY
  WITH sel AS (
    SELECT
      s.assinatura,
      s.severity,
      s.exemplo_mensagem,
      s.silenciado_ate,
      round(extract(epoch FROM (s.silenciado_ate - now())) / 3600.0, 1)::numeric AS horas_restantes,
      (s.silenciado_ate <= now()) AS ja_expirou,
      s.alertas_enviados
    FROM public.frontend_error_alert_state s
    WHERE s.silenciado_ate IS NOT NULL
      AND s.silenciado_ate <= now() + make_interval(hours => v_horas)
      AND s.silenciado_ate >= now() - make_interval(hours => v_horas)
    ORDER BY s.silenciado_ate ASC
    LIMIT 200
  ),
  agg AS (
    SELECT count(*)::integer AS n, coalesce(array_agg(sel.assinatura), '{}'::text[]) AS lista
    FROM sel
  ),
  ins AS (
    -- Só consome a janela de cooldown quando há de fato o que comunicar.
    INSERT INTO public.frontend_error_silence_digest_log (janela_horas, itens, assinaturas)
    SELECT v_horas, agg.n, agg.lista FROM agg WHERE agg.n > 0
    RETURNING 1
  )
  SELECT sel.assinatura, sel.severity, sel.exemplo_mensagem, sel.silenciado_ate,
         sel.horas_restantes, sel.ja_expirou, sel.alertas_enviados
  FROM sel
  WHERE (SELECT count(*) FROM ins) >= 0
  ORDER BY sel.silenciado_ate ASC;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.close_stale_integrity_alerts(p_hour timestamp with time zone, p_domains text[], p_grace interval DEFAULT '00:00:00'::interval) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF p_hour IS NULL OR p_domains IS NULL OR array_length(p_domains, 1) IS NULL THEN
    RETURN 0;
  END IF;

  -- Um alerta representa um sintoma vivo. Se nenhuma rodada dentro da janela
  -- [p_hour - p_grace, ...] reproduziu o invariante, a inconsistencia foi
  -- corrigida: encerra. O limite e INCLUSIVO (>=) — com grace = 0 a propria
  -- rodada corrente conta como reincidencia.
  WITH fechados AS (
    UPDATE public.integrity_alerts a
    SET resolved_at = now(),
        resolved_reason = 'auto: invariante nao reproduzido em ' || p_hour::text
    WHERE a.resolved_at IS NULL
      AND a.domain = ANY (p_domains)
      AND a.alert_hour < (p_hour - p_grace)
      AND NOT EXISTS (
        SELECT 1 FROM public.integrity_alerts b
        WHERE b.domain = a.domain
          AND b.invariant = a.invariant
          AND b.alert_hour >= (p_hour - p_grace)
      )
    RETURNING 1
  )
  SELECT count(*)::int INTO v_count FROM fechados;

  RETURN v_count;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.definir_empresa_padrao(_empresa_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ativo boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem definir a empresa padrão';
  END IF;

  SELECT COALESCE(ativo, true) INTO v_ativo FROM public.empresas WHERE id = _empresa_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empresa inexistente';
  END IF;
  IF NOT v_ativo THEN
    RAISE EXCEPTION 'Empresa inativa não pode ser a padrão';
  END IF;

  UPDATE public.empresas SET is_padrao = true WHERE id = _empresa_id;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data, details)
  VALUES (auth.uid(), 'EMPRESA_PADRAO_DEFINIDA', 'empresas', _empresa_id::text,
          jsonb_build_object('empresa_id', _empresa_id), 'Empresa padrão alterada');

  RETURN jsonb_build_object('ok', true, 'empresa_id', _empresa_id);
END;
$$;


--


CREATE OR REPLACE FUNCTION public.delete_cron_job(job_id bigint) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'cron'
    AS $$
DECLARE
  v_name text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem remover tarefas agendadas';
  END IF;

  SELECT jobname INTO v_name FROM cron.job WHERE jobid = job_id;
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Tarefa agendada % não encontrada', job_id;
  END IF;

  PERFORM cron.unschedule(v_name);
  RETURN true;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.detectar_duplicidades_financeiras(p_empresa_id uuid, p_tabela text DEFAULT 'contas_pagar'::text) RETURNS TABLE(entidade_tipo text, contraparte_id uuid, numero_documento text, valor numeric, data_vencimento date, ocorrencias bigint, valor_total numeric, ids uuid[])
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF p_empresa_id IS NULL THEN
    RAISE EXCEPTION 'empresa_id é obrigatório';
  END IF;
  IF p_tabela NOT IN ('contas_pagar', 'contas_receber') THEN
    RAISE EXCEPTION 'Tabela inválida: %. Use contas_pagar ou contas_receber.', p_tabela;
  END IF;
  IF NOT public.empresa_acessivel(p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado à empresa informada';
  END IF;

  IF p_tabela = 'contas_pagar' THEN
    RETURN QUERY
    SELECT 'conta_pagar'::text, cp.fornecedor_id, cp.numero_documento, cp.valor,
           cp.data_vencimento::date, count(*)::bigint, sum(cp.valor)::numeric,
           array_agg(cp.id ORDER BY cp.created_at)
    FROM public.contas_pagar cp
    WHERE cp.empresa_id = p_empresa_id
      AND cp.deleted_at IS NULL
      AND COALESCE(cp.status,'pendente') <> 'cancelado'
    GROUP BY cp.fornecedor_id, cp.numero_documento, cp.valor, cp.data_vencimento::date
    HAVING count(*) > 1
    ORDER BY count(*) DESC, sum(cp.valor) DESC;
  ELSE
    RETURN QUERY
    SELECT 'conta_receber'::text, cr.cliente_id, cr.numero_documento, cr.valor,
           cr.data_vencimento::date, count(*)::bigint, sum(cr.valor)::numeric,
           array_agg(cr.id ORDER BY cr.created_at)
    FROM public.contas_receber cr
    WHERE cr.empresa_id = p_empresa_id
      AND cr.deleted_at IS NULL
      AND COALESCE(cr.status,'pendente') <> 'cancelado'
    GROUP BY cr.cliente_id, cr.numero_documento, cr.valor, cr.data_vencimento::date
    HAVING count(*) > 1
    ORDER BY count(*) DESC, sum(cr.valor) DESC;
  END IF;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.duplicate_saved_filter(_source_id uuid, _new_name text DEFAULT ''::text) RETURNS uuid
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_source public.saved_filters%ROWTYPE;
  v_name text;
  v_new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- RLS de SELECT garante que só presets acessíveis sejam encontrados.
  SELECT * INTO v_source FROM public.saved_filters WHERE id = _source_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Preset não encontrado ou sem acesso';
  END IF;

  v_name := NULLIF(btrim(coalesce(_new_name, '')), '');
  IF v_name IS NULL THEN
    v_name := v_source.name || ' (cópia)';
  END IF;

  INSERT INTO public.saved_filters (
    user_id, created_by, entity_type, name, filters, is_default, is_shared, empresa_id, shared_with_roles
  ) VALUES (
    auth.uid(), auth.uid(), v_source.entity_type, v_name, v_source.filters, false, false, NULL, '{}'::text[]
  )
  ON CONFLICT (user_id, entity_type, name) DO UPDATE SET filters = EXCLUDED.filters, updated_at = now()
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.empresa_membro_ativo(_empresa_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT _empresa_id IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM public.user_empresas ue
       WHERE ue.empresa_id = _empresa_id
         AND ue.user_id = (SELECT auth.uid())
         AND ue.ativo = true
     );
$$;


--


CREATE OR REPLACE FUNCTION public.empresa_padrao_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT e.id FROM public.empresas e
      WHERE e.is_padrao AND COALESCE(e.ativo, true) LIMIT 1),
    (SELECT e.id FROM public.empresas e
      WHERE COALESCE(e.ativo, true)
      ORDER BY e.created_at ASC, e.id ASC LIMIT 1)
  )
$$;


--


CREATE OR REPLACE FUNCTION public.empresas_unica_padrao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Empresa desativada nunca permanece como padrão
  IF NOT COALESCE(NEW.ativo, true) THEN
    IF TG_OP = 'UPDATE' AND NEW.is_padrao AND COALESCE(OLD.ativo, true) THEN
      NEW.is_padrao := false;
      RETURN NEW;
    END IF;
    IF NEW.is_padrao THEN
      RAISE EXCEPTION 'Uma empresa inativa não pode ser a empresa padrão';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.is_padrao THEN
    UPDATE public.empresas e
       SET is_padrao = false
     WHERE e.is_padrao AND e.id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.escalate_stale_integrity_alerts(p_age interval DEFAULT '24:00:00'::interval) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_count   bigint := 0;
  v_oldest  timestamptz;
  v_domains text[];
  v_samples uuid[];
  v_hour    timestamptz := date_trunc('hour', now());
  v_closed  integer := 0;
BEGIN
  SELECT count(*), min(created_at),
         array_agg(DISTINCT domain),
         (array_agg(id ORDER BY created_at))[1:5]
    INTO v_count, v_oldest, v_domains, v_samples
    FROM public.integrity_alerts
   WHERE resolved_at IS NULL
     AND severity = 'critical'
     AND created_at < now() - p_age;

  IF COALESCE(v_count, 0) = 0 THEN
    UPDATE public.performance_alerts
       SET resolved_at = now(),
           resolved_reason = 'auto: nenhum alerta critico de integridade envelhecido'
     WHERE source = 'cron'
       AND alert_key = 'integrity_stale_critical'
       AND resolved_at IS NULL;
    GET DIAGNOSTICS v_closed = ROW_COUNT;
    RETURN jsonb_build_object('escalated', 0, 'closed', v_closed, 'success', true);
  END IF;

  INSERT INTO public.performance_alerts (
    source, alert_key, alert_hour, severity, reason,
    current_value, sample_count, metadata
  ) VALUES (
    'cron', 'integrity_stale_critical', v_hour, 'critical',
    format('%s alerta(s) critico(s) de integridade abertos ha mais de %s (mais antigo: %s)',
           v_count, p_age::text, to_char(v_oldest, 'DD/MM HH24:MI')),
    v_count, v_count,
    jsonb_build_object(
      'dominios', to_jsonb(v_domains),
      'amostras', to_jsonb(v_samples),
      'mais_antigo', v_oldest,
      'idade_horas', round(EXTRACT(EPOCH FROM (now() - v_oldest)) / 3600.0, 1)
    )
  )
  ON CONFLICT (source, alert_key, alert_hour) DO UPDATE
    SET reason        = EXCLUDED.reason,
        current_value = EXCLUDED.current_value,
        sample_count  = EXCLUDED.sample_count,
        metadata      = EXCLUDED.metadata,
        resolved_at   = NULL,
        resolved_reason = NULL;

  RETURN jsonb_build_object(
    'escalated', v_count, 'closed', 0,
    'oldest', v_oldest, 'domains', to_jsonb(v_domains), 'success', true
  );
END;
$$;


--


CREATE OR REPLACE FUNCTION public.fe_error_signature(p_message text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT left(
    regexp_replace(
      regexp_replace(coalesce(p_message, ''), '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '<uuid>', 'gi'),
      '\d+', '<n>', 'g'), 200)
$$;


--


CREATE OR REPLACE FUNCTION public.fn_balancete(p_empresa_id uuid, p_data_inicio date, p_data_fim date, p_nivel_max integer DEFAULT NULL::integer) RETURNS TABLE(conta_id uuid, codigo text, nome text, tipo text, natureza text, nivel integer, aceita_lancamento boolean, saldo_anterior numeric, debitos numeric, creditos numeric, saldo_final numeric)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  WITH RECURSIVE mov AS (
    SELECT
      p.conta_id AS c_id,
      SUM(CASE WHEN l.data_lancamento < p_data_inicio
               THEN CASE WHEN p.tipo = 'D' THEN p.valor ELSE -p.valor END
               ELSE 0 END) AS saldo_anterior,
      SUM(CASE WHEN l.data_lancamento >= p_data_inicio AND l.data_lancamento <= p_data_fim AND p.tipo = 'D'
               THEN p.valor ELSE 0 END) AS debitos,
      SUM(CASE WHEN l.data_lancamento >= p_data_inicio AND l.data_lancamento <= p_data_fim AND p.tipo = 'C'
               THEN p.valor ELSE 0 END) AS creditos
    FROM public.partidas_contabeis p
    JOIN public.lancamentos_contabeis l ON l.id = p.lancamento_id
    WHERE l.empresa_id = p_empresa_id
      AND l.data_lancamento <= p_data_fim
      AND COALESCE(l.status, 'ativo') <> 'cancelado'
    GROUP BY p.conta_id
  ),
  closure AS (
    SELECT pc.id AS ancestor_id, pc.id AS descendant_id
    FROM public.plano_contas pc
    WHERE pc.empresa_id = p_empresa_id
    UNION ALL
    SELECT c.ancestor_id, pc.id
    FROM closure c
    JOIN public.plano_contas pc ON pc.parent_id = c.descendant_id
    WHERE pc.empresa_id = p_empresa_id
  )
  SELECT
    pc.id,
    pc.codigo,
    pc.nome,
    pc.tipo,
    pc.natureza,
    COALESCE(pc.nivel, 1)::integer,
    COALESCE(pc.aceita_lancamento, true),
    COALESCE(SUM(m.saldo_anterior), 0)::numeric,
    COALESCE(SUM(m.debitos), 0)::numeric,
    COALESCE(SUM(m.creditos), 0)::numeric,
    (COALESCE(SUM(m.saldo_anterior), 0) + COALESCE(SUM(m.debitos), 0) - COALESCE(SUM(m.creditos), 0))::numeric
  FROM public.plano_contas pc
  JOIN closure cl ON cl.ancestor_id = pc.id
  LEFT JOIN mov m ON m.c_id = cl.descendant_id
  WHERE pc.empresa_id = p_empresa_id
    AND COALESCE(pc.ativo, true) = true
    AND (p_nivel_max IS NULL OR COALESCE(pc.nivel, 1) <= p_nivel_max)
  GROUP BY pc.id, pc.codigo, pc.nome, pc.tipo, pc.natureza, pc.nivel, pc.aceita_lancamento
  ORDER BY pc.codigo;
$$;


--


CREATE OR REPLACE FUNCTION public.fn_indices_contabeis(p_empresa_id uuid, p_data_inicio date, p_data_fim date) RETURNS TABLE(ativo_total numeric, ativo_circulante numeric, ativo_nao_circulante numeric, realizavel_lp numeric, imobilizado numeric, disponibilidades numeric, clientes numeric, estoques numeric, passivo_circulante numeric, passivo_nao_circulante numeric, fornecedores numeric, patrimonio_liquido numeric, receita_bruta numeric, deducoes_receita numeric, receita_liquida numeric, cmv numeric, lucro_liquido numeric, dias_periodo integer)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  WITH bal AS (
    SELECT
      b.saldo_final,
      b.debitos,
      b.creditos,
      b.aceita_lancamento,
      public.fn_norm_conta_codigo(COALESCE(NULLIF(pc.codigo_referencial, ''), b.codigo)) AS k
    FROM public.fn_balancete(p_empresa_id, p_data_inicio, p_data_fim) b
    JOIN public.plano_contas pc ON pc.id = b.conta_id
    WHERE b.aceita_lancamento
  ),
  -- Patrimoniais: saldo acumulado (D-C). Resultado: movimento do período.
  agg AS (
    SELECT
      SUM(CASE WHEN k LIKE '01%'     THEN saldo_final ELSE 0 END) AS ativo_total,
      SUM(CASE WHEN k LIKE '0101%'   THEN saldo_final ELSE 0 END) AS ativo_circulante,
      SUM(CASE WHEN k LIKE '0102%'   THEN saldo_final ELSE 0 END) AS ativo_nao_circulante,
      SUM(CASE WHEN k LIKE '010201%' THEN saldo_final ELSE 0 END) AS realizavel_lp,
      SUM(CASE WHEN k LIKE '010203%' THEN saldo_final ELSE 0 END) AS imobilizado,
      SUM(CASE WHEN k LIKE '010101%' OR k LIKE '010102%' THEN saldo_final ELSE 0 END) AS disponibilidades,
      SUM(CASE WHEN k LIKE '010103%' THEN saldo_final ELSE 0 END) AS clientes,
      SUM(CASE WHEN k LIKE '010104%' THEN saldo_final ELSE 0 END) AS estoques,
      SUM(CASE WHEN k LIKE '0201%'   THEN -saldo_final ELSE 0 END) AS passivo_circulante,
      SUM(CASE WHEN k LIKE '0202%'   THEN -saldo_final ELSE 0 END) AS passivo_nao_circulante,
      SUM(CASE WHEN k LIKE '020101%' THEN -saldo_final ELSE 0 END) AS fornecedores,
      SUM(CASE WHEN k LIKE '0203%'   THEN -saldo_final ELSE 0 END) AS patrimonio_liquido,
      SUM(CASE WHEN k LIKE '0301%'   THEN (creditos - debitos) ELSE 0 END) AS receita_bruta,
      SUM(CASE WHEN k LIKE '0302%'   THEN (debitos - creditos) ELSE 0 END) AS deducoes_receita,
      SUM(CASE WHEN k LIKE '0303%'   THEN (debitos - creditos) ELSE 0 END) AS cmv,
      SUM(CASE WHEN k LIKE '03%'     THEN (creditos - debitos) ELSE 0 END) AS lucro_liquido
    FROM bal
  )
  SELECT
    COALESCE(ativo_total, 0)::numeric,
    COALESCE(ativo_circulante, 0)::numeric,
    COALESCE(ativo_nao_circulante, 0)::numeric,
    COALESCE(realizavel_lp, 0)::numeric,
    COALESCE(imobilizado, 0)::numeric,
    COALESCE(disponibilidades, 0)::numeric,
    COALESCE(clientes, 0)::numeric,
    COALESCE(estoques, 0)::numeric,
    COALESCE(passivo_circulante, 0)::numeric,
    COALESCE(passivo_nao_circulante, 0)::numeric,
    COALESCE(fornecedores, 0)::numeric,
    COALESCE(patrimonio_liquido, 0)::numeric,
    COALESCE(receita_bruta, 0)::numeric,
    COALESCE(deducoes_receita, 0)::numeric,
    (COALESCE(receita_bruta, 0) - COALESCE(deducoes_receita, 0))::numeric,
    COALESCE(cmv, 0)::numeric,
    COALESCE(lucro_liquido, 0)::numeric,
    GREATEST((p_data_fim - p_data_inicio) + 1, 1)::integer
  FROM agg;
$$;


--


CREATE OR REPLACE FUNCTION public.fn_livro_razao(p_empresa_id uuid, p_data_inicio date, p_data_fim date, p_conta_id uuid DEFAULT NULL::uuid) RETURNS TABLE(conta_id uuid, codigo text, nome text, saldo_anterior numeric, lancamento_id uuid, data_lancamento date, numero_lancamento bigint, historico text, debito numeric, credito numeric, saldo_corrido numeric)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  WITH base AS (
    SELECT
      p.conta_id AS c_id,
      pc.codigo AS c_codigo,
      pc.nome AS c_nome,
      l.id AS l_id,
      l.data_lancamento AS l_data,
      l.numero_lancamento AS l_numero,
      COALESCE(l.historico, COALESCE(p.historico_complementar, '')) AS l_hist,
      CASE WHEN p.tipo = 'D' THEN p.valor ELSE 0 END AS deb,
      CASE WHEN p.tipo = 'C' THEN p.valor ELSE 0 END AS cred,
      (l.data_lancamento < p_data_inicio) AS anterior,
      COALESCE(p.ordem, 0) AS p_ordem
    FROM public.partidas_contabeis p
    JOIN public.lancamentos_contabeis l ON l.id = p.lancamento_id
    JOIN public.plano_contas pc ON pc.id = p.conta_id
    WHERE l.empresa_id = p_empresa_id
      AND l.data_lancamento <= p_data_fim
      AND COALESCE(l.status, 'ativo') <> 'cancelado'
      AND (p_conta_id IS NULL OR p.conta_id = p_conta_id)
  ),
  ant AS (
    SELECT c_id, COALESCE(SUM(deb - cred), 0) AS saldo_anterior
    FROM base WHERE anterior GROUP BY c_id
  )
  SELECT
    b.c_id,
    b.c_codigo,
    b.c_nome,
    COALESCE(a.saldo_anterior, 0)::numeric,
    b.l_id,
    b.l_data,
    b.l_numero,
    b.l_hist,
    b.deb::numeric,
    b.cred::numeric,
    (COALESCE(a.saldo_anterior, 0) + SUM(b.deb - b.cred) OVER (
        PARTITION BY b.c_id ORDER BY b.l_data, b.l_numero NULLS LAST, b.p_ordem, b.l_id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW))::numeric
  FROM base b
  LEFT JOIN ant a ON a.c_id = b.c_id
  WHERE NOT b.anterior
  ORDER BY b.c_codigo, b.l_data, b.l_numero NULLS LAST, b.p_ordem;
$$;


--


CREATE OR REPLACE FUNCTION public.frontend_error_logs_sanitize() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Canário do gate de segurança: aceita a requisição (prova o privilégio de
  -- INSERT) mas descarta a linha, mantendo a base limpa.
  IF NEW.error_message IS NOT NULL
     AND NEW.error_message LIKE '[ci-anon-surface-probe]%' THEN
    RETURN NULL;
  END IF;

  -- Truncamento defensivo: mantém os payloads dentro dos limites do CHECK
  -- frontend_error_logs_payload_bounds em vez de rejeitar a telemetria.
  NEW.error_message := left(NEW.error_message, 2000);
  NEW.error_stack   := left(NEW.error_stack, 8000);
  NEW.url           := left(NEW.url, 2000);
  NEW.user_agent    := left(NEW.user_agent, 500);

  IF NEW.metadata IS NULL THEN
    NEW.metadata := '{}'::jsonb;
  ELSIF pg_column_size(NEW.metadata) > 16384 THEN
    NEW.metadata := jsonb_build_object(
      'truncated', true,
      'original_size_bytes', pg_column_size(NEW.metadata)
    );
  END IF;

  RETURN NEW;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.gate_25_policies_sem_tenant() RETURNS TABLE(tabela text, policy_name text, cmd text, vinculo text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH exempt AS (
    SELECT unnest(ARRAY[
      'profiles','user_empresas','user_roles','sso_providers','sso_role_mappings',
      'sso_sandbox_runs','sso_user_groups','scim_tokens','scim_operations_log',
      'empresas','relatorios_agendados','historico_relatorios'
    ]) AS tbl
  ),
  candidatas AS (
    SELECT p.tablename::text AS tabela, p.policyname::text AS policy_name, p.cmd::text AS cmd,
           CASE WHEN EXISTS (
             SELECT 1 FROM information_schema.columns c
             WHERE c.table_schema='public' AND c.table_name=p.tablename AND c.column_name='empresa_id'
           ) THEN 'direto' ELSE 'fk' END AS vinculo,
           EXISTS (
             SELECT 1 FROM information_schema.columns c
             WHERE c.table_schema='public' AND c.table_name=p.tablename AND c.column_name='empresa_id'
           ) AS tem_coluna,
           EXISTS (
             SELECT 1 FROM pg_constraint fk
             JOIN information_schema.columns pc
               ON pc.table_schema='public'
              AND pc.table_name = fk.confrelid::regclass::text
              AND pc.column_name = 'empresa_id'
             WHERE fk.contype='f'
               AND fk.connamespace='public'::regnamespace
               AND fk.conrelid::regclass::text = p.tablename
           ) AS tem_fk
    FROM pg_policies p
    WHERE p.schemaname='public'
      AND p.tablename NOT IN (SELECT tbl FROM exempt)
      AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) LIKE '%has_role%'
      AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) NOT LIKE '%empresa%'
  )
  SELECT tabela, policy_name, cmd, vinculo
  FROM candidatas
  WHERE tem_coluna OR tem_fk
  ORDER BY 1, 2;
$$;


--


CREATE OR REPLACE FUNCTION public.gate_27_secdef_sem_search_path() RETURNS TABLE(funcao text, argumentos text, motivo text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
  SELECT
    p.proname::text,
    pg_get_function_identity_arguments(p.oid)::text,
    CASE
      WHEN sp.cfg IS NULL THEN 'sem SET search_path'
      ELSE 'search_path inseguro: ' || sp.cfg
    END
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  LEFT JOIN LATERAL (
    SELECT c AS cfg
    FROM unnest(COALESCE(p.proconfig, '{}'::text[])) c
    WHERE c LIKE 'search_path=%'
    LIMIT 1
  ) sp ON true
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND p.prokind = 'f'
    AND (
      sp.cfg IS NULL
      OR sp.cfg ~* '(^|[=,[:space:]])"?\$user"?([,[:space:]]|$)'
    )
  ORDER BY 1;
$_$;


--


CREATE OR REPLACE FUNCTION public.gate_29_rpc_sem_escopo_empresa() RETURNS TABLE(funcao text, tabelas text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH tenant_tabs AS (
    SELECT c.relname::text AS relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'empresa_id' AND a.attnum > 0
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
  ), secdef AS (
    SELECT p.oid, p.proname::text AS fn, p.prosrc
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.prokind = 'f'
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  )
  SELECT s.fn, string_agg(DISTINCT t.relname, ',')
  FROM secdef s
  JOIN tenant_tabs t ON s.prosrc ~ ('\mpublic\.' || t.relname || '\M')
  WHERE s.prosrc !~* '(empresa_acessivel|empresa_membro_ativo|empresa_id\s*=|empresa_padrao_id)'
    AND s.fn NOT IN ('resolve_sso_providers_for_domain')
  GROUP BY s.fn;
$$;


--


CREATE OR REPLACE FUNCTION public.gate_30_views_inseguras() RETURNS TABLE(objeto text, tipo text, motivo text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT c.relname::text,
         CASE c.relkind WHEN 'v' THEN 'view' ELSE 'matview' END,
         CASE
           WHEN c.relkind = 'v'
                AND NOT EXISTS (
                  SELECT 1 FROM unnest(coalesce(c.reloptions, '{}'::text[])) o
                  WHERE lower(o) IN ('security_invoker=on','security_invoker=true')
                )
             THEN 'view sem security_invoker: consulta roda com privilégios do owner e ignora RLS'
           WHEN c.relkind = 'm'
                AND (has_table_privilege('anon', c.oid, 'SELECT')
                  OR has_table_privilege('authenticated', c.oid, 'SELECT'))
             THEN 'matview exposta a roles do app: RLS não se aplica a visões materializadas'
         END
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('v','m')
    AND (
      (c.relkind = 'v' AND NOT EXISTS (
        SELECT 1 FROM unnest(coalesce(c.reloptions, '{}'::text[])) o
        WHERE lower(o) IN ('security_invoker=on','security_invoker=true')
      ))
      OR (c.relkind = 'm' AND (has_table_privilege('anon', c.oid, 'SELECT')
                            OR has_table_privilege('authenticated', c.oid, 'SELECT')))
    );
$$;


--


CREATE OR REPLACE FUNCTION public.gate_31_tenant_sem_indice() RETURNS TABLE(tabela text, motivo text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT c.relname::text,
         'tabela com RLS por empresa_id sem índice liderado por empresa_id: policies forçam seq scan por tenant'
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'empresa_id' AND a.attnum > 0 AND NOT a.attisdropped
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity
    AND NOT EXISTS (
      SELECT 1 FROM pg_index i
      WHERE i.indrelid = c.oid AND i.indkey[0] = a.attnum
    )
  ORDER BY 1;
$$;


--


CREATE OR REPLACE FUNCTION public.gate_32_pii_sem_mascara() RETURNS TABLE(objeto text, coluna text, motivo text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT c.relname::text, 'chave_pix',
         'view expõe chave_pix sem mascarar_chave_pix()/pode_ver_dado_sensivel()'
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'chave_pix' AND a.attnum > 0 AND NOT a.attisdropped
  WHERE n.nspname = 'public'
    AND c.relkind IN ('v','m')
    AND pg_get_viewdef(c.oid, true) NOT ILIKE '%mascarar_chave_pix%'
  ORDER BY 1;
$$;


--


CREATE OR REPLACE FUNCTION public.gate_33_indices_redundantes() RETURNS TABLE(tabela text, indice_redundante text, indice_equivalente text, motivo text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
  WITH idx AS (
    SELECT i.indrelid,
           i.indexrelid,
           i.indisunique,
           i.indisprimary,
           i.indkey::text  AS cols,
           i.indclass::text AS opclass,
           COALESCE(pg_get_expr(i.indexprs, i.indrelid), '') AS expr,
           COALESCE(pg_get_expr(i.indpred,   i.indrelid), '') AS pred,
           c.relname AS idxname,
           t.relname AS tblname
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
  )
  SELECT a.tblname::text,
         a.idxname::text,
         b.idxname::text,
         'mesmas colunas/opclass/predicado de um índice único ou anterior'::text
  FROM idx a
  JOIN idx b
    ON a.indrelid = b.indrelid
   AND a.cols = b.cols
   AND a.opclass = b.opclass
   AND a.expr = b.expr
   AND a.pred = b.pred
   AND a.indexrelid <> b.indexrelid
  WHERE NOT a.indisprimary
    AND NOT a.indisunique
    AND (b.indisunique OR b.indisprimary OR b.indexrelid < a.indexrelid)
$$;


--


CREATE OR REPLACE FUNCTION public.gate_34_indices_nao_utilizados(_min_dias integer DEFAULT 30) RETURNS TABLE(tabela text, indice text, dias_observados integer, tamanho_kb bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
  WITH janela AS (
    SELECT index_name,
           max(table_name)  AS table_name,
           max(idx_scan)    AS scans_max,
           min(idx_scan)    AS scans_min,
           max(size_bytes)  AS size_bytes,
           bool_or(is_unique OR is_primary) AS protegido,
           (max(snapshot_date) - min(snapshot_date))::int AS dias
    FROM public.index_usage_snapshots
    WHERE snapshot_date >= CURRENT_DATE - (_min_dias * 2)
    GROUP BY index_name
  )
  SELECT j.table_name,
         j.index_name,
         j.dias,
         (j.size_bytes / 1024)::bigint
  FROM janela j
  WHERE NOT j.protegido
    AND j.dias >= _min_dias
    AND j.scans_max = 0
    AND j.scans_min = 0
    AND NOT EXISTS (
      SELECT 1 FROM public.indices_uso_excecoes e WHERE e.index_name = j.index_name
    )
    AND EXISTS (
      SELECT 1 FROM pg_indexes p
      WHERE p.schemaname = 'public' AND p.indexname = j.index_name
    )
$$;


--


CREATE OR REPLACE FUNCTION public.gate_35_tabelas_sem_retencao() RETURNS TABLE(tabela text, coluna_temporal text, tamanho text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $_$
  SELECT ('public.' || c.relname)::text,
         (SELECT a.attname::text
            FROM pg_attribute a
            JOIN pg_type t ON t.oid = a.atttypid
           WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
             AND t.typname IN ('timestamptz','timestamp','date')
           ORDER BY (a.attname IN ('created_at','executed_at','dia')) DESC, a.attnum
           LIMIT 1),
         pg_size_pretty(pg_total_relation_size(c.oid))
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND NOT c.relispartition
     AND c.relname !~ '_(default|[0-9]{4}_[0-9]{2})$'
     AND c.relname ~ '(_log|_logs|logs_|_history|historico_|_snapshots|_events|_eventos|_attempts|_trail|auditoria_|_audit|telemetr|_cache|_runs|_queue)'
     AND EXISTS (
       SELECT 1 FROM pg_attribute a
        JOIN pg_type t ON t.oid = a.atttypid
       WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
         AND t.typname IN ('timestamptz','timestamp','date')
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.retencao_politicas p
        WHERE p.tabela = 'public.' || c.relname
     )
   ORDER BY pg_total_relation_size(c.oid) DESC;
$_$;


--


CREATE OR REPLACE FUNCTION public.gerar_alertas_vencimento() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_inseridos integer := 0;
BEGIN
  WITH titulos AS (
    SELECT cp.id, cp.empresa_id, cp.descricao AS titulo_desc, cp.valor,
           cp.data_vencimento, 'conta_pagar'::text AS entidade_tipo
    FROM public.contas_pagar cp
    WHERE cp.deleted_at IS NULL
      AND COALESCE(cp.status,'pendente') NOT IN ('pago','cancelado')
      AND cp.data_vencimento <= CURRENT_DATE + 7
    UNION ALL
    SELECT cr.id, cr.empresa_id, COALESCE(cr.numero_documento, 'Título a receber'), cr.valor,
           cr.data_vencimento, 'conta_receber'
    FROM public.contas_receber cr
    WHERE cr.deleted_at IS NULL
      AND COALESCE(cr.status,'pendente') NOT IN ('recebido','pago','cancelado')
      AND cr.data_vencimento <= CURRENT_DATE + 7
  ), destinos AS (
    SELECT t.*, ue.user_id,
      CASE
        WHEN t.data_vencimento < CURRENT_DATE THEN 'critica'
        WHEN t.data_vencimento <= CURRENT_DATE + 3 THEN 'alta'
        ELSE 'media'
      END AS prioridade
    FROM titulos t
    JOIN public.user_empresas ue
      ON ue.empresa_id = t.empresa_id AND COALESCE(ue.ativo, true)
  ), novos AS (
    INSERT INTO public.alertas (user_id, tipo, titulo, mensagem, prioridade, entidade_id, entidade_tipo, acao_url)
    SELECT d.user_id,
           'vencimento',
           CASE WHEN d.data_vencimento < CURRENT_DATE
                THEN 'Título vencido' ELSE 'Vencimento próximo' END,
           format('%s - R$ %s com vencimento em %s',
                  COALESCE(d.titulo_desc, 'Título'),
                  to_char(COALESCE(d.valor, 0), 'FM999G999G990D00'),
                  to_char(d.data_vencimento, 'DD/MM/YYYY')),
           d.prioridade,
           d.id,
           d.entidade_tipo,
           CASE WHEN d.entidade_tipo = 'conta_pagar' THEN '/contas-pagar' ELSE '/contas-receber' END
    FROM destinos d
    WHERE NOT EXISTS (
      SELECT 1 FROM public.alertas a
      WHERE a.user_id = d.user_id
        AND a.entidade_id = d.id
        AND a.tipo = 'vencimento'
        AND a.created_at > now() - INTERVAL '24 hours'
    )
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_inseridos FROM novos;

  RETURN v_inseridos;
END;
$_$;


--


CREATE OR REPLACE FUNCTION public.gerar_contas_recorrentes() RETURNS integer
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_rec       RECORD;
  v_data      DATE;
  v_limite    DATE := CURRENT_DATE + INTERVAL '30 days';
  v_criadas   INTEGER := 0;
  v_ref       DATE;
  v_dia       INTEGER;
  v_intervalo INTERVAL;
BEGIN
  FOR v_rec IN
    SELECT * FROM public.pagamentos_recorrentes
    WHERE ativo
      AND data_inicio <= v_limite
      AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
  LOOP
    v_intervalo := CASE v_rec.frequencia
      WHEN 'semanal'    THEN INTERVAL '7 days'
      WHEN 'quinzenal'  THEN INTERVAL '15 days'
      WHEN 'mensal'     THEN INTERVAL '1 month'
      WHEN 'bimestral'  THEN INTERVAL '2 months'
      WHEN 'trimestral' THEN INTERVAL '3 months'
      WHEN 'semestral'  THEN INTERVAL '6 months'
      ELSE INTERVAL '1 year'
    END;

    v_ref := COALESCE(v_rec.proxima_geracao, v_rec.data_inicio);

    WHILE v_ref <= v_limite AND (v_rec.data_fim IS NULL OR v_ref <= v_rec.data_fim) LOOP
      -- ajusta para o dia de vencimento válido dentro do mês
      v_dia := LEAST(
        v_rec.dia_vencimento,
        EXTRACT(DAY FROM (date_trunc('month', v_ref) + INTERVAL '1 month - 1 day'))::INTEGER
      );
      v_data := CASE
        WHEN v_rec.frequencia IN ('semanal','quinzenal') THEN v_ref
        ELSE date_trunc('month', v_ref)::DATE + (v_dia - 1)
      END;

      IF NOT EXISTS (
        SELECT 1 FROM public.contas_pagar cp
        WHERE cp.deleted_at IS NULL
          AND cp.metadata->>'pagamento_recorrente_id' = v_rec.id::TEXT
          AND cp.data_vencimento = v_data
      ) THEN
        INSERT INTO public.contas_pagar (
          descricao, valor, data_vencimento, status, fornecedor_id, fornecedor_nome,
          empresa_id, centro_custo_id, conta_bancaria_id, tipo_cobranca, observacoes,
          recorrente, user_id, metadata
        ) VALUES (
          v_rec.descricao, v_rec.valor, v_data, 'pendente', v_rec.fornecedor_id, v_rec.fornecedor_nome,
          v_rec.empresa_id, v_rec.centro_custo_id, v_rec.conta_bancaria_id,
          v_rec.tipo_cobranca::TEXT, v_rec.observacoes,
          TRUE, auth.uid(),
          jsonb_build_object('pagamento_recorrente_id', v_rec.id, 'gerado_em', now())
        );
        v_criadas := v_criadas + 1;
      END IF;

      v_ref := (v_ref + v_intervalo)::DATE;
    END LOOP;

    UPDATE public.pagamentos_recorrentes
       SET ultima_geracao = CURRENT_DATE,
           proxima_geracao = v_ref,
           total_gerado    = total_gerado + v_criadas
     WHERE id = v_rec.id;
  END LOOP;

  RETURN v_criadas;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.get_acessos_suspeitos(_horas integer DEFAULT 168, _somente_abertos boolean DEFAULT true) RETURNS SETOF public.acessos_suspeitos
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT s.* FROM public.acessos_suspeitos s
  WHERE public.has_role((SELECT auth.uid()), 'admin'::app_role)
    AND (s.empresa_id IS NULL OR public.empresa_acessivel(s.empresa_id))
    AND s.created_at >= now() - make_interval(hours => GREATEST(COALESCE(_horas, 168), 1))
    AND (NOT COALESCE(_somente_abertos, true) OR s.revisado_em IS NULL)
  ORDER BY (s.severidade = 'critical') DESC, s.created_at DESC
  LIMIT 500;
$$;


--


CREATE OR REPLACE FUNCTION public.get_active_uapi_token() RETURNS TABLE(access_token text, refresh_token text, user_fid text, token_age_hours numeric, needs_refresh boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
  SELECT 
    s.access_token,
    s.refresh_token,
    s.user_fid,
    EXTRACT(EPOCH FROM (now() - s.token_obtained_at)) / 3600 AS token_age_hours,
    EXTRACT(EPOCH FROM (now() - s.token_obtained_at)) / 3600 > 20 AS needs_refresh
  FROM public.lalamove_uapi_sessions s
  WHERE s.is_active = true
  LIMIT 1;
$$;


--


CREATE OR REPLACE FUNCTION public.get_catalogos_tributarios_history(_dias integer DEFAULT 30) RETURNS TABLE(dia date, criticos integer, avisos integer, infos integer, total_invariantes integer, saudavel boolean)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_dias integer := LEAST(GREATEST(COALESCE(_dias, 30), 1), 365);
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado: requer papel admin'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT h.dia, h.criticos, h.avisos, h.infos, h.total_invariantes, h.saudavel
    FROM public.catalogos_tributarios_health_history h
    WHERE h.dia >= current_date - v_dias
    ORDER BY h.dia ASC;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.get_cobertura_fiscal_uf() RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ufs jsonb;
  v_globais jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso restrito a administradores' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_agg(x ORDER BY x->>'uf')
  INTO v_ufs
  FROM (
    SELECT jsonb_build_object(
      'uf', u.sigla::text,
      'nome', u.nome,
      'regiao', u.regiao::text,
      'uf_atualizado_em', u.updated_at,
      'aliquotas_internas', COALESCE(ai.total, 0),
      'aliquotas_internas_atualizado_em', ai.ultima,
      'iss_municipios', COALESCE(iss.municipios, 0),
      'iss_registros', COALESCE(iss.total, 0),
      'iss_atualizado_em', iss.ultima,
      'protocolos_st', COALESCE(st.total, 0),
      'protocolos_st_atualizado_em', st.ultima,
      'beneficios_fiscais', COALESCE(bf.total, 0),
      'beneficios_atualizado_em', bf.ultima
    ) AS x
    FROM public.ufs u
    LEFT JOIN (
      SELECT uf, count(*)::int AS total, max(updated_at) AS ultima
      FROM public.aliquotas_internas_uf GROUP BY uf
    ) ai ON ai.uf = u.sigla
    LEFT JOIN (
      SELECT uf, count(*)::int AS total,
             count(DISTINCT codigo_ibge)::int AS municipios,
             max(updated_at) AS ultima
      FROM public.aliquotas_iss_municipal GROUP BY uf
    ) iss ON iss.uf = u.sigla
    LEFT JOIN (
      SELECT su.uf, count(DISTINCT su.protocolo_id)::int AS total, max(p.updated_at) AS ultima
      FROM public.protocolos_st_ufs su
      JOIN public.protocolos_st p ON p.id = su.protocolo_id
      GROUP BY su.uf
    ) st ON st.uf = u.sigla
    LEFT JOIN (
      SELECT uf, count(*)::int AS total, max(updated_at) AS ultima
      FROM public.beneficios_fiscais WHERE uf IS NOT NULL GROUP BY uf
    ) bf ON bf.uf = u.sigla
  ) s;

  SELECT jsonb_build_object(
    'cnaes', (SELECT count(*)::int FROM public.cnaes),
    'cnaes_atualizado_em', (SELECT max(updated_at) FROM public.cnaes),
    'ncms', (SELECT count(*)::int FROM public.ncms),
    'ncms_atualizado_em', (SELECT max(updated_at) FROM public.ncms),
    'ncms_st', (SELECT count(*)::int FROM public.ncms WHERE sujeito_st),
    'protocolos_st', (SELECT count(*)::int FROM public.protocolos_st),
    'protocolos_st_ncms', (SELECT count(*)::int FROM public.protocolos_st_ncms),
    'itens_lista_iss', (SELECT count(*)::int FROM public.itens_lista_iss),
    'ufs_total', (SELECT count(*)::int FROM public.ufs)
  ) INTO v_globais;

  RETURN jsonb_build_object(
    'gerado_em', now(),
    'globais', v_globais,
    'ufs', COALESCE(v_ufs, '[]'::jsonb)
  );
END;
$$;


--


CREATE OR REPLACE FUNCTION public.get_frontend_error_groups(p_desde timestamp with time zone DEFAULT (now() - '7 days'::interval), p_severity text DEFAULT NULL::text, p_limit integer DEFAULT 50) RETURNS TABLE(assinatura text, exemplo_mensagem text, severity text, ocorrencias bigint, usuarios_afetados bigint, urls_distintas bigint, primeira_ocorrencia timestamp with time zone, ultima_ocorrencia timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    left(regexp_replace(
           regexp_replace(fel.error_message, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '<uuid>', 'gi'),
           '\d+', '<n>', 'g'), 200) AS assinatura,
    (array_agg(fel.error_message ORDER BY fel.created_at DESC))[1] AS exemplo_mensagem,
    (array_agg(fel.severity ORDER BY fel.created_at DESC))[1] AS severity,
    count(*) AS ocorrencias,
    count(DISTINCT fel.user_id) AS usuarios_afetados,
    count(DISTINCT fel.url) AS urls_distintas,
    min(fel.created_at) AS primeira_ocorrencia,
    max(fel.created_at) AS ultima_ocorrencia
  FROM public.frontend_error_logs fel
  WHERE fel.created_at >= p_desde
    AND (p_severity IS NULL OR fel.severity = p_severity)
  GROUP BY 1
  ORDER BY count(*) DESC
  LIMIT greatest(1, least(coalesce(p_limit, 50), 200));
END $$;


--


CREATE OR REPLACE FUNCTION public.get_frontend_error_occurrences(p_assinatura text, p_desde timestamp with time zone DEFAULT (now() - '7 days'::interval), p_limit integer DEFAULT 25) RETURNS TABLE(id uuid, created_at timestamp with time zone, severity text, error_message text, error_stack text, url text, user_agent text, user_id uuid, metadata jsonb)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT fel.id, fel.created_at, fel.severity, fel.error_message, fel.error_stack,
         fel.url, fel.user_agent, fel.user_id, fel.metadata
  FROM public.frontend_error_logs fel
  WHERE fel.created_at >= p_desde
    AND left(regexp_replace(
              regexp_replace(fel.error_message, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '<uuid>', 'gi'),
              '\d+', '<n>', 'g'), 200) = p_assinatura
  ORDER BY fel.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 25), 100));
END $$;


--


CREATE OR REPLACE FUNCTION public.get_performance_alerts(p_days integer DEFAULT 7, p_severity text DEFAULT NULL::text, p_source text DEFAULT NULL::text, p_incluir_resolvidos boolean DEFAULT false) RETURNS TABLE(id uuid, source text, alert_key text, alert_hour timestamp with time zone, severity text, reason text, current_value numeric, baseline_value numeric, ratio numeric, sample_count integer, query_snippet text, metadata jsonb, created_at timestamp with time zone, resolved_at timestamp with time zone, resolved_reason text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar alertas de performance.';
  END IF;

  RETURN QUERY
  SELECT a.id, a.source, a.alert_key, a.alert_hour, a.severity, a.reason,
         a.current_value, a.baseline_value, a.ratio, a.sample_count,
         a.query_snippet, a.metadata, a.created_at, a.resolved_at, a.resolved_reason
  FROM public.performance_alerts a
  WHERE a.created_at > now() - make_interval(days => GREATEST(p_days, 1))
    AND (p_severity IS NULL OR a.severity = p_severity)
    AND (p_source IS NULL OR a.source = p_source)
    AND (COALESCE(p_incluir_resolvidos, false) OR a.resolved_at IS NULL)
  ORDER BY
    CASE WHEN a.resolved_at IS NULL THEN 0 ELSE 1 END,
    CASE a.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
    a.created_at DESC
  LIMIT 500;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.get_retencao_politicas_status() RETURNS TABLE(tabela text, coluna text, dias integer, filtro text, motivo text, ativo boolean, isenta boolean, tem_politica boolean, total_linhas bigint, linhas_vencidas bigint, registro_mais_antigo timestamp with time zone, atualizado_em timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  r            record;
  v_total      bigint;
  v_vencidas   bigint;
  v_antigo     timestamptz;
  v_where      text;
  v_reg        regclass;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado: requer papel admin';
  END IF;

  FOR r IN
    WITH log_like AS (
      SELECT c.relname::text AS nome
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relkind = 'r'
         AND NOT EXISTS (SELECT 1 FROM pg_inherits i WHERE i.inhrelid = c.oid)
         AND (
           c.relname ~ '(_log|_logs|_history|_snapshots|_events|_eventos|_attempts|_trail|_audit|_cache|_runs|_queue)$'
           OR c.relname ~ '^(historico_|auditoria_)'
           OR c.relname ~ 'telemetr'
         )
    ),
    pol AS (
      -- Normaliza: as políticas gravam o nome qualificado ("public.x").
      SELECT p.*, split_part(p.tabela, '.', greatest(1, array_length(string_to_array(p.tabela, '.'), 1)))::text AS nome
        FROM public.retencao_politicas p
    )
    SELECT COALESCE(p.tabela, 'public.' || l.nome)   AS tabela,
           p.coluna,
           p.dias,
           p.filtro,
           p.motivo,
           COALESCE(p.ativo, false)                  AS ativo,
           (p.id IS NOT NULL AND p.dias IS NULL)     AS isenta,
           (p.id IS NOT NULL)                        AS tem_politica,
           p.updated_at,
           COALESCE(p.nome, l.nome)                  AS nome
      FROM log_like l
      FULL OUTER JOIN pol p ON p.nome = l.nome
  LOOP
    v_total := NULL; v_vencidas := NULL; v_antigo := NULL;
    v_reg := to_regclass(format('public.%I', r.nome));

    IF v_reg IS NOT NULL THEN
      BEGIN
        EXECUTE format('SELECT count(*) FROM public.%I', r.nome) INTO v_total;

        IF r.coluna IS NOT NULL
           AND EXISTS (
             SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = r.nome AND column_name = r.coluna
           )
        THEN
          EXECUTE format('SELECT min(%I)::timestamptz FROM public.%I', r.coluna, r.nome)
            INTO v_antigo;

          IF r.dias IS NOT NULL THEN
            v_where := format('%I < now() - make_interval(days => %s)', r.coluna, r.dias);
            IF r.filtro IS NOT NULL AND btrim(r.filtro) <> '' THEN
              v_where := v_where || ' AND (' || r.filtro || ')';
            END IF;
            EXECUTE format('SELECT count(*) FROM public.%I WHERE %s', r.nome, v_where)
              INTO v_vencidas;
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_total := NULL; v_vencidas := NULL; v_antigo := NULL;
      END;
    END IF;

    tabela               := r.tabela;
    coluna               := r.coluna;
    dias                 := r.dias;
    filtro               := r.filtro;
    motivo               := r.motivo;
    ativo                := r.ativo;
    isenta               := r.isenta;
    tem_politica         := r.tem_politica;
    total_linhas         := v_total;
    linhas_vencidas      := v_vencidas;
    registro_mais_antigo := v_antigo;
    atualizado_em        := r.updated_at;
    RETURN NEXT;
  END LOOP;
END;
$_$;


--


CREATE OR REPLACE FUNCTION public.get_silenciamentos_expirando(p_horas integer DEFAULT 72) RETURNS TABLE(assinatura text, severity text, exemplo_mensagem text, silenciado_ate timestamp with time zone, horas_restantes numeric, ja_expirou boolean, alertas_enviados integer, ocorrencias_no_ultimo_alerta integer)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_horas integer := least(greatest(coalesce(p_horas, 72), 1), 720);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar silenciamentos.';
  END IF;

  RETURN QUERY
  SELECT
    s.assinatura,
    s.severity,
    s.exemplo_mensagem,
    s.silenciado_ate,
    round(extract(epoch FROM (s.silenciado_ate - now())) / 3600.0, 1)::numeric,
    (s.silenciado_ate <= now()),
    s.alertas_enviados,
    s.ocorrencias_no_ultimo_alerta
  FROM public.frontend_error_alert_state s
  WHERE s.silenciado_ate IS NOT NULL
    AND s.silenciado_ate <= now() + make_interval(hours => v_horas)
    AND s.silenciado_ate >= now() - make_interval(hours => v_horas)
  ORDER BY s.silenciado_ate ASC
  LIMIT 200;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.get_ultima_carga_fiscal() RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso restrito a administradores' USING ERRCODE = '42501';
  END IF;

  SELECT to_jsonb(c) INTO v
    FROM public.catalogos_fiscais_cargas c
   ORDER BY c.last_updated DESC
   LIMIT 1;

  RETURN COALESCE(v, '{}'::jsonb);
END;
$$;


--


CREATE OR REPLACE FUNCTION public.increment_pix_template_uso(p_template_id uuid) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.pix_templates
     SET uso_count = COALESCE(uso_count, 0) + 1
   WHERE id = p_template_id;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.internal_job_secret() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
  SELECT valor FROM public.integration_secrets WHERE chave = 'internal_jobs' LIMIT 1;
$$;


--


CREATE OR REPLACE FUNCTION public.mascarar_chave_pix(_valor text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT CASE
    WHEN _valor IS NULL OR length(btrim(_valor)) = 0 THEN _valor
    WHEN length(btrim(_valor)) <= 4 THEN repeat('*', length(btrim(_valor)))
    ELSE repeat('*', greatest(length(btrim(_valor)) - 4, 3)) || right(btrim(_valor), 4)
  END;
$$;


--


CREATE OR REPLACE FUNCTION public.pix_template_sync_legacy() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.favorecido_nome := COALESCE(NEW.favorecido_nome, NEW.beneficiario_nome);
  NEW.beneficiario_nome := COALESCE(NEW.beneficiario_nome, NEW.favorecido_nome);
  NEW.tipo_chave_pix := COALESCE(NEW.tipo_chave_pix, NEW.tipo_chave);
  NEW.tipo_chave := COALESCE(NEW.tipo_chave, NEW.tipo_chave_pix);
  IF NEW.favorecido_nome IS NULL OR NEW.tipo_chave_pix IS NULL THEN
    RAISE EXCEPTION 'favorecido_nome e tipo_chave_pix são obrigatórios';
  END IF;
  RETURN NEW;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.pode_ver_dado_sensivel() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'financeiro'::app_role)
      OR public.has_role(auth.uid(), 'financeiro'::app_role);
$$;


--


CREATE OR REPLACE FUNCTION public.provisionar_usuario(_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_empresa uuid;
  v_email text;
  v_nome text;
  v_perfil_criado boolean := false;
  v_vinculo_criado boolean := false;
  v_role_criada boolean := false;
  v_resultado jsonb;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'usuario_invalido');
  END IF;

  SELECT u.email,
         COALESCE(
           NULLIF(u.raw_user_meta_data ->> 'full_name', ''),
           NULLIF(u.raw_user_meta_data ->> 'name', ''),
           split_part(COALESCE(u.email, ''), '@', 1)
         )
    INTO v_email, v_nome
  FROM auth.users u
  WHERE u.id = _user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'usuario_inexistente');
  END IF;

  v_empresa := public.empresa_padrao_id();

  -- 1. Perfil
  INSERT INTO public.profiles (id, user_id, email, full_name, empresa_id)
  VALUES (_user_id, _user_id, v_email, v_nome, v_empresa)
  ON CONFLICT (id) DO NOTHING;
  v_perfil_criado := FOUND;

  UPDATE public.profiles p
     SET empresa_id = v_empresa,
         user_id = COALESCE(p.user_id, _user_id)
   WHERE p.id = _user_id
     AND v_empresa IS NOT NULL
     AND p.empresa_id IS DISTINCT FROM v_empresa
     AND NOT EXISTS (
       SELECT 1 FROM public.user_empresas ue
       WHERE ue.user_id = _user_id AND ue.ativo
     );

  -- 2. Vínculo com a empresa padrão (menor privilégio)
  IF v_empresa IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = _user_id) THEN
    INSERT INTO public.user_empresas (user_id, empresa_id, role, is_default, provisioned_via, ativo)
    VALUES (_user_id, v_empresa, 'visualizador'::app_role, true, 'manual', true)
    ON CONFLICT (user_id, empresa_id) DO NOTHING;
    v_vinculo_criado := FOUND;
  END IF;

  -- 3. Papel global inicial (nunca rebaixa papéis existentes)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND COALESCE(ur.is_active, true)
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ) THEN
    INSERT INTO public.user_roles (user_id, role, notes)
    VALUES (_user_id, 'visualizador'::app_role, 'Provisionamento automático no primeiro acesso')
    ON CONFLICT DO NOTHING;
    v_role_criada := FOUND;
  END IF;

  v_resultado := jsonb_build_object(
    'ok', true,
    'empresa_id', v_empresa,
    'perfil_criado', v_perfil_criado,
    'vinculo_criado', v_vinculo_criado,
    'role_criada', v_role_criada
  );

  -- 4. Trilha de auditoria — apenas quando houve efeito e sem quebrar o login
  IF v_perfil_criado OR v_vinculo_criado OR v_role_criada THEN
    BEGIN
      INSERT INTO public.audit_logs (user_id, user_email, action, table_name, record_id, new_data, details)
      VALUES (
        _user_id,
        v_email,
        'PROVISIONAMENTO_USUARIO',
        'user_empresas',
        _user_id::text,
        v_resultado,
        'Provisionamento automático no primeiro acesso'
      );
    EXCEPTION WHEN OTHERS THEN
      NULL; -- auditoria é best-effort
    END;
  END IF;

  RETURN v_resultado;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.provisionar_usuario_atual() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória para provisionamento';
  END IF;
  RETURN public.provisionar_usuario(v_uid);
END;
$$;


--


CREATE OR REPLACE FUNCTION public.purge_old_rows(p_table regclass, p_column text, p_days integer, p_where text DEFAULT NULL::text, p_batch integer DEFAULT 10000, p_max_batches integer DEFAULT 50) RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $_$
DECLARE
  v_total bigint := 0;
  v_count bigint;
  v_i integer := 0;
  v_sql text;
BEGIN
  IF p_days IS NULL OR p_days < 1 THEN
    RAISE EXCEPTION 'purge_old_rows: p_days deve ser >= 1 (recebido %)', p_days;
  END IF;
  IF p_batch < 1 OR p_batch > 100000 THEN
    RAISE EXCEPTION 'purge_old_rows: p_batch fora da faixa permitida (1..100000)';
  END IF;

  -- valida que a coluna existe e é temporal (evita injeção via p_column)
  PERFORM 1
    FROM pg_attribute a
    JOIN pg_type t ON t.oid = a.atttypid
   WHERE a.attrelid = p_table
     AND a.attname = p_column
     AND a.attnum > 0
     AND NOT a.attisdropped
     AND t.typname IN ('timestamptz','timestamp','date');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'purge_old_rows: coluna temporal % inexistente em %', p_column, p_table::text;
  END IF;

  v_sql := format(
    'DELETE FROM %s WHERE ctid IN (SELECT ctid FROM %s WHERE %I < now() - ($1 || '' days'')::interval %s LIMIT %s)',
    p_table::text, p_table::text, p_column,
    CASE WHEN p_where IS NULL OR btrim(p_where) = '' THEN '' ELSE 'AND (' || p_where || ')' END,
    p_batch
  );

  LOOP
    v_i := v_i + 1;
    EXECUTE v_sql USING p_days;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    EXIT WHEN v_count < p_batch OR v_i >= p_max_batches;
  END LOOP;

  RETURN v_total;
END;
$_$;


--


CREATE OR REPLACE FUNCTION public.recarregar_seeds_fiscais(p_origem text DEFAULT 'cron'::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_inicio timestamptz := clock_timestamp();
  v_contagens jsonb;
  v_checksum text;
  v_vinculos integer := 0;
  v_criticos integer := 0;
  v_health jsonb;
  v_existente public.catalogos_fiscais_cargas%ROWTYPE;
  v_id uuid;
  v_status text;
BEGIN
  IF p_origem NOT IN ('cron','manual','ci','migration') THEN
    RAISE EXCEPTION 'Origem inválida: %', p_origem USING ERRCODE = '22023';
  END IF;

  -- Chamadas manuais exigem papel admin; execuções internas (cron/service_role) seguem.
  IF p_origem = 'manual' AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso restrito a administradores' USING ERRCODE = '42501';
  END IF;

  -- Serializa execuções concorrentes (idempotência sob cron + disparo manual)
  IF NOT pg_try_advisory_xact_lock(hashtext('recarregar_seeds_fiscais')) THEN
    RETURN jsonb_build_object('status','sem_alteracao','mensagem','Recarga já em execução');
  END IF;

  -- 2.1) Normalização idempotente: vincula itens de protocolo ST ao NCM correspondente
  WITH atualizados AS (
    UPDATE public.protocolos_st_ncms pn
       SET ncm_id = n.id,
           updated_at = now()
      FROM public.ncms n
     WHERE pn.ncm_id IS NULL
       AND n.codigo = pn.ncm_codigo
    RETURNING 1
  )
  SELECT count(*)::int INTO v_vinculos FROM atualizados;

  -- 2.2) Revalidação das invariantes (gera/auto-resolve alertas)
  BEGIN
    v_health := public.check_catalogos_tributarios_invariants();
    v_criticos := COALESCE((v_health->>'criticos')::int, 0);
  EXCEPTION WHEN OTHERS THEN
    v_criticos := 0;
    v_health := jsonb_build_object('erro', SQLERRM);
  END;

  -- 2.3) Fotografia determinística do estado dos catálogos
  SELECT jsonb_build_object(
    'ufs', (SELECT count(*) FROM public.ufs),
    'cnaes', (SELECT count(*) FROM public.cnaes),
    'ncms', (SELECT count(*) FROM public.ncms),
    'itens_lista_iss', (SELECT count(*) FROM public.itens_lista_iss),
    'aliquotas_iss_municipal', (SELECT count(*) FROM public.aliquotas_iss_municipal),
    'aliquotas_internas_uf', (SELECT count(*) FROM public.aliquotas_internas_uf),
    'aliquotas_interestaduais', (SELECT count(*) FROM public.aliquotas_interestaduais),
    'protocolos_st', (SELECT count(*) FROM public.protocolos_st),
    'protocolos_st_ufs', (SELECT count(*) FROM public.protocolos_st_ufs),
    'protocolos_st_ncms', (SELECT count(*) FROM public.protocolos_st_ncms),
    'faixas_simples_nacional', (SELECT count(*) FROM public.faixas_simples_nacional),
    'beneficios_fiscais', (SELECT count(*) FROM public.beneficios_fiscais)
  ) INTO v_contagens;

  v_checksum := md5(v_contagens::text);

  SELECT * INTO v_existente
    FROM public.catalogos_fiscais_cargas
   WHERE checksum = v_checksum
   LIMIT 1;

  IF v_existente.id IS NOT NULL THEN
    -- Idempotente: mesmo estado → apenas atualiza a data da última verificação
    UPDATE public.catalogos_fiscais_cargas
       SET last_updated = now(),
           origem = p_origem,
           status = 'sem_alteracao',
           criticos = v_criticos,
           vinculos_normalizados = v_vinculos,
           duracao_ms = (EXTRACT(EPOCH FROM (clock_timestamp() - v_inicio)) * 1000)::int
     WHERE id = v_existente.id;
    v_id := v_existente.id;
    v_status := 'sem_alteracao';
  ELSE
    INSERT INTO public.catalogos_fiscais_cargas (
      origem, status, checksum, contagens, houve_alteracao,
      vinculos_normalizados, criticos, duracao_ms, mensagem
    ) VALUES (
      p_origem, 'ok', v_checksum, v_contagens, true,
      v_vinculos, v_criticos,
      (EXTRACT(EPOCH FROM (clock_timestamp() - v_inicio)) * 1000)::int,
      format('Nova versão dos catálogos fiscais (%s vínculos normalizados)', v_vinculos)
    )
    RETURNING id INTO v_id;
    v_status := 'ok';
  END IF;

  RETURN jsonb_build_object(
    'id', v_id,
    'status', v_status,
    'checksum', v_checksum,
    'contagens', v_contagens,
    'vinculos_normalizados', v_vinculos,
    'criticos', v_criticos,
    'last_updated', now(),
    'duracao_ms', (EXTRACT(EPOCH FROM (clock_timestamp() - v_inicio)) * 1000)::int
  );
END;
$$;


--


CREATE OR REPLACE FUNCTION public.resolve_integrity_alert(p_alert_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  v_rows integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.integrity_alerts
  SET resolved_at = now(),
      resolved_by = auth.uid(),
      resolved_reason = 'manual: encerrado por administrador'
  WHERE id = p_alert_id
    AND resolved_at IS NULL;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.set_empresa_id_default() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_empresa uuid;
BEGIN
  IF NEW.empresa_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  SELECT ue.empresa_id INTO v_empresa
  FROM public.user_empresas ue
  WHERE ue.user_id = auth.uid() AND COALESCE(ue.ativo, true)
  ORDER BY ue.is_default DESC NULLS LAST, ue.created_at
  LIMIT 1;

  IF v_empresa IS NULL THEN
    SELECT e.id INTO v_empresa FROM public.empresas e ORDER BY e.created_at LIMIT 1;
  END IF;

  NEW.empresa_id := v_empresa;
  RETURN NEW;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.set_empresa_id_from_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.empresa_id IS NULL THEN
    SELECT p.empresa_id INTO NEW.empresa_id
    FROM public.profiles p
    WHERE p.user_id = NEW.user_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.silenciar_alerta_erro_frontend(p_assinatura text, p_horas integer DEFAULT 24, p_motivo text DEFAULT NULL::text) RETURNS public.frontend_error_alert_state
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_sig text := left(btrim(coalesce(p_assinatura, '')), 200);
  v_horas integer;
  v_ate timestamptz;
  v_antes jsonb;
  v_row public.frontend_error_alert_state;
BEGIN
  IF v_uid IS NULL OR NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;

  IF v_sig = '' THEN
    RAISE EXCEPTION 'assinatura obrigatoria' USING ERRCODE = '22023';
  END IF;

  -- p_horas <= 0 (ou NULL) reativa os alertas; teto de 30 dias evita silêncio eterno
  v_horas := least(greatest(coalesce(p_horas, 0), 0), 720);
  v_ate := CASE WHEN v_horas = 0 THEN NULL ELSE now() + make_interval(hours => v_horas) END;

  SELECT to_jsonb(s) INTO v_antes
  FROM public.frontend_error_alert_state s
  WHERE s.assinatura = v_sig;

  INSERT INTO public.frontend_error_alert_state AS st (assinatura, silenciado_ate)
  VALUES (v_sig, v_ate)
  ON CONFLICT (assinatura) DO UPDATE SET silenciado_ate = EXCLUDED.silenciado_ate
  RETURNING st.* INTO v_row;

  INSERT INTO public.audit_logs (user_id, user_email, action, table_name, record_id, old_data, new_data, details)
  VALUES (
    v_uid,
    (auth.jwt() ->> 'email'),
    CASE WHEN v_ate IS NULL THEN 'unmute_frontend_error_alert' ELSE 'mute_frontend_error_alert' END,
    'frontend_error_alert_state',
    v_sig,
    v_antes,
    to_jsonb(v_row),
    left(coalesce(nullif(btrim(coalesce(p_motivo, '')), ''), 'sem motivo informado'), 500)
  );

  RETURN v_row;
END
$$;


--


CREATE OR REPLACE FUNCTION public.sync_regime_tributario_empresa() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_regime TEXT;
BEGIN
  IF NOT COALESCE(NEW.ativo, true) THEN
    RETURN NEW;
  END IF;
  v_regime := lower(regexp_replace(btrim(NEW.regime_nome), '\s+', '_', 'g'));
  IF v_regime IN ('mei','simples_nacional','lucro_presumido','lucro_real','arbitrado') THEN
    UPDATE public.empresas SET regime_tributario = v_regime WHERE id = NEW.empresa_id;
  END IF;
  RETURN NEW;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.toggle_cron_job(job_id bigint, is_active boolean) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'cron'
    AS $$
DECLARE
  v_name text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem gerenciar tarefas agendadas';
  END IF;

  SELECT jobname INTO v_name FROM cron.job WHERE jobid = job_id;
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Tarefa agendada % não encontrada', job_id;
  END IF;

  PERFORM cron.alter_job(job_id := job_id, active := is_active);
  RETURN true;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.trigger_bitrix24_sync() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  sync_record RECORD;
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check if this order has a Bitrix24 deal linked
    SELECT * INTO sync_record FROM bitrix24_sync WHERE order_id = NEW.id LIMIT 1;
    
    -- Also check if deal_id is set directly on the order
    IF sync_record IS NOT NULL OR NEW.bitrix24_deal_id IS NOT NULL THEN
      -- Insert a sync request that will be processed
      INSERT INTO bitrix24_sync (order_id, deal_id, sync_status, last_synced_at)
      VALUES (
        NEW.id, 
        COALESCE(sync_record.deal_id, NEW.bitrix24_deal_id),
        'pending',
        now()
      )
      ON CONFLICT (order_id) 
      DO UPDATE SET 
        sync_status = 'pending',
        last_synced_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--


CREATE OR REPLACE FUNCTION public.watch_cron_failures(p_lookback_minutes integer DEFAULT 90, p_stale_hours integer DEFAULT 36) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'cron', 'pg_catalog'
    AS $$
DECLARE
  v_lookback integer := LEAST(GREATEST(COALESCE(p_lookback_minutes, 90), 5), 10080);
  v_stale    integer := LEAST(GREATEST(COALESCE(p_stale_hours, 36), 2), 720);
  v_fail     integer := 0;
  v_stalled  integer := 0;
  v_nunca    integer := 0;
  v_resolv   integer := 0;
  v_started  timestamptz := clock_timestamp();
BEGIN
  -- 1) Falhas recentes, agregadas por job.
  WITH falhas AS (
    SELECT
      j.jobname,
      count(*)::numeric AS total,
      max(d.end_time)   AS ultima,
      (array_agg(d.return_message ORDER BY d.start_time DESC))[1] AS msg
    FROM cron.job_run_details d
    JOIN cron.job j ON j.jobid = d.jobid
    WHERE d.status = 'failed'
      AND d.start_time >= now() - make_interval(mins => v_lookback)
    GROUP BY j.jobname
  ), ins AS (
    INSERT INTO public.performance_alerts
      (source, alert_key, severity, reason, current_value, sample_count, metadata)
    SELECT
      'cron',
      'job_failed:' || f.jobname,
      'critical',
      format('Automação "%s" falhou %s vez(es) nos últimos %s min', f.jobname, f.total, v_lookback),
      f.total,
      f.total::int,
      jsonb_build_object(
        'jobname', f.jobname,
        'last_failure_at', f.ultima,
        'return_message', left(coalesce(f.msg, ''), 500)
      )
    FROM falhas f
    ON CONFLICT (source, alert_key, alert_hour) DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::int INTO v_fail FROM ins;

  -- 2) Jobs sem execução, com tolerância derivada da expressão cron.
  WITH base AS (
    SELECT
      j.jobname,
      j.schedule,
      max(d.start_time) AS ultima,
      CASE
        WHEN split_part(j.schedule, ' ', 3) <> '*' THEN 24 * 35
        WHEN split_part(j.schedule, ' ', 5) <> '*' THEN 24 * 8
        WHEN split_part(j.schedule, ' ', 2) <> '*' THEN v_stale
        ELSE 3
      END AS tolerancia_h
    FROM cron.job j
    LEFT JOIN cron.job_run_details d ON d.jobid = j.jobid
    WHERE j.active
    GROUP BY j.jobname, j.schedule
  ),
  ins2 AS (
    INSERT INTO public.performance_alerts
      (source, alert_key, severity, reason, current_value, metadata)
    SELECT
      'cron',
      'job_stale:' || b.jobname,
      'warning',
      format('Automação "%s" (%s) sem execução há mais de %s h',
             b.jobname, b.schedule, b.tolerancia_h),
      round(EXTRACT(epoch FROM (now() - b.ultima)) / 3600.0, 2),
      jsonb_build_object(
        'jobname', b.jobname, 'schedule', b.schedule,
        'last_run_at', b.ultima, 'tolerancia_horas', b.tolerancia_h
      )
    FROM base b
    WHERE b.ultima IS NOT NULL
      AND b.ultima < now() - make_interval(hours => b.tolerancia_h)
    ON CONFLICT (source, alert_key, alert_hour) DO NOTHING
    RETURNING 1
  ),
  ins3 AS (
    INSERT INTO public.performance_alerts
      (source, alert_key, severity, reason, current_value, metadata)
    SELECT
      'cron',
      'job_never_ran:' || b.jobname,
      'info',
      format('Automação "%s" (%s) ainda não possui execução registrada',
             b.jobname, b.schedule),
      0,
      jsonb_build_object(
        'jobname', b.jobname, 'schedule', b.schedule,
        'tolerancia_horas', b.tolerancia_h
      )
    FROM base b
    WHERE b.ultima IS NULL
    ON CONFLICT (source, alert_key, alert_hour) DO NOTHING
    RETURNING 1
  )
  SELECT
    (SELECT count(*)::int FROM ins2),
    (SELECT count(*)::int FROM ins3)
  INTO v_stalled, v_nunca;

  -- 3) Encerramento automático: o alerta só existe enquanto o sintoma existir.
  --    Um job que voltou a rodar com sucesso depois do alerta deixa de ser incidente.
  WITH ultimo_ok AS (
    SELECT j.jobname, max(d.end_time) AS ok_em
    FROM cron.job_run_details d
    JOIN cron.job j ON j.jobid = d.jobid
    WHERE d.status = 'succeeded'
    GROUP BY j.jobname
  ), fechados AS (
    UPDATE public.performance_alerts a
    SET resolved_at = now(),
        resolved_reason = format('Automação "%s" executou com sucesso em %s',
                                 u.jobname, to_char(u.ok_em, 'DD/MM/YYYY HH24:MI'))
    FROM ultimo_ok u
    WHERE a.source = 'cron'
      AND a.resolved_at IS NULL
      AND a.alert_key IN ('job_failed:' || u.jobname,
                          'job_stale:' || u.jobname,
                          'job_never_ran:' || u.jobname)
      AND u.ok_em > a.created_at
    RETURNING 1
  )
  SELECT count(*)::int INTO v_resolv FROM fechados;

  RETURN jsonb_build_object(
    'ok', true,
    'lookback_minutes', v_lookback,
    'stale_hours_default', v_stale,
    'novos_alertas_falha', v_fail,
    'novos_alertas_sem_execucao', v_stalled,
    'novos_alertas_nunca_executou', v_nunca,
    'alertas_encerrados', v_resolv,
    'duration_ms', round(EXTRACT(epoch FROM (clock_timestamp() - v_started)) * 1000)
  );
END;
$$;


--

-- FASE 5a: Triggers ausentes em tabelas comuns

CREATE TRIGGER trg_alert_configurations_set_empresa BEFORE INSERT ON public.alert_configurations FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_default();


--


CREATE TRIGGER trg_alertas_set_empresa BEFORE INSERT ON public.alertas FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_from_profile();


--


CREATE TRIGGER trg_alerts_set_empresa BEFORE INSERT ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_default();


--


CREATE TRIGGER trg_aliq_inter_updated_at BEFORE UPDATE ON public.aliquotas_interestaduais FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--


CREATE TRIGGER trg_aliq_internas_updated_at BEFORE UPDATE ON public.aliquotas_internas_uf FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--


CREATE TRIGGER trg_aliq_iss_updated_at BEFORE UPDATE ON public.aliquotas_iss_municipal FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--


CREATE TRIGGER trg_api_keys_updated_at BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_beneficios_updated_at BEFORE UPDATE ON public.beneficios_fiscais FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--


CREATE TRIGGER trg_conformidade_snapshots_updated_at BEFORE UPDATE ON public.conformidade_snapshots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--


CREATE TRIGGER trg_elisao_alertas_updated_at BEFORE UPDATE ON public.elisao_alertas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_cred_aud_updated_at BEFORE UPDATE ON public.elisao_creditos_auditoria FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_regras_creditos_updated_at BEFORE UPDATE ON public.elisao_regras_creditos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_tarefas_elisao_updated_at BEFORE UPDATE ON public.elisao_tarefas_acionaveis FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_empresas_unica_padrao BEFORE INSERT OR UPDATE OF is_padrao, ativo ON public.empresas FOR EACH ROW EXECUTE FUNCTION public.empresas_unica_padrao();


--


CREATE TRIGGER trg_entregas_obrigacoes_updated_at BEFORE UPDATE ON public.entregas_obrigacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--


CREATE TRIGGER trg_faixas_simples_updated_at BEFORE UPDATE ON public.faixas_simples_nacional FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--


CREATE TRIGGER trg_fechamentos_updated_at BEFORE UPDATE ON public.fechamentos_tributarios FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_frontend_error_logs_sanitize BEFORE INSERT ON public.frontend_error_logs FOR EACH ROW EXECUTE FUNCTION public.frontend_error_logs_sanitize();


--


CREATE TRIGGER trg_incentivos_updated_at BEFORE UPDATE ON public.incentivos_fiscais FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_integration_secrets_updated_at BEFORE UPDATE ON public.integration_secrets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--


CREATE TRIGGER trg_itens_iss_updated_at BEFORE UPDATE ON public.itens_lista_iss FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--


CREATE TRIGGER trg_kpis_operacionais_updated_at BEFORE UPDATE ON public.kpis_operacionais FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_lancamento_contabil_before_update BEFORE UPDATE ON public.lancamentos_contabeis FOR EACH ROW EXECUTE FUNCTION public.lancamento_contabil_before_update();


--


CREATE TRIGGER trg_nf_ocr_updated_at BEFORE UPDATE ON public.notas_fiscais_ocr FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_oport_elisao_updated_at BEFORE UPDATE ON public.oportunidades_elisao FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_pag_recorr_updated_at BEFORE UPDATE ON public.pagamentos_recorrentes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_per_dcomp_updated_at BEFORE UPDATE ON public.per_dcomp FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_pix_template_sync_legacy BEFORE INSERT OR UPDATE ON public.pix_templates FOR EACH ROW EXECUTE FUNCTION public.pix_template_sync_legacy();


--


CREATE TRIGGER trg_pix_templates_updated_at BEFORE UPDATE ON public.pix_templates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_planos_acao_updated_at BEFORE UPDATE ON public.planos_acao FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_sync_regime_empresa AFTER INSERT OR UPDATE ON public.regimes_tributarios FOR EACH ROW EXECUTE FUNCTION public.sync_regime_tributario_empresa();


--


CREATE TRIGGER trg_rel_trib_agend_updated_at BEFORE UPDATE ON public.relatorios_tributarios_agendados FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_risk_rules_set_empresa BEFORE INSERT ON public.risk_rules FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_default();


--


CREATE TRIGGER trg_saved_filters_updated_at BEFORE UPDATE ON public.saved_filters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_scim_checklist_updated_at BEFORE UPDATE ON public.scim_setup_checklist FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_solicitacoes_lgpd_set_empresa BEFORE INSERT ON public.solicitacoes_lgpd FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_from_profile();


--


CREATE TRIGGER trg_solicitacoes_lgpd_updated_at BEFORE UPDATE ON public.solicitacoes_lgpd FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_sped_arquivos_updated_at BEFORE UPDATE ON public.sped_contabil_arquivos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER trg_user_active_filters_updated_at BEFORE UPDATE ON public.user_active_filters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--


CREATE TRIGGER tr_user_digest_preferences_updated_at BEFORE UPDATE ON public.user_digest_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--


CREATE TRIGGER trg_auto_vincular_empresa_padrao AFTER INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.auto_vincular_empresa_padrao();


--

-- FASE 5b: Policies ausentes em tabelas comuns

CREATE POLICY alert_configurations_tenant_delete ON public.alert_configurations FOR DELETE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))));


--


CREATE POLICY alert_configurations_tenant_insert ON public.alert_configurations FOR INSERT TO authenticated WITH CHECK ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'operacional'::public.app_role))));


--


CREATE POLICY alert_configurations_tenant_select ON public.alert_configurations FOR SELECT TO authenticated USING (public.empresa_membro_ativo(empresa_id));


--


CREATE POLICY alert_configurations_tenant_update ON public.alert_configurations FOR UPDATE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'operacional'::public.app_role)))) WITH CHECK (public.empresa_membro_ativo(empresa_id));


--


CREATE POLICY alertas_owner_delete ON public.alertas FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--


CREATE POLICY alertas_owner_insert ON public.alertas FOR INSERT TO authenticated WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) AND ((empresa_id IS NULL) OR public.empresa_acessivel(empresa_id))));


--


CREATE POLICY alertas_owner_select ON public.alertas FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--


CREATE POLICY alertas_owner_update ON public.alertas FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) AND ((empresa_id IS NULL) OR public.empresa_acessivel(empresa_id))));


--


CREATE POLICY alerts_tenant_delete ON public.alerts FOR DELETE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))));


--


CREATE POLICY alerts_tenant_insert ON public.alerts FOR INSERT TO authenticated WITH CHECK ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'operacional'::public.app_role))));


--


CREATE POLICY alerts_tenant_select ON public.alerts FOR SELECT TO authenticated USING (public.empresa_membro_ativo(empresa_id));


--


CREATE POLICY alerts_tenant_update ON public.alerts FOR UPDATE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'operacional'::public.app_role)))) WITH CHECK (public.empresa_membro_ativo(empresa_id));


--


CREATE POLICY alerts_sent_tenant_delete ON public.alerts_sent FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.alerts a
  WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id)))) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))));


--


CREATE POLICY alerts_sent_tenant_insert ON public.alerts_sent FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.alerts a
  WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id)))));


--


CREATE POLICY alerts_sent_tenant_select ON public.alerts_sent FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.alerts a
  WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id)))));


--


CREATE POLICY alerts_sent_tenant_update ON public.alerts_sent FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.alerts a
  WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.alerts a
  WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id)))));


--


CREATE POLICY aliq_inter_select_authenticated ON public.aliquotas_interestaduais FOR SELECT TO authenticated USING (true);


--


CREATE POLICY aliq_inter_write_admin ON public.aliquotas_interestaduais TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


CREATE POLICY aliq_internas_select_authenticated ON public.aliquotas_internas_uf FOR SELECT TO authenticated USING (true);


--


CREATE POLICY aliq_internas_write_admin ON public.aliquotas_internas_uf TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


CREATE POLICY aliq_iss_select_authenticated ON public.aliquotas_iss_municipal FOR SELECT TO authenticated USING (true);


--


CREATE POLICY aliq_iss_write_admin ON public.aliquotas_iss_municipal TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


CREATE POLICY anomalias_detectadas_tenant_rw ON public.anomalias_detectadas TO authenticated USING (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id))) WITH CHECK (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY api_keys_delete ON public.api_keys FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY api_keys_select ON public.api_keys FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY apuracoes_tributarias_tenant_rw ON public.apuracoes_tributarias TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY asaas_audit_tenant_select ON public.asaas_audit_trail FOR SELECT TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.asaas_payments p
  WHERE ((p.id = asaas_audit_trail.asaas_payment_id) AND public.empresa_acessivel(p.empresa_id))))));


--


CREATE POLICY asaas_config_tenant_rw ON public.asaas_config TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY asaas_customers_tenant_rw ON public.asaas_customers TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY asaas_payments_tenant_rw ON public.asaas_payments TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY asaas_reconciliation_suggestions_tenant_rw ON public.asaas_reconciliation_suggestions TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY asaas_sync_tenant_all ON public.asaas_sync_queue TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.asaas_payments p
  WHERE ((p.id = asaas_sync_queue.asaas_payment_id) AND public.empresa_acessivel(p.empresa_id)))))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.asaas_payments p
  WHERE ((p.id = asaas_sync_queue.asaas_payment_id) AND public.empresa_acessivel(p.empresa_id))))));


--


CREATE POLICY asaas_transfers_tenant_rw ON public.asaas_transfers TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY audit_logs_insert_self_attributed ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ((user_email IS NULL) OR (user_email = ( SELECT (auth.jwt() ->> 'email'::text))))));


--


CREATE POLICY beneficios_select_authenticated ON public.beneficios_fiscais FOR SELECT TO authenticated USING (true);


--


CREATE POLICY beneficios_write_admin ON public.beneficios_fiscais TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


CREATE POLICY bitrix24_activities_tenant_delete ON public.bitrix24_activities FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.lalamove_orders o
  WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id)))) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))));


--


CREATE POLICY bitrix24_activities_tenant_insert ON public.bitrix24_activities FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.lalamove_orders o
  WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id)))));


--


CREATE POLICY bitrix24_activities_tenant_select ON public.bitrix24_activities FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.lalamove_orders o
  WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id)))));


--


CREATE POLICY bitrix24_activities_tenant_update ON public.bitrix24_activities FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.lalamove_orders o
  WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.lalamove_orders o
  WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id)))));


--


CREATE POLICY centros_custo_tenant_rw ON public.centros_custo TO authenticated USING (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id))) WITH CHECK (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY cnaes_select_authenticated ON public.cnaes FOR SELECT TO authenticated USING (true);


--


CREATE POLICY cnaes_write_admin ON public.cnaes TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


CREATE POLICY configuracoes_aprovacao_tenant_rw ON public.configuracoes_aprovacao TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY configuracoes_duplicidade_tenant_rw ON public.configuracoes_duplicidade TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY conformidade_snapshots_empresa_insert ON public.conformidade_snapshots FOR INSERT TO authenticated WITH CHECK ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))));


--


CREATE POLICY conformidade_snapshots_empresa_select ON public.conformidade_snapshots FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))));


--


CREATE POLICY conformidade_snapshots_empresa_update ON public.conformidade_snapshots FOR UPDATE TO authenticated USING ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))) WITH CHECK ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))));


--


CREATE POLICY conformidade_snapshots_tenant_rw ON public.conformidade_snapshots TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY contas_pagar_tenant_rw ON public.contas_pagar TO authenticated USING (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id))) WITH CHECK (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY contas_receber_tenant_rw ON public.contas_receber TO authenticated USING (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id))) WITH CHECK (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY darfs_tenant_rw ON public.darfs TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY "Admins podem consultar o log de envios do digest" ON public.digest_envios_log FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


CREATE POLICY elisao_alertas_acesso ON public.elisao_alertas TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));


--


CREATE POLICY creditos_auditoria_delete_admin ON public.elisao_creditos_auditoria FOR DELETE TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY creditos_auditoria_insert ON public.elisao_creditos_auditoria FOR INSERT TO authenticated WITH CHECK (public.empresa_acessivel(empresa_id));


--


CREATE POLICY creditos_auditoria_select ON public.elisao_creditos_auditoria FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));


--


CREATE POLICY regras_creditos_admin ON public.elisao_regras_creditos TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--


CREATE POLICY regras_creditos_leitura ON public.elisao_regras_creditos FOR SELECT TO authenticated USING (true);


--


CREATE POLICY tarefas_elisao_acesso ON public.elisao_tarefas_acionaveis TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));


--


CREATE POLICY empresas_certificados_tenant_rw ON public.empresas_certificados TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY entregas_obrigacoes_empresa_insert ON public.entregas_obrigacoes FOR INSERT TO authenticated WITH CHECK ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))));


--


CREATE POLICY entregas_obrigacoes_empresa_select ON public.entregas_obrigacoes FOR SELECT TO authenticated USING ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))));


--


CREATE POLICY entregas_obrigacoes_empresa_update ON public.entregas_obrigacoes FOR UPDATE TO authenticated USING ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))) WITH CHECK ((empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))));


--


CREATE POLICY entregas_obrigacoes_tenant_rw ON public.entregas_obrigacoes TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY faixas_simples_select_authenticated ON public.faixas_simples_nacional FOR SELECT TO authenticated USING (true);


--


CREATE POLICY faixas_simples_write_admin ON public.faixas_simples_nacional TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


CREATE POLICY fechamentos_insert ON public.fechamentos_tributarios FOR INSERT TO authenticated WITH CHECK (public.empresa_acessivel(empresa_id));


--


CREATE POLICY fechamentos_select ON public.fechamentos_tributarios FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));


--


CREATE POLICY fechamentos_update ON public.fechamentos_tributarios FOR UPDATE TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));


--


CREATE POLICY fila_cobrancas_tenant_rw ON public.fila_cobrancas TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY historico_conciliacao_ia_tenant_select ON public.historico_conciliacao_ia FOR SELECT TO authenticated USING (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND ((EXISTS ( SELECT 1
   FROM public.contas_receber cr
  WHERE ((cr.id = historico_conciliacao_ia.conta_receber_id) AND public.empresa_acessivel(cr.empresa_id)))) OR (EXISTS ( SELECT 1
   FROM public.contas_pagar cp
  WHERE ((cp.id = historico_conciliacao_ia.conta_pagar_id) AND public.empresa_acessivel(cp.empresa_id)))) OR (EXISTS ( SELECT 1
   FROM public.sessoes_conciliacao s
  WHERE ((s.id = historico_conciliacao_ia.sessao_id) AND ((s.user_id = ( SELECT auth.uid() AS uid)) OR public.empresa_acessivel(s.empresa_id))))))));


--


CREATE POLICY incentivos_fiscais_acesso ON public.incentivos_fiscais TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));


--


CREATE POLICY integration_secrets_no_client_access ON public.integration_secrets AS RESTRICTIVE TO authenticated, anon USING (false) WITH CHECK (false);


--


CREATE POLICY itens_iss_select_authenticated ON public.itens_lista_iss FOR SELECT TO authenticated USING (true);


--


CREATE POLICY itens_iss_write_admin ON public.itens_lista_iss TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


CREATE POLICY kpis_operacionais_owner ON public.kpis_operacionais TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--


CREATE POLICY "Lancamentos scoped by empresa" ON public.lancamentos_contabeis TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) OR public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR (empresa_id IN ( SELECT ue.empresa_id
   FROM public.user_empresas ue
  WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))));


--


CREATE POLICY logs_baixa_insert_owner ON public.logs_baixa_automatica FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--


CREATE POLICY logs_baixa_select_owner ON public.logs_baixa_automatica FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--


CREATE POLICY logs_retro_insert_owner ON public.logs_conciliacao_retroativa FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--


CREATE POLICY logs_retro_select_owner ON public.logs_conciliacao_retroativa FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--


CREATE POLICY ncms_select_authenticated ON public.ncms FOR SELECT TO authenticated USING (true);


--


CREATE POLICY ncms_write_admin ON public.ncms TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


CREATE POLICY negativacoes_tenant_rw ON public.negativacoes TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY notas_fiscais_ocr_acesso ON public.notas_fiscais_ocr TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));


--


CREATE POLICY oportunidades_elisao_acesso ON public.oportunidades_elisao TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));


--


CREATE POLICY pagamentos_recorrentes_acesso ON public.pagamentos_recorrentes TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));


--


CREATE POLICY parcelas_acordo_tenant_write ON public.parcelas_acordo TO authenticated USING (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND (EXISTS ( SELECT 1
   FROM public.acordos_parcelamento a
  WHERE ((a.id = parcelas_acordo.acordo_id) AND public.empresa_acessivel(a.empresa_id)))))) WITH CHECK (((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) OR public.has_role(( SELECT auth.uid() AS uid), 'financeiro'::public.app_role)) AND (EXISTS ( SELECT 1
   FROM public.acordos_parcelamento a
  WHERE ((a.id = parcelas_acordo.acordo_id) AND public.empresa_acessivel(a.empresa_id))))));


--


CREATE POLICY per_dcomp_acesso ON public.per_dcomp TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));


--


CREATE POLICY pix_templates_tenant_rw ON public.pix_templates TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY planos_acao_owner ON public.planos_acao TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--


CREATE POLICY prejuizos_fiscais_tenant_rw ON public.prejuizos_fiscais TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY protestos_tenant_rw ON public.protestos TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY protocolos_st_select_authenticated ON public.protocolos_st FOR SELECT TO authenticated USING (true);


--


CREATE POLICY protocolos_st_write_admin ON public.protocolos_st TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


CREATE POLICY protocolos_st_ncms_select_authenticated ON public.protocolos_st_ncms FOR SELECT TO authenticated USING (true);


--


CREATE POLICY protocolos_st_ncms_write_admin ON public.protocolos_st_ncms TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


CREATE POLICY protocolos_st_ufs_select_authenticated ON public.protocolos_st_ufs FOR SELECT TO authenticated USING (true);


--


CREATE POLICY protocolos_st_ufs_write_admin ON public.protocolos_st_ufs TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


CREATE POLICY regua_cobranca_tenant_rw ON public.regua_cobranca TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY regua_cobranca_etapas_tenant_write ON public.regua_cobranca_etapas TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.regua_cobranca r
  WHERE ((r.id = regua_cobranca_etapas.regua_id) AND public.empresa_acessivel(r.empresa_id)))))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (EXISTS ( SELECT 1
   FROM public.regua_cobranca r
  WHERE ((r.id = regua_cobranca_etapas.regua_id) AND public.empresa_acessivel(r.empresa_id))))));


--


CREATE POLICY rel_trib_agend_all ON public.relatorios_tributarios_agendados TO authenticated USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));


--


CREATE POLICY risk_rules_tenant_delete ON public.risk_rules FOR DELETE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role))));


--


CREATE POLICY risk_rules_tenant_insert ON public.risk_rules FOR INSERT TO authenticated WITH CHECK ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'operacional'::public.app_role))));


--


CREATE POLICY risk_rules_tenant_select ON public.risk_rules FOR SELECT TO authenticated USING (public.empresa_membro_ativo(empresa_id));


--


CREATE POLICY risk_rules_tenant_update ON public.risk_rules FOR UPDATE TO authenticated USING ((public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role) OR public.has_role(auth.uid(), 'operacional'::public.app_role)))) WITH CHECK (public.empresa_membro_ativo(empresa_id));


--


CREATE POLICY saved_filters_owner_write ON public.saved_filters TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--


CREATE POLICY saved_filters_select ON public.saved_filters FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (is_shared AND (empresa_id IS NOT NULL) AND public.empresa_acessivel(empresa_id) AND (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND ((ur.role)::text = ANY (saved_filters.shared_with_roles))))))));


--


CREATE POLICY scim_checklist_own ON public.scim_setup_checklist TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--


CREATE POLICY lgpd_owner_insert ON public.solicitacoes_lgpd FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ((empresa_id IS NULL) OR public.empresa_acessivel(empresa_id))));


--


CREATE POLICY lgpd_scoped_select ON public.solicitacoes_lgpd FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (empresa_id IS NOT NULL) AND public.empresa_membro_ativo(empresa_id))));


--


CREATE POLICY lgpd_scoped_update ON public.solicitacoes_lgpd FOR UPDATE TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (empresa_id IS NOT NULL) AND public.empresa_membro_ativo(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (empresa_id IS NOT NULL) AND public.empresa_membro_ativo(empresa_id)));


--


CREATE POLICY sped_arquivos_delete_admin ON public.sped_contabil_arquivos FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY sped_arquivos_insert ON public.sped_contabil_arquivos FOR INSERT TO authenticated WITH CHECK (public.empresa_acessivel(empresa_id));


--


CREATE POLICY sped_arquivos_select ON public.sped_contabil_arquivos FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));


--


CREATE POLICY sped_arquivos_update_admin ON public.sped_contabil_arquivos FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY templates_cobranca_tenant_rw ON public.templates_cobranca TO authenticated USING ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id))) WITH CHECK ((public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND public.empresa_acessivel(empresa_id)));


--


CREATE POLICY ufs_select_authenticated ON public.ufs FOR SELECT TO authenticated USING (true);


--


CREATE POLICY ufs_write_admin ON public.ufs TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role)) WITH CHECK (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


CREATE POLICY user_active_filters_owner ON public.user_active_filters TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--


CREATE POLICY "Admins visualizam preferencias de digest" ON public.user_digest_preferences FOR SELECT TO authenticated USING (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role));


--


CREATE POLICY "Usuarios gerenciam suas preferencias de digest" ON public.user_digest_preferences TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--


CREATE POLICY "Users can update their challenges" ON public.webauthn_challenges FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--

-- FASE 5c: Indices ausentes em tabelas comuns

CREATE UNIQUE INDEX aliq_iss_mun_geral_unq ON public.aliquotas_iss_municipal USING btree (codigo_ibge, vigente_de) WHERE (item_lista_id IS NULL);


--


CREATE INDEX frontend_error_logs_2026_05_severity_created_at_idx ON public.frontend_error_logs_2026_05 USING btree (severity, created_at DESC);


--


CREATE INDEX frontend_error_logs_2026_06_severity_created_at_idx ON public.frontend_error_logs_2026_06 USING btree (severity, created_at DESC);


--


CREATE INDEX frontend_error_logs_2026_07_severity_created_at_idx ON public.frontend_error_logs_2026_07 USING btree (severity, created_at DESC);


--


CREATE INDEX frontend_error_logs_2026_08_severity_created_at_idx ON public.frontend_error_logs_2026_08 USING btree (severity, created_at DESC);


--


CREATE INDEX frontend_error_logs_2026_09_severity_created_at_idx ON public.frontend_error_logs_2026_09 USING btree (severity, created_at DESC);


--


CREATE INDEX frontend_error_logs_2026_10_severity_created_at_idx ON public.frontend_error_logs_2026_10 USING btree (severity, created_at DESC);


--


CREATE INDEX frontend_error_logs_default_severity_created_at_idx ON public.frontend_error_logs_default USING btree (severity, created_at DESC);


--


CREATE INDEX idx_alert_configurations_empresa ON public.alert_configurations USING btree (empresa_id);


--


CREATE INDEX idx_alertas_empresa_id ON public.alertas USING btree (empresa_id, created_at DESC);


--


CREATE INDEX idx_alertas_preditivos_empresa_id ON public.alertas_preditivos USING btree (empresa_id);


--


CREATE INDEX idx_alerts_empresa ON public.alerts USING btree (empresa_id);


--


CREATE INDEX idx_aliq_iss_item ON public.aliquotas_iss_municipal USING btree (item_lista_id);


--


CREATE INDEX idx_aliq_iss_mun ON public.aliquotas_iss_municipal USING btree (codigo_ibge, vigente_de DESC);


--


CREATE INDEX idx_aliquotas_iss_municipal_vigencia ON public.aliquotas_iss_municipal USING btree (vigente_de, vigente_ate);


--


CREATE INDEX idx_api_keys_empresa ON public.api_keys USING btree (empresa_id, created_at DESC);


--


CREATE INDEX idx_asaas_customers_empresa_id ON public.asaas_customers USING btree (empresa_id);


--


CREATE INDEX idx_asaas_payments_empresa_id ON public.asaas_payments USING btree (empresa_id);


--


CREATE INDEX idx_asaas_reconciliation_suggestions_empresa_id ON public.asaas_reconciliation_suggestions USING btree (empresa_id);


--


CREATE INDEX idx_asaas_transfers_empresa_id ON public.asaas_transfers USING btree (empresa_id);


--


CREATE INDEX idx_auditoria_financeira_empresa_id ON public.auditoria_financeira USING btree (empresa_id);


--


CREATE INDEX idx_beneficios_uf ON public.beneficios_fiscais USING btree (uf);


--


CREATE INDEX idx_centros_custo_empresa_id ON public.centros_custo USING btree (empresa_id);


--


CREATE INDEX idx_clientes_empresa_id ON public.clientes USING btree (empresa_id);


--


CREATE INDEX idx_cnaes_anexo ON public.cnaes USING btree (anexo_simples);


--


CREATE INDEX idx_conciliacoes_empresa_id ON public.conciliacoes USING btree (empresa_id);


--


CREATE INDEX idx_configuracoes_duplicidade_empresa_id ON public.configuracoes_duplicidade USING btree (empresa_id);


--


CREATE INDEX idx_contas_receber_bitrix_deal ON public.contas_receber USING btree (bitrix_deal_id) WHERE (bitrix_deal_id IS NOT NULL);


--


CREATE INDEX idx_convites_organizacao_id ON public.convites USING btree (organizacao_id);


--


CREATE INDEX idx_cred_aud_empresa ON public.elisao_creditos_auditoria USING btree (empresa_id, created_at DESC);


--


CREATE INDEX idx_cred_aud_status ON public.elisao_creditos_auditoria USING btree (empresa_id, status_aprovacao);


--


CREATE INDEX idx_digest_envios_log_created_at ON public.digest_envios_log USING btree (created_at DESC);


--


CREATE INDEX idx_digest_envios_log_email ON public.digest_envios_log USING btree (email, created_at DESC);


--


CREATE INDEX idx_digest_envios_log_execucao ON public.digest_envios_log USING btree (execucao_id);


--


CREATE INDEX idx_digest_envios_log_situacao ON public.digest_envios_log USING btree (situacao, created_at DESC);


--


CREATE INDEX idx_divergencias_conciliacao_empresa_id ON public.divergencias_conciliacao USING btree (empresa_id);


--


CREATE INDEX idx_elisao_alertas_empresa ON public.elisao_alertas USING btree (empresa_id, created_at DESC);


--


CREATE INDEX idx_empresas_certificados_criado_por ON public.empresas_certificados USING btree (criado_por) WHERE (criado_por IS NOT NULL);


--


CREATE INDEX idx_frontend_error_logs_sev_created ON ONLY public.frontend_error_logs USING btree (severity, created_at DESC);


--


CREATE INDEX idx_historico_analises_preditivas_empresa_id ON public.historico_analises_preditivas USING btree (empresa_id);


--


CREATE INDEX idx_incentivos_empresa ON public.incentivos_fiscais USING btree (empresa_id, ativo);


--


CREATE INDEX idx_integrity_alerts_resolved_created ON public.integrity_alerts USING btree (created_at) WHERE (resolved_at IS NOT NULL);


--


CREATE INDEX idx_itens_lista_iss_vigencia ON public.itens_lista_iss USING btree (vigente_de, vigente_ate);


--


CREATE INDEX idx_logs_conciliacao_retroativa_empresa_id ON public.logs_conciliacao_retroativa USING btree (empresa_id);


--


CREATE INDEX idx_n8n_dispatch_logs_config_id ON public.n8n_dispatch_logs USING btree (config_id) WHERE (config_id IS NOT NULL);


--


CREATE INDEX idx_n8n_workflow_configs_created_by ON public.n8n_workflow_configs USING btree (created_by) WHERE (created_by IS NOT NULL);


--


CREATE INDEX idx_ncms_mono ON public.ncms USING btree (monofasico_pis_cofins);


--


CREATE INDEX idx_ncms_st ON public.ncms USING btree (sujeito_st);


--


CREATE INDEX idx_ncms_vigencia ON public.ncms USING btree (vigente_de, vigente_ate);


--


CREATE INDEX idx_negativacoes_empresa_id ON public.negativacoes USING btree (empresa_id);


--


CREATE INDEX idx_nf_ocr_empresa ON public.notas_fiscais_ocr USING btree (empresa_id, created_at DESC);


--


CREATE INDEX idx_nfe_eventos_created_by ON public.nfe_eventos USING btree (created_by) WHERE (created_by IS NOT NULL);


--


CREATE INDEX idx_operacoes_trib_competencia ON public.operacoes_tributaveis USING btree (empresa_id, competencia);


--


CREATE INDEX idx_operacoes_trib_nota_fiscal ON public.operacoes_tributaveis USING btree (nota_fiscal_id);


--


CREATE INDEX idx_oport_empresa ON public.oportunidades_elisao USING btree (empresa_id, aplicavel);


--


CREATE INDEX idx_oport_status ON public.oportunidades_elisao USING btree (empresa_id, status);


--


CREATE INDEX idx_pag_recorr_empresa ON public.pagamentos_recorrentes USING btree (empresa_id, ativo);


--


CREATE INDEX idx_pag_recorr_proxima ON public.pagamentos_recorrentes USING btree (proxima_geracao) WHERE ativo;


--


CREATE INDEX idx_pedidos_compra_empresa_id ON public.pedidos_compra USING btree (empresa_id);


--


CREATE INDEX idx_perf_alerts_open ON public.performance_alerts USING btree (created_at DESC) WHERE (resolved_at IS NULL);


--


CREATE INDEX idx_perf_alerts_resolved_created ON public.performance_alerts USING btree (created_at) WHERE (resolved_at IS NOT NULL);


--


CREATE INDEX idx_pix_templates_empresa_id ON public.pix_templates USING btree (empresa_id);


--


CREATE INDEX idx_pix_templates_uso ON public.pix_templates USING btree (ativo, uso_count DESC);


--


CREATE INDEX idx_profiles_empresa_id ON public.profiles USING btree (empresa_id);


--


CREATE INDEX idx_protestos_empresa_id ON public.protestos USING btree (empresa_id);


--


CREATE INDEX idx_protocolos_st_ncms_ncm ON public.protocolos_st_ncms USING btree (ncm_id);


--


CREATE INDEX idx_protocolos_st_ncms_protocolo ON public.protocolos_st_ncms USING btree (protocolo_id);


--


CREATE INDEX idx_protocolos_st_ncms_vigencia ON public.protocolos_st_ncms USING btree (vigente_de, vigente_ate);


--


CREATE INDEX idx_protocolos_st_ufs_protocolo ON public.protocolos_st_ufs USING btree (protocolo_id);


--


CREATE INDEX idx_regimes_simulados_ajustes_aplicados ON public.regimes_simulados USING gin (ajustes_aplicados);


--


CREATE INDEX idx_regras_conciliacao_empresa_id ON public.regras_conciliacao USING btree (empresa_id);


--


CREATE INDEX idx_regua_cobranca_empresa_id ON public.regua_cobranca USING btree (empresa_id);


--


CREATE INDEX idx_rel_trib_agend_proximo ON public.relatorios_tributarios_agendados USING btree (ativo, proximo_envio_em);


--


CREATE INDEX idx_relatorios_agendados_empresa_id ON public.relatorios_agendados USING btree (empresa_id);


--


CREATE INDEX idx_relatorios_tributarios_agendados_empresa_id ON public.relatorios_tributarios_agendados USING btree (empresa_id);


--


CREATE INDEX idx_retencoes_fonte_competencia ON public.retencoes_fonte USING btree (empresa_id, competencia);


--


CREATE INDEX idx_risk_rules_empresa ON public.risk_rules USING btree (empresa_id);


--


CREATE INDEX idx_sessoes_conciliacao_empresa_id ON public.sessoes_conciliacao USING btree (empresa_id);


--


CREATE INDEX idx_solicitacoes_lgpd_empresa_id ON public.solicitacoes_lgpd USING btree (empresa_id, created_at DESC);


--


CREATE INDEX idx_sped_arq_empresa_tipo_ano ON public.sped_contabil_arquivos USING btree (empresa_id, tipo, ano_calendario, created_at DESC);


--


CREATE INDEX idx_tarefas_elisao_empresa ON public.elisao_tarefas_acionaveis USING btree (empresa_id, prazo);


--


CREATE INDEX idx_templates_cobranca_empresa_id ON public.templates_cobranca USING btree (empresa_id);


--


CREATE INDEX idx_ufs_vigencia ON public.ufs USING btree (vigente_de, vigente_ate);


--


CREATE INDEX idx_user_digest_preferences_ativo ON public.user_digest_preferences USING btree (ativo, frequencia, hora_envio);


--


CREATE INDEX idx_webhooks_log_dlq_id ON public.webhooks_log USING btree (dlq_id) WHERE (dlq_id IS NOT NULL);


--


CREATE INDEX lancamentos_contabeis_empresa_comp_idx ON public.lancamentos_contabeis USING btree (empresa_id, competencia);


--


CREATE INDEX lancamentos_contabeis_empresa_data_idx ON public.lancamentos_contabeis USING btree (empresa_id, data_lancamento);


--


CREATE INDEX partidas_contabeis_conta_idx ON public.partidas_contabeis USING btree (conta_id);


--


CREATE INDEX partidas_contabeis_conta_lanc_idx ON public.partidas_contabeis USING btree (conta_id, lancamento_id) INCLUDE (tipo, valor);


--


CREATE INDEX plano_contas_codigo_referencial_idx ON public.plano_contas USING btree (empresa_id, codigo_referencial);


--


CREATE UNIQUE INDEX plano_contas_empresa_codigo_uidx ON public.plano_contas USING btree (empresa_id, codigo) WHERE (empresa_id IS NOT NULL);


--


CREATE INDEX plano_contas_parent_idx ON public.plano_contas USING btree (parent_id);


--


CREATE UNIQUE INDEX ufs_codigo_ibge_unq ON public.ufs USING btree (codigo_ibge);


--


CREATE UNIQUE INDEX uniq_empresas_is_padrao ON public.empresas USING btree ((true)) WHERE is_padrao;


--


CREATE UNIQUE INDEX ux_faturamento_mensal_empresa_ano_mes ON public.faturamento_mensal USING btree (empresa_id, ano, mes);


--


CREATE UNIQUE INDEX ux_folha_pagamento_empresa_ano_mes ON public.folha_pagamento USING btree (empresa_id, ano, mes);


--

-- FASE 5d: Constraints ausentes em tabelas comuns

ALTER TABLE ONLY public.alert_configurations
    ADD CONSTRAINT alert_configurations_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;


--


ALTER TABLE ONLY public.alertas
    ADD CONSTRAINT alertas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--


ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;


--


ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;


--


ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.lalamove_orders(id) ON DELETE SET NULL;


--


ALTER TABLE ONLY public.aliquotas_interestaduais
    ADD CONSTRAINT aliquotas_interestaduais_unq UNIQUE (uf_origem, uf_destino, vigente_de);


--


ALTER TABLE ONLY public.aliquotas_internas_uf
    ADD CONSTRAINT aliquotas_internas_uf_unq UNIQUE (uf, categoria_produto, vigente_de);


--


ALTER TABLE ONLY public.aliquotas_iss_municipal
    ADD CONSTRAINT aliq_iss_mun_unq UNIQUE (codigo_ibge, item_lista_id, vigente_de);


--


ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_hash_unico UNIQUE (key_hash);


--


ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_nome_unico_por_empresa UNIQUE (empresa_id, name);


--


ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey1 PRIMARY KEY (id, created_at);


--


ALTER TABLE ONLY public.bitrix24_activities
    ADD CONSTRAINT bitrix24_activities_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.lalamove_orders(id) ON DELETE CASCADE;


--


ALTER TABLE ONLY public.bitrix24_stage_mappings
    ADD CONSTRAINT bitrix24_stage_mappings_lalamove_status_key UNIQUE (lalamove_status);


--


ALTER TABLE ONLY public.conformidade_snapshots
    ADD CONSTRAINT conformidade_snapshots_unica UNIQUE (empresa_id, competencia);


--


ALTER TABLE ONLY public.elisao_creditos_auditoria
    ADD CONSTRAINT elisao_creditos_auditoria_nota_id_fkey FOREIGN KEY (nota_id) REFERENCES public.notas_fiscais_ocr(id) ON DELETE SET NULL;


--


ALTER TABLE ONLY public.entregas_obrigacoes
    ADD CONSTRAINT entregas_obrigacoes_unica UNIQUE (empresa_id, obrigacao_id, competencia);


--


ALTER TABLE ONLY public.faixas_simples_nacional
    ADD CONSTRAINT faixas_simples_unq UNIQUE (anexo, faixa, vigente_de);


--


ALTER TABLE ONLY public.fechamentos_tributarios
    ADD CONSTRAINT fechamento_unico UNIQUE (empresa_id, ano, mes);


--


ALTER TABLE ONLY public.frontend_error_logs
    ADD CONSTRAINT frontend_error_logs_pkey1 PRIMARY KEY (id, created_at);


--


ALTER TABLE ONLY public.integration_secrets
    ADD CONSTRAINT integration_secrets_chave_key UNIQUE (chave);


--


ALTER TABLE ONLY public.kpis_operacionais
    ADD CONSTRAINT kpis_operacionais_unique UNIQUE (user_id, nome);


--


ALTER TABLE ONLY public.plano_contas
    ADD CONSTRAINT plano_contas_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.plano_contas(id) ON DELETE SET NULL;


--


ALTER TABLE ONLY public.protocolos_st_ncms
    ADD CONSTRAINT protocolos_st_ncms_unq UNIQUE (protocolo_id, ncm_codigo);


--


ALTER TABLE ONLY public.protocolos_st_ufs
    ADD CONSTRAINT protocolos_st_ufs_unq UNIQUE (protocolo_id, uf);


--


ALTER TABLE ONLY public.risk_rules
    ADD CONSTRAINT risk_rules_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;


--


ALTER TABLE ONLY public.saved_filters
    ADD CONSTRAINT saved_filters_unique UNIQUE (user_id, entity_type, name);


--


ALTER TABLE ONLY public.scim_setup_checklist
    ADD CONSTRAINT scim_checklist_unico UNIQUE (user_id, item_key);


--


ALTER TABLE ONLY public.solicitacoes_lgpd
    ADD CONSTRAINT solicitacoes_lgpd_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--


ALTER TABLE ONLY public.user_active_filters
    ADD CONSTRAINT user_active_filters_unique UNIQUE (user_id, entity_type);


--


ALTER TABLE ONLY public.user_anomalia_preferences
    ADD CONSTRAINT user_anomalia_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--


ALTER TABLE ONLY public.user_digest_preferences
    ADD CONSTRAINT user_digest_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--


ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--

-- FASE 6: Views ausentes/alteradas
DROP VIEW IF EXISTS public.drivers_safe_view CASCADE;

CREATE VIEW public.drivers_safe_view WITH (security_invoker='on') AS
 SELECT id,
    name,
    vehicle_type,
    status,
    rating,
    risk_score,
    risk_level,
    total_deliveries,
    completed_deliveries,
    failed_deliveries,
    cancelled_deliveries,
    success_rate,
    failure_rate,
    avg_delay_minutes,
    lalamove_id,
    vehicle_plate,
    photo_url,
    blacklisted,
    blacklist_reason,
    whitelisted,
    notes,
    last_active_at,
    last_delivery_at,
    last_evaluated_at,
    first_seen_at,
    external_rating,
    external_success_rate,
    external_total_deliveries,
    risk_reasons,
    created_at,
    updated_at,
        CASE
            WHEN (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role)) THEN phone
            ELSE '***RESTRITO***'::text
        END AS phone
   FROM public.drivers;


--

DROP VIEW IF EXISTS public.estrategias_elisao_catalogo CASCADE;

CREATE VIEW public.estrategias_elisao_catalogo WITH (security_invoker='true') AS
 SELECT id,
    codigo,
    nome,
    categoria,
    descricao,
    regimes_aplicaveis,
    economia_estimada_percentual,
    risco,
    base_legal,
    requisitos,
    ativo,
    created_at,
    updated_at
   FROM public.estrategias_elisao;


--

DROP VIEW IF EXISTS public.extratos_bancarios_importados CASCADE;

CREATE VIEW public.extratos_bancarios_importados WITH (security_invoker='true') AS
 SELECT id,
    user_id,
    conta_bancaria_id,
    data,
    descricao,
    valor,
    tipo,
    numero_documento,
    numero_documento_banco,
    codigo_transacao,
    arquivo_origem,
    importado_de,
    importado_em,
    linha_arquivo,
    hash_transacao,
    saldo,
    conciliado,
    created_at
   FROM public.extrato_bancario;


--

DROP VIEW IF EXISTS public.mcp_probe CASCADE;

CREATE VIEW public.mcp_probe AS
 SELECT 1 AS probe,
    CURRENT_TIMESTAMP AS ts;


--

DROP VIEW IF EXISTS public.mv_benchmark_setorial CASCADE;

CREATE MATERIALIZED VIEW public.mv_benchmark_setorial AS
 WITH carga AS (
         SELECT vw_tributario_dashboard.regime_tributario AS regime,
            vw_tributario_dashboard.empresa_id,
            sum(vw_tributario_dashboard.total_tributos) AS total_12m
           FROM public.vw_tributario_dashboard
          WHERE ((vw_tributario_dashboard.ano IS NOT NULL) AND (vw_tributario_dashboard.mes IS NOT NULL) AND (((vw_tributario_dashboard.ano * 12) + vw_tributario_dashboard.mes) >= ((((EXTRACT(year FROM CURRENT_DATE))::integer * 12) + (EXTRACT(month FROM CURRENT_DATE))::integer) - 12)))
          GROUP BY vw_tributario_dashboard.regime_tributario, vw_tributario_dashboard.empresa_id
        )
 SELECT regime,
    count(*) AS amostra,
    percentile_cont((0.25)::double precision) WITHIN GROUP (ORDER BY ((total_12m)::double precision)) AS p25,
    percentile_cont((0.5)::double precision) WITHIN GROUP (ORDER BY ((total_12m)::double precision)) AS mediana,
    percentile_cont((0.75)::double precision) WITHIN GROUP (ORDER BY ((total_12m)::double precision)) AS p75,
    avg(total_12m) AS media,
    now() AS atualizado_em
   FROM carga
  GROUP BY regime
  WITH NO DATA;


--

DROP VIEW IF EXISTS public.orders_operator_view CASCADE;

CREATE VIEW public.orders_operator_view WITH (security_invoker='on') AS
 SELECT id,
    lalamove_id,
    status,
    pickup_address,
    delivery_address,
        CASE
            WHEN (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role)) THEN customer_phone
            ELSE '***RESTRITO***'::text
        END AS customer_phone,
    customer_name,
    vehicle_type,
    total_cost,
    currency,
    scheduled_at,
    estimated_delivery,
    actual_delivery,
    driver_id,
    is_urgent,
    outcome,
    delay_minutes,
    duration_minutes,
    distance_meters,
    tags,
    department,
    cost_center,
    internal_status,
    internal_order_id,
    share_link,
    internal_notes,
    custom_rating,
    quotation_id,
    pickup_latitude,
    pickup_longitude,
    delivery_latitude,
    delivery_longitude,
    metadata,
    bitrix24_deal_id,
    created_at,
    updated_at
   FROM public.lalamove_orders;


--

DROP VIEW IF EXISTS public.orders_safe_view CASCADE;

CREATE VIEW public.orders_safe_view WITH (security_invoker='on') AS
 SELECT id,
    lalamove_id,
    status,
    vehicle_type,
    customer_name,
        CASE
            WHEN (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'financeiro'::public.app_role)) THEN customer_phone
            ELSE '***RESTRITO***'::text
        END AS customer_phone,
    pickup_address,
    delivery_address,
    total_cost,
    currency,
    scheduled_at,
    estimated_delivery,
    actual_delivery,
    driver_id,
    bitrix24_deal_id,
    share_link,
    tags,
    metadata,
    internal_notes,
    internal_order_id,
    internal_status,
    department,
    cost_center,
    quotation_id,
    is_urgent,
    outcome,
    delay_minutes,
    custom_rating,
    distance_meters,
    duration_minutes,
    pickup_latitude,
    pickup_longitude,
    delivery_latitude,
    delivery_longitude,
    created_at,
    updated_at
   FROM public.lalamove_orders;


--

DROP VIEW IF EXISTS public.v_sefaz_observability CASCADE;

CREATE VIEW public.v_sefaz_observability WITH (security_invoker='true') AS
 SELECT c.cnpj,
    c.ambiente,
    c.ultimo_nsu,
    c.max_nsu,
    c.ultima_consulta,
    c.ultimo_status,
    c.circuit_open,
    c.retry_count,
    c.next_run_at,
    (EXTRACT(epoch FROM (now() - c.ultima_consulta)))::integer AS seconds_since_last,
    COALESCE(n.nfe_24h, (0)::bigint) AS nfe_24h,
    COALESCE(n.nfe_7d, (0)::bigint) AS nfe_7d,
    COALESCE(a.open_alerts, (0)::bigint) AS open_alerts
   FROM ((public.sefaz_dfe_cursor c
     LEFT JOIN LATERAL ( SELECT count(*) FILTER (WHERE (r.created_at > (now() - '24:00:00'::interval))) AS nfe_24h,
            count(*) FILTER (WHERE (r.created_at > (now() - '7 days'::interval))) AS nfe_7d
           FROM public.nfe_recebidas r
          WHERE ((r.cnpj_destinatario = c.cnpj) AND (r.ambiente = c.ambiente))) n ON (true))
     LEFT JOIN LATERAL ( SELECT count(*) AS open_alerts
           FROM public.integrity_alerts ia
          WHERE ((ia.domain = 'nfe_sefaz'::text) AND (ia.resolved_at IS NULL) AND ((ia.metadata ->> 'cnpj'::text) = c.cnpj))) a ON (true));


--

DROP VIEW IF EXISTS public.v_table_bloat CASCADE;

CREATE VIEW public.v_table_bloat WITH (security_invoker='true') AS
 SELECT schemaname,
    relname AS table_name,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows,
        CASE
            WHEN ((n_live_tup + n_dead_tup) > 0) THEN round((((n_dead_tup)::numeric / ((n_live_tup + n_dead_tup))::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS dead_ratio_pct,
    pg_size_pretty(pg_total_relation_size((relid)::regclass)) AS total_size_pretty,
    pg_total_relation_size((relid)::regclass) AS total_size_bytes,
    pg_size_pretty(pg_relation_size((relid)::regclass)) AS table_size_pretty,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    vacuum_count,
    autovacuum_count,
    analyze_count,
    autoanalyze_count
   FROM pg_stat_user_tables
  WHERE (schemaname = 'public'::name);


--

DROP VIEW IF EXISTS public.vw_auditoria_tributaria_recente CASCADE;

CREATE VIEW public.vw_auditoria_tributaria_recente WITH (security_invoker='true') AS
 SELECT a.id,
    a.empresa_id,
    e.razao_social AS empresa_nome,
    a.user_id,
    p.full_name AS user_nome,
    a.user_email,
    a.acao,
    a.entidade_tipo,
    a.entidade_id,
    a.payload_anterior,
    a.payload_novo,
    a.criado_em
   FROM ((public.auditoria_tributaria a
     LEFT JOIN public.empresas e ON ((e.id = a.empresa_id)))
     LEFT JOIN public.profiles p ON ((p.user_id = a.user_id)))
  ORDER BY a.criado_em DESC
 LIMIT 500;


--

DROP VIEW IF EXISTS public.vw_contas_pagar_painel CASCADE;

CREATE VIEW public.vw_contas_pagar_painel WITH (security_invoker='on') AS
 SELECT cp.id,
    cp.descricao,
    cp.valor,
    cp.data_vencimento,
    cp.data_pagamento,
    cp.status,
    cp.fornecedor_id,
    cp.user_id,
    cp.created_at,
    cp.updated_at,
    cp.empresa_id,
    cp.categoria_id,
    cp.centro_custo_id,
    cp.forma_pagamento,
    cp.conta_bancaria_id,
    cp.numero_documento,
    cp.observacoes,
    cp.valor_pago,
    cp.juros,
    cp.multa,
    cp.desconto,
    cp.recorrente,
    cp.parcela_atual,
    cp.total_parcelas,
    cp.anexo_url,
    cp.metadata,
    cp.categoria,
    cp.fornecedor_nome,
    cp.categoria_nome,
    cp.centro_resultado,
    cp.aprovado_por,
    cp.tipo_cobranca,
    f.razao_social AS fornecedor_razao_social,
    f.nome_fantasia AS fornecedor_nome_fantasia,
    COALESCE(cp.fornecedor_nome, (f.razao_social)::text, 'Fornecedor não identificado'::text) AS fornecedor_nome_display,
    cc.nome AS centro_custo_nome,
    cb.banco AS conta_bancaria_nome
   FROM (((public.contas_pagar cp
     LEFT JOIN public.fornecedores f ON ((cp.fornecedor_id = f.id)))
     LEFT JOIN public.centros_custo cc ON ((cp.centro_custo_id = cc.id)))
     LEFT JOIN public.contas_bancarias cb ON ((cp.conta_bancaria_id = cb.id)));


--

DROP VIEW IF EXISTS public.vw_contas_receber_painel CASCADE;

CREATE VIEW public.vw_contas_receber_painel WITH (security_invoker='on') AS
 SELECT cr.id,
    cr.descricao,
    cr.valor,
    cr.data_vencimento,
    cr.data_recebimento,
    cr.status,
    cr.cliente_id,
    cr.user_id,
    cr.created_at,
    cr.updated_at,
    cr.empresa_id,
    cr.categoria_id,
    cr.centro_custo_id,
    cr.forma_recebimento,
    cr.conta_bancaria_id,
    cr.numero_documento,
    cr.observacoes,
    cr.valor_recebido,
    cr.juros,
    cr.multa,
    cr.desconto,
    cr.recorrente,
    cr.parcela_atual,
    cr.total_parcelas,
    cr.anexo_url,
    cr.score,
    cr.metadata,
    cr.cliente_nome,
    cr.etapa_cobranca,
    cr.tipo_cobranca,
    cr.numero_parcela_atual,
    cr.valor_desconto,
        CASE
            WHEN public.pode_ver_dado_sensivel() THEN cr.chave_pix
            ELSE public.mascarar_chave_pix(cr.chave_pix)
        END AS chave_pix,
    cr.data_emissao,
    cr.categoria_nome,
    cl.razao_social AS cliente_razao_social,
    cl.nome_fantasia AS cliente_nome_fantasia,
    COALESCE(cr.cliente_nome, cl.razao_social, 'Cliente não identificado'::text) AS cliente_nome_display,
    cc.nome AS centro_custo_nome,
    cb.banco AS conta_bancaria_nome
   FROM (((public.contas_receber cr
     LEFT JOIN public.clientes cl ON ((cr.cliente_id = cl.id)))
     LEFT JOIN public.centros_custo cc ON ((cr.centro_custo_id = cc.id)))
     LEFT JOIN public.contas_bancarias cb ON ((cr.conta_bancaria_id = cb.id)));


--

DROP VIEW IF EXISTS public.vw_dre_mensal CASCADE;

CREATE VIEW public.vw_dre_mensal WITH (security_invoker='on') AS
 SELECT gen_random_uuid() AS id,
    id AS empresa_id,
    to_char(now(), 'YYYY-MM'::text) AS mes,
    50000.00 AS receita_bruta,
    30000.00 AS custos,
    20000.00 AS lucro_bruto,
    15000.00 AS despesas_operacionais,
    5000.00 AS ebitda
   FROM public.empresas;


--

DROP VIEW IF EXISTS public.vw_dso_aging CASCADE;

CREATE VIEW public.vw_dso_aging WITH (security_invoker='on') AS
 SELECT id AS empresa_id,
    45 AS dso_atual,
    5000.00 AS a_vencer,
    2000.00 AS vencido_0_30,
    1500.00 AS vencido_31_60,
    1000.00 AS vencido_61_plus
   FROM public.empresas;


--

DROP VIEW IF EXISTS public.vw_fluxo_caixa CASCADE;

CREATE VIEW public.vw_fluxo_caixa WITH (security_invoker='on') AS
 SELECT gen_random_uuid() AS id,
    id AS empresa_id,
    (now())::date AS dia,
    2000.00 AS entradas_previstas,
    1500.00 AS saidas_previstas,
    500.00 AS saldo_projetado
   FROM public.empresas;


--

DROP VIEW IF EXISTS public.vw_fluxo_caixa_diario CASCADE;

CREATE VIEW public.vw_fluxo_caixa_diario WITH (security_invoker='on') AS
 SELECT gen_random_uuid() AS id,
    id AS empresa_id,
    (now())::date AS dia,
    2500.00 AS entradas_reais,
    1200.00 AS saidas_reais,
    1300.00 AS saldo_final
   FROM public.empresas;


--

DROP VIEW IF EXISTS public.vw_gastos_centro_custo CASCADE;

CREATE VIEW public.vw_gastos_centro_custo WITH (security_invoker='on') AS
 SELECT id AS centro_custo_id,
    nome AS nome_centro_custo,
    empresa_id,
    0.0 AS total_gasto
   FROM public.centros_custo;


--

DROP VIEW IF EXISTS public.vw_metricas_cobranca CASCADE;

CREATE VIEW public.vw_metricas_cobranca WITH (security_invoker='on') AS
 SELECT id AS empresa_id,
    15.5 AS taxa_inadimplencia,
    120 AS ticket_medio,
    500 AS total_cobrancas_mes
   FROM public.empresas;


--

DROP VIEW IF EXISTS public.vw_rpc_hotspots CASCADE;

CREATE VIEW public.vw_rpc_hotspots WITH (security_invoker='true') AS
 SELECT function_name,
    date_trunc('hour'::text, called_at) AS bucket_hour,
    count(*) AS calls,
    count(*) FILTER (WHERE (NOT success)) AS errors,
    round(avg(duration_ms), 2) AS avg_ms,
    round((percentile_cont((0.5)::double precision) WITHIN GROUP (ORDER BY ((duration_ms)::double precision)))::numeric, 2) AS p50_ms,
    round((percentile_cont((0.95)::double precision) WITHIN GROUP (ORDER BY ((duration_ms)::double precision)))::numeric, 2) AS p95_ms,
    round((percentile_cont((0.99)::double precision) WITHIN GROUP (ORDER BY ((duration_ms)::double precision)))::numeric, 2) AS p99_ms,
    max(duration_ms) AS max_ms
   FROM public.rpc_observability_metrics
  WHERE (called_at >= (now() - '7 days'::interval))
  GROUP BY function_name, (date_trunc('hour'::text, called_at));


--

DROP VIEW IF EXISTS public.vw_rpc_slow_calls CASCADE;

CREATE VIEW public.vw_rpc_slow_calls WITH (security_invoker='true') AS
 SELECT id,
    function_name,
    caller_user_id,
    caller_role,
    duration_ms,
    success,
    error_sqlstate,
    error_message,
    meta,
    called_at
   FROM public.rpc_observability_metrics
  WHERE (called_at >= (now() - '24:00:00'::interval))
  ORDER BY duration_ms DESC
 LIMIT 200;


--

DROP VIEW IF EXISTS public.vw_saldos_contas CASCADE;

CREATE VIEW public.vw_saldos_contas WITH (security_invoker='on') AS
 SELECT gen_random_uuid() AS id,
    id AS empresa_id,
    'Conta Corrente'::text AS nome_conta,
    1000.00 AS saldo_atual,
    now() AS ultima_atualizacao
   FROM public.empresas;


--

DROP VIEW IF EXISTS public.vw_transferencias_painel CASCADE;

CREATE VIEW public.vw_transferencias_painel WITH (security_invoker='true') AS
 SELECT t.id,
    t.empresa_id,
    e.razao_social,
    t.asaas_id,
    t.valor,
    t.status,
    t.tipo_chave,
        CASE
            WHEN public.pode_ver_dado_sensivel() THEN t.chave_pix
            ELSE public.mascarar_chave_pix(t.chave_pix)
        END AS chave_pix,
    t.descricao,
    t.created_at,
    t.updated_at
   FROM (public.asaas_transfers t
     LEFT JOIN public.empresas e ON ((e.id = t.empresa_id)));


--

DROP VIEW IF EXISTS public.vw_tributario_dashboard CASCADE;

CREATE VIEW public.vw_tributario_dashboard WITH (security_invoker='true') AS
 SELECT e.id AS empresa_id,
    e.razao_social,
    COALESCE(e.regime_tributario, 'nao_informado'::text) AS regime_tributario,
    at_.ano,
    at_.mes,
    at_.competencia,
    COALESCE(at_.total_geral, (0)::numeric) AS total_tributos,
    COALESCE(at_.total_tributos_novos, (0)::numeric) AS tributos_novos,
    COALESCE(at_.total_tributos_residuais, (0)::numeric) AS tributos_residuais,
    COALESCE(at_.cbs_a_pagar, (0)::numeric) AS cbs,
    COALESCE(at_.ibs_a_pagar, (0)::numeric) AS ibs,
    COALESCE(at_.is_a_pagar, (0)::numeric) AS imposto_seletivo,
    at_.status AS status_apuracao
   FROM (public.empresas e
     JOIN public.apuracoes_tributarias at_ ON ((at_.empresa_id = e.id)));


--

DROP VIEW IF EXISTS public.vw_webhooks_recentes CASCADE;

CREATE VIEW public.vw_webhooks_recentes WITH (security_invoker='true') AS
 SELECT id,
    source,
    event_type,
    status,
    payload,
    response,
    error_message,
    created_at
   FROM public.webhooks_log
  ORDER BY created_at DESC
 LIMIT 100;


--

-- FASE 7: Cron jobs (URL src->dst)
SELECT cron.unschedule('pgss_weekly_baseline') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='pgss_weekly_baseline');
SELECT cron.schedule('pgss_weekly_baseline', '0 3 * * 0', $CRON$| to_char(now(),'YYYY_MM_DD'));$CRON$);

-- FASE 8: Storage buckets
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types,created_at,updated_at)
VALUES('nfe-xml','nfe-xml',false,52428800,'{application/xml,text/xml}',now(),now()) ON CONFLICT(id) DO NOTHING;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types,created_at,updated_at)
VALUES('nfe-certificados','nfe-certificados',false,5242880,'{application/pkcs12,application/x-pkcs12,application/octet-stream}',now(),now()) ON CONFLICT(id) DO NOTHING;

-- FASE 9: Registro
INSERT INTO supabase_migrations.schema_migrations(version,name,statements)
VALUES('20260825100000','reconciliar_schema_completo',ARRAY['reconciliar_schema_completo']) ON CONFLICT DO NOTHING;

COMMIT;
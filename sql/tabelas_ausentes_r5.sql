-- ============================================================
-- Tabelas ausentes (sem views) — executa primeiro
-- ============================================================

CREATE TABLE IF NOT EXISTS public.nfe_xml (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id      uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  chave_acesso    text UNIQUE,
  numero          integer,
  serie           text,
  tipo_documento  text NOT NULL DEFAULT 'nfe',
  xml_original    text,
  xml_processado  text,
  status          text NOT NULL DEFAULT 'pendente',
  data_emissao    date,
  valor_total     numeric(15,2),
  criado_em       timestamptz DEFAULT now(),
  atualizado_em   timestamptz DEFAULT now()
);
ALTER TABLE public.nfe_xml ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_nfe_xml" ON public.nfe_xml FOR ALL TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.kpis_operacionais (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id      uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome            text NOT NULL,
  valor           numeric(15,4) NOT NULL DEFAULT 0,
  unidade         text DEFAULT 'unidade',
  periodo         text,
  referencia      date,
  meta            numeric(15,4),
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.kpis_operacionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_kpis_operacionais" ON public.kpis_operacionais FOR ALL TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.organizacoes (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome            text NOT NULL,
  cnpj            text UNIQUE,
  email           text,
  telefone        text,
  plano           text NOT NULL DEFAULT 'trial',
  max_empresas    integer NOT NULL DEFAULT 1,
  ativo           boolean NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_organizacoes" ON public.organizacoes FOR ALL TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.pagamentos_recorrentes (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id          uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  descricao           text NOT NULL,
  plano               text,
  valor               numeric(15,2) NOT NULL,
  frequencia          text NOT NULL DEFAULT 'mensal',
  data_inicio         date NOT NULL,
  data_proximo        date,
  data_vencimento     date,
  status              text NOT NULL DEFAULT 'ativo',
  ultima_transacao_id  text,
  gateway             text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
ALTER TABLE public.pagamentos_recorrentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_pagamentos_recorrentes" ON public.pagamentos_recorrentes FOR ALL TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.api_keys (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome          text NOT NULL,
  chave         text UNIQUE NOT NULL,
  empresa_id    uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  scopes        text[],
  ativo         boolean NOT NULL DEFAULT true,
  expira_em     timestamptz,
  ultimo_uso    timestamptz,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_api_keys" ON public.api_keys FOR ALL TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.resumos_executivos_semanais (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id      uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  data_inicio     date NOT NULL,
  data_fim        date NOT NULL,
  conteudo        jsonb,
  enviado_em      timestamptz,
  status          text NOT NULL DEFAULT 'pendente',
  email_destino   text,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.resumos_executivos_semanais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_resumos_executivos_semanais" ON public.resumos_executivos_semanais FOR ALL TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.retencoes_fonte (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id      uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_tributo    text NOT NULL,
  base_calculo    numeric(15,2) NOT NULL DEFAULT 0,
  aliquota        numeric(6,4) NOT NULL DEFAULT 0,
  valor_reter     numeric(15,2) NOT NULL DEFAULT 0,
  valor_pago      numeric(15,2) NOT NULL DEFAULT 0,
  competencia     date NOT NULL,
  documento       text,
  fornecedor_id   uuid REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  observacoes     text,
  status          text NOT NULL DEFAULT 'pendente',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
ALTER TABLE public.retencoes_fonte ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_retencoes_fonte" ON public.retencoes_fonte FOR ALL TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.regimes_simulados (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id      uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  competencia     date NOT NULL,
  regime          text NOT NULL,
  receita_bruta   numeric(15,2) NOT NULL DEFAULT 0,
  total_tributos  numeric(15,2) NOT NULL DEFAULT 0,
  carga_tributaria_pct numeric(6,2),
  economia_potencial numeric(15,2) DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.regimes_simulados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_regimes_simulados" ON public.regimes_simulados FOR ALL TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.scim_setup_checklist (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id  uuid,
  etapa           text NOT NULL,
  status          text NOT NULL DEFAULT 'pendente',
  mensagem_erro   text,
  concluido_em    timestamptz,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.scim_setup_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_scim_setup_checklist" ON public.scim_setup_checklist FOR ALL TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.user_active_filters (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  contexto       text NOT NULL,
  filtros       jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, contexto)
);
ALTER TABLE public.user_active_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_filters" ON public.user_active_filters FOR ALL TO authenticated USING (user_id = auth.uid() OR true);

CREATE TABLE IF NOT EXISTS public.user_filter_presets (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  contexto      text NOT NULL,
  filtros       jsonb NOT NULL DEFAULT '{}',
  is_default    boolean NOT NULL DEFAULT false,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE public.user_filter_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_presets" ON public.user_filter_presets FOR ALL TO authenticated USING (user_id = auth.uid() OR true);

CREATE TABLE IF NOT EXISTS public.sped_contabil_arquivos (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id      uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo             text NOT NULL,
  competencia      date NOT NULL,
  arquivo_nome     text,
  arquivo_path     text,
  arquivo_hash     text,
  periodo_inicio   date,
  periodo_fim      date,
  status          text NOT NULL DEFAULT 'gerado',
  protocolo       text,
  gerado_em       timestamptz DEFAULT now(),
  transmitido_em  timestamptz
);
ALTER TABLE public.sped_contabil_arquivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_all_sped_contabil_arquivos" ON public.sped_contabil_arquivos FOR ALL TO authenticated USING (true);

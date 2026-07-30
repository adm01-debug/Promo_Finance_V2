
-- ============================================================
-- Fase 1: Fundação — SEFAZ NFeDistribuicaoDFe
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.sefaz_ambiente AS ENUM ('homologacao', 'producao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.nfe_manifestacao_status AS ENUM (
    'pendente', 'ciencia', 'confirmada', 'desconhecida', 'nao_realizada'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.nfe_schema_tipo AS ENUM ('resNFe', 'procNFe', 'resEvento', 'procEventoNFe', 'resCTe', 'procCTe');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Tabela: empresas_certificados
-- ============================================================
CREATE TABLE IF NOT EXISTS public.empresas_certificados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cnpj TEXT NOT NULL,
  razao_social TEXT,
  pfx_secret_name TEXT NOT NULL,
  password_secret_name TEXT NOT NULL,
  valido_de TIMESTAMPTZ,
  valido_ate TIMESTAMPTZ NOT NULL,
  ambiente public.sefaz_ambiente NOT NULL DEFAULT 'homologacao',
  uf TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, cnpj, ambiente)
);

CREATE INDEX IF NOT EXISTS idx_emp_cert_empresa ON public.empresas_certificados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_emp_cert_cnpj ON public.empresas_certificados(cnpj);
CREATE INDEX IF NOT EXISTS idx_emp_cert_ativo ON public.empresas_certificados(ativo) WHERE ativo;
CREATE INDEX IF NOT EXISTS idx_emp_cert_vencimento ON public.empresas_certificados(valido_ate) WHERE ativo;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas_certificados TO authenticated;
GRANT ALL ON public.empresas_certificados TO service_role;

ALTER TABLE public.empresas_certificados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cert_admin_all" ON public.empresas_certificados
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "cert_empresa_read" ON public.empresas_certificados
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid() AND ue.empresa_id = empresas_certificados.empresa_id
    )
  );

-- ============================================================
-- Tabela: sefaz_dfe_cursor
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sefaz_dfe_cursor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj TEXT NOT NULL,
  ambiente public.sefaz_ambiente NOT NULL DEFAULT 'homologacao',
  ultimo_nsu BIGINT NOT NULL DEFAULT 0,
  max_nsu BIGINT NOT NULL DEFAULT 0,
  ultima_consulta TIMESTAMPTZ,
  ultimo_status TEXT,
  ultimo_erro TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cnpj, ambiente)
);

CREATE INDEX IF NOT EXISTS idx_dfe_cursor_cnpj ON public.sefaz_dfe_cursor(cnpj);

GRANT SELECT ON public.sefaz_dfe_cursor TO authenticated;
GRANT ALL ON public.sefaz_dfe_cursor TO service_role;

ALTER TABLE public.sefaz_dfe_cursor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cursor_admin_read" ON public.sefaz_dfe_cursor
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- Tabela: nfe_recebidas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.nfe_recebidas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  chave_acesso TEXT NOT NULL UNIQUE CHECK (length(chave_acesso) = 44),
  cnpj_destinatario TEXT NOT NULL,
  cnpj_emitente TEXT NOT NULL,
  razao_emitente TEXT,
  ie_emitente TEXT,
  uf_emitente TEXT,
  numero TEXT,
  serie TEXT,
  modelo TEXT NOT NULL DEFAULT '55',
  data_emissao TIMESTAMPTZ,
  valor_total NUMERIC(15, 2),
  digest_value TEXT,
  tipo_documento TEXT NOT NULL DEFAULT 'NFe',
  schema_tipo public.nfe_schema_tipo NOT NULL,
  nsu BIGINT NOT NULL,
  ambiente public.sefaz_ambiente NOT NULL DEFAULT 'homologacao',
  xml_path TEXT,
  xml_completo BOOLEAN NOT NULL DEFAULT FALSE,
  manifestacao_status public.nfe_manifestacao_status NOT NULL DEFAULT 'pendente',
  manifestacao_data TIMESTAMPTZ,
  manifestacao_justificativa TEXT,
  situacao_nfe TEXT,
  conta_pagar_id UUID REFERENCES public.contas_pagar(id) ON DELETE SET NULL,
  raw_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nfe_rec_dest ON public.nfe_recebidas(cnpj_destinatario, data_emissao DESC);
CREATE INDEX IF NOT EXISTS idx_nfe_rec_emit ON public.nfe_recebidas(cnpj_emitente);
CREATE INDEX IF NOT EXISTS idx_nfe_rec_empresa ON public.nfe_recebidas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_nfe_rec_manif_pendente ON public.nfe_recebidas(manifestacao_status) WHERE manifestacao_status = 'pendente';
CREATE INDEX IF NOT EXISTS idx_nfe_rec_nsu ON public.nfe_recebidas(nsu);
CREATE INDEX IF NOT EXISTS idx_nfe_rec_conta_pagar ON public.nfe_recebidas(conta_pagar_id) WHERE conta_pagar_id IS NOT NULL;

GRANT SELECT, UPDATE ON public.nfe_recebidas TO authenticated;
GRANT ALL ON public.nfe_recebidas TO service_role;

ALTER TABLE public.nfe_recebidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nfe_rec_empresa_read" ON public.nfe_recebidas
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (empresa_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid() AND ue.empresa_id = nfe_recebidas.empresa_id
    ))
  );

CREATE POLICY "nfe_rec_empresa_update" ON public.nfe_recebidas
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (empresa_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid() AND ue.empresa_id = nfe_recebidas.empresa_id
    ))
  );

-- ============================================================
-- Tabela: nfe_eventos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.nfe_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave_acesso TEXT NOT NULL,
  tipo_evento TEXT NOT NULL,
  codigo_evento TEXT,
  sequencial INTEGER NOT NULL DEFAULT 1,
  data_evento TIMESTAMPTZ NOT NULL DEFAULT now(),
  protocolo TEXT,
  justificativa TEXT,
  status_retorno TEXT,
  motivo_retorno TEXT,
  xml_path TEXT,
  raw_payload JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nfe_ev_chave ON public.nfe_eventos(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_nfe_ev_tipo ON public.nfe_eventos(tipo_evento);

GRANT SELECT ON public.nfe_eventos TO authenticated;
GRANT ALL ON public.nfe_eventos TO service_role;

ALTER TABLE public.nfe_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nfe_ev_read_via_nfe" ON public.nfe_eventos
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.nfe_recebidas r
      JOIN public.user_empresas ue ON ue.empresa_id = r.empresa_id
      WHERE r.chave_acesso = nfe_eventos.chave_acesso AND ue.user_id = auth.uid()
    )
  );

-- ============================================================
-- Trigger updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_emp_cert_updated ON public.empresas_certificados;
CREATE TRIGGER trg_emp_cert_updated BEFORE UPDATE ON public.empresas_certificados
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

DROP TRIGGER IF EXISTS trg_dfe_cursor_updated ON public.sefaz_dfe_cursor;
CREATE TRIGGER trg_dfe_cursor_updated BEFORE UPDATE ON public.sefaz_dfe_cursor
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

DROP TRIGGER IF EXISTS trg_nfe_rec_updated ON public.nfe_recebidas;
CREATE TRIGGER trg_nfe_rec_updated BEFORE UPDATE ON public.nfe_recebidas
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

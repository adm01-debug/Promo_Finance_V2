DO $$ BEGIN
  CREATE TYPE public.regime_tributario_enum AS ENUM ('MEI','SIMPLES','PRESUMIDO','REAL','ARBITRADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.atividade_economica AS ENUM ('INDUSTRIA','COMERCIO','SERVICOS','MISTA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.uf_brasil AS ENUM ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.regiao_brasil AS ENUM ('NORTE','NORDESTE','CENTRO_OESTE','SUDESTE','SUL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.nivel_risco AS ENUM ('BAIXO','MEDIO','ALTO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.status_workflow AS ENUM ('IDENTIFICADO','EM_ANALISE','APROVADO','EM_EXECUCAO','CONCLUIDO','CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_destinatario AS ENUM ('CONTRIBUINTE_REVENDA','CONTRIBUINTE_USO_CONSUMO','NAO_CONTRIBUINTE','EXTERIOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.empresa_acessivel(_empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _empresa_id IS NOT NULL AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_empresas ue
      WHERE ue.empresa_id = _empresa_id
        AND ue.user_id = auth.uid()
        AND COALESCE(ue.ativo, true)
    )
  )
$$;

REVOKE ALL ON FUNCTION public.empresa_acessivel(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empresa_acessivel(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
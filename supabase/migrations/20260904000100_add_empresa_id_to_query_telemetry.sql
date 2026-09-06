-- Migration 20260904000100
-- PROBLEMA: external-data/index.ts passou a inserir empresa_id em query_telemetry
-- (commit d77d64e), mas a tabela foi criada sem essa coluna (migration 20260323120620).
-- Todo insert de telemetria slow/error retornava 400, silenciando o audit trail.
-- FIX: adicionar empresa_id nullable com FK para empresas (ON DELETE SET NULL).

BEGIN;

ALTER TABLE public.query_telemetry
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_query_telemetry_empresa_id
  ON public.query_telemetry (empresa_id);

COMMIT;

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES (
  '20260904000100',
  'add_empresa_id_to_query_telemetry',
  ARRAY[
    'ALTER TABLE public.query_telemetry ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL',
    'CREATE INDEX IF NOT EXISTS idx_query_telemetry_empresa_id ON public.query_telemetry (empresa_id)'
  ]
)
ON CONFLICT (version) DO NOTHING;

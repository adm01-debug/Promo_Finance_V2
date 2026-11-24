-- Cobertura de índice para a FK kpis_operacionais.empresa_id -> empresas.id.
-- O Postgres não cria índice para FK automaticamente: sem este, um DELETE/UPDATE em
-- empresas varre kpis_operacionais por seq scan (o mesmo achado ACH-DB-10 da QA).
CREATE INDEX IF NOT EXISTS idx_kpis_operacionais_empresa_id_fk
  ON public.kpis_operacionais USING btree (empresa_id);
-- Cobertura de índice para a FK kpis_operacionais.empresa_id -> empresas.id.
-- O Postgres não cria índice para FK automaticamente: sem este, um DELETE/UPDATE em
-- empresas varre kpis_operacionais por seq scan (o mesmo achado ACH-DB-10 da QA).
--
-- A coluna existe no banco canônico (constraint kpis_operacionais_empresa_id_fkey,
-- ver src/integrations/supabase/types.ts) mas nenhuma migration a declara: nem as
-- duas que criam a tabela (20260509123749:27, 20260728161227:69) nem a reconciliação
-- de colunas (20260825100000:3895). Num banco vazio a tabela nasce sem a coluna e o
-- CREATE INDEX abaixo aborta o replay com "column empresa_id does not exist".
-- Versionar a coluna antes do índice mantém o replay fiel ao banco real; em produção
-- o IF NOT EXISTS é no-op.
ALTER TABLE public.kpis_operacionais
  ADD COLUMN IF NOT EXISTS empresa_id uuid;

CREATE INDEX IF NOT EXISTS idx_kpis_operacionais_empresa_id_fk
  ON public.kpis_operacionais USING btree (empresa_id);

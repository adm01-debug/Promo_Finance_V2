-- Cobertura de índice para a FK kpis_operacionais.empresa_id -> empresas.id.
-- O Postgres não cria índice para FK automaticamente: sem este, um DELETE/UPDATE em
-- empresas varre kpis_operacionais por seq scan (o mesmo achado ACH-DB-10 da QA).
--
-- A coluna existe no banco canônico (constraint kpis_operacionais_empresa_id_fkey,
-- ver src/integrations/supabase/types.ts:9358) mas nenhuma migration a declara: nem as
-- duas que criam a tabela (20260509123749:27, 20260728161227:69) nem a reconciliação
-- de colunas (20260825100000:3895). As quatro colunas que o canônico tem além dessas
-- duas definições (empresa_id, valor, periodo, referencia) são exatamente as do DDL
-- ad-hoc docs/archive/sql/scripts/tabelas_ausentes_r5.sql:23-33, que é portanto a
-- origem da tabela viva e a única definição da coluna no repositório.
--
-- Num banco vazio a tabela nasce sem a coluna e o CREATE INDEX abortava o replay com
-- "column empresa_id does not exist"; a FK também ficou de fora da cadeia e o replay
-- aceitava empresa_id apontando para empresa inexistente, o oposto do canônico, que
-- rejeita. Versionar coluna, FK e índice, na ordem que a FK exige, mantém o replay
-- fiel ao banco real.
--
-- ON DELETE CASCADE vem dessa mesma definição (r5:25). NO ACTION seria suposição por
-- analogia, e o replay passaria a bloquear uma exclusão de empresa que o canônico
-- permite. Em produção os três objetos já existem e nenhum DDL é executado: os guards
-- são por catálogo, não por IF NOT EXISTS (que pede o lock antes de checar).
DO $reconcile$
BEGIN
  IF to_regclass('public.kpis_operacionais') IS NULL THEN
    RAISE NOTICE 'public.kpis_operacionais ausente: nada a reconciliar';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public'
                    AND table_name = 'kpis_operacionais'
                    AND column_name = 'empresa_id') THEN
    EXECUTE 'ALTER TABLE public.kpis_operacionais ADD COLUMN empresa_id uuid';
  END IF;

  IF to_regclass('public.empresas') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint
                      WHERE conname = 'kpis_operacionais_empresa_id_fkey'
                        AND conrelid = 'public.kpis_operacionais'::regclass) THEN
    EXECUTE 'ALTER TABLE public.kpis_operacionais ADD CONSTRAINT kpis_operacionais_empresa_id_fkey '
         || 'FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class c
                   JOIN pg_namespace n ON n.oid = c.relnamespace
                  WHERE c.relname = 'idx_kpis_operacionais_empresa_id_fk'
                    AND n.nspname = 'public') THEN
    EXECUTE 'CREATE INDEX idx_kpis_operacionais_empresa_id_fk '
         || 'ON public.kpis_operacionais USING btree (empresa_id)';
  END IF;
END
$reconcile$;
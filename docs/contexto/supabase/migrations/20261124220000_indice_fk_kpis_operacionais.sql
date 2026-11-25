-- Cobertura de índice para a FK kpis_operacionais.empresa_id -> empresas.id.
-- O Postgres não cria índice para FK automaticamente: sem este, um DELETE/UPDATE em
-- empresas varre kpis_operacionais por seq scan (o mesmo achado ACH-DB-10 da QA).
--
-- A coluna existe no banco canônico (constraint kpis_operacionais_empresa_id_fkey,
-- ver src/integrations/supabase/types.ts:9358) mas nenhuma migration a declara: nem as
-- duas que criam a tabela (20260509123749:27, 20260728161227:69) nem a reconciliação
-- de colunas (20260825100000:3895). As colunas que o canônico tem além dessas duas
-- definições (empresa_id, valor, periodo, referencia — evidencias.json:29360-29406)
-- são exatamente as do DDL ad-hoc docs/archive/sql/scripts/tabelas_ausentes_r5.sql:
-- 23-33, que é portanto a origem da tabela viva e a única definição da coluna no
-- repositório. Num banco vazio a tabela nasce sem ela e o CREATE INDEX abortava o
-- replay com "column empresa_id does not exist"; a FK também ficou fora da cadeia e o
-- replay aceitava empresa_id apontando para empresa inexistente, o oposto do canônico.
--
-- ON DELETE CASCADE vem dessa mesma definição (r5:25); NO ACTION seria suposição por
-- analogia e faria o replay bloquear uma exclusão de empresa que o canônico permite.
--
-- Nome do índice: a cadeia usa as duas formas (896 CREATE INDEX sem sufixo e 151 com
-- `_fk` em supabase/migrations), então convenção não decide. Decide o objeto no
-- canônico: o snapshot de 24/11 registra idx_kpis_operacionais_empresa_id como btree
-- válido em empresa_id, sem predicado, e é o nome usado. O guard não depende do nome:
-- procura QUALQUER índice válido liderado por empresa_id, então um já existente com
-- nome diferente não gera duplicata.
--
-- Em produção coluna, FK e índice já existem: os guards são por catálogo, não por
-- IF NOT EXISTS (que pede o lock da tabela antes de checar), então ali a migration
-- não executa DDL nenhum e não há ALTER TABLE nem CREATE INDEX.
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

  IF NOT EXISTS (SELECT 1
                   FROM pg_index i
                   JOIN pg_class tc ON tc.oid = i.indrelid
                   JOIN pg_namespace n ON n.oid = tc.relnamespace
                  WHERE n.nspname = 'public'
                    AND tc.relname = 'kpis_operacionais'
                    AND i.indisvalid
                    AND i.indpred IS NULL
                    AND pg_get_indexdef(i.indexrelid, 1, true) = 'empresa_id') THEN
    EXECUTE 'CREATE INDEX idx_kpis_operacionais_empresa_id '
         || 'ON public.kpis_operacionais USING btree (empresa_id)';
  END IF;
END
$reconcile$

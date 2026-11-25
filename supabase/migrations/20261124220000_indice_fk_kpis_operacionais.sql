-- Cobertura de índice para a FK kpis_operacionais.empresa_id -> empresas.id.
-- O Postgres não cria índice para FK automaticamente: sem este, um DELETE/UPDATE em
-- empresas varre kpis_operacionais por seq scan (o mesmo achado ACH-DB-10 da QA).
--
-- A coluna existe no banco canônico (constraint kpis_operacionais_empresa_id_fkey,
-- ver src/integrations/supabase/types.ts) mas nenhuma migration a declara: nem as
-- duas que criam a tabela (20260509123749:27, 20260728161227:69) nem a reconciliação
-- de colunas (20260825100000:3895). Num banco vazio a tabela nasce sem a coluna e o
-- CREATE INDEX abaixo aborta o replay com "column empresa_id does not exist", que é
-- como o defeito apareceu. A FK também ficou de fora da cadeia: o replay criava
-- coluna e índice, mas não a constraint, e aceitava empresa_id apontando para
-- empresa inexistente — o oposto do canônico, que rejeita.
--
-- Versionar coluna, FK e índice, na ordem que a FK exige, mantém o replay fiel ao
-- banco real. Em produção os três objetos existem, nenhum DDL é executado (os
-- guards são por catálogo, não por IF NOT EXISTS) e a migration não toca na tabela.
--
-- ON DELETE NO ACTION é o default do Postgres para FK criada sem cláusula, e é o
-- padrão das colunas adicionadas direto em produção fora da cadeia — ver as 17
-- definições de 20261116220000:115-131 (10 delas NO ACTION).
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
         || 'FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE NO ACTION';
  END IF;

  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_kpis_operacionais_empresa_id_fk '
       || 'ON public.kpis_operacionais USING btree (empresa_id)';
END
$reconcile$;

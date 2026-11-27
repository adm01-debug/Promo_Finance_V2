-- Remove as duas policies legadas de relatorios_tributarios_agendados que davam
-- acesso a QUALQUER empresa apenas por `profiles.role`:
--
-- * `relatorios_tributarios_agendados_all_admin` (criada em
--   20260825230000_initplan_rls_e67.sql:715) e PERMISSIVE FOR ALL, entao um admin
--   podia gravar agendamento de empresa a que nao esta vinculado, com
--   destinatarios arbitrarios; o cron envia o PDF daquela empresa por e-mail.
-- * `relatorios_tributarios_agendados_select_own` (mesma migracao, linha 720) tem
--   o mesmo `OR` sem escopo na leitura, entao o admin lia agendamentos (e os
--   e-mails de destinatarios) de todas as empresas.
--
-- Por que DROP e nao recriar com escopo: o vinculo usado era `profiles.empresa_id`,
-- que sobrevive a revogacao do acesso em `user_empresas`. Escopar por ele ainda
-- deixaria um admin sem vinculo ativo gravar agendamento da empresa antiga e
-- redirecionar o relatorio fiscal dela. As quatro policies restantes de
-- `rel_trib_agend_*` ja checam `empresa_acessivel(empresa_id)` (vinculo ativo em
-- `user_empresas`) e cobrem SELECT/INSERT/UPDATE/DELETE — nada se perde para quem
-- tem vinculo, e a revogacao passa a cortar o acesso na hora.
DROP POLICY IF EXISTS relatorios_tributarios_agendados_all_admin ON public.relatorios_tributarios_agendados;
DROP POLICY IF EXISTS relatorios_tributarios_agendados_select_own ON public.relatorios_tributarios_agendados;

DO $verificacao$
DECLARE
  _nome text;
  _stmt text;
  _restantes int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'relatorios_tributarios_agendados'
  ) THEN
    RAISE EXCEPTION 'relatorios_tributarios_agendados ficou sem nenhuma policy';
  END IF;

  -- Se alguma vier de volta sem empresa_id, a policy vale para qualquer empresa
  -- (permissivas se somam por OR) e o furo reabre em silencio.
  FOR _nome, _stmt IN
    SELECT policyname, coalesce(qual, '') || ' ' || coalesce(with_check, '')
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'relatorios_tributarios_agendados'
  LOOP
    IF _stmt NOT LIKE '%empresa_id%' THEN
      RAISE EXCEPTION 'policy % ficou sem escopo de empresa: %', _nome, _stmt;
    END IF;
  END LOOP;

  SELECT count(*) INTO _restantes
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'relatorios_tributarios_agendados';
  RAISE NOTICE 'relatorios_tributarios_agendados: % policies, todas com escopo de empresa', _restantes;
END
$verificacao$;

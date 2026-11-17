-- Remove 20 tabelas-resíduo da importação do Lovable (commit 3ce83bb71, 30/07/2026).
--
-- Contexto verificado em 17/11/2026 no projeto canônico bwwbeyolnnzppeuhgkcd:
--   * nenhuma das 20 existe em produção (0 linhas em pg_class, em qualquer schema);
--   * as 16 migrations que as criam constam como aplicadas no ledger, logo a remoção
--     aconteceu fora do histórico de migrations — o repositório ficou em drift;
--   * nenhuma é consultada pelo app ou por Edge Function (a única menção textual é
--     src/lib/audit-priority.ts:42, um nome dentro de um Set de prioridade, sem acesso
--     à tabela);
--   * new_device_alerts sobrevive em produção sem a FK para known_devices, e as colunas
--     contato_id / contato_financeiro_id também não existem — mais evidência de que o
--     recorte atual de produção é o estado desejado.
--
-- Efeito em produção: nenhum (DROP ... IF EXISTS sobre relação ausente é no-op).
-- Efeito no replay do schema a partir do zero (scripts/db/replay-migrations.sh): deixa
-- de materializar 20 tabelas fantasma, aproximando o replay do schema real.
--
-- CASCADE porque as próprias migrations criam policies, índices, triggers e FKs sobre
-- elas; a única FK vinda de fora do conjunto é new_device_alerts.device_id ->
-- known_devices(id), cuja remoção é justamente o estado de produção.

DROP TABLE IF EXISTS public.account_lockouts CASCADE;
DROP TABLE IF EXISTS public.asaas_scheduled_transfers CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.auditoria_configuracoes CASCADE;
DROP TABLE IF EXISTS public.boleto_events CASCADE;
DROP TABLE IF EXISTS public.cnpja_rate_limit CASCADE;
DROP TABLE IF EXISTS public.conciliacao_sugestoes CASCADE;
DROP TABLE IF EXISTS public.configuracoes_receber CASCADE;
DROP TABLE IF EXISTS public.contatos_financeiros CASCADE;
DROP TABLE IF EXISTS public.elisao_analise_gap CASCADE;
DROP TABLE IF EXISTS public.entity_versions CASCADE;
DROP TABLE IF EXISTS public.known_devices CASCADE;
DROP TABLE IF EXISTS public.lalur_lancamentos CASCADE;
DROP TABLE IF EXISTS public.obrigacoes_acessorias CASCADE;
DROP TABLE IF EXISTS public.ponto_departamentos CASCADE;
DROP TABLE IF EXISTS public.ponto_funcionarios CASCADE;
DROP TABLE IF EXISTS public.ponto_registros CASCADE;
DROP TABLE IF EXISTS public.ponto_sync_log CASCADE;
DROP TABLE IF EXISTS public.registro_duplicidade CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;

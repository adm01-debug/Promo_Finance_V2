-- SECURITY FIX: RPCs SECURITY DEFINER sem escopo de tenant.
--
-- 1) fn_verificar_vencidos(): atualiza status de TODAS as contas_pagar/
--    contas_receber de TODAS as empresas de uma vez (job de manutenção,
--    pensado para rodar via pg_cron). Nunca aparece em src/ nem
--    supabase/functions/ — não é chamada legítima pelo app. Foi varrida
--    pelo GRANT EXECUTE genérico de 20260531123952/20260619150721 (que
--    concede a "authenticated" para toda função SECURITY DEFINER em
--    public) e nunca voltou a ser revogada especificamente. Qualquer
--    usuário autenticado podia forçar essa rotina de manutenção global
--    fora de hora. Revoga de PUBLIC/anon/authenticated — pg_cron roda
--    como role de sistema, não depende de GRANT para authenticated.
--
-- 2) confirmar_conciliacao(uuid,uuid,uuid,uuid,uuid,numeric): versão
--    legada, sem NENHUMA checagem de empresa_id/posse — atualiza
--    conciliacoes/transacoes_bancarias/contas_pagar/contas_receber por ID
--    cru e aceita p_user_id arbitrário (spoofing de autor). Já revogada de
--    authenticated (20260826050000), mas este mesmo repositório já rodou
--    duas vezes um sweep genérico "GRANT EXECUTE a authenticated para toda
--    função SECURITY DEFINER" (20260531123952, 20260619150721) — se
--    rodar de novo, a função volta a ficar exposta. A versão corrigida
--    confirmar_conciliacao_manual (que valida user_empresas) já cobre o
--    mesmo caso de uso. Nunca chamada por src/ ou supabase/functions/
--    (só aparece em types.ts, gerado). DROP em vez de depender de REVOKE.
--
-- 3) processar_regua_cobranca(p_empresa_id, p_simulate): quando
--    p_empresa_id é NULL (default), a condição interna
--    "empresa_id = COALESCE(p_empresa_id, empresa_id)" vira uma
--    tautologia e conta títulos pendentes de TODAS as empresas; quando
--    p_empresa_id é informado, não há checagem de empresa_acessivel(),
--    então qualquer authenticated pode sondar a contagem de contas a
--    receber pendentes de qualquer empresa alheia. src/hooks/
--    useReguaCobranca.ts chama esta RPC diretamente da sessão do
--    usuário comum — corrige a função para exigir p_empresa_id +
--    empresa_acessivel() em vez de só restringir GRANT (que uma
--    migration anterior já tentou e conflita com o uso real do
--    frontend).

BEGIN;

DROP FUNCTION IF EXISTS public.confirmar_conciliacao(uuid, uuid, uuid, uuid, uuid, numeric);

REVOKE ALL ON FUNCTION public.fn_verificar_vencidos() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.processar_regua_cobranca(p_empresa_id uuid DEFAULT NULL::uuid, p_simulate boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
    result JSONB;
BEGIN
    IF p_empresa_id IS NULL OR NOT public.empresa_acessivel(p_empresa_id) THEN
        RAISE EXCEPTION 'Sem permissão para esta empresa' USING ERRCODE = '42501';
    END IF;

    -- Simulação de processamento (em produção aqui rodaria a lógica de gatilhos)
    IF p_simulate THEN
        result := jsonb_build_object(
            'total_enfileirados', (SELECT count(*) FROM public.contas_receber WHERE status = 'pendente' AND empresa_id = p_empresa_id),
            'message', 'Simulação concluída com base nos títulos pendentes.'
        );
    ELSE
        result := jsonb_build_object(
            'total_enfileirados', 0,
            'message', 'Lógica de produção: disparos agendados.'
        );
    END IF;
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.processar_regua_cobranca(uuid, boolean) TO authenticated;

COMMIT;

INSERT INTO supabase_migrations.schema_migrations(version,name)
VALUES('20260902170000','fix_rpcs_security_definer_sem_escopo')
ON CONFLICT (version) DO NOTHING;

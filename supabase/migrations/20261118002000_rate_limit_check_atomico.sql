-- Torna o rate limit compartilhado atômico, sem mudar o comportamento.
--
-- Sintoma. `supabase/functions/_shared/rate-limit.ts` fazia duas requisições
-- separadas: primeiro `select count(*)` das linhas da janela, depois o
-- `insert` da linha desta chamada. Entre as duas não há serialização, então N
-- chamadas simultâneas leem o mesmo total e todas passam — o limite é furado
-- por até N-1 requisições. Afeta as 17 Edge Functions que usam o helper,
-- incluindo os webhooks `asaas-webhook`, `bling-webhook`, `bitrix24-webhook`,
-- `whatsapp-webhook` e as funções de IA (`expert-agent`, `conciliacao-ia`,
-- `analise-preditiva`, `copilot-global` e outras), onde cada chamada extra é
-- custo de provedor externo. Apontado por Devin (🔴) e Codex (P2) na #438.
--
-- Por que não dá para resolver só no TypeScript. Mesmo juntando as duas
-- operações numa transação, o `count(*)` não vê os inserts ainda não
-- confirmados das transações concorrentes (MVCC). Serializar exige lock.
--
-- Solução. Uma função que faz contagem e registro sob
-- `pg_advisory_xact_lock` com chave derivada de (endpoint, ip): chamadas do
-- MESMO endpoint e MESMO IP passam uma a uma; endpoints ou IPs diferentes não
-- disputam nada. O lock é de transação e o PostgREST executa cada RPC na sua
-- própria transação, então a liberação é automática — não há lock vazado.
--
-- O que NÃO muda: a janela continua deslizante de `_window_seconds`
-- (`created_at >= now() - _window_seconds`), a contagem continua por
-- (endpoint, ip), a tabela `rate_limit_logs` continua recebendo uma linha por
-- requisição com `blocked`, `window_start`, `window_end` e `user_agent`, e o
-- retorno continua sendo "permitido" mais a contagem. Nenhuma das 17 funções
-- muda de regra; só deixa de furar sob concorrência.
--
-- Permissão: SECURITY DEFINER com `search_path` fixo, EXECUTE só para
-- `service_role`. Conferido antes: as 17 chamadas usam cliente de service
-- role (`serviceClient()`, `createClient(..., SERVICE_ROLE_KEY)` ou
-- equivalente), nenhuma usa cliente de usuário.

CREATE OR REPLACE FUNCTION public.rate_limit_check(
  _endpoint text,
  _ip inet,
  _limit integer,
  _window_seconds integer DEFAULT 60,
  _user_agent text DEFAULT NULL
)
RETURNS TABLE(permitido boolean, contagem integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_since timestamptz;
  v_agora timestamptz := now();
  v_total integer;
  v_permitido boolean;
BEGIN
  IF _endpoint IS NULL OR _ip IS NULL OR _limit IS NULL THEN
    RAISE EXCEPTION 'rate_limit_check: _endpoint, _ip e _limit sao obrigatorios';
  END IF;

  v_since := v_agora - make_interval(secs => GREATEST(COALESCE(_window_seconds, 60), 1));

  -- Serializa apenas as chamadas do mesmo par (endpoint, ip).
  PERFORM pg_advisory_xact_lock(hashtextextended(_endpoint || '|' || host(_ip), 0));

  SELECT count(*) INTO v_total
  FROM public.rate_limit_logs
  WHERE endpoint = _endpoint
    AND ip_address = _ip
    AND created_at >= v_since;

  v_total := v_total + 1;
  v_permitido := v_total <= _limit;

  INSERT INTO public.rate_limit_logs
    (endpoint, ip_address, user_agent, blocked, request_count, window_start, window_end)
  VALUES
    (_endpoint, _ip, _user_agent, NOT v_permitido, 1, v_since, v_agora);

  RETURN QUERY SELECT v_permitido, v_total;
END;
$$;

-- `REVOKE ... FROM PUBLIC` não basta: os default privileges do schema `public`
-- concedem EXECUTE a `authenticated` diretamente (conferido em produção:
-- has_function_privilege('authenticated', ...) = true logo após a criação).
-- Revoga por nome, senão um usuário logado poderia chamar a função direto e
-- consumir a cota de outro IP/endpoint ou poluir o log.
REVOKE ALL ON FUNCTION public.rate_limit_check(text, inet, integer, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rate_limit_check(text, inet, integer, integer, text) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rate_limit_check(text, inet, integer, integer, text) TO service_role;

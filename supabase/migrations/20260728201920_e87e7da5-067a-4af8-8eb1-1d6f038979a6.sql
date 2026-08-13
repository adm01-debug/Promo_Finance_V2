-- GAP #31 — is_org_membro / is_org_responsavel eram oráculos de enumeração.
-- Ambas são SECURITY DEFINER com EXECUTE para `authenticated` (necessário: são
-- avaliadas dentro de policies RLS, que rodam com os privilégios do chamador),
-- e aceitavam _user_id arbitrário. Um usuário logado podia iterar (org, user)
-- e mapear a composição de TODAS as organizações — vazamento de grafo social
-- entre inquilinos, mesmo com RLS correta nas tabelas.
--
-- Todos os usos em policies passam (SELECT auth.uid()), então restringir a
-- resposta ao próprio chamador é transparente para o runtime.

CREATE OR REPLACE FUNCTION public.is_org_membro(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT
    CASE
      -- contexto de backend (service_role / jobs): auth.uid() é NULL
      WHEN (SELECT auth.uid()) IS NULL THEN TRUE
      WHEN _user_id = (SELECT auth.uid()) THEN TRUE
      WHEN public.has_role((SELECT auth.uid()), 'admin'::public.app_role) THEN TRUE
      ELSE FALSE
    END
    AND EXISTS (
      SELECT 1 FROM public.organizacao_membros
      WHERE organizacao_id = _org_id AND usuario_id = _user_id AND ativo
    );
$function$;

CREATE OR REPLACE FUNCTION public.is_org_responsavel(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT
    CASE
      WHEN (SELECT auth.uid()) IS NULL THEN TRUE
      WHEN _user_id = (SELECT auth.uid()) THEN TRUE
      WHEN public.has_role((SELECT auth.uid()), 'admin'::public.app_role) THEN TRUE
      ELSE FALSE
    END
    AND EXISTS (
      SELECT 1 FROM public.organizacoes
      WHERE id = _org_id AND responsavel_id = _user_id
    );
$function$;

REVOKE ALL ON FUNCTION public.is_org_membro(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_org_responsavel(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_org_membro(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_responsavel(uuid, uuid) TO authenticated, service_role;
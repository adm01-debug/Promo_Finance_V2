-- ============================================================================
-- Gap #29 — Isolamento no CAMINHO DE ESCRITA (tabela public.clientes)
-- ----------------------------------------------------------------------------
-- Os gates anteriores cobriam leitura. A simulação de escrita encontrou três
-- brechas reais, todas exploráveis por um usuário `authenticated` legítimo:
--
--  (1) clientes_grupo_update.WITH CHECK aceitava `empresa_id IS NULL`, embora o
--      USING exija `empresa_id IS NOT NULL`. Ou seja: o usuário podia LER a
--      linha, gravá-la com empresa_id = NULL e ela deixava de ser visível para
--      qualquer política — órfã, irrecuperável pela UI. Perda de dado silenciosa.
--  (2) clientes_owner_insert só checava `user_id = auth.uid()`: o usuário podia
--      inserir um cliente carimbado com o empresa_id de OUTRO inquilino, que
--      passaria a aparecer no grupo daquele inquilino (injeção cross-tenant).
--  (3) clientes_owner_update tinha o mesmo furo no UPDATE: bastava reapontar
--      empresa_id para exfiltrar/plantar o registro em outro inquilino.
--
-- Correção: toda escrita passa a exigir que o empresa_id gravado pertença a uma
-- empresa em que o autor é membro ATIVO. O WITH CHECK nunca pode ser mais
-- permissivo que o USING correspondente.
-- ============================================================================

-- Predicado único, estável e indexável — evita divergência entre as políticas.
CREATE OR REPLACE FUNCTION public.empresa_membro_ativo(_empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _empresa_id IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM public.user_empresas ue
       WHERE ue.empresa_id = _empresa_id
         AND ue.user_id = (SELECT auth.uid())
         AND ue.ativo = true
     );
$$;

REVOKE ALL ON FUNCTION public.empresa_membro_ativo(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empresa_membro_ativo(uuid) TO authenticated, service_role;

-- (1) UPDATE de grupo: o destino precisa continuar dentro do inquilino.
DROP POLICY IF EXISTS clientes_grupo_update ON public.clientes;
CREATE POLICY clientes_grupo_update ON public.clientes
  FOR UPDATE TO authenticated
  USING (public.empresa_membro_ativo(empresa_id))
  WITH CHECK (public.empresa_membro_ativo(empresa_id));

-- (2) INSERT do dono: empresa_id nulo (rascunho pessoal) ou empresa própria.
DROP POLICY IF EXISTS clientes_owner_insert ON public.clientes;
CREATE POLICY clientes_owner_insert ON public.clientes
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (empresa_id IS NULL OR public.empresa_membro_ativo(empresa_id))
  );

-- (3) UPDATE do dono: idem, impede reapontar para inquilino de terceiros.
DROP POLICY IF EXISTS clientes_owner_update ON public.clientes;
CREATE POLICY clientes_owner_update ON public.clientes
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (empresa_id IS NULL OR public.empresa_membro_ativo(empresa_id))
  );
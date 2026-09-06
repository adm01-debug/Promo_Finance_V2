-- SECURITY FIX: policy órfã em darfs sobrevivendo a QUATRO rodadas de fix
-- cross-tenant (PR #54, #55, #56 e a própria 20260902270000 que já limpou
-- as outras duas policies órfãs desta mesma tabela) porque nunca foi
-- dropada pelo nome — apenas as policies "Admins can manage darfs" e
-- "DARFs scoped by linked empresa" foram removidas em 20260902270000.
--
-- "Users can manage their own darfs" (20260518190951): FOR ALL TO
-- authenticated USING(true) WITH CHECK(true) — tautologia total, pior que
-- as duas já corrigidas (que ao menos exigiam has_role(admin)). RLS
-- PERMISSIVE combina via OR: sozinha, reabre CRUD completo em DARFs de
-- TODAS as empresas para QUALQUER usuário autenticado, mesmo sem nenhum
-- papel ou vínculo com a empresa dona do DARF.
--
-- Cobertura já existe via "Financeiro+ podem ver darfs" + "darfs_tenant_rw"
-- (ambas AND empresa_acessivel(empresa_id), criadas em 20260902240000) —
-- o DROP aqui não reduz funcionalidade, só fecha o bypass.

BEGIN;

DROP POLICY IF EXISTS "Users can manage their own darfs" ON public.darfs;

COMMIT;

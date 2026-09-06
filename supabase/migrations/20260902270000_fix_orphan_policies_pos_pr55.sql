-- SECURITY FIX: policies órfãs que sobreviveram a TRÊS rodadas de fix
-- (PR #54, PR #55, migrations 20260902130000..260000) porque nenhuma
-- delas jamais foi DROPada pelo nome antigo — só recriada por nome
-- novo. RLS PERMISSIVE combina via OR: a policy órfã, mesmo sem
-- relação com o fix mais recente, sozinha reabre o acesso cross-tenant
-- que a policy nova fechou. Achado de auditoria adversarial (5 agentes
-- coordenados, 2026-09-02, pós-merge do PR #55), cada item confirmado
-- por leitura direta do arquivo de origem antes de entrar aqui.
--
-- Todas as tabelas abaixo já têm cobertura completa (SELECT/INSERT/
-- UPDATE/DELETE) via policies corretamente escopadas por
-- empresa_acessivel()/has_any_role() criadas nas migrations de
-- 2026-09-02 — o DROP aqui não reduz funcionalidade, só fecha o bypass.

BEGIN;

-- ============ historico_conciliacao_ia ============
-- historico_conciliacao_ia_role_select: has_role(admin) OR has_role(financeiro),
-- ZERO escopo de empresa — qualquer financeiro/admin de QUALQUER empresa
-- lia o histórico de conciliação de TODAS as empresas.
DROP POLICY IF EXISTS historico_conciliacao_ia_role_select ON public.historico_conciliacao_ia;

-- historico_conciliacao_ia_tenant_select: escopa via 3 branches OR
-- (conta_receber / conta_pagar / sessao) sem amarrar ao tipo_lancamento
-- do registro — o mesmo bug que 20260902260000 corrigiu na policy
-- "Financeiro+ podem ver historico_conciliacao_ia", mas esta órfã nunca
-- foi tocada, reabrindo o bypass sozinha via OR.
DROP POLICY IF EXISTS historico_conciliacao_ia_tenant_select ON public.historico_conciliacao_ia;

-- ============ lancamentos_contabeis ============
-- "Owner manage lancamentos": FOR ALL, USING(auth.uid() = user_id), sem
-- empresa_acessivel — usuário mantém acesso aos próprios lançamentos
-- antigos mesmo após ser desvinculado da empresa (user_empresas.ativo=false).
-- Substituída por "Lancamentos scoped by empresa" (20260902240000), que já
-- inclui user_id=auth.uid() como uma das condições, agora AND-ada a
-- empresa_acessivel(empresa_id).
DROP POLICY IF EXISTS "Owner manage lancamentos" ON public.lancamentos_contabeis;

-- ============ darfs ============
-- "Admins can manage darfs": FOR ALL, has_role(admin) sozinho, sem
-- empresa_acessivel — qualquer admin (de qualquer empresa) lia/gravava/
-- apagava DARFs de todas as empresas.
DROP POLICY IF EXISTS "Admins can manage darfs" ON public.darfs;

-- "DARFs scoped by linked empresa": branch has_role(admin) não é AND-ado
-- ao escopo de empresa (só OR com os branches de empresa_id/alerta_id) —
-- mesma classe de bug do item acima. Substituída por
-- "Financeiro+ podem ver darfs" + "darfs_tenant_rw" (ambas AND empresa_acessivel).
DROP POLICY IF EXISTS "DARFs scoped by linked empresa" ON public.darfs;

-- ============ per_dcomp ============
-- per_dcomp_admin_all: FOR ALL, checa profiles.role IN ('admin','super_admin')
-- via subquery em profiles — ZERO escopo de empresa. Substituída por
-- "Financeiro+ podem ver/inserir/atualizar per_dcomp" + "Admin pode
-- deletar per_dcomp" (todas AND empresa_acessivel, criadas em 20260902240000).
DROP POLICY IF EXISTS per_dcomp_admin_all ON public.per_dcomp;

-- ============ pagamentos_recorrentes ============
-- pagamentos_recorrentes_acesso: FOR ALL, USING(empresa_acessivel(empresa_id))
-- sem checagem de role — qualquer usuário vinculado à empresa (mesmo sem
-- papel financeiro/operacional) podia gerenciar pagamentos recorrentes.
-- Substituída por policies nomeadas por operação e papel em 20260902210000/
-- 240000 (INSERT/SELECT/UPDATE/DELETE, todas com has_any_role + empresa_acessivel).
DROP POLICY IF EXISTS pagamentos_recorrentes_acesso ON public.pagamentos_recorrentes;

-- ============ asaas_audit_trail: referência de coluna quebrada ============
-- asaas_audit_tenant_select (20260728214221, recriada em 20260825230000)
-- referencia "asaas_audit_trail.asaas_payment_id" — coluna que NÃO existe
-- nesta tabela (a coluna real, definida em 20260508174109/20260518165422,
-- é "payment_id"). CREATE POLICY com referência de coluna inexistente
-- falha na aplicação — landmine de replay, não bug de acesso vivo.
-- Recria com o nome de coluna correto.
DROP POLICY IF EXISTS asaas_audit_tenant_select ON public.asaas_audit_trail;
CREATE POLICY asaas_audit_tenant_select ON public.asaas_audit_trail
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.asaas_payments p
      WHERE p.id = asaas_audit_trail.payment_id
        AND public.empresa_acessivel(p.empresa_id)
    )
  );

-- ============ bucket notas-fiscais-upload: bypass admin sem escopo ============
-- Policies de SELECT/DELETE liberavam para "auth.uid() = dono da pasta
-- OR has_role(admin)" — o branch admin não verifica vínculo com a
-- empresa dona do arquivo (o path é particionado por uid, não por
-- empresa_id, então não há como amarrar via empresa_acessivel aqui).
-- Confirmado código morto (zero referência em src/ ou supabase/functions/,
-- só em docs/planejamento) — fix mínimo é remover o bypass, mantendo só
-- acesso ao próprio dono, em vez de reescrever o particionamento do bucket.
DROP POLICY IF EXISTS "Usuários autenticados leem suas NFs" ON storage.objects;
CREATE POLICY "Usuários autenticados leem suas NFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'notas-fiscais-upload' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Usuários deletam suas NFs" ON storage.objects;
CREATE POLICY "Usuários deletam suas NFs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'notas-fiscais-upload' AND auth.uid()::text = (storage.foldername(name))[1]);

COMMIT;

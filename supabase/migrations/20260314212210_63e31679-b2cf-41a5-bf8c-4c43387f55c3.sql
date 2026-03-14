-- Auditoria final: endurecer RLS em tabelas restantes

-- 1) clientes: leitura apenas por operacional+
DROP POLICY IF EXISTS "Authenticated users can view clientes" ON public.clientes;
CREATE POLICY "Operacional+ podem ver clientes"
ON public.clientes FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 2) boletos: leitura apenas por operacional+
DROP POLICY IF EXISTS "Authenticated users can view boletos" ON public.boletos;
CREATE POLICY "Operacional+ podem ver boletos"
ON public.boletos FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 3) fornecedores: leitura apenas por operacional+
DROP POLICY IF EXISTS "Authenticated users can view fornecedores" ON public.fornecedores;
CREATE POLICY "Operacional+ podem ver fornecedores"
ON public.fornecedores FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 4) acordos_parcelamento: leitura restrita a financeiro/admin
DROP POLICY IF EXISTS "Usuários autenticados podem ver acordos" ON public.acordos_parcelamento;
CREATE POLICY "Financeiro+ podem ver acordos"
ON public.acordos_parcelamento FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 5) notas_fiscais: leitura apenas por operacional+
DROP POLICY IF EXISTS "Authenticated users can view notas_fiscais" ON public.notas_fiscais;
CREATE POLICY "Operacional+ podem ver notas fiscais"
ON public.notas_fiscais FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

-- 6) configuracoes_aprovacao: leitura apenas por autenticados (era {public})
DROP POLICY IF EXISTS "Authenticated users can view configuracoes_aprovacao" ON public.configuracoes_aprovacao;
CREATE POLICY "Autenticados podem ver configuracoes_aprovacao"
ON public.configuracoes_aprovacao FOR SELECT TO authenticated
USING (true);

-- 7) regras_conciliacao: escrita restrita a financeiro/admin
DROP POLICY IF EXISTS "Authenticated users can insert regras_conciliacao" ON public.regras_conciliacao;
DROP POLICY IF EXISTS "Authenticated users can update regras_conciliacao" ON public.regras_conciliacao;

CREATE POLICY "Financeiro+ podem inserir regras_conciliacao"
ON public.regras_conciliacao FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

CREATE POLICY "Financeiro+ podem atualizar regras_conciliacao"
ON public.regras_conciliacao FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 8) alertas_preditivos: inserção e update restritos
DROP POLICY IF EXISTS "Sistema pode inserir alertas preditivos" ON public.alertas_preditivos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus alertas" ON public.alertas_preditivos;

CREATE POLICY "Inserir alertas preditivos restrito"
ON public.alertas_preditivos FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR (user_id IS NULL AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
);

CREATE POLICY "Atualizar alertas preditivos restrito"
ON public.alertas_preditivos FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR (user_id IS NULL AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
)
WITH CHECK (
  user_id = auth.uid()
  OR (user_id IS NULL AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
);

-- 9) recomendacoes_metas_ia: update restrito
DROP POLICY IF EXISTS "Usuários podem atualizar recomendações" ON public.recomendacoes_metas_ia;

CREATE POLICY "Financeiro+ podem atualizar recomendações"
ON public.recomendacoes_metas_ia FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 10) historico_cobranca_whatsapp: inserção e update restritos a financeiro/admin
DROP POLICY IF EXISTS "Usuários podem inserir histórico de cobrança" ON public.historico_cobranca_whatsapp;
DROP POLICY IF EXISTS "Usuários podem atualizar histórico de cobrança" ON public.historico_cobranca_whatsapp;

CREATE POLICY "Financeiro+ podem inserir historico cobranca whatsapp"
ON public.historico_cobranca_whatsapp FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

CREATE POLICY "Financeiro+ podem atualizar historico cobranca whatsapp"
ON public.historico_cobranca_whatsapp FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));
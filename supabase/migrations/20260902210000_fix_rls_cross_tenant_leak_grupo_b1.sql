-- SECURITY FIX (Grupo B1 — varredura exaustiva): 49 policies RLS soltas em
-- 26 tabelas SEM policy irmã escopada. Diferente dos grupos A/C, aqui não
-- existe nenhuma policy alternativa cobrindo empresa_id para o mesmo
-- comando — em vez de DROP (que zeraria acesso legítimo), cada policy é
-- reescrita preservando a lógica de role original + adicionando
-- empresa_acessivel(empresa_id)/empresa_membro_ativo(empresa_id).
--
-- Nota: policies FOR DELETE não aceitam cláusula WITH CHECK em Postgres
-- (é rejeitado pelo parser) — para DELETE apenas USING é reescrito.

BEGIN;

-- alertas (1)
DROP POLICY IF EXISTS "Users can view own or privileged system alertas" ON public.alertas;
CREATE POLICY "Users can view own or privileged system alertas" ON public.alertas AS PERMISSIVE FOR SELECT TO authenticated
  USING ((
    auth.uid() = user_id
    OR (
      user_id IS NULL
      AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
    )
  ) AND empresa_acessivel(empresa_id));

-- alertas_preditivos (2)
DROP POLICY IF EXISTS "Inserir alertas preditivos restrito" ON public.alertas_preditivos;
CREATE POLICY "Inserir alertas preditivos restrito" ON public.alertas_preditivos AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((
    user_id = auth.uid()
    OR (user_id IS NULL AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
  ) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Atualizar alertas preditivos restrito" ON public.alertas_preditivos;
CREATE POLICY "Atualizar alertas preditivos restrito" ON public.alertas_preditivos AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((
    user_id = auth.uid()
    OR (user_id IS NULL AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
  ) AND empresa_acessivel(empresa_id))
  WITH CHECK ((
    user_id = auth.uid()
    OR (user_id IS NULL AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
  ) AND empresa_acessivel(empresa_id));

-- bitrix_field_mappings (1)
DROP POLICY IF EXISTS "Admin can manage field mappings" ON public.bitrix_field_mappings;
CREATE POLICY "Admin can manage field mappings" ON public.bitrix_field_mappings AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id));

-- bitrix_sync_logs (1)
DROP POLICY IF EXISTS "Financeiro+ can insert sync logs" ON public.bitrix_sync_logs;
CREATE POLICY "Financeiro+ can insert sync logs" ON public.bitrix_sync_logs AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id));

-- boletos (3)
DROP POLICY IF EXISTS "Operacional+ can insert boletos" ON public.boletos;
CREATE POLICY "Operacional+ can insert boletos" ON public.boletos AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Financeiro+ can update boletos" ON public.boletos;
CREATE POLICY "Financeiro+ can update boletos" ON public.boletos AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Admin can delete boletos" ON public.boletos;
CREATE POLICY "Admin can delete boletos" ON public.boletos AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id));

-- clientes (1)
DROP POLICY IF EXISTS "Operacional+ can manage clientes" ON public.clientes;
CREATE POLICY "Operacional+ can manage clientes" ON public.clientes AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_membro_ativo(empresa_id))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_membro_ativo(empresa_id));

-- conciliacoes (2)
DROP POLICY IF EXISTS "Fin users can read conciliacoes" ON public.conciliacoes;
CREATE POLICY "Fin users can read conciliacoes" ON public.conciliacoes AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Fin users can manage conciliacoes" ON public.conciliacoes;
CREATE POLICY "Fin users can manage conciliacoes" ON public.conciliacoes AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id));

-- contas_bancarias (1)
DROP POLICY IF EXISTS "Financeiro+ can manage contas" ON public.contas_bancarias;
CREATE POLICY "Financeiro+ can manage contas" ON public.contas_bancarias AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]) AND empresa_acessivel(empresa_id))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]) AND empresa_acessivel(empresa_id));

-- contatos_financeiros (2)
DROP POLICY IF EXISTS "Fin users can manage contatos_financeiros" ON public.contatos_financeiros;
CREATE POLICY "Fin users can manage contatos_financeiros" ON public.contatos_financeiros AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Admin/financeiro can read contatos_financeiros" ON public.contatos_financeiros;
CREATE POLICY "Admin/financeiro can read contatos_financeiros" ON public.contatos_financeiros AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]) AND empresa_acessivel(empresa_id));

-- eventos_contabilizacao_log (1)
DROP POLICY IF EXISTS "eventos_contab_insert" ON public.eventos_contabilizacao_log;
CREATE POLICY "eventos_contab_insert" ON public.eventos_contabilizacao_log AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'financeiro'::app_role]) AND empresa_acessivel(empresa_id));

-- extrato_bancario (2)
DROP POLICY IF EXISTS "Fin users can read extrato_bancario" ON public.extrato_bancario;
CREATE POLICY "Fin users can read extrato_bancario" ON public.extrato_bancario AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Fin users can manage extrato_bancario" ON public.extrato_bancario;
CREATE POLICY "Fin users can manage extrato_bancario" ON public.extrato_bancario AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id));

-- fechamentos_tributarios (1)
DROP POLICY IF EXISTS "Apenas admin pode deletar fechamentos" ON public.fechamentos_tributarios;
CREATE POLICY "Apenas admin pode deletar fechamentos" ON public.fechamentos_tributarios AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND empresa_acessivel(empresa_id));

-- fornecedores (2)
DROP POLICY IF EXISTS "Operacional+ can manage fornecedores" ON public.fornecedores;
CREATE POLICY "Operacional+ can manage fornecedores" ON public.fornecedores AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_acessivel(empresa_id))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Operacional+ podem ver fornecedores" ON public.fornecedores;
CREATE POLICY "Operacional+ podem ver fornecedores" ON public.fornecedores AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]) AND empresa_acessivel(empresa_id));

-- health_scores_operacionais (1)
DROP POLICY IF EXISTS "Sistema insere health scores via service role" ON public.health_scores_operacionais;
CREATE POLICY "Sistema insere health scores via service role" ON public.health_scores_operacionais AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND empresa_acessivel(empresa_id));

-- historico_analises_preditivas (1)
DROP POLICY IF EXISTS "Usuários podem inserir próprias análises ou papel elevado" ON public.historico_analises_preditivas;
CREATE POLICY "Usuários podem inserir próprias análises ou papel elevado" ON public.historico_analises_preditivas AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((
    created_by = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
  ) AND empresa_acessivel(empresa_id));

-- historico_score_saude (1)
DROP POLICY IF EXISTS "Financeiro e admin podem inserir histórico de score" ON public.historico_score_saude;
CREATE POLICY "Financeiro e admin podem inserir histórico de score" ON public.historico_score_saude AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND empresa_acessivel(empresa_id));

-- notas_fiscais (1)
DROP POLICY IF EXISTS "Operacional+ can manage notas_fiscais" ON public.notas_fiscais;
CREATE POLICY "Operacional+ can manage notas_fiscais" ON public.notas_fiscais AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_membro_ativo(empresa_id))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_membro_ativo(empresa_id));

-- notas_fiscais_ocr (2)
DROP POLICY IF EXISTS "Usuários atualizam suas próprias NFs OCR" ON public.notas_fiscais_ocr;
CREATE POLICY "Usuários atualizam suas próprias NFs OCR" ON public.notas_fiscais_ocr AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = criado_por OR has_role(auth.uid(), 'admin')) AND empresa_acessivel(empresa_id))
  WITH CHECK ((auth.uid() = criado_por OR has_role(auth.uid(), 'admin')) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Admins deletam NFs OCR" ON public.notas_fiscais_ocr;
CREATE POLICY "Admins deletam NFs OCR" ON public.notas_fiscais_ocr AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND empresa_acessivel(empresa_id));

-- oportunidades_elisao (4)
DROP POLICY IF EXISTS "Authorized roles can view oportunidades elisao" ON public.oportunidades_elisao;
CREATE POLICY "Authorized roles can view oportunidades elisao" ON public.oportunidades_elisao AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Authorized roles can insert oportunidades elisao" ON public.oportunidades_elisao;
CREATE POLICY "Authorized roles can insert oportunidades elisao" ON public.oportunidades_elisao AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Admin/financeiro can update oportunidades elisao" ON public.oportunidades_elisao;
CREATE POLICY "Admin/financeiro can update oportunidades elisao" ON public.oportunidades_elisao AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Admin/financeiro can delete oportunidades elisao" ON public.oportunidades_elisao;
CREATE POLICY "Admin/financeiro can delete oportunidades elisao" ON public.oportunidades_elisao AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id));

-- pagamentos_recorrentes (3)
DROP POLICY IF EXISTS "Admins podem deletar pagamentos recorrentes" ON public.pagamentos_recorrentes;
CREATE POLICY "Admins podem deletar pagamentos recorrentes" ON public.pagamentos_recorrentes AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Operacional+ podem ver pagamentos_recorrentes" ON public.pagamentos_recorrentes;
CREATE POLICY "Operacional+ podem ver pagamentos_recorrentes" ON public.pagamentos_recorrentes AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Financeiro+ podem atualizar pagamentos_recorrentes" ON public.pagamentos_recorrentes;
CREATE POLICY "Financeiro+ podem atualizar pagamentos_recorrentes" ON public.pagamentos_recorrentes AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND empresa_acessivel(empresa_id))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND empresa_acessivel(empresa_id));

-- partidas_contabeis (4)
DROP POLICY IF EXISTS "partidas_select" ON public.partidas_contabeis;
CREATE POLICY "partidas_select" ON public.partidas_contabeis AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "partidas_insert" ON public.partidas_contabeis;
CREATE POLICY "partidas_insert" ON public.partidas_contabeis AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "partidas_update" ON public.partidas_contabeis;
CREATE POLICY "partidas_update" ON public.partidas_contabeis AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "partidas_delete" ON public.partidas_contabeis;
CREATE POLICY "partidas_delete" ON public.partidas_contabeis AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id));

-- portal_cliente_tokens (2)
DROP POLICY IF EXISTS "Financeiro e admin podem gerenciar tokens" ON public.portal_cliente_tokens;
CREATE POLICY "Financeiro e admin podem gerenciar tokens" ON public.portal_cliente_tokens AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND empresa_acessivel(empresa_id))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "portal_tokens_admin_all" ON public.portal_cliente_tokens;
CREATE POLICY "portal_tokens_admin_all" ON public.portal_cliente_tokens AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id));

-- recomendacoes_metas_ia (1)
DROP POLICY IF EXISTS "Financeiro+ podem atualizar recomendações" ON public.recomendacoes_metas_ia;
CREATE POLICY "Financeiro+ podem atualizar recomendações" ON public.recomendacoes_metas_ia AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND empresa_acessivel(empresa_id))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND empresa_acessivel(empresa_id));

-- regimes_simulados (2)
DROP POLICY IF EXISTS "Admin/financeiro can update regimes simulados" ON public.regimes_simulados;
CREATE POLICY "Admin/financeiro can update regimes simulados" ON public.regimes_simulados AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Admin/financeiro can delete regimes simulados" ON public.regimes_simulados;
CREATE POLICY "Admin/financeiro can delete regimes simulados" ON public.regimes_simulados AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id));

-- relatorios_agendados (4)
DROP POLICY IF EXISTS "Users can view own scheduled reports or elevated" ON public.relatorios_agendados;
CREATE POLICY "Users can view own scheduled reports or elevated" ON public.relatorios_agendados AS PERMISSIVE FOR SELECT TO authenticated
  USING ((
    created_by = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
  ) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Users can update own scheduled reports or elevated" ON public.relatorios_agendados;
CREATE POLICY "Users can update own scheduled reports or elevated" ON public.relatorios_agendados AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((
    created_by = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
  ) AND empresa_acessivel(empresa_id))
  WITH CHECK ((
    created_by = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
  ) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "Users can delete own scheduled reports or elevated" ON public.relatorios_agendados;
CREATE POLICY "Users can delete own scheduled reports or elevated" ON public.relatorios_agendados AS PERMISSIVE FOR DELETE TO authenticated
  USING ((
    created_by = auth.uid()
    OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
  ) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "relatorios_agendados_proprios" ON public.relatorios_agendados;
CREATE POLICY "relatorios_agendados_proprios" ON public.relatorios_agendados AS PERMISSIVE FOR ALL TO authenticated
  USING (((created_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) AND empresa_acessivel(empresa_id))
  WITH CHECK (((created_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) AND empresa_acessivel(empresa_id));

-- relatorios_tributarios_agendados (3)
DROP POLICY IF EXISTS "rel_trib_agend_admin_fin_insert" ON public.relatorios_tributarios_agendados;
CREATE POLICY "rel_trib_agend_admin_fin_insert" ON public.relatorios_tributarios_agendados AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  ) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "rel_trib_agend_admin_fin_update" ON public.relatorios_tributarios_agendados;
CREATE POLICY "rel_trib_agend_admin_fin_update" ON public.relatorios_tributarios_agendados AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  ) AND empresa_acessivel(empresa_id))
  WITH CHECK ((
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'financeiro')
  ) AND empresa_acessivel(empresa_id));

DROP POLICY IF EXISTS "rel_trib_agend_admin_delete" ON public.relatorios_tributarios_agendados;
CREATE POLICY "rel_trib_agend_admin_delete" ON public.relatorios_tributarios_agendados AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND empresa_acessivel(empresa_id));

COMMIT;

INSERT INTO supabase_migrations.schema_migrations(version,name)
VALUES('20260902210000','fix_rls_cross_tenant_leak_grupo_b1')
ON CONFLICT (version) DO NOTHING;

-- Step 16: 16 índices FK restantes em tabelas tributárias e auxiliares
CREATE INDEX IF NOT EXISTS idx_elisao_cred_aud_nota_fiscal ON public.elisao_creditos_auditoria(nota_fiscal_id);
CREATE INDEX IF NOT EXISTS idx_elisao_cred_aud_regra ON public.elisao_creditos_auditoria(regra_id);
CREATE INDEX IF NOT EXISTS idx_eventos_contab_regra ON public.eventos_contabilizacao_log(regra_id);
CREATE INDEX IF NOT EXISTS idx_fechamentos_trib_fechado_por ON public.fechamentos_tributarios(fechado_por);
CREATE INDEX IF NOT EXISTS idx_oportunidades_elisao_estrategia ON public.oportunidades_elisao(estrategia_id);
CREATE INDEX IF NOT EXISTS idx_partidas_contabeis_conta_contabil ON public.partidas_contabeis(conta_contabil_id);
CREATE INDEX IF NOT EXISTS idx_projecoes_reforma_empresa ON public.projecoes_reforma(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sso_sandbox_runs_provider ON public.sso_sandbox_runs(provider_id);
CREATE INDEX IF NOT EXISTS idx_sso_user_groups_provider ON public.sso_user_groups(provider_id);
CREATE INDEX IF NOT EXISTS idx_bloqueios_dup_transacao ON public.bloqueios_duplicidade(transacao_id);
CREATE INDEX IF NOT EXISTS idx_bloqueios_dup_usuario ON public.bloqueios_duplicidade(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sped_contabil_arquivos_empresa ON public.sped_contabil_arquivos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_kpis_operacionais_empresa ON public.kpis_operacionais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_per_dcomp_created_by ON public.per_dcomp(created_by);
CREATE INDEX IF NOT EXISTS idx_entregas_obrigacoes_registrado_por ON public.entregas_obrigacoes(registrado_por);
CREATE INDEX IF NOT EXISTS idx_saved_filters_created_by ON public.saved_filters(created_by);

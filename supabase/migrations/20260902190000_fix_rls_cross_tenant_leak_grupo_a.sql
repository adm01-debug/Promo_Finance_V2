-- SECURITY FIX (Grupo A — varredura exaustiva): 121 policies RLS soltas em
-- 59 tabelas, mesmo padrão sistêmico já corrigido em contas_pagar/
-- contas_receber/anomalias_detectadas/centros_custo/parcelas_acordo
-- (20260902130000-20260902150000): policy PERMISSIVE legada checando
-- apenas has_role(...)/has_any_role(...) SEM considerar empresa_id,
-- coexistindo via OR com uma ou mais policies irmãs já corretamente
-- escopadas (via empresa_acessivel(empresa_id) ou o sinônimo
-- empresa_membro_ativo(empresa_id)) cobrindo o MESMO comando na MESMA
-- tabela — a policy solta neutraliza o isolamento multi-tenant da irmã.
--
-- Cada tabela abaixo foi verificada individualmente (não em lote):
-- 1) a policy solta existe hoje, tal como nomeada, sem ter sido dropada
--    por nenhuma migration posterior à sua criação;
-- 2) para o MESMO comando (SELECT/INSERT/UPDATE/DELETE, ou todos os 4
--    quando a solta é FOR ALL), existe policy irmã vigente que já exige
--    empresa_acessivel()/empresa_membro_ativo() além do role adequado
--    (nenhum papel presente na policy solta fica sem cobertura na irmã).
-- Nenhuma tabela sensível de infraestrutura de autorização
-- (user_empresas, profiles, user_roles, sso_providers,
-- sso_login_attempts, scim_operations_log) está nesta lista — essas
-- não têm policy irmã escopada e exigem policy nova, tratadas à parte.
--
-- Também não incluídas aqui (tratamento à parte, ver migrations
-- seguintes): 10 policies onde a irmã escopada cobre só 'admin' mas a
-- solta também concede a 'financeiro' — dropar sem ampliar a irmã
-- primeiro seria regressão funcional, não só fechamento de brecha.

BEGIN;

-- acoes_recomendadas (2)
DROP POLICY IF EXISTS "Admin manage acoes_recomendadas" ON public.acoes_recomendadas;
DROP POLICY IF EXISTS "Admin/financeiro lê acoes_recomendadas" ON public.acoes_recomendadas;

-- acordos_parcelamento (4)
DROP POLICY IF EXISTS "Financeiro+ podem criar acordos" ON public.acordos_parcelamento;
DROP POLICY IF EXISTS "Financeiro+ podem atualizar acordos" ON public.acordos_parcelamento;
DROP POLICY IF EXISTS "Admin pode deletar acordos" ON public.acordos_parcelamento;
DROP POLICY IF EXISTS "Financeiro+ podem ver acordos" ON public.acordos_parcelamento;

-- alert_configurations (5)
DROP POLICY IF EXISTS "Admins can delete alert configs" ON public.alert_configurations;
DROP POLICY IF EXISTS "Admins managers can view alert configs" ON public.alert_configurations;
DROP POLICY IF EXISTS "Managers can insert alert configs" ON public.alert_configurations;
DROP POLICY IF EXISTS "Managers can update alert configs" ON public.alert_configurations;
DROP POLICY IF EXISTS "Viewers can view alert configs" ON public.alert_configurations;

-- alertas (2)
DROP POLICY IF EXISTS "Users can insert own or privileged system alertas" ON public.alertas;
DROP POLICY IF EXISTS "Users can update own or privileged system alertas" ON public.alertas;

-- alertas_preditivos (1)
DROP POLICY IF EXISTS "Usuários podem ver alertas preditivos com escopo" ON public.alertas_preditivos;

-- alertas_tributarios (4)
DROP POLICY IF EXISTS "Users can view own or elevated alertas_tributarios" ON public.alertas_tributarios;
DROP POLICY IF EXISTS "Users can insert own or elevated alertas_tributarios" ON public.alertas_tributarios;
DROP POLICY IF EXISTS "Users can update own or elevated alertas_tributarios" ON public.alertas_tributarios;
DROP POLICY IF EXISTS "Users can delete own or elevated alertas_tributarios" ON public.alertas_tributarios;

-- alerts (5)
DROP POLICY IF EXISTS "Authorized roles can view alerts" ON public.alerts;
DROP POLICY IF EXISTS "Managers can delete alerts" ON public.alerts;
DROP POLICY IF EXISTS "Operators can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Operators can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Viewers can view alerts" ON public.alerts;

-- apuracoes_tributarias (1)
DROP POLICY IF EXISTS "apuracoes_tributarias_admin_all" ON public.apuracoes_tributarias;

-- asaas_config (1)
DROP POLICY IF EXISTS "asaas_config_admin_all" ON public.asaas_config;

-- asaas_customers (2)
DROP POLICY IF EXISTS "Admins e financeiro podem ver clientes ASAAS" ON public.asaas_customers;
DROP POLICY IF EXISTS "asaas_customers_admin_all" ON public.asaas_customers;

-- asaas_payments (2)
DROP POLICY IF EXISTS "Admins e financeiro podem ver pagamentos ASAAS" ON public.asaas_payments;
DROP POLICY IF EXISTS "asaas_payments_admin_all" ON public.asaas_payments;

-- asaas_reconciliation_suggestions (1)
DROP POLICY IF EXISTS "asaas_recon_admin_all" ON public.asaas_reconciliation_suggestions;

-- asaas_transfers (1)
DROP POLICY IF EXISTS "asaas_transfers_admin_all" ON public.asaas_transfers;

-- auditoria_financeira (1)
DROP POLICY IF EXISTS "Admin can read auditoria_financeira" ON public.auditoria_financeira;

-- auditoria_tributaria (1)
DROP POLICY IF EXISTS "auditoria_trib_admin_select" ON public.auditoria_tributaria;

-- boletos (1)
DROP POLICY IF EXISTS "Operacional+ podem ver boletos" ON public.boletos;

-- categorias (1)
DROP POLICY IF EXISTS "Admin/fin can manage categorias" ON public.categorias;

-- clientes (1)
DROP POLICY IF EXISTS "Operacional+ podem ver clientes" ON public.clientes;

-- configuracoes_aprovacao (3)
DROP POLICY IF EXISTS "Admins can manage configuracoes_aprovacao" ON public.configuracoes_aprovacao;
DROP POLICY IF EXISTS "Admin financeiro can view configuracoes_aprovacao" ON public.configuracoes_aprovacao;
DROP POLICY IF EXISTS "configuracoes_aprovacao_admin_all" ON public.configuracoes_aprovacao;

-- configuracoes_duplicidade (1)
DROP POLICY IF EXISTS "config_dup_admin_all" ON public.configuracoes_duplicidade;

-- conformidade_snapshots (1)
DROP POLICY IF EXISTS "conformidade_snapshots_admin_all" ON public.conformidade_snapshots;

-- contas_bancarias (1)
DROP POLICY IF EXISTS "Financeiro+ podem ver contas_bancarias" ON public.contas_bancarias;

-- contratos (1)
DROP POLICY IF EXISTS "Financeiro+ podem ver contratos" ON public.contratos;

-- convites_contador (2)
DROP POLICY IF EXISTS "Usuario ve proprios convites" ON public.convites_contador;
DROP POLICY IF EXISTS "Usuario revoga proprio convite" ON public.convites_contador;

-- darfs (1)
DROP POLICY IF EXISTS "Admins can manage darfs" ON public.darfs;

-- empresas_certificados (1)
DROP POLICY IF EXISTS "cert_admin_all" ON public.empresas_certificados;

-- execucoes_cobranca (2)
DROP POLICY IF EXISTS "Fin users can read execucoes_cobranca" ON public.execucoes_cobranca;
DROP POLICY IF EXISTS "System can insert execucoes_cobranca" ON public.execucoes_cobranca;

-- faturamento_mensal (4)
DROP POLICY IF EXISTS "Authorized roles can view faturamento" ON public.faturamento_mensal;
DROP POLICY IF EXISTS "Authorized roles can insert faturamento" ON public.faturamento_mensal;
DROP POLICY IF EXISTS "Authorized roles can update faturamento" ON public.faturamento_mensal;
DROP POLICY IF EXISTS "Admin/financeiro can delete faturamento" ON public.faturamento_mensal;

-- fechamentos_tributarios (3)
DROP POLICY IF EXISTS "Admin/financeiro/contador podem ler fechamentos" ON public.fechamentos_tributarios;
DROP POLICY IF EXISTS "Admin/financeiro podem inserir fechamentos" ON public.fechamentos_tributarios;
DROP POLICY IF EXISTS "Admin/financeiro podem atualizar fechamentos abertos" ON public.fechamentos_tributarios;

-- fila_cobrancas (2)
DROP POLICY IF EXISTS "Fin users can read fila_cobrancas" ON public.fila_cobrancas;
DROP POLICY IF EXISTS "Admins can manage queue" ON public.fila_cobrancas;

-- folha_pagamento (4)
DROP POLICY IF EXISTS "Authorized roles can view folha" ON public.folha_pagamento;
DROP POLICY IF EXISTS "Authorized roles can insert folha" ON public.folha_pagamento;
DROP POLICY IF EXISTS "Authorized roles can update folha" ON public.folha_pagamento;
DROP POLICY IF EXISTS "Admin/financeiro can delete folha" ON public.folha_pagamento;

-- health_scores_operacionais (1)
DROP POLICY IF EXISTS "Apenas admin visualiza health scores" ON public.health_scores_operacionais;

-- historico_analises_preditivas (1)
DROP POLICY IF EXISTS "Usuários podem ver próprias análises ou papel elevado" ON public.historico_analises_preditivas;

-- historico_cobranca (2)
DROP POLICY IF EXISTS "Financeiro+ can insert historico_cobranca" ON public.historico_cobranca;
DROP POLICY IF EXISTS "Financeiro+ podem ver historico_cobranca" ON public.historico_cobranca;

-- historico_cobranca_whatsapp (3)
DROP POLICY IF EXISTS "Financeiro e admin podem ver histórico de cobrança" ON public.historico_cobranca_whatsapp;
DROP POLICY IF EXISTS "Financeiro+ podem inserir historico cobranca whatsapp" ON public.historico_cobranca_whatsapp;
DROP POLICY IF EXISTS "Financeiro+ podem atualizar historico cobranca whatsapp" ON public.historico_cobranca_whatsapp;

-- historico_score_saude (1)
DROP POLICY IF EXISTS "Financeiro e admin podem ver histórico de score" ON public.historico_score_saude;

-- lancamentos_contabeis (3)
DROP POLICY IF EXISTS "lanc_select" ON public.lancamentos_contabeis;
DROP POLICY IF EXISTS "lanc_insert" ON public.lancamentos_contabeis;
DROP POLICY IF EXISTS "lanc_update" ON public.lancamentos_contabeis;

-- metas_financeiras (2)
DROP POLICY IF EXISTS "Financeiro+ can manage metas_financeiras" ON public.metas_financeiras;
DROP POLICY IF EXISTS "Financeiro+ podem ver metas_financeiras" ON public.metas_financeiras;

-- movimentacoes (4)
DROP POLICY IF EXISTS "Fin users can read movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Fin users can insert movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Fin users can update movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Admin can delete movimentacoes" ON public.movimentacoes;

-- negativacoes (2)
DROP POLICY IF EXISTS "Fin users can read negativacoes" ON public.negativacoes;
DROP POLICY IF EXISTS "Admins can manage negativacoes" ON public.negativacoes;

-- notas_fiscais (1)
DROP POLICY IF EXISTS "Operacional+ podem ver notas fiscais" ON public.notas_fiscais;

-- notas_fiscais_ocr (1)
DROP POLICY IF EXISTS "Owner ou admin/financeiro visualiza NFs OCR" ON public.notas_fiscais_ocr;

-- pix_templates (3)
DROP POLICY IF EXISTS "Admins can delete pix_templates" ON public.pix_templates;
DROP POLICY IF EXISTS "Role-based select pix_templates" ON public.pix_templates;
DROP POLICY IF EXISTS "Admins can manage pix" ON public.pix_templates;

-- prejuizos_fiscais (1)
DROP POLICY IF EXISTS "prejuizos_fiscais_admin_write" ON public.prejuizos_fiscais;

-- protestos (2)
DROP POLICY IF EXISTS "Fin users can read protestos" ON public.protestos;
DROP POLICY IF EXISTS "Admins can manage protestos" ON public.protestos;

-- recomendacoes_metas_ia (1)
DROP POLICY IF EXISTS "Financeiro+ podem ver recomendações" ON public.recomendacoes_metas_ia;

-- regime_decision_cache (1)
DROP POLICY IF EXISTS "regime_cache_read_authorized" ON public.regime_decision_cache;

-- regimes_simulados (2)
DROP POLICY IF EXISTS "Authorized roles can view regimes simulados" ON public.regimes_simulados;
DROP POLICY IF EXISTS "Authorized roles can insert regimes simulados" ON public.regimes_simulados;

-- regras_conciliacao (3)
DROP POLICY IF EXISTS "Financeiro+ podem inserir regras_conciliacao" ON public.regras_conciliacao;
DROP POLICY IF EXISTS "Financeiro+ podem atualizar regras_conciliacao" ON public.regras_conciliacao;
DROP POLICY IF EXISTS "Admin financeiro can read regras_conciliacao" ON public.regras_conciliacao;

-- regua_cobranca (1)
DROP POLICY IF EXISTS "Admin financeiro can view regua_cobranca" ON public.regua_cobranca;

-- relatorios_tributarios_agendados (1)
DROP POLICY IF EXISTS "rel_trib_agend_admin_fin_select" ON public.relatorios_tributarios_agendados;

-- resumos_executivos_semanais (2)
DROP POLICY IF EXISTS "Admins gerenciam resumos executivos" ON public.resumos_executivos_semanais;
DROP POLICY IF EXISTS "Admin/financeiro visualiza resumos executivos" ON public.resumos_executivos_semanais;

-- risk_rules (5)
DROP POLICY IF EXISTS "Admins can delete risk rules" ON public.risk_rules;
DROP POLICY IF EXISTS "Authorized roles can view risk rules" ON public.risk_rules;
DROP POLICY IF EXISTS "Managers can insert risk rules" ON public.risk_rules;
DROP POLICY IF EXISTS "Managers can update risk rules" ON public.risk_rules;
DROP POLICY IF EXISTS "Viewers can view risk rules" ON public.risk_rules;

-- solicitacoes_lgpd (2)
DROP POLICY IF EXISTS "Usuários veem suas próprias solicitações" ON public.solicitacoes_lgpd;
DROP POLICY IF EXISTS "Apenas admin atualiza solicitações" ON public.solicitacoes_lgpd;

-- sped_contabil_arquivos (2)
DROP POLICY IF EXISTS "sped_contabil_select" ON public.sped_contabil_arquivos;
DROP POLICY IF EXISTS "sped_contabil_insert" ON public.sped_contabil_arquivos;

-- templates_cobranca (3)
DROP POLICY IF EXISTS "Admin can manage templates_cobranca" ON public.templates_cobranca;
DROP POLICY IF EXISTS "Admin financeiro can read templates_cobranca" ON public.templates_cobranca;
DROP POLICY IF EXISTS "Admins can manage templates" ON public.templates_cobranca;

-- transferencias (4)
DROP POLICY IF EXISTS "Fin users can read transferencias" ON public.transferencias;
DROP POLICY IF EXISTS "Fin users can insert transferencias" ON public.transferencias;
DROP POLICY IF EXISTS "Fin users can update transferencias" ON public.transferencias;
DROP POLICY IF EXISTS "Admin can delete transferencias" ON public.transferencias;

-- vendedores (2)
DROP POLICY IF EXISTS "Financeiro+ podem gerenciar vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "Operacional+ podem ver vendedores" ON public.vendedores;

-- verificacoes_conformidade (1)
DROP POLICY IF EXISTS "Admin/financeiro/contador podem ler verificacoes" ON public.verificacoes_conformidade;

COMMIT;

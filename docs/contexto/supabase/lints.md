# Lints de segurança e performance

Verificações objetivas feitas no catálogo. Um agente deve ler isto antes de propor mudanças em RLS, functions ou índices.

| severidade | código | objeto | detalhe |
|---|---|---|---|
| ALTA | secdef_mutable_search_path | public.gerar_lancamento_contabil_automatico() | SECURITY DEFINER sem `SET search_path`: vulnerável a sequestro de search_path. |
| BAIXA | fk_without_index | public.acoes_recomendadas.acoes_recomendadas_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.acordos_parcelamento.acordos_parcelamento_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.acordos_parcelamento.acordos_parcelamento_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.alert_configurations.alert_configurations_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.alertas_tributarios.alertas_tributarios_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.alerts.alerts_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.alerts_sent.alerts_sent_alert_id_fkey | FK sem índice nas colunas ['alert_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.aliquotas_iss_municipal.aliquotas_iss_municipal_item_lista_id_fkey | FK sem índice nas colunas ['item_lista_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.anomalia_toast_eventos.anomalia_toast_eventos_anomalia_id_fkey | FK sem índice nas colunas ['anomalia_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.apuracoes_irpj_csll.apuracoes_irpj_csll_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_audit_trail.asaas_audit_trail_asaas_payment_id_fkey | FK sem índice nas colunas ['asaas_payment_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_credit_risk_analysis.asaas_credit_risk_analysis_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_payment_links.asaas_payment_links_created_by_fkey | FK sem índice nas colunas ['created_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_payment_links.asaas_payment_links_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_payments.asaas_payments_asaas_customer_id_fkey | FK sem índice nas colunas ['asaas_customer_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_reconciliation_suggestions.asaas_reconciliation_suggestions_contas_pagar_id_fkey | FK sem índice nas colunas ['contas_pagar_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_reconciliation_suggestions.asaas_reconciliation_suggestions_contas_receber_id_fkey | FK sem índice nas colunas ['contas_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_sync_queue.asaas_sync_queue_asaas_payment_id_fkey | FK sem índice nas colunas ['asaas_payment_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.bitrix_field_mappings.bitrix_field_mappings_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.bitrix_sync_logs.bitrix_sync_logs_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.bloqueios_duplicidade.bloqueios_duplicidade_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.bloqueios_duplicidade.bloqueios_duplicidade_transacao_id_fkey | FK sem índice nas colunas ['transacao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.bloqueios_duplicidade.bloqueios_duplicidade_usuario_id_fkey | FK sem índice nas colunas ['usuario_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.boletos.boletos_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.boletos.boletos_conta_pagar_id_fkey | FK sem índice nas colunas ['conta_pagar_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.boletos.boletos_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.categorias.categorias_plano_conta_id_fkey | FK sem índice nas colunas ['plano_conta_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.centros_custo.centros_custo_parent_id_fkey | FK sem índice nas colunas ['parent_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.conciliacoes.conciliacoes_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.configuracoes_aprovacao.configuracoes_aprovacao_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.contas_pagar.contas_pagar_centro_custo_id_fkey | FK sem índice nas colunas ['centro_custo_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.contas_pagar.contas_pagar_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.contas_receber.contas_receber_categoria_id_fkey | FK sem índice nas colunas ['categoria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.contas_receber.contas_receber_centro_custo_id_fkey | FK sem índice nas colunas ['centro_custo_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.contas_receber.contas_receber_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.contas_receber.contas_receber_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.contratos.contratos_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.contratos.contratos_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.contratos.contratos_fornecedor_id_fkey | FK sem índice nas colunas ['fornecedor_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.convites.convites_organizacao_id_fkey | FK sem índice nas colunas ['organizacao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.creditos_tributarios.creditos_tributarios_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.creditos_tributarios.creditos_tributarios_nota_fiscal_id_fkey | FK sem índice nas colunas ['nota_fiscal_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.custom_field_definitions.custom_field_definitions_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.darfs.darfs_alerta_id_fkey | FK sem índice nas colunas ['alerta_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.darfs.darfs_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.divergencias_conciliacao.divergencias_conciliacao_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.divergencias_conciliacao.divergencias_conciliacao_transacao_id_fkey | FK sem índice nas colunas ['transacao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.elisao_alertas.elisao_alertas_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.elisao_creditos_auditoria.elisao_creditos_auditoria_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.elisao_creditos_auditoria.elisao_creditos_auditoria_nota_fiscal_id_fkey | FK sem índice nas colunas ['nota_fiscal_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.elisao_creditos_auditoria.elisao_creditos_auditoria_regra_id_fkey | FK sem índice nas colunas ['regra_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.elisao_tarefas_acionaveis.elisao_tarefas_acionaveis_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.empresas_certificados.empresas_certificados_criado_por_fkey | FK sem índice nas colunas ['criado_por']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.entregas_obrigacoes.entregas_obrigacoes_registrado_por_fkey | FK sem índice nas colunas ['registrado_por']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.eventos_contabilizacao_log.eventos_contabilizacao_log_regra_id_fkey | FK sem índice nas colunas ['regra_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.evidencias_pacotes.evidencias_pacotes_verificacao_id_fkey | FK sem índice nas colunas ['verificacao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.execucoes_cobranca.execucoes_cobranca_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.expert_conversations.expert_conversations_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.expert_messages.expert_messages_conversation_id_fkey | FK sem índice nas colunas ['conversation_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.extrato_bancario.extrato_bancario_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.fechamentos_tributarios.fechamentos_tributarios_fechado_por_fkey | FK sem índice nas colunas ['fechado_por']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.feedback_conciliacao_ia.feedback_conciliacao_ia_transacao_id_fkey | FK sem índice nas colunas ['transacao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.fila_cobrancas.fila_cobrancas_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.fila_cobrancas.fila_cobrancas_conta_receber_id_fkey | FK sem índice nas colunas ['conta_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.fila_cobrancas.fila_cobrancas_etapa_id_fkey | FK sem índice nas colunas ['etapa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.fluxos_aprovacao_niveis.fluxos_aprovacao_niveis_configuracao_id_fkey | FK sem índice nas colunas ['configuracao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.fluxos_aprovacao_niveis.fluxos_aprovacao_niveis_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.formas_pagamento.formas_pagamento_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.health_scores_operacionais.health_scores_operacionais_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_cobranca.historico_cobranca_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_cobranca.historico_cobranca_conta_receber_id_fkey | FK sem índice nas colunas ['conta_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_cobranca.historico_cobranca_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_cobranca_whatsapp.historico_cobranca_whatsapp_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_cobranca_whatsapp.historico_cobranca_whatsapp_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_conciliacao_ia.historico_conciliacao_ia_conta_receber_id_fkey | FK sem índice nas colunas ['conta_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_conciliacao_ia.historico_conciliacao_ia_sessao_id_fkey | FK sem índice nas colunas ['sessao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_relatorios.historico_relatorios_relatorio_agendado_id_fkey | FK sem índice nas colunas ['relatorio_agendado_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_score_saude.historico_score_saude_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.itens_pedido_compra.itens_pedido_compra_pedido_id_fkey | FK sem índice nas colunas ['pedido_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.kpis_operacionais.kpis_operacionais_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.logs_conciliacao_retroativa.logs_conciliacao_retroativa_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.metas_financeiras.metas_financeiras_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.movimentacoes.movimentacoes_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.movimentacoes.movimentacoes_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.n8n_dispatch_logs.n8n_dispatch_logs_config_id_fkey | FK sem índice nas colunas ['config_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.negativacoes.negativacoes_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.negativacoes.negativacoes_conta_receber_id_fkey | FK sem índice nas colunas ['conta_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.new_device_alerts.new_device_alerts_device_id_fkey | FK sem índice nas colunas ['device_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.nfe_eventos.nfe_eventos_created_by_fkey | FK sem índice nas colunas ['created_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.nfe_recebidas.nfe_recebidas_conta_pagar_id_fkey | FK sem índice nas colunas ['conta_pagar_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.notas_fiscais.notas_fiscais_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.notas_fiscais_ocr.notas_fiscais_ocr_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.operacoes_icms.operacoes_icms_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.operacoes_tributaveis.operacoes_tributaveis_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.oportunidades_elisao.oportunidades_elisao_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.oportunidades_elisao.oportunidades_elisao_estrategia_id_fkey | FK sem índice nas colunas ['estrategia_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.pagamentos_recorrentes.pagamentos_recorrentes_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.parcelas_acordo.parcelas_acordo_acordo_id_fkey | FK sem índice nas colunas ['acordo_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.partidas_contabeis.partidas_contabeis_conta_contabil_id_fkey | FK sem índice nas colunas ['conta_contabil_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.pedidos_compra.pedidos_compra_fornecedor_id_fkey | FK sem índice nas colunas ['fornecedor_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.per_dcomp.per_dcomp_created_by_fkey | FK sem índice nas colunas ['created_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.portal_cliente_acessos.portal_cliente_acessos_token_id_fkey | FK sem índice nas colunas ['token_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.prejuizos_fiscais.prejuizos_fiscais_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.projecoes_reforma.projecoes_reforma_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.protestos.protestos_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.protestos.protestos_conta_receber_id_fkey | FK sem índice nas colunas ['conta_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.protocolos_st_ncms.protocolos_st_ncms_ncm_id_fkey | FK sem índice nas colunas ['ncm_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.protocolos_st_ncms.protocolos_st_ncms_protocolo_id_fkey | FK sem índice nas colunas ['protocolo_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.recomendacoes_metas_ia.recomendacoes_metas_ia_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regimes_especiais_empresa.regimes_especiais_empresa_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regimes_simulados.regimes_simulados_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regimes_tributarios.regimes_tributarios_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regras_duplicidade.regras_duplicidade_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regras_roteamento_financeiro.regras_roteamento_financeiro_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regras_roteamento_financeiro.regras_roteamento_financeiro_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regua_cobranca_etapas.regua_cobranca_etapas_regua_id_fkey | FK sem índice nas colunas ['regua_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regua_cobranca_etapas.regua_cobranca_etapas_template_id_fkey | FK sem índice nas colunas ['template_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regua_cobranca_status.regua_cobranca_status_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regua_cobranca_status.regua_cobranca_status_conta_receber_id_fkey | FK sem índice nas colunas ['conta_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regua_cobranca_status.regua_cobranca_status_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regua_cobranca_status.regua_cobranca_status_titulo_id_fkey | FK sem índice nas colunas ['titulo_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.resumos_executivos_semanais.resumos_executivos_semanais_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.retencoes_fonte.retencoes_fonte_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.risk_rules.risk_rules_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.role_permissions.role_permissions_permission_id_fkey | FK sem índice nas colunas ['permission_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.saved_filters.saved_filters_created_by_fkey | FK sem índice nas colunas ['created_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.scim_tokens.scim_tokens_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.scim_tokens.scim_tokens_provider_id_fkey | FK sem índice nas colunas ['provider_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sessoes_conciliacao.sessoes_conciliacao_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.solicitacoes_aprovacao.solicitacoes_aprovacao_conta_pagar_id_fkey | FK sem índice nas colunas ['conta_pagar_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.solicitacoes_lgpd.solicitacoes_lgpd_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sped_contabil_arquivos.sped_contabil_arquivos_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.split_payment_transacoes.split_payment_transacoes_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sso_providers.sso_providers_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sso_sandbox_runs.sso_sandbox_runs_provider_id_fkey | FK sem índice nas colunas ['provider_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sso_user_groups.sso_user_groups_provider_id_fkey | FK sem índice nas colunas ['provider_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.transacoes_bancarias.transacoes_bancarias_regra_id_fkey | FK sem índice nas colunas ['regra_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.transferencias.transferencias_conta_origem_id_fkey | FK sem índice nas colunas ['conta_origem_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.transferencias.transferencias_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.vendedores.vendedores_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.verificacoes_conformidade.verificacoes_conformidade_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.webhook_simulation_results.webhook_simulation_results_run_id_fkey | FK sem índice nas colunas ['run_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.webhooks_log.webhooks_log_dlq_id_fkey | FK sem índice nas colunas ['dlq_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.whatsapp_conversas.whatsapp_conversas_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.whatsapp_conversas.whatsapp_conversas_empresa_id_fkey | FK sem índice nas colunas ['empresa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | policy_auth_fn_not_wrapped | public.anexos_financeiros.anexos_financeiros_atualizacao_empresa | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.anexos_financeiros.anexos_financeiros_insercao_empresa | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.anexos_financeiros.anexos_financeiros_leitura_empresa | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.anexos_financeiros.anexos_financeiros_remocao_empresa | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.kpis_operacionais.kpis_operacionais_owner | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.notas_fiscais.notas_fiscais_tenant_delete | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.scim_setup_checklist.scim_checklist_own | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.sso_sandbox_runs.sso_sandbox_runs_admin | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | storage.objects.anexos_financeiro_leitura_autenticada | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | storage.objects.anexos_financeiro_remocao_autenticada | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| INFO | realtime_replica_identity | public.performance_alerts | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | rpc_anon_executable | public.is_user_locked(_email text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.resolve_sso_providers_for_domain(p_domain text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |

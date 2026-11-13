# Lints de segurança e performance

Verificações objetivas feitas no catálogo. Um agente deve ler isto antes de propor mudanças em RLS, functions ou índices.

| severidade | código | objeto | detalhe |
|---|---|---|---|
| ALTA | secdef_mutable_search_path | public.gerar_lancamento_contabil_automatico() | SECURITY DEFINER sem `SET search_path`: vulnerável a sequestro de search_path. |
| MÉDIA | rls_no_policies | public.alert_configurations | RLS ligado sem policies: inacessível via API (só service_role). |
| MÉDIA | rls_no_policies | public.alerts | RLS ligado sem policies: inacessível via API (só service_role). |
| MÉDIA | rls_no_policies | public.risk_rules | RLS ligado sem policies: inacessível via API (só service_role). |
| BAIXA | fk_without_index | public.acordos_parcelamento.acordos_parcelamento_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.alerts_sent.alerts_sent_alert_id_fkey | FK sem índice nas colunas ['alert_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.aliquotas_iss_municipal.aliquotas_iss_municipal_item_lista_id_fkey | FK sem índice nas colunas ['item_lista_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.anomalia_toast_eventos.anomalia_toast_eventos_anomalia_id_fkey | FK sem índice nas colunas ['anomalia_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_audit_trail.asaas_audit_trail_asaas_payment_id_fkey | FK sem índice nas colunas ['asaas_payment_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_credit_risk_analysis.asaas_credit_risk_analysis_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_payment_links.asaas_payment_links_created_by_fkey | FK sem índice nas colunas ['created_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_payments.asaas_payments_asaas_customer_id_fkey | FK sem índice nas colunas ['asaas_customer_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_reconciliation_suggestions.asaas_reconciliation_suggestions_contas_pagar_id_fkey | FK sem índice nas colunas ['contas_pagar_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_reconciliation_suggestions.asaas_reconciliation_suggestions_contas_receber_id_fkey | FK sem índice nas colunas ['contas_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.asaas_sync_queue.asaas_sync_queue_asaas_payment_id_fkey | FK sem índice nas colunas ['asaas_payment_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.bloqueios_duplicidade.bloqueios_duplicidade_transacao_id_fkey | FK sem índice nas colunas ['transacao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.bloqueios_duplicidade.bloqueios_duplicidade_usuario_id_fkey | FK sem índice nas colunas ['usuario_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.categorias.categorias_plano_conta_id_fkey | FK sem índice nas colunas ['plano_conta_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.centros_custo.centros_custo_parent_id_fkey | FK sem índice nas colunas ['parent_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.conciliacoes.conciliacoes_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.contratos.contratos_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.contratos.contratos_fornecedor_id_fkey | FK sem índice nas colunas ['fornecedor_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.convites.convites_organizacao_id_fkey | FK sem índice nas colunas ['organizacao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.creditos_tributarios.creditos_tributarios_nota_fiscal_id_fkey | FK sem índice nas colunas ['nota_fiscal_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.darfs.darfs_alerta_id_fkey | FK sem índice nas colunas ['alerta_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.divergencias_conciliacao.divergencias_conciliacao_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.divergencias_conciliacao.divergencias_conciliacao_transacao_id_fkey | FK sem índice nas colunas ['transacao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.elisao_creditos_auditoria.elisao_creditos_auditoria_nota_fiscal_id_fkey | FK sem índice nas colunas ['nota_fiscal_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.elisao_creditos_auditoria.elisao_creditos_auditoria_regra_id_fkey | FK sem índice nas colunas ['regra_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.empresas_certificados.empresas_certificados_criado_por_fkey | FK sem índice nas colunas ['criado_por']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.entregas_obrigacoes.entregas_obrigacoes_registrado_por_fkey | FK sem índice nas colunas ['registrado_por']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.eventos_contabilizacao_log.eventos_contabilizacao_log_regra_id_fkey | FK sem índice nas colunas ['regra_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.evidencias_pacotes.evidencias_pacotes_verificacao_id_fkey | FK sem índice nas colunas ['verificacao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.execucoes_regua_cobranca.execucoes_regua_cobranca_conta_receber_id_fkey | FK sem índice nas colunas ['conta_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.expert_messages.expert_messages_conversation_id_fkey | FK sem índice nas colunas ['conversation_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.extrato_bancario.extrato_bancario_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.fechamentos_tributarios.fechamentos_tributarios_fechado_por_fkey | FK sem índice nas colunas ['fechado_por']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.feedback_conciliacao_ia.feedback_conciliacao_ia_transacao_id_fkey | FK sem índice nas colunas ['transacao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.fila_cobrancas.fila_cobrancas_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.fila_cobrancas.fila_cobrancas_conta_receber_id_fkey | FK sem índice nas colunas ['conta_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.fila_cobrancas.fila_cobrancas_etapa_id_fkey | FK sem índice nas colunas ['etapa_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.fluxos_aprovacao_niveis.fluxos_aprovacao_niveis_configuracao_id_fkey | FK sem índice nas colunas ['configuracao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_cobranca.historico_cobranca_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_cobranca.historico_cobranca_conta_receber_id_fkey | FK sem índice nas colunas ['conta_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_cobranca_whatsapp.historico_cobranca_whatsapp_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_conciliacao_ia.historico_conciliacao_ia_conta_receber_id_fkey | FK sem índice nas colunas ['conta_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_conciliacao_ia.historico_conciliacao_ia_sessao_id_fkey | FK sem índice nas colunas ['sessao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.historico_relatorios.historico_relatorios_relatorio_agendado_id_fkey | FK sem índice nas colunas ['relatorio_agendado_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.itens_pedido_compra.itens_pedido_compra_pedido_id_fkey | FK sem índice nas colunas ['pedido_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.logs_conciliacao_retroativa.logs_conciliacao_retroativa_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.n8n_dispatch_logs.n8n_dispatch_logs_config_id_fkey | FK sem índice nas colunas ['config_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.n8n_workflow_configs.n8n_workflow_configs_created_by_fkey | FK sem índice nas colunas ['created_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.negativacoes.negativacoes_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.negativacoes.negativacoes_conta_receber_id_fkey | FK sem índice nas colunas ['conta_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.new_device_alerts.new_device_alerts_device_id_fkey | FK sem índice nas colunas ['device_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.nfe_eventos.nfe_eventos_created_by_fkey | FK sem índice nas colunas ['created_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.nfe_recebidas.nfe_recebidas_conta_pagar_id_fkey | FK sem índice nas colunas ['conta_pagar_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.oportunidades_elisao.oportunidades_elisao_estrategia_id_fkey | FK sem índice nas colunas ['estrategia_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.parcelas_acordo.parcelas_acordo_acordo_id_fkey | FK sem índice nas colunas ['acordo_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.partidas_contabeis.partidas_contabeis_conta_contabil_id_fkey | FK sem índice nas colunas ['conta_contabil_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.pedidos_compra.pedidos_compra_fornecedor_id_fkey | FK sem índice nas colunas ['fornecedor_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.per_dcomp.per_dcomp_created_by_fkey | FK sem índice nas colunas ['created_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.portal_cliente_acessos.portal_cliente_acessos_token_id_fkey | FK sem índice nas colunas ['token_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.protestos.protestos_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.protestos.protestos_conta_receber_id_fkey | FK sem índice nas colunas ['conta_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.protocolos_st_ncms.protocolos_st_ncms_ncm_id_fkey | FK sem índice nas colunas ['ncm_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.protocolos_st_ncms.protocolos_st_ncms_protocolo_id_fkey | FK sem índice nas colunas ['protocolo_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regras_roteamento_financeiro.regras_roteamento_financeiro_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regua_cobranca_etapas.regua_cobranca_etapas_regua_id_fkey | FK sem índice nas colunas ['regua_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regua_cobranca_etapas.regua_cobranca_etapas_template_id_fkey | FK sem índice nas colunas ['template_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regua_cobranca_status.regua_cobranca_status_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regua_cobranca_status.regua_cobranca_status_conta_receber_id_fkey | FK sem índice nas colunas ['conta_receber_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.regua_cobranca_status.regua_cobranca_status_titulo_id_fkey | FK sem índice nas colunas ['titulo_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.role_permissions.role_permissions_permission_id_fkey | FK sem índice nas colunas ['permission_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.saved_filters.saved_filters_created_by_fkey | FK sem índice nas colunas ['created_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.scim_tokens.scim_tokens_provider_id_fkey | FK sem índice nas colunas ['provider_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sessoes_conciliacao.sessoes_conciliacao_conta_bancaria_id_fkey | FK sem índice nas colunas ['conta_bancaria_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.solicitacoes_aprovacao.solicitacoes_aprovacao_conta_pagar_id_fkey | FK sem índice nas colunas ['conta_pagar_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sso_sandbox_runs.sso_sandbox_runs_provider_id_fkey | FK sem índice nas colunas ['provider_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sso_user_groups.sso_user_groups_provider_id_fkey | FK sem índice nas colunas ['provider_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.transacoes_bancarias.transacoes_bancarias_regra_id_fkey | FK sem índice nas colunas ['regra_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.transferencias.transferencias_conta_origem_id_fkey | FK sem índice nas colunas ['conta_origem_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.webhook_simulation_results.webhook_simulation_results_run_id_fkey | FK sem índice nas colunas ['run_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.webhooks_log.webhooks_log_dlq_id_fkey | FK sem índice nas colunas ['dlq_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.whatsapp_conversas.whatsapp_conversas_cliente_id_fkey | FK sem índice nas colunas ['cliente_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | policy_auth_fn_not_wrapped | public.alertas.Users can view own or privileged system alertas | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.anexos_financeiros.anexos_financeiros_atualizacao_empresa | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.anexos_financeiros.anexos_financeiros_insercao_empresa | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.anexos_financeiros.anexos_financeiros_leitura_empresa | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.anexos_financeiros.anexos_financeiros_remocao_empresa | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.apuracoes_irpj_csll.Admin pode deletar apuracoes_irpj_csll | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.apuracoes_irpj_csll.Financeiro+ podem atualizar apuracoes_irpj_csll | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.apuracoes_irpj_csll.Financeiro+ podem inserir apuracoes_irpj_csll | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.apuracoes_irpj_csll.Financeiro+ podem ver apuracoes_irpj_csll | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.apuracoes_tributarias.Admin pode deletar apuracoes_tributarias | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.apuracoes_tributarias.Financeiro+ podem atualizar apuracoes_tributarias | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.apuracoes_tributarias.Financeiro+ podem inserir apuracoes_tributarias | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.apuracoes_tributarias.Financeiro+ podem ver apuracoes_tributarias | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.asaas_audit_trail.Users can view audit trail of their company | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.asaas_audit_trail.asaas_audit_tenant_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.bitrix_field_mappings.Admin can manage field mappings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.bitrix_sync_logs.Financeiro+ can insert sync logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.boletos.Admin can delete boletos | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.boletos.Financeiro+ can update boletos | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.boletos.Operacional+ can insert boletos | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.clientes.Operacional+ can manage clientes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.conciliacoes.Fin users can manage conciliacoes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.conciliacoes.Fin users can read conciliacoes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contas_bancarias.Financeiro+ can manage contas | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.creditos_tributarios.Admin pode deletar creditos_tributarios | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.creditos_tributarios.Financeiro+ podem atualizar creditos_tributarios | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.creditos_tributarios.Financeiro+ podem inserir creditos_tributarios | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.creditos_tributarios.Financeiro+ podem ver creditos_tributarios | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.darfs.Admin pode deletar darfs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.darfs.Financeiro+ podem atualizar darfs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.darfs.Financeiro+ podem inserir darfs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.darfs.Financeiro+ podem ver darfs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.empresas.Financeiro+ can manage empresas | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.eventos_contabilizacao_log.eventos_contab_insert | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.fechamentos_tributarios.Apenas admin pode deletar fechamentos | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.health_scores_operacionais.Sistema insere health scores via service role | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.historico_analises_preditivas.Usuários podem inserir próprias análises ou papel elevado | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.historico_conciliacao_ia.Financeiro+ podem inserir historico_conciliacao_ia | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.historico_conciliacao_ia.Financeiro+ podem ver historico_conciliacao_ia | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.historico_score_saude.Financeiro e admin podem inserir histórico de score | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.incentivos_fiscais.Admin pode deletar incentivos_fiscais | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.incentivos_fiscais.Financeiro+ podem atualizar incentivos_fiscais | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.incentivos_fiscais.Financeiro+ podem inserir incentivos_fiscais | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.incentivos_fiscais.Financeiro+ podem ver incentivos_fiscais | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.kpis_operacionais.kpis_operacionais_owner | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lancamentos_contabeis.Lancamentos scoped by empresa | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.notas_fiscais.Operacional+ can manage notas_fiscais | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.notas_fiscais.notas_fiscais_tenant_delete | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.notas_fiscais_ocr.Admins deletam NFs OCR | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.operacoes_tributaveis.Admin pode deletar operacoes_tributaveis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.operacoes_tributaveis.Financeiro+ podem atualizar operacoes_tributaveis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.operacoes_tributaveis.Financeiro+ podem inserir operacoes_tributaveis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.operacoes_tributaveis.Financeiro+ podem ver operacoes_tributaveis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.oportunidades_elisao.Admin/financeiro can delete oportunidades elisao | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.oportunidades_elisao.Admin/financeiro can update oportunidades elisao | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.oportunidades_elisao.Authorized roles can insert oportunidades elisao | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.oportunidades_elisao.Authorized roles can view oportunidades elisao | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pagamentos_recorrentes.Admins podem deletar pagamentos recorrentes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pagamentos_recorrentes.Financeiro+ podem atualizar pagamentos_recorrentes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pagamentos_recorrentes.Operacional+ podem ver pagamentos_recorrentes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.pagamentos_recorrentes.Usuários podem criar pagamentos recorrentes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.partidas_contabeis.partidas_delete | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.partidas_contabeis.partidas_insert | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.partidas_contabeis.partidas_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.partidas_contabeis.partidas_update | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.per_dcomp.Admin pode deletar per_dcomp | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.per_dcomp.Financeiro+ podem atualizar per_dcomp | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.per_dcomp.Financeiro+ podem inserir per_dcomp | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.per_dcomp.Financeiro+ podem ver per_dcomp | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.prejuizos_fiscais.Admin pode deletar prejuizos_fiscais | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.prejuizos_fiscais.Financeiro+ podem atualizar prejuizos_fiscais | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.prejuizos_fiscais.Financeiro+ podem inserir prejuizos_fiscais | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.prejuizos_fiscais.Financeiro+ podem ver prejuizos_fiscais | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.profiles.Admins can update all profiles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.profiles.Admins can view all profiles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.recomendacoes_metas_ia.Financeiro+ podem atualizar recomendações | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.regimes_especiais_empresa.Admin pode deletar regimes_especiais_empresa | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.regimes_especiais_empresa.Financeiro+ podem atualizar regimes_especiais_empresa | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.regimes_especiais_empresa.Financeiro+ podem inserir regimes_especiais_empresa | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.regimes_especiais_empresa.Financeiro+ podem ver regimes_especiais_empresa | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.regimes_simulados.Admin/financeiro can delete regimes simulados | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.regimes_simulados.Admin/financeiro can update regimes simulados | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.relatorios_agendados.Users can delete own scheduled reports or elevated | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.relatorios_agendados.Users can update own scheduled reports or elevated | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.relatorios_agendados.Users can view own scheduled reports or elevated | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.relatorios_tributarios_agendados.rel_trib_agend_admin_delete | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.relatorios_tributarios_agendados.rel_trib_agend_admin_fin_insert | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.relatorios_tributarios_agendados.rel_trib_agend_admin_fin_update | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.retencoes_fonte.Admin pode deletar retencoes_fonte | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.retencoes_fonte.Financeiro+ podem atualizar retencoes_fonte | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.retencoes_fonte.Financeiro+ podem inserir retencoes_fonte | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.retencoes_fonte.Financeiro+ podem ver retencoes_fonte | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.scim_operations_log.Admins view scim logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.scim_setup_checklist.scim_checklist_own | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.split_payment_transacoes.Admin pode deletar split_payment_transacoes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.split_payment_transacoes.Financeiro+ podem atualizar split_payment_transacoes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.split_payment_transacoes.Financeiro+ podem inserir split_payment_transacoes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.split_payment_transacoes.Financeiro+ podem ver split_payment_transacoes | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.sso_login_attempts.Admins veem tentativas SSO | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.sso_sandbox_runs.sso_sandbox_runs_admin | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | storage.objects.Admin/financeiro visualiza tax reports | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | storage.objects.Admins can delete tax reports | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | storage.objects.Usuários autenticados fazem upload de NFs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | storage.objects.Usuários autenticados leem suas NFs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | storage.objects.Usuários deletam suas NFs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | storage.objects.anexos_financeiro_leitura_autenticada | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | storage.objects.anexos_financeiro_remocao_autenticada | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | storage.objects.nfe_xml_empresa_read | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| INFO | realtime_replica_identity | public.alertas | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.alertas_tributarios | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.anomalia_detection_runs | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.anomalias_detectadas | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.audit_logs | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.performance_alerts | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.security_alerts | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.solicitacoes_aprovacao | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.transacoes_bancarias | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.user_anomalia_preferences | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | rpc_anon_executable | public.gerar_alertas_vencimento() | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.is_user_locked(_email text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.resolve_sso_providers_for_domain(p_domain text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |

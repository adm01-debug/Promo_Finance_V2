# Tipos customizados (enums, domains, composites)

| tipo | kind | valores / definição | usado em |
|---|---|---|---|
| public.alert_severity | enum | INFO, WARNING, CRITICAL | public.alerts.severity |
| public.alert_type | enum | DRIVER_BLOCKED, ROUTE_DEVIATION, DRIVER_STOPPED, LATE_DELIVERY, APPROVAL_REQUIRED, ORDER_CANCELLED | public.alert_configurations.alert_type, public.alerts.type |
| public.app_role | enum | admin, manager, operator, viewer, financeiro, operacional, visualizador, contador | public.role_permissions.role, public.scim_tokens.default_role, public.sso_providers.default_role, public.sso_user_groups.matched_role, public.user_empresas.role, public.user_roles.role |
| public.approval_priority | enum | LOW, MEDIUM, HIGH, URGENT, CRITICAL |  |
| public.approval_status | enum | PENDING, APPROVED, REJECTED |  |
| public.atividade_economica | enum | INDUSTRIA, COMERCIO, SERVICOS, MISTA | public.cnaes.atividade |
| public.delivery_outcome | enum | SUCCESS, FAILED, DAMAGED, STOLEN, LATE, WRONG_ADDRESS, CUSTOMER_UNAVAILABLE |  |
| public.driver_status | enum | APPROVED, PENDING_APPROVAL, BLOCKED, WHITELIST, BLACKLIST |  |
| public.incident_severity | enum | LOW, MEDIUM, HIGH, CRITICAL |  |
| public.incident_type | enum | ROUTE_DEVIATION, LONG_STOP, LATE_DELIVERY, CUSTOMER_COMPLAINT, DAMAGE, OTHER |  |
| public.nfe_manifestacao_status | enum | pendente, ciencia, confirmada, desconhecida, nao_realizada | public.nfe_recebidas.manifestacao_status |
| public.nfe_schema_tipo | enum | resNFe, procNFe, resEvento, procEventoNFe, resCTe, procCTe | public.nfe_recebidas.schema_tipo |
| public.nivel_risco | enum | BAIXO, MEDIO, ALTO | public.estrategias_elisao.risco |
| public.order_status | enum | PENDING, MATCHED, ON_GOING, PICKED_UP, COMPLETED, CANCELLED, REJECTED, EXPIRED |  |
| public.org_papel | enum | RESPONSAVEL, ADMIN, MEMBRO, LEITOR | public.convites.papel_proposto, public.organizacao_membros.papel_na_org |
| public.prioridade_alerta | enum | baixa, media, alta, critica |  |
| public.regiao_brasil | enum | NORTE, NORDESTE, CENTRO_OESTE, SUDESTE, SUL | public.ufs.regiao |
| public.regime_tributario_enum | enum | MEI, SIMPLES, PRESUMIDO, REAL, ARBITRADO | public.simulacao_tributos_detalhados.regime, public.simulacoes.regime_recomendado |
| public.sefaz_ambiente | enum | homologacao, producao | public.empresas_certificados.ambiente, public.nfe_recebidas.ambiente, public.sefaz_dfe_cursor.ambiente, public.v_sefaz_observability.ambiente |
| public.status_workflow | enum | IDENTIFICADO, EM_ANALISE, APROVADO, EM_EXECUCAO, CONCLUIDO, CANCELADO |  |
| public.tipo_alerta_tributario | enum | vencimento_apuracao, vencimento_darf, vencimento_obrigacao, prazo_credito, limite_compensacao, pendencia_conciliacao, inconsistencia_fiscal, atualizacao_legislacao, split_payment, retencao_pendente, nfe_rejeitada, saldo_negativo |  |
| public.tipo_cobranca | enum | transferencia, pix, boleto, debito_automatico, cartao_credito, cartao_debito, cheque, dinheiro | public.pagamentos_recorrentes.tipo_cobranca |
| public.tipo_destinatario | enum | CONTRIBUINTE_REVENDA, CONTRIBUINTE_USO_CONSUMO, NAO_CONTRIBUINTE, EXTERIOR | public.operacoes_icms.tipo_destinatario |
| public.uf_brasil | enum | AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO | public.aliquotas_interestaduais.uf_destino, public.aliquotas_interestaduais.uf_origem, public.aliquotas_internas_uf.uf, public.aliquotas_iss_municipal.uf, public.beneficios_fiscais.uf, public.protocolos_st_ufs.uf, public.ufs.sigla |
| public.vehicle_type | enum | MOTORCYCLE, CAR, VAN, TRUCK |  |

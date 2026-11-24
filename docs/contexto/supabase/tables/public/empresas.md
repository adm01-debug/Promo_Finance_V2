# public.empresas

> Dicionário estrutural de public.empresas (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (aliquota_rat IS NULL OR aliquota_rat >= 0::numeric AND aliquota_rat <= 0.06); CHECK (aliquota_terceiros IS NULL OR aliquota_terceiros >= 0::numeric AND aliquota_terceiros <= 0.08); CHECK (cnae_principal IS NULL OR length(regexp_replace(cnae_principal, '\D'::text, ''::text, 'g'::text)) >= 2 AND length(regexp_replace(cnae_principal, '\D'::text, ''::text, 'g'::text)) <= 7); PRIMARY KEY (id); CHECK (regime_tributario IS NULL OR (regime_tributario = ANY (ARRAY['mei'::text, 'simples_nacional'::text, 'lucro_presumido'::text, 'lucro_real'::text, 'arbitrado'::text]))). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_auditoria_tributaria_recente, public.vw_fluxo_caixa, public.vw_fluxo_caixa_diario, public.vw_saldos_contas, public.vw_transferencias_painel, public.vw_tributario_dashboard |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.empresas. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | não | `auth.uid()` |  | Dicionário estrutural da coluna user_id em public.empresas. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: auth.uid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `cnpj` | `text` | sim |  |  | Dicionário estrutural da coluna cnpj em public.empresas. Papel funcional indicado pelo identificador: cnpj; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `razao_social` | `text` | não |  |  | Dicionário estrutural da coluna razao_social em public.empresas. Papel funcional indicado pelo identificador: razao_social; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `nome_fantasia` | `text` | sim |  |  | Dicionário estrutural da coluna nome_fantasia em public.empresas. Papel funcional indicado pelo identificador: nome_fantasia; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `ativo` | `boolean` | não | `true` |  | Dicionário estrutural da coluna ativo em public.empresas. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.empresas. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `inscricao_estadual` | `text` | sim |  |  | Dicionário estrutural da coluna inscricao_estadual em public.empresas. Papel funcional indicado pelo identificador: inscricao_estadual; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `telefone` | `text` | sim |  |  | Dicionário estrutural da coluna telefone em public.empresas. Papel funcional indicado pelo identificador: telefone; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `email` | `text` | sim |  |  | Dicionário estrutural da coluna email em public.empresas. Papel funcional indicado pelo identificador: email; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `endereco` | `text` | sim |  |  | Dicionário estrutural da coluna endereco em public.empresas. Papel funcional indicado pelo identificador: endereco; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `cidade` | `text` | sim |  |  | Dicionário estrutural da coluna cidade em public.empresas. Papel funcional indicado pelo identificador: cidade; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `estado` | `text` | sim |  |  | Dicionário estrutural da coluna estado em public.empresas. Papel funcional indicado pelo identificador: estado; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `cep` | `text` | sim |  |  | Dicionário estrutural da coluna cep em public.empresas. Papel funcional indicado pelo identificador: cep; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `bairro` | `text` | sim |  |  | Dicionário estrutural da coluna bairro em public.empresas. Papel funcional indicado pelo identificador: bairro; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `logo_url` | `text` | sim |  |  | Dicionário estrutural da coluna logo_url em public.empresas. Papel funcional indicado pelo identificador: logo_url; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `sigla` | `text` | sim | `'EMP'::text` |  | Dicionário estrutural da coluna sigla em public.empresas. Papel funcional indicado pelo identificador: sigla; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'EMP'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 18 | `cor_hex` | `text` | sim | `'chart-1'::text` |  | Dicionário estrutural da coluna cor_hex em public.empresas. Papel funcional indicado pelo identificador: cor_hex; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'chart-1'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `aliquota_rat` | `numeric(5,4)` | sim | `0` |  | Dicionário estrutural da coluna aliquota_rat em public.empresas. Papel funcional indicado pelo identificador: aliquota_rat; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota_rat IS NULL OR aliquota_rat >= 0::numeric AND aliquota_rat <= 0.06). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 20 | `aliquota_terceiros` | `numeric(5,4)` | sim | `0` |  | Dicionário estrutural da coluna aliquota_terceiros em public.empresas. Papel funcional indicado pelo identificador: aliquota_terceiros; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota_terceiros IS NULL OR aliquota_terceiros >= 0::numeric AND aliquota_terceiros <= 0.08). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `cnae_principal` | `text` | sim |  |  | Dicionário estrutural da coluna cnae_principal em public.empresas. Papel funcional indicado pelo identificador: cnae_principal; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (cnae_principal IS NULL OR length(regexp_replace(cnae_principal, '\D'::text, ''::text, 'g'::text)) >= 2 AND length(regexp_replace(cnae_principal, '\D'::text, ''::text, 'g'::text)) <= 7). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 22 | `codigo_fpas` | `text` | sim |  |  | Dicionário estrutural da coluna codigo_fpas em public.empresas. Papel funcional indicado pelo identificador: codigo_fpas; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 23 | `is_padrao` | `boolean` | não | `false` |  | Dicionário estrutural da coluna is_padrao em public.empresas. Papel funcional indicado pelo identificador: is_padrao; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 24 | `regime_tributario` | `text` | sim |  |  | Dicionário estrutural da coluna regime_tributario em public.empresas. Papel funcional indicado pelo identificador: regime_tributario; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (regime_tributario IS NULL OR (regime_tributario = ANY (ARRAY['mei'::text, 'simples_nacional'::text, 'lucro_presumido'::text, 'lucro_real'::text, 'arbitrado'::text]))). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 25 | `inscricao_municipal` | `text` | sim |  |  | Dicionário estrutural da coluna inscricao_municipal em public.empresas. Papel funcional indicado pelo identificador: inscricao_municipal; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| empresas_aliquota_rat_range | CHECK | `CHECK (aliquota_rat IS NULL OR aliquota_rat >= 0::numeric AND aliquota_rat <= 0.06)` |  |  | sim |
| empresas_aliquota_terceiros_range | CHECK | `CHECK (aliquota_terceiros IS NULL OR aliquota_terceiros >= 0::numeric AND aliquota_terceiros <= 0.08)` |  |  | sim |
| empresas_cnae_principal_formato | CHECK | `CHECK (cnae_principal IS NULL OR length(regexp_replace(cnae_principal, '\D'::text, ''::text, 'g'::text)) >= 2 AND length(regexp_replace(cnae_principal, '\D'::text, ''::text, 'g'::text)) <= 7)` |  |  | sim |
| empresas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| empresas_regime_tributario_check | CHECK | `CHECK (regime_tributario IS NULL OR (regime_tributario = ANY (ARRAY['mei'::text, 'simples_nacional'::text, 'lucro_presumido'::text, 'lucro_real'::text, 'arbitrado'::text])))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.acoes_recomendadas | acoes_recomendadas_empresa_id_fkey | empresa_id | NO ACTION |
| public.acordos_parcelamento | acordos_parcelamento_empresa_id_fkey | empresa_id | NO ACTION |
| public.alert_configurations | alert_configurations_empresa_id_fkey | empresa_id | RESTRICT |
| public.alertas | alertas_empresa_id_fkey | empresa_id | CASCADE |
| public.alertas_tributarios | alertas_tributarios_empresa_id_fkey | empresa_id | NO ACTION |
| public.alerts | alerts_empresa_id_fkey | empresa_id | RESTRICT |
| public.api_keys | api_keys_empresa_id_fkey | empresa_id | CASCADE |
| public.apuracoes_irpj_csll | apuracoes_irpj_csll_empresa_id_fkey | empresa_id | NO ACTION |
| public.apuracoes_tributarias | apuracoes_tributarias_empresa_id_fkey | empresa_id | NO ACTION |
| public.asaas_payment_links | asaas_payment_links_empresa_id_fkey | empresa_id | CASCADE |
| public.auditoria_tributaria | auditoria_tributaria_empresa_id_fkey | empresa_id | SET NULL |
| public.bitrix_field_mappings | bitrix_field_mappings_empresa_id_fkey | empresa_id | NO ACTION |
| public.bitrix_sync_logs | bitrix_sync_logs_empresa_id_fkey | empresa_id | NO ACTION |
| public.bloqueios_duplicidade | bloqueios_duplicidade_empresa_id_fkey | empresa_id | NO ACTION |
| public.boletos | boletos_empresa_id_fkey | empresa_id | NO ACTION |
| public.budgets | budgets_company_id_fkey | company_id | NO ACTION |
| public.categorias | categorias_empresa_id_fkey | empresa_id | NO ACTION |
| public.configuracoes_aprovacao | configuracoes_aprovacao_empresa_id_fkey | empresa_id | NO ACTION |
| public.conformidade_snapshots | conformidade_snapshots_empresa_id_fkey | empresa_id | CASCADE |
| public.contas_bancarias | contas_bancarias_empresa_id_fkey | empresa_id | CASCADE |
| public.contas_pagar | contas_pagar_empresa_id_fkey | empresa_id | CASCADE |
| public.contas_receber | contas_receber_empresa_id_fkey | empresa_id | CASCADE |
| public.contratos | contratos_empresa_id_fkey | empresa_id | NO ACTION |
| public.convites_contador | convites_contador_empresa_id_fkey | empresa_id | CASCADE |
| public.creditos_tributarios | creditos_tributarios_empresa_id_fkey | empresa_id | CASCADE |
| public.custom_field_definitions | custom_field_definitions_empresa_id_fkey | empresa_id | CASCADE |
| public.darfs | darfs_empresa_id_fkey | empresa_id | SET NULL |
| public.elisao_alertas | elisao_alertas_empresa_id_fkey | empresa_id | CASCADE |
| public.elisao_creditos_auditoria | elisao_creditos_auditoria_empresa_id_fkey | empresa_id | CASCADE |
| public.elisao_simulacoes_regime | elisao_simulacoes_regime_empresa_id_fkey | empresa_id | CASCADE |
| public.elisao_tarefas_acionaveis | elisao_tarefas_acionaveis_empresa_id_fkey | empresa_id | CASCADE |
| public.empresas_certificados | empresas_certificados_empresa_id_fkey | empresa_id | CASCADE |
| public.entregas_obrigacoes | entregas_obrigacoes_empresa_id_fkey | empresa_id | CASCADE |
| public.execucoes_cobranca | execucoes_cobranca_empresa_id_fkey | empresa_id | NO ACTION |
| public.execucoes_regua_cobranca | execucoes_regua_cobranca_empresa_id_fkey | empresa_id | CASCADE |
| public.expert_conversations | expert_conversations_empresa_id_fkey | empresa_id | NO ACTION |
| public.faturamento_mensal | faturamento_mensal_empresa_id_fkey | empresa_id | NO ACTION |
| public.fechamentos_tributarios | fechamentos_tributarios_empresa_id_fkey | empresa_id | CASCADE |
| public.fluxos_aprovacao_niveis | fluxos_aprovacao_niveis_empresa_id_fkey | empresa_id | NO ACTION |
| public.folha_pagamento | folha_pagamento_empresa_id_fkey | empresa_id | NO ACTION |
| public.formas_pagamento | formas_pagamento_empresa_id_fkey | empresa_id | NO ACTION |
| public.fornecedores | fornecedores_empresa_id_fkey | empresa_id | NO ACTION |
| public.health_scores_operacionais | health_scores_operacionais_empresa_id_fkey | empresa_id | NO ACTION |
| public.historico_cobranca | historico_cobranca_empresa_id_fkey | empresa_id | NO ACTION |
| public.historico_cobranca_whatsapp | historico_cobranca_whatsapp_empresa_id_fkey | empresa_id | NO ACTION |
| public.historico_score_saude | historico_score_saude_empresa_id_fkey | empresa_id | NO ACTION |
| public.incentivos_fiscais | incentivos_fiscais_empresa_id_fkey | empresa_id | CASCADE |
| public.kpis_operacionais | kpis_operacionais_empresa_id_fkey | empresa_id | CASCADE |
| public.metas_financeiras | metas_financeiras_empresa_id_fkey | empresa_id | NO ACTION |
| public.movimentacoes | movimentacoes_empresa_id_fkey | empresa_id | CASCADE |
| public.nfe_recebidas | nfe_recebidas_empresa_id_fkey | empresa_id | SET NULL |
| public.notas_fiscais | notas_fiscais_empresa_id_fkey | empresa_id | CASCADE |
| public.notas_fiscais_ocr | notas_fiscais_ocr_empresa_id_fkey | empresa_id | CASCADE |
| public.operacoes_icms | operacoes_icms_empresa_id_fkey | empresa_id | CASCADE |
| public.operacoes_tributaveis | operacoes_tributaveis_empresa_id_fkey | empresa_id | NO ACTION |
| public.oportunidades_elisao | oportunidades_elisao_empresa_id_fkey | empresa_id | CASCADE |
| public.pagamentos_recorrentes | pagamentos_recorrentes_empresa_id_fkey | empresa_id | CASCADE |
| public.per_dcomp | per_dcomp_empresa_id_fkey | empresa_id | CASCADE |
| public.plano_contas | plano_contas_empresa_id_fkey | empresa_id | NO ACTION |
| public.prejuizos_fiscais | prejuizos_fiscais_empresa_id_fkey | empresa_id | NO ACTION |
| public.projecoes_reforma | projecoes_reforma_empresa_id_fkey | empresa_id | CASCADE |
| public.query_telemetry | query_telemetry_empresa_id_fkey | empresa_id | SET NULL |
| public.recomendacoes_metas_ia | recomendacoes_metas_ia_empresa_id_fkey | empresa_id | NO ACTION |
| public.regime_decision_cache | regime_decision_cache_empresa_id_fkey | empresa_id | CASCADE |
| public.regimes_especiais_empresa | regimes_especiais_empresa_empresa_id_fkey | empresa_id | CASCADE |
| public.regimes_simulados | regimes_simulados_empresa_id_fkey | empresa_id | CASCADE |
| public.regimes_tributarios | regimes_tributarios_empresa_id_fkey | empresa_id | NO ACTION |
| public.regras_duplicidade | regras_duplicidade_empresa_id_fkey | empresa_id | NO ACTION |
| public.regras_roteamento_financeiro | regras_roteamento_financeiro_empresa_id_fkey | empresa_id | NO ACTION |
| public.regua_cobranca_status | regua_cobranca_status_empresa_id_fkey | empresa_id | NO ACTION |
| public.relatorios_agendados | relatorios_agendados_empresa_id_fkey | empresa_id | CASCADE |
| public.relatorios_tributarios_agendados | relatorios_tributarios_agendados_empresa_id_fkey | empresa_id | CASCADE |
| public.resumos_executivos_semanais | resumos_executivos_semanais_empresa_id_fkey | empresa_id | NO ACTION |
| public.retencoes_fonte | retencoes_fonte_empresa_id_fkey | empresa_id | NO ACTION |
| public.risk_rules | risk_rules_empresa_id_fkey | empresa_id | RESTRICT |
| public.saved_filters | saved_filters_empresa_id_fkey | empresa_id | CASCADE |
| public.scim_tokens | scim_tokens_empresa_id_fkey | empresa_id | CASCADE |
| public.simulacoes | simulacoes_empresa_id_fkey | empresa_id | CASCADE |
| public.solicitacoes_lgpd | solicitacoes_lgpd_empresa_id_fkey | empresa_id | CASCADE |
| public.sped_contabil_arquivos | sped_contabil_arquivos_empresa_id_fkey | empresa_id | CASCADE |
| public.split_payment_transacoes | split_payment_transacoes_empresa_id_fkey | empresa_id | CASCADE |
| public.sso_login_attempts | sso_login_attempts_empresa_id_fkey | empresa_id | SET NULL |
| public.sso_providers | sso_providers_empresa_id_fkey | empresa_id | SET NULL |
| public.tax_audit_trail | tax_audit_trail_empresa_id_fkey | empresa_id | CASCADE |
| public.transferencias | transferencias_empresa_id_fkey | empresa_id | NO ACTION |
| public.user_empresas | user_empresas_empresa_id_fkey | empresa_id | CASCADE |
| public.user_filter_presets | user_filter_presets_empresa_id_fkey | empresa_id | CASCADE |
| public.vendedores | vendedores_empresa_id_fkey | empresa_id | NO ACTION |
| public.verificacoes_conformidade | verificacoes_conformidade_empresa_id_fkey | empresa_id | NO ACTION |
| public.whatsapp_conversas | whatsapp_conversas_empresa_id_fkey | empresa_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| empresas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX empresas_pkey ON public.empresas USING btree (id)` |
| uniq_empresas_is_padrao | btree |  | sim | sim | `is_padrao` | `CREATE UNIQUE INDEX uniq_empresas_is_padrao ON public.empresas USING btree ((true)) WHERE is_padrao` |


## Policies (RLS)

### `Financeiro+ can manage empresas`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(id))` |

### `Operacional+ podem ver empresas`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_acessivel(id))` |
| WITH CHECK |  |

### `Owner manage empresas`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_empresas_unica_padrao | BEFORE | INSERT OR UPDATE | ROW | enabled | public.empresas_unica_padrao |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

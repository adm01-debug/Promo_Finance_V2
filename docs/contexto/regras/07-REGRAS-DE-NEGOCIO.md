# 07 · REGRAS DE NEGÓCIO

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `ce2dfdba98` · branch `main` · 2026-11-22 00:52 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## A. Regras escritas por humanos (`manual/` — prioridade máxima, nunca sobrescrito)

_Nenhum arquivo em `manual/`. Copie `manual/TEMPLATE-regras-de-negocio.md` para `manual/regras.md` e preencha._

## B. Quem pode ver/alterar o quê (RLS — conforme migrations do repo; schema real em `06`)

| Tabela | Política | Comando | Roles | Modo | USING | WITH CHECK |
|---|---|---|---|---|---|---|
| `clientes` | Users can view own clientes | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `clientes` | Users can insert own clientes | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `clientes` | Users can update own clientes | UPDATE | public | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `clientes` | Users can delete own clientes | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `fornecedores` | Users can view own fornecedores | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `fornecedores` | Users can insert own fornecedores | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `fornecedores` | Users can update own fornecedores | UPDATE | public | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `fornecedores` | Users can delete own fornecedores | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `contas_pagar` | Users can view own contas_pagar | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `contas_pagar` | Users can insert own contas_pagar | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `contas_pagar` | Users can update own contas_pagar | UPDATE | public | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `contas_pagar` | Users can delete own contas_pagar | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `contas_receber` | Users can view own contas_receber | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `contas_receber` | Users can insert own contas_receber | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `contas_receber` | Users can update own contas_receber | UPDATE | public | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `contas_receber` | Users can delete own contas_receber | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `categorias` | Users can view own categorias | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `categorias` | Users can insert own categorias | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `categorias` | Users can update own categorias | UPDATE | public | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `categorias` | Users can delete own categorias | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `transacoes_bancarias` | Financeiro+ can manage transacoes | ALL | public | permissive | `public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[])` |  |
| `solicitacoes_aprovacao` | Operacional+ can insert solicitacoes_aprovacao | INSERT | public | permissive |  | `public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role])` |
| `solicitacoes_aprovacao` | Financeiro+ can update solicitacoes_aprovacao | UPDATE | public | permissive | `public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])` |  |
| `bitrix_sync_logs` | Authenticated users can view sync logs | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `bitrix_field_mappings` | Authenticated users can view field mappings | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `bitrix_oauth_tokens` | Admin can manage oauth tokens | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `push_subscriptions` | Users can view their own push subscriptions | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `push_subscriptions` | Users can create their own push subscriptions | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `push_subscriptions` | Users can update their own push subscriptions | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `push_subscriptions` | Users can delete their own push subscriptions | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `expert_conversations` | Users can view own conversations | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `expert_conversations` | Users can create own conversations | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `expert_conversations` | Users can update own conversations | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `expert_conversations` | Users can delete own conversations | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `expert_messages` | Users can view messages from own conversations | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM public.expert_conversations WHERE id = expert_messages.conversation_id AND user_id = auth.uid() )` |  |
| `expert_messages` | Users can insert messages to own conversations | INSERT | public | permissive |  | `EXISTS ( SELECT 1 FROM public.expert_conversations WHERE id = expert_messages.conversation_id AND user_id = auth.uid() )` |
| `expert_messages` | Users can update messages in own conversations | UPDATE | public | permissive | `EXISTS ( SELECT 1 FROM public.expert_conversations WHERE id = expert_messages.conversation_id AND user_id = auth.uid() )` |  |
| `bitrix_webhook_events` | Admins can manage webhook events | ALL | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `open_finance_consents` | Users can view their own consents | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `open_finance_consents` | Users can create their own consents | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `open_finance_consents` | Users can update their own consents | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `password_reset_requests` | Admins podem ver todas solicitações | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `password_reset_requests` | Admins podem atualizar solicitações | UPDATE | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `password_reset_requests` | Admins podem deletar solicitações | DELETE | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `allowed_ips` | Usuários podem ver seus próprios IPs | SELECT | public | permissive | `auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)` |  |
| `allowed_ips` | Admins podem gerenciar IPs | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `login_attempts` | Admins podem ver tentativas de login | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `user_sessions` | Users can view own sessions | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_sessions` | Users can delete own sessions | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `permissions` | Authenticated can view permissions | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `permissions` | Admins can manage permissions | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `role_permissions` | Authenticated can view role_permissions | SELECT | public | permissive | `auth.uid() IS NOT NULL` |  |
| `security_alerts` | Admins can view security alerts | SELECT | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `security_alerts` | Admins can update security alerts | UPDATE | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `new_device_alerts` | Users can view their own alerts | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `new_device_alerts` | Users can insert their own alerts | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `new_device_alerts` | Users can update their own alerts | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `webauthn_credentials` | Users can view their own webauthn credentials | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `webauthn_credentials` | Users can insert their own webauthn credentials | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `webauthn_credentials` | Users can update their own webauthn credentials | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `webauthn_credentials` | Users can delete their own webauthn credentials | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `allowed_countries` | Admins podem gerenciar países | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `recomendacoes_metas_ia` | Sistema pode inserir recomendações | INSERT | public | permissive |  | `auth.uid() IS NOT NULL` |
| `security_settings` | Admins can insert security settings | INSERT | authenticated | permissive |  | `public.has_role(auth.uid(), 'admin')` |
| `security_settings` | Admins can delete security settings | DELETE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `user_sessions` | Users can insert own sessions | INSERT | authenticated | permissive |  | `auth.uid() = user_id` |
| `user_sessions` | Users can update own sessions | UPDATE | authenticated | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `password_reset_requests` | Qualquer um pode criar solicitação de reset | INSERT | public | permissive |  | `status = 'pendente' AND user_email IS NOT NULL AND length(trim(user_email)) >= 5 AND position('@' in user_email) > 1` |
| `rate_limit_logs` | Admins can update rate limit logs | UPDATE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `rate_limit_logs` | Admins can delete rate limit logs | DELETE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `security_settings` | Admins podem ver configurações | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `security_settings` | Admins podem atualizar configurações | UPDATE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `historico_relatorios` | Users can view own report history or elevated | SELECT | authenticated | permissive | `public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) OR EXISTS ( SELECT 1 FROM public.relatorios_agendados ra WHERE ra.id = historico_relatorios.relatorio_agendado_id AND ra.created_by = auth.uid() )` |  |
| `historico_relatorios` | Users can insert own report history or elevated | INSERT | authenticated | permissive |  | `public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) OR EXISTS ( SELECT 1 FROM public.relatorios_agendados ra WHERE ra.id = historico_relatorios.relatorio_agendado_id AND ra.created_by = auth.uid() )` |
| `portal_cliente_acessos` | Financeiro e admin podem ver acessos | SELECT | authenticated | permissive | `public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])` |  |
| `relatorios_agendados` | Users can create scheduled reports | INSERT | authenticated | permissive |  | `created_by = auth.uid()` |
| `login_attempts` | Usuários podem registrar próprias tentativas | INSERT | authenticated | permissive |  | `user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())` |
| `portal_cliente_acessos` | Autenticados podem registrar acessos | INSERT | authenticated | permissive |  | `token_id IS NOT NULL AND acao IS NOT NULL AND length(trim(acao)) > 0` |
| `allowed_countries` | Autenticados podem ver allowed_countries | SELECT | authenticated | permissive | `true` |  |
| `transacoes_bancarias` | Financeiro+ podem ver transacoes_bancarias | SELECT | authenticated | permissive | `public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])` |  |
| `conciliacoes_parciais` | Financeiro+ podem ver conciliacoes_parciais | SELECT | authenticated | permissive | `public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])` |  |
| `conciliacoes_parciais` | Financeiro+ podem inserir conciliacoes_parciais | INSERT | authenticated | permissive |  | `public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])` |
| `solicitacoes_aprovacao` | Solicitações visíveis ao solicitante ou financeiro+ | SELECT | authenticated | permissive | `solicitado_por = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])` |  |
| `security_alerts` | Admin pode inserir security_alerts | INSERT | authenticated | permissive |  | `public.has_role(auth.uid(), 'admin'::public.app_role)` |
| `feedback_conciliacao_ia` | Usuário vê próprio feedback | SELECT | authenticated | permissive | `created_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])` |  |
| `feedback_conciliacao_ia` | Financeiro+ podem inserir feedback | INSERT | authenticated | permissive |  | `public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])` |
| `asaas_payments` | Service role full access asaas_payments | ALL | service_role | permissive | `true` | `true` |
| `asaas_customers` | Service role full access asaas_customers | ALL | service_role | permissive | `true` | `true` |
| `bling_tokens` | Admins can manage bling tokens | ALL | authenticated | permissive | `public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])` | `public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])` |
| `bling_sync_logs` | Admins and financeiro can view bling sync logs | SELECT | authenticated | permissive | `public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role])` |  |
| `bling_sync_logs` | Admins and financeiro can insert bling sync logs | INSERT | authenticated | permissive |  | `public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])` |
| `bling_webhook_events` | Admins can view bling webhook events | SELECT | authenticated | permissive | `public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])` |  |
| `formas_pagamento` | Auth users can read formas_pagamento | SELECT | authenticated | permissive | `true` |  |
| `categorias` | Auth users can read categorias | SELECT | authenticated | permissive | `auth.uid() IS NOT NULL` |  |
| `pix_templates` | Authenticated users can insert pix_templates | INSERT | authenticated | permissive |  | `auth.uid() = created_by` |
| `webhooks_log` | Admin financeiro can read webhooks_log | SELECT | authenticated | permissive | `has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])` |  |
| `benchmarks_setoriais` | Benchmarks visíveis para autenticados | SELECT | authenticated | permissive | `true` |  |
| `benchmarks_setoriais` | Admins gerenciam benchmarks | ALL | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `rate_limit_logs` | Authenticated users can insert rate limit logs | INSERT | authenticated | permissive |  | `auth.uid() IS NOT NULL` |
| `storage.objects` | Service role can insert tax reports | INSERT | service_role | permissive |  | `bucket_id = 'relatorios-tributarios'` |
| `edge_function_logs` | Admins podem visualizar logs de edge functions | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `edge_function_logs` | Service role pode inserir logs | INSERT | service_role | permissive |  | `true` |
| `cnpja_cache` | Admins podem ver cache CNPJá | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `convites_contador` | Usuario cria proprio convite | INSERT | authenticated | permissive |  | `created_by = auth.uid()` |
| `verificacoes_conformidade` | Service role pode inserir verificacoes | INSERT | service_role | permissive |  | `true` |
| `verificacoes_conformidade` | Service role pode atualizar verificacoes | UPDATE | service_role | permissive | `true` | `true` |
| `push_subscriptions` | Usuários veem suas subscriptions | SELECT | authenticated | permissive | `auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')` |  |
| `push_subscriptions` | Usuários criam suas subscriptions | INSERT | authenticated | permissive |  | `auth.uid() = user_id` |
| `push_subscriptions` | Usuários atualizam suas subscriptions | UPDATE | authenticated | permissive | `auth.uid() = user_id` |  |
| `push_subscriptions` | Usuários deletam suas subscriptions | DELETE | authenticated | permissive | `auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')` |  |
| `notas_fiscais_ocr` | Usuários autenticados criam NFs OCR | INSERT | authenticated | permissive |  | `auth.uid() = criado_por` |
| `resumos_executivos_semanais` | Service role gerencia resumos executivos | ALL | service_role | permissive | `true` | `true` |
| `storage.objects` | Usuários autenticados fazem upload de NFs | INSERT | authenticated | permissive |  | `bucket_id = 'notas-fiscais-upload' AND auth.uid()::text = (storage.foldername(name))[1]` |
| `solicitacoes_lgpd` | Usuários criam suas próprias solicitações | INSERT | authenticated | permissive |  | `user_id = auth.uid()` |
| `user_onboarding_progress` | Usuário vê seu próprio progresso | SELECT | authenticated | permissive | `auth.uid() = user_id` |  |
| `user_onboarding_progress` | Usuário insere seu próprio progresso | INSERT | authenticated | permissive |  | `auth.uid() = user_id` |
| `user_onboarding_progress` | Usuário atualiza seu próprio progresso | UPDATE | authenticated | permissive | `auth.uid() = user_id` |  |
| `slo_metrics_diarias` | Apenas admins visualizam SLO | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `slo_metrics_diarias` | Service role gerencia SLO | ALL | service_role | permissive | `true` | `true` |
| `sso_role_mappings` | Admins gerenciam role mappings | ALL | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `evidencias_pacotes` | Admins veem pacotes de evidências | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `evidencias_pacotes` | Admins inserem pacotes de evidências | INSERT | authenticated | permissive |  | `public.has_role(auth.uid(), 'admin')` |
| `user_anomalia_preferences` | users select own anomalia prefs | SELECT | authenticated | permissive | `auth.uid() = user_id` |  |
| `user_anomalia_preferences` | users insert own anomalia prefs | INSERT | authenticated | permissive |  | `auth.uid() = user_id` |
| `user_anomalia_preferences` | users update own anomalia prefs | UPDATE | authenticated | permissive | `auth.uid() = user_id` |  |
| `user_anomalia_preferences` | users delete own anomalia prefs | DELETE | authenticated | permissive | `auth.uid() = user_id` |  |
| `sso_sandbox_runs` | Admins read sandbox runs | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `sso_sandbox_runs` | Admins insert sandbox runs | INSERT | authenticated | permissive |  | `public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by` |
| `sso_sandbox_runs` | Admins delete sandbox runs | DELETE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `saved_filters` | saved_filters_insert | INSERT | public | permissive |  | `auth.uid() = user_id AND (created_by IS NULL OR created_by = auth.uid()) AND ( is_shared = false OR ( empresa_id IS NOT NULL AND EXISTS ( SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.empresa_id = saved_filters.empresa_id AND ue.ativo = true ) ) )` |
| `saved_filters` | saved_filters_update | UPDATE | public | permissive | `auth.uid() = COALESCE(created_by, user_id)` | `auth.uid() = COALESCE(created_by, user_id)` |
| `saved_filters` | saved_filters_delete | DELETE | public | permissive | `auth.uid() = COALESCE(created_by, user_id)` |  |
| `saved_filter_subscriptions` | users select own subscriptions | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `saved_filter_subscriptions` | users insert own subscriptions | INSERT | public | permissive |  | `auth.uid() = user_id AND public.can_access_saved_filter(saved_filter_id, auth.uid())` |
| `saved_filter_subscriptions` | users update own subscriptions | UPDATE | public | permissive | `auth.uid() = user_id` | `auth.uid() = user_id AND public.can_access_saved_filter(saved_filter_id, auth.uid())` |
| `saved_filter_subscriptions` | users delete own subscriptions | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `anomalia_detection_runs` | Admins podem visualizar execuções de detecção | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `anomalia_detection_runs` | Admins podem criar execuções de detecção | INSERT | public | permissive |  | `has_role(auth.uid(), 'admin'::app_role)` |
| `anomalia_detection_runs` | Admins podem atualizar execuções de detecção | UPDATE | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `user_active_filters` | own active filters select | SELECT | public | permissive | `user_id = auth.uid()` |  |
| `user_active_filters` | own active filters insert | INSERT | public | permissive |  | `user_id = auth.uid()` |
| `user_active_filters` | own active filters update | UPDATE | public | permissive | `user_id = auth.uid()` | `user_id = auth.uid()` |
| `user_active_filters` | own active filters delete | DELETE | public | permissive | `user_id = auth.uid()` |  |
| `scim_setup_checklist` | Admins can view scim checklist | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `scim_setup_checklist` | Admins can insert scim checklist | INSERT | authenticated | permissive |  | `public.has_role(auth.uid(), 'admin') AND user_id = auth.uid()` |
| `scim_setup_checklist` | Admins can update scim checklist | UPDATE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `scim_setup_checklist` | Admins can delete scim checklist | DELETE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `sso_user_groups` | Users view own SSO groups | SELECT | authenticated | permissive | `auth.uid() = user_id` |  |
| `sso_user_groups` | Admins view all SSO groups | SELECT | authenticated | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `sso_user_groups` | Admins manage SSO groups | ALL | authenticated | permissive | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| `anomalia_toast_eventos` | Users view own toast eventos | SELECT | authenticated | permissive | `user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')` |  |
| `anomalia_toast_eventos` | Users insert own toast eventos | INSERT | authenticated | permissive |  | `user_id = auth.uid()` |
| `anomalia_toast_eventos` | Users delete own toast eventos | DELETE | authenticated | permissive | `user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')` |  |
| `notification_history` | Usuários veem seu próprio histórico | SELECT | authenticated | permissive | `auth.uid() = user_id` |  |
| `notification_history` | Usuários marcam seu próprio histórico como lido | UPDATE | authenticated | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `notification_history` | Sistema insere via service role | INSERT | authenticated | permissive |  | `false` |
| `user_demonstrativo_preferences` | Users can view their own demonstrativo preferences | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_demonstrativo_preferences` | Users can insert their own demonstrativo preferences | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `user_demonstrativo_preferences` | Users can update their own demonstrativo preferences | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `execucoes_regua_cobranca` | Users can view their billing executions | SELECT | public | permissive | `true` |  |
| `logs_baixa_automatica` | Users can view their write-off logs | SELECT | public | permissive | `true` |  |
| `user_filter_presets` | Users can manage their own filter presets | ALL | public | permissive | `auth.uid() = user_id` |  |
| `logs_conciliacao_retroativa` | Users can view logs | SELECT | public | permissive | `true` |  |
| `logs_conciliacao_retroativa` | Users can insert logs | INSERT | public | permissive |  | `auth.uid() IS NOT NULL` |
| `divergencias_conciliacao` | Users can view divergencias | SELECT | public | permissive | `true` |  |
| `divergencias_conciliacao` | Users can update divergencias | UPDATE | public | permissive | `true` |  |
| `elisao_regras_creditos` | Everyone can view tax rules | SELECT | public | permissive | `true` |  |
| `elisao_alertas` | Users can view alerts for their companies | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM public.user_empresas WHERE empresa_id = elisao_alertas.empresa_id AND user_id = auth.uid() )` |  |
| `regua_cobranca_status` | Usuários podem ver status da régua de sua empresa | SELECT | public | permissive | `auth.uid() IN (SELECT user_id FROM public.user_empresas WHERE empresa_id = regua_cobranca_status.empresa_id)` |  |
| `asaas_sync_queue` | Permitir leitura da fila para autenticados | SELECT | authenticated | permissive | `true` |  |
| `bloqueios_duplicidade` | Empresas podem ver seus bloqueios | SELECT | public | permissive | `empresa_id IN (SELECT id FROM public.empresas WHERE ativo = true)` |  |
| `configuracoes_duplicidade` | Empresas podem gerenciar suas configuracoes de duplicidade | ALL | public | permissive | `empresa_id IN (SELECT id FROM public.empresas WHERE ativo = true)` |  |
| `regras_roteamento_financeiro` | Users can view their company routing rules | SELECT | public | permissive | `EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id)` |  |
| `regras_roteamento_financeiro` | Users can manage their company routing rules | ALL | public | permissive | `EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id)` |  |
| `historico_cobrancas_boletos` | Users can view boleto history | SELECT | public | permissive | `EXISTS (SELECT 1 FROM public.boletos b JOIN public.empresas e ON b.empresa_id = e.id WHERE b.id = boleto_id)` |  |
| `regras_conciliacao` | Users can view their company's rules | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id AND user_empresas.user_id = auth.uid() )` |  |
| `regras_conciliacao` | Users can insert rules for their company | INSERT | public | permissive |  | `EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_empresas.empresa_id = empresa_id AND user_empresas.user_id = auth.uid() )` |
| `regras_conciliacao` | Users can update rules for their company | UPDATE | public | permissive | `EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id AND user_empresas.user_id = auth.uid() )` |  |
| `regras_conciliacao` | Users can delete rules for their company | DELETE | public | permissive | `EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id AND user_empresas.user_id = auth.uid() )` |  |
| `budgets` | Users can view budgets of their companies | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_id = auth.uid() AND empresa_id = budgets.company_id ) OR user_id = auth.uid()` |  |
| `budgets` | Users can insert budgets | INSERT | public | permissive |  | `EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_id = auth.uid() AND empresa_id = budgets.company_id ) OR user_id = auth.uid()` |
| `budgets` | Users can update budgets | UPDATE | public | permissive | `EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_id = auth.uid() AND empresa_id = budgets.company_id ) OR user_id = auth.uid()` |  |
| `budgets` | Users can delete budgets | DELETE | public | permissive | `EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_id = auth.uid() AND empresa_id = budgets.company_id ) OR user_id = auth.uid()` |  |
| `budgets` | Users can view their company budgets | SELECT | public | permissive | `company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid())` |  |
| `budgets` | Users can insert company budgets | INSERT | public | permissive |  | `company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid())` |
| `budgets` | Users can update company budgets | UPDATE | public | permissive | `company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid())` |  |
| `budgets` | Users can delete company budgets | DELETE | public | permissive | `company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid())` |  |
| `api_keys` | Users can view their own company api keys | SELECT | public | permissive | `auth.uid() IN ( SELECT user_id FROM public.user_empresas WHERE empresa_id = public.api_keys.empresa_id )` |  |
| `api_keys` | Admins can manage api keys | ALL | public | permissive | `EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_id = auth.uid() AND empresa_id = public.api_keys.empresa_id AND role = 'admin' )` |  |
| `planos_acao` | Users can manage their own action plans | ALL | public | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `kpis_operacionais` | Users can manage their own operational KPIs | ALL | public | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `pedidos_compra` | Users can view their own purchase orders | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `pedidos_compra` | Users can create their own purchase orders | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `pedidos_compra` | Users can update their own purchase orders | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `pedidos_compra` | Users can delete their own purchase orders | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `itens_pedido_compra` | Users can view items of their purchase orders | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM public.pedidos_compra WHERE pedidos_compra.id = itens_pedido_compra.pedido_id AND pedidos_compra.user_id = auth.uid() )` |  |
| `itens_pedido_compra` | Users can insert items to their purchase orders | INSERT | public | permissive |  | `EXISTS ( SELECT 1 FROM public.pedidos_compra WHERE pedidos_compra.id = itens_pedido_compra.pedido_id AND pedidos_compra.user_id = auth.uid() )` |
| `whatsapp_conversas` | Usuários podem ver conversas de seus clientes | SELECT | public | permissive | `true` |  |
| `whatsapp_conversas` | Usuários podem inserir mensagens | INSERT | public | permissive |  | `true` |
| `fluxos_aprovacao_niveis` | Users can view their own workflow levels | SELECT | public | permissive | `auth.uid() = empresa_id` |  |
| `fluxos_aprovacao_niveis` | Admins can manage workflow levels | ALL | public | permissive | `auth.uid() = empresa_id` |  |
| `aprovacao_comentarios` | Users can view comments on their requests or if they are approvers | SELECT | public | permissive | `true` |  |
| `aprovacao_comentarios` | Users can post comments | INSERT | public | permissive |  | `auth.uid() = usuario_id` |
| `glossario_tributario` | Anyone can view glossary | SELECT | public | permissive | `true` |  |
| `tax_audit_trail` | Users can view audit trail of their companies | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_empresas.empresa_id = tax_audit_trail.empresa_id AND user_empresas.user_id = auth.uid() )` |  |
| `tax_audit_trail` | Users can insert audit trail entries | INSERT | public | permissive |  | `EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_empresas.empresa_id = tax_audit_trail.empresa_id AND user_empresas.user_id = auth.uid() )` |
| `divergencias_conciliacao` | Users can view discrepancies | SELECT | authenticated | permissive | `true` |  |
| `regras_conciliacao` | Users can view rules | SELECT | authenticated | permissive | `true` |  |
| `configuracoes_duplicidade` | config_dup_auth_select | SELECT | authenticated | permissive | `true` |  |
| `divergencias_conciliacao` | Users can manage their own divergencias | ALL | authenticated | permissive | `true` | `true` |
| `feedback_conciliacao_ia` | Users can manage their own feedback_ia | ALL | authenticated | permissive | `true` | `true` |
| `regras_conciliacao` | Users can manage their own regras_conciliacao | ALL | authenticated | permissive | `true` | `true` |
| `configuracoes_duplicidade` | Users can manage their own configuracoes_duplicidade | ALL | authenticated | permissive | `true` | `true` |
| `contratos` | Users can manage their own contratos | ALL | authenticated | permissive | `true` | `true` |
| `metas_financeiras` | Users can manage their own metas | ALL | authenticated | permissive | `true` | `true` |
| `partidas_contabeis` | Users can manage their own partidas | ALL | authenticated | permissive | `true` | `true` |
| `bloqueios_duplicidade` | Users can manage their own bloqueios | ALL | authenticated | permissive | `true` | `true` |
| `plano_contas` | Users can manage their own plano_contas | ALL | authenticated | permissive | `true` | `true` |
| `transferencias` | Users can manage their own transferencias | ALL | authenticated | permissive | `true` | `true` |
| `bitrix_webhook_events` | Users can manage their own bitrix_events | ALL | authenticated | permissive | `true` | `true` |
| `regimes_tributarios` | Users can manage their own regimes | ALL | authenticated | permissive | `true` | `true` |
| `allowed_countries` | Users can manage allowed_countries | ALL | authenticated | permissive | `true` | `true` |
| `vendedores` | Users can manage their own vendedores | ALL | authenticated | permissive | `true` | `true` |
| `acoes_recomendadas` | Users can manage acoes_recomendadas | ALL | authenticated | permissive | `true` | `true` |
| `parcelas_acordo` | Users can manage parcelas_acordo | ALL | authenticated | permissive | `true` | `true` |
| `alertas_tributarios` | Users can manage their own tax alerts | ALL | authenticated | permissive | `true` | `true` |
| `dispositivos_conhecidos` | Users can manage their own devices | ALL | authenticated | permissive | `true` | `true` |
| `retencoes_fonte` | Users can manage their own retencoes | ALL | authenticated | permissive | `true` | `true` |
| `regras_roteamento_financeiro` | Empresa access for routing | ALL | public | permissive | `true` |  |
| `formas_pagamento` | Empresa access for payment methods | ALL | public | permissive | `true` |  |
| `regras_duplicidade` | Empresa access for duplicate rules | ALL | public | permissive | `true` |  |
| `faturamento_mensal` | Empresa access for faturamento | ALL | public | permissive | `true` |  |
| `folha_pagamento` | Empresa access for folha | ALL | public | permissive | `true` |  |
| `apuracoes_irpj_csll` | Empresa access for apuracoes | ALL | public | permissive | `true` |  |
| `vendedores` | Vendedores visualizáveis por todos da empresa | SELECT | public | permissive | `true` |  |
| `whatsapp_conversas` | Permitir acesso total whatsapp_conversas | ALL | public | permissive | `true` | `true` |
| `historico_cobranca_whatsapp` | Permitir acesso total historico_cobranca_whatsapp | ALL | public | permissive | `true` | `true` |
| `resumos_executivos_semanais` | Permitir acesso total resumos_executivos_semanais | ALL | public | permissive | `true` | `true` |
| `metas_financeiras` | Users can view metas | SELECT | public | permissive | `true` |  |
| `aprovacao_comentarios` | Users can view comments on requests they can see | SELECT | public | permissive | `auth.role() = 'authenticated'` |  |
| `storage.objects` | nfe_xml_service_write | INSERT | service_role | permissive |  | `bucket_id = 'nfe-xml'` |
| `storage.objects` | nfe_xml_service_update | UPDATE | service_role | permissive | `bucket_id = 'nfe-xml'` |  |
| `storage.objects` | nfe_xml_service_delete | DELETE | service_role | permissive | `bucket_id = 'nfe-xml'` |  |
| `storage.objects` | nfe_cert_service_all | ALL | service_role | permissive | `bucket_id = 'nfe-certificados'` | `bucket_id = 'nfe-certificados'` |
| `alertas` | alertas_owner_insert | INSERT | authenticated | permissive |  | `((( SELECT auth.uid() AS uid) = user_id) AND ((empresa_id IS NULL) OR public.empresa_acessivel(empresa_id)))` |
| `alertas` | alertas_owner_update | UPDATE | authenticated | permissive | `(( SELECT auth.uid() AS uid) = user_id)` | `((( SELECT auth.uid() AS uid) = user_id) AND ((empresa_id IS NULL) OR public.empresa_acessivel(empresa_id)))` |
| `alerts_sent` | alerts_sent_tenant_delete | DELETE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM public.alerts a WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id)))) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))` |  |
| `alerts_sent` | alerts_sent_tenant_insert | INSERT | authenticated | permissive |  | `(EXISTS ( SELECT 1 FROM public.alerts a WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id))))` |
| `alerts_sent` | alerts_sent_tenant_select | SELECT | authenticated | permissive | `(EXISTS ( SELECT 1 FROM public.alerts a WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id))))` |  |
| `alerts_sent` | alerts_sent_tenant_update | UPDATE | authenticated | permissive | `(EXISTS ( SELECT 1 FROM public.alerts a WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id))))` | `(EXISTS ( SELECT 1 FROM public.alerts a WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id))))` |
| `aliquotas_interestaduais` | aliq_inter_select_authenticated | SELECT | authenticated | permissive | `true` |  |
| `aliquotas_internas_uf` | aliq_internas_select_authenticated | SELECT | authenticated | permissive | `true` |  |
| `aliquotas_iss_municipal` | aliq_iss_select_authenticated | SELECT | authenticated | permissive | `true` |  |
| `allowed_countries` | Public read | SELECT | authenticated | permissive | `true` |  |
| `asaas_credit_risk_analysis` | credit_risk_select | SELECT | authenticated | permissive | `(EXISTS ( SELECT 1 FROM public.clientes c WHERE ((c.id = asaas_credit_risk_analysis.cliente_id) AND public.empresa_acessivel(c.empresa_id))))` |  |
| `benchmarks_setoriais` | benchmarks_select | SELECT | authenticated | permissive | `true` |  |
| `beneficios_fiscais` | beneficios_select_authenticated | SELECT | authenticated | permissive | `true` |  |
| `bitrix24_activities` | bitrix24_activities_tenant_delete | DELETE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM public.lalamove_orders o WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id)))) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))` |  |
| `bitrix24_activities` | bitrix24_activities_tenant_insert | INSERT | authenticated | permissive |  | `(EXISTS ( SELECT 1 FROM public.lalamove_orders o WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id))))` |
| `bitrix24_activities` | bitrix24_activities_tenant_select | SELECT | authenticated | permissive | `(EXISTS ( SELECT 1 FROM public.lalamove_orders o WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id))))` |  |
| `bitrix24_activities` | bitrix24_activities_tenant_update | UPDATE | authenticated | permissive | `(EXISTS ( SELECT 1 FROM public.lalamove_orders o WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id))))` | `(EXISTS ( SELECT 1 FROM public.lalamove_orders o WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo(o.empresa_id))))` |
| `bitrix_oauth_tokens` | bitrix_oauth_tokens_service_role_only | ALL | service_role | permissive | `true` | `true` |
| `bling_tokens` | bling_tokens_service_role_only | ALL | service_role | permissive | `true` | `true` |
| `ci_security_gate_events` | Service role manages CI security gate events | ALL | service_role | permissive | `true` | `true` |
| `clientes` | clientes_grupo_update | UPDATE | authenticated | permissive | `public.empresa_membro_ativo(empresa_id)` | `public.empresa_membro_ativo(empresa_id)` |
| `cnaes` | cnaes_select_authenticated | SELECT | authenticated | permissive | `true` |  |
| `cnpja_cache` | cnpja_cache_service_role_only | ALL | service_role | permissive | `true` | `true` |
| `elisao_alertas` | elisao_alertas_acesso | ALL | authenticated | permissive | `public.empresa_acessivel(empresa_id)` | `public.empresa_acessivel(empresa_id)` |
| `elisao_creditos_auditoria` | creditos_auditoria_insert | INSERT | authenticated | permissive |  | `public.empresa_acessivel(empresa_id)` |
| `elisao_creditos_auditoria` | creditos_auditoria_select | SELECT | authenticated | permissive | `public.empresa_acessivel(empresa_id)` |  |
| `elisao_regras_creditos` | regras_creditos_leitura | SELECT | authenticated | permissive | `true` |  |
| `elisao_simulacoes_regime` | elisao_sim_regime_acesso | ALL | authenticated | permissive | `public.empresa_acessivel(empresa_id)` | `public.empresa_acessivel(empresa_id)` |
| `elisao_tarefas_acionaveis` | tarefas_elisao_acesso | ALL | authenticated | permissive | `public.empresa_acessivel(empresa_id)` | `public.empresa_acessivel(empresa_id)` |
| `estrategias_elisao` | estrategias_select_authenticated | SELECT | authenticated | permissive | `true` |  |
| `eventos_contabilizacao_log` | eventos_contab_select | SELECT | authenticated | permissive | `public.empresa_acessivel(empresa_id)` |  |
| `execucoes_regua_cobranca` | execucoes_regua_select | SELECT | authenticated | permissive | `public.empresa_acessivel(empresa_id)` |  |
| `faixas_simples_nacional` | faixas_simples_select_authenticated | SELECT | authenticated | permissive | `true` |  |
| `fechamentos_tributarios` | fechamentos_insert | INSERT | authenticated | permissive |  | `public.empresa_acessivel(empresa_id)` |
| `fechamentos_tributarios` | fechamentos_select | SELECT | authenticated | permissive | `public.empresa_acessivel(empresa_id)` |  |
| `fechamentos_tributarios` | fechamentos_update | UPDATE | authenticated | permissive | `public.empresa_acessivel(empresa_id)` | `public.empresa_acessivel(empresa_id)` |
| `glossario_tributario` | glossario_leitura | SELECT | authenticated | permissive | `ativo` |  |
| `incentivos_fiscais` | incentivos_fiscais_acesso | ALL | authenticated | permissive | `public.empresa_acessivel(empresa_id)` | `public.empresa_acessivel(empresa_id)` |
| `integration_secrets` | integration_secrets_no_client_access | ALL | authenticated, anon | restrictive | `false` | `false` |
| `integrity_alerts` | integrity_alerts_service_all | ALL | service_role | permissive | `true` | `true` |
| `itens_lista_iss` | itens_iss_select_authenticated | SELECT | authenticated | permissive | `true` |  |
| `ncms` | ncms_select_authenticated | SELECT | authenticated | permissive | `true` |  |
| `notas_fiscais_ocr` | notas_fiscais_ocr_acesso | ALL | authenticated | permissive | `public.empresa_acessivel(empresa_id)` | `public.empresa_acessivel(empresa_id)` |
| `operacoes_icms` | operacoes_icms_acesso | ALL | authenticated | permissive | `public.empresa_acessivel(empresa_id)` | `public.empresa_acessivel(empresa_id)` |
| `oportunidades_elisao` | oportunidades_elisao_acesso | ALL | authenticated | permissive | `public.empresa_acessivel(empresa_id)` | `public.empresa_acessivel(empresa_id)` |
| `per_dcomp` | per_dcomp_acesso | ALL | authenticated | permissive | `public.empresa_acessivel(empresa_id)` | `public.empresa_acessivel(empresa_id)` |
| `projecoes_reforma` | projecoes_reforma_acesso | ALL | authenticated | permissive | `public.empresa_acessivel(empresa_id)` | `public.empresa_acessivel(empresa_id)` |
| `protocolos_st` | protocolos_st_select_authenticated | SELECT | authenticated | permissive | `true` |  |
| `protocolos_st_ncms` | protocolos_st_ncms_select_authenticated | SELECT | authenticated | permissive | `true` |  |
| `protocolos_st_ufs` | protocolos_st_ufs_select_authenticated | SELECT | authenticated | permissive | `true` |  |
| `regime_decision_cache` | regime_cache_select | SELECT | authenticated | permissive | `public.empresa_acessivel(empresa_id)` |  |
| `regras_contabilizacao_automatica` | regras_contab_select | SELECT | authenticated | permissive | `public.empresa_acessivel(empresa_id)` |  |
| `relatorios_tributarios_agendados` | rel_trib_agend_all | ALL | authenticated | permissive | `public.empresa_acessivel(empresa_id)` | `public.empresa_acessivel(empresa_id)` |
| `simulacoes` | simulacoes_acesso | ALL | authenticated | permissive | `public.empresa_acessivel(empresa_id)` | `public.empresa_acessivel(empresa_id)` |
| `solicitacoes_lgpd` | lgpd_owner_insert | INSERT | authenticated | permissive |  | `((user_id = ( SELECT auth.uid() AS uid)) AND ((empresa_id IS NULL) OR public.empresa_acessivel(empresa_id)))` |
| `solicitacoes_lgpd` | lgpd_scoped_select | SELECT | authenticated | permissive | `((user_id = ( SELECT auth.uid() AS uid)) OR (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (empresa_id IS NOT NULL) AND public.empresa_membro_ativo(empresa_id)))` |  |
| … +520 linhas — lista completa em `context.json` | | | | | | |

## C. Restrições de dados (obrigatório / único / default / CHECK / FK / calculada)

| Tabela | Coluna | Regra |
|---|---|---|
| `clientes` | `id` | PK; default uuid_generate_v4() |
| `clientes` | `cpf_cnpj` | único |
| `clientes` | `tipo` | default 'PF' |
| `clientes` | `user_id` | FK → users.id ON DELETE CASCADE |
| `clientes` | `created_at` | default NOW() |
| `clientes` | `updated_at` | default NOW() |
| `clientes` | `limite_credito` | default 0 |
| `clientes` | `ativo` | default true |
| `clientes` | `(tabela)` | constraint clientes_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['PF'::character varying, 'PJ'::character varying])::text[]))) NOT VALID |
| `fornecedores` | `id` | PK; default uuid_generate_v4() |
| `fornecedores` | `razao_social` | obrigatório |
| `fornecedores` | `cnpj` | único |
| `fornecedores` | `user_id` | FK → users.id ON DELETE CASCADE |
| `fornecedores` | `created_at` | default NOW() |
| `fornecedores` | `updated_at` | default NOW() |
| `fornecedores` | `ativo` | default true |
| `fornecedores` | `empresa_id` | FK → empresas.id |
| `contas_pagar` | `id` | PK; default uuid_generate_v4() |
| `contas_pagar` | `descricao` | obrigatório |
| `contas_pagar` | `valor` | obrigatório |
| `contas_pagar` | `data_vencimento` | obrigatório |
| `contas_pagar` | `status` | default 'pendente' |
| `contas_pagar` | `fornecedor_id` | FK → fornecedores.id ON DELETE SET NULL |
| `contas_pagar` | `user_id` | FK → users.id ON DELETE CASCADE |
| `contas_pagar` | `created_at` | default NOW() |
| `contas_pagar` | `updated_at` | default NOW() |
| `contas_pagar` | `empresa_id` | FK → empresas.id ON DELETE CASCADE |
| `contas_pagar` | `categoria_id` | FK → categorias.id ON DELETE SET NULL |
| `contas_pagar` | `juros` | default 0 |
| `contas_pagar` | `multa` | default 0 |
| `contas_pagar` | `desconto` | default 0 |
| `contas_pagar` | `recorrente` | default false |
| `contas_pagar` | `metadata` | default '{}'::jsonb |
| `contas_pagar` | `aprovado_por` | FK → users.id |
| `contas_pagar` | `tags` | default '{}'::text[] |
| `contas_pagar` | `(tabela)` | constraint contas_pagar_plano_conta_id_fkey FOREIGN KEY (plano_conta_id) REFERENCES public.plano_contas(id) |
| `contas_pagar` | `(tabela)` | constraint contas_pagar_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE |
| `contas_pagar` | `(tabela)` | constraint contas_pagar_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL |
| `contas_pagar` | `(tabela)` | constraint contas_pagar_valor_check CHECK ((valor >= (0)::numeric)) NOT VALID |
| `contas_pagar` | `(tabela)` | constraint chk_contas_pagar_status CHECK ((status)::text = ANY (ARRAY['pendente','pago','vencido','cancelado','parcial']::text[])) NOT VALID |
| `contas_receber` | `id` | PK; default uuid_generate_v4() |
| `contas_receber` | `descricao` | obrigatório |
| `contas_receber` | `valor` | obrigatório |
| `contas_receber` | `data_vencimento` | obrigatório |
| `contas_receber` | `status` | default 'pendente' |
| `contas_receber` | `cliente_id` | FK → clientes.id ON DELETE SET NULL |
| `contas_receber` | `user_id` | FK → users.id ON DELETE CASCADE |
| `contas_receber` | `created_at` | default NOW() |
| `contas_receber` | `updated_at` | default NOW() |
| `contas_receber` | `empresa_id` | FK → empresas.id ON DELETE CASCADE |
| `contas_receber` | `categoria_id` | FK → categorias.id ON DELETE SET NULL |
| `contas_receber` | `juros` | default 0 |
| `contas_receber` | `multa` | default 0 |
| `contas_receber` | `desconto` | default 0 |
| `contas_receber` | `recorrente` | default false |
| `contas_receber` | `metadata` | default '{}'::jsonb |
| `contas_receber` | `valor_desconto` | default 0 |
| `contas_receber` | `data_emissao` | default CURRENT_DATE |
| `contas_receber` | `(tabela)` | constraint contas_receber_plano_conta_id_fkey FOREIGN KEY (plano_conta_id) REFERENCES public.plano_contas(id) |
| `contas_receber` | `(tabela)` | constraint contas_receber_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE |
| `contas_receber` | `(tabela)` | constraint contas_receber_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL |
| `contas_receber` | `(tabela)` | constraint contas_receber_valor_check CHECK ((valor >= (0)::numeric)) NOT VALID |
| `contas_receber` | `(tabela)` | constraint contas_receber_status_check CHECK (status IN ( 'pendente', 'recebido', 'pago', 'vencido', 'cancelado', 'parcial', 'atrasado', 'em_acordo' )) |
| `contas_receber` | `(tabela)` | constraint contas_receber_frequencia_recorrencia_check CHECK (frequencia_recorrencia IS NULL OR frequencia_recorrencia IN ('semanal','quinzenal','mensal','bimestral','trimestral','semestral','anual')) |
| `categorias` | `id` | PK; default gen_random_uuid() |
| `categorias` | `nome` | obrigatório |
| `categorias` | `tipo` | obrigatório |
| `categorias` | `ativo` | default true |
| `categorias` | `empresa_id` | FK → empresas.id |
| `categorias` | `created_at` | default now() |
| `categorias` | `updated_at` | default now() |
| `categorias` | `plano_conta_id` | FK → plano_contas.id |
| `categorias` | `(tabela)` | constraint categorias_plano_conta_id_fkey FOREIGN KEY (plano_conta_id) REFERENCES public.plano_contas(id) |
| `categorias` | `(tabela)` | constraint categorias_tipo_check CHECK ((tipo = ANY (ARRAY['receita'::text, 'despesa'::text]))) NOT VALID |
| `saved_filters` | `id` | PK; default gen_random_uuid() |
| `saved_filters` | `user_id` | obrigatório |
| `saved_filters` | `entity_type` | obrigatório |
| `saved_filters` | `name` | obrigatório |
| `saved_filters` | `filters` | default '{}'::jsonb |
| `saved_filters` | `is_default` | default false |
| `saved_filters` | `is_shared` | default false |
| `saved_filters` | `shared_with_roles` | default '{}'::text[] |
| `saved_filters` | `created_at` | default now() |
| `saved_filters` | `updated_at` | default now() |
| `saved_filters` | `(tabela)` | constraint saved_filters_unique UNIQUE (user_id, entity_type, name) |
| `saved_filters` | `(tabela)` | constraint saved_filters_shared_requires_empresa CHECK (((NOT is_shared) OR (empresa_id IS NOT NULL))) NOT VALID |
| `profiles` | `id` | PK; FK → users.id ON DELETE CASCADE |
| `profiles` | `role` | default 'visualizador' |
| `profiles` | `created_at` | default timezone('utc'::text |
| `profiles` | `updated_at` | default timezone('utc'::text |
| `user_roles` | `id` | default gen_random_uuid() |
| `user_roles` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `user_roles` | `role` | default 'viewer' |
| `user_roles` | `assigned_at` | default now() |
| `user_roles` | `is_active` | default true |
| `user_roles` | `created_at` | default now() |
| `user_roles` | `updated_at` | default now() |
| `user_roles` | `(tabela)` | CONSTRAINT user_roles_pkey PRIMARY KEY (id) |
| `user_roles` | `(tabela)` | constraint user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE |
| `empresas` | `id` | PK; default gen_random_uuid() |
| `empresas` | `user_id` | default auth.uid() |
| `empresas` | `razao_social` | obrigatório |
| `empresas` | `ativo` | default true |
| `empresas` | `created_at` | default now() |
| `empresas` | `sigla` | default 'EMP' |
| `empresas` | `cor_hex` | default 'chart-1' |
| `empresas` | `is_padrao` | default false |
| `empresas` | `(tabela)` | constraint empresas_aliquota_rat_range CHECK (((aliquota_rat IS NULL) OR ((aliquota_rat >= (0)::numeric) AND (aliquota_rat <= 0.06)))) NOT VALID |
| `empresas` | `(tabela)` | constraint empresas_aliquota_terceiros_range CHECK (((aliquota_terceiros IS NULL) OR ((aliquota_terceiros >= (0)::numeric) AND (aliquota_terceiros <= 0.08)))) NOT VALID |
| `empresas` | `(tabela)` | constraint empresas_cnae_principal_formato CHECK (((cnae_principal IS NULL) OR ((length(regexp_replace(cnae_principal, '\D'::text, ''::text, 'g'::text)) >= 2) AND (length(regexp_replace(cnae_principal, '\D'::text, ''::text, 'g'::text)) <= 7)))) NOT VALID |
| `empresas` | `(tabela)` | constraint empresas_regime_tributario_check CHECK (((regime_tributario IS NULL) OR (regime_tributario = ANY (ARRAY['mei'::text, 'simples_nacional'::text, 'lucro_presumido'::text, 'lucro_real'::text, 'arbitrado'::text])))) NOT VALID |
| `contas_bancarias` | `id` | PK; default gen_random_uuid() |
| `contas_bancarias` | `saldo_inicial` | default 0 |
| `contas_bancarias` | `ativo` | default true |
| `contas_bancarias` | `empresa_id` | FK → empresas.id ON DELETE CASCADE |
| `contas_bancarias` | `created_at` | default now() |
| `contas_bancarias` | `configuracoes_conciliacao` | default '{}'::jsonb |
| `contas_bancarias` | `saldo_atual` | default 0 |
| `contas_bancarias` | `tipo_conta` | default 'corrente' |
| `contas_bancarias` | `codigo_banco` | default '000' |
| `contas_bancarias` | `saldo_disponivel` | CALCULADA = saldo_atual |
| `contas_bancarias` | `updated_at` | default now() |
| `contas_bancarias` | `(tabela)` | constraint contas_bancarias_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE |
| `centros_custo` | `id` | PK; default gen_random_uuid() |
| `centros_custo` | `nome` | obrigatório |
| `centros_custo` | `ativo` | default TRUE |
| `centros_custo` | `user_id` | FK → users.id |
| `centros_custo` | `created_at` | default NOW() |
| `centros_custo` | `orcamento_previsto` | default 0 |
| `centros_custo` | `orcamento_realizado` | default 0 |
| `centros_custo` | `parent_id` | FK → centros_custo.id ON DELETE SET NULL |
| `centros_custo` | `updated_at` | default now() |
| `transacoes_bancarias` | `id` | PK; default gen_random_uuid() |
| `transacoes_bancarias` | `data` | obrigatório |
| `transacoes_bancarias` | `descricao` | obrigatório |
| `transacoes_bancarias` | `valor` | obrigatório |
| `transacoes_bancarias` | `tipo` | obrigatório |
| `transacoes_bancarias` | `status` | default 'pendente' |
| `transacoes_bancarias` | `created_at` | default now() |
| `transacoes_bancarias` | `conciliada` | default false |
| `transacoes_bancarias` | `saldo` | default 0 |
| `transacoes_bancarias` | `regra_id` | FK → regras_conciliacao.id |
| `transacoes_bancarias` | `confirmado_por` | FK → users.id |
| `transacoes_bancarias` | `conciliacao_parcial` | default false |
| `notas_fiscais` | `id` | PK; default gen_random_uuid() |
| `notas_fiscais` | `empresa_id` | FK → empresas.id ON DELETE CASCADE |
| `notas_fiscais` | `chave_acesso` | único |
| `notas_fiscais` | `valor_total` | default 0 |
| `notas_fiscais` | `valor_icms` | default 0 |
| `notas_fiscais` | `status` | default 'emitida' |
| `notas_fiscais` | `data_emissao` | default now() |
| `notas_fiscais` | `created_at` | default now() |
| `notas_fiscais` | `valor_produtos` | default 0 |
| `notas_fiscais` | `valor_desconto` | default 0 |
| `notas_fiscais` | `valor_frete` | default 0 |
| `alertas` | `id` | PK; default gen_random_uuid() |
| `alertas` | `user_id` | default auth.uid() |
| `alertas` | `tipo` | obrigatório |
| `alertas` | `titulo` | obrigatório |
| `alertas` | `prioridade` | default 'media' |
| `alertas` | `lido` | default false |
| `alertas` | `created_at` | default now() |
| `alertas` | `empresa_id` | FK → empresas.id ON DELETE CASCADE |
| `alertas` | `status` | default 'pendente' |
| `alertas` | `metadata` | default '{}'::jsonb |
| `alertas` | `(tabela)` | constraint alertas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE |
| `configuracoes_aprovacao` | `id` | PK; default gen_random_uuid() |
| `configuracoes_aprovacao` | `empresa_id` | FK → empresas.id |
| `configuracoes_aprovacao` | `ativo` | default true |
| `configuracoes_aprovacao` | `created_at` | default now() |
| `configuracoes_aprovacao` | `valor_minimo_aprovacao` | default 0 |
| `configuracoes_aprovacao` | `aprovadores_obrigatorios` | default 1 |
| `configuracoes_aprovacao` | `updated_at` | default now() |
| `solicitacoes_aprovacao` | `id` | PK; default gen_random_uuid() |
| `solicitacoes_aprovacao` | `user_id` | default auth.uid() |
| `solicitacoes_aprovacao` | `entidade_tipo` | default 'conta_pagar' |
| `solicitacoes_aprovacao` | `status` | default 'pendente' |
| `solicitacoes_aprovacao` | `created_at` | default now() |
| `solicitacoes_aprovacao` | `aprovado_por` | FK → users.id |
| `solicitacoes_aprovacao` | `conta_pagar_id` | FK → contas_pagar.id |
| `solicitacoes_aprovacao` | `solicitado_por` | FK → users.id |
| `solicitacoes_aprovacao` | `solicitado_em` | default now() |
| `relatorios_agendados` | `id` | PK; default gen_random_uuid() |
| `relatorios_agendados` | `nome` | obrigatório |
| `relatorios_agendados` | `tipo_relatorio` | obrigatório |
| `relatorios_agendados` | `frequencia` | obrigatório |
| `relatorios_agendados` | `hora_execucao` | default '08:00' |
| `relatorios_agendados` | `empresa_id` | FK → empresas.id ON DELETE CASCADE |
| `relatorios_agendados` | `destinatarios` | default '{}' |
| `relatorios_agendados` | `filtros` | default '{}'::jsonb |
| `relatorios_agendados` | `ativo` | default true |
| `relatorios_agendados` | `created_by` | default auth.uid() |
| `relatorios_agendados` | `created_at` | default now() |
| `relatorios_agendados` | `updated_at` | default now() |
| `relatorios_agendados` | `(tabela)` | constraint relatorios_agendados_dia_mes_check CHECK (((dia_mes IS NULL) OR ((dia_mes >= 1) AND (dia_mes <= 31)))) NOT VALID |
| `relatorios_agendados` | `(tabela)` | constraint relatorios_agendados_dia_semana_check CHECK (((dia_semana IS NULL) OR ((dia_semana >= 0) AND (dia_semana <= 6)))) NOT VALID |
| `relatorios_agendados` | `(tabela)` | constraint relatorios_agendados_frequencia_check CHECK ((frequencia = ANY (ARRAY['diario'::text, 'semanal'::text, 'quinzenal'::text, 'mensal'::text, 'trimestral'::text]))) NOT VALID |
| `historico_relatorios` | `id` | PK; default gen_random_uuid() |
| `historico_relatorios` | `relatorio_agendado_id` | obrigatório; FK → relatorios_agendados.id ON DELETE CASCADE |
| `historico_relatorios` | `status` | default 'sucesso' |
| `historico_relatorios` | `duracao_ms` | CHECK duracao_ms IS NULL OR duracao_ms >= 0 |
| `historico_relatorios` | `executado_em` | default now() |
| `historico_relatorios` | `(tabela)` | constraint historico_relatorios_status_check CHECK ((status = ANY (ARRAY['sucesso'::text, 'erro'::text, 'parcial'::text]))) NOT VALID |
| `bitrix_sync_logs` | `id` | PK; default gen_random_uuid() |
| `bitrix_sync_logs` | `empresa_id` | FK → empresas.id |
| `bitrix_sync_logs` | `created_at` | default now() |
| `bitrix_sync_logs` | `registros_processados` | default 0 |
| `bitrix_sync_logs` | `registros_com_erro` | default 0 |
| `bitrix_sync_logs` | `iniciado_em` | default now() |
| `bitrix_field_mappings` | `id` | PK; default gen_random_uuid() |
| `bitrix_field_mappings` | `empresa_id` | FK → empresas.id |
| `bitrix_field_mappings` | `bitrix_field_name` | obrigatório |
| `bitrix_field_mappings` | `internal_field_name` | obrigatório |
| `bitrix_field_mappings` | `entity_type` | obrigatório |
| `bitrix_field_mappings` | `created_at` | default now() |
| `bitrix_field_mappings` | `ativo` | default true |
| `bitrix_field_mappings` | `obrigatorio` | default false |
| `bitrix_oauth_tokens` | `id` | default gen_random_uuid() |
| `bitrix_oauth_tokens` | `access_token` | obrigatório |
| `bitrix_oauth_tokens` | `expires_at` | obrigatório |
| `bitrix_oauth_tokens` | `created_at` | default now() |
| `bitrix_oauth_tokens` | `updated_at` | default now() |
| `bitrix_oauth_tokens` | `(tabela)` | constraint bitrix_oauth_tokens_pkey PRIMARY KEY (id) |
| `boletos` | `id` | PK; default gen_random_uuid() |
| `boletos` | `user_id` | default auth.uid() |
| `boletos` | `valor` | default 0 |
| `boletos` | `status` | default 'emitido' |
| `boletos` | `created_at` | default now() |
| `boletos` | `data_emissao` | default CURRENT_DATE |
| `boletos` | `juros_multa` | default 0 |
| `boletos` | `desconto` | default 0 |
| `boletos` | `rastreio_status` | default '[]'::JSONB |
| `boletos` | `eventos_pagamento` | default '[]'::jsonb |
| `boletos` | `conta_pagar_id` | FK → contas_pagar.id |
| `boletos` | `conta_bancaria_id` | FK → contas_bancarias.id |
| `boletos` | `created_by` | FK → users.id |
| `boletos` | `empresa_id` | FK → empresas.id |
| `boletos` | `updated_at` | default now() |
| `boletos` | `asaas_id` | default '' |
| `boletos` | `external_provider` | default 'none' |
| `boletos` | `(tabela)` | constraint chk_boletos_status CHECK ((status = ANY (ARRAY['pendente'::text, 'enviado'::text, 'pago'::text, 'vencido'::text, 'cancelado'::text]))) NOT VALID |
| `historico_cobranca` | `id` | PK; default gen_random_uuid() |
| `historico_cobranca` | `cliente_id` | FK → clientes.id |
| `historico_cobranca` | `conta_receber_id` | FK → contas_receber.id |
| `historico_cobranca` | `created_at` | default now() |
| `historico_cobranca` | `empresa_id` | FK → empresas.id |
| `push_subscriptions` | `id` | PK; default gen_random_uuid() |
| `push_subscriptions` | `user_id` | obrigatório |
| `push_subscriptions` | `endpoint` | obrigatório |
| `push_subscriptions` | `p256dh` | default '' |
| `push_subscriptions` | `auth` | default '' |
| `push_subscriptions` | `ativo` | default true |
| `push_subscriptions` | `created_at` | default now() |
| `push_subscriptions` | `updated_at` | default now() |
| `push_subscriptions` | `(tabela)` | CONSTRAINT push_subscriptions_unique UNIQUE (user_id, endpoint) |
| `expert_conversations` | `id` | PK; default gen_random_uuid() |
| `expert_conversations` | `user_id` | obrigatório |
| `expert_conversations` | `titulo` | obrigatório |
| `expert_conversations` | `created_at` | default now() |
| `expert_conversations` | `updated_at` | default now() |
| `expert_messages` | `id` | PK; default gen_random_uuid() |
| `expert_messages` | `conversation_id` | FK → expert_conversations.id ON DELETE CASCADE |
| `expert_messages` | `role` | obrigatório |
| `expert_messages` | `content` | obrigatório |
| `expert_messages` | `created_at` | default now() |
| `expert_messages` | `(tabela)` | constraint expert_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text]))) NOT VALID |
| `historico_conciliacao_ia` | `id` | PK; default gen_random_uuid() |
| `historico_conciliacao_ia` | `sessao_id` | FK → sessoes_conciliacao.id |
| `historico_conciliacao_ia` | `created_at` | default now() |
| `historico_conciliacao_ia` | `conta_receber_id` | FK → contas_receber.id |
| `historico_conciliacao_ia` | `aprovado_por` | FK → users.id |
| `historico_conciliacao_ia` | `created_by` | FK → users.id |
| `historico_conciliacao_ia` | `motivos` | default '[]' |
| `feedback_conciliacao_ia` | `id` | PK; default gen_random_uuid() |
| `feedback_conciliacao_ia` | `transacao_id` | FK → transacoes_bancarias.id |
| `feedback_conciliacao_ia` | `user_id` | FK → users.id |
| `feedback_conciliacao_ia` | `acao` | obrigatório |
| `feedback_conciliacao_ia` | `created_at` | default now() |
| `feedback_conciliacao_ia` | `score_original` | default 0 |
| `feedback_conciliacao_ia` | `created_by` | FK → users.id |
| `metas_financeiras` | `id` | PK; default gen_random_uuid() |
| `metas_financeiras` | `empresa_id` | FK → empresas.id |
| `metas_financeiras` | `titulo` | obrigatório |
| `metas_financeiras` | `tipo` | obrigatório |
| `metas_financeiras` | `valor_meta` | obrigatório |
| `metas_financeiras` | `ano` | obrigatório |
| `metas_financeiras` | `mes` | obrigatório |
| `metas_financeiras` | `ativo` | default true |
| `metas_financeiras` | `created_by` | FK → users.id |
| `metas_financeiras` | `created_at` | default now() |
| `metas_financeiras` | `updated_at` | default now() |
| `historico_analises_preditivas` | `id` | PK; default gen_random_uuid() |
| `historico_analises_preditivas` | `insights` | default '[]'::jsonb |
| `historico_analises_preditivas` | `recomendacoes` | default '[]'::jsonb |
| `historico_analises_preditivas` | `created_at` | default now() |
| `historico_score_saude` | `id` | PK; default gen_random_uuid() |
| `historico_score_saude` | `empresa_id` | FK → empresas.id |
| `historico_score_saude` | `score` | obrigatório |
| `historico_score_saude` | `data_calculo` | default now() |
| `historico_score_saude` | `created_at` | default now() |
| … +2275 linhas — lista completa em `context.json` | | |

## D. Automações no banco (triggers e funções — regras que rodam sozinhas)

| Trigger | Quando | Tabela | Executa | Condição |
|---|---|---|---|---|
| update_clientes_updated_at | BEFORE UPDATE | `clientes` | `update_updated_at_column` |  |
| update_fornecedores_updated_at | BEFORE UPDATE | `fornecedores` | `update_updated_at_column` |  |
| update_contas_pagar_updated_at | BEFORE UPDATE | `contas_pagar` | `update_updated_at_column` |  |
| update_contas_receber_updated_at | BEFORE UPDATE | `contas_receber` | `update_updated_at_column` |  |
| update_contas_pagar_status | BEFORE INSERT OR UPDATE | `contas_pagar` | `update_conta_status` |  |
| update_contas_receber_status | BEFORE INSERT OR UPDATE | `contas_receber` | `update_conta_status` |  |
| update_profiles_updated_at | BEFORE UPDATE | `profiles` | `update_updated_at_column` |  |
| update_empresas_updated_at | BEFORE UPDATE | `empresas` | `update_updated_at_column` |  |
| update_contas_bancarias_updated_at | BEFORE UPDATE | `contas_bancarias` | `update_updated_at_column` |  |
| update_centros_custo_updated_at | BEFORE UPDATE | `centros_custo` | `update_updated_at_column` |  |
| update_notas_fiscais_updated_at | BEFORE UPDATE | `notas_fiscais` | `update_updated_at_column` |  |
| update_configuracoes_aprovacao_updated_at | BEFORE UPDATE | `configuracoes_aprovacao` | `update_updated_at_column` |  |
| update_relatorios_agendados_updated_at | BEFORE UPDATE | `relatorios_agendados` | `update_updated_at_column` |  |
| update_bitrix_field_mappings_updated_at | BEFORE UPDATE | `bitrix_field_mappings` | `update_updated_at_column` |  |
| update_bitrix_oauth_tokens_updated_at | BEFORE UPDATE | `bitrix_oauth_tokens` | `update_updated_at_column` |  |
| update_boletos_updated_at | BEFORE UPDATE | `boletos` | `update_updated_at_column` |  |
| on_etapa_cobranca_change | AFTER UPDATE | `contas_receber` | `log_etapa_cobranca_change` |  |
| update_push_subscriptions_updated_at | BEFORE UPDATE | `push_subscriptions` | `update_updated_at_column` |  |
| update_expert_conversations_updated_at | BEFORE UPDATE | `expert_conversations` | `update_updated_at_column` |  |
| update_metas_financeiras_updated_at | BEFORE UPDATE | `metas_financeiras` | `update_updated_at_column` |  |
| update_open_finance_consents_updated_at | BEFORE UPDATE | `open_finance_consents` | `update_updated_at_column` |  |
| update_pagamentos_recorrentes_updated_at | BEFORE UPDATE | `pagamentos_recorrentes` | `update_updated_at_column` |  |
| update_regua_cobranca_updated_at | BEFORE UPDATE | `regua_cobranca` | `update_updated_at_column` |  |
| update_acordos_parcelamento_updated_at | BEFORE UPDATE | `acordos_parcelamento` | `update_updated_at_column` |  |
| update_vendedores_updated_at | BEFORE UPDATE | `vendedores` | `update_updated_at_column` |  |
| update_apuracoes_tributarias_updated_at | BEFORE UPDATE | `apuracoes_tributarias` | `update_updated_at_column` |  |
| update_creditos_tributarios_updated_at | BEFORE UPDATE | `creditos_tributarios` | `update_updated_at_column` |  |
| update_operacoes_tributaveis_updated_at | BEFORE UPDATE | `operacoes_tributaveis` | `update_updated_at_column` |  |
| update_regimes_especiais_empresa_updated_at | BEFORE UPDATE | `regimes_especiais_empresa` | `update_updated_at_column` |  |
| update_apuracoes_irpj_updated_at | BEFORE UPDATE | `apuracoes_irpj_csll` | `update_updated_at_column` |  |
| update_prejuizos_updated_at | BEFORE UPDATE | `prejuizos_fiscais` | `update_updated_at_column` |  |
| update_incentivos_updated_at | BEFORE UPDATE | `incentivos_fiscais` | `update_updated_at_column` |  |
| set_retencoes_updated_at | BEFORE UPDATE | `retencoes_fonte` | `update_updated_at` |  |
| set_darfs_updated_at | BEFORE UPDATE | `darfs` | `update_updated_at` |  |
| set_alertas_tributarios_updated_at | BEFORE UPDATE | `alertas_tributarios` | `update_updated_at` |  |
| set_per_dcomp_updated_at | BEFORE UPDATE | `per_dcomp` | `update_updated_at` |  |
| update_regras_conciliacao_updated_at | BEFORE UPDATE | `regras_conciliacao` | `update_updated_at` |  |
| update_asaas_customers_updated_at | BEFORE UPDATE | `asaas_customers` | `update_updated_at_column` |  |
| update_asaas_payments_updated_at | BEFORE UPDATE | `asaas_payments` | `update_updated_at_column` |  |
| set_bling_tokens_updated_at | BEFORE UPDATE | `bling_tokens` | `update_updated_at` |  |
| update_categorias_updated_at | BEFORE UPDATE | `categorias` | `update_updated_at` |  |
| update_formas_pagamento_updated_at | BEFORE UPDATE | `formas_pagamento` | `update_updated_at` |  |
| update_movimentacoes_updated_at | BEFORE UPDATE | `movimentacoes` | `update_updated_at` |  |
| update_transferencias_updated_at | BEFORE UPDATE | `transferencias` | `update_updated_at` |  |
| update_extrato_bancario_updated_at | BEFORE UPDATE | `extrato_bancario` | `update_updated_at` |  |
| update_conciliacoes_updated_at | BEFORE UPDATE | `conciliacoes` | `update_updated_at` |  |
| update_anexos_financeiros_updated_at | BEFORE UPDATE | `anexos_financeiros` | `update_updated_at` |  |
| update_webhooks_log_updated_at | BEFORE UPDATE | `webhooks_log` | `update_updated_at` |  |
| update_templates_cobranca_updated_at | BEFORE UPDATE | `templates_cobranca` | `update_updated_at` |  |
| update_fila_cobrancas_updated_at | BEFORE UPDATE | `fila_cobrancas` | `update_updated_at` |  |
| update_execucoes_cobranca_updated_at | BEFORE UPDATE | `execucoes_cobranca` | `update_updated_at` |  |
| update_negativacoes_updated_at | BEFORE UPDATE | `negativacoes` | `update_updated_at` |  |
| update_protestos_updated_at | BEFORE UPDATE | `protestos` | `update_updated_at` |  |
| trg_sync_valor_cp | BEFORE INSERT OR UPDATE | `contas_pagar` | `fn_sync_valor_cp` |  |
| trg_sync_valor_cr | BEFORE INSERT OR UPDATE | `contas_receber` | `fn_sync_valor_cr` |  |
| trg_auditoria_contas_pagar | AFTER INSERT OR UPDATE OR DELETE | `contas_pagar` | `fn_auditoria_financeira` |  |
| trg_auditoria_contas_receber | AFTER INSERT OR UPDATE OR DELETE | `contas_receber` | `fn_auditoria_financeira` |  |
| trg_auditoria_contas_bancarias | AFTER INSERT OR UPDATE OR DELETE | `contas_bancarias` | `fn_auditoria_financeira` |  |
| trg_auditoria_movimentacoes | AFTER INSERT OR UPDATE OR DELETE | `movimentacoes` | `fn_auditoria_financeira` |  |
| trg_auditoria_transferencias | AFTER INSERT OR UPDATE OR DELETE | `transferencias` | `fn_auditoria_financeira` |  |
| update_pix_templates_updated_at | BEFORE UPDATE | `pix_templates` | `update_updated_at` |  |
| update_faturamento_mensal_updated_at | BEFORE UPDATE | `faturamento_mensal` | `update_updated_at_column` |  |
| update_folha_pagamento_updated_at | BEFORE UPDATE | `folha_pagamento` | `update_updated_at_column` |  |
| update_regimes_simulados_updated_at | BEFORE UPDATE | `regimes_simulados` | `update_updated_at_column` |  |
| trg_benchmarks_setoriais_updated_at | BEFORE UPDATE | `benchmarks_setoriais` | `update_updated_at_column` |  |
| trg_invalidar_regime_cache | AFTER INSERT OR UPDATE OR DELETE | `apuracoes_tributarias` | `fn_invalidar_regime_cache` |  |
| trg_verif_conf_updated_at | BEFORE UPDATE | `verificacoes_conformidade` | `update_updated_at_column` |  |
| trg_audit_apuracoes_tributarias | AFTER INSERT OR UPDATE OR DELETE | `apuracoes_tributarias` | `fn_audit_tributario` |  |
| trg_audit_regime_decision_cache | AFTER INSERT OR UPDATE OR DELETE | `regime_decision_cache` | `fn_audit_tributario` |  |
| trg_audit_verificacoes_conformidade | AFTER INSERT OR UPDATE OR DELETE | `verificacoes_conformidade` | `fn_audit_tributario` |  |
| trg_audit_relatorios_agendados | AFTER INSERT OR UPDATE OR DELETE | `relatorios_tributarios_agendados` | `fn_audit_tributario` |  |
| trg_audit_fechamentos | AFTER INSERT OR UPDATE OR DELETE | `fechamentos_tributarios` | `fn_audit_tributario` |  |
| trg_push_subs_updated_at | BEFORE UPDATE | `push_subscriptions` | `update_updated_at_column` |  |
| trg_notas_fiscais_ocr_updated_at | BEFORE UPDATE | `notas_fiscais_ocr` | `update_updated_at_column` |  |
| trg_notas_fiscais_ocr_audit | AFTER INSERT OR UPDATE OR DELETE | `notas_fiscais_ocr` | `fn_audit_tributario` |  |
| trg_resumos_executivos_updated_at | BEFORE UPDATE | `resumos_executivos_semanais` | `update_updated_at_column` |  |
| trg_anomalias_updated_at | BEFORE UPDATE | `anomalias_detectadas` | `update_updated_at_column` |  |
| trg_user_onboarding_progress_updated | BEFORE UPDATE | `user_onboarding_progress` | `update_updated_at_column` |  |
| trg_validar_sso_provider | BEFORE INSERT OR UPDATE | `sso_providers` | `fn_validar_sso_provider` |  |
| trg_sso_providers_updated | BEFORE UPDATE | `sso_providers` | `update_updated_at_column` |  |
| trg_lanc_updated | BEFORE UPDATE | `lancamentos_contabeis` | `update_updated_at_column` |  |
| trg_lanc_numero | BEFORE INSERT | `lancamentos_contabeis` | `fn_lanc_numero_sequencial` |  |
| trg_user_empresas_updated | BEFORE UPDATE | `user_empresas` | `update_updated_at_column` |  |
| trigger_saved_filters_updated_at | BEFORE UPDATE | `saved_filters` | `update_updated_at_column` |  |
| trigger_single_default_filter | BEFORE INSERT OR UPDATE OF IS_DEFAULT | `saved_filters` | `ensure_single_default_filter` | `NEW.is_default = true` |
| trg_user_anomalia_prefs_updated | BEFORE UPDATE | `user_anomalia_preferences` | `update_updated_at_column` |  |
| trg_validate_user_anomalia_preferences | BEFORE INSERT OR UPDATE | `user_anomalia_preferences` | `validate_user_anomalia_preferences` |  |
| trg_sfs_updated_at | BEFORE UPDATE | `saved_filter_subscriptions` | `update_updated_at_column` |  |
| trg_audit_lancamentos_contabeis | AFTER INSERT OR UPDATE OR DELETE | `lancamentos_contabeis` | `fn_auditoria_financeira` |  |
| trg_audit_partidas_contabeis | AFTER INSERT OR UPDATE OR DELETE | `partidas_contabeis` | `fn_auditoria_financeira` |  |
| trg_user_active_filters_uat | BEFORE UPDATE | `user_active_filters` | `update_updated_at` |  |
| trg_scim_setup_checklist_updated_at | BEFORE UPDATE | `scim_setup_checklist` | `update_updated_at_column` |  |
| trg_notificar_filtro_compartilhado | AFTER INSERT OR UPDATE OF IS_SHARED, SHARED_WITH_ROLES, EMPRESA_ID | `saved_filters` | `fn_notificar_filtro_compartilhado` |  |
| trg_validate_saved_filter_subscription_rules | BEFORE INSERT OR UPDATE | `saved_filter_subscriptions` | `validate_saved_filter_subscription_rules` |  |
| trg_revoke_orphan_subs_on_saved_filter | AFTER UPDATE OR DELETE | `saved_filters` | `fn_revoke_orphan_saved_filter_subscriptions` |  |
| trg_revoke_orphan_subs_on_user_empresas | AFTER UPDATE OR DELETE | `user_empresas` | `fn_revoke_orphan_saved_filter_subscriptions` |  |
| trg_log_receber_status | AFTER INSERT OR UPDATE OF STATUS | `contas_receber` | `trigger_log_receber_status_change` |  |
| tr_user_filter_presets_updated_at | BEFORE UPDATE | `user_filter_presets` | `handle_updated_at` |  |
| trigger_conciliacao_retroativa_error | AFTER UPDATE | `logs_conciliacao_retroativa` | `handle_conciliacao_retroativa_error` |  |
| update_elisao_simulacoes_updated_at | BEFORE UPDATE | `elisao_simulacoes_regime` | `update_updated_at_column` |  |
| update_elisao_tarefas_updated_at | BEFORE UPDATE | `elisao_tarefas_acionaveis` | `update_updated_at_column` |  |
| tr_registrar_decisao_elisao | BEFORE UPDATE | `elisao_creditos_auditoria` | `registrar_decisao_elisao` |  |
| update_asaas_sync_queue_updated_at | BEFORE UPDATE | `asaas_sync_queue` | `update_updated_at_column` |  |
| update_asaas_config_updated_at | BEFORE UPDATE | `asaas_config` | `update_updated_at_column` |  |
| tr_check_asaas_queue_failures | AFTER UPDATE | `asaas_sync_queue` | `check_asaas_queue_failures` | `NEW.status = 'failed'` |
| trg_validar_duplicidade_pagamento | BEFORE INSERT OR UPDATE OF FORNECEDOR_ID, VALOR, DATA_VENCIMENTO, NUMERO_DOCUMENTO, CODIGO_BARRAS | `contas_pagar` | `validar_duplicidade_pagamento` |  |
| trg_validar_duplicidade_pagar | BEFORE INSERT OR UPDATE | `contas_pagar` | `validar_duplicidade_avancada` |  |
| tr_notificar_bloqueio_duplicidade | AFTER INSERT | `bloqueios_duplicidade` | `notificar_bloqueio_duplicidade` |  |
| update_regras_roteamento_updated_at | BEFORE UPDATE | `regras_roteamento_financeiro` | `update_updated_at_column` |  |
| update_budgets_updated_at | BEFORE UPDATE | `budgets` | `update_updated_at_column` |  |
| update_api_keys_updated_at | BEFORE UPDATE | `api_keys` | `update_updated_at_column` |  |
| update_planos_acao_updated_at | BEFORE UPDATE | `planos_acao` | `update_updated_at_column` |  |
| update_kpis_operacionais_updated_at | BEFORE UPDATE | `kpis_operacionais` | `update_updated_at_column` |  |
| update_pedidos_compra_updated_at | BEFORE UPDATE | `pedidos_compra` | `update_updated_at_column` |  |
| audit_clientes | AFTER INSERT OR UPDATE OR DELETE | `clientes` | `audit_trigger_function` |  |
| audit_fornecedores | AFTER INSERT OR UPDATE OR DELETE | `fornecedores` | `audit_trigger_function` |  |
| audit_contas_receber | AFTER INSERT OR UPDATE OR DELETE | `contas_receber` | `audit_trigger_function` |  |
| audit_contas_pagar | AFTER INSERT OR UPDATE OR DELETE | `contas_pagar` | `audit_trigger_function` |  |
| audit_profiles | AFTER INSERT OR UPDATE OR DELETE | `profiles` | `audit_trigger_function` |  |
| audit_user_roles | AFTER INSERT OR UPDATE OR DELETE | `user_roles` | `audit_trigger_function` |  |
| audit_empresas | AFTER INSERT OR UPDATE OR DELETE | `empresas` | `audit_trigger_function` |  |
| audit_asaas_payments | AFTER INSERT OR UPDATE OR DELETE | `asaas_payments` | `audit_trigger_function` |  |
| audit_asaas_transfers | AFTER INSERT OR UPDATE OR DELETE | `asaas_transfers` | `audit_trigger_function` |  |
| trigger_asaas_settlement | AFTER UPDATE | `asaas_payments` | `handle_asaas_payment_settlement` |  |
| trigger_analisar_whatsapp | BEFORE INSERT | `whatsapp_conversas` | `analisar_sentimento_whatsapp` |  |
| tr_alerta_webhook_falha | AFTER INSERT OR UPDATE | `webhooks_log` | `gerar_alerta_falha_processamento` | `NEW.erro_mensagem IS NOT NULL` |
| tr_alerta_regua_falha | AFTER INSERT | `execucoes_regua_cobranca` | `gerar_alerta_falha_regua` | `NEW.status = 'falha'` |
| update_fluxos_aprovacao_niveis_updated_at | BEFORE UPDATE | `fluxos_aprovacao_niveis` | `update_updated_at_column` |  |
| set_updated_at_d9c737e24ed42de7266f | BEFORE UPDATE | `acordos_parcelamento` | `update_updated_at_column` |  |
| trg_alert_configurations_set_empresa | BEFORE INSERT | `alert_configurations` | `set_empresa_id_default` |  |
| trg_audit_alert_configurations | AFTER INSERT OR DELETE OR UPDATE | `alert_configurations` | `audit_trigger_generic` |  |
| update_alert_config_updated_at | BEFORE UPDATE | `alert_configurations` | `update_updated_at_column` |  |
| trg_alertas_set_empresa | BEFORE INSERT | `alertas` | `set_empresa_id_from_profile` |  |
| set_updated_at_fb6d54b516a66b2b99f3 | BEFORE UPDATE | `alertas_preditivos` | `update_updated_at_column` |  |
| trg_alerts_set_empresa | BEFORE INSERT | `alerts` | `set_empresa_id_default` |  |
| trg_aliq_inter_updated_at | BEFORE UPDATE | `aliquotas_interestaduais` | `set_updated_at` |  |
| trg_aliq_internas_updated_at | BEFORE UPDATE | `aliquotas_internas_uf` | `set_updated_at` |  |
| trg_aliq_iss_updated_at | BEFORE UPDATE | `aliquotas_iss_municipal` | `set_updated_at` |  |
| trg_audit_allowed_countries | AFTER INSERT OR DELETE OR UPDATE | `allowed_countries` | `audit_trigger_generic` |  |
| trg_audit_allowed_ips | AFTER INSERT OR DELETE OR UPDATE | `allowed_ips` | `audit_trigger_generic` |  |
| set_updated_at_f7bd4a317caf2651584f | BEFORE UPDATE | `anomalias_detectadas` | `update_updated_at_column` |  |
| trg_api_keys_updated_at | BEFORE UPDATE | `api_keys` | `handle_updated_at` |  |
| set_updated_at_414e25aed7d9071a4748 | BEFORE UPDATE | `apuracoes_tributarias` | `update_updated_at_column` |  |
| set_updated_at_c9b96759e48801387f71 | BEFORE UPDATE | `asaas_config` | `update_updated_at_column` |  |
| set_updated_at_9d8cee55d8b7c2070327 | BEFORE UPDATE | `asaas_customers` | `update_updated_at_column` |  |
| set_updated_at_60e90ad3dec9516f2ca9 | BEFORE UPDATE | `asaas_payments` | `update_updated_at_column` |  |
| set_updated_at_4efff01553ff16302e45 | BEFORE UPDATE | `asaas_reconciliation_suggestions` | `update_updated_at_column` |  |
| set_updated_at_358c32867d1f3b611c3b | BEFORE UPDATE | `asaas_sync_queue` | `update_updated_at_column` |  |
| set_updated_at_750f942dec954ad99332 | BEFORE UPDATE | `asaas_transfers` | `update_updated_at_column` |  |
| sanitize_auth_log_metadata_trigger | BEFORE INSERT | `auth_logs` | `sanitize_auth_log_metadata` |  |
| trg_benchmarks_updated_at | BEFORE UPDATE | `benchmarks_setoriais` | `handle_updated_at` |  |
| trg_beneficios_updated_at | BEFORE UPDATE | `beneficios_fiscais` | `set_updated_at` |  |
| update_bitrix24_tokens_updated_at | BEFORE UPDATE | `bitrix24_tokens` | `update_updated_at_column` |  |
| trg_bitrix_tokens_updated_at | BEFORE UPDATE | `bitrix_oauth_tokens` | `handle_updated_at` |  |
| trg_bling_tokens_updated_at | BEFORE UPDATE | `bling_tokens` | `handle_updated_at` |  |
| set_updated_at_6ccc02b67895ed316b66 | BEFORE UPDATE | `boletos` | `update_updated_at_column` |  |
| set_updated_at_b7d9e68ed31698bcfe97 | BEFORE UPDATE | `budgets` | `update_updated_at_column` |  |
| set_updated_at_catalogos_fiscais_cargas | BEFORE UPDATE | `catalogos_fiscais_cargas` | `handle_updated_at` |  |
| trg_catalogos_health_history_updated_at | BEFORE UPDATE | `catalogos_tributarios_health_history` | `handle_updated_at` |  |
| set_updated_at_18e8b04fb0e329ecb61f | BEFORE UPDATE | `categorias` | `update_updated_at_column` |  |
| set_updated_at_0d5cf71cba5e923b906a | BEFORE UPDATE | `centros_custo` | `update_updated_at_column` |  |
| set_updated_at_0670acdde4e1e38b5669 | BEFORE UPDATE | `clientes` | `update_updated_at_column` |  |
| trg_cnaes_updated_at | BEFORE UPDATE | `cnaes` | `set_updated_at` |  |
| trg_cnpja_cache_updated_at | BEFORE UPDATE | `cnpja_cache` | `handle_updated_at` |  |
| set_updated_at_3a25b26abdf52bd44121 | BEFORE UPDATE | `configuracoes_aprovacao` | `update_updated_at_column` |  |
| trg_conformidade_snapshots_updated_at | BEFORE UPDATE | `conformidade_snapshots` | `update_updated_at_column` |  |
| set_updated_at_e4fd639d8315ad49b4d1 | BEFORE UPDATE | `contas_bancarias` | `update_updated_at_column` |  |
| set_updated_at_891eba3b06036ba9ea7e | BEFORE UPDATE | `contas_pagar` | `update_updated_at_column` |  |
| set_updated_at_f4f31d38308fe5dff30a | BEFORE UPDATE | `contas_receber` | `update_updated_at_column` |  |
| trg_convites_contador_updated_at | BEFORE UPDATE | `convites_contador` | `handle_updated_at` |  |
| set_updated_at_0c7ce82e1f5cca97d953 | BEFORE UPDATE | `custom_field_definitions` | `update_updated_at_column` |  |
| set_updated_at_fb9bfe686d34f4bee9a0 | BEFORE UPDATE | `custom_field_values` | `update_updated_at_column` |  |
| set_updated_at_408bdc8fafbc18b00290 | BEFORE UPDATE | `darfs` | `update_updated_at_column` |  |
| trg_elisao_alertas_updated_at | BEFORE UPDATE | `elisao_alertas` | `handle_updated_at` |  |
| trg_cred_aud_updated_at | BEFORE UPDATE | `elisao_creditos_auditoria` | `handle_updated_at` |  |
| trg_regras_creditos_updated_at | BEFORE UPDATE | `elisao_regras_creditos` | `handle_updated_at` |  |
| trg_elisao_sim_updated_at | BEFORE UPDATE | `elisao_simulacoes_regime` | `handle_updated_at` |  |
| trg_tarefas_elisao_updated_at | BEFORE UPDATE | `elisao_tarefas_acionaveis` | `handle_updated_at` |  |
| trg_empresas_unica_padrao | BEFORE INSERT OR UPDATE OF IS_PADRAO, ATIVO | `empresas` | `empresas_unica_padrao` |  |
| trg_emp_cert_updated | BEFORE UPDATE | `empresas_certificados` | `tg_touch_updated_at` |  |
| trg_entregas_obrigacoes_updated_at | BEFORE UPDATE | `entregas_obrigacoes` | `update_updated_at_column` |  |
| trg_estrategias_updated_at | BEFORE UPDATE | `estrategias_elisao` | `set_updated_at` |  |
| set_updated_at_a78c869af115da2c0dbe | BEFORE UPDATE | `expert_conversations` | `update_updated_at_column` |  |
| trg_faixas_simples_updated_at | BEFORE UPDATE | `faixas_simples_nacional` | `set_updated_at` |  |
| trg_fechamentos_updated_at | BEFORE UPDATE | `fechamentos_tributarios` | `handle_updated_at` |  |
| set_updated_at_24d30bafb2eecf05024f | BEFORE UPDATE | `fila_cobrancas` | `update_updated_at_column` |  |
| set_updated_at_d05a1e8f4af4f67d1bb5 | BEFORE UPDATE | `fornecedores` | `update_updated_at_column` |  |
| trg_fe_alert_state_updated_at | BEFORE UPDATE | `frontend_error_alert_state` | `handle_updated_at` |  |
| trg_frontend_error_logs_sanitize | BEFORE INSERT | `frontend_error_logs` | `frontend_error_logs_sanitize` |  |
| trg_audit_geo_blocks | AFTER INSERT OR DELETE OR UPDATE | `geo_blocks` | `audit_trigger_generic` |  |
| update_geo_blocks_updated_at | BEFORE UPDATE | `geo_blocks` | `update_updated_at_column` |  |
| trg_glossario_updated_at | BEFORE UPDATE | `glossario_tributario` | `handle_updated_at` |  |
| trg_incentivos_updated_at | BEFORE UPDATE | `incentivos_fiscais` | `handle_updated_at` |  |
| trg_integration_secrets_updated_at | BEFORE UPDATE | `integration_secrets` | `update_updated_at_column` |  |
| trg_integrity_alerts_updated_at | BEFORE UPDATE | `integrity_alerts` | `update_updated_at_column` |  |
| trg_audit_ip_whitelist | AFTER INSERT OR DELETE OR UPDATE | `ip_whitelist` | `audit_trigger_generic` |  |
| update_ip_whitelist_updated_at | BEFORE UPDATE | `ip_whitelist` | `update_updated_at_column` |  |
| trg_itens_iss_updated_at | BEFORE UPDATE | `itens_lista_iss` | `set_updated_at` |  |
| trg_kpis_operacionais_updated_at | BEFORE UPDATE | `kpis_operacionais` | `handle_updated_at` |  |
| trg_lancamento_contabil_before_insert | BEFORE INSERT | `lancamentos_contabeis` | `lancamento_contabil_before_insert` |  |
| trg_lancamento_contabil_before_update | BEFORE UPDATE | `lancamentos_contabeis` | `lancamento_contabil_before_update` |  |
| set_updated_at_d7d66ed0673bb8a6cd90 | BEFORE UPDATE | `logs_conciliacao_retroativa` | `update_updated_at_column` |  |
| set_updated_at_metas | BEFORE UPDATE | `metas_financeiras` | `update_updated_at_column` |  |
| trg_n8n_cfg_updated | BEFORE UPDATE | `n8n_workflow_configs` | `update_updated_at_column` |  |
| trg_ncms_updated_at | BEFORE UPDATE | `ncms` | `set_updated_at` |  |
| trg_nfe_rec_updated | BEFORE UPDATE | `nfe_recebidas` | `tg_touch_updated_at` |  |
| trg_nfe_recebidas_updated_at | BEFORE UPDATE | `nfe_recebidas` | `update_updated_at_column` |  |
| trg_nf_ocr_updated_at | BEFORE UPDATE | `notas_fiscais_ocr` | `handle_updated_at` |  |
| set_updated_at_open_finance | BEFORE UPDATE | `open_finance_consents` | `update_updated_at_column` |  |
| trg_operacoes_icms_updated_at | BEFORE UPDATE | `operacoes_icms` | `handle_updated_at` |  |
| trg_oport_elisao_updated_at | BEFORE UPDATE | `oportunidades_elisao` | `handle_updated_at` |  |
| trg_org_membros_updated_at | BEFORE UPDATE | `organizacao_membros` | `set_updated_at` |  |
| trg_organizacoes_updated_at | BEFORE UPDATE | `organizacoes` | `set_updated_at` |  |
| trg_overlay_rejeicoes_updated_at | BEFORE UPDATE | `overlay_rejeicoes_auditoria` | `set_updated_at` |  |
| trg_pag_recorr_updated_at | BEFORE UPDATE | `pagamentos_recorrentes` | `handle_updated_at` |  |
| trg_normalizar_tipo_partida | BEFORE INSERT OR UPDATE | `partidas_contabeis` | `normalizar_tipo_partida` |  |
| trg_invalidate_old_tokens | AFTER INSERT | `password_reset_tokens` | `invalidate_old_tokens` |  |
| trg_set_token_expiration | BEFORE INSERT | `password_reset_tokens` | `set_token_expiration` |  |
| trg_per_dcomp_updated_at | BEFORE UPDATE | `per_dcomp` | `handle_updated_at` |  |
| trg_audit_permissions | AFTER INSERT OR DELETE OR UPDATE | `permissions` | `audit_trigger_generic` |  |
| trg_pix_template_sync_legacy | BEFORE INSERT OR UPDATE | `pix_templates` | `pix_template_sync_legacy` |  |
| trg_pix_templates_updated_at | BEFORE UPDATE | `pix_templates` | `handle_updated_at` |  |
| trg_planos_acao_updated_at | BEFORE UPDATE | `planos_acao` | `handle_updated_at` |  |
| set_updated_at_a3e34a0da7a4b2d1563e | BEFORE UPDATE | `portal_cliente_tokens` | `update_updated_at_column` |  |
| set_updated_at_d970728376beb1370578 | BEFORE UPDATE | `profiles` | `update_updated_at_column` |  |
| trg_prevent_profile_privilege_escalation | BEFORE UPDATE | `profiles` | `prevent_profile_privilege_escalation` |  |
| trg_proj_reforma_updated_at | BEFORE UPDATE | `projecoes_reforma` | `handle_updated_at` |  |
| trg_protocolos_st_updated_at | BEFORE UPDATE | `protocolos_st` | `set_updated_at` |  |
| trg_protocolo_st_ncm_autolink | BEFORE INSERT OR UPDATE OF NCM_CODIGO | `protocolos_st_ncms` | `protocolo_st_ncm_autolink` |  |
| trg_protocolos_st_ncms_updated_at | BEFORE UPDATE | `protocolos_st_ncms` | `set_updated_at` |  |
| trg_protocolos_st_ufs_updated_at | BEFORE UPDATE | `protocolos_st_ufs` | `set_updated_at` |  |
| trg_push_subscriptions_updated_at | BEFORE UPDATE | `push_subscriptions` | `handle_updated_at` |  |
| trg_regime_cache_updated_at | BEFORE UPDATE | `regime_decision_cache` | `handle_updated_at` |  |
| set_updated_at_3f1eaae3a0a07aa516a5 | BEFORE UPDATE | `regimes_simulados` | `update_updated_at_column` |  |
| trg_sync_regime_empresa | AFTER INSERT OR UPDATE | `regimes_tributarios` | `sync_regime_tributario_empresa` |  |
| trg_regras_contab_updated_at | BEFORE UPDATE | `regras_contabilizacao_automatica` | `handle_updated_at` |  |
| set_updated_at_411e7594aa600ded799f | BEFORE UPDATE | `regras_roteamento_financeiro` | `update_updated_at_column` |  |
| trg_audit_regras_roteamento_financeiro | AFTER INSERT OR DELETE OR UPDATE | `regras_roteamento_financeiro` | `audit_trigger_generic` |  |
| set_updated_at_d109c735b0fcf7754280 | BEFORE UPDATE | `regua_cobranca` | `update_updated_at_column` |  |
| set_updated_at_7895f3de16aa8553d228 | BEFORE UPDATE | `regua_cobranca_status` | `update_updated_at_column` |  |
| trg_relat_agend_updated_at | BEFORE UPDATE | `relatorios_agendados` | `handle_updated_at` |  |
| trg_rel_trib_agend_updated_at | BEFORE UPDATE | `relatorios_tributarios_agendados` | `handle_updated_at` |  |
| trg_retencao_politicas_updated_at | BEFORE UPDATE | `retencao_politicas` | `handle_updated_at` |  |
| trg_audit_risk_rules | AFTER INSERT OR DELETE OR UPDATE | `risk_rules` | `audit_trigger_generic` |  |
| trg_risk_rules_set_empresa | BEFORE INSERT | `risk_rules` | `set_empresa_id_default` |  |
| update_risk_rules_updated_at | BEFORE UPDATE | `risk_rules` | `update_updated_at_column` |  |
| trg_audit_role_permissions | AFTER INSERT OR DELETE OR UPDATE | `role_permissions` | `audit_trigger_generic` |  |
| trg_saved_filter_subs_updated_at | BEFORE UPDATE | `saved_filter_subscriptions` | `handle_updated_at` |  |
| trg_saved_filters_updated_at | BEFORE UPDATE | `saved_filters` | `handle_updated_at` |  |
| trg_scim_checklist_updated_at | BEFORE UPDATE | `scim_setup_checklist` | `handle_updated_at` |  |
| set_updated_at_e04cfc68ebaf2388af42 | BEFORE UPDATE | `security_settings` | `update_updated_at_column` |  |
| trg_audit_security_settings | AFTER INSERT OR DELETE OR UPDATE | `security_settings` | `audit_trigger_generic` |  |
| trg_dfe_cursor_updated | BEFORE UPDATE | `sefaz_dfe_cursor` | `tg_touch_updated_at` |  |
| trg_simulacoes_updated_at | BEFORE UPDATE | `simulacoes` | `handle_updated_at` |  |
| trg_solicitacoes_lgpd_set_empresa | BEFORE INSERT | `solicitacoes_lgpd` | `set_empresa_id_from_profile` |  |
| trg_solicitacoes_lgpd_updated_at | BEFORE UPDATE | `solicitacoes_lgpd` | `handle_updated_at` |  |
| trg_sped_arquivos_updated_at | BEFORE UPDATE | `sped_contabil_arquivos` | `handle_updated_at` |  |
| update_split_payment_transacoes_updated_at | BEFORE UPDATE | `split_payment_transacoes` | `update_updated_at_column` |  |
| set_updated_at_cf7fd5d83c82e171dad1 | BEFORE UPDATE | `sso_providers` | `update_updated_at_column` |  |
| trg_audit_sso_providers | AFTER INSERT OR DELETE OR UPDATE | `sso_providers` | `audit_trigger_generic` |  |
| trg_sso_role_mappings_updated_at | BEFORE UPDATE | `sso_role_mappings` | `handle_updated_at` |  |
| trg_sso_user_groups_updated_at | BEFORE UPDATE | `sso_user_groups` | `handle_updated_at` |  |
| set_updated_at_3e8011f6fa0d13424163 | BEFORE UPDATE | `templates_cobranca` | `update_updated_at_column` |  |
| trg_ufs_updated_at | BEFORE UPDATE | `ufs` | `set_updated_at` |  |
| trg_user_active_filters_updated_at | BEFORE UPDATE | `user_active_filters` | `handle_updated_at` |  |
| set_updated_at_7c3e342523c10fdce4a8 | BEFORE UPDATE | `user_anomalia_preferences` | `update_updated_at_column` |  |
| tr_user_anomalia_preferences_updated_at | BEFORE UPDATE | `user_anomalia_preferences` | `handle_updated_at` |  |
| update_user_demonstrativo_preferences_updated_at | BEFORE UPDATE | `user_demonstrativo_preferences` | `update_updated_at_column` |  |
| tr_user_digest_preferences_updated_at | BEFORE UPDATE | `user_digest_preferences` | `update_updated_at_column` |  |
| set_updated_at_09910d2394bcdefb9694 | BEFORE UPDATE | `user_empresas` | `update_updated_at_column` |  |
| set_updated_at_94b77f57a764fd8b2a8c | BEFORE UPDATE | `user_filter_presets` | `update_updated_at_column` |  |
| set_updated_at_843738dbe839129b260e | BEFORE UPDATE | `user_onboarding_progress` | `update_updated_at_column` |  |
| tr_user_onboarding_progress_updated_at | BEFORE UPDATE | `user_onboarding_progress` | `handle_updated_at` |  |
| trg_audit_user_roles | AFTER INSERT OR DELETE OR UPDATE | `user_roles` | `audit_trigger_generic` |  |
| trg_auto_vincular_empresa_padrao | AFTER INSERT | `user_roles` | `auto_vincular_empresa_padrao` |  |
| update_user_roles_updated_at | BEFORE UPDATE | `user_roles` | `update_updated_at_column` |  |
| trg_webhook_dlq_updated | BEFORE UPDATE | `webhook_dlq` | `update_updated_at_column` |  |
| trg_sync_integration_secret_identifier | BEFORE INSERT OR UPDATE OF NOME, CHAVE | `integration_secrets` | `sync_integration_secret_identifier` |  |
| performance_alerts_notify_trigger | AFTER INSERT | `performance_alerts` | `notify_performance_alert_trigger` |  |
| trg_notificar_alerta_critico_push | AFTER INSERT | `alertas` | `fn_notificar_alerta_critico_push` |  |
| on_whatsapp_message_inserted | AFTER INSERT | `historico_cobranca_whatsapp` | `trigger_whatsapp_ai_analysis` |  |
| trg_anexos_sync_empresa | AFTER UPDATE OF EMPRESA_ID | `contas_pagar` | `sincroniza_empresa_dos_anexos` | `OLD.empresa_id IS DISTINCT FROM NEW.empresa_id` |
| trg_anexos_sync_empresa | AFTER UPDATE OF EMPRESA_ID | `contas_receber` | `sincroniza_empresa_dos_anexos` | `OLD.empresa_id IS DISTINCT FROM NEW.empresa_id` |
| trg_anexos_sync_empresa | AFTER UPDATE OF EMPRESA_ID | `movimentacoes` | `sincroniza_empresa_dos_anexos` | `OLD.empresa_id IS DISTINCT FROM NEW.empresa_id` |
| trg_anexos_atribui_empresa | BEFORE INSERT OR UPDATE OF ENTIDADE_TIPO, ENTIDADE_ID | `anexos_financeiros` | `atribui_empresa_do_anexo` |  |
| trg_saldo_movimentacao | AFTER INSERT OR UPDATE OR DELETE | `movimentacoes` | `fn_saldo_movimentacao` |  |
| trg_transferencia_movimentacao | AFTER INSERT OR UPDATE | `transferencias` | `fn_transferencia_movimentacao` |  |
| trg_sync_valor_pago | AFTER INSERT OR DELETE OR UPDATE OF DELETED_AT, CONTA_PAGAR_ID, CONTA_RECEBER_ID | `movimentacoes` | `fn_sync_valor_pago_movimentacao` |  |
| trg_movimentacao_origem_guard | BEFORE INSERT OR UPDATE OF ORIGEM, TRANSFERENCIA_ID | `movimentacoes` | `fn_movimentacao_origem_guard` |  |
| trg_lancamento_estorno_marker | BEFORE UPDATE OF STATUS | `lancamentos_contabeis` | `fn_lancamento_estorno_marker` |  |
| trg_validar_partidas_dobradas | AFTER INSERT OR UPDATE OR DELETE | `partidas_contabeis` | `validar_partidas_dobradas` |  |
| trg_sincronizar_conta_partida | BEFORE INSERT OR UPDATE OF CONTA_ID, CONTA_CONTABIL_ID | `partidas_contabeis` | `sincronizar_conta_partida` |  |
| trg_contabilizar_movimentacao | AFTER INSERT | `movimentacoes` | `contabilizar_movimentacao` |  |
| tr_user_preferences_updated_at | BEFORE UPDATE | `user_preferences` | `handle_updated_at` |  |

Erros lançados por funções SQL (`RAISE EXCEPTION` = regra de negócio no banco):

| Função | Mensagem | Origem |
|---|---|---|
| `fn_validar_sso_provider` | force_sso_for_domains requer ao menos um domínio em allowed_domains | `supabase/migrations/20260421115901_ddfe6f1a-4ea1-40b8-9fb4-07d923b4a604.sql` |
| `fn_validar_sso_provider` | Provedor OIDC ativo requer client_id e discovery_url ou endpoints manuais | `supabase/migrations/20260421115901_ddfe6f1a-4ea1-40b8-9fb4-07d923b4a604.sql` |
| `fn_validar_sso_provider` | Provedor SAML ativo requer sso_url e x509_cert | `supabase/migrations/20260421115901_ddfe6f1a-4ea1-40b8-9fb4-07d923b4a604.sql` |
| `validate_user_anomalia_preferences` | toast_duracao_segundos deve estar entre 3 e 30 segundos | `supabase/migrations/20260422114156_c45227d3-2189-476c-afb4-f52c958c281a.sql` |
| `validate_user_anomalia_preferences` | Severidade invalida em toast_severidades_ativas: % | `supabase/migrations/20260422114156_c45227d3-2189-476c-afb4-f52c958c281a.sql` |
| `validate_saved_filter_subscription_rules` | Severidade invalida em severidades_criticas: % | `supabase/migrations/20260423130838_10838681-f277-4fb6-aaf1-4bd7e3b7fbce.sql` |
| `validate_saved_filter_subscription_rules` | rate_limit_max deve estar entre 1 e 100 | `supabase/migrations/20260423130838_10838681-f277-4fb6-aaf1-4bd7e3b7fbce.sql` |
| `validate_saved_filter_subscription_rules` | rate_limit_window_min deve estar entre 1 e 1440 minutos | `supabase/migrations/20260423130838_10838681-f277-4fb6-aaf1-4bd7e3b7fbce.sql` |
| `validar_duplicidade_pagamento` | % | `supabase/migrations/20260508195736_b880b70f-497f-491d-888a-57851d990304.sql` |
| `validar_duplicidade_financeira` | DUPLICIDADE_DETECTADA: % | `supabase/migrations/20260508200043_a00525d1-736f-4bbc-96fd-0d7171d610fe.sql` |
| `validar_duplicidade_financeira` | DUPLICIDADE_DETECTADA: % | `supabase/migrations/20260508200043_a00525d1-736f-4bbc-96fd-0d7171d610fe.sql` |
| `validar_duplicidade_avancada` | DUPLICIDADE_DETECTADA: % | `supabase/migrations/20260508200327_cb379296-ba4d-4201-9f04-d175b2535749.sql` |
| `validar_duplicidade_avancada` | DUPLICIDADE_DETECTADA: % | `supabase/migrations/20260508200327_cb379296-ba4d-4201-9f04-d175b2535749.sql` |
| `prevent_profile_privilege_escalation` | Não é permitido alterar o perfil de acesso diretamente. | `supabase/migrations/20260619152721_b6a00c86-4d32-4ec8-8d11-fecc433d9cee.sql` |
| `prevent_profile_privilege_escalation` | Não é permitido alterar a empresa do perfil diretamente. | `supabase/migrations/20260619152721_b6a00c86-4d32-4ec8-8d11-fecc433d9cee.sql` |
| `prevent_profile_privilege_escalation` | Não é permitido alterar identificadores do perfil. | `supabase/migrations/20260619152721_b6a00c86-4d32-4ec8-8d11-fecc433d9cee.sql` |
| `get_table_bloat` | Acesso negado: apenas administradores podem consultar bloat. | `supabase/migrations/20260712184014_472856ac-a9cb-4701-ac4c-a0e6ad43f73f.sql` |
| `monitor_table_bloat` | access denied: admin role required | `supabase/migrations/20260723123522_d6b8d22c-f32c-4adb-b70d-34c526113dc6.sql` |
| `lancamento_contabil_before_update` | Lançamento % está encerrado e não pode ser alterado | `supabase/migrations/20260726144646_f20d43c4-d2ab-4d31-bdf3-a0f412ef0948.sql` |
| `get_cron_jobs` | Acesso negado: apenas administradores podem visualizar automações. | `supabase/migrations/20260728110753_90823653-f205-4c49-97d5-ca8a3fc6b60c.sql` |
| `invocar_regua_cobranca` | Secret regua_cron_secret ausente ou inválido no Vault | `supabase/migrations/20260822115000_agendar_regua_cobranca.sql` |
| `get_retencao_politicas_status` | acesso negado: requer papel admin | `supabase/migrations/20260825100000_reconciliar_schema_completo.sql` |
| `backfill_empresa_id` | backfill_empresa_id: acesso restrito a administradores | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `capture_pg_stat_statements_baseline` | access denied: admin role required | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `capture_slow_queries` | access denied: admin role required | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `definir_empresa_padrao` | Apenas administradores podem definir a empresa padrão | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `definir_empresa_padrao` | Empresa inexistente | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `definir_empresa_padrao` | Empresa inativa não pode ser a padrão | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `delete_cron_job` | Apenas administradores podem remover tarefas agendadas | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `delete_cron_job` | Tarefa agendada % não encontrada | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `detectar_duplicidades_financeiras` | empresa_id é obrigatório | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `detectar_duplicidades_financeiras` | Tabela inválida: %. Use contas_pagar ou contas_receber. | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `detectar_duplicidades_financeiras` | Acesso negado à empresa informada | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `duplicate_saved_filter` | Não autenticado | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `duplicate_saved_filter` | Preset não encontrado ou sem acesso | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `empresas_unica_padrao` | Uma empresa inativa não pode ser a empresa padrão | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_asaas_payment_stats` | Acesso negado: usuário sem vínculo com a empresa informada. | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_bloat_history` | Acesso negado: apenas administradores podem consultar histórico de bloat. | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_bloat_snapshots` | Acesso negado: apenas administradores podem consultar snapshots de bloat. | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_catalogos_tributarios_history` | acesso negado: requer papel admin | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_cobertura_fiscal_uf` | Acesso restrito a administradores | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_cron_run_history` | Acesso negado: apenas administradores podem consultar execuções agendadas. | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_frontend_error_groups` | acesso negado | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_frontend_error_occurrences` | acesso negado | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_integrity_alerts` | access denied: admin role required | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_performance_alerts` | Acesso negado: apenas administradores podem consultar alertas de performance. | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_performance_alerts_weekly` | Acesso negado: apenas administradores podem consultar tendências. | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_retencoes_pendentes_count` | Empresa nao informada | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_retencoes_pendentes_count` | Acesso negado a empresa informada | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_retention_history` | acesso negado: requer perfil admin | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_silenciamentos_expirando` | Acesso negado: apenas administradores podem consultar silenciamentos. | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_ultima_carga_fiscal` | Acesso restrito a administradores | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_user_permissions` | Acesso negado: autenticacao requerida | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_user_permissions` | Acesso negado: consulta restrita ao proprio usuario | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_user_roles` | Acesso negado: autenticacao requerida | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `get_user_roles` | Acesso negado: consulta restrita ao proprio usuario | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `nfe_apply_manifestacao` | nfe_nao_encontrada | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `pix_template_sync_legacy` | favorecido_nome e tipo_chave_pix são obrigatórios | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `provisionar_usuario_atual` | Autenticação obrigatória para provisionamento | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `purge_old_rows` | purge_old_rows: p_days deve ser >= 1 (recebido %) | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `purge_old_rows` | purge_old_rows: p_batch fora da faixa permitida (1..100000) | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `purge_old_rows` | purge_old_rows: coluna temporal % inexistente em % | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `recarregar_seeds_fiscais` | Origem inválida: % | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `recarregar_seeds_fiscais` | Acesso restrito a administradores | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `registrar_evento_pagar` | Acesso negado: autenticacao requerida | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `registrar_evento_pagar` | Conta nao informada | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `registrar_evento_pagar` | Conta a pagar inexistente | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `registrar_evento_pagar` | Acesso negado a empresa da conta informada | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `registrar_evento_receber` | Acesso negado: autenticacao requerida | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `registrar_evento_receber` | Conta nao informada | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `registrar_evento_receber` | Conta a receber inexistente | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `registrar_evento_receber` | Acesso negado a empresa da conta informada | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `resolve_integrity_alert` | access denied: admin role required | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `run_observability_rpc` | not authorized | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `run_observability_rpc` | function % not allowed | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `toggle_cron_job` | Apenas administradores podem gerenciar tarefas agendadas | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `toggle_cron_job` | Tarefa agendada % não encontrada | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `webhook_claim` | source is required | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `webhook_mark_failure` | webhook % not found | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `sync_integration_secret_identifier` | integration_secrets exige chave ou nome não vazio | `supabase/migrations/20260827090000_reconciliar_integration_secrets_sem_drop.sql` |
| `sefaz_process_batch` | sefaz_process_batch: kind desconhecido "%" | `supabase/migrations/20260831153000_corrigir_12_erros_lint_funcoes.sql` |
| `claim_frontend_error_alerts` | acesso negado | `supabase/migrations/20260831153000_corrigir_12_erros_lint_funcoes.sql` |
| `silenciar_alerta_erro_frontend` | acesso negado | `supabase/migrations/20260831153000_corrigir_12_erros_lint_funcoes.sql` |
| `silenciar_alerta_erro_frontend` | assinatura obrigatoria | `supabase/migrations/20260831153000_corrigir_12_erros_lint_funcoes.sql` |
| `increment_failed_attempts` | email obrigatório | `supabase/migrations/20260831153000_corrigir_12_erros_lint_funcoes.sql` |
| `get_catalogos_tributarios_health` | acesso negado: requer papel admin | `supabase/migrations/20260831153000_corrigir_12_erros_lint_funcoes.sql` |
| `nfe_create_conta_pagar_from_nfe` | NFe % não encontrada | `supabase/migrations/20260902180000_fix_nfe_vinculo_rpcs_sem_escopo.sql` |
| `nfe_create_conta_pagar_from_nfe` | Sem permissão para esta NFe | `supabase/migrations/20260902180000_fix_nfe_vinculo_rpcs_sem_escopo.sql` |
| `nfe_create_conta_pagar_from_nfe` | NFe % sem valor_total válido para gerar conta a pagar | `supabase/migrations/20260902180000_fix_nfe_vinculo_rpcs_sem_escopo.sql` |
| `nfe_link_conta_pagar` | NFe % não encontrada | `supabase/migrations/20260902180000_fix_nfe_vinculo_rpcs_sem_escopo.sql` |
| `nfe_link_conta_pagar` | Sem permissão para esta NFe | `supabase/migrations/20260902180000_fix_nfe_vinculo_rpcs_sem_escopo.sql` |
| `nfe_link_conta_pagar` | Conta a pagar % não encontrada ou removida | `supabase/migrations/20260902180000_fix_nfe_vinculo_rpcs_sem_escopo.sql` |
| `nfe_link_conta_pagar` | Conta a pagar % pertence a outra empresa | `supabase/migrations/20260902180000_fix_nfe_vinculo_rpcs_sem_escopo.sql` |
| `nfe_link_conta_pagar` | NFe já está vinculada à conta % | `supabase/migrations/20260902180000_fix_nfe_vinculo_rpcs_sem_escopo.sql` |
| `nfe_link_conta_pagar` | Conta a pagar % já está vinculada a outra NFe | `supabase/migrations/20260902180000_fix_nfe_vinculo_rpcs_sem_escopo.sql` |
| `nfe_suggest_contas_pagar` | NFe % não encontrada | `supabase/migrations/20260902180000_fix_nfe_vinculo_rpcs_sem_escopo.sql` |
| `nfe_suggest_contas_pagar` | Sem permissão para esta NFe | `supabase/migrations/20260902180000_fix_nfe_vinculo_rpcs_sem_escopo.sql` |
| `nfe_unlink_conta_pagar` | NFe % não encontrada | `supabase/migrations/20260902180000_fix_nfe_vinculo_rpcs_sem_escopo.sql` |
| `nfe_unlink_conta_pagar` | Sem permissão para esta NFe | `supabase/migrations/20260902180000_fix_nfe_vinculo_rpcs_sem_escopo.sql` |
| `certificado_get_password` | Certificado não encontrado | `supabase/migrations/20260903000400_fix_certificado_get_password_idor.sql` |
| `certificado_get_password` | Acesso negado ao certificado informado | `supabase/migrations/20260903000400_fix_certificado_get_password_idor.sql` |
| `desfazer_conciliacao` | not_authenticated | `supabase/migrations/20260903000500_fix_desfazer_conciliacao_user_spoofing.sql` |
| `desfazer_conciliacao` | conciliacao_not_found | `supabase/migrations/20260903000500_fix_desfazer_conciliacao_user_spoofing.sql` |
| `desfazer_conciliacao` | forbidden: conciliacao pertence a outro usuário | `supabase/migrations/20260903000500_fix_desfazer_conciliacao_user_spoofing.sql` |
| `desfazer_conciliacao` | forbidden: empresa inacessível | `supabase/migrations/20260903000500_fix_desfazer_conciliacao_user_spoofing.sql` |
| `auditar_acessos_cross_tenant` | Acesso negado: apenas administradores podem executar a auditoria de acessos. | `supabase/migrations/20260903000700_fix_auditar_cross_tenant_coalesce_ativo.sql` |
| `export_asaas_audit_csv` | Acesso negado: apenas administradores podem exportar auditoria. | `supabase/migrations/20260903000900_fix_export_asaas_audit_csv_idor.sql` |
| `export_asaas_audit_csv` | Acesso negado: empresa não acessível para este usuário. | `supabase/migrations/20260903000900_fix_export_asaas_audit_csv_idor.sql` |
| `reset_failed_attempts` | permission denied: can only reset own login attempts | `supabase/migrations/20260904000500_fix_reset_failed_attempts_authcheck.sql` |
| `segredo_cron` | Segredo interno "%" ausente ou fraco em integration_secrets | `supabase/migrations/20260913120000_corrige_credenciais_automacoes_internas.sql` |
| `chave_anon_vault` | Secret "anon_key" ausente no Vault. Crie-o em Project Settings > Vault com a anon key de bwwbeyolnnzppeuhgkcd. | `supabase/migrations/20260913120000_corrige_credenciais_automacoes_internas.sql` |
| `confirmar_conciliacao_manual` | transacao_nao_atualizada | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `gerar_darf_retencoes` | not_authenticated | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `gerar_darf_retencoes` | forbidden_empresa_access | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `gerar_darf_retencoes` | nenhuma_retencao_selecionada | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `gerar_darf_retencoes` | retencoes_indisponiveis: % de % retenções estão disponíveis para esta empresa e ainda sem DARF | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `gerar_darf_retencoes` | retencoes_nao_marcadas: % de % linhas afetadas | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `pagar_darf_retencoes` | not_authenticated | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `pagar_darf_retencoes` | darf_nao_pagavel | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `pagar_darf_retencoes` | retencoes_nao_recolhidas: % de % linhas afetadas | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `registrar_nfe_com_creditos` | not_authenticated | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `registrar_nfe_com_creditos` | forbidden_empresa_access | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `registrar_nfe_com_creditos` | nota_invalida | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `registrar_nfe_com_creditos` | colunas_inexistentes_em_notas_fiscais: % | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `registrar_nfe_com_creditos` | nota_sem_campos | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `registrar_nfe_com_creditos` | creditos_nao_gravados: % de % linhas | `supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql` |
| `atribui_empresa_do_anexo` | anexos_financeiros: usuario % sem vinculo de escrita na empresa % da entidade | `supabase/migrations/20261013120000_anexos_rls_metadados_e_orfaos.sql` |
| `fn_transferencia_movimentacao` | conta de origem deve pertencer à mesma empresa da transferência | `supabase/migrations/20261027120000_transferencias_movimentacao_bilateral.sql` |
| `fn_transferencia_movimentacao` | conta de destino deve pertencer à mesma empresa da transferência | `supabase/migrations/20261027120000_transferencias_movimentacao_bilateral.sql` |
| `fn_transferencia_movimentacao` | empresa_id deve pertencer a uma empresa acessível ao usuário | `supabase/migrations/20261027120000_transferencias_movimentacao_bilateral.sql` |
| `fn_sync_valor_pago_movimentacao` | movimentacao vinculada a conta_pagar de outra empresa (%) | `supabase/migrations/20261027120000_transferencias_movimentacao_bilateral.sql` |
| `fn_sync_valor_pago_movimentacao` | movimentacao vinculada a conta_receber de outra empresa (%) | `supabase/migrations/20261027120000_transferencias_movimentacao_bilateral.sql` |
| `validar_partidas_dobradas` | Partidas não balanceadas no lançamento %: Débitos=% Créditos=% | `supabase/migrations/20261112003647_validar_partidas_dobradas_ativa.sql` |
| `drop_old_partitions` | retention_months deve ser >= 1 | `supabase/migrations/20261113114643_drop_old_partitions_alinha_repo.sql` |
| `processar_regua_cobranca` | Sem permissão para esta empresa | `supabase/migrations/20261117010000_marcar_contas_vencidas.sql` |
| `reprocess_dlq` | Acesso negado: apenas administradores podem reprocessar DLQ. | `supabase/migrations/20261117053000_reprocess_dlq_reagenda_original.sql` |
| `reprocess_dlq` | DLQ item não encontrado ou já resolvido | `supabase/migrations/20261117053000_reprocess_dlq_reagenda_original.sql` |
| `reprocess_dlq` | Evento em processamento agora (webhooks_log %): aguarde o fim da tentativa atual. | `supabase/migrations/20261117053000_reprocess_dlq_reagenda_original.sql` |
| `webhook_replay` | unauthorized: admin role required to replay webhooks | `supabase/migrations/20261117074000_webhook_replay_resolve_dlq.sql` |
| `webhook_replay` | webhook % not found | `supabase/migrations/20261117074000_webhook_replay_resolve_dlq.sql` |
| `rate_limit_check` | rate_limit_check: _endpoint, _ip e _limit sao obrigatorios | `supabase/migrations/20261118002000_rate_limit_check_atomico.sql` |
| `aprovar_solicitacao_pagamento` | not_authenticated | `supabase/migrations/20261120235900_quorum_aprovacao_assinaturas.sql` |
| `aprovar_solicitacao_pagamento` | solicitacao_nao_pendente | `supabase/migrations/20261120235900_quorum_aprovacao_assinaturas.sql` |
| `aprovar_solicitacao_pagamento` | solicitacao_sem_conta_pagar | `supabase/migrations/20261120235900_quorum_aprovacao_assinaturas.sql` |
| `aprovar_solicitacao_pagamento` | conta_pagar_inacessivel | `supabase/migrations/20261120235900_quorum_aprovacao_assinaturas.sql` |
| `aprovar_solicitacao_pagamento` | solicitacao_inacessivel | `supabase/migrations/20261120235900_quorum_aprovacao_assinaturas.sql` |
| `check_catalogos_tributarios_invariants` | acesso negado: requer papel admin | `supabase/migrations/20261121103000_alinhar_ddl_catalogos.sql` |

## E. Estados, máquinas de estado e transições

### E.1 Colunas de status no banco

| Tabela | Coluna | Valores permitidos (enum/CHECK) | Default |
|---|---|---|---|
| `clientes` | `estado` | **livre (sem enum/CHECK)** |  |
| `fornecedores` | `estado` | **livre (sem enum/CHECK)** |  |
| `contas_pagar` | `status` | `cancelado`, `pago`, `parcial`, `pendente`, `vencido` | `pendente` |
| `contas_receber` | `status` | `atrasado`, `cancelado`, `em_acordo`, `pago`, `parcial`, `pendente`, `recebido`, `vencido` | `pendente` |
| `contas_receber` | `etapa_cobranca` | **livre (sem enum/CHECK)** |  |
| `empresas` | `estado` | **livre (sem enum/CHECK)** |  |
| `transacoes_bancarias` | `status` | **livre (sem enum/CHECK)** | `pendente` |
| `notas_fiscais` | `status` | **livre (sem enum/CHECK)** | `emitida` |
| `alertas` | `status` | **livre (sem enum/CHECK)** | `pendente` |
| `solicitacoes_aprovacao` | `status` | **livre (sem enum/CHECK)** | `pendente` |
| `historico_relatorios` | `status` | `erro`, `parcial`, `sucesso` | `sucesso` |
| `bitrix_sync_logs` | `status` | **livre (sem enum/CHECK)** |  |
| `boletos` | `status` | `cancelado`, `enviado`, `pago`, `pendente`, `vencido` | `emitido` |
| `boletos` | `bitrix_status` | **livre (sem enum/CHECK)** |  |
| `historico_cobranca` | `status` | **livre (sem enum/CHECK)** |  |
| `historico_cobranca` | `etapa` | **livre (sem enum/CHECK)** |  |
| `historico_cobranca` | `etapa_anterior` | **livre (sem enum/CHECK)** |  |
| `historico_cobranca` | `etapa_nova` | **livre (sem enum/CHECK)** |  |
| `expert_conversations` | `status` | **livre (sem enum/CHECK)** |  |
| `alertas_preditivos` | `status` | **livre (sem enum/CHECK)** | `pendente` |
| `open_finance_consents` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `pagamentos_recorrentes` | `status` | **livre (sem enum/CHECK)** |  |
| `regua_cobranca` | `etapa` | **livre (sem enum/CHECK)** |  |
| `historico_cobranca_whatsapp` | `status` | **livre (sem enum/CHECK)** | `enviado` |
| `acordos_parcelamento` | `status` | **livre (sem enum/CHECK)** | `ativo` |
| `parcelas_acordo` | `status` | **livre (sem enum/CHECK)** | `pendente` |
| `password_reset_requests` | `status` | `approved`, `pending`, `rejected` | `pendente` |
| `apuracoes_tributarias` | `status` | **livre (sem enum/CHECK)** | `pendente` |
| `creditos_tributarios` | `status` | **livre (sem enum/CHECK)** | `disponivel` |
| `operacoes_tributaveis` | `status` | **livre (sem enum/CHECK)** | `pendente` |
| `split_payment_transacoes` | `status` | **livre (sem enum/CHECK)** | `pendente` |
| `apuracoes_irpj_csll` | `status` | **livre (sem enum/CHECK)** | `rascunho` |
| `prejuizos_fiscais` | `status` | **livre (sem enum/CHECK)** | `disponivel` |
| `retencoes_fonte` | `status` | `cancelado`, `compensado`, `pendente`, `recolhido` | `pendente` |
| `darfs` | `status` | `cancelado`, `gerado`, `pago`, `vencido` | `gerado` |
| `alertas_tributarios` | `status` | **livre (sem enum/CHECK)** |  |
| `per_dcomp` | `status` | `aguardando_transmissao`, `cancelado`, `deferido`, `em_analise`, `indeferido`, `rascunho`, `transmitido` | `rascunho` |
| `asaas_payments` | `status` | **livre (sem enum/CHECK)** | `PENDING` |
| `bling_sync_logs` | `status` | `erro`, `executando`, `parcial`, `pendente`, `sucesso` | `pendente` |
| `transferencias` | `status` | **livre (sem enum/CHECK)** | `concluido` |
| `conciliacoes` | `status` | **livre (sem enum/CHECK)** | `em_andamento` |
| `webhooks_log` | `status` | `dead`, `failed`, `pending`, `processing`, `retrying`, `success` | `received` |
| `templates_cobranca` | `etapa` | **livre (sem enum/CHECK)** |  |
| `fila_cobrancas` | `etapa` | **livre (sem enum/CHECK)** |  |
| `fila_cobrancas` | `status` | `cancelado`, `enviado`, `falhou`, `pendente` | `pendente` |
| `execucoes_cobranca` | `etapa` | **livre (sem enum/CHECK)** |  |
| `execucoes_cobranca` | `status` | **livre (sem enum/CHECK)** | `enviado` |
| `negativacoes` | `status` | **livre (sem enum/CHECK)** | `ativo` |
| `protestos` | `status` | **livre (sem enum/CHECK)** | `ativo` |
| `protestos` | `estado_cartorio` | **livre (sem enum/CHECK)** |  |
| `cnpja_cache` | `situacao_cadastral` | **livre (sem enum/CHECK)** |  |
| `convites_contador` | `status` | **livre (sem enum/CHECK)** |  |
| `verificacoes_conformidade` | `status` | **livre (sem enum/CHECK)** |  |
| `fechamentos_tributarios` | `status` | `aberto`, `em_revisao`, `fechado`, `reaberto` | `aberto` |
| `notas_fiscais_ocr` | `status` | `erro`, `pendente`, `processada`, `processando` | `processada` |
| `solicitacoes_lgpd` | `status` | `aberta`, `atendida`, `em_analise`, `rejeitada` | `aberta` |
| `anomalias_detectadas` | `status` | **livre (sem enum/CHECK)** | `pendente` |
| `acoes_recomendadas` | `status` | **livre (sem enum/CHECK)** | `pendente` |
| `user_onboarding_progress` | `last_step` | **livre (sem enum/CHECK)** |  |
| `sso_login_attempts` | `state` | **livre (sem enum/CHECK)** |  |
| `lancamentos_contabeis` | `status` | **livre (sem enum/CHECK)** | `ativo` |
| `sped_contabil_arquivos` | `status` | `cancelado`, `gerado`, `rejeitado`, `transmitido` | `gerado` |
| `sso_sandbox_runs` | `status` | **livre (sem enum/CHECK)** |  |
| `anomalia_detection_runs` | `status` | **livre (sem enum/CHECK)** | `queued` |
| `anomalia_detection_runs` | `current_step` | **livre (sem enum/CHECK)** |  |
| `scim_setup_checklist` | `etapa` | **livre (sem enum/CHECK)** |  |
| `scim_setup_checklist` | `status` | **livre (sem enum/CHECK)** |  |
| `anomalia_toast_eventos` | `status` | **livre (sem enum/CHECK)** | `sent` |
| `notification_history` | `status` | `failed`, `queued`, `sent` | `sent` |
| `execucoes_regua_cobranca` | `etapa` | **livre (sem enum/CHECK)** |  |
| `execucoes_regua_cobranca` | `status` | `erro`, `falha`, `ignorado`, `processando`, `sucesso` |  |
| `logs_conciliacao_retroativa` | `status` | **livre (sem enum/CHECK)** | `processando` |
| `divergencias_conciliacao` | `status` | **livre (sem enum/CHECK)** | `aberta` |
| `eventos_contabilizacao_log` | `status` | `duplicado`, `erro`, `sem_regra`, `simulado`, `sucesso` |  |
| `elisao_creditos_auditoria` | `status_aprovacao` | `aprovado`, `pendente`, `rejeitado` | `pendente` |
| `elisao_tarefas_acionaveis` | `status` | `cancelada`, `concluida`, `em_andamento`, `pendente` | `pendente` |
| `elisao_tarefas_acionaveis` | `bitrix_sync_status` | `erro`, `nao_sincronizado`, `sincronizado`, `sincronizando` | `nao_sincronizado` |
| `regua_cobranca_status` | `status_cobranca` | **livre (sem enum/CHECK)** |  |
| `regua_cobranca_status` | `status` | **livre (sem enum/CHECK)** | `pendente` |
| `asaas_sync_queue` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `asaas_audit_trail` | `new_status` | **livre (sem enum/CHECK)** |  |
| `asaas_audit_trail` | `previous_status` | **livre (sem enum/CHECK)** |  |
| `asaas_transfers` | `status` | **livre (sem enum/CHECK)** | `PENDING` |
| `asaas_reconciliation_suggestions` | `status` | **livre (sem enum/CHECK)** | `PENDING` |
| `bloqueios_duplicidade` | `status` | **livre (sem enum/CHECK)** |  |
| `planos_acao` | `status` | `cancelado`, `concluido`, `em_andamento`, `pendente` | `pendente` |
| `pedidos_compra` | `status` | **livre (sem enum/CHECK)** | `rascunho` |
| `whatsapp_conversas` | `status` | **livre (sem enum/CHECK)** | `enviado` |
| `sessoes_conciliacao` | `status` | **livre (sem enum/CHECK)** | `aberta` |
| `contratos` | `status` | **livre (sem enum/CHECK)** | `ativo` |
| `webhook_simulation_runs` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `cron.job_run_details` | `status` | **livre (sem enum/CHECK)** |  |
| `sefaz_dfe_cursor` | `ultimo_status` | **livre (sem enum/CHECK)** |  |
| `nfe_recebidas` | `manifestacao_status` | `pendente`, `ciencia`, `confirmada`, `desconhecida`, `nao_realizada` | `pendente` |
| `nfe_recebidas` | `situacao_nfe` | **livre (sem enum/CHECK)** |  |
| `nfe_eventos` | `status_retorno` | **livre (sem enum/CHECK)** |  |
| `ci_security_gate_events` | `expected_state` | **livre (sem enum/CHECK)** |  |
| `entregas_obrigacoes` | `status` | `dispensada`, `entregue`, `pendente`, `retificada` | `pendente` |
| `digest_envios_log` | `situacao` | `enviado`, `falhou`, `ignorado`, `simulado` |  |
| `catalogos_tributarios_health_history` | `status` | **livre (sem enum/CHECK)** |  |
| `catalogos_fiscais_cargas` | `status` | `erro`, `ok`, `sem_alteracao` | `ok` |
| `simulacoes` | `status` | **livre (sem enum/CHECK)** |  |
| `oportunidades_elisao` | `status` | `aprovada`, `descartada`, `em_analise`, `em_execucao`, `identificada`, `implementada` | `identificada` |
| `bitrix24_stage_mappings` | `lalamove_status` | **livre (sem enum/CHECK)** |  |
| `bitrix24_stage_mappings` | `bitrix_stage_name` | **livre (sem enum/CHECK)** |  |
| `alerts_sent` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `cron_job_logs` | `status` | **livre (sem enum/CHECK)** |  |

### E.2 Mapas de transição declarados no código

_nenhum mapa explícito encontrado — transições só existem implicitamente nos `if`s (veja E.3)_

### E.3 Valores de status usados no código (escreve / compara / filtra)

| Campo | Valor | Uso | Onde |
|---|---|---|---|
| `type` | `AwaitExpression` | compara | `eslint-rules/no-floating-supabase-write.js` |
| `type` | `CallExpression` | compara | `eslint-rules/no-floating-supabase-write.js` |
| `type` | `ChainExpression` | compara | `eslint-rules/no-floating-supabase-write.js` |
| `type` | `INVALID_UUID` | escreve | `supabase/functions/webhook-simulator/index.ts` |
| `type` | `Identifier` | compara | `eslint-rules/no-floating-supabase-write.js` |
| `type` | `MALFORMED` | escreve | `supabase/functions/webhook-simulator/index.ts` |
| `type` | `MISSING_FIELDS` | escreve | `supabase/functions/webhook-simulator/index.ts` |
| `type` | `MemberExpression` | compara | `eslint-rules/no-floating-supabase-write.js` |
| `type` | `ONCRMDEALADD` | escreve | `supabase/functions/webhook-simulator/index.ts` |
| `type` | `ONCRMDEALUPDATE` | escreve | `supabase/functions/webhook-simulator/index.ts` |
| `type` | `PAYMENT_CONFIRMED` | escreve | `supabase/functions/webhook-simulator/index.ts` |
| `type` | `PAYMENT_OVERDUE` | escreve | `supabase/functions/webhook-simulator/index.ts` |
| `type` | `PAYMENT_RECEIVED` | escreve | `supabase/functions/webhook-simulator/index.ts` |
| `type` | `PAYMENT_REFUNDED` | escreve | `supabase/functions/webhook-simulator/index.ts` |
| `type` | `POP` | compara, escreve | `src/lib/navigation.ts` |
| `type` | `REPLACE` | compara | `src/lib/navigation.ts` |
| `type` | `SQL_INJECTION` | escreve | `supabase/functions/webhook-simulator/index.ts` |
| `type` | `TRANSFER_DONE` | escreve | `supabase/functions/webhook-simulator/index.ts` |
| `type` | `TRANSFER_FAILED` | escreve | `supabase/functions/webhook-simulator/index.ts` |
| `type` | `TSAsExpression` | compara | `eslint-rules/no-floating-supabase-write.js` |
| `type` | `TSNonNullExpression` | compara | `eslint-rules/no-floating-supabase-write.js` |
| `type` | `TSSatisfiesExpression` | compara | `eslint-rules/no-floating-supabase-write.js` |
| `type` | `UnaryExpression` | compara | `eslint-rules/no-floating-supabase-write.js` |
| `type` | `User` | escreve | `supabase/functions/scim-server/index.ts` |
| `type` | `XSS` | escreve | `supabase/functions/webhook-simulator/index.ts` |
| `type` | `agendar_cobranca` | compara | `src/hooks/useExpertActions.ts` |
| `type` | `alerta` | compara, escreve | `src/components/expert/ProactiveSuggestions.tsx` |
| `type` | `alertas-orcamento` | escreve | `src/hooks/useDashboardConfig.ts` |
| `type` | `all` | compara, escreve | `src/components/alertas/AlertaComponents.tsx` |
| `type` | `analisar_fluxo` | compara | `src/hooks/useExpertActions.ts` |
| `type` | `aprovacoes` | escreve | `src/hooks/useDashboardConfig.ts` |
| `type` | `aprovar_pagamento` | compara | `src/components/expert/ExpertChatMessages.tsx`<br>`src/hooks/useExpertActions.ts` |
| `type` | `array` | escreve | `src/lib/ofx-parser/xlsx.ts`<br>`supabase/functions/analise-fluxo-ia/index.ts` |
| `type` | `atualizar_score_cliente` | compara | `src/hooks/useExpertActions.ts` |
| `type` | `audit` | compara, escreve | `src/components/contas-receber/DrawerTimelineTab.tsx` |
| `type` | `barras` | escreve | `src/components/boletos/BoletoBarcode.tsx` |
| `type` | `bling-financeiro` | escreve | `src/hooks/useDashboardConfig.ts` |
| `type` | `bling-nfe` | escreve | `src/hooks/useDashboardConfig.ts` |
| `type` | `blob` | escreve | `src/lib/sped-zip.ts` |
| `type` | `boolean` | escreve | `supabase/functions/scim-server/index.ts` |
| `type` | `change` | escreve | `src/hooks/useNetworkStatus.ts` |
| `type` | `checkbox` | compara | `src/hooks/useZodForm.ts` |
| `type` | `click` | compara | `src/lib/sound-feedback.ts` |
| `type` | `cnpj` | compara, escreve | `src/lib/brazilian-validators/pix.ts`<br>`src/lib/masks.ts` |
| `type` | `color` | compara, escreve | `src/components/ui/ux-validator/helpers.tsx` |
| `type` | `compensacao` | escreve | `src/components/conciliacao/ConciliacaoAuditPanel.tsx` |
| `type` | `complex` | escreve | `supabase/functions/scim-server/index.ts` |
| `type` | `composicao` | escreve | `src/hooks/useDashboardConfig.ts` |
| `type` | `consultar_cliente` | compara | `src/hooks/useExpertActions.ts` |
| `type` | `consultar_fornecedor` | compara | `src/hooks/useExpertActions.ts` |
| `type` | `consultar_saldos` | compara | `src/hooks/useExpertActions.ts` |
| `type` | `consultar_vencimentos` | compara | `src/hooks/useExpertActions.ts` |
| `type` | `cpf` | compara, escreve | `src/lib/brazilian-validators/pix.ts`<br>`src/lib/masks.ts` |
| `type` | `criar_alerta` | compara | `src/components/expert/ExpertChatMessages.tsx`<br>`src/hooks/useExpertActions.ts` |
| `type` | `criar_conta_pagar` | compara | `src/hooks/useExpertActions.ts` |
| `type` | `criar_conta_receber` | compara | `src/hooks/useExpertActions.ts` |
| `type` | `critical` | compara, escreve | `src/components/audit/AuditSecurityAlerts.tsx`<br>`src/pages/AuditLogs.tsx`<br>`src/pages/AuditLogsFiltros.tsx` |
| `type` | `divergencia` | compara, escreve | `src/components/conciliacao/ConciliacaoAuditPanel.tsx`<br>`src/components/conciliacao/ConciliacaoAuditPanelConteudo.tsx` |
| `type` | `dragenter` | compara | `src/components/conciliacao/ImportarExtratoDialog.tsx`<br>`src/components/contas-receber/BaixaAutomaticaDialog.tsx` |
| `type` | `dragleave` | compara | `src/components/conciliacao/ImportarExtratoDialog.tsx`<br>`src/components/contas-receber/BaixaAutomaticaDialog.tsx` |
| `type` | `dragover` | compara | `src/components/conciliacao/ImportarExtratoDialog.tsx`<br>`src/components/contas-receber/BaixaAutomaticaDialog.tsx` |
| `type` | `email` | compara | `src/lib/brazilian-validators/pix.ts` |
| `type` | `error` | compara, escreve | `src/components/contabilidade/SpedEcdWizard.tsx`<br>`src/components/contabilidade/sped-contabil/SpedHistoricoRow.tsx`<br>`src/components/contabilidade/sped-ecf-historico/HistoricoRow.tsx`<br>`src/components/contabilidade/sped-ecf-wizard/Step2Validacoes.tsx`<br>`src/components/nfe/SefazMonitor.tsx`<br>… +1 |
| `type` | `event` | escreve | `src/components/contas-receber/DrawerTimelineTab.tsx`<br>`supabase/functions/_shared/edge-observability.ts` |
| `type` | `failure_count` | compara, escreve | `src/components/nfe/AutoContingenciaConfig.tsx`<br>`src/components/nfe/SefazMonitor.tsx`<br>`src/components/nfe/auto-contingencia/ContingenciaRuleDialog.tsx`<br>`src/components/nfe/auto-contingencia/ContingenciaRulesList.tsx`<br>`src/lib/sefaz-contingency/constants.ts`<br>… +2 |
| `type` | `file` | compara, escreve | `src/components/ui/tree-view.tsx` |
| `type` | `fluxo-caixa` | escreve | `src/hooks/useDashboardConfig.ts` |
| `type` | `folder` | compara | `src/components/ui/tree-view.tsx` |
| `type` | `function` | escreve | `supabase/functions/analise-fluxo-ia/index.ts`<br>`supabase/functions/copilot-global/index.ts`<br>`supabase/functions/processar-nf-ocr/index.ts` |
| `type` | `gerar_boleto` | compara | `src/hooks/useExpertActions.ts` |
| `type` | `gerar_relatorio` | compara | `src/components/expert/ExpertChatMessages.tsx`<br>`src/hooks/useExpertActions.ts` |
| `type` | `image_url` | escreve | `supabase/functions/analyze-document/index.ts`<br>`supabase/functions/processar-nf-ocr/index.ts` |
| `type` | `info` | compara | `src/components/nfe/sefaz-monitor/SefazAlertsPanel.tsx` |
| `type` | `json_object` | escreve | `supabase/functions/gerar-acoes-recomendadas/index.ts` |
| `type` | `kpi-saldo` | escreve | `src/hooks/useDashboardConfig.ts` |
| `type` | `kpi-vencidas` | escreve | `src/hooks/useDashboardConfig.ts` |
| `type` | `latency` | compara, escreve | `src/components/nfe/AutoContingenciaConfig.tsx`<br>`src/components/nfe/auto-contingencia/ContingenciaRuleDialog.tsx`<br>`src/components/nfe/auto-contingencia/ContingenciaRulesList.tsx`<br>`src/lib/sefaz-contingency/constants.ts`<br>`src/lib/sefaz-contingency/rules.ts` |
| `type` | `light` | escreve | `src/components/ui/micro-interactions.helpers.ts` |
| `type` | `listar_aprovacoes` | compara | `src/components/expert/ExpertChatMessages.tsx`<br>`src/hooks/useExpertActions.ts` |
| `type` | `lote` | compara, escreve | `src/components/contabilidade/contabilizacao-automatica/SimulacaoDialog.tsx`<br>`src/components/contabilidade/contabilizacao-automatica/types.ts`<br>`src/components/contabilidade/contabilizacao-automatica/useContabilizacaoMutations.ts` |
| `type` | `magiclink` | escreve | `supabase/functions/sso-callback/index.ts` |
| `type` | `navegar` | compara | `src/components/expert/ExpertChatMessages.tsx`<br>`src/hooks/useExpertActions.ts` |
| `type` | `number` | compara, escreve | `src/hooks/useZodForm.ts`<br>`supabase/functions/analise-fluxo-ia/index.ts`<br>`supabase/functions/processar-nf-ocr/index.ts` |
| `type` | `oauthbearertoken` | escreve | `supabase/functions/scim-server/index.ts` |
| `type` | `object` | escreve | `eslint-rules/no-floating-supabase-write.js`<br>`supabase/functions/analise-fluxo-ia/index.ts`<br>`supabase/functions/copilot-global/index.ts`<br>`supabase/functions/processar-nf-ocr/index.ts` |
| `type` | `oidc` | escreve | `supabase/functions/sso-initiate/index.ts` |
| `type` | `oportunidade` | compara, escreve | `src/components/expert/ProactiveSuggestions.tsx` |
| `type` | `otimizacao` | compara, escreve | `src/components/expert/ProactiveSuggestions.tsx` |
| `type` | `pagar` | compara, escreve | `src/components/boletos/NovoBoletoForm.tsx` |
| `type` | `phone` | compara | `src/lib/brazilian-validators/pix.ts` |
| `type` | `previsao-ia` | escreve | `src/hooks/useDashboardConfig.ts` |
| `type` | `problem` | escreve | `eslint-rules/no-floating-supabase-write.js` |
| `type` | `public-key` | escreve | `src/hooks/useWebAuthn.ts` |
| `type` | `random` | compara | `src/lib/brazilian-validators/pix.ts` |
| `type` | `react-error-boundary` | escreve | `src/lib/error-tracking.ts` |
| `type` | `receber` | compara, escreve | `src/components/bi/BIDrillDown.tsx`<br>`src/components/boletos/NovoBoletoForm.tsx` |
| `type` | `receita` | compara, escreve | `src/components/ui/rank-badge.tsx` |
| `type` | `risco` | compara, escreve | `src/components/expert/ProactiveSuggestions.tsx` |
| `type` | `saml` | escreve | `supabase/functions/sso-initiate/index.ts` |
| `type` | `schedule` | compara, escreve | `src/components/nfe/AutoContingenciaConfig.tsx`<br>`src/components/nfe/auto-contingencia/ContingenciaRuleDialog.tsx`<br>`src/components/nfe/auto-contingencia/ContingenciaRulesList.tsx`<br>`src/lib/sefaz-contingency/constants.ts`<br>`src/lib/sefaz-contingency/rules.ts` |
| `type` | `single` | compara, escreve | `src/components/contabilidade/contabilizacao-automatica/SimulacaoDialog.tsx`<br>`src/components/contabilidade/contabilizacao-automatica/types.ts`<br>`src/components/contabilidade/contabilizacao-automatica/useContabilizacaoMutations.ts` |
| `type` | `spring` | escreve | `src/components/alertas/AlertaComponents.tsx`<br>`src/components/auth/AuthBackground.tsx`<br>`src/components/auth/ForgotPasswordForm.tsx`<br>`src/components/cobranca/CobrancaKpis.tsx`<br>`src/components/cobranca/MetricasPorCanal.tsx`<br>… +52 |
| `type` | `sso-slo-initiated` | compara, escreve | `src/lib/sso-sync.ts` |
| `type` | `string` | escreve | `eslint-rules/no-floating-supabase-write.js`<br>`supabase/functions/analise-fluxo-ia/index.ts`<br>`supabase/functions/processar-nf-ocr/index.ts`<br>`supabase/functions/scim-server/index.ts` |
| `type` | `success` | compara | `src/components/nfe/SefazMonitor.tsx`<br>`src/components/nfe/sefaz-monitor/SefazAlertsPanel.tsx` |
| `type` | `text` | escreve | `supabase/functions/analyze-document/index.ts`<br>`supabase/functions/processar-nf-ocr/index.ts` |
| `type` | `time_window` | compara, escreve | `src/components/nfe/AutoContingenciaConfig.tsx`<br>`src/components/nfe/auto-contingencia/ContingenciaRuleDialog.tsx`<br>`src/components/nfe/auto-contingencia/ContingenciaRulesList.tsx`<br>`src/lib/sefaz-contingency/constants.ts`<br>`src/lib/sefaz-contingency/rules.ts` |
| `type` | `top-clientes` | escreve | `src/hooks/useDashboardConfig.ts` |
| `type` | `tween` | escreve | `src/components/layout/page-transition.constants.ts`<br>`src/components/layout/transitions/presets.ts` |
| `type` | `uint8array` | escreve | `supabase/functions/gerar-pacote-evidencias/index.ts` |
| `type` | `unhandledrejection` | escreve | `src/lib/telemetry.ts` |
| `type` | `vencimentos` | escreve | `src/hooks/useDashboardConfig.ts` |
| `type` | `warn` | escreve | `src/components/contabilidade/SpedEcdWizard.tsx`<br>`src/components/contabilidade/sped-contabil/SpedHistoricoRow.tsx`<br>`src/components/contabilidade/sped-ecf-historico/HistoricoRow.tsx`<br>`src/components/contabilidade/sped-ecf-wizard/Step2Validacoes.tsx` |
| `type` | `warning` | compara, escreve | `src/components/nfe/SefazMonitor.tsx`<br>`src/components/nfe/sefaz-monitor/SefazAlertsPanel.tsx`<br>`src/pages/AuditLogs.tsx` |
| `type` | `window` | escreve | `public/sw-push.js`<br>`public/sw.js` |
| `type` | `work` | escreve | `src/lib/scim/userTemplate.ts`<br>`supabase/functions/scim-server/index.ts` |
| `status` | `ACCEPTED` | escreve | `supabase/functions/asaas-proxy/index.ts` |
| `status` | `ACTIVE` | compara | `src/components/asaas/AssinaturasListPanel.tsx` |
| `status` | `CANCELLED` | escreve | `supabase/functions/asaas-proxy/index.ts` |
| `status` | `CLOSED` | escreve | `supabase/functions/_shared/resilience.ts` |
| `status` | `COMPLETED` | escreve | `supabase/functions/asaas-proxy/index.ts` |
| `status` | `CONFIRMED` | compara | `src/components/asaas/TransferenciaPixHistoryPanel.tsx`<br>`src/components/asaas/tabs/CobrancasTabConteudo.tsx`<br>`src/components/pix-hub/PixRecebimento.tsx`<br>`src/pages/Asaas.parts.tsx` |
| `status` | `Conciliado` | compara | `src/components/relatorios/RelatoriosDetalhado.tsx` |
| `status` | `DONE` | compara | `src/components/asaas/TransferenciaPixHistoryPanel.tsx` |
| `status` | `EXPIRADO` | compara | `src/lib/organizacoes/convites.ts` |
| `status` | `FAILED` | compara, escreve, filtra | `src/components/asaas/TransferenciaPixHistoryPanel.tsx`<br>`supabase/functions/asaas-proxy/index.ts`<br>`supabase/functions/gerar-resumo-financeiro-diario/index.ts` |
| `status` | `OPEN` | compara | `supabase/functions/_shared/resilience.ts` |
| `status` | `OVERDUE` | compara | `src/components/asaas/tabs/CobrancasTabConteudo.tsx`<br>`src/hooks/useAsaas.ts`<br>`src/pages/Asaas.parts.tsx` |
| `status` | `PENDENTE` | compara | `src/pages/organizacoes/Organizacoes.parts.tsx` |
| `status` | `PENDING` | compara, escreve, filtra | `src/components/asaas/TransferenciaPixHistoryPanel.tsx`<br>`src/components/asaas/tabs/CobrancasTabConteudo.tsx`<br>`src/hooks/financial/useDashboardKPIs.ts`<br>`src/hooks/useAsaas.ts`<br>`src/pages/Asaas.parts.tsx`<br>… +2 |
| `status` | `PROCESSING` | compara | `src/components/asaas/TransferenciaPixHistoryPanel.tsx` |
| `status` | `RECEIVED` | compara, escreve, filtra | `src/components/pix-hub/PixRecebimento.tsx`<br>`src/pages/Asaas.parts.tsx`<br>`supabase/functions/gerar-resumo-financeiro-diario/index.ts`<br>`supabase/functions/webhook-simulator/contract_test.ts`<br>`supabase/functions/webhook-simulator/index.ts` |
| `status` | `REFUNDED` | escreve | `supabase/functions/asaas-proxy/index.ts` |
| `status` | `SUBSCRIBED` | compara | `src/components/admin/telemetry/PerformanceAlertsPanel.tsx` |
| `status` | `UTILIZADO` | compara | `src/lib/organizacoes/convites.ts`<br>`src/pages/organizacoes/Organizacoes.parts.tsx` |
| `status` | `aberta` | compara, escreve, filtra | `src/hooks/useSolicitacoesLGPD.ts`<br>`src/pages/CentroPrivacidadeLGPD.tsx`<br>`src/types/reforma-tributaria/operacoes.ts`<br>`supabase/functions/calcular-health-score-operacional/index.ts`<br>`supabase/functions/gerar-acoes-recomendadas/index.ts` |
| `status` | `aceito` | compara, escreve, filtra | `src/components/conciliacao/ConciliacaoAuditPanel.tsx`<br>`src/components/conciliacao/DivergenciasConciliacaoPanel.tsx`<br>`src/hooks/useDivergenciasConciliacao.ts` |
| `status` | `active` | compara, escreve | `src/components/integracoes/open-finance/OpenFinanceConnectDialog.tsx`<br>`supabase/functions/open-finance/index.ts` |
| `status` | `all` | compara, escreve | `src/hooks/financial/useContasPagar.ts`<br>`src/hooks/financial/useContasReceber.ts`<br>`src/pages/Clientes.tsx`<br>`src/pages/Fornecedores.tsx` |
| `status` | `analyzing` | compara, escreve | `src/components/comprovantes/ComprovanteOCR.tsx`<br>`src/components/expert/DocumentAnalyzer.tsx` |
| `status` | `aprovada` | compara | `src/components/contas-pagar/ContaPagarRowAprovacaoBadge.tsx` |
| `status` | `aprovado` | compara, escreve | `src/components/aprovacoes/HistoricoAprovacoes.tsx`<br>`src/components/aprovacoes/PasswordResetApprovals.tsx`<br>`src/components/contas-pagar/RegistrarPagamentoDialog.tsx`<br>`src/hooks/useConformidadeFiscal.ts`<br>`src/hooks/useContasPagarLogic.calculos.ts`<br>… +4 |
| `status` | `assinado` | compara | `src/components/documentos/AssinaturaDigital.tsx` |
| `status` | `atencao` | compara | `src/pages/OrcamentoEvento.tsx`<br>`supabase/functions/verificar-conformidade-fiscal/index.ts` |
| `status` | `atendida` | compara, escreve | `src/pages/CentroPrivacidadeLGPD.tsx`<br>`supabase/functions/processar-solicitacao-lgpd/escrita.ts` |
| `status` | `ativo` | compara, escreve | `src/components/contratos/GestaoContratos.tsx`<br>`src/hooks/useAcordosParcelamento.ts`<br>`src/hooks/useAcordosParcelamento.types.ts`<br>`src/hooks/useContratos.ts`<br>`src/pages/Integracoes.tsx`<br>… +1 |
| `status` | `atrasada` | compara | `src/components/reforma-tributaria/ObrigacoesAcessorias.tsx` |
| `status` | `atrasado` | compara | `src/pages/Financeiro.tsx` |
| `status` | `atual` | compara, escreve | `src/components/aprovacoes/AprovacoesPendentesConteudo.tsx`<br>`src/components/aprovacoes/WorkflowVisualizer.tsx` |
| `status` | `ausente` | compara, escreve | `src/components/compliance/verificar-integridade/LinhaResultado.tsx`<br>`src/components/compliance/verificar-integridade/types.ts`<br>`src/components/compliance/verificar-integridade/useIntegridadeVerifier.ts` |
| `status` | `authorized` | compara, filtra | `src/components/integracoes/open-finance/OpenFinanceConsentList.tsx`<br>`supabase/functions/open-finance/index.ts` |
| `status` | `autorizada` | compara, escreve | `src/components/nfe/CancelamentoNFe.tsx`<br>`src/components/nfe/DANFEGenerator.tsx`<br>`src/components/nfe/contingencia/ContingenciaPendingList.tsx`<br>`src/components/nfe/nfe-types.ts`<br>`src/hooks/useImportacaoXMLNFe.ts`<br>… +2 |
| `status` | `awaiting_authorization` | compara | `src/components/integracoes/open-finance/OpenFinanceConsentList.tsx` |
| `status` | `bloqueado` | compara, escreve | `src/hooks/useSpedContabil.ts`<br>`supabase/functions/log-sped-bitrix24/index.ts` |
| `status` | `calculado` | compara, escreve | `src/components/reforma-tributaria/ApuracaoMensal.tsx`<br>`src/hooks/useApuracoesTributarias.ts`<br>`src/hooks/useIRPJCSLL.ts` |
| `status` | `cancelada` | compara, escreve | `src/components/nfe/NFePreview.tsx`<br>`src/pages/NotasFiscais.tsx` |
| `status` | `cancelado` | compara, escreve, filtra | `src/components/boletos/BoletoPreviewPanel.tsx`<br>`src/components/cobranca/previsao/risco.ts`<br>`src/components/contas-receber/BaixaAutomaticaDialog.tsx`<br>`src/components/contas-receber/ContaReceberDetailDrawer.tsx`<br>`src/components/contas-receber/row/AcoesCell.tsx`<br>… +24 |
| `status` | `cancelled` | escreve | `supabase/functions/detectar-anomalias-financeiras/index.ts` |
| `status` | `compensado` | compara | `src/components/reforma-tributaria/GestorCreditosTributarios.tsx` |
| `status` | `complete` | compara, escreve | `src/components/comprovantes/ComprovanteOCR.tsx`<br>`src/components/expert/DocumentAnalyzer.tsx` |
| `status` | `completed` | compara, escreve | `src/components/admin/WebhookSimulator.tsx`<br>`src/hooks/useAnomaliaDetectionRun.ts`<br>`supabase/functions/asaas-proxy/index.ts`<br>`supabase/functions/detectar-anomalias-financeiras/index.ts`<br>`supabase/functions/webhook-simulator/index.ts` |
| `status` | `completo` | compara, escreve | `src/components/aprovacoes/AprovacoesPendentesConteudo.tsx`<br>`src/components/aprovacoes/WorkflowVisualizer.tsx` |
| `status` | `conciliada` | compara | `src/components/conciliacao/ConciliacaoExport.tsx` |
| `status` | `concluido` | compara | `src/components/bling/BlingWebhooksPanel.tsx`<br>`src/components/conciliacao/ConciliacaoRetroativaPanel.tsx`<br>`src/components/dashboard/PlanosAcaoPanel.tsx`<br>`src/components/reforma-tributaria/CronogramaTransicao.tsx` |
| `status` | `configurando` | escreve | `src/pages/Integracoes.tsx` |
| `status` | `confirmada` | compara, escreve, filtra | `src/components/admin/AnomaliasList.tsx`<br>`src/components/admin/anomalias-review-queue/atalhos.ts`<br>`src/components/admin/anomalias-review-queue/conflito.ts`<br>`src/components/admin/anomalias-review-queue/useReviewQueue.ts`<br>`src/components/insights-ia/anomalia/AnomaliaHeader.tsx`<br>… +2 |
| `status` | `confirmado` | compara, escreve | `src/components/contabilidade/LancamentosTabConteudo.tsx`<br>`src/components/contas-receber/BaixaAutomaticaDialog.tsx`<br>`src/components/contas-receber/RegistrarRecebimentoDialog.tsx`<br>`supabase/functions/contabilizar-evento/index.ts` |
| `status` | `contact_not_found` | escreve | `supabase/functions/sync-profile-to-bitrix/index.ts` |
| `status` | `corrigido` | escreve | `src/components/conciliacao/DivergenciasConciliacaoPanel.tsx` |
| `status` | `dead` | compara | `supabase/functions/monitor-health/index.ts` |
| `status` | `deferido` | compara | `src/hooks/usePerDcomp.ts` |
| `status` | `degraded` | compara | `src/pages/StatusPage.tsx` |
| `status` | `delivered` | compara | `supabase/functions/whatsapp-webhook/index.ts` |
| `status` | `dispensada` | compara | `src/lib/tributario/obrigacoes/conformidade.ts`<br>`src/pages/tributario/ObrigacoesAcessorias.tsx`<br>`supabase/functions/_shared/obrigacoes/conformidade.ts` |
| `status` | `disponivel` | compara, escreve, filtra | `src/components/reforma-tributaria/DashboardMetricasTributarias.helpers.ts`<br>`src/components/reforma-tributaria/GestorCreditosTributarios.tsx`<br>`src/components/reforma-tributaria/PerDcompPanel.tsx`<br>`src/components/reforma-tributaria/RelatoriosContabeisTributariosTabs.tsx`<br>`src/hooks/useAlertasTributarios.ts`<br>… +4 |
| `status` | `divergente` | compara, escreve | `src/components/compliance/verificar-integridade/LinhaResultado.tsx`<br>`src/components/compliance/verificar-integridade/types.ts`<br>`src/components/compliance/verificar-integridade/useIntegridadeVerifier.ts`<br>`src/hooks/useConciliacaoTributaria.ts`<br>`src/lib/tributario/ipi-iss/overlay-iss.ts`<br>… +1 |
| `status` | `done` | compara | `src/components/contabilidade/elisao/ElisaoFiscalTab.tsx` |
| `status` | `duplicado` | escreve | `supabase/functions/contabilizar-evento/index.ts` |
| `status` | `em_acordo` | compara, escreve, filtra | `src/hooks/useAcordosParcelamento.ts` |
| `status` | `em_analise` | compara | `src/hooks/usePerDcomp.ts`<br>`src/pages/CentroPrivacidadeLGPD.tsx` |
| `status` | `em_andamento` | compara | `src/components/reforma-tributaria/CronogramaTransicao.tsx`<br>`src/components/reforma-tributaria/ObrigacoesAcessorias.tsx` |
| `status` | `em_revisao` | escreve | `src/hooks/useFechamentoTributario.ts`<br>`supabase/functions/executar-fechamento-tributario/index.ts` |
| `status` | `empty` | compara, escreve | `src/pages/configuracoes/filtros-salvos/Badges.tsx`<br>`src/pages/configuracoes/filtros-salvos/helpers.ts` |
| `status` | `entregue` | compara | `src/hooks/useEntregasObrigacoes.ts`<br>`src/lib/tributario/obrigacoes/conformidade.ts`<br>`src/pages/tributario/ObrigacoesAcessorias.tsx`<br>`supabase/functions/_shared/obrigacoes/conformidade.ts` |
| `status` | `enviado` | compara, escreve | `src/components/boletos/BoletoPreviewPanel.tsx`<br>`src/components/cobranca/FilaCobrancasPanel.tsx`<br>`src/components/contas-receber/DrawerCobrancasTab.tsx`<br>`src/components/financeiro/cobranca/WhatsAppHistoryIA.tsx`<br>`src/components/relatorios/RelatoriosAgendados.tsx`<br>… +4 |
| `status` | `erro` | compara, escreve | `src/components/bling/BlingWebhooksPanel.tsx`<br>`src/components/conciliacao/ConciliacaoRetroativaPanel.tsx`<br>`src/components/contabilidade/contabilizacao-automatica/LogsTable.tsx`<br>`src/components/contabilidade/contabilizacao-automatica/StatsCards.tsx`<br>`src/components/reforma-tributaria/ImportacaoXMLPanel.tsx`<br>… +10 |
| `status` | `error` | compara, escreve | `src/components/compliance/EvidenciaStatusDialog.tsx`<br>`src/components/compliance/EvidenciasTab.tsx`<br>`src/components/comprovantes/ComprovanteOCR.tsx`<br>`src/components/contabilidade/SpedEcdPreviewDialog.tsx`<br>`src/components/contabilidade/sped-ecf-wizard/Step3DownloadParts.tsx`<br>… +13 |
| `status` | `estornado` | compara, escreve | `src/components/reforma-tributaria/GestorCreditosTributarios.tsx`<br>`src/hooks/useCreditosTributarios.ts` |
| `status` | `estouro` | compara | `src/components/orcamento/OrcamentoCardsView.tsx`<br>`src/pages/OrcamentoEvento.tsx` |
| `status` | `excluido` | escreve | `src/components/cobranca/NegativacoesProtestosPanel.tsx` |
| `status` | `expirado` | compara | `src/components/reforma-tributaria/GestorCreditosTributarios.tsx` |
| `status` | `extra` | compara, escreve | `src/components/compliance/verificar-integridade/LinhaResultado.tsx`<br>`src/components/compliance/verificar-integridade/types.ts`<br>`src/components/compliance/verificar-integridade/useIntegridadeVerifier.ts` |
| `status` | `failed` | compara, escreve | `src/components/admin/CronJobsStatus.tsx`<br>`src/components/admin/WebhookSimulator.tsx`<br>`src/components/asaas/tabs/FilaTab.tsx`<br>`src/hooks/useAnomaliaDetectionRun.ts`<br>`src/pages/configuracoes/HistoricoNotificacoes.tsx`<br>… +3 |
| `status` | `falha` | compara | `src/hooks/useFinancialAlerts.tsx` |
| `status` | `falhou` | escreve | `supabase/functions/processar-fila-cobrancas/index.ts` |
| `status` | `falso_positivo` | compara, escreve | `src/components/admin/AnomaliasList.tsx`<br>`src/components/admin/anomalias-review-queue/useReviewQueue.ts`<br>`src/components/insights-ia/anomalia/AnomaliaHeader.tsx`<br>`src/hooks/useAnomaliasDetectadas.ts`<br>`supabase/functions/relatorio-diario-anomalias/index.ts` |
| `status` | `fechada` | compara | `supabase/functions/verificar-conformidade-fiscal/index.ts` |
| `status` | `fechado` | compara, escreve | `src/components/tributario/dashboard/AssistenteFechamentoMensal.tsx`<br>`src/hooks/useFechamentoTributario.ts`<br>`supabase/functions/executar-fechamento-tributario/index.ts` |
| `status` | `finalizado` | compara | `supabase/functions/calcular-health-score-operacional/index.ts` |
| `status` | `fulfilled` | compara | `src/hooks/useConciliacaoIgnorarActions.ts` |
| `status` | `gap` | compara, escreve | `src/lib/pdf-generator/benchmarking.ts`<br>`src/pages/benchmarking/BenchmarkingConcorrentes.tsx` |
| `status` | `gerado` | compara, escreve, filtra | `src/components/contabilidade/sped-contabil/SpedKpiCards.tsx`<br>`src/components/reforma-tributaria/retencoes/DARFsTable.tsx`<br>`src/components/relatorios/RelatoriosAgendados.tsx`<br>`src/components/relatorios/RelatoriosAgendadosHistoricoExecucoes.tsx`<br>`src/hooks/useAlertasTributarios.ts`<br>… +8 |
| `status` | `identificada` | escreve, filtra | `src/hooks/useOportunidadesElisao.ts` |
| `status` | `idle` | escreve | `src/types/financial.ts` |
| `status` | `ignorado` | escreve | `src/hooks/useAuditoriaCompliance.ts` |
| `status` | `igual` | compara | `src/components/analytics/BenchmarkingSetorial.tsx` |
| `status` | `importado` | compara, escreve | `src/components/reforma-tributaria/ImportacaoXMLPanel.tsx`<br>`src/hooks/useImportacaoXMLNFe.ts` |
| `status` | `incluido` | compara, escreve | `src/components/cobranca/NegativacoesProtestosPanel.tsx` |
| `status` | `indeferido` | compara | `src/hooks/usePerDcomp.ts` |
| `status` | `investigando` | compara, escreve | `src/components/admin/AnomaliaDrillDownDrawer.tsx`<br>`src/components/admin/AnomaliasList.tsx`<br>`src/components/admin/anomalias-review-queue/useReviewQueue.ts`<br>`src/components/insights-ia/anomalia/AnomaliaHeader.tsx`<br>`src/hooks/useAnomaliasDetectadas.ts`<br>… +1 |
| `status` | `justificado` | escreve | `src/hooks/useConciliacaoTributaria.ts` |
| `status` | `loading` | compara | `src/components/ui/status-badge.tsx`<br>`src/pages/configuracoes/filtros-salvos/Badges.tsx` |
| `status` | `matched` | compara, escreve | `src/components/admin/sso/sandbox/ClaimFocusCard.tsx`<br>`src/components/admin/sso/sandbox/RulesAppliedCard.tsx`<br>`src/components/admin/sso/sandbox/SandboxRunDetailSheet.tsx`<br>`src/components/admin/sso/sandbox/outcome.ts`<br>`src/components/admin/sso/sandbox/types.ts`<br>… +2 |
| `status` | `melhor` | compara, escreve | `src/components/analytics/BenchmarkingSetorial.tsx` |
| `status` | `nova` | compara, escreve, filtra | `src/components/admin/AnomaliaDrillDownDrawer.tsx`<br>`src/components/admin/AnomaliasDetectadasPanel.helpers.ts`<br>`src/components/admin/AnomaliasList.tsx`<br>`src/components/admin/anomalias-review-queue/useReviewQueue.ts`<br>`src/components/insights-ia/anomalia/AcoesSugeridasCard.tsx`<br>… +7 |
| `status` | `ok` | compara, escreve | `src/components/compliance/verificar-integridade/LinhaResultado.tsx`<br>`src/components/compliance/verificar-integridade/types.ts`<br>`src/components/compliance/verificar-integridade/useIntegridadeVerifier.ts`<br>`src/components/contabilidade/SpedChecklistRow.tsx`<br>`src/components/contabilidade/SpedEcdPreviewDialog.tsx`<br>… +13 |
| `status` | `online` | escreve | `src/components/ui/badge.tsx` |
| `status` | `operational` | compara, escreve | `src/pages/StatusPage.tsx`<br>`supabase/functions/health/index.ts` |
| `status` | `outage` | compara | `src/pages/StatusPage.tsx`<br>`supabase/functions/health/index.ts` |
| `status` | `pago` | compara, escreve, filtra | `src/components/analytics/BenchmarkingSetorial.tsx`<br>`src/components/bi/BIDrillDown.tsx`<br>`src/components/bitrix/BitrixDealsTab.tsx`<br>`src/components/boletos/BoletoPreviewPanel.tsx`<br>`src/components/clientes/ClienteDetailDialog.tsx`<br>… +46 |
| `status` | `parcial` | compara | `src/components/clientes/ClienteDetailDialog.tsx`<br>`src/components/cobranca/previsao/risco.ts`<br>`src/components/contas-pagar/ContasPagarTableRow.tsx`<br>`src/components/fornecedores/FornecedorDetailDialog.tsx`<br>`src/lib/transaction-matcher/converters.ts` |
| `status` | `partial` | compara, escreve | `src/pages/benchmarking/BenchmarkingConcorrentes.tsx` |
| `status` | `pendente` | compara, escreve, filtra | `src/components/aprovacoes/AprovacoesPendentesConteudo.tsx`<br>`src/components/aprovacoes/HistoricoAprovacoes.tsx`<br>`src/components/aprovacoes/PasswordResetApprovals.tsx`<br>`src/components/asaas/NovaCobrancaDialog.tsx`<br>`src/components/clientes/ClienteDetailDialog.tsx`<br>… +59 |
| `status` | `pendente_aprovacao` | compara, escreve | `src/components/compras/PedidoCompraForm.tsx`<br>`src/lib/compras/pedidos.ts`<br>`src/pages/Compras.tsx` |
| `status` | `pending` | compara, escreve | `src/components/admin/WebhookSimulator.tsx`<br>`src/components/ui/file-upload.tsx`<br>`src/components/ui/ux-validator.tsx`<br>`src/components/ui/ux-validator/ReportModal.tsx`<br>`src/components/ui/ux-validator/helpers.tsx`<br>… +2 |
| `status` | `pior` | compara | `src/components/analytics/BenchmarkingSetorial.tsx` |
| `status` | `processado` | compara, escreve, filtra | `src/components/reforma-tributaria/OperacoesLista.tsx`<br>`src/hooks/useOperacoesTributaveis.ts`<br>`src/hooks/useSplitPayment.ts` |
| `status` | `processando` | compara, escreve | `src/components/cobranca/FilaCobrancasPanel.tsx`<br>`src/components/conciliacao/ConciliacaoRetroativaPanel.tsx`<br>`src/hooks/useConciliacaoRetroativa.ts`<br>`supabase/functions/executar-regua-cobranca/index.ts`<br>`supabase/functions/processar-nf-ocr/index.ts` |
| `status` | `protocolado` | escreve | `src/components/cobranca/NegativacoesProtestosPanel.tsx` |
| `status` | `queued` | escreve, filtra | `src/hooks/useAnomaliaDetectionRun.ts`<br>`supabase/functions/detectar-anomalias-financeiras/index.ts` |
| `status` | `quitado` | compara, escreve | `src/hooks/useAcordosParcelamento.ts` |
| `status` | `rascunho` | compara, escreve, filtra | `src/components/reforma-tributaria/ApuracaoMensal.tsx`<br>`src/components/reforma-tributaria/PerDcompPanel.tsx`<br>`src/components/reforma-tributaria/irpj-csll/IRPJCSLLCalculadora.tsx`<br>`src/components/reforma-tributaria/per-dcomp/PerDcompTable.tsx`<br>`src/hooks/useApuracoesTributarias.ts`<br>… +3 |
| `status` | `read` | compara | `supabase/functions/whatsapp-webhook/index.ts` |
| `status` | `realizado` | escreve | `src/components/financeiro/TransferenciaDialog.tsx`<br>`src/hooks/useFinancialOperations.ts` |
| `status` | `recebido` | compara, escreve, filtra | `src/components/contas-receber/row/AcoesCell.tsx`<br>`src/hooks/useAcordosParcelamento.ts`<br>`src/hooks/useCalculadoraDadosReais.ts`<br>`src/hooks/useContasReceberLogic.calculos.ts`<br>`src/hooks/useContasReceberLogic.ts`<br>… +4 |
| `status` | `recolhido` | compara | `src/components/reforma-tributaria/RetencoesFonte.tsx`<br>`src/hooks/useRetencoesFonte.ts` |
| `status` | `rejected` | compara | `src/lib/adaptive-chunk.ts`<br>`supabase/functions/sefaz-dfe-dispatcher/index.ts` |
| `status` | `rejeitada` | compara | `src/components/nfe/contingencia/ContingenciaPendingList.tsx`<br>`src/pages/CentroPrivacidadeLGPD.tsx` |
| `status` | `rejeitado` | compara, escreve | `src/components/aprovacoes/HistoricoAprovacoes.tsx`<br>`src/components/aprovacoes/PasswordResetApprovals.tsx`<br>`src/components/contabilidade/SpedEcfHistorico.tsx`<br>`src/components/contabilidade/ValidacoesPreSpedDialog.tsx`<br>`src/components/contabilidade/sped-contabil/SpedHistoricoRow.tsx`<br>… +7 |
| `status` | `resolvido` | compara, escreve | `src/hooks/useAuditoriaCompliance.ts` |
| `status` | `retificada` | compara | `src/lib/tributario/obrigacoes/conformidade.ts`<br>`supabase/functions/_shared/obrigacoes/conformidade.ts` |
| `status` | `retificado` | compara | `src/components/reforma-tributaria/ApuracaoMensal.tsx` |
| `status` | `retrying` | compara | `supabase/functions/monitor-health/index.ts` |
| `status` | `revisado` | compara | `src/components/reforma-tributaria/ApuracaoMensal.tsx` |
| `status` | `revoked` | compara, escreve | `src/components/integracoes/open-finance/OpenFinanceConsentList.tsx`<br>`supabase/functions/open-finance/index.ts` |
| `status` | `running` | compara, escreve, filtra | `src/components/admin/DetectionRunProgress.tsx`<br>`src/components/compliance/EvidenciaStatusDialog.tsx`<br>`src/components/compliance/EvidenciasTab.tsx`<br>`supabase/functions/detectar-anomalias-financeiras/index.ts`<br>`supabase/functions/webhook-simulator/index.ts` |
| `status` | `saudavel` | compara | `src/lib/tributario/catalogos/saude.ts` |
| `status` | `sem_alteracao` | compara | `src/components/admin/telemetry/CoberturaFiscalUFPanel.tsx` |
| `status` | `sem_catalogo` | compara, escreve | `src/lib/tributario/ipi-iss/overlay-iss.ts`<br>`src/pages/tributario/IssSimulador.tsx` |
| `status` | `sem_regra` | compara, escreve | `src/components/contabilidade/contabilizacao-automatica/SimulacaoDialog.tsx`<br>`src/components/contabilidade/contabilizacao-automatica/StatsCards.tsx`<br>`supabase/functions/contabilizar-evento/index.ts` |
| `status` | `sent` | escreve | `src/pages/configuracoes/HistoricoNotificacoes.tsx`<br>`supabase/functions/notify-saved-filter/index.ts` |
| `status` | `simulado` | compara, escreve | `src/components/contabilidade/contabilizacao-automatica/SimulacaoDialog.tsx`<br>`supabase/functions/contabilizar-evento/index.ts` |
| `status` | `skipped` | compara | `src/components/admin/sso/sandbox/ClaimFocusCard.tsx`<br>`src/components/admin/sso/sandbox/RulesAppliedCard.tsx` |
| `status` | `succeeded` | compara | `src/components/admin/AutomacoesTab.tsx`<br>`src/components/admin/CronJobsStatus.tsx`<br>`supabase/functions/calcular-slo-metrics-diario/index.ts` |
| `status` | `success` | compara, escreve | `src/components/compliance/EvidenciaStatusDialog.tsx`<br>`src/components/compliance/EvidenciasTab.tsx`<br>`src/components/contas-receber/WebhookConfigPanel.tsx`<br>`src/components/ui/file-upload.tsx`<br>`src/components/ui/ux-validator/ReportModal.tsx`<br>… +4 |
| `status` | `sucesso` | compara, escreve, filtra | `src/components/contabilidade/contabilizacao-automatica/LogsTable.tsx`<br>`src/components/contabilidade/contabilizacao-automatica/StatsCards.tsx`<br>`src/components/tributario/dashboard/UploadNotaFiscalOCR.tsx`<br>`supabase/functions/contabilizar-evento/index.ts`<br>`supabase/functions/executar-relatorios/index.ts`<br>… +1 |
| `status` | `todas` | compara | `src/components/admin/AnomaliasDetectadasPanel.tsx`<br>`src/hooks/saved-filter-alerts/matchers.ts` |
| `status` | `todos` | compara, escreve | `src/hooks/useNfeRecebidas.ts`<br>`src/pages/tributario/NfeRecebidas.tsx` |
| `status` | `transmitida` | compara | `src/components/reforma-tributaria/ObrigacoesAcessorias.tsx`<br>`supabase/functions/verificar-conformidade-fiscal/index.ts` |
| `status` | `transmitido` | compara, escreve | `src/components/contabilidade/SpedEcfHistorico.tsx`<br>`src/components/contabilidade/sped-contabil/SpedHistoricoRow.tsx`<br>`src/components/contabilidade/sped-contabil/SpedKpiCards.tsx`<br>`src/components/contabilidade/sped-contabil/useSpedContabilState.ts`<br>`src/components/contabilidade/sped-ecf-historico/HistoricoRow.tsx`<br>… +7 |
| `status` | `transmitindo` | compara | `src/components/nfe/contingencia/ContingenciaPendingList.tsx` |
| `status` | `unknown` | escreve | `supabase/functions/health/index.ts` |
| `status` | `uploading` | compara, escreve | `src/components/comprovantes/ComprovanteOCR.tsx`<br>`src/components/expert/DocumentAnalyzer.tsx`<br>`src/components/ui/file-upload.tsx` |
| `status` | `utilizado` | compara | `src/components/reforma-tributaria/GestorCreditosTributarios.tsx` |
| `status` | `vencido` | compara, filtra | `src/components/analytics/BenchmarkingSetorial.tsx`<br>`src/components/bi/BIDrillDown.tsx`<br>`src/components/clientes/ClienteDetailDialog.tsx`<br>`src/components/cobranca/previsao/risco.ts`<br>`src/components/contas-pagar/ContasPagarTableRow.tsx`<br>… +27 |
| `status` | `verified` | compara, escreve | `src/components/auth/MFASettings.tsx`<br>`src/hooks/useMFA.ts` |
| `status` | `warn` | compara, escreve | `src/components/contabilidade/SpedChecklistRow.tsx`<br>`src/components/contabilidade/SpedEcdPreviewDialog.tsx`<br>`supabase/functions/gerar-sped-ecd/index.ts`<br>`supabase/functions/gerar-sped-ecf/index.ts` |
| `estado` | `SP` | escreve | `supabase/functions/gerar-sped-ecd/__fixtures__/ecd-fixture.ts`<br>`supabase/functions/gerar-sped-ecf/__fixtures__/ecf-fixture.ts` |
| `estado` | `all` | compara, escreve | `src/pages/Clientes.tsx`<br>`src/pages/Fornecedores.tsx` |
| `estado` | `critical` | compara | `src/components/admin/FiscalHealthBadge.tsx` |
| `estado` | `ok` | compara | `src/components/admin/FiscalHealthBadge.tsx` |
| `estado` | `warning` | compara | `src/components/admin/FiscalHealthBadge.tsx` |
| `role` | `admin` | compara, escreve, filtra | `src/components/admin/GerenciadorPermissoes.tsx`<br>`src/components/contas-receber/WebhookDlqPanel.tsx`<br>`src/pages/Usuarios.tsx`<br>`supabase/functions/_shared/auth-guard.ts`<br>`supabase/functions/_shared/auth-guard_test.ts`<br>… +12 |
| `role` | `assistant` | compara, escreve | `src/components/cobranca/NegociacaoIA.tsx`<br>`src/components/copilot/CopilotGlobalFloat.tsx`<br>`src/components/expert/ExpertChatMessages.tsx`<br>`src/components/tributario/dashboard/CopilotTributarioFloat.tsx`<br>`src/pages/Expert.tsx` |
| `role` | `contador_readonly` | compara, escreve | `supabase/functions/convidar-contador/index.ts`<br>`supabase/functions/validar-token-contador/index.ts` |
| `role` | `financeiro` | compara, filtra | `src/pages/Usuarios.tsx`<br>`supabase/functions/contabilizar-evento/index.ts`<br>`supabase/functions/executar-fechamento-tributario/index.ts` |
| `role` | `operacional` | compara | `src/pages/Usuarios.tsx` |
| `role` | `system` | escreve | `src/components/cobranca/NegociacaoIA.tsx`<br>`supabase/functions/analise-fluxo-ia/index.ts`<br>`supabase/functions/analise-preditiva/index.ts`<br>`supabase/functions/analyze-document/index.ts`<br>`supabase/functions/benchmarking-setorial/index.ts`<br>… +14 |
| `role` | `tool` | escreve | `supabase/functions/copilot-global/index.ts` |
| `role` | `user` | compara, escreve | `src/components/cobranca/NegociacaoIA.tsx`<br>`src/components/copilot/CopilotGlobalFloat.tsx`<br>`src/components/expert/ExpertChatMessages.tsx`<br>`src/components/expert/expertPageSupport.ts`<br>`src/components/tributario/dashboard/CopilotTributarioFloat.tsx`<br>… +17 |
| `tipo` | `0000` | escreve | `src/lib/sped-generator/efd-contribuicoes.ts`<br>`src/lib/sped-generator/efd-ibs-cbs.ts` |
| `tipo` | `0001` | escreve | `src/lib/sped-generator/efd-contribuicoes.ts`<br>`src/lib/sped-generator/efd-ibs-cbs.ts` |
| `tipo` | `0990` | escreve | `src/lib/sped-generator/efd-contribuicoes.ts`<br>`src/lib/sped-generator/efd-ibs-cbs.ts` |
| `tipo` | `210200` | compara, escreve | `supabase/functions/_shared/sefaz/manifestacao.ts`<br>`supabase/functions/sefaz-manifestar/index.ts` |
| `tipo` | `210210` | compara | `supabase/functions/_shared/sefaz/manifestacao.ts` |
| `tipo` | `210220` | compara | `supabase/functions/_shared/sefaz/manifestacao.ts` |
| `tipo` | `210240` | compara | `src/hooks/useManifestarNfe.ts`<br>`src/pages/tributario/NfeRecebidas.tsx`<br>`supabase/functions/_shared/sefaz/manifestacao.ts`<br>`supabase/functions/sefaz-manifestar/index.ts` |
| `tipo` | `9001` | escreve | `src/lib/sped-generator/efd-contribuicoes.ts`<br>`src/lib/sped-generator/efd-ibs-cbs.ts` |
| `tipo` | `9900` | compara, escreve | `src/lib/sped-generator/efd-contribuicoes.ts`<br>`src/lib/sped-generator/efd-ibs-cbs.ts`<br>`supabase/functions/exportar-sped-contribuicoes/layout_test.ts`<br>`supabase/functions/gerar-sped-ecd/layout_test.ts`<br>`supabase/functions/gerar-sped-ecf/layout_test.ts` |
| `tipo` | `9999` | compara, escreve | `src/lib/sped-generator/efd-contribuicoes.ts`<br>`src/lib/sped-generator/efd-ibs-cbs.ts`<br>`supabase/functions/exportar-sped-contribuicoes/layout_test.ts`<br>`supabase/functions/gerar-sped-ecd/layout_test.ts`<br>`supabase/functions/gerar-sped-ecf/layout_test.ts` |
| `tipo` | `A001` | escreve | `src/lib/sped-generator/efd-contribuicoes.ts` |
| `tipo` | `A990` | escreve | `src/lib/sped-generator/efd-contribuicoes.ts` |
| `tipo` | `APURACAO_ATRASADA` | escreve | `src/hooks/useAuditoriaCompliance.ts` |
| `tipo` | `AUTORIZACAO` | compara | `src/components/nfe/EventosHistorico.helpers.ts`<br>`src/components/nfe/SefazAnalytics.tsx`<br>`src/lib/sefaz-event-logger.ts`<br>`src/lib/sefaz-rejection-monitor.ts` |
| `tipo` | `C001` | escreve | `src/lib/sped-generator/efd-contribuicoes.ts`<br>`src/lib/sped-generator/efd-ibs-cbs.ts` |
| `tipo` | `C100` | escreve | `src/lib/sped-generator/efd-ibs-cbs.ts` |
| `tipo` | `C190` | escreve | `src/lib/sped-generator/efd-ibs-cbs.ts` |
| `tipo` | `C990` | escreve | `src/lib/sped-generator/efd-contribuicoes.ts`<br>`src/lib/sped-generator/efd-ibs-cbs.ts` |
| `tipo` | `CANCELAMENTO` | compara | `src/components/nfe/EventosHistorico.helpers.ts`<br>`src/components/nfe/SefazAnalytics.tsx` |
| `tipo` | `CONSULTA` | compara | `src/components/nfe/EventosHistorico.helpers.ts` |
| … +224 linhas — lista completa em `context.json` | | | |

### E.4 Enums e listas de valores

| Nome | Valores | Onde |
|---|---|---|
| app_role | `admin`, `financeiro`, `operacional`, `visualizador`, `contador`, `viewer`, `manager`, `operator` | banco |
| status_pagamento | `pago`, `pendente`, `vencido`, `parcial`, `cancelado`, `atrasado` | banco |
| tipo_transacao | `receita`, `despesa` | banco |
| tipo_cobranca | `boleto`, `pix`, `transferencia`, `cartao`, `debito_automatico`, `dinheiro`, `cheque` | banco |
| prioridade_alerta | `baixa`, `media`, `alta`, `critica` | banco |
| etapa_cobranca | `preventiva`, `lembrete`, `cobranca`, `negociacao`, `juridico` | banco |
| status_nfe | `autorizada`, `pendente`, `cancelada`, `denegada`, `inutilizada` | banco |
| audit_action | `INSERT`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `EXPORT`, `APPROVE`, `REJECT`, `revoke_execute_anon` | banco |
| frequencia_relatorio | `mensal`, `trimestral`, `anual` | banco |
| acao_auditoria_tributaria | `insert`, `update`, `delete` | banco |
| status_fechamento_tributario | `aberto`, `em_revisao`, `fechado`, `reaberto` | banco |
| status_nf_ocr | `processando`, `sucesso`, `erro` | banco |
| tipo_solicitacao_lgpd | `acesso`, `portabilidade`, `exclusao`, `retificacao`, `anonimizacao` | banco |
| status_solicitacao_lgpd | `aberta`, `em_analise`, `atendida`, `rejeitada` | banco |
| tipo_anomalia | `movimentacao_outlier`, `pagamento_duplicado`, `conta_pagar_alta`, `conciliacao_atrasada`, `mudanca_regime_brusca` | banco |
| severidade_anomalia | `baixa`, `media`, `alta`, `critica` | banco |
| status_anomalia | `nova`, `investigando`, `falso_positivo`, `confirmada` | banco |
| sso_tipo | `oidc`, `saml` | banco |
| subscription_frequencia | `imediata`, `horaria`, `diaria` | banco |
| tipo_alerta_tributario | `vencimento_apuracao`, `vencimento_darf`, `vencimento_obrigacao`, `prazo_credito`, `limite_compensacao`, `pendencia_conciliacao`, `inconsistencia_fiscal`, `atualizacao_legislacao`, `split_payment`, `retencao_pendente`, `nfe_rejeitada`, `saldo_negativo` | banco |
| alert_severity | `INFO`, `WARNING`, `CRITICAL` | banco |
| alert_type | `DRIVER_BLOCKED`, `ROUTE_DEVIATION`, `DRIVER_STOPPED`, `LATE_DELIVERY`, `APPROVAL_REQUIRED`, `ORDER_CANCELLED` | banco |
| sefaz_ambiente | `homologacao`, `producao` | banco |
| nfe_manifestacao_status | `pendente`, `ciencia`, `confirmada`, `desconhecida`, `nao_realizada` | banco |
| nfe_schema_tipo | `resNFe`, `procNFe`, `resEvento`, `procEventoNFe`, `resCTe`, `procCTe` | banco |
| regime_tributario_enum | `MEI`, `SIMPLES`, `PRESUMIDO`, `REAL`, `ARBITRADO` | banco |
| atividade_economica | `INDUSTRIA`, `COMERCIO`, `SERVICOS`, `MISTA` | banco |
| uf_brasil | `AC`, `AL`, `AP`, `AM`, `BA`, `CE`, `DF`, `ES`, `GO`, `MA`, `MT`, `MS`, `MG`, `PA`, `PB`, `PR`, `PE`, `PI`, `RJ`, `RN`, `RS`, `RO`, `RR`, `SC`, `SP`, `SE`, `TO` | banco |
| regiao_brasil | `NORTE`, `NORDESTE`, `CENTRO_OESTE`, `SUDESTE`, `SUL` | banco |
| nivel_risco | `BAIXO`, `MEDIO`, `ALTO` | banco |
| status_workflow | `IDENTIFICADO`, `EM_ANALISE`, `APROVADO`, `EM_EXECUCAO`, `CONCLUIDO`, `CANCELADO` | banco |
| tipo_destinatario | `CONTRIBUINTE_REVENDA`, `CONTRIBUINTE_USO_CONSUMO`, `NAO_CONTRIBUINTE`, `EXTERIOR` | banco |
| org_papel | `RESPONSAVEL`, `ADMIN`, `MEMBRO`, `LEITOR` | banco |
| approval_priority | `LOW`, `MEDIUM`, `HIGH`, `URGENT`, `CRITICAL` | banco |
| approval_status | `PENDING`, `APPROVED`, `REJECTED` | banco |
| delivery_outcome | `SUCCESS`, `FAILED`, `DAMAGED`, `STOLEN`, `LATE`, `WRONG_ADDRESS`, `CUSTOMER_UNAVAILABLE` | banco |
| driver_status | `APPROVED`, `PENDING_APPROVAL`, `BLOCKED`, `WHITELIST`, `BLACKLIST` | banco |
| incident_severity | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | banco |
| incident_type | `ROUTE_DEVIATION`, `LONG_STOP`, `LATE_DELIVERY`, `CUSTOMER_COMPLAINT`, `DAMAGE`, `OTHER` | banco |
| order_status | `PENDING`, `MATCHED`, `ON_GOING`, `PICKED_UP`, `COMPLETED`, `CANCELLED`, `REJECTED`, `EXPIRED` | banco |
| vehicle_type | `MOTORCYCLE`, `CAR`, `VAN`, `TRUCK` | banco |
| TIPOS | { value: 'movimentacao_outlier', label: 'Movimentação atípica' }, { value: 'pagamento_duplicado', label: 'Pagamento duplicado' }, { value: 'conta_pagar_alta', label: 'Conta a pagar alta' }, { value: 'conciliacao_atrasada', label: 'Conciliação atrasada' }, { value: 'mudanca_regime_brusca', label: 'Va … | `src/components/admin/anomalia-preferences/constants.ts` |
| SeveridadeBadgeVariant | destructive \| secondary \| outline | `src/components/admin/anomalias-review-queue/helpers.ts` |
| SEVERIDADES | 'critica', 'alta', 'media', 'baixa' | `src/components/admin/anomalias-review-queue/types.ts` |
| SandboxOutcome | bloqueado \| seria_jit \| usuario_existente \| sem_email | `src/components/admin/sso/sandbox/outcome.ts` |
| FocusClaim | all \| email \| name \| groups \| domain | `src/components/admin/sso/sandbox/types.ts` |
| MappingFilter | all \| matched \| skipped \| no_match | `src/components/admin/sso/sandbox/types.ts` |
| SeverityFilter | all \| critical \| warning \| info | `src/components/admin/telemetry/performance-alerts-deeplink.ts` |
| Step | upload \| processing \| preview \| error \| open-finance-loading | `src/components/conciliacao/ImportarExtratoDialog.types.ts` |
| DatePreset | all \| today \| last7 \| last30 \| mes \| ano \| custom | `src/components/contabilidade/LancamentosTab.types.ts` |
| TipoEvento | conta_pagar \| conta_receber \| movimentacao | `src/components/contabilidade/contabilizacao-automatica/types.ts` |
| EVENTOS | { value: 'conta_pagar', label: 'Pagamento (Conta a Pagar)' }, { value: 'conta_receber', label: 'Recebimento (Conta a Receber)' }, { value: 'movimentacao', label: 'Movimentação Bancária' }, | `src/components/contabilidade/contabilizacao-automatica/types.ts` |
| ModoDemonstrativo | dre \| balanco | `src/components/contabilidade/dre-balanco/types.ts` |
| DatePreset | all \| today \| last7 \| last30 \| mes \| ano \| custom | `src/components/contabilidade/razao-diario/types.ts` |
| StatusFilter | all \| liberada \| bloqueada \| transmitida | `src/components/contabilidade/sped-contabil/types.ts` |
| ValidacaoFilter | all \| com_erros \| com_avisos \| sem_alertas | `src/components/contabilidade/sped-contabil/types.ts` |
| ExportStatus | idle \| queued \| processing \| done \| error | `src/components/contabilidade/sped-contabil/types.ts` |
| StatusFilter | all \| liberada \| bloqueada \| transmitida | `src/components/contabilidade/sped-ecf-historico/HistoricoFilters.tsx` |
| ValidacaoFilter | all \| com_erros \| com_avisos \| sem_alertas | `src/components/contabilidade/sped-ecf-historico/HistoricoFilters.tsx` |
| DivergTone | success \| warning \| destructive \| info | `src/components/contabilidade/sped-ecf-wizard/types.ts` |
| Step | upload \| processing \| preview \| success \| error | `src/components/contas-receber/BaixaAutomaticaDialog.types.ts` |
| TransitionName | fade \| blur-rise \| slide-left \| slide-right \| slide-up \| slide-down \| zoom-in \| zoom-out \| flip-x \| flip-y \| parallax \| scale \| none | `src/components/layout/transitions/types.ts` |
| EasingPreset | anticipate \| easeOut \| easeInOut \| spring | `src/components/layout/transitions/types.ts` |
| Periodo | 24h \| 7d \| 30d \| 90d | `src/components/nfe/SefazAnalytics.types.ts` |
| StatusObrigacao | pendente \| em_andamento \| transmitida \| atrasada \| nao_aplicavel | `src/components/reforma-tributaria/ObrigacoesAcessorias.types.ts` |
| TipoRelatorio | dre-tributario \| balancete \| comparativo \| creditos \| carga-efetiva | `src/components/reforma-tributaria/RelatoriosContabeisTributarios.types.ts` |
| SeverityKey | critica \| alta \| media \| baixa | `src/components/shared/AdvancedSearchPopover.tsx` |
| Theme | light \| dark \| system | `src/components/theme/ThemeContext.ts` |
| ActionState | idle \| loading \| success \| error | `src/components/ui/action-button.tsx` |
| ConfirmationType | danger \| warning \| success \| info \| question | `src/components/ui/confirmation-dialog.tsx` |
| SortDirection | asc \| desc | `src/components/ui/data-table.tsx` |
| DateFilterOption | all \| today \| week \| month \| last7 \| last30 \| overdue | `src/components/ui/quick-date-filters.tsx` |
| RankType | gold \| silver \| bronze \| none | `src/components/ui/rank-badge.tsx` |
| RankSize | sm \| md \| lg | `src/components/ui/rank-badge.tsx` |
| SortDirection | asc \| desc | `src/components/ui/sortable-header.tsx` |
| ViewMode | side-by-side \| overlay \| diff \| split \| heatmap | `src/components/ui/ux-validator/types.ts` |
| Breakpoint | mobile \| tablet \| desktop | `src/components/ui/ux-validator/types.ts` |
| ScopeMode | consolidated \| focused | `src/contexts/useEmpresaScope.ts` |
| ValidationCode | DURACAO_FORA_DO_RANGE \| DURACAO_NAO_INTEIRA \| SEVERIDADE_INVALIDA \| SEVERIDADES_VAZIAS_COM_TOAST_ATIVO \| TOAST_SEM_ACOES_COM_DRILL_DOWN_OBRIGATORIO \| DRAWER_SEM_ACOES | `src/hooks/anomaliaPreferencesValidation.ts` |
| TOAST_ACAO_KEYS | 'drill_down', 'abrir_pagina', 'copiar_id', 'marcar_lida', | `src/hooks/anomaliaPreferencesValidation.ts` |
| DRAWER_ACAO_KEYS | 'abrir_entidade', 'pagina_completa', 'copiar_id', 'marcar_lida', | `src/hooks/anomaliaPreferencesValidation.ts` |
| DedupReason | duplicate_in_session \| older_than_last_seen \| permission_revoked | `src/hooks/savedFilterDedup.ts` |
| AppRole | admin \| financeiro \| operacional \| visualizador | `src/hooks/savedFiltersValidation.ts` |
| PrioridadeAlerta | baixa \| media \| alta \| critica | `src/hooks/useAlertas.ts` |
| TipoAlerta | vencimento_apuracao \| vencimento_darf \| vencimento_obrigacao \| prazo_credito \| limite_compensacao \| pendencia_conciliacao \| inconsistencia_fiscal \| atualizacao_legislacao \| split_payment \| retencao_pendente \| nfe_rejeitada \| saldo_negativo | `src/hooks/useAlertasTributarios.ts` |
| PrioridadeAlerta | baixa \| media \| alta \| critica | `src/hooks/useAlertasTributarios.ts` |
| Severidade | baixa \| media \| alta \| critica | `src/hooks/useAnomaliaPreferences.ts` |
| ToastAcaoKey | drill_down \| abrir_pagina \| copiar_id \| marcar_lida | `src/hooks/useAnomaliaPreferences.ts` |
| DrawerAcaoKey | abrir_entidade \| pagina_completa \| copiar_id \| marcar_lida | `src/hooks/useAnomaliaPreferences.ts` |
| AsaasPaymentStatus | PENDING \| RECEIVED \| CONFIRMED \| OVERDUE \| REFUNDED \| CANCELLED \| CHARGEBACK | `src/hooks/useAsaas.types.ts` |
| AsaasBillingType | boleto \| pix \| credit_card \| debit_card | `src/hooks/useAsaas.types.ts` |
| AppRole | admin \| financeiro \| operacional \| visualizador | `src/hooks/useAuth.tsx` |
| CategoriaCashback | cesta_basica \| energia_eletrica \| gas_cozinha \| agua_saneamento \| telecomunicacoes \| medicamentos \| transporte_publico \| demais | `src/hooks/useCashbackSimulador.ts` |
| EntityType | contas_pagar \| contas_receber \| clientes \| fornecedores \| empresas | `src/hooks/useCustomFields.ts` |
| FieldType | text \| number \| date \| select \| boolean | `src/hooks/useCustomFields.ts` |
| StatusEntrega | pendente \| entregue \| dispensada \| retificada | `src/hooks/useEntregasObrigacoes.ts` |
| ErrorWindow | 24h \| 7d \| 30d | `src/hooks/useFrontendErrorLogs.ts` |
| GerarStatus | idle \| running \| success \| error | `src/hooks/useGerarEvidenciasStream.ts` |
| SsoSyncFieldKey | full_name \| avatar_url \| telefone | `src/hooks/useLastSsoProfileSync.ts` |
| ManifestacaoTipo | 210200 \| 210210 \| 210220 \| 210240 | `src/hooks/useManifestarNfe.ts` |
| ManifestacaoStatus | pendente \| ciencia \| confirmada \| desconhecida \| nao_realizada | `src/hooks/useNfeRecebidas.ts` |
| FrequenciaPagamento | semanal \| quinzenal \| mensal \| bimestral \| trimestral \| semestral \| anual | `src/hooks/usePagamentosRecorrentes.ts` |
| TipoPedido | per \| dcomp | `src/hooks/usePerDcomp.ts` |
| StatusPedido | rascunho \| aguardando_transmissao \| transmitido \| em_analise \| deferido \| indeferido \| cancelado | `src/hooks/usePerDcomp.ts` |
| TipoCreditoOrigem | saldo_negativo \| pagamento_indevido \| retencao \| ressarcimento \| exportacao | `src/hooks/usePerDcomp.ts` |
| SeveridadeAlerta | error \| warning \| info | `src/hooks/usePreValidacaoSped.ts` |
| TipoRetencao | irrf \| csrf \| pis_cofins_csll \| inss \| iss \| cbs \| ibs | `src/hooks/useRetencoesFonte.ts` |
| StatusRetencao | pendente \| recolhido \| compensado \| cancelado | `src/hooks/useRetencoesFonte.ts` |
| SSOTipo | oidc \| saml | `src/hooks/useSSO.ts` |
| AppRole | admin \| financeiro \| operacional \| visualizador | `src/hooks/useSSO.ts` |
| JitVia | oidc-jit \| saml-broker-jit | `src/hooks/useSSOJitEvents.ts` |
| JitRole | admin \| financeiro \| operacional \| visualizador | `src/hooks/useSSOJitEvents.ts` |
| SubscriptionFrequencia | imediata \| horaria \| diaria | `src/hooks/useSavedFilterSubscriptions.ts` |
| SeveridadeAlerta | baixa \| media \| alta \| critica | `src/hooks/useSavedFilterSubscriptions.ts` |
| AppRole | admin \| financeiro \| operacional \| visualizador | `src/hooks/useSavedFilters.ts` |
| ScimDefaultRole | admin \| financeiro \| operacional \| visualizador | `src/hooks/useScimTokens.ts` |
| EventoBitrix | confirmada \| falso_positivo \| parecer \| reaberta | `src/hooks/useSincronizarAnomaliaBitrix.ts` |
| BackMethod | button \| swipe \| keyboard \| programmatic | `src/hooks/useSmartBack.ts` |
| TipoSolicitacaoLGPD | acesso \| portabilidade \| exclusao \| retificacao \| anonimizacao | `src/hooks/useSolicitacoesLGPD.ts` |
| SoundType | success \| error \| notification \| click \| warning | `src/hooks/useSoundFeedback.ts` |
| StatusSplitPayment | pendente \| processado \| repassado \| erro | `src/hooks/useSplitPayment.ts` |
| SsoOnboardingEventType | domain_resolved \| auto_redirect_started \| auto_redirect_cancelled \| manual_provider_selected \| redirect_dispatched \| redirect_failed \| password_fallback_used | `src/hooks/useSsoOnboardingAudit.ts` |
| TrilhaTipo | financeira \| tributaria \| sistema \| conformidade | `src/hooks/useTrilhaAuditoria.ts` |
| StatusConsistencia | ok \| desbalanceado \| sem_partidas \| orfao | `src/hooks/useVerificacaoIntegracoes.ts` |
| EtapaCobranca | preventiva \| lembrete \| cobranca \| negociacao \| juridico | `src/hooks/expert-actions/types.ts` |
| ExpertActionType | criar_alerta \| gerar_relatorio \| listar_aprovacoes \| aprovar_pagamento \| navegar \| consultar_saldos \| criar_conta_pagar \| criar_conta_receber \| consultar_cliente \| consultar_fornecedor \| analisar_fluxo \| agendar_cobranca \| consultar_vencimentos \| gerar_boleto \| atualizar_score_cliente | `src/hooks/expert-actions/types.ts` |
| StatusPagamento | pago \| pendente \| vencido \| parcial \| cancelado | `src/hooks/financial/types.ts` |
| DiffKind | added \| removed \| changed \| unchanged | `src/lib/audit-diff.ts` |
| AuditActionType | preference_change \| filter_change \| preset_saved \| preset_loaded \| filters_reset | `src/lib/audit-logger.ts` |
| AuditPriority | critical \| high \| medium \| low \| info | `src/lib/audit-priority.ts` |
| AuditActionLike | INSERT \| UPDATE \| DELETE \| LOGIN \| LOGOUT \| EXPORT \| APPROVE \| REJECT | `src/lib/audit-priority.ts` |
| CenarioTipo | otimista \| realista \| pessimista | `src/lib/cashflow-scenarios.ts` |
| NaturezaConta | ativo \| passivo \| patrimonio \| receita \| despesa \| custo \| resultado | `src/lib/cfc-validator.ts` |
| CsvKind | faturamento \| folha | `src/lib/csv-importer.ts` |
| CurrencyCode | BRL \| USD \| EUR \| GBP \| JPY \| CNY \| ARS \| CLP | `src/lib/currency.ts` |
| HydrationStatus | success \| error | `src/lib/filterHydrationTelemetry.ts` |
| TipoDetectado | pdf \| png \| jpeg \| zip \| gzip \| pfx \| pem \| xml \| texto \| exe \| elf \| macho \| wasm \| classe \| script \| webp \| desconhecido | `src/lib/magic-bytes.ts` |
| NATUREZAS | 'devedora', 'credora' | `src/lib/plano-contas-csv-importer.ts` |
| TIPOS_CONTA | 'ativo', 'passivo', 'patrimonio_liquido', 'receita', 'despesa', 'custo', 'resultado', | `src/lib/plano-contas-csv-importer.ts` |
| EventoTipo | ENVIO_LOTE \| RETORNO_LOTE \| AUTORIZACAO \| REJEICAO \| CONSULTA \| CANCELAMENTO \| INUTILIZACAO \| CONTINGENCIA \| ERRO_CONEXAO \| TIMEOUT \| VALIDACAO | `src/lib/sefaz-event-logger.ts` |
| ValidacaoCategoriaId | periodo \| identificacao \| hash \| ecd \| cross_check \| lancamentos \| plano_contas \| cfc \| outros | `src/lib/sped-validacoes-categorias.ts` |
| SsoErrorCode | provider_not_found \| provider_disabled \| endpoint_missing \| invalid_provider_config \| network_error \| timeout \| unauthorized \| rate_limited \| missing_provider_id \| edge_function_error \| unknown | `src/lib/sso-error-messages.ts` |
| SloRetryKind | slo_retry_provider_started \| slo_retry_provider_succeeded \| slo_retry_provider_failed \| slo_retry_local_started \| slo_retry_local_succeeded \| slo_retry_local_failed | `src/lib/sso-slo-audit.ts` |
| SloFailureReason | provider_logout_failed \| local_cleanup_failed \| unknown | `src/lib/sso-slo-state.ts` |
| ModuloId | M01 \| M02 \| M03 \| M04 \| M05 \| M06 \| M07 \| M08 \| M09 \| M10 \| M11 \| M12 | `src/lib/arquitetura/modulos.ts` |
| CategoriaIndice | liquidez \| endividamento \| rentabilidade \| atividade \| estrutura | `src/lib/contabil/indices.types.ts` |
| FormatoIndice | indice \| percentual \| dias \| moeda | `src/lib/contabil/indices.types.ts` |
| FaixaIndice | bom \| atencao \| critico \| neutro \| indefinido | `src/lib/contabil/indices.types.ts` |
| TipoLivro | DIARIO \| RAZAO | `src/lib/contabil/termos-livro.ts` |
| FonteDemonstrativo | competencia \| caixa | `src/lib/contabilidade/demonstrativos-competencia.ts` |
| EventoContaTipo | receber \| pagar | `src/lib/financeiro/registrarEvento.ts` |
| OrgPapel | RESPONSAVEL \| ADMIN \| MEMBRO \| LEITOR | `src/lib/organizacoes/convites.ts` |
| StatusConvite | PENDENTE \| UTILIZADO \| EXPIRADO | `src/lib/organizacoes/convites.ts` |
| MotivoRecusaConvite | CONVITE_INEXISTENTE \| CONVITE_UTILIZADO \| CONVITE_EXPIRADO \| EMAIL_DIVERGENTE | `src/lib/organizacoes/convites.ts` |
| OrigemValor | lei \| simulado | `src/lib/reforma-tributaria/cronograma-oficial.ts` |
| MOTIVOS_CONTINGENCIA | 'SEFAZ indisponível - manutenção programada', 'SEFAZ indisponível - problemas técnicos', 'Problemas de conectividade local', 'Timeout na comunicação com SEFAZ', 'Erro de certificado digital', 'Falha no webservice da SEFAZ', 'Contingência preventiva - evento especial', 'Outro motivo', | `src/lib/sefaz-contingency/constants.ts` |
| ContingencyMode | normal \| SCAN \| DPEC \| FSDA \| SVCAN \| SVCRS \| offline | `src/lib/sefaz-contingency/types.ts` |
| AppRole | admin \| financeiro \| operacional \| visualizador | `src/lib/sso/consistency.ts` |
| Severity | error \| warning \| info | `src/lib/sso/consistency.ts` |
| Scope | claim_mapping \| allowed_domains \| role_mappings \| default_role \| global | `src/lib/sso/consistency.ts` |
| BulkOutcome | bloqueado \| seria_jit \| usuario_existente \| sem_email \| erro_rede | `src/lib/sso/sandbox-bulk-runner.ts` |
| SeveridadeAjuste | aviso \| critico | `src/lib/tributario/diagnostico-parametros.ts` |
| OrdenacaoHistorico | data_desc \| data_asc \| economia_desc \| pendencia | `src/lib/tributario/historico-simulacao.ts` |
| SeveridadeAlertaPF | alta \| media \| baixa | `src/lib/tributario/pf-vinculada.ts` |
| TipoOperacao | venda_produto \| venda_servico \| compra_produto \| compra_servico | `src/lib/tributario/recomendar-empresa.ts` |
| RegimeTributario | simples_nacional \| lucro_presumido \| lucro_real | `src/lib/tributario/types.ts` |
| AnexoSimples | I \| II \| III \| IV \| V | `src/lib/tributario/types.ts` |
| PeriodicidadeApuracao | trimestral \| anual | `src/lib/tributario/types.ts` |
| Periodicidade | mensal \| trimestral \| anual | `src/lib/tributario/calculadora/types.ts` |
| ModoLucroReal | anual_estimativa \| trimestral | `src/lib/tributario/calculadora/types.ts` |
| AtividadePresumido | comercio \| industria \| servicos_geral \| servicos_profissionais \| transporte_cargas \| transporte_passageiros \| servicos_hospitalares | `src/lib/tributario/calculadora/types.ts` |
| CatalogoId | ufs \| interestaduais \| faixas_simples \| itens_iss \| ncms \| protocolos_st | `src/lib/tributario/catalogos/alertas.ts` |
| SeveridadeAlerta | critico \| atencao | `src/lib/tributario/catalogos/alertas.ts` |
| CampoDivergenteIss | ausente \| excedente \| duplicado \| retencao \| aliquota_minima \| aliquota_maxima | `src/lib/tributario/catalogos/coerencia-iss.ts` |
| CampoDivergenteMva | sem_protocolo \| ncm_desconhecido \| mva_divergente \| mva_invalida \| vinculo_duplicado \| vigencia_invalida \| protocolo_sem_ufs \| uf_invalida \| cobertura_parcial | `src/lib/tributario/catalogos/coerencia-mva.ts` |
| CampoDivergenteNcm | ausente \| duplicado \| codigo_invalido \| aliquota_ipi \| monofasico \| mva_padrao | `src/lib/tributario/catalogos/coerencia-ncm.ts` |
| SituacaoCatalogo | ok \| divergente \| vazio | `src/lib/tributario/catalogos/painel.ts` |
| CatalogoOverlay | icms \| iss \| ncm \| monofasico \| mva_st \| interestaduais \| faixas_simples | `src/lib/tributario/catalogos/rejeicoes-auditoria.ts` |
| SeveridadeRejeicao | critico \| atencao | `src/lib/tributario/catalogos/rejeicoes-auditoria.ts` |
| OverlayId | icms \| iss \| ncm \| monofasico \| mva_st | `src/lib/tributario/catalogos/saude.ts` |
| StatusSaudeCatalogos | saudavel \| atencao \| critico | `src/lib/tributario/catalogos/saude.ts` |
| RegiaoBrasil | NORTE \| NORDESTE \| CENTRO_OESTE \| SUDESTE \| SUL | `src/lib/tributario/catalogos/types.ts` |
| TributoDarf | IRPJ \| CSLL \| PIS \| COFINS \| IPI \| IRRF \| CSRF \| INSS_RETENCAO | `src/lib/tributario/darf/types.ts` |
| RegimeAplicavel | simples \| presumido \| real | `src/lib/tributario/elisao/types.ts` |
| RiscoElisao | baixo \| medio \| alto | `src/lib/tributario/elisao/types.ts` |
| GrauRisco | leve \| medio \| grave | `src/lib/tributario/folha/types.ts` |
| PapelProtocolo | ORIGEM \| DESTINO \| AMBOS | `src/lib/tributario/icms/overlay-mva.ts` |
| MotivoRejeicaoMva | ncm_invalido \| protocolo_invalido \| mva_invalida \| mva_fora_da_faixa \| vigencia_invalida \| duplicado \| sem_uf_signataria \| uf_desconhecida \| papel_invalido | `src/lib/tributario/icms/overlay-mva.ts` |
| MotivoBloqueioMva | ncm_nao_sujeito_st \| operacao_isenta \| operacao_nao_tributada \| aliquota_zero \| operacao_imune \| operacao_suspensa | `src/lib/tributario/icms/overlay-mva.ts` |
| MotivoRejeicao | uf_desconhecida \| interna_invalida \| fcp_invalido \| duplicado | `src/lib/tributario/icms/overlay.ts` |
| UF | AC \| AL \| AP \| AM \| BA \| CE \| DF \| ES \| GO \| MA \| MT \| MS \| MG \| PA \| PB \| PR \| PE \| PI \| RJ \| RN \| RS \| RO \| RR \| SC \| SP \| SE \| TO | `src/lib/tributario/icms/types.ts` |
| RegiaoFiscal | N \| NE \| CO \| SE \| S | `src/lib/tributario/icms/types.ts` |
| SituacaoIcmsSt | tributada \| isenta \| nao_tributada \| aliquota_zero \| imune \| suspensa | `src/lib/tributario/icms/types.ts` |
| MotivoRejeicaoIss | codigo_ibge_invalido \| municipio_invalido \| aliquota_invalida \| fora_da_faixa_legal \| vigencia_invalida \| duplicado | `src/lib/tributario/ipi-iss/overlay-iss.ts` |
| StatusSugestaoIss | sem_catalogo \| conforme \| divergente | `src/lib/tributario/ipi-iss/overlay-iss.ts` |
| MotivoRejeicaoNcm | codigo_invalido \| duplicado \| aliquota_invalida \| aliquota_fora_da_faixa | `src/lib/tributario/ipi-iss/overlay-ncm.ts` |
| SituacaoIpi | tributada \| isenta \| nao_tributada \| aliquota_zero \| suspensa \| imune | `src/lib/tributario/ipi-iss/types.ts` |
| LocalIncidencia | estabelecimento_prestador \| local_da_prestacao \| domicilio_tomador | `src/lib/tributario/ipi-iss/types.ts` |
| FormaApuracao | trimestral \| anual_estimativa | `src/lib/tributario/irpj-csll/types.ts` |
| TipoAjuste | adicao \| exclusao | `src/lib/tributario/irpj-csll/types.ts` |
| AlvoAjuste | ambos \| irpj \| csll | `src/lib/tributario/irpj-csll/types.ts` |
| MotivoRejeicaoMonofasico | codigo_invalido \| duplicado | `src/lib/tributario/monofasico/overlay-monofasico.ts` |
| PosicaoCadeia | industria \| importador \| produtor \| distribuidor \| atacado \| varejo \| revenda | `src/lib/tributario/monofasico/types.ts` |
| RegimeApuracaoPisCofins | presumido \| real \| simples | `src/lib/tributario/monofasico/types.ts` |
| RegimeTributario | simples_nacional \| lucro_presumido \| lucro_real | `src/lib/tributario/motor/base.ts` |
| AnexoSimples | I \| II \| III \| IV \| V | `src/lib/tributario/motor/base.ts` |
| PeriodicidadeApuracao | trimestral \| anual | `src/lib/tributario/motor/base.ts` |
| TipoAlertaConformidade | score_baixo \| queda_abrupta \| tendencia_negativa \| obrigacoes_vencidas \| multa_acumulada | `src/lib/tributario/obrigacoes/alertas.ts` |
| SeveridadeAlerta | baixa \| media \| alta \| critica | `src/lib/tributario/obrigacoes/alertas.ts` |
| StatusRegistro | pendente \| entregue \| dispensada \| retificada | `src/lib/tributario/obrigacoes/conformidade.ts` |
| NivelConformidade | critico \| atencao \| bom \| excelente | `src/lib/tributario/obrigacoes/conformidade.ts` |
| DirecaoTendencia | alta \| estavel \| queda | `src/lib/tributario/obrigacoes/historico.ts` |
| SituacaoEnvioDigest | enviado \| ignorado \| falhou \| simulado | `src/lib/tributario/obrigacoes/observabilidade-digest.ts` |
| SEVERIDADES_DIGEST | 'critica', 'alta', 'media', 'baixa' | `src/lib/tributario/obrigacoes/preferencias-digest.ts` |
| FREQUENCIAS_DIGEST | 'diaria', 'semanal', 'mensal' | `src/lib/tributario/obrigacoes/preferencias-digest.ts` |
| RiscoProjetado | critico \| atencao \| estavel \| melhora | `src/lib/tributario/obrigacoes/projecao.ts` |
| RegimeAplicavel | simples \| presumido \| real \| todos | `src/lib/tributario/obrigacoes/types.ts` |
| Periodicidade | mensal \| trimestral \| anual | `src/lib/tributario/obrigacoes/types.ts` |
| Orgao | RFB \| SEFAZ \| CAIXA \| MTE | `src/lib/tributario/obrigacoes/types.ts` |
| AjusteDiaNaoUtil | antecipa \| posterga | `src/lib/tributario/obrigacoes/types.ts` |
| BaseMulta | faturamento \| tributos_declarados \| fixa | `src/lib/tributario/obrigacoes/types.ts` |
| SituacaoObrigacao | entregue \| vencida \| vence_hoje \| proxima \| futura | `src/lib/tributario/obrigacoes/types.ts` |
| NaturezaCredito | bens_revenda \| insumos \| energia_eletrica \| energia_termica \| alugueis_pj \| arrendamento_mercantil \| depreciacao_maquinas \| edificacoes_benfeitorias \| devolucoes_vendas \| armazenagem_frete_venda \| vale_transporte_alimentacao \| bens_importados | `src/lib/tributario/pis-cofins/types.ts` |
| NaturezaReceita | tributada \| monofasica \| substituicao_tributaria \| aliquota_zero \| isenta \| suspensa \| exportacao | `src/lib/tributario/pis-cofins/types.ts` |
| VALID_TABS | 'inicio', 'plano', 'lancamentos', 'razao', 'balancete', 'indices', 'dre', 'auto', 'elisao', 'integracoes', 'auditoria', 'ecd', 'ecf', | `src/pages/Contabilidade.helpers.ts` |
| EventKind | jit \| profile_sync | `src/pages/admin/AuditSsoProfileSync.helpers.ts` |
| StatusBucket | all \| 2xx \| 4xx \| 5xx | `src/pages/admin/ScimAudit.types.ts` |
| AppRole | admin \| financeiro \| operacional \| visualizador | `src/pages/admin/shared-filters-admin/types.ts` |
| DivergenceDirection | in-sync \| remote-newer \| local-newer \| remote-only \| local-only \| none \| unknown | `src/pages/configuracoes/filtros-salvos/types.ts` |
| UFS | 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', | `src/pages/tributario/consulta-rapida/ufs.ts` |
| StatusPagamento | pago \| pendente \| vencido \| parcial \| cancelado | `src/types/financial.ts` |
| TipoTransacao | receita \| despesa | `src/types/financial.ts` |
| TipoCobranca | boleto \| pix \| cartao_credito \| cartao_debito \| transferencia \| dinheiro | `src/types/financial.ts` |
| PrioridadeAlerta | baixa \| media \| alta \| critica | `src/types/financial.ts` |
| EtapaReguaCobranca | preventiva \| lembrete \| cobranca \| negociacao \| juridico | `src/types/financial.ts` |
| RegimeTributario | lucro_real \| lucro_presumido \| simples_nacional \| mei | `src/types/reforma-tributaria/enums.ts` |
| TipoTributoNovo | CBS \| IBS \| IS | `src/types/reforma-tributaria/enums.ts` |
| TipoTributoAntigo | ICMS \| ISS \| PIS \| COFINS \| IPI | `src/types/reforma-tributaria/enums.ts` |
| FaseTransicao | 2026_teste \| 2027_cbs_plena \| 2028_cbs_plena \| 2029_transicao \| 2030_transicao \| 2031_transicao \| 2032_transicao \| 2033_pleno | `src/types/reforma-tributaria/enums.ts` |
| CategoriaIS | bebidas_alcoolicas \| bebidas_acucaradas \| produtos_fumigenos \| veiculos \| embarcacoes_aeronaves \| minerios \| combustiveis_fosseis \| concursos_prognosticos | `src/types/reforma-tributaria/enums.ts` |
| StatusCreditoTributario | disponivel \| utilizado \| compensado \| expirado \| estornado \| transferido | `src/types/reforma-tributaria/enums.ts` |
| TipoOperacao | venda \| compra \| servico_prestado \| servico_tomado \| importacao \| exportacao | `src/types/reforma-tributaria/enums.ts` |
| RegimeEspecial | zona_franca_manaus \| combustiveis \| servicos_financeiros \| imobiliario \| locacao_imovel | `src/types/reforma-tributaria/enums.ts` |
| REGIMES_CANONICOS | 'mei', 'simples_nacional', 'lucro_presumido', 'lucro_real', 'arbitrado', | `supabase/functions/_shared/cnae.ts` |
| LogLevel | DEBUG = 'DEBUG', INFO = 'INFO', WARN = 'WARN', ERROR = 'ERROR', CRITICAL = 'CRITICAL', | `supabase/functions/_shared/logger.ts` |
| TipoDetectado | pdf \| png \| jpeg \| zip \| gzip \| pfx \| pem \| xml \| texto \| exe \| elf \| macho \| wasm \| classe \| script \| webp \| desconhecido | `supabase/functions/_shared/magic-bytes.ts` |
| ComandoSqlMcp | select \| insert \| update \| delete | `supabase/functions/_shared/sql-write-guard.ts` |
| RegimeTributario | simples_nacional \| lucro_presumido \| lucro_real | `supabase/functions/_shared/tributario-logic.ts` |
| AnexoSimples | I \| II \| III \| IV \| V | `supabase/functions/_shared/tributario-logic.ts` |
| PeriodicidadeApuracao | trimestral \| anual | `supabase/functions/_shared/tributario-logic.ts` |
| SUPPORTED_CONTRACT_VERSIONS | 'v1', 'v2' | `supabase/functions/_shared/versioned-contract.ts` |
| TipoAlertaConformidade | score_baixo \| queda_abrupta \| tendencia_negativa \| obrigacoes_vencidas \| multa_acumulada | `supabase/functions/_shared/obrigacoes/alertas.ts` |
| SeveridadeAlerta | baixa \| media \| alta \| critica | `supabase/functions/_shared/obrigacoes/alertas.ts` |
| StatusRegistro | pendente \| entregue \| dispensada \| retificada | `supabase/functions/_shared/obrigacoes/conformidade.ts` |
| NivelConformidade | critico \| atencao \| bom \| excelente | `supabase/functions/_shared/obrigacoes/conformidade.ts` |
| SEVERIDADES_DIGEST | 'critica', 'alta', 'media', 'baixa' | `supabase/functions/_shared/obrigacoes/preferencias-digest.ts` |
| FREQUENCIAS_DIGEST | 'diaria', 'semanal', 'mensal' | `supabase/functions/_shared/obrigacoes/preferencias-digest.ts` |
| RegimeAplicavel | simples \| presumido \| real \| todos | `supabase/functions/_shared/obrigacoes/types.ts` |
| Periodicidade | mensal \| trimestral \| anual | `supabase/functions/_shared/obrigacoes/types.ts` |
| Orgao | RFB \| SEFAZ \| CAIXA \| MTE | `supabase/functions/_shared/obrigacoes/types.ts` |
| AjusteDiaNaoUtil | antecipa \| posterga | `supabase/functions/_shared/obrigacoes/types.ts` |
| BaseMulta | faturamento \| tributos_declarados \| fixa | `supabase/functions/_shared/obrigacoes/types.ts` |
| SituacaoObrigacao | entregue \| vencida \| vence_hoje \| proxima \| futura | `supabase/functions/_shared/obrigacoes/types.ts` |
| Ambiente | producao \| homologacao | `supabase/functions/_shared/sefaz/endpoints.ts` |
| ManifTipo | 210200 \| 210210 \| 210220 \| 210240 | `supabase/functions/_shared/sefaz/manifestacao.ts` |
| SchemaTipo | procNFe \| resNFe \| procEventoNFe \| resEvento | `supabase/functions/_shared/sefaz/parser.ts` |
| SefazResponseKind | batch \| empty \| rate_limit \| service_down \| timeout \| network_error \| gzip_corrupt \| xml_corrupt \| malformed_envelope \| nsu_gap \| duplicate | `supabase/functions/_shared/sefaz/__mocks__/soap-mock.ts` |
| CANAIS_REGUA | 'email', 'whatsapp', 'sms', 'telefone' | `supabase/functions/executar-regua-cobranca/domain.ts` |

## F. Validações de entrada

### F.1 Schemas Zod

- **categoriaSchema** (`src/components/categorias/CategoriaForm.tsx`, z.object):
  ```ts
  { nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'), tipo: z.enum(['receita', 'despesa']), cor: z.string().optional(), icone: z.string().optional(), }
  ```
- **formSchema** (`src/components/centros-custo/CentroCustoForm.tsx`, z.object):
  ```ts
  { codigo: z.string().min(1, 'Código é obrigatório').max(10, 'Máximo 10 caracteres'), nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100), descricao: z.string().max(500).optional(), parent_id: z.string().optional(), responsavel: z.string().max(100).optional(), orcamento_previsto: z.coerce.number().min(0, 'Valor deve ser positivo'), ativo: z.boolean(), }
  ```
- **clienteSchema** (`src/components/clientes/ClienteForm.tsx`, z.object):
  ```ts
  { razao_social: z.string().min(2, 'Razão social é obrigatória').max(200, 'Nome muito longo'), nome_fantasia: z.string().max(200, 'Nome muito longo').optional(), cnpj_cpf: z .string() .max(18, 'CNPJ/CPF inválido') .optional() .superRefine((val, ctx) => { if (val) { const result = validateCnpjCpf(val); if (!result.valid) { ctx.addIssue({ code: 'custom', message: result.message ?? 'CNPJ/CPF inválido' }); } } }), email: z .string() .email('E-mail inválido') .max(255, 'E-mail muito longo') .optional() .or(z.literal('')), telefone: z.string().max(20, 'Telefone muito longo').optional(), endereco: z.string().max(300, 'Endereço muito longo').optional(), cidade: z.string().max(100, 'Cidade muito longa').optional(), estado: z.string().max(2, 'Use a sigla do estado').optional(), contato: z.string().ma …
  ```
  - Regras cruzadas (refine): “E-mail muito longo”
- **formSchema** (`src/components/cobranca/AcordoParcelamentoDialog.helpers.ts`, z.object):
  ```ts
  { cliente_nome: z.string().min(2, 'Nome do cliente é obrigatório'), cliente_email: z.string().email().optional().or(z.literal('')), cliente_telefone: z.string().optional(), valor_original: z.number().positive('Valor deve ser maior que zero'), desconto_percentual: z.number().min(0).max(100).default(0), juros_percentual: z.number().min(0).max(100).default(0), numero_parcelas: z.number().min(1).max(60), data_primeiro_vencimento: z.date(), dia_vencimento: z.number().min(1).max(31), observacoes: z.string().optional(), }
  ```
- **itemSchema** (`src/components/compras/PedidoCompraForm.tsx`, z.object):
  ```ts
  { descricao: z.string().min(1, 'Descrição é obrigatória'), quantidade: z.number().min(0.01, 'Quantidade deve ser maior que zero'), valor_unitario: z.number().min(0, 'Valor unitário não pode ser negativo'), }
  ```
- **formSchema** (`src/components/compras/PedidoCompraForm.tsx`, z.object):
  ```ts
  { empresa_id: z.string().min(1, 'Empresa é obrigatória'), fornecedor_id: z.string().min(1, 'Fornecedor é obrigatório'), centro_custo_id: z.string().optional(), data_entrega_prevista: z.string().optional(), observacoes: z.string().optional(), itens: z.array(itemSchema).min(1, 'Adicione pelo menos um item'), }
  ```
- **ipSchema** (`src/components/configuracoes/SecuritySettings.tsx`, z.string):
  ```ts
  
  ```
- **contaPagarSchema** (`src/components/contas-pagar/ContaPagarForm.helpers.ts`, z.object):
  ```ts
  { fornecedor_id: z.string().optional(), fornecedor_nome: z .string() .min(2, 'Nome do fornecedor é obrigatório') .max(200, 'Nome muito longo'), descricao: z.string().min(3, 'Descrição é obrigatória').max(500, 'Descrição muito longa'), valor: z.number().positive('Valor deve ser maior que zero').max(999999999, 'Valor muito alto'), data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'), data_emissao: z.string().optional(), empresa_id: z.string().min(1, 'Empresa é obrigatória'), centro_custo_id: z.string().optional(), categoria_id: z.string().optional(), conta_bancaria_id: z.string().optional(), tipo_cobranca: z.enum([ 'boleto', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'dinheiro', ]), numero_documento: z.string().max(50, 'Número muito longo').optional(), codig …
  ```
- **pagamentoSchema** (`src/components/contas-pagar/RegistrarPagamentoDialog.helpers.ts`, z.object):
  ```ts
  { valor_pago: z.number().positive('Valor deve ser maior que zero'), data_pagamento: z.string().min(1, 'Data é obrigatória'), conta_bancaria_id: z.string().optional(), observacoes: z.string().max(500, 'Observações muito longas').optional(), }
  ```
- **contaReceberSchema** (`src/components/contas-receber/ContaReceberForm.tsx`, z.object):
  ```ts
  { cliente_id: z.string().optional(), cliente_nome: z.string().min(2, 'Nome do cliente é obrigatório').max(200, 'Nome muito longo'), descricao: z.string().min(3, 'Descrição é obrigatória').max(500, 'Descrição muito longa'), valor: z.number().positive('Valor deve ser maior que zero').max(999999999, 'Valor muito alto'), data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'), data_emissao: z.string().optional(), empresa_id: z.string().min(1, 'Empresa é obrigatória'), centro_custo_id: z.string().optional(), categoria_id: z.string().optional(), conta_bancaria_id: z.string().optional(), vendedor_id: z.string().optional(), tipo_cobranca: z.enum([ 'boleto', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'dinheiro', ]), numero_documento: z.string().max(50).optional(), cod …
  ```
- **recebimentoSchema** (`src/components/contas-receber/RegistrarRecebimentoDialog.tsx`, z.object):
  ```ts
  { valor_recebido: z.number().positive('Valor deve ser maior que zero'), data_recebimento: z.string().min(1, 'Data é obrigatória'), conta_bancaria_id: z.string().optional(), observacoes: z.string().max(500, 'Observações muito longas').optional(), }
  ```
- **empresaSchema** (`src/components/empresas/empresa-form-model.ts`, z.object):
  ```ts
  { cnpj: z.string().min(14, 'CNPJ é obrigatório').max(18, 'CNPJ inválido'), razao_social: z.string().min(3, 'Razão Social é obrigatória').max(255, 'Máximo 255 caracteres'), nome_fantasia: z.string().max(255, 'Máximo 255 caracteres').optional().nullable(), inscricao_estadual: z.string().max(20, 'Máximo 20 caracteres').optional().nullable(), telefone: z.string().max(20, 'Máximo 20 caracteres').optional().nullable(), email: z .string() .email('Email inválido') .max(255, 'Máximo 255 caracteres') .optional() .nullable() .or(z.literal('')), endereco: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(), cidade: z.string().max(100, 'Máximo 100 caracteres').optional().nullable(), estado: z.string().max(2, 'Selecione um estado').optional().nullable(), cep: z.string().max(10, 'CEP invál …
  ```
  - Regras cruzadas (refine): “CNAE deve ter entre 2 e 7 dígitos”
- **transferenciaSchema** (`src/components/financeiro/TransferenciaDialog.tsx`, z.object, encadeia refine):
  ```ts
  { empresa_id: z.string().min(1, 'Selecione a empresa'), conta_origem_id: z.string().min(1, 'Selecione a conta de origem'), conta_destino_id: z.string().min(1, 'Selecione a conta de destino'), valor: z.number().positive('Valor deve ser maior que zero'), data_transferencia: z.string().min(1, 'Data é obrigatória'), descricao: z.string().optional(), }
  ```
  - Regras cruzadas (refine): “As contas de origem e destino devem ser diferentes”
- **fornecedorSchema** (`src/components/fornecedores/FornecedorForm.tsx`, z.object):
  ```ts
  { razao_social: z.string().min(2, 'Razão social é obrigatória').max(200, 'Nome muito longo'), nome_fantasia: z.string().max(200, 'Nome muito longo').optional(), cnpj_cpf: z .string() .max(18, 'CNPJ/CPF inválido') .optional() .superRefine((val, ctx) => { if (val) { const result = validateCnpjCpf(val); if (!result.valid) { ctx.addIssue({ code: 'custom', message: result.message ?? 'CNPJ/CPF inválido' }); } } }), email: z .string() .email('E-mail inválido') .max(255, 'E-mail muito longo') .optional() .or(z.literal('')), telefone: z.string().max(20, 'Telefone muito longo').optional(), endereco: z.string().max(300, 'Endereço muito longo').optional(), cidade: z.string().max(100, 'Cidade muito longa').optional(), estado: z.string().max(2, 'Use a sigla do estado').optional(), contato: z.string().ma …
  ```
  - Regras cruzadas (refine): “E-mail muito longo”
- **motivoSchema** (`src/components/insights-ia/anomalia/ReabrirAnomaliasLoteDialog.tsx`, z.string):
  ```ts
  
  ```
- **formSchema** (`src/components/pagamentos-recorrentes/pagamento-recorrente-model.ts`, z.object):
  ```ts
  { descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'), fornecedor_nome: z.string().min(2, 'Fornecedor é obrigatório'), valor: z.number().min(0.01, 'Valor deve ser maior que zero'), dia_vencimento: z.number().min(1).max(31, 'Dia deve estar entre 1 e 31'), frequencia: z.enum([ 'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual', ]), data_inicio: z.date(), data_fim: z.date().optional().nullable(), empresa_id: z.string().uuid('Selecione uma empresa'), centro_custo_id: z.string().optional().nullable(), tipo_cobranca: z.string().default('transferencia'), observacoes: z.string().optional().nullable(), }
  ```
- **receitasSchema** (`src/components/tributario/calculadora/schemas.ts`, z.object):
  ```ts
  { receitaBrutaAnual: z.number().min(0), percentualServicos: z.number().min(0).max(100), devolucoes: z.number().min(0).optional(), descontosIncondicionais: z.number().min(0).optional(), }
  ```
- **folhaSchema** (`src/components/tributario/calculadora/schemas.ts`, z.object):
  ```ts
  { folhaAnual: z.number().min(0), proLabore: z.number().min(0).optional(), aliquotaRat: z.number().min(0).max(0.03).optional(), aliquotaTerceiros: z.number().min(0).max(0.1).optional(), }
  ```
- **estadualMunicipalSchema** (`src/components/tributario/calculadora/schemas.ts`, z.object):
  ```ts
  { aliquotaIcms: z.number().min(0).max(0.4).optional(), aliquotaIcmsInterestadual: z.number().min(0).max(0.4).optional(), creditoIcmsCompras: z.number().min(0).optional(), icmsSt: z.number().min(0).optional(), difal: z.number().min(0).optional(), aliquotaIss: z.number().min(0).max(0.05).optional(), }
  ```
- **creditosPisCofinsSchema** (`src/components/tributario/calculadora/schemas.ts`, z.object):
  ```ts
  { insumos: z.number().min(0).optional(), energiaEletrica: z.number().min(0).optional(), alugueisPj: z.number().min(0).optional(), depreciacao: z.number().min(0).optional(), fretesVenda: z.number().min(0).optional(), devolucoesVenda: z.number().min(0).optional(), arrendamentoMercantil: z.number().min(0).optional(), outros: z.number().min(0).optional(), }
  ```
- **lalurSchema** (`src/components/tributario/calculadora/schemas.ts`, z.object):
  ```ts
  { adicoesMultas: z.number().min(0).optional(), adicoesBrindes: z.number().min(0).optional(), adicoesProvisoes: z.number().min(0).optional(), adicoesDoacoes: z.number().min(0).optional(), adicoesOutras: z.number().min(0).optional(), exclusoesDividendos: z.number().min(0).optional(), exclusoesReversaoProvisoes: z.number().min(0).optional(), exclusoesIncentivos: z.number().min(0).optional(), exclusoesOutras: z.number().min(0).optional(), }
  ```
- **retencoesSchema** (`src/components/tributario/calculadora/schemas.ts`, z.object):
  ```ts
  { irrfSofrido: z.number().min(0).optional(), csrfSofrido: z.number().min(0).optional(), inssSofrido: z.number().min(0).optional(), issRetido: z.number().min(0).optional(), }
  ```
- **Schema** (`src/components/tributario/onboarding/StepConvidarContador.tsx`, z.object):
  ```ts
  { email: z.string().trim().email('E-mail inválido').max(255), nome: z.string().trim().max(120).optional(), }
  ```
- **envSchema** (`src/config/env.ts`, z.object):
  ```ts
  { /** URL base do Supabase, ex: https://bwwbeyolnnzppeuhgkcd.supabase.co */ SUPABASE_URL: z .string() .url('VITE_SUPABASE_URL deve ser uma URL válida') .refine((v) => v.includes('supabase.co'), { message: 'VITE_SUPABASE_URL deve apontar para supabase.co', }), /** Chave publicável (sb_publishable_…) — segura para expor no bundle */ SUPABASE_PUBLISHABLE_KEY: z .string() .min(20, 'VITE_SUPABASE_PUBLISHABLE_KEY parece inválida') .refine((v) => v.startsWith('sb_publishable_') || v.startsWith('eyJ'), { message: 'VITE_SUPABASE_PUBLISHABLE_KEY deve começar com sb_publishable_ ou eyJ', }), /** Ref do projeto — 20 chars alfanuméricos */ SUPABASE_PROJECT_ID: z .string() .length(20, 'VITE_SUPABASE_PROJECT_ID deve ter exatamente 20 caracteres'), /** Client ID OAuth do Bling. Opcional — degradação graci …
  ```
  - Regras cruzadas (refine): “VITE_SUPABASE_URL deve apontar para supabase.co” · “VITE_SUPABASE_PUBLISHABLE_KEY deve começar com sb_publishable_ ou eyJ”
- **balanceteRowSchema** (`src/hooks/useBalancete.ts`, z.object):
  ```ts
  { conta_id: z.string(), codigo: z.string(), nome: z.string(), tipo: z .string() .nullable() .transform((v) => v ?? ''), natureza: z .string() .nullable() .transform((v) => v ?? ''), nivel: z.coerce.number().int().min(1).catch(1), aceita_lancamento: z .boolean() .nullable() .transform((v) => v ?? true), saldo_anterior: numero, debitos: numero, creditos: numero, saldo_final: numero, }
  ```
- **balanceteSchema** (`src/hooks/useBalancete.ts`, z.array):
  ```ts
  balanceteRowSchema
  ```
- **agregadosSchema** (`src/hooks/useIndicesContabeis.ts`, z.object):
  ```ts
  { ativo_total: numero, ativo_circulante: numero, ativo_nao_circulante: numero, realizavel_lp: numero, imobilizado: numero, disponibilidades: numero, clientes: numero, estoques: numero, passivo_circulante: numero, passivo_nao_circulante: numero, fornecedores: numero, patrimonio_liquido: numero, receita_bruta: numero, deducoes_receita: numero, receita_liquida: numero, cmv: numero, lucro_liquido: numero, dias_periodo: z.coerce.number().int().positive().catch(1), }
  ```
- **nStr** (`src/hooks/financial/views.schemas.ts`, z.string, encadeia default, nullable, optional):
  ```ts
  
  ```
- **nNum** (`src/hooks/financial/views.schemas.ts`, z.number, encadeia default, nullable, optional):
  ```ts
  
  ```
- **contasReceberPainelRowSchema** (`src/hooks/financial/views.schemas.ts`, z.object):
  ```ts
  { id: nStr, descricao: nStr, valor: nNum, data_vencimento: nStr, data_recebimento: nStr, status: nStr, cliente_id: nStr, user_id: nStr, created_at: nStr, updated_at: nStr, empresa_id: nStr, categoria_id: nStr, centro_custo_id: nStr, forma_recebimento: nStr, conta_bancaria_id: nStr, numero_documento: nStr, observacoes: nStr, valor_recebido: nNum, juros: nNum, multa: nNum, desconto: nNum, recorrente: nBool, parcela_atual: nNum, total_parcelas: nNum, anexo_url: nStr, score: nNum, metadata: nMeta, cliente_nome: nStr, etapa_cobranca: nStr, tipo_cobranca: nStr, numero_parcela_atual: nNum, valor_desconto: nNum, chave_pix: nStr, data_emissao: nStr, categoria_nome: nStr, cliente_razao_social: nStr, cliente_nome_fantasia: nStr, cliente_nome_display: nStr, centro_custo_nome: nStr, conta_bancaria_nome …
  ```
- **contasPagarPainelRowSchema** (`src/hooks/financial/views.schemas.ts`, z.object):
  ```ts
  { id: nStr, descricao: nStr, valor: nNum, data_vencimento: nStr, data_pagamento: nStr, status: nStr, fornecedor_id: nStr, user_id: nStr, created_at: nStr, updated_at: nStr, empresa_id: nStr, categoria_id: nStr, centro_custo_id: nStr, forma_pagamento: nStr, conta_bancaria_id: nStr, numero_documento: nStr, observacoes: nStr, valor_pago: nNum, juros: nNum, multa: nNum, desconto: nNum, recorrente: nBool, parcela_atual: nNum, total_parcelas: nNum, anexo_url: nStr, metadata: nMeta, categoria: nStr, fornecedor_nome: nStr, categoria_nome: nStr, centro_resultado: nStr, aprovado_por: nStr, tipo_cobranca: nStr, fornecedor_razao_social: nStr, fornecedor_nome_fantasia: nStr, fornecedor_nome_display: nStr, centro_custo_nome: nStr, conta_bancaria_nome: nStr, }
  ```
- **emailSchema** (`src/pages/Auth.hooks.ts`, z.string):
  ```ts
  
  ```
- **loginPasswordSchema** (`src/pages/Auth.hooks.ts`, z.string):
  ```ts
  
  ```
- **budgetSchema** (`src/pages/orcamentos.types.ts`, z.object):
  ```ts
  { category: z.string().min(1, 'Selecione uma categoria'), budgeted_amount: z.number().min(0.01, 'Valor deve ser maior que zero'), period: z.string().min(7, 'Selecione o período'), }
  ```
- **schema** (`supabase/functions/_shared/contract-response_test.ts`, z.object):
  ```ts
  { nome: z.string().trim().min(1), quantidade: z.number().int().positive(), }
  ```
- **result** (`supabase/functions/_shared/contract-response_test.ts`, z.object):
  ```ts
  { id: z.string() }
  ```
- **WebhookIdempotencySchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { id: z.string().optional(), provider: z.string().optional(), processed: z.boolean().default(false), error_message: z.string().optional().nullable(), }
  ```
- **AsaasWebhookSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { event: z.string(), payment: z .object({ id: z.string(), status: z.string().optional(), }) .optional(), transfer: z .object({ id: z.string(), status: z.string().optional(), transactionReceiptUrl: z.string().optional(), }) .optional(), id: z.string().optional(), }
  ```
- **BlingWebhookSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { eventId: z.string().trim().min(1).optional(), date: z.string().datetime().optional(), version: z.union([z.string().trim().min(1), z.number()]).optional(), companyId: z.union([z.string().trim().min(1), z.number()]).optional(), event: z.string().trim().min(1), module: z.string().optional(), data: z.record(z.any()), retries: z.number().optional(), }
  ```
- **Bitrix24WebhookSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { event: z.string(), data: z.object({ FIELDS: z.record(z.any()), }), ts: z.string().optional(), auth: z .object({ domain: z.string().optional(), client_endpoint: z.string().optional(), server_endpoint: z.string().optional(), member_id: z.string().optional(), application_token: z.string().optional(), }) .optional(), }
  ```
- **AsaasProxySchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { action: z.string(), data: z.record(z.any()).optional(), }
  ```
- **BlingProxySchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { action: z.string(), }
  ```
- **AnalyzeDocumentSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { fileName: z.string(), fileType: z.string(), fileContent: z.string(), // base64 }
  ```
- **WhatsappWebhookSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { event: z.string(), messageId: z.string().optional(), status: z.string().optional(), from: z.string(), text: z.string().optional(), }
  ```
- **CnpjaLookupSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { cnpj: z.string().min(14), }
  ```
- **EnviarAlertaEmailSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { tipo: z.enum(['vencimento', 'inadimplencia', 'aprovacao', 'ruptura', 'asaas_failure']), destinatario: z.string().email(), dados: z.object({ titulo: z.string(), mensagem: z.string(), valor: z.number().optional(), dataVencimento: z.string().optional(), urlAcao: z.string().optional(), }), }
  ```
- **OptionalEmpresaIdSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid().optional().nullable(), }
  ```
- **BenchmarkingSetorialSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { metricas: z.record(z.any()), setor: z.string().optional(), }
  ```
- **Bitrix24SyncSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { action: z.enum([ 'sync_deals', 'sync_deals_all', 'sync_contacts', 'sync_companies', 'export_payment_status', 'test_connection', 'refresh_token', 'sync_elisao_task', 'sync_boleto', ]), params: z.record(z.any()).optional(), }
  ```
- **ContabilizarEventoSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid(), tipo_evento: z.enum(['conta_pagar', 'conta_receber', 'movimentacao']), evento_id: z.string().uuid(), valor: z.number().positive(), data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), descricao: z.string().optional(), categoria_id: z.string().uuid().optional().nullable(), dry_run: z.boolean().optional(), ignore_rules: z.boolean().optional(), }
  ```
- **ExecutarRelatoriosSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { relatorio_id: z.string().uuid().optional().nullable(), }
  ```
- **WhatsappIaProativoSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { action: z.enum(['analisar-alertas', 'enviar-mensagem', 'gerar-resposta-ia', 'test']), data: z.record(z.any()).optional(), }
  ```
- **ExpertAgentSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { // Limite adicionado como mitigação GHSA-mrhx-c7xc-m3w5 (zod v3 DoS por array). messages: z .array( z.object({ role: z.string(), content: z.string(), }) ) .max(100), context: z.string().optional().nullable(), conversationSummary: z.string().optional().nullable(), }
  ```
- **CalculoIvaSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { faturamentoAnual: z.number(), ano: z.number().optional(), setor: z.string().optional(), }
  ```
- **uuid** (`supabase/functions/_shared/validation.ts`, z.string):
  ```ts
  
  ```
- **NfeVinculoProxySchema** (`supabase/functions/_shared/validation.ts`, z.discriminatedUnion):
  ```ts
  'action', [ z.object({ action: z.literal('suggest'), nfeId: uuid }).strict(), z.object({ action: z.literal('link'), nfeId: uuid, contaPagarId: uuid }).strict(), z.object({ action: z.literal('unlink'), nfeId: uuid }).strict(), z .object({ action: z.literal('create_from_nfe'), nfeId: uuid, dataVencimento: z .string() .regex(/^\d{4}-\d{2}-\d{2}$/) .optional() .nullable(), categoriaId: uuid.optional().nullable(), }) .strict(), ]
  ```
- **CompensacaoMetadadosSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { regra_id: uuid.optional().nullable(), compensacao_valor: z.number().optional().nullable(), compensacao_motivo: z.string().max(500).optional().nullable(), compensacao_classificacao: z.string().max(200).optional().nullable(), compensacao_regra: z.string().max(500).optional().nullable(), compensacao_evidencia_url: z.string().max(2000).optional().nullable(), }
  ```
- **ConciliacaoProxySchema** (`supabase/functions/_shared/validation.ts`, z.discriminatedUnion):
  ```ts
  'action', [ z .object({ action: z.literal('confirmar'), transacaoId: uuid, contaPagarId: uuid.optional().nullable(), contaReceberId: uuid.optional().nullable(), // Sem `.int()`: apesar do nome, o valor trafega em reais (`-0.03`), que é // exatamente o que a tolerância de centavos produz. Exigir inteiro fazia // toda conciliação com ajuste ser rejeitada com 400 antes de chegar ao RPC. ajusteCentavos: z.number().optional().nullable(), metadados: CompensacaoMetadadosSchema.optional().nullable(), }) .strict(), z.object({ action: z.literal('desfazer'), transacaoId: uuid }).strict(), ]
  ```
- **CategorizarDespesaSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { // Limite adicionado como mitigação GHSA-mrhx-c7xc-m3w5 (zod v3 DoS por array). despesas: z .array( z.object({ id: z.string().optional(), descricao: z.string(), valor: z.number(), fornecedor_nome: z.string().optional(), data_vencimento: z.string().optional(), }) ) .max(500), }
  ```
- **FaturamentoMesSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { ano: z.number().int(), mes: z.number().int().min(0).max(11), receita_bruta: z.number().nonnegative(), }
  ```
- **FolhaMesSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { ano: z.number().int(), mes: z.number().int().min(0).max(11), valor: z.number().nonnegative(), }
  ```
- **ParametrosSimulacaoSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { faturamentoAnual: z.number().nonnegative(), faturamentoMensal: z.array(FaturamentoMesSchema).optional(), folhaAnual: z.number().nonnegative().optional(), folhaMensal: z.array(FolhaMesSchema).optional(), percentualServicos: z.number().min(0).max(100).optional(), margemLucro: z.number().optional(), setor: z.string().optional(), atividade: z.string().optional(), cnaePrincipal: z.string().optional(), custos: z.number().nonnegative().optional(), despesas: z.number().nonnegative().optional(), }
  ```
- **SimularSimplesRpcSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { faturamentoAnual: z.number().nonnegative(), rbt12: z.number().nonnegative().optional().nullable(), folha12m: z.number().nonnegative().optional().nullable(), percentualServicos: z.number().min(0).max(100).optional().nullable(), anexoForcado: z.string().optional().nullable(), }
  ```
- **DecidirRegimeSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { parametros: ParametrosSimulacaoSchema, ano: z.number().int().optional(), mes: z.number().int().min(1).max(12).optional(), regimeAtual: z.enum(['simples', 'presumido', 'real']).optional().nullable(), }
  ```
- **ProjecaoReformaSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { faturamentoAnual: z.number().nonnegative(), setor: z.string().optional(), cbsBase: z.number().optional(), ibsBase: z.number().optional(), anos: z.array(z.number().int()).optional(), }
  ```
- **PreverCargaSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid().optional().nullable(), meses: z.number().int().min(1).max(24).optional(), horizonte: z.number().int().min(1).max(24).optional(), }
  ```
- **v1** (`supabase/functions/_shared/versioned-contract_test.ts`, z.object):
  ```ts
  { event: z.string().trim().min(1) }
  ```
- **BodySchema** (`supabase/functions/aceitar-convite/index.ts`, z.object):
  ```ts
  { token: z .string() .trim() .regex(/^[a-f0-9]{64}$/, 'Token inválido'), }
  ```
- **DadosFluxoSchema** (`supabase/functions/analise-fluxo-ia/index.ts`, z.object):
  ```ts
  { saldo_atual: z.number(), saldo_final: z.number(), total_receitas: z.number(), total_despesas: z.number(), dias_projecao: z.number().int(), dias_cobertura: z.number(), dias_negativos: z.number().int(), probabilidade_ruptura: z.number().min(0).max(100), cenario: z.string(), variacao_saldo: z.number(), margem_operacional: z.number(), }
  ```
- **CriarChaveSchema** (`supabase/functions/api-keys-manage/index.ts`, z.object, encadeia superRefine):
  ```ts
  { action: z.literal('create'), empresa_id: z.string().uuid(), name: z.string().trim().min(2).max(120), scopes: z.array(z.enum(ESCOPOS_PERMITIDOS)).min(1).max(ESCOPOS_PERMITIDOS.length), expires_at: z.string().datetime({ offset: true }).optional(), }
  ```
  - Regras cruzadas (refine): “A expiração deve estar no futuro.”
- **bodySchema** (`supabase/functions/ci-security-gate-log/index.ts`, z.object):
  ```ts
  { git_sha: z.string().optional(), git_ref: z.string().optional(), workflow_run_url: z.string().optional(), migration_revision: z.string().optional(), failures: z .array( z.object({ matrix: z.string().optional(), function_name: z.string().optional(), role_tested: z.enum(['anon', 'authenticated', 'service_role']), expected_state: z.enum(['allow', 'deny']), observed_status: z.number().int().optional(), observed_code: z.string().nullable().optional(), observed_message: z.string().nullable().optional(), exception_notes: z.string().nullable().optional(), severity: z.enum(['info', 'warning', 'error', 'critical']).optional(), raw: z.record(z.unknown()).optional(), }) ) .max(500), }
  ```
- **ReqBodySchema** (`supabase/functions/comparar-benchmark-setorial/index.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid() }
  ```
- **TransacaoExtratoSchema** (`supabase/functions/conciliacao-ia/index.ts`, z.object):
  ```ts
  { id: z.string(), data: z.string(), descricao: z.string(), valor: z.number(), tipo: z.enum(['credito', 'debito']), }
  ```
- **LancamentoSistemaSchema** (`supabase/functions/conciliacao-ia/index.ts`, z.object):
  ```ts
  { id: z.string(), tipo: z.enum(['pagar', 'receber']), entidade: z.string(), descricao: z.string().optional(), valor: z.number(), dataVencimento: z.string(), documento: z.string().optional(), }
  ```
- **ConciliacaoInputSchema** (`supabase/functions/conciliacao-ia/index.ts`, z.object):
  ```ts
  { transacoes: z.array(TransacaoExtratoSchema).max(500), lancamentos: z.array(LancamentoSistemaSchema).max(500), historicoFeedback: z.array(z.any()).max(200).optional(), }
  ```
- **ufSchema** (`supabase/functions/consulta-tributaria/index.ts`, z.enum):
  ```ts
  UFS
  ```
- **boolish** (`supabase/functions/consulta-tributaria/index.ts`, z.union, encadeia transform):
  ```ts
  [z.boolean(), z.enum(['true', 'false', '1', '0'])]
  ```
- **ParamsSchema** (`supabase/functions/consulta-tributaria/index.ts`, z.object):
  ```ts
  { recurso: z.enum(['uf', 'cnae', 'ncm']), uf: ufSchema.optional(), uf_destino: ufSchema.optional(), codigo: z.string().trim().min(1).max(20).optional(), categoria: z.string().trim().min(1).max(60).optional(), municipio: z.coerce.number().int().positive().optional(), monofasico: boolish.optional(), st: boolish.optional(), limite: z.coerce.number().int().min(1).max(200).optional().default(25), }
  ```
- **BodySchema** (`supabase/functions/convidar-contador/index.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid(), email: z.string().trim().email().max(255), nome: z.string().trim().max(120).optional(), origin: z.string().url().optional(), }
  ```
- **PapelSchema** (`supabase/functions/convidar-usuario/index.ts`, z.enum):
  ```ts
  ['admin', 'financeiro', 'operacional', 'visualizador']
  ```
- **ConviteSchema** (`supabase/functions/convidar-usuario/index.ts`, z.object):
  ```ts
  { email: z.string().trim().email().max(255), role: PapelSchema, }
  ```
- **CopilotGlobalBodySchema** (`supabase/functions/copilot-global/index.ts`, z.object):
  ```ts
  { contexto_pagina: z.string().max(64).optional(), messages: z .array( z.object({ role: z.enum(['system', 'user', 'assistant', 'tool']), content: z.string().max(20000).optional(), tool_call_id: z.string().optional(), tool_calls: z.array(z.unknown()).optional(), }) ) .max(50) .optional(), }
  ```
- **CopilotTributarioBodySchema** (`supabase/functions/copilot-tributario/index.ts`, z.object):
  ```ts
  { messages: z .array( z.object({ role: z.enum(['system', 'user', 'assistant']), content: z.string().max(20000), }) ) .min(1) .max(50), empresa_id: z.string().uuid().optional(), }
  ```
- **DecidirBodySchema** (`supabase/functions/decidir-regime/index.ts`, z.object):
  ```ts
  { empresaId: z.string().uuid(), anoReferencia: z.number().int().optional().nullable(), mesReferencia: z.number().int().min(1).max(12).optional().nullable(), parametrosOverride: z.record(z.any()).optional().nullable(), regimeAtual: z .enum(['simples_nacional', 'lucro_presumido', 'lucro_real']) .optional() .nullable(), persist: z.boolean().optional(), }
  ```
- **AnomaliaRunInputSchema** (`supabase/functions/detectar-anomalias-financeiras/index.ts`, z.object):
  ```ts
  { run_id: z.string().uuid().optional(), }
  ```
- **BodySchema** (`supabase/functions/digest-silenciamentos-erro/index.ts`, z.object):
  ```ts
  { janelaHoras: z.union([z.number(), z.string().trim().min(1)]).optional(), minIntervaloHoras: z.union([z.number(), z.string().trim().min(1)]).optional(), }
  ```
- **_BxTribSchema** (`supabase/functions/enviar-bitrix24-tributario/index.ts`, z.object):
  ```ts
  { empresaId: z.string().uuid(), signedUrl: z.string().url(), empresaNome: z.string().min(1), periodo: z.string().min(1), regimeRecomendado: z.string().min(1), economiaAnual: z.number(), dealId: z.string().optional(), }
  ```
- **BodySchema** (`supabase/functions/enviar-convite-organizacao/index.ts`, z.object):
  ```ts
  { convite_id: z.string().uuid(), origin: z.string().url().max(300).optional(), }
  ```
- **BodySchema** (`supabase/functions/enviar-digest-conformidade/index.ts`, z.object):
  ```ts
  { /** Restringe o digest a uma empresa. */ empresaId: z.string().uuid().optional(), /** Destinatários explícitos; se ausente, usa as preferências dos usuários. */ destinatarios: z.array(z.string().email()).max(50).optional(), /** Ignora as preferências e envia um digest único aos administradores. */ forcarGlobal: z.boolean().default(false), /** Competência exibida no cabeçalho (AAAA-MM). */ competencia: z .string() .regex(/^\d{4}-(0[1-9]|1[0-2])$/) .optional(), /** Severidade mínima incluída no digest. */ severidadeMinima: z.enum(['baixa', 'media', 'alta', 'critica']).default('media'), /** Quando true, não envia e não marca alertas — apenas devolve a prévia. */ dryRun: z.boolean().default(false), /** Teto de alertas por execução (proteção contra payloads gigantes). */ limite: z.number().in …
  ```
- **_FechamentoSchema** (`supabase/functions/executar-fechamento-tributario/index.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid(), ano: z.number().int().min(2000).max(2100), mes: z.number().int().min(1).max(12), }
  ```
- **BodySchema** (`supabase/functions/executar-regua-cobranca/index.ts`, z.object):
  ```ts
  { dry_run: z.boolean().default(false) }
  ```
- **AcoesRecomendadasBodySchema** (`supabase/functions/gerar-acoes-recomendadas/index.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid().optional(), }
  ```
- **_GerarAlertasSchema** (`supabase/functions/gerar-alertas/index.ts`, z.object):
  ```ts
  { incluirMetas: z.boolean().optional(), userId: z.string().uuid().nullable().optional(), }
  ```
- **ForwardedBodySchema** (`supabase/functions/gerar-alertas-dispatcher/index.ts`, z.string):
  ```ts
  
  ```
- **ReqBodySchema** (`supabase/functions/gerar-dre-tributaria/index.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid(), periodo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), }
  ```
- **ReqBodySchema** (`supabase/functions/gerar-heatmap-tributario/index.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid(), ano: z .number() .int() .min(2000) .max(2100) .default(() => new Date().getFullYear()), }
  ```
- **_EvidBodySchema** (`supabase/functions/gerar-pacote-evidencias/index.ts`, z.object):
  ```ts
  { periodo_inicio: z.string().min(1), periodo_fim: z.string().min(1), escopos: z.array(z.enum(['financeiro', 'tributario', 'sistema', 'conformidade'])).min(1), // Obrigatório quando o pacote inclui algum escopo com dado por empresa // (financeiro/tributario/conformidade). "sistema" (audit_logs) não tem // empresa_id — é trilha de plataforma, não de tenant. empresa_id: z.string().uuid().optional(), }
  ```
- **PdfTributarioBodySchema** (`supabase/functions/gerar-pdf-tributario/index.ts`, z.object):
  ```ts
  { empresaId: z.string().uuid(), anoReferencia: z.number().int().min(2020).max(2100), mesReferencia: z.number().int().min(1).max(12), }
  ```
- **RelatorioAnualBodySchema** (`supabase/functions/gerar-relatorio-anual/index.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid(), ano: z.number().int().min(2020).max(2100), }
  ```
- **ResumoSemanalBodySchema** (`supabase/functions/gerar-resumo-executivo-semanal/index.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid().optional(), }
  ```
- **BodySchema** (`supabase/functions/gerar-snapshots-conformidade/index.ts`, z.object):
  ```ts
  { /** Competências AAAA-MM a recalcular. Se ausente, usa as últimas `meses`. */ competencias: z .array(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)) .max(24) .optional(), /** Quantidade de competências retroativas quando `competencias` não é informado. */ meses: z.number().int().min(1).max(24).default(3), /** Restringe a execução a uma empresa. */ empresaId: z.string().uuid().optional(), /** Regime considerado no calendário (default: catálogo completo do Lucro Real). */ regime: z.enum(['simples', 'presumido', 'real', 'todos']).default('real'), }
  ```
- **InsightsRelatorioBodySchema** (`supabase/functions/insights-relatorio/index.ts`, z.object):
  ```ts
  { dados: z.unknown(), contexto: z.string().max(500).optional(), }
  ```
- **RequestSchema** (`supabase/functions/mcp-query/index.ts`, z.object):
  ```ts
  { sql: z.string().optional(), sql_b64: z.string().optional(), stmts_b64: z.string().optional(), limit: z.number().int().optional(), allow_all_rows: z.boolean().optional(), admin: z .object({ path: z.string(), method: z.string().optional(), body: z.unknown().optional(), }) .optional(), }
  ```
- **BodySchema** (`supabase/functions/monitorar-erros-frontend/index.ts`, z.object):
  ```ts
  { windowMinutes: z.union([z.number(), z.string().trim().min(1)]).optional(), threshold: z.union([z.number(), z.string().trim().min(1)]).optional(), cooldownMinutes: z.union([z.number(), z.string().trim().min(1)]).optional(), limit: z.union([z.number(), z.string().trim().min(1)]).optional(), }
  ```
- **schema** (`supabase/functions/n8n-callback/index.ts`, z.object):
  ```ts
  { action: z.enum(['create_task', 'create_alert', 'log']), payload: z.record(z.unknown()), }
  ```
- **Schema** (`supabase/functions/n8n-dispatch/index.ts`, z.object):
  ```ts
  { event_type: z.string().min(1), risk_score: z.number().optional(), entity_id: z.string().optional(), payload: z.record(z.any()), }
  ```
- **BodySchema** (`supabase/functions/nfe-upload-certificado/index.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid(), pfx_base64: z.string().min(100), password: z.string().min(1).max(256), ambiente: z.enum(['homologacao', 'producao']).default('homologacao'), uf: z.string().length(2), }
  ```
- **alertShape** (`supabase/functions/notify-performance-alert/index.ts`, z.object):
  ```ts
  { id: z.string().optional(), source: z.string().optional(), alert_key: z.string().optional(), severity: z.string(), reason: z.string().nullable().optional(), current_value: z.number().nullable().optional(), baseline_value: z.number().nullable().optional(), ratio: z.number().nullable().optional(), sample_count: z.number().nullable().optional(), query_snippet: z.string().nullable().optional(), created_at: z.string().optional(), }
  ```
- **schema** (`supabase/functions/notify-performance-alert/index.ts`, z.union):
  ```ts
  [z.object({ alert: alertShape }).passthrough(), alertShape]
  ```
- **Schema** (`supabase/functions/notify-saved-filter/index.ts`, z.object):
  ```ts
  { sourceRef: z.string().optional(), filterName: z.string().min(1), title: z.string().min(1), body: z.string(), channels: z.object({ inapp: z.boolean().optional(), email: z.boolean().optional(), push: z.boolean().optional(), }), metadata: z.record(z.any()).optional(), url: z.string().optional(), }
  ```
- **_OFSchema** (`supabase/functions/open-finance/index.ts`, z.object):
  ```ts
  { action: z.string().min(1), params: z.record(z.unknown()).optional(), }
  ```
- **RejeicaoSchema** (`supabase/functions/overlay-rejeicoes-auditoria/index.ts`, z.object):
  ```ts
  { catalogo: z.enum([ 'icms', 'iss', 'ncm', 'monofasico', 'mva_st', 'interestaduais', 'faixas_simples', ]), identificador: z.string().min(1).max(120), descricao: z.string().max(300).nullable().optional(), campo: z.string().min(1).max(80), motivo: z.string().min(1).max(80), valorRecebido: z.string().max(300).nullable().optional(), severidade: z.enum(['critico', 'atencao']).default('critico'), }
  ```
- **BodySchema** (`supabase/functions/overlay-rejeicoes-auditoria/index.ts`, z.discriminatedUnion):
  ```ts
  'acao', [ z.object({ acao: z.literal('registrar'), referencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), rejeicoes: z.array(RejeicaoSchema).max(1000), }), z.object({ acao: z.literal('resolver'), id: z.string().uuid(), resolvido: z.boolean(), observacao: z.string().max(500).nullable().optional(), }), ]
  ```
- **ReqBodySchema** (`supabase/functions/prever-carga-tributaria/index.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid(), meses_historico: z.number().int().min(3).max(24).default(12), }
  ```
- **OcrSchema** (`supabase/functions/processar-nf-ocr/index.ts`, z.object):
  ```ts
  { arquivo_url: z.string().optional(), arquivo_base64: z.string().optional(), arquivo_tipo: z.string().optional(), arquivo_nome: z.string().optional(), empresa_id: z.string().uuid().optional(), }
  ```
- **Schema** (`supabase/functions/projecao-reforma/index.ts`, z.object):
  ```ts
  { faturamentoAnual: z.number().nonnegative(), percentualServicos: z.number().min(0).max(100), pisCofinsAtual: z.number().optional(), icmsAtual: z.number().optional(), issAtual: z.number().optional(), setor: z.string().optional(), }
  ```
- **_RelAnomSchema** (`supabase/functions/relatorio-diario-anomalias/index.ts`, z.object):
  ```ts
  { destinatarios: z.array(z.string().email()).optional(), horas: z.number().positive().max(720).optional(), }
  ```
- **RequestBodySchema** (`supabase/functions/sefaz-dfe-puxar/index.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid().optional(), // Enviados pelo sefaz-dfe-dispatcher: restringe ao certificado do cursor elegível. cnpj: z.string().optional(), ambiente: z.enum(['producao', 'homologacao']).optional(), }
  ```
- **ManifSchema** (`supabase/functions/sefaz-manifestar/index.ts`, z.object):
  ```ts
  { chave_acesso: z.string().length(44), tipo: z.enum(['210200', '210210', '210220', '210240']), justificativa: z.string().optional(), }
  ```
- **Schema** (`supabase/functions/send-device-alert/index.ts`, z.object):
  ```ts
  { userId: z.string().uuid(), email: z.string().email(), browser: z.string(), os: z.string(), deviceType: z.string(), timestamp: z.string(), }
  ```
- **Schema** (`supabase/functions/send-push-notification/index.ts`, z.object):
  ```ts
  { userId: z.string().uuid().optional(), title: z.string().min(1), body: z.string().min(1), icon: z.string().optional(), badge: z.string().optional(), tag: z.string().optional(), data: z.record(z.any()).optional(), prioridade: z.enum(['baixa', 'media', 'alta', 'critica']).optional(), }
  ```
- **_SyncAnomSchema** (`supabase/functions/sincronizar-anomalia-bitrix24/index.ts`, z.object):
  ```ts
  { anomaliaId: z.string().uuid(), evento: z.enum(['confirmada', 'falso_positivo', 'parecer', 'reaberta']), }
  ```
- **Schema** (`supabase/functions/sso-generate-metadata/index.ts`, z.object):
  ```ts
  { tipo: z.enum(['oidc', 'saml']), nome: z.string().optional() }
  ```
- **Schema** (`supabase/functions/sso-initiate/index.ts`, z.object):
  ```ts
  { provider_id: z.string().uuid(), redirect_to: z.string().url().optional().nullable(), }
  ```
- **Schema** (`supabase/functions/sso-test-login/index.ts`, z.object):
  ```ts
  { mock_claims: z.record(z.any()), claim_mapping: z.record(z.any()).optional(), role_mappings: z.array(z.any()).optional(), default_role: z.string().optional(), allowed_domains: z.array(z.string()).optional(), provider_id: z.string().uuid().optional(), }
  ```
- **Schema** (`supabase/functions/sso-validate-config/index.ts`, z.object):
  ```ts
  { tipo: z.enum(['oidc', 'saml']), discovery_url: z.string().url().optional().nullable(), metadata_xml: z.string().optional().nullable(), metadata_url: z.string().url().optional().nullable(), sso_url: z.string().url().optional().nullable(), x509_cert: z.string().optional().nullable(), }
  ```
- **_SyncProfileSchema** (`supabase/functions/sync-profile-to-bitrix/index.ts`, z.object):
  ```ts
  { full_name: z.string().optional(), avatar_url: z.string().url().nullable().optional(), telefone: z.string().nullable().optional(), }
  ```
- **_TokenSchema** (`supabase/functions/validar-token-contador/index.ts`, z.object):
  ```ts
  { token: z.string().min(10) }
  ```
- **_IpGeoSchema** (`supabase/functions/validate-ip-geo/index.ts`, z.object):
  ```ts
  { email: z.string().email().max(254).optional() }
  ```
- **_ConfFiscalSchema** (`supabase/functions/verificar-conformidade-fiscal/index.ts`, z.object):
  ```ts
  { empresa_id: z.string().uuid(), periodo: z .string() .regex(/^\d{4}-\d{2}$/) .optional(), }
  ```
- **ReplayBodySchema** (`supabase/functions/webhook-replay/index.ts`, z.object):
  ```ts
  { ids: z.array(z.string().uuid()).optional(), source: z.string().trim().min(1).optional(), status: z.string().trim().min(1).optional(), limit: z.number().int().min(1).max(500).optional(), }
  ```
- **RetryBodySchema** (`supabase/functions/webhook-retry-worker/index.ts`, z.object):
  ```ts
  { limit: z.number().int().min(1).max(200).optional() }
  ```
- **_WebhookSimSchema** (`supabase/functions/webhook-simulator/index.ts`, z.object):
  ```ts
  { run_id: z.string().uuid(), target_function: z.string().min(1), scenarios_count: z.number().int().positive().max(1000).optional(), mode: z.string().optional(), }
  ```
- **WhatsappAnalyzerBodySchema** (`supabase/functions/whatsapp-ai-analyzer/index.ts`, z.object):
  ```ts
  { record: z.object({ id: z.union([z.string(), z.number()]), mensagem: z.string().min(1).max(4096), }), }
  ```

### F.2 react-hook-form (register/rules)

| Campo | Regras | Arquivo |
|---|---|---|
| `aliquota_rat` | `valueAsNumber: true` | `src/components/empresas/EmpresaForm.tsx` |
| `aliquota_terceiros` | `valueAsNumber: true` | `src/components/empresas/EmpresaForm.tsx` |

### F.3 Restrições em inputs HTML (required/min/max/pattern)

| Campo | Restrições | Arquivo |
|---|---|---|
| `valorMinimo` | type=number | `src/components/aprovacoes/ConfiguracaoAprovacaoCard.tsx` |
| `aprovadores` | type=number | `src/components/aprovacoes/ConfiguracaoAprovacaoCard.tsx` |
| `forgot-email` | type=email | `src/components/auth/ForgotPasswordForm.tsx` |
| `login-email` | type=email | `src/components/auth/LoginForm.tsx` |
| `register-email` | type=email | `src/components/auth/RegisterForm.tsx` |
| `verify-code` | max | `src/components/auth/TwoFactorSetup.tsx` |
| `valor` | type=number, step=0.01 | `src/components/boletos/NovoBoletoForm.tsx` |
| `vencimento` | type=date | `src/components/boletos/NovoBoletoForm.tsx` |
| `ofx-file-upload` | accept=.ofx,.ofc,.csv,.txt,.xlsx,.xls | `src/components/conciliacao/ImportarExtratoDialogArquivoLocal.tsx` |
| `bal-inicio` | type=date | `src/components/contabilidade/balancete/BalanceteToolbar.tsx` |
| `bal-fim` | type=date | `src/components/contabilidade/balancete/BalanceteToolbar.tsx` |
| `idx-inicio` | type=date | `src/components/contabilidade/indices/IndicesToolbar.tsx` |
| `idx-fim` | type=date | `src/components/contabilidade/indices/IndicesToolbar.tsx` |
| `ocr-upload` | accept=application/pdf,image/*, disabled=isOcrProcessing | `src/components/contas-pagar/ContaPagarForm.tsx` |
| `retorno-upload` | accept=.ofx,.csv | `src/components/contas-receber/BaixaAutomaticaDialog.tsx` |
| `cnpj` | max, disabled=isLoading | `src/components/empresas/EmpresaForm.tsx` |
| `inscricao_estadual` | disabled=isLoading | `src/components/empresas/EmpresaForm.tsx` |
| `razao_social` | disabled=isLoading | `src/components/empresas/EmpresaForm.tsx` |
| `nome_fantasia` | disabled=isLoading | `src/components/empresas/EmpresaForm.tsx` |
| `telefone` | max, disabled=isLoading | `src/components/empresas/EmpresaForm.tsx` |
| `email` | type=email, disabled=isLoading | `src/components/empresas/EmpresaForm.tsx` |
| `endereco` | disabled=isLoading | `src/components/empresas/EmpresaForm.tsx` |
| `cnae_principal` | max, disabled=isLoading | `src/components/empresas/EmpresaForm.tsx` |
| `aliquota_rat` | type=number, step=0.1, min=0, max=6, disabled=isLoading | `src/components/empresas/EmpresaForm.tsx` |
| `aliquota_terceiros` | type=number, step=0.1, min=0, max=8, disabled=isLoading | `src/components/empresas/EmpresaForm.tsx` |
| `cidade` | disabled=isLoading | `src/components/empresas/EmpresaFormCidade.tsx` |
| `cep` | max, disabled=isLoading | `src/components/empresas/EmpresaFormCidade.tsx` |
| `file-upload` | disabled=uploading | `src/components/financeiro/AnexoList.tsx` |
| `numeroInicial` | type=number | `src/components/nfe/InutilizacaoNFe.tsx` |
| `numeroFinal` | type=number | `src/components/nfe/InutilizacaoNFe.tsx` |
| `value` | type=number | `src/components/quick-create/QuickCreateModal.tsx` |
| `valor` | type=number | `src/components/reforma-tributaria/CalculadoraTributos.tsx` |
| `aliquota-is` | type=number, min=0, step=0.01 | `src/components/reforma-tributaria/CalculadoraTributos.tsx` |
| `xml-input` | accept=.xml, multiple | `src/components/reforma-tributaria/ImportacaoXMLPanel.tsx` |
| `sub-rate-max` | max, type=number, min=1, max=100 | `src/components/shared/SubscriptionPopover.tsx` |
| `sub-rate-window` | type=number, min=1, max=1440 | `src/components/shared/SubscriptionPopover.tsx` |
| `nf-upload` | accept=image/*,application/pdf | `src/components/tributario/dashboard/UploadNotaFiscalOCR.tsx` |
| `contador-email` | type=email | `src/components/tributario/onboarding/StepConvidarContador.tsx` |
| `faturamento-anual` | type=number | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `margem` | type=number | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `perc-servicos` | type=number | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `perc-industria` | type=number | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `perc-revenda` | type=number, max | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `perc-exportacao` | type=number, min=0, max=100 | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `folha-anual` | type=number | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `compras-credito` | type=number | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `despesas-op` | type=number | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `aliq-icms` | type=number, step=0.01 | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `aliq-iss` | type=number, step=0.01 | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `sublimite` | type=number | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `iss-retido` | type=number | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `aliquota-rat` | type=number, step=0.1 | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `aliquota-terceiros` | type=number, step=0.1 | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `prejuizo-fiscal` | type=number, min=0 | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `base-negativa-csll` | type=number, min=0 | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `checkboxId` | disabled, disabled | `src/components/ui/checkbox.tsx` |
| `radioId` | disabled, disabled | `src/components/ui/radio.tsx` |
| `orcamento-valor` | type=number, step=0.01 | `src/pages/OrcamentosFormDialog.tsx` |
| `corp-email` | type=email | `src/pages/auth/CorporateOnboarding.tsx` |
| `convite-email` | type=email | `src/pages/organizacoes/Organizacoes.parts.tsx` |
| `df-valor` | type=number, min=0 | `src/pages/tributario/DiferencialAliquotas.tsx` |
| `folha` | type=number, min=0 | `src/pages/tributario/FolhaEncargos.tsx` |
| `prolabore` | type=number, min=0 | `src/pages/tributario/FolhaEncargos.tsx` |
| `fap` | type=number, step=0.0001, min=FAP_MINIMO, max=FAP_MAXIMO | `src/pages/tributario/FolhaEncargos.tsx` |
| `receita` | type=number, min=0 | `src/pages/tributario/FolhaEncargos.tsx` |
| `id` | type=number, step=step ??  | `src/pages/tributario/NumberField.tsx` |
| `hoje` | type=date | `src/pages/tributario/ObrigacoesAcessorias.tsx` |
| `prolabore` | type=number, min=0, step=1000 | `src/pages/tributario/PfVinculada.tsx` |
| `digest-max` | max, type=number, min=1, max=500, max | `src/pages/tributario/PreferenciasDigest.tsx` |
| `digest-email` | type=email | `src/pages/tributario/PreferenciasDigest.tsx` |
| `multa-prazo` | type=date | `src/pages/tributario/SimuladorMultaCard.tsx` |
| `multa-entrega` | type=date | `src/pages/tributario/SimuladorMultaCard.tsx` |
| `st-valor` | type=number, min=0 | `src/pages/tributario/SubstituicaoTributaria.tsx` |
| `st-frete` | type=number, min=0 | `src/pages/tributario/SubstituicaoTributaria.tsx` |
| `st-ipi` | type=number, min=0 | `src/pages/tributario/SubstituicaoTributaria.tsx` |
| `st-desc` | type=number, min=0 | `src/pages/tributario/SubstituicaoTributaria.tsx` |
| `st-ncm` | max | `src/pages/tributario/SubstituicaoTributaria.tsx` |
| `st-mva` | type=number, step=0.0001, min=0, disabled=usarProtocolo && resolucao.encontrado | `src/pages/tributario/SubstituicaoTributaria.tsx` |
| `st-pmpf` | type=number, min=0 | `src/pages/tributario/SubstituicaoTributaria.tsx` |
| `elisao-lucros-acumulados` | type=number, min=0 | `src/pages/tributario/oportunidades-elisao/ContextoForm.tsx` |
| `elisao-creditos-pis` | type=number, min=0 | `src/pages/tributario/oportunidades-elisao/ContextoForm.tsx` |
| `elisao-investimento-maquinas` | type=number, min=0 | `src/pages/tributario/oportunidades-elisao/ContextoForm.tsx` |

## G. Fórmulas e derivações (como valores são calculados)

### G.1 Colunas calculadas no banco

| Tabela | Coluna | Expressão |
|---|---|---|
| `contas_bancarias` | `saldo_disponivel` | `saldo_atual` |

### G.2 Views (consultas derivadas)

| View | SELECT |
|---|---|
| `mv_performance_alerts_weekly` | `WITH weekly AS ( SELECT date_trunc('week', created_at)::date AS week_start, source, severity, COUNT(*) AS alert_count, COUNT(DISTINCT alert_key) AS distinct_keys, ROUND(AVG(NULLIF(current_value, 0))::numeric, 2) AS avg_current_ms, ROUND(MAX(current_value)::numeric, 2) AS max_current_ms, ROUND(AVG(NU …` |
| `vw_edge_health` | `SELECT l.function_name, COUNT(*)::bigint AS total_calls, COUNT(*) FILTER (WHERE l.level = 'error' OR l.error_message IS NOT NULL OR l.status_code >= 500)::bigint AS error_count, ROUND(100.0 * COUNT(*) FILTER (WHERE l.level = 'error' OR l.error_message IS NOT NULL OR l.status_code >= 500) / NULLIF(CO …` |
| `drivers_safe_view` | `SELECT id, name, vehicle_type, status, rating, risk_score, risk_level, total_deliveries, completed_deliveries, failed_deliveries, cancelled_deliveries, success_rate, failure_rate, avg_delay_minutes, lalamove_id, vehicle_plate, photo_url, blacklisted, blacklist_reason, whitelisted, notes, last_active …` |
| `extratos_bancarios_importados` | `SELECT id, user_id, conta_bancaria_id, data, descricao, valor, tipo, numero_documento, numero_documento_banco, codigo_transacao, arquivo_origem, importado_de, importado_em, linha_arquivo, hash_transacao, saldo, conciliado, created_at FROM public.extrato_bancario` |
| `mcp_probe` | `SELECT 1 AS probe, CURRENT_TIMESTAMP AS ts` |
| `orders_operator_view` | `SELECT id, lalamove_id, status, pickup_address, delivery_address, CASE WHEN (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)) THEN customer_phone ELSE '***RESTRITO***'::text END AS customer_phone, customer_name, vehicle_type, total_cos …` |
| `orders_safe_view` | `SELECT id, lalamove_id, status, vehicle_type, customer_name, CASE WHEN (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)) THEN customer_phone ELSE '***RESTRITO***'::text END AS customer_phone, pickup_address, delivery_address, total_cos …` |
| `v_sefaz_observability` | `SELECT c.cnpj, c.ambiente, c.ultimo_nsu, c.max_nsu, c.ultima_consulta, c.ultimo_status, c.circuit_open, c.retry_count, c.next_run_at, (EXTRACT(epoch FROM (now() - c.ultima_consulta)))::integer AS seconds_since_last, COALESCE(n.nfe_24h, (0)::bigint) AS nfe_24h, COALESCE(n.nfe_7d, (0)::bigint) AS nfe_ …` |
| `v_table_bloat` | `SELECT schemaname, relname AS table_name, n_live_tup AS live_rows, n_dead_tup AS dead_rows, CASE WHEN ((n_live_tup + n_dead_tup) > 0) THEN round((((n_dead_tup)::numeric / ((n_live_tup + n_dead_tup))::numeric) * (100)::numeric), 2) ELSE (0)::numeric END AS dead_ratio_pct, pg_size_pretty(pg_total_rela …` |
| `vw_auditoria_tributaria_recente` | `SELECT a.id, a.empresa_id, e.razao_social AS empresa_nome, a.user_id, p.full_name AS user_nome, a.user_email, a.acao, a.entidade_tipo, a.entidade_id, a.payload_anterior, a.payload_novo, a.criado_em FROM ((public.auditoria_tributaria a LEFT JOIN public.empresas e ON ((e.id = a.empresa_id))) LEFT JOIN …` |
| `vw_contas_pagar_painel` | `SELECT cp.id, cp.descricao, cp.valor, cp.data_vencimento, cp.data_pagamento, cp.status, cp.fornecedor_id, cp.user_id, cp.created_at, cp.updated_at, cp.empresa_id, cp.categoria_id, cp.centro_custo_id, cp.forma_pagamento, cp.conta_bancaria_id, cp.numero_documento, cp.observacoes, cp.valor_pago, cp.jur …` |
| `vw_contas_receber_painel` | `SELECT cr.id, cr.descricao, cr.valor, cr.data_vencimento, cr.data_recebimento, cr.status, cr.cliente_id, cr.user_id, cr.created_at, cr.updated_at, cr.empresa_id, cr.categoria_id, cr.centro_custo_id, cr.forma_recebimento, cr.conta_bancaria_id, cr.numero_documento, cr.observacoes, cr.valor_recebido, c …` |
| `vw_dre_mensal` | `SELECT gen_random_uuid() AS id, id AS empresa_id, to_char(now(), 'YYYY-MM'::text) AS mes, 50000.00 AS receita_bruta, 30000.00 AS custos, 20000.00 AS lucro_bruto, 15000.00 AS despesas_operacionais, 5000.00 AS ebitda FROM public.empresas` |
| `vw_dso_aging` | `SELECT id AS empresa_id, 45 AS dso_atual, 5000.00 AS a_vencer, 2000.00 AS vencido_0_30, 1500.00 AS vencido_31_60, 1000.00 AS vencido_61_plus FROM public.empresas` |
| `vw_fluxo_caixa_diario` | `SELECT gen_random_uuid() AS id, id AS empresa_id, (now())::date AS dia, 2500.00 AS entradas_reais, 1200.00 AS saidas_reais, 1300.00 AS saldo_final FROM public.empresas` |
| `vw_gastos_centro_custo` | `SELECT id AS centro_custo_id, nome AS nome_centro_custo, empresa_id, 0.0 AS total_gasto FROM public.centros_custo` |
| `vw_metricas_cobranca` | `SELECT id AS empresa_id, 15.5 AS taxa_inadimplencia, 120 AS ticket_medio, 500 AS total_cobrancas_mes FROM public.empresas` |
| `vw_saldos_contas` | `SELECT gen_random_uuid() AS id, id AS empresa_id, 'Conta Corrente'::text AS nome_conta, 1000.00 AS saldo_atual, now() AS ultima_atualizacao FROM public.empresas` |
| `vw_transferencias_painel` | `SELECT t.id, t.empresa_id, e.razao_social, t.asaas_id, t.valor, t.status, t.tipo_chave, CASE WHEN public.pode_ver_dado_sensivel() THEN t.chave_pix ELSE public.mascarar_chave_pix(t.chave_pix) END AS chave_pix, t.descricao, t.created_at, t.updated_at FROM (public.asaas_transfers t LEFT JOIN public.emp …` |
| `vw_tributario_dashboard` | `SELECT e.id AS empresa_id, e.razao_social, COALESCE(e.regime_tributario, 'nao_informado'::text) AS regime_tributario, at_.ano, at_.mes, at_.competencia, COALESCE(at_.total_geral, (0)::numeric) AS total_tributos, COALESCE(at_.total_tributos_novos, (0)::numeric) AS tributos_novos, COALESCE(at_.total_t …` |
| `vw_webhooks_recentes` | `SELECT id, source AS endpoint, event_type AS evento, status AS status_code, created_at, error_message, attempts FROM public.webhooks_log wl ORDER BY created_at DESC LIMIT 100` |
| `vw_fluxo_caixa` | `SELECT e.id AS empresa_id, d.dia::date AS dia, COALESCE(r.valor, 0) AS receitas_previstas, COALESCE(p.valor, 0) AS despesas_previstas, COALESCE(r.valor, 0) - COALESCE(p.valor, 0) AS saldo_dia FROM public.empresas e CROSS JOIN generate_series( CURRENT_DATE::timestamp, (CURRENT_DATE + 90)::timestamp, …` |

### G.3 Funções de cálculo/decisão no código

- **applyClaimsFromBulk(claims: Record<string, unknown>, base: { provider_id?: string; claim_mapping?: { email?: string; full_name?: string; gro)** — `src/components/admin/sso/SSOSandboxPanel.tsx`
  ```
  setClaimsJson(JSON.stringify(claims, null, 2)); if (base.provider_id) { setProviderId(base.provider_id); setUseProviderConfig(true); } else { setUseProviderConfig(false); if (base.claim_mapping) { setManualEmail(base.claim_mapping.email ?? 'email'); setManualName(base.claim_mapping.full_name ?? 'name'); setManualGroups(base.claim_mapping.groups ?? 'groups'); } if (base.default_role) setManualRole(base.default_role as AppRole); if (base.allowed_domains) setManualDomains(base.allowed_domains.join( …
  ```
- **applyRun(run: SandboxRun)** — `src/components/admin/sso/SSOSandboxPanel.tsx`
  ```
  const input = run.input as { mock_claims?: unknown; provider_id?: string; claim_mapping?: { email?: string; full_name?: string; groups?: string }; default_role?: AppRole; allowed_domains?: string[]; role_mappings?: Array<{ idp_group: string; app_role: string }>; }; setProviderId(input.provider_id ?? ''); setUseProviderConfig(!!input.provider_id); if (input.mock_claims !== undefined) { setClaimsJson(JSON.stringify(input.mock_claims, null, 2)); } if (input.claim_mapping) { setManualEmail(input.cla …
  ```
- **applyAutofix(patch: AutoFix['patch'])** — `src/components/admin/sso/SSOWizardDialog.tsx`
  ```
  if (patch.allowed_domains !== undefined) { setForm((p) => ({ ...p, allowed_domains: patch.allowed_domains as string[] })); } if (patch.claim_mapping !== undefined) { setForm((p) => ({ ...p, claim_mapping: { ...p.claim_mapping, ...patch.claim_mapping, } as SSOProvider['claim_mapping'], })); } if (patch.default_role !== undefined) { setForm((p) => ({ ...p, default_role: patch.default_role as AppRole })); } if (patch.role_mappings !== undefined) { setRoleMappings(patch.role_mappings as Array<{ idp_ …
  ```
- **computeOutcome(result: SandboxResult)** — `src/components/admin/sso/sandbox/outcome.ts`
  ```
  const p = result.preview; if (!p.email) return 'sem_email'; const blocked = !p.domain_allowed || !!p.provision_blocked_reason || (result.errors?.length ?? 0) > 0; if (blocked) return 'bloqueado'; if (p.user_exists) return 'usuario_existente'; if (p.would_jit_provision) return 'seria_jit'; return 'bloqueado';
  ```
- **formatarValor(valor: number, unidade: IndicadorBenchmark['unidade'])** — `src/components/analytics/BenchmarkingSetorial.tsx`
  ```
  switch (unidade) { case 'percent': return `${valor.toFixed(1)}%`; case 'currency': return formatCurrency(valor); case 'days': return `${Math.round(valor)} dias`; case 'ratio': return valor.toFixed(2); }
  ```
- **calculateAggregatedBudget(node: TreeNode)** — `src/components/centros-custo/CentroCustoTree.tsx`
  ```
  previsto: number; realizado: number
  ```
- **scoreDisponivel(valor: number | null | undefined)** — `src/components/cobranca/CustomerDeepScore.tsx`
  ```
  
  ```
- **gerarPropostasIA(mensagemUsuario: string)** — `src/components/cobranca/NegociacaoIA.tsx`
  ```
  setIsLoading(true); const contexto = ` Cliente: ${clienteNome || 'Cliente'} Valor total em atraso: ${formatCurrency(valorTotal)} Número de títulos: ${contasVencidas.length} Dias médio de atraso: ${diasMedioAtraso} dias Títulos: ${contasVencidas.map((c) => `${c.cliente_nome} - ${formatCurrency(c.valor)} (${c.diasAtraso} dias)`).join(', ')} Você é um especialista em negociação de dívidas. Analise a situação e sugira propostas de acordo considerando: 1. Descontos progressivos baseados no tempo de a …
  ```
- **calcularProbabilidadeAtraso(cliente: ClienteRiscoEntrada, contasPendentes: ContaPendenteEntrada[], historicoContas: HistoricoContaEntrada[])** — `src/components/cobranca/previsao/risco.ts`
  ```
  let score = 0; // `null` e desconhecido, nao bom: nao pontua, e `gerarFatoresRisco` avisa que // o score nao foi calculado. Zero e valor real e cai na pior faixa. const scoreCliente = cliente.score; if (scoreCliente != null) { if (scoreCliente < SCORE_RISCO_ALTO) score += 30; else if (scoreCliente < SCORE_RISCO_MEDIO) score += 20; else if (scoreCliente < SCORE_RISCO_BAIXO) score += 10; } const contasVencidas = historicoContas.filter(teveAtraso); const taxaAtraso = historicoContas.length > 0 ? (c …
  ```
- **gerarFatoresRisco(cliente: ClienteRiscoEntrada, contasPendentes: ContaPendenteEntrada[], historicoContas: HistoricoContaEntrada[])** — `src/components/cobranca/previsao/risco.ts`
  ```
  const fatores: string[] = []; if (cliente.score == null) { fatores.push('Score não calculado para este cliente'); } else if (cliente.score < SCORE_RISCO_BAIXO) { fatores.push(`Score baixo (${cliente.score} de 1000)`); } const contasVencidas = historicoContas.filter(teveAtraso); if (contasVencidas.length > 0) { fatores.push(`${contasVencidas.length} atraso(s) no histórico`); } const totalPendente = contasPendentes.reduce( (sum, c) => sum + c.valor - (c.valor_recebido || 0), 0 ); const limite = cl …
  ```
- **gerarAcaoSugerida(nivelRisco: 'alto' | 'medio' | 'baixo', fatores: string[])** — `src/components/cobranca/previsao/risco.ts`
  ```
  if (nivelRisco === 'alto') { if (fatores.some((f) => f.includes('atraso'))) { return 'Entrar em contato imediatamente para negociação preventiva'; } return 'Monitorar de perto e preparar régua de cobrança preventiva'; } if (nivelRisco === 'medio') { return 'Enviar lembrete amigável antes do vencimento'; } return 'Manter acompanhamento padrão';
  ```
- **carregarFeedbackIA()** — `src/components/conciliacao/ConciliacaoExport.tsx`
  ```
  const { data, error } = await supabase .from('feedback_conciliacao_ia') .select('acao, motivo_rejeicao, created_at, transacao_bancaria_id') .order('created_at', { ascending: false }) .limit(1000); if (error) throw error; const rows = data ?? []; if (rows.length === 0) return []; const txIds = Array.from( new Set(rows.map((r) => r.transacao_bancaria_id).filter(Boolean) as string[]) ); if (txIds.length === 0) return []; const { data: txs } = await supabase .from('transacoes_bancarias') .select( 'i …
  ```
- **updateValor(index: number, valor: number)** — `src/components/conciliacao/ConciliacaoSplitDialog.tsx`
  ```
  setSplits((prev) => prev.map((s, i) => (i === index ? { ...s, valorParcial: valor } : s)));
  ```
- **generatePreview()** — `src/components/conciliacao/RegrasConciliacaoPanel.tsx`
  ```
  const mockExtrato = [ { id: 'm1', data: '2024-05-01', descricao: 'PIX FORNECEDOR ABC SERVICOS', valor: -1500.0, tipo: 'debito', }, { id: 'm2', data: '2024-05-02', descricao: 'RECEBIMENTO CLIENTE XYZ LTDA', valor: 4500.0, tipo: 'credito', }, { id: 'm3', data: '2024-05-03', descricao: 'TARIFA BANCARIA MANUTENCAO', valor: -45.9, tipo: 'debito', }, ]; const preview = mockExtrato.map((item) => { const match = regras?.find( (r) => r.ativo && r.padrao_descricao && item.descricao.toUpperCase().includes( …
  ```
- **ScoreBadgeIA({ score, confianca, size = 'default', }: { score: number; confianca: 'alta' | 'media' | 'baixa'; size?: 'default' | 'sm')** — `src/components/conciliacao/ia/ScoreBadgeIA.tsx`
  ```
  const isSmall = size === 'sm'; return ( <div className={cn( 'flex items-center gap-1 rounded-full font-mono font-bold', isSmall ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1', confianca === 'alta' && 'bg-success/20 text-success border border-success/30', confianca === 'media' && 'bg-warning/20 text-warning border border-warning/30', confianca === 'baixa' && 'bg-muted text-muted-foreground border border-border' )} > <Brain className={cn(isSmall ? 'h-3 w-3' : 'h-4 w-4')} /> {score}% </div> );
  ```
- **scoreColor(score: number)** — `src/components/contabilidade/AuditoriaCFCPanel.helpers.ts`
  ```
  if (score >= 95) return { tone: 'text-success', bg: 'bg-success/10', border: 'border-success/20', label: 'Excelente', shadow: 'shadow-success/20', }; if (score >= 80) return { tone: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', label: 'Bom', shadow: 'shadow-primary/20', }; if (score >= 60) return { tone: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', label: 'Atenção', shadow: 'shadow-warning/20', }; return { tone: 'text-destructive', bg: 'bg-destructive/10' …
  ```
- **BalanceteTab({ empresaId, ano }: Props)** — `src/components/contabilidade/BalanceteTab.tsx`
  ```
  const { data: empresas = [] } = useEmpresas(); const [filters, setFilters] = useLocalStorageState<BalanceteFilters>( 'contabilidade:balancete-filtros', { dataInicio: `${ano}-01-01`, dataFim: `${ano}-12-31`, nivelMax: 'todos', apenasComMovimento: true, busca: '', } ); const setField = <K extends keyof BalanceteFilters>(key: K, value: BalanceteFilters[K]) => setFilters({ ...filters, [key]: value }); const nivelMax = filters.nivelMax === 'todos' ? null : Number(filters.nivelMax); const { data: rows …
  ```
- **calcularDiff(entry: PlanoContaAuditEntry)** — `src/components/contabilidade/PlanoContaHistoryPanel.tsx`
  ```
  const o = entry.old_data || {}; const n = entry.new_data || {}; const out: DiffField[] = []; for (const campo of CAMPOS_RELEVANTES) { const a = (o as Record<string, unknown>)[campo]; const b = (n as Record<string, unknown>)[campo]; if (JSON.stringify(a) !== JSON.stringify(b)) { out.push({ campo, antes: a, depois: b }); } } return out;
  ```
- **fmtValor(v: unknown)** — `src/components/contabilidade/PlanoContaHistoryPanel.tsx`
  ```
  if (v === null || v === undefined || v === '') return '—'; if (typeof v === 'boolean') return v ? 'sim' : 'não'; return String(v);
  ```
- **ValidacoesPreSpedDialog({ open, onOpenChange, arquivo, onDownloadTxt, onDownloadZip, }: Props)** — `src/components/contabilidade/ValidacoesPreSpedDialog.tsx`
  ```
  const [busca, setBusca] = useState(''); const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set()); const [isAiCorrecting, setIsAiCorrecting] = useState(false); const [isCopied, setIsCopied] = useState(false); const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); const erros = useMemo(() => arquivo?.validacoes?.erros ?? [], [arquivo]); const avisos = useMemo(() => arquivo?.validacoes?.avisos ?? [], [arquivo]); const isRejeitado = arquivo?.status === 'rejeitado'; …
  ```
- **Valor({ value, muted }: { value: number; muted?: boolean })** — `src/components/contabilidade/balancete/BalanceteTable.tsx`
  ```
  if (!value) return <span className="text-muted-foreground/50">—</span>; return ( <span className={cn('tabular-nums', muted && 'text-muted-foreground')}> {formatCurrency(value)} </span> );
  ```
- **BalanceteTable({ rows, totais, onSelectConta }: Props)** — `src/components/contabilidade/balancete/BalanceteTable.tsx`
  ```
  return ( <div className="rounded-3xl border border-border/40 overflow-hidden"> <Table> <TableHeader> <TableRow className="bg-muted/40"> <TableHead className="w-[10rem]">Conta</TableHead> <TableHead>Descrição</TableHead> <TableHead className="text-right">Saldo anterior</TableHead> <TableHead className="text-right">Débitos</TableHead> <TableHead className="text-right">Créditos</TableHead> <TableHead className="text-right">Saldo devedor</TableHead> <TableHead className="text-right">Saldo credor</Ta …
  ```
- **BalanceteToolbar({ values, setField, countLabel }: Props)** — `src/components/contabilidade/balancete/BalanceteToolbar.tsx`
  ```
  return ( <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 items-end"> <div className="space-y-2"> <Label htmlFor="bal-inicio" className="text-[10px] font-black uppercase tracking-widest opacity-60" > Data inicial </Label> <Input id="bal-inicio" type="date" value={values.dataInicio} onChange={(e) => setField('dataInicio', e.target.value)} className="rounded-2xl" /> </div> <div className="space-y-2"> <Label htmlFor="bal-fim" className="text-[10px] font-black uppercase tracking-widest opaci …
  ```
- **exportBalanceteCSV(rows: BalanceteRow[], totais: BalanceteTotais, ctx: PeriodoCtx)** — `src/components/contabilidade/balancete/exporters.ts`
  ```
  const lines = headerLines('BALANCETE DE VERIFICAÇÃO', ctx); lines.push( ['Conta', 'Descrição', 'Saldo anterior', 'Débitos', 'Créditos', 'Saldo devedor', 'Saldo credor'] .map(csvEscape) .join(';') ); for (const r of rows) { const s = splitSaldo(r.saldo_final); lines.push( [ r.codigo, r.nome, dec(r.saldo_anterior), dec(r.debitos), dec(r.creditos), dec(s.devedor), dec(s.credor), ] .map(csvEscape) .join(';') ); } lines.push(''); lines.push( [ '', 'TOTAIS (analíticas)', '', dec(totais.debitos), dec(t …
  ```
- **exportBalancetePDF(rows: BalanceteRow[], totais: BalanceteTotais, ctx: PeriodoCtx)** — `src/components/contabilidade/balancete/exporters.ts`
  ```
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' }); drawHeader(doc, 'BALANCETE DE VERIFICAÇÃO', ctx); autoTable(doc, { startY: 115, head: [ [ 'Conta', 'Descrição', 'Saldo anterior', 'Débitos', 'Créditos', 'Saldo devedor', 'Saldo credor', ], ], body: rows.map((r) => { const s = splitSaldo(r.saldo_final); return [ r.codigo, r.nome, formatCurrency(r.saldo_anterior), formatCurrency(r.debitos), formatCurrency(r.creditos), formatCurrency(s.devedor), formatCurrency(s.credor), …
  ```
- **invalidateRegras()** — `src/components/contabilidade/contabilizacao-automatica/useContabilizacaoMutations.ts`
  ```
  qc.invalidateQueries({ queryKey: ['regras_contab', empresaId] });
  ```
- **ValidacoesDialog({ row, onClose }: Props)** — `src/components/contabilidade/sped-ecf-historico/ValidacoesDialog.tsx`
  ```
  return ( <Dialog open={!!row} onOpenChange={(v) => { if (!v) onClose(); }} > <DialogContent className="max-w-2xl"> <DialogHeader> <DialogTitle className="flex items-center gap-2"> <ScrollText className="h-5 w-5" /> Validações — ECF {row?.ano_calendario} </DialogTitle> <DialogDescription> {row && format(new Date(row.created_at), "dd/MM/yyyy 'às' HH:mm")} {' · '} {row && formatCnpj(row.cnpj)} </DialogDescription> </DialogHeader> <ScrollArea className="max-h-[60vh] pr-4"> {(() => { if (!row) return …
  ```
- **AplicarDescontoDialog({ conta, open, onOpenChange }: AplicarDescontoDialogProps)** — `src/components/contas-receber/AplicarDescontoDialog.tsx`
  ```
  const [tipo, setTipo] = useState<'valor' | 'percentual'>('valor'); const [valorDesconto, setValorDesconto] = useState(0); const [motivo, setMotivo] = useState(''); const queryClient = useQueryClient(); const descontoReal = tipo === 'percentual' && conta ? Math.round(((conta.valor * valorDesconto) / 100) * 100) / 100 : valorDesconto; const valorFinal = conta ? conta.valor - descontoReal : 0; const mutation = useMutation({ mutationFn: async () => { if (!conta) throw new Error('Conta não encontrada …
  ```
- **CalculadoraJurosMulta({ valorOriginal, dataVencimento, valorRecebido = 0, jurosMensal = 1, multaPercentual = 2, }: CalculadoraJurosMultaProps)** — `src/components/contas-receber/CalculadoraJurosMulta.tsx`
  ```
  const calculo = useMemo(() => { const hoje = new Date(); const vencimento = parseISO(dataVencimento); const diasAtraso = differenceInDays(hoje, vencimento); if (diasAtraso <= 0) return null; const saldoDevedor = valorOriginal - valorRecebido; const multa = saldoDevedor * (multaPercentual / 100); const jurosDiario = jurosMensal / 30; const juros = saldoDevedor * (jurosDiario / 100) * diasAtraso; const totalCorrigido = saldoDevedor + multa + juros; return { diasAtraso, saldoDevedor, multa, juros, …
  ```
- **calcVariation(current: number, previous: number | undefined)** — `src/components/contas-receber/ContasReceberKPIs.tsx`
  ```
  text: string; positive: boolean
  ```
- **ScoreCell({ conta }: { conta: ContaReceberWithRelations })** — `src/components/contas-receber/row/StatusCell.tsx`
  ```
  const clienteData = conta.clientes; if (!clienteData?.score) return <TableCell className="p-6" />; return ( <TableCell className="p-6"> <div className="flex flex-col items-center"> <div className={cn( 'text-lg font-black tabular-nums tracking-tighter leading-none', getScoreColor(clienteData.score) )} > {clienteData.score} </div> <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1"> {getScoreLabel(clienteData.score)} </span> </div> </TableCell> );
  ```
- **ValorCell({ conta }: { conta: ContaReceberWithRelations })** — `src/components/contas-receber/row/ValorCell.tsx`
  ```
  const saldo = conta.valor - (conta.valor_recebido || 0); const percentualRecebido = conta.valor_recebido ? (conta.valor_recebido / conta.valor) * 100 : 0; return ( <TableCell className="p-6"> <div className="space-y-1"> <p className="text-xl font-black tabular-nums tracking-tighter text-foreground group-hover:scale-105 transition-transform origin-left"> {formatCurrency(conta.valor)} </p> {conta.valor_desconto && conta.valor_desconto > 0 && ( <p className="text-[10px] font-black text-warning uppe …
  ```
- **formatarValor(valor: AlertaCatalogo['valorMotor'])** — `src/components/dashboard/AlertasCatalogosFiscaisCard.tsx`
  ```
  if (valor === null || valor === undefined) return '—'; if (typeof valor === 'boolean') return valor ? 'sim' : 'não'; return String(valor);
  ```
- **scoreColor(score: number)** — `src/components/dashboard/HealthScoreCard.tsx`
  ```
  if (score >= 80) return 'text-success'; if (score >= 60) return 'text-warning'; return 'text-destructive';
  ```
- **scoreBg(score: number)** — `src/components/dashboard/HealthScoreCard.tsx`
  ```
  if (score >= 80) return 'bg-success/10'; if (score >= 60) return 'bg-warning/10'; return 'bg-destructive/10';
  ```
- **gerarAnalise()** — `src/components/dashboard/PrevisaoIA.tsx`
  ```
  setLoading(true); try { const { data, error } = await supabase.functions.invoke('analise-preditiva', { body: { empresa_id: currentEmpresaId }, }); if (error) throw error; if (data.error) throw new Error(data.error); setAnalise(data.analise); setGeradoEm(data.gerado_em); toast({ title: 'Análise concluída' }); } catch (error: unknown) { logger.error('Erro na análise preditiva:', error); toast({ title: 'Erro na análise', variant: 'destructive' }); } finally { setLoading(false); }
  ```
- **parseValor(valor: string)** — `src/components/dashboard/PrevisaoIA.tsx`
  ```
  if (!valor) return 0; return parseFloat(valor.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
  ```
- **SaldoPorBancoCard({ contasBancariasFiltradas, saldoTotal, }: SaldoPorBancoCardProps)** — `src/components/dashboard/SaldoPorBancoCard.tsx`
  ```
  return ( <motion.div variants={itemVariants}> <Card className="h-[400px] sm:h-[450px] md:h-[500px] overflow-hidden border-none bg-background/20 backdrop-blur-3xl shadow-xl ring-1 ring-white/10 rounded-[2.5rem]"> <CardHeader className="pb-4 p-6 sm:p-8 md:p-10"> <CardTitle className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter flex items-center gap-4"> <div className="h-12 w-12 rounded-[1rem] bg-secondary/10 flex items-center justify-center shrink-0 shadow-2xl shadow-secondary/10"> …
  ```
- **aplicarSugestoes()** — `src/components/demonstrativos/ContasNaoClassificadasDialog.tsx`
  ```
  const novas: Record<string, string> = { ...selecoes }; contas.forEach((c) => { if (c.conta_id && c.centro_resultado_sugerido && !novas[c.conta_id]) { novas[c.conta_id] = c.centro_resultado_sugerido; } }); setSelecoes(novas); toast.success('Sugestões aplicadas');
  ```
- **applyCnaeMask(valor: string)** — `src/components/empresas/empresa-form-model.ts`
  ```
  const d = valor.replace(/\D/g, '').slice(0, 7); if (d.length <= 4) return d; if (d.length <= 5) return `${d.slice(0, 4)}-${d.slice(4)}`; return `${d.slice(0, 4)}-${d.slice(4, 5)}/${d.slice(5)}`;
  ```
- **calcularVariacao(saldoFinal: number)** — `src/components/fluxo-caixa/ResumosCenarios.tsx`
  ```
  if (saldoAtual === 0) return 0; return ((saldoFinal - saldoAtual) / saldoAtual) * 100;
  ```
- **generatePDF()** — `src/components/nfe/DANFEGenerator.tsx`
  ```
  setGenerating(true); try { const doc = new jsPDF(); const pageWidth = doc.internal.pageSize.getWidth(); // Header doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.rect(10, 10, pageWidth - 20, 25); doc.text('DANFE - Documento Auxiliar da Nota Fiscal Eletrônica', pageWidth / 2, 18, { align: 'center', }); doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.text(`0 - ENTRADA / 1 - SAÍDA`, pageWidth / 2, 24, { align: 'center' }); doc.text(`NF-e Nº ${nota.numero} | Série ${nota.serie …
  ```
- **CalculadoraTributos()** — `src/components/reforma-tributaria/CalculadoraTributos.tsx`
  ```
  const { anoReferencia, calcularTributos, regimesEspeciais, impostosSeletivos, faseAtual } = useReformaTributaria(); // Estado do formulário const [valorOperacao, setValorOperacao] = useState<number>(10000); const [tipoOperacao, setTipoOperacao] = useState<TipoOperacao>('venda'); const [ufOrigem, setUfOrigem] = useState('SP'); const [ufDestino, setUfDestino] = useState('RJ'); const [cfop, setCfop] = useState('5102'); const [ncm, setNcm] = useState(''); const [regimeEspecial, setRegimeEspecial] = …
  ```
- **calcularMetricas({ apuracoesPeriodo, apuracoes, creditos, operacoes, periodoInicio, periodoMeses, }: MetricasInput)** — `src/components/reforma-tributaria/DashboardMetricasTributarias.helpers.ts`
  ```
  const totalTributosNovos = apuracoesPeriodo.reduce( (sum, a) => sum + (a.cbs_a_pagar || 0) + (a.ibs_a_pagar || 0) + (a.is_a_pagar || 0), 0 ); const totalTributosResiduais = apuracoesPeriodo.reduce( (sum, a) => sum + (a.pis_residual || 0) + (a.cofins_residual || 0) + (a.icms_residual || 0) + (a.iss_residual || 0), 0 ); const totalCreditos = apuracoesPeriodo.reduce( (sum, a) => sum + (a.cbs_creditos || 0) + (a.ibs_creditos || 0), 0 ); const totalDebitos = apuracoesPeriodo.reduce( (sum, a) => sum + …
  ```
- **calcularScoreSaude(criticos: number, metricas: MetricasTributarias)** — `src/components/reforma-tributaria/DashboardMetricasTributarias.helpers.ts`
  ```
  let score = 100; score -= criticos * 10; if (metricas.taxaAproveitamentoCreditos < 80) score -= (80 - metricas.taxaAproveitamentoCreditos) / 2; if (metricas.cargaEfetiva > 30) score -= metricas.cargaEfetiva - 30; if (metricas.percentualMigracao > 50) score += 5; return Math.max(0, Math.min(100, score));
  ```
- **scoreColor(score: number)** — `src/components/relatorios/InsightsIA.tsx`
  ```
  if (score >= 70) return 'text-success'; if (score >= 40) return 'text-warning'; return 'text-destructive';
  ```
- **scoreLabel(score: number)** — `src/components/relatorios/InsightsIA.tsx`
  ```
  if (score >= 80) return 'Excelente'; if (score >= 60) return 'Bom'; if (score >= 40) return 'Atenção'; return 'Crítico';
  ```
- **convertToCSV(tipo: string, data: Record<string, unknown>)** — `src/components/relatorios/VisualizarRelatorioDialog.tsx`
  ```
  switch (tipo) { case 'fluxo_caixa': { const r = data.receitas as | { previsto: number; realizado: number; pendente: number } | undefined; const d = data.despesas as | { previsto: number; realizado: number; pendente: number } | undefined; const s = data.saldo as { previsto: number; realizado: number } | undefined; return `Categoria,Previsto,Realizado,Pendente\nReceitas,${r?.previsto || 0},${r?.realizado || 0},${r?.pendente || 0}\nDespesas,${d?.previsto || 0},${d?.realizado || 0},${d?.pendente || …
  ```
- **calcularSimulacaoAntecipacao(params: { taxa: number; recebiveis: RecebiveisDisponiveis[]; recebivelSelecionados: string[]; dataAntecipacao: string; })** — `src/components/simuladores/simulador-antecipacao.utils.ts`
  ```
  const { taxa, recebiveis, recebivelSelecionados, dataAntecipacao } = params; const selecionados = recebiveis.filter((r) => recebivelSelecionados.includes(r.id)); if (selecionados.length === 0) return null; const valorBruto = selecionados.reduce((sum, r) => sum + r.valor, 0); const hoje = new Date(dataAntecipacao); let taxaTotal = 0; let diasPonderados = 0; selecionados.forEach((r) => { const diasAntecipados = differenceInDays(new Date(r.data_vencimento), hoje); const taxaProRata = (taxa / 100) * …
  ```
- **CalculadoraWidget()** — `src/components/tributario/dashboard/CalculadoraWidget.tsx`
  ```
  const { data } = useQuery({ queryKey: ['calculadora-ultimo-cenario'], queryFn: async () => { const { data: rows } = await supabase .from('regimes_simulados') .select( 'regime_atual, regime_recomendado, cenarios, economia_anual_estimada, parametros, data_simulacao' ) .contains('parametros', { tipo_calculo: 'calculadora' }) .order('data_simulacao', { ascending: false }) .limit(1); return rows?.[0] ?? null; }, staleTime: 5 * 60 * 1000, }); const stats = useMemo(() => { if (!data) return null; const …
  ```
- **gerarRelatorioAnualPDF(p: RelatorioAnualPayload)** — `src/components/tributario/relatorios/RelatorioAnualTributarioPDF.ts`
  ```
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }); const w = doc.internal.pageSize.getWidth(); // ============= CAPA ============= doc.setFillColor(30, 41, 59); doc.rect(0, 0, w, 90, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(28); doc.text('Relatório Anual Tributário', 15, 45); doc.setFontSize(14); doc.text(`Exercício ${p.ano}`, 15, 58); doc.setFontSize(10); doc.text('CBS · IBS · Imposto Seletivo · Residuais', 15, 70); doc.setTextColor(0, 0, 0); doc.setFontSize(16); doc.text(p.empr …
  ```
- **generateId()** — `src/components/ui/file-upload.tsx`
  ```
  Math.random().toString(36).substring(2, 9);
  ```
- **calculateStrength(password: string)** — `src/components/ui/input.tsx`
  ```
  let score = 0; if (password.length >= 8) score++; if (/[A-Z]/.test(password)) score++; if (/[a-z]/.test(password)) score++; if (/[0-9]/.test(password)) score++; if (/[^A-Za-z0-9]/.test(password)) score++; return score;
  ```
- **applyMask(value: string, mask: string)** — `src/components/ui/phone-input.utils.ts`
  ```
  const digits = value.replace(/\D/g, ''); let result = ''; let digitIndex = 0; for (const char of mask) { if (digitIndex >= digits.length) break; if (char === '#') { result += digits[digitIndex]; digitIndex++; } else { result += char; } } return result;
  ```
- **validatePhone(phone: string, countryCode: string = 'BR')** — `src/components/ui/phone-input.utils.ts`
  ```
  const digits = phone.replace(/\D/g, ''); const validations: Record<string, (d: string) => boolean> = { BR: (d) => d.length === 10 || d.length === 11, US: (d) => d.length === 10, PT: (d) => d.length === 9, ES: (d) => d.length === 9, FR: (d) => d.length === 9, DE: (d) => d.length >= 10 && d.length <= 11, IT: (d) => d.length === 10, UK: (d) => d.length >= 10 && d.length <= 11, AR: (d) => d.length === 10, MX: (d) => d.length === 10, }; return validations[countryCode]?.(digits) ?? digits.length >= 8;
  ```
- **validation(s)** — `src/components/ui/phone-input.utils.ts`
  ```
  boolean> = {
  ```
- **RankBadge({ rank, size = 'md', label, value, showIcon = true, showTrend, animate = true, className, }: RankBadgeProps)** — `src/components/ui/rank-badge.tsx`
  ```
  const config = rankConfig[rank]; const sizeStyles = sizeConfig[size]; const Icon = config.icon; const TrendIcon = showTrend === 'up' ? TrendingUp : showTrend === 'down' ? TrendingDown : Minus; const content = ( <span className={cn( 'inline-flex items-center rounded-lg font-semibold transition-all duration-200', sizeStyles.container, config.className, animate && rank === 'gold' && 'hover:animate-wiggle', className )} > {showIcon && <Icon className={cn(sizeStyles.icon, 'shrink-0')} />} <span>{labe …
  ```
- **RankLegend({ className }: RankLegendProps)** — `src/components/ui/rank-badge.tsx`
  ```
  return ( <div className={cn('flex flex-wrap items-center gap-2', className)}> <RankBadge rank="gold" size="sm" animate={false} /> <RankBadge rank="silver" size="sm" animate={false} /> <RankBadge rank="bronze" size="sm" animate={false} /> </div> );
  ```
- **runValidationRoadmap()** — `src/components/ui/ux-validator.tsx`
  ```
  setIsProcessing(true); toast.info('Iniciando regressão visual automática multi-breakpoint...'); const iframe = document.createElement('iframe'); iframe.style.position = 'fixed'; iframe.style.top = '-10000px'; iframe.style.left = '-10000px'; iframe.style.border = 'none'; document.body.appendChild(iframe); const breakpoints = [ { name: 'desktop', width: 1440, height: 1080 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'mobile', width: 375, height: 812 }, ]; const captureRoute = (path: st …
  ```
- **validateAnomaliaPreferencesPatch(patch: AnomaliaPreferencesPatch)** — `src/hooks/anomaliaPreferencesValidation.ts`
  ```
  const issues: ValidationIssue[] = []; if (patch.toast_duracao_segundos !== undefined) { const d = patch.toast_duracao_segundos; if (!Number.isFinite(d) || !Number.isInteger(d)) { issues.push({ code: 'DURACAO_NAO_INTEIRA', field: 'toast_duracao_segundos', message: 'A duração do toast deve ser um número inteiro de segundos.', }); } else if (d < TOAST_DURACAO_MIN || d > TOAST_DURACAO_MAX) { issues.push({ code: 'DURACAO_FORA_DO_RANGE', field: 'toast_duracao_segundos', message: `A duração do toast de …
  ```
- **assertValidAnomaliaPreferencesPatch(patch: AnomaliaPreferencesPatch)** — `src/hooks/anomaliaPreferencesValidation.ts`
  ```
  const result = validateAnomaliaPreferencesPatch(patch); if (!result.ok) { const msg = result.issues.map((i) => i.message).join(' '); throw new Error(msg); }
  ```
- **checkShouldDispatch(input: DedupCheckInput)** — `src/hooks/savedFilterDedup.ts`
  ```
  // Defesa de permissão: rejeita silenciosamente se a assinatura não for do // usuário logado. Cobre o gap entre revogação no banco // (fn_revoke_orphan_saved_filter_subscriptions) e próxima sincronização do // cliente. if ( input.subscriptionUserId && input.currentUserId && input.subscriptionUserId !== input.currentUserId ) { return { shouldDispatch: false, reason: 'permission_revoked' }; } if (input.seen.has(input.rowId)) { return { shouldDispatch: false, reason: 'duplicate_in_session' }; } con …
  ```
- **validateSharing(input: SharingValidationInput)** — `src/hooks/savedFiltersValidation.ts`
  ```
  // Caso 1: usuário desligou o compartilhamento — sempre válido, // forçamos a limpeza dos campos derivados. if (!input.isShared) { return { isShared: false, sharedWithRoles: [], empresaId: null, }; } if (!input.empresaId) { throw new SavedFilterSharingError( 'Selecione uma empresa atual para compartilhar o filtro.', 'EMPRESA_REQUIRED' ); } const requested = normalizeRoles(input.sharedWithRoles); // Lista vazia = "todos do tenant"; é permitido por design, // mas se o tenant não tem nenhum papel a …
  ```
- **simularParcelamento(params: { valorOriginal: number; descontoPercentual?: number; jurosPercentual?: number; numeroParcelas: number; })** — `src/hooks/useAcordosParcelamento.helpers.ts`
  ```
  const desconto = params.valorOriginal * ((params.descontoPercentual || 0) / 100); const valorComDesconto = params.valorOriginal - desconto; const juros = valorComDesconto * ((params.jurosPercentual || 0) / 100); const valorTotal = valorComDesconto + juros; const valorParcela = Math.ceil((valorTotal / params.numeroParcelas) * 100) / 100; return { valorOriginal: params.valorOriginal, desconto, juros, valorTotal, valorParcela, numeroParcelas: params.numeroParcelas, };
  ```
- **buscarParcelas(acordoId: string)** — `src/hooks/useAcordosParcelamento.ts`
  ```
  const { data, error } = await supabase .from('parcelas_acordo') .select('*') .eq('acordo_id', acordoId) .order('numero_parcela'); if (error) throw error; return data as ParcelaAcordo[];
  ```
- **elegivel(i: number)** — `src/hooks/useAcordosParcelamento.ts`
  ```
  marcadores[i] === null && lista[i].status === 'em_acordo';
  ```
- **gerarAlertasAutomaticos()** — `src/hooks/useAlertas.ts`
  ```
  const hoje = todayISOLocal(); const emTresDias = toISOLocal(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)); // Buscar contas a pagar próximas do vencimento const { data: contasPagar } = await supabase .from('contas_pagar') .select('id, descricao, valor, data_vencimento, fornecedor_nome') .lte('data_vencimento', emTresDias) .gte('data_vencimento', hoje) .eq('status', 'pendente'); // Buscar contas a receber vencidas const { data: contasVencidas } = await supabase .from('contas_receber') .select(' …
  ```
- **shouldNotify(prefs: AnomaliaPreferences | null | undefined, anomalia: { severidade?: string | null; centro_custo_id?: string | null; )** — `src/hooks/useAnomaliaPreferences.ts`
  ```
  if (!prefs) return true; if (!prefs.toast_enabled) return false; if (prefs.silenciar_ate && new Date(prefs.silenciar_ate) > new Date()) return false; const sev = (anomalia.severidade ?? 'baixa') as Severidade; // Lista explícita de severidades ativas é a fonte da verdade if ( prefs.toast_severidades_ativas && prefs.toast_severidades_ativas.length > 0 && !prefs.toast_severidades_ativas.includes(sev) ) { return false; } if ( anomalia.centro_custo_id && prefs.centros_custo_silenciados.includes(anom …
  ```
- **validarEmissaoBoletoConfirmada(resposta: unknown)** — `src/hooks/useBoletos.helpers.ts`
  ```
  if (!resposta || typeof resposta !== 'object') { throw new Error('ASAAS não retornou confirmação da emissão.'); } const dados = resposta as Record<string, unknown>; const id = dados.id; const linhaDigitavel = dados.identificationField; const codigoBarras = dados.barCode; if (typeof id !== 'string' || id.trim() === '') { const mensagem = typeof dados.error === 'string' && dados.error.trim() ? dados.error : 'ASAAS não retornou identificador'; throw new Error(mensagem); } if ( typeof linhaDigitavel …
  ```
- **calcularLucroReal(params: ParametrosSimulacao)** — `src/hooks/useComparativoRegimes.ts`
  ```
  const aliquotas = ALIQUOTAS_TRANSICAO.find((a) => a.ano === params.ano) || ALIQUOTAS_TRANSICAO[0]; // Base de cálculo do IRPJ/CSLL = Lucro Contábil const lucroContabil = params.faturamentoAnual - params.despesasOperacionais - params.folhaPagamento; const baseCalculoIR = Math.max(0, lucroContabil); // IRPJ: 15% + adicional 10% sobre excedente de R$ 240.000/ano const irpjNormal = baseCalculoIR * 0.15; const irpjAdicional = Math.max(0, baseCalculoIR - 240000) * 0.1; const irpj = irpjNormal + irpjAd …
  ```
- **calcularLucroPresumido(params: ParametrosSimulacao)** — `src/hooks/useComparativoRegimes.ts`
  ```
  const aliquotas = ALIQUOTAS_TRANSICAO.find((a) => a.ano === params.ano) || ALIQUOTAS_TRANSICAO[0]; // Presunção de lucro: 8% comércio/indústria, 32% serviços const faturamentoMercadorias = params.faturamentoAnual * (1 - params.percentualServicos / 100); const faturamentoServicos = params.faturamentoAnual * (params.percentualServicos / 100); const basePresumidaMerc = faturamentoMercadorias * 0.08; const basePresumidaServ = faturamentoServicos * 0.32; const baseCalculoIR = basePresumidaMerc + base …
  ```
- **calcularSimplesNacional(params: ParametrosSimulacao)** — `src/hooks/useComparativoRegimes.ts`
  ```
  if (params.faturamentoAnual > 4800000) { return { regime: 'simples_nacional', nome: 'Simples Nacional', irpj: 0, csll: 0, pis: 0, cofins: 0, cbs: 0, ibs: 0, icms: 0, iss: 0, creditosRecuperaveis: 0, totalTributos: 0, cargaEfetiva: 0, baseCalculoIR: 0, observacoes: ['NÃO ELEGÍVEL - Faturamento acima de R$ 4,8 milhões'], }; } const anexo = params.atividadePrincipal === 'servicos' ? SIMPLES_ANEXO_III : SIMPLES_ANEXO_I; const faixaAtual = anexo.find((f) => params.faturamentoAnual <= f.ate) || anexo[ …
  ```
- **calcularPrioridadeAprovacao(conta: ContaPagarType)** — `src/hooks/useContasPagarLogic.calculos.ts`
  ```
  const precisaAprovacao = requerAprovacao(conta.valor); const temSolicitacaoPendente = aprovacaoStatusMap.get(conta.id) === 'pendente'; const naoAprovado = !conta.aprovado_por && precisaAprovacao; const pendente = (temSolicitacaoPendente || (naoAprovado && !aprovacaoStatusMap.has(conta.id))) && conta.status !== 'pago' && conta.status !== 'cancelado'; if (!pendente) return 999; const dataVenc = new Date(conta.data_vencimento); const hoje = new Date(); hoje.setHours(0, 0, 0, 0); dataVenc.setHours(0 …
  ```
- **calcularKpisContasReceber(allContas: ContaReceberKpi[])** — `src/hooks/useContasReceberLogic.calculos.ts`
  ```
  const today = new Date(); today.setHours(0, 0, 0, 0); const endOfWeek = addDays(today, 7); const startOfPrevMonth = startOfMonth(subMonths(today, 1)); const endOfPrevMonth = endOfMonth(subMonths(today, 1)); const totalReceber = allContas.reduce( (sum, c) => c.status !== 'pago' && c.status !== 'recebido' && c.status !== 'cancelado' ? sum + (c.valor ?? 0) - (c.valor_recebido || 0) : sum, 0 ); const totalVencido = allContas .filter((c) => c.status === 'vencido') .reduce((sum, c) => sum + (c.valor ? …
  ```
- **generateDeviceFingerprint()** — `src/hooks/useDeviceDetection.ts`
  ```
  const userAgent = navigator.userAgent; const screenResolution = `${screen.width}x${screen.height}`; const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; const language = navigator.language; const platform = navigator.platform; const fingerprintData = `${userAgent}|${screenResolution}|${timezone}|${language}|${platform}`; let hash = 0; for (let i = 0; i < fingerprintData.length; i++) { const char = fingerprintData.charCodeAt(i); hash = (hash << 5) - hash + char; hash = hash & hash; …
  ```
- **formatCurrency(value: number)** — `src/hooks/useExpertContext.ts`
  ```
  
  ```
- **saldoReceber(c: { valor: number; valor_recebido?: number | null })** — `src/hooks/useFluxoCaixa.ts`
  ```
  
  ```
- **saldoPagar(c: { valor: number; valor_pago?: number | null })** — `src/hooks/useFluxoCaixa.ts`
  ```
  
  ```
- **calcularPeriodoApuracao(tipo: 'trimestral' | 'anual' | 'estimativa', ano: number, trimestre?: number, mes?: number)** — `src/hooks/useIRPJCSLL.ts`
  ```
  periodo_inicio: string; periodo_fim: string
  ```
- **calcularEconomia(baseCalculo: number)** — `src/hooks/useIncentivosFiscais.ts`
  ```
  if (!incentivos) return 0; const incentivosAtivos = incentivos.filter((i) => i.ativo); let economiaTotal = 0; incentivosAtivos.forEach((incentivo) => { let economia = baseCalculo * (incentivo.limite_percentual / 100); if (incentivo.limite_valor && economia > incentivo.limite_valor) { economia = incentivo.limite_valor; } economiaTotal += economia; }); return economiaTotal;
  ```
- **calcularValorAtualizado(valorOriginal: number, dataOrigem: Date)** — `src/hooks/usePerDcomp.ts`
  ```
  const mesesDecorridos = Math.floor( (new Date().getTime() - dataOrigem.getTime()) / (1000 * 60 * 60 * 24 * 30) ); // Aproximação da SELIC mensal (0.9% ao mês) const taxaMensal = 0.009; const fatorCorrecao = Math.pow(1 + taxaMensal, mesesDecorridos); return valorOriginal * fatorCorrecao;
  ```
- **invalidate()** — `src/hooks/useRefetchAnomaliasOnFocus.ts`
  ```
  qc.invalidateQueries({ queryKey: ['anomalias-detectadas'] }); qc.invalidateQueries({ queryKey: ['anomalias-criticas-count'] }); if (anomaliaId) { qc.invalidateQueries({ queryKey: ['anomalia-detalhe', anomaliaId] }); }
  ```
- **aplicarRegras(descricaoExtrato: string)** — `src/hooks/useRegrasConciliacao.ts`
  ```
  const { data: regras, error: erroBusca } = await supabase .from('regras_conciliacao') .select('*') .eq('ativo', true) .order('vezes_aplicada', { ascending: false }); if (erroBusca) throw erroBusca; if (!regras?.length) return null; const descNorm = descricaoExtrato.toLowerCase(); for (const regra of regras) { if (regra.padrao_descricao && descNorm.includes(regra.padrao_descricao)) { // Increment usage const { error } = await supabase .from('regras_conciliacao') .update({ vezes_aplicada: (regra.v …
  ```
- **gerarPDF()** — `src/hooks/useRelatorioAnual.ts`
  ```
  try { const data = query.data; if (!data) { toast.error('Dados do relatório ainda não disponíveis'); return; } const doc = gerarRelatorioAnualPDF(data); const filename = `relatorio-anual-tributario-${ano}-${data.empresa.razao_social.replace(/\s+/g, '_')}.pdf`; doc.save(filename); toast.success('Relatório anual gerado com sucesso! 🎉'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Falha ao gerar PDF'); }
  ```
- **calcularProximoEnvio(frequencia: string, hora: string, diaSemana: number | null | undefined, diaMes: number | null | undefined)** — `src/hooks/useRelatoriosAgendados.ts`
  ```
  const agora = new Date(); const [horas, minutos] = hora.split(':').map(Number); const proximo = new Date(agora); proximo.setHours(horas, minutos, 0, 0); if (proximo <= agora) { switch (frequencia) { case 'diario': proximo.setDate(proximo.getDate() + 1); break; case 'semanal': proximo.setDate(proximo.getDate() + 7); break; case 'mensal': proximo.setMonth(proximo.getMonth() + 1); break; } } if (frequencia === 'semanal' && diaSemana !== null && diaSemana !== undefined) { const diaAtual = proximo.ge …
  ```
- **calcularRetencao(valorBase: number, tipoRetencao: TipoRetencao, aliquotaCustom?: number)** — `src/hooks/useRetencoesFonte.ts`
  ```
  const aliquota = aliquotaCustom ?? ALIQUOTAS_RETENCAO[tipoRetencao]; return { aliquota, valorRetido: valorBase * aliquota, };
  ```
- **generateToken()** — `src/hooks/useScimTokens.ts`
  ```
  const bytes = crypto.getRandomValues(new Uint8Array(32)); return ( 'scim_' + btoa(String.fromCharCode(...bytes)) .replace(/\+/g, '-') .replace(/\//g, '_') .replace(/=+$/, '') );
  ```
- **calcularHistorico(contas: ContaReceberScoring[])** — `src/hooks/useScoringClientes.ts`
  ```
  const hoje = new Date(); const totalTitulos = contas.length; const titulosPagos = contas.filter((c) => c.status === 'pago').length; const titulosVencidos = contas.filter( (c) => c.status !== 'pago' && new Date(c.data_vencimento) < hoje ).length; let diasAtrasoTotal = 0; let maiorAtraso = 0; contas.forEach((c) => { if (c.status === 'pago' && c.data_recebimento) { const atraso = differenceInDays(new Date(c.data_recebimento), new Date(c.data_vencimento)); if (atraso > 0) { diasAtrasoTotal += atraso …
  ```
- **calcularScore(historico: DadosHistorico)** — `src/hooks/useScoringClientes.ts`
  ```
  score: number; fatores: FatorScore[]; classificacao: 'A' | 'B' | 'C' | 'D' | 'E'; risco: 'baixo' | 'medio' | 'alto' | 'critico';
  ```
- **calcularTendencia(contas: ContaReceberScoring[])** — `src/hooks/useScoringClientes.ts`
  ```
  const tresMesesAtras = subMonths(new Date(), 3); const contasRecentes = contas.filter((c) => new Date(c.created_at) >= tresMesesAtras); const contasAntigas = contas.filter((c) => new Date(c.created_at) < tresMesesAtras); if (contasRecentes.length < 2 || contasAntigas.length < 2) return 'estavel'; const taxaRecente = contasRecentes.filter((c) => c.status === 'pago').length / contasRecentes.length; const taxaAntiga = contasAntigas.filter((c) => c.status === 'pago').length / contasAntigas.length; c …
  ```
- **aplicarFiltros(q: QueryBuilder, tipo: TrilhaTipo, f: TrilhaFiltros)** — `src/hooks/useTrilhaAuditoria.ts`
  ```
  const cfg = TABELA_POR_TIPO[tipo]; if (f.inicio) q = q.gte(cfg.dateCol, `${f.inicio}T00:00:00`); if (f.fim) q = q.lte(cfg.dateCol, `${f.fim}T23:59:59`); if (f.acao && f.acao !== 'todas') { if (tipo === 'financeira') q = q.eq('operacao', f.acao); else if (tipo === 'tributaria') q = q.eq('acao', f.acao); else if (tipo === 'sistema') q = q.eq('action', f.acao); } if (f.usuario && cfg.userCol) { q = q.eq(cfg.userCol, f.usuario); } if (f.busca) { if (tipo === 'financeira') q = q.or(`tabela.ilike.%${f …
  ```
- **generateChallenge()** — `src/hooks/useWebAuthn.ts`
  ```
  const array = new Uint8Array(32); crypto.getRandomValues(array); return btoa(String.fromCharCode(...array));
  ```
- **atualizarScoreCliente(clienteId: string, novoScore: number, queryClient: ReturnType<typeof useQueryClient>)** — `src/hooks/expert-actions/financial-actions.ts`
  ```
  const { data: cliente, error: findError } = await supabase .from('clientes') .select('razao_social, score') .eq('id', clienteId) .maybeSingle(); if (findError || !cliente) { return { success: false, message: `Cliente ${clienteId} não encontrado no banco local.` }; } const scoreAnterior = cliente.score || 0; const { error } = await supabase .from('clientes') .update({ score: novoScore }) .eq('id', clienteId); if (error) throw error; queryClient.invalidateQueries({ queryKey: ['clientes'] }); toast …
  ```
- **gerarBoleto(_contaId: string)** — `src/hooks/expert-actions/financial-actions.ts`
  ```
  return { success: false, message: BOLETO_EXPERT_INDISPONIVEL };
  ```
- **consultarSaldos()** — `src/hooks/expert-actions/query-actions.ts`
  ```
  const { data, error } = await supabase .from('contas_bancarias') .select('banco, agencia, conta, saldo_atual, saldo_disponivel, tipo_conta') .eq('ativo', true) .order('saldo_atual', { ascending: false }); if (error) throw error; if (!data || data.length === 0) return { success: false, message: 'Nenhuma conta bancária encontrada.' }; const saldoTotal = data.reduce((sum, c) => sum + Number(c.saldo_atual), 0); const saldoDisponivel = data.reduce((sum, c) => sum + Number(c.saldo_disponivel), 0); let …
  ```
- **gerarRelatorio(tipo: string)** — `src/hooks/expert-actions/report-actions.ts`
  ```
  switch (tipo) { case 'fluxo_caixa': { const { data: contasPagar } = await supabase .from('contas_pagar') .select('data_vencimento, valor, status') // 'vencido' incluido, igual ao lado de contas_receber logo abaixo. .in('status', ['pendente', 'vencido']) .order('data_vencimento'); const { data: contasReceber } = await supabase .from('contas_receber') .select('data_vencimento, valor, status') .in('status', ['pendente', 'vencido']) .order('data_vencimento'); const { data: saldos } = await supabase …
  ```
- **computeDiff(before: Record<string, unknown> | null | undefined, after: Record<string, unknown> | null | undefined)** — `src/lib/audit-diff.ts`
  ```
  const a = before ?? {}; const b = after ?? {}; const keys = new Set([...Object.keys(a), ...Object.keys(b)]); const result: DiffResult = { added: [], removed: [], changed: [], unchanged: [] }; for (const key of keys) { const inA = key in a; const inB = key in b; const va = a[key]; const vb = b[key]; if (inA && !inB) { result.removed.push({ key, before: va, after: undefined, kind: 'removed' }); } else if (!inA && inB) { result.added.push({ key, before: undefined, after: vb, kind: 'added' }); } els …
  ```
- **calculaModulo10(bloco: string)** — `src/lib/barcode-parser.ts`
  ```
  let soma = 0; let peso = 2; for (let i = bloco.length - 1; i >= 0; i--) { let resultado = parseInt(bloco[i]) * peso; if (resultado > 9) { resultado = Math.floor(resultado / 10) + (resultado % 10); } soma += resultado; peso = peso === 2 ? 1 : 2; } const resto = soma % 10; return resto === 0 ? 0 : 10 - resto;
  ```
- **calculaModulo11(bloco: string)** — `src/lib/barcode-parser.ts`
  ```
  let soma = 0; let peso = 2; for (let i = bloco.length - 1; i >= 0; i--) { soma += parseInt(bloco[i]) * peso; peso = peso === 9 ? 2 : peso + 1; } const resto = soma % 11; if (resto === 0 || resto === 1 || resto === 10) return 1; return 11 - resto;
  ```
- **validarCodigoBarras(codigo: string)** — `src/lib/barcode-parser.ts`
  ```
  const limpo = limparCodigo(codigo); return limpo.length === 44 || limpo.length === 47 || limpo.length === 48;
  ```
- **gerarProjecaoCenario(dadosBase: ProjecaoDiaria[], cenario: CenarioTipo, saldoInicial: number, opcoes: OpcoesProjecao = {})** — `src/lib/cashflow-scenarios.ts`
  ```
  const config = CENARIOS_CONFIG[cenario]; let saldoAcumulado = saldoInicial; return dadosBase.map((dia) => { // Aplicar multiplicadores e o fator de atraso DETERMINISTICO do dia const receitasAjustadas = dia.receitas * config.multiplicadorReceitas * (1 - config.probabilidadeAtraso * fatorAtrasoDeterministico(dia.data, cenario, opcoes.semente)); const despesasAjustadas = dia.despesas * config.multiplicadorDespesas; saldoAcumulado = saldoAcumulado + receitasAjustadas - despesasAjustadas; return { d …
  ```
- **gerarTodasProjecoes(dadosBase: ProjecaoDiaria[], saldoInicial: number, opcoes: OpcoesProjecao = {})** — `src/lib/cashflow-scenarios.ts`
  ```
  return { otimista: gerarProjecaoCenario(dadosBase, 'otimista', saldoInicial, opcoes), realista: gerarProjecaoCenario(dadosBase, 'realista', saldoInicial, opcoes), pessimista: gerarProjecaoCenario(dadosBase, 'pessimista', saldoInicial, opcoes), };
  ```
- **validarFormatoCFC(codigo: string | null | undefined)** — `src/lib/cfc-validator.ts`
  ```
  if (!codigo) return false; return REGEX_CFC.test(codigo.trim());
  ```
- **validarPrefixoNatureza(codigo: string | null | undefined, natureza: NaturezaConta | null | undefined)** — `src/lib/cfc-validator.ts`
  ```
  const atual = (codigo || '').trim().charAt(0) || ''; const key = (natureza || '').toLowerCase(); const esperado = PREFIXO_POR_NATUREZA[key] || []; if (esperado.length === 0) { // Natureza desconhecida: não conseguimos validar — considera OK para não gerar ruído. return { ok: true, esperado: [], atual }; } return { ok: esperado.includes(atual), esperado, atual };
  ```
- **validarHierarquiaCFC(codigo: string | null | undefined, nivelDeclarado: number | null | undefined)** — `src/lib/cfc-validator.ts`
  ```
  if (!codigo) return false; const nivel = codigo.trim().split('.').length; if (!nivelDeclarado) return true; return nivel === nivelDeclarado;
  ```
- **calculateCollectionStage(dueDate: string, status: string)** — `src/lib/collection-engine.ts`
  ```
  if (status === 'pago' || status === 'cancelado') return null; // Guard defensivo: dados do banco podem trazer null/vazio (defensive coding) if (!dueDate || typeof dueDate !== 'string') return null; const today = new Date(); today.setHours(0, 0, 0, 0); // dueDate e date-only ('YYYY-MM-DD'): parsear como LOCAL para evitar // off-by-one em fusos negativos (UTC midnight -> dia anterior em BRT) const partes = dueDate.slice(0, 10).split('-').map(Number); if (partes.length !== 3 || partes.some((n) => N …
  ```
- **calculateDynamicScore(history: { days_overdue: number }[])** — `src/lib/collection-engine.ts`
  ```
  if (history.length === 0) return 600; // Base score const avgDelay = history.reduce((sum, h) => sum + Math.max(0, h.days_overdue), 0) / history.length; const punctualityRate = history.filter((h) => h.days_overdue <= 0).length / history.length; let score = 600; score += punctualityRate * 400; // Up to 400 points for punctuality score -= avgDelay * 10; // Deduct for average delay return Math.min(1000, Math.max(0, Math.round(score)));
  ```
- **aplicarConciliacoesAutomaticas(params: { transacoes: TransacaoOFX[]; matches: Map<string, MatchSugestao[]>; config: ConfigConciliacaoConta; novasTransa)** — `src/lib/conciliacao-page-helpers.ts`
  ```
  Promise<unknown> };
  ```
- **generateId(prefix?: string)** — `src/lib/correlation-id.ts`
  ```
  const rnd = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; return prefix ? `${prefix}:${rnd}` : rnd;
  ```
- **formatCurrency(value: number, currency: CurrencyCode = 'BRL', options: { showSymbol?: boolean; showCode?: boolean; compact?: boolean; })** — `src/lib/currency.ts`
  ```
  const { showSymbol = true, showCode = false, compact = false } = options; const info = currencies[currency]; if (compact && Math.abs(value) >= 1000) { return formatCompactCurrency(value, currency, showSymbol); } const absoluteValue = Math.abs(value); const isNegative = value < 0; const parts = absoluteValue.toFixed(info.decimalPlaces).split('.'); const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, info.thousandSeparator); const decimalPart = parts[1] || ''; let formatted = integerPart; …
  ```
- **calculatePercentage(value: number, percentage: number)** — `src/lib/currency.ts`
  ```
  return (value * percentage) / 100;
  ```
- **calculateDiscount(originalPrice: number, discountPercentage: number)** — `src/lib/currency.ts`
  ```
  discountAmount: number; finalPrice: number
  ```
- **calculateTax(value: number, taxPercentage: number, included: boolean = false)** — `src/lib/currency.ts`
  ```
  taxAmount: number; baseValue: number; total: number
  ```
- **calculateInstallments(totalValue: number, installments: number, interestRate: number = 0)** — `src/lib/currency.ts`
  ```
  installmentValue: number; totalWithInterest: number; interestAmount: number; installmentDetails: Array<{ number: number; value: number; balance: number }>;
  ```
- **installmentDetail(s)** — `src/lib/currency.ts`
  ```
  number: number; value: number; balance: number
  ```
- **roundCurrency(value: number, currency: CurrencyCode = 'BRL')** — `src/lib/currency.ts`
  ```
  const info = currencies[currency]; const multiplier = Math.pow(10, info.decimalPlaces); return Math.round(value * multiplier) / multiplier;
  ```
- **isValidCurrencyAmount(value: unknown)** — `src/lib/currency.ts`
  ```
  if (typeof value !== 'number') return false; if (Number.isNaN(value)) return false; if (!Number.isFinite(value)) return false; return true;
  ```
- **formatCurrencyRange(min: number, max: number, currency: CurrencyCode = 'BRL')** — `src/lib/currency.ts`
  ```
  const info = currencies[currency]; const formattedMin = formatCurrency(min, currency, { showSymbol: false }); const formattedMax = formatCurrency(max, currency, { showSymbol: false }); return `${info.symbol} ${formattedMin} - ${formattedMax}`;
  ```
- **formatCurrency(value: number | null | undefined)** — `src/lib/formatters.ts`
  ```
  if (value == null || isNaN(value)) return 'R$ 0,00'; return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', }).format(value);
  ```
- **formatCurrencyCompact(value: number | null | undefined)** — `src/lib/formatters.ts`
  ```
  const v = value ?? 0; const abs = Math.abs(v); const sign = v < 0 ? '-' : ''; if (abs >= 1_000_000_000) { return `${sign}R$ ${(abs / 1_000_000_000).toFixed(1)}B`; } if (abs >= 1_000_000) { return `${sign}R$ ${(abs / 1_000_000).toFixed(1)}M`; } if (abs >= 1_000) { return `${sign}R$ ${(abs / 1_000).toFixed(1)}K`; } return formatCurrency(v);
  ```
- **calculateOverdueDays(date: Date | string)** — `src/lib/formatters.ts`
  ```
  const d = toLocalDate(date); const today = new Date(); today.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0); const diff = today.getTime() - d.getTime(); return Math.floor(diff / (1000 * 60 * 60 * 24));
  ```
- **shouldLog(level: LogLevel)** — `src/lib/logger.ts`
  ```
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']; return levels.indexOf(level) >= levels.indexOf(this.level);
  ```
- **validarMagicBytes(file: File, extensoesAceitas?: string[])** — `src/lib/magic-bytes.ts`
  ```
  // FileReader: único leitor que funciona igual no browser e no jsdom dos testes. const head = await new Promise<Uint8Array>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(new Uint8Array(r.result as ArrayBuffer)); r.onerror = () => reject(r.error); // 32 KiB: entradas iniciais do zip (Content_Types, mimetype e os // primeiros diretórios) precisam caber na janela lida para validar // a estrutura de pacotes de escritório. r.readAsArrayBuffer(file.slice(0, 32768)); }); c …
  ```
- **applyCnpjMask(value: string)** — `src/lib/masks.ts`
  ```
  const digits = value.replace(/\D/g, '').substring(0, 14); return digits .replace(/(\d{2})(\d)/, '$1.$2') .replace(/(\d{3})(\d)/, '$1.$2') .replace(/(\d{3})(\d)/, '$1/$2') .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  ```
- **applyPhoneMask(value: string)** — `src/lib/masks.ts`
  ```
  return maskPhone(value);
  ```
- **applyCepMask(value: string)** — `src/lib/masks.ts`
  ```
  const digits = value.replace(/\D/g, '').substring(0, 8); return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
  ```
- **validateCPF(cpf: string)** — `src/lib/masks.ts`
  ```
  const digits = cpf.replace(/\D/g, ''); if (digits.length !== 11) return false; // Check for known invalid patterns if (/^(\d)\1{10}$/.test(digits)) return false; // Validate first check digit let sum = 0; for (let i = 0; i < 9; i++) { sum += parseInt(digits[i]) * (10 - i); } let remainder = (sum * 10) % 11; if (remainder === 10 || remainder === 11) remainder = 0; if (remainder !== parseInt(digits[9])) return false; // Validate second check digit sum = 0; for (let i = 0; i < 10; i++) { sum += par …
  ```
- **validateCNPJ(cnpj: string)** — `src/lib/masks.ts`
  ```
  const digits = cnpj.replace(/\D/g, ''); if (digits.length !== 14) return false; // Check for known invalid patterns if (/^(\d)\1{13}$/.test(digits)) return false; // Validate first check digit const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; let sum = 0; for (let i = 0; i < 12; i++) { sum += parseInt(digits[i]) * weights1[i]; } let remainder = sum % 11; const digit1 = remainder < 2 ? 0 : 11 - remainder; if (digit1 !== parseInt(digits[12])) return false; // Validate second check digit const …
  ```
- **validateCnpjCpf(value: string)** — `src/lib/masks.ts`
  ```
  valid: boolean; type: 'cpf' | 'cnpj' | null; message?: string;
  ```
- **applyPdfLayout(doc: jsPDF, opts: PdfLayoutOptions)** — `src/lib/pdf-layout.ts`
  ```
  const pageCount = doc.getNumberOfPages(); for (let i = 1; i <= pageCount; i++) { doc.setPage(i); drawHeader(doc, opts); drawFooter(doc, opts, i, pageCount); } // Restaura defaults para callers que continuem desenhando doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_BRAND.foreground[0], PDF_BRAND.foreground[1], PDF_BRAND.foreground[2]);
  ```
- **codigoValido(codigo: string)** — `src/lib/plano-contas-csv-importer.ts`
  ```
  return /^\d+(\.\d+)*$/.test(codigo);
  ```
- **gerarEventoId()** — `src/lib/sefaz-event-logger.ts`
  ```
  return `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  ```
- **classificarValidacao(msg: string)** — `src/lib/sped-validacoes-categorias.ts`
  ```
  for (const { id, pattern } of PADROES) { if (pattern.test(msg)) return id; } return 'outros';
  ```
- **agruparValidacoes(erros: string[], avisos: string[])** — `src/lib/sped-validacoes-categorias.ts`
  ```
  const buckets = new Map<ValidacaoCategoriaId, { erros: string[]; avisos: string[] }>(); const ensure = (id: ValidacaoCategoriaId) => { if (!buckets.has(id)) buckets.set(id, { erros: [], avisos: [] }); return buckets.get(id)!; }; for (const m of erros) ensure(classificarValidacao(m)).erros.push(m); for (const m of avisos) ensure(classificarValidacao(m)).avisos.push(m); return CATEGORIAS_VALIDACAO.filter((c) => buckets.has(c.id)).map((c) => { const b = buckets.get(c.id)!; return { categoria: c, er …
  ```
- **gerarReadme(params: ZipParams)** — `src/lib/sped-zip.ts`
  ```
  const { fileName, hash, empresa, periodo, totalLinhas, totalLancamentos, tipo = 'ECD' } = params; const geradoEm = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }); const tituloLongo = tipo === 'ECD' ? 'SPED ECD — Escrituração Contábil Digital' : 'SPED ECF — Escrituração Contábil Fiscal'; const pvaNome = tipo === 'ECD' ? 'PVA-ECD' : 'PVA-ECF'; const linkPva = tipo === 'ECD' ? 'https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/download/pgd/sped-ecd' : 'https://www. …
  ```
- **validateEmail(email: string)** — `src/lib/validators.ts`
  ```
  if (typeof email !== 'string') return false; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  ```
- **fatiarBalanceado(codigo: string, inicio: number, abre: string, fecha: string)** — `src/lib/arquitetura/escopo-empresa.ts`
  ```
  if (codigo[inicio] !== abre) return null; let profundidade = 0; let i = inicio; let aspas: string | null = null; while (i < codigo.length) { const c = codigo[i]; const anterior = codigo[i - 1]; if (aspas) { if (c === aspas && anterior !== '\\') aspas = null; i += 1; continue; } if (c === "'" || c === '"' || c === '`') { aspas = c; i += 1; continue; } if (c === '/' && codigo[i + 1] === '/') { const fim = codigo.indexOf('\n', i); i = fim === -1 ? codigo.length : fim; continue; } if (c === '/' && c …
  ```
- **validateBankAccount(bank: string, agency: string, account: string)** — `src/lib/brazilian-validators/bank.ts`
  ```
  const cleanBank = bank.replace(/\D/g, ''); const cleanAgency = agency.replace(/\D/g, ''); const cleanAccount = account.replace(/\D/g, ''); if (cleanBank.length !== 3) return false; if (cleanAgency.length < 4 || cleanAgency.length > 5) return false; if (cleanAccount.length < 5 || cleanAccount.length > 12) return false; return true;
  ```
- **validateCEP(cep: string)** — `src/lib/brazilian-validators/cep.ts`
  ```
  const cleanCEP = cep.replace(/\D/g, ''); return cleanCEP.length === 8 && /^\d{8}$/.test(cleanCEP);
  ```
- **validateCNPJ(cnpj: string)** — `src/lib/brazilian-validators/cnpj.ts`
  ```
  const cleanCNPJ = cnpj.replace(/\D/g, ''); if (cleanCNPJ.length !== 14) return false; if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false; const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; let sum = 0; for (let i = 0; i < 12; i++) sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i]; let remainder = sum % 11; const digit1 = remainder < 2 ? 0 : 11 - remainder; if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false; const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; sum = 0; for (let i …
  ```
- **generateCNPJ()** — `src/lib/brazilian-validators/cnpj.ts`
  ```
  const random = () => Math.floor(Math.random() * 10); const n = Array.from({ length: 8 }, random); n.push(0, 0, 0, 1); const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; let sum = 0; for (let i = 0; i < 12; i++) sum += n[i] * weights1[i]; let remainder = sum % 11; n.push(remainder < 2 ? 0 : 11 - remainder); const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; sum = 0; for (let i = 0; i < 13; i++) sum += n[i] * weights2[i]; remainder = sum % 11; n.push(remainder < 2 ? 0 : 11 - remainder); …
  ```
- **validateCPF(cpf: string)** — `src/lib/brazilian-validators/cpf.ts`
  ```
  const cleanCPF = cpf.replace(/\D/g, ''); if (cleanCPF.length !== 11) return false; if (/^(\d)\1{10}$/.test(cleanCPF)) return false; let sum = 0; for (let i = 0; i < 9; i++) sum += parseInt(cleanCPF.charAt(i)) * (10 - i); let remainder = (sum * 10) % 11; if (remainder === 10 || remainder === 11) remainder = 0; if (remainder !== parseInt(cleanCPF.charAt(9))) return false; sum = 0; for (let i = 0; i < 10; i++) sum += parseInt(cleanCPF.charAt(i)) * (11 - i); remainder = (sum * 10) % 11; if (remainde …
  ```
- **generateCPF()** — `src/lib/brazilian-validators/cpf.ts`
  ```
  const random = () => Math.floor(Math.random() * 10); const n = Array.from({ length: 9 }, random); let sum = 0; for (let i = 0; i < 9; i++) sum += n[i] * (10 - i); let remainder = (sum * 10) % 11; if (remainder === 10 || remainder === 11) remainder = 0; n.push(remainder); sum = 0; for (let i = 0; i < 10; i++) sum += n[i] * (11 - i); remainder = (sum * 10) % 11; if (remainder === 10 || remainder === 11) remainder = 0; n.push(remainder); return formatCPF(n.join(''));
  ```
- **validateCPFOrCNPJ(document: string)** — `src/lib/brazilian-validators/documento.ts`
  ```
  const clean = document.replace(/\D/g, ''); if (clean.length === 11) return validateCPF(clean); if (clean.length === 14) return validateCNPJ(clean); return false;
  ```
- **validateState(state: string)** — `src/lib/brazilian-validators/estados.ts`
  ```
  const up = state.toUpperCase(); return STATES.some((s) => s.abbr === up);
  ```
- **validatePhone(phone: string)** — `src/lib/brazilian-validators/phone.ts`
  ```
  const cleanPhone = phone.replace(/\D/g, ''); if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false; const ddd = parseInt(cleanPhone.substring(0, 2)); if (ddd < 11 || ddd > 99) return false; if (cleanPhone.length === 11 && cleanPhone.charAt(2) !== '9') return false; return true;
  ```
- **validatePIXKey(key: string, type?: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random')** — `src/lib/brazilian-validators/pix.ts`
  ```
  const cleanKey = key.trim(); if (!type) { const cleanDigits = cleanKey.replace(/\D/g, ''); if (cleanDigits.length === 11 && validateCPF(cleanDigits)) return true; if (cleanDigits.length === 14 && validateCNPJ(cleanDigits)) return true; if ((cleanDigits.length === 10 || cleanDigits.length === 11) && validatePhone(cleanDigits)) { return true; } if (cleanKey.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanKey)) return true; if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$ …
  ```
- **round2(value: number)** — `src/lib/contabil/balancete-utils.ts`
  ```
  return Math.round((value + Number.EPSILON) * 100) / 100;
  ```
- **computeBalanceteTotais(rows: readonly BalanceteRow[])** — `src/lib/contabil/balancete-utils.ts`
  ```
  const analiticas = rows.filter((r) => r.aceita_lancamento); let debitos = 0; let creditos = 0; let saldoDevedor = 0; let saldoCredor = 0; let linhasInvalidas = 0; for (const r of analiticas) { // `Number(x) || 0` transformava NaN/Infinity em zero e o balancete podia // FECHAR sobre valor inexistente (achado F09). A unica barreira era o Zod // de `useBalancete`, fora desta funcao pura: qualquer outro consumidor // (exportador, SPED, RPC nova, arquivo importado) reintroduzia o // "balanceado: true …
  ```
- **splitSaldo(saldo: number)** — `src/lib/contabil/balancete-utils.ts`
  ```
  devedor: number; credor: number
  ```
- **filterBalancete(rows: readonly BalanceteRow[], { nivelMax, apenasComMovimento, busca }: BalanceteFilterOptions = {})** — `src/lib/contabil/balancete-utils.ts`
  ```
  const termo = (busca ?? '').trim().toLowerCase(); return rows.filter((r) => { if (nivelMax != null && r.nivel > nivelMax) return false; if (apenasComMovimento) { const semMovimento = Math.abs(r.debitos) < TOLERANCIA && Math.abs(r.creditos) < TOLERANCIA && Math.abs(r.saldo_anterior) < TOLERANCIA && Math.abs(r.saldo_final) < TOLERANCIA; if (semMovimento) return false; } if (termo && !`${r.codigo} ${r.nome}`.toLowerCase().includes(termo)) return false; return true; });
  ```
- **round2(v: number)** — `src/lib/contabil/indices.helpers.ts`
  ```
  return Math.round((v + Number.EPSILON) * 100) / 100;
  ```
- **calcularIndices(a: AgregadosContabeis)** — `src/lib/contabil/indices.ts`
  ```
  return DEFS.map((d) => { const { valor, motivo } = d.calc(a); const seguro = valor === null || !Number.isFinite(valor) ? null : round2(valor); return { chave: d.chave, rotulo: d.rotulo, categoria: d.categoria, formato: d.formato, valor: seguro, faixa: seguro === null ? 'indefinido' : (d.faixa?.(seguro) ?? 'neutro'), formula: d.formula, interpretacao: d.interpretacao, ...(seguro === null ? { motivo: motivo ?? 'Base contábil insuficiente' } : {}), }; });
  ```
- **calcularPorCompetencia(partidasPeriodo: PartidaRow[], partidasAteFim: PartidaRow[])** — `src/lib/contabilidade/demonstrativos-competencia.ts`
  ```
  // ---------- DRE (apenas período) ---------- const buckets = { receita_bruta: 0, deducoes: 0, cmv: 0, desp_admin: 0, desp_comercial: 0, desp_financeira: 0, rec_financeira: 0, ir_csll: 0, outras_op: 0, }; // Mapa de contas não classificadas (sem centro_resultado) const naoClassMap = new Map<string, ContaNaoClassificada>(); let totalNaoClassificado = 0; for (const p of partidasPeriodo) { if (!p.conta) continue; const tipo = p.conta.tipo.toLowerCase(); const isReceita = tipo === 'receita'; const i …
  ```
- **valorRecebidoEfetivo(c: { valor_recebido?: number | null; valor?: number | null; metadata?: unknown; })** — `src/lib/financeiro/valor-recebido-efetivo.ts`
  ```
  if (c.valor_recebido == null) return c.valor ?? 0; if (c.valor_recebido === 0) { const meta = c.metadata && typeof c.metadata === 'object' && !Array.isArray(c.metadata) ? (c.metadata as Record<string, unknown>) : null; if (meta?.acordo_rateio == null) return c.valor ?? 0; } return c.valor_recebido;
  ```
- **parseValorMonetario(valorRaw: string)** — `src/lib/ofx-parser/utils.ts`
  ```
  const cleaned = valorRaw .trim() .replace(/^R\$\s*/i, '') .replace(/\s/g, ''); let normalized: string; if (/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(cleaned)) { normalized = cleaned.replace(/\./g, '').replace(',', '.'); } else if (/^-?\d+\.\d{1,2}$/.test(cleaned)) { // Extratos internacionais normalmente usam ponto decimal. So aceite essa // forma quando ela nao puder ser confundida com agrupamento BRL de milhar. normalized = cleaned; } else { throw new Error(`Valor inválido: ${valorRaw}`) …
  ```
- **podeConcederPapel(papelConvidante: OrgPapel, papelProposto: OrgPapel)** — `src/lib/organizacoes/convites.ts`
  ```
  if (papelProposto === 'RESPONSAVEL') return false; if (papelConvidante === 'RESPONSAVEL') return true; if (papelConvidante === 'ADMIN') return PESO_PAPEL[papelProposto] <= PESO_PAPEL.ADMIN; return false;
  ```
- **emailValido(email: string)** — `src/lib/organizacoes/convites.ts`
  ```
  const normalizado = normalizarEmail(email); return normalizado.length <= 255 && RE_EMAIL.test(normalizado);
  ```
- **gerarTokenConvite(aleatorio: (bytes: Uint8Array)** — `src/lib/organizacoes/convites.ts`
  ```
  Uint8Array = preencherAleatorio
  ```
- **calcularExpiracao(agora: Date, dias = DIAS_VALIDADE_CONVITE)** — `src/lib/organizacoes/convites.ts`
  ```
  const expira = new Date(agora.getTime()); expira.setUTCDate(expira.getUTCDate() + dias); return expira;
  ```
- **generateBenchmarkingPDF(concorrente: string, gaps: BenchmarkingGap[], roadmap: BenchmarkingRoadmap[])** — `src/lib/pdf-generator/benchmarking.ts`
  ```
  const w = openPrintWindow(); if (!w) return; const gapRows = gaps .map( (g) => ` <tr> <td>${g.feature}</td> <td><span class="badge ${g.status === 'ok' ? 'bg-green' : g.status === 'gap' ? 'bg-red' : 'bg-yellow'}">${g.status.toUpperCase()}</span></td> <td>${g.prioridade}</td> <td>${g.impacto}</td> <td>${g.esforço}</td> </tr> ` ) .join(''); const roadmapRows = roadmap .map( (r) => ` <tr> <td><strong>${r.quarter}</strong></td> <td>${r.item}</td> <td>${r.descricao}</td> </tr> ` ) .join(''); const htm …
  ```
- **generateBoletoPDF(boleto: BoletoData)** — `src/lib/pdf-generator/boleto.ts`
  ```
  const w = openPrintWindow(); if (!w) return; const barcodeHtml = generateBarcodeHTML(boleto.codigo_barras); const html = ` <!DOCTYPE html> <html> <head> <title>Boleto ${boleto.numero}</title> <style> * { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; color: #000; background: #fff; } .boleto-container { border: 2px solid #000; max-width: 800px; margin: 0 auto; } .header { display: flex; border-bottom: 2px solid #000; …
  ```
- **generateConciliacaoAuditPDF(dados: ConciliacaoAuditRow[], filtros: ConciliacaoAuditFiltros)** — `src/lib/pdf-generator/conciliacao.ts`
  ```
  const w = openPrintWindow(); if (!w) return; const rows = dados .map( (d) => ` <tr> <td> <div class="font-bold">${d.evento}</div> <div class="text-[10px] text-gray-500">${d.classificacao || ''}</div> </td> <td class="valor ${d.valor >= 0 ? 'positivo' : 'negativo'}">${formatCurrency(d.valor)}</td> <td>${d.responsavel}</td> <td>${formatDate(d.data)}</td> <td class="text-xs">${d.regra}</td> <td class="text-center">${d.evidencia_url ? '<span class="text-blue-600">Sim</span>' : '<span class="text-gra …
  ```
- **generateFluxoCaixaPDF(dados: FluxoCaixaRow[], titulo: string = 'Fluxo de Caixa')** — `src/lib/pdf-generator/fluxo-caixa.ts`
  ```
  const w = openPrintWindow(); if (!w) return; const totalReceitas = dados.reduce((sum, d) => sum + d.receitas, 0); const totalDespesas = dados.reduce((sum, d) => sum + d.despesas, 0); const saldoFinal = dados.length > 0 ? dados[dados.length - 1].saldo : 0; const rows = dados .map( (d) => ` <tr> <td>${formatDate(d.data)}</td> <td class="valor positivo">${formatCurrency(d.receitas)}</td> <td class="valor negativo">${formatCurrency(d.despesas)}</td> <td class="valor ${d.receitas - d.despesas >= 0 ? …
  ```
- **generateFluxoCaixaCSV(dados: FluxoCaixaRow[])** — `src/lib/pdf-generator/fluxo-caixa.ts`
  ```
  const BOM = '\uFEFF'; const headers = ['Data', 'Receitas', 'Despesas', 'Líquido', 'Saldo Acumulado']; const rows = dados.map((d) => [ d.data, d.receitas.toString().replace('.', ','), d.despesas.toString().replace('.', ','), (d.receitas - d.despesas).toString().replace('.', ','), d.saldo.toString().replace('.', ','), ]); const csvContent = BOM + headers.map((h) => `"${h}"`).join(';') + '\n' + rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n'); const blob = new Blob([csvContent], { type: …
  ```
- **generateBarcodeHTML(code: string)** — `src/lib/pdf-generator/utils.ts`
  ```
  return code .split('') .map((char, i) => { const width = parseInt(char) % 2 === 0 ? 2 : 1; const isBlack = i % 2 === 0; return `<div style="width: ${width}px; height: 100%; background: ${isBlack ? '#000' : '#fff'};"></div>`; }) .join('');
  ```
- **arredondar(valor: number, casas = 2)** — `src/lib/reforma-tributaria/arredondamento.ts`
  ```
  const fator = Math.pow(10, casas); const valorShift = valor * fator; const piso = Math.floor(valorShift); const resto = valorShift - piso; // Empate exato (x.5): arredonda para par if (Math.abs(resto - 0.5) < 1e-10) { return (piso % 2 === 0 ? piso : piso + 1) / fator; } return Math.round(valorShift) / fator;
  ```
- **arredondarBase(v: number)** — `src/lib/reforma-tributaria/arredondamento.ts`
  ```
  arredondar(v, 2);
  ```
- **arredondarAliquota(v: number)** — `src/lib/reforma-tributaria/arredondamento.ts`
  ```
  arredondar(v, 4);
  ```
- **calcularComArredondamento(base: number, aliquotaPercentual: number)** — `src/lib/reforma-tributaria/arredondamento.ts`
  ```
  const baseRound = arredondarBase(base); const aliqDecimal = arredondarAliquota(aliquotaPercentual / 100); return arredondar(baseRound * aliqDecimal, 2);
  ```
- **calcularBaseCalculo(campos: CamposBaseCalculo, anoReferencia: number)** — `src/lib/reforma-tributaria/base-calculo.ts`
  ```
  const avisos: string[] = []; // PIS/COFINS só deduzem em 2026 (ano-teste, art. 348 LC 214/2025) const vPIS = anoReferencia === 2026 ? (campos.vPIS ?? 0) : 0; const vCOFINS = anoReferencia === 2026 ? (campos.vCOFINS ?? 0) : 0; if (anoReferencia === 2026 && campos.vPIS === undefined && campos.vCOFINS === undefined) { avisos.push( '2026: vPIS/vCOFINS não informados — base pode estar ligeiramente acima do correto (art. 348 LC 214/2025).' ); } const baseRG = (campos.vProd ?? 0) + (campos.vFrete ?? 0) …
  ```
- **calcularCreditos(dados: DadosCredito)** — `src/lib/reforma-tributaria/creditos.ts`
  ```
  const anoReferencia = dados.anoReferencia ?? new Date().getFullYear(); const aliquotas = obterAliquotasTransicao(anoReferencia); const restricoes: string[] = []; // Alíquotas do ano da aquisição — base do crédito (art. 28 LC 214/2025) const aliquotaCBSCredito = aliquotas.cbs; const aliquotaIBSCredito = aliquotas.ibs; const creditoCBS = dados.valorAquisicao * (aliquotaCBSCredito / 100); const creditoIBS = dados.valorAquisicao * (aliquotaIBSCredito / 100); return { creditoCBS, creditoIBS, creditoT …
  ```
- **aplicarRegimeEspecial(aliquotaCBS: number, aliquotaIBS: number, regime?: RegimeEspecial)** — `src/lib/reforma-tributaria/regras.ts`
  ```
  cbs: number; ibs: number
  ```
- **totalizarTributos(itens: ItemTributavel[])** — `src/lib/reforma-tributaria/totalizar.ts`
  ```
  let totalCBS = 0; let totalIBSUF = 0; let totalIBSMun = 0; let totalIS = 0; for (const item of itens) { totalCBS += item.valorCBS; if (item.valorIBSUF !== undefined && item.valorIBSMun !== undefined) { totalIBSUF += item.valorIBSUF; totalIBSMun += item.valorIBSMun; } else { // Sem split explícito: 50/50 como fallback conservador totalIBSUF += item.valorIBS / 2; totalIBSMun += item.valorIBS / 2; } totalIS += item.valorIS ?? 0; } const totalIBS = totalIBSUF + totalIBSMun; const totalGeral = totalC …
  ```
- **validate(input: ScimUserInput)** — `src/lib/scim/userTemplate.ts`
  ```
  const issues: ValidationIssue[] = []; if (!input.userName) { issues.push({ field: 'userName', level: 'error', message: 'userName é obrigatório.' }); } else if (!EMAIL_RE.test(input.userName)) { issues.push({ field: 'userName', level: 'warning', message: 'userName não parece um e-mail (UPN). A maioria dos IdPs envia o UPN/e-mail aqui.', }); } if (!input.externalId) { issues.push({ field: 'externalId', level: 'error', message: 'externalId é obrigatório (use objectId / user.id).', }); } if (typeof …
  ```
- **shouldAutoDeactivate()** — `src/lib/sefaz-contingency/rules.ts`
  ```
  const config = getAutoContingencyConfig(); const state = getContingencyState(); const health = getSefazHealthStatus(); if (!config.autoDeactivateWhenOnline || !state.autoActivated || state.mode === 'normal') { return false; } // `online !== true` cobre o status desconhecido: sem medição não se devolve a // emissão ao modo normal automaticamente. if (health.online !== true || health.lastCheck === null) return false; if (state.pendingNFes.some((n) => n.status === 'pendente')) return false; const o …
  ```
- **generateContingencyXml(_nfeData: NFeData, mode: ContingencyMode, chaveAcesso: string)** — `src/lib/sefaz-contingency/xml.ts`
  ```
  const tpEmis = TIPO_EMISSAO[mode]?.code || '1'; const dhCont = new Date().toISOString(); return `<?xml version="1.0" encoding="UTF-8"?> <NFe xmlns="http://www.portalfiscal.inf.br/nfe"> <infNFe versao="4.00" Id="NFe${chaveAcesso}"> <ide> <tpEmis>${tpEmis}</tpEmis> <dhCont>${dhCont}</dhCont> <xJust>Emissão em contingência - ${TIPO_EMISSAO[mode]?.description || 'Modo offline'}</xJust> <!-- Demais campos da NF-e --> </ide> <!-- Conteúdo completo da NF-e em contingência --> </infNFe> </NFe>`;
  ```
- **calcularDV(chave: string)** — `src/lib/sefaz-simulator/utils.ts`
  ```
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9]; let soma = 0; let pesoIndex = 0; for (let i = chave.length - 1; i >= 0; i--) { soma += parseInt(chave[i]) * pesos[pesoIndex % 8]; pesoIndex++; } const resto = soma % 11; return resto < 2 ? '0' : String(11 - resto);
  ```
- **gerarChaveAcesso(dados: NFEData)** — `src/lib/sefaz-simulator/utils.ts`
  ```
  const uf = getCodigoUF(dados.emitente.uf); const dataEmissao = new Date(dados.dataEmissao); const aamm = `${String(dataEmissao.getFullYear()).slice(2)}${String(dataEmissao.getMonth() + 1).padStart(2, '0')}`; const cnpj = dados.emitente.cnpj.replace(/\D/g, ''); const mod = '55'; const serie = String(dados.serie).padStart(3, '0'); const numero = String(dados.numero).padStart(9, '0'); const tpEmis = '1'; const cNF = String(Math.floor(Math.random() * 99999999)).padStart(8, '0'); const chaveBase = `$ …
  ```
- **gerarProtocolo(uf: string)** — `src/lib/sefaz-simulator/utils.ts`
  ```
  const codigoUF = getCodigoUF(uf); const ano = new Date().getFullYear().toString().slice(2); const sequencial = String(Math.floor(Math.random() * 9999999999)).padStart(10, '0'); return `${codigoUF}${ano}${sequencial}`;
  ```
- **gerarRecibo(uf: string)** — `src/lib/sefaz-simulator/utils.ts`
  ```
  const codigoUF = getCodigoUF(uf); const sequencial = String(Math.floor(Math.random() * 999999999999999)).padStart(15, '0'); return `${codigoUF}${sequencial}`;
  ```
- **validarNFE(dados: NFEData)** — `src/lib/sefaz-simulator/validacao.ts`
  ```
  valid: boolean; errors: string[]; cStat?: string
  ```
- **gerarXMLAutorizado(dados: NFEData, chaveAcesso: string, protocolo: string)** — `src/lib/sefaz-simulator/xml.ts`
  ```
  const dataRecebimento = new Date().toISOString(); const docLen = dados.destinatario.cpfCnpj.replace(/\D/g, '').length; const tag = docLen === 11 ? 'CPF' : 'CNPJ'; return `<?xml version="1.0" encoding="UTF-8"?> <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"> <NFe xmlns="http://www.portalfiscal.inf.br/nfe"> <infNFe versao="4.00" Id="NFe${chaveAcesso}"> <ide> <cUF>${getCodigoUF(dados.emitente.uf)}</cUF> <cNF>${chaveAcesso.slice(35, 43)}</cNF> <natOp>${dados.naturezaOperacao}</nat …
  ```
- **formatarValorSPED(valor: number, casasDecimais: number = 2)** — `src/lib/sped-generator/core.ts`
  ```
  return valor.toFixed(casasDecimais).replace('.', ',');
  ```
- **gerarLinhaSPED(registro: RegistroSPED)** — `src/lib/sped-generator/core.ts`
  ```
  return `|${registro.tipo}|${registro.campos.join('|')}|`;
  ```
- **gerarEFD_Contribuicoes(empresa: DadosEmpresa, competencia: string, _operacoes: OperacaoTributavel[], _creditos: CreditoTributario[])** — `src/lib/sped-generator/efd-contribuicoes.ts`
  ```
  const linhas: string[] = []; const [ano, mes] = competencia.split('-'); const dataInicio = `01${mes}${ano}`; const dataFim = format(new Date(Number(ano), Number(mes), 0), 'ddMMyyyy'); linhas.push( gerarLinhaSPED({ tipo: '0000', campos: [ '006', '0', dataInicio, dataFim, empresa.razaoSocial.substring(0, 100), formatarCNPJ(empresa.cnpj), empresa.uf || 'SP', empresa.codMunicipio || '', '', '1', '1', ], }) ); linhas.push(gerarLinhaSPED({ tipo: '0001', campos: ['0'] })); linhas.push(gerarLinhaSPED({ …
  ```
- **gerarEFD_IBS_CBS(empresa: DadosEmpresa, competencia: string, operacoes: OperacaoTributavel[], creditos: CreditoTributario[], apuracao: Ap)** — `src/lib/sped-generator/efd-ibs-cbs.ts`
  ```
  const linhas: string[] = []; const [ano, mes] = competencia.split('-'); const dataInicio = `01${mes}${ano}`; const dataFim = format(new Date(Number(ano), Number(mes), 0), 'ddMMyyyy'); linhas.push( gerarLinhaSPED({ tipo: '0000', campos: [ '018', '0', dataInicio, dataFim, empresa.razaoSocial.substring(0, 100), formatarCNPJ(empresa.cnpj), empresa.uf || 'SP', empresa.inscricaoEstadual || '', empresa.codMunicipio || '', empresa.inscricaoMunicipal || '', '0', ], }) ); linhas.push(gerarLinhaSPED({ tipo …
  ```
- **validarArquivoSPED(conteudo: string)** — `src/lib/sped-generator/io.ts`
  ```
  valido: boolean; erros: string[]
  ```
- **validateSSOConfig(input: SSOConfigInput)** — `src/lib/sso/consistency.ts`
  ```
  const issues: ConsistencyIssue[] = []; const cm = input.claim_mapping ?? {}; const domains = input.allowed_domains ?? []; const mappings = input.role_mappings ?? []; const defaultRole = input.default_role ?? ''; const autoProvision = !!input.auto_provision_users; const forceSso = !!input.force_sso_for_domains; const preset = input.preset ?? ''; // ----- claim_mapping ----- if (!cm.email || !cm.email.trim()) { issues.push({ id: 'cm.email.missing', severity: 'error', scope: 'claim_mapping', field: …
  ```
- **converterContasPagarParaLancamentos(contasPagar: Array<{ id: string; descricao: string; valor: number; valor_pago?: number | null; data_vencimento: string; )** — `src/lib/transaction-matcher/converters.ts`
  ```
  return contasPagar.map((cp) => ({ id: cp.id, tipo: 'pagar' as const, descricao: cp.descricao, valor: cp.status === 'parcial' ? Math.max(0, cp.valor - Number(cp.valor_pago || 0)) : cp.valor, dataVencimento: new Date(cp.data_vencimento), entidade: cp.fornecedor_nome, entidadeNome: cp.fornecedores?.nome_fantasia || cp.fornecedores?.razao_social, status: cp.status, numeroDocumento: cp.numero_documento || undefined, }));
  ```
- **converterContasReceberParaLancamentos(contasReceber: Array<{ id: string; descricao: string; valor: number; valor_recebido?: number | null; data_vencimento: st)** — `src/lib/transaction-matcher/converters.ts`
  ```
  return contasReceber.map((cr) => ({ id: cr.id, tipo: 'receber' as const, descricao: cr.descricao, valor: cr.status === 'parcial' ? Math.max(0, cr.valor - Number(cr.valor_recebido || 0)) : cr.valor, dataVencimento: new Date(cr.data_vencimento), entidade: cr.cliente_nome, entidadeNome: cr.clientes?.nome_fantasia || cr.clientes?.razao_social, status: cr.status, numeroDocumento: cr.numero_documento || undefined, }));
  ```
- **calcularSimilaridadeTexto(texto1: string, texto2: string)** — `src/lib/transaction-matcher/similarity.ts`
  ```
  score: number; tipo: 'exato' | 'parcial' | 'nenhum'
  ```
- **calcularSimilaridadeValor(valor1: number, valor2: number, tolerancia: number)** — `src/lib/transaction-matcher/similarity.ts`
  ```
  score: number; tipo: 'exato' | 'proximo' | 'diferente'
  ```
- **calcularSimilaridadeData(data1: Date, data2: Date, toleranciaDias: number)** — `src/lib/transaction-matcher/similarity.ts`
  ```
  const diffMs = Math.abs(data1.getTime() - data2.getTime()); const diffDias = diffMs / (1000 * 60 * 60 * 24); if (diffDias <= 1) return 1; if (diffDias <= toleranciaDias) return 1 - (diffDias / toleranciaDias) * 0.5; if (diffDias <= toleranciaDias * 2) { return 0.3 - (diffDias - toleranciaDias) / (toleranciaDias * 4); } return 0;
  ```
- **calcularEstatisticasMatch(transacoes: TransacaoOFX[], matches: Map<string, MatchSugestao[]>)** — `src/lib/transaction-matcher/stats.ts`
  ```
  let confiancaAlta = 0; let confiancaMedia = 0; let confiancaBaixa = 0; let valorTotalMatcheado = 0; for (const transacao of transacoes) { const sugestoes = matches.get(transacao.id); if (sugestoes && sugestoes.length > 0) { const melhor = sugestoes[0]; if (melhor.confianca === 'alta') { confiancaAlta++; valorTotalMatcheado += Math.abs(transacao.valor); } else if (melhor.confianca === 'media') { confiancaMedia++; valorTotalMatcheado += Math.abs(transacao.valor); } else { confiancaBaixa++; } } } r …
  ```
- **calcularFatorR(folha12m: number, rbt12: number)** — `src/lib/tributario/fator-r.ts`
  ```
  if (!rbt12 || rbt12 <= 0) return 0; return folha12m / rbt12;
  ```
- **calcularFolha12m(folhaHistorico: FolhaMes[], anoReferencia: number, mesReferencia: number)** — `src/lib/tributario/fator-r.ts`
  ```
  if (!folhaHistorico || folhaHistorico.length === 0) return 0; const ordenado = [...folhaHistorico].sort((a, b) => { if (a.ano !== b.ano) return b.ano - a.ano; return b.mes - a.mes; }); const anteriores = ordenado.filter((f) => { if (f.ano < anoReferencia) return true; if (f.ano === anoReferencia && f.mes < mesReferencia) return true; return false; }); const ultimos12 = anteriores.slice(0, 12); const soma = ultimos12.reduce((acc, f) => acc + (f.total_folha || 0), 0); if (ultimos12.length < 12 && …
  ```
- **calcularIRPFMMensal(params: ParametrosIRPFM)** — `src/lib/tributario/irpfm.ts`
  ```
  const dividendos = Math.max(0, Number(params.dividendosMensais) || 0); const outros = Math.max(0, Number(params.outrosRendimentosIsentos) || 0); const irrf = Math.max(0, Number(params.irrfRetido) || 0); const baseTotal = dividendos + outros; const observacoes: string[] = [ 'Cálculo conforme Lei 15.270/2025 (IRPFM — Imposto Mínimo PF).', 'Vigência: 2026.', ]; if (baseTotal <= IRPFM_LIMITE_ISENCAO_MENSAL) { observacoes.push( `Recebimento dentro do limite de isenção (R$ ${IRPFM_LIMITE_ISENCAO_MENSA …
  ```
- **calcularIRPFMAnual(meses: ParametrosIRPFM[])** — `src/lib/tributario/irpfm.ts`
  ```
  totalDividendos: number; totalImposto: number; totalLiquido: number; detalhePorMes: ResultadoIRPFM[]; alertas: string[];
  ```
- **calcularIrpfMensal(baseMensal: number)** — `src/lib/tributario/pf-vinculada.ts`
  ```
  const base = sanitizar(baseMensal); if (base <= PF_IRPF_ISENCAO_MENSAL) return 0; const bruto = base * 0.275 - 908.73; if (base <= PF_IRPF_LIMITE_REDUTOR_MENSAL) { const amplitude = PF_IRPF_LIMITE_REDUTOR_MENSAL - PF_IRPF_ISENCAO_MENSAL; const progresso = (base - PF_IRPF_ISENCAO_MENSAL) / amplitude; const reducao = Math.max(0, 312.89 * (1 - progresso)); return Math.max(0, bruto - reducao); } return Math.max(0, bruto);
  ```
- **calcularAliquotaIrpfm(rendaTotalAnual: number)** — `src/lib/tributario/pf-vinculada.ts`
  ```
  const renda = sanitizar(rendaTotalAnual); if (renda > PF_IRPFM_TETO_ANUAL) return PF_IRPFM_ALIQUOTA_MAXIMA; if (renda > PF_IRPFM_PISO_ANUAL) { return ((renda - PF_IRPFM_PISO_ANUAL) / 60_000) * 0.01; } return 0;
  ```
- **gerarAlertasPF(proLaboreMensal: number, dividendosMensais: number, rendaTotalAnual: number)** — `src/lib/tributario/pf-vinculada.ts`
  ```
  const alertas: AlertaPF[] = []; if (proLaboreMensal <= 0 && rendaTotalAnual > 0) { alertas.push({ tipo: 'SEM_PRO_LABORE', severidade: 'alta', mensagem: 'Sócio administrador sem pró-labore. A ausência de remuneração configura risco de autuação previdenciária.', }); } else if (proLaboreMensal < 3_000 && rendaTotalAnual > 200_000) { alertas.push({ tipo: 'PRO_LABORE_BAIXO', severidade: 'alta', mensagem: 'Pró-labore muito baixo para o volume distribuído. Risco fiscal de desconsideração (pejotização). …
  ```
- **calcularRBT12(faturamentoHistorico: FaturamentoMes[], anoReferencia: number, mesReferencia: number)** — `src/lib/tributario/rbt12.ts`
  ```
  if (!faturamentoHistorico || faturamentoHistorico.length === 0) return 0; // Ordena do mais recente para o mais antigo const ordenado = [...faturamentoHistorico].sort((a, b) => { if (a.ano !== b.ano) return b.ano - a.ano; return b.mes - a.mes; }); // Filtra apenas meses anteriores ao mês de referência const anteriores = ordenado.filter((f) => { if (f.ano < anoReferencia) return true; if (f.ano === anoReferencia && f.mes < mesReferencia) return true; return false; }); if (anteriores.length === 0) …
  ```
- **calcularRBA(faturamentoHistorico: FaturamentoMes[], ano: number)** — `src/lib/tributario/rbt12.ts`
  ```
  return faturamentoHistorico .filter((f) => f.ano === ano) .reduce((acc, f) => acc + (f.receita_bruta || 0), 0);
  ```
- **validarConsistenciaNcmCst(ncm: string, cst: string)** — `src/lib/tributario/validador-ncm-cst.ts`
  ```
  let score = 100; const divergencias: ValidacaoNCM['divergencias'] = []; const ncmLimpo = ncm.replace(/\D/g, ''); // Regras de exemplo para incidência monofásica (PIS/COFINS) // Ex: 3004 (Medicamentos), 4011 (Pneus), 2203 (Cervejas) const isMonofasico = ['3004', '4011', '2203', '3808'].some((prefix) => ncmLimpo.startsWith(prefix) ); if (isMonofasico) { // Para monofásicos, o CST de saída deveria ser 04 ou 06 // E o CST de entrada (crédito) deveria ser consistente if (cst !== '060' && cst !== '04' …
  ```
- **calcularTodosRegimes(input: InputCalculadora)** — `src/lib/tributario/calculadora/index.ts`
  ```
  const cenarios: ResultadoRegime[] = []; if (input.simples) cenarios.push(calcularSimplesNacional(input.simples)); if (input.lucroPresumido) cenarios.push(calcularLucroPresumido(input.lucroPresumido)); if (input.lucroReal) cenarios.push(calcularLucroReal(input.lucroReal)); if (input.reforma) cenarios.push(calcularReformaTributaria(input.reforma)); const elegiveis = cenarios.filter((c) => c.elegivel && c.regime !== 'reforma'); const melhorCenario = elegiveis.length > 0 ? elegiveis.reduce((a, b) => …
  ```
- **calcularLucroPresumido(input: InputLucroPresumido)** — `src/lib/tributario/calculadora/lucro-presumido.ts`
  ```
  const memoria: LinhaMemoria[] = []; const alertas: string[] = []; const receitaBruta = input.receitas.receitaBrutaAnual; if (receitaBruta > LIMITE_ANUAL) { return { regime: 'lucro_presumido', nome: 'Lucro Presumido', elegivel: false, motivoInelegibilidade: `Receita > R$ ${LIMITE_ANUAL.toLocaleString('pt-BR')}`, tributos: [], retencoesCompensadas: 0, totalTributos: 0, totalAPagar: 0, receitaBase: receitaBruta, cargaEfetiva: 0, memoria: [], alertas: ['Obrigatório Lucro Real acima de R$ 78 mi.'], } …
  ```
- **calcularLucroReal(input: InputLucroReal)** — `src/lib/tributario/calculadora/lucro-real.ts`
  ```
  const memoria: LinhaMemoria[] = []; const alertas: string[] = []; const receitaBruta = input.receitas.receitaBrutaAnual; const receitaLiquida = Math.max( 0, receitaBruta - (input.receitas.devolucoes ?? 0) - (input.receitas.descontosIncondicionais ?? 0) ); // === LALUR Parte A === const somaAdicoes = (input.lalur.adicoesMultas ?? 0) + (input.lalur.adicoesBrindes ?? 0) + (input.lalur.adicoesProvisoes ?? 0) + (input.lalur.adicoesDoacoes ?? 0) + (input.lalur.adicoesOutras ?? 0); const somaExclusoes …
  ```
- **calcularReformaTributaria(input: InputReforma)** — `src/lib/tributario/calculadora/reforma-tributaria.ts`
  ```
  const memoria: LinhaMemoria[] = []; const alertas: string[] = []; const ano = input.anoReferencia; const fase = obterFase(ano); const reducao = input.regimeEspecialReducao ?? 0; const receita = input.receitas.receitaBrutaAnual; const creditos = input.creditos ?? 0; const cbsAliq = (input.aliquotaCbsAlvo ?? fase.cbs) * (1 - reducao); const ibsAliq = (input.aliquotaIbsAlvo ?? fase.ibs) * (1 - reducao); const cbsDebito = receita * cbsAliq; const ibsDebito = receita * ibsAliq; const cbsCredito = cre …
  ```
- **calcularAliquotaEfetiva(rbt12: number, faixas: FaixaSimples[])** — `src/lib/tributario/calculadora/simples-nacional.ts`
  ```
  aliq: number; faixa: FaixaSimples
  ```
- **calcularSimplesNacional(input: InputSimples)** — `src/lib/tributario/calculadora/simples-nacional.ts`
  ```
  const memoria: LinhaMemoria[] = []; const alertas: string[] = []; const receitaBruta = input.receitas.receitaBrutaAnual; if (input.rbt12 > LIMITE_ANUAL) { return { regime: 'simples_nacional', nome: 'Simples Nacional', elegivel: false, motivoInelegibilidade: `RBT12 > R$ ${LIMITE_ANUAL.toLocaleString('pt-BR')}`, tributos: [], retencoesCompensadas: 0, totalTributos: 0, totalAPagar: 0, receitaBase: receitaBruta, cargaEfetiva: 0, memoria: [], alertas: ['Exclusão obrigatória do Simples.'], }; } // Fat …
  ```
- **gerarAlertasCatalogos(entrada: EntradaAlertasCatalogos)** — `src/lib/tributario/catalogos/alertas.ts`
  ```
  const { ufs, interestaduais, faixas, itensIss, ncms } = entrada; const alertas: AlertaCatalogo[] = []; const vazio = (catalogo: CatalogoId, registros: number): boolean => { if (registros > 0) return false; alertas.push( montar( catalogo, TITULOS_CATALOGO[catalogo], 'catalogo_vazio', null, 0, `${TITULOS_CATALOGO[catalogo]}: catálogo sem registros no banco — o motor opera apenas com as tabelas embarcadas` ) ); return true; }; // --- UFs ------------------------------------------------------------- …
  ```
- **validarMarcadorFcp(ufsBanco: readonly UfCatalogo[])** — `src/lib/tributario/catalogos/coerencia-ufs.ts`
  ```
  return ufsBanco .filter((u) => u.possui_fcp !== Number(u.aliquota_fcp) > 0) .map((u) => `${u.sigla}: possui_fcp=${u.possui_fcp} mas aliquota_fcp=${u.aliquota_fcp}`);
  ```
- **validarInterestaduais(ufs: readonly UfCatalogo[], aliquotas: readonly AliquotaInterestadualCatalogo[])** — `src/lib/tributario/catalogos/painel.ts`
  ```
  const problemas: string[] = []; const porSigla = new Map(ufs.map((u) => [u.sigla, u])); const vistos = new Set<string>(); for (const a of aliquotas) { const chave = `${a.uf_origem}->${a.uf_destino}`; if (vistos.has(chave)) { problemas.push(`${chave}: par duplicado no catálogo`); continue; } vistos.add(chave); if (a.uf_origem === a.uf_destino) { problemas.push(`${chave}: operação interna não deve constar no catálogo interestadual`); continue; } const origem = porSigla.get(a.uf_origem); const dest …
  ```
- **serializarValor(valor: number | string | null | undefined)** — `src/lib/tributario/catalogos/rejeicoes-auditoria.ts`
  ```
  if (valor === null || valor === undefined) return null; return String(valor);
  ```
- **calcularSaudeCatalogos(entrada: EntradaSaudeCatalogos)** — `src/lib/tributario/catalogos/saude.ts`
  ```
  const maxExemplos = entrada.maxExemplos ?? 3; const criticos = Math.max(0, entrada.alertas?.criticos ?? 0); const atencoes = Math.max(0, entrada.alertas?.atencoes ?? 0); const divergencias = Math.max(0, entrada.alertas?.total ?? criticos + atencoes); const catalogosAfetados = entrada.alertas?.catalogosAfetados ?? []; const rejeicoesPorOverlay: RejeicaoOverlayResumo[] = (Object.keys(TITULOS_OVERLAY) as OverlayId[]) .map((overlay) => { const mensagens = entrada.rejeicoes?.[overlay] ?? []; return { …
  ```
- **calcularVencimento(periodoApuracao: string, regra: RegraVencimento)** — `src/lib/tributario/darf/vencimento.ts`
  ```
  const [ano, mes] = parsePeriodo(periodoApuracao); const proximo = new Date(Date.UTC(ano, mes, 1)); // mês seguinte (mes é 1-based) let alvo: Date; if (regra === 'ultimo_dia_util_mes_seguinte') { alvo = new Date(Date.UTC(proximo.getUTCFullYear(), proximo.getUTCMonth() + 1, 0)); } else { const dia = regra === 'dia_25_mes_seguinte' ? 25 : 20; alvo = new Date(Date.UTC(proximo.getUTCFullYear(), proximo.getUTCMonth(), dia)); } return toISO(anteciparDiaUtil(alvo));
  ```
- **calcularAcrescimos(params: { readonly principal: number; readonly vencimento: string; readonly dataPagamento: string; readonly selicMensal?)** — `src/lib/tributario/darf/vencimento.ts`
  ```
  const { principal, vencimento, dataPagamento, selicMensal, selicPadraoMensal } = params; const dias = diasAtraso(vencimento, dataPagamento); const base = Math.max(0, principal); if (dias === 0 || base === 0) { return { diasAtraso: dias, multaMora: 0, percentualMulta: 0, juros: 0, percentualJuros: 0 }; } const percentualMulta = Math.min(dias * MULTA_MORA_DIARIA, MULTA_MORA_TETO); const percentualJuros = selicAcumulada( vencimento, dataPagamento, selicMensal, selicPadraoMensal ?? SELIC_PADRAO_MENS …
  ```
- **round2(v: number)** — `src/lib/tributario/darf/vencimento.ts`
  ```
  return Math.round((v + Number.EPSILON) * 100) / 100;
  ```
- **arredondar(valor: number)** — `src/lib/tributario/folha/encargos.ts`
  ```
  Math.round(valor * 100) / 100;
  ```
- **calcularRatAjustado(ratNominal: number, fap?: number)** — `src/lib/tributario/folha/encargos.ts`
  ```
  const bruto = ratNominal * normalizarFap(fap); return Math.min(RAT_AJUSTADO_MAXIMO, Math.max(RAT_AJUSTADO_MINIMO, bruto));
  ```
- **calcularEncargosPatronais(input: InputEncargosPatronais, cnae?: string | null)** — `src/lib/tributario/folha/encargos.ts`
  ```
  const alertas: string[] = []; const linhas: LinhaEncargo[] = []; const proLabore = sanitizar(input.proLabore); const folhaTotal = sanitizar(input.folha); // Pró-labore integra a CPP, mas não RAT/Terceiros/FGTS (IN RFB 2.110/22, art. 32). const baseRatTerceiros = Math.max(0, folhaTotal - Math.min(proLabore, folhaTotal)); const baseCpp = folhaTotal; const ratNominal = resolverRatNominal(input, cnae); const fap = normalizarFap(input.fap); const ratAjustado = calcularRatAjustado(ratNominal, input.fa …
  ```
- **arredondar(v: number)** — `src/lib/tributario/icms/overlay-mva.ts`
  ```
  return Math.round(v * 1e6) / 1e6;
  ```
- **aplicarOverlayMvaSt(entrada: EntradaOverlayMva)** — `src/lib/tributario/icms/overlay-mva.ts`
  ```
  const referencia = entrada.referencia ?? null; const rejeitadas: RejeicaoMva[] = []; const bloqueadas: BloqueioMva[] = []; const aplicadas: EntradaMvaSt[] = []; const indice: IndiceMvaSt = {}; // 1) Signatárias por protocolo — sem UF válida o protocolo não produz efeito. const origensPorProtocolo = new Map<string, Set<UF>>(); const destinosPorProtocolo = new Map<string, Set<UF>>(); for (const registro of entrada.ufs ?? []) { const protocolo = (registro?.protocolo_id ?? '').toString().trim(); if …
  ```
- **arredondar(v: number)** — `src/lib/tributario/icms/overlay.ts`
  ```
  return Math.round(v * 1e6) / 1e6;
  ```
- **aplicarOverlayUfs(registros: readonly RegistroUfBanco[], base: Record<UF, AliquotaUf> = ALIQUOTAS_UF)** — `src/lib/tributario/icms/overlay.ts`
  ```
  const tabela = Object.fromEntries( Object.entries(base).map(([uf, dados]) => [uf, { ...dados }]) ) as Record<UF, AliquotaUf>; const aplicadas: AplicacaoOverlay[] = []; const rejeitadas: RejeicaoOverlay[] = []; const vistos = new Set<string>(); for (const registro of registros) { const sigla = (registro?.sigla ?? '').toString().trim().toUpperCase(); if (!isUF(sigla)) { rejeitadas.push({ sigla, motivo: 'uf_desconhecida', valor: registro?.aliquota_interna_padrao ?? null, }); continue; } if (vistos. …
  ```
- **round2(valor: number)** — `src/lib/tributario/icms/st.ts`
  ```
  if (!Number.isFinite(valor)) return 0; return Math.round((valor + Number.EPSILON) * 100) / 100;
  ```
- **calcularMvaAjustada(input: InputMvaAjustada)** — `src/lib/tributario/icms/st.ts`
  ```
  const mvaOriginal = Math.max(0, Number.isFinite(input.mvaOriginal) ? input.mvaOriginal : 0); const inter = rate(input.aliquotaInterestadual); const intra = rate(input.aliquotaInterna); // Alíquota interna de 100% tornaria o denominador nulo — degrada para a MVA original. if (intra >= 1) return mvaOriginal; // Interestadual maior que a interna produziria MVA menor que a original; // a fórmula continua válida, mas nunca deve gerar MVA negativa. const ajustada = ((1 + mvaOriginal) * (1 - inter)) / …
  ```
- **calcularIcmsSt(input: InputIcmsSt)** — `src/lib/tributario/icms/st.ts`
  ```
  const alertas: string[] = []; const linhas: LinhaIcms[] = []; const valorProduto = money(input.valorProduto); const frete = money(input.frete); const seguro = money(input.seguro); const outras = money(input.outrasDespesas); const ipi = money(input.ipi); const descontos = money(input.descontos); const operacaoInterestadual = input.ufOrigem !== input.ufDestino; const bruto = valorProduto + frete + seguro + outras; if (descontos > bruto) { alertas.push('Desconto informado supera o valor da operação …
  ```
- **calcularDifal(input: InputDifal)** — `src/lib/tributario/icms/st.ts`
  ```
  const alertas: string[] = []; const linhas: LinhaIcms[] = []; const valorOperacao = money(input.valorOperacao); const operacaoInterestadual = input.ufOrigem !== input.ufDestino; const contribuinte = input.destinatarioContribuinte ?? false; const aliquotaInterestadual = input.aliquotaInterestadual !== undefined ? rate(input.aliquotaInterestadual) : resolverAliquotaInterestadual(input.ufOrigem, input.ufDestino, input.origem); const aliquotaInternaDestino = input.aliquotaInternaDestino !== undefine …
  ```
- **round2(v: number)** — `src/lib/tributario/ipi-iss/ipi.ts`
  ```
  Math.round((v + Number.EPSILON) * 100) / 100;
  ```
- **calcularIpi(input: InputIpi)** — `src/lib/tributario/ipi-iss/ipi.ts`
  ```
  const alertas: string[] = []; const memoria: LinhaMemoria[] = []; const valorProduto = nonNeg(input.valorProduto); const frete = nonNeg(input.frete); const seguro = nonNeg(input.seguro); const outras = nonNeg(input.outrasDespesas); const descontos = nonNeg(input.descontosIncondicionais); const contribuinte = input.contribuinte ?? true; const tipi = input.ncm ? buscarTipi(input.ncm) : undefined; if (input.ncm && !tipi) { alertas.push( `NCM ${normalizarNcm(input.ncm)} não catalogado na TIPI embarc …
  ```
- **round2(v: number)** — `src/lib/tributario/ipi-iss/iss.ts`
  ```
  Math.round((v + Number.EPSILON) * 100) / 100;
  ```
- **calcularIss(input: InputIss)** — `src/lib/tributario/ipi-iss/iss.ts`
  ```
  const alertas: string[] = []; const memoria: LinhaMemoria[] = []; const item = buscarItemLc116(input.itemLc116); if (!item) { throw new Error( `Item ${input.itemLc116} não encontrado na lista anexa da LC 116/2003 embarcada.` ); } const valorServico = nonNeg(input.valorServico); const materiais = nonNeg(input.materiais); const subempreitadas = nonNeg(input.subempreitadas); let deducoes = 0; if (item.permiteDeducaoMateriais) { deducoes = Math.min(materiais + subempreitadas, valorServico); if (mate …
  ```
- **arredondar(v: number)** — `src/lib/tributario/ipi-iss/overlay-ncm.ts`
  ```
  return Math.round(v * 1e6) / 1e6;
  ```
- **aplicarOverlayNcm(registros: readonly RegistroNcmBanco[], base: readonly ItemTipi[] = TIPI)** — `src/lib/tributario/ipi-iss/overlay-ncm.ts`
  ```
  const tabela: Record<string, ItemTipi> = {}; for (const item of base) tabela[normalizarNcm(item.ncm)] = { ...item }; const aplicadas: AplicacaoNcm[] = []; const adicionados: string[] = []; const rejeitadas: RejeicaoNcm[] = []; const vistos = new Set<string>(); for (const registro of registros ?? []) { const bruto = (registro?.codigo ?? '').toString(); const codigo = normalizarNcm(bruto); if (codigo.length !== 8) { rejeitadas.push({ ncm: bruto.trim(), motivo: 'codigo_invalido', valor: codigo.leng …
  ```
- **round2(v: number)** — `src/lib/tributario/irpj-csll/apurar.ts`
  ```
  Math.round((v + Number.EPSILON) * 100) / 100;
  ```
- **calcularAdicional(base: number, meses: number)** — `src/lib/tributario/irpj-csll/apurar.ts`
  ```
  const limite = LIMITE_ADICIONAL_MENSAL * Math.max(1, meses); return round2(positivo(base - limite) * ALIQUOTA_ADICIONAL_IRPJ);
  ```
- **round2(v: number)** — `src/lib/tributario/monofasico/calcular.ts`
  ```
  Math.round((Number.isFinite(v) ? v : 0) * 100) / 100;
  ```
- **calcularItemMonofasico(item: ItemMonofasico, posicaoPadrao: PosicaoCadeia, regime: RegimeApuracaoPisCofins)** — `src/lib/tributario/monofasico/calcular.ts`
  ```
  const posicao = item.posicao ?? posicaoPadrao; const receita = Number.isFinite(item.receita) && item.receita > 0 ? item.receita : 0; const normal = aliquotasRegimeNormal(regime); const totalRegimeNormal = round2(receita * (normal.pis + normal.cofins)); const classificacao = classificarNcmMonofasico(item.ncm); if (!classificacao) { const pis = round2(receita * normal.pis); const cofins = round2(receita * normal.cofins); return { ncm: item.ncm, descricao: item.descricao ?? 'NCM não monofásico', re …
  ```
- **calcularMixMonofasico(itens: ItemMonofasico[], posicaoPadrao: PosicaoCadeia = 'revenda', regime: RegimeApuracaoPisCofins = 'presumido')** — `src/lib/tributario/monofasico/calcular.ts`
  ```
  const resultados = itens.map((i) => calcularItemMonofasico(i, posicaoPadrao, regime)); const alertas: string[] = []; let receitaTotal = 0; let receitaMonofasica = 0; let pisMonofasico = 0; let cofinsMonofasico = 0; let totalSeRegimeNormal = 0; for (const r of resultados) { receitaTotal += r.receita; if (r.monofasico) { receitaMonofasica += r.receita; pisMonofasico += r.pis; cofinsMonofasico += r.cofins; totalSeRegimeNormal += r.totalRegimeNormal; } if (r.alerta) alertas.push(r.alerta); } const t …
  ```
- **aplicarOverlayMonofasico(registros: readonly RegistroNcmMonofasicoBanco[])** — `src/lib/tributario/monofasico/overlay-monofasico.ts`
  ```
  const override: Record<string, boolean> = {}; const descricoes: Record<string, string> = {}; const inclusoes: InclusaoMonofasica[] = []; const exclusoes: ExclusaoMonofasica[] = []; const rejeitadas: RejeicaoMonofasico[] = []; const vistos = new Set<string>(); for (const registro of registros ?? []) { const bruto = (registro?.codigo ?? '').toString(); const codigo = normalizarNcm(bruto); if (codigo.length !== 8) { rejeitadas.push({ ncm: bruto.trim(), motivo: 'codigo_invalido', valor: codigo.lengt …
  ```
- **calcularRBT12(hist: FaturamentoMes[], ano: number, mes: number)** — `src/lib/tributario/motor/base.ts`
  ```
  if (!hist?.length) return 0; const ord = [...hist].sort((a, b) => (a.ano !== b.ano ? b.ano - a.ano : b.mes - a.mes)); const ant = ord.filter((f) => f.ano < ano || (f.ano === ano && f.mes < mes)); if (!ant.length) return 0; const u12 = ant.slice(0, 12); const soma = u12.reduce((a, f) => a + (f.receita_bruta || 0), 0); return u12.length < 12 ? (soma / u12.length) * 12 : soma;
  ```
- **calcularFolha12m(hist: FolhaMes[], ano: number, mes: number)** — `src/lib/tributario/motor/base.ts`
  ```
  if (!hist?.length) return 0; const ord = [...hist].sort((a, b) => (a.ano !== b.ano ? b.ano - a.ano : b.mes - a.mes)); const ant = ord.filter((f) => f.ano < ano || (f.ano === ano && f.mes < mes)); const u12 = ant.slice(0, 12); const soma = u12.reduce((a, f) => a + (f.total_folha || 0), 0); return u12.length < 12 && u12.length > 0 ? (soma / u12.length) * 12 : soma;
  ```
- **round1(v: number)** — `src/lib/tributario/obrigacoes/alertas.ts`
  ```
  Math.round(v * 10) / 10;
  ```
- **round2(v: number)** — `src/lib/tributario/obrigacoes/alertas.ts`
  ```
  Math.round(v * 100) / 100;
  ```
- **calcularPrazo(obrigacao: Obrigacao, competencia: string)** — `src/lib/tributario/obrigacoes/calendario.ts`
  ```
  const regra = obrigacao.regra; if (regra.tipo === 'dia_fixo_anual') { const ano = Number(/^(\d{4})/.exec(competencia.trim())?.[1]); if (!Number.isFinite(ano)) throw new Error(`Exercício inválido: "${competencia}"`); return toISO(ultimoDiaUtil(ano + 1, regra.mes)); } const [ano, mes] = parsePeriodo(competencia); const alvoMes = mes + regra.mesesApos; // 1-based, pode extrapolar 12 const anoAlvo = ano + Math.floor((alvoMes - 1) / 12); const mesAlvo = ((alvoMes - 1) % 12) + 1; if (regra.tipo === 'e …
  ```
- **gerarCalendario(params: GerarCalendarioParams)** — `src/lib/tributario/obrigacoes/calendario.ts`
  ```
  const { competencias, regime, hoje, entregues, somente } = params; const filtro = somente ? new Set(somente) : null; const itens: ItemCalendario[] = []; const vistos = new Set<string>(); for (const obrigacao of OBRIGACOES) { if (filtro && !filtro.has(obrigacao.id)) continue; const aplicavel = regime === 'todos' || obrigacao.regimes.includes('todos') || obrigacao.regimes.includes(regime); if (!aplicavel) continue; for (const competencia of competencias) { if (!/^\d{4}-\d{2}$/.test(competencia)) c …
  ```
- **calcularMultaAtraso(params: { readonly obrigacaoId: string; readonly prazo: string; readonly dataEntrega: string; /** Faturamento do período)** — `src/lib/tributario/obrigacoes/calendario.ts`
  ```
  const obrigacao = buscarObrigacao(params.obrigacaoId); if (!obrigacao) throw new Error(`Obrigação desconhecida: ${params.obrigacaoId}`); const diasAtraso = Math.max(0, diasEntre(params.prazo, params.dataEntrega)); if (diasAtraso === 0) { return { diasAtraso: 0, mesesAtraso: 0, percentual: 0, valorCalculado: 0, valorDevido: 0, aplicouPiso: false, aplicouTeto: false, }; } const mesesAtraso = Math.ceil(diasAtraso / 30); const base = Math.max(0, params.baseCalculo ?? 0); if (obrigacao.baseMulta === …
  ```
- **round1(v: number)** — `src/lib/tributario/obrigacoes/comparativo.ts`
  ```
  Math.round(v * 10) / 10;
  ```
- **round1(v: number)** — `src/lib/tributario/obrigacoes/conformidade.ts`
  ```
  Math.round(v * 10) / 10;
  ```
- **round2(v: number)** — `src/lib/tributario/obrigacoes/conformidade.ts`
  ```
  Math.round(v * 100) / 100;
  ```
- **calcularConformidade(itens: readonly ItemCalendario[], registros: readonly RegistroEntrega[] = [])** — `src/lib/tributario/obrigacoes/conformidade.ts`
  ```
  const indice = new Map<string, RegistroEntrega>(); for (const r of registros) indice.set(chave(r.obrigacaoId, r.competencia), r); let entregues = 0; let dispensadas = 0; let retificadas = 0; let entreguesComAtraso = 0; let vencidasPendentes = 0; let venceHoje = 0; let pendentesNoPrazo = 0; let multaRegistrada = 0; let pesoObtido = 0; const porOrgao = new Map<Orgao, { total: number; vencidas: number; peso: number }>(); const criticos: ItemCalendario[] = []; for (const item of itens) { const regis …
  ```
- **round1(v: number)** — `src/lib/tributario/obrigacoes/historico.ts`
  ```
  Math.round(v * 10) / 10;
  ```
- **round2(v: number)** — `src/lib/tributario/obrigacoes/historico.ts`
  ```
  Math.round(v * 100) / 100;
  ```
- **competenciaValida(valor: string)** — `src/lib/tributario/obrigacoes/historico.ts`
  ```
  return COMPETENCIA_RE.test(valor);
  ```
- **emailValido(valor: unknown)** — `src/lib/tributario/obrigacoes/preferencias-digest.ts`
  ```
  if (typeof valor !== 'string') return ''; const limpo = valor.trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo) ? limpo : '';
  ```
- **round1(v: number)** — `src/lib/tributario/obrigacoes/projecao.ts`
  ```
  Math.round(v * 10) / 10;
  ```
- **round3(v: number)** — `src/lib/tributario/obrigacoes/projecao.ts`
  ```
  Math.round(v * 1000) / 1000;
  ```
- **round1(v: number)** — `src/lib/tributario/obrigacoes/serie-comparativa.ts`
  ```
  Math.round(v * 10) / 10;
  ```
- **scoreValido(valor: unknown)** — `src/lib/tributario/obrigacoes/serie-comparativa.ts`
  ```
  const n = typeof valor === 'number' ? valor : Number(valor); if (!Number.isFinite(n)) return null; return round1(Math.min(100, Math.max(0, n)));
  ```
- **round2(v: number)** — `src/lib/tributario/pis-cofins/creditos.ts`
  ```
  Math.round((v + Number.EPSILON) * 100) / 100;
  ```
- **gerarGraficoComparativoBase64(decisao: ResultadoDecisao)** — `src/lib/tributario/relatorio-pdf/charts.ts`
  ```
  if (typeof document === 'undefined') return null; const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 400; const ctx = canvas.getContext('2d'); if (!ctx) return null; const cenarios = decisao.cenarios.filter((c) => c.elegivel); if (cenarios.length === 0) return null; const maxValor = Math.max(...cenarios.map((c) => c.totalTributos)); const padding = { top: 60, right: 40, bottom: 40, left: 200 }; const chartW = canvas.width - padding.left - padding.right; const ch …
  ```
- **gerarTimelineReformaBase64(parametros: ParametrosSimulacao)** — `src/lib/tributario/relatorio-pdf/charts.ts`
  ```
  if (typeof document === 'undefined') return null; const proj = projetarReforma({ faturamentoAnual: parametros.faturamentoAnual, percentualServicos: parametros.percentualServicos ?? 50, pisCofinsAtual: 9.25, icmsAtual: 18, issAtual: 5, }); const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 380; const ctx = canvas.getContext('2d'); if (!ctx) return null; const padding = { top: 60, right: 40, bottom: 50, left: 60 }; const chartW = canvas.width - padding.left - padd …
  ```
- **gerarRelatorioPdfExecutivo(opts: OpcoesRelatorio)** — `src/lib/tributario/relatorio-pdf/executivo.ts`
  ```
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }); const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); // ============================================ // CAPA — Branding empresa // ============================================ doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, pageHeight, 'F'); doc.setFillColor(59, 130, 246); doc.rect(0, 80, pageWidth, 4, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFo …
  ```
- **gerarPdfMemorialCalculo(resultado: ResultadoCalculadora, ativo: ResultadoRegime, empresa: DadosEmpresa)** — `src/lib/tributario/relatorio-pdf/memorial.ts`
  ```
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }); // Capa doc.setFontSize(18); doc.setTextColor(30, 30, 30); doc.text('Memorial de Cálculo Tributário', 20, 25); doc.setFontSize(10); doc.setTextColor(90, 90, 90); doc.text(`Empresa: ${empresa.nome}`, 20, 35); if (empresa.cnpj) doc.text(`CNPJ: ${empresa.cnpj}`, 20, 41); doc.text(`Período: ${empresa.periodo ?? new Date().getFullYear()}`, 20, 47); doc.text(`Regime analisado: ${ativo.nome}`, 20, 53); doc.text(`Gerado em: ${new Date().toLocaleString …
  ```
- **scoreColor(score: number)** — `src/pages/BenchmarkingSetorial.tsx`
  ```
  if (score >= 70) return 'text-success'; if (score >= 40) return 'text-warning'; return 'text-destructive';
  ```
- **matchesScore(()** — `src/pages/Clientes.tsx`
  ```
  if (scoreFilter === 'all') return true; const score = c.score || 0; switch (scoreFilter) { case 'excelente': return score >= 800; case 'bom': return score >= 600 && score < 800; case 'regular': return score >= 400 && score < 600; case 'critico': return score < 400; default: return true; }
  ```
- **calc(pred: (dias: number)** — `src/pages/DashboardReceber.tsx`
  ```
  boolean) =>
  ```
- **validate()** — `src/pages/ResetPassword.tsx`
  ```
  const newErrors: { password?: string; confirm?: string } = {}; if (!password) { newErrors.[REDACTED]; } else if (password.length < 8) { newErrors.[REDACTED]; } else if (!/[A-Z]/.test(password)) { newErrors.[REDACTED]; } else if (!/[0-9]/.test(password)) { newErrors.[REDACTED]; } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) { newErrors.[REDACTED]; } if (!confirmPassword) { newErrors.confirm = 'Confirmação de senha é obrigatória'; } else if (password !== confirmPassword) { newErrors.confirm …
  ```
- **applyPreset(dias: number)** — `src/pages/admin/AuditSsoProfileSync.tsx`
  ```
  setFromIso(subDays(new Date(), dias).toISOString()); setToIso(new Date().toISOString());
  ```
- **computeDivergence(d?: DiagnosticState)** — `src/pages/configuracoes/filtros-salvos/helpers.ts`
  ```
  if (!d || d.remote === 'loading' || d.syncing) return { direction: 'unknown', reason: 'Carregando…' }; if (d.remote === 'error') return { direction: 'unknown', reason: 'Erro ao ler conta' }; const hasRemote = d.remote === 'ok'; const hasLocal = d.local === 'ok'; if (!hasRemote && !hasLocal) return { direction: 'none', reason: 'Sem filtros salvos' }; if (hasRemote && !hasLocal) return { direction: 'remote-only', reason: 'Existe na conta, ausente neste dispositivo' }; if (!hasRemote && hasLocal) r …
  ```
- **CalculadoraTributaria()** — `src/pages/tributario/CalculadoraTributaria.tsx`
  ```
  const [form, setForm] = useState<CampoInput>(DEFAULT_INPUT); const [regimeSelecionado, setRegimeSelecionado] = useState<string>('lucro_real'); const [salvando, setSalvando] = useState(false); const [usarDadosReais, setUsarDadosReais] = useState(false); const { data: empresas = [] } = useAllEmpresas(); const [empresaId, setEmpresaId] = useState<string | undefined>(); const empresaSelecionada = empresas.find((e) => e.id === empresaId); const { data: dadosReais, isFetching: fetchingReais } = useCal …
  ```
- **emailValido(valor: string)** — `src/pages/tributario/PreferenciasDigest.tsx`
  ```
  valor === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  ```
- **aplicarOrdemBeneficios(reducoes: number[])** — `src/types/reforma-tributaria/regimes.ts`
  ```
  let base = 1; for (const r of reducoes) { base = base * (1 - r / 100); } return (1 - base) * 100;
  ```
- **normalizeValidationFields(error: unknown)** — `supabase/functions/_shared/contract-response.ts`
  ```
  if (isZodError(error)) return error.issues.map(normalizeIssue); if (Array.isArray(error)) { return error.flatMap((item) => { if (typeof item !== 'object' || item === null) return []; const candidate = item as Partial<ContractFieldError>; if (!candidate.message) return []; return [ { path: candidate.path ?? '$', message: candidate.message, code: candidate.code ?? 'custom', }, ]; }); } return [];
  ```
- **createValidationErrorResponse(error: unknown, headers: Record<string, string> = {}, message = 'Payload inválido')** — `supabase/functions/_shared/contract-response.ts`
  ```
  const body: ContractValidationError = { code: VALIDATION_ERROR_CODE, message, fields: normalizeValidationFields(error), }; return new Response(JSON.stringify(body), { status: 422, headers: { ...headers, 'Content-Type': 'application/json' }, });
  ```
- **cancel(reason)** — `supabase/functions/_shared/edge-observability.ts`
  ```
  registrar('cancel', typeof reason === 'string' ? reason : undefined); // Cancela o reader (e não a origem direta): a mesma referência usada // pelo pull é liberada e propaga o cancelamento ao produtor. void reader.cancel(reason);
  ```
- **generateGeneralInvalidPayloads()** — `supabase/functions/_shared/fuzzer.ts`
  ```
  return [ {}, // Empty { unexpected_field: 'malicious_data' }, // Unknown field null, undefined, 'not-even-an-object', Array(100).fill('garbage'), // Large array { id: 'not-a-uuid' }, // Invalid format { amount: 'not-a-number' }, // Invalid type { data: "<script>alert('xss')</script>" }, // Injection attempt { data: "' OR '1'='1" }, // SQLi attempt { payload: 'A'.repeat(10000) }, // Large payload ];
  ```
- **generateSchemaSpecificInvalidPayloads(schema: ZodAnyObject)** — `supabase/functions/_shared/fuzzer.ts`
  ```
  const shape = schema.shape as Record<string, ZodAnyField>; const payloads: FuzzPayload[] = []; // 1. Missing required fields for (const key of Object.keys(shape)) { const payload: Record<string, unknown> = {}; for (const otherKey of Object.keys(shape)) { if (otherKey !== key) { payload[otherKey] = this.getSampleValidValue(shape[otherKey]); } } payloads.push(payload); } // 2. Wrong types for fields for (const key of Object.keys(shape)) { const payload: Record<string, unknown> = {}; for (const k o …
  ```
- **validarZipDiretorioCompleto(nome: string, entradas: string[])** — `supabase/functions/_shared/magic-bytes.ts`
  ```
  if (entradas.some((e) => e === 'META-INF/MANIFEST.MF' || e.endsWith('.class'))) { return `${nome}: zip com estrutura de executável Java não é permitido`; } return null;
  ```
- **validarMagicBytesServidor(nome: string, head: Uint8Array)** — `supabase/functions/_shared/magic-bytes.ts`
  ```
  const tipo = detectarTipo(head); if (EXECUTAVEIS.has(tipo)) { return `${nome}: conteúdo executável não é permitido em uploads`; } const ext = nome.split('.').pop()?.toLowerCase() ?? ''; if (EXTENSOES_BLOQUEADAS.has(ext)) { return `${nome}: extensão .${ext} não é permitida em uploads`; } const esperados = EXTENSAO_PARA_TIPOS[ext]; if (esperados && !esperados.includes(tipo)) { return `${nome}: conteúdo (${tipo}) não corresponde à extensão .${ext}`; } if (tipo === 'zip') { const entradas = entradas …
  ```
- **validarChamadasSelect(statement: string)** — `supabase/functions/_shared/sql-write-guard.ts`
  ```
  let alvo = statement; const idxSelect = encontrarKeywordNoNivelSuperior(statement, 'select'); if (idxSelect >= 0) { alvo = statement.slice(idxSelect); } for (const chamada of extrairChamadasDeFuncao(alvo)) { if (chamada.nome === 'pg_sleep') { return 'Função pg_sleep não é permitida no MCP'; } if (chamada.schema && chamada.schema !== 'pg_catalog') { return `Função ${chamada.schema}.${chamada.nome} não está allowlisted para SELECT no MCP`; } const allowlisted = FUNCOES_SELECT_ALLOWLIST.has(chamada …
  ```
- **validarWhereEstrito(statementOriginal: string, statementNormalizado: string)** — `supabase/functions/_shared/sql-write-guard.ts`
  ```
  const where = extrairFaixaWhere(statementOriginal, statementNormalizado); if (!where) return 'Escrita sem WHERE'; if (!where.normalizado) return 'Escrita sem WHERE'; if (/\bor\b/i.test(where.normalizado)) { return 'WHERE com OR exige allow_all_rows:true'; } if (/\b(select|exists)\b/i.test(where.normalizado)) { return 'Subconsulta em escrita exige allow_all_rows:true'; } if (ehTautologia(where.normalizado)) return 'WHERE tautológico'; const termos = separarNoNivelSuperiorComFaixas(where.normaliza …
  ```
- **validarEscritaEscopada(sql: string)** — `supabase/functions/_shared/sql-write-guard.ts`
  ```
  const analise = analisarSqlMcp(sql); if (analise.motivoBloqueio) return analise.motivoBloqueio; if (!analise.escrita) return null; const statement = sql.trim().replace(/;\s*$/, ''); if (analise.comando === 'insert') { if (encontrarKeywordNoNivelSuperior(analise.sqlNormalizado, 'select') < 0) { return null; } const motivoWhere = validarWhereEstrito(statement, analise.sqlNormalizado); if (motivoWhere) { return 'INSERT ... SELECT amplo exige allow_all_rows:true'; } return null; } const motivoWhere …
  ```
- **calcularRBT12(hist: FaturamentoMes[], ano: number, mes: number)** — `supabase/functions/_shared/tributario-logic.ts`
  ```
  if (!hist?.length) return 0; const ord = [...hist].sort((a, b) => (a.ano !== b.ano ? b.ano - a.ano : b.mes - a.mes)); const ant = ord.filter((f) => f.ano < ano || (f.ano === ano && f.mes < mes)); if (!ant.length) return 0; const u12 = ant.slice(0, 12); const soma = u12.reduce((a, f) => a + (f.receita_bruta || 0), 0); return u12.length < 12 ? (soma / u12.length) * 12 : soma;
  ```
- **calcularFolha12m(hist: FolhaMes[], ano: number, mes: number)** — `supabase/functions/_shared/tributario-logic.ts`
  ```
  if (!hist?.length) return 0; const ord = [...hist].sort((a, b) => (a.ano !== b.ano ? b.ano - a.ano : b.mes - a.mes)); const ant = ord.filter((f) => f.ano < ano || (f.ano === ano && f.mes < mes)); const u12 = ant.slice(0, 12); const soma = u12.reduce((a, f) => a + (f.total_folha || 0), 0); return u12.length < 12 && u12.length > 0 ? (soma / u12.length) * 12 : soma;
  ```
- **round1(v: number)** — `supabase/functions/_shared/obrigacoes/alertas.ts`
  ```
  Math.round(v * 10) / 10;
  ```
- **round2(v: number)** — `supabase/functions/_shared/obrigacoes/alertas.ts`
  ```
  Math.round(v * 100) / 100;
  ```
- **calcularPrazo(obrigacao: Obrigacao, competencia: string)** — `supabase/functions/_shared/obrigacoes/calendario.ts`
  ```
  const regra = obrigacao.regra; if (regra.tipo === 'dia_fixo_anual') { const ano = Number(/^(\d{4})/.exec(competencia.trim())?.[1]); if (!Number.isFinite(ano)) throw new Error(`Exercício inválido: "${competencia}"`); return toISO(ultimoDiaUtil(ano + 1, regra.mes)); } const [ano, mes] = parsePeriodo(competencia); const alvoMes = mes + regra.mesesApos; // 1-based, pode extrapolar 12 const anoAlvo = ano + Math.floor((alvoMes - 1) / 12); const mesAlvo = ((alvoMes - 1) % 12) + 1; if (regra.tipo === 'e …
  ```
- **gerarCalendario(params: GerarCalendarioParams)** — `supabase/functions/_shared/obrigacoes/calendario.ts`
  ```
  const { competencias, regime, hoje, entregues, somente } = params; const filtro = somente ? new Set(somente) : null; const itens: ItemCalendario[] = []; const vistos = new Set<string>(); for (const obrigacao of OBRIGACOES) { if (filtro && !filtro.has(obrigacao.id)) continue; const aplicavel = regime === 'todos' || obrigacao.regimes.includes('todos') || obrigacao.regimes.includes(regime); if (!aplicavel) continue; for (const competencia of competencias) { if (!/^\d{4}-\d{2}$/.test(competencia)) c …
  ```
- **calcularMultaAtraso(params: { readonly obrigacaoId: string; readonly prazo: string; readonly dataEntrega: string; /** Faturamento do período)** — `supabase/functions/_shared/obrigacoes/calendario.ts`
  ```
  const obrigacao = buscarObrigacao(params.obrigacaoId); if (!obrigacao) throw new Error(`Obrigação desconhecida: ${params.obrigacaoId}`); const diasAtraso = Math.max(0, diasEntre(params.prazo, params.dataEntrega)); if (diasAtraso === 0) { return { diasAtraso: 0, mesesAtraso: 0, percentual: 0, valorCalculado: 0, valorDevido: 0, aplicouPiso: false, aplicouTeto: false, }; } const mesesAtraso = Math.ceil(diasAtraso / 30); const base = Math.max(0, params.baseCalculo ?? 0); if (obrigacao.baseMulta === …
  ```
- **round1(v: number)** — `supabase/functions/_shared/obrigacoes/conformidade.ts`
  ```
  Math.round(v * 10) / 10;
  ```
- **round2(v: number)** — `supabase/functions/_shared/obrigacoes/conformidade.ts`
  ```
  Math.round(v * 100) / 100;
  ```
- **calcularConformidade(itens: readonly ItemCalendario[], registros: readonly RegistroEntrega[] = [])** — `supabase/functions/_shared/obrigacoes/conformidade.ts`
  ```
  const indice = new Map<string, RegistroEntrega>(); for (const r of registros) indice.set(chave(r.obrigacaoId, r.competencia), r); let entregues = 0; let dispensadas = 0; let retificadas = 0; let entreguesComAtraso = 0; let vencidasPendentes = 0; let venceHoje = 0; let pendentesNoPrazo = 0; let multaRegistrada = 0; let pesoObtido = 0; const porOrgao = new Map<Orgao, { total: number; vencidas: number; peso: number }>(); const criticos: ItemCalendario[] = []; for (const item of itens) { const regis …
  ```
- **round2(v: number)** — `supabase/functions/_shared/obrigacoes/dias-uteis.ts`
  ```
  return Math.round((v + Number.EPSILON) * 100) / 100;
  ```
- **emailValido(valor: unknown)** — `supabase/functions/_shared/obrigacoes/preferencias-digest.ts`
  ```
  if (typeof valor !== 'string') return ''; const limpo = valor.trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo) ? limpo : '';
  ```
- **gerarAnaliseFallback(dados: DadosFluxo)** — `supabase/functions/analise-fluxo-ia/index.ts`
  ```
  const insights: Insight[] = []; const acoes: string[] = []; let score = 70; // Análise de cobertura if (dados.dias_cobertura < 7) { insights.push({ tipo: 'alerta', titulo: 'Cobertura de Caixa Crítica', descricao: `Apenas ${dados.dias_cobertura} dias de cobertura. Risco alto de ruptura de caixa.`, impacto: 'Pode comprometer operações essenciais', prioridade: 'alta', }); acoes.push('Antecipar recebíveis com desconto ou negociar linha de crédito emergencial'); score -= 25; } else if (dados.dias_cob …
  ```
- **gerarChaveApi()** — `supabase/functions/api-keys-manage/index.ts`
  ```
  const bytes = crypto.getRandomValues(new Uint8Array(32)); return `pfv2_${bytesParaBase64Url(bytes)}`;
  ```
- **calcularEmpresa(client: ReturnType<typeof createClient>, empresaId: string | null)** — `supabase/functions/calcular-health-score-operacional/index.ts`
  ```
  // 1) Tributário: % apurações com status finalizado nos últimos 3 meses let scoreTrib = 50; try { const { data: aps } = await client .from('apuracoes_tributarias') .select('status') .eq('empresa_id', empresaId) .gte( 'competencia', new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().slice(0, 10) ); if (aps && aps.length > 0) { const ok = aps.filter((a: { status: string | null }) => a.status === 'finalizado').length; scoreTrib = clamp((ok / aps.length) * 100); } else { scoreTri …
  ```
- **gerarInsightsIA(score: Record<string, number>)** — `supabase/functions/calcular-health-score-operacional/index.ts`
  ```
  const apiKey = Deno.env.get('LOVABLE_API_KEY'); if (!apiKey) return '_IA indisponível._'; try { const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', }, body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: [ { role: 'system', content: 'Você é consultor financeiro/tributário sênior. Gere 3 insights priorizados em markdown (use ✅/⚠️/🚨), curtos e acionáveis em p …
  ```
- **calcularProximoEnvio(freq: Agendamento['frequencia'], dia: number)** — `supabase/functions/enviar-relatorios-tributarios-agendados/index.ts`
  ```
  const d = new Date(); d.setUTCHours(6, 0, 0, 0); if (freq === 'mensal') d.setUTCMonth(d.getUTCMonth() + 1); else if (freq === 'trimestral') d.setUTCMonth(d.getUTCMonth() + 3); else d.setUTCFullYear(d.getUTCFullYear() + 1); d.setUTCDate(Math.min(dia, 28)); return d.toISOString();
  ```
- **gerarPdf(payload: Record<string, unknown>, empresa: string, ano: number)** — `supabase/functions/enviar-relatorios-tributarios-agendados/index.ts`
  ```
  const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica); const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold); const page = pdf.addPage([595, 842]); const { height } = page.getSize(); let y = height - 60; page.drawText('Relatório Anual Tributário', { x: 50, y, size: 22, font: fontBold, color: rgb(0.1, 0.2, 0.5), }); y -= 30; page.drawText(`${empresa} · Ano ${ano}`, { x: 50, y, size: 12, font, color: rgb(0.3, 0.3, 0.3) }); y -= 40; const kpis …
  ```
- **gerarDadosRelatorio(supabase: any, relatorio: any)** — `supabase/functions/executar-relatorios/index.ts`
  ```
  const empresaFilter = relatorio.empresa_id; const centroCustoFilter = relatorio.centro_custo_id; switch (relatorio.tipo_relatorio) { case 'fluxo_caixa': return await gerarFluxoCaixa(supabase, empresaFilter); case 'contas_pagar': return await gerarContasPagar(supabase, empresaFilter, centroCustoFilter); case 'contas_receber': return await gerarContasReceber(supabase, empresaFilter, centroCustoFilter); case 'dre': return await gerarDRE(supabase, empresaFilter); case 'balanco': return await gerarBa …
  ```
- **gerarFluxoCaixa(supabase: any, empresaId: string | null)** — `supabase/functions/executar-relatorios/index.ts`
  ```
  const hoje = new Date(); const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]; const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]; let queryReceber = supabase .from('contas_receber') .select('valor, valor_recebido, status, data_vencimento') .gte('data_vencimento', inicioMes) .lte('data_vencimento', fimMes); let queryPagar = supabase .from('contas_pagar') .select('valor, valor_pago, status, data_vencimento') .g …
  ```
- **gerarContasPagar(supabase: any, empresaId: string | null, centroCustoId: string | null)** — `supabase/functions/executar-relatorios/index.ts`
  ```
  let query = supabase .from('contas_pagar') .select( 'id, descricao, fornecedor_nome, valor, valor_pago, status, data_vencimento, data_pagamento' ) .order('data_vencimento', { ascending: true }) .limit(100); if (empresaId) query = query.eq('empresa_id', empresaId); if (centroCustoId) query = query.eq('centro_custo_id', centroCustoId); const { data, error } = await query; if (error) throw error; const resumo = { total: data?.length || 0, valor_total: data?.reduce((acc: number, c: any) => acc + Num …
  ```
- **gerarContasReceber(supabase: any, empresaId: string | null, centroCustoId: string | null)** — `supabase/functions/executar-relatorios/index.ts`
  ```
  let query = supabase .from('contas_receber') .select( 'id, descricao, cliente_nome, valor, valor_recebido, status, data_vencimento, data_recebimento' ) .order('data_vencimento', { ascending: true }) .limit(100); if (empresaId) query = query.eq('empresa_id', empresaId); if (centroCustoId) query = query.eq('centro_custo_id', centroCustoId); const { data, error } = await query; if (error) throw error; const resumo = { total: data?.length || 0, valor_total: data?.reduce((acc: number, c: any) => acc …
  ```
- **gerarDRE(supabase: any, empresaId: string | null)** — `supabase/functions/executar-relatorios/index.ts`
  ```
  const hoje = new Date(); const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]; const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]; let queryReceber = supabase .from('contas_receber') .select('valor_recebido') .eq('status', 'pago') .gte('data_recebimento', inicioMes) .lte('data_recebimento', fimMes); let queryPagar = supabase .from('contas_pagar') .select('valor_pago') .eq('status', 'pago') .gte('data_pagamento …
  ```
- **gerarBalanco(supabase: any, empresaId: string | null)** — `supabase/functions/executar-relatorios/index.ts`
  ```
  let queryContas = supabase.from('contas_bancarias').select('saldo_atual, saldo_disponivel'); let queryReceber = supabase .from('contas_receber') // 'vencido' incluido: um recebivel em atraso continua sendo ativo circulante. // A rotina marcar_contas_vencidas() passa 'pendente' -> 'vencido' no vencimento. .select('valor, valor_recebido') .in('status', ['pendente', 'vencido', 'parcial']); let queryPagar = supabase .from('contas_pagar') // 'vencido' incluido: uma divida em atraso continua sendo pas …
  ```
- **gerarInadimplencia(supabase: any, empresaId: string | null)** — `supabase/functions/executar-relatorios/index.ts`
  ```
  const hoje = new Date().toISOString().split('T')[0]; let query = supabase .from('contas_receber') .select('id, cliente_nome, valor, valor_recebido, data_vencimento, status') .eq('status', 'vencido') .lt('data_vencimento', hoje); if (empresaId) query = query.eq('empresa_id', empresaId); const { data: vencidos, error } = await query; if (error) throw error; let queryTotal = supabase.from('contas_receber').select('valor'); if (empresaId) queryTotal = queryTotal.eq('empresa_id', empresaId); const { …
  ```
- **calcularProximoEnvio(frequencia: string, hora: string, diaSemana: number | null, diaMes: number | null)** — `supabase/functions/executar-relatorios/index.ts`
  ```
  const agora = new Date(); const [horas, minutos] = hora.split(':').map(Number); let proximo = new Date(agora); proximo.setHours(horas, minutos, 0, 0); // Sempre avançar para o próximo período switch (frequencia) { case 'diario': proximo.setDate(proximo.getDate() + 1); break; case 'semanal': proximo.setDate(proximo.getDate() + 7); if (diaSemana !== null) { const diaAtual = proximo.getDay(); const diff = (diaSemana - diaAtual + 7) % 7; proximo.setDate(proximo.getDate() + diff); } break; case 'mens …
  ```
- **valorDoRegistro(linhas: string[], tipo: string)** — `supabase/functions/exportar-sped-contribuicoes/layout_test.ts`
  ```
  const linha = linhas.find((l) => l.startsWith(`|${tipo}|`)); if (!linha) throw new Error(`registro ${tipo} não encontrado`); return linha.split('|')[2];
  ```
- **validateExternalDataContract()** — `supabase/functions/external-data/validate_contract.ts`
  ```
  const url = Deno.env.get('SUPABASE_URL'); const anonKey = Deno.env.get('SUPABASE_ANON_KEY'); if (!url || !anonKey) { console.warn('⚠️ Ambiente local incompleto. Pulando validação de contrato real.'); return; } console.log('🧪 Iniciando validação de contrato: external-data...'); try { const supabase = createClient(url, anonKey); // Testa o comportamento de fallback (sem auth real ou sem config externa) const { data, error } = await supabase.functions.invoke('external-data', { method: 'GET', query_ …
  ```
- **gerarResumoEmpresa(supabase: any, LOVABLE_API_KEY: string, empresaId: string, semanaInicio: string, semanaFim: string)** — `supabase/functions/gerar-resumo-executivo-semanal/index.ts`
  ```
  // semanaFimExclusive = dia seguinte a semanaFim, para incluir o dia // inteiro de semanaFim nos filtros de created_at (timestamptz). const semanaFimExclusive = new Date(semanaFim + 'T00:00:00Z'); semanaFimExclusive.setUTCDate(semanaFimExclusive.getUTCDate() + 1); const semanaFimExclusiveIso = semanaFimExclusive.toISOString(); // Agrega KPIs últimos 7 dias const { data: receitas, error: errReceitas } = await supabase .from('contas_receber') .select('valor') .eq('empresa_id', empresaId) .gte('dat …
  ```
- **calcularApuracaoEcf(input: Pick<EcfInput, 'plano' | 'lancamentos'>)** — `supabase/functions/gerar-sped-ecf/layout.ts`
  ```
  const { plano, lancamentos } = input; const naturezaDe = (cid: string) => plano.find((c) => c.id === cid)?.natureza; const receitas = lancamentos .flatMap((l) => l.partidas) .filter((p) => naturezaDe(p.conta_id) === 'receita') .reduce((s, p) => s + (p.tipo === 'C' ? Number(p.valor) : -Number(p.valor)), 0); const despesas = lancamentos .flatMap((l) => l.partidas) .filter((p) => naturezaDe(p.conta_id) === 'despesa') .reduce((s, p) => s + (p.tipo === 'D' ? Number(p.valor) : -Number(p.valor)), 0); c …
  ```
- **validarCargaBase64(payload: string, maxBytes: number, label: string)** — `supabase/functions/mcp-query/index.ts`
  ```
  if (medirBytes(payload) > maxBytes) { return `${label} excede o limite de ${maxBytes} bytes codificados`; } return null;
  ```
- **validarAdminPath(path: string)** — `supabase/functions/mcp-query/index.ts`
  ```
  if (!ADMIN_PATH.test(path)) { return 'admin.path deve começar com storage/v1/ ou auth/v1/'; } if (path.includes('\\') || path.includes('%')) { return 'admin.path contém caracteres não permitidos'; } const segmentos = path.split('/'); if (segmentos.some((segmento) => segmento === '' || segmento === '.' || segmento === '..')) { return 'admin.path contém segmentos inválidos'; } return null;
  ```
- **validarAdminMetodoERota(path: string, method: string)** — `supabase/functions/mcp-query/index.ts`
  ```
  const permitido = ADMIN_ALLOWLIST.some( (entrada) => entrada.method === method && entrada.pattern.test(path) ); return permitido ? null : 'admin.path/admin.method fora da allowlist do MCP';
  ```
- **validarContratoAdmin(path: string, method: string, payload: unknown)** — `supabase/functions/mcp-query/index.ts`
  ```
  if (method === 'DELETE' && /^storage\/v1\/object\/[a-z0-9._-]+$/i.test(path)) { if ( !payload || typeof payload !== 'object' || Array.isArray(payload) || !('prefixes' in payload) ) { return 'admin.body deve conter { prefixes: string[] } para DELETE storage/v1/object/<bucket>'; } const prefixes = (payload as Record<string, unknown>).prefixes; if ( !Array.isArray(prefixes) || prefixes.length === 0 || !prefixes.every((prefix) => typeof prefix === 'string' && prefix.trim().length > 0) ) { return 'ad …
  ```
- **validarModo(body: z.infer<typeof RequestSchema>)** — `supabase/functions/mcp-query/index.ts`
  ```
  const temAdmin = body.admin !== undefined; const temTransacao = body.stmts_b64 !== undefined; const temSql = body.sql !== undefined; const temSqlB64 = body.sql_b64 !== undefined; if (Number(temSql) + Number(temSqlB64) > 1) { return 'sql e sql_b64 são mutuamente exclusivos'; } const modos = Number(temAdmin) + Number(temTransacao) + Number(temSql || temSqlB64); if (modos !== 1) { return 'request deve informar exatamente um modo: admin, stmts_b64 ou sql/sql_b64'; } return null;
  ```
- **validarCargaTransacional(stmts: string[])** — `supabase/functions/mcp-query/index.ts`
  ```
  if (stmts.length > MAX_TRANSACTION_STATEMENTS) { return `transação excede o limite de ${MAX_TRANSACTION_STATEMENTS} statements`; } const totalBytes = stmts.reduce((acc, stmt) => acc + medirBytes(stmt), 0); if (totalBytes > MAX_TRANSACTION_BYTES) { return `transação excede o limite de ${MAX_TRANSACTION_BYTES} bytes`; } if (stmts.every((stmt) => stmt.trim().length === 0)) { return 'transação deve conter ao menos um statement não vazio'; } return null;
  ```
- **aplicarLimitePadrao(sql: string, limiteSeguro: number)** — `supabase/functions/mcp-query/sql-policy.ts`
  ```
  const analise = analisarSqlMcp(sql); if (!analise.somenteLeitura) return sql; const semPontoEVirgula = sql.replace(/;\s*$/, ''); return `SELECT * FROM (${semPontoEVirgula}) AS __mcp_limited LIMIT ${limiteSeguro}`;
  ```
- **applyPatchOps(ops: any[])** — `supabase/functions/scim-server/index.ts`
  ```
  const out: UserPatchResult = { empresaUpdates: {}, profileUpdates: {}, newRoleHint: null, newEmail: null, invalidPath: null, invalidOp: null, }; for (const op of ops || []) { const action = String(op?.op || '').toLowerCase(); if (!['add', 'replace', 'remove'].includes(action)) { out.invalidOp = op?.op ?? '(missing)'; return out; } const rawPath = String(op?.path ?? ''); const normalized = normalizePath(rawPath); const path = normalized.toLowerCase(); const value = op?.value; // ---------- PATCH …
  ```
- **applyMemberRole(admin: SupabaseClient, empresaId: string, linkId: string, role: AppRole)** — `supabase/functions/scim-server/index.ts`
  ```
  const { data: link } = await admin .from('user_empresas') .select('user_id') .eq('id', linkId) .eq('empresa_id', empresaId) .maybeSingle(); if (!link) return; await admin.from('user_empresas').update({ role }).eq('id', linkId); await syncUserRole(admin, link.user_id as string, role);
  ```
- **applyOutcome(cursor: CursorState, outcome: PullOutcome, now: number)** — `supabase/functions/sefaz-dfe-dispatcher/policy.ts`
  ```
  if (outcome.kind === 'success') { return { ...cursor, retry_count: 0, next_run_at: now + BASE_INTERVAL_MS, last_error_at: cursor.last_error_at, circuit_open: false, ultima_consulta: now, }; } // Falha neutra: só marca consulta, não penaliza o CNPJ. if (outcome.neutral) { return { ...cursor, ultima_consulta: now }; } const retry = cursor.retry_count + 1; const shouldOpen = retry >= CIRCUIT_OPEN_THRESHOLD; return { ...cursor, retry_count: retry, next_run_at: now + backoffMs(retry), last_error_at: …
  ```
- **isEligible(cursor: CursorState, now: number)** — `supabase/functions/sefaz-dfe-dispatcher/policy.ts`
  ```
  if (cursor.circuit_open) return false; if (cursor.next_run_at > now) return false; return true;
  ```
- **applyBatchTransactional(admin: SupabaseClient, cert: CertificadoRow, novoNsu: number, maxNsu: number, status: string, erro: string | null, docs:)** — `supabase/functions/sefaz-dfe-puxar/index.ts`
  ```
  novos: number; eventos: number; ignorados: number; cursor_depois: number
  ```
- **generateVapidAuthHeader(endpoint: string, vapidPublicKey: string, vapidPrivateKey: string, subject: string)** — `supabase/functions/send-push-notification/index.ts`
  ```
  authorization: string; cryptoKey: string
  ```
- **gerarPromptMensagem(alerta: AlertaProativo)** — `supabase/functions/whatsapp-ia-proativo/index.ts`
  ```
  const dados = alerta.dados; switch (alerta.tipo) { case 'vencimento': return `Gere uma mensagem de lembrete amigável para ${alerta.cliente_nome} sobre uma conta de R$ ${dados.valor} que vence em ${dados.vencimento}. Ofereça ajuda caso precise de boleto ou outras formas de pagamento.`; case 'inadimplencia': return `Gere uma mensagem cordial de cobrança para ${alerta.cliente_nome} sobre uma conta de R$ ${dados.valor} vencida há ${dados.dias_atraso} dias. Ofereça opções de negociação e parcelamento …
  ```
- **gerarMensagemFallback(alerta: AlertaProativo)** — `supabase/functions/whatsapp-ia-proativo/index.ts`
  ```
  const dados = alerta.dados; switch (alerta.tipo) { case 'vencimento': return `Olá ${alerta.cliente_nome}! Lembrando que sua conta de R$ ${dados.valor} vence em ${dados.vencimento}. Precisa de boleto atualizado? Estamos à disposição!`; case 'inadimplencia': return `Olá ${alerta.cliente_nome}! Identificamos uma pendência de R$ ${dados.valor}. Podemos ajudar com opções de pagamento? Entre em contato conosco.`; default: return `Olá ${alerta.cliente_nome}! Entre em contato conosco para mais informaçõ …
  ```

### G.4 Percentuais e multiplicadores no código

| Trecho | Arquivo |
|---|---|
| `* Onda 1 da promoção. Cada spec listada aqui roda 100% offline — qualquer` | `playwright.financeiro.config.ts` |
| `// 71,76% linhas / 70,58% statements / 63,57% funções / 64,70% branches.` | `vitest.config.ts` |
| `// Os pisos anteriores (6/6/18/50) vinham de uma medição de ~6,8% que há` | `vitest.config.ts` |
| `// muito deixou de valer: a cobertura podia despencar de 71% para 7% sem` | `vitest.config.ts` |
| `transition={{ delay: i * 0.05 }}` | `src/components/admin/sso/SSOProvidersList.tsx` |
| `transition={{ delay: 0.3 + i * 0.1 }}` | `src/components/alertas/AlertaComponents.tsx` |
| `<span>-2.4% vs mês anterior</span>` | `src/components/analytics/InadimplenciaKpis.tsx` |
| `Estimado via IA (72% de confiança)` | `src/components/analytics/InadimplenciaKpis.tsx` |
| `{formatCurrency((totaisRamo?.valor_vencido \|\| 0) * 0.72)}` | `src/components/analytics/InadimplenciaKpis.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/analytics/InadimplenciaSegmentada.tsx` |
| `O setor de "Construção Civil" apresentou um aumento de 15% na propensão de atraso` | `src/components/analytics/PredicaoTab.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/analytics/PredicaoTab.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/aprovacoes/AprovacoesPendentes.tsx` |
| `transition={{ delay: index * 0.03 }}` | `src/components/aprovacoes/HistoricoAprovacoes.tsx` |
| `transition={{ delay: 0.7 + i * 0.1, type: 'spring' }}` | `src/components/auth/AuthBackground.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/bi/BIEmpresasTab.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/boletos/BoletoHistorico.tsx` |
| `transition={{ delay: idx * 0.02 }}` | `src/components/clientes/ScoringClientesPanel.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/cobranca/MetricasPorCanal.tsx` |
| `economia: valorTotal * 0.08,` | `src/components/cobranca/NegociacaoIA.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/cobranca/NegociacaoIA.tsx` |
| `valorProposto: valorTotal * 0.92,` | `src/components/cobranca/NegociacaoIA.tsx` |
| `clientesMedioRisco.reduce((sum, c) => sum + c.totalPendente, 0) * 0.5,` | `src/components/cobranca/PrevisaoInadimplencia.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/cobranca/ReguaCobrancaVisual.tsx` |
| `transition={{ delay: idx * 0.05 }}` | `src/components/cobranca/WhatsAppProativoPanel.tsx` |
| `const isCloseMatch = valorDiff < transacao.valor * 0.05;` | `src/components/conciliacao/ConciliacaoManualDialog.tsx` |
| `≥80%. Esta ação conciliará automaticamente as transações selecionadas.` | `src/components/conciliacao/ia/AprovarTodosDialog.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/configuracoes/RegrasRoteamentoTab.tsx` |
| `<AlertTitle>Plano de contas 100% conforme!</AlertTitle>` | `src/components/contabilidade/AuditoriaCFCPanel.tsx` |
| `transition={{ delay: idx * 0.005 }}` | `src/components/contabilidade/LancamentosTabConteudo.tsx` |
| `transition={{ delay: idx * 0.005 }}` | `src/components/contabilidade/PlanoContasTabConteudo.tsx` |
| `transition={{ delay: idx * 0.05 }}` | `src/components/contabilidade/PreValidacaoSpedPanel.tsx` |
| `transition={{ delay: idx * 0.005 }}` | `src/components/contabilidade/VerificacaoIntegracoesPanel.tsx` |
| `transition={{ delay: idx * 0.05 }}` | `src/components/contabilidade/VerificacaoIntegracoesPanelConteudo.tsx` |
| `transition={{ delay: index * 0.02 }}` | `src/components/contabilidade/dre-balanco/BalancoView.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/contabilidade/dre-balanco/DreView.tsx` |
| `transition={{ delay: (i % 20) * 0.005 }}` | `src/components/contabilidade/razao-diario/DiarioTable.tsx` |
| `transition={{ delay: (idx % 10) * 0.05 }}` | `src/components/contabilidade/razao-diario/RazaoList.tsx` |
| `transition={{ delay: i * 0.03, duration: 0.2 }}` | `src/components/contabilidade/sped-ecf-wizard/Step3DownloadParts.tsx` |
| `transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}` | `src/components/contas-pagar/ContasPagarKPIs.tsx` |
| `jurosMensal?: number; // default 1% ao mês` | `src/components/contas-receber/CalculadoraJurosMulta.tsx` |
| `multaPercentual?: number; // default 2%` | `src/components/contas-receber/CalculadoraJurosMulta.tsx` |
| `transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}` | `src/components/contas-receber/ContasReceberKPIs.tsx` |
| `transition={{ delay: i * 0.05 }}` | `src/components/contas-receber/ContasReceberKanban.tsx` |
| `transition: { delay: index * 0.02 },` | `src/components/contas-receber/ContasReceberTableRow.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/dashboard/AlertasPreditivosPanel.tsx` |
| `transition={{ delay: idx * 0.05 }}` | `src/components/dashboard/CentroAcoesInteligentes.tsx` |
| `transition={{ delay: 0.2 + i * 0.05 }}` | `src/components/dashboard/DashboardSkeleton.tsx` |
| `transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: 'easeOut' }}` | `src/components/dashboard/DashboardSkeleton.tsx` |
| `transition={{ delay: index * 0.1, duration: 0.5 }}` | `src/components/dashboard/DashboardSkeleton.tsx` |
| `transition={{ delay: i * 0.05 }}` | `src/components/dashboard/MetasFinanceirasPanel.tsx` |
| `transition={{ delay: index * 0.03 }}` | `src/components/dashboard/MetasFinanceirasPanel.tsx` |
| `transition={{ delay: idx * 0.05 }}` | `src/components/dashboard/PlanosAcaoPanel.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/dashboard/SaldoPorBancoCard.tsx` |
| `transition={{ delay: index * 0.05, duration: 0.4 }}` | `src/components/dashboard/SecondaryKPICards.tsx` |
| `transition={{ delay: index * 0.04 }}` | `src/components/dashboard/TopClientesLeaderboard.tsx` |
| `transition={{ delay: i * 0.1 }}` | `src/components/dashboard/previsao-ia/PrevisaoIAAlertas.tsx` |
| `transition={{ delay: i * 0.05 }}` | `src/components/dashboard/previsao-ia/PrevisaoIAProjecoes.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/dashboard-receber/ReceberCharts.tsx` |
| `transition={{ delay: idx * 0.04 }}` | `src/components/demonstrativos/BalancoDesequilibrioIndicator.tsx` |
| `delay: index * 0.01,` | `src/components/demonstrativos/BalancoPatrimonial.tsx` |
| `transition={{ duration: 1, delay: 0.5 + index * 0.01 }}` | `src/components/demonstrativos/BalancoPatrimonial.tsx` |
| `delay: index * 0.01,` | `src/components/demonstrativos/DREStatement.tsx` |
| `transition={{ duration: 1, delay: 0.5 + index * 0.01 }}` | `src/components/demonstrativos/DREStatement.tsx` |
| `delay: index * 0.01,` | `src/components/demonstrativos/FluxoCaixaContabil.tsx` |
| `RAT 1%, 2% ou 3% ajustado pelo FAP (0,5 a 2,0) — limite 6%.` | `src/components/empresas/EmpresaForm.tsx` |
| `Utilizados no cálculo de encargos patronais (CPP 20% + RAT/FAP + Terceiros) nas` | `src/components/empresas/EmpresaForm.tsx` |
| `transition={{ delay: 0.2 + index * 0.1 }}` | `src/components/expert/ExpertWelcomeScreen.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/expert/ExpertWelcomeScreen.tsx` |
| `// 'vencido', uma carteira 100% vencida deixa totalReceber em 0 e o guard` | `src/components/expert/ProactiveSuggestions.tsx` |
| `// antigo devolvia taxa 0% — suprimindo o alerta exatamente no pior caso,` | `src/components/expert/ProactiveSuggestions.tsx` |
| `// ja que ele so dispara acima de 10%.` | `src/components/expert/ProactiveSuggestions.tsx` |
| `if (vencimentosProximos.length >= 5 && totalVencimentosProximos > saldoAtual * 0.5) {` | `src/components/expert/ProactiveSuggestions.tsx` |
| `} else if (saldoProjetado < saldoAtual * 0.3) {` | `src/components/expert/ProactiveSuggestions.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/fluxo-caixa/AlertasRuptura.tsx` |
| `return { min: min * 0.9, max: max * 1.1 };` | `src/components/fluxo-caixa/GraficoCenarios.tsx` |
| `transition={{ delay: 0.3 + idx * 0.1 }}` | `src/components/fluxo-caixa/InsightsFluxoIA.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/fluxo-caixa/InsightsFluxoIA.tsx` |
| `transition={{ delay: index * 0.02 }}` | `src/components/fluxo-caixa/ProjecaoDiariaGrid.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/fluxo-caixa/ResumosCenarios.tsx` |
| `// Calcular variabilidade histórica (simulando com +/- 20% de variação)` | `src/components/fluxo-caixa/SimulacaoMonteCarlo.tsx` |
| `1.000 simulações com variação de ±20% nas receitas e ±15% nas despesas. O` | `src/components/fluxo-caixa/SimulacaoMonteCarlo.tsx` |
| `intervalo de confiança de 80% mostra a faixa entre os percentis 10 e 90.` | `src/components/fluxo-caixa/SimulacaoMonteCarlo.tsx` |
| `percentil10.push(saldosDia[Math.floor(numSimulacoes * 0.1)]);` | `src/components/fluxo-caixa/SimulacaoMonteCarlo.tsx` |
| `percentil50.push(saldosDia[Math.floor(numSimulacoes * 0.5)]);` | `src/components/fluxo-caixa/SimulacaoMonteCarlo.tsx` |
| `percentil90.push(saldosDia[Math.floor(numSimulacoes * 0.9)]);` | `src/components/fluxo-caixa/SimulacaoMonteCarlo.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/layout/KeyboardShortcutsDialog.tsx` |
| `transition={{ delay: idx * 0.03 }}` | `src/components/nfe/BlingNFePanel.tsx` |
| `transition={{ delay: index * 0.03 }}` | `src/components/nfe/EventosHistorico.tsx` |
| `// `null` enquanto nenhuma verificação real aconteceu: 100% seria uptime` | `src/components/nfe/SefazMonitor.tsx` |
| `// Sem evento nenhum no período, taxa e tempo não existem: exibir 0,0% de sucesso` | `src/components/nfe/sefaz-analytics/SefazAnalyticsKPIs.tsx` |
| `delay: Math.random() * 0.5,` | `src/components/onboarding/OnboardingChecklist.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/onboarding/OnboardingChecklist.tsx` |
| `transition={{ delay: i * 0.05 }}` | `src/components/orcamento/OrcamentoCardsView.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/pagamentos-recorrentes/PagamentosRecorrentesList.tsx` |
| `const isApproving = offsetX > SWIPE_THRESHOLD * 0.5;` | `src/components/pix-hub/AprovacaoRapidaMobile.tsx` |
| `const isRejecting = offsetX < -SWIPE_THRESHOLD * 0.5;` | `src/components/pix-hub/AprovacaoRapidaMobile.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/quick-create/QuickCreateModal.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/reforma-tributaria/AlertasTributarios.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/reforma-tributaria/CronogramaTransicao.tsx` |
| `transition={{ delay: 0.3 + i * 0.1 }}` | `src/components/reforma-tributaria/ProgressoMigracao.tsx` |
| `Limite de compensação: 30% do lucro real` | `src/components/reforma-tributaria/irpj-csll/IRPJCSLLCalculadora.tsx` |
| `Alíquota: {(aliquotaIRPJ * 100).toFixed(0)}% + 10% adicional` | `src/components/reforma-tributaria/irpj-csll/IRPJCSLLResumoCards.tsx` |
| `transition={{ delay: i * 0.1 }}` | `src/components/relatorios/InsightsIA.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/relatorios/RelatorioDrillLevels.tsx` |
| `transition={{ duration: 1, delay: 0.5 + i * 0.1 }}` | `src/components/relatorios/RelatoriosVisaoGeral.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/relatorios/agendados/AgendamentoCard.tsx` |
| `transition={{ delay: idx * 0.05 }}` | `src/components/simuladores/SimuladorAntecipacao.tsx` |
| `const sugestaoValor = Math.min(maior.saldo * 0.2, maior.saldo - menor.saldo);` | `src/components/tesouraria/FluxoInterEmpresas.tsx` |
| `if (maior.saldo > 0 && menor.saldo < maior.saldo * 0.1) {` | `src/components/tesouraria/FluxoInterEmpresas.tsx` |
| `atraso pontuam 60%.` | `src/components/tributario/ConformidadeCard.tsx` |
| `Regressão linear sobre o histórico, com banda de previsão de ~95%.` | `src/components/tributario/ProjecaoConformidadeCard.tsx` |
| `transition={{ delay: i * 0.05 }}` | `src/components/tributario/dashboard/AssistenteFechamentoMensal.tsx` |
| `// nenhum lancamento. A funcao devolvia 6.8% fixos justamente para evitar` | `src/components/tributario/dashboard/BenchmarkSetorialCard.tsx` |
| `transition={{ delay: i * 0.02 }}` | `src/components/tributario/dashboard/HeatmapTributarioAnual.tsx` |
| `folha_total_anual: p.kpis.faturamento_anual * 0.15,` | `src/components/tributario/relatorios/RelatorioAnualTributarioPDF.ts` |
| `lucro_liquido: p.kpis.faturamento_anual * 0.1,` | `src/components/tributario/relatorios/RelatorioAnualTributarioPDF.ts` |
| `patrimonio_liquido: p.kpis.faturamento_anual * 0.3,` | `src/components/tributario/relatorios/RelatorioAnualTributarioPDF.ts` |
| `trava dos 30% (Lei 9.065/95).` | `src/components/tributario/simulacao/LucroTrimestralFields.tsx` |
| `* atual em vez de degradar em silêncio para o piso de 1%.` | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `// transporte de cargas 8%/12%, passageiros 16%/12%, serviços em geral 32%.` | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `Compensação limitada a 30% do lucro do período (Lei 9.065/95, arts. 15 e 16).` | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `Compõe a CPP patronal (20% + RAT) recolhida fora do DAS no Anexo IV e a folha em` | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `INCRA, SEBRAE, Salário-Educação e Sistema S (padrão 5,8% — FPAS 507). Não se aplica ao` | `src/components/tributario/simulacao/ParametrosForm.tsx` |
| `transition={{ delay: i * 0.05 }}` | `src/components/ui/input.tsx` |
| `transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}` | `src/components/ui/micro-interactions.tsx` |
| `transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.4, delay: i * 0.15 }}` | `src/components/ui/micro-interactions.tsx` |
| `animationDelay: `${i * 0.1}s`,` | `src/components/ui/skeleton.tsx` |
| `transition={{ delay: 0.4 + i * 0.1 }}` | `src/components/ui/skeleton.tsx` |
| `transition={{ delay: fields * 0.1 }}` | `src/components/ui/skeleton.tsx` |
| `transition={{ delay: i * 0.08 }}` | `src/components/ui/skeleton.tsx` |
| `transition={{ delay: i * 0.1 }}` | `src/components/ui/skeleton.tsx` |
| `transition={{ delay: rowIndex * 0.05 }}` | `src/components/ui/skeleton.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/vendedores/VendedorDashboard.tsx` |
| `* 11,3%").` | `src/config/reforma-tributaria.ts` |
| `* 15/12/2026 (ADCT, EC 132/2023). O TCU calculou e publicou 11,3% como` | `src/config/reforma-tributaria.ts` |
| `.reduce((acc, d) => acc + d.valor * 0.02, 0); // 2% de desconto estimado` | `src/hooks/useAlertasPreditivos.ts` |
| `dados.saldoAtual > dados.despesasPrevistas.reduce((acc, d) => acc + d.valor, 0) * 0.5` | `src/hooks/useAlertasPreditivos.ts` |
| `impactoFinanceiro: (ap.total_geral \|\| 0) * 0.2,` | `src/hooks/useAuditoriaCompliance.ts` |
| `// Validação IP/Geo agora é feita 100% no servidor pela edge function` | `src/hooks/useAuthValidation.ts` |
| `// Estimativa conservadora de crédito ICMS 18% sobre compras` | `src/hooks/useCalculadoraDadosReais.ts` |
| `const creditoIcmsCompras = baseCompras * 0.18;` | `src/hooks/useCalculadoraDadosReais.ts` |
| `// CPP: 20% sobre folha` | `src/hooks/useComparativoRegimes.ts` |
| `// CSLL: 9%` | `src/hooks/useComparativoRegimes.ts` |
| `// CSLL: Base diferente (12% merc, 32% serv)` | `src/hooks/useComparativoRegimes.ts` |
| `// IRPJ: 15% + adicional` | `src/hooks/useComparativoRegimes.ts` |
| `// IRPJ: 15% + adicional 10% sobre excedente de R$ 240.000/ano` | `src/hooks/useComparativoRegimes.ts` |
| `// Presunção de lucro: 8% comércio/indústria, 32% serviços` | `src/hooks/useComparativoRegimes.ts` |
| `cofins: totalTributos * 0.112,` | `src/hooks/useComparativoRegimes.ts` |
| `const baseCSLLMerc = faturamentoMercadorias * 0.12;` | `src/hooks/useComparativoRegimes.ts` |
| `const baseCSLLServ = faturamentoServicos * 0.32;` | `src/hooks/useComparativoRegimes.ts` |
| `const basePresumidaMerc = faturamentoMercadorias * 0.08;` | `src/hooks/useComparativoRegimes.ts` |
| `const basePresumidaServ = faturamentoServicos * 0.32;` | `src/hooks/useComparativoRegimes.ts` |
| `const cofins = params.faturamentoAnual * 0.03 * (aliquotas.cofinsResidual / 100);` | `src/hooks/useComparativoRegimes.ts` |
| `const cofinsAntigo = params.faturamentoAnual * 0.076;` | `src/hooks/useComparativoRegimes.ts` |
| `const cpp = params.folhaPagamento * 0.2;` | `src/hooks/useComparativoRegimes.ts` |
| `const creditosPisCofins = (params.comprasCredito + params.servicosCredito) * 0.0925;` | `src/hooks/useComparativoRegimes.ts` |
| `diferenca: totalCreditosCBS - totalCBSEsperado * 0.5,` | `src/hooks/useConciliacaoTributaria.ts` |
| `if (totalCreditosCBS > 0 && Math.abs(totalCreditosCBS - totalCBSEsperado * 0.5) > 100) {` | `src/hooks/useConciliacaoTributaria.ts` |
| `valorEsperado: totalCBSEsperado * 0.5,` | `src/hooks/useConciliacaoTributaria.ts` |
| `// zero real por 95% do mês atual. ContasPagarKPIs.tsx:30 já exige` | `src/hooks/useContasPagarLogic.calculos.ts` |
| `// Sem `\|\| totalRecebidoMes * 0.95`: o fallback disparava exatamente quando` | `src/hooks/useContasReceberLogic.calculos.ts` |
| `// falsy), trocando o zero real por 95% do mês atual.` | `src/hooks/useContasReceberLogic.calculos.ts` |
| `// totalVencido * 1.1 fazia o cartão de vencidos mostrar sempre ≈ -9%,` | `src/hooks/useContasReceberLogic.calculos.ts` |
| `const deducoes = receitaBruta * 0.0925;` | `src/hooks/useDemonstrativosContabeis.ts` |
| `const irCs = lucroAntesIR > 0 ? lucroAntesIR * 0.15 : 0;` | `src/hooks/useDemonstrativosContabeis.ts` |
| `const obrTrib = cpPend * 0.1;` | `src/hooks/useDemonstrativosContabeis.ts` |
| `// Sem isto, uma carteira 100% vencida reportava inadimplencia 0% e` | `src/hooks/useExpertContext.ts` |
| `* do ano e variacao de -100% no mes seguinte.` | `src/hooks/useHeatmapTributario.ts` |
| `// IRPJ Adicional (10% sobre excedente)` | `src/hooks/useIRPJCSLL.ts` |
| `const limiteCompensacao = Math.max(0, lucroRealAntesComp * 0.3);` | `src/hooks/useIRPJCSLL.ts` |
| `// Aproximação da SELIC mensal (0.9% ao mês)` | `src/hooks/usePerDcomp.ts` |
| `const tolPct = receitaDre * 0.01; // 1% de tolerância para arredondamento e classificação` | `src/hooks/usePreValidacaoSped.ts` |
| `// Dados 100% reais (operacoes_tributaveis + apuracoes_tributarias)` | `src/hooks/useReformaTributaria.ts` |
| `cbs: 0.088, // 8.8% (alíquota padrão)` | `src/hooks/useRetencoesFonte.ts` |
| `csrf: 0.0465, // 4.65%` | `src/hooks/useRetencoesFonte.ts` |
| `ibs: 0.178, // 17.8% (alíquota padrão)` | `src/hooks/useRetencoesFonte.ts` |
| `inss: 0.11, // 11%` | `src/hooks/useRetencoesFonte.ts` |
| `irrf: 0.015, // 1.5%` | `src/hooks/useRetencoesFonte.ts` |
| `iss: 0.05, // 5% (varia por município)` | `src/hooks/useRetencoesFonte.ts` |
| `if (deltaX > threshold && deltaY < deltaX * 0.5 && elapsed < 500) {` | `src/hooks/useSwipeBack.ts` |
| `* o boot em 100% das sessões (regressão P0 corrigida em 2026-07).` | `src/integrations/supabase/client.ts` |
| `multiplicadorDespesas: 0.95, // -5% despesas` | `src/lib/cashflow-scenarios.ts` |
| `multiplicadorDespesas: 1.1, // +10% despesas` | `src/lib/cashflow-scenarios.ts` |
| `multiplicadorReceitas: 0.8, // -20% receitas` | `src/lib/cashflow-scenarios.ts` |
| `multiplicadorReceitas: 1.15, // +15% receitas` | `src/lib/cashflow-scenarios.ts` |
| `probabilidadeAtraso: 0.05, // 5% de atrasos` | `src/lib/cashflow-scenarios.ts` |
| `probabilidadeAtraso: 0.15, // 15% de atrasos` | `src/lib/cashflow-scenarios.ts` |
| `probabilidadeAtraso: 0.3, // 30% de atrasos` | `src/lib/cashflow-scenarios.ts` |
| `// Amostragem conservadora: captura 100% dos erros (não são muitos eventos` | `src/lib/error-tracking.ts` |
| `// num SPA interno), mas só 10% das transações de performance para não` | `src/lib/error-tracking.ts` |
| `/** Remove o checkpoint manualmente (ex.: ao concluir 100% com sucesso). */` | `src/lib/import-checkpoint.ts` |
| `if (parsed.total && total && Math.abs(parsed.total - total) > Math.max(5, total * 0.05)) {` | `src/lib/import-checkpoint.ts` |
| `* --border 35 18% 82% → #DAD2C7` | `src/lib/pdf-layout.ts` |
| `* --foreground 225 35% 8% → #0D1424` | `src/lib/pdf-layout.ts` |
| `* --muted-foreground 225 22% 38% → #4B5775` | `src/lib/pdf-layout.ts` |
| `* --primary 24 95% 46% → #E66A0A (laranja)` | `src/lib/pdf-layout.ts` |
| `* --secondary 215 90% 42% → #0B5FCB (azul)` | `src/lib/pdf-layout.ts` |
| `} else if (rejeicoesUltimaHora < rejeicoesHoraAnterior * 0.5) {` | `src/lib/sefaz-rejection-monitor.ts` |
| `gainNode.gain.linearRampToValueAtTime(config.volume * 0.3, startTime + 0.01);` | `src/lib/sound-feedback.ts` |
| `// existe mais na tabela. Falha 100% das vezes, em toda linha.` | `src/lib/supabase-write.ts` |
| `particleCount: Math.floor(config.particleCount! * 0.5),` | `src/lib/toast-confetti.tsx` |
| `// de fato" (cota zero do rateio de acordo com 100% de desconto ou` | `src/lib/financeiro/valor-recebido-efetivo.ts` |
| `ibsMun: (REF_IBS * 0.1) / 2,` | `src/lib/reforma-tributaria/cronograma-oficial.ts` |
| `ibsMun: (REF_IBS * 0.2) / 2,` | `src/lib/reforma-tributaria/cronograma-oficial.ts` |
| `ibsMun: (REF_IBS * 0.3) / 2,` | `src/lib/reforma-tributaria/cronograma-oficial.ts` |
| `ibsMun: (REF_IBS * 0.4) / 2,` | `src/lib/reforma-tributaria/cronograma-oficial.ts` |
| `ibsUf: (REF_IBS * 0.1) / 2,` | `src/lib/reforma-tributaria/cronograma-oficial.ts` |
| `ibsUf: (REF_IBS * 0.2) / 2,` | `src/lib/reforma-tributaria/cronograma-oficial.ts` |
| `ibsUf: (REF_IBS * 0.3) / 2,` | `src/lib/reforma-tributaria/cronograma-oficial.ts` |
| `ibsUf: (REF_IBS * 0.4) / 2,` | `src/lib/reforma-tributaria/cronograma-oficial.ts` |
| `const cofinsAntigoDebito = dados.faturamentoAnual * 0.076;` | `src/lib/reforma-tributaria/simulador.ts` |
| `const cofinsCreditoAntigo = baseCreditos * 0.076;` | `src/lib/reforma-tributaria/simulador.ts` |
| `const icmsAntigo = faturamentoVendas * 0.18;` | `src/lib/reforma-tributaria/simulador.ts` |
| `const issAntigo = faturamentoServicos * 0.05;` | `src/lib/reforma-tributaria/simulador.ts` |
| `const pisAntigoDebito = dados.faturamentoAnual * 0.0165;` | `src/lib/reforma-tributaria/simulador.ts` |
| `const pisCreditoAntigo = baseCreditos * 0.0165;` | `src/lib/reforma-tributaria/simulador.ts` |
| `<vICMS>${(dados.valorTotal * 0.18).toFixed(2)}</vICMS>` | `src/lib/sefaz-simulator/xml.ts` |
| `<vICMS>${(item.valorTotal * 0.18).toFixed(2)}</vICMS>` | `src/lib/sefaz-simulator/xml.ts` |
| `diffValor > lancamento.valor * 0.1` | `src/lib/transaction-matcher/matcher.ts` |
| `const scoreFinal = Math.max(jaccard, scoreParcial * 0.8);` | `src/lib/transaction-matcher/similarity.ts` |
| `if (diffDias <= toleranciaDias) return 1 - (diffDias / toleranciaDias) * 0.5;` | `src/lib/transaction-matcher/similarity.ts` |
| `return { score: 1 - (percentDiff / tolerancia) * 0.3, tipo: 'proximo' };` | `src/lib/transaction-matcher/similarity.ts` |
| `* 30% (Lei 9.065/95). É por isso que o trimestral costuma ser mais caro que o` | `src/lib/tributario/apuracao.ts` |
| `* Compensação de prejuízos fiscais / base negativa com a trava dos 30%.` | `src/lib/tributario/apuracao.ts` |
| `* Lei 9.430/96, art. 4º: o adicional de 10% incide sobre a parcela da base que` | `src/lib/tributario/apuracao.ts` |
| `* até ~10,8 p.p. e invertia a recomendação em ~15% dos cenários simulados.` | `src/lib/tributario/apuracao.ts` |
| `* fica limitada a 30% do lucro real (ou da base positiva) do período corrente.` | `src/lib/tributario/apuracao.ts` |
| `const limite = base * 0.3;` | `src/lib/tributario/apuracao.ts` |
| `csll += Math.max(0, cc.baseAjustada) * 0.09;` | `src/lib/tributario/apuracao.ts` |
| `return b * 0.15 + (b > 240000 ? (b - 240000) * 0.1 : 0);` | `src/lib/tributario/apuracao.ts` |
| `return b * 0.15 + (b > 60000 ? (b - 60000) * 0.1 : 0);` | `src/lib/tributario/apuracao.ts` |
| `* Alíquota RAT/FAP aplicada à folha (fração). Limitada a 6% — teto legal do` | `src/lib/tributario/encargos-folha.ts` |
| `* Padrão 5,8% para o FPAS 507 (comércio/indústria/serviços em geral). Empresas` | `src/lib/tributario/encargos-folha.ts` |
| `* coerência). Divisões ausentes usam o padrão 5,8% (FPAS 507).` | `src/lib/tributario/encargos-folha.ts` |
| `* parâmetros; na ausência, deriva do CNAE principal; por fim usa 5,8%.` | `src/lib/tributario/encargos-folha.ts` |
| `* - acima → 10% (teto Lei 15.270/2025)` | `src/lib/tributario/irpfm.ts` |
| `* - excede até R$ 200k → 7,5%` | `src/lib/tributario/irpfm.ts` |
| `* - excede até R$ 50k (total mensal R$ 100k) → 5%` | `src/lib/tributario/irpfm.ts` |
| `* Progressão linear: 0% em R$ 600.000 → 10% em R$ 1.200.000 (1 p.p. a cada R$ 60.000).` | `src/lib/tributario/pf-vinculada.ts` |
| `/** Teto da faixa linear: acima disso a alíquota mínima é fixa em 10%. */` | `src/lib/tributario/pf-vinculada.ts` |
| `// 2. IRRF de 10% sobre dividendos quando o pagamento mensal da mesma fonte excede R$ 50.000;` | `src/lib/tributario/pf-vinculada.ts` |
| `// 3. IRPFM (Imposto de Renda Pessoa Física Mínimo) — alíquota LINEAR de 0% a 10% para renda` | `src/lib/tributario/pf-vinculada.ts` |
| `// IRRF 10% incide sobre o valor integral quando o pagamento mensal supera o limite.` | `src/lib/tributario/pf-vinculada.ts` |
| `// total anual entre R$ 600.000 e R$ 1.200.000, e 10% acima disso, com o IR já pago no ano` | `src/lib/tributario/pf-vinculada.ts` |
| `const bruto = base * 0.275 - 908.73;` | `src/lib/tributario/pf-vinculada.ts` |
| `const inss = Math.min(proLaboreMensal * 0.11, PF_INSS_TETO_MENSAL) * 12;` | `src/lib/tributario/pf-vinculada.ts` |
| `return ((renda - PF_IRPFM_PISO_ANUAL) / 60_000) * 0.01;` | `src/lib/tributario/pf-vinculada.ts` |
| `* Aplica redutor setorial (cesta básica, saúde, educação, agro têm redução de 60% — EC 132).` | `src/lib/tributario/projecao-reforma.ts` |
| `/** Alíquota efetiva atual de PIS+COFINS (default 9,25% Lucro Real / 3,65% Presumido) */` | `src/lib/tributario/projecao-reforma.ts` |
| `return 0.4; // 60% de redução` | `src/lib/tributario/projecao-reforma.ts` |
| `const LIMITE_SIMPLES_ALERTA = 4_320_000; // 90% — janela de risco de desenquadramento` | `src/lib/tributario/recomendar-empresa.ts` |
| `* A compensação é limitada a 30% do lucro real do período (Lei 9.065/95, art. 15).` | `src/lib/tributario/types.ts` |
| `* Compensação limitada a 30% da base positiva (Lei 9.065/95, art. 16).` | `src/lib/tributario/types.ts` |
| `// Serviços hospitalares (8%/12% exige estrutura hospitalar — IN RFB 1.700/17, art. 33)` | `src/lib/tributario/calculadora/atividade-cnae.ts` |
| `// A parcela de serviços só cai na presunção geral de 32% quando a atividade` | `src/lib/tributario/calculadora/lucro-presumido.ts` |
| `// LUCRO PRESUMIDO — Trimestral com adicional 10%, PIS/COFINS cumulativo` | `src/lib/tributario/calculadora/lucro-presumido.ts` |
| `// hospitalares 8%/12% — Lei 9.249/95, arts. 15 e 20) mantêm o seu percentual` | `src/lib/tributario/calculadora/lucro-presumido.ts` |
| `// percentual próprio (transporte de cargas 8%/12%, passageiros 16%/12%,` | `src/lib/tributario/calculadora/lucro-presumido.ts` |
| `const cofins = baseNormalPisCofins * 0.03 + (mono?.cofinsMonofasico ?? 0);` | `src/lib/tributario/calculadora/lucro-presumido.ts` |
| `const csll = baseCsll * 0.09;` | `src/lib/tributario/calculadora/lucro-presumido.ts` |
| `const irpjAdicional = excedenteTrim * 0.1;` | `src/lib/tributario/calculadora/lucro-presumido.ts` |
| `const irpjBase = baseIrpj * 0.15;` | `src/lib/tributario/calculadora/lucro-presumido.ts` |
| `const pis = baseNormalPisCofins * 0.0065 + (mono?.pisMonofasico ?? 0);` | `src/lib/tributario/calculadora/lucro-presumido.ts` |
| `if (receitaBruta > LIMITE_ANUAL * 0.9)` | `src/lib/tributario/calculadora/lucro-presumido.ts` |
| `valor: baseNormalPisCofins * 0.0065,` | `src/lib/tributario/calculadora/lucro-presumido.ts` |
| `valor: baseNormalPisCofins * 0.03,` | `src/lib/tributario/calculadora/lucro-presumido.ts` |
| `// === IRPJ + adicional 10% ===` | `src/lib/tributario/calculadora/lucro-real.ts` |
| `// Compensação de prejuízo fiscal — limite 30%` | `src/lib/tributario/calculadora/lucro-real.ts` |
| `compensacao = Math.min(prejuizo, lucroAntesCompensacao * 0.3);` | `src/lib/tributario/calculadora/lucro-real.ts` |
| `const cofinsCredito = baseCreditos * 0.076;` | `src/lib/tributario/calculadora/lucro-real.ts` |
| `const cofinsDebito = baseNormalPisCofins * 0.076;` | `src/lib/tributario/calculadora/lucro-real.ts` |
| `const irpjAdicional = excedente * 0.1;` | `src/lib/tributario/calculadora/lucro-real.ts` |
| `const irpjBase = lucroReal * 0.15;` | `src/lib/tributario/calculadora/lucro-real.ts` |
| `const pisCredito = baseCreditos * 0.0165;` | `src/lib/tributario/calculadora/lucro-real.ts` |
| `const pisDebito = baseNormalPisCofins * 0.0165;` | `src/lib/tributario/calculadora/lucro-real.ts` |
| `if (baseCreditos < receitaLiquida * 0.3)` | `src/lib/tributario/calculadora/lucro-real.ts` |
| `const cofinsAntigo = receita * 0.076 * fase.cofinsResidual;` | `src/lib/tributario/calculadora/reforma-tributaria.ts` |
| `const issResidual = receita * 0.05 * fase.issResidual * (input.receitas.percentualServicos / 100);` | `src/lib/tributario/calculadora/reforma-tributaria.ts` |
| `const pisAntigo = receita * 0.0165 * fase.pisResidual;` | `src/lib/tributario/calculadora/reforma-tributaria.ts` |
| `receita * 0.18 * fase.icmsResidual * (1 - input.receitas.percentualServicos / 100);` | `src/lib/tributario/calculadora/reforma-tributaria.ts` |
| `if (input.rbt12 > LIMITE_ANUAL * 0.9) {` | `src/lib/tributario/calculadora/simples-nacional.ts` |
| `csrfSofrido?: number; // PIS+COFINS+CSLL 4,65% na fonte` | `src/lib/tributario/calculadora/types.ts` |
| `regimeEspecialReducao?: number; // 0..1 (ex 0.6 para 60% redução — saúde/educ)` | `src/lib/tributario/calculadora/types.ts` |
| `* 5. piso/teto fora da faixa legal de 2% a 5%.` | `src/lib/tributario/catalogos/coerencia-iss.ts` |
| `// Nenhum I/O, nenhuma dependência de React ou Supabase — 100% testável.` | `src/lib/tributario/catalogos/coerencia-iss.ts` |
| `// Nenhum I/O, nenhuma dependência de React ou Supabase — 100% testável.` | `src/lib/tributario/catalogos/coerencia-mva.ts` |
| `/** Teto defensivo para MVA: nenhum protocolo de ST brasileiro chega a 300%. */` | `src/lib/tributario/catalogos/coerencia-ncm.ts` |
| `// Nenhum I/O, nenhuma dependência de React ou Supabase — 100% testável.` | `src/lib/tributario/catalogos/coerencia-ncm.ts` |
| `* 12% nos demais casos entre contribuintes.` | `src/lib/tributario/catalogos/painel.ts` |
| `* 7% de Sul/Sudeste (exceto ES) para Norte/Nordeste/Centro-Oeste e ES;` | `src/lib/tributario/catalogos/painel.ts` |
| `* alíquota de importado (4%, Resolução SF 13/2012).` | `src/lib/tributario/catalogos/painel.ts` |
| `/** Regiões cujo destino recebe 7% quando a origem é Sul/Sudeste (exceto ES). */` | `src/lib/tributario/catalogos/painel.ts` |
| `// 1ª quota sem juros; demais com SELIC acumulada + 1% no mês do pagamento.` | `src/lib/tributario/darf/consolidar.ts` |
| `/** Multa de mora: 0,33% ao dia, limitada a 20% (Lei 9.430/96, art. 61). */` | `src/lib/tributario/darf/tabelas.ts` |
| `* ao pagamento, acrescida de 1% no mês do pagamento (Lei 9.430/96, art. 61, §3º).` | `src/lib/tributario/darf/vencimento.ts` |
| `// Bonificação reduz base ICMS/PIS/COFINS — economia estimada de 2-9% sobre volume` | `src/lib/tributario/elisao/detectar-bonificacao.ts` |
| `const economiaEstimada = aplicavel ? volumeEstimado * 0.18 : 0;` | `src/lib/tributario/elisao/detectar-bonificacao.ts` |
| `const volumeEstimado = faturamento * 0.05; // assume 5% potencial de bonificação` | `src/lib/tributario/elisao/detectar-bonificacao.ts` |
| `economia_min: economiaEstimada * 0.5,` | `src/lib/tributario/elisao/detectar-bonificacao.ts` |
| … +193 linhas — lista completa em `context.json` | |

## H. Parâmetros de negócio (constantes, prazos, limites)

### H.1 Constantes

| Constante | Valor | Arquivo |
|---|---|---|
| `FUSO` | `'America/Sao_Paulo'` | `playwright.financeiro.config.ts` |
| `API_CACHE_MAX_AGE` | `5` | `public/sw.js` |
| `ENTITY_TYPE` | `'anomalias_detectadas'` | `src/components/admin/AnomaliasDetectadasPanel.helpers.ts` |
| `TRIBUTARIO_JOB` | `'gerar-alertas-tributarios-diario'` | `src/components/admin/CronJobsStatus.tsx` |
| `MIN_CONFIRMAR` | `10` | `src/components/admin/anomalias-review-queue/types.ts` |
| `MIN_FALSO_POSITIVO` | `15` | `src/components/admin/anomalias-review-queue/types.ts` |
| `SCIM_SP_CONFIG_SCHEMA` | `'urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'` | `src/components/admin/sso/ScimSetupGuide.helpers.ts` |
| `IDS_POR_LOTE` | `100` | `src/components/cobranca/PrevisaoInadimplencia.tsx` |
| `SCORE_RISCO_ALTO` | `300` | `src/components/cobranca/previsao/risco.ts` |
| `SCORE_RISCO_MEDIO` | `500` | `src/components/cobranca/previsao/risco.ts` |
| `SCORE_RISCO_BAIXO` | `700` | `src/components/cobranca/previsao/risco.ts` |
| `ALPHA` | `0.3` | `src/components/contabilidade/ImportLancamentosCSVDialog.tsx` |
| `TITULO` | `'ÍNDICES ECONÔMICO-FINANCEIROS'` | `src/components/contabilidade/indices/exporters.ts` |
| `COOLDOWN` | `60000` | `src/components/contas-receber/ContasReceberKPIs.tsx` |
| `PAGINA_DLQ` | `20` | `src/components/contas-receber/WebhookDlqPanel.tsx` |
| `DEFAULT_DURATION` | `350` | `src/components/layout/transitions/presets.ts` |
| `DEFAULT_DISTANCE` | `24` | `src/components/layout/transitions/presets.ts` |
| `SWIPE_THRESHOLD` | `100` | `src/components/pix-hub/AprovacaoRapidaMobile.tsx` |
| `DEVICE_DATE_FMT` | `"dd/MM/yyyy '` | `src/components/security/KnownDevicesPanel.tsx` |
| `TAXA_EMPRESTIMO_COMPARATIVO` | `4` | `src/components/simuladores/simulador-antecipacao.config.ts` |
| `SALDO_MINIMO_ALERTA` | `1000` | `src/components/tesouraria/TesourariaCentralizada.tsx` |
| `DEFAULT_THEME` | `'dark'` | `src/components/theme/ThemeProvider.tsx` |
| `DIAS_ALERTA_VENCIMENTO` | `30` | `src/components/tributario/CertificadosDigitaisTab.tsx` |
| `TITULO` | `'REGIME MONOFÁSICO DE PIS/COFINS'` | `src/components/tributario/monofasico/exporters.ts` |
| `SIDEBAR_COOKIE_MAX_AGE` | `60` | `src/components/ui/sidebar.tsx` |
| `SIDEBAR_WIDTH` | `'16rem'` | `src/components/ui/sidebar.tsx` |
| `SIDEBAR_WIDTH_MOBILE` | `'18rem'` | `src/components/ui/sidebar.tsx` |
| `MOBILE_BREAKPOINT` | `768` | `src/hooks/use-mobile.tsx` |
| `TOAST_DURACAO_MIN` | `3` | `src/hooks/useAnomaliaPreferences.ts` |
| `TOAST_DURACAO_MAX` | `30` | `src/hooks/useAnomaliaPreferences.ts` |
| `TOAST_DURACAO_DEFAULT` | `12` | `src/hooks/useAnomaliaPreferences.ts` |
| `MOVIMENTACOES_PAGE_SIZE` | `1000` | `src/hooks/useFinancialOperations.ts` |
| `MOVIMENTACOES_SAFETY_CAP` | `5000` | `src/hooks/useFinancialOperations.ts` |
| `LIMITE_ADICIONAL_MES` | `20000` | `src/hooks/useIRPJCSLL.ts` |
| `ALIQUOTA_IRPJ` | `0.15` | `src/hooks/useIRPJCSLL.ts` |
| `ALIQUOTA_IRPJ_ADICIONAL` | `0.1` | `src/hooks/useIRPJCSLL.ts` |
| `ALIQUOTA_CSLL` | `0.09` | `src/hooks/useIRPJCSLL.ts` |
| `DISMISS_TTL_MS` | `1000` | `src/hooks/useInstallPrompt.ts` |
| `DEFAULT_CONCURRENCY` | `6` | `src/hooks/useLancamentosContabeis.ts` |
| `CONCURRENCY_MIN` | `1` | `src/hooks/useLancamentosContabeis.ts` |
| `CONCURRENCY_MAX` | `16` | `src/hooks/useLancamentosContabeis.ts` |
| `PAYLOAD_VERSION` | `1` | `src/hooks/useManagedFilters.ts` |
| `DEBOUNCE_MS` | `500` | `src/hooks/useManagedFilters.ts` |
| `TOLERANCIA` | `0.01` | `src/hooks/usePreValidacaoSped.ts` |
| `ID_TTL_MS` | `5` | `src/hooks/useRealtimeAuditToasts.ts` |
| `SIG_WINDOW_MS` | `10` | `src/hooks/useRealtimeAuditToasts.ts` |
| `MAX_IDS` | `500` | `src/hooks/useRealtimeAuditToasts.ts` |
| `MAX_RECENT` | `5` | `src/hooks/useRecentItems.ts` |
| `EMPRESA_TODAS` | `'all'` | `src/hooks/useReformaTributaria.ts` |
| `SKIPPED_FLAG` | `'bitrix24-anomalia-skipped-warned'` | `src/hooks/useSincronizarAnomaliaBitrix.ts` |
| `EXPORT_CAP` | `5000` | `src/hooks/useTrilhaAuditoria.ts` |
| `PAGINA_CONTAS_PAGAR` | `1000` | `src/hooks/financial/useContasPagar.ts` |
| `TETO_CONTAS_PAGAR` | `20` | `src/hooks/financial/useContasPagar.ts` |
| `PAGINA_CONTAS_RECEBER` | `1000` | `src/hooks/financial/useContasReceber.ts` |
| `TETO_CONTAS_RECEBER` | `20` | `src/hooks/financial/useContasReceber.ts` |
| `ANOMALIA_DRAWER_EVENT` | `'open-anomalia-drawer'` | `src/lib/anomalia-routes.ts` |
| `BOM` | `'\uFEFF'` | `src/lib/export-utils.ts` |
| `BUFFER_MAX` | `100` | `src/lib/filterHydrationTelemetry.ts` |
| `MAX_VALUE_LEN` | `32` | `src/lib/format-filter-value.ts` |
| `DEFAULT_TTL_MS` | `7` | `src/lib/import-checkpoint.ts` |
| `PAGINA` | `1000` | `src/lib/paginar-postgrest.ts` |
| `MAX_LINHAS` | `50` | `src/lib/paginar-postgrest.ts` |
| `MAX_REQUISICOES` | `500` | `src/lib/paginar-postgrest.ts` |
| `HEADER_HEIGHT` | `22` | `src/lib/pdf-layout.ts` |
| `FOOTER_HEIGHT` | `14` | `src/lib/pdf-layout.ts` |
| `MARGIN_X` | `14` | `src/lib/pdf-layout.ts` |
| `SHARED_FILTERS_BUNDLE_VERSION` | `1` | `src/lib/sharedFiltersExport.ts` |
| `BUCKET_FINANCEIRO` | `'financeiro'` | `src/lib/storage-path.ts` |
| `MAX_BREADCRUMBS` | `20` | `src/lib/telemetry.ts` |
| `MAX_QUEUE` | `50` | `src/lib/telemetry.ts` |
| `FLUSH_DEBOUNCE_MS` | `2000` | `src/lib/telemetry.ts` |
| `KEEPALIVE_ORCAMENTO_BYTES` | `60` | `src/lib/telemetry.ts` |
| `MODAL_HISTORY_MARKER` | `'__modal_history__'` | `src/lib/unsaved-guard.ts` |
| `UNSAVED_GUARD_SENTINEL` | `'__unsaved_guard__'` | `src/lib/unsaved-guard.ts` |
| `OPEN_DIALOG_SELECTOR` | `'[role="` | `src/lib/unsaved-guard.ts` |
| `TOLERANCIA` | `0.005` | `src/lib/contabil/balancete-utils.ts` |
| `EPS` | `1` | `src/lib/contabil/indices.helpers.ts` |
| `MARGIN` | `40` | `src/lib/export-contabil/livro-oficial.ts` |
| `BOM` | `'\uFEFF'` | `src/lib/export-contabil/utils.ts` |
| `STORE` | `'consultas'` | `src/lib/offline/fiscal-cache.ts` |
| `DB_VERSION` | `1` | `src/lib/offline/fiscal-cache.ts` |
| `TTL_PADRAO_MS` | `7` | `src/lib/offline/fiscal-cache.ts` |
| `DIAS_VALIDADE_CONVITE` | `7` | `src/lib/organizacoes/convites.ts` |
| `BOM` | `'\uFEFF'` | `src/lib/pdf-generator/fluxo-caixa.ts` |
| `FUNDAMENTO_PLENO` | `'ADCT (EC 132/2023) — regime definitivo a partir de 2033'` | `src/lib/reforma-tributaria/cronograma-oficial.ts` |
| `SCIM_USER_SCHEMA` | `'urn:ietf:params:scim:schemas:core:2.0:User'` | `src/lib/scim/userTemplate.ts` |
| `HEALTH_VERSAO` | `2` | `src/lib/sefaz-contingency/storage.ts` |
| `BULK_MAX_USERS` | `200` | `src/lib/sso/sandbox-bulk-runner.ts` |
| `TOLERANCIA_CENTAVOS` | `0.5` | `src/lib/transaction-matcher/types.ts` |
| `LIMITE_SIMPLES_NACIONAL` | `4` | `src/lib/tributario/aliquotas-simples.ts` |
| `EPSILON` | `1` | `src/lib/tributario/diagnostico-parametros.ts` |
| `TERCEIROS_PADRAO` | `0.058` | `src/lib/tributario/encargos-folha.ts` |
| `IRPFM_LIMITE_ISENCAO_MENSAL` | `50` | `src/lib/tributario/irpfm.ts` |
| `IRPFM_LIMITE_ANUAL_BASE` | `600` | `src/lib/tributario/irpfm.ts` |
| `PF_LIMITE_IRRF_DIVIDENDOS_MENSAL` | `50` | `src/lib/tributario/pf-vinculada.ts` |
| `PF_ALIQUOTA_IRRF_DIVIDENDOS` | `0.1` | `src/lib/tributario/pf-vinculada.ts` |
| `PF_IRPFM_PISO_ANUAL` | `600` | `src/lib/tributario/pf-vinculada.ts` |
| `PF_IRPFM_TETO_ANUAL` | `1` | `src/lib/tributario/pf-vinculada.ts` |
| `PF_IRPFM_ALIQUOTA_MAXIMA` | `0.1` | `src/lib/tributario/pf-vinculada.ts` |
| `PF_IRPF_ISENCAO_MENSAL` | `5` | `src/lib/tributario/pf-vinculada.ts` |
| `PF_IRPF_LIMITE_REDUTOR_MENSAL` | `7` | `src/lib/tributario/pf-vinculada.ts` |
| `PF_INSS_TETO_MENSAL` | `908` | `src/lib/tributario/pf-vinculada.ts` |
| `PF_ALIQUOTA_OUTRAS_RENDAS` | `0.15` | `src/lib/tributario/pf-vinculada.ts` |
| `LIMITE_SIMPLES` | `4` | `src/lib/tributario/recomendar-empresa.ts` |
| `LIMITE_SIMPLES_ALERTA` | `4` | `src/lib/tributario/recomendar-empresa.ts` |
| `VERSAO_MOTOR_TRIBUTARIO` | `'3.8.0'` | `src/lib/tributario/versao.ts` |
| `LIMITE_ANUAL` | `78` | `src/lib/tributario/calculadora/lucro-presumido.ts` |
| `LIMITE_ADICIONAL_TRIMESTRAL` | `60` | `src/lib/tributario/calculadora/lucro-presumido.ts` |
| `LIMITE_ADICIONAL_ANUAL` | `240` | `src/lib/tributario/calculadora/lucro-real.ts` |
| `LIMITE_ADICIONAL_TRIMESTRAL` | `60` | `src/lib/tributario/calculadora/lucro-real.ts` |
| `LIMITE_ANUAL` | `4` | `src/lib/tributario/calculadora/simples-nacional.ts` |
| `SUBLIMITE_PADRAO` | `3` | `src/lib/tributario/calculadora/simples-nacional.ts` |
| `FATOR_R_CORTE` | `0.28` | `src/lib/tributario/calculadora/simples-nacional.ts` |
| `ISS_PISO_LEGAL` | `0.02` | `src/lib/tributario/catalogos/coerencia-iss.ts` |
| `ISS_TETO_LEGAL` | `0.05` | `src/lib/tributario/catalogos/coerencia-iss.ts` |
| `EPSILON` | `1` | `src/lib/tributario/catalogos/coerencia-iss.ts` |
| `EPSILON` | `1` | `src/lib/tributario/catalogos/coerencia-mva.ts` |
| `MVA_MAXIMO` | `3` | `src/lib/tributario/catalogos/coerencia-ncm.ts` |
| `EPSILON` | `1` | `src/lib/tributario/catalogos/coerencia-ncm.ts` |
| `EPSILON` | `1` | `src/lib/tributario/catalogos/coerencia-ufs.ts` |
| `EPSILON` | `1` | `src/lib/tributario/catalogos/coerencia.ts` |
| `UFS_ESPERADAS` | `27` | `src/lib/tributario/catalogos/painel.ts` |
| `EPSILON` | `1` | `src/lib/tributario/catalogos/painel.ts` |
| `PESO_CRITICO` | `12` | `src/lib/tributario/catalogos/saude.ts` |
| `PESO_ATENCAO` | `4` | `src/lib/tributario/catalogos/saude.ts` |
| `PESO_REJEICAO` | `6` | `src/lib/tributario/catalogos/saude.ts` |
| `VALOR_MINIMO_DARF` | `10` | `src/lib/tributario/darf/tabelas.ts` |
| `VALOR_MINIMO_QUOTA` | `1000` | `src/lib/tributario/darf/tabelas.ts` |
| `MULTA_MORA_DIARIA` | `0.0033` | `src/lib/tributario/darf/tabelas.ts` |
| `MULTA_MORA_TETO` | `0.2` | `src/lib/tributario/darf/tabelas.ts` |
| `SELIC_PADRAO_MENSAL` | `0.0089` | `src/lib/tributario/darf/tabelas.ts` |
| `MS_DIA` | `86` | `src/lib/tributario/darf/vencimento.ts` |
| `PERCENTUAL_LIMITE_JCP` | `0.5` | `src/lib/tributario/elisao/detectar-jcp.ts` |
| `ALIQUOTA_ECONOMIA_JCP` | `0.34` | `src/lib/tributario/elisao/detectar-jcp.ts` |
| `ALIQUOTA_IRRF_JCP` | `0.15` | `src/lib/tributario/elisao/detectar-jcp.ts` |
| `PL_MINIMO_JCP` | `100` | `src/lib/tributario/elisao/detectar-jcp.ts` |
| `TJLP_ANUAL` | `0.0712` | `src/lib/tributario/elisao/types.ts` |
| `SUBLIMITE_SIMPLES` | `3` | `src/lib/tributario/elisao/types.ts` |
| `TETO_SIMPLES` | `4` | `src/lib/tributario/elisao/types.ts` |
| `TETO_DIVIDENDOS_IRPFM` | `600` | `src/lib/tributario/elisao/types.ts` |
| `ALIQUOTA_IRRF_DIVIDENDOS` | `0.1` | `src/lib/tributario/elisao/types.ts` |
| `ANOS_PRESCRICAO_CREDITO` | `5` | `src/lib/tributario/elisao/types.ts` |
| `TAXA_CREDITO_NAO_APROVEITADO_ESTIMADA` | `0.003` | `src/lib/tributario/elisao/types.ts` |
| `ALIQUOTA_IRPJ_CSLL_COMBINADA` | `0.34` | `src/lib/tributario/elisao/types.ts` |
| `ALIQUOTA_IRPJ_BASICA` | `0.15` | `src/lib/tributario/elisao/types.ts` |
| `REDUCAO_IRPJ_REGIONAL` | `0.75` | `src/lib/tributario/elisao/types.ts` |
| `CUSTO_OPORTUNIDADE_ANUAL` | `0.12` | `src/lib/tributario/elisao/types.ts` |
| `FAP_MINIMO` | `0.5` | `src/lib/tributario/folha/tabelas.ts` |
| `FAP_MAXIMO` | `2.0` | `src/lib/tributario/folha/tabelas.ts` |
| `RAT_AJUSTADO_MINIMO` | `0.005` | `src/lib/tributario/folha/tabelas.ts` |
| `RAT_AJUSTADO_MAXIMO` | `0.06` | `src/lib/tributario/folha/tabelas.ts` |
| `ALIQUOTA_FGTS` | `0.08` | `src/lib/tributario/folha/tabelas.ts` |
| `ALIQUOTA_CPP` | `0.2` | `src/lib/tributario/folha/tabelas.ts` |
| `FPAS_PADRAO` | `'515'` | `src/lib/tributario/folha/tabelas.ts` |
| `MVA_MAXIMA` | `3` | `src/lib/tributario/icms/overlay-mva.ts` |
| `INTERNA_MAX` | `0.4` | `src/lib/tributario/icms/overlay.ts` |
| `INTERNA_MIN` | `0.01` | `src/lib/tributario/icms/overlay.ts` |
| `FCP_MAX` | `0.05` | `src/lib/tributario/icms/overlay.ts` |
| `ALIQUOTA_INTERESTADUAL_REDUZIDA` | `0.07` | `src/lib/tributario/icms/tabelas.ts` |
| `ALIQUOTA_INTERESTADUAL_GERAL` | `0.12` | `src/lib/tributario/icms/tabelas.ts` |
| `ALIQUOTA_INTERESTADUAL_IMPORTADO` | `0.04` | `src/lib/tributario/icms/tabelas.ts` |
| `TOLERANCIA` | `5` | `src/lib/tributario/ipi-iss/overlay-iss.ts` |
| `IPI_ALIQUOTA_MAXIMA` | `3` | `src/lib/tributario/ipi-iss/overlay-ncm.ts` |
| `EPSILON` | `1` | `src/lib/tributario/ipi-iss/overlay-ncm.ts` |
| `ISS_ALIQUOTA_MINIMA` | `0.02` | `src/lib/tributario/ipi-iss/tabelas.helpers.ts` |
| `ISS_ALIQUOTA_MAXIMA` | `0.05` | `src/lib/tributario/ipi-iss/tabelas.helpers.ts` |
| `CSRF_PIS` | `0.0065` | `src/lib/tributario/ipi-iss/tabelas.helpers.ts` |
| `CSRF_COFINS` | `0.03` | `src/lib/tributario/ipi-iss/tabelas.helpers.ts` |
| `CSRF_CSLL` | `0.01` | `src/lib/tributario/ipi-iss/tabelas.helpers.ts` |
| `CSRF_PISO_PAGAMENTO` | `215.05` | `src/lib/tributario/ipi-iss/tabelas.helpers.ts` |
| `IRRF_PISO_RECOLHIMENTO` | `10` | `src/lib/tributario/ipi-iss/tabelas.helpers.ts` |
| `INSS_RETENCAO_CESSAO` | `0.11` | `src/lib/tributario/ipi-iss/tabelas.helpers.ts` |
| `ALIQUOTA_IRPJ` | `0.15` | `src/lib/tributario/irpj-csll/tabelas.ts` |
| `ALIQUOTA_ADICIONAL_IRPJ` | `0.1` | `src/lib/tributario/irpj-csll/tabelas.ts` |
| `ALIQUOTA_CSLL` | `0.09` | `src/lib/tributario/irpj-csll/tabelas.ts` |
| `LIMITE_ADICIONAL_MENSAL` | `20000` | `src/lib/tributario/irpj-csll/tabelas.ts` |
| `TRAVA_COMPENSACAO` | `0.3` | `src/lib/tributario/irpj-csll/tabelas.ts` |
| `MESES_RECUPERACAO_RETROATIVA` | `60` | `src/lib/tributario/monofasico/grupos.ts` |
| `LIMITE_SIMPLES` | `4800000` | `src/lib/tributario/motor/base.ts` |
| `LIMITE_PRESUMIDO` | `78000000` | `src/lib/tributario/motor/base.ts` |
| `MS_DIA` | `86` | `src/lib/tributario/obrigacoes/calendario.ts` |
| `PESO_ENTREGUE` | `1` | `src/lib/tributario/obrigacoes/conformidade.ts` |
| `PESO_ATRASADO` | `0.6` | `src/lib/tributario/obrigacoes/conformidade.ts` |
| `PESO_VENCE_HOJE` | `0.8` | `src/lib/tributario/obrigacoes/conformidade.ts` |
| `LIMIAR_ESTAVEL` | `1` | `src/lib/tributario/obrigacoes/historico.ts` |
| `MIN_OBSERVACOES` | `3` | `src/lib/tributario/obrigacoes/projecao.ts` |
| `HORIZONTE_PADRAO` | `3` | `src/lib/tributario/obrigacoes/projecao.ts` |
| `LIMIAR_ALERTA` | `70` | `src/lib/tributario/obrigacoes/projecao.ts` |
| `LIMIAR_VARIACAO` | `2` | `src/lib/tributario/obrigacoes/projecao.ts` |
| `FATOR_BANDA` | `1.96` | `src/lib/tributario/obrigacoes/projecao.ts` |
| `ALIQUOTA_PIS_NAO_CUMULATIVO` | `0.0165` | `src/lib/tributario/pis-cofins/types.ts` |
| `ALIQUOTA_COFINS_NAO_CUMULATIVO` | `0.076` | `src/lib/tributario/pis-cofins/types.ts` |
| `HARD_CAP` | `50000` | `src/pages/AuditLogs.tsx` |
| `PAGE` | `1000` | `src/pages/AuditLogs.tsx` |
| `VIRTUALIZE_THRESHOLD` | `60` | `src/pages/Movimentacoes.tsx` |
| `ROW_HEIGHT` | `57` | `src/pages/Movimentacoes.tsx` |
| `SLOW_THRESHOLD_MS` | `2` | `src/pages/admin/AnomaliaDetalhe.tsx` |
| `VERY_SLOW_THRESHOLD_MS` | `8` | `src/pages/admin/AnomaliaDetalhe.tsx` |
| `COUNTDOWN_SECONDS` | `3` | `src/pages/auth/CorporateOnboarding.hook.ts` |
| `TAMANHO_PAGINA_HISTORICO` | `5` | `src/pages/tributario/SimulacaoRegimes.tsx` |
| `TTL_SEGREDO_MS` | `60` | `supabase/functions/_shared/auth-guard.ts` |
| `LIMITE_BUFFER` | `200` | `supabase/functions/_shared/console-persist.ts` |
| `MAX_REENVIOS` | `3` | `supabase/functions/_shared/console-persist.ts` |
| `VALIDATION_ERROR_CODE` | `'VALIDATION_ERROR'` | `supabase/functions/_shared/contract-response.ts` |
| `CORRELATION_HEADER` | `'x-request-id'` | `supabase/functions/_shared/correlation.ts` |
| `MAX_BUFFER` | `500` | `supabase/functions/_shared/observability.ts` |
| `LIMITE_SIMPLES` | `4800000` | `supabase/functions/_shared/tributario-logic.ts` |
| `LIMITE_PRESUMIDO` | `78000000` | `supabase/functions/_shared/tributario-logic.ts` |
| `TERCEIROS_PADRAO` | `0.058` | `supabase/functions/_shared/tributario-logic.ts` |
| `CONTRACT_VERSION_HEADER` | `'x-contract-version'` | `supabase/functions/_shared/versioned-contract.ts` |
| `NFE_XML_BUCKET` | `'nfe-xml'` | `supabase/functions/_shared/nfe/xml-storage.ts` |
| `EMP` | `'11111111-2222-3333-4444-555555555555'` | `supabase/functions/_shared/nfe/xml-storage_test.ts` |
| `CHAVE` | `'35260600000000000000550010000000011000000001'` | `supabase/functions/_shared/nfe/xml-storage_test.ts` |
| `MS_DIA` | `86` | `supabase/functions/_shared/obrigacoes/calendario.ts` |
| `PESO_ENTREGUE` | `1` | `supabase/functions/_shared/obrigacoes/conformidade.ts` |
| `PESO_ATRASADO` | `0.6` | `supabase/functions/_shared/obrigacoes/conformidade.ts` |
| `PESO_VENCE_HOJE` | `0.8` | `supabase/functions/_shared/obrigacoes/conformidade.ts` |
| `ASAAS_FETCH_TIMEOUT_MS` | `10000` | `supabase/functions/asaas-proxy/index.ts` |
| `BLING_API_BASE` | `'https://api.bling.com.br/Api/v3'` | `supabase/functions/bling-proxy/index.ts` |
| `BLING_AUTH_BASE` | `'https://www.bling.com.br/Api/v3/oauth'` | `supabase/functions/bling-proxy/index.ts` |
| `BLING_FETCH_TIMEOUT_MS` | `10000` | `supabase/functions/bling-proxy/index.ts` |
| `CACHE_TTL_DAYS` | `30` | `supabase/functions/cnpja-lookup/index.ts` |
| `RATE_LIMIT_MAX` | `10` | `supabase/functions/cnpja-lookup/index.ts` |
| `RATE_LIMIT_WINDOW_MIN` | `60` | `supabase/functions/cnpja-lookup/index.ts` |
| `STATUS_NOTIFICADO` | `'notificado'` | `supabase/functions/enviar-digest-conformidade/index.ts` |
| `FUSO` | `'America/Sao_Paulo'` | `supabase/functions/enviar-digest-conformidade/index.ts` |
| `SIMPLES_SUBLIMITE` | `4` | `supabase/functions/gerar-alertas-tributarios/index.ts` |
| `FATOR_R_MIN` | `0.28` | `supabase/functions/gerar-alertas-tributarios/index.ts` |
| `IRPFM_MENSAL_LIMITE` | `50` | `supabase/functions/gerar-alertas-tributarios/index.ts` |
| `DIAS_VENCIMENTO_ALERTA` | `5` | `supabase/functions/gerar-alertas-tributarios/index.ts` |
| `MAX_TRANSACTION_STATEMENTS` | `100` | `supabase/functions/mcp-query/index.ts` |
| `MAX_TRANSACTION_BYTES` | `1024` | `supabase/functions/mcp-query/index.ts` |
| `MAX_RAW_BODY_BYTES` | `2` | `supabase/functions/mcp-query/index.ts` |
| `MAX_ADMIN_REQUEST_BYTES` | `256` | `supabase/functions/mcp-query/index.ts` |
| `MAX_ADMIN_RESPONSE_BYTES` | `1024` | `supabase/functions/mcp-query/index.ts` |
| `STATEMENT_TIMEOUT_MS` | `5000` | `supabase/functions/mcp-query/index.ts` |
| `LOCK_TIMEOUT_MS` | `1000` | `supabase/functions/mcp-query/index.ts` |
| `ADMIN_TIMEOUT_MS` | `5000` | `supabase/functions/mcp-query/index.ts` |
| `TIMEOUT_CANAL_MS` | `5000` | `supabase/functions/monitor-health/index.ts` |
| `COOLDOWN_ALERTA_MS` | `2` | `supabase/functions/monitor-health/index.ts` |
| `CHAVE_NOTIFICADO` | `'notificado_em'` | `supabase/functions/monitor-health/index.ts` |
| `UUID_A` | `'11111111-1111-4111-8111-111111111111'` | `supabase/functions/nfe-vinculo-proxy/index_test.ts` |
| `UUID_B` | `'22222222-2222-4222-8222-222222222222'` | `supabase/functions/nfe-vinculo-proxy/index_test.ts` |
| `ENTERPRISE_URN` | `'urn:ietf:params:scim:schemas:extension:enterprise:2.0:user'` | `supabase/functions/scim-server/index.ts` |
| `USER_URN` | `'urn:ietf:params:scim:schemas:core:2.0:user'` | `supabase/functions/scim-server/index.ts` |
| `CONCURRENCY` | `5` | `supabase/functions/sefaz-dfe-dispatcher/index.ts` |
| `IDEMPOTENCY_WINDOW_MS` | `5` | `supabase/functions/sefaz-dfe-dispatcher/index.ts` |
| `PER_CNPJ_TIMEOUT_MS` | `45` | `supabase/functions/sefaz-dfe-dispatcher/index.ts` |
| `BASE_INTERVAL_MS` | `15` | `supabase/functions/sefaz-dfe-dispatcher/policy.ts` |
| `MAX_BACKOFF_MS` | `4` | `supabase/functions/sefaz-dfe-dispatcher/policy.ts` |
| `CIRCUIT_OPEN_THRESHOLD` | `8` | `supabase/functions/sefaz-dfe-dispatcher/policy.ts` |
| `PULLER_MISSING_TAG` | `'puller-missing'` | `supabase/functions/sefaz-dfe-dispatcher/policy.ts` |
| `SCENARIOS` | `1000` | `supabase/functions/sefaz-dfe-dispatcher/policy_test.ts` |
| `TICKS` | `96` | `supabase/functions/sefaz-dfe-dispatcher/policy_test.ts` |
| `TICK_MS` | `15` | `supabase/functions/sefaz-dfe-dispatcher/policy_test.ts` |
| `MAX_BATCHES_PER_CNPJ` | `10` | `supabase/functions/sefaz-dfe-puxar/index.ts` |
| `SSO_FINALIZE_JANELA_MS` | `10` | `supabase/functions/sso-callback/index.ts` |
| `PROJECT_REF` | `'bwwbeyolnnzppeuhgkcd'` | `supabase/functions/sso-generate-metadata/index.ts` |
| `BUCKET` | `'financeiro'` | `supabase/functions/upload-anexo/index.ts` |
| `TAMANHO_MAX` | `10` | `supabase/functions/upload-anexo/index.ts` |
| `EMPRESA_AUTORIZADA` | `'11111111-1111-4111-8111-111111111111'` | `supabase/functions/whatsapp-ia-proativo/index_test.ts` |
| `EMPRESA_ALHEIA` | `'22222222-2222-4222-8222-222222222222'` | `supabase/functions/whatsapp-ia-proativo/index_test.ts` |
| `CLIENTE_AUTORIZADO` | `'33333333-3333-4333-8333-333333333333'` | `supabase/functions/whatsapp-ia-proativo/index_test.ts` |
| `CLIENTE_ALHEIO` | `'44444444-4444-4444-8444-444444444444'` | `supabase/functions/whatsapp-ia-proativo/index_test.ts` |
| `CONTA_AUTORIZADA` | `'55555555-5555-4555-8555-555555555555'` | `supabase/functions/whatsapp-ia-proativo/index_test.ts` |
| `CONTA_ALHEIA` | `'66666666-6666-4666-8666-666666666666'` | `supabase/functions/whatsapp-ia-proativo/index_test.ts` |

### H.2 Prazos, expirações e janelas de tempo

| Trecho | Arquivo |
|---|---|
| `timeout: 120 * 1000,` | `playwright.config.ts` |
| `timeout: 30 * 1000,` | `playwright.config.ts` |
| `timeout: 5000,` | `playwright.config.ts` |
| `timeout: 120 * 1000,` | `playwright.critical.config.ts` |
| `timeout: 30 * 1000,` | `playwright.critical.config.ts` |
| `timeout: 5000,` | `playwright.critical.config.ts` |
| `timeout: 120 * 1000,` | `playwright.destructive.config.ts` |
| `timeout: 30 * 1000,` | `playwright.destructive.config.ts` |
| `timeout: 5000,` | `playwright.destructive.config.ts` |
| `expect: { timeout: 7_000 },` | `playwright.financeiro.config.ts` |
| `timeout: 120_000,` | `playwright.financeiro.config.ts` |
| `timeout: 45_000,` | `playwright.financeiro.config.ts` |
| `const API_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes` | `public/sw.js` |
| `else setTimeout(cb, 2500);` | `src/main.tsx` |
| `if (typeof ric === 'function') ric(cb, { timeout: 4000 });` | `src/main.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/admin/FiscalHealthBadge.tsx` |
| `const last7 = attempts.filter((a) => new Date(a.created_at) >= subDays(new Date(), 7));` | `src/components/admin/sso/SSOMetricsPanel.tsx` |
| `const timeout = setTimeout(() => controller.abort(), 8000);` | `src/components/admin/sso/ScimSetupGuide.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/admin/telemetry/CatalogosTributariosHistoryPanel.tsx` |
| `.gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());` | `src/components/admin/telemetry/PerformanceMetrics.tsx` |
| `return 30 * 60 * 1000; // 30 min` | `src/components/admin/telemetry/TelemetryCharts.tsx` |
| `return 5 * 60 * 1000; // 5 min` | `src/components/admin/telemetry/TelemetryCharts.tsx` |
| `return 6 * 60 * 60 * 1000; // 6 horas (7d/custom)` | `src/components/admin/telemetry/TelemetryCharts.tsx` |
| `return 60 * 60 * 1000; // 1 hora` | `src/components/admin/telemetry/TelemetryCharts.tsx` |
| `.gte('data_vencimento', format(subMonths(hoje, 6), 'yyyy-MM-dd'));` | `src/components/analytics/BenchmarkingSetorial.tsx` |
| `return sum + diff / (1000 * 60 * 60 * 24);` | `src/components/analytics/BenchmarkingSetorial.tsx` |
| `setTimeout(() => setCopied(null), 2000);` | `src/components/api/DocumentacaoAPI.tsx` |
| `const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));` | `src/components/asaas/ExtratoAsaasPanel.tsx` |
| `window.setTimeout(() => setCopied(false), 2000);` | `src/components/audit/AuditDiffView.tsx` |
| `setTimeout(() => setCopied(null), 2000);` | `src/components/boletos/BoletoBarcode.tsx` |
| `setTimeout(() => setCopied(false), 2000);` | `src/components/boletos/BoletoPreviewPanel.tsx` |
| `setTimeout(() => setCopiedId(null), 2000);` | `src/components/clientes/PortalClientePanel.tsx` |
| `const em30Dias = addDays(hoje, 30);` | `src/components/cobranca/PrevisaoInadimplencia.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/cobranca/PrevisaoInadimplencia.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/compliance/TrilhaTable.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/conciliacao/ConciliacaoDashboard.tsx` |
| `ini = startOfDay(subDays(hoje, 29));` | `src/components/contabilidade/LancamentosTab.tsx` |
| `ini = startOfDay(subDays(hoje, 6));` | `src/components/contabilidade/LancamentosTab.tsx` |
| `ini = toIsoDate(startOfDay(subDays(hoje, 29)));` | `src/components/contabilidade/RazaoDiarioTab.tsx` |
| `ini = toIsoDate(startOfDay(subDays(hoje, 6)));` | `src/components/contabilidade/RazaoDiarioTab.tsx` |
| `copyTimer.current = setTimeout(() => setHashCopied(false), 2000);` | `src/components/contabilidade/SpedEcdDownloadStep.tsx` |
| `copyTimer.current = setTimeout(() => setHashCopied(false), 2000);` | `src/components/contabilidade/SpedEcdWizardStep3.tsx` |
| `await new Promise((r) => setTimeout(r, 2000));` | `src/components/contabilidade/ValidacoesPreSpedDialog.tsx` |
| `copyTimerRef.current = setTimeout(() => setIsCopied(false), 2000);` | `src/components/contabilidade/ValidacoesPreSpedDialog.tsx` |
| `const t = setTimeout(() => setRascunhoRestaurado(false), 4000);` | `src/components/contabilidade/sped-contabil/useSpedContabilState.ts` |
| `setTimeout(() => setExportStatus('idle'), 4000);` | `src/components/contabilidade/sped-contabil/useSpedContabilState.ts` |
| `setTimeout(() => setExportStatus('idle'), 5000);` | `src/components/contabilidade/sped-contabil/useSpedContabilState.ts` |
| `window.setTimeout(() => el.classList.remove('row-highlight-flash'), 3000);` | `src/components/contabilidade/sped-ecf-wizard/crosscheck.ts` |
| `copyTimer.current = setTimeout(() => setHashCopied(false), 2000);` | `src/components/contabilidade/sped-ecf-wizard/useSpedEcfWizardState.ts` |
| `const diffDias = Math.abs(dataT.getTime() - dataC.getTime()) / (1000 * 60 * 60 * 24);` | `src/components/contas-receber/BaixaAutomaticaDialog.tsx` |
| `(1000 * 60 * 60 * 24)` | `src/components/dashboard/DashboardExecutivo.tsx` |
| `await new Promise((r) => setTimeout(r, 1500));` | `src/components/design-system-debug/DesignSystemAudit.tsx` |
| `toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {` | `src/components/design-system-debug/DesignSystemAudit.tsx` |
| `await new Promise((r) => setTimeout(r, 1500));` | `src/components/documentos/AssinaturaDigital.tsx` |
| `setTimeout(() => this.setState({ copied: false }), 2000);` | `src/components/error/ErrorBoundary.tsx` |
| `? conversationDate < subDays(new Date(), 30)` | `src/components/expert/expertPageSupport.ts` |
| `setTimeout(() => setCopied(false), 2000);` | `src/components/nfe/NFePreview.tsx` |
| `'24h': 24 * 60 * 60 * 1000,` | `src/components/nfe/SefazAnalytics.tsx` |
| `'30d': 30 * 24 * 60 * 60 * 1000,` | `src/components/nfe/SefazAnalytics.tsx` |
| `'7d': 7 * 24 * 60 * 60 * 1000,` | `src/components/nfe/SefazAnalytics.tsx` |
| `'90d': 90 * 24 * 60 * 60 * 1000,` | `src/components/nfe/SefazAnalytics.tsx` |
| `await new Promise((resolve) => setTimeout(resolve, 2000));` | `src/components/offline/OfflineBanner.tsx` |
| `const timer = setTimeout(() => { setShowReconnected(false); setWasOffline(false); }, 3000);` | `src/components/offline/OfflineBanner.tsx` |
| `const timer = setTimeout(() => setShowWelcome(true), 2000);` | `src/components/onboarding/GuidedTour.tsx` |
| `setTimeout(() => setJustCompleted(null), 1500);` | `src/components/onboarding/OnboardingChecklist.tsx` |
| `setTimeout(() => { setShowCelebration(true); setTimeout(() => setShowCelebration(false), 4000);` | `src/components/onboarding/OnboardingChecklist.tsx` |
| `window.setTimeout(() => observer.disconnect(), 5000);` | `src/components/providers/NavigationTracker.tsx` |
| `const dias = Math.floor((alvo - Date.now()) / (1000 * 60 * 60 * 24));` | `src/components/tributario/CertificadosDigitaisTab.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/tributario/dashboard/CalculadoraWidget.tsx` |
| `const lastMonth = subMonths(new Date(), 1);` | `src/components/ui/date-range-picker.tsx` |
| `const yesterday = subDays(new Date(), 1);` | `src/components/ui/date-range-picker.tsx` |
| `start: subDays(new Date(), 29),` | `src/components/ui/date-range-picker.tsx` |
| `start: subDays(new Date(), 6),` | `src/components/ui/date-range-picker.tsx` |
| `setTimeout(() => resolve(lazyImport()), 1000 * Math.pow(2, retryCount - 1))` | `src/components/ui/lazy-load.utils.tsx` |
| `end: subDays(startOfDay(new Date()), 1),` | `src/components/ui/quick-date-filters.tsx` |
| `start: startOfDay(subDays(new Date(), 29)),` | `src/components/ui/quick-date-filters.tsx` |
| `start: startOfDay(subDays(new Date(), 6)),` | `src/components/ui/quick-date-filters.tsx` |
| `await new Promise((r) => setTimeout(r, 1500));` | `src/components/ui/ux-validator.tsx` |
| `dataVencimento = addMonths(dataVencimento, 1);` | `src/hooks/useAcordosParcelamento.ts` |
| `const emTresDias = toISOLocal(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));` | `src/hooks/useAlertas.ts` |
| `(new Date(d.dataVencimento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)` | `src/hooks/useAlertasPreditivos.ts` |
| `dataPrevisao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),` | `src/hooks/useAlertasPreditivos.ts` |
| `(dataExpiracao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)` | `src/hooks/useAuditoriaCompliance.ts` |
| `(hoje.getTime() - competencia.getTime()) / (1000 * 60 * 60 * 24)` | `src/hooks/useAuditoriaCompliance.ts` |
| `const timeout = setTimeout(() => controller.abort(), 3000);` | `src/hooks/useAuthValidation.ts` |
| `staleTime: 30 * 60 * 1000,` | `src/hooks/useBenchmarkSetorial.ts` |
| `const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);` | `src/hooks/useBlingNFe.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useCalculadoraDadosReais.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useCatalogoIssMunicipal.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useCatalogosFiscais.ts` |
| `gcTime: 60 * 60 * 1000,` | `src/hooks/useCnaes.ts` |
| `staleTime: 30 * 60 * 1000,` | `src/hooks/useCnaes.ts` |
| `const trintaDiasAtras = toISOLocal(subDays(new Date(), 30));` | `src/hooks/useCobrancas.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useConformidadeFiscal.ts` |
| `const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));` | `src/hooks/useContasPagarLogic.calculos.ts` |
| `const endOfPrevMonth = endOfMonth(subMonths(today, 1));` | `src/hooks/useContasPagarLogic.calculos.ts` |
| `const startOfPrevMonth = startOfMonth(subMonths(today, 1));` | `src/hooks/useContasPagarLogic.calculos.ts` |
| `return Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));` | `src/hooks/useContasPagarLogic.calculos.ts` |
| `const endOfPrevMonth = endOfMonth(subMonths(today, 1));` | `src/hooks/useContasReceberLogic.calculos.ts` |
| `const endOfWeek = addDays(today, 7);` | `src/hooks/useContasReceberLogic.calculos.ts` |
| `const startOfPrevMonth = startOfMonth(subMonths(today, 1));` | `src/hooks/useContasReceberLogic.calculos.ts` |
| `staleTime: 30 * 60 * 1000,` | `src/hooks/useDRETributaria.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useDashboardTributario.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useDemonstrativosContabeis.ts` |
| `const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();` | `src/hooks/useDigestEnviosLog.ts` |
| `const em30Dias = addDays(hoje, 30);` | `src/hooks/useExpertContext.ts` |
| `const em7Dias = addDays(hoje, 7);` | `src/hooks/useExpertContext.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useFinancialOperations.ts` |
| `staleTime: 2 * 60 * 1000,` | `src/hooks/useFinancialOperations.ts` |
| `const limite30d = format(addDays(new Date(), 30), 'yyyy-MM-dd');` | `src/hooks/useFluxoCaixa.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useHeatmapTributario.ts` |
| `(1000 * 60 * 60 * 24)` | `src/hooks/useInadimplenciaSegmentada.ts` |
| `const desde24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();` | `src/hooks/useInsightsIA.ts` |
| `const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days` | `src/hooks/useInstallPrompt.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useMetricasAprendizadoIA.ts` |
| `(new Date().getTime() - dataOrigem.getTime()) / (1000 * 60 * 60 * 24 * 30)` | `src/hooks/usePerDcomp.ts` |
| `staleTime: 30 * 60 * 1000,` | `src/hooks/usePlanoContas.ts` |
| `const timer = setTimeout(prefetchRelatedRoutes, 1500);` | `src/hooks/usePrefetchRoutes.ts` |
| `if (age < 2 * 60 * 1000) {` | `src/hooks/usePrefetchRoutes.ts` |
| `staleTime: 2 * 60 * 1000,` | `src/hooks/usePrefetchRoutes.ts` |
| `window.requestIdleCallback(prefetch, { timeout: 3000 });` | `src/hooks/usePrefetchRoutes.ts` |
| `{ timeout: 2000 }` | `src/hooks/usePrefetchRoutes.ts` |
| `staleTime: 30 * 60 * 1000,` | `src/hooks/usePrevisaoTributaria.ts` |
| `const ID_TTL_MS = 5 * 60 * 1000; // mesmo id nunca repete em 5 min` | `src/hooks/useRealtimeAuditToasts.ts` |
| `staleTime: 30 * 60 * 1000,` | `src/hooks/useRelatorioAnual.ts` |
| `const mesAnterior = subMonths(mesAtual, 12); // Mesmo mês do ano anterior` | `src/hooks/useRelatoriosData.ts` |
| `(new Date(r.data_vencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)` | `src/hooks/useRetencoesFonte.ts` |
| `const since = new Date(Date.now() - diasJanela * 24 * 60 * 60 * 1000)` | `src/hooks/useSLOMetrics.ts` |
| `const tresMesesAtras = subMonths(new Date(), 3);` | `src/hooks/useScoringClientes.ts` |
| `staleTime: 5 * 60 * 1000, // Cache por 5 minutos` | `src/hooks/useScoringClientes.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useVendedores.ts` |
| `timeout: 60000,` | `src/hooks/useWebAuthn.ts` |
| `refetchInterval: 5 * 60 * 1000,` | `src/hooks/bling/useOAuth.ts` |
| `staleTime: 2 * 60 * 1000,` | `src/hooks/bling/useOAuth.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/financial/useClientesFornecedores.ts` |
| `(dataEvento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)` | `src/lib/cashflow-scenarios.ts` |
| `const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));` | `src/lib/collection-engine.ts` |
| `setTimeout(() => { signOutInFlight = false; }, 5000);` | `src/lib/edge-function-error.ts` |
| `return Math.ceil(diff / (1000 * 60 * 60 * 24));` | `src/lib/formatters.ts` |
| `return Math.floor(diff / (1000 * 60 * 60 * 24));` | `src/lib/formatters.ts` |
| `config: 5 * 60 * 1000,` | `src/lib/queryClient.ts` |
| `financial: 2 * 60 * 1000,` | `src/lib/queryClient.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/lib/queryClient.ts` |
| `normal: 10 * 60 * 1000,` | `src/lib/queryClient.ts` |
| `staleTime: 2 * 60 * 1000,` | `src/lib/queryClient.ts` |
| `static: 10 * 60 * 1000,` | `src/lib/queryClient.ts` |
| `static: 30 * 60 * 1000,` | `src/lib/queryClient.ts` |
| `volatile: 5 * 60 * 1000,` | `src/lib/queryClient.ts` |
| `const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000);` | `src/lib/sefaz-rejection-monitor.ts` |
| `const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);` | `src/lib/sefaz-rejection-monitor.ts` |
| `new Date().getTime() - a.dataDetectado.getTime() < 5 * 60 * 1000` | `src/lib/sefaz-rejection-monitor.ts` |
| `export const TTL_PADRAO_MS = 7 * 24 * 60 * 60 * 1000;` | `src/lib/offline/fiscal-cache.ts` |
| `(Date.now() - new Date(dados.dataEmissao).getTime()) / (1000 * 60 * 60 * 24)` | `src/lib/sefaz-simulator/validacao.ts` |
| `descricao: `Data próxima ao vencimento (${Math.floor(Math.abs(transacao.data.getTime() - lancamento.dataVencimento.getTime()) / (1000 * 60 * 60 * 24))} dias)`,` | `src/lib/transaction-matcher/matcher.ts` |
| `const diffDias = diffMs / (1000 * 60 * 60 * 24);` | `src/lib/transaction-matcher/similarity.ts` |
| `const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();` | `src/pages/AdminTelemetria.tsx` |
| `return { from: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), to };` | `src/pages/AdminTelemetria.tsx` |
| `return { from: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), to };` | `src/pages/AdminTelemetria.tsx` |
| `return { from: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), to };` | `src/pages/AdminTelemetria.tsx` |
| `return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), to };` | `src/pages/AdminTelemetria.tsx` |
| `from: subDays(new Date(), 7),` | `src/pages/AuditLogs.tsx` |
| `const t = setTimeout(() => sessionStorage.removeItem('sso-slo-done-shown'), 5000);` | `src/pages/Auth.hooks.ts` |
| `const lastMonth = subMonths(new Date(), 1);` | `src/pages/BI.tsx` |
| `dataInicioIso: subDays(new Date(), 30).toISOString(),` | `src/pages/DashboardReceber.helpers.ts` |
| `const em30dias = format(addDays(hoje, 30), 'yyyy-MM-dd');` | `src/pages/DashboardReceber.tsx` |
| `const em7dias = format(addDays(hoje, 7), 'yyyy-MM-dd');` | `src/pages/DashboardReceber.tsx` |
| `else if (value === '30') ini = subDays(hoje, 30);` | `src/pages/DashboardReceber.tsx` |
| `else if (value === '365') ini = subDays(hoje, 365);` | `src/pages/DashboardReceber.tsx` |
| `else if (value === '90') ini = subDays(hoje, 90);` | `src/pages/DashboardReceber.tsx` |
| `if (value === '7') ini = subDays(hoje, 7);` | `src/pages/DashboardReceber.tsx` |
| `let ini = subDays(hoje, 30);` | `src/pages/DashboardReceber.tsx` |
| `setTimeout(() => setCopiedId(null), 2000);` | `src/pages/Expert.tsx` |
| `setTimeout(() => setCopied(false), 2000);` | `src/pages/admin/ApiManagement.tsx` |
| `const [fromIso, setFromIso] = useState<string>(subDays(new Date(), 30).toISOString());` | `src/pages/admin/AuditSsoProfileSync.tsx` |
| `fromIso: subDays(new Date(), 30).toISOString(),` | `src/pages/admin/SSOJitEvents.tsx` |
| `toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {` | `src/pages/bloqueios-duplicidade/DetailsDialog.tsx` |
| `setTimeout(async () => { // Libera a trava ANTES do flush: uma nova falha dentro dele precisa // poder agendar a próxima tentativa. reenvioAgendado = null; try …` | `supabase/functions/_shared/console-persist.ts` |
| `setTimeout(async () => { try { await flush(); } finally { agendado = null; resolve(); } }, 2000);` | `supabase/functions/_shared/console-persist.ts` |
| `"DELETE FROM public.alertas WHERE user_id = 42 AND created_at < now() - interval '90 days'",` | `supabase/functions/_shared/sql-write-guard_test.ts` |
| `if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {` | `supabase/functions/bitrix24-sync/index.ts` |
| `if (expiresAt.getTime() - now.getTime() < 30 * 60 * 1000) {` | `supabase/functions/bling-proxy/index.ts` |
| `const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);` | `supabase/functions/calcular-slo-metrics-diario/index.ts` |
| `const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();` | `supabase/functions/calcular-slo-metrics-diario/index.ts` |
| `const expiresAt = new Date(fetchedAt.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);` | `supabase/functions/cnpja-lookup/index.ts` |
| `const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);` | `supabase/functions/convidar-contador/index.ts` |
| `expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),` | `supabase/functions/decidir-regime/index.ts` |
| `.gte('started_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())` | `supabase/functions/detectar-anomalias-financeiras/index.ts` |
| `.lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());` | `supabase/functions/detectar-anomalias-financeiras/index.ts` |
| `.createSignedUrl(path, 7 * 24 * 60 * 60);` | `supabase/functions/enviar-relatorios-tributarios-agendados/index.ts` |
| `new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],` | `supabase/functions/executar-analise-preditiva/index.ts` |
| `periodo_referencia_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)` | `supabase/functions/executar-analise-preditiva/index.ts` |
| `const ontemISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();` | `supabase/functions/gerar-alertas/index.ts` |
| `const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();` | `supabase/functions/gerar-resumo-financeiro-diario/index.ts` |
| `connect_timeout: 10,` | `supabase/functions/mcp-query/index.ts` |
| `idle_timeout: 20,` | `supabase/functions/mcp-query/index.ts` |
| `.gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());` | `supabase/functions/monitor-health/index.ts` |
| `const COOLDOWN_ALERTA_MS = 2 * 60 * 60 * 1000;` | `supabase/functions/monitor-health/index.ts` |
| `const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000; // pula CNPJ consultado nos últimos 5min` | `supabase/functions/sefaz-dfe-dispatcher/index.ts` |
| `export const BASE_INTERVAL_MS = 15 * 60 * 1000;` | `supabase/functions/sefaz-dfe-dispatcher/policy.ts` |
| `export const MAX_BACKOFF_MS = 4 * 60 * 60 * 1000;` | `supabase/functions/sefaz-dfe-dispatcher/policy.ts` |
| `const TICK_MS = 15 * 60 * 1000;` | `supabase/functions/sefaz-dfe-dispatcher/policy_test.ts` |
| `exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours` | `supabase/functions/send-push-notification/index.ts` |
| `const SSO_FINALIZE_JANELA_MS = 10 * 60 * 1000;` | `supabase/functions/sso-callback/index.ts` |
| `if (expiresAt - Date.now() > 5 * 60 * 1000) return tokenRow.access_token;` | `supabase/functions/sync-profile-to-bitrix/index.ts` |
| `const t = setTimeout(() => ctrl.abort(), 2500);` | `supabase/functions/validate-ip-geo/index.ts` |
| `(Date.now() - new Date(conta.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)` | `supabase/functions/whatsapp-ia-proativo/index.ts` |
| `const em3Dias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];` | `supabase/functions/whatsapp-ia-proativo/index.ts` |
| `expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 year')` | `supabase/migrations/20251224125624_0eb2207e-9bdf-4fb2-b860-f6e5aca1603c.sql` |
| `AND nf.data_emissao >= (now() - interval '12 months')` | `supabase/migrations/20260508140814_1110b4ea-128f-4bad-9f92-68612f12eead.sql` |
| `AND updated_at > now() - interval '1 hour';` | `supabase/migrations/20260508180618_16cffdc0-06f0-436d-863d-2191485e652b.sql` |
| `AND data_vencimento BETWEEN (p_transaction_date - interval '3 days') AND (p_transaction_date + interval '3 days')` | `supabase/migrations/20260508182118_515e611e-628d-442c-a830-e4ce09f11abb.sql` |
| `AND created_at > now() - interval '24 months'` | `supabase/migrations/20260508195736_b880b70f-497f-491d-888a-57851d990304.sql` |
| `v_end := (v_start + interval '1 month')::date;` | `supabase/migrations/20260711164339_65d9f8e7-58ad-4550-8f21-3bfd3f4abcc4.sql` |
| `v_end := (v_start + interval '1 month')::date;` | `supabase/migrations/20260711164516_923d4d0b-293a-4591-b260-b080678d4f4d.sql` |
| `AND created_at > now() - interval '7 days'` | `supabase/migrations/20260723120954_26546526-ca79-48e8-b067-571d2d02a16d.sql` |
| `COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') AS nfe_24h,` | `supabase/migrations/20260723120954_26546526-ca79-48e8-b067-571d2d02a16d.sql` |
| `COUNT(*) FILTER (WHERE created_at > now() - interval '7 days') AS nfe_7d` | `supabase/migrations/20260723120954_26546526-ca79-48e8-b067-571d2d02a16d.sql` |
| `OR (circuit_open = true AND updated_at < now() - interval '2 hours')` | `supabase/migrations/20260723120954_26546526-ca79-48e8-b067-571d2d02a16d.sql` |
| `WHERE (ultima_consulta IS NULL OR ultima_consulta < now() - interval '6 hours')` | `supabase/migrations/20260723120954_26546526-ca79-48e8-b067-571d2d02a16d.sql` |
| `WHERE called_at < now() - interval '30 days';` | `supabase/migrations/20260723123927_a8400102-ff92-427c-acd8-458bf4149ff6.sql` |
| `WHERE called_at >= now() - interval '24 hours'` | `supabase/migrations/20260723123927_a8400102-ff92-427c-acd8-458bf4149ff6.sql` |
| `WHERE called_at >= now() - interval '7 days'` | `supabase/migrations/20260723123927_a8400102-ff92-427c-acd8-458bf4149ff6.sql` |
| `AND created_at > now() - interval '7 days'` | `supabase/migrations/20260728111542_b546a7d5-dcd7-418a-84ed-37b63bcbe941.sql` |
| `OR (circuit_open = true AND updated_at < now() - interval '2 hours')` | `supabase/migrations/20260728111542_b546a7d5-dcd7-418a-84ed-37b63bcbe941.sql` |
| `WHERE (ultima_consulta IS NULL OR ultima_consulta < now() - interval '6 hours')` | `supabase/migrations/20260728111542_b546a7d5-dcd7-418a-84ed-37b63bcbe941.sql` |
| `date_trunc('hour', now()), ARRAY['nfe_sefaz'], interval '3 hours'` | `supabase/migrations/20260728114032_4199afd5-60e2-4b8d-a222-47f6d7afa4f5.sql` |
| `CREATE OR REPLACE FUNCTION public.escalate_stale_integrity_alerts(p_age interval DEFAULT interval '24 hours')` | `supabase/migrations/20260728114948_14c7ac2c-04a6-4849-b885-3c3ce64a2351.sql` |
| `date_trunc('hour', now()), ARRAY['nfe_sefaz'], interval '3 hours'` | `supabase/migrations/20260728114948_14c7ac2c-04a6-4849-b885-3c3ce64a2351.sql` |
| `v_esc := public.escalate_stale_integrity_alerts(interval '24 hours');` | `supabase/migrations/20260728114948_14c7ac2c-04a6-4849-b885-3c3ce64a2351.sql` |
| `date_trunc('hour', now()), ARRAY['nfe_sefaz'], interval '3 hours'` | `supabase/migrations/20260728122339_3830e7ef-be38-411c-ad3c-c952ea97ab89.sql` |
| `v_esc := public.escalate_stale_integrity_alerts(interval '24 hours');` | `supabase/migrations/20260728122339_3830e7ef-be38-411c-ad3c-c952ea97ab89.sql` |
| `WHERE resolved_at >= now() - interval '24 hours'` | `supabase/migrations/20260728131439_9193257a-d6a1-464f-bd82-cb22804fd5b3.sql` |
| `WHERE a.created_at >= v_ini - interval '7 days' AND a.created_at < v_ini` | `supabase/migrations/20260728215339_6826151d-0a53-40bf-bcaa-0d19c896e505.sql` |
| `WHERE a.created_at >= v_ini - interval '7 days' AND a.created_at < v_ini` | `supabase/migrations/20260729152009_bb6c9b65-6c80-48ea-a66d-de17e67adaf7.sql` |
| `WHERE a.created_at >= v_ini - interval '7 days' AND a.created_at < v_ini` | `supabase/migrations/20260825100000_reconciliar_schema_completo.sql` |
| `AND created_at > now() - interval '7 days'` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `AND last_attempt_at > now() - interval '1 hour';` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `AND last_attempt_at > now() - interval '10 minutes';` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `IF v_lockout_duration > interval '15 minutes' THEN` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `IF v_record IS NOT NULL AND v_record.first_attempt_at < now() - interval '24 hours' THEN` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `IF v_record.first_attempt_at < now() - interval '24 hours' THEN` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `NEW.expires_at := now() + interval '2 hours';` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `VALUES (p_ip_address, 'Excesso de tentativas de login', now() + interval '1 hour')` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `WHERE a.created_at >= v_ini - interval '7 days' AND a.created_at < v_ini` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `expires_at = now() + interval '1 hour',` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `v_end := (v_start + interval '1 month')::date;` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `v_lockout_duration := (30 * power(2, LEAST(v_new_count - 5, 5)))::integer * interval '1 second';` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `v_lockout_duration := interval '1 hour';` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `v_lockout_duration := interval '1 minute';` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `v_lockout_duration := interval '15 minutes';` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `v_lockout_duration := interval '2 hours';` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `v_lockout_duration := interval '30 minutes';` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `v_lockout_duration := interval '5 minutes';` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `OR (circuit_open = true AND updated_at < now() - interval '2 hours')` | `supabase/migrations/20260826020000_fix_cron_source_check_e23_e24.sql` |
| `WHERE (ultima_consulta IS NULL OR ultima_consulta < now() - interval '6 hours')` | `supabase/migrations/20260826020000_fix_cron_source_check_e23_e24.sql` |
| `AND created_at > now() - interval '24 hours';` | `supabase/migrations/20260831153000_corrigir_12_erros_lint_funcoes.sql` |
| `WHERE resolved_at >= now() - interval '24 hours'` | `supabase/migrations/20260831153000_corrigir_12_erros_lint_funcoes.sql` |
| `WHERE snapshot_date < current_date - interval '180 days';` | `supabase/migrations/20260831153000_corrigir_12_erros_lint_funcoes.sql` |
| `WHERE a.created_at >= v_ini - interval '7 days' AND a.created_at < v_ini` | `supabase/migrations/20260903000700_fix_auditar_cross_tenant_coalesce_ativo.sql` |
| `v_end := (v_start + interval '1 month')::date;` | `supabase/migrations/20261113114335_ensure_monthly_partitions_ignora_pai_nao_particionado.sql` |

### H.3 Limites de paginação

| Limite | Arquivo |
|---|---|
| 50 | `src/components/admin/AnomaliaToastHistorico.tsx` |
| 50 | `src/components/centros-custo/CentroCustoHistorico.tsx` |
| 1000 | `src/components/conciliacao/ConciliacaoExport.tsx` |
| 1 | `src/components/configuracoes/RegrasDuplicidadeTab.tsx` |
| 20 | `src/components/configuracoes/SecuritySettings.tsx` |
| 50 | `src/components/contabilidade/contabilizacao-automatica/useContabilizacaoQueries.ts` |
| 1 | `src/components/contas-pagar/RegistrarPagamentoDialog.tsx` |
| 20 | `src/components/contas-receber/ContaReceberDetailDrawer.tsx` |
| 10 | `src/components/contas-receber/WebhookConfigPanel.tsx` |
| 50 | `src/components/integracoes/BitrixWebhookPanel.tsx` |
| 1 | `src/components/security/GeoRestrictionPanel.tsx` |
| 50 | `src/components/tesouraria/FluxoInterEmpresas.tsx` |
| 20 | `src/components/tributario/calculadora/HistoricoCenariosCalculadora.tsx` |
| 1 | `src/components/tributario/dashboard/CalculadoraWidget.tsx` |
| 5 | `src/hooks/useAcoesRecomendadas.ts` |
| 200 | `src/hooks/useAnomaliaAuditHistory.ts` |
| 100 | `src/hooks/useAnomaliaDetalhe.ts` |
| 20 | `src/hooks/useAnomaliaDetalhe.ts` |
| 1 | `src/hooks/useAnomaliaDetectionRun.ts` |
| 500 | `src/hooks/useAnomaliasCriticasCount.ts` |
| 200 | `src/hooks/useAnomaliasDetectadas.ts` |
| 500 | `src/hooks/useAnomaliasDetectadas.ts` |
| 2000 | `src/hooks/useAnomaliasReabertasIndex.ts` |
| 1 | `src/hooks/useAprovacoes.ts` |
| 500 | `src/hooks/useAuditoriaIA.ts` |
| 50 | `src/hooks/useBitrix24.ts` |
| 1 | `src/hooks/useBoletos.helpers.ts` |
| 1 | `src/hooks/useBoletos.ts` |
| 20 | `src/hooks/useComplianceKpis.ts` |
| 1 | `src/hooks/useConformidadeFiscal.ts` |
| 20000 | `src/hooks/useDemonstrativosContabeis.ts` |
| 2000 | `src/hooks/useDigestEnviosLog.ts` |
| 50 | `src/hooks/useEvidenciasPack.ts` |
| 50 | `src/hooks/useExpertConversations.ts` |
| 100 | `src/hooks/useExtratoWebhooks.ts` |
| 50 | `src/hooks/useExtratoWebhooks.ts` |
| 500 | `src/hooks/useExtratoWebhooks.ts` |
| 200 | `src/hooks/useFinancialOperations.ts` |
| 500 | `src/hooks/useFinancialOperations.ts` |
| 50 | `src/hooks/useFrontendErrorLogs.ts` |
| 1 | `src/hooks/useHealthScoreOperacional.ts` |
| 100 | `src/hooks/useHistoricoConciliacaoIA.ts` |
| 1 | `src/hooks/useLastSsoProfileSync.ts` |
| 20 | `src/hooks/useMetasFinanceiras.ts` |
| 30 | `src/hooks/useMetasFinanceiras.ts` |
| 10 | `src/hooks/useMetricasAprendizadoIA.ts` |
| 500 | `src/hooks/useNfeRecebidas.ts` |
| 500 | `src/hooks/useOperacoesTributaveis.ts` |
| 12 | `src/hooks/useOportunidadesElisao.ts` |
| 500 | `src/hooks/useOverlayRejeicoesAuditoria.ts` |
| 100 | `src/hooks/usePortalCliente.ts` |
| 500 | `src/hooks/useRateLimitLogs.ts` |
| 200 | `src/hooks/useReguaCobranca.ts` |
| 50 | `src/hooks/useRelatoriosAgendados.ts` |
| 20 | `src/hooks/useResumosExecutivos.ts` |
| 1000 | `src/hooks/useSSOJitEvents.ts` |
| 100 | `src/hooks/useSecurityAlerts.ts` |
| 100 | `src/hooks/useSefazObservability.ts` |
| 10 | `src/hooks/useSimulacaoRegimes.ts` |
| 24 | `src/hooks/useSimulacaoRegimes.ts` |
| 50 | `src/hooks/useSpedContabil.ts` |
| 50 | `src/hooks/useSpedEcfHistorico.ts` |
| 0 | `src/hooks/useStartupDiagnostic.ts` |
| 1 | `src/hooks/useStartupDiagnostic.ts` |
| 1000 | `src/hooks/useTrilhaAuditoria.ts` |
| 2000 | `src/hooks/useVerificacaoIntegracoes.ts` |
| 100 | `src/hooks/useViews.ts` |
| 200 | `src/hooks/useWhatsAppCobrancaHistory.ts` |
| 100 | `src/hooks/bling/useSyncLogs.ts` |
| 50 | `src/hooks/bling/useSyncLogs.ts` |
| 1 | `src/hooks/expert-actions/financial-actions.ts` |
| 200 | `src/hooks/financial/useClientesFornecedores.ts` |
| 1000 | `src/hooks/financial/useContasPagar.ts` |
| 1000 | `src/hooks/financial/useContasReceber.ts` |
| 500 | `src/lib/conciliacao-page-helpers.ts` |
| 50 | `src/pages/AdminEdgeHealth.tsx` |
| 500 | `src/pages/AdminTelemetria.tsx` |
| 500 | `src/pages/AuditLogs.tsx` |
| 500 | `src/pages/admin/ScimAudit.tsx` |
| 200 | `src/pages/configuracoes/HistoricoNotificacoes.tsx` |
| 1 | `supabase/functions/_shared/validation.ts` |
| 1 | `supabase/functions/asaas-proxy/index.ts` |
| 10 | `supabase/functions/asaas-proxy/index.ts` |
| 20 | `supabase/functions/asaas-proxy/index.ts` |
| 1 | `supabase/functions/bitrix24-sync/index.ts` |
| 1 | `supabase/functions/bling-proxy/index.ts` |
| 1 | `supabase/functions/calcular-health-score-operacional/index.ts` |
| 12 | `supabase/functions/comparar-benchmark-setorial/index.ts` |
| 1 | `supabase/functions/consulta-tributaria/index.ts` |
| 1 | `supabase/functions/copilot-global/index.ts` |
| 10 | `supabase/functions/copilot-global/index.ts` |
| 5 | `supabase/functions/copilot-global/index.ts` |
| 24 | `supabase/functions/decidir-regime/index.ts` |
| 1 | `supabase/functions/detectar-anomalias-financeiras/index.ts` |
| 2000 | `supabase/functions/detectar-anomalias-financeiras/index.ts` |
| 500 | `supabase/functions/detectar-anomalias-financeiras/index.ts` |
| 5000 | `supabase/functions/detectar-anomalias-financeiras/index.ts` |
| 50 | `supabase/functions/enviar-relatorios-tributarios-agendados/index.ts` |
| 1 | `supabase/functions/executar-fechamento-tributario/index.ts` |
| 100 | `supabase/functions/executar-relatorios/index.ts` |
| 1 | `supabase/functions/external-data/index.ts` |
| 1 | `supabase/functions/gerar-acoes-recomendadas/index.ts` |
| 10 | `supabase/functions/gerar-acoes-recomendadas/index.ts` |
| 5 | `supabase/functions/gerar-acoes-recomendadas/index.ts` |
| 1 | `supabase/functions/gerar-alertas-tributarios/index.ts` |
| 50000 | `supabase/functions/gerar-pacote-evidencias/index.ts` |
| 12 | `supabase/functions/gerar-snapshots-conformidade/index.ts` |
| 1 | `supabase/functions/gerar-sped-ecf/index.ts` |
| 1 | `supabase/functions/health/index.ts` |
| 1 | `supabase/functions/monitor-health/index.ts` |
| 1000 | `supabase/functions/processar-solicitacao-lgpd/index.ts` |
| 1000 | `supabase/functions/relatorio-diario-anomalias/index.ts` |
| 2000 | `supabase/functions/relatorio-diario-anomalias/index.ts` |
| 1 | `supabase/functions/sefaz-manifestar/index.ts` |
| 1 | `supabase/functions/sso-callback/index.ts` |
| 1 | `supabase/functions/sync-profile-to-bitrix/index.ts` |
| 1 | `supabase/functions/verificar-conformidade-fiscal/index.ts` |
| 12 | `supabase/functions/verificar-conformidade-fiscal/index.ts` |
| 1 | `supabase/functions/whatsapp-webhook/index.ts` |
| 1000 | `supabase/migrations/20260905000200_add_totais_contas_pagar_receber.sql` |

## I. Regras implícitas em mensagens de erro/validação

| Mensagem | Arquivo |
|---|---|
| Dependência não autorizada: ${nome} | `docs/auditoria-20260912/reproduzir-lacunas.cjs` |
| Autenticação E2E rejeitada pelo Supabase Auth (HTTP ${response.status()}).  | `e2e/auth/auth.setup.ts` |
| Pré-flight do logout destrutivo falhou: variável obrigatória ausente (${name}). | `e2e/auth/logout-real.e2e.ts` |
| falha fixture | `scripts/automation.unit.mjs` |
| ALERTS_EMAIL_FROM | `scripts/generate-env-manifest.mjs` |
| ${raiz} não é a raiz do repositório (src/lib/arquitetura/modulos.ts ausente) | `scripts/gerar-grafo-arquitetura.ts` |
| ${msg}: esperado ${JSON.stringify(b)} obtido ${JSON.stringify(a)} | `scripts/ai-context/cenarios.mjs` |
| esperado um objeto JSON | `scripts/ai-context/gerar.mjs` |
| Plano não contém exatamente as etapas 001–100 na ordem. | `scripts/auditoria-financeira/consolidar.mjs` |
| Fixture de autenticação inválida; navegação protegida não validada. | `scripts/auditoria-financeira/navegacao.mjs` |
| ${metodo} ${caminho} -> ${r.status} | `scripts/ci/actions-kpi.mjs` |
| ${metodo} ${caminho} -> falha de rede (${erro.name}: ${erro.message}) | `scripts/ci/actions-kpi.mjs` |
| fetch failed | `scripts/ci/actions-kpi.unit.mjs` |
| rede não pode ser tocada | `scripts/ci/audit-env.unit.mjs` |
| github-settings-baseline.json sem branch_protection_main.required_status_checks (lista de nomes) | `scripts/ci/fila-merge.mjs` |
| rede caiu | `scripts/ci/fila-merge.unit.mjs` |
| contexts ilegiveis ou vazios: restauracao abortada para nao apagar os checks obrigatorios | `scripts/ci/github-settings-guard.mjs` |
| Glob com sintaxe não suportada por este script: ${glob} | `scripts/ci/listar-specs-quarentena.ts` |
| config quebrado | `scripts/ci/listar-specs-quarentena.unit.mjs` |
| bloco  | `scripts/ci/render-workflow-docs.mjs` |
| shaDeployado precisa ser um sha de 40 hex: recebido  | `scripts/edge-deploy/deployment-record.mjs` |
| status exige o id do deployment | `scripts/edge-deploy/deployment-record.mjs` |
| ${argv[i]} exige um valor | `scripts/edge-deploy/health-check.mjs` |
| --project-ref obrigatório | `scripts/edge-deploy/health-check.mjs` |
| --threshold precisa ser uma fração entre 0 e 1 (ex.: 0.10 = 10%) | `scripts/edge-deploy/health-check.mjs` |
| --wait-ms precisa ser inteiro >= 0 | `scripts/edge-deploy/health-check.mjs` |
| Apenas o projeto canônico é aceito | `scripts/edge-deploy/health-check.mjs` |
| Argumento desconhecido: ${argv[i]} | `scripts/edge-deploy/health-check.mjs` |
| Management API devolveu corpo inesperado na consulta de analytics | `scripts/edge-deploy/health-check.mjs` |
| Management API devolveu erro na consulta de analytics | `scripts/edge-deploy/health-check.mjs` |
| Management API retornou HTTP ${res.status} na consulta de analytics | `scripts/edge-deploy/health-check.mjs` |
| slug de função inválido para a consulta: ${JSON.stringify(invalido)} | `scripts/edge-deploy/health-check.mjs` |
| caminho fora da base permitida (${raiz}): ${arquivo} | `scripts/edge-deploy/redigir-log.mjs` |
| caminho resolve para fora da base via link (${raizReal}): ${arquivo} | `scripts/edge-deploy/redigir-log.mjs` |
| ${caminho} -> ${r.status} ${(await r.text()).slice(0, 200)} | `scripts/edge-deploy/register-deployment.mjs` |
| GITHUB_REPOSITORY ausente ou fora do formato dono/repo | `scripts/edge-deploy/register-deployment.mjs` |
| GITHUB_TOKEN ausente | `scripts/edge-deploy/register-deployment.mjs` |
| caminho recusado (precisa começar com / e não conter ..): ${c} | `scripts/edge-deploy/register-deployment.mjs` |
| destino não permitido (allowlist): host ${destino.host} | `scripts/edge-deploy/register-deployment.mjs` |
| destino não permitido (exige https, recebido ${destino.protocol}, host ${destino.host}): ${base} | `scripts/edge-deploy/register-deployment.mjs` |
| destino recusado (URL inválida): ${base} | `scripts/edge-deploy/register-deployment.mjs` |
| fetch failed | `scripts/edge-deploy/register-deployment.unit.mjs` |
| rede não pode ser tocada | `scripts/edge-deploy/register-deployment.unit.mjs` |
| Argumento desconhecido: ${key} | `scripts/edge-deploy/smoke-functions.mjs` |
| Argumento obrigatório ausente: ${required} | `scripts/edge-deploy/smoke-functions.mjs` |
| Argumento obrigatório ausente: --functions-list (JSON plano com { functions: [{ name, verify_jwt }] }) | `scripts/edge-deploy/smoke-functions.mjs` |
| concurrency precisa ser inteiro entre 1 e 20 | `scripts/edge-deploy/smoke-functions.mjs` |
| nenhuma origem canônica em allowed-origins.json (exact) — preflight positivo impossível | `scripts/edge-deploy/smoke-functions.mjs` |
| retries precisa ser inteiro entre 1 e 5 | `scripts/edge-deploy/smoke-functions.mjs` |
| timeout-ms precisa ser inteiro entre 100 e 120000 | `scripts/edge-deploy/smoke-functions.mjs` |
| verify_jwt ausente no config.toml para a função  | `scripts/edge-deploy/smoke-functions.mjs` |
| verify_jwt inválido no config.toml para a função  | `scripts/edge-deploy/smoke-functions.mjs` |
| --expected precisa ser {  | `scripts/edge-deploy/verify-remote.mjs` |
| --expected tem função sem  | `scripts/edge-deploy/verify-remote.mjs` |
| --remote precisa ser a saída JSON de \ | `scripts/edge-deploy/verify-remote.mjs` |
| Argumento desconhecido: ${key} | `scripts/edge-deploy/verify-remote.mjs` |
| Argumento obrigatório ausente: ${required} | `scripts/edge-deploy/verify-remote.mjs` |
| Arquivo de casos precisa ser uma lista não vazia. | `scripts/graphify/benchmark.py` |
| Cada caso precisa de profile, term e expectedSource em texto. | `scripts/graphify/benchmark.py` |
| Corpus preservado da execução não foi encontrado. | `scripts/graphify/benchmark.py` |
| Mediana exige ao menos uma repetição. | `scripts/graphify/benchmark.py` |
| ripgrep ( | `scripts/graphify/benchmark.py` |
| Nenhuma Edge Function rastreada foi encontrada. | `scripts/graphify/edge_inventory.py` |
| supabase/config.toml inválido:  | `scripts/graphify/edge_inventory.py` |
| Evidência não contém inventário de arquivos. | `scripts/graphify/graph_quality.py` |
| Evidência não está validada. | `scripts/graphify/graph_quality.py` |
| Evidência não vincula os artefatos da execução. | `scripts/graphify/graph_quality.py` |
| Evidência pertence a outro commit. | `scripts/graphify/graph_quality.py` |
| Inventário de arquivos inválido. | `scripts/graphify/graph_quality.py` |
| Nome de perfil inválido. | `scripts/graphify/graph_quality.py` |
| Orçamento de nós deve ser positivo. | `scripts/graphify/graph_quality.py` |
| Arquivo excede o orçamento do piloto. | `scripts/graphify/run.py` |
| Corpus excede o orçamento total de bytes. | `scripts/graphify/run.py` |
| Corpus vazio ou acima do limite de arquivos. | `scripts/graphify/run.py` |
| Diretório de saída não pode ser link simbólico. | `scripts/graphify/run.py` |
| Extração parcial: existem arquivos selecionados sem representação. | `scripts/graphify/run.py` |
| Grafo com aresta sem nó de origem/destino. | `scripts/graphify/run.py` |
| Grafo vazio ou com identificadores duplicados. | `scripts/graphify/run.py` |
| Lista de arquivos inválida, vazia ou duplicada. | `scripts/graphify/run.py` |
| Nome de perfil inválido. | `scripts/graphify/run.py` |
| Perfil sem arquivos ou prefixos permitidos. | `scripts/graphify/run.py` |
| Prefixos do perfil inválidos. | `scripts/graphify/run.py` |
| Comentário de bloco não fechado. | `scripts/graphify/sql_inventory.py` |
| Nenhuma migration SQL encontrada. | `scripts/graphify/sql_inventory.py` |
| SQL com string, comentário ou dollar-quote não fechado. | `scripts/graphify/sql_inventory.py` |
| Nenhuma execução completa para o perfil: p | `scripts/graphify/test_benchmark.py` |
| falha sintética de cópia | `scripts/graphify/test_run.py` |
| canal indisponível | `scripts/healthcheck/03_realtime.unit.mjs` |
| ${a} exige o caminho de um arquivo | `scripts/inventario/gerar-banco.mjs` |
| --functions so vale junto com --entrada | `scripts/inventario/gerar-banco.mjs` |
| SUPABASE_PROJECT_REF=${ref} nao e o banco oficial (${PROJETO_OFICIAL}). | `scripts/inventario/gerar-banco.mjs` |
| a lista de edge functions publicadas nao e uma lista de objetos com  | `scripts/inventario/gerar-banco.mjs` |
| a resposta nao parece ser do banco oficial: ${comuns} tabelas em comum com types.ts  | `scripts/inventario/gerar-banco.mjs` |
| a saida tem algo com cara de credencial; nada foi gravado. Revise banco.sql. | `scripts/inventario/gerar-banco.mjs` |
| argumento desconhecido: ${a}\n${USO} | `scripts/inventario/gerar-banco.mjs` |
| entrada com  | `scripts/inventario/gerar-banco.mjs` |
| entrada com tabela sem  | `scripts/inventario/gerar-banco.mjs` |
| entrada sem as chaves: ${faltando.join( | `scripts/inventario/gerar-banco.mjs` |
| entrada sem tabelas | `scripts/inventario/gerar-banco.mjs` |
| format_version ${dado.format_version} desconhecido (esperado 1) | `scripts/inventario/gerar-banco.mjs` |
| sem --entrada e sem SUPABASE_ACCESS_TOKEN: nada para ler (veja o cabecalho do script). | `scripts/inventario/gerar-banco.mjs` |
| types.ts sem o bloco  | `scripts/inventario/gerar-banco.mjs` |
| nenhuma edge function em supabase/functions/*/index.ts: inventario vazio recusado. | `scripts/inventario/gerar-repo.mjs` |
| ripgrep (rg) falhou com exit ${status}; o inventario nao foi gerado. | `scripts/inventario/gerar-repo.mjs` |
| ripgrep (rg) nao encontrado; o inventario nao pode ser gerado com seguranca. | `scripts/inventario/gerar-repo.mjs` |
| ${ARQUIVO_ROTAS} sem bloco <Routes>...</Routes>: o roteador mudou de lugar e o inventario nao tem o que ler. | `scripts/inventario/gerar-rotas.mjs` |
| ${ARQUIVO_ROTAS} tem <Routes> mas nenhuma <Route path>: inventario vazio recusado. | `scripts/inventario/gerar-rotas.mjs` |
| menu lateral sem nenhum href (${ARQUIVOS_MENU.join( | `scripts/inventario/gerar-rotas.mjs` |
| INVENTARIO_REF invalida: ${ref} | `scripts/inventario/mudou-conteudo.mjs` |
| arquivo(s) gerado(s) ausente(s): ${ausentes.join( | `scripts/inventario/mudou-conteudo.mjs` |
| failed | `scripts/maintenance/lib.mjs` |
| missing_dependencies | `scripts/maintenance/lib.mjs` |
| skipped_busy | `scripts/maintenance/lib.mjs` |
| formatter fixture failed | `scripts/maintenance/maintenance.unit.mjs` |
| blocked_network_sandbox | `scripts/maintenance/run.mjs` |
| pending_patch | `scripts/maintenance/run.mjs` |
| Descrição é obrigatória | `scripts/regras_negocio/test_generate.py` |
| Erro do script de apoio | `scripts/regras_negocio/test_generate.py` |
| Pedido não encontrado | `scripts/regras_negocio/test_generate.py` |
| Token inválido para {token} | `scripts/regras_negocio/test_generate.py` |
| ACL divergente em funções sensíveis: ${failures.join( | `scripts/security/test-canonical-db-gates.mjs` |
| Constraint performance_alerts_source_check esperada em 1 linha, recebidas ${rows.length}. | `scripts/security/test-canonical-db-gates.mjs` |
| Constraint performance_alerts_source_check sem o valor obrigatório  | `scripts/security/test-canonical-db-gates.mjs` |
| Funções sensíveis ausentes no canônico: ${missingFunctions.join( | `scripts/security/test-canonical-db-gates.mjs` |
| Grants de escrita anônima fora do baseline: ${parts.join( | `scripts/security/test-canonical-db-gates.mjs` |
| Management API (${queryName}) falhou com HTTP ${response.status}: ${detail}. | `scripts/security/test-canonical-db-gates.mjs` |
| Management API (${queryName}) respondeu JSON inválido com HTTP ${response.status}. | `scripts/security/test-canonical-db-gates.mjs` |
| Management API (${queryName}) retornou formato inesperado; esperava array de linhas. | `scripts/security/test-canonical-db-gates.mjs` |
| Migrations obrigatórias ausentes no canônico: ${ausentes.join( | `scripts/security/test-canonical-db-gates.mjs` |
| Policies corrigidas divergentes: ${failures.join( | `scripts/security/test-canonical-db-gates.mjs` |
| Policies literal-true fora do baseline: ${parts.join( | `scripts/security/test-canonical-db-gates.mjs` |
| Projeto incorreto para o gate canônico: esperado ${EXPECTED_PROJECT_REF}, recebido ${projectRef}. | `scripts/security/test-canonical-db-gates.mjs` |
| SUPABASE_ACCESS_TOKEN ausente. | `scripts/security/test-canonical-db-gates.mjs` |
| SUPABASE_PROJECT_REF ausente. | `scripts/security/test-canonical-db-gates.mjs` |
| fetch indisponível para consultar a Management API do Supabase. | `scripts/security/test-canonical-db-gates.mjs` |
| Falha ao obter token authenticated: ${res.status} ${JSON.stringify(body)} | `scripts/security/test-rpc-runtime.ts` |
| , )   def main() -> int:     try:         with CONFIG.open( | `scripts/security/test-supabase-config.py` |
| Management API indisponível | `scripts/supabase_snapshot/test_snapshot.py` |
| O teste offline não permite consultas ao banco | `scripts/supabase_snapshot/test_snapshot.py` |
| banco indisponível na fixture | `scripts/supabase_snapshot/test_snapshot.py` |
| catálogo indisponível na fixture | `scripts/supabase_snapshot/test_snapshot.py` |
| permission denied for schema auth | `scripts/supabase_snapshot/test_snapshot.py` |
| relation  | `scripts/supabase_snapshot/test_snapshot.py` |
| seção fora do escopo do teste | `scripts/supabase_snapshot/test_snapshot.py` |
| statement timeout simulado | `scripts/supabase_snapshot/test_snapshot.py` |
| view removida depois da consulta ao catálogo | `scripts/supabase_snapshot/test_snapshot.py` |
| view sem permissão na fixture | `scripts/supabase_snapshot/test_snapshot.py` |
| [promo-finance] Elemento #root não encontrado no index.html — não é possível montar a aplicação. | `src/main.tsx` |
| Falha ao marcar como lida | `src/components/admin/AnomaliaDrillDownDrawer.tsx` |
| Não foi possível copiar | `src/components/admin/AnomaliaDrillDownDrawer.tsx` |
| Sem histórico para exportar | `src/components/admin/AnomaliaHistoricoSection.tsx` |
| Falha: ${e instanceof Error ? e.message :  | `src/components/admin/AutomacoesTab.tsx` |
| Erro ao carregar permissões | `src/components/admin/GerenciadorPermissoes.tsx` |
| Erro ao salvar permissões | `src/components/admin/GerenciadorPermissoes.tsx` |
| ; import { Button } from  | `src/components/admin/SilenciamentosExpirando.tsx` |
| Falha ao iniciar simulação:  | `src/components/admin/WebhookSimulator.tsx` |
| Simulação falhou no processamento. | `src/components/admin/WebhookSimulator.tsx` |
| Usuário não autenticado | `src/components/admin/WebhookSimulator.tsx` |
| Selecione ao menos 1 severidade ou desative os toasts | `src/components/admin/anomalia-preferences/useSaveAnomaliaPreferences.ts` |
|        aria-live= | `src/components/admin/anomalias-review-queue/ConflitoBannerCard.tsx` |
|  className= | `src/components/admin/anomalias-review-queue/ReviewActionsBar.tsx` |
| Comentário muito curto para confirmar | `src/components/admin/anomalias-review-queue/atalhos.ts` |
| Comentário muito curto para falso positivo | `src/components/admin/anomalias-review-queue/atalhos.ts` |
| Anomalia [${alvo.severidade.toUpperCase()} · ${TIPO_LABEL[alvo.tipo_anomalia]}] foi removida | `src/components/admin/anomalias-review-queue/useReviewQueue.ts` |
| Anomalia removida do sistema | `src/components/admin/anomalias-review-queue/useReviewQueue.ts` |
| Falha ao registrar revisão | `src/components/admin/anomalias-review-queue/useReviewQueue.ts` |
| Outro revisor já resolveu esta anomalia | `src/components/admin/anomalias-review-queue/useReviewQueue.ts` |
| ; import { Badge } from  | `src/components/admin/sso/SSODocumentacao.tsx` |
| ; import { Collapsible, CollapsibleContent, CollapsibleTrigger } from  | `src/components/admin/sso/SSOSandboxPanel.tsx` |
| Erro ao simular | `src/components/admin/sso/SSOSandboxPanel.tsx` |
| JSON inválido | `src/components/admin/sso/SSOSandboxPanel.tsx` |
| Simulação encontrou problemas | `src/components/admin/sso/SSOSandboxPanel.tsx` |
| ; import { ExternalLink } from  | `src/components/admin/sso/SSOStepConexao.tsx` |
| ; import { Switch } from  | `src/components/admin/sso/SSOStepValidacao.tsx` |
| ; import { Badge } from  | `src/components/admin/sso/ScimSetupGuide.tsx` |
| ; import { Dialog, DialogContent, DialogHeader, DialogTitle } from  | `src/components/admin/sso/ScimTokensTab.tsx` |
| Informe o nome do token | `src/components/admin/sso/ScimTokensTab.tsx` |
| Selecione a empresa alvo | `src/components/admin/sso/ScimTokensTab.tsx` |
| Selecione o papel padrão | `src/components/admin/sso/ScimTokensTab.tsx` |
| ; import { Badge } from  | `src/components/admin/sso/ScimUserJsonGenerator.tsx` |
| Corrija os erros antes de copiar | `src/components/admin/sso/ScimUserJsonGenerator.tsx` |
| Falha ao copiar para a área de transferência | `src/components/admin/sso/ScimUserJsonGenerator.tsx` |
| Falha ao iniciar SSO | `src/components/admin/sso/SsoLoginButtons.tsx` |
| ; import {   Tabs as InnerTabs,   TabsContent as InnerTabsContent,   TabsList as InnerTabsList,   TabsTrigger as InnerTabsTrigger, } from  | `src/components/admin/sso/sandbox/SandboxBulkPanel.tsx` |
| Corrija os erros de parsing antes de executar | `src/components/admin/sso/sandbox/SandboxBulkPanel.tsx` |
| Erro ao executar lote | `src/components/admin/sso/sandbox/SandboxBulkPanel.tsx` |
| Lote cancelado | `src/components/admin/sso/sandbox/SandboxBulkPanel.tsx` |
| Máximo ${BULK_MAX_USERS} usuários por lote | `src/components/admin/sso/sandbox/SandboxBulkPanel.tsx` |
| Nenhum usuário para simular | `src/components/admin/sso/sandbox/SandboxBulkPanel.tsx` |
| Erro ao remover | `src/components/admin/sso/sandbox/SandboxHistory.tsx` |
|  className= | `src/components/admin/telemetry/AcessosSuspeitosPanel.tsx` |
| Falha ao resolver: ${e.message} | `src/components/admin/telemetry/IntegrityAlertsPanel.tsx` |
| ⚠️ Novo aviso de performance | `src/components/admin/telemetry/PerformanceAlertsPanel.tsx` |
| 🚨 Regressão crítica detectada | `src/components/admin/telemetry/PerformanceAlertsPanel.tsx` |
| 🚨 Regressão crítica em tempo real | `src/components/admin/telemetry/PerformanceAlertsPanel.tsx` |
| Falha ao gerar PDF | `src/components/admin/telemetry/weekly-trend/exportUtils.ts` |
| Não foi possível copiar o link | `src/components/admin/telemetry/weekly-trend/exportUtils.ts` |
| Erro ao aprovar reset de senha | `src/components/aprovacoes/PasswordResetApprovals.tsx` |
| Erro ao rejeitar solicitação | `src/components/aprovacoes/PasswordResetApprovals.tsx` |
| Informe o motivo da rejeição | `src/components/aprovacoes/PasswordResetApprovals.tsx` |
| Preencha todos os campos obrigatórios | `src/components/asaas/AssinaturaDialog.tsx` |
| Erro ao buscar assinaturas:  | `src/components/asaas/AssinaturasListPanel.tsx` |
| Valor deve ser entre R$ 0,01 e ${formatCurrency(valorOriginal)} | `src/components/asaas/EstornoDialog.tsx` |
| Preencha nome e valor | `src/components/asaas/LinkPagamentoDialog.tsx` |
| Erro ao buscar links:  | `src/components/asaas/LinksListPanel.tsx` |
| CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos | `src/components/asaas/NovaCobrancaDialog.tsx` |
| Data de vencimento não pode ser no passado | `src/components/asaas/NovaCobrancaDialog.tsx` |
| Parcelas devem ser entre 2 e 12 | `src/components/asaas/NovaCobrancaDialog.tsx` |
| Preencha nome e CPF/CNPJ | `src/components/asaas/NovaCobrancaDialog.tsx` |
| Preencha todos os campos obrigatórios | `src/components/asaas/NovaCobrancaDialog.tsx` |
| Preencha todos os dados do cartão de crédito | `src/components/asaas/NovaCobrancaDialog.tsx` |
| Valor deve ser maior que zero | `src/components/asaas/NovaCobrancaDialog.tsx` |
| Erro ao buscar QR Code | `src/components/asaas/PixQrCodeDialog.tsx` |
| Informe a nova data de vencimento | `src/components/asaas/SegundaViaDialog.tsx` |
| A chave Pix informada não é um ${tipoChave} válido | `src/components/asaas/TransferenciaPixDialog.tsx` |
| Empresa não identificada | `src/components/asaas/TransferenciaPixDialog.tsx` |
| Preencha valor e chave Pix corretamente | `src/components/asaas/TransferenciaPixDialog.tsx` |
| Erro ao gerar relatório:  | `src/components/asaas/tabs/ConfigTab.tsx` |
| Falha ao copiar resumo | `src/components/audit/AuditDiffView.tsx` |
| ; import { Button } from  | `src/components/audit/AuditSecurityAlerts.tsx` |
| ; import { Progress } from  | `src/components/auth/AccountLockoutBanner.tsx` |
| ; import { Separator } from  | `src/components/auth/LoginForm.tsx` |
| Erro ao conectar com Google | `src/components/auth/LoginForm.tsx` |
| Erro ao entrar com Google:  | `src/components/auth/LoginForm.tsx` |
| ; import { ShieldX } from  | `src/components/auth/PermissionGate.tsx` |
| ; import { Button } from  | `src/components/auth/SloFailureBanner.tsx` |
| Falha ao limpar dados locais. Atualize a página e tente novamente. | `src/components/auth/SloFailureBanner.tsx` |
| Não foi possível encerrar a sessão no ${providerLabel}. Tente novamente em instantes. | `src/components/auth/SloFailureBanner.tsx` |
| Não há provedor SSO associado para tentar novamente. | `src/components/auth/SloFailureBanner.tsx` |
| Sessão ainda ativa após a limpeza. Atualize a página e tente novamente. | `src/components/auth/SloFailureBanner.tsx` |
| Digite o código de 6 dígitos | `src/components/auth/TwoFactorSetup.tsx` |
| Erro ao remover passkey | `src/components/auth/WebAuthnManager.tsx` |
| Informe um nome para o dispositivo | `src/components/auth/WebAuthnManager.tsx` |
| Informe um valor maior que zero | `src/components/boletos/NovoBoletoForm.tsx` |
| Selecione a empresa e conta bancária | `src/components/boletos/NovoBoletoForm.tsx` |
| Cliente não encontrado | `src/components/clientes/ClienteForm.tsx` |
| Empresa não selecionada | `src/components/clientes/ClienteForm.tsx` |
| Erro ao atualizar cliente | `src/components/clientes/ClienteForm.tsx` |
| Erro ao cadastrar cliente | `src/components/clientes/ClienteForm.tsx` |
| Erro ao gerar propostas | `src/components/cobranca/NegociacaoIA.tsx` |
|            className= | `src/components/cobranca/PrevisaoInadimplencia.tsx` |
| Erro ao analisar alertas | `src/components/cobranca/WhatsAppProativoPanel.tsx` |
| Erro ao enviar mensagem | `src/components/cobranca/WhatsAppProativoPanel.tsx` |
| ; import { toast } from  | `src/components/compliance/EvidenciaStatusDialog.tsx` |
| Nada para exportar com os filtros atuais. | `src/components/compliance/EvidenciasTab.tsx` |
| Selecione uma empresa para incluir trilhas financeira/tributária/conformidade. | `src/components/compliance/EvidenciasTab.tsx` |
| Exportação limitada a ${cap.toLocaleString( | `src/components/compliance/TrilhaTable.tsx` |
| Falha ao exportar | `src/components/compliance/TrilhaTable.tsx` |
| Nada para exportar com os filtros atuais. | `src/components/compliance/TrilhaTable.tsx` |
| Registro de auditoria não encontrado | `src/components/compliance/TrilhaTable.tsx` |
| ; import { Progress } from  | `src/components/compliance/VerificarIntegridadeTab.tsx` |
| Arquivo não parece um manifest.json válido. | `src/components/compliance/verificar-integridade/useIntegridadeVerifier.ts` |
| Falha ao ler ZIP: ${e instanceof Error ? e.message :  | `src/components/compliance/verificar-integridade/useIntegridadeVerifier.ts` |
| JSON inválido: ${e instanceof Error ? e.message :  | `src/components/compliance/verificar-integridade/useIntegridadeVerifier.ts` |
| manifest.json não encontrado ou inválido dentro do ZIP. | `src/components/compliance/verificar-integridade/useIntegridadeVerifier.ts` |
| Erro ao criar pedido:  | `src/components/compras/PedidoCompraForm.tsx` |
| Usuário não autenticado | `src/components/compras/PedidoCompraForm.tsx` |
| Erro ao analisar  | `src/components/comprovantes/ComprovanteOCR.tsx` |
| Tipo não suportado: ${file.name}. Use PNG, JPG ou PDF. | `src/components/comprovantes/ComprovanteOCR.tsx` |
| Erro ao exportar relatório | `src/components/conciliacao/ConciliacaoExport.tsx` |
| A soma dos valores parciais deve ser igual ao valor da transação | `src/components/conciliacao/ConciliacaoSplitDialog.tsx` |
| Cada lançamento parcial deve ter um valor maior que zero | `src/components/conciliacao/ConciliacaoSplitDialog.tsx` |
| Erro ao salvar conciliação parcial | `src/components/conciliacao/ConciliacaoSplitDialog.tsx` |
| Falha ao atualizar a transação e ao reverter os vínculos parciais | `src/components/conciliacao/ConciliacaoSplitDialog.tsx` |
| Erro ao salvar configurações | `src/components/conciliacao/ConfiguracaoConciliacaoPanel.tsx` |
| Open Finance não homologado | `src/components/conciliacao/ImportarExtratoDialog.tsx` |
| Erro ao criar regra | `src/components/conciliacao/RegrasConciliacaoPanel.tsx` |
| Erro ao registrar rejeição | `src/components/conciliacao/SugestoesMatchIA.tsx` |
| Erro ao atualizar job | `src/components/configuracoes/CronJobsPanel.tsx` |
| Erro ao remover job | `src/components/configuracoes/CronJobsPanel.tsx` |
| Empresa não encontrada | `src/components/configuracoes/RegrasDuplicidadeTab.tsx` |
| Erro ao salvar regras:  | `src/components/configuracoes/RegrasDuplicidadeTab.tsx` |
| Regra removida | `src/components/configuracoes/RegrasRoteamentoTab.tsx` |
| Erro ao adicionar IP | `src/components/configuracoes/SecuritySettings.tsx` |
| Erro ao atualizar configurações | `src/components/configuracoes/SecuritySettings.tsx` |
| ; import { Separator } from  | `src/components/contabilidade/AuditoriaCFCPanel.tsx` |
|              className= | `src/components/contabilidade/BalanceteTab.tsx` |
| Nada para exportar. | `src/components/contabilidade/BalanceteTab.tsx` |
| ; import { Card, CardContent, CardDescription, CardHeader, CardTitle } from  | `src/components/contabilidade/ContabilizacaoAutomaticaTab.tsx` |
| Nada para exportar. | `src/components/contabilidade/IndicesTab.tsx` |
| ; import { Badge } from  | `src/components/contabilidade/PreValidacaoSpedPanel.tsx` |
| Nada para exportar. | `src/components/contabilidade/RazaoDiarioTab.tsx` |
| ; import { Badge } from  | `src/components/contabilidade/SpedEcdDownloadStep.tsx` |
| Falha ao gerar ZIP: ${e instanceof Error ? e.message :  | `src/components/contabilidade/SpedEcdDownloadStep.tsx` |
| Não foi possível copiar o hash | `src/components/contabilidade/SpedEcdDownloadStep.tsx` |
| ; import { Badge } from  | `src/components/contabilidade/SpedEcdPreviewDialog.tsx` |
| ; import { Badge } from  | `src/components/contabilidade/SpedEcdWizard.tsx` |
| ; import { Badge } from  | `src/components/contabilidade/SpedEcdWizardStep3.tsx` |
| Falha ao gerar ZIP: ${e instanceof Error ? e.message :  | `src/components/contabilidade/SpedEcdWizardStep3.tsx` |
| Não foi possível copiar o hash | `src/components/contabilidade/SpedEcdWizardStep3.tsx` |
| Falha ao gerar link | `src/components/contabilidade/SpedEcfHistorico.tsx` |
| Falha: ${e instanceof Error ? e.message :  | `src/components/contabilidade/SpedEcfHistorico.tsx` |
| ; import {   Dialog,   DialogContent,   DialogDescription,   DialogHeader,   DialogTitle, } from  | `src/components/contabilidade/ValidacoesPreSpedDialog.tsx` |
| Erro ao copiar hash | `src/components/contabilidade/ValidacoesPreSpedDialog.tsx` |
| Conta de débito e crédito devem ser diferentes | `src/components/contabilidade/contabilizacao-automatica/useContabilizacaoMutations.ts` |
| Contas de débito e crédito devem ser diferentes | `src/components/contabilidade/contabilizacao-automatica/useContabilizacaoMutations.ts` |
| Falha na simulação:  | `src/components/contabilidade/contabilizacao-automatica/useContabilizacaoMutations.ts` |
| Mapeamento incompleto: preencha nome e contas de D/C | `src/components/contabilidade/contabilizacao-automatica/useContabilizacaoMutations.ts` |
| Preencha nome, conta débito e conta crédito | `src/components/contabilidade/contabilizacao-automatica/useContabilizacaoMutations.ts` |
| Prioridade inválida: deve ser um número positivo | `src/components/contabilidade/contabilizacao-automatica/useContabilizacaoMutations.ts` |
| … +802 linhas — lista completa em `context.json` | |

## J. Controle de acesso no código (checagens de perfil/permissão)

| Valor comparado | Arquivo |
|---|---|
| `admin` | `db/functions/webhooks/reprocess_dlq.sql` |
| `admin` | `src/components/admin/GerenciadorPermissoes.tsx` |
| `permissionId` | `src/components/admin/GerenciadorPermissoes.tsx` |
| `role` | `src/components/admin/GerenciadorPermissoes.tsx` |
| `undefined` | `src/components/admin/sso/SSOWizardDialog.tsx` |
| `user` | `src/components/cobranca/NegociacaoIA.tsx` |
| `denied` | `src/components/configuracoes/NotificacoesConfig.tsx` |
| `admin` | `src/components/contas-receber/WebhookDlqPanel.tsx` |
| `assistant` | `src/components/copilot/CopilotGlobalFloat.tsx` |
| `user` | `src/components/copilot/CopilotGlobalFloat.tsx` |
| `assistant` | `src/components/expert/ExpertChatMessages.tsx` |
| `user` | `src/components/expert/ExpertChatMessages.tsx` |
| `r` | `src/components/shared/saved-filters-bar/RoleCheckboxGroup.tsx` |
| `assistant` | `src/components/tributario/dashboard/CopilotTributarioFloat.tsx` |
| `user` | `src/components/tributario/dashboard/CopilotTributarioFloat.tsx` |
| `effectiveRole` | `src/hooks/AuthProvider.tsx` |
| `granted` | `src/hooks/usePushNotifications.ts` |
| `admin` | `src/lib/sso/consistency.ts` |
| `false` | `src/pages/AdminEdgeHealth.tsx` |
| `null` | `src/pages/AdminEdgeHealth.tsx` |
| `true` | `src/pages/AdminEdgeHealth.tsx` |
| `false` | `src/pages/AdminSystemHealth.tsx` |
| `null` | `src/pages/AdminSystemHealth.tsx` |
| `true` | `src/pages/AdminSystemHealth.tsx` |
| `admin` | `src/pages/Usuarios.tsx` |
| `financeiro` | `src/pages/Usuarios.tsx` |
| `operacional` | `src/pages/Usuarios.tsx` |
| `null` | `src/pages/admin/SRECommandCenter.tsx` |
| `roleFilter` | `src/pages/admin/SSOJitEvents.tsx` |
| `false` | `src/pages/admin/ScimAudit.tsx` |
| `null` | `src/pages/admin/ScimAudit.tsx` |
| `true` | `src/pages/admin/ScimAudit.tsx` |
| `admin` | `supabase/functions/_shared/auth-guard.ts` |
| `admin` | `supabase/functions/asaas-proxy/index.ts` |
| `admin` | `supabase/functions/enviar-digest-conformidade/index.ts` |
| `true` | `supabase/functions/enviar-digest-conformidade/index.ts` |
| `admin` | `supabase/functions/executar-fechamento-tributario/index.ts` |
| `financeiro` | `supabase/functions/executar-fechamento-tributario/index.ts` |
| `true` | `supabase/functions/gerar-snapshots-conformidade/index.ts` |
| `admin` | `supabase/functions/gerar-sped-ecd/index.ts` |
| `admin` | `supabase/functions/gerar-sped-ecf/index.ts` |
| `admin` | `supabase/functions/nfe-upload-certificado/index.ts` |
| `contador_readonly` | `supabase/functions/validar-token-contador/index.ts` |
| `admin` | `supabase/migrations/20260728113435_bc544e1e-db22-4084-896c-c00772e968b7.sql` |
| `admin` | `supabase/migrations/20260728180105_c26feff5-1235-4ef4-9b18-b43cdefaadd2.sql` |
| `admin` | `supabase/migrations/20260825100000_reconciliar_schema_completo.sql` |
| `admin` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `admin` | `supabase/migrations/20260831153000_corrigir_12_erros_lint_funcoes.sql` |
| `admin` | `supabase/migrations/20260902200000_fix_rls_cross_tenant_leak_grupo_c.sql` |
| `admin` | `supabase/migrations/20260903000900_fix_export_asaas_audit_csv_idor.sql` |
| `admin` | `supabase/migrations/20261101120500_rls_elisao_catalogo.sql` |
| `admin_global` | `supabase/migrations/20261101120500_rls_elisao_catalogo.sql` |

## K. Testes como especificação (3667 testes em 321 arquivos — nomes completos em `context.json`)

| Arquivo | Testes | Exemplos do que o sistema DEVE fazer |
|---|---|---|
| `src/lib/__tests__/emitTelemetry.test.ts` | 80 | emitTelemetry: severity classification · 0ms → normal · 1ms → normal · 100ms → normal … |
| `src/lib/__tests__/formatters.test.ts` | 80 | formatCurrency · formata valor positivo · formata zero · formata null … |
| `src/lib/__tests__/brazilian-validators.test.ts` | 76 | validateCPF · CPF válido · CPF válido sem formatação · CPF inválido - dígito errado … |
| `src/pages/__tests__/AdminTelemetria.test.tsx` | 68 | formatDuration · formats 0ms · formats 1ms · formats 500ms … |
| `src/components/contas-receber/__tests__/ContasReceberTableRow.test.tsx` | 61 | ContasReceberTableRow · Gap #14 - Coluna Empresa · mostra coluna empresa quando showEmpresa=true · não mostra coluna empresa quando showEmpresa=false … |
| `src/lib/__tests__/reforma-tributaria-calculator.test.ts` | 51 | Reforma Tributária Calculator · determinarFaseTransicao · 2025 → 2026_teste · 2026 → 2026_teste … |
| `src/lib/contabil/__tests__/indices.test.ts` | 50 | safeDiv / round2 · divide normalmente · retorna null para divisor zero · retorna null para divisor infinitesimal … |
| `src/pages/__tests__/admin-telemetria-logica.test.ts` | 50 | Severity classification thresholds · < 3000ms = no color class · >= 3000ms = yellow · >= 8000ms = destructive … |
| `src/lib/__tests__/masks.test.ts` | 38 | maskCnpjCpf · aplica máscara CPF parcial · aplica máscara CPF completo · aplica máscara CNPJ … |
| `src/lib/tributario/__tests__/historico-simulacao.test.ts` | 32 | normalizarParametrosSnapshot · aceita objeto com faturamentoAnual numérico finito · rejeita %s · coage faturamento persistido como string numérica … |
| `src/lib/__tests__/cashflow-scenarios.test.ts` | 31 | Cashflow Scenarios Engine · CENARIOS_CONFIG · contém 3 cenários · otimista tem multiplicador receitas > 1 … |
| `src/lib/tributario/__tests__/monofasico.test.ts` | 31 | normalizarNcm · remove pontuação e limita a 8 dígitos · classificarNcmMonofasico · classifica cerveja em BEBIDAS_FRIAS … |
| `src/lib/tributario/__tests__/obrigacoes-acessorias.test.ts` | 31 | obrigações acessórias — dias úteis · postergarDiaUtil pula fim de semana e feriado · enesimoDiaUtil retorna sempre um dia útil dentro do mês · enesimoDiaUtil é monotônico crescente … |
| `supabase/functions/sso-callback/claims.test.ts` | 31 | OIDC: extrai picture como avatar_url quando claim padrão presente · OIDC: extrai phone_number como telefone quando claim padrão presente · OIDC: avatar_url vazio retorna null (não sobrescreve valor existente) · OIDC: phone_number só com espaços retorna null … |
| `src/hooks/__tests__/useContasReceberLogic.test.ts` | 30 | useContasReceberLogic - KPI calculation · Gap #5 - Cálculo vence hoje · identifica contas que vencem hoje · exclui contas pagas do vence hoje … |
| `src/lib/tributario/__tests__/motor.test.ts` | 30 | Motor Tributário · RBT12 · calcula soma simples para 12+ meses · proporcionaliza para empresa com <13 meses (início de atividade) … |
| `src/lib/tributario/__tests__/conformidade-historico.test.ts` | 29 | competenciaValida · aceita apenas AAAA-MM válido · construirHistorico · retorna série vazia sem itens … |
| `src/components/contas-receber/__tests__/ContasReceberKPIs.test.tsx` | 28 | ContasReceberKPIs · Gap #4 - Comparativo temporal · exibe variação positiva com seta para cima · exibe variação negativa corretamente … |
| `src/components/reforma-tributaria/__tests__/EmptyStateTributario.test.tsx` | 28 | EmptyStateTributario · Tipo: apuracoes · exibe título correto · exibe botão primário Criar Apuração … |
| `src/components/reforma-tributaria/__tests__/GlossarioTooltip.test.tsx` | 28 | GlossarioTooltip · Termos conhecidos · renderiza termo CBS com dashed underline · renderiza termo IBS … |
| `src/lib/__tests__/plano-contas-csv-importer.test.ts` | 28 | parsePlanoContasCsv — cabeçalho e formato · rejeita arquivo vazio · rejeita cabeçalho sem colunas obrigatórias · aceita  … |
| `src/lib/tributario/__tests__/ipi-iss.test.ts` | 28 | TIPI — catálogo · não possui NCM duplicado e todos têm 8 dígitos · normaliza NCM com máscara · IPI … |
| `src/lib/tributario/__tests__/cobertura-extra.test.ts` | 27 | fator-r — calcularFolha12m · retorna 0 com histórico vazio · soma os 12 meses anteriores quando há histórico completo · proporcionaliza para empresa em início de atividade … |
| `src/lib/tributario/__tests__/folha-encargos.test.ts` | 27 | folha — FAP e RAT ajustado · normaliza o FAP dentro do intervalo legal · aplica RAT ajustado = RAT × FAP respeitando piso e teto · resolve o RAT nominal por override, grau de risco e CNAE … |
| `src/hooks/__tests__/anomaliaPreferencesValidation.test.ts` | 26 | validateAnomaliaPreferencesPatch — duração · aceita range válido · rejeita fora do range: %s · rejeita não-inteiro: %s … |
| `src/lib/__tests__/supabase-write.test.ts` | 26 | mustSucceed · devolve data quando não há erro · aceita o builder thenable do PostgREST, não só Promise · lança SupabaseWriteError com o contexto de negócio na mensagem … |
| `src/lib/tributario/__tests__/iss-overlay.test.ts` | 26 | normalização · aceita fração, percentual e string com vírgula · rejeita valores não numéricos ou negativos · normaliza nomes de município para busca tolerante … |
| `scripts/security/test-canonical-db-gates.test.mjs` | 25 | evaluateRequiredMigrations falha quando uma migration obrigatória some · evaluateRequiredMigrations tolera migration introduzida pelo próprio PR · evaluateRequiredMigrations ainda falha para migration ausente que o PR não introduziu · pendingPrMigrations extrai versões dos arquivos adicionados pelo PR … |
| `src/lib/__tests__/import-checkpoint.test.ts` | 25 | import-checkpoint · createImportCheckpoint · confirma refs e persiste após microtask · ignora refs vazias e duplicadas … |
| `src/lib/organizacoes/__tests__/convites.test.ts` | 25 | convites: token e validade · gera token hexadecimal de 64 caracteres · gera tokens distintos em 500 execuções (sem colisão) · respeita gerador determinístico injetado … |
| `src/lib/sso/__tests__/consistency.test.ts` | 25 | validateSSOConfig — happy path · configuração consistente: nenhum issue · summarizeIssues: hasBlocker=false quando sem erros · claim_mapping … |
| `src/lib/tributario/__tests__/overlay-ncm.test.ts` | 24 | normalizarAliquotaIpi · aceita fração, percentual e string com vírgula · trata 1 como 100% em fração e 100 como 100% em percentual · rejeita valores não numéricos, negativos e nulos … |
| `src/components/reforma-tributaria/__tests__/HeroKPIs.test.tsx` | 23 | HeroKPIs · Renderização dos cards · exibe carga tributária efetiva · exibe alíquotas CBS e IBS como badges … |
| `src/lib/__tests__/ofx-parser.test.ts` | 23 | OFX/CSV Parser · parseOFX · arquivo vazio retorna erro · arquivo sem transações retorna erro … |
| `src/lib/tributario/__tests__/darf-consolidacao.test.ts` | 23 | darf/tabelas — calendário · reconhece fins de semana e feriados nacionais · antecipa sempre para um dia útil · não possui códigos de receita duplicados … |
| `src/lib/tributario/__tests__/icms-st-difal.test.ts` | 23 | icms — tabelas e alíquotas interestaduais · cobre as 27 unidades federativas com parâmetros consistentes · valida UFs e identifica mercadoria importada pela origem · aplica 7% de S/SE para N/NE/CO e ES … |
| `src/lib/tributario/__tests__/periodicidade-apuracao.test.ts` | 23 | IRPJ por período de apuração · não aplica adicional até R$ 60 mil no trimestre · aplica 10% sobre o excedente trimestral · usa limite de R$ 240 mil no período anual … |
| `src/lib/tributario/__tests__/pis-cofins-creditos.test.ts` | 23 | base de cálculo da receita (Tema 69) · exclui ICMS, IPI e descontos incondicionais · nunca retorna base negativa · ignora valores inválidos ou negativos … |
| `src/lib/__tests__/navigation.test.ts` | 22 | getRouteMeta · resolve rotas exatas · resolve rotas com parâmetro · retorna undefined para rota desconhecida … |
| `src/lib/contabil/__tests__/balancete-utils.test.ts` | 22 | round2 · elimina ruído de ponto flutuante · splitSaldo · classifica saldo positivo como devedor … |
| `src/lib/tributario/elisao/__tests__/novas-estrategias.test.ts` | 22 | detectarDeliberacaoLucros · é aplicável dentro da janela com saldo e sem ata registrada · não é aplicável após 31/12/2025 · não é aplicável quando a ata já foi registrada … |
| `src/components/admin/telemetry/__tests__/performance-alerts-deeplink.test.ts` | 21 | performance-alerts-deeplink · isSeverity · aceita valores válidos · rejeita valores inválidos … |
| `src/hooks/__tests__/useAprovacoes.test.tsx` | 21 | useComentariosAprovacao (contrato real user_id/comentario) · busca comentarios com select simples (sem embed profiles — FK inexistente) · propaga erro do supabase · useConfiguracaoAprovacao (alcada com varias faixas ativas) … |
| `src/lib/tributario/elisao/__tests__/detectar-jcp.test.ts` | 21 | detectarJCP · deve identificar oportunidade aplicável para empresa Lucro Real com PL e lucro positivos · deve limitar JCP a 50% do lucro se o limite do PL for superior · não deve ser aplicável para empresas fora do Lucro Real … |
| `src/lib/__tests__/barcode-parser.test.ts` | 19 | Barcode Parser · parseBoleto · código inválido com poucos dígitos retorna erros · 44 dígitos é reconhecido como código de barras … |
| `src/lib/tributario/__tests__/conformidade-fiscal.test.ts` | 19 | classificarConformidade · mapeia as quatro faixas nos limites exatos · calcularConformidade — casos unitários · retorna 100 para conjunto vazio (sem obrigações, sem risco) … |
| `src/components/reforma-tributaria/__tests__/KPIComparativo.test.tsx` | 18 | KPIComparativo · Cálculo de variação · exibe variação positiva · exibe variação negativa … |
| `src/components/ui/__tests__/card.test.tsx` | 18 | Card · renders children · has default classes · applies custom className … |
| `src/hooks/financial/__tests__/useContasReceberPagar.test.tsx` | 18 | useContasReceber · consulta a view vw_contas_receber_painel ordenando por data_vencimento asc e primeira pagina · agrega todas as paginas: totais deixam de parar nos primeiros 1.000 titulos · propaga erro de uma pagina seguinte em vez de devolver agregado parcial … |
| `src/lib/__tests__/audit-priority.test.ts` | 18 | audit-priority · classifyAuditPriority · mapeia actions base corretamente · tabela sensível eleva para high … |
| `src/lib/__tests__/currency.test.ts` | 18 | Currency Utilities - Robustness & Regression · Floating Point Precision · deve somar valores decimais corretamente evitando erros de precisão IEEE 754 · deve lidar com somas complexas com muitos decimais … |
| `src/components/reforma-tributaria/__tests__/NavigationTributaria.test.tsx` | 17 | NavigationTributaria · Renderização de grupos · renderiza grupos na versão mobile · Badge de alertas dinâmico … |
| `src/hooks/__tests__/savedFiltersValidation.test.ts` | 17 | savedFiltersValidation > isAppRole · aceita os 4 papéis canônicos · rejeita valor inválido %p · savedFiltersValidation > normalizeRoles … |
| `src/hooks/__tests__/useConciliacaoPage.importacao.test.tsx` | 17 | useConciliacaoPage — carregamento inicial · sem conta selecionada não consulta transações e mantém a lista vazia · normaliza receita e despesa ao carregar transações bancárias · notifica erro de consulta e não mantém dados parciais … |
| `src/lib/__tests__/cfc-validator.test.ts` | 17 | validarFormatoCFC · aceita 4 níveis · aceita 5 níveis com subconta 1-3 dígitos · rejeita formatos inválidos … |
| `src/lib/__tests__/csv-importer.test.ts` | 17 | csv-importer — faturamento · parse UTF-8 com separador  · parse com separador  · parse com separador TAB … |
| `src/lib/__tests__/ofx-parser-xlsx-valor.test.ts` | 17 | parseExcel — valor monetario BRL · nao perde a grandeza de 1.234,56 (antes virava 1.234) · preserva a grandeza do negativo e o classifica como debito · rejeita celula nao numerica em vez de criar transacao NaN … |
| `src/lib/reforma-tributaria/__tests__/regras-tipos.test.ts` | 17 | LinhaCronograma — shape e campos obrigatórios (etapa 13) · todos os 10 campos obrigatórios presentes em cada linha · cobertura: há linhas para cada ano de 2026 a 2033 · 2026 — ibsMun=0 (ano-teste, art. 343 LC 214/2025) … |
| `src/lib/tributario/calculadora/__tests__/regimes.test.ts` | 17 | calcularLucroPresumido · comércio presume 8% IRPJ / 12% CSLL · rejeita receita > R$ 78 mi · PIS/COFINS cumulativo (0,65% + 3%) … |
| `src/lib/tributario/elisao/__tests__/orquestrador-elisao.e2e.test.ts` | 17 | E2E orquestrador-elisao — cobertura das 9 estratégias · Lucro Real maximiza estratégias aplicáveis vs Lucro Presumido vs Simples · JCP só é aplicável em Lucro Real com PL e lucro suficientes · REINTEGRA aplicável apenas com receita de exportação > 0 … |
| `src/components/contas-receber/__tests__/ContasReceberFilters.test.tsx` | 16 | ContasReceberFilters · Busca textual · renderiza input de busca · chama onSearchChange ao digitar … |
| `src/components/ui/__tests__/alert.test.tsx` | 16 | Alert · renders with children · has role= · renders default variant with bg-muted … |
| `src/lib/__tests__/sped-generator.test.ts` | 16 | SPED Generator · gerarEFD_IBS_CBS · gera arquivo com registro inicial 0000 · gera arquivo com registro final 9999 … |
| `src/lib/tributario/__tests__/catalogos-coerencia-iss.test.ts` | 16 | normalizarItemIss · padroniza zeros à esquerda e espaços · devolve o valor original quando o formato é inesperado · compararItensIssComCatalogo … |
| `src/lib/tributario/__tests__/icms-overlay-mva.test.ts` | 16 | overlay de MVA/ST — validação defensiva · normaliza MVA em percentual e indexa por NCM · rejeita NCM fora do formato, MVA acima do teto e duplicidade · rejeita vínculo sem UF signatária válida … |
| `src/components/contas-receber/__tests__/AplicarDescontoDialog.test.tsx` | 15 | AplicarDescontoDialog · Gap #12 - Aplicar desconto · renderiza dialog quando open=true · não renderiza quando conta é null … |
| `src/components/contas-receber/__tests__/EnviarCobrancaDialog.test.tsx` | 15 | EnviarCobrancaDialog · Gap #2 - Enviar Cobrança funcional · renderiza dialog quando open=true · não renderiza quando conta é null … |
| `src/components/ui/__tests__/button.test.tsx` | 15 | Button · renders with text · renders default variant with bg-acc (Vela) · renders destructive variant … |
| `src/components/ui/__tests__/input.test.tsx` | 15 | Input · renders with placeholder · renders default variant with border · renders filled variant … |
| `src/hooks/__tests__/savedFilterDedup.test.ts` | 15 | savedFilterDedup > checkShouldDispatch · aceita evento novo nunca visto · rejeita duplicata in-session via Set · rejeita evento mais antigo ou igual ao last_seen_at (cross-refresh) … |
| `src/lib/tributario/__tests__/comparativo-conformidade.test.ts` | 15 | comparativo multiempresa — invariantes estruturais · mantém invariantes em 400 grupos pseudoaleatórios · é determinístico: mesma entrada ⇒ mesma saída · comparativo multiempresa — regras de negócio … |
| `src/lib/tributario/__tests__/irpj-csll.test.ts` | 15 | IRPJ/CSLL — Lucro Real · aplica 15% + adicional 10% sobre o excedente trimestral · não gera adicional quando a base fica no limite de R$ 20 mil/mês · respeita a trava de 30% na compensação de prejuízo … |
| `src/lib/tributario/__tests__/overlay-monofasico.test.ts` | 15 | aplicarOverlayMonofasico · não gera override quando o banco confirma o catálogo embarcado · registra inclusão de NCM não coberto pelo motor · registra exclusão de NCM classificado pelo motor … |
| `src/lib/tributario/__tests__/robustness-consistency.test.ts` | 15 | Testes de Robustez e Casos de Borda Tributários · Valores Extremos e Arredondamentos · deve lidar com faturamento zero corretamente · deve lidar com margem de lucro de 100% corretamente … |
| `src/hooks/useBoletos.validation.test.ts` | 14 | validarEmissaoBoletoConfirmada · aceita uma confirmação completa do provedor · impede criar boleto sem identificador externo · impede criar boleto sem instrumentos de pagamento … |
| `src/hooks/__tests__/useAcordosParcelamento.pagamento.test.tsx` | 14 | registrarPagamento · grava data_pagamento e valor_pago na parcela · quita o acordo quando todas as parcelas estão pagas · quita o acordo e reverte contas_receber vinculadas para  … |
| `src/hooks/__tests__/usePreferenciasSistema.test.tsx` | 14 | usePreferenciasSistema — estados de leitura · carregado=false enquanto a leitura está pendente · carregado=true com os defaults quando não há registro · carrega o payload salvo mesclado aos defaults … |
| `src/lib/__tests__/collection-engine.test.ts` | 14 | collection-engine :: calculateCollectionStage · retorna null para status pago ou cancelado · classifica como PREVENTIVA quando ainda não venceu · classifica como LEMBRETE entre 0 e 5 dias de atraso … |
| `src/lib/__tests__/edge-function-error.test.ts` | 14 | EdgeFunctionError flags · classifica status em auth/forbidden/client/server · normalizeEdgeError · usa mensagem do body quando presente em FunctionsHttpError … |
| `src/lib/contabil/__tests__/termos-livro.test.ts` | 14 | formatarDataIso · converte ISO para dd/MM/yyyy · não altera entrada inválida · dataPorExtenso … |
| `src/lib/sso/__tests__/sandbox-bulk-runner.test.ts` | 14 | runBulk — classification · classifica seria_jit para usuário novo elegível · classifica usuario_existente quando user_exists=true · classifica sem_email quando email vazio … |
| `src/lib/tributario/__tests__/alertas-conformidade.test.ts` | 14 | avaliarAlertasConformidade — regras isoladas · não emite alertas para série vazia · não emite alertas quando o score está saudável e estável · emite score_baixo abaixo do mínimo e escala para crítica … |
| `src/lib/tributario/__tests__/icms-nao-cumulativo.test.ts` | 14 | apurarIcmsNaoCumulativo · compensa o crédito das aquisições contra o débito das saídas · nunca devolve ICMS negativo: excedente vira saldo credor · não credita compras de empresa exclusivamente prestadora de serviços … |
| `src/lib/tributario/__tests__/imunidade-exportacao.test.ts` | 14 | Lucro Presumido — imunidade das exportações · zera PIS/COFINS quando toda a receita é exportada · mantém IRPJ e CSLL integralmente devidos sobre a receita exportada · reduz PIS/COFINS proporcionalmente à fatia exportada … |
| `src/lib/tributario/__tests__/pf-vinculada.test.ts` | 14 | Tributação PF vinculada — Lei 15.270/2025 · isenta IRPF até R$ 5.000/mês · aplica redutor linear entre R$ 5.000 e R$ 7.350 · não aplica IRPFM para renda total de R$ 480k … |
| `src/lib/tributario/__tests__/projecao-reforma-transicao.test.ts` | 14 | Cronograma transição CBS/IBS · 2026: CBS 0,9% + IBS 0,1% (fase teste) · 2027: CBS = REF_CBS_2027 − 0,1, PIS/COFINS extintos · 2029: ICMS/ISS começam a reduzir (90% residual) … |
| `supabase/functions/sso-test-login/pipeline.test.ts` | 14 | pipeline: JIT + role por grupo (usuário não existe) · pipeline: usuário JÁ existe → não provisiona · pipeline: auto_provision_users=false bloqueia JIT com motivo · pipeline: múltiplos grupos — primeiro match vence, demais  … |
| `src/components/reforma-tributaria/__tests__/AnimatedCounter.test.tsx` | 13 | AnimatedCounter · Renderização inicial · renderiza com classe tabular-nums · renderiza prefix … |
| `src/components/ui/__tests__/badge.test.tsx` | 13 | Badge · renders with children · renders default variant with bg-acc (Vela) · renders secondary variant … |
| `src/hooks/__tests__/useIndicesContabeis.test.ts` | 13 | normalizarAgregados · aceita retorno em array (RPC set-returning) · preenche zeros quando o campo está ausente · nunca produz NaN a partir de lixo … |
| `src/lib/__tests__/audit-diff.test.ts` | 13 | audit-diff · computeDiff · objetos vazios ou nulos → diff vazio · classifica added/removed/changed/unchanged … |
| `src/lib/__tests__/magic-bytes.test.ts` | 13 | detectarTipo · identifica PDF, PNG e ZIP/XLSX pelas assinaturas · identifica executáveis: PE, ELF e shebang · identifica texto UTF-8 e XML … |
| `src/lib/arquitetura/__tests__/conformidade-arquitetura.test.ts` | 13 | manifesto de arquitetura · declara exatamente 12 módulos e 4 camadas · não possui ids duplicados · distribui os módulos entre todas as camadas … |
| `src/lib/arquitetura/__tests__/escopo-querykey.test.ts` | 13 | detector de escopo de empresa · fatia blocos balanceados ignorando strings e comentários · extrai a queryKey de cada useQuery · acusa filtro por empresa_id sem empresa na chave … |
| `src/lib/tributario/__tests__/catalogos-coerencia-mva.test.ts` | 13 | coerência do catálogo de MVA/ST · não acusa divergência quando o catálogo está íntegro · acusa NCM sujeito à ST sem protocolo vigente · acusa MVA fora dos limites defensivos … |
| `src/lib/tributario/__tests__/digest-conformidade.test.ts` | 13 | digest de conformidade — utilitários · escapa os cinco caracteres perigosos · normaliza severidades desconhecidas para baixa · formata competência e tolera formatos inesperados … |
| `src/lib/tributario/__tests__/snapshot-normalizacao.test.ts` | 13 | normalizarParametrosSnapshot — contrato · rejeita payloads que não são objeto · rejeita snapshot sem faturamento anual finito · coage faturamento anual persistido como string numérica … |
| `src/components/contas-receber/__tests__/ContasReceberKanban.test.tsx` | 12 | ContasReceberKanban · Gap #21 - Modo Kanban · renderiza 4 colunas: Pendente, Vencido, Parcial, Pago · agrupa contas por status corretamente … |
| `src/components/contas-receber/__tests__/WebhookDlqPanel.test.tsx` | 12 | WebhookDlqPanel · lista so as falhas em aberto, da tabela webhook_dlq · erro de leitura NAO vira fila vazia · usuario sem papel admin NAO ve  … |
| `src/components/navigation/__tests__/BackButton.test.tsx` | 12 | BackButton · renders on non-home pages · does NOT render on home page · does NOT render on /dashboard … |
| `src/hooks/__tests__/useBulkActions.test.ts` | 12 | useBulkActions · toggle adiciona e remove id da seleção · selectAll seleciona todos e limpa quando já estão todos selecionados · deselectAll/clearSelection limpa a seleção … |
| `src/lib/__tests__/filterHydrationTelemetry.test.ts` | 12 | filterHydrationTelemetry · registra evento com timestamp ISO · filtra falhas via getHydrationFailures · mantém buffer FIFO limitado a 100 eventos … |
| `src/lib/__tests__/sefaz-rejection-monitor.test.ts` | 12 | sefaz-rejection-monitor · retorna null quando não há rejeições suficientes · gera alerta tipo aviso ao atingir limite mínimo · gera alerta crítico ao atingir limite superior … |
| `src/lib/__tests__/sefaz-sem-status-fabricado.test.ts` | 12 | SEFAZ não fabrica status (F11) · sem nada gravado, o status é desconhecido — não  · status gravado sem lastCheck não vira 01/01/1970 · registro gravado pela versão que sorteava status é descartado na leitura … |
| `src/lib/reforma-tributaria/__tests__/cronograma-oficial.test.ts` | 12 | cronograma-oficial · 2029-2032: residual de ICMS/ISS + fração de IBS (sobre REF_IBS) fecham em 100% · 2029-2032: CBS sem o desconto de transição (REF_CBS_2027 pleno, art. 347 só vale 2027/2028) · 2026 e 2027-2028: IBS total (UF+Mun) é 0,1% … |
| `src/lib/sso/__tests__/sandbox-csv.test.ts` | 12 | parseBulkCsv · parse cabeçalho + groups com pipe · detecta delimitador ; · reporta erro quando faltam colunas … |
| `src/lib/tributario/__tests__/catalogos-coerencia-ncm.test.ts` | 12 | coerência NCM — catálogo espelho · não acusa divergência quando o banco espelha a TIPI · catálogo vazio acusa todos os NCMs da TIPI como ausentes · coerência NCM — detecção de drift … |
| `src/lib/tributario/__tests__/serie-comparativa.test.ts` | 12 | comparativo temporal — utilitários · formata rótulos do eixo e tolera lixo · gera dataKeys válidas e únicas · comparativo temporal — casos de borda … |
| `src/lib/tributario/__tests__/simular-real.test.ts` | 12 | simularReal · sempre é elegível · IRPJ 15% sobre lucro + adicional 10% sobre excedente de R$ 240k · CSLL 9% sobre lucro … |
| `supabase/functions/consulta-tributaria/index.test.ts` | 12 | somenteDigitos normaliza NCM e CNAE formatados · vigenteEm trata vigência aberta como válida · vigentes filtra registros fora da janela · prefixosHierarquicos gera do mais específico ao mais genérico … |
| `src/lib/__tests__/correlation-id.test.ts` | 11 | correlation-id · CORRELATION_HEADER usa o nome padrão x-request-id · newCorrelationId aplica prefixo quando fornecido · newCorrelationId sem prefixo não contém dois-pontos como separador … |
| `src/lib/arquitetura/__tests__/drift-imports.test.ts` | 11 | analisador de imports — primitivas · extrai imports estáticos, re-exports e imports dinâmicos · marca corretamente imports somente de tipo · resolve alias @/ e caminhos relativos, ignorando pacotes externos … |
| `src/lib/tributario/__tests__/catalogos-painel.test.ts` | 11 | painel de catálogos fiscais · reconhece o cenário 100% coerente · aplica a regra constitucional de 7% e 12% · detecta alíquota interestadual adulterada … |
| `src/lib/tributario/__tests__/decidir-regime.test.ts` | 11 | decidirRegime · retorna 3 cenários (Simples, Presumido, Real) · recomenda o cenário de menor carga entre os elegíveis · faturamento > R$ 4,8 mi torna Simples inelegível … |
| `src/lib/tributario/__tests__/fpas-terceiros.test.ts` | 11 | FPAS / Terceiros por CNAE · tabela é internamente coerente (soma das parcelas = alíquota total) · divisaoCnae normaliza formatações diversas · enquadra atividades conhecidas … |
| `src/lib/tributario/__tests__/icms-overlay.test.ts` | 11 | normalizarAliquota · aceita fração, percentual e string com vírgula · rejeita valores não numéricos ou negativos · aplicarOverlayUfs … |
| `src/lib/tributario/__tests__/icms-st-difal.difal.test.ts` | 11 | icms — DIFAL (EC 87/2015 e LC 190/2022) · aplica base dupla para consumidor final não contribuinte · aplica base única para destinatário contribuinte · base dupla é sempre maior ou igual à base única … |
| `src/lib/tributario/calculadora/__tests__/lucro-real.test.ts` | 11 | calcularLucroReal · calcula IRPJ com adicional 10% acima de R$ 240k anual · CSLL padrão 9% · CSLL 15% quando flag financeira … |
| `supabase/functions/_shared/carga-tributaria.test.ts` | 11 | carga: soma receita e tributo e devolve o percentual com uma decimal · carga: tributo zero com receita positiva devolve null, nao 0% · carga: receita zero devolve null em vez de dividir por zero · carga: lista vazia devolve null … |
| `src/__tests__/validators.test.ts` | 10 | Validators · validateCPF · should return true for valid CPF · should return false for invalid CPF … |
| `src/components/cobranca/__tests__/PrevisaoInadimplencia.dados.test.tsx` | 10 | PrevisaoInadimplencia — escala do score e atraso no historico · score 250 (escala 0-1000) pontua risco, e nao passa por cliente bom · score nulo e exibido como nao calculado, sem inventar 100 · titulo sem cadastro de cliente NAO derruba a previsao dos demais … |
| `src/components/cobranca/__tests__/ReguaCobrancaConfig.test.tsx` | 10 | ReguaCobrancaConfig · Renderização da régua · exibe título da configuração · exibe etapa Preventiva … |
| `src/hooks/useSelectiveEmpresaInvalidation.test.tsx` | 10 | deveRemoverNaTrocaDeEmpresa · remove queries escopadas por empresa · remove chaves que a heurística antiga deixava passar · preserva identidade do usuário e catálogos nacionais … |
| `src/hooks/__tests__/useConciliacaoPage.mutations.test.tsx` | 10 | useConciliacaoPage — confirmação e conciliação manual · persiste conta a pagar e só então altera o estado local · fluxo manual: o diálogo já persistiu — handleManualSuccess NÃO confirma de novo, só atualiza o estado · preserva estado não conciliado após rejeição da mutation … |
| `src/hooks/__tests__/useConciliacaoPage.test.tsx` | 10 | useConciliacaoPage — seleção, lote, filtros e KPIs · não confirma em lote sem lançamento vinculado · handleBulkIgnorar só abre a confirmação — não persiste antes da confirmação (E-022) · remove em lote somente após cada persistência confirmada … |
| `src/hooks/__tests__/useContratos.test.tsx` | 10 | useContratos (listagem) · lista contratos com join de cliente/fornecedor e order desc · aplica filtro eq(empresa_id) quando empresaId é informado · propaga erro da listagem … |
| `src/hooks/__tests__/useRegrasConciliacao.test.ts` | 10 | aprenderRegra · ignora padrão curto após normalização · incrementa contador quando regra já existe · insere nova regra quando não encontra padrão … |
| `src/hooks/__tests__/useRetencoesFonte.darf.test.tsx` | 10 | gerarDARF · emite a guia e marca as retenções numa única transação · não soma valores no cliente: o valor da guia não viaja no payload · id repetido não vira lote parcial … |
| `src/lib/__tests__/anomalia-routes.test.ts` | 10 | anomalia-routes · getEntidadeUrl · fallback para drill-down quando faltam dados · roteia %s → %s … |
| `src/lib/__tests__/format-filter-value.test.ts` | 10 | formatFilterValue · valores vazios viram travessão · booleans · números pt-BR … |
| `src/lib/__tests__/sso-slo-state.test.ts` | 10 | sso-slo-state · persiste e recupera snapshot com timestamp · readSloFailure retorna null quando vazio · readSloFailure retorna null para JSON inválido … |
| `src/lib/tributario/__tests__/catalogos-coerencia-ufs.test.ts` | 10 | coerência das UFs entre catálogo e motor ICMS · cobre as 27 unidades federativas · não acusa divergência quando o catálogo espelha o motor · detecta alíquota interna divergente (regressão MA/PI/RN) … |
| `src/lib/tributario/__tests__/sanitizacao-parametros.test.ts` | 10 | sanitizarParametros — domínio legal dos parâmetros · limita percentuais ao intervalo [0, 100] · renormaliza o mix quando serviços + indústria + revenda excede 100% · neutraliza NaN, Infinity e valores negativos … |
| `src/lib/tributario/__tests__/validador-ncm-cst.test.ts` | 10 | validarConsistenciaNcmCst · retorna score 100 para NCM/CST consistentes (comércio comum) · penaliza NCM monofásico (medicamentos 3004) com CST divergente · aceita CSTs válidos para monofásicos (04/06/60/060) … |
| `src/lib/tributario/calculadora/__tests__/atividade-cnae.test.ts` | 10 | normalizarCnae · normaliza %s para %s · rejeita entrada inválida %s · derivarAtividadePresumido … |
| `supabase/functions/convidar-usuario/index.test.ts` | 10 | convite de usuário: preflight não exige autenticação · convite de usuário: anônimo não alcança Auth nem banco · convite de usuário: payload inválido não cria convite · convite de usuário: rate limit bloqueia antes de consultar ou convidar … |
| `supabase/functions/sso-callback/build-profile-sync-delta.test.ts` | 10 | idempotência: incoming idêntico ao current → changes/updates vazios · idempotência: espaços extras nas pontas (incoming) são ignorados · idempotência: espaços extras no current também são ignorados · idempotência: incoming vazio/whitespace-only nunca sobrescreve … |
| `src/components/admin/telemetry/__tests__/TelemetryCharts.test.tsx` | 9 | TelemetryCharts · renders nothing when rows is empty · renders three chart cards when rows have data · renders without error for timeFilter=%s … |
| `src/components/layout/sidebar/sidebarNavState.test.ts` | 9 | isSidebarNavItemActive · exige hash correspondente quando o link aponta para uma âncora · mantém rotas sem hash ativas no mesmo pathname · mantém o item-pai ativo em rotas filhas (detalhe/edição) … |
| `src/components/tributario/dashboard/__tests__/fiscal-sem-dado.test.tsx` | 9 | heatmap tributario — ano sem faturamento · renderiza o estado vazio em vez de quebrar no insights.mes_pico · resposta sem a chave insights ainda renderiza (nao le antes da guarda) · heatmap tributario — ano parcial … |
| `src/hooks/__tests__/use-toast.test.ts` | 9 | use-toast (adapter sonner) · variant default delega para sonner com title e description · variant destructive delega para sonner.error · propaga duration … |
| `src/hooks/__tests__/useCashbackSimulador.test.ts` | 9 | useCashbackSimulador · estado inicial: elegível, cesta padrão e alíquotas de 2026 · calcula cashback por categoria conforme LC 214/2025 · inelegível quando renda acima do limite (3 salários mínimos) … |
| `src/hooks/__tests__/useConsultaTributaria.test.tsx` | 9 | consultarTributos · propaga erro de transporte da edge function · propaga erro lógico devolvido no corpo (status 200 com { error }) · encaminha os parâmetros no body da invocação … |
| `src/hooks/__tests__/useDashboardMetrics.test.ts` | 9 | useDashboardMetrics · soma saldoTotal corretamente · repassa totalReceber calculado pela RPC totais_contas_receber · calcula inadimplência como percentual de vencidas sobre total a receber … |
| `src/lib/__tests__/paginar-postgrest.test.ts` | 9 | paginarTudo · le tudo quando cabe numa pagina · le todas as paginas quando o total passa de uma · servidor que devolve menos que a janela: avanca pelo RECEBIDO … |
| `src/lib/__tests__/sefaz-contingency-state.test.ts` | 9 | sefaz-contingency :: state · activateContingency salva modo, motivo e activatedAt · deactivateContingency reseta modo e contadores · registerCommunicationFailure ativa offline após 3 falhas … |
| `src/lib/__tests__/sharedFiltersExport.test.ts` | 9 | sharedFiltersExport > buildBundle · constrói bundle limpo, ignorando papéis inválidos · sharedFiltersExport > parseBundle · aceita bundle válido e higieniza papéis … |
| `src/lib/__tests__/storage-path.test.ts` | 9 | caminhoNoStorage · extrai o caminho de uma URL pública · extrai o caminho de uma URL assinada, descartando o token · decodifica nomes com espaço e acento … |
| `src/lib/__tests__/transaction-matcher-multi.test.ts` | 9 | encontrarTodosMatches - alocação gulosa · não reutiliza lançamento já matcheado com score alto · ordena transações por valor absoluto decrescente · mantém sugestão sem consumir lançamento quando score < 80 … |
| `src/lib/tributario/__tests__/catalogos-coerencia.test.ts` | 9 | coerência entre catálogo do banco e constantes do motor · não acusa divergência quando o catálogo espelha o código · cobre as 30 faixas (5 anexos × 6 faixas) · detecta alíquota divergente … |
| `src/lib/tributario/__tests__/simular-presumido.test.ts` | 9 | simularPresumido · retorna inelegível quando faturamento > R$ 78mi · aplica presunção 8% comércio para empresa puramente comercial · aplica presunção 32% serviços … |
| `src/test/scenarios/__tests__/invariants.spec.ts` | 9 | invariants · estado vazio passa em todos · detecta duplicidade de transacao_externa_id · detecta violação de conservação de saldo … |
| `supabase/functions/sefaz-manifestar/__tests__/payload_test.ts` | 9 | payload: envelope contém chave, CNPJ autor e tpEvento corretos · payload: 210240 injeta xJust e propaga justificativa ao RPC · payload: 210210 NÃO injeta xJust mesmo se fornecida · payload: ambiente produção → endpoint www1 e tpAmb=1 … |
| `scripts/security/test-rpc-runtime.evaluate.test.ts` | 8 | evaluate · aceita 404/PGRST202 para anon e authenticated · aceita 401 apenas para anon · aceita 403 apenas quando for ACL da função alvo … |
| `src/components/admin/anomalias-review-queue/__tests__/useReviewQueue.idempotency.test.tsx` | 8 | useReviewQueue — idempotência e concorrência · #1 [idempotência] dois handleAcao paralelos para o mesmo id disparam a mutation UMA vez · #2 [retry] erro transitório  · #3 [retry esgotado] 3 falhas transitórias → toast.error + fila e stats intactos … |
| `src/components/cobranca/__tests__/PrevisaoInadimplencia.escopo.test.tsx` | 8 | PrevisaoInadimplencia — escopo por empresa · filtra contas_receber pela empresa informada · SEM empresa a consulta nao roda: pede para selecionar · historico vem em LOTE, uma consulta para todos os clientes … |
| `src/components/cobranca/previsao/__tests__/risco.test.ts` | 8 | teveAtraso · titulo ABERTO e ja vencido conta como atraso · vencido conta, cancelado nao conta · pago depois do vencimento conta; pago antes, nao … |
| `src/components/financeiro/__tests__/AnexoList.storage.test.tsx` | 8 | AnexoList — remoção · remove o objeto do storage usando o caminho extraído da URL · não apaga a linha quando o storage recusa a remoção · falha quando o delete do banco não atinge linha alguma … |
| `src/components/nfe/__tests__/sefaz-sem-metrica-fabricada.test.tsx` | 8 | painel da SEFAZ não exibe métrica fabricada (F11) · status desconhecido: banner diz  · status desconhecido:  · sem medição, os cards não mostram latência nem uptime numéricos … |
| `src/hooks/__tests__/colunasReligadas.test.tsx` | 8 | movimentações e transferências · insert de movimentação leva conta, vínculos, origem e observações · cancelar transferência grava cancelado_em · créditos tributários … |
| `src/hooks/__tests__/useAcordosParcelamento.pagamento-rateio.test.tsx` | 8 | registrarPagamento — rateio em contas_receber · rateia pelo saldo devedor quando há pagamento parcial anterior · aborta a quitação quando uma conta contratada não volta do select · propaga falha de escrita em contas_receber sem quitar o acordo … |
| `src/hooks/__tests__/useKeyboardNavigation.test.tsx` | 8 | useKeyboardNavigation · navigates back to in-app entry on Alt+ArrowLeft · goes up to parent route on Alt+ArrowLeft without in-app history · navigates forward on Alt+ArrowRight … |
| `src/hooks/__tests__/useKeyboardShortcuts.test.ts` | 8 | useKeyboardShortcuts · registra o listener de keydown UMA única vez mesmo com re-renders · remove o listener de keydown no unmount · Alt+D navega para o dashboard … |
| `src/hooks/expert-actions/__tests__/financial-actions.aprovacao.test.ts` | 8 | aprovarPagamento · aprova as duas tabelas numa transação só, sem escrita do cliente · usa o fornecedor lido dentro da transação, não o retrato anterior · não confirma ao usuário quando a função recusa a gravação … |
| `src/lib/__tests__/ip-mask.test.ts` | 8 | ip-mask · retorna  · não mascara quando desabilitado · mascara os dois últimos octetos de IPv4 … |
| `src/lib/__tests__/privacy-redact.test.ts` | 8 | redactPath · redige token de convite e contador no path · decodifica URL-encoding antes de redigir (?redirect=%2Fconvite%2F) · remove query e hash por completo (busca, CPF, magic link) … |
| `src/lib/arquitetura/__tests__/edge-functions-imports.test.ts` | 8 | Edge Functions — conformidade de imports Deno · encontra arquivos de função para auditar · usa uma única versão canônica de @supabase/supabase-js · não importa @supabase/supabase-js sem versão fixada … |
| `src/lib/tributario/__tests__/catalogos-alertas.test.ts` | 8 | alertas proativos de catálogos fiscais · não gera alerta quando todos os catálogos estão coerentes · aponta o item e o campo divergentes de uma UF adulterada · sinaliza catálogo vazio como divergência crítica … |
| `src/lib/tributario/__tests__/diagnostico-parametros.test.ts` | 8 | diagnosticarParametros · não reporta ajustes para parâmetros válidos · não reporta campos omitidos (defaults do motor não são ajustes) · reporta percentual de serviços acima de 100% como ajuste … |
| `src/lib/tributario/__tests__/prejuizo-fiscal-trava-30.test.ts` | 8 | Trava dos 30% na compensação de prejuízos (Lei 9.065/95, arts. 15 e 16) · limita a compensação a 30% do lucro do período · compensa integralmente quando o estoque é menor que a trava · não compensa em período com prejuízo e acumula ao estoque … |
| `src/lib/tributario/__tests__/rejeicoes-auditoria.test.ts` | 8 | rejeicoes-auditoria · normaliza rejeições dos quatro overlays com campo e motivo · classifica duplicidade como atenção e o restante como crítico · aceita entrada parcial sem quebrar … |
| `src/lib/tributario/__tests__/sublimite-iss-retido.test.ts` | 8 | Sublimite estadual e ISS retido no Simples Nacional · não altera o DAS quando o RBT12 está abaixo do sublimite · retira ICMS do DAS quando o RBT12 supera o sublimite (comércio) · retira ISS do DAS quando o RBT12 supera o sublimite (serviços Anexo III) … |
| `src/pages/auth/__tests__/CorporateOnboardingAudit.test.tsx` | 8 | useSsoOnboardingAudit · payload por cenário em /auth/corporate · domínio sem providers: registra domain_resolved com domain e providers_count=0 · password_fallback_used após domínio sem providers carrega o domain no contexto · domínio com 1 provider sem force: domain_resolved tem providers_count=1 e force_sso=false … |
| `src/pages/auth/__tests__/CorporateOnboardingCountdown.test.tsx` | 8 | /auth/corporate · bordas determinísticas do countdown (3s, ticks de 1000ms) · cancelar imediatamente (0ms decorridos) impede o invoke mesmo após o tempo total passar · cancelar entre o 2º e 3º tick (~2.1s) impede o invoke quando o restante é avançado · cancelar nos últimos 200ms do último tick (2800ms) ainda impede o invoke … |
| `supabase/functions/api-keys-manage/index.test.ts` | 8 | api-keys: preflight não exige autenticação · api-keys: método não permitido falha fechado · api-keys: usuário não autenticado não alcança o banco · api-keys: payload inválido não gera escrita … |
| `src/components/layout/transitions/__tests__/presets.test.ts` | 7 | resolvePreset · retorna variants completas para %s · marca needsPerspective em flip-x/flip-y · aplica duração customizada (ms → s) … |
| `src/hooks/__tests__/tenant-mutations.test.tsx` | 7 | isolamento multiempresa em categorias · não consulta categorias sem empresa ativa · lista categorias somente da empresa ativa · vincula criação, atualização e exclusão à empresa ativa e ignora empresa forjada … |
| `src/hooks/__tests__/useImportacaoXMLNFe.creditos.test.tsx` | 7 | importarNFes — créditos CBS/IBS · grava nota e créditos numa chamada só, e contabiliza depois de confirmado · manda natureza_operacao e created_by para a função decidir, não os descarta · usa a data local da emissão, não a conversão para UTC … |
| `src/hooks/financial/__tests__/views.schemas.test.ts` | 7 | views.schemas — parseRows · aceita linhas válidas mínimas de contas a receber · aceita linhas válidas mínimas de contas a pagar · preserva colunas adicionais via passthrough … |
| `src/lib/__tests__/adaptive-chunk.test.ts` | 7 | adaptive-chunk (AIMD) · respeita clamp inicial entre min e max · cresce aditivamente quando latência ≤ alvo · reduz multiplicativamente quando latência acima da tolerância … |
| `src/lib/__tests__/edge-functions.security.test.ts` | 7 | Edge Functions — superfície com service_role · encontra as edge functions do projeto · as funções privilegiadas auditadas provam a origem antes da ação · webhooks públicos autenticam a origem e falham fechados … |
| `src/lib/__tests__/optimistic-lock.test.ts` | 7 | updateComLockOtimista · atualiza quando a versão vista ainda é a atual e devolve a nova versão · rejeita com ConflitoVersaoError quando a linha mudou desde a leitura · rejeita quando a linha não existe mais (erro genérico, não conflito) … |
| `src/lib/__tests__/transaction-matcher.test.ts` | 7 | Intelligent Transaction Matcher · deve encontrar match exato por valor e nome · deve encontrar match por valor próximo (tolerância) · deve encontrar match por data próxima e nome parcial … |
| `src/lib/__tests__/utils.test.ts` | 7 | cn (classname merge) · mescla classes · resolve conflitos tailwind · ignora undefined … |
| `src/lib/pdf-generator/__tests__/conciliacao.test.ts` | 7 | generateConciliacaoAuditPDF · não abre janela quando popup é bloqueado · renderiza todas as linhas com classes de valor positivo/negativo · marca evidência quando URL presente e ausente quando não … |
| `src/lib/tributario/__tests__/coerencia-tabelas-simples.test.ts` | 7 | Coerência das tabelas do Simples Nacional · o limite do Simples é o mesmo nas duas fontes · anexo %s: motor e tabela canônica têm faixas idênticas · anexo %s: faixas são contínuas, ordenadas e sem lacunas … |
| `src/lib/tributario/__tests__/irpfm.test.ts` | 7 | IRPFM — Lei 15.270/2025 · isenta valores até R$ 50k/mês · aplica 5% sobre excedente entre R$ 50k e R$ 100k · aplica 7,5% para excedente até R$ 200k … |
| `src/lib/tributario/__tests__/paridade-motor-edge.test.ts` | 7 | paridade entre o motor tributário do cliente e o da edge function · as tabelas de anexo do Simples são idênticas · simularSimples — $nome · simularPresumido — $nome … |
| `src/lib/tributario/__tests__/paridade-obrigacoes-edge.test.ts` | 7 | paridade catálogo web × edge · mantém o mesmo conjunto de obrigações · mantém regras, multas e órgãos idênticos · paridade de prazos (24 competências × todas as obrigações) … |
| `src/lib/tributario/__tests__/presuncao-atividade.test.ts` | 7 | presunção por atividade no Lucro Presumido · mantém 32% como default quando nada é informado · aplica presunção reduzida de transporte de cargas (8% / 12%) · reduz a carga total frente à presunção geral … |
| `src/lib/tributario/__tests__/recomendar-empresa.test.ts` | 7 | recomendarEmpresa · prioriza Simples para venda de serviço pequeno · prioriza Lucro Real para compra de produto com crédito ICMS · alerta quando operação estoura limite do Simples … |
| `src/lib/tributario/__tests__/simular-simples.test.ts` | 7 | simularSimples · rejeita acima de R$ 4,8 mi · calcula DAS para comércio na faixa 1 (Anexo I) · aplica Fator R para serviços com folha alta (Anexo III) … |
| `src/lib/tributario/__tests__/versao.test.ts` | 7 | versionamento do motor tributário · expõe uma versão semântica válida · compara versões corretamente · é tolerante a entradas malformadas … |
| `src/pages/auth/__tests__/CorporateOnboarding.test.tsx` | 7 | /auth/corporate — CorporateOnboarding · renderiza o formulário inicial sem providers nem chamadas SSO · domínio SEM match em allowed_domains: mostra fallback e navega para /auth com o e-mail · domínio COM match sem force_sso: lista providers e dispara invoke ao escolher manualmente … |
| `src/pages/auth/__tests__/CorporateOnboardingUi.test.tsx` | 7 | /auth/corporate · CTAs aparecem nos momentos corretos · estado inicial: não exibe nenhum dos CTAs contextuais · domínio sem providers: exibe  · domínio com provider sem force: NÃO mostra cancelar/tentar novamente, só lista o provider … |
| `src/pages/tributario/consulta-rapida/__tests__/OfflineBadge.test.ts` | 7 | extrairOffline · devolve null para payloads sem metadado · rejeita metadado malformado · extrai metadado válido … |
| `src/pages/tributario/consulta-rapida/__tests__/shared.test.ts` | 7 | pct · trata nulos e NaN como travessão · converte frações em percentual · mantém valores já expressos em pontos percentuais … |
| `src/components/contabilidade/contabilizacao-automatica/buildDryRunPayload.test.ts` | 6 | buildDryRunPayload · passa no schema strict (sem lote_quantidade, evento_id uuid) · com ignoreRules envia ignore_rules e continua válido · categoria  … |
| `src/hooks/__tests__/useAlertasPreditivos.test.ts` | 6 | useAlertasPreditivos · gera alerta de ruptura quando saldo projetado fica negativo · detecta concentração de risco quando cliente >30% do total · não gera alertas se cenário saudável … |
| `src/hooks/__tests__/useCertificadosDigitais.upload.test.tsx` | 6 | useUploadCertificado — erro da Edge Function · leva o motivo devolvido pela função até o toast · aceita  · cai para a mensagem PT-BR do status quando o corpo não traz motivo … |
| `src/hooks/__tests__/useConciliacao.confirmar.test.tsx` | 6 | confirmarConciliacao · confirma pelo proxy sem reescrever nada fora da transação · manda os metadados de compensação junto com a confirmação · não manda bloco de compensação quando não houve ajuste … |
| `src/hooks/__tests__/useConciliacaoPageState.test.tsx` | 6 | useContaBancariaSelecionada · limpa a seleção local quando o filtro global é removido explicitamente · useTransacoesBancariasSelecionadas · descarta uma resposta tardia e mantém a lista vazia até a conta ativa carregar … |
| `src/hooks/__tests__/useExpertContext.inadimplencia.test.tsx` | 6 | indicadores do EXPERT com a carteira vencida · carteira 100% vencida reporta 100%, não 0% · carteira mista continua proporcional · liquidez e cobertura contam a dívida a pagar vencida … |
| `src/hooks/__tests__/useFluxoCaixa.test.ts` | 6 | useFluxoCaixaKPIs · calcula saldoTotal, totalReceber, totalPagar e previsão · useFluxoCaixaProjetado · retorna dias+1 entradas iniciadas com saldo inicial … |
| `src/hooks/__tests__/useLancamentosContabeis.rollback.test.tsx` | 6 | useImportLancamentosLote — rollback do cabeçalho órfão · importa sem remover nada quando as partidas gravam · remove o cabeçalho quando as partidas falham · denuncia no relatório quando o próprio rollback é recusado … |
| `src/hooks/expert-actions/__tests__/financial-actions.colunas.test.ts` | 6 | criarContaPagar · grava user_id do autor e data_emissao · criarContaReceber · grava user_id do autor (e não created_by) … |
| `src/lib/__tests__/concurrency-limiter.test.ts` | 6 | concurrency-limiter · nunca ultrapassa o limite configurado · setLimit aumenta libera tarefas pendentes imediatamente · setLimit trata valores inválidos (mínimo 1) … |
| `src/lib/sso/__tests__/sandbox-bulk-aggregator.test.ts` | 6 | aggregateBulk · soma counts por outcome · agrupa motivos de bloqueio ordenados desc · distribui papéis resolvidos … |
| `src/lib/tributario/__tests__/aliquotas-simples.test.ts` | 6 | aliquotas-simples · LIMITE_SIMPLES_NACIONAL = 4.800.000 · identificarFaixa retorna faixa correta · identificarFaixa retorna null acima do teto … |
| `src/lib/tributario/__tests__/cpp-anexo-iv.test.ts` | 6 | CPP fora do DAS — Anexo IV · classifica construção civil no Anexo IV e cobra CPP por fora · o total inclui a CPP por fora, acima do DAS puro · respeita a alíquota RAT informada e a limita a 6% … |
| `src/lib/tributario/__tests__/icms-overlay-runtime.test.ts` | 6 | tabela efetiva do motor com overlay · por padrão usa as constantes canônicas · passa a usar o valor do banco após aplicar o overlay · propaga a alíquota do banco para o cálculo de ICMS-ST … |
| `src/lib/tributario/__tests__/orquestrador-elisao.test.ts` | 6 | analisarOportunidadesElisao · roda 13 estratégias e retorna relatório consolidado · ranqueia oportunidades por economia decrescente · soma economia somente das aplicáveis … |
| `src/lib/tributario/__tests__/periodicidade-coerencia.test.ts` | 6 | coerência de base entre periodicidade anual e trimestral · usa a soma dos trimestres como lucro anual quando informados · lucro trimestral uniforme e sem prejuízo acumulado é neutro em CSLL · o trimestral nunca é mais barato que o anual sem prejuízos acumulados … |
| `src/lib/tributario/__tests__/projecao-reforma.test.ts` | 6 | Projeção Reforma Tributária 2026-2033 · cobre todos os anos 2026-2033 · calcula carga atual com PIS/COFINS + ISS · 2026 mantém PIS/COFINS/ISS integrais + CBS/IBS simbólicos … |
| `src/lib/tributario/__tests__/rbt12.test.ts` | 6 | calcularRBT12 · deve somar os últimos 12 meses quando houver histórico completo · deve proporcionalizar quando houver menos de 12 meses (início de atividade) · deve retornar 0 se não houver faturamento anterior … |
| `src/lib/tributario/__tests__/resumo-mva-st.test.ts` | 6 | resumo de cobertura da carga real de protocolos · aceita integralmente a carga semeada, sem rejeições · cobre as 27 unidades federadas em todos os protocolos · descreve a faixa de MVA por protocolo … |
| `src/lib/tributario/calculadora/__tests__/presumido-atividade-servicos.test.ts` | 6 | presunção da parcela de serviços por atividade · aplica o percentual legal de %s com 100%% de serviços · mantém 32% na parcela de serviços quando a atividade é mercantil · respeita overrides explícitos acima da derivação por atividade … |
| `src/pages/tributario/oportunidades-elisao/__tests__/AnaliseTab.catalogo.test.tsx` | 6 | AnaliseTab — catálogo não avaliado · lista a estratégia catalogada que não tem detector, com o valor de referência · NÃO lista a catalogada cujo equivalente o motor já avalia · soma só o que não é avaliado … |
| `src/test/scenarios/__tests__/faults.spec.ts` | 6 | faults · reorder é permutação (mesmo multiset) · duplicate mantém todos os originais e não perde nenhum · shouldFail(none) nunca falha … |
| `src/test/scenarios/__tests__/indices-simulation.spec.ts` | 6 | simulação de índices contábeis · executa ${CENARIOS} cenários sem NaN, Infinity ou exceção · empresa sem movimento não gera indicadores de razão zerados (usa  · classificação é monotônica em relação ao valor … |
| `supabase/functions/_shared/sefaz/__tests__/manifestacao_test.ts` | 6 | buildInfEvento gera Id ID<tipo><chave><seq2> · buildInfEvento inclui xJust apenas em 210240 · buildEnvEvento serializa envelope SOAP · recepcaoEventoEndpoint distingue produção/homologação … |
| `src/components/__tests__/regression-fixes.test.tsx` | 5 | EmpresaHeroKPI (regressão: require() no render quebrava a página) · renderiza sem lançar com dados consolidados · PageHeader (regressão: prop icon era aceito e nunca renderizado) · renderiza o ícone quando fornecido … |
| `src/components/admin/telemetry/__tests__/RetentionPoliciesPanel.test.tsx` | 5 | RetentionPoliciesPanel · sinaliza cobertura total quando todas as tabelas têm política · destaca tabelas sem política de retenção · filtra apenas as tabelas com registros vencidos … |
| `src/components/boletos/__tests__/BoletoBarcode.test.tsx` | 5 | BoletoBarcode · mostra o codigo do PROVEDOR, sem fabricar nada · o tamanho exibido e o do codigo recebido, nao um rotulo fixo de 44 · sem codigo do provedor, diz que nao tem -- e nao oferece copia … |
| `src/components/contabilidade/__tests__/ValidacoesPreSpedDialog.test.tsx` | 5 | ValidacoesPreSpedDialog — bloqueio de download por erros · desabilita .txt e .zip quando há erros em validacoes.erros · habilita .txt e .zip quando validacoes.erros está vazio (mesmo com avisos) · habilita downloads quando não há erros nem avisos … |
| `src/components/nfe/__tests__/sefaz-sem-protocolo-fabricado.test.tsx` | 5 | NF-e nao anuncia ato fiscal que nao aconteceu (F12) · inutilizacao: botao desabilitado, aviso na tela e simulador nunca chamado · cancelamento: botao desabilitado e sem chamada ao simulador · contingencia: transmissao de pendentes desabilitada … |
| `src/hooks/__tests__/useAlertasTributariosCount.test.ts` | 5 | useAlertasTributariosCount · retorna count quando query bem-sucedida · retorna 0 quando count é null · filtra por tipos tributários e lido=false … |
| `src/hooks/__tests__/useConciliacaoIA.test.ts` | 5 | useConciliacaoIA · deve retornar erro se não houver dados para análise · deve processar matches retornados pela Edge Function com sucesso · deve lidar com erros de rate limit (429) graciosamente … |
| `src/hooks/__tests__/useDashboardConfig.test.tsx` | 5 | useDashboardConfig · ocultar/exibir e redimensionar persistem e sobrevivem ao recarregar · valores inválidos salvos voltam ao padrão · DashboardConfigDialog … |
| `src/hooks/__tests__/useFluxoCaixa.escopo.test.tsx` | 5 | useFluxoCaixaKPIs · filtra as três consultas pela empresa selecionada · a previsão de 30 dias ignora vencimento fora da janela · título vencido fora da janela não entra na previsão de 30 dias … |
| `src/hooks/__tests__/useGlobalFilterSync.test.ts` | 5 | useGlobalFilterSync · deve registrar o listener de evento ao montar · deve disparar toast quando o evento current-empresa-changed ocorre · não deve disparar se o detalhe do evento estiver vazio … |
| `src/hooks/__tests__/useNfeVinculo.sugestoes.test.tsx` | 5 | useSugestoesContaPagar — formato do payload · devolve a lista quando o proxy responde o formato esperado · devolve lista vazia — não um objeto — quando o proxy responde fora do formato · trata null como ausência de candidatas, sem alarde … |
| `src/hooks/__tests__/useOportunidadesElisao.persistencia.test.tsx` | 5 | persistirOportunidades — substituição sem transação · insere a nova leva antes de apagar a anterior, e apaga só os ids lidos · o delete revalida o status: oportunidade aprovada no meio do caminho nao e apagada · insert que falha não apaga o histórico anterior e propaga o erro … |
| `src/hooks/__tests__/useUrlTab.test.tsx` | 5 | useUrlTab · usa a aba da URL quando válida · cai na aba padrão quando o valor da URL é inválido · grava a aba na URL e remove o parâmetro na aba padrão … |
| `src/lib/__tests__/conciliacao-e2e.test.ts` | 5 | E2E: Conciliação Bancária - Matching e Divergências · deve encontrar match de alta confiança com valor exato e data próxima · deve permitir match com pequena divergência de centavos · deve separar corretamente transações de crédito e débito para diferentes tipos de lançamento … |
| `src/lib/__tests__/secure-random.test.ts` | 5 | secureRandomInt · returns integers inside [min, max) · handles a single-element range and rejects inverted bounds · rejects ranges wider than the 32-bit source instead of looping … |
| `src/lib/tributario/__tests__/catalogos-saude.test.ts` | 5 | calcularSaudeCatalogos · retorna saudável e score 100 sem divergências nem rejeições · classifica como crítico quando há divergência crítica · conta rejeições de overlay como atenção mesmo sem divergências … |
| `src/lib/tributario/__tests__/restauracao-snapshot.test.ts` | 5 | restauração reprodutível de snapshots · remove campos opcionais ausentes no snapshot · preserva os campos presentes no snapshot · não muta o objeto de parâmetros correntes … |
| `src/types/__tests__/tipo-cobranca-vocabulario.test.ts` | 5 | vocabulário de tipo_cobranca · as opções de Contas a Receber são todas valores do enum do banco · nenhuma opção oferece o valor inexistente  · cartão aparece dividido em crédito e débito, como no banco … |
| `supabase/functions/ci-security-gate-log/index.test.ts` | 5 | ci-security-gate-log: OPTIONS responde 200 sem efeitos colaterais · ci-security-gate-log: 405 em método diferente de POST · ci-security-gate-log: 503 quando o segredo não está configurado · ci-security-gate-log: 401 com segredo incorreto e zero efeitos antes do guard … |
| `supabase/functions/monitor-health/index.test.ts` | 5 | problema novo: grava alerta e notifica · alerta não lido das últimas 2h: não grava e não notifica · alerta já marcado como lido e incidente persistindo: grava de novo, mas NÃO notifica · recriações sem envio não renovam o cooldown: passadas 2h do envio, o lembrete volta … |
| `supabase/functions/n8n-callback/index.test.ts` | 5 | n8n-callback: OPTIONS responde 200 sem tocar body ou DB · n8n-callback: 405 para método inválido · n8n-callback: 503 quando o segredo não está configurado · n8n-callback: 401 com segredo incorreto … |
| `supabase/functions/notify-performance-alert/index.test.ts` | 5 | notify-performance-alert: OPTIONS responde 200 sem guard nem I/O · notify-performance-alert: 405 em método inválido · notify-performance-alert: preserva falha de misconfig do guard e não toca body/fetch/DB · notify-performance-alert: 401 do guard bloqueia efeitos antes do body … |
| `supabase/functions/sefaz-dfe-puxar/__tests__/telemetry_concurrency_test.ts` | 5 | telemetria: logs estruturados contêm cStat, cb_open e duration_ms por CNPJ · circuit breaker aberto pula execução sem chamar SEFAZ · backoff pendente (next_run_at futuro) pula execução · concorrência: dois CNPJs em paralelo mantêm cursores independentes … |
| `src/components/admin/telemetry/__tests__/AcessosSuspeitosPanel.test.tsx` | 4 | AcessosSuspeitosPanel · consulta get_acessos_suspeitos com os parametros canonicos · falha na consulta NAO vira auditoria limpa · achado critico aparece na tabela |
| `src/components/dashboard/__tests__/DashboardExecutivo.duplicidades.test.tsx` | 4 | DashboardExecutivo — escopo por empresa do card de duplicidades · usa a empresa atual no queryKey e filtra a consulta por ela · a seleção explícita do filtro tem precedência sobre a empresa atual · sem empresa atual não aplica filtro (sentinela  |
| `src/components/integracoes/__tests__/open-finance-sem-extrato-fabricado.test.tsx` | 4 | painel do Open Finance não promete integração que não existe · o botão Conectar Banco fica desabilitado com o motivo à mostra · o texto não anuncia sincronização automática de saldos · avisa que nada é importado para a conciliação |
| `src/components/tributario/historico/__tests__/faturamento-grava-impostos.test.tsx` | 4 | FaturamentoTab — imposto do mês · tem campo de imposto no formulário e na tabela · manda valor_impostos no payload do upsert · não bloqueia o salvamento quando o imposto fica zero |
| `src/hooks/__tests__/kpis-comparativo-anterior.test.ts` | 4 | KPIs não fabricam o período anterior · a receber: os  · a receber: mês anterior sem recebimento vale 0, não 95% do mês atual · a pagar: mês anterior sem pagamento vale 0, não 95% do mês atual |
| `src/hooks/__tests__/useFluxoCaixaPage.dispensas.test.tsx` | 4 | useFluxoCaixaPage — dispensas de alerta por empresa · dispensar na empresa A não esconde o mesmo alerta na empresa B · voltar para a empresa A preserva a dispensa feita nela · o id do alerta não carrega a empresa, que é a razão da separação |
| `src/hooks/__tests__/useOrganizacoes.test.tsx` | 4 | useOrganizacoes · lista organizações quando há usuário logado · propaga erro da listagem · não dispara query sem usuário logado (enabled=false) |
| `src/hooks/__tests__/useSsoDomainResolver.test.tsx` | 4 | useSsoDomainResolver · normaliza o domínio e aceita o retorno canônico sem allowed_domains · falha fechando o loading quando a RPC retorna erro · encerra loading e limpa providers quando a RPC falha |
| `src/lib/queryClient.retry.test.ts` | 4 | defaults do QueryClient · não reexecuta mutação automaticamente · não deixa retryDelay de mutação configurado, que só teria uso com retry · mantém retry em queries, que são leituras e podem repetir |
| `src/lib/__tests__/conciliacao-complex-e2e.test.ts` | 4 | E2E Complexo: Conciliação Multi-Conta e Multi-CNPJ · deve filtrar matches corretamente por contaBancariaId para evitar cross-account matching · deve lidar com múltiplos CNPJs (Empresas) no mesmo pool de lançamentos se necessário · deve gerar divergência corretamente para valores parciais |
| `src/lib/__tests__/sso-error-messages.test.ts` | 4 | SSO_ERROR_MESSAGES · possui título, descrição e hint para todos os códigos · inferSsoErrorCode · inferindo  |
| `src/lib/arquitetura/__tests__/snapshot-grafo.test.ts` | 4 | snapshot do grafo de arquitetura · lista de arestas está sincronizada com o código · contagem de imports analisados está sincronizada · resumo de drift está sincronizado e zerado |
| `src/lib/transaction-matcher/converters.test.ts` | 4 | conversores de lançamentos para conciliação · usa somente o saldo residual de uma conta a pagar parcial · usa somente o saldo residual de uma conta a receber parcial · não cria saldo negativo quando a fonte está inconsistente |
| `src/lib/tributario/__tests__/catalogos-vigencia.test.ts` | 4 | normalizarReferencia · mantém datas ISO válidas · aceita Date e converte para ISO · degrada para hoje em entradas ausentes ou inválidas |
| `src/lib/tributario/__tests__/drift-guard-motor.test.ts` | 4 | Drift guard: motor tributário front x Edge Function · a função %s é logicamente idêntica nas duas cópias · mantém as constantes fiscais e a tabela de anexos idênticas · mantém as assinaturas de tipo públicas alinhadas |
| `src/lib/tributario/__tests__/drift-guard-obrigacoes.test.ts` | 4 | Drift guard: obrigações acessórias (web × Edge Function) · o módulo  · expõe exatamente a mesma superfície pública por módulo · mantém as funções de dias úteis do espelho idênticas às do módulo DARF |
| `src/lib/tributario/__tests__/fator-r.test.ts` | 4 | Fator R · deve calcular corretamente a proporção folha/receita · deve retornar 0 se a receita for zero ou negativa para evitar divisão por zero · deve determinar o anexo correto com base no fator r |
| `src/lib/tributario/__tests__/icms-overlay-mva-fuzz.test.ts` | 4 | fuzzing do overlay de MVA/ST — 750 cenários · nenhuma entrada malformada quebra o overlay ou viola invariantes · monotonicidade: MVA maior nunca reduz o ICMS-ST, mantidos os demais parâmetros · operação interna converge a MVA ajustada para a MVA original em todas as UFs |
| `src/test/a11y/critical-pages.test.tsx` | 4 | A11y — componentes críticos WCAG 2.1 AA · SkipLinks não possui violações · Formulário básico (Label + Input + Button) não possui violações · Botão com aria-label não possui violações |
| `supabase/functions/processar-solicitacao-lgpd/escrita.test.ts` | 4 | anonimização grava só colunas que existem em profiles · erro na anonimização propaga e impede o fechamento · fechamento guarda atendida_por dentro de payload_resposta · erro no fechamento propaga em vez de responder sucesso |
| `supabase/functions/sefaz-dfe-puxar/__tests__/integration_test.ts` | 4 | runPuxador processa NFe + evento e avança cursor · runPuxador — cStat=137 (empty) não persiste nada · runPuxador — cStat=656 (rate_limit) marca erro no cursor sem persistir docs · runPuxador — reprocessamento é idempotente (mesmo NSU não avança cursor duas vezes) |
| `supabase/functions/sefaz-dfe-puxar/__tests__/soap_test.ts` | 4 | buildDistDFeEnvelope inclui CNPJ, tpAmb e ultNSU 15 dígitos · parseDistDFeResponse extrai cStat/ultNSU/maxNSU e docs · classifyCStat mapeia códigos corretamente · parseDistDFeResponse lança em envelope malformado |
| `supabase/functions/sso-test-login/index.test.ts` | 4 | JIT + group mapping: payload completo quando usuário não existe e grupo mapeia role · JIT + múltiplos grupos: apenas o primeiro match define a role; demais ficam  · JIT bloqueado: auto_provision_users=false retorna would_jit_provision=false com motivo · Domínio fora da allowlist: success=false e payload ainda preserva role mapping |
| `src/components/admin/telemetry/__tests__/IntegrityAlertsPanel.test.tsx` | 3 | IntegrityAlertsPanel · consulta invariantes usando os parâmetros canônicos · resolve alerta com p_alert_id |
| `src/components/cobranca/__tests__/CustomerDeepScore.test.tsx` | 3 | CustomerDeepScore · não inventa scores de bureaus nem data de consulta quando a integração não forneceu dados · apresenta somente scores externos informados por uma integração |
| `src/components/cobranca/__tests__/MetricasPorCanal.test.tsx` | 3 | MetricasPorCanal · não projeta métricas financeiras quando não há registros reais por canal · apresenta apenas os números fornecidos por uma fonte de dados |
| `src/components/common/StartupDiagnostic.test.tsx` | 3 | StartupDiagnostic · não bloqueia a rota pública quando a checagem falha · mantém a tela da aplicação disponível durante a verificação |
| `src/components/conciliacao/__tests__/ConciliacaoManualDialog.test.tsx` | 3 | ConciliacaoManualDialog — fluxo de confirmação · chama mutateAsync antes de invocar onSuccess no caminho feliz · não invoca onSuccess quando mutateAsync rejeita |
| `src/components/conciliacao/__tests__/importar-extrato-sem-open-finance-fabricado.test.tsx` | 3 | importar extrato não oferece Open Finance fabricado (#425) · o botão Conectar via Open Finance fica desabilitado com o motivo à mostra · o texto não promete sincronização em tempo real nem gateway inexistente |
| `src/components/contas-pagar/__tests__/RegistrarPagamentoDialog.alcada.test.tsx` | 3 | RegistrarPagamentoDialog — empresa da alcada · consulta a alcada da empresa do titulo, nao a do filtro global · registro legado sem empresa_id cai no filtro global |
| `src/components/financeiro/cobranca/__tests__/WhatsAppHistoryIA.somente-leitura.test.tsx` | 3 | WhatsAppHistoryIA — envio sem provedor · por padrao nao oferece campo de envio, e explica por que · com permitirEnvio o campo volta (para quando houver provedor) |
| `src/components/fornecedores/__tests__/FornecedorForm.user-id.test.tsx` | 3 | FornecedorForm — cadastro · envia empresa_id no insert, sem o qual o fornecedor nasce sem empresa · envia user_id no insert, sem o qual a policy fornecedores_owner_insert rejeita |
| `src/components/nfe/__tests__/sefaz-monitor-sem-laco.test.tsx` | 3 | monitor da SEFAZ não verifica em laço (regressão #423) · com status CONHECIDO verifica uma vez e respeita o intervalo · com status desconhecido não verifica nada e o rodapé não promete monitoramento |
| `src/components/onboarding/__tests__/OnboardingTour.zIndex.test.tsx` | 3 | OnboardingTour — prioridade visual (zIndex) · passa options.zIndex=10000 para o Joyride (sobreposição do tour) · mantém styles.tooltip.zIndex=10000 (tooltip do tour) |
| `src/components/usuarios/__tests__/ConviteUsuarioDialog.test.tsx` | 3 | ConviteUsuarioDialog · envia o convite ao backend protegido, sem registrar um falso sucesso local · não anuncia convite quando a Edge Function falha |
| `src/contexts/__tests__/EmpresaScopeContext.test.tsx` | 3 | EmpresaScopeContext — sincronização com sistema legado · focusEmpresa dispara current-empresa-changed e sync-financial-filters com o id correto · toggleEmpresa (modo consolidado) também dispara os eventos de sincronização |
| `src/hooks/useSimulacaoRegimes.spec.tsx` | 3 | useSimulacaoRegimes Integration · deve alternar para resultado do servidor ao chamar sincronizarComServer · deve invalidar o resultado do servidor ao alterar parâmetros |
| `src/hooks/__tests__/useFluxoCaixaPage.saldo.test.tsx` | 3 | useFluxoCaixaPage — saldo final zero e projeção vazia (F07) · saldo final legitimamente ZERO nao e trocado pelo saldo inicial · projecao vazia preserva o saldo inicial e variacao zero |
| `src/hooks/expert-actions/__tests__/report-actions.vencido.test.ts` | 3 | relatórios do EXPERT com contas vencidas · o fluxo de caixa pede contas a pagar vencidas, não só pendentes · o relatório de contas a pagar pede as vencidas e as soma no total |
| `src/lib/__tests__/brazilian-validators.regression.test.ts` | 3 | brazilian-validators — regressão de API pública · preserva exports históricos · validateCPF/CNPJ geram e validam consistentes |
| `src/lib/__tests__/reforma-tributaria-types.regression.test.ts` | 3 | types/reforma-tributaria — regressão de API pública · preserva catálogos exportados · ALIQUOTAS_TRANSICAO deriva de REF_CBS_2027/REF_IBS, não de constantes fixas |
| `src/lib/__tests__/sped-generator.regression.test.ts` | 3 | sped-generator — regressão de API pública · preserva exports históricos após modularização · validarArquivoSPED rejeita conteúdo inválido |
| `src/lib/compras/__tests__/pedidos.test.ts` | 3 | calcularMetricasPedidosCompra · considera somente pedidos persistidos no mês de referência · não inventa dados quando não há pedidos com data de emissão |
| `src/lib/offline/__tests__/fiscal-cache.test.ts` | 3 | fiscal-cache · gera chave determinística e independente da ordem das propriedades · degrada com segurança quando IndexedDB não está disponível (jsdom) |
| `src/lib/tributario/elisao/__tests__/orquestrador-elisao.test.ts` | 3 | analisarOportunidadesElisao · deve consolidar e ranquear as oportunidades detectadas · deve retornar zero economia aplicável para uma empresa recém-aberta sem dados |
| `src/pages/AsaasQueueHistoryDialog.test.ts` | 3 | formatarTimestampFila · não deixa um timestamp ausente ou inválido interromper o histórico · mantém a formatação para timestamp ISO válido |
| `src/pages/__tests__/admin-telemetria-paineis-ligados.test.ts` | 3 | AdminTelemetria — paineis ligados na pagina · %s esta importado · %s esta renderizado no JSX |
| `src/test/a11y/indices-tab.test.tsx` | 3 | A11y — aba Índices contábeis · grade de indicadores não possui violações · toolbar de filtros não possui violações |
| `src/test/scenarios/__tests__/nfe-puxador-faults.spec.ts` | 3 | scenarios/nfe :: novos faults do puxador SEFAZ · 1000 cenários NFe × 3 faults do puxador ⇒ 0 violações · cada fault kind produz cenários que executam sem violar invariantes |
| `supabase/functions/asaas-proxy/credit-risk.test.ts` | 3 | extrai resposta JSON mesmo dentro de bloco markdown · rejeita score inventado, fora da faixa ou resposta incompleta · classifica as fronteiras de risco |
| `supabase/functions/enviar-alerta-email/index.test.ts` | 3 | enviar-alerta-email rejeita chamada sem credencial antes de acessar serviços · enviar-alerta-email rejeita segredo interno incorreto antes de acessar serviços · enviar-alerta-email preserva preflight e não anuncia headers de segredo no preflight |
| `supabase/functions/executar-analise-preditiva/index.test.ts` | 3 | executar-analise-preditiva rejeita chamada sem credencial antes de acessar serviços · executar-analise-preditiva rejeita segredo interno incorreto antes de acessar serviços · executar-analise-preditiva preserva preflight e não anuncia headers de segredo no preflight |
| `supabase/functions/executar-regua-cobranca/domain.test.ts` | 3 | normaliza dias, remove duplicados e rejeita valores inválidos · normaliza e limita canais ao contrato conhecido · calcula datas antes, no dia e depois do vencimento em UTC |
| `supabase/functions/gerar-alertas-tributarios/index.test.ts` | 3 | gerar-alertas-tributarios rejeita chamada sem credencial antes de acessar o banco · gerar-alertas-tributarios rejeita segredo interno incorreto antes de acessar o banco · gerar-alertas-tributarios preserva preflight e não anuncia headers de segredo no preflight |
| `supabase/functions/sefaz-dfe-puxar/__tests__/parser_test.ts` | 3 | detectSchema identifica procNFe, resNFe e procEventoNFe · parseDoc extrai chave de 44 dígitos de procNFe · parseDoc devolve null para XML sem schema conhecido |
| `src/components/command-palette/commandPaletteManagement.test.ts` | 2 | comandos de criação rápida · leva a intenção de abrir o formulário até a rota de destino |
| … +21 linhas — lista completa em `context.json` | | |

## L. Eventos de webhook tratados (contratos com sistemas externos)

| Evento | Arquivo |
|---|---|
| `pagar` | `src/components/boletos/NovoBoletoForm.tsx` |
| `receber` | `src/components/boletos/NovoBoletoForm.tsx` |
| `confirmar` | `supabase/functions/conciliacao-proxy/index.ts` |
| `desfazer` | `supabase/functions/conciliacao-proxy/index.ts` |
| `name.familyname` | `supabase/functions/scim-server/index.ts` |
| `name.formatted` | `supabase/functions/scim-server/index.ts` |
| `name.givenname` | `supabase/functions/scim-server/index.ts` |

## M. Efeitos colaterais (e-mail, SMS, cobrança, fila — não são idempotentes por padrão)

| Chamada | Arquivo |
|---|---|
| `invoke(` | `src/components/admin/AutomacoesTab.tsx` |
| `asaas` | `src/components/admin/WebhookSimulator.tsx` |
| `invoke(` | `src/components/admin/WebhookSimulator.tsx` |
| `invoke(` | `src/components/admin/sso/SsoLoginButtons.tsx` |
| `asaas` | `src/components/asaas/AssinaturaDialog.tsx` |
| `asaas` | `src/components/asaas/AssinaturasListPanel.tsx` |
| `invoke(` | `src/components/asaas/AssinaturasListPanel.tsx` |
| `asaas` | `src/components/asaas/ClientesAsaasDialog.tsx` |
| `asaas` | `src/components/asaas/EstornoDialog.tsx` |
| `asaas` | `src/components/asaas/LinksListPanel.tsx` |
| `invoke(` | `src/components/asaas/LinksListPanel.tsx` |
| `asaas` | `src/components/asaas/NovaCobrancaDialog.tsx` |
| `asaas` | `src/components/asaas/NovaCobrancaDialogVincularContaReceber.tsx` |
| `asaas` | `src/components/asaas/PixQrCodeDialog.tsx` |
| `asaas` | `src/components/asaas/SegundaViaDialog.tsx` |
| `asaas` | `src/components/asaas/TransferenciaPixHistoryPanel.tsx` |
| `asaas` | `src/components/asaas/WebhooksLogPanel.tsx` |
| `asaas` | `src/components/asaas/tabs/CobrancasTab.tsx` |
| `asaas` | `src/components/asaas/tabs/CobrancasTab.types.ts` |
| `asaas` | `src/components/asaas/tabs/CobrancasTabConteudo.tsx` |
| `invoke(` | `src/components/asaas/tabs/ConfigTab.tsx` |
| `asaas` | `src/components/asaas/tabs/FilaTab.tsx` |
| `invoke(` | `src/components/auth/SloFailureBanner.tsx` |
| `asaas` | `src/components/boletos/BoletoPreviewPanel.tsx` |
| `asaas` | `src/components/boletos/NovoBoletoForm.tsx` |
| `invoke(` | `src/components/cobranca/NegociacaoIA.tsx` |
| `invoke(` | `src/components/cobranca/WhatsAppProativoPanel.tsx` |
| `invoke(` | `src/components/comprovantes/ComprovanteOCR.tsx` |
| `.add('row-highlight-flash'` | `src/components/contabilidade/sped-ecf-wizard/crosscheck.ts` |
| `invoke(` | `src/components/dashboard/PrevisaoIA.tsx` |
| `invoke(` | `src/components/expert/DocumentAnalyzer.tsx` |
| `invoke(` | `src/components/financeiro/AnexoList.tsx` |
| `invoke(` | `src/components/fluxo-caixa/InsightsFluxoIA.tsx` |
| `invoke(` | `src/components/integracoes/WhatsAppConfigPanel.tsx` |
| `asaas` | `src/components/layout/sidebar/SidebarNavGroups.tsx` |
| `notifyOnActivation` | `src/components/nfe/ContingenciaNFe.tsx` |
| `notifyOnDeactivation` | `src/components/nfe/ContingenciaNFe.tsx` |
| `notifyOnActivation` | `src/components/nfe/auto-contingencia/ContingenciaGlobalSettings.tsx` |
| `asaas` | `src/components/pix-hub/PixDashboardRealtime.tsx` |
| `asaas` | `src/components/pix-hub/PixRecebimento.tsx` |
| `invoke(` | `src/components/relatorios/InsightsIA.tsx` |
| `invoke(` | `src/components/relatorios/RelatoriosAgendados.tsx` |
| `notifyEmail` | `src/components/shared/SubscriptionPopover.tsx` |
| `notifyInapp` | `src/components/shared/SubscriptionPopover.tsx` |
| `notifyPush` | `src/components/shared/SubscriptionPopover.tsx` |
| `notify_email` | `src/components/shared/SubscriptionPopover.tsx` |
| `notify_inapp` | `src/components/shared/SubscriptionPopover.tsx` |
| `notify_push` | `src/components/shared/SubscriptionPopover.tsx` |
| `invoke(` | `src/components/tributario/onboarding/StepConvidarContador.tsx` |
| `invoke(` | `src/components/usuarios/ConviteUsuarioDialog.tsx` |
| `invoke(` | `src/hooks/AuthProvider.tsx` |
| `invoke(` | `src/hooks/useAcoesRecomendadas.ts` |
| `invoke(` | `src/hooks/useAlertasPreditivos.ts` |
| `invoke(` | `src/hooks/useAnomaliaDetectionRun.ts` |
| `invoke(` | `src/hooks/useAnomaliasDetectadas.ts` |
| `invoke(` | `src/hooks/useApiKeys.ts` |
| `asaas` | `src/hooks/useAsaas.helpers.ts` |
| `asaas` | `src/hooks/useAsaas.ts` |
| `asaas` | `src/hooks/useAsaas.types.ts` |
| `invoke(` | `src/hooks/useAuthValidation.ts` |
| `invoke(` | `src/hooks/useBenchmarkSetorial.ts` |
| `invoke(` | `src/hooks/useBlingNFe.ts` |
| `asaas` | `src/hooks/useBoletos.helpers.ts` |
| `asaas` | `src/hooks/useBoletos.ts` |
| `invoke(` | `src/hooks/useBoletos.ts` |
| `asaas` | `src/hooks/useBoletos.types.ts` |
| `invoke(` | `src/hooks/useCategorizacaoIA.ts` |
| `invoke(` | `src/hooks/useCnpjaLookup.ts` |
| `invoke(` | `src/hooks/useConciliacaoIA.ts` |
| `invoke(` | `src/hooks/useConformidadeFiscal.ts` |
| `invoke(` | `src/hooks/useConsultaTributaria.ts` |
| `invoke(` | `src/hooks/useDRETributaria.ts` |
| `invoke(` | `src/hooks/useDecidirRegimeServer.ts` |
| `invoke(` | `src/hooks/useDeviceDetection.ts` |
| `invoke(` | `src/hooks/useEvidenciasPack.ts` |
| `invoke(` | `src/hooks/useExportarSped.ts` |
| `invoke(` | `src/hooks/useFechamentoTributario.ts` |
| `invoke(` | `src/hooks/useHealthScoreOperacional.ts` |
| `invoke(` | `src/hooks/useHeatmapTributario.ts` |
| `.add('row-highlight-flash'` | `src/hooks/useHighlightFromUrl.ts` |
| `invoke(` | `src/hooks/useOpenFinance.ts` |
| `invoke(` | `src/hooks/useOportunidadesElisao.ts` |
| `invoke(` | `src/hooks/useOrganizacoes.ts` |
| `invoke(` | `src/hooks/useOverlayRejeicoesAuditoria.ts` |
| `invoke(` | `src/hooks/usePdfTributario.ts` |
| `invoke(` | `src/hooks/usePrevisaoTributaria.ts` |
| `invoke(` | `src/hooks/useProcessarNFOCR.ts` |
| `invoke(` | `src/hooks/usePushNotifications.ts` |
| `invoke(` | `src/hooks/useReguaCobranca.ts` |
| `invoke(` | `src/hooks/useRelatorioAnual.ts` |
| `invoke(` | `src/hooks/useResumosExecutivos.ts` |
| `invoke(` | `src/hooks/useSSO.ts` |
| `notify` | `src/hooks/useSavedFilterSubscriptions.ts` |
| `notifyEmail` | `src/hooks/useSavedFilterSubscriptions.ts` |
| `notifyInapp` | `src/hooks/useSavedFilterSubscriptions.ts` |
| `notifyPush` | `src/hooks/useSavedFilterSubscriptions.ts` |
| `notify_email` | `src/hooks/useSavedFilterSubscriptions.ts` |
| `notify_inapp` | `src/hooks/useSavedFilterSubscriptions.ts` |
| `notify_push` | `src/hooks/useSavedFilterSubscriptions.ts` |
| `invoke(` | `src/hooks/useSecurityAlerts.ts` |
| `invoke(` | `src/hooks/useSolicitacoesLGPD.ts` |
| `invoke(` | `src/hooks/useSpedContabil.ts` |
| `asaas` | `src/hooks/useVerificacaoIntegracoes.ts` |
| `invoke(` | `src/hooks/bling/client.ts` |
| `invoke(` | `src/hooks/saved-filter-alerts/useEntitySavedFilterAlerts.ts` |
| `notify` | `src/hooks/saved-filter-alerts/useEntitySavedFilterAlerts.ts` |
| `notify_email` | `src/hooks/saved-filter-alerts/useEntitySavedFilterAlerts.ts` |
| `notify_inapp` | `src/hooks/saved-filter-alerts/useEntitySavedFilterAlerts.ts` |
| `notify_push` | `src/hooks/saved-filter-alerts/useEntitySavedFilterAlerts.ts` |
| `invoke(` | `src/lib/correlation-id.ts` |
| `notify` | `src/lib/filterHydrationTelemetry.ts` |
| `asaas` | `src/lib/navigation.ts` |
| `notifyNavStack` | `src/lib/navigation.ts` |
| `notifyOnActivation` | `src/lib/sefaz-contingency/constants.ts` |
| `notifyOnDeactivation` | `src/lib/sefaz-contingency/constants.ts` |
| `notifyOnActivation` | `src/lib/sefaz-contingency/types.ts` |
| `notifyOnDeactivation` | `src/lib/sefaz-contingency/types.ts` |
| `invoke(` | `src/lib/sso/sandbox-bulk-runner.ts` |
| `asaas` | `src/pages/Asaas.parts.tsx` |
| `asaas` | `src/pages/Asaas.tsx` |
| `asaas` | `src/pages/AsaasQueueHistoryDialog.tsx` |
| `invoke(` | `src/pages/BenchmarkingSetorial.tsx` |
| `asaas` | `src/pages/BoletosHeader.tsx` |
| `asaas` | `src/pages/Configuracoes.tsx` |
| `invoke(` | `src/pages/ContadorReadonly.tsx` |
| `asaas` | `src/pages/PixHub.tsx` |
| `asaas` | `src/pages/StatusPage.tsx` |
| `invoke(` | `src/pages/StatusPage.tsx` |
| `invoke(` | `src/pages/auth/CorporateOnboarding.hook.ts` |
| `notify_email` | `src/pages/configuracoes/SinoNotificacoesFiltros.parts.tsx` |
| `notify_inapp` | `src/pages/configuracoes/SinoNotificacoesFiltros.parts.tsx` |
| `notify_push` | `src/pages/configuracoes/SinoNotificacoesFiltros.parts.tsx` |
| `notifyInapp` | `src/pages/configuracoes/SinoNotificacoesFiltros.tsx` |
| `notifyPush` | `src/pages/configuracoes/SinoNotificacoesFiltros.tsx` |
| `notify_email` | `src/pages/configuracoes/SinoNotificacoesFiltros.tsx` |
| `notify_inapp` | `src/pages/configuracoes/SinoNotificacoesFiltros.tsx` |
| `notify_push` | `src/pages/configuracoes/SinoNotificacoesFiltros.tsx` |
| `asaas` | `src/routes/financeiroRoutes.tsx` |
| `asaas` | `supabase/functions/stress_test.ts` |
| `asaas` | `supabase/functions/_shared/asaas-config.ts` |
| `asaas` | `supabase/functions/_shared/asaas-config_test.ts` |
| `asaas` | `supabase/functions/_shared/cors.ts` |
| `enqueue(` | `supabase/functions/_shared/edge-observability.ts` |
| `enqueue(` | `supabase/functions/_shared/edge-observability_test.ts` |
| `asaas` | `supabase/functions/_shared/rate-limit.ts` |
| `asaas` | `supabase/functions/_shared/rate-limit_test.ts` |
| `asaas` | `supabase/functions/_shared/resilience.ts` |
| `asaas` | `supabase/functions/_shared/resilience_test.ts` |
| `notify` | `supabase/functions/_shared/sql-write-guard.ts` |
| `asaas` | `supabase/functions/_shared/validation.ts` |
| `enqueue(` | `supabase/functions/_shared/sefaz/__mocks__/soap-mock.ts` |
| `asaas` | `supabase/functions/asaas-proxy/index.ts` |
| `invoke(` | `supabase/functions/asaas-proxy/index.ts` |
| `asaas` | `supabase/functions/asaas-proxy/test_plan.ts` |
| `asaas` | `supabase/functions/asaas-webhook/index.ts` |
| `asaas` | `supabase/functions/bling-proxy/index.ts` |
| `enqueue(` | `supabase/functions/copilot-global/index.ts` |
| `asaas` | `supabase/functions/enviar-alerta-email/index.ts` |
| `invoke(` | `supabase/functions/enviar-relatorios-tributarios-agendados/index.ts` |
| `invoke(` | `supabase/functions/executar-analise-preditiva/index.ts` |
| `invoke(` | `supabase/functions/executar-regua-cobranca/index.ts` |
| `invoke(` | `supabase/functions/external-data/validate_contract.ts` |
| `enqueue(` | `supabase/functions/gerar-pacote-evidencias/index.ts` |
| `asaas` | `supabase/functions/gerar-resumo-financeiro-diario/index.ts` |
| `invoke(` | `supabase/functions/gerar-resumo-financeiro-diario/index.ts` |
| `asaas` | `supabase/functions/health/index.ts` |
| `notify` | `supabase/functions/monitor-health/index.ts` |
| `notify` | `supabase/functions/notify-performance-alert/index.ts` |
| `notify` | `supabase/functions/notify-saved-filter/index.ts` |
| `invoke(` | `supabase/functions/processar-fila-cobrancas/index.ts` |
| `invoke(` | `supabase/functions/sefaz-dfe-dispatcher/index.ts` |
| `asaas` | `supabase/functions/webhook-retry-worker/index.ts` |
| `asaas` | `supabase/functions/webhook-simulator/index.ts` |
| `asaas` | `supabase/functions/whatsapp-webhook/index.ts` |
| `asaas` | `supabase/migrations/20251214170739_b7e0e8b0-39a4-42c5-844e-0a57a5e3916d.sql` |
| `asaas` | `supabase/migrations/20251214203338_8ba6f383-577f-4aaa-93f9-c11cf2ed9f60.sql` |
| `asaas` | `supabase/migrations/20251220014622_3bf7d2d0-fbb2-4814-972b-1a2d7d18b1d4.sql` |
| `asaas` | `supabase/migrations/20251220131549_438366a4-7d67-4db1-b4c1-d1e23032db41.sql` |
| `asaas` | `supabase/migrations/20251231024248_d10755f4-69dc-4236-a95d-6e006762381c.sql` |
| `asaas` | `supabase/migrations/20260315192305_dda7f758-e9e6-4e3a-b719-df70afd40ca4.sql` |
| `asaas` | `supabase/migrations/20260317000749_a5a47522-0909-46d5-bc2e-1ee69a61a744.sql` |
| `asaas` | `supabase/migrations/20260317000817_da859349-1cb7-47b0-bfeb-9778ec6eb75b.sql` |
| `asaas` | `supabase/migrations/20260317124844_96993a1e-2350-4a46-8a81-21125e50deef.sql` |
| `asaas` | `supabase/migrations/20260317125441_706a518a-22f2-405a-8490-9d9a45468eab.sql` |
| `asaas` | `supabase/migrations/20260418144137_f011cbc3-54a2-4dce-ab15-ab21a2398463.sql` |
| `asaas` | `supabase/migrations/20260421123700_26d4bd4b-8ec6-422d-9f6b-0800a6b95659.sql` |
| `notify_inapp` | `supabase/migrations/20260422120756_9ff79b5f-4781-4825-9569-dffd8d06df9f.sql` |
| `notify_push` | `supabase/migrations/20260422120756_9ff79b5f-4781-4825-9569-dffd8d06df9f.sql` |
| `notify_email` | `supabase/migrations/20260423124916_3466a19d-5926-4247-9aae-5e06edfbc1de.sql` |
| `asaas` | `supabase/migrations/20260508172800_ea6782c5-97bc-432e-adbd-5a1ba4e5c949.sql` |
| `asaas` | `supabase/migrations/20260508173615_2c2a2eb6-cf9f-483d-936c-979dd4810862.sql` |
| `asaas` | `supabase/migrations/20260508174109_1869af74-cad5-4c86-91e2-e3ede3924eb7.sql` |
| `asaas` | `supabase/migrations/20260508175709_38aae5b2-0c32-4395-93d2-bd0f85873ebb.sql` |
| `asaas` | `supabase/migrations/20260508180618_16cffdc0-06f0-436d-863d-2191485e652b.sql` |
| `notify` | `supabase/migrations/20260508180618_16cffdc0-06f0-436d-863d-2191485e652b.sql` |
| `asaas` | `supabase/migrations/20260508181512_4b79f7b1-c790-4c0e-b93a-106129f2702d.sql` |
| `asaas` | `supabase/migrations/20260508182118_515e611e-628d-442c-a830-e4ce09f11abb.sql` |
| `asaas` | `supabase/migrations/20260508182405_3517c955-2a46-4e28-9a37-57343cb6d4b3.sql` |
| `asaas` | `supabase/migrations/20260508182508_bf3a308d-06e5-4e06-8871-c04550e6b679.sql` |
| `asaas` | `supabase/migrations/20260508182729_2ec579f3-cc14-484a-8bab-77615672187e.sql` |
| `asaas` | `supabase/migrations/20260508183450_c4ca14b2-f842-41df-947d-52937e50e713.sql` |
| `asaas` | `supabase/migrations/20260508184054_dbb638c7-dded-4511-80ed-35ec7846cf29.sql` |
| `asaas` | `supabase/migrations/20260508184223_493814c4-d44d-4ef5-954f-da399cf47c21.sql` |
| `asaas` | `supabase/migrations/20260508200043_a00525d1-736f-4bbc-96fd-0d7171d610fe.sql` |
| `asaas` | `supabase/migrations/20260509132829_55841dda-6108-4acd-88b5-07d9eced49ae.sql` |
| `asaas` | `supabase/migrations/20260509163954_a42bcd0a-1b48-423e-be5e-ba67d42a6422.sql` |
| `asaas` | `supabase/migrations/20260518165422_5d19ef90-1069-47a2-9850-897c841223f5.sql` |
| `asaas` | `supabase/migrations/20260518171036_b4a383dd-c765-4933-b464-7ff660b98069.sql` |
| `asaas` | `supabase/migrations/20260518171340_6777b0e0-6572-4932-a1ea-97291a1d31b9.sql` |
| `asaas` | `supabase/migrations/20260518171613_cd715539-b99e-4b37-883d-315ae970ecc7.sql` |
| `asaas` | `supabase/migrations/20260518172812_52b52fb1-15af-4387-aed5-98bf813bea0f.sql` |
| `asaas` | `supabase/migrations/20260518190304_430602f1-8324-46d3-b373-04cac640714d.sql` |
| `asaas` | `supabase/migrations/20260519160203_92103c43-7306-4099-91a3-faaa35d63b52.sql` |
| `asaas` | `supabase/migrations/20260619145930_fd0213c6-5928-4562-8e3e-c0db3d6f24a1.sql` |
| `asaas` | `supabase/migrations/20260712161138_a1de1561-be77-4608-86b5-d719b37a29cd.sql` |
| `notify` | `supabase/migrations/20260712194415_c4e0a8ab-3005-4479-9858-77678c1e8a88.sql` |
| `notify_performance_alert_trigger` | `supabase/migrations/20260712194415_c4e0a8ab-3005-4479-9858-77678c1e8a88.sql` |
| `notify_performance_alert_trigger` | `supabase/migrations/20260712194438_59fca68e-c1d7-46ba-98c1-b84f68d4c48f.sql` |
| `asaas` | `supabase/migrations/20260712215738_9b315482-89ce-40b1-8d45-d8307a89edd9.sql` |
| `notify_bitrix24_task` | `supabase/migrations/20260712223141_stub-alerts-tables.sql` |
| `notify_email` | `supabase/migrations/20260712223141_stub-alerts-tables.sql` |
| `notify_n8n_webhook` | `supabase/migrations/20260712223141_stub-alerts-tables.sql` |
| `notify_slack` | `supabase/migrations/20260712223141_stub-alerts-tables.sql` |
| `notify_sms` | `supabase/migrations/20260712223141_stub-alerts-tables.sql` |
| `notify_whatsapp` | `supabase/migrations/20260712223141_stub-alerts-tables.sql` |
| `asaas` | `supabase/migrations/20260728110130_b8a2d224-0794-43a0-a42c-8bcbc86d4d55.sql` |
| `asaas` | `supabase/migrations/20260728114852_99ef6cf7-e4b9-4b64-a0a8-3f1293380e97.sql` |
| `asaas` | `supabase/migrations/20260728130820_c525ef8a-673f-4f31-a5cb-b2f7eea6fa35.sql` |
| `asaas` | `supabase/migrations/20260728154640_2b62d1ef-e8c2-4812-a8bd-7bf2e02354cf.sql` |
| `asaas` | `supabase/migrations/20260728164313_0d1a1fc8-b3cf-4a88-a13f-c86a7782048a.sql` |
| `asaas` | `supabase/migrations/20260728165000_afddf160-b74b-4f3d-8aa5-d7f5595b55ee.sql` |
| `asaas` | `supabase/migrations/20260728205900_714b52da-cd26-4bbd-a858-21aab10b0756.sql` |
| `notify` | `supabase/migrations/20260728210937_aa8871bf-bdb9-412b-b5c1-dea538b3ee8d.sql` |
| `notify_performance_alert_trigger` | `supabase/migrations/20260728210937_aa8871bf-bdb9-412b-b5c1-dea538b3ee8d.sql` |
| `asaas` | `supabase/migrations/20260728213519_18e89190-27ac-4f1a-9ec9-0fa78dd00208.sql` |
| `asaas` | `supabase/migrations/20260728214221_0cb29975-9b45-43c5-9853-d4ed66f527ad.sql` |
| `asaas` | `supabase/migrations/20260728214657_9ced93f8-4a12-458a-9a86-fc4359b6c16c.sql` |
| `asaas` | `supabase/migrations/20260728214750_22fdf05d-a28b-40eb-bd2f-ea165020d0ed.sql` |
| `asaas` | `supabase/migrations/20260729153021_7c97554e-e2e4-4c6e-9904-cb755883452a.sql` |
| `asaas` | `supabase/migrations/20260730125124_6afdd9ff-fa70-478c-b8a7-6eb63dc2524f.sql` |
| `asaas` | `supabase/migrations/20260822120000_reconciliar_risco_credito_asaas.sql` |
| `asaas` | `supabase/migrations/20260825100000_reconciliar_schema_completo.sql` |
| `asaas` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `notify_performance_alert_trigger` | `supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql` |
| `asaas` | `supabase/migrations/20260825220000_check_constraints_e46.sql` |
| `asaas` | `supabase/migrations/20260825230000_initplan_rls_e67.sql` |
| `notify_performance_alert_trigger` | `supabase/migrations/20260826050000_revoke_execute_authenticated_e09.sql` |
| `asaas` | `supabase/migrations/20260827100000_reconciliar_views_rpcs_indices_sem_drop.sql` |
| `asaas` | `supabase/migrations/20260902190000_fix_rls_cross_tenant_leak_grupo_a.sql` |
| `asaas` | `supabase/migrations/20260902200000_fix_rls_cross_tenant_leak_grupo_c.sql` |
| `asaas` | `supabase/migrations/20260902230000_fix_rls_tautologia_empresas_asaas_elisao.sql` |
| `asaas` | `supabase/migrations/20260902250000_fix_storage_view_audit_trail_gaps.sql` |
| `asaas` | `supabase/migrations/20260902270000_fix_orphan_policies_pos_pr55.sql` |
| `asaas` | `supabase/migrations/20260903000300_fix_asaas_config_rls_role_check.sql` |
| `asaas` | `supabase/migrations/20260903000900_fix_export_asaas_audit_csv_idor.sql` |
| `notify` | `supabase/migrations/20260905130000_fix_notify_performance_alert_destino.sql` |
| `notify_performance_alert_trigger` | `supabase/migrations/20260905130000_fix_notify_performance_alert_destino.sql` |
| `notify` | `supabase/migrations/20260913120000_corrige_credenciais_automacoes_internas.sql` |
| `notify_performance_alert_trigger` | `supabase/migrations/20260913120000_corrige_credenciais_automacoes_internas.sql` |
| `asaas` | `supabase/migrations/20260913170000_boletos_add_asaas_cols.sql` |
| `asaas` | `supabase/migrations/20260924220000_asaas_payment_links_empresa.sql` |
| `asaas` | `supabase/migrations/20261101120600_boletos_asaas_defaults.sql` |
| `asaas` | `supabase/migrations/20261102000000_registrar_grupo_b_rls_cross_tenant.sql` |
| `asaas` | `supabase/migrations/20261116190000_versiona_ddl_ja_aplicado_em_producao.sql` |
| `asaas` | `supabase/migrations/20261116220000_reconcilia_17_colunas_que_so_existem_em_producao.sql` |
| `asaas` | `supabase/migrations/20261117190000_drop_tabelas_residuo_lovable.sql` |
| `asaas` | `supabase/migrations/20261117193000_colunas_nunca_aplicadas.sql` |
| `notify_email` | `supabase/migrations/20261117223000_converge_saved_filter_subscriptions.sql` |
| `notify_inapp` | `supabase/migrations/20261117223000_converge_saved_filter_subscriptions.sql` |
| `notify_push` | `supabase/migrations/20261117223000_converge_saved_filter_subscriptions.sql` |
| `asaas` | `supabase/migrations/20261118002000_rate_limit_check_atomico.sql` |

## N. Regras citadas em comentários do código

| Comentário | Arquivo |
|---|---|
| Arquivos gerados ou de configuração — sem limite de tamanho | `eslint.config.js` |
| Ao encostar em qualquer arquivo destes diretórios você DEVE tipar | `eslint.config.js` |
| Revoga sessões do usuário de teste — deve rodar sozinho, após os shards. | `playwright.config.ts` |
| Porta própria: o gate não pode reaproveitar um `vite` já rodando com as | `playwright.financeiro.config.ts` |
| Ativo somente quando SENTRY_AUTH_TOKEN, SENTRY_ORG e SENTRY_PROJECT estão | `vite.config.ts` |
| "Reached heap limit" em CI). | `vitest.config.ts` |
| em memória. Mantemos apenas text/json/lcov para o gate e tooling. | `vitest.config.ts` |
| heap em CI (FATAL ERROR: Reached heap limit) e travando o teardown | `vitest.config.ts` |
| localmente. Usamos apenas o reporter padrão. | `vitest.config.ts` |
| * Regra ESLint: no-floating-supabase-write | `eslint-rules/no-floating-supabase-write.js` |
| * A regra obriga uma decisão explícita em cada escrita: | `eslint-rules/no-floating-supabase-write.js` |
| escrita solta, ainda que não tenha `await`. A regra não julga o corpo do | `eslint-rules/no-floating-supabase-write.js` |
| Service Worker mínimo para Web Push (P10) | `public/sw-push.js` |
| * Uma assinatura está silenciada apenas enquanto o prazo não expirou. */ | `src/components/admin/AlertasProativosErros.tsx` |
| Bootstrap: aplica preset padrão somente se URL e localStorage não trazem estado | `src/components/admin/AnomaliasDetectadasPanel.tsx` |
| Persiste termos pesquisados (apenas quando aplicados e não vazios) | `src/components/admin/AnomaliasDetectadasPanel.tsx` |
| Apenas os campos consumidos por este indicador são declarados — o payload | `src/components/admin/FiscalHealthBadge.tsx` |
| usuários sem permissão o componente degrada silenciosamente (não renderiza). | `src/components/admin/FiscalHealthBadge.tsx` |
| Sem permissão ou RPC indisponível: não poluímos o cabeçalho com erro. | `src/components/admin/FiscalHealthBadge.tsx` |
| Sonner mostra no máximo 1 ação principal + 1 cancel; aqui ilustramos | `src/components/admin/PreviewAnomaliaToastDrawer.tsx` |
| * Texto do prazo: negativo significa que o silenciamento já venceu. */ | `src/components/admin/SilenciamentosExpirando.tsx` |
| * Mensagem de validação do comentário (mínimo de caracteres por ação). */ | `src/components/admin/anomalias-review-queue/helpers.ts` |
| de validação (ex.: comentário curto) nem conflito de concorrência. | `src/components/admin/anomalias-review-queue/retry.ts` |
| Step 3: Validação */} | `src/components/admin/sso/SSOWizardDialog.tsx` |
| (run_integrity_cycle). Sem este painel os alertas ficavam apenas no banco. | `src/components/admin/telemetry/IntegrityAlertsPanel.tsx` |
| Alerta já encerrado é histórico: nunca deve gerar notificação. | `src/components/admin/telemetry/PerformanceAlertsPanel.tsx` |
| Os contadores refletem apenas incidentes abertos — encerrados não pesam no topo. | `src/components/admin/telemetry/PerformanceAlertsPanel.tsx` |
| * { "<tabela>": <linhas removidas> } — apenas chaves numéricas do resultado. */ | `src/components/admin/telemetry/RetentionHistoryPanel.tsx` |
| o que foi purgado por tabela — antes essa informação existia apenas dentro de | `src/components/admin/telemetry/RetentionHistoryPanel.tsx` |
| Ajuste para prazo desde emissão | `src/components/analytics/BenchmarkingSetorial.tsx` |
| isso a guarda de gravação bloquearia qualquer correção de limite ou | `src/components/aprovacoes/ConfiguracaoAprovacaoCard.tsx` |
| andam juntas (senao o limite salvo nao faz efeito) e as faixas de outro | `src/components/aprovacoes/ConfiguracaoAprovacaoCard.tsx` |
| Valor Mínimo */} | `src/components/aprovacoes/ConfiguracaoAprovacaoCard.tsx` |
| DIALOG: Estorno de Cobrança ASAAS | `src/components/asaas/EstornoDialog.tsx` |
| Juros, Multa, Desconto | `src/components/asaas/NovaCobrancaDialog.tsx` |
| Valor, Vencimento e Parcelas */} | `src/components/asaas/NovaCobrancaDialogVincularContaReceber.tsx` |
| No permission specified, allow access | `src/components/auth/PermissionGate.tsx` |
| Provedor sem end_session_endpoint — apenas confirmamos sucesso local. | `src/components/auth/SloFailureBanner.tsx` |
| * A versao anterior fabricava os dois a partir de banco + valor + vencimento + | `src/components/boletos/BoletoBarcode.tsx` |
| vencimento FEBRABAN passou de 9999 em fev/2025: qualquer vencimento futuro | `src/components/boletos/BoletoBarcode.tsx` |
| Limite de Crédito */} | `src/components/clientes/ClienteFormFields.tsx` |
| Proposta 1: Desconto à vista | `src/components/cobranca/NegociacaoIA.tsx` |
| estourariam o limite de URI. | `src/components/cobranca/PrevisaoInadimplencia.tsx` |
| varios titulos no mesmo vencimento, janelas diferentes podiam | `src/components/cobranca/PrevisaoInadimplencia.tsx` |
| Erro de consulta NAO pode virar "nenhum cliente em risco": a tela | `src/components/cobranca/PrevisaoInadimplencia.tsx` |
| -- passa do limite de URI do gateway e derruba a previsao inteira | `src/components/cobranca/PrevisaoInadimplencia.tsx` |
| (o arquivo bateu no limite de 400 linhas do eslint), e util separado porque | `src/components/cobranca/previsao/risco.ts` |
| * Titulo em atraso: vencido, aberto depois do vencimento, ou recebido depois do | `src/components/cobranca/previsao/risco.ts` |
| vencimento. | `src/components/cobranca/previsao/risco.ts` |
| sem recebimento: aberto apos o vencimento (o historico ja filtra por isso) | `src/components/cobranca/previsao/risco.ts` |
| vez de limite excedido (achado P1 do Codex na PR #404). | `src/components/cobranca/previsao/risco.ts` |
| Sem credito autorizado, qualquer pendencia excede o limite. | `src/components/cobranca/previsao/risco.ts` |
| não pode ser apresentada como falha caso esse enriquecimento falhe. | `src/components/conciliacao/ConciliacaoManualDialog.tsx` |
| Permission Status */} | `src/components/configuracoes/NotificacoesConfig.tsx` |
| Painel visual de pré-validação cruzada Razão × DRE para SPED ECD/ECF. | `src/components/contabilidade/PreValidacaoSpedPanel.tsx` |
| O schema `ContabilizarEventoSchema` (supabase/functions/_shared/validation.ts) | `src/components/contabilidade/contabilizacao-automatica/useContabilizacaoMutations.ts` |
| localStorage. Também expõe os handlers de negócio (gerar, copiar hash, baixar | `src/components/contabilidade/sped-ecf-wizard/useSpedEcfWizardState.ts` |
| mexer no form — resposta tardia da conta A não pode pisar na conta B. | `src/components/contas-pagar/ContaPagarForm.tsx` |
| As listas sao normalizadas para o shape minimo nao-nulo que ele consome. | `src/components/contas-pagar/ContaPagarForm.tsx` |
| Delta apenas com dado real do mês anterior (sem simulação decorativa) | `src/components/contas-pagar/ContasPagarKPIs.tsx` |
| Show "Request Approval" button if approval is required but not granted */} | `src/components/contas-pagar/RegistrarPagamentoDialog.tsx` |
| liquidação — o título foi processado e não pode contar como "não | `src/components/contas-receber/BaixaAutomaticaDialog.tsx` |
| mexer no form — resposta tardia da conta A não pode pisar na conta B. | `src/components/contas-receber/ContaReceberForm.tsx` |
| bloqueado no Safari (ativação transitória expira no fetch assíncrono). | `src/components/contas-receber/DrawerAnexosTab.tsx` |
| Juros/Multa Calculator for overdue */} | `src/components/contas-receber/DrawerDetailsTab.tsx` |
| Calculadora de Juros/Multa para títulos vencidos */} | `src/components/contas-receber/RegistrarRecebimentoDialog.tsx` |
| apenas `webhooks_log` -- os webhooks que CHEGARAM. Resultado: uma cobranca do | `src/components/contas-receber/WebhookDlqPanel.tsx` |
| "permission denied for table webhook_dlq") atras do texto genérico. Mesmo | `src/components/contas-receber/WebhookDlqPanel.tsx` |
| Paginacao por `range`, nao por `limit` crescente: o PostgREST corta a | `src/components/contas-receber/WebhookDlqPanel.tsx` |
| resposta em 1.000 linhas, entao aumentar o limite nunca traria a falha | `src/components/contas-receber/WebhookDlqPanel.tsx` |
| Reprocessar reentrega um evento real (cobranca, baixa, estorno), entao | `src/components/contas-receber/WebhookDlqPanel.tsx` |
| Falha de reprocessamento nao pode sumir: alem do toast, o motivo fica na | `src/components/contas-receber/WebhookDlqPanel.tsx` |
| * Falha de leitura NAO pode virar "nenhuma falha": era justamente esse | `src/components/contas-receber/WebhookDlqPanel.tsx` |
| Delta do recebido: último mês vs anterior (apenas com base real > 0) | `src/components/dashboard-receber/ReceberKpis.tsx` |
| A derivação é apenas uma sugestão: o usuário pode sobrescrever ambos manualmente. | `src/components/empresas/EmpresaForm.tsx` |
| Ensure required fields are present | `src/components/empresas/EmpresaForm.tsx` |
| cobre apenas Terceiros). Só aplica quando o usuário editou o CNAE agora. | `src/components/empresas/EmpresaForm.tsx` |
| (useWhatsAppIA.ts:37-62) apenas INSERE em `whatsapp_conversas` com | `src/components/financeiro/cobranca/WhatsAppHistoryIA.tsx` |
| Saldo Mínimo */} | `src/components/fluxo-caixa/ResumosCenarios.tsx` |
| *Regra:** ${d.regra}`); | `src/components/insights-ia/anomalia/ExportarEvidenciasButton.tsx` |
| Renderiza somente quando explicitamente solicitado para evitar contaminar a UI do app. | `src/components/layout/VisualCorrectionOverlay.tsx` |
| * When true, parent container must apply perspective */ | `src/components/layout/transitions/types.ts` |
| Apenas [role="dialog"]: alertdialogs ficam fora de propósito — exigem | `src/components/navigation/ModalHistoryManager.tsx` |
| sentinela não pode remover o marcador do dialog de baixo. | `src/components/navigation/ModalHistoryManager.tsx` |
| dele não pode ser reinterpretado como nova tentativa de sair. | `src/components/navigation/UnsavedGuardProvider.tsx` |
| saída não pode mais ser confundido com nova tentativa de sair. | `src/components/navigation/UnsavedGuardProvider.tsx` |
| (mínimo 15 caracteres)</Label> | `src/components/nfe/InutilizacaoNFe.tsx` |
| Must be rendered inside QueryClientProvider and AuthProvider. | `src/components/providers/DataPrefetcher.tsx` |
| * Apenas colunas visíveis (já filtradas pelo chamador) */ | `src/components/shared/ViewExportButton.tsx` |
| o nominal: a convenção líquida é a regra do projeto e este arquivo era | `src/components/tesouraria/ProjectedCashFlowChart.tsx` |
| Preview, validação e UPSERT em lote | `src/components/tributario/CsvImportDialog.tsx` |
| curta. Nenhuma regra de conformidade é reimplementada aqui — o componente é | `src/components/tributario/dashboard/ConformidadeTendenciaWidget.tsx` |
| Falha de leitura não deve alarmar como se fosse divergência fiscal: | `src/components/tributario/dashboard/SaudeCatalogosBadge.tsx` |
| * Apenas os ajustes de severidade crítica que motivaram o bloqueio. */ | `src/components/tributario/simulacao/ConfirmarSalvamentoAjustesDialog.tsx` |
| Aplicável apenas ao Lucro Real (Lei 9.430/96 — opção irretratável no ano). | `src/components/tributario/simulacao/PeriodicidadeComparativoCard.tsx` |
| Período de Vencimento */} | `src/components/ui/advanced-filters.tsx` |
| Radix ou gerenciador ausente) não pode fechar os de baixo junto. | `src/components/ui/confirm-dialog.tsx` |
| Radix ou gerenciador ausente) não pode fechar os de baixo junto. | `src/components/ui/confirmation-dialog.tsx` |
| INPUT WITH VALIDATION | `src/components/ui/input.tsx` |
| Confetti color palette (hex required by canvas-confetti library) | `src/components/ui/micro-interactions.helpers.ts` |
| mudou: eles só reagem a estes eventos, disparados historicamente apenas pelo | `src/contexts/EmpresaScopeContext.tsx` |
| leem `currentEmpresaId`. Use `ids` apenas para escolher alvos de ação | `src/contexts/useEmpresaScope.ts` |
| - Severidades: somente valores conhecidos. Lista vazia só é aceita se o | `src/hooks/anomaliaPreferencesValidation.ts` |
| * True quando o evento deve gerar notificação. */ | `src/hooks/savedFilterDedup.ts` |
| * Decide se um evento de realtime deve gerar notificação para uma assinatura. | `src/hooks/savedFilterDedup.ts` |
| Defesa de permissão: rejeita silenciosamente se a assinatura não for do | `src/hooks/savedFilterDedup.ts` |
| Distingue ausência (null/undefined/NaN) de 0 — apenas o primeiro caso | `src/hooks/savedFilterDedup.ts` |
| recebe o default; 0 é valor explícito que deve ser clampado para o | `src/hooks/savedFilterDedup.ts` |
| mínimo permitido (1), espelhando o trigger do banco. | `src/hooks/savedFilterDedup.ts` |
| * Decide se o cliente deve despachar agora os itens acumulados de uma | `src/hooks/savedFilterDispatchSchedule.ts` |
| 1. Garantir que apenas papéis pertencentes ao enum global da aplicação | `src/hooks/savedFiltersValidation.ts` |
| já líquido de desconto e com juros). Conta que já recebeu cota | `src/hooks/useAcordosParcelamento.ts` |
| sobrar ALÉM de toda capacidade (acordo com juros acima do | `src/hooks/useAcordosParcelamento.ts` |
| maior que valor é receita real (juros) e a convenção | `src/hooks/useAcordosParcelamento.ts` |
| Excedente sem capacidade (juros acima do principal) vai para | `src/hooks/useAcordosParcelamento.ts` |
| Função utilitária para gerar alertas automáticos baseados em regras de negócio | `src/hooks/useAlertas.ts` |
| Buscar contas a pagar próximas do vencimento | `src/hooks/useAlertas.ts` |
| Apenas alertas de alta prioridade ou ruptura | `src/hooks/useAlertasPreditivos.ts` |
| 0.02, 0); // 2% de desconto estimado | `src/hooks/useAlertasPreditivos.ts` |
| Validação client-side espelha o trigger Postgres + regras de UX. | `src/hooks/useAnomaliaPreferences.ts` |
| limite salvo nao faz efeito; | `src/hooks/useAprovacoes.ts` |
| limite fica gravado, o erro aparece, e a nova | `src/hooks/useAprovacoes.ts` |
| // Entao em vez de adivinhar, a gravacao RECUSA o que nao pode virar o | `src/hooks/useAprovacoes.ts` |
| limite efetivo, e diz qual faixa esta no caminho. Nao perde dado, nao | `src/hooks/useAprovacoes.ts` |
| Subir o limite ACIMA de outra faixa ativa nao muda o limite efetivo. | `src/hooks/useAprovacoes.ts` |
| Silently fail - IP/geo validation will be skipped | `src/hooks/useAuthValidation.ts` |
| Validação IP/Geo agora é feita 100% no servidor pela edge function | `src/hooks/useAuthValidation.ts` |
| Channel name must be unique per (mount, accountId) so we don't | `src/hooks/useBankAccounts.ts` |
| If less than limit returned, we've reached the last page | `src/hooks/useBlingNFe.ts` |
| * Aceita somente uma resposta que permita pagar o boleto de fato. Não é uma | `src/hooks/useBoletos.helpers.ts` |
| validação de dígitos bancários: essa responsabilidade é do emissor, que | `src/hooks/useBoletos.helpers.ts` |
| VAL-GAP-04: proxy não lança em 400/422 (negócio ASAAS) — sem esta | `src/hooks/useBoletos.ts` |
| validação o boleto nasceria sem vínculo ASAAS silenciosamente. | `src/hooks/useBoletos.ts` |
| Somente valores já validados pelo overlay chegam aqui. | `src/hooks/useCatalogosFiscais.ts` |
| ISS: somente registros dentro do piso/teto da LC 116 chegam ao motor. | `src/hooks/useCatalogosFiscais.ts` |
| IPI: o catálogo `ncms` sobrepõe a TIPI embarcada após validação de | `src/hooks/useCatalogosFiscais.ts` |
| Soft delete - apenas desativa | `src/hooks/useCentrosCusto.ts` |
| * Catálogo de CNAEs (somente leitura). | `src/hooks/useCnaes.ts` |
| Tentar extrair detalhe (rate limit etc.) do contexto da resposta | `src/hooks/useCnpjaLookup.ts` |
| Filtrar as que foram pagas após o vencimento | `src/hooks/useCobrancas.ts` |
| o ranking são feitos pelo motor puro `compararConformidade`, mantendo a regra | `src/hooks/useComparativoConformidade.ts` |
| de negócio fora da camada de dados. | `src/hooks/useComparativoConformidade.ts` |
| @param limitePorEmpresa nº máximo de competências consideradas por empresa | `src/hooks/useComparativoConformidade.ts` |
| Respeita o limite por empresa mesmo com volumes desiguais entre elas. | `src/hooks/useComparativoConformidade.ts` |
| `contas_receber.transacao_conciliada_id` — nada disso precisa (nem deve) | `src/hooks/useConciliacao.ts` |
| o limite de tamanho do projeto (max-lines). | `src/hooks/useConciliacaoIgnorarActions.ts` |
| confirmação; a mutação em si roda apenas em `confirmarIgnorar`/ | `src/hooks/useConciliacaoIgnorarActions.ts` |
| Validação de Saldo e Auditoria (Melhorado) | `src/hooks/useConciliacaoPage.ts` |
| positivo visual; o operador deve abrir a conciliação de cada item. | `src/hooks/useConciliacaoPage.ts` |
| `null` é uma remoção explícita e deve limpar a seleção local anterior. | `src/hooks/useConciliacaoPageState.ts` |
| trocar de conta deve mostrar o estado de carregamento, não a lista da | `src/hooks/useConciliacaoPageState.ts` |
| Hook: validação de conformidade fiscal | `src/hooks/useConformidadeFiscal.ts` |
| Recebe pontos já calculados pelo motor determinístico — nenhuma regra de | `src/hooks/useConformidadeSnapshots.ts` |
| negócio é reimplementada aqui. | `src/hooks/useConformidadeSnapshots.ts` |
| * Invoca a edge function de consulta tributária. Erros de rede/validação são | `src/hooks/useConsultaTributaria.ts` |
| Aplicar desconto (#12) | `src/hooks/useContasReceberLogic.ts` |
| * Debounce um valor - atualiza apenas após o delay | `src/hooks/useDebounce.ts` |
| * Throttle uma função - executa no máximo uma vez por intervalo | `src/hooks/useDebounce.ts` |
| * Hook para input numérico com validação debounced | `src/hooks/useDebounce.ts` |
| Permite apenas números, vírgula e ponto | `src/hooks/useDebounce.ts` |
| Lançamento cancelado é versão substituída (estorno/ajuste de | `src/hooks/useDemonstrativosContabeis.ts` |
| * Etapa T — Leitura do log de envios do digest (somente admin, via RLS). | `src/hooks/useDigestEnviosLog.ts` |
| calculado no cliente porque o filtro é apenas de exibição — a RLS já garante | `src/hooks/useDigestEnviosLog.ts` |
| e grava apenas a própria. O hook faz upsert por `user_id`, o que torna a | `src/hooks/useDigestPreferences.ts` |
| Soft delete - apenas desativa | `src/hooks/useEmpresas.ts` |
| ${projectId}.supabase.co/functions/v1/external-data?tabela=clientes&limit=20`; | `src/hooks/useExpertContext.ts` |
| 'pendente' apenas. | `src/hooks/useExpertContext.ts` |
| Real-time subscription for billing rule failures | `src/hooks/useFinancialAlerts.tsx` |
| Antes: `.limit(500)` fixo — além de truncar silenciosamente resultados | `src/hooks/useFinancialOperations.ts` |
| declara essa regra para o próprio projeto. | `src/hooks/useFluxoCaixa.ts` |
| pendente, inclusive vencimento de anos à frente. As linhas de | `src/hooks/useFluxoCaixa.ts` |
| hoje): só o limite superior deixaria passar título vencido com | `src/hooks/useFluxoCaixa.ts` |
| vencimento no passado, e os dois números da mesma tela divergiriam. | `src/hooks/useFluxoCaixa.ts` |
| `horas_restantes` é negativo quando o prazo já venceu. | `src/hooks/useFrontendErrorLogs.ts` |
| permissão, ou registro removido). Avisa e limpa o param. | `src/hooks/useHighlightFromUrl.ts` |
| Limite de isenção do adicional de IRPJ por mês | `src/hooks/useIRPJCSLL.ts` |
| Compensação de prejuízos (máximo 30%) | `src/hooks/useIRPJCSLL.ts` |
| Postgres; o cliente apenas divide os agregados (`calcularIndices`). | `src/hooks/useIndicesContabeis.ts` |
| * Limite máximo de requests realmente executando em paralelo. | `src/hooks/useLancamentosContabeis.ts` |
| evitando saturar o connection pool / rate-limit do PostgREST. | `src/hooks/useLancamentosContabeis.ts` |
| Default: 6 (alinhado ao limite típico de conexões HTTP/1.1 por origem). | `src/hooks/useLancamentosContabeis.ts` |
| * Limite padrão de conexões simultâneas contra o backend. */ | `src/hooks/useLancamentosContabeis.ts` |
| `limiter.limit()` deles executam simultaneamente. Cada lançamento | `src/hooks/useLancamentosContabeis.ts` |
| - limit 1, mais recente | `src/hooks/useLastSsoProfileSync.ts` |
| (seletor do HistoricoTab -> atualizarStatus), e apagar por id apenas | `src/hooks/useOportunidadesElisao.ts` |
| , nota:notas_fiscais_ocr(*), regra:elisao_regras_creditos(*)') | `src/hooks/useOportunidadesElisao.ts` |
| Auto-validação de consistência | `src/hooks/useOportunidadesElisao.ts` |
| leitura/escrita e aplicamos as guardas de negócio do motor puro | `src/hooks/useOrganizacoes.ts` |
| do usuário no servidor — o cliente nunca decide sobre permissão. | `src/hooks/useOverlayRejeicoesAuditoria.ts` |
| Snapshot anterior para auditoria (apenas em UPDATE) | `src/hooks/usePlanoContas.ts` |
| Pré-validação de dados antes de gerar SPED ECD/ECF. | `src/hooks/usePreValidacaoSped.ts` |
| marca apenas os campos realmente alterados (para o merge pós-leitura) | `src/hooks/usePreferenciasSistema.ts` |
| Request permission first | `src/hooks/usePushNotifications.ts` |
| Fetch rate limit logs | `src/hooks/useRateLimitLogs.ts` |
| limite do cache de ids | `src/hooks/useRealtimeAuditToasts.ts` |
| * Aprende uma regra de conciliação a partir de um match manual confirmado. | `src/hooks/useRegrasConciliacao.ts` |
| Verifica se já existe regra com mesmo padrão; se sim, incrementa vezes_aplicada. | `src/hooks/useRegrasConciliacao.ts` |
| Retorna a regra mais relevante, se houver. | `src/hooks/useRegrasConciliacao.ts` |
| Calcular data de vencimento (último dia útil do mês seguinte) | `src/hooks/useRetencoesFonte.ts` |
| Retenções pendentes próximas do vencimento | `src/hooks/useRetencoesFonte.ts` |
| * Severidades padronizadas reutilizadas pelos pickers de UI/validação. */ | `src/hooks/useSavedFilterSubscriptions.ts` |
| * Anti-spam — limite máximo de notificações individuais entregues numa | `src/hooks/useSavedFilterSubscriptions.ts` |
| Aplicado apenas para frequência "imediata" (cadências horária/diária | `src/hooks/useSavedFilterSubscriptions.ts` |
| * Tamanho da janela em minutos para o contador de rate limit. */ | `src/hooks/useSavedFilterSubscriptions.ts` |
| * Defesa de permissão em tempo real: o trigger | `src/hooks/useSavedFilterSubscriptions.ts` |
| Carrega papéis do tenant alvo (se houver) para validação cruzada. | `src/hooks/useSavedFilters.ts` |
| Calcular limite recomendado baseado no score e histórico | `src/hooks/useScoringClientes.ts` |
| Atualizar limite de crédito baseado no score | `src/hooks/useScoringClientes.ts` |
| * A versão anterior era *fail-open*: invalidava uma query apenas se alguma | `src/hooks/useSelectiveEmpresaInvalidation.ts` |
| * Decide se uma query deve ser descartada na troca de empresa. | `src/hooks/useSelectiveEmpresaInvalidation.ts` |
| Não bloqueia a UX — apenas avisa | `src/hooks/useSincronizarAnomaliaBitrix.ts` |
| * "Voltar" semântico: usa navigate(-1) apenas quando a entrada anterior | `src/hooks/useSmartBack.ts` |
| Falhas nunca quebram o login — apenas logam warning local. | `src/hooks/useSsoOnboardingAudit.ts` |
| apenas validamos conectividade pública e marcamos os demais como ok. | `src/hooks/useStartupDiagnostic.ts` |
| Anônimo não tem (nem deve ter) GRANT em tabelas do schema public. | `src/hooks/useStartupDiagnostic.ts` |
| PGRST116 = empty result; 401/PGRST301/42501 = falta de permissão | `src/hooks/useStartupDiagnostic.ts` |
| Must be a horizontal swipe (not vertical scroll) | `src/hooks/useSwipeBack.ts` |
| antigo, digitado errado ou aba sem permissão) caem em `defaultTab`. | `src/hooks/useUrlTab.ts` |
| ESLint override: useWebPushSubscription.ts tem permissão explícita | `src/hooks/useWebPushSubscription.ts` |
| *Contas a Pagar:** Nenhum vencimento no período ✅\n\n`; | `src/hooks/expert-actions/query-actions.ts` |
| *Contas a Receber:** Nenhum vencimento no período\n`; | `src/hooks/expert-actions/query-actions.ts` |
| useContasPagarPaginated. Com `.limit(1000)` fixo, uma empresa com mais | `src/hooks/financial/useContasPagar.ts` |
| useContasReceberPaginated. Com `.limit(1000)` fixo, acima de mil | `src/hooks/financial/useContasReceber.ts` |
| * Zod schemas para validação runtime das views financeiras. | `src/hooks/financial/views.schemas.ts` |
| * Tamanho mínimo (nunca reduz abaixo disso). Default: 2. */ | `src/lib/adaptive-chunk.ts` |
| * Tamanho máximo (nunca cresce acima disso). Default: 50. */ | `src/lib/adaptive-chunk.ts` |
| Compara apenas o 1º nível das chaves; objetos/arrays aninhados são | `src/lib/audit-diff.ts` |
| * Converte fator de vencimento para data | `src/lib/barcode-parser.ts` |
| Validação básica - se a data for muito antiga ou futura demais | `src/lib/barcode-parser.ts` |
| Campo 5: FFFFVVVVVVVVVV (14 dígitos - fator vencimento + valor) | `src/lib/barcode-parser.ts` |
| Posição 6-9: Fator de vencimento | `src/lib/barcode-parser.ts` |
| Fator de vencimento (posições 6-9) | `src/lib/barcode-parser.ts` |
| Validação de códigos referenciais CFC (Conselho Federal de Contabilidade) | `src/lib/cfc-validator.ts` |
| Sugere correção mínima quando o prefixo está errado: troca apenas o 1º dígito. | `src/lib/cfc-validator.ts` |
| gravação também devolve zero: o relatório de importação não pode afirmar | `src/lib/conciliacao-page-helpers.ts` |
| local, e um `new Date` cru aqui deslocaria o limite superior em 3h, | `src/lib/conciliacao-page-helpers.ts` |
| deve crescer (para amortizar overhead) mas a quantidade real de requests | `src/lib/concurrency-limiter.ts` |
| const limit = createConcurrencyLimiter(4); | `src/lib/concurrency-limiter.ts` |
| await Promise.all(items.map((it) => limit(() => process(it)))); | `src/lib/concurrency-limiter.ts` |
| * Executa `task` respeitando o limite de concorrência atual. */ | `src/lib/concurrency-limiter.ts` |
| * Limite atual. */ | `src/lib/concurrency-limiter.ts` |
| * Ajusta o limite em tempo de execução. Aumentar libera tarefas pendentes | `src/lib/concurrency-limiter.ts` |
| * Helper conveniente — executa uma lista respeitando o limite, com `Promise.allSettled`. */ | `src/lib/concurrency-limiter.ts` |
| com dado de negócio (valores, CPF/CNPJ). Sem forma de sanitizar o | `src/lib/error-tracking.ts` |
| passam APENAS por beforeSendSpan (beforeSendTransaction é ignorado | `src/lib/error-tracking.ts` |
| * Filtra apenas eventos com status='error'. */ | `src/lib/filterHydrationTelemetry.ts` |
| Expira checkpoints velhos. | `src/lib/import-checkpoint.ts` |
| O mascaramento é puramente de exibição — a string original deve ser usada | `src/lib/ip-mask.ts` |
| Index plano de contas por código (apenas analíticas usáveis) | `src/lib/lancamentos-csv-importer.ts` |
| * Validação de magic bytes (assinaturas) para uploads. | `src/lib/magic-bytes.ts` |
| aos metadados segue a mesma regra ou /Usuarios perde label/parent. | `src/lib/navigation.ts` |
| alcança o fluxo público igual a /convite/x e o token não pode vazar | `src/lib/navigation.ts` |
| com o updated_at visto = ninguém escreveu → permissão/remoção; um | `src/lib/optimistic-lock.ts` |
| no limite de 400 linhas do eslint) e mantido aqui porque o problema nao e | `src/lib/paginar-postgrest.ts` |
| * O PostgREST corta a resposta no seu limite de linhas e nao sinaliza o corte, | `src/lib/paginar-postgrest.ts` |
| * Y-coordinate (mm) onde o conteúdo da página deve começar, | `src/lib/pdf-layout.ts` |
| Deve ser chamado APÓS todo o conteúdo ter sido escrito. | `src/lib/pdf-layout.ts` |
| validação contábil seja integralmente testável em unidade. | `src/lib/plano-contas-csv-importer.ts` |
| - `natureza` deve ser devedora ou credora; `tipo` deve pertencer ao conjunto | `src/lib/plano-contas-csv-importer.ts` |
| // Quem precisar de reenvio deve declará-lo na própria mutação, e só | `src/lib/queryClient.ts` |
| * Configuração canônica por domínio de negócio. | `src/lib/queryClient.ts` |
| amostragem por rejeição (regra js/biased-cryptographic-random do | `src/lib/secure-random.ts` |
| Pega apenas os eventos mais recentes (últimas 2 horas) | `src/lib/sefaz-rejection-monitor.ts` |
| Mantém apenas os últimos 50 alertas | `src/lib/sefaz-rejection-monitor.ts` |
| * Empacotamento e validação de bundles de exportação de filtros compartilhados. | `src/lib/sharedFiltersExport.ts` |
| - Inclui o `exportedFromEmpresaId` apenas como metadado de origem; a empresa | `src/lib/sharedFiltersExport.ts` |
| - O importador deve revalidar `shared_with_roles` contra os papéis do tenant | `src/lib/sharedFiltersExport.ts` |
| * Apenas metadado — útil para auditoria visual no JSON. */ | `src/lib/sharedFiltersExport.ts` |
| * Parse + validação estrutural. NÃO valida ainda contra o tenant de destino; | `src/lib/sharedFiltersExport.ts` |
| * Classificação de mensagens de validação SPED (ECF/ECD) em categorias | `src/lib/sped-validacoes-categorias.ts` |
| # PASSO A PASSO — Validação no ${pvaNome}`, | `src/lib/sped-zip.ts` |
| Auditoria nunca deve quebrar o fluxo de logout. | `src/lib/sso-slo-audit.ts` |
| * Motivação: o gerador de tipos do Supabase reflete apenas o snapshot do schema | `src/lib/supabase-dynamic.ts` |
| um único ponto de cast — auditável, tipado por builder mínimo e documentado. | `src/lib/supabase-dynamic.ts` |
| * Este módulo expõe as duas — e apenas duas — formas legítimas de consumir uma | `src/lib/supabase-write.ts` |
| * A regra ESLint `no-floating-supabase-write` obriga uma das duas. | `src/lib/supabase-write.ts` |
| * Erro lançado por `mustSucceed`. Carrega o contexto de negócio da operação. */ | `src/lib/supabase-write.ts` |
| * Consome uma escrita **acessória** cuja falha não deve interromper o fluxo, | `src/lib/supabase-write.ts` |
| mas também não deve sumir. Nunca lança. | `src/lib/supabase-write.ts` |
| O flush de unload não pode await getUser() — user.id fica em cache aqui. | `src/lib/telemetry.ts` |
| casos (mesma regra de isSensitiveRoute em src/lib/navigation.ts). | `src/lib/telemetry.ts` |
| desconto também em bytes UTF-8, como a seleção do lote | `src/lib/telemetry.ts` |
| Cores temáticas para confetti (hex required by canvas-confetti library) | `src/lib/toast-confetti.tsx` |
| porque roda apenas em ambiente de teste/CI — nunca é importado pelo bundle | `src/lib/arquitetura/analisador-imports.ts` |
| * Regra arquitetural: se o `queryFn` de uma query filtra por `empresa_id`, | `src/lib/arquitetura/escopo-empresa.ts` |
| 1. O núcleo de domínio (camada 3) não pode importar framework/infra. | `src/lib/arquitetura/modulos.ts` |
| 3. O grafo de dependências entre módulos deve ser acíclico. | `src/lib/arquitetura/modulos.ts` |
| * Regra de camadas: um módulo nunca pode depender de uma camada mais alta | `src/lib/arquitetura/modulos.ts` |
| (número menor). Ex.: domínio (3) não pode depender de apresentação (1). | `src/lib/arquitetura/modulos.ts` |
| * Calcula apenas métricas sustentadas pelos pedidos persistidos. Lead time e | `src/lib/compras/pedidos.ts` |
| apenas transformações de apresentação — determinísticas e testáveis. | `src/lib/contabil/balancete-utils.ts` |
| * Soma dos débitos do período (apenas contas analíticas — evita dupla contagem). */ | `src/lib/contabil/balancete-utils.ts` |
| * Soma dos créditos do período (apenas contas analíticas). */ | `src/lib/contabil/balancete-utils.ts` |
| * Diferença D-C; deve ser zero em escrituração íntegra. */ | `src/lib/contabil/balancete-utils.ts` |
| Qualquer valor assim impede `balanceado: true` -- um balancete não pode | `src/lib/contabil/balancete-utils.ts` |
| * Totaliza apenas as contas analíticas (`aceita_lancamento`), pois as | `src/lib/contabil/balancete-utils.ts` |
| * Exibe apenas contas até este nível hierárquico. */ | `src/lib/contabil/balancete-utils.ts` |
| * Preenchido apenas quando `valor === null`. */ | `src/lib/contabil/indices.types.ts` |
| ---------- DRE (apenas período) ---------- | `src/lib/contabilidade/demonstrativos-competencia.ts` |
| Linhas extras na DRE para "Não classificadas" (apenas se houver) | `src/lib/contabilidade/demonstrativos-competencia.ts` |
| … +437 linhas — lista completa em `context.json` | |

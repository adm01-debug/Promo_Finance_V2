# 10 · ACESSO E SEGURANÇA — quem pode o quê

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `1f4be40d3c` · branch `main` · 2026-11-21 20:51 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## Perfis / roles identificados

`ADMIN`, `LEITOR`, `MEMBRO`, `RESPONSAVEL`, `admin`, `admin_global`, `assistant`, `contador`, `contador_readonly`, `denied`, `financeiro`, `granted`, `manager`, `operacional`, `operator`, `r`, `role`, `user`, `viewer`, `visualizador`

- Tabelas de perfil/permissão: `user_roles`, `permissions`, `role_permissions`, `sso_role_mappings`
- Colunas de perfil: `profiles.role` (TEXT DEFAULT 'visualizador'), `user_roles.role` (public.app_role NOT NULL DEFAULT 'viewer'), `expert_messages.role` (TEXT NOT NULL), `role_permissions.role` (app_role NOT NULL), `user_empresas.role` (public.app_role NOT NULL DEFAULT 'visualizador'), `protocolos_st_ufs.papel` (text NOT NULL DEFAULT 'AMBOS')
- Claims do JWT usados em políticas/funções: `email`, `role`
- Funções usadas dentro de políticas RLS (a regra real está no corpo delas — veja `06`): `can_access_saved_filter`, `empresa_acessivel`, `empresa_da_entidade_financeira`, `empresa_do_anexo_financeiro`, `empresa_membro_ativo`, `has_any_role`, `has_role`, `is_org_membro`, `is_org_responsavel`, `profile_sensitive_fields_unchanged`

## Matriz tabela × operação → quem pode (derivada das políticas RLS)

| Tabela | RLS | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `_rep` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `acessos_suspeitos` | enabled | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND ((empresa_id IS NULL) OR empresa_acessivel(empresa_id))) | — | — | — |
| `acoes_recomendadas` | enabled | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `acordos_parcelamento` | enabled | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((SELECT auth.uid()) = user_id) |
| `alert_configurations` | enabled | authenticated: public.empresa_membro_ativo(empresa_id) | authenticated: (public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.u … | authenticated: (public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.u … | authenticated: (public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.u … |
| `alertas` | enabled | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (( SELECT (SELECT auth.uid()) AS uid) = user_id)<br>authenticated: ( auth.uid() = user_id OR ( user_id IS NULL AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro': … | authenticated: ((( SELECT auth.uid() AS uid) = user_id) AND ((empresa_id IS NULL) OR public.empresa_acessivel(empresa_id)))<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: (( SELECT auth.uid() AS uid) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (( SELECT (SELECT auth.uid()) AS uid) = user_id) |
| `alertas_preditivos` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: empresa_acessivel(empresa_id) | authenticated: ( user_id = auth.uid() OR (user_id IS NULL AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro':: … | authenticated: ( user_id = auth.uid() OR (user_id IS NULL AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro':: … | — |
| `alertas_tributarios` | enabled | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `alerts` | enabled | authenticated: public.empresa_membro_ativo(empresa_id) | authenticated: (public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.u … | authenticated: (public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.u … | authenticated: (public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.u … |
| `alerts_sent` | enabled | authenticated: (EXISTS ( SELECT 1 FROM public.alerts a WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id))))<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT a … | authenticated: (EXISTS ( SELECT 1 FROM public.alerts a WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id))))<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT a … | authenticated: (EXISTS ( SELECT 1 FROM public.alerts a WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id))))<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | authenticated: ((EXISTS ( SELECT 1 FROM public.alerts a WHERE ((a.id = alerts_sent.alert_id) AND public.empresa_membro_ativo(a.empresa_id))) …<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `aliquotas_interestaduais` | enabled | authenticated: true<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) |
| `aliquotas_internas_uf` | enabled | authenticated: true<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) |
| `aliquotas_iss_municipal` | enabled | authenticated: true<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) |
| `allowed_countries` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true<br>authenticated: true<br>authenticated: true<br>authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role … | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true<br>authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role … | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true<br>authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role … | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true<br>authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role … |
| `allowed_ips` | enabled | public: auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)<br>public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `anexos_financeiros` | enabled | authenticated: EXISTS ( SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo AND ue.empresa_id = anexos_financei … | authenticated: empresa_id IS NOT NULL AND empresa_id = private.empresa_da_entidade_financeira(entidade_tipo, entidade_id) AND (storage_path … | authenticated: EXISTS ( SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo AND ue.role IN ('admin', 'financeir … | authenticated: EXISTS ( SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = auth.uid() AND ue.ativo AND ue.role IN ('admin', 'financeir … |
| `anomalia_detection_runs` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((triggered_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | — |
| `anomalia_toast_eventos` | enabled | authenticated: user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: user_id = auth.uid()<br>authenticated: ((SELECT auth.uid()) = user_id) | — | authenticated: user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') |
| `anomalias_detectadas` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … |
| `api_keys` | enabled | public: auth.uid() IN ( SELECT user_id FROM public.user_empresas WHERE empresa_id = public.api_keys.empresa_id )<br>public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_id = auth.uid() AND empresa_id = public.api_keys.empresa_id AND role = 'admin …<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_id = auth.uid() AND empresa_id = public.api_keys.empresa_id AND role = 'admin … | public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_id = auth.uid() AND empresa_id = public.api_keys.empresa_id AND role = 'admin … | public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_id = auth.uid() AND empresa_id = public.api_keys.empresa_id AND role = 'admin …<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `aprovacao_assinaturas` | enabled | authenticated: auth.uid() = user_id OR auth.uid() = (SELECT user_id FROM public.solicitacoes_aprovacao WHERE id = solicitacao_id) OR public. … | authenticated: auth.uid() = user_id | — | — |
| `aprovacao_comentarios` | enabled | public: true<br>public: auth.role() = 'authenticated'<br>authenticated: ((solicitacao_id IN ( SELECT solicitacoes_aprovacao.id FROM solicitacoes_aprovacao WHERE ((solicitacoes_aprovacao.solicitado_ … | public: auth.uid() = usuario_id<br>authenticated: ((SELECT auth.uid()) = user_id) | — | — |
| `apuracoes_irpj_csll` | enabled | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `apuracoes_tributarias` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `asaas_audit_trail` | enabled | authenticated: payment_id IN (SELECT p.id FROM public.asaas_payments p WHERE empresa_acessivel(p.empresa_id)) OR (payment_id IS NULL AND use …<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) AND ( payment_id IN (SELECT p.id FROM public.asaas_payments p WHERE empresa_ …<br>authenticated: public.has_role(auth.uid(), 'admin'::app_role) AND EXISTS ( SELECT 1 FROM public.asaas_payments p WHERE p.id = asaas_audit_tr … | — | — | — |
| `asaas_config` | enabled | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))<br>public: empresa_acessivel(empresa_id)<br>authenticated: empresa_acessivel(empresa_id) AND EXISTS ( SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = (SELECT auth.uid()) AND u … | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))<br>public: empresa_acessivel(empresa_id)<br>authenticated: empresa_acessivel(empresa_id) AND EXISTS ( SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = (SELECT auth.uid()) AND u … | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))<br>public: empresa_acessivel(empresa_id)<br>authenticated: empresa_acessivel(empresa_id) AND EXISTS ( SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = (SELECT auth.uid()) AND u … | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))<br>authenticated: empresa_acessivel(empresa_id) AND EXISTS ( SELECT 1 FROM public.user_empresas ue WHERE ue.user_id = (SELECT auth.uid()) AND u … |
| `asaas_credit_risk_analysis` | enabled | authenticated: (EXISTS ( SELECT 1 FROM public.clientes c WHERE ((c.id = asaas_credit_risk_analysis.cliente_id) AND public.empresa_acessivel( …<br>public: cliente_id IN ( SELECT id FROM public.clientes WHERE empresa_acessivel(empresa_id) ) | — | — | — |
| `asaas_customers` | enabled | service_role: true<br>authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | service_role: true<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | service_role: true<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | service_role: true<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) |
| `asaas_payment_links` | enabled | authenticated: public.has_any_role((SELECT auth.uid()), ARRAY['admin', 'financeiro']::app_role[]) AND public.empresa_acessivel(empresa_id)<br>service_role: true | authenticated: public.has_any_role((SELECT auth.uid()), ARRAY['admin', 'financeiro']::app_role[]) AND public.empresa_acessivel(empresa_id)<br>service_role: true | service_role: true | service_role: true |
| `asaas_payments` | enabled | service_role: true<br>authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | service_role: true<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | service_role: true<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | service_role: true<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) |
| `asaas_reconciliation_suggestions` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `asaas_sync_queue` | enabled | authenticated: true<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1 FROM asaas_payments p WHERE ((p.id … | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1 FROM asaas_payments p WHERE ((p.id … | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1 FROM asaas_payments p WHERE ((p.id … | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1 FROM asaas_payments p WHERE ((p.id … |
| `asaas_transfers` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))<br>public: empresa_acessivel(empresa_id) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))<br>public: empresa_acessivel(empresa_id) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `audit_logs` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: ((user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND ((user_email IS NULL) OR (user_email = ( SELECT (auth.jwt() ->> 'email' … | — | — |
| `auditoria_financeira` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((SELECT auth.uid()) = user_id) | — | — |
| `auditoria_tributaria` | enabled | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | — | — | — |
| `auth_logs` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT a … | — | — |
| `benchmarks_setoriais` | enabled | authenticated: true<br>authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: true<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `beneficios_fiscais` | enabled | authenticated: true<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) |
| `bitrix24_activities` | enabled | authenticated: (EXISTS ( SELECT 1 FROM public.lalamove_orders o WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo …<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | authenticated: (EXISTS ( SELECT 1 FROM public.lalamove_orders o WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo …<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | authenticated: (EXISTS ( SELECT 1 FROM public.lalamove_orders o WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativo …<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | authenticated: ((EXISTS ( SELECT 1 FROM public.lalamove_orders o WHERE ((o.id = bitrix24_activities.order_id) AND public.empresa_membro_ativ …<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `bitrix24_stage_mappings` | enabled | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT a … | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `bitrix24_tokens` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `bitrix_field_mappings` | enabled | public: auth.uid() IS NOT NULL<br>authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id) | authenticated: has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id) | authenticated: has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id) | authenticated: has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id) |
| `bitrix_oauth_tokens` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>service_role: true | public: has_role(auth.uid(), 'admin'::app_role)<br>service_role: true | public: has_role(auth.uid(), 'admin'::app_role)<br>service_role: true | public: has_role(auth.uid(), 'admin'::app_role)<br>service_role: true |
| `bitrix_sync_logs` | enabled | public: auth.uid() IS NOT NULL<br>authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id) | — | — |
| `bitrix_webhook_events` | enabled | public: public.has_role(auth.uid(), 'admin')<br>authenticated: true<br>authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role … | public: public.has_role(auth.uid(), 'admin')<br>authenticated: true<br>authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role … | public: public.has_role(auth.uid(), 'admin')<br>authenticated: true<br>authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role … | public: public.has_role(auth.uid(), 'admin')<br>authenticated: true<br>authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role … |
| `bling_sync_logs` | enabled | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role])<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role) OR has_role((SELEC … | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financeiro'::app_role)) | — | — |
| `bling_tokens` | enabled | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])<br>service_role: true | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])<br>service_role: true | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])<br>service_role: true | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])<br>service_role: true |
| `bling_webhook_events` | enabled | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | — | — |
| `bloat_snapshots` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | — | — |
| `blocked_ips` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'manager'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `bloqueios_duplicidade` | enabled | public: empresa_id IN (SELECT id FROM public.empresas WHERE ativo = true)<br>authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `boletos` | enabled | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((empresa_id IS NOT NULL) AND (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_ … | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_acessivel(emp … | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id) |
| `budgets` | enabled | public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_id = auth.uid() AND empresa_id = budgets.company_id ) OR user_id = auth.uid()<br>public: company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid())<br>authenticated: ((user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role) OR (company_id IN ( SELECT ue.empresa_id … | public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_id = auth.uid() AND empresa_id = budgets.company_id ) OR user_id = auth.uid()<br>public: company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid())<br>authenticated: ((user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role) OR (company_id IN ( SELECT ue.empresa_id … | public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_id = auth.uid() AND empresa_id = budgets.company_id ) OR user_id = auth.uid()<br>public: company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid())<br>authenticated: ((user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role) OR (company_id IN ( SELECT ue.empresa_id … | public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_id = auth.uid() AND empresa_id = budgets.company_id ) OR user_id = auth.uid()<br>public: company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid())<br>authenticated: ((user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role) OR (company_id IN ( SELECT ue.empresa_id … |
| `catalogos_fiscais_cargas` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | — | — |
| `catalogos_tributarios_health_history` | enabled | authenticated: ( SELECT has_role((SELECT auth.uid()), 'admin'::app_role) AS has_role) | — | — | — |
| `categorias` | enabled | public: auth.uid() = user_id<br>authenticated: auth.uid() IS NOT NULL<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id FROM user_empresas ue WHERE ((ue.u … | public: auth.uid() = user_id<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id FROM user_empresas ue WHERE ((ue.u … | public: auth.uid() = user_id<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id FROM user_empresas ue WHERE ((ue.u … | public: auth.uid() = user_id<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id FROM user_empresas ue WHERE ((ue.u … |
| `centros_custo` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … |
| `ci_security_gate_events` | enabled | service_role: true<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | service_role: true | service_role: true | service_role: true |
| `clientes` | enabled | public: auth.uid() = user_id<br>authenticated: ((empresa_id IS NOT NULL) AND (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_ …<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_membro_ativo(empresa_id) | public: auth.uid() = user_id<br>authenticated: ((( SELECT (SELECT auth.uid()) AS uid) = user_id) AND ((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id)))<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_membro_ativo(empresa_id) | public: auth.uid() = user_id<br>authenticated: public.empresa_membro_ativo(empresa_id)<br>authenticated: (( SELECT (SELECT auth.uid()) AS uid) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_membro_ativo(empresa_id) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_membro_ativo(empresa_id) |
| `cnaes` | enabled | authenticated: true<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) |
| `cnpja_cache` | enabled | authenticated: public.has_role(auth.uid(), 'admin')<br>service_role: true | service_role: true | service_role: true | service_role: true |
| `cnpja_rate_limit` | enabled | authenticated: user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') | — | — | — |
| `conciliacoes` | enabled | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]) AND empresa_acessivel(empresa_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) |
| `conciliacoes_parciais` | enabled | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])<br>authenticated: ((SELECT auth.uid()) = created_by) | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])<br>authenticated: ((SELECT auth.uid()) = created_by) | authenticated: ((SELECT auth.uid()) = created_by) | authenticated: ((SELECT auth.uid()) = created_by) |
| `configuracoes_aprovacao` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `configuracoes_duplicidade` | enabled | public: empresa_id IN (SELECT id FROM public.empresas WHERE ativo = true)<br>authenticated: true<br>authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | public: empresa_id IN (SELECT id FROM public.empresas WHERE ativo = true)<br>authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | public: empresa_id IN (SELECT id FROM public.empresas WHERE ativo = true)<br>authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | public: empresa_id IN (SELECT id FROM public.empresas WHERE ativo = true)<br>authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `conformidade_snapshots` | enabled | authenticated: (empresa_id IN ( SELECT ue.empresa_id FROM user_empresas ue WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (u …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (empresa_id IN ( SELECT ue.empresa_id FROM user_empresas ue WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (u …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (empresa_id IN ( SELECT ue.empresa_id FROM user_empresas ue WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (u …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `contas_bancarias` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]) AND empresa_acessivel(empresa_id) |
| `contas_pagar` | enabled | public: auth.uid() = user_id<br>authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | public: auth.uid() = user_id<br>authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | public: auth.uid() = user_id<br>authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | public: auth.uid() = user_id<br>authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … |
| `contas_receber` | enabled | public: auth.uid() = user_id<br>authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | public: auth.uid() = user_id<br>authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | public: auth.uid() = user_id<br>authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | public: auth.uid() = user_id<br>authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … |
| `contratos` | enabled | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `convites` | enabled | authenticated: (is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) | authenticated: ((convidado_por = (SELECT auth.uid())) AND (is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth. … | authenticated: (is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) | authenticated: (is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) |
| `convites_contador` | enabled | authenticated: (empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financ … | authenticated: created_by = auth.uid() | authenticated: (empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financ … | — |
| `creditos_tributarios` | enabled | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `cron.job` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `cron.job_run_details` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `cron_job_logs` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | — | — |
| `custom_field_definitions` | enabled | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id FROM user_empresas ue WHERE ((ue.u … | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id FROM user_empresas ue WHERE ((ue.u … | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id FROM user_empresas ue WHERE ((ue.u … | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id FROM user_empresas ue WHERE ((ue.u … |
| `custom_field_values` | enabled | authenticated: (EXISTS ( SELECT 1 FROM custom_field_definitions d WHERE ((d.id = custom_field_values.definition_id) AND (has_role((SELECT au … | authenticated: (EXISTS ( SELECT 1 FROM custom_field_definitions d WHERE ((d.id = custom_field_values.definition_id) AND (has_role((SELECT au … | authenticated: (EXISTS ( SELECT 1 FROM custom_field_definitions d WHERE ((d.id = custom_field_values.definition_id) AND (has_role((SELECT au … | authenticated: (EXISTS ( SELECT 1 FROM custom_field_definitions d WHERE ((d.id = custom_field_values.definition_id) AND (has_role((SELECT au … |
| `darfs` | enabled | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `digest_envios_log` | enabled | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | — | — | — |
| `dispositivos_conhecidos` | enabled | authenticated: true<br>authenticated: ((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND … |
| `divergencias_conciliacao` | enabled | public: true<br>authenticated: true<br>authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `drivers` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `edge_function_logs` | enabled | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | service_role: true | — | — |
| `elisao_alertas` | enabled | public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE empresa_id = elisao_alertas.empresa_id AND user_id = auth.uid() )<br>authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) |
| `elisao_creditos_auditoria` | enabled | authenticated: public.empresa_acessivel(empresa_id)<br>public: empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id)<br>public: empresa_acessivel(empresa_id) | public: empresa_acessivel(empresa_id) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))<br>public: empresa_acessivel(empresa_id) |
| `elisao_regras_creditos` | enabled | public: true<br>authenticated: true<br>authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's …<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's …<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's …<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's …<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `elisao_simulacoes_regime` | enabled | authenticated: public.empresa_acessivel(empresa_id)<br>public: empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id)<br>public: empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id)<br>public: empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id)<br>public: empresa_acessivel(empresa_id) |
| `elisao_tarefas_acionaveis` | enabled | authenticated: public.empresa_acessivel(empresa_id)<br>public: empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id)<br>public: empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id)<br>public: empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id)<br>public: empresa_acessivel(empresa_id) |
| `email_verifications` | enabled | authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id) | authenticated: (((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `empresas` | enabled | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND public.empresa_acessivel(id))<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_ace … | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND public.empresa_acessivel(id)) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND public.empresa_acessivel(id)) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND public.empresa_acessivel(id)) |
| `empresas_certificados` | enabled | authenticated: (EXISTS ( SELECT 1 FROM user_empresas ue WHERE ((ue.user_id = (SELECT auth.uid())) AND (ue.empresa_id = empresas_certificados …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `entregas_obrigacoes` | enabled | authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': …<br>authenticated: (empresa_id IN ( SELECT ue.empresa_id FROM user_empresas ue WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (u …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': …<br>authenticated: (empresa_id IN ( SELECT ue.empresa_id FROM user_empresas ue WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (u …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': …<br>authenticated: (empresa_id IN ( SELECT ue.empresa_id FROM user_empresas ue WHERE ((ue.user_id = ( SELECT (SELECT auth.uid()) AS uid)) AND (u …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `estrategias_elisao` | enabled | authenticated: true<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) |
| `estrategias_elisao_catalogo` | enabled | authenticated: true | — | — | — |
| `eventos_contabilizacao_log` | enabled | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'financeiro'::app_role]) AND empresa_acessivel(empresa_id) | — | — |
| `evidencias_pacotes` | enabled | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: (EXISTS ( SELECT 1 FROM verificacoes_conformidade vc WHERE ((vc.id = evidencias_pacotes.verificacao_id) AND (has_role((SELECT … | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: (EXISTS ( SELECT 1 FROM verificacoes_conformidade vc WHERE ((vc.id = evidencias_pacotes.verificacao_id) AND (has_role((SELECT … | authenticated: (EXISTS ( SELECT 1 FROM verificacoes_conformidade vc WHERE ((vc.id = evidencias_pacotes.verificacao_id) AND (has_role((SELECT … | authenticated: (EXISTS ( SELECT 1 FROM verificacoes_conformidade vc WHERE ((vc.id = evidencias_pacotes.verificacao_id) AND (has_role((SELECT … |
| `execucoes_cobranca` | enabled | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `execucoes_regua_cobranca` | enabled | public: true<br>authenticated: public.empresa_acessivel(empresa_id) | — | — | — |
| `expert_conversations` | enabled | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) |
| `expert_messages` | enabled | public: EXISTS ( SELECT 1 FROM public.expert_conversations WHERE id = expert_messages.conversation_id AND user_id = auth.uid() )<br>authenticated: (EXISTS ( SELECT 1 FROM expert_conversations WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_c …<br>authenticated: (EXISTS ( SELECT 1 FROM expert_conversations WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_c … | public: EXISTS ( SELECT 1 FROM public.expert_conversations WHERE id = expert_messages.conversation_id AND user_id = auth.uid() )<br>authenticated: (EXISTS ( SELECT 1 FROM expert_conversations WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_c …<br>authenticated: (EXISTS ( SELECT 1 FROM expert_conversations WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_c … | public: EXISTS ( SELECT 1 FROM public.expert_conversations WHERE id = expert_messages.conversation_id AND user_id = auth.uid() )<br>authenticated: (EXISTS ( SELECT 1 FROM expert_conversations WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_c … | authenticated: (EXISTS ( SELECT 1 FROM expert_conversations WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_c … |
| `extrato_bancario` | enabled | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]) AND empresa_acessivel(empresa_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) |
| `faixas_simples_nacional` | enabled | authenticated: true<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) |
| `faturamento_mensal` | enabled | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `fechamentos_tributarios` | enabled | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's …<br>authenticated: ((empresa_id IN ( SELECT profiles.empresa_id FROM profiles WHERE (profiles.id = (SELECT auth.uid())))) OR (EXISTS ( SELECT 1 … | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's … | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's … | authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's …<br>authenticated: public.has_role(auth.uid(), 'admin') AND empresa_acessivel(empresa_id) |
| `feedback_conciliacao_ia` | enabled | authenticated: created_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])<br>authenticated: true<br>authenticated: ((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])<br>authenticated: true<br>authenticated: ((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: true<br>authenticated: ((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: true<br>authenticated: ((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((SELECT auth.uid()) = user_id) |
| `fila_cobrancas` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) |
| `fluxos_aprovacao_niveis` | enabled | public: auth.uid() = empresa_id<br>public: auth.uid() = empresa_id<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: auth.uid() = empresa_id<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: auth.uid() = empresa_id<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: auth.uid() = empresa_id<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `folha_pagamento` | enabled | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `formas_pagamento` | enabled | authenticated: true<br>public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `fornecedores` | enabled | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_acessivel(empresa_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role … | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_acessivel(empresa_id) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_acessivel(empresa_id) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_acessivel(empresa_id) |
| `frontend_error_alert_state` | enabled | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | — | — | — |
| `frontend_error_logs` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: (((SELECT auth.uid()) = user_id) OR (user_id IS NULL)) | — | — |
| `frontend_error_logs_2026_01` | não verificado | ? | ? | ? | ? |
| `frontend_error_logs_2026_02` | não verificado | ? | ? | ? | ? |
| `frontend_error_logs_2026_03` | não verificado | ? | ? | ? | ? |
| `frontend_error_logs_2026_04` | não verificado | ? | ? | ? | ? |
| `frontend_error_logs_2026_05` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `frontend_error_logs_2026_06` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `frontend_error_logs_2026_07` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `frontend_error_logs_2026_08` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `frontend_error_logs_2026_09` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `frontend_error_logs_2026_10` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `frontend_error_logs_2026_11` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `frontend_error_logs_default` | não encontrado | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `frontend_error_silence_digest_log` | enabled | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | — | — | — |
| `frontend_performance_logs` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: ((SELECT auth.uid()) IS NOT NULL) | — | — |
| `geo_blocks` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'manager'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `glossario_tributario` | enabled | public: true<br>authenticated: ativo<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `health_scores_operacionais` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: public.has_role(auth.uid(), 'admin') AND empresa_acessivel(empresa_id) | — | — |
| `historico_analises_preditivas` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ( created_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) … | — | — |
| `historico_cobranca` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `historico_cobranca_whatsapp` | enabled | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `historico_cobrancas_boletos` | enabled | public: EXISTS (SELECT 1 FROM public.boletos b JOIN public.empresas e ON b.empresa_id = e.id WHERE b.id = boleto_id)<br>authenticated: (conta_receber_id IN ( SELECT contas_receber.id FROM contas_receber WHERE (contas_receber.empresa_id IN ( SELECT user_empresa …<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id) |
| `historico_conciliacao_ia` | enabled | authenticated: has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND ( (tipo_lancamento = 'pagar' AND conta_pagar_id IS NOT … | authenticated: has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND ( (tipo_lancamento = 'pagar' AND conta_pagar_id IS NOT … | — | — |
| `historico_relatorios` | enabled | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) OR EXISTS ( SELECT 1 FROM pub …<br>authenticated: (EXISTS ( SELECT 1 FROM relatorios_agendados r WHERE ((r.id = historico_relatorios.relatorio_agendado_id) AND ((r.created_by … | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) OR EXISTS ( SELECT 1 FROM pub … | — | — |
| `historico_score_saude` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND empresa_acessivel(empresa … | — | — |
| `incentivos_fiscais` | enabled | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR ((auth.jwt() ->> 'role'::text) = 'anon'::text) OR (((auth.jwt() -> … | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR ((auth.jwt() ->> 'role'::text) = 'anon'::text) OR (((auth.jwt() -> … | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR ((auth.jwt() ->> 'role'::text) = 'anon'::text) OR (((auth.jwt() -> … | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR ((auth.jwt() ->> 'role'::text) = 'anon'::text) OR (((auth.jwt() -> … |
| `index_usage_snapshots` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | — | — |
| `indices_uso_excecoes` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | — | — |
| `integration_secrets` | enabled | authenticated, anon [RESTRICTIVE]: false | authenticated, anon [RESTRICTIVE]: false | authenticated, anon [RESTRICTIVE]: false | authenticated, anon [RESTRICTIVE]: false |
| `integrity_alerts` | enabled | service_role: true<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | service_role: true | service_role: true | service_role: true |
| `ip_whitelist` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'manager'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `itens_lista_iss` | enabled | authenticated: true<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) |
| `itens_pedido_compra` | enabled | public: EXISTS ( SELECT 1 FROM public.pedidos_compra WHERE pedidos_compra.id = itens_pedido_compra.pedido_id AND pedidos_compra.user_id = au …<br>authenticated: (pedido_id IN ( SELECT pedidos_compra.id FROM pedidos_compra WHERE (pedidos_compra.empresa_id IN ( SELECT user_empresas.empre … | public: EXISTS ( SELECT 1 FROM public.pedidos_compra WHERE pedidos_compra.id = itens_pedido_compra.pedido_id AND pedidos_compra.user_id = au …<br>authenticated: public.has_any_role((SELECT auth.uid()), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND EXISTS ( SELECT … | — | — |
| `kpis_operacionais` | enabled | public: auth.uid() = user_id<br>authenticated: (user_id = auth.uid()) | public: auth.uid() = user_id<br>authenticated: (user_id = auth.uid()) | public: auth.uid() = user_id<br>authenticated: (user_id = auth.uid()) | public: auth.uid() = user_id<br>authenticated: (user_id = auth.uid()) |
| `lancamentos_contabeis` | enabled | authenticated: empresa_acessivel(empresa_id) AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR empresa_id IN ( SELECT … | authenticated: empresa_acessivel(empresa_id) AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR empresa_id IN ( SELECT … | authenticated: empresa_acessivel(empresa_id) AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR empresa_id IN ( SELECT … | authenticated: empresa_acessivel(empresa_id) AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR empresa_id IN ( SELECT … |
| `login_attempts` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `logs_baixa_automatica` | enabled | public: true<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (( SELECT (SELECT auth.uid()) AS uid) = user_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (( SELECT (SELECT auth.uid()) AS uid) = user_id) | authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id) |
| `logs_conciliacao_retroativa` | enabled | public: true<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (( SELECT (SELECT auth.uid()) AS uid) = user_id) | public: auth.uid() IS NOT NULL<br>authenticated: (( SELECT (SELECT auth.uid()) AS uid) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id) |
| `metas_financeiras` | enabled | authenticated: true<br>public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `mfa_sessions` | enabled | authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: (((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role))<br>authenticated: ((SELECT auth.uid()) = user_id) |
| `movimentacoes` | enabled | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `n8n_dispatch_logs` | enabled | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | — | — | — |
| `n8n_workflow_configs` | enabled | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) |
| `ncms` | enabled | authenticated: true<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) |
| `negativacoes` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) |
| `new_device_alerts` | enabled | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | public: auth.uid() = user_id<br>authenticated: (((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)) | authenticated: (((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)) |
| `nfe_eventos` | enabled | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR (EXISTS ( SELECT 1 FROM (nfe_recebidas r JOIN user_empresas ue ON ((ue.e … | — | — | — |
| `nfe_recebidas` | enabled | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND (EXISTS ( SELECT 1 FROM user_empresas ue W … | — | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND (EXISTS ( SELECT 1 FROM user_empresas ue W … | — |
| `notas_fiscais` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_membro_ativo(empresa_id) | authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_membro_ativo(empresa_id) | authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_membro_ativo(empresa_id) | authenticated: (empresa_membro_ativo(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'man …<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro', 'operacional']::app_role[]) AND empresa_membro_ativo(empresa_id) |
| `notas_fiscais_ocr` | enabled | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's …<br>authenticated: ((empresa_id IN ( SELECT profiles.empresa_id FROM profiles WHERE (profiles.id = (SELECT auth.uid())))) OR (EXISTS ( SELECT 1 … | authenticated: auth.uid() = criado_por<br>authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's … | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's …<br>authenticated: (auth.uid() = criado_por OR has_role(auth.uid(), 'admin')) AND empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's …<br>authenticated: has_role(auth.uid(), 'admin') AND empresa_acessivel(empresa_id) |
| `notification_history` | enabled | authenticated: auth.uid() = user_id<br>authenticated: (user_id = (SELECT auth.uid())) | authenticated: false<br>authenticated: (user_id = (SELECT auth.uid())) | authenticated: auth.uid() = user_id<br>authenticated: (user_id = (SELECT auth.uid())) | authenticated: (user_id = (SELECT auth.uid())) |
| `open_finance_consents` | enabled | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id) |
| `operacoes_icms` | enabled | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) |
| `operacoes_tributaveis` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | — | — | — |
| `oportunidades_elisao` | enabled | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]) AND empresa_acessivel(e … | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) |
| `organizacao_membros` | enabled | authenticated: (is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role))<br>authenticated: ((usuario_id = (SELECT auth.uid())) OR is_org_membro(organizacao_id, (SELECT auth.uid())) OR is_org_responsavel(organizacao_i … | authenticated: (is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) | authenticated: (is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) | authenticated: (is_org_responsavel(organizacao_id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) |
| `organizacoes` | enabled | authenticated: ((responsavel_id = (SELECT auth.uid())) OR is_org_membro(id, (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::a … | authenticated: (responsavel_id = (SELECT auth.uid())) | authenticated: ((responsavel_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) | authenticated: ((responsavel_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) |
| `overlay_rejeicoes_auditoria` | enabled | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'manager … | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'manager … | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'manager … | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'manager … |
| `pagamentos_recorrentes` | enabled | authenticated: has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: auth.uid() = created_by AND empresa_acessivel(empresa_id) | authenticated: has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: public.has_role(auth.uid(), 'admin') AND empresa_acessivel(empresa_id) |
| `parcelas_acordo` | enabled | authenticated: true<br>authenticated: (acordo_id IN ( SELECT a.id FROM acordos_parcelamento a WHERE (a.empresa_id IN ( SELECT user_empresas.empresa_id FROM user_em …<br>authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | authenticated: true<br>authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | authenticated: true<br>authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … | authenticated: true<br>authenticated: ((has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) OR has_role(( SELECT (SELECT auth.uid()) AS uid), 'financ … |
| `partidas_contabeis` | enabled | authenticated: true<br>authenticated: (EXISTS ( SELECT 1 FROM lancamentos_contabeis lc WHERE ((lc.id = partidas_contabeis.lancamento_id) AND ((lc.user_id = (SELECT …<br>authenticated: has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]) AND empresa_acessivel(empresa_ … | authenticated: true<br>authenticated: (EXISTS ( SELECT 1 FROM lancamentos_contabeis lc WHERE ((lc.id = partidas_contabeis.lancamento_id) AND ((lc.user_id = (SELECT …<br>authenticated: has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: true<br>authenticated: (EXISTS ( SELECT 1 FROM lancamentos_contabeis lc WHERE ((lc.id = partidas_contabeis.lancamento_id) AND ((lc.user_id = (SELECT …<br>authenticated: has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: true<br>authenticated: (EXISTS ( SELECT 1 FROM lancamentos_contabeis lc WHERE ((lc.id = partidas_contabeis.lancamento_id) AND ((lc.user_id = (SELECT …<br>authenticated: has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) |
| `password_reset_requests` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | public: status = 'pendente' AND user_email IS NOT NULL AND length(trim(user_email)) >= 5 AND position('@' in user_email) > 1<br>authenticated: (user_email = (( SELECT users.email FROM auth.users WHERE (users.id = (SELECT auth.uid()))))::text) | public: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `password_reset_tokens` | enabled | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id) | — | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `pedidos_compra` | enabled | public: auth.uid() = user_id<br>authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: auth.uid() = user_id<br>authenticated: public.has_any_role((SELECT auth.uid()), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND public.empresa_a … | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `per_dcomp` | enabled | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) |
| `performance_alerts` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | — | — |
| `permissions` | enabled | public: auth.uid() IS NOT NULL<br>public: has_role(auth.uid(), 'admin')<br>authenticated: ((SELECT auth.uid()) IS NOT NULL) | public: has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | public: has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | public: has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `pg_stat_statements_baseline` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | — | — |
| `pix_templates` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: auth.uid() = created_by<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) |
| `plano_contas` | enabled | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `planos_acao` | enabled | public: auth.uid() = user_id<br>authenticated: (user_id = (SELECT auth.uid())) | public: auth.uid() = user_id<br>authenticated: (user_id = (SELECT auth.uid())) | public: auth.uid() = user_id<br>authenticated: (user_id = (SELECT auth.uid())) | public: auth.uid() = user_id<br>authenticated: (user_id = (SELECT auth.uid())) |
| `portal_cliente_acessos` | enabled | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: token_id IS NOT NULL AND acao IS NOT NULL AND length(trim(acao)) > 0<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | — |
| `portal_cliente_tokens` | enabled | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND empresa_acessivel(empresa …<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id) | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND empresa_acessivel(empresa …<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id) | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND empresa_acessivel(empresa …<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id) | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND empresa_acessivel(empresa …<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id) |
| `prejuizos_fiscais` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `profiles` | enabled | authenticated: (has_role(auth.uid(), 'admin') AND empresa_acessivel(empresa_id))<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id))<br>authenticated: (((SELECT auth.uid()) = id) OR ((SELECT auth.uid()) = user_id) OR (has_role((SELECT auth.uid()), 'admin'::app_role) AND empre … | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (((SELECT auth.uid()) = id) OR ((SELECT auth.uid()) = user_id))<br>authenticated: (has_role(auth.uid(), 'admin') AND empresa_acessivel(empresa_id))<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `projecoes_reforma` | enabled | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) |
| `protestos` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) |
| `protocolos_st` | enabled | authenticated: true<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) |
| `protocolos_st_ncms` | enabled | authenticated: true<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) |
| `protocolos_st_ufs` | enabled | authenticated: true<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) |
| `push_subscriptions` | enabled | public: auth.uid() = user_id<br>authenticated: auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')<br>authenticated: (user_id = (SELECT auth.uid())) | public: auth.uid() = user_id<br>authenticated: auth.uid() = user_id<br>authenticated: (user_id = (SELECT auth.uid())) | public: auth.uid() = user_id<br>authenticated: auth.uid() = user_id<br>authenticated: (user_id = (SELECT auth.uid())) | public: auth.uid() = user_id<br>authenticated: auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')<br>authenticated: (user_id = (SELECT auth.uid())) |
| `query_telemetry` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'manager'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT a … | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `rate_limit_logs` | enabled | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | authenticated: auth.uid() IS NOT NULL<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT a … | authenticated: public.has_role(auth.uid(), 'admin') | authenticated: public.has_role(auth.uid(), 'admin') |
| `recomendacoes_metas_ia` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: auth.uid() IS NOT NULL | authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND empresa_acessivel(empresa … | — |
| `regime_decision_cache` | enabled | authenticated: public.empresa_acessivel(empresa_id) | — | — | — |
| `regimes_especiais_empresa` | enabled | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `regimes_simulados` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) | authenticated: public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id) |
| `regimes_tributarios` | enabled | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `regras_conciliacao` | enabled | public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id AND user_empresas.user_id …<br>authenticated: true<br>authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_empresas.empresa_id = empresa_id AND user_empresas.user_id = auth.uid() )<br>authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id AND user_empresas.user_id …<br>authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id AND user_empresas.user_id …<br>authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `regras_contabilizacao_automatica` | enabled | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financ … | authenticated: (empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financ … | authenticated: (empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financ … | authenticated: (empresa_acessivel(empresa_id) AND (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'financ … |
| `regras_duplicidade` | enabled | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `regras_roteamento_financeiro` | enabled | public: EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id)<br>public: EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id)<br>public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id)<br>public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id)<br>public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id)<br>public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `regua_cobranca` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) |
| `regua_cobranca_etapas` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: (regua_id IN ( SELECT regua_cobranca.id FROM regua_cobranca WHERE (regua_cobranca.empresa_id IN ( SELECT user_empresas.empres …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1 FROM regua_cobranca r WHERE ((r.id … | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1 FROM regua_cobranca r WHERE ((r.id … | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1 FROM regua_cobranca r WHERE ((r.id … | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1 FROM regua_cobranca r WHERE ((r.id … |
| `regua_cobranca_status` | enabled | public: auth.uid() IN (SELECT user_id FROM public.user_empresas WHERE empresa_id = regua_cobranca_status.empresa_id)<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `relatorios_agendados` | enabled | authenticated: ( created_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) …<br>authenticated: ((created_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) AND empresa_acessivel(empresa_id) | authenticated: created_by = auth.uid()<br>authenticated: ((created_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) AND empresa_acessivel(empresa_id) | authenticated: ( created_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) …<br>authenticated: ((created_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) AND empresa_acessivel(empresa_id) | authenticated: ( created_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) …<br>authenticated: ((created_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) AND empresa_acessivel(empresa_id) |
| `relatorios_tributarios_agendados` | enabled | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's …<br>authenticated: ((empresa_id IN ( SELECT profiles.empresa_id FROM profiles WHERE (profiles.id = (SELECT auth.uid())))) OR (EXISTS ( SELECT 1 … | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's …<br>authenticated: ( public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro') ) AND empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's …<br>authenticated: ( public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro') ) AND empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id)<br>authenticated: (EXISTS ( SELECT 1 FROM profiles WHERE ((profiles.id = (SELECT auth.uid())) AND (profiles.role = ANY (ARRAY['admin'::text, 's …<br>authenticated: public.has_role(auth.uid(), 'admin') AND empresa_acessivel(empresa_id) |
| `resumos_executivos_semanais` | enabled | service_role: true<br>public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | service_role: true<br>public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | service_role: true<br>public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | service_role: true<br>public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `retencao_politicas` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | — | — |
| `retencoes_fonte` | enabled | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `risk_rules` | enabled | authenticated: public.empresa_membro_ativo(empresa_id) | authenticated: (public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.u … | authenticated: (public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.u … | authenticated: (public.empresa_membro_ativo(empresa_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.u … |
| `role_permissions` | enabled | public: auth.uid() IS NOT NULL<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: ((SELECT auth.uid()) IS NOT NULL) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `rpc_observability_metrics` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | — | — |
| `runtime_error_logs` | enabled | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | authenticated: ((SELECT auth.uid()) IS NOT NULL) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `saved_filter_subscriptions` | enabled | public: auth.uid() = user_id<br>authenticated: (user_id = (SELECT auth.uid())) | public: auth.uid() = user_id AND public.can_access_saved_filter(saved_filter_id, auth.uid())<br>authenticated: (user_id = (SELECT auth.uid())) | public: auth.uid() = user_id<br>authenticated: (user_id = (SELECT auth.uid())) | public: auth.uid() = user_id<br>authenticated: (user_id = (SELECT auth.uid())) |
| `saved_filters` | enabled | authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': …<br>authenticated: (user_id = (SELECT auth.uid()))<br>authenticated: (user_id = (SELECT auth.uid()))<br>authenticated: ((user_id = (SELECT auth.uid())) OR (is_shared AND (empresa_id IS NOT NULL) AND empresa_acessivel(empresa_id) AND (EXISTS ( S … | public: auth.uid() = user_id AND (created_by IS NULL OR created_by = auth.uid()) AND ( is_shared = false OR ( empresa_id IS NOT NULL AND EXI …<br>authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': …<br>authenticated: (user_id = (SELECT auth.uid()))<br>authenticated: (user_id = (SELECT auth.uid())) | public: auth.uid() = COALESCE(created_by, user_id)<br>authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': …<br>authenticated: (user_id = (SELECT auth.uid()))<br>authenticated: (user_id = (SELECT auth.uid())) | public: auth.uid() = COALESCE(created_by, user_id)<br>authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': …<br>authenticated: (user_id = (SELECT auth.uid()))<br>authenticated: (user_id = (SELECT auth.uid())) |
| `scim_operations_log` | enabled | authenticated: (public.has_role(auth.uid(), 'admin') AND public.empresa_acessivel(empresa_id))<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | — | — | — |
| `scim_setup_checklist` | enabled | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: (user_id = auth.uid()) | authenticated: public.has_role(auth.uid(), 'admin') AND user_id = auth.uid()<br>authenticated: (user_id = auth.uid()) | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: (user_id = auth.uid()) | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: (user_id = auth.uid()) |
| `scim_tokens` | enabled | authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role … | authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role … | authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role … | authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role … |
| `security_alerts` | enabled | public: has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin'::public.app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | public: has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `security_audit_logs` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: ((SELECT auth.uid()) IS NOT NULL) | — | — |
| `security_settings` | enabled | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `sefaz_dfe_cursor` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | — | — |
| `sessoes_conciliacao` | enabled | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) |
| `simulacao_tributos_detalhados` | enabled | authenticated: (EXISTS ( SELECT 1 FROM simulacoes s WHERE ((s.id = simulacao_tributos_detalhados.simulacao_id) AND empresa_acessivel(s.empre … | authenticated: (EXISTS ( SELECT 1 FROM simulacoes s WHERE ((s.id = simulacao_tributos_detalhados.simulacao_id) AND empresa_acessivel(s.empre … | authenticated: (EXISTS ( SELECT 1 FROM simulacoes s WHERE ((s.id = simulacao_tributos_detalhados.simulacao_id) AND empresa_acessivel(s.empre … | authenticated: (EXISTS ( SELECT 1 FROM simulacoes s WHERE ((s.id = simulacao_tributos_detalhados.simulacao_id) AND empresa_acessivel(s.empre … |
| `simulacoes` | enabled | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) |
| `slo_metrics_diarias` | enabled | authenticated: public.has_role(auth.uid(), 'admin')<br>service_role: true<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | service_role: true | service_role: true | service_role: true |
| `slow_query_alerts` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | — | — |
| `solicitacoes_aprovacao` | enabled | authenticated: solicitado_por = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role] …<br>authenticated: ((SELECT auth.uid()) = user_id) | public: public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role])<br>authenticated: ((SELECT auth.uid()) = user_id) | public: public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id) |
| `solicitacoes_lgpd` | enabled | authenticated: ((user_id = ( SELECT auth.uid() AS uid)) OR (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (empr …<br>authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': …<br>authenticated: (user_id = (SELECT auth.uid())) | authenticated: user_id = auth.uid()<br>authenticated: ((user_id = ( SELECT auth.uid() AS uid)) AND ((empresa_id IS NULL) OR public.empresa_acessivel(empresa_id)))<br>authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': …<br>authenticated: (user_id = (SELECT auth.uid())) | authenticated: (public.has_role(( SELECT auth.uid() AS uid), 'admin'::public.app_role) AND (empresa_id IS NOT NULL) AND public.empresa_membr …<br>authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': … | authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': … |
| `sped_contabil_arquivos` | enabled | authenticated: public.empresa_acessivel(empresa_id) | authenticated: public.empresa_acessivel(empresa_id) | authenticated: (has_any_role((SELECT auth.uid()), ARRAY['admin','financeiro']::app_role[]) AND empresa_acessivel(empresa_id)) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `split_payment_transacoes` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | — |
| `sso_login_attempts` | enabled | authenticated: (public.has_role(auth.uid(), 'admin') AND public.empresa_acessivel((SELECT sp.empresa_id FROM public.sso_providers sp WHERE s …<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel((SELECT sp.empresa_id FROM public.sso_providers sp WH … | — | — | — |
| `sso_providers` | enabled | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `sso_role_mappings` | enabled | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `sso_sandbox_runs` | enabled | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by<br>authenticated: (has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid())) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `sso_user_groups` | enabled | authenticated: auth.uid() = user_id<br>authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `tax_audit_trail` | enabled | public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_empresas.empresa_id = tax_audit_trail.empresa_id AND user_empresas.user_id = …<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND empresa_acessivel(empresa_id))) | public: EXISTS ( SELECT 1 FROM public.user_empresas WHERE user_empresas.empresa_id = tax_audit_trail.empresa_id AND user_empresas.user_id = … | — | — |
| `templates_cobranca` | enabled | authenticated: (empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND …<br>authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `transacoes_bancarias` | enabled | public: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[])<br>authenticated: public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])<br>authenticated: (conta_bancaria_id IN ( SELECT contas_bancarias.id FROM contas_bancarias WHERE (contas_bancarias.empresa_id IN ( SELECT user_ … | public: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[])<br>authenticated: public.has_any_role((SELECT auth.uid()), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND conta_bancaria_i … | public: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[])<br>authenticated: public.has_any_role((SELECT auth.uid()), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]) AND conta_bancaria_i … | public: public.has_any_role(auth.uid(), ARRAY['admin', 'financeiro']::app_role[]) |
| `transferencias` | enabled | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `ufs` | enabled | authenticated: true<br>authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role …<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role …<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role …<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) | authenticated: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = (SELECT auth.uid())) AND (user_roles.role = 'admin'::app_role …<br>authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role) |
| `user_action_audit` | enabled | authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id) | — | — |
| `user_active_filters` | enabled | public: user_id = auth.uid()<br>authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': …<br>authenticated: (user_id = (SELECT auth.uid()))<br>authenticated: (user_id = (SELECT auth.uid())) | public: user_id = auth.uid()<br>authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': …<br>authenticated: (user_id = (SELECT auth.uid()))<br>authenticated: (user_id = (SELECT auth.uid())) | public: user_id = auth.uid()<br>authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': …<br>authenticated: (user_id = (SELECT auth.uid()))<br>authenticated: (user_id = (SELECT auth.uid())) | public: user_id = auth.uid()<br>authenticated: (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = (SELECT auth.uid())) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin': …<br>authenticated: (user_id = (SELECT auth.uid()))<br>authenticated: (user_id = (SELECT auth.uid())) |
| `user_anomalia_preferences` | enabled | authenticated: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) |
| `user_demonstrativo_preferences` | enabled | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id) |
| `user_devices` | enabled | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)) | authenticated: (((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role))<br>authenticated: ((SELECT auth.uid()) = user_id) |
| `user_digest_preferences` | enabled | authenticated: has_role(( SELECT (SELECT auth.uid()) AS uid), 'admin'::app_role)<br>authenticated: (( SELECT (SELECT auth.uid()) AS uid) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: (( SELECT (SELECT auth.uid()) AS uid) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: (( SELECT (SELECT auth.uid()) AS uid) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: (( SELECT (SELECT auth.uid()) AS uid) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) |
| `user_empresas` | enabled | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id))<br>authenticated: (((SELECT auth.uid()) = user_id) OR (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id))) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) AND empresa_acessivel(empresa_id)) |
| `user_filter_presets` | enabled | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: user_id = (SELECT auth.uid()) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: user_id = (SELECT auth.uid()) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: user_id = (SELECT auth.uid()) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: user_id = (SELECT auth.uid()) |
| `user_onboarding_progress` | enabled | authenticated: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | — |
| `user_passkeys` | enabled | authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: (((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)) |
| `user_preferences` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `user_roles` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: (((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role)<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `user_sessions` | enabled | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: auth.uid() = user_id | authenticated: auth.uid() = user_id | public: auth.uid() = user_id |
| `vendedores` | enabled | authenticated: true<br>public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `verificacoes_conformidade` | enabled | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | service_role: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | service_role: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |
| `webauthn_challenges` | enabled | authenticated: (((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)) | authenticated: ((SELECT auth.uid()) = user_id)<br>authenticated: ((SELECT auth.uid()) = user_id) | authenticated: (( SELECT (SELECT auth.uid()) AS uid) = user_id) | authenticated: (((SELECT auth.uid()) = user_id) OR has_role((SELECT auth.uid()), 'admin'::app_role)) |
| `webauthn_credentials` | enabled | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) | public: auth.uid() = user_id<br>authenticated: ((SELECT auth.uid()) = user_id) |
| `webhook_dlq` | enabled | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — |
| `webhook_events` | enabled | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role))<br>authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role))<br>authenticated: has_role((SELECT auth.uid()), 'viewer'::app_role) | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role) OR has_role((SELECT a … | authenticated: (has_role((SELECT auth.uid()), 'admin'::app_role) OR has_role((SELECT auth.uid()), 'manager'::app_role)) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) |
| `webhook_simulation_results` | enabled | authenticated: (EXISTS ( SELECT 1 FROM webhook_simulation_runs WHERE ((webhook_simulation_runs.id = webhook_simulation_results.run_id) AND ( … | — | — | — |
| `webhook_simulation_runs` | enabled | authenticated: ((SELECT auth.uid()) = created_by) | authenticated: ((SELECT auth.uid()) = created_by) | — | — |
| `webhooks_log` | enabled | authenticated: has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])<br>authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | authenticated: has_role((SELECT auth.uid()), 'admin'::app_role) | — | — |
| `whatsapp_conversas` | enabled | public: true<br>public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … | public: true<br>authenticated: ((empresa_id IN ( SELECT user_empresas.empresa_id FROM user_empresas WHERE ((user_empresas.user_id = (SELECT auth.uid())) AND … |

> `—` com RLS ligado = ninguém além de service_role. `sem RLS` = qualquer chave anon lê/escreve tudo. `?` = tabela só conhecida pelo types.ts (sem migration no repo): RLS e políticas NÃO VERIFICADOS, confira no banco real.

> **NÃO VERIFICADO — a matriz acima está incompleta.** Algumas migrations criam políticas por SQL
> dinâmico (`DO $$ ... EXECUTE format('CREATE POLICY ...')`), que não é reconstruível estaticamente:
> as linhas destas tabelas podem omitir políticas que existem no banco ou listar políticas que um
> `DROP POLICY` dinâmico já removeu. Confirme no snapshot do
> banco real (`docs/contexto/supabase/`), que é o dono deste fato, antes de concluir que um perfil
> tem ou não tem acesso.
>
> Tabelas afetadas: `active_tracking`, `alert_configurations`, `alerts`, `apuracoes_irpj_csll`, `apuracoes_tributarias`, `asaas_audit_trail`, `asaas_config`, `asaas_customers`, `asaas_payments`, `asaas_reconciliation_suggestions`, `asaas_sync_queue`, `asaas_transfers`, `creditos_tributarios`, `darfs`, `drivers`, `fluxos_aprovacao_niveis`, `frontend_error_logs_2026_05`, `frontend_error_logs_2026_06`, `frontend_error_logs_2026_07`, `frontend_error_logs_2026_08`, `frontend_error_logs_2026_09`, `frontend_error_logs_2026_10`, `historico_cobrancas_boletos`, `incentivos_fiscais`, `lalamove_orders`, `lalur_lancamentos`, `movimentacoes`, `operacoes_tributaveis`, `parcelas_acordo`, `partidas_contabeis`, `per_dcomp`, `prejuizos_fiscais`, `regimes_especiais_empresa`, `regua_cobranca_status`, `retencoes_fonte`, `risk_rules`, `split_payment_transacoes`, `verificacoes_conformidade`
>
> Origem: `supabase/migrations/20260314212617_0a1622f1-b87c-45b4-96af-b589c5f843e0.sql`, `supabase/migrations/20260314213748_9f7b6de3-00ed-4be1-a331-21da0a4ce4d2.sql`, `supabase/migrations/20260518165422_5d19ef90-1069-47a2-9850-897c841223f5.sql`, `supabase/migrations/20260531123734_e923a347-4d43-4af5-b68f-db154ca7f62b.sql`, `supabase/migrations/20260531123935_090ff7cb-3843-4573-a977-3eae18581dd7.sql`, `supabase/migrations/20260711183150_5cd96ae1-0804-4d73-b367-904722df8877.sql`, `supabase/migrations/20260728104255_519fc6e0-ce25-48fc-870f-064bbcff22cb.sql`, `supabase/migrations/20260728173440_c9548968-94e3-4c53-939e-2d7cf890be29.sql`, `supabase/migrations/20260728213519_18e89190-27ac-4f1a-9ec9-0fa78dd00208.sql`, `supabase/migrations/20260728215040_cc625266-ea37-4fa7-9fc3-02b304292281.sql`, `supabase/migrations/20260728215129_68943d1e-0b53-4955-980b-d5c220bdfc46.sql`, `supabase/migrations/20260825230000_initplan_rls_e67.sql`, `supabase/migrations/20260902240000_fix_rls_gaps_pos_pr54.sql`

## Onde o RLS é IGNORADO (service_role) — 361 arquivo(s)

- `db/functions/observability/capture_slow_queries.sql`
- `db/functions/retention/cleanup_log_tables.sql`
- `db/functions/retention/gate_35_tabelas_sem_retencao.sql`
- `db/functions/webhooks/enqueue_webhook_retry.sql`
- `docs/archive/sql/scripts/incentivos_fiscais.sql`
- `scripts/admin/supabase_admin_ops.py`
- `scripts/admin/test_supabase_admin_ops_main_scenarios.py`
- `scripts/ai-context/cenarios.mjs`
- `scripts/ai-context/gerar.unit.mjs`
- `scripts/data/checkpoint.sql`
- `scripts/data/test_data_migrate_pg_scenarios.py`
- `scripts/db/replay-bootstrap.sql`
- `scripts/edge-deploy/redigir-log.mjs`
- `scripts/edge-deploy/redigir-log.unit.mjs`
- `scripts/generate-env-manifest.mjs`
- `scripts/generate-env-manifest.unit.mjs`
- `scripts/generate-simulation-report.ts`
- `scripts/graphify-local.unit.mjs`
- `scripts/graphify/edge_inventory.py`
- `scripts/graphify/test_edge_inventory.py`
- `scripts/graphify/test_run.py`
- `scripts/graphify/test_sql_inventory.py`
- `scripts/healthcheck/03_realtime.mjs`
- `scripts/healthcheck/03_realtime.unit.mjs`
- `scripts/healthcheck/test_healthcheck_scenarios.py`
- `scripts/integrity/03_grants.sql`
- `scripts/integrity/test_integrity_pg_scenarios.py`
- `scripts/inventario/gerar-banco.mjs`
- `scripts/regras_negocio/generate.py`
- `scripts/regras_negocio/test_generate.py`
- `scripts/scripts-ts.unit.mjs`
- `scripts/security/test-canonical-db-gates.mjs`
- `scripts/security/test-canonical-db-gates.test.mjs`
- `scripts/security/test-lint-function-repairs.mjs`
- `scripts/security/test-observability-privileges.sql`
- `scripts/security/test-privilege-baseline.sql`
- `scripts/security/test-rpc-runtime.ts`
- `scripts/security/test-security-definer-invocation.sql`
- `scripts/security/test-tenant-policy-scope.sql`
- `scripts/security/test_gates_http.py`
- `scripts/security/test_gates_sql.py`
- `scripts/stress-test.ts`
- `scripts/supabase_snapshot/snapshot.py`
- `scripts/supabase_snapshot/test_snapshot.py`
- `scripts/test_check_external_secret_isolation.py`
- `src/components/financeiro/AnexoList.tsx`
- `src/hooks/useAsaas.ts`
- `src/hooks/useConciliacao.ts`
- `src/hooks/useNfeVinculo.ts`
- `src/integrations/supabase/client.ts`
- `src/lib/__tests__/edge-functions.security.test.ts`
- `supabase/functions/_shared/auth-guard.ts`
- `supabase/functions/_shared/auth-guard_test.ts`
- `supabase/functions/_shared/console-persist.ts`
- `supabase/functions/_shared/contract-coverage_test.ts`
- `supabase/functions/_shared/nfe/xml-storage.ts`
- `supabase/functions/_shared/observability.ts`
- `supabase/functions/_shared/proxy-audit.ts`
- `supabase/functions/_shared/sefaz/pfx.ts`
- `supabase/functions/_shared/webhook-auth.ts`
- `supabase/functions/_shared/webhook-idempotency.ts`
- `supabase/functions/aceitar-convite/index.ts`
- `supabase/functions/analise-fluxo-ia/auth_test.ts`
- `supabase/functions/analise-fluxo-ia/index.ts`
- `supabase/functions/analise-preditiva/index.ts`
- `supabase/functions/analyze-document/index.ts`
- `supabase/functions/asaas-proxy/index.test.ts`
- `supabase/functions/asaas-proxy/index.ts`
- `supabase/functions/asaas-webhook/index.test.ts`
- `supabase/functions/benchmarking-setorial/index.ts`
- `supabase/functions/bitrix24-sync/index.ts`
- `supabase/functions/bitrix24-webhook/index.test.ts`
- `supabase/functions/bitrix24-webhook/index.ts`
- `supabase/functions/bling-proxy/index.ts`
- `supabase/functions/bling-webhook/index.test.ts`
- `supabase/functions/bling-webhook/index.ts`
- `supabase/functions/calcular-health-score-operacional/index.ts`
- `supabase/functions/calcular-slo-metrics-diario/index.ts`
- `supabase/functions/categorizar-despesa/index.ts`
- `supabase/functions/ci-security-gate-log/index.ts`
- `supabase/functions/cnpja-lookup/index.ts`
- `supabase/functions/comparar-benchmark-setorial/index.ts`
- `supabase/functions/compare-schemas/index.ts`
- `supabase/functions/conciliacao-ia/index.ts`
- `supabase/functions/conciliacao-proxy/index.ts`
- `supabase/functions/contabilizar-evento/index.test.ts`
- `supabase/functions/contabilizar-evento/index.ts`
- `supabase/functions/convidar-contador/index.ts`
- `supabase/functions/copilot-global/index.ts`
- `supabase/functions/copilot-tributario/index.ts`
- `supabase/functions/decidir-regime/index.ts`
- `supabase/functions/detectar-anomalias-financeiras/index.ts`
- `supabase/functions/digest-silenciamentos-erro/index.ts`
- `supabase/functions/enviar-alerta-email/index.test.ts`
- `supabase/functions/enviar-alerta-email/index.ts`
- `supabase/functions/enviar-convite-organizacao/index.ts`
- `supabase/functions/enviar-digest-conformidade/index.ts`
- `supabase/functions/enviar-relatorios-tributarios-agendados/index.ts`
- `supabase/functions/executar-analise-preditiva/index.test.ts`
- `supabase/functions/executar-analise-preditiva/index.ts`
- `supabase/functions/executar-fechamento-tributario/index.ts`
- `supabase/functions/executar-regua-cobranca/index.ts`
- `supabase/functions/executar-relatorios/index.ts`
- `supabase/functions/expert-agent/index.ts`
- `supabase/functions/exportar-sped-contribuicoes/index.ts`
- `supabase/functions/external-data/index.ts`
- `supabase/functions/gerar-acoes-recomendadas/index.ts`
- `supabase/functions/gerar-alertas-tributarios/index.test.ts`
- `supabase/functions/gerar-alertas-tributarios/index.ts`
- `supabase/functions/gerar-alertas/index.ts`
- `supabase/functions/gerar-dre-tributaria/index.ts`
- `supabase/functions/gerar-heatmap-tributario/index.ts`
- `supabase/functions/gerar-pacote-evidencias/index.ts`
- `supabase/functions/gerar-pdf-tributario/index.ts`
- `supabase/functions/gerar-relatorio-anual/index.ts`
- `supabase/functions/gerar-resumo-executivo-semanal/index.ts`
- `supabase/functions/gerar-resumo-financeiro-diario/index.ts`
- `supabase/functions/gerar-snapshots-conformidade/index.ts`
- `supabase/functions/gerar-sped-ecd/index.ts`
- `supabase/functions/gerar-sped-ecf/index.ts`
- `supabase/functions/health/index.ts`
- `supabase/functions/insights-relatorio/index.ts`
- `supabase/functions/log-sped-bitrix24/index.ts`
- `supabase/functions/mcp-query/index.ts`
- `supabase/functions/monitor-health/index.ts`
- `supabase/functions/monitorar-erros-frontend/index.ts`
- `supabase/functions/n8n-callback/index.ts`
- `supabase/functions/n8n-dispatch/index.ts`
- `supabase/functions/nfe-upload-certificado/index.ts`
- `supabase/functions/nfe-vinculo-proxy/index.ts`
- `supabase/functions/notify-performance-alert/index.test.ts`
- `supabase/functions/notify-performance-alert/index.ts`
- `supabase/functions/notify-saved-filter/index.ts`
- `supabase/functions/open-finance/index.ts`
- `supabase/functions/overlay-rejeicoes-auditoria/index.ts`
- `supabase/functions/prever-carga-tributaria/index.ts`
- `supabase/functions/processar-nf-ocr/index.ts`
- `supabase/functions/processar-solicitacao-lgpd/index.ts`
- `supabase/functions/relatorio-diario-anomalias/index.ts`
- `supabase/functions/scim-server/index.ts`
- `supabase/functions/sefaz-dfe-dispatcher/index.ts`
- `supabase/functions/send-push-notification/index.test.ts`
- `supabase/functions/send-push-notification/index.ts`
- `supabase/functions/sincronizar-anomalia-bitrix24/index.ts`
- `supabase/functions/sso-callback/index.ts`
- `supabase/functions/sso-initiate/index.ts`
- `supabase/functions/sso-logout/index.ts`
- `supabase/functions/sso-test-login/index.ts`
- `supabase/functions/stress_test.ts`
- `supabase/functions/sync-profile-to-bitrix/index.ts`
- … +211 (lista completa em `context.json`)

## Funções SQL `SECURITY DEFINER` (rodam com privilégio do dono, ignoram RLS)

- `atribui_empresa_do_anexo`
- `audit_trigger_function`
- `audit_trigger_generic`
- `auditar_acessos_cross_tenant`
- `auto_vincular_empresa_padrao`
- `backfill_empresa_id`
- `can_access_saved_filter`
- `capture_index_usage_snapshot`
- `capture_pg_stat_statements_baseline`
- `capture_slow_queries`
- `certificado_get_password`
- `certificado_upsert`
- `chave_anon_vault`
- `check_asaas_queue_failures`
- `check_catalogos_tributarios_invariants`
- `check_integrity_invariants`
- `check_login_lockout`
- `check_login_lockout_v2`
- `check_nfe_xml_path_invariants`
- `claim_frontend_error_alerts`
- `claim_silenciamentos_digest`
- `cleanup_log_tables`
- `cleanup_pgss_baseline`
- `cleanup_rpc_observability_metrics`
- `clear_login_attempts`
- `close_stale_integrity_alerts`
- `cnpja_check_rate_limit`
- `compare_pg_stat_baseline`
- `confirmar_conciliacao_manual`
- `confirmar_envio_cobranca`
- `contabilizar_movimentacao`
- `contabilizar_movimentacao_registro`
- `definir_empresa_padrao`
- `delete_cron_job`
- `desfazer_conciliacao`
- `desfazer_conciliacao_manual`
- `detect_query_regressions`
- `detectar_duplicidades_financeiras`
- `drop_old_partitions`
- `empresa_acessivel`
- `empresa_da_entidade_financeira`
- `empresa_do_anexo_financeiro`
- `empresa_membro_ativo`
- `empresa_padrao_id`
- `empresas_unica_padrao`
- `enqueue_webhook_retry`
- `ensure_monthly_partitions`
- `escalate_stale_integrity_alerts`
- `export_asaas_audit_csv`
- `fn_atualizar_saldo_movimentacao`
- `fn_audit_sso_changes`
- `fn_audit_tributario`
- `fn_auditoria_financeira`
- `fn_invalidar_regime_cache`
- `fn_lanc_numero_sequencial`
- `fn_notificar_alerta_critico_push`
- `fn_notificar_filtro_compartilhado`
- `fn_revoke_orphan_saved_filter_subscriptions`
- `fn_sync_valor_cp`
- `fn_sync_valor_cr`
- `fn_sync_valor_pago_movimentacao`
- `fn_transferencia_movimentacao`
- `fn_verificar_vencidos`
- `frontend_error_logs_sanitize`
- `gate_25_policies_sem_tenant`
- `gate_27_secdef_sem_search_path`
- `gate_29_rpc_sem_escopo_empresa`
- `gate_30_views_inseguras`
- `gate_31_tenant_sem_indice`
- `gate_32_pii_sem_mascara`
- `gate_33_indices_redundantes`
- `gate_34_indices_nao_utilizados`
- `gate_35_tabelas_sem_retencao`
- `generate_reconciliation_suggestions`
- `gerar_alerta_falha_processamento`
- `gerar_alerta_falha_regua`
- `gerar_alertas_pendencias_conciliacao`
- `gerar_alertas_vencimento`
- `get_acessos_suspeitos`
- `get_active_uapi_token`
- `get_asaas_payment_stats`
- `get_bloat_history`
- `get_bloat_snapshots`
- `get_catalogos_tributarios_health`
- `get_catalogos_tributarios_history`
- `get_cobertura_fiscal_uf`
- `get_cron_jobs`
- `get_cron_run_history`
- `get_frontend_error_groups`
- `get_frontend_error_occurrences`
- `get_integrity_alerts`
- `get_lockout_details`
- `get_performance_alerts`
- `get_performance_alerts_weekly`
- `get_retencao_politicas_status`
- `get_retencoes_pendentes_count`
- `get_retention_history`
- `get_silenciamentos_expirando`
- `get_table_bloat`
- `get_ultima_carga_fiscal`
- `get_user_permissions`
- `get_user_role`
- `get_user_roles`
- `get_webauthn_credential_by_email`
- `handle_asaas_payment_settlement`
- `handle_conciliacao_retroativa_error`
- `handle_new_user`
- `has_any_role`
- `has_permission`
- `has_role`
- `has_role_in_empresa`
- `increment_failed_attempts`
- `internal_job_secret`
- `invocar_digest_conformidade`
- `invocar_digest_silenciamentos`
- `invocar_regua_cobranca`
- `is_country_allowed_for_login`
- `is_country_blocked`
- `is_ip_allowed_for_login`
- `is_ip_blocked`
- `is_ip_whitelisted`
- `is_known_device`
- `is_org_membro`
- `is_org_responsavel`
- `is_token_valid`
- `is_user_locked`
- `lancamento_contabil_before_insert`
- `log_audit`
- `log_etapa_cobranca_change`
- `log_rpc_observability_call`
- `log_sso_onboarding_event`
- `maintain_monthly_partitions`
- `monitor_table_bloat`
- `nfe_apply_manifestacao`
- `nfe_create_conta_pagar_from_nfe`
- `nfe_link_conta_pagar`
- `nfe_suggest_contas_pagar`
- `nfe_unlink_conta_pagar`
- `notificar_bloqueio_duplicidade`
- `notify_performance_alert_trigger`
- `pode_ver_dado_sensivel`
- `processar_fila_cobrancas`
- `processar_regua_cobranca`
- `profile_sensitive_fields_unchanged`
- `provisionar_usuario`
- `provisionar_usuario_atual`
- `purge_old_rows`
- `rate_limit_check`
- `recarregar_seeds_fiscais`
- `record_failed_login`
- `record_failed_login_v2`
- `refresh_performance_alerts_weekly`
- `registrar_auditoria_config`
- `registrar_evento_cobranca`
- `registrar_evento_pagar`
- `registrar_evento_receber`
- `registrar_tentativa_sso`
- `reprocess_dlq`
- `reset_failed_attempts`
- `resolve_integrity_alert`
- `resolve_sso_providers_for_domain`
- `run_integrity_cycle`
- `run_observability_rpc`
- `sefaz_cursor_advance`
- `sefaz_detect_nsu_gaps`
- `sefaz_detect_stuck_cursors`
- `sefaz_process_batch`
- `sefaz_run_observability_checks`
- `segredo_cron`
- `set_empresa_id_default`
- `set_empresa_id_from_profile`
- `silenciar_alerta_erro_frontend`
- `sincroniza_empresa_dos_anexos`
- `snapshot_table_bloat`
- `sync_regime_tributario_empresa`
- `toggle_cron_job`
- `trigger_bitrix24_sync`
- `trigger_log_receber_status_change`
- `trigger_whatsapp_ai_analysis`
- `use_reset_token`
- `user_role_in_empresa`
- `validar_duplicidade_avancada`
- `validar_duplicidade_financeira`
- `webhook_claim`
- `webhook_dequeue_retries`
- `webhook_mark_failure`
- `webhook_mark_success`
- `webhook_replay`

## Edge functions públicas (sem JWT — qualquer um chama)

- `executar-relatorios`
- `executar-regua-cobranca`
- `bitrix24-sync`
- `bitrix24-webhook`
- `gerar-alertas`
- `expert-agent`
- `send-push-notification`
- `executar-analise-preditiva`
- `analyze-document`
- `open-finance`
- `categorizar-despesa`
- `enviar-alerta-email`
- `analise-fluxo-ia`
- `ci-security-gate-log`
- `send-device-alert`
- `get-vapid-key`
- `whatsapp-ia-proativo`
- `asaas-proxy`
- `asaas-webhook`
- `bling-proxy`
- `bling-webhook`
- `external-data`
- `n8n-callback`
- `compare-schemas`
- `insights-relatorio`
- `benchmarking-setorial`
- `gerar-alertas-tributarios`
- `gerar-pdf-tributario`
- `enviar-bitrix24-tributario`
- `decidir-regime`
- `cnpja-lookup`
- `validar-token-contador`
- `sso-initiate`
- `sso-callback`
- `sso-logout`
- `scim-server`
- `validate-ip-geo`
- `sefaz-dfe-dispatcher`
- `notify-performance-alert`
- `sefaz-dfe-puxar`
- `convidar-usuario`
- `digest-silenciamentos-erro`
- `gerar-alertas-dispatcher`
- `gerar-dre-tributaria`
- `gerar-heatmap-tributario`
- `api-keys-manage`
- `health`
- `mcp-query`
- `monitorar-erros-frontend`
- `overlay-rejeicoes-auditoria`
- `prever-carga-tributaria`
- `webhook-replay`
- `webhook-retry-worker`
- `whatsapp-ai-analyzer`
- `whatsapp-webhook`
- `monitor-health`

## Rotas protegidas no front

| Rota | Guard | Roles | Arquivo |
|---|---|---|---|
| / | ProtectedRoute |  | `scripts/inventario/inventario.unit.mjs` |
| / | ProtectedRoute |  | `src/routes/analiseRoutes.tsx` |
| /admin/api | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/auditoria-ia | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/bloat-monitor | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/campos-customizados | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/compliance | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/edge-health | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/erros-frontend | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/filtros-compartilhados | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/insights-ia | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/insights-ia/anomalia/:id | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/scim-audit | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/sre | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/sso | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/sso-events | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/sso-jit-events | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/system-health | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin/telemetria | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /admin2 | RequireAuth |  | `scripts/ai-context/cenarios.mjs` |
| /alertas | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /app | ProtectedRoute |  | `scripts/ai-context/gerar.unit.mjs` |
| /aprovacoes | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /asaas | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /assinatura-digital | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /audit-logs | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /audit-sso-profile-sync | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /benchmarking | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /bi | ProtectedRoute |  | `src/routes/analiseRoutes.tsx` |
| /bitrix24 | ProtectedRoute |  | `src/routes/analiseRoutes.tsx` |
| /bling | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /boletos | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /categorias | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /centro-custos | ProtectedRoute |  | `src/routes/contabilRoutes.tsx` |
| /clientes | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /clientes/portal-tokens | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /clientes/scoring | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /cobrancas | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /compras | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /comprovante-ocr | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /conciliacao | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /configuracoes | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /configuracoes/filtros-salvos | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /configuracoes/notificacoes/historico | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /configuracoes/notificacoes/sino | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /configuracoes/preferencias | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /configuracoes/privacidade | ProtectedRoute |  | `src/routes/contabilRoutes.tsx` |
| /contabilidade | ProtectedRoute |  | `src/routes/contabilRoutes.tsx` |
| /contas | ProtectedRoute |  | `scripts/inventario/inventario.unit.mjs` |
| /contas-bancarias | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /contas-pagar | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /contas-pagar/bloqueios | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /contas-receber | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /contratos | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /dashboard | ProtectedRoute |  | `src/routes/analiseRoutes.tsx` |
| /dashboard-empresa | ProtectedRoute |  | `src/routes/analiseRoutes.tsx` |
| /dashboard-receber | ProtectedRoute |  | `src/routes/contabilRoutes.tsx` |
| /demonstrativos | ProtectedRoute |  | `src/routes/contabilRoutes.tsx` |
| /empresas | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /expert | ProtectedRoute |  | `src/routes/analiseRoutes.tsx` |
| /financeiro | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /fluxo-caixa | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /fornecedores | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /integracoes | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /inteligencia | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /itens/:id | ProtectedRoute |  | `scripts/ai-context/gerar.unit.mjs` |
| /metas | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /meu-perfil | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /movimentacoes | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /notas-fiscais | ProtectedRoute |  | `src/routes/fiscalRoutes.tsx` |
| /orcamento-evento | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /orcamentos | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /organizacoes | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /p | RequireAuth |  | `scripts/ai-context/cenarios.mjs` |
| /pagamentos-recorrentes | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /pai | ProtectedRoute |  | `scripts/inventario/inventario.unit.mjs` |
| /painel | ProtectedRoute |  | `scripts/ai-context/gerar.unit.mjs` |
| /pix-hub | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /reforma | ProtectedRoute |  | `scripts/inventario/inventario.unit.mjs` |
| /reforma-tributaria | ProtectedRoute |  | `src/routes/reformaTributariaRoutes.tsx` |
| /reforma-tributaria/:tab | ProtectedRoute |  | `src/routes/reformaTributariaRoutes.tsx` |
| /reforma/:tab | ProtectedRoute |  | `scripts/inventario/inventario.unit.mjs` |
| /relatorios | ProtectedRoute |  | `src/routes/analiseRoutes.tsx` |
| /seguranca | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /simulador-antecipacao | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /style-guide | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |
| /tesouraria | ProtectedRoute |  | `src/routes/financeiroRoutes.tsx` |
| /tributario | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/arquitetura | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/auditoria | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/auditoria-overlay | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/calculadora | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/cashback | ProtectedRoute |  | `src/routes/reformaTributariaRoutes.tsx` |
| /tributario/catalogos-fiscais | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/certificados-digitais | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/comparativo | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/comparativo-conformidade | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/conciliacao | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/consulta-rapida | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/darf | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/dashboard | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/fechamento-mensal | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/folha-encargos | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/glossario | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/historico-financeiro | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/icms-st | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/importacao-xml | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/incentivos | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/ipi-iss | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/irpj-csll | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/monofasico | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/nfe-recebidas | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/obrigacoes | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/observabilidade-digest | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/onboarding | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/oportunidades-elisao | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/per-dcomp | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/pf-vinculada | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/pis-cofins | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/preferencias-digest | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/projecao-reforma | ProtectedRoute |  | `src/routes/reformaTributariaRoutes.tsx` |
| /tributario/recomendacao | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/relatorios-contabeis | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/retencoes | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/sefaz-observabilidade | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/simulacao-regimes | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/sped | ProtectedRoute |  | `src/routes/tributarioRoutes.tsx` |
| /tributario/split-payment | ProtectedRoute |  | `src/routes/reformaTributariaRoutes.tsx` |
| /usuarios | ProtectedRoute |  | `src/routes/adminRoutes.tsx` |
| /vendedores | ProtectedRoute |  | `src/routes/geralRoutes.tsx` |

Guards usados: Protected, ProtectedRoute, RequireAuth

Middleware matcher (Next.js): nenhum

## Grants / Revokes (agrupados por role e privilégio)

| Ação | Para/De | Privilégios | Objetos |
|---|---|---|---|
| grant | anon | execute | `increment_failed_attempts` |
| grant | anon | insert | `frontend_error_logs`, `frontend_error_logs` |
| grant | anon | select | `acessos_suspeitos` |
| grant | anon, authenticated | execute | `log_sso_onboarding_event`, `log_sso_onboarding_event`, `gerar_numero_acordo`, `resolve_sso_providers_for_domain`, `get_lockout_details`, `is_user_locked` |
| grant | anon, authenticated, service_role | execute | `resolve_sso_providers_for_domain`, `resolve_sso_providers_for_domain`, `resolve_sso_providers_for_domain` |
| grant | authenticated | all | `clientes`, `fornecedores`, `contas_pagar`, `contas_receber`, `categorias`, `user_preferences`, `public`, `public`, `public`, `anomalias_detectadas`, `anomalia_toast_eventos`, `centros_custo`, `contratos`, `metas_financeiras`, `partidas_contabeis` … +42 |
| grant | authenticated | execute | `registrar_evento_receber`, `processar_regua_cobranca`, `confirmar_envio_cobranca`, `gerar_numero_acordo`, `registrar_auditoria_config`, `get_user_roles`, `has_role`, `get_user_permissions`, `has_permission`, `reprocess_dlq`, `get_table_bloat`, `get_bloat_history`, `get_bloat_snapshots`, `get_performance_alerts`, `compare_pg_stat_baseline` … +27 |
| grant | authenticated | insert, update, delete | `ufs` |
| grant | authenticated | select | `vw_fluxo_caixa_diario`, `vw_metricas_cobranca`, `vw_saldos_contas`, `vw_webhooks_recentes`, `vw_contas_receber_painel`, `vw_contas_pagar_painel`, `slow_query_alerts`, `frontend_error_logs`, `bloat_snapshots`, `performance_alerts`, `pg_stat_statements_baseline`, `n8n_dispatch_logs`, `integrity_alerts`, `sefaz_dfe_cursor`, `nfe_eventos` … +47 |
| grant | authenticated | select, delete | `api_keys` |
| grant | authenticated | select, insert | `audit_log`, `audit_logs`, `bling_sync_logs`, `audit_logs`, `audit_logs` |
| grant | authenticated | select, insert, delete | `sso_sandbox_runs` |
| grant | authenticated | select, insert, update | `fechamentos_tributarios` |
| grant | authenticated | select, insert, update, delete | `user_empresas`, `scim_tokens`, `user_onboarding_progress`, `darfs`, `n8n_workflow_configs`, `empresas_certificados`, `plano_contas`, `lancamentos_contabeis`, `partidas_contabeis`, `entregas_obrigacoes`, `conformidade_snapshots`, `user_digest_preferences`, `aliquotas_interestaduais`, `aliquotas_internas_uf`, `cnaes` … +46 |
| grant | authenticated | select, update | `webhook_dlq`, `nfe_recebidas`, `convites_contador` |
| grant | authenticated | usage, select | `public` |
| grant | authenticated, anon | execute | `registrar_tentativa_sso` |
| grant | authenticated, anon | insert | `frontend_error_logs` |
| grant | authenticated, service_role | execute | `profile_sensitive_fields_unchanged`, `profile_sensitive_fields_unchanged`, `get_performance_alerts_weekly`, `get_asaas_payment_stats`, `export_asaas_audit_csv`, `registrar_evento_receber`, `registrar_evento_cobranca`, `nfe_suggest_contas_pagar`, `nfe_link_conta_pagar`, `nfe_unlink_conta_pagar`, `nfe_create_conta_pagar_from_nfe`, `log_rpc_observability_call`, `run_observability_rpc`, `webhook_replay`, `fn_norm_conta_codigo` … +41 |
| grant | authenticated, service_role | select | `v_sefaz_observability`, `vw_edge_health`, `vw_tributario_dashboard`, `vw_contas_receber_painel`, `vw_edge_health` |
| grant | postgres | all privileges | `cron` |
| grant | postgres, service_role | execute | `notify_performance_alert_trigger`, `internal_job_secret` |
| grant | public | execute | `is_ip_allowed_for_login`, `is_country_allowed_for_login` |
| grant | service_role | all | `user_empresas`, `scim_tokens`, `user_onboarding_progress`, `darfs`, `slow_query_alerts`, `webhook_dlq`, `audit_logs`, `frontend_error_logs`, `bloat_snapshots`, `performance_alerts`, `pg_stat_statements_baseline`, `n8n_workflow_configs`, `n8n_dispatch_logs`, `integrity_alerts`, `empresas_certificados` … +142 |
| grant | service_role | execute | `get_user_roles`, `has_role`, `get_user_permissions`, `has_permission`, `capture_slow_queries`, `enqueue_webhook_retry`, `cleanup_log_tables`, `ensure_monthly_partitions`, `maintain_monthly_partitions`, `monitor_table_bloat`, `snapshot_table_bloat`, `detect_query_regressions`, `capture_pg_stat_statements_baseline`, `check_integrity_invariants`, `certificado_upsert` … +81 |
| grant | service_role | select | `mv_benchmark_setorial`, `v_table_bloat`, `mv_performance_alerts_weekly`, `estrategias_elisao_catalogo`, `mv_benchmark_setorial`, `vw_edge_health`, `vw_transferencias_painel`, `vw_auditoria_tributaria_recente`, `vw_transferencias_painel`, `estrategias_elisao_catalogo`, `vw_webhooks_recentes` |
| grant | service_role | usage, select | `rpc_observability_metrics_id_seq` |
| grant | service_role, authenticated | execute | `sefaz_cursor_advance` |
| grant | service_role, postgres | execute | `refresh_performance_alerts_weekly` |
| revoke | PUBLIC | all | `resolve_sso_providers_for_domain`, `profile_sensitive_fields_unchanged`, `capture_slow_queries`, `enqueue_webhook_retry`, `reprocess_dlq`, `cleanup_log_tables`, `ensure_monthly_partitions`, `maintain_monthly_partitions`, `audit_trigger_generic`, `capture_pg_stat_statements_baseline`, `compare_pg_stat_baseline`, `check_nfe_xml_path_invariants`, `resolve_sso_providers_for_domain`, `calcular_potencial_elisao`, `gerar_contas_recorrentes` … +7 |
| revoke | PUBLIC | execute | `run_daily_cleanup`, `run_daily_cleanup_with_logging`, `cleanup_expired_tokens`, `cleanup_old_login_attempts`, `cleanup_old_cron_logs`, `get_cron_jobs`, `get_cron_run_history`, `get_cron_run_history`, `clear_login_attempts`, `reset_failed_attempts`, `increment_failed_attempts`, `registrar_auditoria_config`, `log_audit`, `export_asaas_audit_csv`, `confirmar_conciliacao_manual` … +6 |
| revoke | PUBLIC, anon | all | `get_table_bloat`, `get_bloat_history`, `get_bloat_snapshots`, `get_performance_alerts`, `get_performance_alerts_weekly`, `get_integrity_alerts`, `sefaz_cursor_advance`, `nfe_suggest_contas_pagar`, `nfe_link_conta_pagar`, `nfe_unlink_conta_pagar`, `nfe_create_conta_pagar_from_nfe`, `fn_balancete`, `fn_livro_razao`, `fn_norm_conta_codigo`, `fn_indices_contabeis` … +50 |
| revoke | PUBLIC, anon | execute | `registrar_evento_receber`, `get_asaas_payment_stats`, `export_asaas_audit_csv`, `registrar_evento_receber`, `registrar_evento_cobranca`, `capture_pg_stat_statements_baseline`, `capture_slow_queries`, `monitor_table_bloat`, `snapshot_table_bloat`, `refresh_performance_alerts_weekly`, `sefaz_run_observability_checks`, `log_rpc_observability_call`, `run_observability_rpc`, `cleanup_rpc_observability_metrics`, `webhook_replay` … +11 |
| revoke | PUBLIC, anon, authenticated | all | `v_table_bloat`, `monitor_table_bloat`, `snapshot_table_bloat`, `detect_query_regressions`, `notify_performance_alert_trigger`, `mv_performance_alerts_weekly`, `refresh_performance_alerts_weekly`, `check_integrity_invariants`, `certificado_upsert`, `certificado_get_password`, `sefaz_process_batch`, `nfe_apply_manifestacao`, `sefaz_detect_nsu_gaps`, `sefaz_detect_stuck_cursors`, `sefaz_run_observability_checks` … +53 |
| revoke | PUBLIC, anon, authenticated | execute | `webhook_claim`, `webhook_mark_success`, `webhook_mark_failure`, `webhook_dequeue_retries`, `nfe_suggest_contas_pagar`, `nfe_link_conta_pagar`, `nfe_unlink_conta_pagar`, `nfe_create_conta_pagar_from_nfe`, `confirmar_conciliacao_manual`, `desfazer_conciliacao_manual`, `generate_reconciliation_suggestions`, `lancamento_contabil_before_insert`, `lancamento_contabil_before_update`, `validar_partidas_dobradas`, `normalizar_tipo_partida` … +10 |
| revoke | anon | all | `catalogos_tributarios_health_history`, `cnpja_cache`, `overlay_rejeicoes_auditoria`, `is_org_membro`, `is_org_responsavel`, `public`, `public`, `public`, `refresh_mv_benchmark_setorial` |
| revoke | anon | execute | `run_daily_cleanup`, `run_daily_cleanup_with_logging`, `cleanup_expired_tokens`, `cleanup_old_login_attempts`, `cleanup_old_cron_logs`, `get_cron_jobs`, `get_cron_run_history`, `get_cron_run_history`, `clear_login_attempts`, `reset_failed_attempts`, `increment_failed_attempts`, `registrar_auditoria_config`, `log_audit`, `export_asaas_audit_csv`, `confirmar_conciliacao_manual` … +21 |
| revoke | anon | insert | `frontend_error_logs` |
| revoke | anon | insert, update, delete, truncate | `audit_logs` |
| revoke | anon, PUBLIC | execute | `reprocess_dlq`, `cleanup_pgss_baseline`, `compare_pg_stat_baseline` |
| revoke | anon, authenticated | all | `mv_benchmark_setorial`, `integration_secrets`, `mv_benchmark_setorial`, `sync_regime_tributario_empresa`, `pix_template_sync_legacy`, `bling_tokens`, `bitrix_oauth_tokens`, `frontend_error_alert_state`, `tax_audit_trail`, `regime_decision_cache` |
| revoke | anon, authenticated | execute | `capture_pg_stat_statements_baseline`, `detect_query_regressions`, `refresh_performance_alerts_weekly`, `capture_slow_queries`, `maintain_monthly_partitions`, `cleanup_old_cron_logs`, `cleanup_expired_tokens`, `cleanup_old_login_attempts`, `run_daily_cleanup`, `enqueue_webhook_retry`, `cleanup_pgss_baseline`, `check_nfe_xml_path_invariants`, `sync_regime_tributario_empresa` |
| revoke | anon, authenticated | insert | `frontend_error_logs` |
| revoke | anon, authenticated | insert, update, delete, truncate, references, trigger | `frontend_error_silence_digest_log` |
| revoke | anon, authenticated | update, delete, truncate | `frontend_error_logs` |
| revoke | anon, authenticated, PUBLIC | execute | `profile_sensitive_fields_unchanged`, `confirmar_envio_cobranca`, `audit_trigger_generic`, `has_permission`, `check_catalogos_tributarios_invariants`, `recarregar_seeds_fiscais`, `detectar_duplicidades_financeiras` |
| revoke | anon, public | execute | `profile_sensitive_fields_unchanged` |
| revoke | authenticated | all | `refresh_mv_benchmark_setorial` |
| revoke | authenticated | execute | `audit_trigger_generic`, `auto_vincular_empresa_padrao`, `backfill_empresa_id`, `capture_index_usage_snapshot`, `capture_pg_stat_statements_baseline`, `capture_slow_queries`, `check_catalogos_tributarios_invariants`, `check_integrity_invariants`, `check_nfe_xml_path_invariants`, `cleanup_log_tables`, `cleanup_pgss_baseline`, `cleanup_rpc_observability_metrics`, `clear_login_attempts`, `compare_pg_stat_baseline`, `confirmar_conciliacao` … +78 |
| revoke | authenticated | insert | `frontend_error_logs` |
| revoke | authenticated | select, insert, update, delete | `cnpja_cache` |
| revoke | authenticated | update | `elisao_creditos_auditoria`, `asaas_audit_trail` |
| revoke | authenticated | update, delete | `logs_baixa_automatica`, `logs_conciliacao_retroativa` |
| revoke | authenticated | update, delete, truncate | `audit_logs`, `audit_logs`, `frontend_error_logs` |
| revoke | authenticated, anon | execute | `rate_limit_check` |
| revoke | public | all | `registrar_tentativa_sso` |

## Riscos de acesso detectados

| Tabela | Problema | Arquivos |
|---|---|---|
| `operacoes_tributaveis` | front faz INSERT mas nenhuma política RLS permite INSERT → vai falhar/retornar vazio para usuários | `src/hooks/useOperacoesTributaveis.ts` |
| `operacoes_tributaveis` | front faz UPDATE mas nenhuma política RLS permite UPDATE → vai falhar/retornar vazio para usuários | `src/hooks/useOperacoesTributaveis.ts` |

## Multi-tenancy

- Chave de tenant: **`empresa_id`** presente em 131 tabela(s): `clientes`, `fornecedores`, `contas_pagar`, `contas_receber`, `categorias`, `saved_filters`, `profiles`, `contas_bancarias`, `centros_custo`, `notas_fiscais`, `alertas`, `configuracoes_aprovacao`, `relatorios_agendados`, `bitrix_sync_logs`, `bitrix_field_mappings`, `bitrix_oauth_tokens`, `boletos`, `historico_cobranca`, `expert_conversations`, `metas_financeiras`, `historico_analises_preditivas`, `historico_score_saude`, `alertas_preditivos`, `recomendacoes_metas_ia`, `pagamentos_recorrentes`, `regua_cobranca`, `historico_cobranca_whatsapp`, `acordos_parcelamento`, `vendedores`, `security_alerts`, `apuracoes_tributarias`, `creditos_tributarios`, `operacoes_tributaveis`, `split_payment_transacoes`, `regimes_especiais_empresa`, `apuracoes_irpj_csll`, `prejuizos_fiscais`, `incentivos_fiscais`, `retencoes_fonte`, `darfs`, `alertas_tributarios`, `per_dcomp`, `regras_conciliacao`, `asaas_customers`, `asaas_payments`, `bling_tokens`, `bling_sync_logs`, `bling_webhook_events`, `plano_contas`, `formas_pagamento`, `movimentacoes`, `transferencias`, `conciliacoes`, `anexos_financeiros`, `auditoria_financeira`, `templates_cobranca`, `fila_cobrancas`, `execucoes_cobranca`, `negativacoes`, `protestos`, `pix_templates`, `query_telemetry`, `faturamento_mensal`, `folha_pagamento`, `regimes_simulados`, `convites_contador`, `regime_decision_cache`, `relatorios_tributarios_agendados`, `verificacoes_conformidade`, `auditoria_tributaria`, `fechamentos_tributarios`, `notas_fiscais_ocr`, `resumos_executivos_semanais`, `solicitacoes_lgpd`, `health_scores_operacionais`, `anomalias_detectadas`, `acoes_recomendadas`, `sso_providers`, `sso_login_attempts`, `sso_role_mappings`, `lancamentos_contabeis`, `partidas_contabeis`, `sped_contabil_arquivos`, `user_empresas`, `scim_tokens`, `scim_operations_log`, `execucoes_regua_cobranca`, `user_filter_presets`, `logs_conciliacao_retroativa`, `divergencias_conciliacao`, `regras_contabilizacao_automatica`, `eventos_contabilizacao_log`, `elisao_simulacoes_regime`, `elisao_creditos_auditoria`, `elisao_tarefas_acionaveis`, `elisao_alertas`, `regua_cobranca_status`, `asaas_config`, `asaas_transfers`, `asaas_reconciliation_suggestions`, `bloqueios_duplicidade`, `configuracoes_duplicidade`, `regras_roteamento_financeiro`, `api_keys`, `kpis_operacionais`, `pedidos_compra`, `whatsapp_conversas`, `fluxos_aprovacao_niveis`, `tax_audit_trail`, `sessoes_conciliacao`, `contratos`, `regimes_tributarios`, `custom_field_definitions`, `regras_duplicidade`, `alerts`, `alert_configurations`, `empresas_certificados`, `nfe_recebidas`, `entregas_obrigacoes`, `conformidade_snapshots`, `integration_secrets`, `overlay_rejeicoes_auditoria`, `simulacoes`, `simulacao_tributos_detalhados`, `operacoes_icms`, `projecoes_reforma`, `oportunidades_elisao`, `risk_rules`, `acessos_suspeitos`, `bitrix24_stage_mappings`, `asaas_payment_links`
- Cobertura: 49% das tabelas. Abaixo de 60% — isolamento provavelmente por usuário (auth.uid()) ou misto; não flagado por tabela.

## Soft delete (registros 'apagados' continuam na tabela — filtre!)

| Tabela | Coluna |
|---|---|
| `clientes` | `ativo` |
| `fornecedores` | `ativo` |
| `contas_pagar` | `deleted_at` |
| `contas_receber` | `deleted_at` |
| `categorias` | `ativo` |
| `user_roles` | `is_active` |
| `empresas` | `ativo` |
| `contas_bancarias` | `ativo` |
| `centros_custo` | `ativo` |
| `transacoes_bancarias` | `deleted_at` |
| `configuracoes_aprovacao` | `ativo` |
| `relatorios_agendados` | `ativo` |
| `bitrix_field_mappings` | `ativo` |
| `push_subscriptions` | `ativo` |
| `metas_financeiras` | `ativo` |
| `portal_cliente_tokens` | `ativo` |
| `pagamentos_recorrentes` | `ativo` |
| `regua_cobranca` | `ativo` |
| `vendedores` | `ativo` |
| `allowed_ips` | `ativo` |
| `permissions` | `ativo` |
| `allowed_countries` | `ativo` |
| `regimes_especiais_empresa` | `ativo` |
| `incentivos_fiscais` | `ativo` |
| `regras_conciliacao` | `ativo` |
| `plano_contas` | `ativo` |
| `movimentacoes` | `deleted_at` |
| `templates_cobranca` | `ativo` |
| `pix_templates` | `ativo` |
| `relatorios_tributarios_agendados` | `ativo` |
| `sso_providers` | `ativo` |
| `user_empresas` | `ativo` |
| `scim_tokens` | `ativo` |
| `saved_filter_subscriptions` | `ativo` |
| `regras_contabilizacao_automatica` | `ativo` |
| `elisao_regras_creditos` | `ativo` |
| `asaas_config` | `ativo` |
| `configuracoes_duplicidade` | `ativo` |
| `regras_roteamento_financeiro` | `ativo` |
| `api_keys` | `ativo` |
| `glossario_tributario` | `ativo` |
| `regua_cobranca_etapas` | `ativo` |
| `regimes_tributarios` | `ativo` |
| `custom_field_definitions` | `active` |
| `ip_whitelist` | `is_active` |
| `cron.job` | `active` |
| `empresas_certificados` | `ativo` |
| `user_digest_preferences` | `ativo` |
| `estrategias_elisao` | `ativo` |
| `organizacoes` | `ativo` |
| `organizacao_membros` | `ativo` |
| `risk_rules` | `is_active` |
| `retencao_politicas` | `ativo` |
| `estrategias_elisao_catalogo` | `ativo` |

## Auditoria (colunas de rastreio)

| Tabela | Colunas |
|---|---|
| `clientes` | `created_at`, `updated_at` |
| `fornecedores` | `created_at`, `updated_at` |
| `contas_pagar` | `created_at`, `updated_at` |
| `contas_receber` | `created_at`, `updated_at` |
| `categorias` | `created_at`, `updated_at` |
| `saved_filters` | `created_at`, `created_by`, `updated_at` |
| `profiles` | `created_at`, `updated_at` |
| `user_roles` | `created_at`, `updated_at` |
| `empresas` | `created_at` |
| `contas_bancarias` | `created_at`, `updated_at` |
| `centros_custo` | `created_at`, `updated_at` |
| `transacoes_bancarias` | `created_at` |
| `notas_fiscais` | `created_at` |
| `alertas` | `created_at` |
| `configuracoes_aprovacao` | `created_at`, `updated_at` |
| `solicitacoes_aprovacao` | `created_at` |
| `relatorios_agendados` | `created_at`, `created_by`, `updated_at` |
| `bitrix_sync_logs` | `created_at` |
| `bitrix_field_mappings` | `created_at` |
| `bitrix_oauth_tokens` | `created_at`, `updated_at` |
| `boletos` | `created_at`, `created_by`, `updated_at` |
| `historico_cobranca` | `created_at` |
| `push_subscriptions` | `created_at`, `updated_at` |
| `expert_conversations` | `created_at`, `updated_at` |
| `expert_messages` | `created_at` |
| `historico_conciliacao_ia` | `created_at`, `created_by` |
| `feedback_conciliacao_ia` | `created_at`, `created_by` |
| `metas_financeiras` | `created_at`, `created_by`, `updated_at` |
| `historico_analises_preditivas` | `created_at` |
| `historico_score_saude` | `created_at` |
| `alertas_preditivos` | `created_at`, `updated_at` |
| `recomendacoes_metas_ia` | `created_at` |
| `bitrix_webhook_events` | `created_at` |
| `open_finance_consents` | `created_at`, `updated_at` |
| `portal_cliente_tokens` | `created_at`, `updated_at` |
| `portal_cliente_acessos` | `created_at` |
| `pagamentos_recorrentes` | `created_at`, `created_by`, `updated_at` |
| `regua_cobranca` | `created_at`, `updated_at` |
| `historico_cobranca_whatsapp` | `created_at`, `created_by` |
| `acordos_parcelamento` | `created_at`, `created_by`, `updated_at` |
| `parcelas_acordo` | `created_at` |
| `vendedores` | `created_at`, `updated_at` |
| `password_reset_requests` | `created_at` |
| `allowed_ips` | `created_at`, `created_by` |
| `security_settings` | `created_at`, `updated_at`, `updated_by` |
| `login_attempts` | `created_at` |
| `user_sessions` | `created_at` |
| `rate_limit_logs` | `created_at` |
| `blocked_ips` | `created_at` |
| `permissions` | `created_at` |
| `role_permissions` | `created_at` |
| `security_alerts` | `created_at` |
| `new_device_alerts` | `created_at` |
| `webauthn_credentials` | `created_at` |
| `allowed_countries` | `created_at` |
| `apuracoes_tributarias` | `created_at`, `created_by`, `updated_at` |
| `creditos_tributarios` | `created_at` |
| `operacoes_tributaveis` | `created_at`, `updated_at` |
| `split_payment_transacoes` | `created_at`, `updated_at` |
| `regimes_especiais_empresa` | `created_at` |
| `apuracoes_irpj_csll` | `created_at`, `created_by`, `updated_at` |
| `prejuizos_fiscais` | `created_at`, `created_by` |
| `incentivos_fiscais` | `created_at`, `created_by`, `updated_at` |
| `retencoes_fonte` | `created_at` |
| `darfs` | `created_at`, `updated_at` |
| `alertas_tributarios` | `created_at` |
| `per_dcomp` | `created_at`, `created_by`, `updated_at` |
| `regras_conciliacao` | `created_at`, `created_by` |
| `conciliacoes_parciais` | `created_at`, `created_by` |
| `asaas_customers` | `created_at`, `updated_at` |
| `asaas_payments` | `created_at`, `updated_at` |
| `bling_tokens` | `created_at`, `created_by`, `updated_at` |
| `bling_sync_logs` | `created_at`, `created_by` |
| `bling_webhook_events` | `created_at` |
| `plano_contas` | `created_at`, `updated_at` |
| `formas_pagamento` | `created_at` |
| `movimentacoes` | `created_at`, `created_by` |
| `transferencias` | `created_at` |
| `extrato_bancario` | `created_at` |
| `conciliacoes` | `created_at` |
| `anexos_financeiros` | `created_at` |
| `auditoria_financeira` | `created_at` |
| `webhooks_log` | `created_at` |
| `templates_cobranca` | `created_at`, `updated_at` |
| `fila_cobrancas` | `created_at`, `updated_at` |
| `execucoes_cobranca` | `created_at` |
| `negativacoes` | `created_at`, `created_by` |
| `protestos` | `created_at`, `created_by` |
| `pix_templates` | `created_at`, `created_by`, `updated_at` |
| `query_telemetry` | `created_at` |
| `faturamento_mensal` | `created_at`, `created_by` |
| `folha_pagamento` | `created_at`, `created_by` |
| `regimes_simulados` | `created_by`, `updated_at` |
| `benchmarks_setoriais` | `created_at`, `updated_at` |
| `edge_function_logs` | `created_at` |
| `cnpja_cache` | `created_at`, `updated_at` |
| `convites_contador` | `created_at`, `created_by`, `updated_at` |
| `regime_decision_cache` | `created_at`, `updated_at` |
| `relatorios_tributarios_agendados` | `created_at`, `created_by`, `updated_at` |
| `verificacoes_conformidade` | `created_at` |
| `auditoria_tributaria` | `created_at`, `created_by`, `criado_em`, `updated_at` |
| `fechamentos_tributarios` | `created_at`, `created_by`, `updated_at` |
| `notas_fiscais_ocr` | `created_at`, `updated_at` |
| `resumos_executivos_semanais` | `created_at` |
| `solicitacoes_lgpd` | `created_at`, `updated_at` |
| `health_scores_operacionais` | `created_at` |
| `anomalias_detectadas` | `created_at`, `updated_at` |
| `acoes_recomendadas` | `created_at` |
| `user_onboarding_progress` | `created_at`, `updated_at` |
| `slo_metrics_diarias` | `created_at` |
| `sso_providers` | `created_at`, `created_by`, `updated_at` |
| `sso_login_attempts` | `created_at` |
| `sso_role_mappings` | `created_at`, `updated_at` |
| `evidencias_pacotes` | `created_at` |
| `lancamentos_contabeis` | `created_at`, `created_by`, `updated_at` |
| `partidas_contabeis` | `created_at` |
| `sped_contabil_arquivos` | `created_at`, `updated_at` |
| `user_empresas` | `created_at`, `updated_at` |
| `scim_tokens` | `created_at`, `created_by` |
| `scim_operations_log` | `created_at` |
| `user_anomalia_preferences` | `created_at`, `updated_at` |
| `sso_sandbox_runs` | `created_at`, `created_by` |
| `saved_filter_subscriptions` | `created_at`, `updated_at` |
| `anomalia_detection_runs` | `created_at` |
| `user_active_filters` | `created_at`, `updated_at` |
| `scim_setup_checklist` | `created_at`, `updated_at` |
| `sso_user_groups` | `created_at`, `updated_at` |
| `notification_history` | `created_at` |
| `user_demonstrativo_preferences` | `created_at`, `updated_at` |
| `execucoes_regua_cobranca` | `created_at` |
| `logs_baixa_automatica` | `created_at` |
| `user_filter_presets` | `created_at`, `updated_at` |
| `user_action_audit` | `created_at` |
| `logs_conciliacao_retroativa` | `created_at`, `updated_at` |
| `divergencias_conciliacao` | `created_at` |
| `regras_contabilizacao_automatica` | `created_at`, `created_by`, `updated_at` |
| `eventos_contabilizacao_log` | `created_at` |
| `elisao_simulacoes_regime` | `created_at`, `created_by`, `updated_at` |
| `elisao_regras_creditos` | `created_at`, `updated_at` |
| `elisao_creditos_auditoria` | `created_at`, `updated_at` |
| `elisao_tarefas_acionaveis` | `created_at`, `updated_at` |
| `elisao_alertas` | `created_at`, `updated_at` |
| `regua_cobranca_status` | `created_at`, `updated_at` |
| `asaas_sync_queue` | `created_at`, `updated_at` |
| `asaas_audit_trail` | `created_at` |
| `asaas_config` | `created_at`, `updated_at` |
| `asaas_transfers` | `created_at`, `updated_at` |
| `asaas_reconciliation_suggestions` | `created_at`, `updated_at` |
| `asaas_credit_risk_analysis` | `created_at` |
| `bloqueios_duplicidade` | `created_at` |
| `configuracoes_duplicidade` | `created_at`, `criado_por` |
| `regras_roteamento_financeiro` | `created_at`, `updated_at` |
| `historico_cobrancas_boletos` | `created_at` |
| `budgets` | `created_at`, `updated_at` |
| `api_keys` | `created_at`, `created_by`, `updated_at` |
| `planos_acao` | `created_at`, `updated_at` |
| `kpis_operacionais` | `created_at`, `updated_at` |
| `pedidos_compra` | `created_at` |
| `itens_pedido_compra` | `created_at` |
| `whatsapp_conversas` | `created_at` |
| `fluxos_aprovacao_niveis` | `created_at` |
| `aprovacao_comentarios` | `created_at` |
| `glossario_tributario` | `created_at`, `updated_at` |
| `tax_audit_trail` | `created_at` |
| `regua_cobranca_etapas` | `created_at` |
| `sessoes_conciliacao` | `created_at` |
| `contratos` | `created_at`, `created_by` |
| `regimes_tributarios` | `created_at` |
| `custom_field_definitions` | `created_at`, `updated_at` |
| `custom_field_values` | `created_at`, `updated_at` |
| `security_audit_logs` | `created_at` |
| `regras_duplicidade` | `created_at` |
| `webhook_simulation_runs` | `created_at`, `created_by` |
| `webhook_simulation_results` | `created_at` |
| `frontend_performance_logs` | `created_at` |
| `auth_logs` | `created_at` |
| `slow_query_alerts` | `created_at` |
| `webhook_dlq` | `created_at`, `updated_at` |
| `audit_logs` | `created_at` |
| `frontend_error_logs` | `created_at` |
| `ip_whitelist` | `created_at`, `updated_at` |
| `password_reset_tokens` | `created_at` |
| `runtime_error_logs` | `created_at` |
| `bloat_snapshots` | `created_at` |
| `performance_alerts` | `created_at` |
| `pg_stat_statements_baseline` | `created_at` |
| `alerts` | `created_at` |
| `alert_configurations` | `created_at`, `created_by`, `updated_at` |
| `n8n_workflow_configs` | `created_at`, `created_by`, `updated_at` |
| `n8n_dispatch_logs` | `created_at` |
| `integrity_alerts` | `created_at`, `updated_at` |
| `empresas_certificados` | `created_at`, `criado_por`, `updated_at` |
| `sefaz_dfe_cursor` | `created_at`, `updated_at` |
| `nfe_recebidas` | `created_at`, `updated_at` |
| `nfe_eventos` | `created_at`, `created_by` |
| `ci_security_gate_events` | `created_at` |
| `entregas_obrigacoes` | `created_at`, `updated_at` |
| `conformidade_snapshots` | `created_at`, `updated_at` |
| `integration_secrets` | `created_at`, `updated_at` |
| `user_digest_preferences` | `created_at`, `updated_at` |
| `digest_envios_log` | `created_at` |
| `ufs` | `created_at`, `updated_at` |
| `aliquotas_interestaduais` | `created_at`, `updated_at` |
| `aliquotas_internas_uf` | `created_at`, `updated_at` |
| `cnaes` | `created_at`, `updated_at` |
| `ncms` | `created_at`, `updated_at` |
| `itens_lista_iss` | `created_at`, `updated_at` |
| `aliquotas_iss_municipal` | `created_at`, `updated_at` |
| `faixas_simples_nacional` | `created_at`, `updated_at` |
| `protocolos_st` | `created_at`, `updated_at` |
| `protocolos_st_ufs` | `created_at`, `updated_at` |
| `protocolos_st_ncms` | `created_at`, `updated_at` |
| `beneficios_fiscais` | `created_at`, `updated_at` |
| `estrategias_elisao` | `created_at`, `updated_at` |
| `overlay_rejeicoes_auditoria` | `created_at`, `updated_at` |
| `organizacoes` | `created_at`, `updated_at` |
| `organizacao_membros` | `created_at`, `updated_at` |
| `convites` | `created_at` |
| `catalogos_tributarios_health_history` | `created_at`, `updated_at` |
| `catalogos_fiscais_cargas` | `created_at`, `updated_at` |
| `simulacoes` | `created_at`, `created_by`, `updated_at` |
| `simulacao_tributos_detalhados` | `created_at` |
| `operacoes_icms` | `created_at`, `updated_at` |
| `projecoes_reforma` | `created_at`, `updated_at` |
| `oportunidades_elisao` | `created_at`, `created_by`, `updated_at` |
| `frontend_error_alert_state` | `created_at`, `updated_at` |
| `frontend_error_silence_digest_log` | `created_at` |
| `risk_rules` | `created_at`, `updated_at` |
| `acessos_suspeitos` | `created_at` |
| `index_usage_snapshots` | `created_at` |
| `indices_uso_excecoes` | `created_at`, `criado_por` |
| `retencao_politicas` | `created_at`, `updated_at` |
| `bitrix24_stage_mappings` | `created_at` |
| `frontend_error_logs_2026_05` | `created_at` |
| `frontend_error_logs_2026_06` | `created_at` |
| `frontend_error_logs_2026_07` | `created_at` |
| `frontend_error_logs_2026_08` | `created_at` |
| `frontend_error_logs_2026_09` | `created_at` |
| `frontend_error_logs_2026_10` | `created_at` |
| `frontend_error_logs_default` | `created_at` |
| `bitrix24_activities` | `created_at` |
| `bitrix24_tokens` | `created_at`, `updated_at` |
| `geo_blocks` | `created_at`, `updated_at` |
| `alerts_sent` | `created_at` |
| `cron_job_logs` | `created_at` |
| `email_verifications` | `created_at` |
| `mfa_sessions` | `created_at` |
| `user_devices` | `created_at` |
| `user_passkeys` | `created_at` |
| `webauthn_challenges` | `created_at` |
| `asaas_payment_links` | `created_at`, `created_by` |
| `estrategias_elisao_catalogo` | `created_at` |
| `user_preferences` | `created_at`, `updated_at` |
| `frontend_error_logs_2026_01` | `created_at` |
| `frontend_error_logs_2026_02` | `created_at` |
| `frontend_error_logs_2026_03` | `created_at` |
| `frontend_error_logs_2026_04` | `created_at` |

## Dados pessoais / sensíveis (LGPD — cuidado em logs, exports, prompts de IA)

| Tabela | Coluna |
|---|---|
| `clientes` | `email` |
| `clientes` | `telefone` |
| `clientes` | `endereco` |
| `fornecedores` | `cnpj` |
| `fornecedores` | `email` |
| `fornecedores` | `telefone` |
| `fornecedores` | `endereco` |
| `profiles` | `email` |
| `profiles` | `telefone` |
| `empresas` | `cnpj` |
| `empresas` | `telefone` |
| `empresas` | `email` |
| `empresas` | `endereco` |
| `empresas` | `cep` |
| `portal_cliente_acessos` | `ip_address` |
| `vendedores` | `email` |
| `vendedores` | `telefone` |
| `password_reset_requests` | `ip_address` |
| `allowed_ips` | `ip_address` |
| `login_attempts` | `email` |
| `login_attempts` | `ip_address` |
| `user_sessions` | `ip_address` |
| `rate_limit_logs` | `ip_address` |
| `blocked_ips` | `ip_address` |
| `security_alerts` | `ip_address` |
| `new_device_alerts` | `ip_address` |
| `asaas_customers` | `email` |
| `asaas_customers` | `telefone` |
| `asaas_customers` | `endereco` |
| `cnpja_cache` | `cnpj` |
| `convites_contador` | `email` |
| `sso_login_attempts` | `email` |
| `security_audit_logs` | `ip_address` |
| `auth_logs` | `ip_address` |
| `audit_logs` | `ip_address` |
| `ip_whitelist` | `ip_address` |
| `password_reset_tokens` | `ip_address` |
| `empresas_certificados` | `cnpj` |
| `sefaz_dfe_cursor` | `cnpj` |
| `digest_envios_log` | `email` |
| `organizacoes` | `cnpj` |
| `organizacoes` | `email` |
| `organizacoes` | `telefone` |
| `acessos_suspeitos` | `ip_address` |
| `email_verifications` | `email` |
| `mfa_sessions` | `ip_address` |
| `user_devices` | `ip_address` |

## Colunas de dinheiro (tipo importa: numeric ✅ / float ❌)

| Tabela | Coluna | Tipo |
|---|---|---|
| `contas_pagar` | `valor` | `DECIMAL(15,` |
| `contas_pagar` | `valor_pago` | `numeric` |
| `contas_pagar` | `juros` | `numeric` |
| `contas_pagar` | `multa` | `numeric` |
| `contas_pagar` | `desconto` | `numeric` |
| `contas_pagar` | `total_parcelas` | `integer` |
| `contas_receber` | `valor` | `DECIMAL(15,` |
| `contas_receber` | `valor_recebido` | `numeric` |
| `contas_receber` | `juros` | `numeric` |
| `contas_receber` | `multa` | `numeric` |
| `contas_receber` | `desconto` | `numeric` |
| `contas_receber` | `total_parcelas` | `integer` |
| `contas_receber` | `valor_desconto` | `NUMERIC(15,2)` |
| `contas_receber` | `valor_final` | `numeric(15,2)` |
| `contas_bancarias` | `saldo_inicial` | `NUMERIC` |
| `contas_bancarias` | `saldo_atual` | `numeric` |
| `contas_bancarias` | `saldo_disponivel` | `numeric` |
| `transacoes_bancarias` | `valor` | `NUMERIC` |
| `transacoes_bancarias` | `saldo` | `NUMERIC` |
| `transacoes_bancarias` | `valor_conciliado` | `numeric` |
| `notas_fiscais` | `valor_total` | `NUMERIC` |
| `notas_fiscais` | `valor_icms` | `NUMERIC` |
| `notas_fiscais` | `valor_produtos` | `NUMERIC` |
| `notas_fiscais` | `valor_desconto` | `numeric` |
| `notas_fiscais` | `valor_frete` | `numeric` |
| `configuracoes_aprovacao` | `valor_minimo` | `NUMERIC` |
| `configuracoes_aprovacao` | `valor_minimo_aprovacao` | `NUMERIC` |
| `boletos` | `valor` | `numeric` |
| `boletos` | `valor_pago` | `NUMERIC` |
| `boletos` | `juros_multa` | `NUMERIC` |
| `boletos` | `desconto` | `NUMERIC` |
| `feedback_conciliacao_ia` | `feedback_texto` | `TEXT` |
| `metas_financeiras` | `valor_meta` | `DECIMAL(12,2)` |
| `alertas_preditivos` | `valor_estimado` | `DECIMAL(12,2)` |
| `pagamentos_recorrentes` | `valor` | `NUMERIC(15,2)` |
| `pagamentos_recorrentes` | `total_gerado` | `INTEGER` |
| `acordos_parcelamento` | `total_parcelas` | `integer` |
| `acordos_parcelamento` | `valor_total` | `numeric` |
| `acordos_parcelamento` | `valor_original` | `NUMERIC(15,2)` |
| `acordos_parcelamento` | `valor_total_acordo` | `NUMERIC(15,2)` |
| `acordos_parcelamento` | `desconto_aplicado` | `NUMERIC(15,2)` |
| `acordos_parcelamento` | `juros_aplicado` | `NUMERIC(15,2)` |
| `acordos_parcelamento` | `valor_parcela` | `NUMERIC(15,2)` |
| `parcelas_acordo` | `valor` | `NUMERIC(15,2)` |
| `parcelas_acordo` | `valor_pago` | `numeric(15,2)` |
| `apuracoes_tributarias` | `valor_total` | `NUMERIC` |
| `apuracoes_tributarias` | `total_tributos_novos` | `NUMERIC` |
| `apuracoes_tributarias` | `total_tributos_residuais` | `NUMERIC` |
| `apuracoes_tributarias` | `total_geral` | `NUMERIC` |
| `creditos_tributarios` | `saldo_disponivel` | `NUMERIC` |
| `creditos_tributarios` | `valor_credito` | `NUMERIC(15,2)` |
| `creditos_tributarios` | `valor_utilizado` | `NUMERIC` |
| `creditos_tributarios` | `valor_base` | `numeric(15,2)` |
| `operacoes_tributaveis` | `valor_total` | `NUMERIC` |
| `operacoes_tributaveis` | `valor_operacao` | `numeric` |
| `operacoes_tributaveis` | `valor_desconto` | `numeric` |
| `operacoes_tributaveis` | `valor_frete` | `numeric` |
| `split_payment_transacoes` | `valor_operacao` | `DECIMAL(15,2)` |
| `split_payment_transacoes` | `valor_liquido` | `DECIMAL(15,2)` |
| `split_payment_transacoes` | `total_retido` | `DECIMAL(15,2)` |
| `apuracoes_irpj_csll` | `total_adicoes` | `NUMERIC` |
| `apuracoes_irpj_csll` | `total_exclusoes` | `NUMERIC` |
| `apuracoes_irpj_csll` | `saldo_negativo_anterior` | `NUMERIC` |
| `apuracoes_irpj_csll` | `total_tributos` | `numeric` |
| `apuracoes_irpj_csll` | `saldo_negativo_irpj` | `numeric` |
| `apuracoes_irpj_csll` | `saldo_negativo_csll` | `numeric` |
| `prejuizos_fiscais` | `valor_acumulado` | `NUMERIC` |
| `prejuizos_fiscais` | `valor_utilizado` | `NUMERIC` |
| `prejuizos_fiscais` | `valor_original` | `NUMERIC` |
| `prejuizos_fiscais` | `valor_compensado` | `NUMERIC` |
| `prejuizos_fiscais` | `saldo_atual` | `NUMERIC` |
| `prejuizos_fiscais` | `saldo_disponivel` | `NUMERIC` |
| `incentivos_fiscais` | `valor_utilizado_ano` | `NUMERIC(15,2)` |
| `retencoes_fonte` | `valor` | `NUMERIC` |
| `retencoes_fonte` | `valor_base` | `numeric` |
| `retencoes_fonte` | `valor_retido` | `numeric` |
| `darfs` | `valor_total` | `NUMERIC` |
| `darfs` | `valor_multa` | `numeric` |
| `darfs` | `valor_juros` | `numeric` |
| `darfs` | `valor_principal` | `number` |
| `alertas_tributarios` | `valor` | `number` |
| `per_dcomp` | `valor_original` | `NUMERIC(15,2)` |
| `per_dcomp` | `valor_atualizado` | `NUMERIC(15,2)` |
| `per_dcomp` | `valor_compensado` | `NUMERIC(15,2)` |
| `regras_conciliacao` | `valor_exato` | `NUMERIC` |
| `conciliacoes_parciais` | `valor_parcial` | `numeric` |
| `asaas_payments` | `valor` | `numeric(14,2)` |
| `asaas_payments` | `valor_liquido` | `numeric(14,2)` |
| `movimentacoes` | `valor` | `NUMERIC` |
| `transferencias` | `valor` | `NUMERIC(15,2)` |
| `extrato_bancario` | `valor` | `numeric` |
| `extrato_bancario` | `saldo` | `numeric` |
| `conciliacoes` | `total_conciliados` | `integer` |
| `negativacoes` | `valor` | `NUMERIC` |
| `protestos` | `valor` | `NUMERIC` |
| `pix_templates` | `valor_padrao` | `NUMERIC(14,2)` |
| `pix_templates` | `valor_fixo` | `BOOLEAN` |
| `faturamento_mensal` | `valor_faturamento` | `NUMERIC` |
| `faturamento_mensal` | `valor_impostos` | `NUMERIC` |
| `faturamento_mensal` | `impostos_federais` | `NUMERIC` |
| `faturamento_mensal` | `impostos_municipais` | `NUMERIC` |
| `folha_pagamento` | `valor_total` | `NUMERIC` |
| `folha_pagamento` | `total_folha` | `NUMERIC` |
| `benchmarks_setoriais` | `valor` | `number` |
| `verificacoes_conformidade` | `total_checks` | `INTEGER` |
| `fechamentos_tributarios` | `total_apurado` | `NUMERIC(16,2)` |
| `notas_fiscais_ocr` | `valor_total` | `NUMERIC(15,2)` |
| `notas_fiscais_ocr` | `valor_cofins` | `number` |
| `notas_fiscais_ocr` | `valor_icms` | `number` |
| `notas_fiscais_ocr` | `valor_ipi` | `number` |
| `notas_fiscais_ocr` | `valor_pis` | `number` |
| `anomalias_detectadas` | `valor_envolvido` | `numeric` |
| `slo_metrics_diarias` | `total_requisicoes` | `bigint` |
| `slo_metrics_diarias` | `taxa_erro_pct` | `numeric` |
| `slo_metrics_diarias` | `total_requests` | `number` |
| `lancamentos_contabeis` | `valor_total` | `numeric` |
| `partidas_contabeis` | `valor` | `NUMERIC(15,2)` |
| `sped_contabil_arquivos` | `total_linhas` | `INTEGER` |
| `sped_contabil_arquivos` | `total_lancamentos` | `INTEGER` |
| `logs_conciliacao_retroativa` | `total_processado` | `integer` |
| `logs_conciliacao_retroativa` | `total_conciliado` | `integer` |
| `divergencias_conciliacao` | `valor_divergencia` | `NUMERIC` |
| `elisao_creditos_auditoria` | `valor_base` | `NUMERIC(15,2)` |
| `elisao_creditos_auditoria` | `valor_credito_calculado` | `NUMERIC(15,2)` |
| `elisao_creditos_auditoria` | `valor_credito` | `number` |
| `elisao_tarefas_acionaveis` | `valor_envolvido` | `NUMERIC(15,2)` |
| `elisao_alertas` | `valor_estimado` | `NUMERIC(15,2)` |
| `asaas_transfers` | `valor` | `numeric(14,2)` |
| `asaas_reconciliation_suggestions` | `valor` | `NUMERIC` |
| `bloqueios_duplicidade` | `valor_bloqueado` | `NUMERIC(15,2)` |
| `kpis_operacionais` | `valor_atual` | `numeric` |
| `kpis_operacionais` | `valor` | `number` |
| `pedidos_compra` | `valor_total` | `NUMERIC` |
| `itens_pedido_compra` | `valor_unitario` | `NUMERIC` |
| `itens_pedido_compra` | `valor_total` | `numeric` |
| `fluxos_aprovacao_niveis` | `valor_minimo` | `NUMERIC` |
| `sessoes_conciliacao` | `total_conciliados` | `integer` |
| `contratos` | `valor_mensal` | `NUMERIC(15,2)` |
| `contratos` | `valor_total` | `NUMERIC(15,2)` |
| `webhook_simulation_runs` | `total_scenarios` | `INTEGER` |
| `slow_query_alerts` | `total_exec_ms` | `NUMERIC(14,3)` |
| `bloat_snapshots` | `total_size_bytes` | `BIGINT` |
| `bloat_snapshots` | `total_size_pretty` | `TEXT` |
| `pg_stat_statements_baseline` | `total_exec_time` | `DOUBLE` |
| `nfe_recebidas` | `valor_total` | `NUMERIC(15,` |
| `entregas_obrigacoes` | `valor_multa` | `NUMERIC(14,2)` |
| `conformidade_snapshots` | `total_obrigacoes` | `integer` |
| `conformidade_snapshots` | `multa_registrada` | `numeric(14,2)` |
| `integration_secrets` | `valor` | `text` |
| `digest_envios_log` | `total_alertas` | `INTEGER` |
| `digest_envios_log` | `total_empresas` | `INTEGER` |
| `digest_envios_log` | `multa_total` | `NUMERIC(14,2)` |
| `overlay_rejeicoes_auditoria` | `valor_recebido` | `text` |
| `catalogos_tributarios_health_history` | `total_invariantes` | `integer` |
| `simulacao_tributos_detalhados` | `valor_apurado` | `numeric(15,2)` |
| `operacoes_icms` | `valor_operacao` | `numeric(15,2)` |
| `operacoes_icms` | `valor_total_icms` | `numeric(15,2)` |
| `operacoes_icms` | `valor_icms` | `number` |
| `projecoes_reforma` | `imposto_seletivo` | `numeric(15,2)` |
| `projecoes_reforma` | `total_tributos` | `numeric(15,2)` |
| `oportunidades_elisao` | `custo_implementacao` | `NUMERIC(15,2)` |
| `asaas_payment_links` | `valor` | `NUMERIC(14,2)` |

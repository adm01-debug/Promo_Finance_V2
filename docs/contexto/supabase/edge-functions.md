# Edge Functions

URL base: `https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/<slug>`. Metadados por função em `edge-functions/<slug>/README.md`. A Management API devolve só o bundle compilado; o fonte canônico é `supabase/functions/<slug>/` no repo.

| slug | nome | status | versão | verify_jwt | entrypoint |
|---|---|---|---|---|---|
| aceitar-convite | aceitar-convite | ACTIVE | 142 | sim | file:///app/supabase/functions/aceitar-convite/index.ts |
| analise-fluxo-ia | analise-fluxo-ia | ACTIVE | 146 | não | file:///app/supabase/functions/analise-fluxo-ia/index.ts |
| analise-preditiva | analise-preditiva | ACTIVE | 140 | sim | file:///app/supabase/functions/analise-preditiva/index.ts |
| analyze-document | analyze-document | ACTIVE | 145 | não | file:///app/supabase/functions/analyze-document/index.ts |
| api-keys-manage | api-keys-manage | ACTIVE | 130 | não | file:///app/supabase/functions/api-keys-manage/index.ts |
| asaas-proxy | asaas-proxy | ACTIVE | 143 | não | file:///app/supabase/functions/asaas-proxy/index.ts |
| asaas-webhook | asaas-webhook | ACTIVE | 146 | não | file:///app/supabase/functions/asaas-webhook/index.ts |
| benchmarking-setorial | benchmarking-setorial | ACTIVE | 142 | não | file:///app/supabase/functions/benchmarking-setorial/index.ts |
| bitrix24-sync | bitrix24-sync | ACTIVE | 145 | sim | file:///app/supabase/functions/bitrix24-sync/index.ts |
| bitrix24-webhook | bitrix24-webhook | ACTIVE | 147 | não | file:///app/supabase/functions/bitrix24-webhook/index.ts |
| bling-proxy | bling-proxy | ACTIVE | 140 | não | file:///app/supabase/functions/bling-proxy/index.ts |
| bling-webhook | bling-webhook | ACTIVE | 141 | não | file:///app/supabase/functions/bling-webhook/index.ts |
| calcular-health-score-operacional | calcular-health-score-operacional | ACTIVE | 138 | sim | file:///app/supabase/functions/calcular-health-score-operacional/index.ts |
| calcular-slo-metrics-diario | calcular-slo-metrics-diario | ACTIVE | 140 | sim | file:///app/supabase/functions/calcular-slo-metrics-diario/index.ts |
| calculo-iva | calculo-iva | ACTIVE | 142 | sim | file:///app/supabase/functions/calculo-iva/index.ts |
| categorizar-despesa | categorizar-despesa | ACTIVE | 145 | não | file:///app/supabase/functions/categorizar-despesa/index.ts |
| ci-security-gate-log | ci-security-gate-log | ACTIVE | 141 | não | file:///app/supabase/functions/ci-security-gate-log/index.ts |
| cnpja-lookup | cnpja-lookup | ACTIVE | 138 | não | file:///app/supabase/functions/cnpja-lookup/index.ts |
| comparar-benchmark-setorial | comparar-benchmark-setorial | ACTIVE | 142 | sim | file:///app/supabase/functions/comparar-benchmark-setorial/index.ts |
| compare-schemas | compare-schemas | ACTIVE | 139 | não | file:///app/supabase/functions/compare-schemas/index.ts |
| conciliacao-ia | conciliacao-ia | ACTIVE | 142 | sim | file:///app/supabase/functions/conciliacao-ia/index.ts |
| conciliacao-proxy | conciliacao-proxy | ACTIVE | 143 | sim | file:///app/supabase/functions/conciliacao-proxy/index.ts |
| consulta-tributaria | consulta-tributaria | ACTIVE | 138 | sim | file:///app/supabase/functions/consulta-tributaria/index.ts |
| contabilizar-evento | contabilizar-evento | ACTIVE | 144 | sim | file:///app/supabase/functions/contabilizar-evento/index.ts |
| convidar-contador | convidar-contador | ACTIVE | 142 | sim | file:///app/supabase/functions/convidar-contador/index.ts |
| convidar-usuario | convidar-usuario | ACTIVE | 131 | não | file:///app/supabase/functions/convidar-usuario/index.ts |
| copilot-global | copilot-global | ACTIVE | 141 | sim | file:///app/supabase/functions/copilot-global/index.ts |
| copilot-tributario | copilot-tributario | ACTIVE | 141 | sim | file:///app/supabase/functions/copilot-tributario/index.ts |
| decidir-regime | decidir-regime | ACTIVE | 143 | não | file:///app/supabase/functions/decidir-regime/index.ts |
| detectar-anomalias-financeiras | detectar-anomalias-financeiras | ACTIVE | 142 | sim | file:///app/supabase/functions/detectar-anomalias-financeiras/index.ts |
| digest-silenciamentos-erro | digest-silenciamentos-erro | ACTIVE | 142 | não | file:///app/supabase/functions/digest-silenciamentos-erro/index.ts |
| enviar-alerta-email | enviar-alerta-email | ACTIVE | 145 | não | file:///app/supabase/functions/enviar-alerta-email/index.ts |
| enviar-bitrix24-tributario | enviar-bitrix24-tributario | ACTIVE | 137 | não | file:///app/supabase/functions/enviar-bitrix24-tributario/index.ts |
| enviar-convite-organizacao | enviar-convite-organizacao | ACTIVE | 142 | sim | file:///app/supabase/functions/enviar-convite-organizacao/index.ts |
| enviar-digest-conformidade | enviar-digest-conformidade | ACTIVE | 142 | sim | file:///app/supabase/functions/enviar-digest-conformidade/index.ts |
| enviar-relatorios-tributarios-agendados | enviar-relatorios-tributarios-agendados | ACTIVE | 140 | sim | file:///app/supabase/functions/enviar-relatorios-tributarios-agendados/index.ts |
| executar-analise-preditiva | executar-analise-preditiva | ACTIVE | 142 | não | file:///app/supabase/functions/executar-analise-preditiva/index.ts |
| executar-fechamento-tributario | executar-fechamento-tributario | ACTIVE | 138 | sim | file:///app/supabase/functions/executar-fechamento-tributario/index.ts |
| executar-regua-cobranca | executar-regua-cobranca | ACTIVE | 144 | não | file:///app/supabase/functions/executar-regua-cobranca/index.ts |
| executar-relatorios | executar-relatorios | ACTIVE | 142 | não | file:///app/supabase/functions/executar-relatorios/index.ts |
| expert-agent | expert-agent | ACTIVE | 141 | não | file:///app/supabase/functions/expert-agent/index.ts |
| exportar-sped-contribuicoes | exportar-sped-contribuicoes | ACTIVE | 143 | sim | file:///app/supabase/functions/exportar-sped-contribuicoes/index.ts |
| external-data | external-data | ACTIVE | 146 | não | file:///app/supabase/functions/external-data/index.ts |
| gerar-acoes-recomendadas | gerar-acoes-recomendadas | ACTIVE | 138 | sim | file:///app/supabase/functions/gerar-acoes-recomendadas/index.ts |
| gerar-alertas | gerar-alertas | ACTIVE | 143 | não | file:///app/supabase/functions/gerar-alertas/index.ts |
| gerar-alertas-dispatcher | gerar-alertas-dispatcher | ACTIVE | 142 | não | file:///app/supabase/functions/gerar-alertas-dispatcher/index.ts |
| gerar-alertas-tributarios | gerar-alertas-tributarios | ACTIVE | 142 | não | file:///app/supabase/functions/gerar-alertas-tributarios/index.ts |
| gerar-dre-tributaria | gerar-dre-tributaria | ACTIVE | 145 | não | file:///app/supabase/functions/gerar-dre-tributaria/index.ts |
| gerar-heatmap-tributario | gerar-heatmap-tributario | ACTIVE | 147 | não | file:///app/supabase/functions/gerar-heatmap-tributario/index.ts |
| gerar-pacote-evidencias | gerar-pacote-evidencias | ACTIVE | 136 | sim | file:///app/supabase/functions/gerar-pacote-evidencias/index.ts |
| gerar-pdf-tributario | gerar-pdf-tributario | ACTIVE | 142 | não | file:///app/supabase/functions/gerar-pdf-tributario/index.ts |
| gerar-relatorio-anual | gerar-relatorio-anual | ACTIVE | 139 | sim | file:///app/supabase/functions/gerar-relatorio-anual/index.ts |
| gerar-resumo-executivo-semanal | gerar-resumo-executivo-semanal | ACTIVE | 141 | sim | file:///app/supabase/functions/gerar-resumo-executivo-semanal/index.ts |
| gerar-resumo-financeiro-diario | gerar-resumo-financeiro-diario | ACTIVE | 139 | sim | file:///app/supabase/functions/gerar-resumo-financeiro-diario/index.ts |
| gerar-snapshots-conformidade | gerar-snapshots-conformidade | ACTIVE | 139 | sim | file:///app/supabase/functions/gerar-snapshots-conformidade/index.ts |
| gerar-sped-ecd | gerar-sped-ecd | ACTIVE | 141 | sim | file:///app/supabase/functions/gerar-sped-ecd/index.ts |
| gerar-sped-ecf | gerar-sped-ecf | ACTIVE | 138 | sim | file:///app/supabase/functions/gerar-sped-ecf/index.ts |
| get-mapbox-token | get-mapbox-token | ACTIVE | 138 | sim | file:///app/supabase/functions/get-mapbox-token/index.ts |
| get-vapid-key | get-vapid-key | ACTIVE | 139 | não | file:///app/supabase/functions/get-vapid-key/index.ts |
| health | health | ACTIVE | 138 | não | file:///app/supabase/functions/health/index.ts |
| insights-relatorio | insights-relatorio | ACTIVE | 144 | não | file:///app/supabase/functions/insights-relatorio/index.ts |
| log-sped-bitrix24 | log-sped-bitrix24 | ACTIVE | 142 | sim | file:///app/supabase/functions/log-sped-bitrix24/index.ts |
| mcp-query | mcp-query | ACTIVE | 142 | não | file:///app/supabase/functions/mcp-query/index.ts |
| monitor-health | monitor-health | ACTIVE | 124 | não | file:///app/supabase/functions/monitor-health/index.ts |
| monitorar-erros-frontend | monitorar-erros-frontend | ACTIVE | 144 | não | file:///app/supabase/functions/monitorar-erros-frontend/index.ts |
| n8n-callback | n8n-callback | ACTIVE | 140 | não | file:///app/supabase/functions/n8n-callback/index.ts |
| n8n-dispatch | n8n-dispatch | ACTIVE | 141 | sim | file:///app/supabase/functions/n8n-dispatch/index.ts |
| nfe-upload-certificado | nfe-upload-certificado | ACTIVE | 143 | sim | file:///app/supabase/functions/nfe-upload-certificado/index.ts |
| nfe-vinculo-proxy | nfe-vinculo-proxy | ACTIVE | 139 | sim | file:///app/supabase/functions/nfe-vinculo-proxy/index.ts |
| notify-performance-alert | notify-performance-alert | ACTIVE | 141 | não | file:///app/supabase/functions/notify-performance-alert/index.ts |
| notify-saved-filter | notify-saved-filter | ACTIVE | 141 | sim | file:///app/supabase/functions/notify-saved-filter/index.ts |
| open-finance | open-finance | ACTIVE | 139 | sim | file:///app/supabase/functions/open-finance/index.ts |
| overlay-rejeicoes-auditoria | overlay-rejeicoes-auditoria | ACTIVE | 141 | sim | file:///app/supabase/functions/overlay-rejeicoes-auditoria/index.ts |
| prever-carga-tributaria | prever-carga-tributaria | ACTIVE | 143 | não | file:///app/supabase/functions/prever-carga-tributaria/index.ts |
| processar-fila-cobrancas | processar-fila-cobrancas | ACTIVE | 139 | sim | file:///app/supabase/functions/processar-fila-cobrancas/index.ts |
| processar-nf-ocr | processar-nf-ocr | ACTIVE | 139 | sim | file:///app/supabase/functions/processar-nf-ocr/index.ts |
| processar-solicitacao-lgpd | processar-solicitacao-lgpd | ACTIVE | 142 | sim | file:///app/supabase/functions/processar-solicitacao-lgpd/index.ts |
| projecao-reforma | projecao-reforma | ACTIVE | 144 | sim | file:///app/supabase/functions/projecao-reforma/index.ts |
| relatorio-diario-anomalias | relatorio-diario-anomalias | ACTIVE | 142 | sim | file:///app/supabase/functions/relatorio-diario-anomalias/index.ts |
| scim-server | scim-server | ACTIVE | 138 | não | file:///app/supabase/functions/scim-server/index.ts |
| sefaz-dfe-dispatcher | sefaz-dfe-dispatcher | ACTIVE | 143 | não | file:///app/supabase/functions/sefaz-dfe-dispatcher/index.ts |
| sefaz-dfe-puxar | sefaz-dfe-puxar | ACTIVE | 144 | não | file:///app/supabase/functions/sefaz-dfe-puxar/index.ts |
| sefaz-manifestar | sefaz-manifestar | ACTIVE | 139 | sim | file:///app/supabase/functions/sefaz-manifestar/index.ts |
| send-device-alert | send-device-alert | ACTIVE | 138 | não | file:///app/supabase/functions/send-device-alert/index.ts |
| send-push-notification | send-push-notification | ACTIVE | 140 | não | file:///app/supabase/functions/send-push-notification/index.ts |
| simular-presumido | simular-presumido | ACTIVE | 142 | sim | file:///app/supabase/functions/simular-presumido/index.ts |
| simular-real | simular-real | ACTIVE | 139 | sim | file:///app/supabase/functions/simular-real/index.ts |
| simular-simples | simular-simples | ACTIVE | 140 | sim | file:///app/supabase/functions/simular-simples/index.ts |
| sincronizar-anomalia-bitrix24 | sincronizar-anomalia-bitrix24 | ACTIVE | 136 | sim | file:///app/supabase/functions/sincronizar-anomalia-bitrix24/index.ts |
| sso-callback | sso-callback | ACTIVE | 138 | não | file:///app/supabase/functions/sso-callback/index.ts |
| sso-generate-metadata | sso-generate-metadata | ACTIVE | 142 | sim | file:///app/supabase/functions/sso-generate-metadata/index.ts |
| sso-initiate | sso-initiate | ACTIVE | 141 | não | file:///app/supabase/functions/sso-initiate/index.ts |
| sso-logout | sso-logout | ACTIVE | 136 | não | file:///app/supabase/functions/sso-logout/index.ts |
| sso-test-login | sso-test-login | ACTIVE | 142 | sim | file:///app/supabase/functions/sso-test-login/index.ts |
| sso-validate-config | sso-validate-config | ACTIVE | 143 | sim | file:///app/supabase/functions/sso-validate-config/index.ts |
| sync-profile-to-bitrix | sync-profile-to-bitrix | ACTIVE | 145 | sim | file:///app/supabase/functions/sync-profile-to-bitrix/index.ts |
| upload-anexo | upload-anexo | ACTIVE | 127 | sim | file:///app/supabase/functions/upload-anexo/index.ts |
| validar-token-contador | validar-token-contador | ACTIVE | 142 | não | file:///app/supabase/functions/validar-token-contador/index.ts |
| validate-ip-geo | validate-ip-geo | ACTIVE | 143 | não | file:///app/supabase/functions/validate-ip-geo/index.ts |
| verificar-conformidade-fiscal | verificar-conformidade-fiscal | ACTIVE | 138 | sim | file:///app/supabase/functions/verificar-conformidade-fiscal/index.ts |
| webhook-replay | webhook-replay | ACTIVE | 144 | não | file:///app/supabase/functions/webhook-replay/index.ts |
| webhook-retry-worker | webhook-retry-worker | ACTIVE | 140 | não | file:///app/supabase/functions/webhook-retry-worker/index.ts |
| webhook-simulator | webhook-simulator | ACTIVE | 141 | sim | file:///app/supabase/functions/webhook-simulator/index.ts |
| whatsapp-ai-analyzer | whatsapp-ai-analyzer | ACTIVE | 143 | sim | file:///app/supabase/functions/whatsapp-ai-analyzer/index.ts |
| whatsapp-ia-proativo | whatsapp-ia-proativo | ACTIVE | 144 | não | file:///app/supabase/functions/whatsapp-ia-proativo/index.ts |
| whatsapp-webhook | whatsapp-webhook | ACTIVE | 144 | não | file:///app/supabase/functions/whatsapp-webhook/index.ts |


## Secrets (apenas nomes)

| nome |
|---|
| ALERTS_EMAIL_FROM |
| ALERTS_EMAIL_TO |
| ALLOWED_ORIGINS |
| APP_BASE_URL |
| APP_PUBLIC_URL |
| ASAAS_WEBHOOK_TOKEN |
| CI_GATE_LOG_SECRET |
| CONTADOR_INVITE_SECRET |
| CRON_DISPATCH_SECRET |
| EXTERNAL_SUPABASE_SERVICE_KEY |
| EXTERNAL_SUPABASE_URL |
| MCP_SECRET |
| N8N_CALLBACK_SECRET |
| N8N_DISPATCH_SECRET |
| NFE_CERT_MASTER_KEY |
| OPEN_FINANCE_REDIRECT_URI |
| PUBLIC_APP_URL |
| REGUA_CRON_SECRET |
| RESEND_API_KEY |
| RESEND_FROM |
| SEFAZ_CRON_SECRET |
| SENTRY_ENVIRONMENT |
| SUPABASE_ANON_KEY |
| SUPABASE_DB_URL |
| SUPABASE_JWKS |
| SUPABASE_PUBLISHABLE_KEYS |
| SUPABASE_SECRET_KEYS |
| SUPABASE_SERVICE_ROLE_KEY |
| SUPABASE_URL |
| VAPID_PRIVATE_KEY |
| VAPID_PUBLIC_KEY |

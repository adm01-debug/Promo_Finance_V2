# Paridade das Edge Functions — 12/09/2026

SHA: `9b1e6e89db21a3e52cf24e8fb0aa533c89178ba9`. Somente comparação; nenhuma implantação realizada. Igualdade considera todos os arquivos retornados pelo MCP, normalizando CRLF. Diferença não implica defeito. Configuração e comportamento requerem validação independente.

| Função | Versão remota | JWT local/remoto | Fonte comparada | Arquivos diferentes |
| --- | --- | --- | --- | --- |
| aceitar-convite | 13 | true/true | Igual no recorte | — |
| analise-fluxo-ia | 15 | false/false | Divergente | supabase/functions/analise-fluxo-ia/index.ts; supabase/functions/_shared/rate-limit.ts; supabase/functions/_shared/auth-guard.ts |
| analise-preditiva | 13 | true/true | Igual no recorte | — |
| analyze-document | 15 | false/false | Divergente | supabase/functions/analyze-document/index.ts; supabase/functions/_shared/rate-limit.ts; supabase/functions/_shared/auth-guard.ts |
| asaas-proxy | 20 | false/false | Igual no recorte | — |
| asaas-webhook | 15 | false/false | Divergente | supabase/functions/asaas-webhook/index.ts; supabase/functions/_shared/versioned-contract.ts; supabase/functions/_shared/rate-limit.ts |
| benchmarking-setorial | 15 | false/false | Divergente | supabase/functions/benchmarking-setorial/index.ts; supabase/functions/_shared/rate-limit.ts; supabase/functions/_shared/auth-guard.ts |
| bitrix24-sync | 13 | true/true | Igual no recorte | — |
| bitrix24-webhook | 16 | false/false | Divergente | supabase/functions/bitrix24-webhook/index.ts; supabase/functions/_shared/versioned-contract.ts; supabase/functions/_shared/rate-limit.ts |
| bling-proxy | 13 | false/false | Igual no recorte | — |
| bling-webhook | 15 | false/false | Divergente | supabase/functions/bling-webhook/index.ts; supabase/functions/_shared/versioned-contract.ts; supabase/functions/_shared/rate-limit.ts |
| calcular-health-score-operacional | 13 | true/true | Divergente | supabase/functions/calcular-health-score-operacional/index.ts |
| calcular-slo-metrics-diario | 12 | true/true | Divergente | supabase/functions/calcular-slo-metrics-diario/index.ts |
| calculo-iva | 13 | true/true | Igual no recorte | — |
| categorizar-despesa | 15 | false/false | Divergente | supabase/functions/categorizar-despesa/index.ts; supabase/functions/_shared/rate-limit.ts; supabase/functions/_shared/auth-guard.ts |
| ci-security-gate-log | 13 | false/true | Divergente | supabase/functions/ci-security-gate-log/index.ts |
| cnpja-lookup | 13 | false/false | Divergente | supabase/functions/cnpja-lookup/index.ts |
| comparar-benchmark-setorial | 18 | false/false | Divergente | supabase/functions/comparar-benchmark-setorial/index.ts |
| compare-schemas | 12 | false/false | Divergente | supabase/functions/compare-schemas/index.ts |
| conciliacao-ia | 13 | true/true | Igual no recorte | — |
| conciliacao-proxy | 13 | true/true | Divergente | supabase/functions/conciliacao-proxy/index.ts |
| consulta-tributaria | 13 | true/true | Igual no recorte | — |
| contabilizar-evento | 13 | true/true | Divergente | supabase/functions/contabilizar-evento/index.ts |
| convidar-contador | 14 | true/true | Divergente | supabase/functions/convidar-contador/index.ts |
| convidar-usuario | 1 | false/false | Igual no recorte | — |
| copilot-global | 13 | true/true | Divergente | supabase/functions/copilot-global/index.ts |
| copilot-tributario | 13 | true/true | Igual no recorte | — |
| decidir-regime | 14 | false/false | Igual no recorte | — |
| detectar-anomalias-financeiras | 13 | true/true | Divergente | supabase/functions/detectar-anomalias-financeiras/index.ts |
| digest-silenciamentos-erro | 14 | false/false | Divergente | supabase/functions/_shared/auth-guard.ts |
| enviar-alerta-email | 15 | false/false | Divergente | supabase/functions/enviar-alerta-email/index.ts; supabase/functions/_shared/auth-guard.ts |
| enviar-bitrix24-tributario | 13 | false/false | Divergente | supabase/functions/enviar-bitrix24-tributario/index.ts |
| enviar-convite-organizacao | 13 | true/true | Igual no recorte | — |
| enviar-digest-conformidade | 13 | true/true | Igual no recorte | — |
| enviar-relatorios-tributarios-agendados | 12 | true/true | Divergente | supabase/functions/enviar-relatorios-tributarios-agendados/index.ts |
| executar-analise-preditiva | 14 | false/false | Divergente | supabase/functions/executar-analise-preditiva/index.ts; supabase/functions/_shared/auth-guard.ts |
| executar-fechamento-tributario | 13 | true/true | Igual no recorte | — |
| executar-regua-cobranca | 19 | false/false | Igual no recorte | — |
| executar-relatorios | 13 | false/false | Divergente | supabase/functions/executar-relatorios/index.ts; supabase/functions/_shared/auth-guard.ts |
| expert-agent | 13 | false/false | Divergente | supabase/functions/expert-agent/index.ts; supabase/functions/_shared/rate-limit.ts |
| exportar-sped-contribuicoes | 13 | true/true | Divergente | supabase/functions/exportar-sped-contribuicoes/index.ts |
| external-data | 16 | false/false | Divergente | supabase/functions/external-data/index.ts |
| gerar-acoes-recomendadas | 13 | true/true | Divergente | supabase/functions/gerar-acoes-recomendadas/index.ts |
| gerar-alertas | 13 | false/false | Divergente | supabase/functions/gerar-alertas/index.ts |
| gerar-alertas-dispatcher | 14 | false/false | Igual no recorte | — |
| gerar-alertas-tributarios | 14 | false/false | Divergente | supabase/functions/gerar-alertas-tributarios/index.ts; supabase/functions/_shared/auth-guard.ts |
| gerar-dre-tributaria | 18 | false/false | Divergente | supabase/functions/gerar-dre-tributaria/index.ts; supabase/functions/_shared/auth-guard.ts |
| gerar-heatmap-tributario | 18 | false/false | Divergente | supabase/functions/gerar-heatmap-tributario/index.ts; supabase/functions/_shared/auth-guard.ts |
| gerar-pacote-evidencias | 13 | true/true | Divergente | supabase/functions/gerar-pacote-evidencias/index.ts |
| gerar-pdf-tributario | 13 | false/false | Divergente | supabase/functions/gerar-pdf-tributario/index.ts |
| gerar-relatorio-anual | 13 | true/true | Divergente | supabase/functions/gerar-relatorio-anual/index.ts |
| gerar-resumo-executivo-semanal | 13 | true/true | Divergente | supabase/functions/gerar-resumo-executivo-semanal/index.ts |
| gerar-resumo-financeiro-diario | 12 | true/true | Divergente | supabase/functions/gerar-resumo-financeiro-diario/index.ts |
| gerar-snapshots-conformidade | 13 | true/true | Igual no recorte | — |
| gerar-sped-ecd | 13 | true/true | Divergente | supabase/functions/gerar-sped-ecd/index.ts |
| gerar-sped-ecf | 13 | true/true | Divergente | supabase/functions/gerar-sped-ecf/index.ts |
| get-mapbox-token | 12 | true/true | Igual no recorte | — |
| get-vapid-key | 12 | false/false | Igual no recorte | — |
| health | 12 | true/true | Divergente | supabase/functions/_shared/validation.ts |
| insights-relatorio | 15 | false/false | Divergente | supabase/functions/insights-relatorio/index.ts; supabase/functions/_shared/rate-limit.ts; supabase/functions/_shared/auth-guard.ts |
| log-sped-bitrix24 | 13 | true/true | Igual no recorte | — |
| mcp-query | 15 | false/false | Divergente | supabase/functions/mcp-query/index.ts; supabase/functions/_shared/sql-write-guard.ts |
| monitorar-erros-frontend | 14 | false/false | Divergente | supabase/functions/_shared/auth-guard.ts |
| n8n-callback | 13 | false/true | Divergente | supabase/functions/n8n-callback/index.ts |
| n8n-dispatch | 13 | true/true | Igual no recorte | — |
| nfe-upload-certificado | 13 | true/true | Igual no recorte | — |
| nfe-vinculo-proxy | 13 | true/true | Igual no recorte | — |
| notify-performance-alert | 13 | false/true | Divergente | supabase/functions/notify-performance-alert/index.ts |
| notify-saved-filter | 13 | true/true | Igual no recorte | — |
| open-finance | 18 | true/true | Igual no recorte | — |
| overlay-rejeicoes-auditoria | 13 | true/true | Igual no recorte | — |
| prever-carga-tributaria | 18 | false/false | Divergente | supabase/functions/prever-carga-tributaria/index.ts |
| processar-fila-cobrancas | 12 | true/true | Divergente | supabase/functions/processar-fila-cobrancas/index.ts |
| processar-nf-ocr | 13 | true/true | Igual no recorte | — |
| processar-solicitacao-lgpd | 13 | true/true | Igual no recorte | — |
| projecao-reforma | 13 | true/true | Igual no recorte | — |
| relatorio-diario-anomalias | 13 | true/true | Igual no recorte | — |
| scim-server | 12 | false/false | Igual no recorte | — |
| sefaz-dfe-dispatcher | 12 | false/false | Igual no recorte | — |
| sefaz-dfe-puxar | 14 | false/false | Igual no recorte | — |
| sefaz-manifestar | 13 | true/true | Igual no recorte | — |
| send-device-alert | 13 | false/false | Divergente | supabase/functions/send-device-alert/index.ts |
| send-push-notification | 13 | false/false | Divergente | supabase/functions/send-push-notification/index.ts |
| simular-presumido | 13 | true/true | Igual no recorte | — |
| simular-real | 13 | true/true | Igual no recorte | — |
| simular-simples | 13 | true/true | Igual no recorte | — |
| sincronizar-anomalia-bitrix24 | 13 | true/true | Igual no recorte | — |
| sso-callback | 12 | false/false | Divergente | supabase/functions/sso-callback/index.ts |
| sso-generate-metadata | 13 | true/true | Igual no recorte | — |
| sso-initiate | 13 | false/false | Divergente | supabase/functions/sso-initiate/index.ts |
| sso-logout | 12 | false/false | Igual no recorte | — |
| sso-test-login | 14 | true/true | Igual no recorte | — |
| sso-validate-config | 13 | true/true | Igual no recorte | — |
| sync-profile-to-bitrix | 13 | true/true | Igual no recorte | — |
| validar-token-contador | 13 | false/false | Igual no recorte | — |
| validate-ip-geo | 13 | false/false | Divergente | supabase/functions/validate-ip-geo/index.ts |
| verificar-conformidade-fiscal | 13 | true/true | Divergente | supabase/functions/verificar-conformidade-fiscal/index.ts |
| webhook-replay | 14 | false/false | Igual no recorte | — |
| webhook-retry-worker | 14 | false/false | Divergente | supabase/functions/webhook-retry-worker/index.ts |
| webhook-simulator | 13 | true/true | Divergente | supabase/functions/webhook-simulator/index.ts |
| whatsapp-ai-analyzer | 13 | true/true | Igual no recorte | — |
| whatsapp-ia-proativo | 16 | false/false | Divergente | supabase/functions/whatsapp-ia-proativo/index.ts; supabase/functions/_shared/rate-limit.ts; supabase/functions/_shared/auth-guard.ts |
| whatsapp-webhook | 16 | false/false | Divergente | supabase/functions/whatsapp-webhook/index.ts; supabase/functions/_shared/versioned-contract.ts; supabase/functions/_shared/rate-limit.ts |
| api-keys-manage | — | false/ausente | Não implantada | Handler só local |


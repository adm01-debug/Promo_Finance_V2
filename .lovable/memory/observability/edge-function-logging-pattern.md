---
name: Edge Function Observability
description: Helper compartilhado _shared/observability.ts + tabela edge_function_logs + view vw_edge_health para monitorar saúde das edge functions tributárias
type: feature
---
Padrão de observabilidade para Edge Functions:

**Helper:** `supabase/functions/_shared/observability.ts` exporta `createLogger(functionName)` com `info/warn/error/flush`.

**Padrão de uso:**
```ts
const logger = createLogger('minha-fn');
const t0 = Date.now();
logger.info('fn_start');
try {
  // ...
  logger.info('fn_success', { duration_ms: Date.now() - t0, status_code: 200, context: {...} });
  await logger.flush();
  return new Response(...);
} catch (err) {
  logger.error('fn_failure', { duration_ms: Date.now() - t0, status_code: 500, error_message: msg });
  await logger.flush();
}
```

**Persistência:** tabela `edge_function_logs` (RLS admin-only para SELECT, service_role para INSERT). Buffer não-bloqueante — falhas de log nunca derrubam a função.

**Métricas:** view `vw_edge_health` (security_invoker) agrega últimos 7d: total_calls, error_rate_pct, p50_ms, p95_ms.

**UI:** `/admin/edge-health` (admin-only) com 3 KPIs + tabela por função + drill-down últimos 50 erros.

**Funções instrumentadas:** decidir-regime, gerar-pdf-tributario, enviar-bitrix24-tributario, cnpja-lookup, gerar-alertas-tributarios.

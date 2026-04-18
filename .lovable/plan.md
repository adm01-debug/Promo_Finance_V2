
P1 ✅ entregue. Próximo: **Lote P2 — Observabilidade Edge Functions tributárias**.

## Lote P2 — Observabilidade Edge Functions

### 1. Migration
- Tabela `edge_function_logs` (id, function_name, level, event, duration_ms, status_code, error_message, context jsonb, created_at).
- Índices em `(function_name, created_at desc)` e `(level, created_at desc)`.
- RLS admin-only via `has_role(auth.uid(), 'admin')`.
- View `vw_edge_health` com `security_invoker = true`: agrega últimos 7d por função → total_calls, error_rate, p50/p95 latency.

### 2. Edge Function compartilhada `_shared/observability.ts`
- Helper `createLogger(functionName)` retornando `{ info, warn, error, flush }`.
- Buffer em memória + flush async para `edge_function_logs` via service role (não-bloqueante).
- Padrão JSON estruturado já usado em `gerar-alertas-tributarios` (reaproveita).

### 3. Instrumentar 5 Edge Functions tributárias
- `decidir-regime`, `gerar-pdf-tributario`, `enviar-bitrix24-tributario`, `cnpja-lookup`, `gerar-alertas-tributarios`.
- Substituir `console.log` esparsos por logger estruturado.
- Capturar: `fn_start`, `fn_success`, `fn_failure`, `external_api_call` (com duration_ms e status).

### 4. UI `/admin/edge-health`
- Página admin-only (`ProtectedRoute` + `has_role admin`).
- 3 cards KPI (chamadas 24h, taxa erro 7d, latência p95).
- Tabela por função com sparkline de erros (recharts).
- Drill-down: últimos 50 erros com stack/contexto.
- Rota registrada em `App.tsx`.

### 5. Validação
- `npx tsc --noEmit` zero erros.
- Migration executa limpa.
- Edge functions deploy sem erro.

## Diagrama

```text
   Edge Functions tributárias
            │ (logger.info/warn/error)
            ▼
   _shared/observability.ts
            │ (flush async)
            ▼
   edge_function_logs (RLS admin)
            │
            ▼
   vw_edge_health (security_invoker)
            │
            ▼
   /admin/edge-health (KPIs + tabela)
```

## Observações
- Logger não-bloqueante: erros de log nunca derrubam a edge function.
- Sem novos secrets.
- Próximos lotes: P3 (cache CNPJá), P4 (wizard premium), P5 (dashboard v2), P6 (relatório anual).

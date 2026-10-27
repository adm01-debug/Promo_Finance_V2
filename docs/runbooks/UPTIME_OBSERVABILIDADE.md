# Runbook — Uptime externo & Observabilidade

## Por que monitor externo

O app já coleta telemetria interna (`edge_function_logs`, `web-vitals` em
`src/lib/telemetry.ts`, Sentry). Mas quem mede "o app caiu" não pode ser o
próprio app — um monitor externo precisa apontar para endpoints públicos.

## Endpoints para monitoramento

| Alvo                                                           | Método | Esperado                | O que prova                                            |
| -------------------------------------------------------------- | ------ | ----------------------- | ------------------------------------------------------ |
| `https://app.promo-finance.com/`                               | GET    | 200 + `<div id="root">` | Frontend (Vercel) no ar                                |
| `https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/health` | GET    | 200 + `{"status":"ok"}` | Edge runtime Supabase no ar                            |
| `https://bwwbeyolnnzppeuhgkcd.supabase.co/rest/v1/`            | GET    | 200/401                 | PostgREST de pé (sem key deve 401 rápido, não timeout) |

> `health/` foi reduzido a liveness de propósito: não expõe service_role,
> versões nem dependências — reconhecimento de infra não é feature pública.

## Configuração sugerida (Better Stack / UptimeRobot / Checkly — qualquer um)

1. Criar monitor HTTP para os 3 alvos, intervalo 60s, timeout 10s.
2. Alerta: e-mail + Slack/WhatsApp após 2 falhas consecutivas (evita flap).
3. Status page pública é opcional; interna basta para o time.

## Onde olhar quando alertar

1. **Frontend caiu (app.promo-finance.com fora):** Vercel → Deployments; rollback
   = "Redeploy" do deploy anterior (imutável).
2. **Edge runtime fora:** Supabase Dashboard → Edge Functions → Logs;
   `edge_function_logs` no Postgres para o último `request_id` recebido.
3. **PostgREST fora:** status.supabase.com + Dashboard → Database; se up mas
   lento, `pg_stat_activity` via `psql $PROD_DB_URL`.
4. **Correlação:** todo request recebe `x-request-id`; funções persistem em
   `edge_function_logs.context.request_id` — filtrar por ele primeiro.

## RUM existente

`web-vitals` reporta CLS/INP/LCP/FCP/TTFB via `src/lib/telemetry.ts`.
Destino: verificar `VITE_TELEMETRY_*`/Sentry no ambiente; sem backend externo
configurado as métricas ficam só em console/debug — configurar endpoint de
ingestão no Sentry Performance ou Similar é a próxima ação desta trilha.


## Lote 9 — Excelência Operacional: Observabilidade + UX Polido + Resiliência

Lotes 1-8 entregaram tributação 10/10, segurança hardenizada (HIBP ON, RLS rate_limit corrigida), 973 testes verdes e cron ativo. Para o **10/10 absoluto sustentado**, atacar agora os 3 eixos restantes: observabilidade do cron, polimento de UX nos novos componentes e resiliência de Edge Functions.

### 1. Observabilidade do cron tributário
- Criar `src/components/admin/CronJobsStatus.tsx` consumindo `cron.job_run_details` via RPC `get_cron_status` (security definer, admin-only).
- Adicionar card em `Configuracoes` mostrando: última execução, status (success/failure), próxima execução, alertas gerados nas últimas 24h.
- Migration: criar RPC `get_cron_run_history(job_name text)` com `SECURITY DEFINER` + `has_role('admin')`.

### 2. Banner admin para HIBP/pg_net (transparência)
- `src/components/configuracoes/SecurityStatusBanner.tsx`: card visual confirmando HIBP=ON e documentando pg_net como dívida técnica aceita.
- Visível apenas para `admin` via `useUserRole`.

### 3. Resiliência de Edge Functions tributárias
- Auditar `gerar-alertas-tributarios`, `simular-regimes`, `analisar-elisao`: garantir try/catch top-level, structured logging (`console.log(JSON.stringify({level,event,...}))`), timeout em fetches externos (AbortController 30s).
- Retry com exponential backoff em chamadas Supabase falhas (padrão `mem://integrations/bling-erp-v3-estrategia-e-resiliencia`).

### 4. UX — feedback em ações longas
- `SimulacaoRegimes`: progress indicator durante cálculo dos 3 regimes (Skeleton steps).
- `OportunidadesElisao`: empty state ilustrado quando nenhuma oportunidade encontrada.
- `CsvImportDialog`: barra de progresso por linha processada (já tem contagem, falta visual).

### 5. Testes E2E dos motores de elisão
- `orquestrador-elisao.test.ts`: cobertura de todas as 5+ estratégias (Lucro Real vs Presumido, PAT, Lei do Bem, Reorganização Societária).
- Edge cases: empresa sem despesas dedutíveis, oportunidade < threshold mínimo (R$ 1k), múltiplas estratégias conflitantes.

### 6. Validação final
- `npx tsc --noEmit` zero erros.
- `npx vitest run` 100% verde (~990 testes).
- `supabase--linter` mantém 1 warning (pg_net documentado).

## Diagrama

```text
   Lote 8 (Projeto 10/10)
            │
            ▼
   ┌────────────────────────┐
   │ Cron observability UI  │──┐
   └────────────────────────┘  │
   ┌────────────────────────┐  │
   │ HIBP/security banner   │──┤
   └────────────────────────┘  ▼
   ┌────────────────────────┐  ┌──────────────────┐
   │ Edge Fn resilience     │─▶│ 10/10 sustentado │
   └────────────────────────┘  │  + observável    │
   ┌────────────────────────┐  └──────────────────┘
   │ UX progress + tests    │──▲
   └────────────────────────┘
```

## Observações

- Sem mexer em `client.ts`, `types.ts`, `supabase/config.toml`.
- 1 migration nova: RPC `get_cron_run_history` (security definer + admin gate).
- Após este lote: **10/10 absoluto sustentado** com observabilidade operacional do cron e UX premium nos novos fluxos.

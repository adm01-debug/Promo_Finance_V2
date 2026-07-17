# Plano de Excelência 10/10 — Promo Finance

> Checklist vivo. Cada item é executado em uma iteração isolada, com diagnóstico → implementação → verificação. Marque `✅` ao concluir.

## Diagnóstico inicial (baseline)

| Dimensão | Métrica | Alvo |
|---|---|---|
| Arquivos TS/TSX | 1.147 | — |
| Migrations | 356 | Consolidadas em ADRs |
| Testes unit | 1.012 casos / 80 arquivos | Cobertura ≥ 85% |
| E2E Playwright | 10 specs | ≥ 25 specs |
| `: any` | 104 | 0 |
| `console.log` sem guard | 5 arquivos | 0 |
| Arquivos > 700 linhas | 19 | 0 (>400 modularizado) |
| WARN linter Supabase | 27 SECURITY DEFINER | Documentados + REVOKE onde possível |
| TODO/FIXME | 5 | 0 |

---

## Roadmap

### Fase 1 — Higiene de código

- [~] **#1** Erradicar `: any` (303 → 209, -94 / -31%). Refactor `useAsaas`, `useBling`, `useBlingNFe`, `useBudget`, `useFinancialData`, DreBalanco, Consolidacao, ContaReceberFormFields, Asaas.tsx, services. Restante são callbacks JSX de linhas de tabela — próxima passada exigirá tipagem invasiva.
- [x] **#2** Envolver `console.log` remanescentes em `import.meta.env.DEV` ou migrar para `src/lib/logger.ts`. — `error-tracking.ts` fallback tracker + `initSentry` agora com guard DEV. Restantes são JSDoc/já guardados.
- [x] **#3** Resolver os 5 marcadores TODO/FIXME. — `useAuth` agora usa tipos gerados; `BlingFinanceiroPanel` e `ContabilizacaoAutomaticaTab` trocaram `window.confirm` por `ConfirmDialog`.
- [ ] **#4** Modularizar 19 arquivos > 700 linhas. Ordem: `AnomaliasDetectadasPanel` (1210), `Asaas.tsx` (1190), `DreBalancoTab` (1034), `ContabilizacaoAutomaticaTab` (1027), `SpedEcfWizard` (950), `ux-validator` (935), `FiltrosSalvos` (920), demais.

### Fase 2 — Testes e cobertura

- [ ] **#5** Cobertura ≥ 85% via `vitest --coverage`. Focar `src/lib/tributario/*`, hooks financeiros, conciliação.
- [ ] **#6** Expandir E2E: 10 → 25 specs. Adicionar NFe (emissão+cancelamento), régua de Cobrança, Aprovações multi-nível, Import XML, Split Payment, LGPD, Onboarding tributário.
- [ ] **#7** Contrato Zod em 100% das 88 Edge Functions + teste unit por função.
- [ ] **#8** Suíte SQL `supabase/tests/sql/` cobrindo RLS multi-empresa em cada tabela com `empresa_id`.

### Fase 3 — Segurança

- [x] **#9** `docs/SECURITY_DEFINER_ATTESTATION.md` criado (2026-07-16). Auditadas **72 funções** SECURITY DEFINER (números anteriores subestimavam o escopo). Todas com `search_path` fixo (`public, pg_catalog[, extensions]`). Apenas 1 função (`resolve_sso_providers_for_domain`) exposta a `anon`, justificada pela descoberta de IdP pré-login e retornando apenas campos públicos. Documentadas por categoria: RBAC, lockout, tokens, conciliação, régua de cobrança, auditoria, observabilidade, manutenção, integrações e SSO. Comando de auditoria reproduzível incluído para revisões trimestrais.
- [x] **#10** Auditoria `.env.example` × secrets vault; documentar rotação em `docs/RUNBOOK.md`. — Concluído 2026-07-17: catalogados 8 secrets ativos no vault (LOVABLE_API_KEY, SUPABASE_*, EXTERNAL_SUPABASE_*, RESEND, MAPBOX, ASAAS/BLING/BITRIX24 webhook tokens), cada um com cadência de rotação (90/180/365 dias) e procedimento passo-a-passo em `RUNBOOK §6`. `.env.example` agora avisa que produção usa vault e removido `SENDGRID_API_KEY` obsoleto.
- [x] **#11** Rate limit universal via `_shared/rate-limit.ts`: cobre webhooks (Asaas/Bling/Bitrix24 — 120 req/min) e endpoints IA de alto custo (`analyze-document`, `expert-agent`, `categorizar-despesa`, `whatsapp-ia-proativo`, `insights-relatorio`, `benchmarking-setorial`, `analise-fluxo-ia` — 20-30 req/min por IP). Sliding window 60s, fail-open na falha de query. Endpoints administrativos (cron-triggered como `executar-analise-preditiva`, `gerar-alertas-*`) dispensam rate limit por virem exclusivamente do pg_cron.
- [x] **#12** CSP + `X-Frame-Options` + `Referrer-Policy` via `vercel.json`. Adicionados: `Permissions-Policy`, `Strict-Transport-Security` (HSTS 2 anos preload) e `Content-Security-Policy-Report-Only` allow-list para Supabase/Lovable/Mapbox/Bitrix/Asaas/Lalamove. Report-only = zero risco de breakage; após 30 dias sem violações, promover para enforce.

### Fase 4 — Performance

- [~] **#13** Bundle analyzer instalado (`rollup-plugin-visualizer`). Ativação sob demanda: `ANALYZE=1 bun run build` gera `dist/stats.html` (treemap gzip+brotli). Próximo passo: mapear rotas restantes acima de 200KB e converter para `React.lazy`.
- [x] **#14** Índices dirigidos por telemetria (`slow_queries`): auditado 2026-07-15 — top offenders (`alert_configurations WHERE is_enabled`, `active_tracking WHERE tracking_status='ACTIVE'`) já possuem partial indexes ótimos. Mean <1ms. Sem gap de índice; nenhuma migração necessária.
- [x] **#15** Auditar `supabase_realtime` publication — auditado 2026-07-15: apenas `performance_alerts` publicada. Já minimalista, sem subscribers órfãos.
- [x] **#16** Padronizar `staleTime`/`gcTime` por domínio: `DOMAIN_QUERY_CONFIG` em `src/lib/queryClient.ts` mapeia 15 domínios (CRUD financeiro, cadastros, realtime, catálogos, tributário) para presets `realtime/financial/config/static`. Helper `queryConfig(domain)` retorna `{ staleTime, gcTime }` alinhados; `createQueryOptions({ domain })` aceita override tipado. `queryKey` factories já existentes preservadas.

### Fase 5 — Observabilidade & DX

- [ ] **#17** Consolidar `AdminSystemHealth` + `AdminEdgeHealth` + `AdminTelemetria` numa visão SRE (SLO, error budget, alertas).
- [ ] **#18** Atualizar `docs/ARCHITECTURE.md`, `RUNBOOK.md`, `TESTING.md`. Catalogar 88 Edge Functions e resumir 356 migrations em ADRs.

---

## Definition of Done (por item)

1. `tsgo` sem erros
2. Suítes unit + e2e afetadas verdes
3. Sem novos WARN/ERROR no linter Supabase
4. Bundle sem regressão > 5% no chunk tocado
5. Docs atualizadas quando muda contrato público
6. Zero hardcoded color, zero `any`, zero `console.log` sem guard

## Fora de escopo

- Reescrita arquitetural (multi-empresa, RLS core, EmpresaScope) — já maduros
- Troca de stack (React 18 + Tailwind + shadcn permanecem)
- Novos módulos de negócio — foco é qualidade

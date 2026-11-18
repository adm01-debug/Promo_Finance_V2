# Promo_Finance_V2 — mapa de integração (12/11/2026)

Referência: `origin/main` em `821385c628`. Comparação por conteúdo, arquivo a arquivo. Só leitura: nada foi mesclado.

| Situação | Peças | Significado |
|---|---:|---|
| na main | 41 | já mesclada |
| incorporada | 4 | conteúdo já está na main (squash/cherry-pick) — pode apagar |
| superada | 10 | a main já tem versão mais nova dos arquivos — pode apagar |
| **pendente** | **73** | tem conteúdo que nunca entrou na main |

Das pendentes: **57 trabalhos únicos** (depois de juntar 14 duplicadas e 7 contidas em outra). PRs abertos: 3.

## Trabalhos pendentes únicos (ordem sugerida: com PR primeiro, depois menores)

| # | Peça | Onde | PR | Arquivos inéditos | Data | Último commit |
|---:|---|---|---|---:|---|---|
| 1 | `claude/chore-prod-readiness-261112-1402` | github | #324 (rascunho) | 1 | 2026-11-12 | Merge remote-tracking branch 'origin/main' into tmp-324-update |
| 2 | `dependabot/bun/mapbox-gl-3.34.2` | github | #293 | 2 | 2026-11-11 | Merge branch 'main' into dependabot/bun/mapbox-gl-3.34.2 |
| 3 | `claude/fix-dashboard-layout-rotulos-261112-1633` | github | #325 (rascunho) | 4 | 2026-11-12 | Merge remote-tracking branch 'origin/main' into tmp-325c |
| 4 | `fix/codex-h0831-reconciliacao-online` | github+local | — | 1 | 2026-08-31 | ci: separa gates e2e críticos da quarentena |
| 5 | `claude/auditoria-tecnica-sistema-9c0mnw` | github | — | 1 | 2026-09-04 | fix(migrations): guard all 11 views in 20260317125441 for Preview incremental mode |
| 6 | `fix/codex-055358-integracoes-financeiras-clean` | github+local | — | 1 | 2026-09-10 | fix: protege integrações e remove dados simulados |
| 7 | `claude/feat-asaas-links-empresa-260924-2128` | github | — | 1 | 2026-09-24 | Merge branch 'main' into claude/feat-asaas-links-empresa-260924-2128 |
| 8 | `chore/db-types-drift-20261019` (+2 iguais) | github | — | 1 | 2026-10-19 | chore(db): regenera tipos Supabase após drift de schema |
| 9 | `chore/db-types-drift-20261026` (+1 iguais) | github | — | 1 | 2026-10-26 | chore(db): regenera tipos Supabase após drift de schema |
| 10 | `claude/vibrant-ride-v14duy` | github | — | 1 | 2026-10-27 | Merge branch 'main' into claude/vibrant-ride-v14duy |
| 11 | `Github_Copilotfix-boletos-types-security-rules-261031` | github | — | 1 | 2026-10-31 | Merge branch 'main' into Github_Copilotfix-boletos-types-security-rules-261031 |
| 12 | `claude/chore-ci-bun-audit-ghsa-311031-2038` | github | — | 1 | 2026-10-31 | chore(ci): adiciona GHSA-g3hv-75wg-m249 e GHSA-3g3m-2fjr-6pw4 ao bun audit ignore |
| 13 | `claude/fix-n8n-tests-261031-1618` | github | — | 1 | 2026-10-31 | Merge branch 'main' into claude/fix-n8n-tests-261031-1618 |
| 14 | `claude/fix-totais-movimentacoes-rpc-311031-1548` | github | — | 1 | 2026-10-31 | feat: migration 20261031154800 ? recriar obter_totais_movimentacoes com signature correta |
| 15 | `chore/db-types-drift-20261109` (+1 iguais) | github | — | 1 | 2026-11-09 | chore(db): regenera tipos Supabase após drift de schema |
| 16 | `dependabot/github_actions/github/codeql-action/autobuild-4.39.1` | github | — | 1 | 2026-11-11 | Merge branch 'main' into dependabot/github_actions/github/codeql-action/autobuild-4.39.1 |
| 17 | `fix/convergencia-destino` | github | — | 2 | 2026-08-25 | docs(adr): E05 — ADR 0001 fonte da verdade migração |
| 18 | `claude/festive-maxwell-d32vus` | github | — | 2 | 2026-10-22 | docs(ci): atualiza prova final — CI Pipeline e Deno pós-merge PR #187 |
| 19 | `dependabot/bun/radix-ui/react-hover-card-1.2.1` | github | — | 2 | 2026-10-27 | Merge branch 'main' into dependabot/bun/radix-ui/react-hover-card-1.2.1 |
| 20 | `dependabot/bun/recharts-3.10.1` | github | — | 2 | 2026-10-27 | Merge branch 'main' into dependabot/bun/recharts-3.10.1 |
| 21 | `importado/local/hermes-workspaces__chat-h102635` | local | — | 2 | 2026-10-29 | importado de /home/joaquim_ataides/hermes-workspaces/chat-h102635 (fix/cline-h102635-pr1-s |
| 22 | `dependabot/bun/nanoid-6.0.2` | github | — | 2 | 2026-10-29 | chore(deps): bump nanoid from 5.1.16 to 6.0.2 |
| 23 | `dependabot/bun/vitest-5.0.5` | github | — | 2 | 2026-10-29 | Merge branch 'main' into dependabot/bun/vitest-5.0.5 |
| 24 | `docs/ci-functions-deploy-pendencia` | github | — | 2 | 2026-10-29 | docs(ci): baseline diagnóstico completo — node_modules parcial, 0 arquivos TS/testes alter |
| 25 | `Github_Copilotpotential-guide` | github | — | 2 | 2026-11-07 | fix: monitor-health e DB_HEALTH (review PR #240) — alertas, webhooks, propagação de erro e |
| 26 | `claude/fix-review-findings-261107-1830` | github | — | 2 | 2026-11-07 | fix: sentry usa EDGE_SENTRY_DSN, checa res.ok e redige context; SENTRY_ENVIRONMENT vira op |
| 27 | `dependabot/bun/multi-75c0a8599d` | github | — | 2 | 2026-11-10 | fix: bump react-dom and @types/react-dom |
| 28 | `dependabot/bun/react-joyride-3.2.0` | github | — | 2 | 2026-11-10 | fix: bump react-joyride from 2.9.3 to 3.2.0 |
| 29 | `dependabot/bun/vitest/ui-5.1.0` | github | — | 2 | 2026-11-12 | Merge branch 'main' into dependabot/bun/vitest/ui-5.1.0 |
| 30 | `claude/auditoria-tecnica-sistema-6909vm` | github | — | 3 | 2026-09-06 | fix(security): exigirPapel() nao respeitava is_active em user_roles |
| 31 | `fix/hermes-strict-burndown-p10` | github | — | 3 | 2026-10-04 | fix(strict): burndown p10 — zera strictNullChecks em hooks/painéis financeiros |
| 32 | `Github_Copilotfeat-sentry-steps44-45-3110-1700` | github | — | 3 | 2026-10-31 | Merge branch 'main' into Github_Copilotfeat-sentry-steps44-45-3110-1700 |
| 33 | `claude/chore-shared-helpers-consolidation-311031-1548` | github | — | 3 | 2026-10-31 | chore: importar timingSafeEqual de _shared/string-utils em mcp-query |
| 34 | `automation/estado-real` | github | — | 3 | 2026-11-12 | chore(docs): estado real do CI e das edge functions [auto] |
| 35 | `fix/hermes-strict-burndown-p1` | github | — | 4 | 2026-10-04 | fix(strict): zera erros de strictNullChecks em BI.tsx e CentroCustoCards.tsx |
| 36 | `fix/hermes-strict-burndown-p3` | github | — | 4 | 2026-10-04 | fix(strict): burndown strictNullChecks p3 — CentroCustos, useContasPagarLogic, useCreditos |
| 37 | `fix/hermes-strict-burndown-p5` | github | — | 4 | 2026-10-04 | fix(strict): burndown P5 — strictNullChecks zerado em contas a receber, dashboard, fluxo d |
| 38 | `importado/local/codex-workspaces__revisao-plano-20260912` | local | — | 4 | 2026-10-29 | importado de /home/joaquim_ataides/codex-workspaces/revisao-plano-20260912 (docs/codex-rev |
| 39 | `claude/fix-rate-limit-functions-311031-1548` | github | — | 4 | 2026-10-31 | fix: rate limit 30 req/min em bling-proxy |
| 40 | `claude/feat-contexto-ia-261108-1520` | github | — | 4 | 2026-11-08 | feat(contexto): manter estado real do projeto automaticamente |
| 41 | `fix/cline-h120728-indice-e-matrizes` | local | — | 5 | 2026-08-31 | docs: causa raiz do shard 3 confirmada — HTTP 400 do Supabase Auth no setup, pré-existente |
| 42 | `fix/hermes-strict-burndown-p8` | github | — | 5 | 2026-10-04 | fix(strict): burndown parcial — 33 erros strictNullChecks em 12 arquivos (forms, KPIs, pai |
| 43 | `inventario` | github | — | 5 | 2026-11-12 | chore(inventario): estado real @ main 6e462aa [skip ci] |
| 44 | `base44/setup-328ba9d4` | github | — | 6 | 2026-08-22 | File changes |
| 45 | `wip-squash-253` | local | — | 6 | 2026-11-08 | fix(ci): isola o contrato de deploy da verificacao pos-deploy |
| 46 | `claude/fix-ci-hardening-260927-2000` | github | — | 7 | 2026-09-27 | fix(ci): escopa gitleaks a commits novos da PR (--log-opts) para evitar falso positivo em  |
| 47 | `importado/local/codex-workspaces__chat-054955` | local | — | 7 | 2026-10-29 | importado de /home/joaquim_ataides/codex-workspaces/chat-054955 (fix/codex-054955-integrac |
| 48 | `claude/chore-ddl-steps12-23-311026-1942` | github | — | 7 | 2026-10-31 | chore: DDL steps 12-16, 19, 21 — RLS, índices duplicados, autovacuum, FK indexes, NOT NULL |
| 49 | `claude/chore-manutencao-local-261110-0831` | local | — | 7 | 2026-11-10 | fix(manutencao): alinha scripts ao lint e à formatação locais |
| 50 | `fix/notify-alert-projeto-destino` | github | — | 9 | 2026-09-10 | fix: rename tipo_cobranca 'cartao' → 'cartao_credito'/'cartao_debito' |
| 51 | `fix/codex-h0831-gates-pos-merge` | github+local | — | 12 | 2026-08-31 | fix: blinda replay historico do schema |
| 52 | `fix/codex-auditoria-financeira-20260910` | github+local | — | 14 | 2026-09-10 | docs: auditar fluxos financeiros e planejar 100 etapas |
| 53 | `importado/local/hermes-workspaces__chat-c696391` (+1 iguais) | local | — | 47 | 2026-10-29 | importado de /home/joaquim_ataides/hermes-workspaces/chat-c696391 (fix/codex-c696391-contr |
| 54 | `claude/chore-supabase-js-2118-2507-1830` | github | — | 67 | 2026-10-31 | chore: atualizar supabase-js 2.49.4→2.118.0 nas edge functions |
| 55 | `claude/resolve-conflicting-prs-rborrh` | github | — | 139 | 2026-09-07 | fix(rls): add empresa_id column before policy creation in grupo_b1 |
| 56 | `claude/lint-zero-261112` | local | — | 301 | 2026-11-12 | fix(tipos): remover caminhos absolutos da máquina local dos tipos extraídos |
| 57 | `contexto` | github | — | 1036 | 2026-11-12 | chore(contexto): 1 fonte(s) regerada(s) @ main 51d0405 [skip ci] |

## Arquivos disputados (mais de um trabalho pendente mexe neles — risco de conflito)

| Arquivo | Trabalhos |
|---|---:|
| `package.json` | 9 |
| `bun.lock` | 8 |
| `src/pages/DashboardReceber.tsx` | 6 |
| `src/hooks/useConformidadeFiscal.ts` | 5 |
| `src/hooks/useAsaas.ts` | 5 |
| `.github/workflows/ci.yml` | 4 |
| `supabase/functions/n8n-callback/index.ts` | 4 |
| `src/integrations/supabase/types.ts` | 3 |
| `supabase/functions/_shared/auth-guard.ts` | 3 |
| `src/components/dashboard/DashboardExecutivo.tsx` | 3 |
| `supabase/functions/bling-proxy/index.ts` | 3 |
| `src/pages/Cobrancas.tsx` | 2 |
| `supabase/migrations/20260317125441_706a518a-22f2-405a-8490-9d9a45468eab.sql` | 2 |
| `deno.lock` | 2 |
| `PENDENCIAS.md` | 2 |
| `RELATORIO_CI.md` | 2 |
| `supabase/functions/_shared/sentry.ts` | 2 |
| `vite.config.ts` | 2 |
| `e2e/auth/admin-rbac.e2e.ts` | 2 |
| `supabase/functions/ci-security-gate-log/index.ts` | 2 |
| `supabase/functions/copilot-global/index.ts` | 2 |
| `supabase/functions/asaas-proxy/index.ts` | 2 |
| `supabase/functions/analise-preditiva/index.ts` | 2 |
| `src/pages/BI.tsx` | 2 |
| `src/pages/CentroCustos.tsx` | 2 |
| `src/hooks/useContasReceberLogic.ts` | 2 |
| `vercel.json` | 2 |
| `README.md` | 2 |
| `src/components/contas-pagar/ContaPagarForm.tsx` | 2 |
| `src/components/contas-receber/ContaReceberFormFields.tsx` | 2 |
| `supabase/functions/_shared/validation.ts` | 2 |
| `supabase/functions/nfe-upload-certificado/index.ts` | 2 |
| `supabase/functions/decidir-regime/index.ts` | 2 |
| `supabase/functions/cnpja-lookup/index.ts` | 2 |
| `supabase/functions/enviar-alerta-email/index.ts` | 2 |
| `supabase/functions/bitrix24-sync/index.ts` | 2 |
| `supabase/functions/gerar-sped-ecf/index.ts` | 2 |
| `supabase/functions/gerar-sped-ecd/index.ts` | 2 |
| `supabase/functions/log-sped-bitrix24/index.ts` | 2 |
| `supabase/functions/contabilizar-evento/index.ts` | 2 |

## Podem ser apagadas sem perda (14)

Branches cujo conteúdo já está na main ou foi superado. Lista completa em `~/.cache/mapa-integracao/Promo_Finance_V2.json`.

- `fix/codex-865421-followup-hardening` (superada, local)
- `fix/codex-865421-hardening-release` (superada, local)
- `fix/cline-h096562-lote-a-baseline` (incorporada, local)
- `fix/hermes-h095244-handoff-cline` (superada, local)
- `fix/codex-financial-hardening-20260910` (superada, local)
- `feat/codex-graphify-20260911` (superada, local)
- `feat/codex-graphify-expansao-20260911` (superada, local)
- `fix/codex-p1-09120905-acl-rpcs-admin` (superada, local)
- `chore/deps-lote-29-10` (superada, local)
- `Github_Copilotfix-monitor-health-review` (superada, github)
- `Github_Copilotfix-ts2345-evidencias-261107-1355` (incorporada, github)
- `claude/chore-docs-agentes-261108-1950` (incorporada, github)
- `dependabot/bun/eslint-config-prettier-10.1.8` (superada, github)
- `fix/monitor-health-review-main-261107` (incorporada, github)

# Relatório de PRs — Promo Finance V2

> Gerado por sessão `session_01N1ArYN9EZ2fbFJ2Z2rqAh1` em 2026-11-09T03:30Z  
> Baseline main SHA início: `c6eb99b275e1270cf99f1216e808c120f7cf58a2`  
> Main SHA final: `93026e683e6cbb96257a165831c18a988b0fb887` (8/8 required SUCCESS + E2E Quarantine SUCCESS)

---

## Resumo Executivo

| Categoria | Qtd | PRs |
|---|---|---|
| Mergeadas esta sessão (CI 100% verde) | 9 | #266–#273, #278 |
| Fechadas supersedidas | 5 | #213, #214, #215, #254, #257 |
| Fechadas externamente | 2 | #209, #264 |
| **AGUARDANDO HUMANO** | **19** | ver seção abaixo |
| Bloqueadas por ambiente | 3 | #208, #210, #216 |
| Outras sessões (somente leitura) | 5 | #274, #275, #276, #277, #279 |

**Total rastreado nesta sessão: 43**

---

## PRs Mergeadas Esta Sessão

| # | Título | SHA main | Checks |
|---|---|---|---|
| [#266](https://github.com/adm01-debug/Promo_Finance_V2/pull/266) | fix framer-motion 14.x types | `6a925600` | 8/8 SUCCESS |
| [#267](https://github.com/adm01-debug/Promo_Finance_V2/pull/267) | fix dnd-kit sortable 7→10 | `020bb81e` | 8/8 SUCCESS |
| [#268](https://github.com/adm01-debug/Promo_Finance_V2/pull/268) | bump eslint-config-prettier 9→10 | `d8804a20` | 8/8 SUCCESS |
| [#269](https://github.com/adm01-debug/Promo_Finance_V2/pull/269) | fix eslint-plugin-react-refresh | `45a20a25` | 8/8 SUCCESS |
| [#270](https://github.com/adm01-debug/Promo_Finance_V2/pull/270) | fix TS2345 gerar-pacote-evidencias | `1f5138a7` | 8/8 SUCCESS (Zod gate: flake descartado) |
| [#271](https://github.com/adm01-debug/Promo_Finance_V2/pull/271) | fix monitor-health review #240 | `924e4a01` | 8/8 SUCCESS |
| [#272](https://github.com/adm01-debug/Promo_Finance_V2/pull/272) | docs/agentes update | `d83f82e6` | 8/8 SUCCESS |
| [#273](https://github.com/adm01-debug/Promo_Finance_V2/pull/273) | documentação analise-prs + progresso.json | `93026e68` | 8/8 SUCCESS |
| [#278](https://github.com/adm01-debug/Promo_Finance_V2/pull/278) | fix micro-interactions.tsx spring const | `8d88a61f` | 8/8 SUCCESS |

Nenhuma PR mergeada tocou: `.github/workflows/`, migrations SQL, secrets, edge functions R2.  
Nenhum padrão proibido introduzido: `.skip`, `@ts-ignore`, `eslint-disable`, `any` de calar erro, baseline ampliado.

---

## PRs Fechadas Supersedidas

| # Fechada | Supersedida por | Motivo |
|---|---|---|
| [#213](https://github.com/adm01-debug/Promo_Finance_V2/pull/213) | #267 | bump @dnd-kit/sortable 7→10 — conteúdo idêntico, coberto por #267 |
| [#214](https://github.com/adm01-debug/Promo_Finance_V2/pull/214) | #268 | bump eslint-config-prettier 9→10 — conteúdo idêntico, coberto por #268 |
| [#215](https://github.com/adm01-debug/Promo_Finance_V2/pull/215) | #269 | bump eslint-plugin-react-refresh 0.4→0.5 — coberto por #269 |
| [#254](https://github.com/adm01-debug/Promo_Finance_V2/pull/254) | #270 | fix TS2345 gerar-pacote-evidencias (original) — coberto por #270 |
| [#257](https://github.com/adm01-debug/Promo_Finance_V2/pull/257) | #271 | monitor-health review #240 (original) — coberto por #271 |

Todas fechadas por `github_update_pull_request state=closed` em 2026-11-09T03:20Z.

---

## PRs Fechadas Externamente

| # | Motivo |
|---|---|
| [#209](https://github.com/adm01-debug/Promo_Finance_V2/pull/209) | Fechada pelo Dependabot após #266 mergear equivalente; não fechada por esta sessão |
| [#264](https://github.com/adm01-debug/Promo_Finance_V2/pull/264) | Fechada externamente (conteúdo coberto por #272 mergeada); não fechada por esta sessão |

---

## Dossiês — AGUARDANDO HUMANO

### #131 — fix: shims para Supabase Preview (conflito de 90 arquivos)

- **Branch:** `claude/fix-supabase-preview-cron-260928-1235`
- **SHA head:** `f204ec07dc268043bd5215e10fcf769d6b7ee7a3`
- **Válido:** Sim — shims de tipo para replay em Supabase Preview (`DROP FUNCTION IF EXISTS get_cron_jobs()` nos timestamps 20260518153329 e 20260728110752)
- **Já implementado:** Desconhecido — migrations posteriores podem já cobrir o shim; requer análise
- **Regressão:** Sim, risco alto — DDL em produção sem revisão pode remover função em uso
- **Completo:** Não — PR tem 90 arquivos alterados (+9333/-3999), 188 commits acumulados desde set/26, indica refactoring amplo não relacionado ao título
- **Causa da falha:** `mergeable=CONFLICTING` (90 arquivos em conflito com main); Quality Gate FAILURE
- **Regra 8:** DDL/migration que roda em produção + decisão de escopo (90 arquivos)
- **Veredicto:** **AGUARDANDO HUMANO** — requer decisão do dono sobre o que aproveitar desta branch vs. criar PR cirúrgica apenas com os shims

---

### #175 — chore(deps): bump recharts 2.15.4 → 3.10.1 (Dependabot)

- **Branch:** `dependabot/bun/recharts-3.10.1`
- **SHA head:** `4f2e3778f5fc34aac27da984b52976bb9d916d50`
- **Válido:** Sim — bump de versão legítimo do Dependabot
- **Já implementado:** Não
- **Regressão:** Sim, garantida — recharts 3.x tem breaking changes em API de eixos, legendas e composição; a PR só atualiza `package.json` e `bun.lock` sem adaptar os componentes que usam a API v2
- **Completo:** Não — falta migrar chamadas de API nos componentes React que usam recharts (eixos, legendas, Tooltip, composição)
- **Causa da falha:** Quality Gate FAILURE (TypeScript errors de API incompatível); `bun install` bloqueado no ambiente (ProxyConnectFailed 403)
- **Regra 8:** Mudança de arquitetura (breaking API em componentes financeiros visuais)
- **Veredicto:** **AGUARDANDO HUMANO** — requer migração de código nos componentes antes do bump; não é merge direto

---

### #203 — Dependabot: codeql-action/analyze

- **Válido:** Sim | **Completo:** Sim | **Regressão:** Baixo risco
- **Causa da falha:** Analyze TypeScript FAILURE (pre-existente em main, não causada por esta PR); `mergeable=BEHIND`
- **Regra 8:** Altera `.github/workflows/codeql.yml`
- **Veredicto:** **AGUARDANDO HUMANO** — Regra 8 (workflow CI)

---

### #204 — Dependabot: codeql-action/init

- **Válido:** Sim | **Completo:** Sim | **Regressão:** Baixo risco
- **Causa da falha:** Analyze TypeScript FAILURE (pre-existente); `mergeable=BEHIND`
- **Regra 8:** Altera `.github/workflows/codeql.yml`
- **Veredicto:** **AGUARDANDO HUMANO** — Regra 8 (workflow CI)

---

### #205 — Dependabot: codeql-action/autobuild

- **Válido:** Sim | **Completo:** Sim | **Regressão:** Baixo risco
- **Causa da falha:** Analyze TypeScript FAILURE (pre-existente); `mergeable=BEHIND`
- **Regra 8:** Altera `.github/workflows/codeql.yml`
- **Veredicto:** **AGUARDANDO HUMANO** — Regra 8; ideal: mergear #203+#204+#205 num único commit que atualiza codeql.yml

---

### #206 — Dependabot: múltiplos workflows (5 arquivos)

- **Válido:** Sim | **Completo:** Sim | **Regressão:** Médio risco (5 workflows simultâneos)
- **Causa da falha:** Quality Gate FAILURE (pre-existente em main); `mergeable=BEHIND`
- **Regra 8:** Altera `.github/workflows/` (ci.yml, codeql.yml, deno-tests.yml, dependency-review.yml, actionlint.yml)
- **Veredicto:** **AGUARDANDO HUMANO** — Regra 8 (múltiplos workflows CI)

---

### #208 — Dependabot: bump com bun.lock conflitante

- **Válido:** Sim
- **Causa da falha:** `bun.lock CONFLICTING` — resolução requer `bun install` que falha com ProxyConnectFailed 403 neste ambiente
- **Veredicto:** **BLOQUEADO AMBIENTE** — `bun install` inacessível nesta sessão

---

### #210 — Dependabot: bump com bun.lock conflitante

- **Válido:** Sim
- **Causa da falha:** `bun.lock CONFLICTING` — mesma causa de #208
- **Veredicto:** **BLOQUEADO AMBIENTE** — `bun install` inacessível nesta sessão

---

### #211 — Dependabot: zod 3→4 major

- **Válido:** Sim | **Já implementado:** Não
- **Regressão:** Sim, garantida — zod v4 breaking changes; app usa API v3; PR só bumpa sem adaptar 105 edge functions + componentes
- **Causa da falha:** Quality Gate FAILURE (TypeScript errors da API incompatível)
- **Regra 8:** Mudança de arquitetura (zod v4 = migração extensiva de toda a camada de validação)
- **Veredicto:** **AGUARDANDO HUMANO** — requer plano de migração; não é merge direto

---

### #212 — Dependabot: react-dom 18→19

- **Válido:** Sim | **Já implementado:** Não
- **Regressão:** Sim, garantida — peerDependency mismatch react ^18.2.0 + react-dom 19; breaking APIs React 19
- **Causa da falha:** Quality Gate FAILURE (peerDependency mismatch + breaking API)
- **Regra 8:** Mudança de arquitetura (React 19 = migração maior)
- **Veredicto:** **AGUARDANDO HUMANO** — requer migração coordenada react + react-dom

---

### #216 — Dependabot: vitest major + bun.lock conflitante

- **Válido:** Sim
- **Causa da falha:** `bun.lock CONFLICTING` + vitest major breaking changes; Quality Gate FAILURE
- **Veredicto:** **BLOQUEADO AMBIENTE** — duplo bloqueio: `bun install` inacessível + vitest major requer análise

---

### #234 — Migration SQL: cron_step43_espacar_diagnosticos

- **Válido:** Sim | **Completo:** Sim | **Regressão:** Baixo risco se idempotente
- **Causa da falha:** Nenhuma — CI SUCCESS, apenas `mergeable=BEHIND`
- **Regra 8:** DDL/migration em produção
- **Veredicto:** **AGUARDANDO HUMANO** — Regra 8; CI verde, pronta para o dono aprovar

---

### #235 — 5 Migrations SQL (202604*.sql)

- **Válido:** Sim | **Completo:** Sim
- **Causa da falha:** Nenhuma — CI SUCCESS, apenas `mergeable=BEHIND`
- **Regra 8:** DDL/migration em produção (5 arquivos)
- **Veredicto:** **AGUARDANDO HUMANO** — Regra 8; CI verde, pronta para o dono aprovar

---

### #238 — Migration SQL: registrar_grupo_b_rls_cross_tenant

- **Válido:** Sim | **Completo:** Sim | **Regressão:** Médio risco (RLS cross-tenant crítico)
- **Causa da falha:** Nenhuma — CI SUCCESS, apenas `mergeable=BEHIND`
- **Regra 8:** DDL/migration em produção + RLS
- **Veredicto:** **AGUARDANDO HUMANO** — Regra 8; CI verde, requer revisão de RLS

---

### #243 — Migration SQL: drop_idle_indexes (dropa 404 índices)

- **Válido:** Sim | **Completo:** Sim | **Regressão:** Alto risco potencial (404 índices = mudança estrutural)
- **Causa da falha:** Nenhuma — CI SUCCESS, apenas `mergeable=BEHIND`
- **Regra 8:** DDL/deleção de dado (irreversível)
- **Veredicto:** **AGUARDANDO HUMANO** — Regra 8 (deleção); CI verde, requer aprovação explícita do dono

---

### #253 — feat: verificação pós-deploy + redação de log (edge-deploy)

- **Branch:** `Github_Copilotfeat-edge-deploy-verificacao` (SHA `007d6aea`)
- **Válido:** Sim — `scripts/edge-deploy/` com health-check, smoke-test, verify-remote + 7 test suites (35/35 passando)
- **Já implementado:** Não
- **Regressão:** Baixo risco no código; alto risco CI: gitleaks detectou token real em fixture
- **Completo:** Não — `scripts/edge-deploy/fixtures/deploy-log-all-*.txt` contém token real
- **Causa da falha:** gitleaks FAILURE — token detectado em `deploy-log-all-36583351162.txt`; Quality Gate FAILURE derivado
- **Regra 8:** (1) gitleaks: token deve ser revogado externamente + arquivo removido; (2) PR body do autor rotulada "Regra 8"; (3) edge deploy scripts = infraestrutura
- **Veredicto:** **AGUARDANDO HUMANO** — ação necessária: revogar o token no serviço de origem, depois aprovar

---

### #255 — edge function: asaas-proxy (pagamento)

- **Válido:** Sim | **Completo:** Sim
- **Causa da falha:** Nenhuma — CI SUCCESS, apenas `mergeable=BEHIND`
- **Regra 8:** Edge function R2 de pagamento (asaas-proxy = boletos, PIX, cobrança)
- **Veredicto:** **AGUARDANDO HUMANO** — Regra 8; CI verde, pronta para o dono aprovar

---

### #256 — duplicata obsoleta de #257 (já supersedida por #271)

- **Válido:** Duplicata — #257 foi supersedida por #271 que já foi mergeada
- **Já implementado:** Sim — conteúdo coberto por #271 (SHA `924e4a01`)
- **Regra 8:** Branch alheia; decisão de fechar cabe ao dono
- **Veredicto:** **AGUARDANDO HUMANO** — conteúdo já mergeado; dono pode fechar

---

### #263 — altera .github/workflows/ci.yml

- **Válido:** Sim | **Completo:** 7/8 required SUCCESS ao verificar
- **Regra 8:** Altera `.github/workflows/ci.yml` (workflow principal de CI)
- **Veredicto:** **AGUARDANDO HUMANO** — Regra 8 (workflow CI crítico)

---

### #265 — adiciona .github/workflows/inventario-estado.yml

- **Válido:** Sim | **Completo:** Sim — CI SUCCESS, `mergeable=BEHIND`
- **Regra 8:** Adiciona novo arquivo `.github/workflows/`
- **Veredicto:** **AGUARDANDO HUMANO** — Regra 8 (workflow CI)

---

## PRs de Outras Sessões (somente leitura)

| # | Título resumido | Estado | Regra |
|---|---|---|---|
| [#274](https://github.com/adm01-debug/Promo_Finance_V2/pull/274) | docs/agentes/sistema.md (outra sessão) | BLOCKED/CI in_progress | outra sessão |
| [#275](https://github.com/adm01-debug/Promo_Finance_V2/pull/275) | adiciona .github/workflows/estado-real.yml | BEHIND | Regra 8 workflow |
| [#276](https://github.com/adm01-debug/Promo_Finance_V2/pull/276) | adiciona .github/workflows/auto-update-pr-branch.yml | BEHIND | Regra 8 workflow |
| [#277](https://github.com/adm01-debug/Promo_Finance_V2/pull/277) | adiciona .github/workflows/settings-guard.yml | BEHIND | Regra 8 workflow |
| [#279](https://github.com/adm01-debug/Promo_Finance_V2/pull/279) | docs/agentes/mapa-repo.md (outra sessão) | BLOCKED/CI in_progress | outra sessão |

---

## Estado Final do main

| Item | Valor |
|---|---|
| SHA baseline (início) | `c6eb99b275e1270cf99f1216e808c120f7cf58a2` |
| SHA atual | `93026e683e6cbb96257a165831c18a988b0fb887` |
| Required checks (8/8) | SUCCESS |
| E2E Quarantine (non-blocking) | SUCCESS (job 128952881128, 03:16:32Z) |
| statusCheckRollup | SUCCESS |
| Vercel deploy | SUCCESS |

---

## Auditoria de Compliance

- Nenhum merge tocou `.github/workflows/`
- Nenhum merge tocou migrations SQL
- Nenhum merge tocou edge functions R2 (asaas, pagamento, cobrança)
- Nenhum padrão proibido: `.skip`, `@ts-ignore`, `eslint-disable`, `any` de calar erro, baseline ampliado, `--no-verify`
- Nenhuma PR alheia editada, comentada ou mergeada por esta sessão
- 5 PRs supersedidas fechadas com evidência (timestamp de closure)
- Segredos: nenhum em código, commit ou resposta

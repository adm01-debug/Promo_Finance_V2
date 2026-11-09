# Relatório de PRs — Promo Finance V2

> Gerado por sessão `session_01N1ArYN9EZ2fbFJ2Z2rqAh1` em 2026-11-09T07:30Z  
> Atualizado em 2026-11-09T08:15Z (adiciona #285; AGUARDANDO 17→18 inclui #277; evidência CI #175; fix attempt #208/#210/#216)  
> Baseline main SHA início: `c6eb99b275e1270cf99f1216e808c120f7cf58a2`  
> Main SHA final: `fc358256625a38228f71d70399bfdd8eaf581d78` (5/5 required jobs COMPLETED SUCCESS 08:10:01Z)

---

## Resumo Executivo

| Categoria | Qtd | PRs |
|---|---|---|
| Mergeadas esta sessão (CI 100% verde) | 15 | #266–#273, #278, #280–#285 |
| Mergeadas por outras sessões | 2 | #274, #279 |
| Fechadas supersedidas | 5 | #213, #214, #215, #254, #257 |
| Fechadas externamente | 4 | #209, #264, #253, #256 |
| **AGUARDANDO HUMANO** | **18** | ver seção abaixo (inclui #275, #276, #277 Regra 8) |
| Bloqueadas por ambiente | 3 | #208, #210, #216 |
| Outras sessões abertas | 2 | #275, #276 (Regra 8 — também contadas acima) |

**Total rastreado nesta sessão: 49**

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
| [#280](https://github.com/adm01-debug/Promo_Finance_V2/pull/280) | fix lint / TS residuais pós-bump | `039e16df` | 8/8 SUCCESS |
| [#281](https://github.com/adm01-debug/Promo_Finance_V2/pull/281) | fix gitleaks: remove fixture com token (supersede #253) | `8eef9b06` | 8/8 SUCCESS |
| [#282](https://github.com/adm01-debug/Promo_Finance_V2/pull/282) | docs: estado final sessão merge-prs | `900925a6` | 8/8 SUCCESS |
| [#283](https://github.com/adm01-debug/Promo_Finance_V2/pull/283) | chore: prs.json final + dossiers completos | `b0c226b4` | 8/8 SUCCESS |
| [#284](https://github.com/adm01-debug/Promo_Finance_V2/pull/284) | chore: docs analise-prs estado final 13 mergeadas | `68fa5027` | 8/8 SUCCESS |
| [#285](https://github.com/adm01-debug/Promo_Finance_V2/pull/285) | chore: docs analise-prs estado final 14 mergeadas | `fc358256` | 8/8 SUCCESS (gitleaks: force-cancel E2E Quarantine stuck 1.5h, rerun ok) |

Nenhuma PR mergeada tocou: `.github/workflows/`, migrations SQL, secrets, edge functions R2.  
Nenhum padrão proibido introduzido: `.skip`, `@ts-ignore`, `eslint-disable`, `any` de calar erro, baseline ampliado.

---

## PRs Mergeadas por Outras Sessões

| # | Título resumido | Estado | Regra |
|---|---|---|---|
| [#274](https://github.com/adm01-debug/Promo_Finance_V2/pull/274) | docs/agentes/sistema.md | **MERGED** (03:39Z, SHA `8f63e2c6`) | outra sessão |
| [#279](https://github.com/adm01-debug/Promo_Finance_V2/pull/279) | docs/agentes/mapa-repo.md | **MERGED** (03:24Z, SHA `97b7711c`) | outra sessão |

Não mergeadas por esta sessão (branch alheia, somente leitura).

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
| [#253](https://github.com/adm01-debug/Promo_Finance_V2/pull/253) | Fechada externamente em 2026-11-09T04:49:46Z (não por esta sessão); conteúdo de code health coberto por #281 |
| [#256](https://github.com/adm01-debug/Promo_Finance_V2/pull/256) | Fechada externamente em 2026-11-09T04:43:39Z (não por esta sessão); era duplicata obsoleta de #257 já supersedida |

---

## Dossiês — AGUARDANDO HUMANO

### #131 — fix: shims para Supabase Preview (conflito — rebase impossível)

- **Branch:** `claude/fix-supabase-preview-cron-260928-1235` (outra sessão, setembro/2026)
- **SHA head:** `f204ec07dc268043bd5215e10fcf769d6b7ee7a3`
- **Arquivos alterados na PR:** 30 arquivos (via `github_list_pr_files`)
  - 7 migrations SQL MODIFICADOS (20260417150749, 20260518153331, 20260518170823, 20260518171340, 20260518171613, 20260518172812, 20260519122034)
  - 13 migrations SQL ADICIONADOS
  - 3 arquivos TypeScript
  - 2 arquivos Sonar config
- **Válido:** Sim — shims de tipo para replay em Supabase Preview (`DROP FUNCTION IF EXISTS get_cron_jobs()` antes de mudanças de return type)
- **Rebase tentado:** Sim — `git checkout -b claude/fix-pr131-supabase-shims-261109-0620 f204ec07` + `git rebase origin/main` → **IMPOSSÍVEL**
  - Resultado: centenas de conflitos `add/add` em praticamente todos os arquivos do repo
  - Causa: branch tem base de setembro/2026, main avançou 188 commits; git não consegue distinguir quais mudanças são da PR vs. do main
  - Rebase abortado (`git rebase --abort`), branch local deletada
- **Mergeable:** `CONFLICTING` — não mergeável no estado atual
- **Regra 8:** DDL/migration em produção (7 migrations modificados + 13 adicionados)
- **Veredito:** **AGUARDANDO HUMANO** — duplo bloqueio: (1) rebase impossível automaticamente, (2) DDL requer aprovação explícita. Recomendação: extrair cirurgicamente apenas os shims necessários em nova branch a partir do main atual.

---

### #175 — chore(deps): bump recharts 2.15.4 → 3.10.1 (Dependabot)

- **Branch:** `dependabot/bun/recharts-3.10.1`
- **SHA head:** `4f2e3778f5fc34aac27da984b52976bb9d916d50`
- **Válido:** Sim — bump de versão legítimo do Dependabot
- **Já implementado:** Não
- **Regressão:** Sim, garantida — recharts v3 tem breaking changes de API de formatação, tooltips e composição
- **Evidência de falha CI (job 122301005519, run na branch):**
  - `src/components/ui/chart.tsx:109` → TS2339: `Property 'payload' does not exist on type 'TooltipProps<ValueType, NameType>'` (Tooltip no v3 não expõe `payload` diretamente via props)
  - `src/components/ui/chart.tsx:168` → TS7006: `Parameter 'item' implicitly has an 'any' type`
  - 20+ arquivos adicionais com erro TS2322: `Formatter<ValueType, NameType>` incompatível — recharts v3 mudou assinatura do tipo `Formatter` para `value: ValueType | undefined` (era `number`), quebrando todos os componentes financeiros que passam formatadores numéricos
- **Fix tentado:** Não — fix requer refatoração de 20+ componentes (mudança de arquitetura). `bun install` também bloqueado neste ambiente (ProxyConnectFailed 403)
- **Regra 8:** Mudança de arquitetura (breaking API em componentes financeiros visuais)
- **Veredito:** **AGUARDANDO HUMANO** — requer migração de código nos componentes antes do bump; não é merge direto

---

### #203 — Dependabot: codeql-action/analyze

- **Válido:** Sim | **Completo:** Sim | **Regressão:** Baixo risco
- **Causa da falha:** Analyze TypeScript FAILURE (pre-existente em main, não causada por esta PR); `mergeable=BEHIND`
- **Regra 8:** Altera `.github/workflows/codeql.yml`
- **Veredito:** **AGUARDANDO HUMANO** — Regra 8 (workflow CI)

---

### #204 — Dependabot: codeql-action/init

- **Válido:** Sim | **Completo:** Sim | **Regressão:** Baixo risco
- **Causa da falha:** Analyze TypeScript FAILURE (pre-existente); `mergeable=BEHIND`
- **Regra 8:** Altera `.github/workflows/codeql.yml`
- **Veredito:** **AGUARDANDO HUMANO** — Regra 8 (workflow CI)

---

### #205 — Dependabot: codeql-action/autobuild

- **Válido:** Sim | **Completo:** Sim | **Regressão:** Baixo risco
- **Causa da falha:** Analyze TypeScript FAILURE (pre-existente); `mergeable=BEHIND`
- **Regra 8:** Altera `.github/workflows/codeql.yml`
- **Veredito:** **AGUARDANDO HUMANO** — Regra 8; ideal: mergear #203+#204+#205 num único commit que atualiza codeql.yml

---

### #206 — Dependabot: múltiplos workflows (5 arquivos)

- **Válido:** Sim | **Completo:** Sim | **Regressão:** Médio risco (5 workflows simultâneos)
- **Causa da falha:** Quality Gate FAILURE (pre-existente em main); `mergeable=BEHIND`
- **Regra 8:** Altera `.github/workflows/` (ci.yml, codeql.yml, deno-tests.yml, dependency-review.yml, actionlint.yml)
- **Veredito:** **AGUARDANDO HUMANO** — Regra 8 (múltiplos workflows CI)

---

### #208 — Dependabot: bump com bun.lock conflitante (radix-ui × 20 pacotes)

- **Válido:** Sim
- **Fix tentado:** Sim
  - GraphQL confirmou: `mergeable: CONFLICTING`, `mergeStateStatus: DIRTY`
  - Causa: bun.lock tem conflitos em 20 pacotes @radix-ui (atualização simultânea de múltiplas versões)
  - Tentativa de resolução: `bun install` para regenerar bun.lock → **ProxyConnectFailed 403** (registro npm/bun bloqueado neste ambiente cloud)
  - Sem `bun install` não há como regenerar bun.lock com as versões corretas
- **Veredito:** **BLOQUEADO AMBIENTE** — `bun install` inacessível nesta sessão; fix possível em ambiente com acesso a registros npm

---

### #210 — Dependabot: bump com bun.lock conflitante

- **Válido:** Sim
- **Fix tentado:** Sim
  - GraphQL confirmou: `mergeable: CONFLICTING`, `mergeStateStatus: DIRTY`
  - Causa: bun.lock CONFLICTING — mesma raiz de #208 (bun install bloqueado)
  - Tentativa de resolução: `bun install` → **ProxyConnectFailed 403**
- **Veredito:** **BLOQUEADO AMBIENTE** — `bun install` inacessível nesta sessão

---

### #211 — Dependabot: zod 3→4 major

- **Válido:** Sim | **Já implementado:** Não
- **Regressão:** Sim, garantida — zod v4 breaking changes; app usa API v3; PR só bumpa sem adaptar 105 edge functions + componentes
- **Causa da falha:** Quality Gate FAILURE (TypeScript errors da API incompatível)
- **Regra 8:** Mudança de arquitetura (zod v4 = migração extensiva de toda a camada de validação)
- **Veredito:** **AGUARDANDO HUMANO** — requer plano de migração; não é merge direto

---

### #212 — Dependabot: react-dom 18→19

- **Válido:** Sim | **Já implementado:** Não
- **Regressão:** Sim, garantida — peerDependency mismatch react ^18.2.0 + react-dom 19; breaking APIs React 19
- **Causa da falha:** E2E Financeiro (offline): FAILURE — `mergeable: CONFLICTING` confirmado via GraphQL; peerDep mismatch react 18 + react-dom 19 causa falha em runtime do E2E
- **Regra 8:** Mudança de arquitetura (React 19 = migração maior)
- **Veredito:** **AGUARDANDO HUMANO** — requer migração coordenada react + react-dom

---

### #216 — Dependabot: vitest major + bun.lock conflitante

- **Válido:** Sim
- **Fix tentado:** Sim
  - GraphQL confirmou: `mergeable: CONFLICTING`, `mergeStateStatus: DIRTY`
  - Causa: bun.lock CONFLICTING (vitest major + dependências associadas) + Quality Gate FAILURE (vitest v3 breaking changes em fixtures de testes)
  - Tentativa de resolução: `bun install` → **ProxyConnectFailed 403**
- **Veredito:** **BLOQUEADO AMBIENTE** — duplo bloqueio: `bun install` inacessível + vitest major requer análise de breaking changes

---

### #234 — Migration SQL: cron_step43_espacar_diagnosticos

- **Válido:** Sim | **Completo:** Sim | **Regressão:** Baixo risco se idempotente
- **Causa da falha:** Nenhuma — CI SUCCESS, apenas `mergeable=BEHIND`
- **Regra 8:** DDL/migration em produção
- **Veredito:** **AGUARDANDO HUMANO** — Regra 8; CI verde, pronta para o dono aprovar

---

### #235 — 5 Migrations SQL (20260425*.sql)

- **Válido:** Sim | **Completo:** Sim
- **Causa da falha:** Nenhuma — CI SUCCESS, apenas `mergeable=BEHIND`
- **Regra 8:** DDL/migration em produção (5 arquivos)
- **Veredito:** **AGUARDANDO HUMANO** — Regra 8; CI verde, pronta para o dono aprovar

---

### #238 — Migration SQL: registrar_grupo_b_rls_cross_tenant

- **Válido:** Sim | **Completo:** Sim | **Regressão:** Médio risco (RLS cross-tenant crítico)
- **Causa da falha:** Nenhuma — CI SUCCESS, apenas `mergeable=BEHIND`
- **Regra 8:** DDL/migration em produção + RLS
- **Veredito:** **AGUARDANDO HUMANO** — Regra 8; CI verde, requer revisão de RLS

---

### #243 — Migration SQL: drop_idle_indexes (dropa 404 índices)

- **Válido:** Sim | **Completo:** Sim | **Regressão:** Alto risco potencial (404 índices = mudança estrutural)
- **Causa da falha:** Nenhuma — CI SUCCESS, apenas `mergeable=BEHIND`
- **Regra 8:** DDL/deleção de dado (irreversível)
- **Veredito:** **AGUARDANDO HUMANO** — Regra 8 (deleção); CI verde, requer aprovação explícita do dono

---

### #255 — edge function: asaas-proxy (pagamento)

- **Válido:** Sim | **Completo:** Sim
- **Causa da falha:** Nenhuma — CI SUCCESS, apenas `mergeable=BEHIND`
- **Regra 8:** Edge function R2 de pagamento (asaas-proxy = boletos, PIX, cobrança)
- **Veredito:** **AGUARDANDO HUMANO** — Regra 8; CI verde, pronta para o dono aprovar

---

### #263 — altera .github/workflows/ci.yml

- **Válido:** Sim | **Completo:** 7/8 required SUCCESS ao verificar
- **Regra 8:** Altera `.github/workflows/ci.yml` (workflow principal de CI)
- **Veredito:** **AGUARDANDO HUMANO** — Regra 8 (workflow CI crítico)

---

### #265 — adiciona .github/workflows/inventario-estado.yml

- **Válido:** Sim | **Completo:** Sim — CI SUCCESS, `mergeable=BEHIND`
- **Regra 8:** Adiciona novo arquivo `.github/workflows/`
- **Veredito:** **AGUARDANDO HUMANO** — Regra 8 (workflow CI)

---

### #275 — adiciona .github/workflows/estado-real.yml (outra sessão)

- **Válido:** Sim | **Completo:** Sim — `mergeable=BEHIND`
- **Regra 8:** Adiciona novo arquivo `.github/workflows/`
- **Veredito:** **AGUARDANDO HUMANO** — Regra 8 (workflow CI); branch alheia (somente leitura para esta sessão)

---

### #276 — adiciona .github/workflows/auto-update-pr-branch.yml (outra sessão)

- **Válido:** Sim | **Completo:** Sim — `mergeable=BEHIND`
- **Regra 8:** Adiciona novo arquivo `.github/workflows/`
- **Veredito:** **AGUARDANDO HUMANO** — Regra 8 (workflow CI); branch alheia (somente leitura para esta sessão)

---

### #277 — adiciona .github/workflows/settings-guard.yml (outra sessão)

- **Válido:** Sim | **Completo:** Sim — `mergeable=BEHIND`
- **Regra 8:** Adiciona novo arquivo `.github/workflows/`
- **Veredito:** **AGUARDANDO HUMANO** — Regra 8 (workflow CI); branch alheia (somente leitura para esta sessão)

---

## PRs de Outras Sessões (abertas, Regra 8 — ver dossiês acima)

| # | Título resumido | Estado | Regra |
|---|---|---|---|
| [#275](https://github.com/adm01-debug/Promo_Finance_V2/pull/275) | adiciona .github/workflows/estado-real.yml | BEHIND | Regra 8 workflow |
| [#276](https://github.com/adm01-debug/Promo_Finance_V2/pull/276) | adiciona .github/workflows/auto-update-pr-branch.yml | BEHIND | Regra 8 workflow |
| [#277](https://github.com/adm01-debug/Promo_Finance_V2/pull/277) | adiciona .github/workflows/settings-guard.yml | BEHIND | Regra 8 workflow |

Não mergeadas por esta sessão (branch alheia, somente leitura). Todas em AGUARDANDO HUMANO.

---

## Estado Final do main

| Item | Valor |
|---|---|
| SHA baseline (início) | `c6eb99b275e1270cf99f1216e808c120f7cf58a2` |
| SHA final (pós-#285) | `fc358256625a38228f71d70399bfdd8eaf581d78` |
| E2E Critical Gate | COMPLETED SUCCESS (08:04:01→08:05:37Z) |
| Quality Gate & Tests | COMPLETED SUCCESS (08:04:02→08:09:13Z) |
| E2E Financeiro (offline) | COMPLETED SUCCESS (08:04:02→08:05:00Z) |
| Varredura de segredos (gitleaks) | COMPLETED SUCCESS (08:04:01→08:04:19Z) |
| E2E Destructive Logout | COMPLETED SUCCESS (08:09:15→08:10:01Z) job 129048903166 |
| E2E Quarantine (non-blocking) | IN_PROGRESS (08:10:04Z, não bloqueia merge) |
| Vercel deploy | NÃO VERIFICADO — Vercel MCP retorna 0 resultados para slug `juca1` nesta sessão |

main tem **5/5 required jobs COMPLETED SUCCESS** em `fc358256`. E2E Quarantine (non-blocking) ainda rodando — não impede merge das PRs aguardando.

---

## Auditoria de Compliance

- Nenhum merge tocou `.github/workflows/`
- Nenhum merge tocou migrations SQL
- Nenhum merge tocou edge functions R2 (asaas, pagamento, cobrança)
- Nenhum padrão proibido: `.skip`, `@ts-ignore`, `eslint-disable`, `any` de calar erro, baseline ampliado, `--no-verify`
- Nenhuma PR alheia editada, comentada ou mergeada por esta sessão
- 5 PRs supersedidas fechadas com evidência (timestamp de closure)
- Segredos: nenhum em código, commit ou resposta
- **Supabase DB Linter:** não gerou CheckRun para PRs non-DDL — evidência: GraphQL statusCheckRollup de `b0c226b4` não contém CheckRun com esse nome; merge de #282 e #283 bem-sucedido
- **PR #131 rebase tentado:** git rebase abortado — centenas de conflitos add/add (188 commits divergência desde set/26); documentado como AGUARDANDO HUMANO com justificativa técnica completa
- **PRs #208/#210/#216:** fix tentado — GraphQL confirmou CONFLICTING; `bun install` bloqueado por ProxyConnectFailed 403; documentado como BLOQUEADO AMBIENTE com evidência
- **PRs #175/#211/#212:** TypeScript breaking API confirmada em CI jobs reais; documentadas como AGUARDANDO HUMANO com evidência específica por arquivo:linha

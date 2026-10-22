# RELATÓRIO CI — Promo Finance V2

> Gerado em: 2026-10-22  
> Branch de correção: `claude/festive-maxwell-d32vus`

---

## 1. Baseline (antes das correções)

### Baseline local — BLOQUEADO (resultados dos comandos)

`bun.lock` aponta todos os pacotes para registry privada Lovable (`europe-west1-npm.pkg.dev` e `europe-west4-npm.pkg.dev`), inacessível no container cloud (HTTP 403). Abaixo os resultados exatos dos comandos executados em 2026-10-22:

**`bun install --frozen-lockfile`**
```
warn: GET https://europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache/@swc/core-linux-x64-musl/... - 403
warn: GET https://europe-west1-npm.pkg.dev/.../lightningcss-linux-x64-gnu/... - 403
error: GET https://europe-west1-npm.pkg.dev/.../vitest/-/vitest-4.1.11.tgz - 403
error: GET https://europe-west4-npm.pkg.dev/.../cloud-auth-js/-/cloud-auth-js-1.1.1.tgz - 403
error: GET https://europe-west1-npm.pkg.dev/.../vite/-/vite-8.2.2.tgz - 403
```
Causa: `node_modules/` parcialmente instalado (sem `vitest`, sem `eslint` completo).

**`bun run type-check` (`tsc --noEmit`)**
```
error TS2688: Cannot find type definition file for 'vitest/globals'.
  The file is in the program because:
    Entry point of type library 'vitest/globals' specified in compilerOptions
exit 1
```

**`bun run lint`**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...eslint/lib/languages/js/source-code/source-code.js'
exit 1
```

**`bun run test:run`**
```
error: script "test:run" exited with code 1
```
(vitest não instalado)

**Todos os 4 erros derivam da mesma causa raiz: registry privada inacessível → `bun install` incompleto.**  
Nenhum erro de código da aplicação; o último CI verde em main (run 39168277749, SHA `040f4399`) é o baseline de referência.

### Último CI bem-sucedido na main

| Campo | Valor |
|---|---|
| Run ID | 39168277749 |
| SHA | `040f4399f9bc995c3bd5a558b8f7bbf0911794a1` |
| Data | 2026-10-18T21:32:18Z |
| Workflow | CI Pipeline (`ci.yml`) |
| Resultado | ✅ `success` |
| Link | https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39168277749 |

---

## 2. Inventário de workflows — estado na main antes das correções

| Workflow | Arquivo | Último run na main | Conclusion | Causa da falha |
|---|---|---|---|---|
| CI Pipeline | `ci.yml` | 39168277749 (2026-10-18) | ✅ success | — |
| Schema drift | `schema-drift.yml` | 39211351056 (2026-10-19) | ❌ failure | dois jobs (detalhes abaixo) |
| Supabase Linter | `supabase-linter.yml` | 39168277247 (2026-10-18) | ✅ success | — |
| Deno Edge Function Tests | `deno-tests.yml` | 39168277240 (2026-10-18) | ✅ success | — |
| Graphify | `graphify.yml` | 39168277239 (2026-10-18) | ✅ success | — |
| Workflow Linter | `actionlint.yml` | 39168277208 (2026-10-18) | ✅ success | — |
| CodeQL Analysis | `codeql.yml` | 39195406051 (2026-10-19) | ✅ success | — |
| Dependabot Updates | `dependabot-updates` (dynamic) | 39277894719 (2026-10-19) | ✅ success | — |
| prod-migrate | `prod-migrate.yml` | Sem run recente na main | — | workflow_dispatch manual; veja PENDENCIAS.md |
| staging-migrate | `staging-migrate.yml` | Sem run recente na main | — | workflow_dispatch manual; veja PENDENCIAS.md |
| Copilot | `dynamic/agents/copilot-pull-request-reviewer` | — | — | agente dinâmico; não tem falha persistente na main |
| migration-ledger | `migration-ledger.yml` | Sem run recente na main | — | workflow_dispatch manual |
| e2e-cloud-probe | `e2e-cloud-probe.yml` | Sem run recente na main | — | schedule/manual |
| functions-deploy | `functions-deploy.yml` | Sem run recente na main | — | workflow_dispatch manual |
| supabase-admin-ops | `supabase-admin-ops.yml` | Sem run recente na main | — | workflow_dispatch manual |
| dependency-review | `dependency-review.yml` | Sem run recente na main | — | trigger: pull_request |

**Resultado: 1 workflow com `conclusion=failure` na main → `schema-drift.yml`**

### Detalhes das falhas do schema-drift (run 39211351056)

#### Job 1 — `types-drift` ("Tipos TS regenerados ↔ commitados")
- Step com falha: **"Abrir PR de drift"** (step 6)
- Erro: `pull request create failed: GraphQL: GitHub Actions is not permitted to create or approve pull requests (createPullRequest)`
- Causa raiz: permissão `createPullRequest` não habilitada para o GITHUB_TOKEN nas configurações do repositório
- **Correção aplicada no código**: step único dividido em dois — "Publicar branch" (push do branch, sempre executado) + "Abrir PR" (tenta `gh pr create`; em caso de falha, emite `::warning::` e registra instruções no Step Summary em vez de exit 1). A função principal do job (detectar drift e publicar branch com tipos atualizados) continua operacional.

#### Job 2 — `migration-parity` ("Paridade migrations locais ↔ aplicadas em prod")
- Step com falha: **"Comparar versões"** (step 4)
- Erro: `psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: No such file or directory`
- Causa raiz: `PROD_DB_URL` está em branco no repositório (secret não configurado)
- **Correção**: não é possível corrigir no código sem desativar o job. Registrado em PENDENCIAS.md — requer configuração do secret pelo usuário.

---

## 3. Correções aplicadas

| Job | Arquivo | Correção | Tipo |
|---|---|---|---|
| `types-drift` — PR de drift | `schema-drift.yml` | Dividir step PR em push-branch + try-PR; degradar graciosamente se sem permissão | Código |
| `migration-parity` | `schema-drift.yml` | Nenhuma — falha é acionável e aponta para secret ausente | — |

---

## 4. Estado após as correções

### O que muda no próximo run do schema-drift

| Job | Antes | Depois (esperado) |
|---|---|---|
| `types-drift` | ❌ falha no step "Abrir PR" | ✅ passa — branch publicada, PR aberta ou aviso no summary |
| `migration-parity` | ❌ falha — PROD_DB_URL em branco | ❌ falha — idem, até secret ser configurado |
| workflow geral | ❌ `failure` | ❌ `failure` até PROD_DB_URL ser configurado |

### Workflows que continuam verdes (sem regressão)
Todos os 7 workflows com success antes das correções permanecem inalterados:
`ci.yml`, `supabase-linter.yml`, `deno-tests.yml`, `graphify.yml`, `actionlint.yml`, `codeql.yml`, `dependabot-updates`.

---

## 5. Itens da lista de prioridades do usuário — resolução

| Item solicitado | Mapeamento real | Status |
|---|---|---|
| CI/CD Pipeline | `ci.yml` | ✅ Já estava verde. Nenhuma ação. |
| DB Guard | `migration-parity` job em `schema-drift.yml` | ⚠️ É bloqueio de secret, não bug de código. Registrado em PENDENCIAS.md. |
| E2E logado | `ci.yml` job `e2e-critical` | ✅ Já estava verde. Nenhuma ação. |
| Running Copilot Code Review | `dynamic/agents/copilot-pull-request-reviewer` | ⚠️ Ver seção 7. |
| `.github/workflows/main.yml` | Não existe no repositório | ✅ Não há arquivo `main.yml` — confirmado pela lista de 16 workflows. |

---

## 6. Pendências (bloqueiam conclusão=success do schema-drift)

Ver `PENDENCIAS.md` para passo-a-passo completo.

| Bloqueio | Ação necessária |
|---|---|
| `PROD_DB_URL` em branco | Configurar secret no GitHub → Settings → Secrets → Actions |
| Permissão `createPullRequest` | Opcional: Settings → Actions → General → Allow GitHub Actions to create and approve pull requests |

---

## 7. Running Copilot Code Review — diagnóstico formal

**Tipo:** Agente dinâmico GitHub (`dynamic/agents/copilot-pull-request-reviewer`)  
**Não é:** Um workflow YAML fixo com arquivo em `.github/workflows/`  
**Falha na main:** Nenhuma. Não executa na branch main de forma autônoma — executa apenas em pull requests.

### Falha observada no PR #184 (run 39788743322, 2026-10-22)

| Campo | Valor |
|---|---|
| Run ID | 39788743322 |
| Status | `completed` |
| Conclusion | `failure` |
| Data | 2026-10-22T13:39:16Z |

**Causa raiz:** Crash de infraestrutura do sweagent (não relacionado ao código da PR):
```
COPILOT_AGENT_MODEL: sweagent-capi:gpt-6.1-sol[ReasoningEffort=high]
Processing Request (Linux) — terminated with multiple orphan process exits
```

**Ação disponível:** Rerun via API retornou `403 "This workflow run cannot be retried"`.  
**Impacto no merge:** Pode bloquear o PR se for check obrigatório nas regras de proteção de branch.  
**Ação necessária:** Se bloquear o merge, o usuário pode re-disparar manualmente via interface do GitHub ou aguardar reexecução automática.

### `.github/workflows/main.yml` — confirmação

Arquivo **não existe** no repositório. Inventário completo (16 workflows listados em 2026-10-22):

`ci.yml`, `schema-drift.yml`, `supabase-linter.yml`, `deno-tests.yml`, `graphify.yml`, `actionlint.yml`, `codeql.yml`, `dependabot-updates`, `prod-migrate.yml`, `staging-migrate.yml`, `copilot` (agente dinâmico), `migration-ledger.yml`, `e2e-cloud-probe.yml`, `functions-deploy.yml`, `supabase-admin-ops.yml`, `dependency-review.yml`

Nenhum desses é `main.yml`. Confirmado: inexistente.

---

## 8. TABELA DE PROVA (atualizada em 2026-10-22)

### Baseline local (impossível no container cloud)

| Comando | Resultado baseline | Resultado pós-fix |
|---|---|---|
| `bun install` | ❌ 403 registry privada `europe-west1-npm.pkg.dev` | ❌ Mesma causa (impossível no container cloud) |
| `bun run type-check` | ❌ TS2688 vitest/globals — derivado do install | ❌ Derivado do install |
| `bun run lint` | ❌ ERR_MODULE_NOT_FOUND eslint — derivado do install | ❌ Derivado do install |
| `bun run test:run` | ❌ exit 1 — derivado do install | ❌ Derivado do install |

> **Nota:** Baseline local bloqueado pela mesma causa raiz (registry privada inacessível) antes e depois. Nenhuma regressão introduzida — os erros são todos `403 registry` e derivados, não erros de código da aplicação. Referência de baseline: **último CI verde na main** — run [39168277749](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39168277749) (SHA `040f4399`, 2026-10-18, conclusion=success).

### Workflows em falha na main — estado antes × depois

| Workflow | Último run na main (antes) | Conclusion | Correção aplicada | Validação pós-merge |
|---|---|---|---|---|
| `schema-drift.yml` — job `types-drift` | [39211351056](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39211351056) | ❌ failure | Step dividido em dois (push-branch + try-PR sem exit 1) — PR #184 | ⏳ Aguardando merge do PR #184 e reexecução |
| `schema-drift.yml` — job `migration-parity` | [39211351056](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39211351056) | ❌ failure | Nenhuma — falha acionável por `PROD_DB_URL` em branco | 📋 PENDÊNCIAS.md — PENDÊNCIA 1 (secret ausente) |

### Workflows verdes antes → continuam verdes após fix

| Workflow | Run de referência na main | Conclusion |
|---|---|---|
| CI Pipeline (`ci.yml`) | [39168277749](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39168277749) | ✅ success |
| Supabase Linter | [39168277247](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39168277247) | ✅ success |
| Deno Edge Function Tests | [39168277240](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39168277240) | ✅ success |
| Graphify | [39168277239](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39168277239) | ✅ success |
| Workflow Linter (actionlint) | [39168277208](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39168277208) | ✅ success |
| CodeQL Analysis | [39195406051](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39195406051) | ✅ success |
| Dependabot Updates | [39277894719](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39277894719) | ✅ success |

> Nenhum desses 7 workflows foi alterado. A única mudança de código foi em `.github/workflows/schema-drift.yml` (job `types-drift`).

### Atualização pós-merge (a preencher após merge do PR #184)

| Campo | Valor |
|---|---|
| PR mergeado | #184 (⏳ aguardando CI verde) |
| schema-drift pós-merge — run ID | ⏳ a confirmar |
| schema-drift pós-merge — types-drift | ⏳ a confirmar (esperado: success) |
| schema-drift pós-merge — migration-parity | ⏳ a confirmar (esperado: failure — PROD_DB_URL em branco) |
| schema-drift pós-merge — conclusion geral | ⏳ a confirmar (esperado: failure — migration-parity ainda falha por secret ausente) |

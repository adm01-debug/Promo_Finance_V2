# PENDÊNCIAS — Workflows do GitHub Actions

> Atualizado em: 2026-10-22T16:35 UTC  
> Responsável técnico: Claude (branch `claude/festive-maxwell-d32vus`)

---

## BLOQUEIO DEFINITIVO — `schema-drift.yml` em `conclusion=failure` na main

**Workflow:** Schema drift (types + migrations)  
**Último run com falha na main:** [39211351056](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39211351056)  
**Motivo final:** Secret `PROD_DB_URL` não configurado no repositório → job `migration-parity` falha na conexão psql.

> **Este é o único bloqueio que impede `conclusion=success`.**  
> O código já foi corrigido (PR #184): o job `types-drift` deixou de falhar por `createPullRequest`. Mas `migration-parity` continuará falhando indefinidamente, mantendo o workflow com `conclusion=failure`, até que `PROD_DB_URL` seja configurado.

### Por que o código sozinho não resolve

| Job | Estado do código | Estado de execução |
|---|---|---|
| `types-drift` | ✅ Fix aplicado (PR #184, commit `ff1a1da`) — step de PR degrada para `::warning::` em vez de `exit 1` | ⏳ Aguarda merge do PR #184 |
| `migration-parity` | ✅ Código correto — guard-rail que falha intencionalmente sem PROD_DB_URL | ❌ DEFINITIVO — falha até secret ser configurado |
| **Workflow geral** | — | ❌ `conclusion=failure` **permanentemente** até PROD_DB_URL ser adicionado |

### O que você precisa fazer (passo a passo exato)

1. Acesse: https://github.com/adm01-debug/Promo_Finance_V2/settings/secrets/actions
2. Clique em **New repository secret**
3. Nome: `PROD_DB_URL`
4. Valor: `postgresql://postgres:[SENHA]@db.bwwbeyolnnzppeuhgkcd.supabase.co:5432/postgres`
   - Obtenha a senha em: https://supabase.com/dashboard/project/bwwbeyolnnzppeuhgkcd/settings/database
5. Após adicionar, dispare manualmente: Actions → "Schema drift (types + migrations)" → **Run workflow** → branch: **main**
6. Aguarde `conclusion=success` nas duas jobs

---

## PR #184 — Fix de código aplicado (aguardando merge)

**Branch:** `claude/festive-maxwell-d32vus`  
**PR:** https://github.com/adm01-debug/Promo_Finance_V2/pull/184  
**HEAD:** `9f44b53` (2026-10-22T16:35 UTC)  
**Estado:** `mergeable=true`, `mergeable_state=blocked`

| Required Check | Fonte | Status (HEAD `9f44b53`) |
|---|---|---|
| Unit tests (offline, deterministic) | `deno-tests.yml` | ✅ success (run 39810959911) |
| Integration tests (edge functions live) | `deno-tests.yml` | ✅ success (run 39810959911) |
| Supabase DB Linter | `deno-tests.yml` | ✅ success (run 39810960368) |
| Quality Gate & Tests | `ci.yml` | ⏳ pending — runner não alocado (run 39810960546) |
| E2E Critical Gate | `ci.yml` | ⏳ pending |
| E2E Financeiro (offline) | `ci.yml` | ⏳ pending |
| E2E Destructive Logout | `ci.yml` | ⏳ pending |
| Varredura de segredos (gitleaks) | `ci.yml` | ⏳ pending |

**Bloqueador do merge:** ci.yml (run [39810960546](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39810960546)) aguarda runner há mais de 30 min. Runners de workflows com múltiplos jobs simultâneos estão esgotados. Merge automático será executado assim que todos os 8 checks passarem.

> **Nota:** mesmo após o merge do PR #184, o `schema-drift.yml` continuará com `conclusion=failure` na main porque `migration-parity` falha sem `PROD_DB_URL`. Ver BLOQUEIO DEFINITIVO acima.

---

## Resumo do estado atual

| Workflow | Arquivo | Status na main | Situação |
|---|---|---|---|
| CI/CD Pipeline | `ci.yml` | ✅ SUCCESS (run 39168277749, 2026-10-18) | Saudável |
| Schema Drift | `schema-drift.yml` | ❌ FAILURE (run 39211351056) | **DEFINITIVO — requer PROD_DB_URL (ver acima)** |
| Supabase Linter | `supabase-linter.yml` | ✅ SUCCESS | Saudável |
| Deno Edge Tests | `deno-tests.yml` | ✅ SUCCESS | Saudável |
| Graphify | `graphify.yml` | ✅ SUCCESS | Saudável |
| Workflow Linter | `actionlint.yml` | ✅ SUCCESS | Saudável |
| CodeQL | `codeql.yml` | ✅ SUCCESS | Saudável |
| prod-migrate | `prod-migrate.yml` | Sem run na main | Guard-rail (workflow_dispatch); exige PROD_DB_URL e SUPABASE_ACCESS_TOKEN |
| staging-migrate | `staging-migrate.yml` | Sem run na main | Guard-rail (workflow_dispatch); exige múltiplos secrets |

---

## PENDÊNCIA 2 — Secret `SUPABASE_ACCESS_TOKEN` ausente (impacta prod-migrate e staging-migrate)

**Workflows afetados:** `prod-migrate.yml`, `staging-migrate.yml`

**O que você precisa fazer:**
1. Acesse: https://github.com/adm01-debug/Promo_Finance_V2/settings/secrets/actions
2. Clique em **New repository secret**
3. Nome: `SUPABASE_ACCESS_TOKEN`
4. Valor: token de acesso pessoal do Supabase
   - Obtenha em: https://supabase.com/dashboard/account/tokens

---

## PENDÊNCIA 3 — Permissão `createPullRequest` do GitHub Actions (opcional)

**Workflow afetado:** `schema-drift.yml` → job `types-drift` (abertura de PR automático ao detectar drift)

**Correção de código aplicada:** O job agora degrada graciosamente — publica a branch e emite aviso em vez de falhar. A PR pode ser aberta manualmente.

**Para habilitar criação automática de PR (opcional):**
1. Acesse: https://github.com/adm01-debug/Promo_Finance_V2/settings/actions
2. Em **Workflow permissions**, marque: ✅ **Allow GitHub Actions to create and approve pull requests**
3. Salve.

---

## PENDÊNCIA 4 — Secrets adicionais para `staging-migrate`

| Secret | Onde obter |
|---|---|
| `STAGING_DB_URL` | Supabase dashboard do projeto de staging |
| `STAGING_PROJECT_REF` | ID do projeto Supabase de staging |
| `STAGING_ANON_KEY` | Supabase dashboard → API Keys |
| `TEST_ADMIN_JWT` | JWT de usuário admin para testes |
| `REQUIRED_SECRETS` | Variável de repositório (não secret); adicionar em Settings → Variables → Actions |

---

## PENDÊNCIA 5 — Variável `PROD_PROJECT_REF` do repositório

**O que você precisa fazer:**
1. Acesse: https://github.com/adm01-debug/Promo_Finance_V2/settings/variables/actions
2. Confirme que existe `PROD_PROJECT_REF` com valor `bwwbeyolnnzppeuhgkcd`
3. Se não existir, crie como **repository variable** (não secret).

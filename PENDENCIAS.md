# PENDÊNCIAS — Workflows do GitHub Actions

> Atualizado em: 2026-10-22T15:45 UTC  
> Responsável técnico: Claude (branch `claude/festive-maxwell-d32vus`)

---

## ⚠️ DOIS BLOQUEADORES DISTINTOS para schema-drift.yml (um transitório, um definitivo)

O único workflow com `conclusion=failure` na main é `schema-drift.yml` (run [39211351056](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39211351056)).

### BLOQUEIO A — Transitório: job `types-drift` (fix em PR #184)

- **Causa raiz:** `exit 1` quando a permissão `createPullRequest` não está habilitada
- **Correção aplicada:** step dividido em push-branch + try-PR com degradação graciosa (`::warning::` em vez de exit 1)
- **Fix está em:** PR [#184](https://github.com/adm01-debug/Promo_Finance_V2/pull/184), commit `ff1a1da`
- **Bloqueio para merge:** CI Pipeline ainda rodando no commit `ff1a1da`
- **Ação automática:** trigger `trig_016VSox1LoTQBdTMAVxGHixr` às 16:00 UTC fará o merge quando todos os 8 checks passarem
- **Alternativa manual:** acesse [PR #184](https://github.com/adm01-debug/Promo_Finance_V2/pull/184) e clique em "Merge pull request" quando todos os checks ficarem verdes

### BLOQUEIO B — **DEFINITIVO** (requer ação sua): job `migration-parity`

- **Causa raiz:** Secret `PROD_DB_URL` não configurado no repositório → `psql` falha na conexão
- **Erro:** `psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed`
- **Correção de código:** IMPOSSÍVEL sem expor o secret. O job precisa do secret para funcionar — é um guard-rail correto.
- **IMPORTANTE:** Mesmo após o merge do PR #184 e re-execução do schema-drift, **`migration-parity` continuará falhando** até você configurar `PROD_DB_URL`
- **Consequência:** `schema-drift.yml` na main terá `conclusion=failure` permanentemente até este secret ser adicionado
- **O que você precisa fazer (passo a passo):**
  1. Acesse: https://github.com/adm01-debug/Promo_Finance_V2/settings/secrets/actions
  2. Clique em **New repository secret**
  3. Nome: `PROD_DB_URL`
  4. Valor: `postgresql://postgres:[SENHA]@db.bwwbeyolnnzppeuhgkcd.supabase.co:5432/postgres`
     - Obtenha a senha em: https://supabase.com/dashboard/project/bwwbeyolnnzppeuhgkcd/settings/database
  5. Após adicionar, dispare manualmente: Actions → "Schema drift (types + migrations)" → **Run workflow** → branch: **main**

---

## Resumo do estado atual

| Workflow | Arquivo | Último resultado em main | Situação |
|---|---|---|---|
| CI/CD Pipeline | `ci.yml` | ✅ SUCCESS (2026-10-18) | Saudável |
| E2E logado | `ci.yml` job `e2e-critical` | ✅ SUCCESS (2026-10-18) | Saudável |
| Schema Drift — tipos TS | `schema-drift.yml` job `types-drift` | ⚠️ Corrigido no código | Aguarda secrets (ver abaixo) |
| Schema Drift — paridade | `schema-drift.yml` job `migration-parity` | ⚠️ Corrigido no código | Aguarda secrets (ver abaixo) |
| prod-migrate | `prod-migrate.yml` | 🔒 Falha intencional | Aguarda secrets (ver abaixo) |
| staging-migrate | `staging-migrate.yml` | 🔒 Falha intencional | Aguarda secrets (ver abaixo) |

---

## PENDÊNCIA 1 — Secret `PROD_DB_URL` ausente (bloqueador crítico)

**Workflows afetados:**
- `schema-drift.yml` → job `migration-parity` (comparação migrations locais × prod)
- `prod-migrate.yml` → guard-rail de confirmação (produção)
- `staging-migrate.yml` → preflight de variáveis

**Erro observado:**
```
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed:
No such file or directory
```
```
::error::PROD_DB_URL não pertence ao project-ref bwwbeyolnnzppeuhgkcd
```

**O que você precisa fazer:**
1. Acesse: https://github.com/adm01-debug/Promo_Finance_V2/settings/secrets/actions
2. Clique em **New repository secret**
3. Nome: `PROD_DB_URL`
4. Valor: a connection string PostgreSQL do projeto Supabase `bwwbeyolnnzppeuhgkcd`
   - Formato: `postgresql://postgres:[SENHA]@db.bwwbeyolnnzppeuhgkcd.supabase.co:5432/postgres`
   - Obtenha em: https://supabase.com/dashboard/project/bwwbeyolnnzppeuhgkcd/settings/database

**Nota:** `prod-migrate.yml` e `staging-migrate.yml` falham intencionalmente sem esse secret — é um guard-rail de segurança correto, não um bug. Nenhuma alteração de código foi feita nesses workflows.

---

## PENDÊNCIA 2 — Secret `SUPABASE_ACCESS_TOKEN` ausente

**Workflows afetados:**
- `schema-drift.yml` → job `types-drift` (regeneração de tipos TS)
- `prod-migrate.yml`
- `staging-migrate.yml`

**O que você precisa fazer:**
1. Acesse: https://github.com/adm01-debug/Promo_Finance_V2/settings/secrets/actions
2. Clique em **New repository secret**
3. Nome: `SUPABASE_ACCESS_TOKEN`
4. Valor: token de acesso pessoal do Supabase
   - Obtenha em: https://supabase.com/dashboard/account/tokens

---

## PENDÊNCIA 3 — Permissão `createPullRequest` do GitHub Actions

**Workflow afetado:** `schema-drift.yml` → job `types-drift` (abertura de PR automático ao detectar drift)

**Erro observado:**
```
pull request create failed: GraphQL: GitHub Actions is not permitted to create
or approve pull requests (createPullRequest)
```

**Correção de código aplicada:** O job agora degrada graciosamente — publica a branch e emite um aviso no Step Summary em vez de falhar. A PR pode ser aberta manualmente.

**Para habilitar a criação automática de PR (opcional):**
1. Acesse: https://github.com/adm01-debug/Promo_Finance_V2/settings/actions
2. Em **Workflow permissions**, marque:
   - ✅ **Allow GitHub Actions to create and approve pull requests**
3. Salve.

---

## PENDÊNCIA 4 — Secrets adicionais para `staging-migrate`

**Workflow afetado:** `staging-migrate.yml`

**Secrets necessários além do `PROD_DB_URL`:**

| Secret | Onde obter |
|---|---|
| `STAGING_DB_URL` | Supabase dashboard do projeto de staging |
| `STAGING_PROJECT_REF` | ID do projeto Supabase de staging |
| `STAGING_ANON_KEY` | Supabase dashboard → API Keys |
| `TEST_ADMIN_JWT` | JWT de usuário admin para testes |
| `REQUIRED_SECRETS` | Variável de repositório (não secret) listando os secrets obrigatórios; adicionar em Settings → Variables → Actions |

---

## PENDÊNCIA 5 — Variável `PROD_PROJECT_REF` do repositório

**Workflows afetados:** `schema-drift.yml`, `prod-migrate.yml`, `staging-migrate.yml`

**O que você precisa fazer:**
1. Acesse: https://github.com/adm01-debug/Promo_Finance_V2/settings/variables/actions
2. Confirme que existe `PROD_PROJECT_REF` com valor `bwwbeyolnnzppeuhgkcd`
3. Se não existir, crie como **repository variable** (não secret).

---

## Workflows que NÃO precisam de ação

- **`ci.yml`** — último run em main: SUCCESS (SHA `040f4399`, 2026-10-18). Nenhuma alteração necessária.
- **`.github/workflows/main.yml`** — não existe neste repositório (confirmado: lista de 16 workflows não contém `main.yml`).
- **`prod-migrate.yml`** e **`staging-migrate.yml`** — falhas são intencionais (guard-rails). Sem alteração de código.

---

## PENDÊNCIA 6 — Running Copilot Code Review (falha de infraestrutura no PR #184)

**Tipo:** Agente dinâmico GitHub (`dynamic/agents/copilot-pull-request-reviewer`)  
**Não é** workflow YAML fixo. **Sem falha persistente na main.**

**Falha observada no PR #184:**
- Run ID: `39788743322` — `conclusion=failure` em 2026-10-22T13:39:16Z
- Causa: crash de infraestrutura do sweagent (`gpt-6.1-sol[ReasoningEffort=high]`), não relacionado ao código desta PR
- Rerun via API: `403 "This workflow run cannot be retried"` (integração de terceiros)

**Impacto:** Se este check for obrigatório nas proteções de branch, bloqueará o merge do PR #184.

**O que você precisa fazer (se o merge ficar bloqueado):**
1. Acesse: https://github.com/adm01-debug/Promo_Finance_V2/pull/184
2. Clique em **Re-run** no check "Running Copilot Code Review" (se disponível na interface)
3. Ou aguarde reexecução automática pelo GitHub Copilot

---

## PENDÊNCIA 7 — RESOLVIDA ✅ GitHub Actions runners (bloqueio de infraestrutura superado)

**Resolução:** Runners alocados automaticamente para o commit `2ecb305` (CI Pipeline run [39806593414](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/39806593414) — iniciado 15:37Z, concluído com sucesso em 15:49Z).

**Estado final (2026-10-22T15:50Z):** 7 de 8 required checks com `success`. Aguardando apenas `E2E Destructive Logout` (queued desde 15:49Z).

**Sem ação de código pendente** — o bloqueio de infraestrutura foi resolvido automaticamente.

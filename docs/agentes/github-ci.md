# GitHub (perímetro, CI, workflows) — referência para agentes

> Ler ao mexer em branch protection, settings do repo, `.github/workflows/`, ou quando um merge ou
> workflow falhar de forma estranha. Fluxo de branch/commit/PR/merge está em `docs/agentes/fluxo-git.md`.

## Escrita no GitHub

- Repo `adm01-debug/Promo_Finance_V2`, branch `main`, **público**.
- Escrita: MCP `GITHUB - MCP - FOREVER` (`github_push_files`, `github_merge_pull_request`,
  `github_graphql`). O MCP padrão do GitHub dá 403 em write. `git push`/`gh` só funcionam quando o
  repo é fonte autorizada da sessão.

## Perímetro — estado real (verificado via API em 2026-11-08)

| Campo | Estado | Observação |
|---|---|---|
| Branch protection — required checks | **8**: `Supabase DB Linter` · `Quality Gate & Tests` · `E2E Critical Gate` · `Integration tests (edge functions live)` · `E2E Financeiro (offline)` · `E2E Destructive Logout` · `Varredura de segredos (gitleaks)` · `Unit tests (offline, deterministic)` | sem job agregador único ("CI Gate"); os 8 contexts são de 3 workflows diferentes (ver tabela abaixo) |
| Branch protection — `strict` | `true` | PR atrás da `main` → `BEHIND`; atualize a branch, não mexa no `strict` |
| Branch protection — `enforce_admins` | `true` | |
| Branch protection — histórico linear | `false` | (`required_linear_history`) |
| Branch protection — conversas resolvidas | `true` | (`required_conversation_resolution`) — comentário de review não resolvido bloqueia merge mesmo com CI verde |
| Branch protection — force-push / deleção | `false` / `false` | |
| Merge | `allow_squash_merge=true` · `allow_merge_commit=true` · `allow_rebase_merge=true` · `allow_auto_merge=true` · `delete_branch_on_merge=true` | squash **não** é exclusivo aqui (difere do Zapp) |
| Squash | `squash_merge_commit_message=COMMIT_MESSAGES` · `squash_merge_commit_title=COMMIT_OR_PR_TITLE` | |
| Environments | **4**: `copilot` · `Preview` · `Production` · `Production-Ops` | |
| Environment com revisor obrigatório | `Production-Ops` (revisor: `adm01-debug`) — usado por `prod-migrate.yml` | `Production` e `Preview` sem proteção |
| Actions — `allowed_actions` | `all` | **difere do Zapp** (lá é `selected`) |
| Actions — `sha_pinning_required` | `false` | **difere do Zapp** (lá é `true`) — actions por tag continuam aceitas aqui |
| Secret scanning | `enabled` + `push_protection: enabled` | `secret_scanning_non_provider_patterns` e `secret_scanning_validity_checks`: `disabled` |
| Guard de perímetro (settings-guard) | **não existe** | diferença do Zapp: nenhum workflow compara a realidade com baseline commitado; mudança no perímetro não é auto-detectada |

403 administrativo (`administration` scope ausente no `GITHUB_TOKEN` de workflow) é limite de
evidência, não confirmação de configuração errada — mesma ressalva do Zapp.

## Workflows (14 arquivos em `.github/workflows/`)

| Arquivo | Dispara em | Checks obrigatórios que produz |
|---|---|---|
| `ci.yml` | push, pull_request | `Varredura de segredos (gitleaks)` · `Quality Gate & Tests` · `E2E Critical Gate` · `E2E Destructive Logout` · `E2E Financeiro (offline)` (+ `E2E Quarantine` e `Post-merge Simulation Audit`, não obrigatórios) |
| `deno-tests.yml` | push, pull_request, dispatch | `Unit tests (offline, deterministic)` · `Integration tests (edge functions live)` |
| `supabase-linter.yml` | push, pull_request, dispatch | `Supabase DB Linter` |
| `actionlint.yml` | push, pull_request, dispatch | `Lint GitHub Actions workflows` (não obrigatório) |
| `codeql.yml` | push, pull_request, schedule `17 3 * * 1` | `Analyze TypeScript` (não obrigatório) |
| `dependency-review.yml` | pull_request | `Dependency Review` (não obrigatório) |
| `contexto.yml` | push, pull_request, schedule `7-59/10 * * * *`, dispatch | gera `docs/contexto/{codigo,supabase,regras}/` na branch `contexto` — nunca abrir PR dela |
| `schema-drift.yml` | schedule `0 6 * * 1`, dispatch | compara `types.ts` ↔ commitado e migrations locais ↔ aplicadas em prod |
| `graphify.yml` | push, pull_request, dispatch | — |
| `functions-deploy.yml` | **só `workflow_dispatch`** | deploy manual e único de 1 Edge Function por vez (não há deploy automático de edges neste repo) |
| `prod-migrate.yml` | **só `workflow_dispatch`** | aplica migrations pendentes em prod; gate `Production-Ops` (revisor obrigatório) + confirmação digitada do project-ref |
| `staging-migrate.yml` | **só `workflow_dispatch`** | |
| `migration-ledger.yml` | **só `workflow_dispatch`** | diagnóstico read-only: ledger remoto vs. `supabase/migrations/` local |
| `supabase-admin-ops.yml` | **só `workflow_dispatch`** | |

**Diferenças de design vs. Zapp Web V2** (conferir antes de assumir que o Zapp é a referência):

- **Deploy de Edge Function é manual aqui** (`functions-deploy.yml`, `workflow_dispatch`, 1 função por
  vez, lista de funções aprovadas no `type: choice`). No Zapp é automático no push da `main`. Não
  assuma deploy automático de edge ao mergear.
- **Migration em produção passa por workflow com aprovação humana** (`prod-migrate.yml`: environment
  `Production-Ops` + confirmação digitada do project-ref + `dry_run` por padrão), além do caminho
  `db_query` direto via MCP que o `AGENTS.md` §4 descreve. Os dois caminhos coexistem.
  `migration-ledger.yml` existe só para diagnosticar divergência de ledger — não aplica nada.
- **Sem job agregador "CI Gate".** Os 8 checks obrigatórios são verificados individualmente pela
  branch protection; não há um job único que falhe se qualquer um deles falhar (padrão do Zapp).
- **Sem `settings-guard`/baseline de perímetro commitado.** Se o perímetro listado acima mudar,
  nada no CI avisa — ao contrário do Zapp (`scripts/ci/github-settings-baseline.json` +
  `settings-guard.yml`).
- **`allowed_actions=all` e `sha_pinning_required=false`** — actions de terceiros por tag são
  aceitas; não há `check-workflow-pins` equivalente.

## Guard de integridade das instruções

`scripts/ci/check-claude-md-integrity.mjs` (rodando em `ci.yml`, job `quality-gate`) barra sessão
paralela apagando ou esvaziando `AGENTS.md`/`docs/agentes/*.md`. Réplica do GA02 do Zapp, adaptada
às 8 seções numeradas do `AGENTS.md` deste repo. PR: `adm01-debug/Promo_Finance_V2#263`.

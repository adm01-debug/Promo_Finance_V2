# Mapa do repositório — referência para agentes

> Ler quando precisar saber onde fica algo antes de buscar por texto.

## Onde olhar primeiro

| Precisa de | Leia |
|---|---|
| Contexto de negócio, banco oficial, Edge Functions, integrações | `docs/agentes/sistema.md` |
| Checklist de "funcionalidade/bug pronto" | `docs/agentes/definicao-de-pronto.md` |
| Formato do bloco "Próximos passos" | `docs/agentes/proximos-passos.md` |
| Fluxo de branch/commit/PR/merge | `docs/agentes/fluxo-git.md` |
| Perímetro GitHub, workflows, CI | `docs/agentes/github-ci.md` |
| Deploy, Vercel, env vars | `docs/agentes/vercel-deploy.md` |
| Consultar o grafo de código (graphify) | `docs/agentes/graphify.md` |
| **Contexto gerado para agentes, antes de qualquer tarefa** | branch **`contexto`**: `git fetch origin contexto && git show origin/contexto:docs/contexto/00-INDEX.md` — diz qual fonte é dona de cada fato (código em `main`, banco oficial, regras de negócio em `docs/contexto/regras/manual/`); regenerado a cada ~10 min por `contexto.yml`; **nunca abrir PR dela** |
| Histórico de auditorias, planos, relatórios antigos | `AUDITORIA.md`, `PLANO_50.md`, `PLANO_100.md`, `ESTADO_ATUAL.md`, `docs/` — contexto, **não** fonte de verdade (ver `AGENTS.md`: em conflito, `AGENTS.md` vence) |

## Mapa rápido

| Onde | O que tem |
|---|---|
| `src/` | front Vite + React: `components/`, `hooks/`, `pages/`, `contexts/`, `lib/`, `config/` (inclui `env.ts`, que lê as vars de `env.manifest.json`), `integrations/` (cliente Supabase, `types.ts` gerado), `types/` |
| `supabase/functions/` | 106 Edge Functions Deno, 1 pasta por função; catálogo em `docs/EDGE_FUNCTIONS_CATALOG.md` |
| `supabase/migrations/` | arquivos `.sql`, timestamp `YYYYMMDDHHmmss` estritamente crescente |
| `supabase/tests/` | testes de banco |
| `supabase/config.toml` | `project_id` + `verify_jwt` por função |
| `env.manifest.json` | inventário gerado e autoritativo de env vars (`scope`, `dest`, `consumers`) — gerado por `scripts/generate-env-manifest.mjs`, não editar à mão |
| `scripts/security/` | gates de CI (Zod coverage, canonical DB gates, migration replay safety, Supabase config, deploy de functions) |
| `scripts/ci/` | guards do CI (`check-claude-md-integrity.mjs` *(ver PR aberta #263)*, baselines de typecheck) |
| `scripts/ai-context/` | gerador de `docs/contexto/codigo/` (branch `contexto`) |
| `scripts/supabase_snapshot/` | gerador de `docs/contexto/supabase/` (snapshot do banco oficial ao vivo) |
| `scripts/regras_negocio/` | gerador de `docs/contexto/regras/` (regras de negócio; `manual/` é a parte editada por humano) |
| `scripts/edge-deploy/` *(ver PR aberta #253)* | tooling de verificação pós-deploy de Edge Function |
| `e2e/` | specs Playwright |
| `docs/` | documentação extensa — `EDGE_FUNCTIONS_CATALOG.md`, `ARCHITECTURE.md`, `DB_HEALTH.md`, `SECURITY.md`, `adr/`, `runbooks/`, `docs/contexto/regras/manual/`, `agentes/` (esta pasta) |

## Comandos

Bun é o gerenciador (`bun.lock`; sem `package-lock.json`).

- Testes: `bun run test:run` (Vitest); `bun run test:e2e` (Playwright).
- Typecheck: `bun run type-check`. Lint: `bun run lint:strict` (zero warnings).
- Guards de segurança antes do PR: `bash scripts/check-external-secret-isolation.sh`,
  `bash scripts/security/zod-coverage.sh`, `node --test scripts/security/test-canonical-db-gates.test.mjs`
  — os mesmos que rodam no job `quality-gate` do CI.
- Guard de integridade das instruções: `node scripts/ci/check-claude-md-integrity.mjs` *(disponível após merge do PR #263)*.

## Grafo de código (graphify)

Ver `docs/agentes/graphify.md` para o grafo upstream e o wrapper do piloto. Resumo: `AGENTS.md` §8
proíbe `graphify update .`/`extract .` fora do fluxo do piloto neste repo (diferença deliberada do
Zapp, que permite `update .` livremente no grafo upstream).

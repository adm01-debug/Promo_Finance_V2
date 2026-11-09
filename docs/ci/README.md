# Workflows de CI — o que cada um faz

> **Gerado por `scripts/ci/render-workflow-docs.mjs`.** Não edite à mão: o workflow
> `estado-real.yml` roda `--check` e abre PR quando este arquivo divergir do bloco
> `# docs:` de cada workflow. Para mudar o que está aqui, mude o bloco no YAML.

**15 workflows — 2 com bloco `# docs:`, 13 sem.**

| Workflow | Arquivo | Gatilho | O que prova | Quando falha | Quem é avisado | Custo/sem (min) | Falha (7 d) |
|---|---|---|---|---|---|---|---|
| Contexto para agentes de IA (10 min) | [`contexto.yml`](../../.github/workflows/contexto.yml) | push em main que toque código, banco, scripts das automações ou docs/contexto/regras/manual/; a cada 10 min (minuto 7); dispatch | branch contexto com docs/contexto/{codigo,supabase,regras}/ regerados das três fontes de verdade (código em main, banco oficial bwwbeyolnnzppeuhgkcd, código+migrations+manual/) e docs/contexto/00-INDEX.md montado a partir dos manifests | falha fatal de produtor reprova o workflow; fontes com artefato publicam e as demais mantêm a última versão | ninguém (a branch contexto é a prova; errors.md em supabase/ lista seções com falha) | — | — |
| Estado real (CI e edge functions) | [`estado-real.yml`](../../.github/workflows/estado-real.yml) | segunda 11:38 UTC (08:38 BRT), push em main que toque workflows ou supabase/functions, e dispatch | docs/ci/README.md, docs/ci/MATRIZ_EDGE_TABELA.md e docs/ci/kpi.json refeitos do estado real (YAML dos workflows, .from() das edge functions, API do Actions) | o job fica vermelho e os docs gerados continuam como estavam | PR automation/estado-real quando algum doc divergir, e a issue [kpi-actions] com o custo semanal | — | — |

## Detalhe

### Contexto para agentes de IA (10 min) (`contexto.yml`)

- **Gatilho:** push em main que toque código, banco, scripts das automações ou docs/contexto/regras/manual/; a cada 10 min (minuto 7); dispatch
- **O que prova:** branch contexto com docs/contexto/{codigo,supabase,regras}/ regerados das três fontes de verdade (código em main, banco oficial bwwbeyolnnzppeuhgkcd, código+migrations+manual/) e docs/contexto/00-INDEX.md montado a partir dos manifests
- **Quando falha:** falha fatal de produtor reprova o workflow; fontes com artefato publicam e as demais mantêm a última versão
- **Quem é avisado:** ninguém (a branch contexto é a prova; errors.md em supabase/ lista seções com falha)

### Estado real (CI e edge functions) (`estado-real.yml`)

- **Gatilho:** segunda 11:38 UTC (08:38 BRT), push em main que toque workflows ou supabase/functions, e dispatch
- **O que prova:** docs/ci/README.md, docs/ci/MATRIZ_EDGE_TABELA.md e docs/ci/kpi.json refeitos do estado real (YAML dos workflows, .from() das edge functions, API do Actions)
- **Quando falha:** o job fica vermelho e os docs gerados continuam como estavam
- **Quem é avisado:** PR automation/estado-real quando algum doc divergir, e a issue [kpi-actions] com o custo semanal

## O que NÃO é bug

> Comportamentos que parecem erro mas são design intencional.
> Cada item vem do bloco `# nao-e-bug:` do YAML do workflow.

| Workflow | Situação | Por quê não é bug |
|---|---|---|
| [`contexto.yml`](../../.github/workflows/contexto.yml) | **sem-commit** | "nada mudou" no publicar significa que nenhuma das três fontes mudou desde a última publicação |
| [`contexto.yml`](../../.github/workflows/contexto.yml) | **metricas** | métricas/manifests do banco aguardam 60 min desde a coleta publicada; commits de código não reiniciam o prazo |
| [`contexto.yml`](../../.github/workflows/contexto.yml) | **banco-pulado** | sem o secret SUPABASE_DB_URL (ou PROD_DB_URL) o job do banco sai verde com aviso e a pasta supabase/ fica como estava |
| [`estado-real.yml`](../../.github/workflows/estado-real.yml) | **sem-pr** | "nada mudou" significa que nenhum dos tres documentos divergiu do estado real |
| [`estado-real.yml`](../../.github/workflows/estado-real.yml) | **sem-bloco-docs** | workflow ainda sem bloco `# docs:` entra na lista de pendencias do README, nao reprova o job |
| [`estado-real.yml`](../../.github/workflows/estado-real.yml) | **kpi-sem-timing** | a duracao vem de run_started_at/updated_at porque /timing devolve billable vazio em repo publico |

## Workflows sem bloco `# docs:`

> Pendência, não erro: o gerador não reprova por isso. Enquanto o bloco não existir,
> ninguém sabe por este arquivo o que o workflow prova nem a quem ele avisa.

| Arquivo | Workflow |
|---|---|
| [`actionlint.yml`](../../.github/workflows/actionlint.yml) | Workflow Linter (actionlint + zizmor) |
| [`ci.yml`](../../.github/workflows/ci.yml) | CI Pipeline |
| [`codeql.yml`](../../.github/workflows/codeql.yml) | CodeQL Analysis |
| [`deno-tests.yml`](../../.github/workflows/deno-tests.yml) | Deno Edge Function Tests |
| [`dependency-review.yml`](../../.github/workflows/dependency-review.yml) | Dependency Review |
| [`functions-deploy.yml`](../../.github/workflows/functions-deploy.yml) | Deploy controlado de Edge Function |
| [`graphify.yml`](../../.github/workflows/graphify.yml) | Graphify — mapas privados |
| [`migration-ledger.yml`](../../.github/workflows/migration-ledger.yml) | Migration Ledger Check |
| [`prod-migrate.yml`](../../.github/workflows/prod-migrate.yml) | prod-migrate |
| [`schema-drift.yml`](../../.github/workflows/schema-drift.yml) | Schema drift (types + migrations) |
| [`staging-migrate.yml`](../../.github/workflows/staging-migrate.yml) | staging-migrate |
| [`supabase-admin-ops.yml`](../../.github/workflows/supabase-admin-ops.yml) | Ops administrativas do Supabase canônico |
| [`supabase-linter.yml`](../../.github/workflows/supabase-linter.yml) | Supabase Linter (RLS/GRANT gate) |

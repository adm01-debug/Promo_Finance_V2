# Workflows de CI — o que cada um faz

> **Gerado por `scripts/ci/render-workflow-docs.mjs`.** Não edite à mão: o workflow
> `estado-real.yml` roda `--check` e abre PR quando este arquivo divergir do bloco
> `# docs:` de cada workflow. Para mudar o que está aqui, mude o bloco no YAML.

**20 workflows — 7 com bloco `# docs:`, 13 sem.**

| Workflow | Arquivo | Gatilho | O que prova | Quando falha | Quem é avisado | Custo/sem (min) | Falha (7 d) |
|---|---|---|---|---|---|---|---|
| Auto Update PR Branches | [`auto-update-pr-branch.yml`](../../.github/workflows/auto-update-pr-branch.yml) | push em main, fim de CI Pipeline/Supabase Linter/Deno Edge Function Tests, agendado (minuto 11 e 41) e dispatch | fila de atualização serial — só a próxima PR atrasada é atualizada por execução; as demais esperam sem gastar CI | a fila para e as PRs atrasadas ficam BEHIND até o próximo evento | Job Summary com a fila (próxima, esperando, bloqueadas por check obrigatório, em conflito real) | 5260.7 | 0.3% |
| Automação local | [`automation-local.yml`](../../.github/workflows/automation-local.yml) | PR para main, push em main e execução manual. | Contratos estáticos e suites locais de automação em fixtures isoladas. | O job falha; nenhum patch, commit, publicação ou deploy é executado. | O check fica vermelho no GitHub para o autor da PR e mantenedores. | 7632.9 | 3% |
| Contexto para agentes de IA (10 min) | [`contexto.yml`](../../.github/workflows/contexto.yml) | push em main que toque código, banco, scripts das automações ou docs/contexto/regras/manual/; a cada 10 min (minuto 7); dispatch | branch contexto com docs/contexto/{codigo,supabase,regras}/ regerados das três fontes de verdade (código em main, banco oficial bwwbeyolnnzppeuhgkcd, código+migrations+manual/) e docs/contexto/00-INDEX.md montado a partir dos manifests | falha fatal de produtor reprova o workflow; fontes com artefato publicam e as demais mantêm a última versão | ninguém (a branch contexto é a prova; errors.md em supabase/ lista seções com falha) | 7239.4 | 1.7% |
| Estado real (CI e edge functions) | [`estado-real.yml`](../../.github/workflows/estado-real.yml) | segunda 11:38 UTC (08:38 BRT), push em main que toque workflows ou supabase/functions, e dispatch | docs/ci/README.md, docs/ci/MATRIZ_EDGE_TABELA.md e docs/ci/kpi.json refeitos do estado real (YAML dos workflows, .from() das edge functions, API do Actions) | o job fica vermelho e os docs gerados continuam como estavam | PR automation/estado-real quando algum doc divergir, e a issue [kpi-actions] com o custo semanal | 134.8 | 3.1% |
| Inventário do estado real (semanal) | [`inventario-estado.yml`](../../.github/workflows/inventario-estado.yml) | agendado (segunda 09:41 UTC), push em main que toque rotas/menu/edges/types/scripts do inventário, PR que toque os scripts (só testes) e dispatch | branch `inventario` com inventario/estado/{banco,rotas,edges}.json refeitos do banco oficial (somente leitura) e do código em main | o job fica vermelho e a branch `inventario` mantém a última versão publicada | ninguém (a branch é a prova; `alertas` dentro de banco.json lista o que está fora do lugar) | 297 | 0% |
| Vigilância de versões RFB (upstream watch) | [`rfb-upstream-watch.yml`](../../.github/workflows/rfb-upstream-watch.yml) | segunda ~06:23 BRT (09:23 UTC) e dispatch manual | compara a tag mais recente e o hash do CHANGELOG.md de cada repositório ReceitaFederal/calculadora-rtc-* contra docs/receitafederal/rfb-changelog-state.json | o job fica vermelho só se a API do GitHub ou o raw.githubusercontent.com estiverem inacessíveis; divergência de versão não é falha, é issue | issue com a label rfb-upstream quando tag ou CHANGELOG.md mudar, e PR automation/rfb-upstream-watch atualizando o state file | — | — |
| Settings Guard | [`settings-guard.yml`](../../.github/workflows/settings-guard.yml) | agendado 1x/dia (07:19 UTC) e dispatch | o perímetro do GitHub (branch protection, merge, actions, environments) contra o baseline versionado | issue [settings-guard] aberta; sem escopo suficiente o guard reporta ponto cego em vez de falhar em silêncio | issue [settings-guard] | 3.9 | 0% |

## Detalhe

### Auto Update PR Branches (`auto-update-pr-branch.yml`)

- **Gatilho:** push em main, fim de CI Pipeline/Supabase Linter/Deno Edge Function Tests, agendado (minuto 11 e 41) e dispatch
- **O que prova:** fila de atualização serial — só a próxima PR atrasada é atualizada por execução; as demais esperam sem gastar CI
- **Quando falha:** a fila para e as PRs atrasadas ficam BEHIND até o próximo evento
- **Quem é avisado:** Job Summary com a fila (próxima, esperando, bloqueadas por check obrigatório, em conflito real)

### Automação local (`automation-local.yml`)

- **Gatilho:** PR para main, push em main e execução manual.
- **O que prova:** Contratos estáticos e suites locais de automação em fixtures isoladas.
- **Quando falha:** O job falha; nenhum patch, commit, publicação ou deploy é executado.
- **Quem é avisado:** O check fica vermelho no GitHub para o autor da PR e mantenedores.

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

### Inventário do estado real (semanal) (`inventario-estado.yml`)

- **Gatilho:** agendado (segunda 09:41 UTC), push em main que toque rotas/menu/edges/types/scripts do inventário, PR que toque os scripts (só testes) e dispatch
- **O que prova:** branch `inventario` com inventario/estado/{banco,rotas,edges}.json refeitos do banco oficial (somente leitura) e do código em main
- **Quando falha:** o job fica vermelho e a branch `inventario` mantém a última versão publicada
- **Quem é avisado:** ninguém (a branch é a prova; `alertas` dentro de banco.json lista o que está fora do lugar)

### Vigilância de versões RFB (upstream watch) (`rfb-upstream-watch.yml`)

- **Gatilho:** segunda ~06:23 BRT (09:23 UTC) e dispatch manual
- **O que prova:** compara a tag mais recente e o hash do CHANGELOG.md de cada repositório ReceitaFederal/calculadora-rtc-* contra docs/receitafederal/rfb-changelog-state.json
- **Quando falha:** o job fica vermelho só se a API do GitHub ou o raw.githubusercontent.com estiverem inacessíveis; divergência de versão não é falha, é issue
- **Quem é avisado:** issue com a label rfb-upstream quando tag ou CHANGELOG.md mudar, e PR automation/rfb-upstream-watch atualizando o state file

### Settings Guard (`settings-guard.yml`)

- **Gatilho:** agendado 1x/dia (07:19 UTC) e dispatch
- **O que prova:** o perímetro do GitHub (branch protection, merge, actions, environments) contra o baseline versionado
- **Quando falha:** issue [settings-guard] aberta; sem escopo suficiente o guard reporta ponto cego em vez de falhar em silêncio
- **Quem é avisado:** issue [settings-guard]

## O que NÃO é bug

> Comportamentos que parecem erro mas são design intencional.
> Cada item vem do bloco `# nao-e-bug:` do YAML do workflow.

| Workflow | Situação | Por quê não é bug |
|---|---|---|
| [`auto-update-pr-branch.yml`](../../.github/workflows/auto-update-pr-branch.yml) | **uma-por-vez** | so UMA PR e atualizada por execucao, mesmo com varias atrasadas — e o ponto (R1 do Zapp_Web_V2, origem deste workflow): atualizar todas de uma vez faz as N recomecarem a CI ao mesmo tempo, disputando runner, sem nenhuma chegar ao merge mais rapido. |
| [`auto-update-pr-branch.yml`](../../.github/workflows/auto-update-pr-branch.yml) | **conflito-fica** | PR com mergeStateStatus DIRTY nunca e atualizada por este workflow — e conflito real, so o autor resolve (rebase na sua branch, nunca nesta automacao). |
| [`contexto.yml`](../../.github/workflows/contexto.yml) | **sem-commit** | "nada mudou" no publicar significa que nenhuma das três fontes mudou desde a última publicação |
| [`contexto.yml`](../../.github/workflows/contexto.yml) | **metricas** | métricas/manifests do banco aguardam 60 min desde a coleta publicada; commits de código não reiniciam o prazo |
| [`contexto.yml`](../../.github/workflows/contexto.yml) | **banco-pulado** | sem o secret SUPABASE_DB_URL (ou PROD_DB_URL) o job do banco sai verde com aviso e a pasta supabase/ fica como estava |
| [`estado-real.yml`](../../.github/workflows/estado-real.yml) | **sem-pr** | "nada mudou" significa que nenhum dos tres documentos divergiu do estado real |
| [`estado-real.yml`](../../.github/workflows/estado-real.yml) | **sem-bloco-docs** | workflow ainda sem bloco `# docs:` entra na lista de pendencias do README, nao reprova o job |
| [`estado-real.yml`](../../.github/workflows/estado-real.yml) | **kpi-sem-timing** | a duracao vem de run_started_at/updated_at porque /timing devolve billable vazio em repo publico |
| [`inventario-estado.yml`](../../.github/workflows/inventario-estado.yml) | **sem-publicacao** | "nada mudou" significa que o conteúdo é igual ao publicado fora dos carimbos de data e da telemetria rolante do cron |
| [`inventario-estado.yml`](../../.github/workflows/inventario-estado.yml) | **sem-token** | sem o secret SUPABASE_ACCESS_TOKEN o job falha de propósito — sem ele não há estado real do banco para inventariar |

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

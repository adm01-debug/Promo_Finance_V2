# Automação local — Promo_Finance_V2

O dispatcher `scripts/automation.mjs` liga as suites, o motor de manutenção e o adaptador de grafo. O perfil versionado `scripts/automation.config.json` é a fonte dos aliases e do registro exato de scripts. Apenas ferramentas determinísticas locais: não há chamadas de IA nem cobrança de API de IA. O CI usa minutos do GitHub Actions sujeitos ao plano da conta; execução local usa os recursos da máquina.

## Comandos

| Alias | Comando executado | Efeito |
|---|---|---|
| `automation:doctor` | `node scripts/automation.mjs doctor` | Verifica arquivos, aliases, registros e instalação local de hooks. |
| `automation:test` | `node scripts/automation.mjs test` | Roda exclusivamente as suites registradas abaixo. |
| `automation:check` | `node scripts/automation.mjs check --ref HEAD` | Inspeciona a referência HEAD em worktree isolada. |
| `automation:heal` | `node scripts/automation.mjs heal --ref origin/main` | Propõe e valida correções limitadas a partir de origin/main; não faz push. |
| `automation:nightly` | `node scripts/automation.mjs nightly --ref origin/main` | Atualiza o grafo e tenta manutenção isolada; relata as duas falhas independentemente. |
| `automation:graph` | `node scripts/automation.mjs graph` | Encaminha subcomandos do grafo; acrescente status, query, path ou explain. |
| `automation:status` | `node scripts/automation.mjs graph status` | Mostra a situação local do grafo. |
| `automation:install-hooks` | `node scripts/automation.mjs install-hooks` | Instala pontes locais reversíveis, encadeando hooks originais. |
| `automation:uninstall-hooks` | `node scripts/automation.mjs uninstall-hooks` | Restaura o hooksPath anterior, recusando sobrescrever alteração de terceiros. |

O comando estático para CI é `node scripts/automation.mjs doctor --static`. Ele verifica contratos; não comprova merge, execução remota, timer ou ponte instalada. `doctor` sem `--static` também exige a instalação local. Ausência de dependência é erro explícito; o dispatcher não instala pacotes automaticamente.

## Gatilhos e ativação

| Gatilho | Cadeia real de execução | Ativação |
|---|---|---|
| PR para main / push em main / dispatch | `.github/workflows/automation-local.yml` → `doctor --static` → `test` → suites exatas do perfil | Workflow versionado; atividade remota depende de publicação/merge e run observado. |
| pre-commit com tooling staged | Ponte privada → hook original → `automation.mjs hook pre-commit` → suites registradas | `automation:install-hooks` instala por clone; não é instalado pelo prepare. |
| pre-push | Ponte privada → hook original → doctor local → suites registradas | A mesma instalação local; erro bloqueia a operação. |
| Fontes staged / post-commit / post-merge / post-checkout | Ponte privada → hook original → adaptador de grafo marca estado sujo | Não reconstrói grafo durante commit nem altera staging. |
| Noturno local, previsto 04:30 | Timer do runtime → callback externo `repo-automation-nightly` → `scripts/automation-nightly.sh` → `automation.mjs nightly --ref origin/main` → graph ensure + motor heal | Configuração do timer fica fora do repositório, sob responsabilidade do runtime local. O callback versionado contém o comando real; presença do arquivo não comprova timer ativo. |

A ponte privada fica em `.tools/repo-automation/`; não substitui os arquivos Husky. Preserva erros, argumentos e stdin dos hooks originais, incluindo commit-msg. `prepare`, hooks e guards existentes foram preservados. Para reverter, use `automation:uninstall-hooks`. `nightly.file` aponta para `scripts/automation-nightly.sh`, cuja cadeia é verificada pelo doctor; nenhum arquivo fictício é usado como evidência de agendamento. O runtime deve conferir `systemctl --user status` e a cadeia do callback instalado antes de declarar o timer ativo.

## Suites efetivamente executadas

- `scripts/automation.unit.mjs`
- `scripts/maintenance/maintenance.unit.mjs`
- `scripts/graphify-local.unit.mjs`

As suites usam fixtures descartáveis e não executam os scripts operacionais do inventário. O motor mantém isolamento de rede, validações obrigatórias, escopo e quotas; um gate herdado vermelho bloqueia o patch. Nenhuma referência, tipo gerado, configuração de produção ou regra de negócio é alterada para forçar verde. O grafo usa o perfil específico `graphify.local.json`; seu estado local fica em `.tools/graphify/local-state/`.

## Registro exato dos demais scripts

Os registros `legacy` abaixo preservam ferramentas anteriores e seus chamadores; não são incluídos automaticamente no novo pipeline. Para arquivos TypeScript de apoio sem runner comprovado, o comando listado só valida o inventário; os chamadores originais continuam sendo a referência de execução. Referência literal indica onde o arquivo é citado, sem garantir que esse caminho rode nem autorização para executar operações contra serviços. Sem referência, o arquivo é mantido manual porque função, parâmetros e ambiente precisam de revisão antes de ativar qualquer gatilho. Scripts novos não cobertos por registro fazem `doctor --static` falhar; não existe registro genérico `scripts/**` para ocultá-los.

| Arquivo exato | Invocação manual de inventário | Chamadores literais / justificativa |
|---|---|---|
| `scripts/admin/supabase_admin_ops.py` | `python3 scripts/admin/supabase_admin_ops.py` | .github/workflows/supabase-admin-ops.yml |
| `scripts/admin/test_supabase_admin_ops_scenarios.py` | `python3 scripts/admin/test_supabase_admin_ops_scenarios.py` | scripts/validate-all.sh |
| `scripts/ai-context/cenarios.mjs` | `node scripts/ai-context/cenarios.mjs` | .github/workflows/contexto.yml |
| `scripts/ai-context/gerar.mjs` | `node scripts/ai-context/gerar.mjs` | .github/workflows/contexto.yml |
| `scripts/ai-context/gerar.unit.mjs` | `node --test scripts/ai-context/gerar.unit.mjs` | .github/workflows/contexto.yml |
| `scripts/check-external-secret-isolation.sh` | `sh scripts/check-external-secret-isolation.sh` | .github/workflows/ci.yml |
| `scripts/ci/actions-kpi.mjs` | `node scripts/ci/actions-kpi.mjs` | .github/workflows/estado-real.yml |
| `scripts/ci/actions-kpi.unit.mjs` | `node --test scripts/ci/actions-kpi.unit.mjs` | .github/workflows/estado-real.yml |
| `scripts/ci/audit-env.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/ci/check-baseline-drift.sh` | `sh scripts/ci/check-baseline-drift.sh` | scripts/validate-all.sh |
| `scripts/ci/check-claude-md-integrity.mjs` | `node scripts/ci/check-claude-md-integrity.mjs` | .github/workflows/ci.yml |
| `scripts/ci/deno-check-functions.sh` | `sh scripts/ci/deno-check-functions.sh` | .github/workflows/deno-tests.yml |
| `scripts/ci/gerar-matriz-edge-tabela.mjs` | `node scripts/ci/gerar-matriz-edge-tabela.mjs` | .github/workflows/estado-real.yml |
| `scripts/ci/gerar-matriz-edge-tabela.unit.mjs` | `node --test scripts/ci/gerar-matriz-edge-tabela.unit.mjs` | .github/workflows/estado-real.yml |
| `scripts/ci/listar-excecoes-npm-nativo.py` | `python3 scripts/ci/listar-excecoes-npm-nativo.py` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/ci/listar-specs-quarentena.ts` | `node scripts/automation.mjs doctor --static` | .github/workflows/ci.yml |
| `scripts/ci/render-workflow-docs.mjs` | `node scripts/ci/render-workflow-docs.mjs` | .github/workflows/estado-real.yml |
| `scripts/ci/render-workflow-docs.unit.mjs` | `node --test scripts/ci/render-workflow-docs.unit.mjs` | .github/workflows/estado-real.yml |
| `scripts/ci/require-env.sh` | `sh scripts/ci/require-env.sh` | .github/workflows/ci.yml, .github/workflows/deno-tests.yml, .github/workflows/functions-deploy.yml, .github/workflows/supabase-linter.yml |
| `scripts/ci/typecheck-strict-baseline.sh` | `sh scripts/ci/typecheck-strict-baseline.sh` | package.json:scripts |
| `scripts/data-migrate.sh` | `sh scripts/data-migrate.sh` | scripts/staging-migrate.sh |
| `scripts/data/copy-table.sh` | `sh scripts/data/copy-table.sh` | scripts/data-migrate.sh |
| `scripts/data/rollback.sh` | `sh scripts/data/rollback.sh` | scripts/data-migrate.sh |
| `scripts/data/test_verify_scenarios.py` | `python3 scripts/data/test_verify_scenarios.py` | scripts/validate-all.sh |
| `scripts/data/verify.sh` | `sh scripts/data/verify.sh` | scripts/data-migrate.sh, scripts/data/test_verify_scenarios.py, scripts/validate-all.sh |
| `scripts/edge-deploy/deployment-record.mjs` | `node scripts/edge-deploy/deployment-record.mjs` | scripts/edge-deploy/deployment-record.unit.mjs, scripts/edge-deploy/register-deployment.mjs |
| `scripts/edge-deploy/deployment-record.unit.mjs` | `node --test scripts/edge-deploy/deployment-record.unit.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/edge-deploy/health-check.mjs` | `node scripts/edge-deploy/health-check.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/edge-deploy/redigir-log.mjs` | `node scripts/edge-deploy/redigir-log.mjs` | scripts/edge-deploy/redigir-log.unit.mjs |
| `scripts/edge-deploy/redigir-log.unit.mjs` | `node --test scripts/edge-deploy/redigir-log.unit.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/edge-deploy/register-deployment.mjs` | `node scripts/edge-deploy/register-deployment.mjs` | scripts/edge-deploy/register-deployment.unit.mjs |
| `scripts/edge-deploy/register-deployment.unit.mjs` | `node --test scripts/edge-deploy/register-deployment.unit.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/edge-deploy/secrets-scope.mjs` | `node scripts/edge-deploy/secrets-scope.mjs` | scripts/edge-deploy/secrets-scope.unit.mjs |
| `scripts/edge-deploy/secrets-scope.unit.mjs` | `node --test scripts/edge-deploy/secrets-scope.unit.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/edge-deploy/smoke-functions.mjs` | `node scripts/edge-deploy/smoke-functions.mjs` | scripts/edge-deploy/smoke-functions.unit.mjs |
| `scripts/edge-deploy/smoke-functions.unit.mjs` | `node --test scripts/edge-deploy/smoke-functions.unit.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/edge-deploy/unchanged-from-log.mjs` | `node scripts/edge-deploy/unchanged-from-log.mjs` | scripts/edge-deploy/unchanged-from-log.unit.mjs |
| `scripts/edge-deploy/unchanged-from-log.unit.mjs` | `node --test scripts/edge-deploy/unchanged-from-log.unit.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/edge-deploy/verify-remote.mjs` | `node scripts/edge-deploy/verify-remote.mjs` | scripts/edge-deploy/verify-remote.unit.mjs |
| `scripts/edge-deploy/verify-remote.unit.mjs` | `node --test scripts/edge-deploy/verify-remote.unit.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/generate-design-audit.js` | `node scripts/generate-design-audit.js` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/generate-env-manifest.mjs` | `node scripts/generate-env-manifest.mjs` | .github/workflows/ci.yml |
| `scripts/generate-simulation-report.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/gerar-grafo-arquitetura.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/graphify/benchmark.py` | `python3 scripts/graphify/benchmark.py` | package.json:scripts, .github/workflows/graphify.yml |
| `scripts/graphify/code_references.py` | `python3 scripts/graphify/code_references.py` | package.json:scripts, .github/workflows/graphify.yml |
| `scripts/graphify/edge_inventory.py` | `python3 scripts/graphify/edge_inventory.py` | package.json:scripts, .github/workflows/graphify.yml |
| `scripts/graphify/graph_quality.py` | `python3 scripts/graphify/graph_quality.py` | package.json:scripts, .github/workflows/graphify.yml |
| `scripts/graphify/run.py` | `python3 scripts/graphify/run.py` | package.json:scripts, .github/workflows/graphify.yml |
| `scripts/graphify/sql_inventory.py` | `python3 scripts/graphify/sql_inventory.py` | package.json:scripts, .github/workflows/graphify.yml |
| `scripts/graphify/test_benchmark.py` | `python3 scripts/graphify/test_benchmark.py` | .github/workflows/graphify.yml |
| `scripts/graphify/test_code_references.py` | `python3 scripts/graphify/test_code_references.py` | .github/workflows/graphify.yml |
| `scripts/graphify/test_edge_inventory.py` | `python3 scripts/graphify/test_edge_inventory.py` | .github/workflows/graphify.yml |
| `scripts/graphify/test_graph_quality.py` | `python3 scripts/graphify/test_graph_quality.py` | .github/workflows/graphify.yml |
| `scripts/graphify/test_profiles.py` | `python3 scripts/graphify/test_profiles.py` | .github/workflows/graphify.yml |
| `scripts/graphify/test_requirements_lock.py` | `python3 scripts/graphify/test_requirements_lock.py` | .github/workflows/graphify.yml |
| `scripts/graphify/test_run.py` | `python3 scripts/graphify/test_run.py` | .github/workflows/graphify.yml |
| `scripts/graphify/test_scenarios.py` | `python3 scripts/graphify/test_scenarios.py` | .github/workflows/graphify.yml |
| `scripts/graphify/test_sql_inventory.py` | `python3 scripts/graphify/test_sql_inventory.py` | .github/workflows/graphify.yml |
| `scripts/graphify/test_typescript_imports.py` | `python3 scripts/graphify/test_typescript_imports.py` | .github/workflows/graphify.yml |
| `scripts/graphify/typescript_imports.py` | `python3 scripts/graphify/typescript_imports.py` | .github/workflows/graphify.yml |
| `scripts/healthcheck/01_webhooks.sh` | `sh scripts/healthcheck/01_webhooks.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/healthcheck/03_realtime.mjs` | `node scripts/healthcheck/03_realtime.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/healthcheck/04_events.sh` | `sh scripts/healthcheck/04_events.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/healthcheck/run.sh` | `sh scripts/healthcheck/run.sh` | scripts/staging-migrate.sh, scripts/validate-all.sh |
| `scripts/integrity/04_endpoints.sh` | `sh scripts/integrity/04_endpoints.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/integrity/dump-baseline.sh` | `sh scripts/integrity/dump-baseline.sh` | scripts/ci/check-baseline-drift.sh, scripts/integrity/test_dump_baseline_scenarios.py, scripts/staging-migrate.sh |
| `scripts/integrity/run.sh` | `sh scripts/integrity/run.sh` | scripts/staging-migrate.sh, scripts/validate-all.sh |
| `scripts/integrity/test_dump_baseline_scenarios.py` | `python3 scripts/integrity/test_dump_baseline_scenarios.py` | scripts/validate-all.sh |
| `scripts/inventario/gerar-banco.mjs` | `node scripts/inventario/gerar-banco.mjs` | .github/workflows/inventario-estado.yml |
| `scripts/inventario/gerar-repo.mjs` | `node scripts/inventario/gerar-repo.mjs` | .github/workflows/inventario-estado.yml |
| `scripts/inventario/gerar-rotas.mjs` | `node scripts/inventario/gerar-rotas.mjs` | .github/workflows/inventario-estado.yml |
| `scripts/inventario/inventario.unit.mjs` | `node --test scripts/inventario/inventario.unit.mjs` | .github/workflows/inventario-estado.yml |
| `scripts/inventario/mudou-conteudo.mjs` | `node scripts/inventario/mudou-conteudo.mjs` | .github/workflows/inventario-estado.yml |
| `scripts/mcp-phd-suite.mjs` | `node scripts/mcp-phd-suite.mjs` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/migrate-cron-jobs.sh` | `sh scripts/migrate-cron-jobs.sh` | scripts/staging-migrate.sh, scripts/validate-all.sh |
| `scripts/migrate-functions.sh` | `sh scripts/migrate-functions.sh` | .github/workflows/functions-deploy.yml |
| `scripts/regras_negocio/generate.py` | `python3 scripts/regras_negocio/generate.py` | .github/workflows/contexto.yml |
| `scripts/regras_negocio/indice.py` | `python3 scripts/regras_negocio/indice.py` | .github/workflows/contexto.yml |
| `scripts/regras_negocio/test_generate.py` | `python3 scripts/regras_negocio/test_generate.py` | .github/workflows/contexto.yml |
| `scripts/run-scenarios.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/security/check-view-replay-order.mjs` | `node scripts/security/check-view-replay-order.mjs` | .github/workflows/supabase-linter.yml |
| `scripts/security/export-function-privileges.sh` | `sh scripts/security/export-function-privileges.sh` | .github/workflows/ci.yml |
| `scripts/security/test-anon-surface.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/security/test-canonical-db-gates.mjs` | `node scripts/security/test-canonical-db-gates.mjs` | .github/workflows/supabase-linter.yml |
| `scripts/security/test-canonical-db-gates.test.mjs` | `node --test scripts/security/test-canonical-db-gates.test.mjs` | .github/workflows/ci.yml, .github/workflows/supabase-linter.yml |
| `scripts/security/test-functions-deploy.sh` | `sh scripts/security/test-functions-deploy.sh` | .github/workflows/ci.yml, .github/workflows/functions-deploy.yml |
| `scripts/security/test-lint-function-repairs.mjs` | `node scripts/security/test-lint-function-repairs.mjs` | .github/workflows/ci.yml, .github/workflows/supabase-linter.yml |
| `scripts/security/test-migration-replay-safety.sh` | `sh scripts/security/test-migration-replay-safety.sh` | .github/workflows/ci.yml, .github/workflows/supabase-linter.yml |
| `scripts/security/test-rpc-runtime.evaluate.test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/security/test-rpc-runtime.ts` | `node scripts/automation.mjs doctor --static` | .github/workflows/ci.yml |
| `scripts/security/test-supabase-config.py` | `python3 scripts/security/test-supabase-config.py` | .github/workflows/ci.yml, .github/workflows/functions-deploy.yml, .github/workflows/supabase-linter.yml |
| `scripts/security/zod-coverage.sh` | `sh scripts/security/zod-coverage.sh` | .github/workflows/ci.yml |
| `scripts/simular-observabilidade-digest.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/simular-preferencias-digest.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/simular-projecao-conformidade.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/staging-migrate.sh` | `sh scripts/staging-migrate.sh` | .github/workflows/staging-migrate.yml |
| `scripts/stress-test.ts` | `node scripts/automation.mjs doctor --static` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |
| `scripts/supabase_snapshot/snapshot.py` | `python3 scripts/supabase_snapshot/snapshot.py` | .github/workflows/contexto.yml |
| `scripts/supabase_snapshot/test_snapshot.py` | `python3 scripts/supabase_snapshot/test_snapshot.py` | .github/workflows/contexto.yml |
| `scripts/validate-all.sh` | `sh scripts/validate-all.sh` | Sem chamador literal; manter manual e revisar parâmetros/ambiente antes de executar. |

## Hooks e workflows anteriores

Hooks inventariados: `.husky/_` era o hooksPath observado. A tabela registra os arquivos, sem afirmar bootstrap instalado ou execução efetiva em outro clone. O registro legacy desses hooks limita apenas execução arbitrária pelo dispatcher; o Git e a ponte preservam os gatilhos originais.

| Hook exato | Gatilho Git original | Referência de inventário |
|---|---|---|
| `.husky/pre-commit` | `pre-commit` | Hook preservado e encadeado antes do novo dispatcher. |
| `.husky/pre-push` | `pre-push` | Hook preservado e encadeado antes do novo dispatcher. |

Workflows anteriores preservados: 16. Os gatilhos e condições de cada arquivo continuam definidos no YAML original; esta listagem não os promove ao novo pipeline e não executa suas operações.

- `.github/workflows/actionlint.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/codeql.yml`
- `.github/workflows/contexto.yml`
- `.github/workflows/deno-tests.yml`
- `.github/workflows/dependency-review.yml`
- `.github/workflows/estado-real.yml`
- `.github/workflows/functions-deploy.yml`
- `.github/workflows/graphify.yml`
- `.github/workflows/inventario-estado.yml`
- `.github/workflows/migration-ledger.yml`
- `.github/workflows/prod-migrate.yml`
- `.github/workflows/schema-drift.yml`
- `.github/workflows/staging-migrate.yml`
- `.github/workflows/supabase-admin-ops.yml`
- `.github/workflows/supabase-linter.yml`

Os helpers dos corretores anteriores são cobertos por suites de regressão em fixtures; a chamada operacional original continua no respectivo hook/workflow. Os quatro registros principais e helpers ficam explícitos no JSON, sem globs para novos arquivos.

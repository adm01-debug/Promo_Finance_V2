# Reconciliação online — 2026-08-31

## Escopo desta rodada

- restaurar no repositório canônico os 5 arquivos de migration ausentes (`20260826010000` a `20260826050000`)
- remover do código-fonte o diretório obsoleto `supabase/functions/migrate-helper`
- endurecer a edge `mcp-query` com política compilável, testada e fail-closed
- corrigir o pipeline para não mascarar falsos positivos em E2E, logout e evidências de segurança
- validar o estado real do GitHub e do Supabase canônico antes de qualquer publicação

## Evidência local validada nesta rodada

| Verificação | Resultado |
| --- | --- |
| `node scripts/mcp-phd-suite.mjs --self-test` | 15/15 checks OK |
| `bun test scripts/security/test-rpc-runtime.evaluate.test.ts` | 4/4 testes OK |
| `deno test --allow-env=ALLOWED_ORIGINS --no-lock ... rate-limit / bling / sql-write-guard / mcp-query` | 28/28 testes OK |
| `bun run test:run` | 204 arquivos, 2689 testes OK |
| `bun run type-check` | OK |
| `bun run lint` | OK, 0 erros e 19 warnings legados fora do escopo |
| `bun run build` | OK com ambiente explícito do projeto canônico (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`) |
| `bunx playwright test e2e/visual-theme.e2e.ts --project=chromium --grep 'Login'` | 2 testes OK, 1 skip esperado (snapshots autenticados opt-in) |
| `bunx playwright test e2e/auth/admin-rbac.e2e.ts --project=chromium --grep 'Não autenticado' --workers=1` | 14 testes OK, 1 skip esperado (`setup` sem credenciais) |
| `git diff --check` | OK |

## GitHub — estado real em 2026-08-31

- `origin/main` ainda está em `5093a727b6cc996bdf3a008e6627a2fc145109ae`
- o repositório está público e `main` está sem branch protection no momento
- as PRs `#48`, `#49`, `#50`, `#51` e `#52` estão abertas e ainda não estão refletidas em `main`
- a `#51` ainda falha no workflow `CI Pipeline`; portanto, não é segura para merge direto
- a `#52` já existe para esta trilha (`fix/codex-h0831-reconciliacao-online`) e o commit `d49ead0d5d0c7bdeba6bacaa21fc0de1c2a894b1` iniciou novos runs: `Supabase Linter` e `Deno Edge Function Tests` em sucesso; `CI Pipeline` em andamento no momento desta evidência
- o `gh` local está com token inválido, mas a validação remota do branch e das PRs foi confirmada por `git ls-remote` e GitHub API

## Supabase canônico (`bwwbeyolnnzppeuhgkcd`) — estado real em 2026-08-31

- 102 Edge Functions ativas
- `migrate-helper` não existe online
- as migrations `20260826010000`, `20260826020000`, `20260826030000`, `20260826040000` e `20260826050000` já existem no ledger remoto
- `public.exec_sql(text)` responde no PostgREST do projeto canônico e mantém ACL correta: `anon=false`, `authenticated=false`, `service_role=true`
- o secret `MCP_SECRET` ainda não existe no projeto
- existem 12 secrets cadastrados; os nomes confirmados desta rodada incluem `ASAAS_WEBHOOK_TOKEN`, `BITRIX24_WEBHOOK_SECRET`, `BLING_WEBHOOK_SECRET`, `REGUA_CRON_SECRET`, `SUPABASE_*` e `WHATSAPP_WEBHOOK_SECRET`
- a edge `mcp-query` continua online em `version=5` com `verify_jwt=true`; o código validado nesta rodada muda o contrato para `verify_jwt=false` + `x-mcp-secret`, portanto o deploy precisa ser coordenado com a criação de `MCP_SECRET`
- a matriz `verify_jwt` do repositório foi reconciliada contra o catálogo canônico live em 2026-08-31; após essa reconciliação, o único drift remanescente entre `supabase/config.toml` e o ambiente online é `mcp-query`
- as revogações de `EXECUTE` para `authenticated` em `confirmar_conciliacao`, `desfazer_conciliacao` e `nfe_apply_manifestacao` estão efetivas no catálogo live
- antes do deploy desta rodada, as 15 functions mais sensíveis estavam em versões live heterogêneas (`mcp-query` v4, `calcular-slo-metrics-diario` v3, `compare-schemas` v3, `processar-fila-cobrancas` v3, `gerar-resumo-financeiro-diario` v3, webhooks entre v6 e v7)
- nenhuma DDL foi aplicada nesta rodada; toda a validação remota foi feita em modo leitura

## Proveniência dos arquivos restaurados

| Arquivo | Proveniência exata | Estado remoto validado | Ressalva |
| --- | --- | --- | --- |
| `supabase/migrations/20260826010000_restaurar_exec_sql_wrapper_e03.sql` | commit `1cb59c32f2b863bd8089f27e1cd5b4eb600436e5` | ledger remoto presente | restaurado localmente a partir da fonte exata |
| `supabase/migrations/20260826020000_fix_cron_source_check_e23_e24.sql` | commit `1cb59c32f2b863bd8089f27e1cd5b4eb600436e5` | ledger remoto presente | restaurado localmente a partir da fonte exata |
| `supabase/migrations/20260826030000_add_colunas_ausentes_e30.sql` | commit `489e7fc3732a2c5babc302f584e087f3969bef2d` | ledger remoto presente | arquivo histórico incompleto; não é replayável isoladamente |
| `supabase/migrations/20260826040000_fechar_policies_abertas_e06_e08.sql` | commit `94bd5f5ce06f0f9da4662193a8ca9c1925c11330` | ledger remoto presente | restaurado localmente a partir da fonte exata |
| `supabase/migrations/20260826050000_revoke_execute_authenticated_e09.sql` | commit `94bd5f5ce06f0f9da4662193a8ca9c1925c11330` | ledger remoto presente | restaurado localmente a partir da fonte exata |
| `docs/adr/0001-fonte-da-verdade-migracao.md` | commit `489e7fc3732a2c5babc302f584e087f3969bef2d` | não aplicável | ADR restaurado textualmente |

## Observação importante sobre a `20260826030000`

A `20260826030000_add_colunas_ausentes_e30.sql` foi preservada como evidência histórica de ledger e contexto operacional. Ela não contém os `ALTER TABLE ... ADD COLUMN ...` originais; portanto, não deve ser tratada como migration replayável para reconstrução de schema.

## Correções de interpretação aplicadas nesta revalidação

- `performance_alerts_source_check` no catálogo canônico atual é constraint de `public.performance_alerts`, não view. Portanto, a verificação correta é por constraint/catalogo de tabela, não por `pg_get_viewdef(...)`.
- nomes históricos de policies de conciliação não devem ser usados como prova isolada: a validação precisa comparar tabela, comando e expressão real no catálogo live.

## Gaps ainda pendentes de publicação

- o código desta rodada ainda não foi enviado para `main`
- `mcp-query` ainda não foi republicada no projeto canônico com `verify_jwt=false` + `x-mcp-secret`
- a criação de `MCP_SECRET` precisa acontecer no Supabase no mesmo fluxo de deploy da `mcp-query`
- o gate SQL remoto via `DATABASE_URL` continua dependente de secret não comprovado por esta rodada; por isso a prova de ACL em produção foi validada por leitura dirigida e não por job automatizado
- o fluxo de logout real continua dependendo de credenciais E2E e deve ser validado pelo job `e2e-destructive`; aqui só foram validadas as rotas públicas e anônimas

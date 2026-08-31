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
| `deno test --no-lock ... rate-limit / bling / sql-write-guard / mcp-query` | 28/28 testes OK |
| `bun run test:run` | 204 arquivos, 2689 testes OK |
| `bun run type-check` | não concluiu dentro da janela observável local; não foi marcado como aprovado nesta rodada |
| `bun run lint` | OK, 0 erros e 19 warnings legados fora do escopo |
| `bun run test:coverage` | OK, cobertura v8 concluída (`Statements 72.51%`, `Branches 66.33%`, `Functions 63.95%`, `Lines 73.56%`) |
| `bun run build` | OK com ambiente explícito do projeto canônico (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`) |
| `git diff --check` | OK |

## GitHub — estado real em 2026-08-31

- `origin/main` ainda está em `5093a727b6cc996bdf3a008e6627a2fc145109ae`
- as PRs `#48`, `#49`, `#50` e `#51` continuam abertas e não estão refletidas em `main`
- a `#51` ainda falha no workflow `CI Pipeline`; portanto, não é segura para merge direto
- o repositório tem os secrets necessários para `build` e E2E (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `VITE_SUPABASE_*`)
- a variável de repositório `ENABLE_AUTHENTICATED_VISUAL_SNAPSHOTS` não está cadastrada; os snapshots autenticados continuam corretamente tratados como opt-in
- esta worktree (`fix/codex-h0831-reconciliacao-online`) é a trilha correta para consolidar as correções validadas

## Supabase canônico (`bwwbeyolnnzppeuhgkcd`) — estado real em 2026-08-31

- 102 Edge Functions ativas
- `migrate-helper` não existe online
- as migrations `20260826010000`, `20260826020000`, `20260826030000`, `20260826040000` e `20260826050000` já existem no ledger remoto
- o secret `MCP_SECRET` ainda não existe no projeto
- os secrets de webhook/cron existem; a edge `mcp-query` ainda depende de publicação coordenada com esse novo secret
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

## Gaps ainda pendentes de publicação

- o código desta rodada ainda não foi enviado para `main`
- as Edge Functions endurecidas ainda não foram publicadas no projeto canônico
- a criação de `MCP_SECRET` precisa acontecer no Supabase e no GitHub no mesmo fluxo de deploy
- o gate SQL remoto via `DATABASE_URL` continua dependente de secret inexistente no GitHub; por isso a prova de ACL em produção foi validada por leitura dirigida e não por job automatizado
- os E2E reais precisam ser validados via CI remoto, porque o sandbox local não permite abrir a porta `8080` para o `webServer` do Playwright

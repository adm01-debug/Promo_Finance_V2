# Reconciliação online — 2026-08-31

> Documento histórico de reconciliação coletado em 2026-08-31. Ele não prova
> replay total das migrations em ambiente limpo e não deve ser lido como estado
> online garantido após essa data.

> Nesta trilha de correção da cadeia de replay, arquivos já aplicados no remoto
> e presentes no ledger não devem ser reaplicados manualmente só para
> “sincronizar” evidência. Nenhuma DDL foi executada live por esta revisão
> documental/replay.

## Escopo desta rodada

- restaurar no repositório canônico os 5 arquivos de migration ausentes (`20260826010000` a `20260826050000`)
- remover do código-fonte o diretório obsoleto `supabase/functions/migrate-helper`
- endurecer a edge `mcp-query` com política compilável, testada e fail-closed
- corrigir o pipeline para não mascarar falsos positivos em E2E, logout e evidências de segurança
- validar o estado real do GitHub e do Supabase canônico antes de qualquer publicação

## Limites de replay/preview desta trilha

- o Supabase Preview falhou antes da faixa `20260826010000`–`20260826050000`
  por causa da linha histórica `ALTER DATABASE postgres SET "app.jwt_secret"`,
  portanto essa PR não provou replay integral em ambiente limpo
- `20260826010000_restaurar_exec_sql_wrapper_e03.sql` só é segura quando
  `private.exec_sql(text)` já existe; fora disso, o wrapper deve permanecer
  ausente por fail-safe
- `20260826030000_add_colunas_ausentes_e30.sql` é apenas marcador histórico
  local; não reconstrói schema e não deve reescrever ledger
- `20260826040000_fechar_policies_abertas_e06_e08.sql` e
  `20260826050000_revoke_execute_authenticated_e09.sql` precisaram de
  endurecimento local de replay para evitar falhas por objetos já existentes ou
  não versionados

## Evidência local validada nesta rodada

| Verificação | Resultado |
| --- | --- |
| `node scripts/mcp-phd-suite.mjs --self-test` | 15/15 checks OK |
| `bun test scripts/security/test-rpc-runtime.evaluate.test.ts` | 4/4 testes OK |
| `node --test scripts/security/test-canonical-db-gates.test.mjs` | gate offline do banco canônico OK |
| `node scripts/security/test-canonical-db-gates.mjs` | gate live do banco canônico OK (`bwwbeyolnnzppeuhgkcd`) |
| `bash scripts/security/test-migration-replay-safety.sh` | replay safety das migrations críticas OK |
| `bash scripts/ci/deno-check-functions.sh` | type-check do escopo endurecido OK (13 arquivos críticos) |
| `deno test --allow-env --allow-net --allow-read --no-check ... auth-guard / webhook-auth / sql-write-guard / mcp-query / funções endurecidas` | 54 testes OK |
| `bun run test:run` | 204 arquivos, 2689 testes OK |
| `bun run type-check` | OK |
| `bun run lint` | OK, 0 erros e 19 warnings legados fora do escopo |
| `bun run build` | OK com ambiente explícito (`VITE_SUPABASE_URL=https://bwwbeyolnnzppeuhgkcd.supabase.co`, `VITE_SUPABASE_PROJECT_ID=bwwbeyolnnzppeuhgkcd`, `VITE_SUPABASE_PUBLISHABLE_KEY=test-key`) |
| `bunx playwright test e2e/visual-theme.e2e.ts --project=chromium --grep 'Login'` | 2 testes OK, 1 skip esperado (snapshots autenticados opt-in) |
| `bunx playwright test e2e/auth/admin-rbac.e2e.ts --project=chromium --grep 'Não autenticado' --workers=1` | 14 testes OK, 1 skip esperado (`setup` sem credenciais) |
| `git diff --check` | OK |

## GitHub — estado real em 2026-08-31

- `origin/main` está em `cd5444ca11c51b7fc4c52e053d963937637524e1`
- o repositório é privado e a branch `main` continua sem branch protection (`protected=false`)
- a PR `#52` foi mesclada com sucesso em `2026-08-31T11:01:57Z` (`fix/codex-h0831-reconciliacao-online` → `main`)
- as PRs `#48`, `#49`, `#50` e `#51` continuam abertas e não foram absorvidas automaticamente por esta trilha
- o token local do `gh` está válido para `repo` e `workflow`
- os últimos runs do `main` às `2026-08-31T11:01:59Z` foram:
  - `Supabase Linter (RLS/GRANT gate)` → sucesso (`33385071678`)
  - `Deno Edge Function Tests` → sucesso (`33385071574`)
  - `CI Pipeline` → falha (`33385071560`)
- o `Deno Edge Function Tests` verde do `main` ainda pertence ao workflow antigo, com `deno lint ... || true` e sem o gate amplo novo; portanto, ele não prova o endurecimento Deno desta rodada
- o `CI Pipeline` que falhou no `main` ainda executa a suíte monolítica antiga de Playwright e caiu com `54` falhas E2E legadas; isso confirma que os gates separados (`critical`, `destructive`, `quarantine`) deste worktree ainda não foram publicados

## Supabase canônico (`bwwbeyolnnzppeuhgkcd`) — estado real em 2026-08-31

- 102 Edge Functions ativas
- `migrate-helper` não existe online
- as migrations `20260826010000`, `20260826020000`, `20260826030000`, `20260826040000` e `20260826050000` já existem no ledger remoto
- `public.exec_sql(text)` responde no PostgREST do projeto canônico e mantém ACL correta: `anon=false`, `authenticated=false`, `service_role=true`
- o gate live do banco canônico passou via Management API em modo leitura: migrations obrigatórias `5/5`, funções sensíveis `17/17`, policies corrigidas `4/4`, policies literal-true allowlisted `23/23`, grants anônimos allowlisted `1/1`
- existem 13 secrets cadastrados; `MCP_SECRET` já existe no projeto e foi atualizado em `2026-08-31T11:04:39.862Z`
- a edge `mcp-query` está online em `version=10` com `verify_jwt=false`
- a matriz `verify_jwt` do repositório foi reconciliada contra o catálogo canônico live em 2026-08-31; após essa reconciliação, o único drift remanescente entre `supabase/config.toml` e o ambiente online é `mcp-query`
- as revogações de `EXECUTE` para `authenticated` em `confirmar_conciliacao`, `desfazer_conciliacao` e `nfe_apply_manifestacao` estão efetivas no catálogo live
- o hash live atual de `mcp-query` ainda é `91a1b60e16f1c61712685117a0ea43d0b325a95c2978940aac87293542406d4d`, diferente do hash local desta trilha (`2d41ec6e272156288cac47b86d3aca7a5af45b42ee23a4c68963a9c23e6afd34`)
- as 9 funções endurecidas localmente nesta sessão ainda não estão sincronizadas com o canônico live; a evidência é a divergência entre os hashes locais atuais e os `ezbr_sha256` publicados para:
  - `analise-fluxo-ia`
  - `analyze-document`
  - `benchmarking-setorial`
  - `categorizar-despesa`
  - `insights-relatorio`
  - `enviar-alerta-email`
  - `executar-analise-preditiva`
  - `gerar-alertas-tributarios`
  - `whatsapp-ia-proativo`
- nenhuma DDL foi aplicada nesta rodada; toda a validação remota foi feita em modo leitura

## Proveniência dos arquivos restaurados

| Arquivo | Proveniência exata | Estado remoto validado | Ressalva |
| --- | --- | --- | --- |
| `supabase/migrations/20260826010000_restaurar_exec_sql_wrapper_e03.sql` | commit `1cb59c32f2b863bd8089f27e1cd5b4eb600436e5` | ledger remoto presente | restaurado localmente a partir da fonte exata |
| `supabase/migrations/20260826020000_fix_cron_source_check_e23_e24.sql` | commit `1cb59c32f2b863bd8089f27e1cd5b4eb600436e5` | ledger remoto presente | restaurado localmente a partir da fonte exata |
| `supabase/migrations/20260826030000_add_colunas_ausentes_e30.sql` | commit `489e7fc3732a2c5babc302f584e087f3969bef2d` | ledger remoto presente | marcador histórico local, sem reescrita de ledger |
| `supabase/migrations/20260826040000_fechar_policies_abertas_e06_e08.sql` | commit `94bd5f5ce06f0f9da4662193a8ca9c1925c11330` | ledger remoto presente | replay local endurecido; sem reescrita de ledger |
| `supabase/migrations/20260826050000_revoke_execute_authenticated_e09.sql` | commit `94bd5f5ce06f0f9da4662193a8ca9c1925c11330` | ledger remoto presente | replay local endurecido; sem reescrita de ledger |
| `docs/adr/0001-fonte-da-verdade-migracao.md` | commit `489e7fc3732a2c5babc302f584e087f3969bef2d` | não aplicável | ADR restaurado textualmente |

## Observação importante sobre a `20260826030000`

A `20260826030000_add_colunas_ausentes_e30.sql` foi preservada como evidência histórica de ledger e contexto operacional. Ela não contém os `ALTER TABLE ... ADD COLUMN ...` originais; portanto, não deve ser tratada como migration replayável para reconstrução de schema.

## Endurecimentos locais de replay aplicados nesta trilha

- `001_create_tables.sql` deixa de tentar definir `app.jwt_secret` por
  `ALTER DATABASE`, porque isso é obsoleto e incompatível com previews
  gerenciados
- `20260825090000_hardening_seguranca_destino.sql` torna tolerável a falta de
  privilégio em `ALTER DATABASE ... idle_in_transaction_session_timeout`
- `20260826010000_restaurar_exec_sql_wrapper_e03.sql` só cria o wrapper
  `public.exec_sql` se `private.exec_sql(text)` já existir
- `20260826030000`, `20260826040000` e `20260826050000` não reescrevem mais o
  ledger manualmente em replay local

## O que esta evidência não afirma

- não afirma replay total comprovado da cadeia inteira de migrations
- não afirma que previews Supabase estão verdes após qualquer commit futuro
- não afirma que objetos aplicados live devam ser reaplicados só para “casar”
  o ledger local

## Correções de interpretação aplicadas nesta revalidação

- `performance_alerts_source_check` no catálogo canônico atual é constraint de `public.performance_alerts`, não view. Portanto, a verificação correta é por constraint/catalogo de tabela, não por `pg_get_viewdef(...)`.
- nomes históricos de policies de conciliação não devem ser usados como prova isolada: a validação precisa comparar tabela, comando e expressão real no catálogo live.

## Gaps ainda pendentes de publicação

- este worktree (`fix/codex-h0831-gates-pos-merge`) ainda não foi enviado ao GitHub
- `main` ainda não contém: gates E2E separados, gate Deno endurecido, snapshot do grafo atualizado, testes novos das funções protegidas e as 9 Edge Functions com guard revisado
- o repositório do GitHub ainda não tem os secrets `SUPABASE_ACCESS_TOKEN` e `DATABASE_URL`; por isso parte da prova live do CI continua inconclusiva por credencial ausente
- o `mcp-query` live continua atrás do código local desta trilha
- o fluxo de logout real ainda depende do job `e2e-destructive` desta nova versão do pipeline; nesta sessão foram validadas apenas as rotas públicas/anônimas e a divisão correta dos gates

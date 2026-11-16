# Plano de correções e melhorias — GitHub Workflows (100 etapas)

> Auditoria exaustiva dos workflows de `adm01-debug/Promo_Finance_V2`.
> Data: 2026-09-27 · Commit auditado: `da77eca` · Apenas plano. **Nada foi executado.**

## 0. Escopo auditado

| Item | Fonte |
| --- | --- |
| 6 arquivos em `.github/workflows/` (1.110 linhas): `ci.yml`, `deno-tests.yml`, `functions-deploy.yml`, `graphify.yml`, `staging-migrate.yml`, `supabase-linter.yml` | repo |
| `dependabot.yml`, `PULL_REQUEST_TEMPLATE.md`, `.github/workflows/README.md`, hooks Husky | repo |
| 22 scripts referenciados pelos workflows (`scripts/ci`, `scripts/security`, `scripts/integrity`) — todos existem | repo |
| 5 configs Playwright, `vitest.config.ts`, `vercel.json`, `env.manifest.json` | repo |
| 3.686 runs históricos, 2.109 falhas, últimos 100 falhas (07–25/09), jobs do último run em `main` | GitHub Actions API |
| Branch protection de `main`, rulesets, permissões do Actions, 11 secrets, 3 variáveis, 3 environments, Dependabot, secret scanning | GitHub API |

## 1. Diagnóstico — os 12 achados que mais importam

| # | Achado | Evidência | Efeito no negócio |
| --- | --- | --- | --- |
| A | **`main` está vermelho agora.** Supabase Linter falha desde o merge do PR #114 | run 36082627249: `Policies literal-true fora do baseline: asaas_payment_links.Service role full access` | Próximas PRs que tocarem banco herdam o vermelho; ninguém sabe se o próximo erro é novo ou este |
| B | **4 gates de banco nunca rodaram.** Secret `DATABASE_URL` não existe no repositório | lista de secrets não contém `DATABASE_URL`; steps 15–17 do quality-gate sempre `skipped` | RLS multi-empresa, privilégios de observabilidade, catálogos tributários e retenção de dados **não são verificados** em nenhuma PR, embora o código exista |
| C | **Gates "bloqueantes" não bloqueiam.** Branch protection exige só 4 checks | required: `Quality Gate & Tests`, `E2E Critical Gate`, `Unit tests`, `Integration tests`. **Faltam**: `Varredura de segredos`, `E2E Financeiro (offline)`, `E2E Destructive Logout`, `Supabase DB Linter` | Uma PR com segredo commitado ou com regressão nas telas de dinheiro pode ser mergeada |
| D | **Repositório é PÚBLICO** (`private: false`) e o histórico contém 23 achados de segredo baselinados (19 JWT, 4 API keys) em migrations e edge functions | `get_repo` + `.gitleaks-baseline.json` | Código do sistema financeiro, chaves históricas e nomes de tabelas estão abertos na internet |
| E | **Cada push custa ~34 min de runner**, dos quais 25 min são a quarentena E2E não bloqueante que roda em todo push/PR | run 36082627254: quarantine 01:43→02:08 | Custo de minutos e atraso de feedback sem ganho de proteção |
| F | **Suíte Vitest roda duas vezes** por run (`test:run` + `test:coverage`) | steps 25 e 26: 2m24 + 2m45 | ~2,5 min desperdiçados por run, ×centenas de runs/mês |
| G | **Nenhuma migration é replayada do zero no CI** | não há Postgres/`supabase start` em nenhum job; PRs #103, #110 corrigiram bugs exatamente dessa classe | Bug de replay só aparece em Preview/staging, tarde |
| H | **Linter live valida o banco de produção, não a PR** | PR #114 passou (banco ainda sem a policy); `main` falhou depois que a migration foi aplicada via MCP | O gate não protege a PR e falha em `main` fora de hora |
| I | **`staging-migrate` é inexecutável**: 5 secrets ausentes (`PROD_DB_URL`, `STAGING_DB_URL`, `STAGING_PROJECT_REF`, `STAGING_ANON_KEY`, `TEST_ADMIN_JWT`) e var `REQUIRED_SECRETS` | única run (25/08) falhou; secrets listados não os incluem | Não existe caminho testado de promoção para staging |
| J | **Supply chain sem trava**: actions por tag mutável, `allowed_actions: all`, `sha_pinning_required: false`, `supabase/setup-cli@v1` com `version: latest`, tarball da CLI sem checksum, `bun-version: latest` no staging | YAML + `get_actions_permissions` | Um tag hijack de action ou uma CLI nova quebra ou compromete o pipeline |
| K | **Dependabot só cobre `pip` do graphify** | `dependabot.yml` | 150+ dependências npm e 7 actions sem atualização automática de segurança |
| L | **Workflow fantasma `e2e-cloud-probe.yml`** registrado a partir da branch `hermes/probe-e2e-h102635`; 65 branches remotas, dezenas órfãs (`backup/`, `base44/`, `hermes/`, `codex/`, `cline/`) | `list_workflows` + `git ls-remote` | Ruído na aba Actions; branches órfãs podem disparar `deno-tests` (`branches: ["**"]`) |

Outros achados menores estão distribuídos nas etapas.

## 2. Convenções deste plano

- **Uma etapa = uma PR** (salvo onde indicado "mesma PR de N"). Branch `claude/<tipo>-<slug>-<AAMMDD-HHMM>`.
- **Aprovação**: `[A]` = mexe em CI/secrets/branch protection/banco → PR fica aberta aguardando o Joaquim. `[M]` = escopo comum → merge autônomo após CI verde.
- **Camada**: `gh` (configuração do GitHub via API, sem PR), `wf` (arquivo de workflow), `script`, `docs`, `repo`.
- Ordem = impacto. Fase 1 destrava `main`; Fase 2 fecha buracos de proteção; depois custo, confiabilidade, supply chain, higiene.

---

## Fase 1 — Destravar `main` e ligar os gates que já existem (etapas 1–10)

1. **Corrigir a policy `Service role full access asaas_payment_links`** `[A]` `script/banco` — trocar `USING (true) WITH CHECK (true)` sem `TO service_role` pela forma restrita (`TO service_role`) em nova migration; se a intenção for manter literal-true, incluir a policy no allowlist de `scripts/security/test-canonical-db-gates.mjs` na **mesma PR**. Fecha o achado A.
2. **Re-executar o Supabase Linter em `main` e confirmar verde** `[M]` `gh` — `workflow_dispatch` após a etapa 1; registrar o run no PR.
3. **Criar o secret `DATABASE_URL`** (connection string do pooler do projeto `bwwbeyolnnzppeuhgkcd`, papel de leitura/`postgres` conforme exigirem os SQLs) `[A]` `gh` — liga os 4 gates de banco (achado B).
4. **Rodar os 4 gates de banco pela primeira vez e tratar o que reprovar** `[A]` `script` — `test-observability-privileges.sql`, `test-security-definer-invocation.sql`, `rls_multi_empresa.sql`, `catalogos_tributarios.test.sql`, `14_retencao.sql`. Provável que haja reprovação acumulada; cada reprovação vira migration própria.
5. **Tornar `DATABASE_URL` obrigatório no `quality-gate`** `[A]` `wf` — trocar `--mode summary` por `--mode fail` no preflight (linha 119–123 do `ci.yml`) e remover o step "Registrar gates como inconclusivos". Gate que "não conclui" e passa verde é o mesmo que gate inexistente.
6. **Adicionar `Varredura de segredos (gitleaks)` aos required checks de `main`** `[A]` `gh` — achado C.
7. **Adicionar `E2E Financeiro (offline)` aos required checks** `[A]` `gh` — é o único gate que roda sem secret e cobre telas de dinheiro; hoje é opcional na prática.
8. **Adicionar `E2E Destructive Logout` aos required checks** `[A]` `gh`.
9. **Fazer o Supabase Linter reportar sempre** `[A]` `wf` — remover os filtros `paths:` do trigger (mantendo os steps offline baratos) ou criar job-resumo `linter-gate` que roda sempre e é `skipped`-safe; só então adicioná-lo aos required checks. Sem isso, PR que não toca banco fica presa esperando check que nunca reporta.
10. **Adicionar `Supabase DB Linter` aos required checks** `[A]` `gh` — depende da 9.

## Fase 2 — Proteção de `main` e governança do repositório (etapas 11–22)

11. **Decidir a visibilidade do repositório** `[A]` `gh` — escolha de negócio: tornar privado (recomendado; custo zero, Actions continua gratuito para privados até 2.000 min/mês; verificar consumo atual) ou manter público e aceitar exposição do código financeiro. Achado D.
12. **Rotacionar todas as 23 credenciais do `.gitleaks-baseline.json` e registrar a rotação** `[A]` `gh/supabase` — JWTs de `20260726180529_*.sql`, `20260905130000_*.sql`, `20260712194415_*.sql`, `20260728183119_*.sql`, `migrate-helper`, `compare-schemas`, `src/integrations/supabase/client.ts`. Anon key em bundle é pública por design; service role e API keys não.
13. **Exigir revisão de PR (1 aprovação) e resolução de conversas em `main`** `[A]` `gh` — `required_pull_request_reviews` está ausente; com vários agentes mergeando, o humano é o único freio.
14. **Exigir histórico linear e desabilitar merge commit / rebase merge no repo** `[A]` `gh` — repo permite os 3 tipos; regra da casa é squash-merge. Torna o histórico auditável.
15. **Habilitar `allow_update_branch`** `[M]` `gh` — botão "Update branch" facilita cumprir `strict: true` sem rebase manual.
16. **Criar `.github/CODEOWNERS`** `[A]` `repo` — `.github/**`, `supabase/migrations/**`, `supabase/config.toml`, `scripts/security/**` → `@adm01-debug`. Combinado com a 13, exige revisão humana em mudanças de CI e banco.
17. **Criar ruleset "main-protecao" espelhando a branch protection** `[A]` `gh` — rulesets suportam bypass list explícita e histórico de alterações; migrar e depois desativar a proteção clássica.
18. **Proteger o environment `Production`**: required reviewer + `deployment_branch_policy` = só `main` `[A]` `gh` — hoje tem 0 regras; o `environment: production` do deploy é decorativo.
19. **Mover secrets de produção para o environment `Production`** `[A]` `gh` — `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `PF_CANONICAL_DST`, futuro `DATABASE_URL` saem do escopo de repositório (onde qualquer PR interna os enxerga) e passam a exigir o gate da etapa 18.
20. **Ajustar `post-merge-audit` e `functions-deploy` para consumir secrets do environment** `[A]` `wf` — consequência da 19.
21. **Adicionar `SECURITY.md`** com canal de reporte e política de rotação `[M]` `repo`.
22. **Apagar o environment `copilot` e revisar `Preview`** `[M]` `gh` — sem uso identificado.

## Fase 3 — Custo e tempo de feedback (etapas 23–36)

23. **Adicionar `concurrency` com `cancel-in-progress: true` em `ci.yml`, `supabase-linter.yml` e `graphify.yml`** `[A]` `wf` — hoje só `deno-tests` cancela; push em sequência gera runs de 34 min duplicados.
24. **Mover `e2e-quarantine` para agendamento noturno (`schedule`) + `workflow_dispatch`** `[A]` `wf` — 25 min por push sem bloquear nada (achado E). Publicar resumo como issue automática quando reprovar.
25. **Unificar `test:run` e `test:coverage` em um único step com cobertura** `[A]` `wf` — achado F; economiza ~2,5 min/run. Manter thresholds do `vitest.config.ts`.
26. **Cachear `node_modules`/cache do Bun** `[A]` `wf` — `oven-sh/setup-bun@v2` não cacheia por padrão; usar `actions/cache` com chave `hashFiles('bun.lock')` nos 5 jobs que instalam.
27. **Extrair composite action `.github/actions/setup-e2e`** `[A]` `wf` — o bloco "Setup Bun → install → cache Playwright → install browsers/deps" está copiado 4× (linhas 284–305, 342–363, 407–428, 457–478 do `ci.yml`).
28. **Parar de rodar `playwright install-deps` a cada cache hit** `[A]` `wf` — 14–36 s de `apt-get` por job; cachear também `/var/lib/apt` ou usar imagem com deps (`mcr.microsoft.com/playwright`).
29. **Build único e reutilizado pelos E2E** `[A]` `wf` — `quality-gate` já faz `bun run build`; publicar `dist/` como artifact e servir com `vite preview` nos jobs E2E em vez de `npm run dev` (testa o bundle que vai para produção, não o dev server).
30. **`paths-filter` para PR só de docs** `[A]` `wf` — PRs #94, #95 (docs) pagaram 34 min. Usar `dorny/paths-filter` no início dos jobs e encurtar steps pesados quando só `docs/**`/`*.md` mudam, mantendo os checks reportando sucesso.
31. **Remover o trigger duplo em `deno-tests.yml`** `[A]` `wf` — `push: ["**"]` + `pull_request: ["**"]` rodam 2× para toda branch com PR (visto em todas as PRs do dia 24/09). Manter `pull_request` + `push: [main]`.
32. **Reduzir a matriz `perfis` do graphify a `workflow_dispatch`/noturno ou a perfis afetados pelo diff** `[A]` `wf` — 11 runners por PR que toca `src/**` para gerar mapas que não são publicados.
33. **Corrigir a chave do cache Deno** `[A]` `wf` — `hashFiles('supabase/functions/**/*.ts')` invalida a cada mudança; usar `hashFiles('deno.lock')`.
34. **Pinar runner em `ubuntu-24.04`** `[A]` `wf` — `ubuntu-latest` muda de imagem sem aviso.
35. **Revisar `timeout-minutes`** `[A]` `wf` — `quality-gate` 30 min para ~7 min reais (ok, reduzir para 20); `post-merge-audit` sem timeout; `e2e-quarantine` 30 min encostou (25 min).
36. **Relatório de custo mensal** `[M]` `docs` — registrar minutos consumidos antes/depois das etapas 23–35 (`get_workflow_usage`) para comprovar o ganho.

## Fase 4 — Confiabilidade dos gates de banco e migrations (etapas 37–50)

37. **Job `migrations-replay`: Postgres em container + `supabase db reset` do zero** `[A]` `wf` — roda todas as 602 migrations em ordem em banco vazio. Fecha o achado G; teria pego #103 e #110 antes do merge.
38. **Rodar os SQLs de `supabase/tests/sql/*.test.sql` (pgTAP) contra o banco replayado** `[A]` `wf` — `infra.test.sql`, `integrity_cycle.test.sql`, `lint_function_repairs.test.sql`, `overloads.test.sql` existem e não são executados por nenhum workflow.
39. **Gate estático: nova policy `USING (true)` exige entrada no allowlist na mesma PR** `[A]` `script` — varrer `supabase/migrations/**` do diff; se criar policy literal-true não listada em `test-canonical-db-gates.mjs`, reprovar. Fecha o achado H na origem.
40. **Gate estático de nomenclatura de migrations** `[A]` `script` — timestamp de 14 dígitos, estritamente maior que `max(version)` do repo, sem duplicatas (regra 2 do `CLAUDE.md`, hoje manual).
41. **Detecção de drift entre `supabase/migrations/` e `supabase_migrations.schema_migrations` de produção** `[A]` `wf` — job noturno com `DATABASE_URL`; migration aplicada via MCP e não commitada (ou vice-versa) vira alerta.
42. **Linter live também em Preview Branch da PR** `[A]` `wf` — quando o Supabase Branching estiver ativo para a PR, apontar `test-canonical-db-gates.mjs` para o ref da branch, não para produção; em `main`, manter produção.
43. **Executar o linter live em agendamento diário** `[A]` `wf` — o trigger por `paths:` não vê alterações feitas direto no banco via MCP.
44. **`lint.json` sempre gerado** `[A]` `wf` — quando o gate live falha antes do `supabase db lint`, o upload avisa "No files were found"; gerar stub ou condicionar o upload ao step.
45. **Habilitar `format:check` (Prettier) no CI** `[A]` `wf` — script existe, nunca roda; Husky formata só o que está staged.
46. **Promover `lint` → `lint:strict` (`--max-warnings 0`)** `[A]` `wf` — o `CLAUDE.md` documenta `lint:strict` como meta; o CI aceita warnings.
47. **`bun audit` com política** `[A]` `wf` — hoje `|| echo warning`. Falhar em `critical`/`high` em dependências de produção; manter warning para dev.
48. **Verificar `env.manifest.json` atualizado** `[A]` `wf` — o arquivo diz "NÃO editar manualmente"; rodar `generate-env-manifest.mjs` e `git diff --exit-code`.
49. **Verificar `zod-coverage.baseline` e `.gitleaks-baseline.json` só diminuem** `[A]` `script` — baseline que cresce é regressão aceita em silêncio.
50. **Gate de tamanho de bundle** `[A]` `wf` — `bun run build` passa sem medir; publicar tamanho de `dist/assets/*.js` e alertar acima de limite acordado.

## Fase 5 — Testes Deno / Edge Functions (etapas 51–60)

51. **Uma única lista de arquivos endurecidos** `[A]` `script` — `deno-tests.yml` (lint, 33 arquivos) e `scripts/ci/deno-check-functions.sh` (check, 18 arquivos) divergem (`api-keys-manage` só no check; testes só no lint). Gerar ambos a partir de um manifesto.
52. **Ampliar `deno check` para todo `supabase/functions/` com allowlist de dívida** `[A]` `script` — inverter a lógica: tudo é checado exceto o que está na lista de dívida; lista só encolhe (mesma ideia da 49).
53. **Remover `--no-check` do `deno test`** `[A]` `wf` — testes rodam sem tipagem; um teste que compara com `undefined` passa.
54. **Ampliar `deno lint` para todas as funções, excluindo as regras de dívida por arquivo** `[A]` `wf` — hoje as 5 regras são excluídas globalmente inclusive em código novo.
55. **Cobertura de teste por função com relatório** `[A]` `wf` — 31 de 107 funções têm teste; publicar lista das 76 sem teste no step summary e travar o número (não pode subir).
56. **Trocar o teste de integração `sso-test-login` em produção por ambiente de preview/staging** `[A]` `wf` — check **required** para merge bate em função de produção; indisponibilidade da Supabase bloqueia merges e uma função de "test login" publicada em produção é superfície de ataque a revisar.
57. **`integration-tests` só em PR e `main`, não em todo push de branch** `[A]` `wf` — consequência da 31.
58. **Verificar `verify_jwt` × `--no-verify-jwt` para todas as 105 funções, não só as 2 do mock** `[A]` `script` — `test-functions-deploy.sh` cobre 2 funções; gerar a matriz completa a partir do `config.toml`.
59. **`deno.lock` respeitado no CI** `[A]` `script` — `deno-check-functions.sh` usa `--no-lock`; lockfile existe e não protege nada.
60. **Atualizar `.github/workflows/README.md`** `[M]` `docs` — descreve 3 arquivos de teste e diz que ausência de secret "emite warning e finaliza com sucesso", o oposto do comportamento atual.

## Fase 6 — E2E e Playwright (etapas 61–70)

61. **Reportar resultados em JUnit e publicar no PR** `[A]` `wf` — `--reporter=list` nos 4 jobs; usar `junit` + `dorny/test-reporter` para ver qual spec falhou sem abrir log.
62. **Publicar trace/screenshot em falha nos jobs critical e destructive** `[A]` `wf` — só `e2e-financeiro` faz upload de artefatos de falha.
63. **Remover `grepInvert` do gate crítico ou documentar o que está excluído** `[A]` `repo` — `playwright.critical.config.ts` pula `RBAC › usuário sem perfil admin` e `Regressão visual autenticada`; o gate "crítico" não testa RBAC negativo.
64. **`retries: 0` nos gates bloqueantes que dependem de produção ou justificar por escrito** `[A]` `repo` — critical/destructive usam `retries: 2`; flakiness contra Supabase vira verde por sorte.
65. **Promover mais specs para o gate offline** `[A]` `repo` — quarentena tem 20+ specs (dashboard, contas-pagar, conciliacao, relatorios, sped-wizard…) rodando 25 min sem bloquear; converter as de maior valor para `e2e/fixtures/sessao.ts` (padrão já provado em `financeiro/*-offline`).
66. **Usuário E2E dedicado por job destrutivo** `[A]` `gh/supabase` — `logout-real` revoga sessões do mesmo usuário usado por critical/quarantine; race entre jobs paralelos.
67. **Fixar timezone/locale nos configs critical e destructive** `[A]` `repo` — só o financeiro fixa `America/Sao_Paulo`; bug de `DATE` puro é invisível em runner UTC.
68. **Rodar E2E crítico também contra o Preview do Vercel** `[A]` `wf` — `E2E_BASE_URL` já é suportado; usar a URL de preview da PR (deployment status) para testar o build real com headers/CSP do `vercel.json`.
69. **Verificar `visual-theme.e2e.ts-snapshots` em Linux×Chromium pinado** `[A]` `wf` — snapshots dependem da versão do Chromium; pinar a versão do Playwright e do browser para não quebrar em atualização.
70. **Remover `playwright-dyad.config.ts` se órfão** `[M]` `repo` — não referenciado por nenhum workflow nem script.

## Fase 7 — Supply chain e segurança do pipeline (etapas 71–82)

71. **Pinar todas as actions por SHA de commit** `[A]` `wf` — `actions/checkout@v5`, `upload-artifact@v6`, `cache@v5`, `setup-python@v6`, `oven-sh/setup-bun@v2`, `denoland/setup-deno@v2`, `supabase/setup-cli@v1`. Achado J.
72. **Ligar `sha_pinning_required` e restringir `allowed_actions` a `selected` (GitHub + verified creators + lista)** `[A]` `gh`.
73. **Pinar a Supabase CLI** `[A]` `wf` — `version: latest` em linter e deploy; tarball `releases/latest` sem checksum no staging. Fixar versão + SHA256 como já é feito com gitleaks.
74. **Pinar Bun via `.bun-version`** `[A]` `repo/wf` — `1.3.11` repetido 6× e `latest` no staging; `setup-bun` lê `bun-version-file`.
75. **`permissions: contents: read` explícito em `ci.yml`, `deno-tests.yml`, `supabase-linter.yml`, `staging-migrate.yml`** `[A]` `wf` — default do repo é `read`, mas o explícito sobrevive a mudança de configuração.
76. **`persist-credentials: false` em todo `checkout`** `[A]` `wf` — só `graphify.yml` faz; token do `GITHUB_TOKEN` fica no `.git/config` durante o job.
77. **Adicionar `actionlint` + `zizmor` como gate estático dos próprios workflows** `[A]` `wf` — nenhum lint de YAML hoje; pega expressão injetável, output inválido e `if:` errado.
78. **Publicar SARIF do gitleaks no Code Scanning** `[A]` `wf` — hoje vira artifact; `github/codeql-action/upload-sarif` (precisa `security-events: write`) mostra alertas na aba Security.
79. **Ativar CodeQL para TypeScript** `[A]` `wf` — gratuito em repo público; pago em privado (ver etapa 11).
80. **`dependency-review-action` em PRs** `[A]` `wf` — bloqueia dependência nova com vulnerabilidade conhecida ou licença proibida.
81. **Dependabot para `npm` (bun.lock), `github-actions` e agrupamento semanal** `[A]` `repo` — achado K; hoje só `pip`.
82. **Habilitar `secret_scanning_non_provider_patterns` e `validity_checks`** `[A]` `gh` — detecta segredos genéricos e diz se o vazado ainda é válido.

## Fase 8 — Deploy, staging e rastreabilidade (etapas 83–92)

83. **Decidir o destino do `staging-migrate`**: configurar os 5 secrets + var ou arquivar o workflow `[A]` `gh/wf` — achado I. Recomendação: configurar, pois é o único caminho testado de promoção.
84. **Trocar `${{ inputs.* }}` interpolados em bash por `env:`** `[A]` `wf` — `staging-migrate.yml` linhas 62–64 executam `true && …` a partir de expressão; funciona hoje, quebra se o input virar string.
85. **Deploy de Edge Functions dirigido por diff** `[A]` `wf` — `functions-deploy.yml` tem lista fixa de 6 funções; as outras 99 são publicadas via MCP sem rastro. Novo job em `main` que detecta `supabase/functions/<fn>/**` alterado e implanta com o gate da etapa 18.
86. **Deploy de migrations para produção via workflow** `[A]` `wf` — hoje `db_query` via MCP. `supabase db push` em `main` após aprovação no environment `Production`, com o replay da etapa 37 como pré-requisito. Elimina a classe de bug do achado H.
87. **Registrar deploy no GitHub Deployments API** `[A]` `wf` — Vercel já cria; Edge Functions e migrations não. Uma linha do tempo única de "o que está em produção".
88. **Smoke test pós-deploy** `[A]` `wf` — após deploy de função, `functions_ping` + 1 request real (`/functions/v1/<fn>` com payload inválido esperando 4xx, não 5xx).
89. **Verificar o deploy do Vercel a partir do CI** `[A]` `wf` — aguardar o deployment status `success` de produção após push em `main` e reprovar/notificar se falhar; hoje merge ≠ deploy confirmado.
90. **Decidir `post-merge-audit`** `[A]` `wf` — depende de `vars.ENABLE_PRODUCTION_SIMULATION_AUDIT` que não existe; ou vira job agendado com janela definida ou é removido.
91. **Notificação de falha em `main`** `[A]` `wf` — Slack/WhatsApp (Evolution) quando qualquer workflow falha em `main`; hoje o vermelho do linter ficou 2 dias sem ninguém ver.
92. **Corrigir `SUPABASE_PROJECT_REF` no linter para vir de `vars` ou do `config.toml`, com asserção de igualdade** `[A]` `wf` — dois lugares dizem o ref; um gate compara os dois.

## Fase 9 — Higiene do repositório e do Actions (etapas 93–100)

93. **Apagar branches órfãs** `[A]` `gh` — 65 remotas; manter `main` e as com PR aberta. Isso também remove o workflow fantasma `e2e-cloud-probe` (achado L) assim que a branch `hermes/probe-e2e-h102635` sumir.
94. **Remover `master` e `develop` dos triggers** `[A]` `wf` — branches não existem; configuração morta em `ci.yml` e `supabase-linter.yml`.
95. **Corrigir `Upload Error Logs`** `[A]` `wf` — `path: "*.log"` não corresponde a nenhum arquivo gerado; apontar para `coverage/`, `test-results/` ou remover.
96. **Publicar `coverage/lcov.info` como artifact e comentar cobertura na PR** `[A]` `wf` — o gate roda mas o número não é visível.
97. **Renomear jobs para IDs estáveis e sem acento nos required checks** `[A]` `wf/gh` — `Unit tests (offline, determinísticos)` como contexto de branch protection é frágil; qualquer edição do `name:` quebra o required check silenciosamente.
98. **Sincronizar Graphify com o CI** `[A]` `wf` — `GRAPH_REPORT.md` foi construído em `4a081b85`, 50 commits atrás; o auto-sync N8N prometido no `CLAUDE.md` não está funcionando. Job noturno `graphify update` no container `claude-code` disparado por `repository_dispatch`, ou remover a promessa da doc.
99. **Adicionar issue templates e `.github/copilot-instructions.md`** `[M]` `repo` — Copilot reviewer está ativo sem instruções do projeto; templates padronizam bug/feature com o PR template já existente.
100. **Re-auditoria e fechamento** `[M]` `docs` — repetir esta coleta (runs, jobs, durações, required checks, secrets) e registrar antes/depois em `docs/evidencias/`; itens não concluídos migram para o próximo plano.

---

## 3. Resumo por prioridade

| Fase | Etapas | O que resolve |
| --- | --- | --- |
| 1 | 1–10 | `main` verde; 4 gates de banco ligados; 4 checks passam a bloquear merge |
| 2 | 11–22 | Visibilidade, rotação de segredos, revisão obrigatória, environments com gate |
| 3 | 23–36 | ~34 min → ~10 min por push; cancelamento de runs obsoletos |
| 4 | 37–50 | Replay de migrations do zero; drift; lint estrito; baselines só encolhem |
| 5 | 51–60 | Deno com tipagem e lint completos; teste de integração fora de produção |
| 6 | 61–70 | E2E legível, com evidência e sem dependência frágil de produção |
| 7 | 71–82 | Supply chain pinada; CodeQL; Dependabot completo |
| 8 | 83–92 | Deploy rastreável de funções e migrations; staging funcional; alerta de falha |
| 9 | 93–100 | Branches, triggers mortos, artifacts, graph, re-auditoria |

## 4. Dependências entre etapas

- 2 depende de 1 · 4 e 5 dependem de 3 · 10 depende de 9 · 20 depende de 18–19
- 38 depende de 37 · 42 depende de Supabase Branching ativo · 57 depende de 31
- 86 depende de 37 e 18 · 93 remove o achado L sem etapa própria

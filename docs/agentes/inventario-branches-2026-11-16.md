# Inventário de branches — 2026-11-16

Levantamento das **113 branches remotas** (fora a `main`) antes da limpeza.

## Como recuperar uma branch apagada

Cada branch apagada cai num de dois casos, e a coluna "recuperação" das tabelas diz qual:

**1. Tip alcançável pela `main` (36 branches).** O commit é ancestral da `main`, logo o objeto existe no remoto para sempre:

```bash
git fetch --unshallow origin 2>/dev/null || git fetch origin   # ver nota abaixo
git branch <nome-da-branch> <SHA>
```

> **Clone raso.** Ser ancestral da `main` garante o objeto no **remoto**, não no seu disco. Num clone `--depth 1` (o padrão de muitos CIs e das sessões de agente deste repositório, que vêm com 50 commits) o commit antigo não está presente e `git branch` falha com `not a valid object name`. O `--unshallow` resolve; sem ele, o procedimento parece quebrado quando não está.

**2. Tip órfão (54 branches).** O commit não é ancestral da `main`; sem uma ref apontando para ele, o Git o descarta e um clone novo nunca o recebe. Para esses foi criada uma **tag de arquivo** antes da exclusão:

```bash
git fetch origin tag arquivo/261116/<nome-da-branch-com-_-no-lugar-de-/>
git branch <nome-da-branch> arquivo/261116/<nome-da-branch-com-_>
```

Conferido num clone zerado (`git clone --depth 1 --no-tags`): o `fetch` da tag traz o commit e a branch volta com o conteúdo original. Aqui o `fetch` da tag já baixa o que falta, então o caso 2 funciona mesmo em clone raso.

> O SHA sozinho **não** preserva nada: ele identifica o commit, não o mantém vivo. Por isso as tags existem — é o que sobrevive à coleta de objetos do GitHub.

### Para agentes de IA

O `git branch` acima é local e seguro. **Republicar** a branch no remoto é escrita em branch alheia, o que o `AGENTS.md` §6.1 proíbe: trabalhe a partir de uma branch nova sua (`claude/<tipo>-<slug>-<AAMMDD-HHMM>`) com o conteúdo recuperado, e abra PR. Republicar sob o nome original é decisão do dono, não de agente.

## Como cada veredito foi obtido

1. `git fetch --unshallow` (o checkout vinha raso, com 50 commits — comparar sem isso dava falso "não mergeado").
2. Para cada branch: `git diff` contra o merge-base e cobertura **linha a linha** das adições contra o `main` de hoje.
3. Estado real consultado no Supabase canônico `bwwbeyolnnzppeuhgkcd` (policies, índices, funções, `reloptions`, publicação realtime, secrets) — o banco, não o repositório, decidiu sobre migrations.
4. Leitura dirigida por 4 agentes, um por lote.
5. **Segunda passada adversarial**: um agente por branch com a tarefa invertida (provar que há perda) e um juiz independente rechecando cada acusação com comandos próprios.

Dois "resgates" apontados por agentes foram **derrubados** na conferência contra o banco: a migration que protegeria `refresh_mv_benchmark_setorial()` (a função não existe em produção) e o `empresa_id` em `FornecedorForm` (a tabela `fornecedores` não tem essa coluna).

## Branches mantidas

24 linhas, contando a própria `main`. Somadas às 90 apagadas: 113 branches + `main`.

| branch | SHA | motivo |
| --- | --- | --- |
| `Github_Copilotfeat-edge-deploy-verificacao` | `007d6aea0020d529d70bb0e72d9c851a070e688d` | conteúdo resgatado na PR #356 — apagar depois do merge |
| `automation/estado-real` | `0a42438decdc978ea9eae4f5b32a6e9b4012d057` | escrita pelo workflow estado-real.yml; tem PR aberta com `docs/ci/kpi.json`, que não existe no `main` |
| `backup/codex-h0831-gates-blinda-replay` | `fb9e644218f99b95c179b614fa9f3b1bf6ad730f` | conteúdo resgatado na PR #359 — apagar depois do merge |
| `claude/chore-ddl-steps12-23-311026-1942` | `010ac866ca9471dbeb3aaccd3ba7a3c8f932915b` | todos os 7 DDL conferidos aplicados em produção (índices com outro nome, autovacuum 0.05 nas 6 tabelas) — apagar depois do merge deste inventário |
| `claude/chore-prod-readiness-logfix-261114-1510` | `2ce720104a2ee77212926e8789ae874189f11a39` | PR aberta #349 |
| `claude/chore-shared-helpers-consolidation-311031-1548` | `ce4d6bb17af3570d95ab80d2e24ca31f58fe9e00` | conteúdo resgatado na PR #357 — apagar depois do merge |
| `claude/fix-ci-lalamove-view-guard-261113-1212` | `86808b320cc668893c0571a87038461f94cce5b6` | PR aberta #333 |
| `claude/fix-estorno-contabil-movimentacao-261113-1811` | `92104196dcd6a2add7e6a583ce7e5904f6fe690a` | PR aberta #340 |
| `claude/fix-grants-audit-logs-261114-1500` | `3ecddc4f2158f5bca2f73df6f81f91bcfaa5e30c` | PR aberta #348 |
| `claude/fix-login-ip-geo-allowlist-261116-1200` | `ebb845a89baed0f9f0f808840b685ef0a9064164` | PR aberta #351 |
| `claude/fix-marcar-contas-vencidas-261113-1920` | `2c796ee6ca16d515c42eb43d8da64d7054022506` | PR aberta #345 |
| `claude/fix-pedido-compra-empresa-261113-1918` | `e0d7c54b4a52f5c0b9a526aabcf3557c98a3384c` | PR aberta #344 |
| `claude/fix-rate-limit-functions-311031-1548` | `611138ef0f4e2a7da942ddc84b9f3183f21d611b` | conteúdo resgatado na PR #353 — apagar depois do merge |
| `claude/fix-review-findings-261107-1830` | `30b3f8d013d9c16340044ab32b68d96e74857235` | conteúdo resgatado na PR #354 — apagar depois do merge |
| `claude/fix-rls-insert-compras-transacoes-261113-1811` | `e8e53c23113dd06974c93f046b93242b26de5b1f` | PR aberta #339 |
| `claude/infra-contexto-1h-261114-1342` | `8966a4f01f72e60c35ef841a7277b42d5c47e865` | PR aberta #350 |
| `claude/resolve-conflicting-prs-rborrh` | `6c3bbec4c2bae95dfc1bfde00947ecc85f5fd44c` | levou ao achado da PR #352; o resto da branch é descartável — apagar depois do merge |
| `claude/vibrant-ride-v14duy` | `19ad93e6e794a5057583646b4f4695f220c69d40` | conteúdo resgatado na PR #358 — apagar depois do merge |
| `contexto` | `05032cc45b114f6df9b345d26f1dbf10f2f37e36` | escrita pelo workflow contexto.yml e lida por agentes como fonte de verdade — **nunca apagar** |
| `fix/codex-auditoria-financeira-20260910` | `8b62718fa445e2f7f6d36ebd26c2abb9741fa8e6` | não reaproveitada por decisão: `scripts/auditoria-financeira/` não tem caller; trazer criaria script órfão |
| `fix/codex-h111911-preserva-c696391` | `7c684900b71440a06966fc7bc562270f9411c2eb` | conteúdo resgatado na PR #355 — apagar depois do merge |
| `fix/notify-alert-projeto-destino` | `544087b979f6508c2dbbff76e1326340d7ec66e3` | não reaproveitada por decisão: alinhar `tipo_cobranca` tocaria 15 arquivos e o banco tem **0 linhas** com o campo preenchido |
| `inventario` | `11c3ff36e1f1a6ea7910ebe83e3e756502a8fa65` | escrita pelo workflow inventario-estado.yml — **nunca apagar** |
| `main` | `0274005f67ffa268af31e0c88478e915fc3374b6` | branch principal |

## Branches apagadas nesta limpeza

90 branches. Nenhuma contém trabalho ausente do `main`.

| branch | SHA | último commit | recuperação | por que pode ir |
| --- | --- | --- | --- | --- |
| `Github_Copilotchore-step49-50-graphify-reauditoria` | `8172bc7c7fc809122023530ce5a13304dfa06eb3` | 2026-10-30 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `Github_Copilotfeat-sentry-steps44-45-3110-1700` | `1f16fa6cc6501831e4ddebe180387dcc9704401d` | 2026-10-31 | tag `arquivo/261116/Github_Copilotfeat-sentry-steps44-45-3110-1700` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `Github_Copilotfix-boletos-types-security-rules-261031` | `516eb487535c881f7461ff980106fe589c0aca65` | 2026-10-31 | tag `arquivo/261116/Github_Copilotfix-boletos-types-security-rules-261031` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `Github_Copilotfix-monitor-health-review` | `cfc3ac3bed0753ca48a0f59544ba87cda7473fd9` | 2026-11-07 | tag `arquivo/261116/Github_Copilotfix-monitor-health-review` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `Github_Copilotfix-sentry-bun-lock` | `dc31a63d03ca673f2ddad59069a7063355f393b0` | 2026-10-31 | tag `arquivo/261116/Github_Copilotfix-sentry-bun-lock` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `Github_Copilotfix-ts2345-evidencias-261107-1355` | `4a83bcf74f8bcc7edcd56699b0ed2e9f467b7267` | 2026-11-08 | tag `arquivo/261116/Github_Copilotfix-ts2345-evidencias-261107-1355` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `Github_Copilotpotential-guide` | `bf7129f7d7d336241625d3ecd2b138c9c2d19c46` | 2026-11-07 | tag `arquivo/261116/Github_Copilotpotential-guide` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `base44/setup-328ba9d4` | `a876c06ead353df311e84cdc3196545a5ab0b1ca` | 2026-08-22 | tag `arquivo/261116/base44_setup-328ba9d4` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `chore/db-types-drift-20261005` | `2e0bca547cd2a54c10089a00d7c55a57ea979c6b` | 2026-10-05 | tag `arquivo/261116/chore_db-types-drift-20261005` | `types.ts` é gerado; tipos do `main` × schema de produção = 0 identificadores de diferença |
| `chore/db-types-drift-20261012` | `c46731236c35397350678530094c078a3800be29` | 2026-10-12 | tag `arquivo/261116/chore_db-types-drift-20261012` | `types.ts` é gerado; tipos do `main` × schema de produção = 0 identificadores de diferença |
| `chore/db-types-drift-20261019` | `3ecbeb04568d130b2ea12ddb03b3e8e1c51d0fe5` | 2026-10-19 | tag `arquivo/261116/chore_db-types-drift-20261019` | `types.ts` é gerado; tipos do `main` × schema de produção = 0 identificadores de diferença |
| `chore/db-types-drift-20261022` | `7b137e3e367af5e93fa9672b2caccae81679f45f` | 2026-10-22 | tag `arquivo/261116/chore_db-types-drift-20261022` | `types.ts` é gerado; tipos do `main` × schema de produção = 0 identificadores de diferença |
| `chore/db-types-drift-20261026` | `900052084d9e8e28ff996dcfa195f9e88321235c` | 2026-10-26 | tag `arquivo/261116/chore_db-types-drift-20261026` | `types.ts` é gerado; tipos do `main` × schema de produção = 0 identificadores de diferença |
| `chore/db-types-drift-20261102` | `7d0a68ac7dba4bac16fd308cc5221848e514b849` | 2026-11-02 | tag `arquivo/261116/chore_db-types-drift-20261102` | `types.ts` é gerado; tipos do `main` × schema de produção = 0 identificadores de diferença |
| `chore/db-types-drift-20261109` | `5ad9de1eb518c63a4b68fe08937579cf26e43ab9` | 2026-11-09 | tag `arquivo/261116/chore_db-types-drift-20261109` | `types.ts` é gerado; tipos do `main` × schema de produção = 0 identificadores de diferença |
| `chore/db-types-drift-20261113` | `70f791735abdec4980deadf94942df3f6fa78c8b` | 2026-11-13 | tag `arquivo/261116/chore_db-types-drift-20261113` | `types.ts` é gerado; tipos do `main` × schema de produção = 0 identificadores de diferença |
| `chore/db-types-drift-20261114` | `34736fe0a6bf1dfd3bb19aeabf83bf728102e82e` | 2026-11-14 | tag `arquivo/261116/chore_db-types-drift-20261114` | `types.ts` é gerado; tipos do `main` × schema de produção = 0 identificadores de diferença |
| `chore/hermes-dividas-tecnicas` | `77e4647c567bedf035755fd15ff77f6038f5caed` | 2026-08-25 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `claude/auditoria-tecnica-sistema-6909vm` | `eef102ff56d6e2aaffa87d05e0bf40a3042cea57` | 2026-09-06 | tag `arquivo/261116/claude_auditoria-tecnica-sistema-6909vm` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `claude/auditoria-tecnica-sistema-9c0mnw` | `c4af7eb5a803d9b465750fac256c11f0a2217f79` | 2026-09-04 | tag `arquivo/261116/claude_auditoria-tecnica-sistema-9c0mnw` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `claude/chore-ci-bun-audit-ghsa-311031-2038` | `b90d0e4c02bc5a92d8a4cfa8d4684312f9e48ae8` | 2026-10-31 | tag `arquivo/261116/claude_chore-ci-bun-audit-ghsa-311031-2038` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `claude/chore-docs-agentes-261108-1950` | `17680eae186d332d1380a87da5dbf63cd8284d61` | 2026-11-08 | tag `arquivo/261116/claude_chore-docs-agentes-261108-1950` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `claude/chore-gap-analysis-zapp-pf-261102-1200` | `dd48a93df51d964ea025126ab088ee2efdefb6de` | 2026-11-07 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `claude/chore-supabase-js-2118-2507-1830` | `582a0b3be2e67c99235f190b7df70659f4ca64b9` | 2026-10-31 | tag `arquivo/261116/claude_chore-supabase-js-2118-2507-1830` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `claude/feat-asaas-links-empresa-260924-2128` | `26018e80be7e750de075c1a5a4361b18cd0f2f2f` | 2026-09-24 | tag `arquivo/261116/claude_feat-asaas-links-empresa-260924-2128` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `claude/feat-contexto-ia-261108-1520` | `cb7f8fec8ae520d24c431f06cb843dc336cb7cd8` | 2026-11-08 | tag `arquivo/261116/claude_feat-contexto-ia-261108-1520` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `claude/festive-maxwell-d32vus` | `8e15373231f5cf00ecbaffd253b18dbf65579184` | 2026-10-22 | tag `arquivo/261116/claude_festive-maxwell-d32vus` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `claude/fix-ci-hardening-260927-2000` | `0ac28ee70c118d73178b52803702827b3e3dfab4` | 2026-09-27 | tag `arquivo/261116/claude_fix-ci-hardening-260927-2000` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `claude/fix-n8n-tests-261031-1618` | `36957db43fab90c2e6e52a0dddea9b09af7d5df4` | 2026-10-31 | tag `arquivo/261116/claude_fix-n8n-tests-261031-1618` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `claude/fix-realtime-performance-alerts-261113-1159` | `3694328278059106871fe840263fb6caaada4a1e` | 2026-11-13 | tag `arquivo/261116/claude_fix-realtime-performance-alerts-261113-1159` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `claude/fix-totais-movimentacoes-rpc-311031-1548` | `a0a0780de785776bb26aa5e2cfd764e12634acbd` | 2026-10-31 | tag `arquivo/261116/claude_fix-totais-movimentacoes-rpc-311031-1548` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `claude/system-status-roadmap-f36r0o` | `4fccb0e33baeb3aae36702f80ffbf4c6cb098abb` | 2026-08-16 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `computador_local` | `0274005f67ffa268af31e0c88478e915fc3374b6` | 2026-11-14 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `dependabot/bun/eslint-config-prettier-10.1.8` | `25f8a60b1d6b1426e831537c9c4e4193fb231b23` | 2026-11-08 | tag `arquivo/261116/dependabot_bun_eslint-config-prettier-10.1.8` | PR fechada sem merge — rejeição já decidida antes desta sessão |
| `dependabot/bun/multi-75c0a8599d` | `d409658ba4937baec3a0f79ef1799ad1f62cdcf6` | 2026-11-10 | tag `arquivo/261116/dependabot_bun_multi-75c0a8599d` | PR fechada sem merge — rejeição já decidida antes desta sessão |
| `dependabot/bun/nanoid-6.0.2` | `a8afebba41865b1594c92e7eb2a75b1d23274701` | 2026-10-29 | tag `arquivo/261116/dependabot_bun_nanoid-6.0.2` | PR fechada sem merge — rejeição já decidida antes desta sessão |
| `dependabot/bun/radix-ui/react-hover-card-1.2.1` | `eaadf22fa579bafc39c1966a73f7e56f3e4b2a14` | 2026-10-27 | tag `arquivo/261116/dependabot_bun_radix-ui_react-hover-card-1.2.1` | PR fechada sem merge — rejeição já decidida antes desta sessão |
| `dependabot/bun/react-joyride-3.2.0` | `f226de0b17f07b039e15d8ea3f9db8a2dfb9938c` | 2026-11-10 | tag `arquivo/261116/dependabot_bun_react-joyride-3.2.0` | PR fechada sem merge — rejeição já decidida antes desta sessão |
| `dependabot/bun/recharts-3.10.1` | `4f2e3778f5fc34aac27da984b52976bb9d916d50` | 2026-10-27 | tag `arquivo/261116/dependabot_bun_recharts-3.10.1` | PR fechada sem merge — rejeição já decidida antes desta sessão |
| `dependabot/bun/vitest-5.0.5` | `5f7f858dd5fb8546bd7ad4d175649afb8d2fb162` | 2026-10-29 | tag `arquivo/261116/dependabot_bun_vitest-5.0.5` | PR fechada sem merge — rejeição já decidida antes desta sessão |
| `dependabot/bun/vitest/ui-5.1.0` | `693ba6143166c4ba70a07255cb52884cb02a9442` | 2026-11-12 | tag `arquivo/261116/dependabot_bun_vitest_ui-5.1.0` | PR fechada sem merge — rejeição já decidida antes desta sessão |
| `dependabot/github_actions/github/codeql-action/autobuild-4.39.1` | `35bae5838138a5fdf5609a1736a06cfd6dbb1904` | 2026-11-11 | tag `arquivo/261116/dependabot_github_actions_github_codeql-action_autobuild-4.39.1` | PR fechada sem merge — rejeição já decidida antes desta sessão |
| `docs/ci-functions-deploy-pendencia` | `edba6e4988c427404b01da7312c33fcb31f121ff` | 2026-10-29 | tag `arquivo/261116/docs_ci-functions-deploy-pendencia` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `ecc-tools/Promo_Finance_V2-1787413670150` | `e60fba9afc34601b2f304edcc7b59512bbb79321` | 2026-08-22 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/codex-055358-integracoes-financeiras-clean` | `1c27d20ef6343ccc41b6e7b60b4d0172be48d013` | 2026-09-10 | tag `arquivo/261116/fix_codex-055358-integracoes-financeiras-clean` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `fix/codex-c696391-contratos-auth-e2e` | `29eb6719b019d86f53123b874c8a8ffa726c15cd` | 2026-08-25 | tag `arquivo/261116/fix_codex-c696391-contratos-auth-e2e` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `fix/codex-h0831-reconciliacao-online` | `80aa2880fd595ab7f6afe800b9225164dd8da380` | 2026-08-31 | tag `arquivo/261116/fix_codex-h0831-reconciliacao-online` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `fix/conciliacao-audit-final` | `e779ce95212fbfb16d193b7ad605a9b14590728e` | 2026-08-15 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/convergencia-destino` | `07de3cc458ac0f753e38c9f25675e7f1f0a97c47` | 2026-08-25 | tag `arquivo/261116/fix_convergencia-destino` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `fix/exhaustive-deps-20260814` | `dfbfda25b39e87df3b7544417c340934a62a040b` | 2026-08-14 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-404933-excelencia-sistema` | `652068012de2a748fc96dca5c2f47ec19e0b4dd4` | 2026-08-22 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-405001-regua-cobranca` | `69cf9128d35d4c0b1480daa44c8a3ace9e3828cf` | 2026-08-22 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-405003-contrato-regua` | `ae3d7092cf7d6a1d9f8a904bc93ef72f6202b648` | 2026-08-22 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-405004-cron-regua` | `a4befc2258f6ecbe52ab7538f04ce6bda04e64bc` | 2026-08-22 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-405005-risco-credito` | `cc370fde0d93ed222ced5a98d4c7c71e1e165a79` | 2026-08-22 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-405006-auditoria-regime` | `eafc172ae5a11c9b2981404fde06f383a79b2a33` | 2026-08-22 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-416070-zod-edge-functions` | `e003df1399c3f8947f4dad6734b9c15c252f6b5d` | 2026-08-22 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-417950-ci-supabase-env` | `a580a7a1c3646260dd0220ff47d316a330e23bd8` | 2026-08-22 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-419311-e2e-auth-rotas` | `f4a2b2e16b98490b38fd7cc669f65e45bda1e348` | 2026-08-22 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-p0-vela-remap` | `9d8c5cf31f5d1611f4d45cfe02d5ff0f91ca370c` | 2026-08-25 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-p1-auth-aurora` | `3459d690d13f0cd3888378a84f8390b94ed91a90` | 2026-08-25 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-p2-appshell-stagger` | `a10c7fbd2702f0dfea7e11578a730c70083c0898` | 2026-08-25 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-p3-dashboard-cr` | `c1ba0751e844d8819789314b4020c027e9da0498` | 2026-08-25 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-p3-ext-statcards` | `7f68637dc23d3428eede1cd637d706c9e8e52130` | 2026-08-25 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-p4-hex-bespoke` | `a8cc75453f32f39b0838a8030e7936974e455f11` | 2026-08-25 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-p5-vela-cmdk` | `e06dd3b949cc5ed189c01c5866499d218249a5fd` | 2026-08-25 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-p6-vela-light` | `462c01f977aa73b7a070b63f34820e6bb14bf302` | 2026-08-25 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-p7-gates-vela` | `ce635a70daf500402432f687f6ac8047a0a9a956` | 2026-08-25 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-pie-distribuicao` | `39735a08bd57d9f56b87a64214a7ebe781ad7b36` | 2026-08-25 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/hermes-strict-burndown-p1` | `f9e5d259d95550667ac0f9ed5be01063cc369511` | 2026-10-04 | tag `arquivo/261116/fix_hermes-strict-burndown-p1` | consolidado no `main` pela #138 (04/10, "216→0"); resíduo do diff é só Prettier |
| `fix/hermes-strict-burndown-p10` | `58da653bb7f11cf7c97d206c05bd85056d44e8f1` | 2026-10-04 | tag `arquivo/261116/fix_hermes-strict-burndown-p10` | consolidado no `main` pela #138 (04/10, "216→0"); resíduo do diff é só Prettier |
| `fix/hermes-strict-burndown-p11` | `fa9a649ca8d06e46304a76c238f19e928d99ed98` | 2026-10-04 | tag `arquivo/261116/fix_hermes-strict-burndown-p11` | consolidado no `main` pela #138 (04/10, "216→0"); resíduo do diff é só Prettier |
| `fix/hermes-strict-burndown-p2` | `ee376f854b01676098b455318220fa7aba524e3c` | 2026-10-04 | tag `arquivo/261116/fix_hermes-strict-burndown-p2` | consolidado no `main` pela #138 (04/10, "216→0"); resíduo do diff é só Prettier |
| `fix/hermes-strict-burndown-p3` | `9de26fad16ec413cbb365fa46257b0e6238b3b8b` | 2026-10-04 | tag `arquivo/261116/fix_hermes-strict-burndown-p3` | consolidado no `main` pela #138 (04/10, "216→0"); resíduo do diff é só Prettier |
| `fix/hermes-strict-burndown-p4` | `9c14cb8295b6e52316052a4ea6f3bc0d799624d4` | 2026-10-04 | tag `arquivo/261116/fix_hermes-strict-burndown-p4` | consolidado no `main` pela #138 (04/10, "216→0"); resíduo do diff é só Prettier |
| `fix/hermes-strict-burndown-p5` | `7cc606acf9b9a33847289f5ca9f599f23dc2fd61` | 2026-10-04 | tag `arquivo/261116/fix_hermes-strict-burndown-p5` | consolidado no `main` pela #138 (04/10, "216→0"); resíduo do diff é só Prettier |
| `fix/hermes-strict-burndown-p6` | `8edd7a35e4a7aad3dd31337928b09c1295a0565c` | 2026-10-04 | tag `arquivo/261116/fix_hermes-strict-burndown-p6` | consolidado no `main` pela #138 (04/10, "216→0"); resíduo do diff é só Prettier |
| `fix/hermes-strict-burndown-p7` | `cdda39b3af4571bd5d5ef5ed3f9adb7e8a299e9d` | 2026-10-04 | tag `arquivo/261116/fix_hermes-strict-burndown-p7` | consolidado no `main` pela #138 (04/10, "216→0"); resíduo do diff é só Prettier |
| `fix/hermes-strict-burndown-p8` | `fb4aac82098af9a053f220d8f2b8f32c64a02cff` | 2026-10-04 | tag `arquivo/261116/fix_hermes-strict-burndown-p8` | consolidado no `main` pela #138 (04/10, "216→0"); resíduo do diff é só Prettier |
| `fix/hermes-strict-burndown-p9` | `cb2bc6d1a329b2e5e0ca048cdb7e29324a5680cf` | 2026-10-04 | tag `arquivo/261116/fix_hermes-strict-burndown-p9` | consolidado no `main` pela #138 (04/10, "216→0"); resíduo do diff é só Prettier |
| `fix/hermes-toolbar-jsx-generic` | `2db3f839366d1c88b623e4f13f435acb216f560b` | 2026-08-25 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/lint-cleanup-20260814` | `43ed3591bb78230cfedd3572284420bad4bd74ac` | 2026-08-14 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/maxlines-20260814` | `fcb1cfb30ba5c2b8330df26c021ecde43ad6ce05` | 2026-08-14 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/monitor-health-review-main-261107` | `c0b61218e2b4b44275550c427b5c89155d1c903c` | 2026-11-08 | tag `arquivo/261116/fix_monitor-health-review-main-261107` | verificação adversarial: acusação de perda não sobreviveu ao juiz independente |
| `fix/onda-melhorias-20260814` | `a657237b467adb662b1fd1211340f518c9930b11` | 2026-08-14 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/pendencias-20260815` | `5a9962d5ac841b97ef2c95f72c3a596acfe492c9` | 2026-08-15 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/perda-dados-20260815` | `6dcc95d2c2412a8205114f648acaafbf943854e4` | 2026-08-15 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/s10-contratos-20260815` | `00ea11e3edd24326fcbd9967f9a6f54e4c4cb3e7` | 2026-08-15 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/ts-nocheck-20260814` | `ca97efbdff2d2dbd7e741d9e639339df45c760a1` | 2026-08-14 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |
| `fix/validacao-final-20260815` | `f01e3820de60203571e2b717e8b09fe2a217dd3e` | 2026-08-15 | SHA (ancestral da `main`) | árvore idêntica ao merge-base: a branch não contém um byte que o `main` já não tivesse |

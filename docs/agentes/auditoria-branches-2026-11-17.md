# Auditoria de branches — 2026-11-17 (fechamento)

Conferência das **10 branches remotas** que restaram depois da limpeza de 2026-11-16, e
revalidação das 90 branches apagadas naquela limpeza. Complementa
`docs/agentes/inventario-branches-2026-11-16.md`; não o substitui.

**Resultado: nenhum trabalho de agente está perdido ou fora da `main`.**

## 1. As 90 branches apagadas em 16/11 continuam recuperáveis

| Prova                                                    | Comando                                                                                 | Resultado                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------- |
| As 54 branches de tip órfão têm tag de arquivo no remoto | `git ls-remote --tags origin 'refs/tags/arquivo/261116/*'` × tags citadas no inventário | **54/54 presentes**, 0 ausentes (77 tags no remoto) |
| Os 36 tips "ancestral da `main`" seguem alcançáveis      | `git merge-base --is-ancestor <sha> origin/main` para cada SHA                          | **36/36 ancestrais**, 0 fora                        |

Logo todo conteúdo apagado volta pelo procedimento da seção "Como recuperar uma branch
apagada" do inventário de 16/11.

## 2. As 10 branches que restam

`main` em `cf7bc77bf`.

| branch                            | commits fora da `main`                                  | o que tem de próprio                                                                                                                                                    | veredito                                                                                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `computador_local`                | 0 (ancestral da `main`)                                 | nada — `git diff` contra a `main` não acusa um único arquivo ausente                                                                                                    | incorporada; **mantida** por ser branch de máquina local do dono, republicada por ele                                                                                                                                       |
| `contexto`                        | 514 (histórico **desconexo** da `main`, sem merge-base) | 1690 arquivos: `README.md`, `vercel.json` e `docs/contexto/` (19,5 MB, 1688 arquivos)                                                                                   | **nunca apagar** — gerada pelo `contexto.yml` (cron `7 * * * *`, de hora em hora no minuto 7, mais cada push na `main`) e lida por agentes como fonte de verdade; regerada às 15:19 UTC de hoje apontando para `cf7bc77bfe` |
| `inventario`                      | 22 (histórico **desconexo**)                            | 5 arquivos: `README.md`, `vercel.json` e `inventario/estado/{banco,rotas,edges}.json`                                                                                   | **nunca apagar** — gerada pelo `inventario-estado.yml` (cron `41 9 * * 1`, segunda 09:41 UTC, mais cada push na `main`)                                                                                                     |
| `automation/estado-real`          | 1                                                       | `docs/ci/{kpi.json,README.md,MATRIZ_EDGE_TABELA.md}` — snapshot de telemetria **mais novo** que o da `main` (ex.: `auto-update-pr-branch.yml` com 1660 runs contra 982) | **mantida** — entregue por PR pelo `estado-real.yml` (cron de segunda, 11:38 UTC); zero código-fonte, só números que o próprio workflow reescreve                                                                           |
| 4 × `dependabot/bun/*`            | —                                                       | as PRs #371, #373, #375, #377                                                                                                                                           | decisão de custo/major do dono                                                                                                                                                                                              |
| `claude/infra-monitor-health-...` | 1                                                       | PR #426                                                                                                                                                                 | aberta por tocar workflow (§6.6)                                                                                                                                                                                            |

Nenhuma das 10 contém código-fonte, migration, edge function ou UI ausente da `main`.
`contexto` e `inventario` só parecem "divergentes" porque são **branches órfãs**: não
compartilham um único commit com a `main` e carregam apenas artefato gerado.

## 3. Correção de um erro de medição

Uma leitura anterior desta sessão concluiu que `contexto` e `inventario` tinham "0 arquivos
diferentes da `main`" e que poderiam ser apagadas. **Está errado nas duas pontas**:
`contexto` tem 1686 arquivos que a `main` não tem e `inventario` tem 3 — e nenhuma das duas
pode ser apagada, porque são a entrega de workflows ativos. O teste correto é
`git diff --no-renames --name-status origin/main origin/<branch>` somado ao
`git merge-base`, que revela o histórico desconexo.

## 4. Fechamento da sessão de 17/11 à noite — `main` em `f9b3094ba`

As seções 1-3 foram escritas com a `main` em `cf7bc77bf`. O intervalo
`cf7bc77bf..origin/main` tem **26 PRs** incorporadas
(`git log --first-parent ... | grep -cE '\(#[0-9]+\)'` = 26): #375, #377, #426, #428,
#429, #431, #432, #433, #434, #435, #436, #437, #438, #439, #440, #441, #443, #444, #445,
#446, #447, #448, #449, #450, #451, #453.

A tabela abaixo é um **recorte**: as 9 que entraram depois das seções 1-3 serem escritas,
mais a #442, fechada por equivalência. As outras 17 já estavam cobertas pelas seções
anteriores e pelo inventário de 16/11. Cada um dos 9 squash commits foi conferido com
`git merge-base --is-ancestor <sha> origin/main`: **9/9 ancestrais**, 0 fora.

| PR   | squash    | o que incorporou                                                        |
| ---- | --------- | ----------------------------------------------------------------------- |
| #436 | `176877a` | exceção de licença do mapbox-gl no Dependency Review (destravou a #375) |
| #439 | `1ccd853` | anonimização LGPD passou a surtir efeito e a fechar a solicitação       |
| #445 | `a378486` | 63 índices declarados e ausentes nas tabelas financeiras                |
| #446 | `4ba4b44` | `empresas.ativo` (era `ativa`) em duas rotinas                          |
| #449 | `9aa7ea6` | o trabalho da #442, de outro agente, recuperado e terminado             |
| #450 | `31bd09e` | 5 colunas inexistentes em `select`/`order` de Edge Functions            |
| #451 | `5be2cfc` | 5 colunas declaradas que o código lê e produção não tinha               |
| #453 | `2e8ac1d` | 43 dos 67 índices que a #445 havia excluído                             |
| #375 | `f9b3094` | `mapbox-gl` 3.26.0 → 3.35.0                                             |

### 4.1 #442 — fechada, não perdida

A PR de outro agente toca exatamente 3 arquivos
(`git diff --name-only $(git merge-base origin/main HEAD) HEAD`):
`docs/DB_HEALTH.md`, `supabase/functions/n8n-callback/index.ts`, `vite.config.ts`.
Conferência linha a linha contra `origin/main` depois da #449:

| mudança da #442                                                   | onde está na `main`                      |
| ----------------------------------------------------------------- | ---------------------------------------- |
| `throw new Error('severity invalida')` sem interpolar o valor     | `n8n-callback/index.ts:174`              |
| `if (error) throw new Error(mensagemErro(error))`                 | `n8n-callback/index.ts:204`              |
| `import { createRequire } from 'node:module'`                     | `vite.config.ts:4`                       |
| `createRequire(import.meta.url)('./env.manifest.json').vars`      | `vite.config.ts:18`                      |
| Sentry exigindo `SENTRY_ORG`/`SENTRY_PROJECT` e passando os dois  | `vite.config.ts:59,65,66,68,69`          |
| seção 7 do `DB_HEALTH.md` (auditoria de guard das Edge Functions) | `main`, **reescrita além da #442** (4.2) |

A branch `claude/fix-review-findings-20261117-1611` **não foi apagada**: é de outro agente,
e para esta sessão era somente leitura.

### 4.2 O ponto de review que a #442 deixou aberto, terminado

O comando da seção 7 do `DB_HEALTH.md` acusava **70** Edge Functions "sem proteção" com
valor esperado **0** — alarme falso de 70 linhas, porque contava como desprotegida toda
função que autentica por conta própria (`n8n-callback` valida HMAC ou segredo compartilhado
em `index.ts:62-69`). Virou auditoria de dois passos, com o resultado tratado como lista de
candidatos à revisão: **70** sem os três guards → **40** sem nenhuma auth no código →
**21** também sem `verify_jwt` no `supabase/config.toml`. O invariante deixou de ser "zero
funções na lista" e passou a ser "nenhum candidato sem justificativa escrita".

### 4.3 As branches no fim da sessão

Duas medições, em momentos diferentes, porque a limpeza aconteceu durante a sessão:

- **13 refs** no momento em que esta seção foi escrita (tabela abaixo: 9 branches + `main`
  - 3 que ainda não tinham sido mergeadas-e-apagadas);
- **9 refs** depois dos merges de #447, #448 e #449:
  `automation/estado-real`, `claude/chore-auditoria-branches-261117-2300`,
  `claude/fix-review-findings-20261117-1611`, `claude/fix-vw-fluxo-caixa-261117-2225`,
  `computador_local`, `contexto`, `dependabot/bun/radix-ui-4a35e951ff`, `inventario`,
  `main`.

`comm -13` compara **nome** de arquivo, não conteúdo. A comparação de conteúdo está em
4.4 e cobre as 4 branches sem PR. Para branch com PR aberta o conteúdo **não** está na
`main` por definição — é o que a PR existe para levar — e a verificação dela é o merge,
não esta tabela.

| branch                                      | commits fora da `main` | arquivos exclusivos | veredito                                     |
| ------------------------------------------- | ---------------------- | ------------------- | -------------------------------------------- |
| `claude/fix-bitrix-colunas-261117-2110`     | 4                      | —                   | PR #447, aguardando `Quality Gate & Tests`   |
| `claude/fix-assinatura-filtro-salvo-…-2120` | 3                      | —                   | PR #448, idem                                |
| `claude/fix-vw-fluxo-caixa-261117-2225`     | 2                      | —                   | PR #452, idem                                |
| `claude/fix-review-findings-20261117-1611`  | 1                      | 0                   | #442 fechada por equivalência (4.1)          |
| `dependabot/bun/radix-ui-4a35e951ff`        | 18                     | —                   | #371 `CONFLICTING`; só o Dependabot rebaseia |
| `computador_local`                          | **0**                  | **0**               | incorporada; mantida (seção 2)               |
| `contexto`                                  | 528                    | 1687                | **nunca apagar** — automação viva (seção 2)  |
| `inventario`                                | 27                     | 3                   | **nunca apagar** — automação viva (seção 2)  |
| `automation/estado-real`                    | 1                      | **0**               | mantida — snapshot de telemetria do workflow |

`contexto` e `inventario` continuam se regenerando: o último commit de cada uma cita um
commit de `main` desta sessão (`1ccd853` e `4ba4b44`). Isso confirma a seção 2 — são
entrega de workflow ativo, não trabalho abandonado.

**Conclusão, limitada ao que foi medido:** nenhuma das **4 branches sem PR** contém
código-fonte, migration, edge function ou UI ausente da `main` — provado por hash de blob
em 4.4. As branches com PR carregam, por desenho, trabalho que ainda não está na `main`;
o registro delas é a própria PR, e nenhuma foi apagada antes do merge.

### 4.4 Comparação byte a byte, não por contagem

Contar commit e arquivo não prova equivalência. O teste aplicado nas 4 branches sem PR
compara **hash de blob**, arquivo por arquivo:

```bash
# arquivos exclusivos da branch que sejam código-fonte
comm -13 <(git ls-tree -r --name-only origin/main | sort) \
         <(git ls-tree -r --name-only origin/<branch> | sort) \
  | grep -cE '^(src/|supabase/(functions|migrations)/)'

# arquivos compartilhados cujo CONTEÚDO difere (blob hash diferente)
join <(git ls-tree -r origin/main      | awk '{print $4" "$3}' | sort) \
     <(git ls-tree -r origin/<branch>  | awk '{print $4" "$3}' | sort) \
  | awk '$2!=$3{print $1}' | grep -E '^(src/|supabase/(functions|migrations)/)'
```

| branch                   | exclusivos que são código-fonte | blobs de código divergentes da `main` | divergentes **contra o próprio merge-base** |
| ------------------------ | ------------------------------- | ------------------------------------- | ------------------------------------------- |
| `contexto`               | **0** (de 1687 exclusivos)      | **0**                                 | —                                           |
| `inventario`             | **0** (de 3)                    | **0**                                 | —                                           |
| `automation/estado-real` | **0** (de 0)                    | 6 edge functions                      | **0** (merge-base `176877a`)                |
| `computador_local`       | **0** (de 0)                    | 9 edge functions                      | **0** (merge-base `e9cd145`)                |

As divergências das duas últimas são a `main` ter avançado: os blobs delas são
**byte-idênticos ao próprio merge-base**, e o único commit exclusivo de
`automation/estado-real` (`c29292ea0`) toca apenas
`docs/ci/{MATRIZ_EDGE_TABELA.md,README.md,kpi.json}`. Não é versão alternativa de edge
function — é a versão anterior ao merge.

**Conclusão byte a byte: não existe um byte de código-fonte, migration, edge function ou UI
em branch alguma que não esteja na `main` ou não seja uma versão mais antiga de algo que
está na `main`.**

---

## 5. Fechamento da auditoria — 2026-11-17 21:46 UTC

Estado final das branches remotas, depois dos merges da sessão (#448, #450, #451, #453,
#454, #456, #452):

| branch                                          | veredito                                                                                   | ação          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------- |
| `main`                                          | —                                                                                          | —             |
| `claude/fix-duplicatas-contas-261117-2320`       | PR #455 aberta, índices anti-duplicata                                                     | merge na sessão |
| `claude/infra-gate-colunas-select-261117-2340`   | PR #457, mexe em `.github/workflows/ci.yml`                                                | **aberta para o dono** (regra 6.6) |
| `dependabot/bun/radix-ui-4a35e951ff`             | PR #371; diff = **só** `package.json` + `bun.lock`, todos os bumps dentro do mesmo major; `CONFLICTING`/`DIRTY` | **aberta para o dono**; branch alheia = somente leitura (regra 6.1) |
| `computador_local`                              | **ancestral** de `main` (`git merge-base --is-ancestor` verdadeiro, 0 commits próprios)    | mantida, nada a recuperar |
| `contexto`                                       | artefato gerado (`docs/contexto/**`: 1673 dumps `.sql` de funções do banco + índices JSON), histórico órfão, autor `contexto[bot]` | mantida, workflow regenera |
| `inventario`                                     | artefato gerado (`inventario/**`, 0 arquivo `.ts/.tsx/.sql`), histórico órfão, autor `inventario[bot]` | mantida, workflow regenera |
| `automation/estado-real`                         | 1 commit próprio, diff = `docs/ci/{MATRIZ_EDGE_TABELA.md,README.md,kpi.json}`, os três presentes na `main` | mantida, workflow regenera |

### 5.1 Branch apagada, com prova

`claude/fix-review-findings-20261117-1611` tinha **1 commit fora da `main`** —
`569ebd6ed fix: aplica findings de review das PRs #240/#248 (n8n-callback, vite.config, DB_HEALTH)`,
trabalho de outro agente. Conferido arquivo por arquivo antes de apagar:

| arquivo                                   | o que a branch trazia                                                                 | onde está na `main`                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `supabase/functions/n8n-callback/index.ts` | `throw new Error('severity invalida')` sem vazar o valor recebido; `throw new Error(mensagemErro(error))` no `insertSingle` | `main:174` e `main:204` — idênticos               |
| `vite.config.ts`                          | `createRequire(import.meta.url)` no lugar de `require()`; Sentry exigindo `SENTRY_ORG`/`SENTRY_PROJECT`; filtro `missing` | `main:4`, `main:18`, `main:65-69` — só a quebra de linha do prettier difere |
| `docs/DB_HEALTH.md`                       | seção 7 afirmando "esperado **0** funções sem guard"                                  | a `main` tem versão **mais nova que desmente isso** com medição (70 funções sem os três guards, 30 com auth própria, 21 candidatos reais) |

Nenhum byte exclusivo restante: `git diff origin/main origin/<branch>` só acusava a `main`
à frente. Ref apagada via `github_delete_ref` (204).

**Base da exclusão.** O AGENTS §6.1 diz que branch alheia é somente leitura, e isso continua
valendo para *escrever* nela — commit, rebase, force-push. A exclusão aqui foi feita sob
instrução direta e explícita do dono nesta sessão, que manda fechar as branches depois de
recuperar o trabalho e fixa a condição: *"vc precisa ter certeza absoluta (byte x byte) de
cada branch ou pr antes de exclui-la, só podemos excluir aquilo que temos certeza já foi
incorporado a main ou ficou realmente obsoleto — essa regra vale para prs e branchs"*.
Regra do dono vence o documento (AGENTS, cabeçalho). A condição foi cumprida arquivo por
arquivo, como está registrado acima. **Sem essa instrução, a branch não seria apagada** — e
nenhuma outra branch alheia foi tocada: a `dependabot/bun/radix-ui-4a35e951ff` segue intacta
e com a PR #371 aberta, porque ali não houve nem equivalência nem obsolescência comprovada.

As branches de PR mergeada (`claude/fix-vw-fluxo-caixa-261117-2225`,
`claude/fix-faturamento-impostos-261117-2330` e as demais da sessão) foram apagadas
automaticamente pelo GitHub no squash-merge — confirmado por `git fetch` devolvendo
`couldn't find remote ref`, com o conteúdo presente na `main`
(`supabase/migrations/20261117224000_vw_fluxo_caixa_por_empresa.sql`,
`src/.../__tests__/faturamento-grava-impostos.test.tsx`, `useHistoricoFinanceiro.ts:21`).

### 5.2 Conferência por hash de blob, refeita depois dos merges da sessão

Repetida contra a `main` já com #452/#456 dentro, pelo mesmo método da seção 4.4:

| branch                   | exclusivos que são código-fonte | blobs de código divergentes |
| ------------------------ | ------------------------------- | --------------------------- |
| `contexto`               | **0**                           | **0**                       |
| `inventario`             | **0**                           | **0**                       |
| `automation/estado-real` | **0**                           | 2                           |
| `computador_local`       | **0**                           | 2                           |

Os 2 blobs são os mesmos nas duas branches — `src/components/tributario/historico/FaturamentoTab.tsx`
e `src/hooks/useHistoricoFinanceiro.ts` — e são **byte-idênticos à versão que a `main`
tinha antes da #456**:

```
FaturamentoTab.tsx        main hoje d8ee29aa | main antes da #456 8210940e | ambas as branches 8210940e
useHistoricoFinanceiro.ts main hoje 87f672e9 | main antes da #456 cfc773f3 | ambas as branches cfc773f3
```

Ou seja: cópia da versão anterior, não variante com trabalho próprio. **Zero byte de
código-fonte exclusivo em qualquer branch de bot.**

---

## 6. Auditoria das 75 PRs **fechadas** — 2026-11-17 23:30 UTC

A seção 5 fechou as branches. Falta o lugar onde trabalho de agente realmente desaparece: **PR
fechada sem merge**. O repositório tem 75 fechadas; as de `dependabot` são bumps (substituídos
ou recusados de propósito), sobrando **34 de agente**. Todas foram auditadas.

### 6.1 Método (três testes, do mais fraco ao decisivo)

```bash
# 1) ancestralidade — a head da PR já está contida na main?
git fetch origin "refs/pull/$N/head:refs/pr/$N"
git merge-base --is-ancestor refs/pr/$N origin/main

# 2) patch-id — git cherry casa o diff byte a byte
git cherry origin/main refs/pr/$N      # '-' = já na main, '+' = fora

# 3) containment de linha — as linhas que a PR ADICIONOU existem hoje na main?
git diff -U0 $(git merge-base refs/pr/$N origin/main) refs/pr/$N -- <arquivo> \
  | grep '^+' | grep -v '^+++'         # cada linha >= 25 chars é procurada no arquivo da main
```

Os testes 1 e 2 **super-reportam**: squash-merge e meses de drift mudam o patch-id mesmo quando
o conteúdo está lá. O teste 3 é o que decide, complementado por **verificação do efeito em
produção** (query no banco) quando o que faltava era DDL.

### 6.2 Resultado

**Arquivos criados por PR fechada e ausentes da `main`: nenhum** — com três exceções
investigadas uma a uma, todas resolvidas:

| PR | arquivo ausente | veredito |
|---|---|---|
| #65 | `20251213000001_add_missing_columns_contas_pagar.sql` | **obsoleta**: das 17 colunas, 9 não existem em produção — e nenhuma das 9 é declarada no `types.ts` para `contas_pagar` (36 colunas, casa com o banco). O contrato do app nunca as esperou. |
| #65 | `20251215000001_fix_status_pagamento_enum.sql` | **obsoleta**: `ALTER TYPE status_pagamento ADD VALUE 'atrasado'` — o tipo **não existe** em produção (`pg_enum` devolve 0); o schema foi para `text` + `chk_contas_pagar_status`. |
| #65 | `20260728214210_add_sessao_id_to_historico_conciliacao_ia.sql` | **aplicada por outra via**: `historico_conciliacao_ia.sessao_id` **existe** em produção. |

**#3** (`Limpeza profunda: ~70 arquivos fantasmas`) parecia ter 59 arquivos ausentes. São as
**próprias deleções dela**: `git diff --name-status` devolve 58 `D` e 2 `A`, e os 2 adicionados
(`src/components/__tests__/regression-fixes.test.tsx`, `src/hooks/__tests__/use-toast.test.ts`)
**estão na `main`**. A faxina foi aplicada; nada a recuperar.

**#116, #253, #112, #69, #64, #259**: zero arquivo ausente. O que o containment acusava é drift
de linha (a `main` evoluiu em cima).

### 6.3 Containment baixo que não era perda

| PR | o que parecia faltar | o que a `main` tem |
|---|---|---|
| #246 / #233 (39%) | 16 linhas de `supabase/functions/_shared/sentry.ts` | reescrita **superset**: mesmo `captureException(error, context)`, mesmo endpoint `/api/<project>/store/`, mas lendo `EDGE_SENTRY_DSN ?? SENTRY_DSN` e com `SENTRY_ENVIRONMENT` |
| #65 (42%) | linhas de `empresa_id` em forms e hooks | o invariante está lá e **mais forte**: `useCategorias.ts:101`, `useCentrosCusto.ts:50` e `FornecedorForm.tsx:148` gravam `empresa_id` da sessão, e os hooks fazem `const { empresa_id: _empresaIdIgnorada, ...dados } = input` — o cliente não consegue mais injetar empresa. `CentroCustoForm.tsx` não cita `empresa_id` porque delega (`:99 criarCentroCusto.mutateAsync`), e o hook **lança** se não houver empresa selecionada |

### 6.4 Efeito em produção das PRs de DDL fechadas

Conferido por query, não por arquivo:

| PR | o que trazia | produção |
|---|---|---|
| #348 | GRANTs `authenticated` | `audit_logs` INSERT ✅, `planos_acao` SELECT ✅ |
| #345 | rotina que marca contas vencidas | função presente em `pg_proc` ✅ |
| #332 | `performance_alerts` no realtime | em `pg_publication_tables` ✅ |
| #228 | `obter_totais_movimentacoes` com assinatura certa | `(p_start date, p_end date, p_tipo text, p_search text)` ✅ |
| #232 | steps 12-21 | policies em `estrategias_elisao` (2) ✅, `asaas_payment_links.empresa_id NOT NULL` ✅, `movimentacoes` com autovacuum próprio ✅ |
| #231 / #223 | ignores GHSA e warning `DATABASE_URL` no CI | ambos no `ci.yml` da `main` ✅ |
| #229 | rate limit em 4 edge functions | presente nas 4 ✅ |
| #302 | registro do `github-settings-guard` | registrado no `automation.config.json` ✅ |
| #224 | `conta_ids` em `TopDevedor` | `src/hooks/useCobrancas.ts:34` ✅ |
| #430 / #340 | — | fechadas de propósito: "diagnóstico errado" e "substituída pela #366" |

### 6.5 Varredura de drift `types.ts` × produção (294 tabelas e views)

Feita por fingerprint `md5` por tabela, comparada em bucket por letra inicial para não trafegar
o schema inteiro:

```sql
SELECT table_name, substr(md5(string_agg(column_name, ',' ORDER BY column_name)),1,8)
FROM information_schema.columns WHERE table_schema='public' GROUP BY table_name;
```

**Coluna declarada no `types.ts` e ausente em produção — e lida pelo código: nenhuma.** O único
caso declarado-e-ausente é `vw_fluxo_caixa.data`, `.total_creditos` e `.total_debitos`, resíduo
do `types.ts` anterior à #452: `grep -rn 'total_creditos\|total_debitos' src supabase/functions`
(fora do `types.ts`) devolve **zero**, e o único consumidor da view usa
`select('*').order('dia')` (`src/hooks/useViews.ts:40`), colunas que existem. Os outros 20
desvios são o inverso — produção com mais colunas que o `types.ts` —, inofensivos para o
PostgREST e cobertos pela lista de exceções do gate da #457. Duas entradas do `types.ts`
(`mv_benchmark_setorial`, `mv_performance_alerts_weekly`) não aparecem em
`information_schema.columns` porque são **materialized views**, não drift.

**Conclusão: não existe trabalho de agente, total ou parcial, fora da `main` — em branch ou em
PR fechada.**

### 6.6 O que o containment NÃO prova, e os dois testes que fecham o buraco

O teste da seção 6.1 olha só linhas **adicionadas**, com no mínimo 20 caracteres, e não confere
ordem nem contexto. Ele **não** cobre o caso de uma PR cujo valor era *remover* algo: a remoção
poderia não estar na `main` e o teste passaria. Apontado pelo Devin na #462. Dois testes
adicionais fecham isso.

#### Teste simétrico — as remoções de cada PR foram aplicadas?

Mesmo método, invertido: cada linha que a PR **apagou** é procurada no arquivo da `main` de hoje.
Se ainda está lá, a remoção não foi aplicada.

```
TOTAL removidas=7097   ainda presentes na main=4968
```

Número alto porque reescrita de bloco conta como remoção + adição, e porque a busca é por
string em qualquer posição do arquivo. O que importa é o **invariante de cada PR**, e as duas em
que isso era segurança foram verificadas uma a uma:

| PR | invariante | onde está na `main` |
|---|---|---|
| #64 | `exigirPapel()` tem de respeitar `is_active` em `user_roles` | `supabase/functions/_shared/auth-guard.ts` filtra `.eq('is_active', true)` em **:195, :462 e :520**, com o porquê de não usar `has_role` documentado em **:455** — e há teste de regressão em `auth-guard_test.ts:57` (`searchParams.get('is_active') === 'eq.true'`) |
| #112 | link de pagamento Asaas amarrado à empresa, sem vazamento cross-tenant | `supabase/functions/asaas-proxy/index.ts:222` define `empresaDoLinkPagamento()` + `exigirEmpresaDoRecurso()`; o insert grava `empresa_id` (**:887**) e a listagem monta `empresaPorLink` para filtrar (**:921**) |

#### Replay real das migrations — prova direta de que os guards da #65 não faltam

Das 34 PRs, 61 arquivos "em risco" eram migrations **já existentes** que a #65 modificou para
acrescentar guards do tipo
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS empresa_id` com o comentário
`-- Guard: table may already exist on preview branch without empresa_id column`. A `main` ficou
com os arquivos originais. Esses guards existiam para o replay numa preview branch parcialmente
migrada.

Rodei o harness da #433 (`scripts/db/replay-migrations.sh`) num Postgres 16 local, do zero,
sobre a árvore da `main` — **sem** os guards:

```
aplicados=1045  falharam=0  total=1045
```

Replay completo, zero falha. Os guards da #65 são comprovadamente dispensáveis, e as colunas que
eles protegiam existem em produção (ex.: `bitrix_sync_logs.empresa_id`).

**Escopo exato da conclusão:** para as 34 PRs de agente fechadas sem merge, nenhum arquivo
criado por elas está ausente da `main` (as 3 exceções estão explicadas em 6.2); as remoções e
reescritas foram conferidas pelo invariante de cada PR onde havia risco de segurança; e o replay
do histórico completo passa 1045/1045. Não houve inspeção manual linha a linha das 19.906 linhas
adicionadas nem das 7.097 removidas — o que foi feito está descrito acima, e é o que sustenta a
conclusão.

### 6.7 As 4 PRs do Dependabot — prova byte a byte

A seção 2 (linha 29) deixou as quatro como "decisão de custo/major do dono", sem a
conferência de conteúdo. Fechada aqui. Nenhuma delas tem código: o diff de cada uma é
`package.json` + `bun.lock`, só strings de versão.

| PR | estado | o que propunha | está na `main`? |
|---|---|---|---|
| #371 | fechada sem merge | 19 pacotes `@radix-ui/*` | **sim, idêntico** — as 19 versões propostas batem uma a uma com a `main` (entregues pela #460, `fee7c1da1`) |
| #375 | **mergeada** | `mapbox-gl` 3.26.0 → 3.35.0 | sim — `"mapbox-gl": "^3.35.0"` |
| #377 | **mergeada** | `i18next` 26.0.10 → 27.1.1 | sim — `"i18next": "^27.1.1"` |
| #373 | fechada sem merge | `react` ^18.2.0 → ^19.3.1 e `@types/react` ^18.2.43 → ^19.3.0 | **não, e de propósito** |

Por que a #373 não entra: ela sobe `react` para 19 e **não** sobe `react-dom`
(`^18.2.0`) nem `@types/react-dom` (`^18.2.17`). `react-dom` precisa acompanhar o major
de `react`; a proposta quebra por construção, não é "trabalho pela metade a terminar".
Subir para React 19 corretamente é bump major com reteste das 2689 suítes e revisão de
compatibilidade de shadcn/Radix — custo e arquitetura, portanto decisão do dono
(AGENTS §6.6). O Dependabot reabre a PR quando houver nova versão; nada se perde ao
mantê-la fechada.

Branches das quatro: removidas pelo próprio GitHub no fechamento. Isso não apaga o
conteúdo — `refs/pull/<n>/head` sobrevive e foi de lá que os diffs acima saíram
(`gh api repos/.../pulls/<n>/files`), depois das branches já não existirem.

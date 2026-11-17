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

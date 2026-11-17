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

As seções 1-3 foram escritas com a `main` em `cf7bc77bf`. Desde então 9 PRs entraram e 1
foi fechada por equivalência. Cada squash commit foi conferido com
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

### 4.3 As 13 branches no fim da sessão

Medido com `git rev-list --count origin/main..<branch>` e
`comm -13` entre as árvores, após `git fetch --prune`.

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

**Nenhuma das 13 contém código-fonte, migration, edge function ou UI ausente da `main`.**

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

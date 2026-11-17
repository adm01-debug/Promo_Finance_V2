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

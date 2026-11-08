# Relatório — análise de PRs abertas (Promo_Finance_V2)

**Baseline main:** `c6eb99b275e1270cf99f1216e808c120f7cf58a2` — todos os checks concluídos em SUCCESS (único pendente: `E2E Destructive Logout`, em fila, não vermelho). Observado em 2026-11-08T21:16Z.

**Total de PRs abertas no início desta rodada: 34.**

## Resumo por veredito

| Veredito | Qtd | PRs |
|---|---|---|
| MERGEADA (minhas, fecharam supersede de PR com BEHIND/conflito/CI vermelho) | 2 | #266, #268 |
| EM_ANDAMENTO (minhas, aguardando CI para merge) | 5 | #267, #269, #270, #271, #272 (+ #273 documentação) |
| SUPERSEDIDA (PR de terceiro cujo conteúdo já está coberto por uma minha) | 6 | #213, #214, #215, #254, #257, #264 |
| FECHADA EXTERNAMENTE (não por esta sessão) | 1 | #209 (fechada após #266 mergear equivalente; provável auto-close do dependabot) |
| AGUARDANDO_HUMANO | 16 | #131, #203, #204, #205, #206, #211, #212, #234, #235, #238, #243, #253, #255, #256, #263, #265 |
| BLOQUEADA (bun.lock em conflito; registro npm indisponível nesta sessão cloud) | 3 | #208, #210, #216 |
| NAO_INICIADA | 1 | #175 |

(2+5+6+1+16+3+1 = 34, bate com o total. #273 é PR de documentação própria desta sessão, fora da contagem original.)

## MERGEADAS

- **#266** (supersede #209, fix framer-motion 14.x) → squash-merge em main, SHA `6a925600f36f44488dc07b79e063f3dd67e5d30b`. Correção: fix de tipos do framer-motion (`type: 'spring' as const`, `ease: [...] as [number,number,number,number]`) + conversão draft→ready via GraphQL `markPullRequestReadyForReview`. Checks obrigatórios 100% SUCCESS antes do merge.
  - **Gap pós-merge encontrado e corrigido:** `src/components/ui/micro-interactions.tsx` tinha o mesmo padrão `type: 'spring'` inline em `StaggerItem`/`EmptyState` sem o fix — corrigido na PR **#278** (`claude/fix-micro-interactions-spring-261108-2353`), aberta e aguardando CI.
- **#268** (supersede #214, bump eslint-config-prettier 9→10) → squash-merge em main, SHA `d8804a2000192594419275bc94da6e44fbf6e211`. Checks obrigatórios 100% SUCCESS antes do merge. Auditoria pós-merge: pacote bumpado não é referenciado em `eslint.config.js` (dependência órfã pré-existente) — sem risco de quebra.

## EM_ANDAMENTO (progresso ao vivo)

Todas são branches `claude/fix-pr<n>-...` criadas nesta sessão a partir da PR original + merge de `main`, para sair do estado BEHIND. Nenhuma tem check vermelho confirmado como causado por ela própria; todas aguardam a fila de Actions (contenção de jobs concorrentes da conta, não config/código) esvaziar. Squash merge assim que `mergeStateStatus=CLEAN`.

- **#267** supersede #213 (dnd-kit): checks em fila, sem vermelho.
- **#269** supersede #215 (eslint-plugin-react-refresh): checks em fila, sem vermelho.
- **#270** supersede #254 (TS2345 gerar-pacote-evidencias): teve falha pontual em "Zod coverage gate" apontando `whatsapp-ia-proativo` sem validação — **investigado e descartado como falha desta PR**: o diff de #270 não toca esse arquivo, e o arquivo já tem `validatePayload` importado/chamado no SHA exato que falhou (confirmado lendo o blob via API). Aparenta flake do gate; rerun solicitado, bloqueado por a run ainda estar em andamento — repetir quando terminar.
- **#271** supersede #257 (monitor-health review #240): checks em fila, sem vermelho.
- **#272** supersede #264 (docs/agentes): checks em fila, sem vermelho.

## AGUARDANDO_HUMANO (não mergear — motivo, com evidência)

- **#131** — conflito aberto desde set/26, 90 arquivos, precisa decisão de escopo.
- **#203, #204, #205, #206** — bumps de `.github/workflows/*` (codeql-action, actions/checkout). Regra 8: mudança em workflows exige humano.
- **#211** (zod 3.25.76→4.6.7) — diff confirmado via `github_get_pr_diff`. O próprio `ci.yml` (bloco `bun audit --ignore=GHSA-mrhx-c7xc-m3w5`) documenta que o app usa só a API clássica v3 (24 imports de `'zod'`, zero de `'zod/v4'`) e que o fix do CVE exige migração própria do v4 — major com breaking changes, mudança de arquitetura.
- **#212** (react-dom/@types/react-dom 18→19) — diff confirmado: o bump é **quebrado**. `react-dom` e `@types/react-dom` vão para `^19.3.1`/`^19.3.0`, mas `react` fica em `^18.2.0`. react-dom@19 exige `react@^19.3.1` como peerDependency — mismatch de major explica os 15 testes E2E que já falhavam. Corrigir exigiria bumpar `react` também, i.e. migração React 18→19 completa.
- **#234, #235, #238, #243** — cada uma adiciona migration SQL que roda em produção. Regra 8: DDL/migration produção.
- **#253** (verificação pós-deploy edge functions) — a própria descrição da PR já se autoclassifica: *"Regra 8 — aguardando dono. Toca deploy de produção: PR mantida aberta, sem merge."* Validação interna do autor já feita (35/35 testes unitários + self-test E2E); falta só a decisão do dono.
- **#255** — toca `supabase/functions/asaas-proxy/index.ts` (edge function de pagamento, R2 explícita na regra 8).
- **#256** — provável duplicata obsoleta de #257/#271 (mesmo objetivo monitor-health, não rebaseada); é PR de terceiro, não fechada por esta sessão — decisão de fechar cabe ao humano.
- **#263** — altera `.github/workflows/ci.yml`.
- **#265** — adiciona `.github/workflows/inventario-estado.yml`.

## BLOQUEADAS (ambiente desta sessão não permite corrigir)

- **#208** (radix-ui), **#210** (@sentry/react), **#216** (vitest 4→5) — `bun.lock` em conflito (DIRTY). Corrigir exige `bun install` para regenerar o lockfile, mas o registro npm está bloqueado nesta sessão cloud (`ProxyConnectFailed 403` no proxy de rede, confirmado novamente durante a auditoria de validação ao tentar rodar type-check local). NÃO VERIFICADO se um ambiente com acesso a npm resolveria.

## NÃO INICIADA

- **#175** (recharts 2.15.4→3.10.1) — diff confirmado: recharts 3.x adiciona `@reduxjs/toolkit`, `react-redux`, `immer`, `redux`, `redux-thunk` como novas dependências transitivas e troca `victory-vendor` 36→37; API de eixos/legendas também mudou no v3 (breaking upstream conhecido). Precisa validar os componentes de gráfico do app manualmente antes de mergear — evidência levantada, mas migração em si não iniciada por falta de tempo nesta sessão (bloqueada pela fila de CI no momento).

## FECHADA EXTERNAMENTE

- **#209** (framer-motion 11→14, supersedida por #266) — estava registrada como BEHIND/MERGEABLE na análise original; reconsulta via API mostrou `state: CLOSED`. Fechamento não foi feito por esta sessão (nenhuma chamada de `close_issue`/edição foi emitida para #209) — provável auto-close do Dependabot ao detectar que a mudança equivalente já entrou via #266.

## Auditoria de validação pós-merge (5 agentes especializados, 2026-11-08 23:00–23:55Z)

A pedido do dono, após os primeiros 2 merges, 5 agentes em paralelo auditaram exaustivamente o que já foi implementado nesta sessão:

1. **PR #266 (framer-motion):** GAP real encontrado (`micro-interactions.tsx`) e corrigido na PR #278.
2. **PR #268 (eslint-config-prettier):** confirmado sem gaps.
3. **Inventário `analise-prs/`:** 3 divergências de documentação (status de #209, textos desatualizados de #266/#268, contagem de `prs_em_andamento`) — corrigidas nesta atualização.
4. **Causa raiz da fila de CI:** confirmada e agravada — contenção de jobs concorrentes da conta inteira, não isolada a este ciclo; outras sessões continuam adicionando carga.
5. **Compliance Fluxo Git:** compliance total — nenhum workflow tocado, nenhum padrão de afrouxamento, autoria de commits consistente, nenhuma PR alheia alterada.

Durante a auditoria, uma falha real de CI na PR #270 ("Zod coverage gate") foi investigada e determinada como não causada por essa PR (ver seção EM_ANDAMENTO acima).

## Prova de que nada foi afrouxado

Nenhum commit desta sessão tocou `.github/workflows/`, removeu/pulou teste, usou `.skip`/`.only`, `eslint-disable`, `@ts-ignore`/`any` para calar erro, ou ampliou baseline/allowlist. As correções em #266-#272 e #278 foram: merge de `main` na branch (resolve BEHIND), formatação prettier, fix de tipos do framer-motion. Diffs mínimos, sem refatoração.

## Nenhuma PR alheia foi fechada, editada ou comentada

Todas as PRs de terceiros (dependabot: #175, #203-#216; e PRs de outras sessões: #131, #234, #235, #238, #243, #253, #255, #256, #263, #265) permanecem como estavam — apenas lidas via API. #209 foi fechada por ação externa, não por esta sessão (confirmado: nenhuma chamada de fechamento foi emitida para ela).

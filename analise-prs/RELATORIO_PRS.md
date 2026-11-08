# Relatório — análise de PRs abertas (Promo_Finance_V2)

**Baseline main:** `c6eb99b275e1270cf99f1216e808c120f7cf58a2` — todos os checks concluídos em SUCCESS (único pendente: `E2E Destructive Logout`, em fila, não vermelho). Observado em 2026-11-08T21:16Z.

**Total de PRs abertas no início desta rodada: 34.**

## Resumo por veredito

| Veredito | Qtd | PRs |
|---|---|---|
| EM_ANDAMENTO (minhas, criadas nesta sessão para supersedir PRs com BEHIND/conflito/CI vermelho) | 7 | #266, #267, #268, #269, #270, #271, #272 |
| SUPERSEDIDA (PR de terceiro cujo conteúdo já está coberto por uma EM_ANDAMENTO) | 7 | #209, #213, #214, #215, #254, #257, #264 |
| AGUARDANDO_HUMANO | 16 | #131, #203, #204, #205, #206, #211, #212, #234, #235, #238, #243, #253, #255, #256, #263, #265 |
| BLOQUEADA (bun.lock em conflito; registro npm indisponível nesta sessão cloud) | 3 | #208, #210, #216 |
| NAO_INICIADA | 1 | #175 |

(7+7+16+3+1 = 34, bate com o total.)

## EM_ANDAMENTO (progresso ao vivo)

Todas são branches `claude/fix-pr<n>-...` criadas nesta sessão a partir da PR original + merge de `main`, para sair do estado BEHIND. Nenhuma tem check vermelho; todas aguardam a fila de Actions (CI serializado) esvaziar. Squash merge assim que `mergeStateStatus=CLEAN`.

- **#267** supersede #213 (dnd-kit): 23/26 checks SUCCESS.
- **#268** supersede #214 (eslint-config-prettier): 21/26 checks SUCCESS.
- **#269** supersede #215 (eslint-plugin-react-refresh): fila.
- **#270** supersede #254 (TS2345 gerar-pacote-evidencias): fila.
- **#271** supersede #257 (monitor-health review #240): fila.
- **#272** supersede #264 (docs/agentes): fila.
- **#266** supersede #209 (framer-motion 14.x): draft, corrigido erro de TS + formatação prettier (commit `cf4c10045f224dd995e9d2b3a9574913a707d0fd`), aguardando CI deste commit antes de converter para ready e atualizar com main.

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

- **#208** (radix-ui), **#210** (@sentry/react), **#216** (vitest 4→5) — `bun.lock` em conflito (DIRTY). Corrigir exige `bun install` para regenerar o lockfile, mas o registro npm está bloqueado nesta sessão cloud (`ProxyConnectFailed 403` no proxy de rede). NÃO VERIFICADO se um ambiente com acesso a npm resolveria — presumido pela mensagem de erro do proxy.

## NÃO INICIADA

- **#175** (recharts 2.15.4→3.10.1) — diff confirmado: recharts 3.x adiciona `@reduxjs/toolkit`, `react-redux`, `immer`, `redux`, `redux-thunk` como novas dependências transitivas e troca `victory-vendor` 36→37; API de eixos/legendas também mudou no v3 (breaking upstream conhecido). Precisa validar os componentes de gráfico do app manualmente antes de mergear — evidência levantada, mas migração em si não iniciada por falta de tempo nesta sessão (bloqueada pela fila de CI no momento).

## Prova de que nada foi afrouxado

Nenhum commit desta sessão tocou `.github/workflows/`, removeu/pulou teste, usou `.skip`/`.only`, `eslint-disable`, `@ts-ignore`/`any` para calar erro, ou ampliou baseline/allowlist. As correções em #266-#272 foram: merge de `main` na branch (resolve BEHIND), formatação prettier e fix de tipos do framer-motion (`type: 'spring' as const`, `ease: [...] as [number,number,number,number]`). Diffs mínimos, sem refatoração.

## Nenhuma PR alheia foi fechada, editada ou comentada

Todas as PRs de terceiros (dependabot: #175, #203-#216; e PRs de outras sessões: #131, #234, #235, #238, #243, #253, #255, #256, #263, #265) permanecem como estavam — apenas lidas via API.

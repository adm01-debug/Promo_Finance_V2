# Relatório — análise de PRs abertas (Promo_Finance_V2)

**Baseline main:** `c6eb99b275e1270cf99f1216e808c120f7cf58a2` — todos os checks concluídos em SUCCESS (único pendente: `E2E Destructive Logout`, em fila, não vermelho). Observado em 2026-11-08T21:16Z.

**Total de PRs abertas no início desta rodada: 34.**

**Atualizado em:** 2026-11-09T01:00Z (5 merges concluídos; 4 aguardando CI)

## Resumo por veredito

| Veredito | Qtd | PRs |
|---|---|---|
| MERGEADA (minhas, fecharam supersede) | 5 | #266, #267, #268, #270, #272 |
| EM_ANDAMENTO (minhas, aguardando CI) | 4 | #269, #271, #273, #278 |
| SUPERSEDIDA | 6 | #213, #214, #215, #254, #257, #264 |
| FECHADA EXTERNAMENTE | 1 | #209 |
| AGUARDANDO_HUMANO | 16 | #131, #203, #204, #205, #206, #211, #212, #234, #235, #238, #243, #253, #255, #256, #263, #265 |
| BLOQUEADA | 3 | #208, #210, #216 |
| NAO_INICIADA | 1 | #175 |

(5+4+6+1+16+3+1 = 36 — inclui #273 doc e #278 fix gap)

## MERGEADAS

- **#266** (supersede #209, fix framer-motion 14.x) → squash-merge em main, SHA `6a925600f36f44488dc07b79e063f3dd67e5d30b`.
  - **Gap pós-merge encontrado e corrigido:** `micro-interactions.tsx` → PR **#278**.
- **#268** (supersede #214, bump eslint-config-prettier 9→10) → SHA `d8804a2000192594419275bc94da6e44fbf6e211`. Auditoria: sem risco.
- **#267** (supersede #213, dnd-kit) → SHA `020bb81ebf87848ca653d1665f808e15db7bc863`.
- **#270** (supersede #254, TS2345 gerar-pacote-evidencias) → SHA `1f5138a767de996ea61ecfb5f852cc71e8f4624c`. Flake do Zod gate investigado e descartado.
- **#272** (supersede #264, docs/agentes) → SHA `d83f82e60c63aa2ed017aefdf4d864084f9c3c63`.

## EM_ANDAMENTO (progresso CI em 2026-11-09T01:00Z)

- **#271** (supersede #257, monitor-health review #240): **6/8 required SUCCESS** — Varredura (gitleaks), E2E Financeiro, E2E Critical, Integration tests passaram; Quality Gate in_progress; E2E Destructive aguardando Quality Gate. SHA `9a75360a9084739090c658b60f31de3de9c09030`.
- **#269** (supersede #215, eslint-plugin-react-refresh): 3/8 done; outros 5 jobs ainda na fila CI. SHA `6c84a433d379a6a061a9486e7c363f3dbcf2ea60`.
- **#273** (documentação analise-prs): 3/8 done; outros 5 jobs na fila. SHA `63c350e4c9fa5eda5fd8a5a4531ac4a989dc8f5a`.
- **#278** (fix gap micro-interactions.tsx spring const): 3/8 done; outros 5 jobs na fila. SHA `aec30ed22feefbb1fe49360207888dda8822a4b5`.

Causa do atraso: contenção de jobs concorrentes na conta inteira (45-50 runs simultâneos na fila). Nenhum check vermelho confirmado como causado pelas PRs.

## AGUARDANDO_HUMANO (não mergear — motivo, com evidência)

- **#131** — conflito aberto desde set/26, 90 arquivos, precisa decisão de escopo.
- **#203, #204, #205, #206** — bumps de `.github/workflows/*`. Regra 8: workflows.
- **#211** (zod 3→4) — major com breaking changes, migração de arquitetura.
- **#212** (react-dom/@types 18→19) — bump quebrado: react fica em 18 com react-dom 19, mismatch.
- **#234, #235, #238, #243** — migration SQL de produção. Regra 8: DDL.
- **#253** — verificação pós-deploy edge functions. Regra 8: já categorizada pelo autor.
- **#255** — toca `asaas-proxy/index.ts` (edge function de pagamento). Regra 8: R2.
- **#256** — provável duplicata obsoleta de #257/#271; decisão de fechar cabe ao dono.
- **#263** — altera `.github/workflows/ci.yml`. Regra 8.
- **#265** — adiciona `.github/workflows/inventario-estado.yml`. Regra 8.

## BLOQUEADAS (ambiente cloud sem npm)

- **#208, #210, #216** — `bun.lock` em conflito (DIRTY). Exige `bun install` mas registro npm bloqueado nesta sessão cloud (ProxyConnectFailed 403).

## NÃO INICIADA

- **#175** (recharts 2→3) — recharts 3.x adiciona 4 novas deps transitivas e tem breaking API changes; migração manual necessária.

## FECHADA EXTERNAMENTE

- **#209** — fechada por ação externa (auto-close do Dependabot após #266 mergear equivalente).

## Auditoria de validação pós-merge

5 agentes em paralelo (2026-11-08T23:00–23:55Z): 1 gap real encontrado e corrigido (#278), 4 vereditos sem gaps, compliance total (nenhum workflow tocado, nenhum padrão de afrouxamento).

## Prova de que nada foi afrouxado

Nenhum commit desta sessão tocou `.github/workflows/`, removeu/pulou teste, usou `.skip`/`.only`, `eslint-disable`, `@ts-ignore`/`any` para calar erro, ou ampliou baseline/allowlist.

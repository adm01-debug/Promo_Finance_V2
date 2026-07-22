# Relatório de Modularização (>400 linhas)

Status: **em andamento** — 2 de 40+ arquivos concluídos.

## Concluído ✅

### Fase 1 — Libs & Utils

| Arquivo original | LOC antes | LOC depois (barrel) | Submódulos | Teste regressão |
|---|---:|---:|---|---|
| `src/lib/transaction-matcher.ts` | 487 | 5 | `types`, `similarity`, `matcher`, `converters`, `stats`, `index` | ✅ `transaction-matcher.regression.test.ts` |
| `src/lib/sped-generator.ts` | 473 | 5 | `core`, `efd-ibs-cbs`, `efd-contribuicoes`, `io`, `index` | ✅ `sped-generator.regression.test.ts` |

**Validação por fase:** `bunx tsgo --noEmit` limpo; suíte Vitest afetada 100% verde (19/19).

## Pendente

### Fase 1 (restantes)
- `src/lib/brazilian-validators.ts` (468)
- `src/lib/sefaz-simulator.ts` (454)
- `src/lib/tributario/relatorio-pdf.ts` (518)
- `src/types/reforma-tributaria.ts` (605)

### Fase 2 — Hooks
- `useConciliacaoPage.ts` (476), `useDemonstrativosContabeis.ts` (471), `useContasPagarLogic.ts` (456), `useAsaas.ts` (413), `useReviewQueue.ts` (523)

### Fase 3 — Páginas (10)
### Fase 4 — Componentes Contábil/Fiscal (12)
### Fase 5 — Componentes Financeiros (7)
### Fase 6 — UI/Admin/Onboarding (7 + primitives em avaliação)

## Padrão adotado

1. Diretório homônimo `<name>/` com submódulos coesos por responsabilidade.
2. Arquivo original vira barrel `export * from './<name>/index'` — **zero breaking change**.
3. Teste `<name>.regression.test.ts` valida presença dos símbolos históricos.
4. Ao final de cada arquivo: `tsgo --noEmit` + Vitest afetado.

## Continuidade

Este trabalho será executado incrementalmente em turnos subsequentes seguindo a ordem fase 1→6 do plano aprovado.

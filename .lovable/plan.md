
Próximo lote de refatoração modular — 6 arquivos com mais de 400 linhas.

## Próximo lote

1. **`ContaReceberForm.tsx`** — extrair `ContaReceberDadosBasicos.tsx`, `ContaReceberPagamento.tsx` e `ContaReceberParcelamento.tsx`.
2. **`DashboardExecutivo.tsx`** — extrair `DashboardKPIsRow.tsx` e `DashboardChartsGrid.tsx` (se ainda >400).
3. **`useFluxoCaixa.ts`** — extrair `fluxo-caixa-projecoes.ts` e `fluxo-caixa-kpis.ts` em utilitários puros.
4. **`VendedorDashboard.tsx`** — extrair `VendedorKPIs.tsx` e `VendedorChartsGrid.tsx`.
5. **`expert-agent/index.ts`** (edge function) — extrair `system-prompt.ts` e `tool-definitions.ts`.
6. **`bitrix24/service.ts`** — extrair `bitrix-clients.ts`, `bitrix-deals.ts` e `bitrix-mapping.ts`.

## Abordagem

- Ler cada arquivo, identificar blocos coesos, extrair para `src/components/<dominio>/<arquivo>/` ou módulos auxiliares.
- Props mínimas, tipagem forte, comportamento preservado.
- Validar com `npx tsc --noEmit` ao final.

## Diagrama

```text
ArquivoOriginal (>400 linhas)
        │
        ├── extrai → seção/utilitário coeso
        ├── extrai → seção/utilitário coeso
        └── compõe sub-componentes
```

## Observações

- Não tocar em `src/integrations/supabase/client.ts` ou `types.ts`.
- Sem mudanças de comportamento, apenas reorganização estrutural.
- Após este lote, restarão ~26 arquivos acima de 400 linhas — continuarei nas próximas rodadas.

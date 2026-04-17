
Continuar a refatoração modular dos arquivos com mais de 400 linhas, próximo lote de 6 arquivos.

## Próximo lote

1. **`Usuarios.tsx`** — extrair `UsuariosKPIs.tsx`, `UsuariosFilters.tsx` e `UsuariosTableRow.tsx`.
2. **`ContasReceber.tsx`** — extrair `ContasReceberKPIs.tsx` e `ContasReceberFilters.tsx`.
3. **`DashboardExecutivo.tsx`** — extrair `DashboardKPIsRow.tsx` e `DashboardChartsGrid.tsx`.
4. **`RetencoesFonte.tsx`** — extrair `RetencoesKPIs.tsx` e `RetencoesTable.tsx`.
5. **`SplitPaymentPanel.tsx`** — extrair `SplitConfigForm.tsx` e `SplitDistribuicaoView.tsx`.
6. **`RelatoriosAgendados.tsx`** — extrair `AgendamentoForm.tsx` e `AgendamentosTable.tsx`.

## Abordagem

- Para cada arquivo: ler, identificar blocos coesos (KPIs, filtros, tabelas, forms), mover para `src/components/<dominio>/<arquivo>/` ou `src/pages/<rota>/`.
- Props mínimas, tipagem forte, preservar comportamento.
- Validar com `npx tsc --noEmit` ao final.

## Diagrama

```text
ArquivoOriginal.tsx (>400 linhas)
        │
        ├── extrai → KPIs/Filters (header)
        ├── extrai → Table/Form (conteúdo)
        └── compõe sub-componentes
```

## Observações

- Não tocar em `src/integrations/supabase/*`.
- Sem mudanças de comportamento, apenas reorganização estrutural.
- Após este lote, restarão ~32 arquivos acima de 400 linhas — continuarei automaticamente nas próximas rodadas.

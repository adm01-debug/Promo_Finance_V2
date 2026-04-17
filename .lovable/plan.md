
Próximo lote de refatoração modular — 6 arquivos com mais de 400 linhas.

## Próximo lote

1. **`PrevisaoInadimplencia.tsx`** — extrair `PrevisaoKPIs.tsx` e `PrevisaoTable.tsx`.
2. **`ContasPagarTableRow.tsx`** — extrair `ContaPagarRowActions.tsx` e `ContaPagarRowStatus.tsx`.
3. **`FornecedorForm.tsx`** — extrair `FornecedorDadosBasicos.tsx`, `FornecedorEnderecoBancario.tsx` e `FornecedorObservacoes.tsx`.
4. **`DashboardExecutivo.tsx`** — extrair `DashboardKPIsRow.tsx` e `DashboardChartsGrid.tsx`.
5. **`RelatoriosAgendados.tsx`** — extrair `AgendamentoForm.tsx` e `AgendamentosTable.tsx`.
6. **`ContasReceber.tsx`** — extrair `ContasReceberKPIs.tsx` e `ContasReceberFiltersPanel.tsx`.

## Abordagem

- Ler cada arquivo, identificar blocos coesos (KPIs, filtros, tabelas, forms), extrair para `src/components/<dominio>/<arquivo>/` ou `src/pages/<rota>/`.
- Props mínimas, tipagem forte, comportamento preservado.
- Validar com `npx tsc --noEmit` ao final.

## Diagrama

```text
ArquivoOriginal.tsx (>400 linhas)
        │
        ├── extrai → KPIs/Filters
        ├── extrai → Tabela/Form
        └── compõe sub-componentes
```

## Observações

- Não tocar em `src/integrations/supabase/*`.
- Sem mudanças de comportamento, apenas reorganização estrutural.
- Após este lote, restarão ~30 arquivos acima de 400 linhas — continuarei nas próximas rodadas.



## Finalizar refator: `ExpertHistory` + `advanced-filters` com `clearSlot`/`controller`

Fechar os 2 itens restantes do plano para atingir 100% de cobertura do sistema centralizado de filtros.

### 1) `ExpertHistory.tsx` / `ExpertHistoryPanel.tsx`

O controller `expertFiltersController` já está instanciado em `src/pages/Expert.tsx` e `searchQuery`/`dateFilter` já chegam via props. Falta substituir o botão "Limpar filtros" do empty-state pelo `<ClearFiltersButton>`:

- Adicionar prop `clearSlot?: ReactNode` em `ExpertHistoryProps` e `ExpertHistoryPanelProps`.
- Remover a prop `onClearFilters` (não é mais necessária — o slot encapsula a ação).
- No empty-state ("Nenhuma conversa encontrada com os filtros aplicados"), renderizar `{clearSlot}` no lugar do `<Button variant="link" onClick={onClearFilters}>Limpar filtros</Button>` atual.
- Em `Expert.tsx`, passar:
  ```tsx
  clearSlot={
    <ClearFiltersButton
      controller={expertFiltersController}
      entityLabel="histórico do expert"
      variant="ghost"
      size="sm"
      label="Limpar filtros"
      describeFilters={(v) => [
        { label: 'Busca', value: v.searchQuery, isActive: !!v.searchQuery },
        { label: 'Período', value: v.dateFilter, isActive: v.dateFilter !== 'all' },
      ]}
    />
  }
  ```

### 2) `src/components/ui/advanced-filters.tsx`

Adicionar suporte opcional ao controller centralizado, mantendo retrocompatibilidade com `ContasReceberFilters`/`ContasPagarFilters`:

- Nova prop opcional `controller?: ManagedFiltersController<AdvancedFilters>` em `AdvancedFiltersProps`.
- Quando `controller` está presente: o botão interno "Limpar tudo" passa a renderizar um `<ClearFiltersButton>` embutido (mesma estética `ghost`/`sm`, label "Limpar tudo") com `describeFilters` mapeando `dataVencimentoInicio`, `dataVencimentoFim`, `valorMinimo`, `valorMaximo`, `tipoCobranca`.
- Quando ausente: mantém `handleClearFilters` atual (`onFiltersChange({})`) — zero quebra para os consumidores não migrados.

### Detalhes técnicos

- **Sem mudança de UX**: posições, ícones e cópias permanecem; apenas o handler do botão muda quando há controller.
- **Tokens HSL** já vigentes nos componentes — nenhuma alteração de cor.
- **Tipagem**: importar `ManagedFiltersController` de `@/hooks/useManagedFilters` e `ReactNode` do React.
- **Build check**: rodar TS check mental nos 3 arquivos para garantir que removi a prop `onClearFilters` em todos os call-sites do `ExpertHistory`/`Panel` (atualmente apenas `Expert.tsx`).

### Arquivos editados

- `src/components/expert/ExpertHistory.tsx` — substituir prop `onClearFilters` por `clearSlot`.
- `src/components/expert/ExpertHistoryPanel.tsx` — mesma mudança (paridade de API).
- `src/pages/Expert.tsx` — passar `clearSlot={<ClearFiltersButton ... />}` para os dois componentes; remover passagem de `onClearFilters` se houver.
- `src/components/ui/advanced-filters.tsx` — adicionar prop opcional `controller` e renderizar `<ClearFiltersButton>` quando presente.

Resultado: **100% das telas com filtros** (Clientes, Fornecedores, AuditLogs, LancamentosTab, RazaoDiarioTab, AuditoriaIA, SSOJitEvents, DashboardReceber, Expert e qualquer consumidor futuro do `AdvancedFiltersPopover`) compartilham o mesmo fluxo de confirmação + undo + toast detalhado + persistência cross-device.


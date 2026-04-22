

## Aplicar `useManagedFilters` + `ClearFiltersButton` nas telas restantes

Continuação do refator centralizado de "Limpar filtros" — estendendo o controller a todas as telas com filtros locais ainda não migradas. Sem mudar UX visível: mesmos selects/inputs/layout, apenas trocando o estado e o botão de limpar.

### Telas a refatorar

| # | Arquivo | `entityType` | localStorageKey | Filtros gerenciados |
|---|---|---|---|---|
| 1 | `src/components/contabilidade/LancamentosTab.tsx` | `lancamentos-contabeis` | `app-lancamentos-filters` | `busca`, `preset`, `dataInicio`, `dataFim` |
| 2 | `src/components/contabilidade/RazaoDiarioTab.tsx` | `razao-diario` | `app-razao-diario-filters` | `modo`, `preset`, `dataInicio`, `dataFim`, `contaId`, `busca` |
| 3 | `src/pages/admin/AuditoriaIA.tsx` | `auditoria-ia` | `app-auditoria-ia-filters` | `userFilter`, `cnpjFilter`, `transacaoFilter`, `acaoFilter` |
| 4 | `src/pages/admin/SSOJitEvents.tsx` | `sso-jit-events` | `app-sso-jit-filters` | `dateRange`, `search`, `providerFilter`, `roleFilter`, `viaFilter`, `originFilter` |
| 5 | `src/pages/DashboardReceber.tsx` | `dashboard-receber` | `app-dashboard-receber-filters` | `empresaId`, `vendedorId`, `ramoAtividade`, `statusFilter`, `clienteId`, `periodo`, `dataInicio`, `dataFim` |
| 6 | `src/components/expert/ExpertHistory.tsx` + `ExpertHistoryPanel.tsx` | `expert-history` | `app-expert-history-filters` | `searchQuery`, `dateFilter` |
| 7 | `src/components/ui/advanced-filters.tsx` | (pass-through) | — | recebe `controller?` opcional para delegar `handleClearFilters` |

> **Observação**: `RelatoriosAgendados.tsx` não tem filtros (apenas dialog de criação) — foi falso positivo do plano original e fica fora do escopo.

### Padrão por tela

1. **Substituir os `useState` individuais** por um único `useManagedFilters<FilterShape>({ entityType, defaults, localStorageKey })`.
2. **Bridge bidirecional** via `useEffect` quando a tela usa hooks que esperam estado local (ex.: `useSSOJitEvents({ from, to })`): manter variáveis derivadas `const search = controller.values.search` + `setSearch = (v) => controller.setField('search', v)` para minimizar diff.
3. **Substituir o botão "Limpar filtros"** por:
   ```tsx
   <ClearFiltersButton
     controller={controller}
     entityLabel="<rótulo PT-BR>"
     describeFilters={(v) => [
       { label: 'Busca', value: v.search, isActive: !!v.search },
       { label: 'Status', value: v.statusFilter, isActive: v.statusFilter !== 'all' },
       // ...etc por tela
     ]}
   />
   ```
4. **Hidratação tardia**: respeitar `controller.isHydrated` antes de aplicar defaults destrutivos (ex.: `RazaoDiarioTab` recompõe intervalo "ano" — só rodar após hidratar para não sobrescrever filtros salvos).

### Detalhe especial — `advanced-filters.tsx`

Adicionar prop opcional `controller?: ManagedFiltersController<AdvancedFilters>` ao `AdvancedFiltersPopover`. Quando presente:
- O botão "Limpar tudo" interno passa a abrir o `ConfirmDialog` + toast com undo (via `ClearFiltersButton` embutido).
- Quando ausente, mantém comportamento atual (`onFiltersChange({})`) para retrocompatibilidade com `ContasReceberFilters` / `ContasPagarFilters` que ainda não foram migrados.

### `ExpertHistory` / `ExpertHistoryPanel`

Mover a posse do estado para o componente pai (página Expert), instanciar `useManagedFilters` lá e passar `searchQuery`/`dateFilter` + `setters` por props (compatível com a API atual). O botão "Limpar filtros" do empty-state passa a ser o `ClearFiltersButton` (variant `link`, label "Limpar filtros") via prop nova `clearSlot?: ReactNode`.

### Detalhes técnicos

- **Tokens HSL apenas** — nada de hex/cinza fora dos tokens.
- **Tipografia** `font-display` no título do `ConfirmDialog` (já vem do componente).
- **Performance**: o `useManagedFilters` já tem debounce de 500 ms; nenhuma mudança extra nas queries existentes (React Query reage normalmente à mudança de filtros).
- **Resiliência**: como o controller cai em localStorage → defaults se Supabase falhar, nenhuma tela quebra offline.
- **Type-safety**: declarar uma `interface` de filtros por tela (ex: `LancamentosFilters`, `SSOJitFilters`) e tipar o controller.

### Arquivos editados

- `src/components/contabilidade/LancamentosTab.tsx`
- `src/components/contabilidade/RazaoDiarioTab.tsx`
- `src/pages/admin/AuditoriaIA.tsx`
- `src/pages/admin/SSOJitEvents.tsx`
- `src/pages/DashboardReceber.tsx`
- `src/components/expert/ExpertHistory.tsx`
- `src/components/expert/ExpertHistoryPanel.tsx`
- `src/pages/Expert.tsx` (ou pai equivalente — instanciar o controller)
- `src/components/ui/advanced-filters.tsx`

Resultado: **100% das telas com filtros** passam a ter confirmação, undo, toast detalhado e persistência cross-device, com paridade visual e técnica ao padrão já implementado em Clientes/Fornecedores/AuditLogs.


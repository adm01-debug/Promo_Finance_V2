

## Plano — Personalização de colunas, ordenação e filtros salvos (Anomalias + Conciliação)

Hoje:
- A tabela `public.saved_filters` (já criada e com RLS por `user_id`) **nunca foi consumida** — `ConciliacaoFilters` mantém estado em memória e perde tudo ao recarregar.
- O painel de anomalias (`AnomaliasDetectadasPanel`) só tem filtro por `status` (single select) e mostra cards fixos sem controle de colunas/ordenação.
- A lista de transações de conciliação (`ConciliacaoTransactionList`) é card-based fixa, sem ordenação nem escolha de campos.

Este plano entrega 3 capacidades reutilizáveis em ambas as telas: **filtros salvos**, **ordenação configurável** e **seleção de colunas/campos visíveis**.

### Mudanças

**1. Hook genérico `useSavedFilters`** (`src/hooks/useSavedFilters.ts`)
- Wrappa a tabela `saved_filters` com React Query.
- API: `useSavedFilters<T>(entityType: string)` retorna:
  - `filters` (lista de presets do usuário para a entidade)
  - `defaultFilter` (o `is_default=true`, se houver)
  - `save({ name, payload, isDefault })` — upsert por `(user_id, entity_type, name)`
  - `update(id, patch)` / `remove(id)` / `setDefault(id)`
- O `payload` JSONB armazena tudo: `{ filters, sort: {key, dir}, columns: string[] }` — schema versionado com `v: 1` para migração futura.
- RLS por `user_id` já existe; nada novo no backend.

**2. Componente reutilizável `SavedFiltersBar`** (`src/components/shared/SavedFiltersBar.tsx`)
- Barra horizontal com:
  - Dropdown "Carregar preset" listando `filters` (estrela no padrão).
  - Botão **"Salvar como…"** abre `<Dialog>` com input de nome + checkbox "Definir como padrão".
  - Botão **"Salvar atual"** (visível quando um preset está carregado e foi modificado).
  - Botão lixeira para remover preset ativo.
- Recebe `entityType`, `currentState` (objeto serializável) e `onLoad(state)`.
- Detecta "modificado" por shallow-equal entre `currentState` e o preset carregado.

**3. Componente reutilizável `ColumnVisibilityMenu`** (`src/components/shared/ColumnVisibilityMenu.tsx`)
- DropdownMenu com checkbox por coluna disponível.
- Props: `columns: { key, label, locked? }[]`, `visible: string[]`, `onChange`.
- Colunas com `locked: true` (ex.: descrição, valor) não podem ser ocultadas.

**4. Hook `useTablePreferences`** (`src/hooks/useTablePreferences.ts`)
- Combina filtros + sort + colunas num único state controlado, com persistência local (localStorage por `entityType`) como fallback antes do usuário criar preset.
- Sincroniza com `defaultFilter` do `useSavedFilters` no mount: se existir default, aplica; senão usa localStorage; senão usa initial.

**5. Aplicação em **Anomalias** (`AnomaliasDetectadasPanel`)**
- entityType = `"anomalias_detectadas"`.
- Novos filtros (além de status que já existe):
  - **Severidade** (multi-check: critica/alta/media/baixa).
  - **Período** (`detectada_em` início/fim, date inputs).
  - **Tipo de anomalia** (multi-check com 5 tipos).
- **Ordenação** configurável: `detectada_em` (default desc), `severidade` (rank custom critica→baixa), `tipo_anomalia`.
- **Colunas/campos visíveis** (controla quais badges/blocos aparecem em cada card): `severidade` (locked), `tipo` (locked), `data`, `descricao` (locked), `observacoes`, `entidade_relacionada`, `acoes_inline`.
- `SavedFiltersBar` posicionada acima do select de status atual; o select vira parte do estado serializado.

**6. Aplicação em **Conciliação** (`ConciliacaoTransactionList` + `ConciliacaoFilters`)**
- entityType = `"conciliacao_transacoes"`.
- Estende `ConciliacaoFilterState` existente com:
  - `severidade` derivada da confiança IA (renomeação visual: "Severidade do match" mapeado para `confiancaIA`).
- **Ordenação** nova: `data` (default desc), `valor`, `confiancaIA`, `tipo`. Header com `SortableHeader` reaproveitado (`src/components/ui/sortable-header.tsx`, já existe).
- **Colunas visíveis** no card: `data`, `descricao` (locked), `valor` (locked), `tipo`, `confianca_badge`, `acoes` (locked).
- `SavedFiltersBar` adicionada na linha do header acima do search/filter atual.

### Detalhes técnicos

- **Sem mudança de schema**: `saved_filters` já existe com RLS, índices `(user_id, entity_type)` e trigger de `is_default` único.
- **Tipagem do payload**: `interface SavedFilterPayload<T> { v: 1; filters: T; sort?: { key: string; dir: 'asc'|'desc' }; columns?: string[] }` exportada de `useSavedFilters`.
- **Migração suave**: estado existente em `Conciliacao.tsx` continua funcionando; o `useTablePreferences` é opt-in e a forma do `filters` no payload é o próprio `ConciliacaoFilterState`.
- **Concorrência**: trigger `ensure_single_default_filter` já garante 1 default por (user, entity).
- **Performance**: índice parcial `idx_saved_filters_default WHERE is_default=true` já criado — query de bootstrap é `O(1)` por entidade.
- **Ordenação por severidade** (anomalias): aplicada client-side com map `{critica:0, alta:1, media:2, baixa:3}` (mesmo padrão do `AnomaliasReviewQueue`).
- **A11y**: `SavedFiltersBar` usa `<DropdownMenu>` shadcn (já a11y-compliant); `ColumnVisibilityMenu` com `role="menuitemcheckbox"`.

### Fora de escopo

- Compartilhar presets entre usuários da mesma empresa (RLS atual é por `user_id`).
- Drag-to-reorder de colunas (apenas show/hide).
- Filtros salvos em outras telas (contas a pagar/receber/movimentações) — esses ficam para um próximo passo, mas o hook é genérico e está pronto para ser plugado lá.
- Export do preset como JSON.


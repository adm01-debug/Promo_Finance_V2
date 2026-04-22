

## Sistema centralizado de "Limpar Filtros" com confirmação, undo, toast detalhado e persistência por conta

Hoje cada tela tem seu próprio `clearFilters` solto (12+ arquivos: `ClientesFiltersPanel`, `FornecedoresFiltersPanel`, `RelatoriosAgendados`, `LancamentosTab`, `RazaoDiarioTab`, `AuditLogs`, `AuditoriaIA`, `SSOJitEvents`, `DashboardReceber`, `ExpertHistory`, `ContasReceberFilters` via advanced-filters, etc.). Vou criar um **sistema único** que substitui todos esses pontos.

### 1) Backend — persistência por conta

**Migration nova** (a tabela `saved_filters` já existe e tem RPC `duplicate_saved_filter` + RLS). Adicionar uma tabela leve para o **filtro "ativo"** de cada usuário/entidade (separado dos presets nomeados):

```sql
create table public.user_active_filters (
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  payload jsonb not null default '{}'::jsonb,  -- { v:1, filters, sort?, search? }
  updated_at timestamptz not null default now(),
  primary key (user_id, entity_type)
);
alter table public.user_active_filters enable row level security;
create policy "own active filters select" on public.user_active_filters
  for select using (user_id = auth.uid());
create policy "own active filters upsert" on public.user_active_filters
  for insert with check (user_id = auth.uid());
create policy "own active filters update" on public.user_active_filters
  for update using (user_id = auth.uid());
create policy "own active filters delete" on public.user_active_filters
  for delete using (user_id = auth.uid());
create trigger trg_user_active_filters_uat
  before update on public.user_active_filters
  for each row execute function public.update_updated_at();
```

Resultado: o usuário mantém os filtros ao trocar de navegador/dispositivo (mesma conta).

### 2) Hook central `useManagedFilters`

Novo arquivo `src/hooks/useManagedFilters.ts` — single source of truth para filtros de qualquer tela:

```ts
useManagedFilters<T>({ entityType, defaults, localStorageKey? })
  → { values, setValues, setField, hasActive, activeCount,
      clearFilters,           // dispara fluxo confirmação+undo+toast
      restoreSnapshot, isHydrated }
```

Comportamento:
- **Hidratação em ordem de prioridade**: (a) `user_active_filters` no Supabase → (b) `localStorage[localStorageKey]` (fallback offline) → (c) `defaults`. Após hidratar, sincroniza ambos.
- **Persistência debounced** (500 ms) em **paralelo** no Supabase e no `localStorage` a cada mudança.
- **`clearFilters({ skipConfirm? })`**: tira snapshot atual (`values` + chaves locais relevantes), abre `ConfirmDialog`, e ao confirmar:
  1. Apaga `user_active_filters` row + remove chaves do `localStorage` (registra quais).
  2. Reseta para `defaults`.
  3. Mostra **toast com undo** (sonner, 6 s) listando o que foi limpo (ver §4).
  4. Se o usuário clicar "Desfazer", restaura snapshot exato (Supabase + localStorage + state).

### 3) Componente `<ClearFiltersButton>` reutilizável

Novo `src/components/filters/ClearFiltersButton.tsx`. Substitui os 12+ botões "Limpar" hoje espalhados:

```tsx
<ClearFiltersButton
  controller={managedFilters}
  entityLabel="clientes"
  describeFilters={(v) => [
    { label: 'Status', value: v.status, isActive: v.status !== 'all' },
    { label: 'Estado', value: v.estado, isActive: v.estado !== 'all' },
    { label: 'Busca', value: v.search, isActive: !!v.search },
    { label: 'Período', value: v.dateRange, isActive: !!v.dateRange },
  ]}
/>
```

O botão renderiza:
- Variante `ghost` + ícone `X` (mesma estética atual, design tokens do sistema).
- Disabled quando `!hasActive`.
- Ao clicar → chama `controller.clearFilters()`.

### 4) `ConfirmDialog` antes de limpar

Reutiliza `ConfirmDialog` existente (`src/components/ui/confirm-dialog.tsx`, `variant="warning"`):

> **Limpar filtros de {entityLabel}?**
> Você vai apagar **N filtro(s) ativo(s)**: Status, Estado, Busca, Período. Isso também removerá suas preferências salvas para esta tela na sua conta.
> [Cancelar] [Sim, limpar]

### 5) Toast detalhado com undo

Após confirmar, usar `toastWithUndo` (já existe em `src/lib/toast-with-undo.tsx`):

> **Filtros de {entityLabel} limpos**
> Removidos: **Canais** (3), **Busca** ("nfe 2024"), **Período** (01/01–31/03), **Sentimento** (positivo).
> Limpeza no dispositivo: `clientes-filters`, `clientes-sort`.
> _[Desfazer]_ (6 s)

Implementação: `describeFilters` retorna a lista; o toast monta título + descrição multilinha mostrando **chips dos filtros** removidos e **bullets das chaves** apagadas do localStorage. "Desfazer" chama `controller.restoreSnapshot(snapshot)` que regrava Supabase + localStorage + state.

### 6) Refatoração das telas (sem mudar UX visível)

Substituir o `clearFilters` solto + estado local por `useManagedFilters` nessas telas:

- `src/pages/clientes/ClientesFiltersPanel.tsx` (e a página pai que detém o estado)
- `src/components/fornecedores/FornecedoresFiltersPanel.tsx`
- `src/components/relatorios/RelatoriosAgendados.tsx`
- `src/components/contabilidade/LancamentosTab.tsx`
- `src/components/contabilidade/RazaoDiarioTab.tsx`
- `src/pages/AuditLogs.tsx`
- `src/pages/admin/AuditoriaIA.tsx`
- `src/pages/admin/SSOJitEvents.tsx`
- `src/pages/DashboardReceber.tsx`
- `src/components/expert/ExpertHistory.tsx` / `ExpertHistoryPanel.tsx`
- `src/components/ui/advanced-filters.tsx` (`handleClearFilters`) — passa a delegar ao controller quando recebido.

Cada refator: 1) trocar `useState` dos filtros pelo `useManagedFilters`; 2) substituir o `<Button>` "Limpar" pelo `<ClearFiltersButton>`; 3) declarar `entityType` único (`'clientes'`, `'fornecedores'`, `'relatorios-agendados'`, `'lancamentos-contabeis'`, `'razao-diario'`, `'audit-logs'`, `'auditoria-ia'`, `'sso-jit-events'`, `'dashboard-receber'`, `'expert-history'`, `'contas-receber'`).

### 7) Detalhes técnicos

- **Tokens HSL apenas** (`bg-warning/10`, `text-muted-foreground` etc.), tipografia `font-display` no título do dialog.
- **Animação framer-motion** sutil no toast (já vem do sonner) e `animate-fade-in` na lista de chips.
- **Performance**: hidratação em `useEffect` única; debounce com `useRef` + `setTimeout`; mutações Supabase via `useMutation` invisível (sem toast próprio).
- **Resiliência**: se o Supabase falhar, cai pro `localStorage`; se ambos falharem, usa `defaults` e loga via `logger`.
- **Tipagem**: `useManagedFilters<T extends Record<string, unknown>>` mantém type-safety.

### Arquivos

**Novos**
- `supabase/migrations/<ts>_user_active_filters.sql`
- `src/hooks/useManagedFilters.ts`
- `src/components/filters/ClearFiltersButton.tsx`

**Editados (refator do botão Limpar + estado)**
- `src/pages/clientes/Clientes.tsx` + `ClientesFiltersPanel.tsx`
- `src/pages/Fornecedores.tsx` (ou pai) + `FornecedoresFiltersPanel.tsx`
- `src/components/relatorios/RelatoriosAgendados.tsx`
- `src/components/contabilidade/LancamentosTab.tsx`
- `src/components/contabilidade/RazaoDiarioTab.tsx`
- `src/pages/AuditLogs.tsx`
- `src/pages/admin/AuditoriaIA.tsx`
- `src/pages/admin/SSOJitEvents.tsx`
- `src/pages/DashboardReceber.tsx`
- `src/components/expert/ExpertHistory.tsx`, `ExpertHistoryPanel.tsx`
- `src/components/ui/advanced-filters.tsx`

Resultado: **uma única implementação** governa confirmação, undo, toast detalhado e persistência cross-device para todos os filtros do sistema, mantendo a estética premium e os tokens HSL do design system.


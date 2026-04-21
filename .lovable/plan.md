

## Plano — Registrar `/contabilidade` e corrigir `SpedContabilTab`

Dois ajustes pequenos para finalizar o módulo de Contabilidade & SPED.

### 1. Corrigir erro de sintaxe em `SpedContabilTab.tsx`

A função `historicoTipo.map((row) => { ... return ( <TableRow/> ); })` está aberta com `{` mas fechada apenas com `))}`. Falta o `;})` depois do `</TableRow>`.

Correção (linhas 100–128): substituir o fechamento `))}` por `); })}` para encerrar corretamente o bloco `return (...)` e o arrow function `(row) => { ... }`.

### 2. Registrar rota `/contabilidade` em `src/App.tsx`

- Adicionar import lazy: `const Contabilidade = lazy(() => import('./pages/Contabilidade'));` junto aos demais lazy imports (próximo a `Demonstrativos`).
- Adicionar a rota dentro de `<Routes>` (próximo a `/demonstrativos`):
  ```tsx
  <Route
    path="/contabilidade"
    element={
      <ProtectedRoute requiredRoles={['admin', 'financeiro']}>
        <Contabilidade />
      </ProtectedRoute>
    }
  />
  ```

### 3. Validação do `ProtectedRoute`

`ProtectedRoute` já suporta `requiredRoles?: AppRole[]` e usa `hasRole()` do `useAuth`, que cobre `admin` e `financeiro`. Nenhuma alteração necessária no componente — basta passar o array correto na rota acima.

### Fora de escopo

- Item de menu lateral em `Sidebar` (deixar para entrega seguinte se ainda não existir).
- Cross-link de `ObrigacoesAcessorias` → `/contabilidade?tab=sped-ecd`.


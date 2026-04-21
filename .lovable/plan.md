

## Plano — Seletor de empresa no header + role por empresa atual no AuthContext

### Diagnóstico

1. **Header.tsx (linhas 81–162)** já tem um dropdown de empresa, mas:
   - Lê de `useEmpresas()` (lista global de todas as empresas do tenant) em vez de `useUserEmpresas()` (vínculos do usuário em `user_empresas`).
   - Usa `useState` local em `selectedEmpresaId` — a escolha não persiste, não dispara evento global e não é compartilhada com hooks (`getCurrentEmpresaId`/`setCurrentEmpresaId` em `useUserEmpresas.ts`).
   - Não mostra a role do vínculo nem badge de SSO.
2. Já existe `src/components/layout/EmpresaSwitcher.tsx` que faz exatamente isso (lê vínculos, persiste em `localStorage`, dispara `current-empresa-changed`), mas **não está montado em lugar nenhum**.
3. **AuthContext (`useAuth.tsx`)** lê `user_roles` (role global) e expõe `role`, `isAdmin`, `isFinanceiro`, `isOperacional` sem considerar a empresa atual. Quando o usuário tem vínculos com roles diferentes em empresas distintas (ex.: `admin` na A, `visualizador` na B), o gate de permissões e a UI mostram a role errada após trocar empresa.

### Mudanças

**1. `src/components/layout/Header.tsx`**
- Remover bloco do dropdown atual (linhas 81–162 relativas ao seletor + `useEmpresas`/`selectedEmpresaId`).
- Importar e renderizar `<EmpresaSwitcher />` na mesma posição. Remover import de `useEmpresas`, `Building2`, `ChevronDown` se não usados em outros pontos (manter o que ainda é referenciado).
- Substituir o badge de role no menu do usuário por uma derivação que prefere `roleAtual` (vinda do AuthContext atualizado) sobre `role` global, mantendo o mapeamento `roleLabels`.

**2. `src/components/layout/EmpresaSwitcher.tsx`** (pequenos ajustes)
- Sempre renderizar quando houver ≥1 vínculo (hoje só renderiza com >1) — usuário com 1 empresa precisa ver qual está ativa.
- Adicionar badge "SSO" quando `provisioned_via === 'sso' || 'scim'`.
- Após `setCurrentEmpresaId`, invalidar a query de permissões (já é disparado o evento; o AuthContext fará o refetch).

**3. `src/hooks/useAuth.tsx`** — role por empresa atual
- Adicionar estado `currentEmpresaId` inicializado com `getCurrentEmpresaId()` e `roleAtual: AppRole | null`.
- Listener para o evento `current-empresa-changed` (window) que atualiza `currentEmpresaId`.
- Nova função `fetchRoleForEmpresa(userId, empresaId)`:
  - SELECT `role` em `user_empresas` filtrando `user_id`, `empresa_id`, `ativo=true` → setar `roleAtual`.
  - Se `empresaId` for null, cair no fallback `user_roles` (comportamento atual).
- Disparar `fetchRoleForEmpresa` quando: usuário muda, evento `current-empresa-changed` chega, lista de vínculos muda (após SCIM/SSO).
- Expor no contexto: `currentEmpresaId`, `roleAtual`. **Manter `role` (global)** para retrocompatibilidade, mas redefinir os derivados `isAdmin`/`isFinanceiro`/`isOperacional`/`hasRole` para usarem `roleAtual ?? role`.
- Quando `signOut` ou troca de usuário, limpar `roleAtual` e `currentEmpresaId` do estado (sem apagar do localStorage para preservar última escolha).

**4. `src/hooks/usePermissions.ts`**
- Trocar dependência de `role` por `roleAtual ?? role` do `useAuth`, e incluir `currentEmpresaId` na queryKey/dependências de `fetchPermissions` para refetch automático ao trocar de empresa. Sem mudança de schema — `role_permissions` continua sendo a fonte.

### O que NÃO muda

- Schema do banco, RLS, tabelas `user_empresas`, `user_roles`, `role_permissions`.
- `EmpresaSelectionGate` (continua sendo o gate inicial após login).
- Edge functions SSO/SCIM.
- Contrato externo de `useAuth` para consumidores que só leem `role`/`isAdmin` (continuam funcionando, agora refletindo a empresa atual).

### Critério de pronto

1. Header mostra `EmpresaSwitcher` listando apenas vínculos de `user_empresas` ativos do usuário.
2. Trocar empresa no header persiste em `localStorage` e dispara `current-empresa-changed`.
3. `useAuth().roleAtual` muda automaticamente após a troca, e `isAdmin`/`isFinanceiro`/`isOperacional`/`hasRole` refletem a role da empresa selecionada.
4. `usePermissions` recalcula permissões e `PermissionGate` re-renderiza sem reload.
5. Usuário com 1 vínculo vê o switcher (apenas leitura), com badges de role e SSO/SCIM quando aplicável.
6. Sem regressão em `EmpresaSelectionGate`, `EmpresaSwitcher` standalone ou em telas que usam `usePermissions`.

### Arquivos

- ✏️ `src/components/layout/Header.tsx`
- ✏️ `src/components/layout/EmpresaSwitcher.tsx`
- ✏️ `src/hooks/useAuth.tsx`
- ✏️ `src/hooks/usePermissions.ts`


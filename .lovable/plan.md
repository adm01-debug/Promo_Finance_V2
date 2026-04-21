

## Plano — Tela dedicada de eventos JIT de provisionamento SSO

### Diagnóstico

Hoje os eventos JIT (`audit_logs.table_name = 'sso_jit_provisioning'`) ficam misturados em `/audit-logs`. Para investigá-los o admin precisa filtrar manualmente por tabela e ainda assim os campos importantes ficam escondidos no `new_data` JSON (`provider_id`, `provider_tipo`, `empresa_id`, `role`, `default_role`, `matched_group`, `groups_received`, `via`).

A trilha já é gravada de forma estruturada pelo `sso-callback`, então a tela é puramente leitura — sem mudanças de schema, RLS ou edge functions.

### Comportamento

Nova rota **`/admin/sso-jit-events`** (admin-only) com:

1. **KPIs do topo** (período selecionado): total de provisionamentos, OIDC vs SAML, top provider, top role aplicada, % com `matched_group` (provisionados via mapeamento de grupo) vs `default_role`.

2. **Filtros**:
   - Busca livre (casa em `user_email`, `details`, e dentro de `new_data` → `provider_nome`, `matched_group`, `groups_received`).
   - Provider (dropdown alimentado por `useSSOProviders`).
   - Role aplicada (admin / financeiro / operacional / visualizador / todos).
   - Via (oidc-jit / saml-broker-jit / todos).
   - Origem da role: "via grupo mapeado" / "default role" / todos.
   - Período (date range, default últimos 30 dias).

3. **Tabela** com colunas: Data/Hora, Usuário (email), Provider (nome + badge tipo OIDC/SAML), Role aplicada, Origem (`matched_group` em badge ou "default"), Grupos recebidos (chips truncados, tooltip com lista completa), Via, IP. Linha clicável abre Dialog com JSON completo do `new_data` + `details`.

4. **Exportação** CSV/PDF reutilizando `exportToCSV`/`exportToPDF` com colunas achatadas (provider_nome, role, matched_group, via, groups_received join `;`).

5. **Empty state** quando não houver eventos: mensagem explicando que JIT só dispara quando `auto_provision_users = true` no provider.

6. **Link cruzado**: botão "Ver no log completo" em cada linha leva a `/audit-logs?tableFilter=sso_jit_provisioning&search={email}`.

### Detalhes técnicos

**Arquivos novos**:

- ✏️ `src/pages/admin/SSOJitEvents.tsx` — página principal com `MainLayout`, replica o padrão visual de `AuditLogs.tsx` (mesmos componentes Card/Filter/Stats).
- ✏️ `src/components/audit/jit/SSOJitEventsTable.tsx` — tabela com badges de role/via/provider e Dialog de detalhes.
- ✏️ `src/components/audit/jit/SSOJitEventsKPIs.tsx` — 4 cards de KPI calculados via `useMemo`.
- ✏️ `src/hooks/useSSOJitEvents.ts` — `useQuery` que faz `supabase.from('audit_logs').select('*').eq('table_name','sso_jit_provisioning')` com filtros `.gte`/`.lte` em `created_at` e `.eq('user_email', …)` (provider, role, via aplicados client-side a partir do `new_data` JSONB, pois são chaves dentro do payload). Limit 1000.

**Arquivos editados**:

- ✏️ `src/App.tsx` — registrar `lazy(() => import('./pages/admin/SSOJitEvents'))` + `<Route path="/admin/sso-jit-events" …>` dentro de `<ProtectedRoute>`.
- ✏️ `src/components/layout/MainLayout.tsx` (ou onde está o menu admin) — adicionar entrada "Eventos JIT (SSO)" no grupo Admin/Segurança apontando para a nova rota. (Identificar local exato durante a implementação.)
- ✏️ `src/pages/AuditLogs.tsx` — adicionar atalho discreto no header: link "Ver eventos JIT" → `/admin/sso-jit-events` quando `tableFilter === 'sso_jit_provisioning'` ou sempre visível como `Button variant="link"`.

**Tipos**:

```ts
type JitNewData = {
  provider_id: string;
  provider_nome: string;
  provider_tipo: 'oidc' | 'saml';
  empresa_id: string | null;
  role: 'admin' | 'financeiro' | 'operacional' | 'visualizador';
  default_role: string;
  matched_group: string | null;
  groups_received: string[];
  via: 'oidc-jit' | 'saml-broker-jit';
};
```

**Sem migrações, sem mudanças no edge function** — toda a leitura usa o `audit_logs` já existente.

**RLS**: a tabela `audit_logs` já restringe leitura a admins via política existente; basta proteger a rota com `ProtectedRoute` + check de role admin (igual a `/admin/sso`).

### Critério de pronto

1. `/admin/sso-jit-events` acessível só para admin, lista todos os registros com `table_name = 'sso_jit_provisioning'` no período.
2. Filtros (provider, role, via, origem da role, busca, período) funcionam combinados.
3. KPIs refletem o conjunto filtrado.
4. Tabela mostra provider, role, origem (matched_group ou default) e grupos com clareza; Dialog exibe JSON completo.
5. Export CSV/PDF inclui as colunas achatadas.
6. Atalho a partir de `/audit-logs` leva à nova tela.
7. Link/menu de navegação adicionado para admins.
8. Sem regressões em `/audit-logs` nem no `sso-callback`.

### Arquivos

- ➕ `src/pages/admin/SSOJitEvents.tsx`
- ➕ `src/components/audit/jit/SSOJitEventsTable.tsx`
- ➕ `src/components/audit/jit/SSOJitEventsKPIs.tsx`
- ➕ `src/hooks/useSSOJitEvents.ts`
- ✏️ `src/App.tsx` (rota lazy)
- ✏️ `src/components/layout/MainLayout.tsx` (entrada de menu)
- ✏️ `src/pages/AuditLogs.tsx` (atalho)




## Plano — Revogação local reforçada no logout (cookies + storage do app)

### Diagnóstico

Hoje `signOut()` em `useAuth.tsx` faz:
1. Chama `sso-logout` (se SSO).
2. Broadcasta SLO para outras abas.
3. `supabase.auth.signOut()` — limpa o token Supabase em `localStorage`.
4. Reseta state local (user, session, profile, role).
5. Redireciona para `ssoLogoutUrl` se existir.

**Lacunas**:
- `localStorage` ainda contém artefatos do app: `current-empresa-id`, `sso-slo-toast-shown`, `sso-slo-done-shown`, filtros salvos, preferências de UI, caches do React Query persistidos, flags de onboarding, `ip-mask-preference`, etc.
- `sessionStorage` mantém estado de navegação/wizard.
- Cookies não-HttpOnly do app (se houver) permanecem.
- O `QueryClient` do TanStack mantém em memória todos os dados sensíveis já carregados (contas, clientes, lançamentos) — se o redirect SSO falhar ou a aba só voltar ao `/auth`, qualquer navegação rápida pode renderizar dados em cache antes do guard fechar a rota.
- IndexedDB (usado pelo SW Workbox para cache de respostas) pode reter respostas autenticadas.
- O `revokeSession` em `user_sessions` não é chamado no logout — a sessão fica marcada como ativa no banco.

A `useSessions().revokeSession` já existe e marca `revoked=true`. Falta integrar.

### Comportamento

1. Criar utilitário central `src/lib/auth-cleanup.ts` que executa em ordem:
   - **a. QueryClient.clear()** — limpa todo o cache em memória (impede flash de dados sensíveis na próxima rota).
   - **b. Limpar `localStorage`** com allowlist: preserva apenas chaves não-sensíveis explicitamente listadas (`theme`, `language`, `cookie-consent`, `ip-mask-preference`). Tudo o mais é removido — incluindo `current-empresa-id`, qualquer chave começando com `sb-` (token Supabase residual), `lovable-`, `react-query-`, `sso-slo-*`, filtros salvos, wizard state, etc.
   - **c. Limpar `sessionStorage`** completamente (`sessionStorage.clear()`).
   - **d. Limpar cookies não-HttpOnly do app** com `path=/` para o `document.domain` atual: itera `document.cookie.split(';')` e expira cada um com `Max-Age=0; path=/; domain=<host>` e variantes (sem domain, com `.domain`). Cookies HttpOnly do Supabase são geridos pelo `auth.signOut()`.
   - **e. Limpar caches do Service Worker** que possam ter respostas autenticadas: `caches.keys()` + `caches.delete()` para caches que casam com padrões de API (`/rest/v1/`, `/functions/v1/`, `api-cache-*`, `runtime-*`). Preserva caches estáticos (`precache-*`, `static-*`).
   - **f. Limpar IndexedDB de runtime**: `indexedDB.databases?.()` e deletar bancos cujo nome casa com padrões dinâmicos (`workbox-*`, `keyval-store`, `lovable-cache`). Try/catch envolvendo cada delete.
   - **g. Disparar evento global** `window.dispatchEvent(new Event('app-logout-cleanup'))` para que outros hooks (ex.: `useUserEmpresas`, listeners de empresa) resetem seu state in-memory.
   - Cada etapa em try/catch isolado — falha de uma não bloqueia as demais. Logs via `logger.warn`.

2. Atualizar `src/hooks/useAuth.tsx` `signOut()`:
   - Antes de `supabase.auth.signOut()`: tentar revogar a sessão ativa em `user_sessions` (best-effort) — chama nova mutation pequena inline, marcando `revoked=true, revoked_at=now()` para a sessão `is_current=true` do `user.id`.
   - Após `supabase.auth.signOut()` e antes do redirect: chamar `await runAuthCleanup(queryClient)`.
   - Se `ssoLogoutUrl` existir: `window.location.replace(ssoLogoutUrl)` (em vez de `href` — não deixa entrada no history que permitiria voltar).
   - Se não houver SSO logout URL: `window.location.replace('/auth')` para forçar bootstrap completo da aplicação (descarta tudo o que está em memória React).

3. Atualizar o handler de `subscribeSsoSlo` (outras abas que recebem broadcast):
   - Após `supabase.auth.signOut({ scope: 'local' })`, chamar também `runAuthCleanup(queryClient)`.
   - Continua o `window.location.replace('/auth?slo=ok&from=tab-sync')` — o full reload já garantiria reset, mas o cleanup elimina dados sensíveis durante a janela entre o handler e o reload.

4. Expor `queryClient` ao `useAuth`:
   - `useAuth.tsx` importa `useQueryClient` do `@tanstack/react-query` e captura no provider.
   - Passa para `runAuthCleanup` em ambos os caminhos (signOut próprio e listener de outra aba).

5. Garantir o redirect duro:
   - Substituir os atuais `window.location.href = ssoLogoutUrl` por `window.location.replace(...)` para eliminar a entrada do history; após o logout, "Voltar" do navegador não pode reentrar na rota protegida com state ainda em memória.
   - Quando não há SSO, hoje o código não redireciona explicitamente (deixa o `ProtectedRoute` reagir). Passar a forçar `window.location.replace('/auth')` para descarregar o bundle React e seu estado.

### Detalhes técnicos

- ➕ **`src/lib/auth-cleanup.ts`** (~80 linhas):
  - `export const PRESERVED_LOCAL_KEYS = new Set(['theme','language','cookie-consent','ip-mask-preference'])`
  - `export async function runAuthCleanup(queryClient?: QueryClient): Promise<void>` com as 7 etapas acima, cada uma em `try/catch` independente.
  - Helper interno `clearCookies()` que itera `document.cookie` e expira cada nome com 3 combinações de path/domain.
  - Helper interno `clearRuntimeCaches()` baseado em padrões regex (`/^(workbox-runtime|api-cache|runtime-)/i`).

- ✏️ **`src/hooks/useAuth.tsx`**:
  - Importar `useQueryClient` e `runAuthCleanup`.
  - No `AuthProvider`: `const queryClient = useQueryClient();`
  - Em `signOut`: best-effort `update user_sessions set revoked=true where user_id=user.id and is_current=true and revoked=false`; depois `auth.signOut()`; depois `await runAuthCleanup(queryClient)`; depois `window.location.replace(ssoLogoutUrl ?? '/auth')`.
  - No listener de `subscribeSsoSlo`: incluir `await runAuthCleanup(queryClient)` antes do `window.location.replace`.
  - Remover os `setUser(null)` etc. que precedem o redirect — são inúteis dado o full reload, mas mantidos comentados não — vamos simplesmente remover para evitar render intermediário.

- ✏️ **Sem mudança** em `sso-logout/index.ts`, `Auth.tsx`, `sso-sync.ts`, `useSessions.ts`. A revogação de sessão é inline para evitar dependência de hook (que exige React).

- O `QueryClient` é único (importado de `src/lib/queryClient.ts` e injetado no `App.tsx`); `useQueryClient` retorna a instância correta. Se algum cenário sem provider, o `runAuthCleanup` aceita undefined e pula a etapa.

### Critério de pronto

1. Após "Sair", `localStorage` contém apenas as chaves da allowlist; tudo o mais foi removido (verificável no DevTools).
2. `sessionStorage` está vazio.
3. Cookies não-HttpOnly do app foram expirados (verificável em Application → Cookies).
4. `caches.keys()` em runtime patterns retorna vazio para os padrões dinâmicos; caches estáticos do PWA permanecem.
5. Após o logout, "Voltar" do navegador (history) não restaura uma rota protegida com dados visíveis — abre `/auth`.
6. `user_sessions` da sessão atual fica com `revoked=true` no banco.
7. Em outras abas (broadcast SLO), o cleanup também roda antes do reload.
8. Sem regressão para usuários **não-SSO**: o cleanup roda igual, e o redirect final é `/auth`.
9. Falha em qualquer etapa do cleanup (ex.: `caches` indisponível em alguns browsers) não impede a conclusão do logout — apenas log de warning.

### Arquivos

- ➕ `src/lib/auth-cleanup.ts`
- ✏️ `src/hooks/useAuth.tsx`


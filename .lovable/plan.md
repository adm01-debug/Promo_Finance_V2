

## Plano — Logout SSO sincronizado entre abas com toast único

### Diagnóstico

Hoje `signOut()` em `useAuth.tsx` chama `sso-logout`, faz `supabase.auth.signOut()` localmente e, se houver `logout_url`, redireciona **somente a aba atual** para o IdP. Outras abas abertas:

- Continuam montadas em rotas autenticadas até o `onAuthStateChange` disparar localmente (o que acontece eventualmente porque `auth.signOut()` propaga a perda de token entre abas via `localStorage`, mas **com latência variável**).
- Cada aba que detecta o logout pode chamar `toast` próprio, gerando **múltiplos toasts** dispersos.
- Não há sinalização explícita de "este foi um SLO SSO" — abas perdem contexto e podem mostrar a mensagem genérica de "sessão expirada".

Falta um canal de sincronização explícito que: (1) avise todas as abas no instante zero do SLO, (2) faça-as navegarem para `/auth?slo=ok` (mesma rota usada pelo `post_logout_redirect_uri` em `sso-logout/index.ts`), (3) garanta um único toast visível no app inteiro.

### Comportamento

1. Quando o usuário clica em sair e há `ssoProviderId`, antes de chamar `auth.signOut()`, a aba **broadcasta** uma mensagem `{ type: 'sso-slo-initiated', providerNome, ts }` via `BroadcastChannel('sso-sync')`.
2. Todas as outras abas que estão escutando recebem a mensagem e:
   - Marcam um flag `sessionStorage['sso-slo-toast-shown'] = ts` para suprimir toasts duplicados que outras abas tentem mostrar;
   - Chamam `supabase.auth.signOut({ scope: 'local' })` (não revoga o token de novo — só limpa o storage local) e navegam para `/auth?slo=ok&from=tab-sync`.
3. A aba que iniciou o SLO mostra **um único** toast: `"Encerrando sessão SSO via {provider}…"` (sonner com id fixo `sso-slo` para deduplicação se a mesma aba renderizar duas vezes).
4. Em `/auth`, quando a query `slo=ok` está presente, mostrar um toast informativo único `"Sessão encerrada com segurança"` — também com id fixo `sso-slo-done`, e somente uma vez por carregamento (guard via `sessionStorage`).
5. Fallback robusto: se `BroadcastChannel` não existir (Safari antigo / contextos restritos), usa `window.addEventListener('storage', ...)` com uma chave-sentinela `localStorage.setItem('sso-slo-broadcast', JSON.stringify(payload))` + `removeItem` imediato. Funciona em todas as abas do mesmo origin.
6. "Fechar páginas abertas em outras abas": navegadores **não permitem** que uma aba chame `window.close()` em outra aba que ela não abriu (regra de segurança do browser). O comportamento equivalente — e que o usuário realmente quer — é que essas abas **saiam imediatamente da área autenticada** e mostrem a tela de login. Isso é o que o item 2 entrega. Documentar essa limitação como nota no PR.

### Detalhes técnicos

**Novo arquivo `src/lib/sso-sync.ts`** (~60 linhas):
- `export type SsoSyncMessage = { type: 'sso-slo-initiated'; providerNome: string; ts: number }`
- `export function broadcastSsoSlo(providerNome: string)`: tenta `BroadcastChannel('sso-sync').postMessage(payload)` com try/catch; em qualquer falha ou ausência da API, faz fallback para `localStorage.setItem('sso-slo-broadcast', JSON.stringify(payload)); localStorage.removeItem('sso-slo-broadcast')`.
- `export function subscribeSsoSlo(handler: (msg: SsoSyncMessage) => void): () => void`: registra listener no `BroadcastChannel` **e** no `window.storage` (para `key === 'sso-slo-broadcast' && newValue`); retorna função de cleanup que fecha o channel e remove o listener.
- Helper interno `getDedupKey(ts) = 'sso-slo-' + ts` para o flag de supressão.

**Edit `src/hooks/useAuth.tsx`**:
- Importar `broadcastSsoSlo, subscribeSsoSlo` do novo arquivo, `toast` do `sonner`.
- Em `signOut()`: se `ssoProviderId` presente e `sso-logout` retornar sucesso, chamar `broadcastSsoSlo(data.provider_nome ?? 'SSO')` **antes** de `supabase.auth.signOut()`. Mostrar `toast.loading('Encerrando sessão SSO via ' + nome + '…', { id: 'sso-slo' })`.
- Novo `useEffect` no `AuthProvider` que registra `subscribeSsoSlo` na montagem. Handler:
  - Se `sessionStorage.getItem('sso-slo-toast-shown') === String(msg.ts)` → ignora (já tratado).
  - Caso contrário: `sessionStorage.setItem('sso-slo-toast-shown', String(msg.ts))`, `toast.info('Sessão SSO encerrada em outra aba', { id: 'sso-slo' })`, chama `supabase.auth.signOut({ scope: 'local' }).catch(()=>{})`, e `window.location.replace('/auth?slo=ok&from=tab-sync')`.
  - Cleanup no return do `useEffect`.

**Edit `src/pages/Auth.tsx`** (presumido — vou confirmar o caminho na implementação; se for `src/pages/Auth.tsx` ou similar, adicionar lá):
- No mount, ler `URLSearchParams`. Se `slo === 'ok'` e `sessionStorage.getItem('sso-slo-done-shown') !== '1'`:
  - `sessionStorage.setItem('sso-slo-done-shown', '1')`
  - `toast.success('Sessão encerrada com segurança', { id: 'sso-slo-done' })`
- Limpar a flag depois de alguns segundos para permitir um novo logout futuro na mesma aba persistente: `setTimeout(() => sessionStorage.removeItem('sso-slo-done-shown'), 5000)`.

**Sem mudanças**: `supabase/functions/sso-logout/index.ts` continua igual — o `post_logout_redirect_uri` já aponta para `/auth?slo=ok`, então o usuário que volta do IdP ativa o mesmo handler.

### Critério de pronto

1. Com 2+ abas autenticadas, clicar em "Sair" em uma aba faz **todas** as outras saírem para `/auth?slo=ok&from=tab-sync` em <1s.
2. Aparece exatamente **um** toast por evento (loading na aba iniciadora, info nas outras, sucesso final em `/auth`) — sem duplicatas mesmo abrindo 5 abas.
3. Quando o IdP redireciona de volta com `?slo=ok`, o toast "Sessão encerrada com segurança" aparece uma única vez.
4. `BroadcastChannel` é o caminho preferencial; o fallback via `storage` event funciona quando o BC é simulado como ausente.
5. Sem regressão no logout de usuários **não-SSO** (broadcast só dispara quando há `ssoProviderId`).
6. Nenhum erro no console se uma aba escuta o canal antes de qualquer SLO ocorrer.

### Arquivos

- ➕ `src/lib/sso-sync.ts`
- ✏️ `src/hooks/useAuth.tsx` (broadcast no `signOut`, listener no `useEffect`)
- ✏️ `src/pages/Auth.tsx` (toast único ao chegar com `?slo=ok`)


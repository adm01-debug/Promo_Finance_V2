

## Plano — Cobertura de testes para `/auth/corporate`

### Diagnóstico

`src/pages/auth/CorporateOnboarding.tsx` orquestra todo o fluxo SSO corporativo (resolver de domínio → auto-redirect / escolha manual / fallback de senha → cancelamento → erro). Hoje não há **nenhum** teste cobrindo esse arquivo, apesar de:

- Ser o ponto de entrada principal de logins corporativos.
- Ter ramificações complexas (force-SSO, cancelamento, retry, fallback de senha).
- Recentemente ganhou auditoria via `useSsoOnboardingAudit` que precisa ser disparada nos pontos certos.

O projeto já tem Vitest + Testing Library configurados (`vitest.config.ts`, `src/test/setup.ts`, `src/test/test-utils.tsx`) e padrão estabelecido de mockar Supabase via `vi.mock('@/integrations/supabase/client', …)` (visto em 4 testes existentes).

### Escopo dos testes

Novo arquivo único: `src/pages/auth/__tests__/CorporateOnboarding.test.tsx`

**Mocks padronizados** (no topo do arquivo):

- `@/integrations/supabase/client` → expõe `supabase.from(...).select().eq().contains().order()` retornando providers controláveis por teste, e `supabase.functions.invoke('sso-initiate', …)` retornando `{ redirect_url, verifier, state }`. Também `supabase.rpc('log_sso_onboarding_event', …)` no-op com sucesso.
- `react-router-dom` → mock parcial: preserva tudo, substitui `useNavigate` por `vi.fn()` (capturado via `mockNavigate`).
- `sonner` → `toast.error/info` como `vi.fn()`.
- `window.location.href` → substituído por um setter espionado (descritor configurável) para validar redirect sem realmente navegar.
- `sessionStorage.setItem` (já mockado no setup global).

**Helpers**:

- `renderPage()` que monta `<CorporateOnboarding />` dentro do wrapper do projeto (`render` de `src/test/test-utils.tsx`).
- `setProviders(list)` para configurar o retorno do resolver no próximo render.
- `typeEmail(email)` que digita o e-mail e dá blur para acionar `submittedEmail`.

### Casos cobertos

1. **Estado inicial** — renderiza título "Acesso corporativo", input vazio, sem providers visíveis. Sem chamada a `functions.invoke`.

2. **Domínio sem match em `allowed_domains`** — `from(...).contains([domain])` resolve `[]`. Após digitar e-mail e submeter:
   - Aparece o alerta "Nenhum provedor SSO encontrado para …" com link "Continuar com senha".
   - Clicar no link chama `navigate('/auth?email=foo%40acme.com')`.
   - `supabase.rpc` foi chamado com `event_type='domain_resolved'` e `providers_count: 0`, e com `event_type='password_fallback_used'`.
   - Não houve `functions.invoke('sso-initiate', …)`.

3. **Domínio com match SEM `force_sso_for_domains`** (escolha manual):
   - Lista de providers aparece com botão "Entrar com {nome}".
   - Auto-redirect NÃO dispara (sem countdown, sem `invoke`).
   - Clicar no botão chama `invoke('sso-initiate', { provider_id, redirect_to })` e atribui `window.location.href` ao `redirect_url` retornado.
   - `sessionStorage.setItem` foi chamado com `pkce:<state>` e o `verifier`.
   - `rpc` registrou `manual_provider_selected` e `redirect_dispatched`.

4. **Domínio com `force_sso_for_domains` (auto-redirect)**:
   - Após o resolver, a tela "Redirecionando para …" aparece com botão "Cancelar redirecionamento".
   - Avançando timers fake (`vi.useFakeTimers()` + `act(() => vi.advanceTimersByTime(...))`) o countdown chega a 0 e `invoke('sso-initiate', …)` é chamado.
   - `window.location.href` recebe o `redirect_url`.
   - `rpc` registrou `auto_redirect_started` e `redirect_dispatched`.

5. **Cancelar auto-redirect durante countdown**:
   - Click em "Cancelar redirecionamento" antes do countdown zerar volta para a tela de escolha manual.
   - Aparece alerta "Redirecionamento automático cancelado…".
   - Lista de providers fica visível mesmo com `force_sso_for_domains` ativo.
   - Avançar o timer não dispara `invoke` (auto-redirect suprimido).
   - `rpc` registrou `auto_redirect_cancelled` com `phase: 'countdown'`.

6. **Falha em `sso-initiate` → tela de erro + retry + fallback**:
   - `invoke` resolve com `error: { message: 'IdP indisponível' }`.
   - Tela "Não foi possível iniciar o login SSO" aparece com a mensagem.
   - Botão "Tentar novamente" re-invoca `sso-initiate`.
   - Botão "Continuar com senha" navega para `/auth?email=…` e registra `password_fallback_used` com `after_error: true`.
   - `rpc` registrou `redirect_failed` com `success: false`.

### Detalhes técnicos

- **Timers**: `vi.useFakeTimers({ shouldAdvanceTime: true })` no `beforeEach` para controlar o debounce de 400 ms do `useSsoDomainResolver` e o countdown de 3 s. `vi.useRealTimers()` no `afterEach`.
- **`window.location`**: `Object.defineProperty(window, 'location', { value: { ...window.location, href: '', assign: vi.fn() }, writable: true, configurable: true })` no `beforeEach`, restaurado depois. Asserções via `expect(window.location.href).toBe(...)`.
- **Builder do mock supabase**: a chain `from('sso_providers').select(...).eq(...).contains(...).order(...)` precisa retornar `{ data, error: null }` no final. Padrão: cada método retorna `this` exceto `order` que retorna a Promise. Reset entre testes via `vi.clearAllMocks()` + setter `setProviders()`.
- **`logEvent` deduplicação**: o hook deduplica eventos idênticos por 1.5 s. Como cada teste usa um novo render + mocks limpos, isso não interfere; mas para asserções de "duas chamadas distintas" basta diferenciar o `event_type`.
- **Sem teste do `sso-callback`**: fora do escopo (essa tela não está em `/auth/corporate`).

### Critério de pronto

1. Arquivo `src/pages/auth/__tests__/CorporateOnboarding.test.tsx` existe e roda via `npm test -- CorporateOnboarding`.
2. Todos os 6 casos passam de forma determinística (sem `flaky` por timers ou promessas pendentes).
3. Cobertura local de `CorporateOnboarding.tsx` sobe acima de 80 % (ramos principais: sem providers, manual, auto-redirect, cancel, erro, fallback).
4. `npx tsc --noEmit` continua sem erros nos arquivos de teste novos.
5. Sem regressão nos demais testes (`npm test` completo verde).

### Arquivos

- 🆕 `src/pages/auth/__tests__/CorporateOnboarding.test.tsx`


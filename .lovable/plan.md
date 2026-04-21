

## Plano — Onboarding corporativo com auto-redirect SSO por domínio

Nova tela `/auth/corporate` (e hook reutilizável) que detecta o domínio do e-mail e, se houver um provedor SSO ativo com `force_sso_for_domains=true` ou marcação de auto-redirect, dispara `sso-initiate` automaticamente — sem o usuário precisar clicar em botão de senha ou de provider.

### Fluxo

```text
1. Usuário acessa /auth/corporate
2. Digita e-mail → blur/Enter
3. Frontend consulta sso_providers ativos
   onde allowed_domains contém o domínio
4. Se houver provider e (force_sso_for_domains=true OU auto_redirect=true):
     → mostra "Redirecionando para {provider.nome}..."
     → invoca sso-initiate
     → window.location = redirect_url
5. Senão, oferece escolha:
     - Botões SSO (se houver providers sem force)
     - "Continuar com senha" → vai para /auth com email pré-preenchido
6. Se nenhum provider casar, vai direto para /auth com email pré-preenchido
```

### Arquivos novos

- **`src/pages/auth/CorporateOnboarding.tsx`** — página standalone (sem layout), card centralizado, logo, campo de e-mail único, estado de loading "Redirecionando…", fallback gracioso.
- **`src/hooks/useSsoDomainResolver.ts`** — hook que recebe um e-mail (com debounce 400ms), retorna `{ providers, autoRedirectProvider, loading }`. Reaproveita a query já usada em `SsoLoginButtons`.
- **`src/components/auth/SsoAutoRedirectCard.tsx`** — sub-componente com 3 estados visuais: `idle` (form), `resolving` (skeleton), `redirecting` (spinner + nome do IdP).

### Arquivos editados

- **`src/App.tsx`** — registrar rota pública `/auth/corporate` (lazy-loaded, fora de `ProtectedRoute`).
- **`src/pages/Auth.tsx`** — aceitar query param `?email=` para pré-preencher campo (vindo do fallback do onboarding).
- **`src/components/auth/LoginForm.tsx`** — adicionar link discreto "Acesso corporativo (SSO)" abaixo do "Esqueci minha senha", apontando para `/auth/corporate`.

### Lógica de auto-redirect

Critério para disparar redirect automático (sem clique):

```ts
const auto = providers.find(p => 
  p.force_sso_for_domains === true
);
// se mais de um, escolhe o de menor `ordem`
```

Não vamos adicionar nova coluna no banco — `force_sso_for_domains` já existe em `sso_providers` e é exatamente a semântica desejada ("para este domínio, SSO é obrigatório"). Providers que aparecem no domínio mas sem `force` continuam exibidos como botões opcionais.

### UX / Acessibilidade

- Input com `autoFocus`, `inputMode="email"`, `autoComplete="username"`.
- Mensagem aria-live para o estado "Redirecionando para {provider}…".
- Botão "Cancelar redirecionamento" visível por 3s antes do `window.location` (evita armadilha se o usuário digitou e-mail errado).
- Suporte a Enter no campo de e-mail.
- Contraste AA, sem dependência de cor para sinalizar estado.

### Detalhes técnicos

- Debounce de 400ms na consulta para evitar flood ao digitar.
- Query usa `.contains('allowed_domains', [dominio])` + `.eq('ativo', true)` + `.order('ordem')` (mesmo padrão de `SsoLoginButtons`).
- PKCE verifier salvo em `sessionStorage[`pkce:${state}`]` (idêntico ao fluxo existente em `SsoLoginButtons.handleSSO`).
- `sso-initiate` é chamada com `redirect_to: window.location.origin` para que o callback retorne ao app.
- Domínios são normalizados para lowercase + trim antes da query.
- Se `sso-initiate` falhar, mostra toast e cai automaticamente no modo "escolha manual" (não trava o usuário).
- Página é renderizada sem `Sidebar`/`Header` (layout tipo `Auth.tsx`).

### Fora de escopo

- Memorizar último IdP usado por usuário (cookie/localStorage).
- Fluxo de "magic link" como fallback quando SSO falha.
- Whitelabel de logo do provider na tela de redirect (usa apenas `preset.logo` já existente em `IDP_PRESETS`).
- Discovery automático de IdP via `.well-known/openid-configuration` no domínio do e-mail.


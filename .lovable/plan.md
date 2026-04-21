

## Plano — Log de auditoria do onboarding corporativo SSO

### Diagnóstico

Hoje, em `src/pages/auth/CorporateOnboarding.tsx`, todo o fluxo SSO acontece sem registro persistente do que o usuário viu/escolheu:

- O domínio detectado (`useSsoDomainResolver`) e os providers retornados ficam apenas em memória.
- O auto-redirect, escolha manual, cancelamento, fallback de erro e "continuar com senha" não geram trilha de auditoria.
- Quando um usuário abre ticket de suporte ("não consigo entrar via SSO"), não há histórico do que ele tentou — apenas o `sso_login_attempts` da Edge Function `sso-initiate`, que só cobre tentativas que chegaram a invocar o backend.

A tabela `sso_login_attempts` já existe (vista em `useSSO.ts` e `sso-initiate/index.ts`) com `provider_id`, `email`, `success`, `error_code`, `error_message`, `ip_address`, `user_agent`, `duration_ms`, `created_at`. Falta um campo para classificar a etapa do onboarding e armazenar contexto (domínio, motivo, ação do usuário).

### Mudanças

#### 1. Banco — estender `sso_login_attempts` (migration)

Adicionar 2 colunas opcionais (não-quebra retrocompat):

- `event_type text` — enum lógico em texto: `domain_resolved`, `auto_redirect_started`, `auto_redirect_cancelled`, `manual_provider_selected`, `redirect_dispatched`, `redirect_failed`, `password_fallback_used`, `redirect_succeeded` (este último só registrado pós-callback — fora do escopo desta task; cobrir os 7 primeiros).
- `context jsonb` — `{ domain, provider_nome, provider_tipo, force_sso, providers_count, reason }` etc.

Índice `(email, created_at desc)` e `(event_type, created_at desc)` para suporte filtrar rapidamente.

RLS: já é admin-only para SELECT. Manter. Insert pelo cliente: criar política para permitir `authenticated` E `anon` inserirem **somente** linhas com `success=false` e `event_type` definido (eventos de telemetria não-sensíveis), OU expor uma RPC `log_sso_onboarding_event(email, event_type, context, provider_id)` `SECURITY DEFINER` que faz o insert sanitizado. **Preferir a RPC** — controle melhor, evita abuso de policy ampla.

#### 2. RPC — `log_sso_onboarding_event` (migration)

```sql
CREATE OR REPLACE FUNCTION public.log_sso_onboarding_event(
  _email text,
  _event_type text,
  _provider_id uuid DEFAULT NULL,
  _context jsonb DEFAULT '{}'::jsonb,
  _success boolean DEFAULT true,
  _error_code text DEFAULT NULL,
  _error_message text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  -- Validar event_type contra lista permitida
  IF _event_type NOT IN (
    'domain_resolved','auto_redirect_started','auto_redirect_cancelled',
    'manual_provider_selected','redirect_dispatched','redirect_failed',
    'password_fallback_used'
  ) THEN
    RAISE EXCEPTION 'event_type inválido: %', _event_type;
  END IF;

  INSERT INTO public.sso_login_attempts(
    provider_id, email, success, error_code, error_message,
    event_type, context
  ) VALUES (
    _provider_id, lower(trim(_email)), _success, _error_code, _error_message,
    _event_type, COALESCE(_context, '{}'::jsonb)
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_sso_onboarding_event TO anon, authenticated;
```

#### 3. Frontend — hook `useSsoOnboardingAudit`

Novo arquivo `src/hooks/useSsoOnboardingAudit.ts`:

- Função `logEvent({ eventType, email, providerId?, context?, success?, errorCode?, errorMessage? })` que chama `supabase.rpc('log_sso_onboarding_event', …)`.
- Fire-and-forget (não bloqueia UX). Falhas só vão para `logger.warn` — nunca quebram o fluxo de login.
- Sem React Query (é write-only telemetria) — função simples + `useCallback`.

#### 4. Instrumentação em `CorporateOnboarding.tsx`

Adicionar chamadas em pontos-chave (todos via hook, não-bloqueantes):

| Momento | event_type | context |
|---|---|---|
| `useSsoDomainResolver` resolve um domínio com providers | `domain_resolved` | `{ domain, providers_count, force_sso, autoRedirectProvider?: nome }` |
| `useEffect` de auto-redirect dispara `triggerSso` | `auto_redirect_started` | `{ domain, provider_nome, provider_tipo, countdown_skipped? }` |
| `handleCancelRedirect` invocado | `auto_redirect_cancelled` | `{ domain, provider_nome, phase: 'countdown'|'connecting' }` |
| `handleManualSso` (escolha manual) | `manual_provider_selected` | `{ domain, provider_nome, provider_tipo }` |
| `triggerSso` antes do `window.location.href` (sucesso) | `redirect_dispatched` | `{ domain, provider_nome, provider_tipo }` |
| `triggerSso` falha (catch) | `redirect_failed` (`success=false`) | `{ domain, provider_nome }` + `error_message` |
| `handleUsePassword` | `password_fallback_used` | `{ domain, provider_nome?, after_error: boolean }` |

Email sempre é o `submittedEmail` corrente. `provider_id` quando disponível.

#### 5. Visualização (opcional, fora do escopo principal)

A trilha já fica visível em `/admin/sso` via `useSSOLoginAttempts` (definido em `useSSO.ts`). Estender o componente que renderiza esses attempts para mostrar `event_type` e `context` resumido em um popover/accordion — pequeno ajuste de UI no painel admin SSO existente. **Marcar como follow-up se a tela atual não for trivial de localizar** — o valor primário é ter o dado persistido.

### O que NÃO muda

- `sso-initiate`, `sso-callback`, `useSsoDomainResolver`, lógica de auto-redirect/cancelamento/fallback.
- Schema das demais tabelas auth/SSO.
- Não envia eventos para serviço externo — tudo fica no banco.

### Critério de pronto

1. Migration aplicada: `sso_login_attempts` ganha `event_type` e `context`; RPC `log_sso_onboarding_event` existe e é executável por `anon`/`authenticated`.
2. Ao digitar e-mail em domínio com SSO, aparece linha `domain_resolved` em `sso_login_attempts`.
3. Auto-redirect, cancelamento, escolha manual, fallback de senha e erro SSO geram suas respectivas linhas com `event_type` correto e `context` populado.
4. Nenhum evento bloqueia ou atrasa o fluxo (falhas no RPC são silenciadas com `logger.warn`).
5. Admin consegue rodar `SELECT email, event_type, context, created_at FROM sso_login_attempts WHERE email='x@y.com' ORDER BY created_at DESC` para reconstruir a sessão de onboarding de um usuário.
6. Sem regressão visual ou comportamental no `CorporateOnboarding`.

### Arquivos

- 🆕 Migration SQL (colunas + RPC + índices)
- 🆕 `src/hooks/useSsoOnboardingAudit.ts`
- ✏️ `src/pages/auth/CorporateOnboarding.tsx`


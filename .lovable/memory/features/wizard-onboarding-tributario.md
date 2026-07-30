---
name: Wizard de Onboarding Tributário
description: Fluxo de 4 passos (CNPJ → Empresa → Decisão → Convidar Contador) com persistência de rascunho, animações framer-motion, confetti e edge functions convidar-contador/validar-token-contador
type: feature
---

# Wizard de Onboarding Tributário (P4)

## Steps
1. **Identificação** — input CNPJ + `useCnpjaLookup` (cache P3, mostra "Dados em cache")
2. **Dados da empresa** — preview CNPJá + selecionar/criar empresa
3. **Decisão tributária** — atalho para `/tributario/recomendacao` (motor `decidir-regime`)
4. **Convidar contador** *(opcional)* — formulário e-mail/nome → edge `convidar-contador`

## Persistência
- Rascunho salvo em `localStorage` na chave `tributario:onboarding:draft` (CNPJ digitado, empresa selecionada, etapa atual).
- Limpo ao concluir o wizard.

## UX
- `framer-motion` para transições entre steps.
- `canvas-confetti` ao concluir (Step 4).
- Validação inline com `zod`.

## Edge Functions
- `convidar-contador` (verify_jwt em código): gera token aleatório (32B URL-safe) → assina JWT HS256 com `{empresa_id, role:'contador_readonly', exp:30d}` → grava `sha256(rawToken)` em `convites_contador.token_hash` → envia e-mail via Resend gateway. Resposta: `{convite_id, link, email_sent}`.
- `validar-token-contador` (público, `verify_jwt = false` em config.toml): verifica JWT, busca por `token_hash`, marca `accepted_at` na primeira visita, retorna dados read-only da empresa.

## Tabela `convites_contador`
- Campos: `empresa_id`, `email`, `nome`, `token_hash` (UNIQUE), `expires_at`, `accepted_at`, `revoked_at`, `created_by`.
- RLS: SELECT/INSERT/UPDATE só pelo `created_by` ou admin; service role grava aceite.
- **Importante**: o token bruto NUNCA é armazenado — apenas o SHA-256.

## Rota pública
- `/contador/:token` → `src/pages/ContadorReadonly.tsx` (sem `ProtectedRoute`).

## Observabilidade
- Todos os logs vão para `edge_function_logs` via `createLogger` (P2): `fn_start`, `fn_success`, `fn_failure`, `email_sent`, `email_send_failed`, `jwt_invalid`.

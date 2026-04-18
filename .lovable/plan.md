
P3 ✅ entregue. Próximo: **Lote P4 — Wizard de onboarding com UX premium**.

## Lote P4 — Wizard Premium de Onboarding Tributário

### 1. Refatorar `OnboardingTributario.tsx`
- Trocar layout linear atual pelo componente `src/components/ui/wizard.tsx` (já existe, subutilizado).
- 4 steps com validação por etapa, barra de progresso, animações `framer-motion` e mobile-first.
- Steps:
  1. **Identificação** — input CNPJ + busca (`useCnpjaLookup`); mostra card "Dados em cache desde X" quando `cached=true` (P3).
  2. **Dados da empresa** — preview do retorno CNPJá (razão, CNAE, porte, situação) + seleção/criação da empresa.
  3. **Decisão tributária** — chama `decidir-regime`, exibe regime recomendado, economia projetada e comparativo.
  4. **Convidar contador** *(novo)* — formulário (e-mail + nome) que dispara edge function `convidar-contador` enviando link read-only via Resend.

### 2. Edge Function nova `convidar-contador`
- Valida JWT manual, valida e-mail (Zod), gera token assinado (HS256, expira em 30 dias) com `{empresa_id, role: 'contador_readonly'}`.
- Persiste convite em `convites_contador` (id, empresa_id, email, token_hash, expires_at, created_by, accepted_at).
- Envia e-mail via Resend com link `${origin}/contador/{token}`.
- Logger estruturado P2 (`fn_start`, `fn_success`, `fn_failure`, `email_sent`).

### 3. Migration
- Tabela `convites_contador` com RLS: usuário cria/lê próprios convites; admin vê todos; service role grava aceite.
- Sem alteração em tabelas existentes.

### 4. Página `/contador/:token` (read-only)
- Rota pública que resolve o token via edge `validar-token-contador` e exibe dashboard mínimo (regime atual, próximos vencimentos, economia projetada). Sem mutações.

### 5. UX premium
- `framer-motion` em transições de step.
- Validação inline com `react-hook-form` + `zod` por step.
- Persistência de rascunho em `localStorage` (chave `tributario:onboarding:draft`).
- Confetti (`canvas-confetti`) ao concluir o wizard.

### 6. Validação
- `npx tsc --noEmit` zero erros.
- Migration limpa.
- Deploy edges sem erro.
- Memória: salvar padrão em `mem://features/wizard-onboarding-tributario`.

## Diagrama

```text
   /tributario/onboarding (Wizard)
       │
       ├─ Step 1: CNPJ → cnpja-lookup (cache P3)
       ├─ Step 2: Preview empresa
       ├─ Step 3: decidir-regime → recomendação
       └─ Step 4: Convidar contador
                       │
                       ▼
                convidar-contador (edge + Resend)
                       │
                       ▼
                convites_contador (token_hash, expires_at)
                       │
                       ▼
                /contador/:token (read-only dashboard)
```

## Observações
- Secret `RESEND_API_KEY` já configurado (usado em outros fluxos).
- Próximos: P5 (dashboard v2), P6 (relatório anual).

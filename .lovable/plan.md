
Lote 15 entregue (PDF + Bitrix24). Último lote do roadmap: **Lote 16 — CNPJá Onboarding + Encerramento 10/10**.

## Lote 16 — Onboarding CNPJá + Pré-cadastro Automático

### 1. Edge Function `cnpja-lookup`
- `supabase/functions/cnpja-lookup/index.ts` com validação JWT manual.
- Recebe `{ cnpj }`, valida formato (14 dígitos), chama `https://api.cnpja.com/office/{cnpj}` com header `Authorization: ${CNPJA_API_KEY}`.
- Retorna razão social, nome fantasia, regime tributário atual, CNAE principal, atividades secundárias, endereço, capital social, situação cadastral.
- Resiliência: retry exponencial (429/500), timeout 10s, cache em memória 1h.
- CORS completo + try/catch top-level.

### 2. Hook `useCnpjaLookup`
- `src/hooks/useCnpjaLookup.ts`: `useMutation` chamando `supabase.functions.invoke('cnpja-lookup')`.
- Toast de sucesso/erro, loading state.

### 3. UI — Wizard de onboarding tributário (`/tributario/onboarding`)
- Página `OnboardingTributario.tsx` com 3 steps:
  1. **Buscar CNPJ**: input com máscara, botão "Buscar dados", preview dos dados retornados.
  2. **Confirmar empresa**: seleciona empresa existente OU cria nova com dados pré-preenchidos (razão social, CNPJ, regime atual, CNAE).
  3. **Importar histórico**: upload CSV faturamento/folha (reaproveita `csv-importer.ts`) ou pula.
- Final: botão "Ir para Recomendação" → `/tributario/recomendacao`.

### 4. Encerramento 10/10
- Atualizar `.lovable/plan.md` marcando todos 16 lotes como ✅.
- Documento final `.lovable/roadmap-final.md` com resumo executivo: 16 lotes entregues, ~30h de trabalho, 100% do roadmap original.
- Rota `/tributario/onboarding` registrada em `App.tsx`.

### 5. Validação
- `npx tsc --noEmit` zero erros.
- `supabase/config.toml`: `verify_jwt = false` para `cnpja-lookup`.
- Solicitar `CNPJA_API_KEY` via `add_secret` antes de implementar (único secret faltante).

## Diagrama

```text
   Lote 15 ✅ (PDF + Bitrix24)
            │
            ▼
   ┌──────────────────────────┐
   │ Secret CNPJA_API_KEY     │ ← add_secret
   └──────────────────────────┘
            │
   ┌──────────────────────────┐
   │ Edge: cnpja-lookup       │──┐
   └──────────────────────────┘  ▼
   ┌──────────────────────────┐  ┌────────────────────┐
   │ /tributario/onboarding   │  │ ROADMAP 100% ✅    │
   │ (Wizard 3 steps)         │─▶│ Sistema 10/10      │
   └──────────────────────────┘  └────────────────────┘
```

## Observações
- Único secret faltante: `CNPJA_API_KEY` (CNPJá Plus, https://cnpja.com).
- Sem migrations.
- Após este lote: roadmap fechado, sistema entra em modo manutenção.

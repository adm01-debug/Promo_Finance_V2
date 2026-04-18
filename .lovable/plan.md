
Lote 13 fechado (gráficos de evolução). Restam 3 lotes do roadmap. Próximo: **Lote 14 — Edge Function `decidir-regime` (FASE 3 final)**.

## Lote 14 — Edge Function `decidir-regime` + Reforma Tributária + PF Vinculada

### 1. Edge Function `decidir-regime` (orquestradora server-side)
- `supabase/functions/decidir-regime/index.ts` com `verify_jwt = true` (padrão).
- Recebe `{ empresaId, anoReferencia, mesReferencia, parametrosOverride? }`, valida JWT manual, lê `faturamento_mensal` + `folha_pagamento` via service role, executa `decidirRegime()` (importado de `_shared/tributario.ts` — copy-paste de `src/lib/tributario`), persiste em `regimes_simulados` e retorna resultado completo.
- CORS sempre, try/catch top-level com 500 + structured logging.
- Hook `useDecidirRegimeServer` para chamar via `supabase.functions.invoke` (alternativa server-side ao cálculo client-side).

### 2. Módulo Reforma Tributária (`/tributario/reforma`)
- Página `ReformaTributaria.tsx` projetando CBS+IBS sobre faturamento real:
  - Cronograma de transição EC 132/2023 + LC 214/2025: 2026 (teste 0,9%+0,1%), 2027 (CBS plena, extinção PIS/COFINS), 2029-2032 (IBS gradual), 2033 (IBS pleno, fim ICMS/ISS).
  - Comparativo "Hoje vs. 2033" com economia/aumento estimado.
  - Tokens semânticos `--cbs` e `--ibs` já existentes.
  - Tabela de alíquotas projetadas + gráfico de barras empilhadas.

### 3. Módulo PF Vinculada — Lei 15.270/2025 (`/tributario/pf-vinculada`)
- Página `PfVinculada.tsx` calculando IRPFM (Imposto de Renda PF Mínimo):
  - Input: dividendos mensais distribuídos ao sócio.
  - Aplica 10% sobre parcela > R$ 50.000/mês (Lei 15.270/2025).
  - Compara cenário "distribuição via PJ" vs. "pró-labore + PF" para otimização.
  - Alerta se sócio cair na faixa de IRPFM.

### 4. Rotas + Validação
- Registrar `/tributario/reforma` e `/tributario/pf-vinculada` em `App.tsx` (lazy-loaded).
- `npx tsc --noEmit` zero erros.
- Edge function deploy automático.

## Diagrama

```text
   Lote 13 ✅ (CRUD + CSV + gráficos)
            │
            ▼
   ┌────────────────────────────┐
   │ Edge Function              │──┐
   │ decidir-regime (server)    │  │
   └────────────────────────────┘  │
   ┌────────────────────────────┐  ▼
   │ /tributario/reforma        │  ┌────────────────────┐
   │ (CBS+IBS 2026-2033)        │─▶│ Roadmap FASE 3+4   │
   └────────────────────────────┘  │  fechado           │
   ┌────────────────────────────┐  └────────────────────┘
   │ /tributario/pf-vinculada   │  ▲
   │ (Lei 15.270/2025 IRPFM)    │──┘
   └────────────────────────────┘
```

## Observações
- Sem migrations (reaproveita `regimes_simulados`).
- Edge Function copia `src/lib/tributario` para `_shared/` (padrão de projetos independentes).
- Tokens `--cbs` e `--ibs` já existem (`mem://design/extended-semantic-tokens`).
- Restam após este lote: Lote 15 (PDF + Bitrix24) e Lote 16 (CNPJá onboarding).

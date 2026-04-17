
## Análise dos documentos enviados

O documento descreve um **Motor Tributário completo em 20 etapas** focado em decisão de regime tributário (Simples/Presumido/Real), elisão fiscal, Reforma Tributária 2026-2033 e PF vinculada (Lei 15.270/2025). O módulo atual já cobre boa parte de Reforma Tributária, mas falta o coração: **simulação comparativa dos 3 regimes com motor de cálculo real**, **árvore de decisão** e **detecção de elisão**.

### Gap analysis (atual vs. roadmap Claude)

| Roadmap | Status atual | Gap |
|---|---|---|
| Simulador 3 regimes (Simples/Presumido/Real) | `useComparativoRegimes` existe mas simplificado | Falta motor real com 5 anexos, 6 faixas, Fator R, LC 224/2025, créditos PIS/COFINS |
| RBT12 + Fator R | Não implementado | Crítico para Simples Nacional |
| Decisão automática de regime | Parcial | Falta árvore com elegibilidade + ranking |
| Faturamento mensal histórico | Não existe tabela | Necessário para RBT12 |
| Folha de pagamento (Fator R) | Não existe tabela | Necessário Anexo III vs V |
| 9 estratégias de elisão | Não implementado | MS LC224, JCP, Reintegra, Holding, etc. |
| Alertas tributários inteligentes | Tabela existe, lógica fraca | Falta cron de geração automática |
| PF vinculada (Lei 15.270/2025) | Não implementado | IRPFM sobre dividendos |

## Lote 1 — Fundação do Motor (executar agora)

Foco em destravar a base. Etapas pequenas, testáveis, sem quebrar nada do que já existe.

### 1. Migration: tabelas fundamentais do motor
- `faturamento_mensal` (empresa_id, ano, mes, receita_bruta, receita_servicos, receita_revenda, receita_industria, receita_exportacao)
- `folha_pagamento` (empresa_id, ano, mes, salarios, pro_labore, encargos, total_folha)
- `regimes_simulados` (empresa_id, data_simulacao, regime_recomendado, cenarios jsonb, alertas jsonb, justificativa)
- `oportunidades_elisao` (empresa_id, estrategia, aplicavel, economia_estimada, base_legal, risco, observacoes)
- RLS por `empresa_id` + `has_any_role`.

### 2. Biblioteca de cálculo pura (`src/lib/tributario/`)
- `rbt12.ts` — Receita Bruta dos últimos 12 meses (com regra <13 meses CGSN 140/2018 art.21).
- `fator-r.ts` — (Folha 12m / RBT12) ≥ 0.28 → Anexo III, senão Anexo V.
- `aliquotas-simples.ts` — 5 anexos × 6 faixas com PD (parcela a deduzir).
- `simular-simples.ts` — DAS efetivo = ((RBT12 × aliq) − PD) / RBT12.
- `simular-presumido.ts` — IRPJ/CSLL por presunção + PIS/COFINS cumulativo + ICMS/ISS.
- `simular-real.ts` — Lucro real + PIS/COFINS não-cumulativo (Tema 779) + ICMS.
- `decidir-regime.ts` — orquestrador: roda os 3, filtra elegibilidade, ranqueia por carga total.
- Testes unitários em `__tests__/`.

### 3. Hook + página de Simulação Comparativa
- `useSimulacaoRegimes(empresaId)` — busca faturamento+folha, chama motor, retorna 3 cenários.
- `src/pages/tributario/SimulacaoRegimes.tsx` — inputs (faturamento, folha, margem, % serviços) + 3 cards comparativos (carga total, alíquota efetiva, vantagem) + recomendação destacada.
- Persistir resultado em `regimes_simulados` ao salvar.

### 4. CRUD Faturamento + Folha
- Página `src/pages/tributario/HistoricoFinanceiro.tsx` com 2 abas (Faturamento / Folha).
- Importação CSV (mapeamento ano/mês/valores).
- Validação: 12 meses obrigatórios para cálculo confiável.

### 5. Integração no menu
- Submenu "Tributação" → "Simulação de Regimes", "Histórico Financeiro" (além dos itens já existentes de Reforma Tributária).

## Diagrama

```text
Inputs (Faturamento + Folha)
        │
        ▼
┌──────────────────────────────┐
│  Motor (lib/tributario/)     │
│  ├── rbt12                   │
│  ├── fator-r                 │
│  ├── simular-simples         │
│  ├── simular-presumido       │
│  └── simular-real            │
└──────────────┬───────────────┘
               ▼
       decidir-regime
               ▼
   3 cenários ranqueados + recomendação
               ▼
   Persistência em regimes_simulados
               ▼
       UI Simulação + Recomendação
```

## Observações

- Cálculo no **frontend (lib pura)** — sem Edge Function nesta primeira rodada (mais rápido, testável, sem latência). Migrar para Edge Function só se precisar de batch/cron.
- Schema `public` (não criar schema `tributario` separado — quebraria padrão atual e `types.ts` auto-gerado).
- Lotes seguintes (após aprovação deste): elisão (9 estratégias), alertas com cron, PDF executivo, PF vinculada (IRPFM).
- Sem mexer em `client.ts` / `types.ts` / `supabase/config.toml`.

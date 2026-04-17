
## Lote 4 — Hardening, UX e Cobertura Total do Motor Tributário

Os 3 lotes anteriores fecharam o roadmap funcional. Para chegar a **10/10** faltam: hardening de qualidade, integração entre módulos, UX premium e operacionalização do cron.

### 1. Ativação automática do cron de alertas
- Migration que executa `cron.schedule` para `gerar-alertas-tributarios` (06:00 BRT diário) usando `pg_cron` + `pg_net`.
- Toggle administrativo em `/admin/cron-jobs` (já existe `get_cron_jobs`).

### 2. Realtime + badge de alertas tributários
- `useRealtimeAlertas` já existe — adicionar filtro por `tipo IN ('sublimite_simples','fator_r_baixo','vencimento_darf','desvio_benchmark','irpfm_2026')`.
- Badge no item "Tributação" do menu mostrando contagem de alertas críticos não lidos.
- Toast em tempo real ao receber novo alerta tributário.

### 3. Integração Histórico ↔ Simulação ↔ Elisão (fluxo end-to-end)
- Auto-popular `SimulacaoRegimes` com dados reais de `faturamento_mensal` + `folha_pagamento` (hoje aceita só inputs manuais).
- Botão "Analisar oportunidades" em `SimulacaoRegimes` que dispara `orquestrador-elisao` automaticamente após simular.
- Card "Próximas ações" no `DashboardTributario` consolidando: regime recomendado + top 3 elisões + alertas + projeção 2026.

### 4. PDF executivo enriquecido
- Adicionar seções: gráfico de barras 3 regimes (canvas → PNG), timeline reforma 2026-2033, anexo IRPFM PF.
- Capa com branding da empresa (busca `empresas.razao_social` + logo se existir).
- Assinatura digital "Gerado por Motor Tributário Lovable em DD/MM/YYYY HH:mm".

### 5. Importação CSV robusta no Histórico Financeiro
- Parser com detecção de encoding (UTF-8/Latin-1), separador (`,` `;` `\t`), validação de mês/ano, preview antes de importar, tratamento de duplicatas (UPSERT por empresa+ano+mes).
- Template CSV downloadable (faturamento + folha).

### 6. Hardening de testes + lint
- Cobrir `decidir-regime.ts`, `orquestrador-elisao.ts`, `simular-presumido.ts`, `simular-real.ts` (hoje só simples e IRPFM têm testes completos).
- Adicionar edge cases: empresa nova (<13 meses), exportação 100%, MEI, sublimite estourado.
- `npx tsc --noEmit` + `npm test` limpos.

### 7. Modularização (memória do projeto)
- `SimulacaoRegimes.tsx` e `DashboardTributario.tsx` provavelmente passaram de 400 linhas — extrair sub-componentes (`RegimeCard`, `ProjecaoMiniChart`, `OportunidadesResumo`).

### 8. Acessibilidade + responsividade
- Todos os cards/charts com `aria-label`, `role`, foco visível.
- Mobile: cards empilhados, gráficos responsivos com `ResponsiveContainer`.

## Diagrama

```text
   Histórico Financeiro (CSV/manual)
              │
              ▼ (auto-load)
       Simulação Regimes ──→ PDF Executivo (com gráficos)
              │
              ▼ (auto-trigger)
       Orquestrador Elisão ──→ Oportunidades
              │
              ▼
       Dashboard Tributário (consolidado)
              │
              ▼
       Cron 06:00 → Alertas → Realtime Badge
```

## Observações

- Sem mexer em `client.ts`, `types.ts`.
- Migration do cron via tool de SQL (não migration normal — segue regra `schedule-jobs`).
- Após este lote: módulo Tributação 10/10 (funcional + UX + operacional + testado).

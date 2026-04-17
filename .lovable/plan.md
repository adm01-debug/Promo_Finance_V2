
## Lote 2 — Motor Tributário: Elisão Fiscal + Inteligência

Lote 1 entregou a fundação (RBT12, Fator R, 3 simuladores, decisão de regime, CRUD histórico). Agora avançamos para as **9 estratégias de elisão fiscal** + **alertas inteligentes** + **PDF executivo**.

### 1. Migration — Catálogo de estratégias e benchmarks
- `estrategias_elisao_catalogo` (codigo, nome, descricao, base_legal, risco, aplicavel_a regime[], requisitos jsonb).
- Seed com 9 estratégias: MS LC 224/2025, JCP, Reintegra, Holding Patrimonial, PAT, Lei do Bem, Drawback, Subvenção ICMS, Bonificação.
- `benchmarks_setoriais` (cnae_prefix, regime, carga_media_pct, margem_media_pct) — referência para alertas de desvio.

### 2. Motor de Elisão (`src/lib/tributario/elisao/`)
- `detectar-jcp.ts` — empresas Lucro Real com PL > 0 e lucro positivo → economia ≈ TJLP × PL × 25%.
- `detectar-reintegra.ts` — empresas com receita_exportacao > 0 → 0,1% a 3% de crédito.
- `detectar-ms-lc224.ts` — Simples Nacional próximo do sublimite estadual (R$ 3,6 mi).
- `detectar-holding.ts` — sócios PF com dividendos > R$ 600k/ano (gatilho IRPFM Lei 15.270/2025).
- `detectar-pat.ts` — Lucro Real com folha relevante → dedução até 4% IRPJ.
- `detectar-lei-bem.ts` — Lucro Real com despesas P&D.
- `detectar-drawback.ts` — empresas com importação + exportação.
- `detectar-subvencao-icms.ts` — benefícios fiscais ICMS exclusos do lucro real.
- `detectar-bonificacao.ts` — análise de operações com goodwill.
- `orquestrador-elisao.ts` — roda todas, persiste em `oportunidades_elisao`, retorna ranking por economia.

### 3. Hook + Página de Oportunidades de Elisão
- `useOportunidadesElisao(empresaId)` — lê `oportunidades_elisao`, dispara reanálise.
- `src/pages/tributario/OportunidadesElisao.tsx` — cards por estratégia (economia estimada, risco, base legal), botão "Analisar agora".

### 4. Alertas Tributários Inteligentes (cron)
- Edge Function `gerar-alertas-tributarios` (cron diário 06:00):
  - Sublimite Simples próximo (>90% RBT12).
  - Fator R caindo abaixo de 0,28 (mudança Anexo III→V).
  - Vencimento DAS/DARF em 5 dias.
  - Desvio de carga vs benchmark setorial (>20%).
  - Dividendos PF > R$ 50k/mês (alerta IRPFM 2026).
- Persiste em `alertas` (tabela existente) com tipo `tributario`.

### 5. PDF Executivo de Decisão
- `src/lib/tributario/relatorio-pdf.ts` (jsPDF + autoTable) — gera relatório com:
  - Capa, sumário executivo, comparativo 3 regimes, recomendação justificada, oportunidades de elisão, projeção 12m, base legal.
- Botão "Exportar PDF Executivo" em `SimulacaoRegimes.tsx`.

### 6. Integração no menu
- Submenu Tributação → "Oportunidades de Elisão" (ícone Lightbulb).

## Diagrama

```text
   Histórico financeiro + Simulação atual
                │
                ▼
   ┌────────────────────────────┐
   │  Motor Elisão (9 detect.)  │
   └──────────────┬─────────────┘
                  ▼
       Ranking por economia
                  ▼
       oportunidades_elisao
                  ▼
   UI Oportunidades + PDF Executivo
                  +
   Cron diário → alertas tributários
```

## Observações

- Schema `public`, RLS por `empresa_id` + `has_any_role`.
- Edge Function com `verify_jwt = true` + cron via `pg_cron`.
- Lote 3 (próximo): IRPFM PF (Lei 15.270/2025), Reforma Tributária projeção 2026-2033 com CBS/IBS por NCM, dashboard consolidado.
- Sem mexer em `client.ts`, `types.ts`, `supabase/config.toml` (apenas adicionar bloco da nova função se necessário).

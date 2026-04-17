
## Lote 5 — Finalização 10/10: Integração End-to-End + UX Premium

Lote 4 entregou cron, badge e PDF assinado. Restam os itens **3, 4 (gráficos), 5, 7 e 8** do plano original para fechar 10/10.

### 1. Integração Histórico ↔ Simulação ↔ Elisão (fluxo end-to-end)
- `SimulacaoRegimes.tsx`: seletor de empresa + auto-popular `parametros` a partir de `faturamento_mensal` + `folha_pagamento` (últimos 12m) via `useSimulacaoRegimes` (já carrega histórico, falta consumir).
- Botão **"Analisar oportunidades de elisão"** que dispara `useOportunidadesElisao.analisar()` após simular e navega para `/tributario/oportunidades-elisao`.
- `DashboardTributario.tsx`: card **"Próximas ações"** consolidando regime recomendado + top 3 elisões + alertas críticos + delta projeção 2026.

### 2. PDF executivo enriquecido com gráficos
- `relatorio-pdf.ts`: renderizar gráfico de barras 3 regimes via canvas off-screen → `toDataURL('image/png')` → `doc.addImage`.
- Timeline reforma 2026-2033 (linha CBS+IBS) também via canvas.
- Capa com `empresas.razao_social` + CNPJ formatado.
- Anexo IRPFM PF (tabela progressiva) quando dividendos > R$ 50k/mês detectados.

### 3. Importação CSV robusta no Histórico Financeiro
- `src/lib/csv-importer.ts`: detecção encoding (UTF-8/Latin-1 via `TextDecoder`), separador (`,` `;` `\t`), validação mês/ano.
- `HistoricoFinanceiro.tsx`: modal de preview (primeiras 10 linhas + erros), UPSERT por `(empresa_id, ano, mes)`.
- Botão **"Baixar template CSV"** (faturamento + folha separados).

### 4. Modularização (regra >400 linhas)
- Extrair de `SimulacaoRegimes.tsx`: `RegimeCard`, `ParametrosForm`, `ResultadoComparativo`.
- Extrair de `DashboardTributario.tsx`: `KpiCard`, `ProximasAcoesCard`, `AlertasResumoCard`.
- Extrair de `ProjecaoReforma.tsx`: `GraficoCargaAno`, `TabelaTransicao`.

### 5. Acessibilidade + responsividade
- `aria-label` em todos os cards/charts/botões críticos do módulo.
- `ResponsiveContainer` em todos os gráficos Recharts.
- Grid mobile-first: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` em todas as páginas tributárias.
- Foco visível (`focus-visible:ring-2 ring-primary`) consistente.

## Diagrama

```text
   [Empresa selecionada]
            │
            ▼
   Histórico (CSV/manual) ──auto-load──▶ Simulação Regimes
                                              │
                                              ├──▶ PDF Executivo (com gráficos PNG)
                                              │
                                              └──▶ Orquestrador Elisão ──▶ Oportunidades
                                                          │
                                                          ▼
                                            Dashboard Tributário (Próximas Ações)
```

## Observações

- Sem mexer em `client.ts`, `types.ts`, `supabase/config.toml`.
- Sem nova migration (tabelas já existem).
- Após este lote: módulo Tributação **10/10** — funcional, integrado, acessível, modular, com importação real e PDF gráfico.


P5 ✅ entregue. Próximo: **Lote P6 — Relatório Anual Tributário PDF** (último lote do roadmap pós-10/10).

## Lote P6 — Relatório Anual Tributário PDF

### 1. Edge Function nova `gerar-relatorio-anual`
- Validação JWT manual + RBAC (admin/financeiro/contador_readonly).
- Input: `{ empresa_id, ano }`.
- Agrega dados via `vw_tributario_dashboard` (criada em P5):
  - Faturamento, tributos pagos, carga efetiva mensal
  - Comparativo de regimes (chama motor `decidir-regime`)
  - Oportunidades de elisão aplicáveis (`analisarOportunidadesElisao`)
  - Alertas resolvidos no ano + economias capturadas
- Retorna JSON estruturado para renderização no cliente (PDF gerado client-side com jsPDF, padrão já memorizado em `mem://features/advanced-corporate-reporting-engine`).
- Logger P2 estruturado (`fn_start`, `data_aggregated`, `fn_success`).

### 2. Componente `RelatorioAnualTributarioPDF.tsx`
- Em `src/components/tributario/relatorios/`.
- Usa `jsPDF` + `autoTable` (já no projeto).
- Layout corporativo (capa, sumário executivo, 4 seções):
  1. **Sumário executivo** — KPIs anuais, regime atual vs ótimo
  2. **Apuração mensal** — tabela 12 meses × tributos (CBS, IBS, IS, residuais)
  3. **Oportunidades de elisão** — top 9 com base legal e economia
  4. **Recomendações** — texto gerado dinamicamente conforme score saúde fiscal
- Cabeçalho/rodapé com razão social, CNPJ, ano, paginação.
- Cores HSL semânticas convertidas para RGB no PDF.

### 3. Hook `useRelatorioAnual(empresaId, ano)`
- Chama edge function via `supabase.functions.invoke`.
- React Query com `staleTime: 30min` (dados anuais mudam pouco).
- Retorna `{ data, isLoading, gerarPDF }` onde `gerarPDF` dispara o download.

### 4. UI de acesso
- Botão "Gerar Relatório Anual" no `DashboardTributario` (P5) — abre modal com seleção de ano (últimos 3) e CTA de download.
- Toast de sucesso com confetti ao concluir geração.

### 5. Validação
- `npx tsc --noEmit` zero erros.
- Deploy edge sem erros.
- QA: gerar PDF com empresa real, conferir todas as 4 seções renderizam sem clipping.
- Memória: salvar padrão em `mem://features/relatorio-anual-tributario-pdf`.

## Diagrama

```text
   DashboardTributario (P5)
            │
            ▼
   [Botão "Gerar Relatório Anual"]
            │
            ▼
   useRelatorioAnual(empresaId, ano)
            │
            ▼
   edge: gerar-relatorio-anual
       │
       ├─▶ vw_tributario_dashboard (P5)
       ├─▶ decidir-regime (motor P1)
       └─▶ analisarOportunidadesElisao (motor P1)
            │
            ▼
   JSON estruturado → RelatorioAnualTributarioPDF
            │ (jsPDF + autoTable)
            ▼
   Download PDF corporativo (capa + 4 seções)
```

## Observações
- Reaproveita 100% dos motores P1, view P5, observability P2, RBAC P4.
- Sem novos secrets.
- **Último lote do roadmap pós-10/10** — após P6, sistema atinge 10/10++ (excelência operacional completa).

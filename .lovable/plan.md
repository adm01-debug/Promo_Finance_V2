
## Lote 6 — Polimento Final 10/10: Modularização + Testes E2E + Hardening

Lote 5 fechou integração end-to-end e PDF gráfico. Para cravar **10/10 absoluto**, restam itens da regra de modularização (>400 linhas), cobertura de testes do CSV importer e validação visual dos novos componentes.

### 1. Modularização (regra mem://architecture/modularization-strategy)
Após adições do Lote 5, verificar e extrair:
- `SimulacaoRegimes.tsx` (~430 linhas após CTAs) → extrair `SimulacaoHeaderActions`, `EmpresaSelector`, `ParametrosForm`, `ResultadoComparativoTabs`.
- `DashboardTributario.tsx` (~330 linhas após card Próximas Ações) → extrair `KpiTributarioCard`, `ProximasAcoesCard`, `AtalhosTributarios`.
- `HistoricoFinanceiro.tsx` (~410 linhas após import CSV) → mover `FaturamentoTab` e `FolhaTab` para `src/components/tributario/historico/`.

### 2. Testes do CSV Importer
- `src/lib/__tests__/csv-importer.test.ts`: cobertura de detecção encoding (UTF-8/Latin-1), separador (`,`/`;`/tab), parsing BR (`1.234,56`) vs US (`1234.56`), validação ano/mês, header mapping case-insensitive, linhas com erro, template download.
- Edge cases: arquivo vazio, header faltando coluna obrigatória, valores negativos.

### 3. Hardening visual + a11y
- `CsvImportDialog`: foco visível no botão de upload, anúncio de erros via `aria-live="polite"`.
- `ProjecaoReforma`: garantir que `BarChart` e `LineChart` usem `ResponsiveContainer` com `aria-label` no container.
- `OportunidadesElisao`: adicionar `aria-label` nos cards de estratégia.

### 4. Validação final
- `npx tsc --noEmit` zero erros.
- `npx vitest run` 100% verde (esperado: 911+ testes incluindo os novos do CSV).
- Verificar visualmente o fluxo completo no preview: histórico → CSV import → simulação auto-populada → elisão → PDF com gráficos → dashboard com Próximas Ações.

## Diagrama

```text
   Lote 5 (entregue)
        │
        ▼
   ┌─────────────────────────┐
   │  Modularização >400 ln  │ ──┐
   └─────────────────────────┘   │
                                 ▼
   ┌─────────────────────────┐   ┌──────────────┐
   │  Testes CSV importer    │──▶│  10/10 final │
   └─────────────────────────┘   └──────────────┘
                                 ▲
   ┌─────────────────────────┐   │
   │  A11y polishing final   │ ──┘
   └─────────────────────────┘
```

## Observações

- Sem nova migration. Sem mexer em `client.ts`/`types.ts`/`config.toml`.
- Refatoração mantém API pública dos componentes (sem quebrar chamadores).
- Após este lote: módulo Tributação **10/10 absoluto** — funcional + integrado + acessível + modular + testado.

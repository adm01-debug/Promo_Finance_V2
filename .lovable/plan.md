
P4 ✅ entregue. Próximo: **Lote P5 — Dashboard Tributário v2**.

## Lote P5 — Dashboard Tributário v2

### 1. Refatorar `src/pages/tributario/DashboardTributario.tsx`
- Layout Bento Grid premium (glassmorphism + tokens HSL semânticos `--cbs`/`--ibs`).
- Header com seletor de empresa + período (3/6/12 meses) + badge do regime atual.
- 4 KPIs animados (framer-motion stagger):
  - Carga tributária efetiva (% sobre receita)
  - Total economizado (estratégias de elisão aplicadas)
  - Próximo vencimento (DARF/DAS)
  - Saúde fiscal (score 0-100 baseado em alertas ativos)

### 2. Novos widgets (componentes em `src/components/tributario/dashboard/`)
- `EvolucaoCargaChart.tsx` — área chart (recharts) com carga tributária mês a mês + linha de referência do regime ótimo.
- `ComparativoRegimes.tsx` — barras agrupadas Simples vs Presumido vs Real (consome `decidir-regime`).
- `OportunidadesElisaoWidget.tsx` — top 3 oportunidades do `analisarOportunidadesElisao` com economia estimada e CTA.
- `ProximosVencimentosTimeline.tsx` — timeline vertical dos próximos 30d (DARF, DAS, DCTFWeb).
- `AlertasAtivosResumo.tsx` — lista compacta dos alertas tributários ativos (consome tabela `alertas_tributarios`).

### 3. Novo hook `useDashboardTributario(empresaId, periodoMeses)`
- Agrega em paralelo: KPIs, série temporal, oportunidades, vencimentos, alertas.
- React Query com `staleTime: 5min`.
- Retorna `{ kpis, serie, oportunidades, vencimentos, alertas, isLoading }`.

### 4. View materializada (migration)
- `vw_tributario_dashboard` (security_invoker=true) agregando faturamento mensal × tributos calculados por empresa.
- Índice para acelerar consultas por `empresa_id, ano, mes`.

### 5. Validação
- `npx tsc --noEmit` zero erros.
- Mobile-first: grid colapsa em 1 coluna < 640px.
- Memória: salvar padrão em `mem://features/dashboard-tributario-v2`.

## Diagrama

```text
   /tributario/dashboard (v2)
       │
       ├─ Header: empresa + período + regime
       ├─ KPIs (4 cards animados)
       ├─ Bento Grid:
       │    ├─ EvolucaoCargaChart (área 12m)
       │    ├─ ComparativoRegimes (barras)
       │    ├─ OportunidadesElisao (top 3)
       │    ├─ ProximosVencimentos (timeline)
       │    └─ AlertasAtivosResumo (lista)
       │
       └─ useDashboardTributario
              │
              ▼
         vw_tributario_dashboard (view otimizada)
```

## Observações
- Reaproveita motores P1 (testados): `decidir-regime`, `orquestrador-elisao`.
- Sem novos secrets, sem novas edges.
- Próximo lote: P6 (relatório anual PDF).

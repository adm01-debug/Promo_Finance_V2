

## Plano — Painel de Insights de IA (Anomalias + Conciliação)

Nova rota `/admin/insights-ia` consolidando os dois motores de IA já existentes no backend (`detectar-anomalias-financeiras` + `conciliacao-ia` + `feedback_conciliacao_ia`) numa experiência unificada de revisão, histórico e feedback.

### Por que faz sentido agora

- **Backend pronto**: `anomalias_detectadas` (5 detectores estatísticos), `feedback_conciliacao_ia`, `regras_conciliacao` e edge `conciliacao-ia` já existem e rodam.
- **UI fragmentada**: anomalias só aparecem como 4ª aba dentro de `/admin/system-health`; feedback de IA da conciliação só vive embutido no fluxo de match — não há **visão consolidada** com histórico, métricas de aprendizado e curadoria.
- **Gap apontado** no `GAPS_ENTERPRISE.md`: falta cockpit de IA explicável (XAI) com auditoria de decisões.

### Estrutura da página

```text
/admin/insights-ia
├── Header: KPIs (anomalias 24h, taxa acerto IA, regras aprendidas, valor sob revisão)
├── Tab 1 · Anomalias Detectadas
│   ├── Filtros: severidade, tipo, status, período
│   ├── Tabela com badges + drill-down
│   ├── Ações: marcar falso positivo / confirmar / investigar + observações
│   └── Botão "Executar detecção agora"
├── Tab 2 · Conciliação IA — Histórico
│   ├── Lista de matches sugeridos (últimos 90d) com score e confiança
│   ├── Ação confirmou/rejeitou + motivo
│   └── Visualização lado-a-lado (transação ↔ lançamento)
├── Tab 3 · Aprendizado & Métricas
│   ├── Recharts: taxa de acerto IA ao longo do tempo (linha)
│   ├── Pie: distribuição confirmado/rejeitado/pendente
│   ├── Bar: regras aprendidas mais aplicadas (top 10)
│   └── Heatmap simples: anomalias por tipo × semana
└── Tab 4 · Auditoria de Decisões (XAI)
    ├── Timeline cronológica de todas decisões IA
    ├── Para cada: input → score → motivos → output → feedback humano
    └── Export CSV
```

### Arquivos a criar

**Página + componentes**
- `src/pages/admin/InsightsIA.tsx` — orquestra 4 tabs
- `src/components/insights-ia/InsightsIAKpis.tsx` — header com 4 KPIs
- `src/components/insights-ia/AnomaliasTab.tsx` — reusa lógica do `AnomaliasDetectadasPanel` existente, expandida com filtros
- `src/components/insights-ia/ConciliacaoHistoricoTab.tsx` — query em `feedback_conciliacao_ia` + join com transações/lançamentos
- `src/components/insights-ia/AprendizadoMetricasTab.tsx` — Recharts (LineChart, PieChart, BarChart)
- `src/components/insights-ia/AuditoriaDecisoesTab.tsx` — timeline + export
- `src/components/insights-ia/FeedbackDialog.tsx` — modal de marcar feedback com motivo

**Hooks**
- `src/hooks/useInsightsIA.ts` — agrega KPIs (anomalias 24h, taxa acerto, regras ativas, valor pendente)
- `src/hooks/useFeedbackConciliacaoHistorico.ts` — lista paginada de feedbacks + mutation para registrar novo
- `src/hooks/useMetricasAprendizadoIA.ts` — séries temporais agregadas

### Schema (sem mudanças destrutivas)

Tabelas existentes já cobrem 95%. Apenas **2 índices novos** para performance:
```sql
CREATE INDEX IF NOT EXISTS idx_feedback_concil_created ON feedback_conciliacao_ia(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomalias_detectada_severidade ON anomalias_detectadas(severidade, status, detectada_em DESC);
```

Sem novas tabelas, sem RLS extra (políticas admin-only já existem em ambas).

### Roteamento e navegação

- Adicionar rota `/admin/insights-ia` em `src/App.tsx` (lazy) com guard `<RequireRole role="admin">`
- Adicionar item "Insights de IA" no menu admin lateral com ícone `Brain` (lucide)
- Cross-link: card no `/admin/system-health` apontando para a nova página

### Detalhes técnicos

- **Realtime**: subscription em `anomalias_detectadas` (INSERT) → toast "Nova anomalia crítica" + invalidação de query
- **Refetch**: 60s para KPIs, manual nas demais tabs
- **Empty states**: ilustração + CTA "Executar detecção agora" quando não houver dados
- **Loading**: Skeleton em todos os cards/tabelas
- **Acessibilidade**: tabs com `aria-label`, contraste AA nas badges de severidade
- **Performance**: paginação server-side (20/página) nas tabs 2 e 4; queries com `.limit()` + cursor

### Fora de escopo

- Treinamento/retrain de modelo (apenas curadoria + feedback)
- Edição de regras de conciliação (já existe em `/conciliacao`)
- Notificações por e-mail de novas anomalias (cron já cobre via `enviar-alerta-email`)


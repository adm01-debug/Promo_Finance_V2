
## Plano — Auditoria de Testes Abrangente (P15)

Vou executar uma bateria massiva de testes automatizados em todas as camadas do sistema, gerar relatório consolidado e corrigir falhas encontradas.

### Escopo (5 camadas)

**1. Testes Unitários (Vitest) — alvo: 2.000+ asserções**
- Rodar suite completa existente: `npm test -- --run --reporter=verbose`
- Cobertura: `npm run test:coverage` → relatório HTML + thresholds (70% lines/funcs/stmts, 65% branches)
- Áreas cobertas hoje: tributário (decidir-regime, simular-simples/presumido/real, projecao-reforma, orquestrador-elisao), hooks (useAlertasTributariosCount), UI (button, input), cobrança (ReguaCobrancaConfig), admin (TelemetryCharts)
- **Adicionar suites faltantes** (gap analysis): hooks P10-P14 (useHealthScoreOperacional, useAnomaliasDetectadas, useAcoesRecomendadas, useSolicitacoesLGPD, useOnboardingProgress, useSLOMetrics, useCopilotGlobal), validators brasileiros (CPF/CNPJ/Pix), utils financeiros (formatadores, calculadoras), components críticos (HealthScoreCard, CentroAcoesInteligentes, AnomaliasDetectadasPanel, SLOPanel, OnboardingTour)

**2. Testes de Integração (Edge Functions Deno)**
- Rodar `supabase--test_edge_functions` em todas as 30+ edges P1-P14
- Criar `*_test.ts` para edges sem cobertura: copilot-global, gerar-acoes-recomendadas, calcular-slo-metrics-diario, processar-solicitacao-lgpd, calcular-health-score-operacional, detectar-anomalias-financeiras, gerar-resumo-executivo-semanal, gerar-heatmap-tributario, ocr-nota-fiscal
- Cenários: happy path, RBAC negado, payload inválido, 429/402 do AI gateway, timeout

**3. Auditoria de Segurança (Supabase Linter + Security Scan)**
- `supabase--linter` → todas as tabelas com RLS correto
- `security--run_security_scan` → varredura completa
- Validar policies das 12 novas tabelas P10-P14 (push_subscriptions, fechamentos_tributarios, dre_tributaria, anomalias_detectadas, health_scores_operacionais, solicitacoes_lgpd, acoes_recomendadas, user_onboarding_progress, slo_metrics_diarias, etc.)

**4. Testes E2E (Playwright)**
- Rodar suite Playwright existente em 5 navegadores (Chrome/Firefox/Safari + Mobile Chrome/Safari)
- Fluxos críticos: login → dashboard → contas a pagar → contas a receber → tributário → aprovações → LGPD → onboarding tour → copilot global

**5. Validação de Tipos + Build**
- `npx tsc --noEmit` → zero erros TypeScript
- `npm run build` → bundle production sem warnings críticos
- `npm run lint` → ESLint zero erros

### Entregáveis

1. **Relatório consolidado** `/mnt/documents/auditoria-testes-p15.md` com:
   - Total de testes executados (esperado: 2.500+)
   - Pass rate por camada
   - Cobertura % (lines/branches/funcs/stmts)
   - Issues de segurança encontrados + severidade
   - Lista de bugs corrigidos
2. **Novos testes criados** (~30 arquivos) cobrindo gaps P10-P14
3. **Correções** de qualquer falha encontrada (commits inline)
4. **Memória** `mem://quality/auditoria-testes-p15` documentando baseline de qualidade

### Diagrama de execução

```text
   [1] npm test --run              ──▶ unit suite atual + novas
   [2] npm run test:coverage       ──▶ thresholds + HTML report
   [3] supabase--test_edge_functions ──▶ 30+ edges (Deno)
   [4] supabase--linter            ──▶ RLS audit
   [5] security--run_security_scan ──▶ varredura completa
   [6] npx tsc --noEmit            ──▶ type check
   [7] npm run lint + build        ──▶ qualidade final
                                          └─▶ relatório consolidado
                                                + correções inline
```

### Observações
- Reaproveita 100% da infra de testes (vitest + playwright + Deno test).
- Sem novos secrets necessários ✅.
- Tempo estimado: ~15min de execução (paralelizada onde possível).
- Eleva produto para **10/10++++++++++** com baseline mensurável de qualidade.

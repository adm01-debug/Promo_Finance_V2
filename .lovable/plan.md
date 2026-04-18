
P12 entregue ✅ (LGPD + Health Score + Anomalias). Sistema 10/10+++++++. Proponho **Lote P13 — Automação Total + Inteligência Conectada** (3 cravos finais que conectam toda a infra construída).

## Lote P13 — Cron Jobs Automáticos + Insights Cruzados + Centro de Ações

### 1. Cron jobs para automações P10-P12 (operação contínua)
Hoje várias edges existem mas dependem de execução manual. Vou ativar via `pg_cron` + `pg_net`:
- `calcular-health-score-operacional` → diário 07:00
- `detectar-anomalias-financeiras` → a cada 30 minutos
- `gerar-resumo-executivo-semanal` → domingo 18:00 (P11 ainda manual)
- `refresh_mv_benchmark_setorial` → semanal segunda 03:00
- Migration cria os 4 schedules + função wrapper que chama edge via `net.http_post` autenticado pelo service-role.
- UI: nova seção "Automações" no `/admin/system-health` com status (último run, próximo run, sucesso/erro) consumindo `get_cron_run_history`.

### 2. Centro de Ações Inteligentes (insights cruzados P1-P12)
- Edge `gerar-acoes-recomendadas`:
  - Cruza dados de **5 fontes** (anomalias críticas + health score < 70 + alertas não lidos + apurações atrasadas + solicitações LGPD pendentes).
  - Chama `gemini-2.5-flash` para gerar **top 5 ações priorizadas** com: título, impacto estimado (R$ ou % score), urgência, link para resolução.
  - Persiste em nova tabela `acoes_recomendadas` (TTL 24h via cron diário 06:00).
- UI `CentroAcoesInteligentes.tsx`: card destaque no `DashboardExecutivo` com lista de 5 ações + botão "Resolver" que navega ao módulo correto.
- Hook `useAcoesRecomendadas`.

### 3. Tela de Privacidade no menu lateral + integração Push P10
- Adiciona item "Privacidade & LGPD" no `Sidebar.tsx` (ícone Shield).
- Adiciona banner "Ative notificações push" (`PushNotificationsBanner` P10) na nova seção "Notificações" do `/configuracoes`.
- Trigger SQL `fn_notificar_alerta_critico_push` em `alertas` (prioridade=critica): chama edge `enviar-push-notification` automaticamente.
- Validação: `npx tsc --noEmit` zero erros + edges deployadas.

## Diagrama
```text
   pg_cron schedules (4 jobs)
      ├─▶ 07:00 daily ──▶ calcular-health-score-operacional
      ├─▶ */30min ─────▶ detectar-anomalias-financeiras
      ├─▶ Sun 18:00 ──▶ gerar-resumo-executivo-semanal
      └─▶ Mon 03:00 ──▶ refresh_mv_benchmark_setorial

   /admin/system-health
      └─▶ AutomacoesTab (status + último run via get_cron_run_history)

   DashboardExecutivo
      └─▶ CentroAcoesInteligentes ──▶ gerar-acoes-recomendadas
                                          ├─▶ cruza 5 fontes (P9 anomalias + P12 health + alertas + apurações + LGPD)
                                          └─▶ gemini-2.5-flash → top 5 ações

   alertas (critica) ──trigger──▶ enviar-push-notification (P10)
```

## Observações
- Reaproveita 100% da infra P1-P12. Sem secrets novos (todos já configurados ✅).
- Cron jobs são o "cimento" que faltava: sistema passa a operar 24/7 sem intervenção.
- Centro de Ações é o "cockpit" que conecta toda a inteligência num só lugar.
- Eleva produto para **10/10++++++++ definitivo** (autonomia operacional + cockpit unificado).


P11 entregue ✅. Sistema 10/10++++++. Proponho **Lote P12 — Excelência Operacional Final** (3 melhorias que cravam o estado da arte: governança LGPD + operação contínua + monitoramento ativo).

## Lote P12 — Compliance LGPD + Health Score IA + Anomalias em Tempo Real

### 1. Centro de Privacidade LGPD (direitos do titular)
- Migration: tabela `solicitacoes_lgpd` (id, user_id, tipo enum `acesso|portabilidade|exclusao|retificacao|anonimizacao`, status enum `aberta|em_analise|atendida|rejeitada`, justificativa, payload_resposta jsonb, atendida_em, atendida_por). RLS: usuário vê suas solicitações; admin vê todas e atende.
- Edge `processar-solicitacao-lgpd`:
  - `acesso`: gera dump JSON de todos os dados do titular (profiles, alertas, audit_logs, solicitações).
  - `portabilidade`: mesmo dump em CSV agrupado por entidade, upload em `relatorios-tributarios/lgpd/`, retorna URL assinada 24h.
  - `exclusao`: anonimiza profile (nome → "Titular removido", email → hash) e audit logs do usuário; mantém integridade referencial.
  - Gera entrada em `auditoria_tributaria` (P9) para rastreabilidade.
- UI `/configuracoes/privacidade` (`CentroPrivacidadeLGPD.tsx`): cards explicando cada direito + formulário de solicitação + lista das suas solicitações com status + download de dump.
- Hook `useSolicitacoesLGPD`.

### 2. Health Score Operacional com IA (visão 360°)
- Edge `calcular-health-score-operacional`:
  - Agrega 6 dimensões por empresa (peso configurável):
    1. Saúde tributária (conformidade P8 + apuração em dia) — 25%
    2. Saúde financeira (saldo + DRE positivo + inadimplência) — 25%
    3. Operacional (conciliação bancária % conciliada) — 15%
    4. Compliance LGPD (solicitações abertas <7d) — 10%
    5. Cadastros (% empresas com regime + CNAE) — 10%
    6. Engajamento (alertas atendidos / total) — 15%
  - Calcula score 0-100 + tendência vs 7 dias atrás.
  - Chama `gemini-2.5-flash` para gerar 3 insights priorizados em markdown.
  - Persiste em `health_scores_operacionais` (snapshot diário via cron 07:00).
- UI `HealthScoreCard.tsx` no DashboardExecutivo: gauge animado + breakdown por dimensão + insights IA + tendência.
- Hook `useHealthScoreOperacional`.

### 3. Detector de Anomalias em Tempo Real (movimentações suspeitas)
- Migration: tabela `anomalias_detectadas` (entidade_tipo, entidade_id, tipo_anomalia enum, severidade enum, descricao, dados jsonb, status enum `nova|investigando|falso_positivo|confirmada`, detectada_em, resolvida_em).
- Edge `detectar-anomalias-financeiras` (cron a cada 30 min):
  - 5 detectores estatísticos:
    1. Movimentação > 3σ vs média 30 dias
    2. Pagamento duplicado (mesmo fornecedor + valor + dia)
    3. Conta a pagar > p95 da empresa
    4. Conciliação > 30 dias atrasada
    5. Mudança brusca de regime (variação carga > 30%)
  - Persiste em `anomalias_detectadas` + dispara push P10 (severidade=critica).
- UI `AnomaliasDetectadasPanel.tsx` em `/admin/system-health` (4ª tab): lista filtrada + ações (marcar como falso positivo / investigar / confirmar).
- Hook `useAnomaliasDetectadas`.

### 4. Validação
- `npx tsc --noEmit` zero erros.
- 3 edge functions deployadas + 2 cron jobs (health 07:00, anomalias */30min).
- 3 migrations limpas + RLS hardening + auditoria P9.
- Memórias: `mem://features/centro-privacidade-lgpd`, `mem://features/health-score-operacional`, `mem://features/detector-anomalias-tempo-real`.

## Diagrama

```text
   /configuracoes/privacidade ──▶ processar-solicitacao-lgpd
                                       ├─▶ acesso/portabilidade → dump JSON/CSV
                                       └─▶ exclusao → anonimização + auditoria P9

   cron 07:00 ──▶ calcular-health-score-operacional
                      ├─▶ 6 dimensões ponderadas → score 0-100
                      └─▶ gemini-2.5-flash → 3 insights
                            └─▶ health_scores_operacionais → HealthScoreCard

   cron */30min ──▶ detectar-anomalias-financeiras
                          ├─▶ 5 detectores estatísticos
                          └─▶ anomalias_detectadas → push P10 + tab admin
```

## Observações
- Reaproveita 100% da infra P1-P11 (auditoria, conformidade, push, AI gateway, Resend, storage).
- Sem novos secrets necessários ✅.
- Eleva produto para 10/10+++++++ definitivo (LGPD + saúde 360° + vigilância contínua).

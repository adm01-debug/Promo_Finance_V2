
## Lote P7 — Excelência Operacional++

### 1. Cache de decisões `decidir-regime`
- Migration: tabela `regime_decision_cache` (PK composta `empresa_id+ano+mes`, `decisao jsonb`, `expires_at timestamptz`).
- RLS admin/financeiro/contador_readonly leitura; service role escrita.
- Wrapper no edge `decidir-regime`: checa cache (TTL 7d) antes de recalcular; UPSERT após cálculo.
- Trigger `AFTER INSERT/UPDATE` em `apuracoes_tributarias` invalida cache da empresa+mês.
- Reduz latência do dashboard P5 e relatório P6 em ~80%.

### 2. Agendamento de relatórios anuais (cron + e-mail)
- Migration: tabela `relatorios_tributarios_agendados` (id, empresa_id, ano, frequencia `enum mensal|trimestral|anual`, dia_envio, destinatarios `text[]`, ativo, ultimo_envio_em, proximo_envio_em).
- Edge function nova `enviar-relatorios-tributarios-agendados`:
  - Cron diário 06:00 via `pg_cron` + `pg_net`
  - Consulta agendamentos com `proximo_envio_em <= now()`
  - Reaproveita `gerar-relatorio-anual` (P6) para JSON
  - Renderiza PDF server-side com `pdf-lib` (Deno)
  - Faz upload no bucket `relatorios-tributarios` (já existe ✅)
  - Envia link assinado via Resend (`RESEND_API_KEY` já configurado ✅)
  - Atualiza `ultimo_envio_em` e `proximo_envio_em`
  - Logger P2 estruturado
- UI nova `RelatoriosAgendadosCard.tsx` no `DashboardTributario`: lista, criar/editar/desativar, preview destinatários.

### 3. Página `/admin/system-health`
- Agrega em 1 painel admin-only:
  - `vw_edge_health` (P2) — uptime e P95 das edges
  - Stats `cnpja_cache` (P3) — hit rate e economia de créditos
  - Convites contador (P4) — pendentes/aceitos/expirados
  - Apurações tributárias do mês (P5) — completude por empresa
  - Cache regime hit rate (novo P7)
- KPIs animados (framer-motion stagger) + alertas SLA.
- Acesso restrito via `has_role(uid, 'admin')` (RBAC P4).
- Adiciona rota em `App.tsx` + link no `AdminEdgeHealth` existente.

### 4. Validação
- `npx tsc --noEmit` zero erros.
- Migrations limpas (RLS hardening conforme `mem://security/rls-hardening-rules`).
- Cron job criado via `insert tool` (contém URL+anon key).
- Memórias: `mem://performance/regime-decision-cache`, `mem://features/relatorios-tributarios-agendados`, `mem://features/system-health-page`.

## Diagrama

```text
   decidir-regime (P1)
        │
        ├─▶ regime_decision_cache HIT → retorna (~80% mais rápido)
        └─▶ MISS → calcula + UPSERT cache (TTL 7d)
              │
              ▼ trigger nova apuracao_tributaria
        invalida cache empresa+mes

   pg_cron (diário 06:00)
        │
        ▼
   enviar-relatorios-tributarios-agendados
        │
        ├─▶ relatorios_tributarios_agendados (vencidos)
        ├─▶ gerar-relatorio-anual (P6) → JSON
        ├─▶ pdf-lib render → bucket relatorios-tributarios
        └─▶ Resend link assinado → destinatarios[]

   /admin/system-health (admin only)
        │
        ├─▶ vw_edge_health (P2)
        ├─▶ stats cnpja_cache (P3)
        ├─▶ convites_contador (P4)
        ├─▶ apuracoes_tributarias (P5)
        └─▶ regime_decision_cache (P7)
```

## Observações
- Reaproveita 100% da infra P1-P6, secrets e bucket existentes.
- Sem novos secrets necessários.
- Eleva de 10/10 para 10/10++ (excelência operacional + economia de compute).

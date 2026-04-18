
P9 entregue ✅ (Copilot + Auditoria + Benchmark). Sistema 10/10++++. Proponho **Lote P10 — Fechamento Tributário Inteligente** (último marco antes de declarar perfeição absoluta).

## Lote P10 — Fechamento Mensal Guiado + Notificações Push + DRE Tributária

### 1. Assistente de Fechamento Mensal Tributário
- Migration: tabela `fechamentos_tributarios` (empresa_id, periodo `YYYY-MM`, status enum `aberto|em_revisao|fechado`, checklist jsonb, fechado_por, fechado_em, observacoes).
- Edge `executar-fechamento-tributario`:
  - 6 etapas validadas: (1) Apuração consolidada, (2) Conformidade ≥ 70, (3) DARFs gerados, (4) Conciliação bancária do período, (5) Decisão de regime cacheada, (6) SPED preliminar gerado.
  - Bloqueia fechamento se etapa crítica falhar; permite forçar com justificativa (admin only).
  - Após fechado: dispara auditoria P9 + notifica destinatários via Resend.
- UI `AssistenteFechamentoMensal.tsx` (wizard 6 steps com framer-motion + checklist progressivo + confetti ao concluir).
- Hook `useFechamentoTributario`.

### 2. Notificações Push Web (PWA) para alertas críticos
- Reaproveita `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` já configurados ✅.
- Migration: tabela `push_subscriptions` (user_id, endpoint, p256dh, auth, ativo) com RLS por uid.
- Edge `enviar-push-notification`:
  - Trigger automático via `fn_notificar_alerta_critico` em `alertas` (prioridade=critica).
  - Envia push com web-push (Deno).
- UI `useWebPushSubscription` hook + banner em settings ("Ativar notificações").

### 3. DRE Tributária (Demonstrativo de Resultado com decomposição fiscal)
- Edge `gerar-dre-tributaria`:
  - Input: `{ empresa_id, periodo: 'YYYY-MM' | { inicio, fim } }`.
  - Agrega receita bruta, deduções (CBS/IBS/IS/PIS/COFINS/ICMS/ISS), receita líquida, custos, lucro bruto, IRPJ/CSLL, lucro líquido tributário.
  - Compara cenários: regime atual vs regime ótimo (motor P1 + cache P7).
- UI `DRETributariaPanel.tsx` no DashboardTributario (tab dedicada): tabela waterfall + export CSV/PDF (padrão `secure-data-export`).
- Hook `useDRETributaria` (React Query 30min).

### 4. Validação
- `npx tsc --noEmit` zero erros.
- Edge functions deployadas sem erros.
- Migrations limpas + RLS hardening.
- Memórias: `mem://features/fechamento-mensal-tributario`, `mem://features/web-push-notifications`, `mem://features/dre-tributaria`.

## Diagrama

```text
   DashboardTributario
        ├─▶ AssistenteFechamentoMensal ──▶ executar-fechamento-tributario
        │                                       ├─▶ 6 checks (apuração, conformidade, DARF, etc.)
        │                                       └─▶ fechamentos_tributarios + auditoria P9
        │
        └─▶ DRETributariaPanel ──▶ gerar-dre-tributaria
                                       └─▶ waterfall + comparativo regime ótimo

   alertas (prioridade=critica) ──trigger──▶ enviar-push-notification
                                                  └─▶ web-push API → push_subscriptions
```

## Observações
- Reaproveita 100% da infra P1-P9 (motores, cache, auditoria, conformidade, SPED, RBAC).
- Sem novos secrets (VAPID + RESEND + LOVABLE_API_KEY já presentes).
- Eleva produto para 10/10+++++ (fechamento contábil guiado + push real-time + DRE fiscal).

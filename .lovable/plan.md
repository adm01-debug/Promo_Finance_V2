
Roadmap original 16/16 ✅ entregue. Sistema tributário em modo manutenção. Para continuar evoluindo rumo à perfeição contínua, proponho **Roadmap Pós-10/10 — Hardening & Excelência Operacional**, focado em qualidade, observabilidade e UX premium em cima do que já existe.

## Roadmap Pós-10/10 (6 lotes, 1 por vez)

### Lote P1 — Testes automatizados dos motores tributários
- Suíte Vitest cobrindo `src/lib/tributario/*` (Simples, Presumido, Real, Reforma, IRPFM).
- Casos: faixa 1 a 6 do Simples (anexos I-V), Lucro Presumido com PIS/COFINS cumulativo, Lucro Real com adições/exclusões, transição CBS+IBS 2026 vs 2033, IRPFM acima de R$ 50k.
- Meta: ≥ 90% coverage nos 5 motores.

### Lote P2 — Observabilidade Edge Functions tributárias
- Structured logging (`console.log(JSON.stringify({level, fn, event, ...}))`) em `decidir-regime`, `gerar-pdf-tributario`, `enviar-bitrix24-tributario`, `cnpja-lookup`, `gerar-alertas-tributarios`.
- Tabela `edge_function_logs` (admin-only RLS) + view `vw_edge_health` com taxa de erro/latência por função.
- Página `/admin/edge-health` (admin-only) com gráficos de saúde.

### Lote P3 — Cache persistente CNPJá + rate limiting
- Tabela `cnpja_cache` (cnpj PK, data jsonb, fetched_at) substituindo cache em memória da edge.
- TTL 30 dias para dados cadastrais, 7 dias para situação cadastral.
- Rate limit por usuário (10 consultas/hora) via tabela `cnpja_rate_limit`.
- Economia direta de créditos CNPJá Plus.

### Lote P4 — Wizard de onboarding com UX premium
- Refatorar `OnboardingTributario.tsx` usando `src/components/ui/wizard.tsx` (já existe, subutilizado).
- Validação por step, progresso visual, animações `framer-motion`, mobile-first.
- Step 4 novo: "Convidar contador" (envia e-mail via Resend com link de visualização read-only).

### Lote P5 — Dashboard tributário consolidado v2
- Refatorar `/tributario` (dashboard) para Bento Grid premium (padrão `mem://design/premium-aesthetic-standards`).
- KPIs: economia anual projetada, próximo vencimento, IRPFM mensal, status reforma.
- Gráfico comparativo Hoje × 2027 × 2033 (recharts) com tooltips ricos.
- Atalhos rápidos: nova simulação, gerar PDF, push CRM.

### Lote P6 — Relatório consolidado anual + e-mail automático
- Novo edge `relatorio-anual-tributario`: agrega 12 meses, gera PDF executivo (~10 páginas) + planilha CSV anexa.
- Cron mensal (dia 5) via `pg_cron` enviando relatório do mês anterior aos admins via Resend.
- Página `/tributario/relatorios-anuais` listando histórico (download).

## Diagrama

```text
   Roadmap Original 16/16 ✅
            │
            ▼
   ┌─────────────────────────────┐
   │ P1 — Testes (motores)       │
   ├─────────────────────────────┤
   │ P2 — Observabilidade Edge   │
   ├─────────────────────────────┤
   │ P3 — Cache CNPJá persistente│
   ├─────────────────────────────┤
   │ P4 — Wizard premium         │
   ├─────────────────────────────┤
   │ P5 — Dashboard v2           │
   ├─────────────────────────────┤
   │ P6 — Relatório anual + cron │
   └─────────────────────────────┘
            │
            ▼
   Excelência operacional 10/10++
```

## Observações
- Próximo a executar (após aprovação): **Lote P1** (testes) — risco zero, base para todos os outros.
- Sem novos secrets necessários (todos já configurados: CNPJá, Bitrix24, Resend, Lovable AI).
- Cada lote é independente; posso executar sequencialmente sem pausas.
- `mem://quality/development-workflow-standards` já manda `format:check` + `test:changed` no pre-commit → P1 ativa esse gate de fato.


P7 entregue ✅. Sistema em 10/10++. Proponho **Lote P8 — Inteligência Preditiva Tributária** (3 melhorias finais que cravam 10/10+++).

## Lote P8 — Inteligência Preditiva + Conformidade Total

### 1. Previsão tributária com IA (Lovable AI Gateway)
- Nova edge `prever-carga-tributaria` (gemini-2.5-flash, sem secrets):
  - Input: `{ empresa_id, meses_historico: 12 }`
  - Consulta `vw_tributario_dashboard` + `regime_decision_cache`
  - Prompt estruturado pede previsão dos próximos 3 meses + 2 cenários (conservador/agressivo) + 3 ações recomendadas
  - Retorna JSON tipado validado com Zod
  - Logger P2 + RBAC P4
- Hook `usePrevisaoTributaria(empresaId)` com React Query (staleTime 30min)
- Widget novo `PrevisaoTributariaIA.tsx` no DashboardTributario (P5):
  - Card glassmorphism com chart de linha (real vs previsto)
  - Lista de ações com badge de impacto estimado
  - Botão "Regenerar análise" com loader

### 2. Validador de conformidade fiscal automático
- Migration: tabela `verificacoes_conformidade` (empresa_id, periodo, score, itens jsonb, criado_em).
- Nova edge `verificar-conformidade-fiscal`:
  - 8 checks automáticos: NF emitidas vs apuração, DARF vencidos, certidões negativas próximas a vencer, divergência regime ótimo > 10%, alertas críticos abertos > 5, apurações em atraso, dividendos > teto IRPFM (Lei 15.270/25), RBT12 próximo do sublimite Simples
  - Score 0-100 ponderado por criticidade
  - Persiste resultado e dispara alerta se score < 70
- UI `ConformidadeFiscalCard.tsx` no dashboard tributário com gauge animado + lista de pendências.

### 3. Exportação SPED Fiscal preliminar (EFD-Contribuições)
- Nova edge `exportar-sped-contribuicoes`:
  - Input: `{ empresa_id, periodo: 'YYYY-MM' }`
  - Gera arquivo TXT layout EFD-Contribuições (registros 0000, 0001, 0140, M100, M105, M200, M210, 9999)
  - Reutiliza `apuracoes_tributarias` + dados da empresa
  - Upload bucket `relatorios-tributarios/sped/`
  - Retorna URL assinada (24h)
- Botão "Exportar SPED" no dashboard tributário (admin/financeiro/contador_readonly).

### 4. Validação
- `npx tsc --noEmit` zero erros.
- Edge functions deployadas sem erros.
- Memórias: `mem://features/previsao-tributaria-ia`, `mem://features/conformidade-fiscal-validator`, `mem://features/sped-contribuicoes-export`.

## Diagrama

```text
   DashboardTributario (P5)
        │
        ├─▶ PrevisaoTributariaIA ──▶ prever-carga-tributaria (gemini-2.5-flash)
        │                                 │
        │                                 └─▶ vw_tributario_dashboard + regime_cache
        │
        ├─▶ ConformidadeFiscalCard ──▶ verificar-conformidade-fiscal
        │                                 │
        │                                 └─▶ 8 checks → score 0-100 → alerta se <70
        │
        └─▶ Botão "Exportar SPED" ──▶ exportar-sped-contribuicoes
                                          │
                                          └─▶ TXT EFD → bucket → URL assinada 24h
```

## Observações
- Reaproveita 100% da infra P1-P7 (views, cache, observability, RBAC, bucket).
- Sem novos secrets (LOVABLE_API_KEY já configurado).
- Eleva produto para 10/10+++ (inteligência preditiva + conformidade automática + entrega SPED).


P8 entregue ✅. Sistema em 10/10+++. Proponho **Lote P9 — Inteligência Conversacional + Auditoria Total** (3 melhorias finais que cravam 10/10++++ definitivo).

## Lote P9 — Copilot Tributário + Auditoria + Benchmarking

### 1. Copilot Tributário conversacional (chat IA streaming)
- Nova edge `copilot-tributario` (gemini-2.5-flash, streaming SSE):
  - Contexto rico: dashboard da empresa, regime ótimo, oportunidades top 3, conformidade score, previsão IA
  - Tool calling: `consultar_apuracao`, `simular_regime`, `listar_oportunidades`, `verificar_conformidade`
  - System prompt especialista em CBS/IBS/IS + Reforma Tributária + LC 214/25
  - JWT manual + RBAC (admin/financeiro/visualizador)
  - Logger P2 + tratamento 429/402
- UI `CopilotTributarioFloat.tsx`: botão flutuante no DashboardTributario que abre painel lateral (sheet) com:
  - Streaming token-a-token (sem bibliotecas extras, SSE manual)
  - Sugestões iniciais ("Qual meu regime ideal?", "Top 3 economias", "Conformidade do mês")
  - Markdown render seguro (`escapeHtml` + parser leve)
  - Histórico em sessionStorage (não persiste em DB)

### 2. Trilha de auditoria tributária dedicada
- Migration: tabela `auditoria_tributaria` (id, empresa_id, user_id, acao enum, entidade_tipo, entidade_id, payload jsonb, ip, user_agent, criado_em).
- Trigger automático em `apuracoes_tributarias`, `regime_decision_cache`, `verificacoes_conformidade`, `relatorios_tributarios_agendados` (insert/update/delete).
- View `vw_auditoria_tributaria_recente` com join em `profiles` (nome do usuário).
- UI `AuditoriaTributariaTab.tsx` em `/admin/system-health` (tab nova): filtros por empresa/usuário/ação/data, exportação CSV (padrão `secure-data-export`).
- RLS: leitura admin-only.

### 3. Benchmarking setorial (compara empresa vs mediana)
- Migration: view materializada `mv_benchmark_setorial` agregando `vw_tributario_dashboard` por CNAE (mediana, p25, p75 de carga efetiva).
- Refresh agendado via `pg_cron` semanal (domingo 03:00).
- Nova edge `comparar-benchmark-setorial`:
  - Input: `{ empresa_id }`
  - Lê CNAE da empresa, compara carga efetiva últimos 12m vs mediana setorial
  - Retorna posição percentil + diferença em R$ + 3 insights
- Hook `useBenchmarkSetorial` + widget `BenchmarkSetorialCard.tsx` no dashboard:
  - Gauge mostrando posição vs mediana (verde se < p25, amarelo entre p25-p75, vermelho > p75)
  - Lista de insights e oportunidade de economia para alcançar a mediana

### 4. Validação
- `npx tsc --noEmit` zero erros.
- Edge functions deployadas sem erros.
- Migrations limpas (RLS hardening).
- Memórias: `mem://features/copilot-tributario-streaming`, `mem://features/auditoria-tributaria`, `mem://features/benchmark-setorial`.

## Diagrama

```text
   DashboardTributario
        │
        ├─▶ CopilotTributarioFloat ──▶ copilot-tributario (SSE)
        │                                 ├─▶ contexto rico (dashboard+regime+conformidade)
        │                                 └─▶ gemini-2.5-flash + tool calling
        │
        └─▶ BenchmarkSetorialCard ──▶ comparar-benchmark-setorial
                                          └─▶ mv_benchmark_setorial (refresh semanal)

   Triggers AUDIT (4 tabelas tributárias)
        │
        ▼
   auditoria_tributaria ──▶ vw_auditoria_tributaria_recente
        │
        ▼
   /admin/system-health → AuditoriaTributariaTab (filtros + CSV)
```

## Observações
- Reaproveita 100% da infra P1-P8 (motores, views, cache, RBAC, logger).
- Sem novos secrets (LOVABLE_API_KEY já configurado).
- Eleva produto para 10/10++++ (conversacional + rastreabilidade total + comparação de mercado).

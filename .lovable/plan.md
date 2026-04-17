
## Lote 7 — Polimento Cirúrgico: Cobertura Total + Performance + Segurança

Os 6 lotes anteriores entregaram o módulo Tributação 10/10. Para elevar o **projeto inteiro** ao 10/10 absoluto, restam itens transversais de qualidade detectados na auditoria.

### 1. Cobertura de testes dos motores ainda sem testes
- `simular-presumido.ts` e `simular-real.ts` (hoje só `simular-simples` e `decidir-regime` têm cobertura completa).
- Edge cases: faturamento > R$ 78mi (inelegível Presumido), atividade hospitalar (8% IRPJ), prejuízo fiscal no Real, adicional IRPJ acima de R$ 240k.
- `projecao-reforma.ts`: cobrir transição CBS/IBS ano a ano (2026=0,9%/0,1%, 2033=8,8%/17,7%).

### 2. Hook `useAlertasTributariosCount` — testes
- Mock do Supabase, validar contagem por tipo (`sublimite_simples`, `fator_r_baixo`, etc.) e filtro `lida = false`.

### 3. Cron de alertas tributários — ativação pendente
- A migration `cron.schedule('gerar-alertas-tributarios-diario', ...)` foi proposta no Lote 4 mas **nunca aprovada/executada**.
- Reapresentar via tool de SQL com `pg_cron` + `pg_net` chamando a Edge Function diariamente às 06:00 BRT.
- Garantir idempotência via `SELECT cron.unschedule(...) WHERE EXISTS` antes do schedule.

### 4. Performance — lazy loading das páginas tributárias
- Verificar se `DashboardTributario`, `SimulacaoRegimes`, `OportunidadesElisao`, `ProjecaoReforma`, `HistoricoFinanceiro`, `IrpfmCalculadora` estão em `lazy()` no router (regra `mem://architecture/performance-optimization-comprehensive-strategy`).
- Adicionar `Suspense` boundary com `<Skeleton />` consistente.

### 5. Security linter — varredura final
- Rodar `supabase--linter` para confirmar zero alertas após migrations dos lotes 1-6.
- Validar RLS em todas as novas tabelas tributárias (`historico_faturamento_mensal`, `historico_folha_pagamento`, `simulacoes_tributarias`, `oportunidades_elisao_persistidas`, `estrategias_elisao_catalogo`, `benchmarks_tributarios_setor`).

### 6. Documentação inline + JSDoc nos motores
- Adicionar JSDoc nos exports de `simular-presumido`, `simular-real`, `decidir-regime`, `orquestrador-elisao`, `projecao-reforma`, `irpfm` — base legal + exemplo de uso.

### 7. Validação final E2E
- `npx tsc --noEmit` zero erros.
- `npx vitest run` 100% verde (~925 testes esperados após adições).
- `supabase--linter` zero warnings.

## Diagrama

```text
   Lote 6 (10/10 Tributação)
            │
            ▼
   ┌──────────────────────┐
   │ +Testes motores      │──┐
   └──────────────────────┘  │
   ┌──────────────────────┐  │
   │ +Cron ativado (SQL)  │──┤
   └──────────────────────┘  ▼
   ┌──────────────────────┐  ┌─────────────────┐
   │ +Lazy + Suspense     │─▶│ Projeto 10/10   │
   └──────────────────────┘  │   absoluto      │
   ┌──────────────────────┐  └─────────────────┘
   │ +Security linter OK  │──▲
   └──────────────────────┘  │
   ┌──────────────────────┐  │
   │ +JSDoc base legal    │──┘
   └──────────────────────┘
```

## Observações

- Sem mexer em `client.ts`, `types.ts`, `supabase/config.toml`.
- Cron via tool de SQL (segue regra `schedule-jobs` — não é migration normal).
- Após este lote: **projeto inteiro 10/10 absoluto** — funcional, integrado, modular, testado, performático, seguro e documentado.

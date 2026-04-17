
## Lote 3 — Motor Tributário: Inteligência + Reforma 2026-2033

Lote 2 entregou elisão fiscal + PDF executivo. Agora fechamos as últimas peças do roadmap Claude.

### 1. Edge Function `gerar-alertas-tributarios` (cron diário)
Cron 06:00 BRT via `pg_cron` + `pg_net`. Para cada empresa ativa:
- **Sublimite Simples** próximo (RBT12 ≥ 90% de R$ 4.8M).
- **Fator R** caindo abaixo de 0,28 (mudança Anexo III→V).
- **Vencimento DAS/DARF** em 5 dias (cruza `apuracoes_tributarias`).
- **Desvio de carga** vs `benchmarks_setoriais` (>20%).
- **Dividendos PF** > R$ 50k/mês (alerta IRPFM 2026).
Persiste em `alertas` (tipo `tributario`).

### 2. Motor IRPFM PF (Lei 15.270/2025)
- `src/lib/tributario/irpfm.ts` — calcula imposto mínimo PF sobre dividendos > R$ 50k/mês com alíquota progressiva (0% a 10%).
- Integrado ao detector de Holding e ao PDF executivo.

### 3. Projeção Reforma Tributária 2026-2033
- `src/lib/tributario/projecao-reforma.ts` — aplica cronograma de transição CBS (0,9% → 8,8%) + IBS (0,1% → 17,7%) + redução proporcional PIS/COFINS/ICMS/ISS por ano.
- `src/pages/tributario/ProjecaoReforma.tsx` — gráfico ano a ano da carga tributária 2026-2033 + impacto setorial.

### 4. Dashboard Consolidado Tributário
- `src/pages/tributario/DashboardTributario.tsx` — painel unificado: regime atual, recomendado, top 3 oportunidades, alertas ativos, próximos vencimentos, projeção 2026.
- Substitui ponto de entrada do menu "Tributação".

### 5. Testes + integração final
- Testes unitários para IRPFM e projeção reforma.
- Menu: novos itens "Projeção Reforma 2026" e "Dashboard Tributário".
- `npx tsc --noEmit` limpo.

## Diagrama

```text
   Dashboard Tributário (entrada)
        │
        ├── Simulação Regimes ──→ PDF Executivo
        ├── Oportunidades Elisão ─→ IRPFM PF
        ├── Projeção 2026-2033 ──→ CBS/IBS
        └── Alertas (cron diário) ─→ tabela alertas
```

## Observações

- Edge Function com `verify_jwt = true` + cron via `pg_cron`/`pg_net`.
- Schema `public`, RLS por `empresa_id` + `has_any_role`.
- Sem mexer em `client.ts`, `types.ts`, `supabase/config.toml` (só adicionar bloco da nova função).
- Após este lote: roadmap Claude 100% coberto.

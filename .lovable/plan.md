
Lote 7 já entregue (959 testes verdes, cron ativo, JSDoc, 0 erros TS). Agora **Lote 8 — Hardening Transversal do Projeto Inteiro** para fechar 10/10 absoluto fora do módulo Tributário.

## Lote 8 — Qualidade Transversal: Segurança, Performance e Testes Globais

### 1. Resolver os 3 warnings do Security Linter
- **`pg_net` em schema public** → mover para schema `extensions` (idempotente, sem quebrar cron já agendado).
- **Leaked Password Protection** → documentar em `mem://security/manual-configuration-requirements` e criar banner de admin em `Configuracoes` apontando o passo manual.
- **Postgres version** (se houver) → documentar como upgrade manual.

### 2. Cobertura de testes para hooks críticos sem cobertura
Auditar `src/hooks/__tests__/` e adicionar testes para os 3 hooks mais críticos sem cobertura:
- `useDashboardMetrics` (consumido pelo Dashboard Executivo).
- `useAlertasPreditivos` (IA + Realtime).
- `useFluxoCaixa` (cálculos centrais).

### 3. Performance — `manualChunks` no Vite
- Verificar `vite.config.ts` e garantir split: `react-vendor`, `recharts`, `supabase`, `pdf` (jspdf+autotable), `radix-ui`.
- Reduzir bundle inicial (regra `mem://architecture/performance-optimization-comprehensive-strategy`).

### 4. A11y global — auditoria final
- `<Skeleton>` boundaries em todas as páginas lazy do router (não só tributárias).
- `aria-label` em IconButtons soltos detectados via grep `<Button.*size="icon"` sem `aria-label`.
- Foco visível padronizado em `index.css` via `:focus-visible` global.

### 5. Modularização — varredura final >400 linhas
- `npx find src -name "*.tsx" -exec wc -l {} +` → refatorar qualquer arquivo restante acima do limite.

### 6. Validação E2E
- `npx tsc --noEmit` zero erros.
- `npx vitest run` 100% verde (~970 testes esperados).
- `supabase--linter` zero warnings (após item 1).

## Diagrama

```text
   Lote 7 (Tributação 10/10)
            │
            ▼
   ┌────────────────────────┐
   │ Linter zero warnings   │──┐
   └────────────────────────┘  │
   ┌────────────────────────┐  ▼
   │ +Tests hooks críticos  │──┐ ┌──────────────────┐
   └────────────────────────┘  ├▶│ Projeto inteiro  │
   ┌────────────────────────┐  │ │   10/10 absoluto │
   │ +Bundle splitting      │──┤ └──────────────────┘
   └────────────────────────┘  │
   ┌────────────────────────┐  │
   │ +A11y global + modul.  │──┘
   └────────────────────────┘
```

## Observações

- Sem mexer em `client.ts`, `types.ts`, `supabase/config.toml`.
- Mover `pg_net` via migration cuidadosa (preservar cron `gerar-alertas-tributarios-diario`).
- Após este lote: **projeto inteiro 10/10 absoluto** — segurança, performance, testes, a11y e modularidade no padrão máximo.

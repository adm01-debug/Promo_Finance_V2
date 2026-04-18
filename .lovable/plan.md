
Lote 9 100% concluído. 988 testes verdes, observabilidade do cron ativa, Edge Function `gerar-alertas-tributarios` resiliente, UX polido. Para sustentar o 10/10 e cravar excelência operacional contínua, proponho **Lote 10 — Excelência Contínua: PWA + Telemetria + Acessibilidade WCAG AA**.

## Lote 10 — PWA + Telemetria + WCAG AA

### 1. PWA — Offline-first para campo
- `vite-plugin-pwa` já instalado? Se não, configurar `manifest.json` + service worker com cache strategy `NetworkFirst` para APIs e `CacheFirst` para assets.
- Ícones 192/512, theme color alinhado ao design system (HSL primary).
- Banner "Instalar app" reutilizável via `useInstallPrompt` hook.

### 2. Telemetria de erros frontend
- Criar `src/lib/telemetry.ts`: wrapper sobre `window.onerror` + `unhandledrejection` que persiste em tabela `frontend_error_logs` (RLS: usuário só vê os próprios; admin vê todos).
- Migration: tabela `frontend_error_logs` (id, user_id, message, stack, url, user_agent, created_at).
- Componente `ErrorBoundary` global no `App.tsx` que reporta para a telemetria.

### 3. Acessibilidade WCAG AA — auditoria final
- Rodar `axe-core` programático em testes Vitest: criar `src/test/a11y.test.tsx` que renderiza páginas críticas (Dashboard, Tributário, Configurações) e valida zero violações WCAG AA.
- Corrigir contrastes detectados, labels faltantes, focus traps em modais.

### 4. Documentação operacional
- `docs/RUNBOOK.md`: procedimentos de incident response (cron falhou, Edge Function timeout, RLS bloqueando user legítimo).
- `docs/ARCHITECTURE.md`: diagrama Mermaid do fluxo Tributação ponta a ponta.

### 5. Validação final
- `npx tsc --noEmit` zero erros.
- `npx vitest run` 100% verde (~1000 testes).
- Lighthouse score ≥ 90 em todas as categorias (PWA, Performance, A11y, Best Practices, SEO).

## Diagrama

```text
   Lote 9 ✅ (988 testes, observability, resiliência)
            │
            ▼
   ┌─────────────────────────┐
   │  PWA offline-first      │──┐
   └─────────────────────────┘  │
   ┌─────────────────────────┐  ▼
   │  Telemetria erros       │  ┌──────────────────────┐
   │  (ErrorBoundary global) │─▶│ Excelência contínua  │
   └─────────────────────────┘  │  10/10 sustentado    │
   ┌─────────────────────────┐  │  + observável        │
   │  WCAG AA + axe-core     │──│  + offline-ready     │
   └─────────────────────────┘  │  + documentado       │
   ┌─────────────────────────┐  └──────────────────────┘
   │  Runbook + Architecture │──▲
   └─────────────────────────┘
```

## Observações
- 1 migration nova: `frontend_error_logs` com RLS estrita.
- Sem mexer em `client.ts`/`types.ts`/`config.toml`.
- Após este lote: projeto entra em modo manutenção excelente — qualquer regressão é detectada via telemetria + a11y tests.

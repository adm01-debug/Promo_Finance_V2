
Lote 10 entregue (telemetria + runbook + arquitetura). Restam PWA e a11y axe-core. Proponho **Lote 11 — PWA Offline-First + WCAG AA Automatizado**.

## Lote 11 — PWA + Acessibilidade WCAG AA

### 1. PWA — Offline-first
- Instalar `vite-plugin-pwa` e configurar em `vite.config.ts`:
  - `registerType: 'autoUpdate'`, manifest com nome "Promo Finance", theme_color HSL primary, ícones 192/512.
  - Workbox: `NetworkFirst` para `/rest/v1/*` e `/functions/v1/*` (Supabase) com fallback offline; `CacheFirst` para assets estáticos (fontes, imagens).
- Substituir o `sw.js` manual atual por SW gerado pelo plugin.
- Hook `useInstallPrompt` (`src/hooks/useInstallPrompt.ts`) que captura `beforeinstallprompt` e expõe `{ canInstall, promptInstall }`.
- Componente `PWAInstallBanner` (top-right discreto, dismissable via localStorage).

### 2. Acessibilidade WCAG AA — auditoria automatizada
- Instalar `vitest-axe` + `axe-core`.
- Criar `src/test/a11y/critical-pages.test.tsx`: renderiza Dashboard, Tributário (Simulação), Configurações com providers mock e valida zero violações WCAG 2.1 AA (`@axe-core/react` rules: color-contrast, label, aria-*, region).
- Corrigir violações detectadas (labels faltantes em modais, contrast em badges secundários, skip-link no header).
- Adicionar `<a href="#main" className="sr-only focus:not-sr-only">Pular para conteúdo</a>` no AppLayout.

### 3. Validação final
- `npx tsc --noEmit` zero erros.
- `npx vitest run` 100% verde (~1000 testes incluindo a11y).
- Build: `vite build` gera `manifest.webmanifest` + `sw.js` Workbox válidos.

## Diagrama

```text
   Lote 10 ✅ (telemetria + docs)
            │
            ▼
   ┌──────────────────────────┐
   │ vite-plugin-pwa          │──┐
   │ + manifest + workbox     │  │
   └──────────────────────────┘  │
   ┌──────────────────────────┐  ▼
   │ useInstallPrompt +       │  ┌────────────────────┐
   │ PWAInstallBanner         │─▶│ 10/10 absoluto     │
   └──────────────────────────┘  │  + offline-ready   │
   ┌──────────────────────────┐  │  + WCAG AA testado │
   │ vitest-axe critical pgs  │──│                    │
   └──────────────────────────┘  └────────────────────┘
   ┌──────────────────────────┐  ▲
   │ Skip-link + label fixes  │──┘
   └──────────────────────────┘
```

## Observações
- Sem migrations. Sem mexer em `client.ts`/`types.ts`/`config.toml`.
- SW via Workbox substitui o `public/sw.js` manual (mais robusto, atualização automática).
- Após este lote: projeto entra em **modo manutenção excelente** — qualquer regressão a11y ou crash é detectado automaticamente.

# AI_RULES

## Tech Stack

- React 18 + TypeScript + Vite 5 (client-side SPA; no server layer).
- React Router DOM v6. Keep ALL routes in `src/App.tsx` and lazy-load pages with `React.lazy` + `Suspense`.
- Supabase for the backend: auth, Postgres database, realtime subscriptions, and storage. Client lives in `src/integrations/supabase/client.ts` (anon key only — never store service keys client-side).
- TanStack React Query v5 for server state, caching, and mutations (query client in `src/lib/queryClient.ts`).
- Tailwind CSS v3 for all styling.
- shadcn/ui (built on Radix UI + class-variance-authority) for UI components; base primitives live in `src/components/ui/`.
- Path alias `@/*` maps to `src/*`.
- Testing/quality: Vitest + Testing Library (+ MSW for mocking), Playwright for e2e, Storybook, ESLint (flat config) + Prettier.

## Library Usage Rules

- **UI components** → shadcn/ui. Import from `@/components/ui/*`. Do NOT edit files inside `src/components/ui/`; create new components when you need custom behavior.
- **Icons** → `lucide-react` only.
- **Styling** → Tailwind CSS classes. Merge conditional classes with the `cn()` helper from `@/lib/utils` (clsx + tailwind-merge).
- **Forms & validation** → `react-hook-form` + `zod` (with `@hookform/resolvers`).
- **Charts** → `recharts`.
- **Toasts / notifications** → `sonner`.
- **Dates** → `date-fns` for formatting/manipulation; `react-day-picker` (via shadcn `Calendar`/date-picker components) for picking dates.
- **Animations** → `framer-motion`.
- **Drag & drop** → `@dnd-kit`.
- **Theme** → `next-themes` via `src/components/theme/ThemeProvider.tsx`.
- **i18n** → `i18next` + `react-i18next` (config in `src/i18n.ts`; default language is pt-BR).
- **Server data** → always use React Query (`useQuery` / `useMutation`). Do NOT call `fetch` directly inside components.
- **Exports** → `xlsx` for Excel, `jspdf` + `jspdf-autotable` for PDF, `file-saver` for downloads.
- **Maps** → `mapbox-gl`.
- **Modals/drawers/dropdowns** → shadcn Dialog, Sheet/Drawer, DropdownMenu, etc. (do not hand-roll these).

## Project Conventions

- All source code goes in `src/`.
- Pages in `src/pages/` (one default-exported component per route). The default page is `src/pages/Index.tsx` — update it when adding new visible components.
- Reusable/feature components in `src/components/<feature>/`.
- Custom hooks in `src/hooks/` (`useXxx` naming).
- Utilities/helpers in `src/lib/`.
- Backend/third-party clients in `src/integrations/`.
- Prefer existing shadcn/ui components and already-installed libraries; do not add new dependencies unless strictly necessary.

## Comandos exatos

- Testes (Vitest, arquivo ou pasta): `npm test -- <path>` — ex.: `npm test -- src/lib/utils.test.ts`.
- Type-check (app): `npx tsc --noEmit -p tsconfig.app.json`.
- Lint: `npm run lint`.
- Rodar os três antes de finalizar qualquer mudança; nenhum pode ter erros novos.

## Regras de Banco de Dados

- Migrations SEMPRE backwards-compatible:
  - Coluna nova → com DEFAULT ou NULLABLE. NUNCA `NOT NULL` sem default em tabela com dados.
  - NUNCA remover/renomear coluna, tabela ou enum sem antes deprecar (manter legada, deprecar no código, remover só em migration posterior).
  - Preferir mudanças aditivas; a migration deve ser reversível.
- O schema TS do Supabase é GERADO em `src/integrations/supabase/types.ts` — NÃO editar à mão. Após migration, regenerar (ex.: `supabase gen types typescript`) e commitar o resultado.

## Fronteiras

SEMPRE FAZER:

- React Query para dados de servidor; shadcn/ui + `cn()` para UI; testes + type-check + lint antes de finalizar.

PERGUNTAR ANTES:

- Adicionar dependência nova (preferir libs já instaladas).
- Mudar rotas (`src/App.tsx`), página default (`src/pages/Index.tsx`) ou config de tooling (vite/tsconfig/eslint).

NUNCA FAZER:

- NUNCA commitar secrets/API keys (`.env*` reais, service keys). Apenas `.env.example` com placeholders.
- NUNCA editar arquivos em `src/components/ui/` (gerados pelo shadcn) — criar componente novo quando precisar.
- NUNCA editar `src/integrations/supabase/types.ts` à mão.
- NUNCA chamar `fetch` direto em componentes (sempre React Query).

## Regras críticas

- YOU MUST: migrations sempre backwards-compatible — colunas novas com default/nullable; deprecar antes de remover/renomear.
- IMPORTANT: nunca usar `service_role`/chaves secretas no client; apenas a anon/publishable key.

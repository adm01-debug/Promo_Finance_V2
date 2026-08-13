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

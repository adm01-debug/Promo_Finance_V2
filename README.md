# Promo Finance

Sistema financeiro corporativo multi-empresa: Contas a Pagar, Contas a Receber, Conciliação Bancária, Cobrança, Contabilidade/SPED e Reforma Tributária — construído com Vite + React + TypeScript + Supabase.

## Stack

- **Frontend**: Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Router
- **Backend**: Supabase (Postgres + RLS, Auth, Edge Functions em Deno)
- **Testes**: Vitest + Testing Library (unit/integração), Playwright (E2E)

## Como rodar localmente

Pré-requisito: Node.js ≥ 18 (ou Bun ≥ 1.1, usado no CI).

```sh
# 1. Clone e entre no diretório
git clone <URL_DO_REPO>
cd promo-finance-v2

# 2. Configure as variáveis de ambiente
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY

# 3. Instale as dependências
npm install            # ou: bun install

# 4. Suba o dev server (porta 8080)
npm run dev
```

O app fica disponível em `http://localhost:8080`.

## Scripts principais

| Script | Descrição |
| --- | --- |
| `npm run dev` | Dev server com HMR (porta 8080) |
| `npm run build` | Build de produção (`dist/`) |
| `npm run lint` / `lint:fix` | ESLint (flat config) |
| `npm run type-check` | `tsc --noEmit` |
| `npm run test` / `test:run` | Suite Vitest (watch / single run) |
| `npm run test:coverage` | Cobertura (v8) |
| `npm run test:e2e` | Playwright E2E (sobe o dev server automaticamente) |
| `npm run format` | Prettier em `src/` |

## Banco de dados

As migrations vivem em `supabase/migrations/` (fonte da verdade do schema) e as edge functions em `supabase/functions/`. Use `npm run db:migrate` (Supabase CLI) para aplicá-las.

> **Nota**: `src/integrations/supabase/types.ts` é gerado a partir do banco. Vários hooks usam `@ts-nocheck` enquanto os types estiverem desatualizados — regenere os types e remova os pragmas.

## Documentação técnica

A arquitetura do projeto é baseada em princípios de **resiliência, telemetria e segurança multi-empresa**. Para entender os fluxos de dados, padrões de código e responsabilidades de cada camada, consulte a documentação técnica oficial:

- **[Arquitetura Principal (Padrões e Camadas)](docs/ARCHITECTURE.md)**: visão geral da stack, decisões de design e fluxo ponta a ponta.
- **[Auditoria Técnica e Resiliência](docs/TECHNICAL_AUDIT_RESILIENCE.md)**: telemetria (breadcrumbs), segurança de webhooks e isolamento organizacional.
- **[Guia de Testes (Unitários e E2E)](docs/TESTING.md)**: como rodar e escrever testes.
- **[Acessibilidade](docs/ACCESSIBILITY.md)**: padrões WCAG seguidos no frontend.
- **[ADR-001 — módulo Lalamove fora de escopo](docs/ADR-001-LALAMOVE-FORA-DE-ESCOPO.md)**: decisão que identifica os 14 objetos de outro projeto que não devem ser recuperados.

Novos desenvolvedores devem começar pelo `ARCHITECTURE.md` para entender como a comunicação com o Supabase é interceptada para logs e como as permissões de empresa são aplicadas automaticamente em todas as rotas.

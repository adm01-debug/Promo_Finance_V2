# Instruções para o GitHub Copilot — Promo Finance V2

Sistema financeiro corporativo multi-empresa da Promo Brindes (SP).
Stack: Vite 6 + React 18 + TypeScript + Tailwind + shadcn/ui + Supabase Cloud.

## Regras obrigatórias

### Banco de dados
- Projeto Supabase: `bwwbeyolnnzppeuhgkcd`
- **Nunca** `supabase_apply_migration` — usar `supabase_db_query` DDL + arquivo em `supabase/migrations/`
- Toda migration = arquivo em `supabase/migrations/` com timestamp YYYYMMDDHHmmss
- `CREATE INDEX` simples (não `CONCURRENTLY` — falha no gateway transacional)
- Views com `security_invoker = true` (padrão desde hardening P15+)
- RLS obrigatório em toda tabela pública

### TypeScript / Frontend
- Componentes em `src/components/` — preferir shadcn/ui existentes antes de criar
- Queries via TanStack Query (não fetch direto)
- Tipos Supabase em `src/integrations/supabase/types.ts` — não editar manualmente
- Sem `any` implícito; sem `// @ts-ignore` sem justificativa documentada

### Edge Functions (Deno)
- Toda função nova precisa de `validatePayload` com Zod (gate de cobertura no CI)
- `verify_jwt` ligado por padrão; desligar só com justificativa em comentário
- Importações por `npm:` ou `jsr:` — não usar CDN externos

### CI / Workflows
- Nunca commitar em `main` — branch `claude/<tipo>-<slug>-<AAMMDD-HHMM>`
- Actions pinadas por SHA de commit (não por tag)
- Secrets de produção só no environment `Production`

### Segurança
- Sem credencial em código, mesmo em teste
- `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` só na função `external-data`
- Policy `USING (true)` exige entrada no allowlist de `test-canonical-db-gates.mjs`

## Contexto de negócio

Módulos ativos: Contas a Pagar/Receber, Conciliação bancária (Open Finance),
NF-e/SEFAZ/SPED, Tributário (Simples/Presumido/Real), Cobrança (Asaas),
Relatórios/DRE, Integrações (Bling ERP, Bitrix24 CRM, WhatsApp IA).

Empresas geridas no mesmo banco Supabase — isolamento garantido por RLS
(`organizacao_id` em todas as tabelas multi-tenant).

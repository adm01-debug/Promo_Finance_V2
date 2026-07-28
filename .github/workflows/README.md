# GitHub Actions — CI

## `deno-tests.yml`

Roda em **todo push** e **todo pull request** (e manualmente via "Run workflow").

### Jobs

1. **`unit-tests`** — sempre executa, 100% offline, sem dependência de secrets:
   - `supabase/functions/sso-test-login/pipeline.test.ts` (12 testes)
   - `supabase/functions/sso-callback/build-profile-sync-delta.test.ts` (10 testes)
   - `supabase/functions/sso-callback/claims.test.ts` (31 testes)

2. **`integration-tests`** — roda contra as edge functions publicadas. Requer:
   - Secret `VITE_SUPABASE_URL`
   - Secret `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key)

   Se os secrets estiverem ausentes, o job emite um `::warning::` e finaliza
   com sucesso — não bloqueia o pipeline em forks.

### Configurar os secrets

No repositório GitHub:

1. **Settings → Secrets and variables → Actions → New repository secret**
2. Adicione:
   - `VITE_SUPABASE_URL` → `https://iikqosstymnnxaujzadw.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` → a anon key do projeto (mesmo valor de `.env`)

### Performance

- Cache de dependências Deno (~/.cache/deno) acelera runs subsequentes.
- `concurrency` cancela runs antigos do mesmo branch.
- `unit-tests` é gate para `integration-tests` — falha rápido se a lógica pura quebrar.

## Gate #25 — Tenant Policy Scope (required check)

O job `tenant-policy-gate` (em `ci.yml`) roda `scripts/security/test-tenant-policy-scope.sql`
em todo PR e bloqueia o merge quando uma tabela multi-inquilino volta a ter policy global:

- **25a** — policy só com `has_role(...)` em tabela com `empresa_id` (direto ou via FK).
- **25b** — policy irrestrita (`USING (true)` / sem predicado) exposta a `anon`/`authenticated`.
- **25c** — divergência reportada pela função canônica `public.gate_25_policies_sem_tenant()`.

Requisitos:

1. Configurar o segredo `DATABASE_URL` do repositório. Em pull request, a ausência
   do segredo **falha** o job (evita gate silenciosamente pulado).
2. Marcar `Gate #25 — Tenant Policy Scope` como *required status check* em
   Settings → Branches → branch protection de `main`/`master`/`develop`.

Correção típica: adicionar `empresa_acessivel(empresa_id)` (ou o vínculo equivalente
via FK) ao `USING`/`WITH CHECK` da policy antes do merge.

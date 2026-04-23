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

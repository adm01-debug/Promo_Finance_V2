# Freight Quest Testing Architecture

This project follows a 10/10 excellence standard for software quality, covering Unit, Integration, E2E, Load, and Fuzz testing.

## 1. Unit Testing (Deno & Vitest)
- **Frontend**: Vitest is used for React hooks and logic.
  - Path: `src/hooks/__tests__` and `src/lib/__tests__`.
  - Quality Gate: 85% Statement Coverage.
- **Backend (Edge Functions)**: Deno's native test runner.
  - Path: `supabase/functions/**/*_test.ts` or `index.test.ts`.
  - Features: Mocking of Supabase client and external APIs.

## 2. Contract & Fuzz Testing
- All Edge Functions and Webhooks use **Strict Zod Schemas**.
- **Fuzz Testing**: An automated fuzzer (`supabase/functions/fuzz_test.ts`) generates malformed payloads (SQLi attempts, XSS, huge strings, missing fields) to ensure robustness.
- Contract validation ensures consistent JSON responses across all endpoints.

## 3. End-to-End (E2E) Testing
- Powered by **Playwright**.
- Covers:
  - Auth flows (Login, Register, Recovery).
  - Financial flows (Contas a Pagar/Receber).
  - Complex logic (OFX Conciliation).
  - Error states (404, Network failures).

## 4. Performance & Stress Testing
- **Load Tester**: Custom utility (`supabase/functions/_shared/load-tester.ts`) to measure Latency, RPS, and Success Rate.
- **Stress Testing**: `supabase/functions/stress_test.ts` simulates high load on critical proxies.
- **Scale Simulator**: `webhook-simulator` uses a `ConcurrencyLimiter` to run thousands of scenarios with controlled resource usage.

## 5. CI/CD Quality Gates
The GitHub Actions pipeline (`.github/workflows/ci.yml`) enforces:
- `bun audit`: Security scans for vulnerabilities.
- `bun run lint`: Code style consistency.
- `bun run type-check`: TypeScript type safety.
- `test:coverage`: Coverage threshold (85%).
- `test:e2e`: Full system validation before deployment.
- `webhook-simulator`: Triggered on main branch to audit data consistency.

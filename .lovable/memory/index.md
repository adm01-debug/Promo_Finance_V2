---
name: index
description: Project memory index
type: reference
---
# Project Memory

## Core
- **Data:** Real Supabase persistence only (ZERO mock data). Ignore GENERATED columns in INSERT/UPDATE operations.
- **Queries:** Use `.maybeSingle()` for 1 record. Centralize `queryKeys` in `queryClient.ts`. Consume optimized views over base tables.
- **Frontend Resilience:** Require explicit null guards `(data || []).map`. Cache via React Query (2-10m). Use `react-window` > 30 items.
- **Security:** Enforce strict RLS (`auth.uid()` or `public.has_any_role()`). Sanitize rich text with `escapeHtml`. Single `AuthContext.tsx`.
- **Architecture:** Independent codebases (copy-paste utils over shared deps). Modularize files > 400 lines.
- **Integrations:** Prefer Open Finance. Proxy 3rd-party APIs via Edge Functions (RBAC, manual JWT validation, sanitization).
- **Styling/UI:** Use Shadcn HSL tokens (no hardcoded hex), Outfit/Plus Jakarta Sans, Premium aesthetic (glassmorphism, Bento grids).
- **Validation:** Mandate `brazilian-validators.ts` for CPF/CNPJ/Phone. Strict enum mapping of 'recebido' to 'pago'.
- **Observability:** Edge Functions tributárias usam `_shared/observability.ts` → `edge_function_logs` → `/admin/edge-health`.

## Memories
- [Edge Function Observability](mem://observability/edge-function-logging-pattern) — `_shared/observability.ts` + `edge_function_logs` + `vw_edge_health` + `/admin/edge-health`
- [Independent Projects](mem://architecture/independent-projects-strategy) — Document reusable utils for copy-paste instead of shared dependencies
- [Role-Based Access Control](mem://auth/rbac-4-role-system) — 4 roles (admin, financeiro, operacional, visualizador) and auto-admin
- [Approval Workflow](mem://features/approval-workflow-system) — Explains `valor_minimo_aprovacao` threshold and observer notes
- [Open Finance Standard](mem://integrations/open-finance-standardized-apis-choice) — Connect to banks via Open Finance APIs
- [Performance Strategy](mem://architecture/performance-optimization-comprehensive-strategy) — React Query cache, Vite manualChunks, lazy loading
- [Virtual Lists](mem://features/virtual-lists-large-dataset-optimization) — Use `react-window` for datasets > 30 items
- [Security Access Policy](mem://auth/security-access-policy) — No admin password sharing, auto-confirm enabled for tests
- [Future Schema Build](mem://architecture/future-schema-build-strategy) — Use `@ts-nocheck` as stubs for unbuilt Supabase schemas
- [Production Persistence](mem://data/production-grade-supabase-persistence) — Zero mock data; use actual Supabase persistence
- [Auth Context Unification](mem://auth/auth-context-unification) — `AuthContext.tsx` is canonical, avoid duplicates
- [Runtime Data Guards](mem://quality/runtime-data-guards) — Explicit null/array guards required for data fetching results
- [Color & Tokens](mem://style/color-and-token-standardization) — Use Shadcn UI HSL tokens over hardcoded hex values
- [Password Recovery](mem://auth/password-recovery-flow) — 8+ chars, upper/number/symbol, redirect after approval
- [Extended Semantic Tokens](mem://design/extended-semantic-tokens) — Tax tokens (--cbs, --ibs) and glassmorphism utils
- [Supabase Query Resilience](mem://backend/supabase-query-resilience) — `.maybeSingle()` over `.single()` to prevent PGRST116
- [RLS Hardening Rules](mem://security/rls-hardening-rules) — No broad authenticated access; enforce uid/role checks
- [Query Client Standardization](mem://architecture/query-client-standardization) — `queryClient.ts` as single source of truth for queryKeys
- [ASAAS Secrets](mem://security/asaas-integration-secrets) — `ASAAS_API_KEY` and `ASAAS_WEBHOOK_TOKEN` requirements
- [Premium Aesthetic](mem://design/premium-aesthetic-standards) — Glassmorphism, deep shadows, glow effects, Framer Motion
- [Development Standards](mem://quality/development-workflow-standards) — Pre-commit format/test checks, `search_path = public`
- [API Proxy Pattern](mem://architecture/external-api-proxy-pattern) — Unified Edge Function proxies with server-side RBAC
- [Security Linter Exceptions](mem://security/database-security-linter-resolved) — Intentional public schemas and pg_cron/pg_net usage
- [Typography Standards](mem://design/unified-design-system-standards) — Outfit for titles, Plus Jakarta Sans for body
- [Secure Data Export](mem://standards/secure-data-export-implementation) — CSV UTF-8 with BOM & ;, PDF via jsPDF/autoTable
- [Optimized Views](mem://performance/consumo-views-otimizadas) — Consume vw_* views with security_invoker over base tables
- [Generated Columns](mem://constraints/database-generated-columns) — Omit GENERATED cols (`vencimento`, `saldo_disponivel`) in INSERT/UPDATE
- [Core Type Safety](mem://quality/type-safety-core-services-standard) — Strict Supabase TS interfaces for core financial services
- [Financial Status Enum](mem://standards/financial-status-mapping-standard) — Strictly map 'recebido' to 'pago'
- [Frontend Audit Log](mem://features/explicit-audit-logging-hook-frontend) — Manually trigger 'log_audit' via `useAuditLog`
- [External Supabase Proxy](mem://integrations/proxy-dados-supabase-externo) — Real-time proxy for 'clientes' and 'fornecedores'
- [Manual JWT Validation](mem://architecture/edge-function-manual-jwt-validation) — `verify_jwt = false` on proxies with manual local validation
- [External Proxy Secrets](mem://integrations/external-supabase-proxy-secrets) — Setup for EXTERNAL_SUPABASE_URL and SERVICE_KEY
- [Proxy Resilience](mem://architecture/external-proxy-resilience) — Secret sanitization (trim, regex JWT) in Edge Functions
- [Real-time Notifications](mem://infrastructure/real-time-notification-system) — `useRealtimeAlertas` for toast and badge updates
- [Reporting Engine](mem://features/advanced-corporate-reporting-engine) — Corporate layout for DRE/Balanço via jsPDF
- [RLS View Audit](mem://security/rls-hardened-tables-audit) — `security_invoker = true` for views, admin-only for HR tables
- [XSS Sanitization](mem://security/xss-sanitization-standard) — Mandatory `escapeHtml` for rich text inputs
- [BR Data Validation](mem://standards/validacao-dados-brasileiros) — Strict validation for CPF/CNPJ/Pix via internal validators
- [Bling ERP Resiliency](mem://integrations/bling-erp-v3-estrategia-e-resiliencia) — Exponential backoff for Bling v3 API
- [Navigation UX](mem://ux/navigation-system-and-shortcuts) — `BackButton` with `parentRouteMap` and keyboard/swipe shortcuts
- [Manual Security Config](mem://security/manual-configuration-requirements) — Supabase 'Leaked Password Protection' requires manual cloud setup
- [Modularization Strategy](mem://architecture/modularization-strategy) — Obligatory refactoring of files > 400 lines into sub-components

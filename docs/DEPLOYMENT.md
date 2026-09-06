# Deployment Guide

## Pré-requisitos

- Node.js 18+
- Bun
- Conta Vercel (time `juca1`)
- Projeto Supabase: `bwwbeyolnnzppeuhgkcd`

## Deploy Vercel (produção)

O projeto está linkado ao repositório `adm01-debug/Promo_Finance_V2`.
Qualquer merge em `main` dispara deploy automático.

### Variáveis de ambiente necessárias

Apenas as listadas em `src/config/env.ts` entram no bundle.
Configure no painel Vercel (Settings → Environment Variables):

```
VITE_SUPABASE_URL                  # obrigatória — valida com Zod no boot
VITE_SUPABASE_PUBLISHABLE_KEY      # obrigatória — chave sb_publishable_…
VITE_SUPABASE_PROJECT_ID           # obrigatória — ref 20 chars
VITE_BLING_CLIENT_ID               # opcional — OAuth Bling
VITE_VAPID_PUBLIC_KEY              # opcional — web push; privada vai no vault
```

> **Não adicione variáveis de backend (SMTP, Bitrix24, etc.) na Vercel.**
> Este é um SPA Vite estático — não existe runtime Node.js na Vercel.
> Variáveis de edge functions vivem no vault do Supabase.

### Deploy manual (emergencial)

```bash
bun install --frozen-lockfile
bun run build:prod
# Upload dist/ para Vercel via CLI ou dashboard
```

### Deploy Automático

Cada push em `main` dispara workflow:
1. Run tests
2. Build production
3. Deploy Vercel via integração GitHub

## Supabase Edge Functions

Secrets das edge functions vivem no vault:
`supabase.com/dashboard/project/bwwbeyolnnzppeuhgkcd/settings/vault`

Inventory completo em `.env.example` (seção EDGE FUNCTIONS).

## GitHub Actions

Secrets necessários para o CI (`.github/workflows/README.md`):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN` (PAT sbp\_… para CLI)
- `CI_GATE_LOG_SECRET` (par com vault do Supabase)
- `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`

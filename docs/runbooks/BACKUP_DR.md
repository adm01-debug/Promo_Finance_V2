# Runbook — Backup & Disaster Recovery

## O que existe hoje

| Camada                                           | Cobertura                                                              | Retenção                                    |
| ------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------- |
| Postgres (Supabase Cloud `bwwbeyolnnzppeuhgkcd`) | Backup diário automático do plano + WAL/PITR conforme plano contratado | Verificar em Dashboard → Database → Backups |
| Código + migrations                              | GitHub (repositório privado)                                           | Permanente                                  |
| Edge Functions                                   | `functions-deploy.yml` (CI) — código no git                            | Permanente                                  |
| Frontend                                         | Vercel — artefato imutável por deploy                                  | Deploys anteriores restauráveis             |
| Secrets/vars                                     | GitHub Secrets + Vercel env vars + Supabase env                        | Não versionados — ver §4                    |
| Storage (Supabase)                               | Buckets do projeto                                                     | **Sem backup externo conhecido — gap**      |

## Gaps reconhecidos (ordem de correção)

1. **Verificar o plano do projeto no Supabase.** PITR (point-in-time recovery)
   exige plano Pro+ com o add-on ativado. Sem PITR, a janela de restore é o
   backup diário (RPO de até 24h).
2. **Buckets do Storage não têm réplica** — documentos de NF-e, certificados e
   comprovantes uploadados vivem só no projeto. Avaliar sync periódico para
   bucket S3/Backblaze fora do Supabase.
3. **Secrets fora de controle de versão** — manter inventário em gerenciador de
   senhas (não no repo): `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`,
   `PROD_DB_URL`, chaves Asaas/Bling/Bitrix24, `NFE_CERT_MASTER_KEY` (cifra os PFX de certificado digital — `nfe-upload-certificado`, `_shared/sefaz/pfx.ts`).

## DR — cenarios

### A. Linha deletada / tabela corrompida (erro humano)

1. Identificar o instante anterior ao incidente.
2. Com PITR: Dashboard → Database → Backups → "Restore to a new project" no
   ponto T−ε; exportar as linhas afetadas (`COPY`/dump parcial) e reimportar em
   prod via `psql $PROD_DB_URL`.
3. Sem PITR: restaurar o backup diário mais recente para projeto temporário,
   idem — aceitando perda de até 24h fora das linhas recuperadas.

### B. Perda do projeto Supabase inteiro

1. Provisionar projeto novo (`supabase link --project-ref NOVO`).
2. Recriar o schema: `supabase migration up` com `supabase/migrations/` do git.
3. Restaurar dados do backup diário mais recente (Supabase Support fornece
   dump para planos pagos; abrir ticket).
4. Repetir o deploy de functions: workflow `functions-deploy.yml`.
5. Apontar `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` da Vercel para o novo
   ref e redeploy.
6. Reexecutar os testes de integridade: `scripts/integrity/*.sh`.

### C. Perda da Vercel / domínio

O frontend é estático (`vite build` → `dist/`). Redeploy em qualquer host
estático (Vercel nova conta, Cloudflare Pages, S3+CloudFront) restaura o app —
o backend Supabase é independente.

### D. Comprometimento de secret

Rotacionar na ordem: `SUPABASE_SERVICE_ROLE_KEY` (Dashboard → Settings → API)
→ keys de webhooks (`x-cron-secret`, `x-mcp-secret`, segredos Asaas/Bling) →
`SUPABASE_ACCESS_TOKEN` (GitHub Secrets) → `PROD_DB_URL`. Cada rotação exige
atualizar GitHub Secrets + env das Edge Functions (`supabase secrets set`).

## Ensaio de DR (semestral)

1. Criar projeto Supabase temporário.
2. `supabase migration up` — medir tempo até schema completo.
3. Restaurar dump parcial e validar contagens de `user_empresas`,
   `lancamentos`, `nfe_documentos`.
4. Registrar data/hora e duração no log de ensaios abaixo.

| Data | Responsável | Cenário testado | Duração | Resultado |
| ---- | ----------- | --------------- | ------- | --------- |
| —    | —           | —               | —       | —         |

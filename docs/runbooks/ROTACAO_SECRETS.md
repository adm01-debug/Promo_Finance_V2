# Runbook: Rotação de Secrets

> Procedimento para trocar credenciais sem downtime — uso em rotação periódica (90 dias) e em resposta a vazamento.

## Onde vive cada segredo

| Local                               | O que                                                                                                                                       | Como trocar                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Supabase > Edge Functions > Secrets | `SUPABASE_SERVICE_ROLE_KEY`, `ASAAS_*`, `BLING_*`, `BITRIX24_*`, `SEFAZ_CRON_SECRET`, `N8N_*`, `MCP_*`, `OPEN_FINANCE_*`, `ALLOWED_ORIGINS` | Dashboard do projeto `bwwbeyolnnzppeuhgkcd` > Edge Functions > Manage Secrets — valor novo vale imediatamente |
| GitHub repo Secrets                 | `SUPABASE_ACCESS_TOKEN`, `PROD_DB_URL`, `STAGING_*`, `TEST_ADMIN_JWT`, tokens de CI                                                         | Settings > Secrets and variables > Actions                                                                    |
| GitHub repo Variables               | `PROD_PROJECT_REF`, `REQUIRED_SECRETS`                                                                                                      | Settings > Secrets and variables > Actions > Variables                                                        |
| Vercel env vars                     | `VITE_SUPABASE_*`, chaves públicas                                                                                                          | Vercel > project > Settings > Environment Variables → redeploy                                                |
| .env local                          | desenvolvimento                                                                                                                             | `cp .env.example .env` e preencher                                                                            |

## Procedimento padrão (planejado)

1. Gerar o valor novo **antes** de revogar o antigo (par overlap quando o provedor permite duas credenciais ativas — Asaas/Bling aceitam).
2. Atualizar o secret no provedor do serviço.
3. Atualizar no Supabase/GitHub/Vercel conforme a tabela.
4. Validar: chamada real à integração ou run do workflow que usa o secret.
5. Revogar o valor antigo no provedor.
6. Registrar na tabela de rotação abaixo.

## Vazamento (urgente)

1. Revogar a credencial comprometida **imediatamente** no provedor — aceita downtime curto.
2. Emitir nova e atualizar nos locais da tabela.
3. Checar logs de uso (`edge_function_logs`, logs do provedor) para acesso indevido.
4. Registrar incidente + post-mortem (ver INCIDENTES.md).

## Rotação periódica

Sugerido: a cada 90 dias — `SUPABASE_SERVICE_ROLE_KEY` **exige** recriar a conexão DB dos workflows (`PROD_DB_URL`/`STAGING_DB_URL` contêm a senha do Postgres; a senha do DB roda separado em Database Settings).

| Secret                       | Última rotação | Responsável |
| ---------------------------- | -------------- | ----------- |
| SUPABASE_SERVICE_ROLE_KEY    | —              | —           |
| ASAAS_API_KEY                | —              | —           |
| BLING\_\*                    | —              | —           |
| BITRIX24\_\*                 | —              | —           |
| SEFAZ_CRON_SECRET            | —              | —           |
| SUPABASE_ACCESS_TOKEN        | —              | —           |
| PROD_DB_URL (senha Postgres) | —              | —           |

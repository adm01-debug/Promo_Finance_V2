# Runbook: Rotação de Secrets

> Procedimento para trocar credenciais sem downtime — uso em rotação periódica (90 dias) e em resposta a vazamento.

## Onde vive cada segredo

| Local                               | O que                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Como trocar                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Supabase > Edge Functions > Secrets | `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `BLING_CLIENT_ID`, `BLING_CLIENT_SECRET`, `BITRIX24_ACCESS_TOKEN`, `BITRIX24_CLIENT_ID`, `BITRIX24_CLIENT_SECRET`, `BITRIX24_DOMAIN`, `CNPJA_API_KEY`, `CRON_DISPATCH_SECRET`, `LOVABLE_API_KEY`, `MAPBOX_ACCESS_TOKEN`, `MFA_ADMIN_ENFORCED`, `N8N_DISPATCH_SECRET`, `NFE_CERT_MASTER_KEY`, `OPENAI_API_KEY`, `OPEN_FINANCE_CLIENT_ID`, `OPEN_FINANCE_REDIRECT_URI`, `REGUA_CRON_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`, `SCHEMA_COMPARE_EXTERNAL_*`, `SEFAZ_CRON_SECRET`, `SLACK_WEBHOOK_URL`, `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `APP_BASE_URL`, `APP_PUBLIC_URL`, `PUBLIC_APP_URL`, `EXTERNAL_SUPABASE_*`, `ALLOWED_ORIGINS` | Dashboard do projeto `bwwbeyolnnzppeuhgkcd` > Edge Functions > Manage Secrets — valor novo vale imediatamente |
| GitHub repo Secrets                 | `SUPABASE_ACCESS_TOKEN`, `PROD_DB_URL`, `STAGING_*`, `TEST_ADMIN_JWT`, tokens de CI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Settings > Secrets and variables > Actions                                                                    |
| GitHub repo Variables               | `PROD_PROJECT_REF`, `REQUIRED_SECRETS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Settings > Secrets and variables > Actions > Variables                                                        |
| Vercel env vars                     | `VITE_SUPABASE_*`, chaves públicas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Vercel > project > Settings > Environment Variables → redeploy                                                |
| .env local                          | desenvolvimento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `cp .env.example .env` e preencher                                                                            |

> **`SUPABASE_SERVICE_ROLE_KEY` não está na tabela de Edge Secrets**: nomes com prefixo `SUPABASE_` são reservados e a tela de Manage Secrets os rejeita — a service role é injetada pela plataforma. A rotação dela se faz em **Dashboard > Settings > API Keys** (novo formato `sb_secret_...`): gerar a nova key, atualizar `SUPABASE_SERVICE_ROLE_KEY` nos secrets dos workflows/GitHub e nas edge functions que a leem do ambiente, validar e só então revogar a antiga. A senha do Postgres do `PROD_DB_URL` roda em Settings > Database.

## Procedimento padrão (planejado)

1. Gerar o valor novo **antes** de revogar o antigo (par overlap quando o provedor permite duas credenciais ativas — Asaas/Bling aceitam).
2. Atualizar o secret no provedor do serviço.
3. Atualizar no Supabase/GitHub/Vercel conforme a tabela.
4. Validar: chamada real à integração ou run do workflow que usa o secret.
5. Revogar o valor antigo no provedor.
6. Registrar na tabela de rotação abaixo.

## Caso especial: `NFE_CERT_MASTER_KEY` (rotação com recriptografia, sem janela)

Esta chave criptografa `empresas_certificados.password_encrypted` via `pgp_sym_encrypt`/`pgp_sym_decrypt` — trocar só o valor do secret torna todas as senhas de certificados já cadastrados indecifráveis e quebra os fluxos SEFAZ. O decrypt das edge fns tem **fallback duplo**: tenta `NFE_CERT_MASTER_KEY` e, falhando, `NFE_CERT_MASTER_KEY_PREV` — é isso que elimina a janela entre recriptografia e troca do secret. Ordem correta:

0. **Pré-requisito — publicar o fallback antes de mexer nos secrets.** O deploy de edge fns é manual e por função (`functions-deploy.yml`): enquanto `sefaz-dfe-puxar` e `sefaz-manifestar` (as únicas que importam `_shared/sefaz/pfx.ts`) estiverem na versão antiga em produção, elas não leem `PREV` e o passo 3 derruba os fluxos. Rode o workflow `functions-deploy` para as duas e valide uma chamada real a cada uma antes de continuar — ou pause os consumidores SEFAZ durante a rotação.
1. Gerar a chave nova (`openssl rand -hex 32`) e anotar a **antiga**.
2. Criar o secret `NFE_CERT_MASTER_KEY_PREV` = **chave antiga** (Edge Functions > Manage Secrets).
3. Atualizar `NFE_CERT_MASTER_KEY` = **chave nova**. A partir daqui as linhas antigas decryptam via `PREV` — nenhum fluxo cai.
4. Recriptografar todos os registros, via SQL no projeto `bwwbeyolnnzppeuhgkcd` (Editor SQL ou `db_query`):
   ```sql
   UPDATE empresas_certificados
   SET password_encrypted = extensions.pgp_sym_encrypt(
     extensions.pgp_sym_decrypt(password_encrypted, 'CHAVE_ANTIGA'),
     'CHAVE_NOVA'
   );
   ```
   Agora todas as linhas abrem com a chave nova na primeira tentativa.
5. Validar: baixar/abrir um certificado existente via app e subir um novo (o encrypt sempre usa a chave nova).
6. Só então **remover** o secret `NFE_CERT_MASTER_KEY_PREV` e descartar a chave antiga de qualquer lugar — guardá-la fora de prod até a validação.

> Se `NFE_CERT_MASTER_KEY_PREV` ficar configurado por engano, linhas antigas continuam funcionando — aceitável temporariamente, mas a remoção é obrigatória para a rotação valer de fato.

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
| NFE_CERT_MASTER_KEY          | —              | —           |

# Validação de segurança dos gateways — 2026-08-27

Esta evidência substitui a aprovação baseada em percentuais ou em scripts SQL
não executáveis. Um cenário só é aprovado quando o teste automatizado executa
o guard que está importado pela função de produção.

## Cenários obrigatórios

- `mcp-query`: bloqueia escrita sem `WHERE`, tautologias booleanas, numéricas e
  por auto-comparação (`id = id`), predicados amplos (`IS NOT NULL`), `OR`,
  múltiplos statements, comentários/literais malformados e subconsultas sem
  confirmação explícita. O guard é deliberadamente conservador: SQL complexo
  exige `allow_all_rows: true`.
- `bling-webhook`: rejeita evento válido sem HMAC/token e só processa payload
  válido após autenticar o corpo bruto.
- Funções com `service_role`: o gate `edge-functions.security.test.ts` exige
  uma chamada concreta a `exigirUsuario`, `exigirPapel`,
  `exigirChamadaInterna`, `authenticateWebhook` ou validação Auth real. A mera
  presença da palavra `Authorization` não aprova mais a função.

## Comandos de aceite

```sh
deno test --allow-env --allow-net --allow-read --no-check \
  supabase/functions/_shared/sql-write-guard_test.ts \
  supabase/functions/bling-webhook/index.test.ts
npx vitest run src/lib/__tests__/edge-functions.security.test.ts
npm run build
```

O aceite é reprovado se qualquer bypass listado acima for aceito, se houver
erro de compilação ou se o build de produção falhar. Consultas administrativas
complexas exigem `allow_all_rows: true`; essa é uma autorização explícita e não
uma aprovação automática do parser.

## Limites e pré-requisitos operacionais

- Este documento não substitui a matriz de privilégios/RLS em runtime. O aceite
  de banco só é completo quando o CI executa os gates que dependem de
  `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e das credenciais
  E2E. Se um gate for pulado por segredo ausente, o resultado é **inconclusivo**,
  nunca aprovado.
- `compare-schemas` requer `SCHEMA_COMPARE_EXTERNAL_URL` e
  `SCHEMA_COMPARE_EXTERNAL_SERVICE_ROLE_KEY`; sem ambos, deve responder 503.
- `bling-webhook` requer `BLING_WEBHOOK_SECRET` (ou o segredo equivalente em
  `integration_secrets`) e opera com rate limit fail-closed.
- Jobs internos que chamam `send-push-notification` devem usar service role ou
  `INTERNAL_SECRET_SEND_PUSH_NOTIFICATION`/`integration_secrets`, sempre com
  `userId` explícito.

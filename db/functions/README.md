# db/functions — Funções SQL versionadas

Este diretório contém as **funções PL/pgSQL do banco de dados** extraídas
das migrations e organizadas por domínio, permitindo:

- **Code review facilitado** — mudanças em funções aparecem como diff limpo.
- **Reuso entre migrations** — nova migration pode fazer `\i` do arquivo.
- **Documentação viva** — funções agrupadas por contexto (auth, webhooks, retention…).

## Convenções

1. Um arquivo `.sql` por função (ou grupo pequeno e coeso).
2. Sempre começar com `CREATE OR REPLACE FUNCTION` — nunca `DROP + CREATE`.
3. Cabeçalho obrigatório:
   ```sql
   -- Função: nome_da_funcao
   -- Descrição: <o que faz e quando é chamada>
   -- Segurança: SECURITY DEFINER | INVOKER
   -- Grants: <roles que executam>
   -- Última migration: 20260711153501_...
   ```
4. Toda função nova precisa de teste pgTAP em `supabase/tests/sql/`.

## Estrutura

```
db/functions/
├── README.md               ← este arquivo
├── retention/              ← retenção de logs, cleanup
├── webhooks/               ← DLQ e retry
├── observability/          ← pg_stat_statements, telemetria
└── auth/                   ← RBAC, has_role, lockout
```

## Aplicação em migrations

Nas migrations, use:
```sql
\i db/functions/webhooks/enqueue_webhook_retry.sql
```

> **Nota:** o Supabase CLI faz `psql -f` das migrations com CWD na raiz do projeto,
> então o path é relativo à raiz.

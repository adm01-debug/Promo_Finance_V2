# Configuração do projeto (Management API, segredos redigidos)

| campo | valor |
|---|---|
| projeto | Promo_Finance_V2 |
| região | us-east-1 |
| URL | https://bwwbeyolnnzppeuhgkcd.supabase.co |
| schemas expostos (PostgREST) | public,graphql_public |
| max_rows (PostgREST) | 1000 |
| extra_search_path | public, extensions |
| PITR | não |
| branches | 3 |

```json
{
  "backups_config": {
    "pitr_enabled": false,
    "region": "us-east-1",
    "walg_enabled": true
  },
  "branches": [
    {
      "git_branch": "claude/fix-supabase-preview-cron-260928-1235",
      "id": "41b67141-271f-40c6-89c5-6d97780a3c57",
      "is_default": false,
      "name": "claude/fix-supabase-preview-cron-260928-1235",
      "persistent": false,
      "status": "MIGRATIONS_FAILED"
    },
    {
      "git_branch": "fix/codex-055358-integracoes-financeiras-clean",
      "id": "de5323f7-ae18-4a5c-b498-6ca5710f842e",
      "is_default": false,
      "name": "fix/codex-055358-integracoes-financeiras-clean",
      "persistent": false,
      "status": "MIGRATIONS_FAILED"
    },
    {
      "git_branch": "main",
      "id": "4600eae2-5170-4f08-a9cc-9d90181dc192",
      "is_default": true,
      "name": "main",
      "persistent": false,
      "status": "MIGRATIONS_FAILED"
    }
  ],
  "custom_hostname": null,
  "network_restrictions": {
    "config": {
      "dbAllowedCidrs": [
        "0.0.0.0/0"
      ],
      "dbAllowedCidrsV6": [
        "::/0"
      ]
    },
    "entitlement": "allowed",
    "status": "applied"
  },
  "pooler_config": [
    {
      "connectionString": "postgresql://postgres.bwwbeyolnnzppeuhgkcd:[REDACTED]@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
      "connection_string": "[REDACTED]",
      "database_type": "PRIMARY",
      "db_host": "aws-1-us-east-1.pooler.supabase.com",
      "db_name": "postgres",
      "db_port": 6543,
      "db_user": "postgres.bwwbeyolnnzppeuhgkcd",
      "default_pool_size": null,
      "identifier": "bwwbeyolnnzppeuhgkcd",
      "is_using_scram_auth": true,
      "max_client_conn": null,
      "pool_mode": "transaction"
    }
  ],
  "postgres_config": {},
  "postgrest_config": {
    "db_extra_search_path": "public, extensions",
    "db_pool": null,
    "db_pool_acquisition_timeout": 10,
    "db_pool_max_idletime": 30,
    "db_pool_max_lifetime": 1800,
    "db_schema": "public,graphql_public",
    "max_rows": 1000
  },
  "project": {
    "created_at": "2026-05-17T18:15:26.724017Z",
    "id": "bwwbeyolnnzppeuhgkcd",
    "name": "Promo_Finance_V2",
    "organization_id": "vercel_icfg_ljrwZ7dvf5ItsrP0HGRAyo48",
    "region": "us-east-1",
    "status": "ACTIVE_HEALTHY"
  },
  "ssl_enforcement": {
    "appliedSuccessfully": true,
    "currentConfig": {
      "database": false
    }
  },
  "url": "https://bwwbeyolnnzppeuhgkcd.supabase.co"
}
```

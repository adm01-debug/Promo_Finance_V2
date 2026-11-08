# public.webhook_dlq

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | sim |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `source` | `text` | não |  |  |  |
| 3 | `event_type` | `text` | sim |  |  |  |
| 4 | `external_id` | `text` | sim |  |  |  |
| 5 | `payload` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 6 | `headers` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 7 | `error_message` | `text` | sim |  |  |  |
| 8 | `attempts` | `integer` | não | `3` |  |  |
| 9 | `first_failed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `last_attempt_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `resolved_by` | `uuid` | sim |  |  |  |
| 13 | `notes` | `text` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| webhook_dlq_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.webhooks_log | webhooks_log_dlq_id_fkey | dlq_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| webhook_dlq_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX webhook_dlq_pkey ON public.webhook_dlq USING btree (id)` |


## Policies (RLS)

### `Admins podem atualizar DLQ`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `Admins podem visualizar DLQ`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_webhook_dlq_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

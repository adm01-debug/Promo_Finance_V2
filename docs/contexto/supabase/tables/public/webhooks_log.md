# public.webhooks_log

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
| usada por views | public.vw_webhooks_recentes |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `source` | `text` | sim |  |  |  |
| 3 | `event_type` | `text` | sim |  |  |  |
| 4 | `status` | `text` | sim | `'received'::text` |  |  |
| 5 | `payload` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 6 | `response` | `jsonb` | sim |  |  |  |
| 7 | `error_message` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `attempts` | `integer` | não | `0` |  |  |
| 10 | `next_retry_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `last_error_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `external_id` | `text` | sim |  |  |  |
| 13 | `processed_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `max_attempts` | `integer` | não | `5` |  |  |
| 15 | `dlq_id` | `uuid` | sim |  |  |  |
| 16 | `last_response` | `jsonb` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_webhooks_log_status | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'success'::text, 'failed'::text, 'retrying'::text, 'dead'::text]))` |  |  | sim |
| webhooks_log_dlq_id_fkey | FOREIGN KEY | `FOREIGN KEY (dlq_id) REFERENCES webhook_dlq(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| webhooks_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_webhooks_log_dlq_id | btree | dlq_id | não | sim | `(dlq_id IS NOT NULL)` | `CREATE INDEX idx_webhooks_log_dlq_id ON public.webhooks_log USING btree (dlq_id) WHERE (dlq_id IS NOT NULL)` |
| idx_webhooks_log_dlq_id_fk | btree | dlq_id | não | sim |  | `CREATE INDEX idx_webhooks_log_dlq_id_fk ON public.webhooks_log USING btree (dlq_id)` |
| ux_webhooks_log_source_external | btree | source, external_id | sim | sim | `(external_id IS NOT NULL)` | `CREATE UNIQUE INDEX ux_webhooks_log_source_external ON public.webhooks_log USING btree (source, external_id) WHERE (external_id IS NOT NULL)` |
| webhooks_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX webhooks_log_pkey ON public.webhooks_log USING btree (id)` |


## Policies (RLS)

### `webhooks_log_admin_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `webhooks_log_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

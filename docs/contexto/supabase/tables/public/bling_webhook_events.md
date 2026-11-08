# public.bling_webhook_events

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `event_type` | `text` | sim |  |  |  |
| 4 | `payload` | `jsonb` | sim |  |  |  |
| 5 | `processed` | `boolean` | não | `false` |  |  |
| 6 | `processed_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `error_message` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `module` | `text` | não |  |  |  |
| 10 | `resource_id` | `text` | sim |  |  |  |
| 11 | `retries` | `integer` | não | `0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bling_webhook_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| bling_webhook_events_retries_check | CHECK | `CHECK (retries >= 0 AND retries <= 50)` |  |  | sim |
| bling_webhook_processed_coerente | CHECK | `CHECK (processed = false OR processed_at IS NOT NULL)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bling_webhook_events_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bling_webhook_events_pkey ON public.bling_webhook_events USING btree (id)` |
| idx_bling_webhook_events_created | btree | created_at | não | sim |  | `CREATE INDEX idx_bling_webhook_events_created ON public.bling_webhook_events USING btree (created_at DESC)` |


## Policies (RLS)

### `bling_webhook_events_admin_select`

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

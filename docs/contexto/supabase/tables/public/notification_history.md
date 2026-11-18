# public.notification_history

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `body` | `text` | sim |  |  |  |
| 5 | `channel` | `text` | não | `'inapp'::text` |  |  |
| 6 | `status` | `text` | não | `'sent'::text` |  |  |
| 7 | `error_message` | `text` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | sim |  |  |  |
| 9 | `source_ref` | `text` | sim |  |  |  |
| 10 | `read_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `source` | `text` | não | `'saved_filter_subscription'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notification_history_channel_check | CHECK | `CHECK (channel = ANY (ARRAY['inapp'::text, 'push'::text, 'email'::text]))` |  |  | sim |
| notification_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| notification_history_status_check | CHECK | `CHECK (status = ANY (ARRAY['sent'::text, 'failed'::text, 'queued'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_notification_history_source | btree | source, source_ref | não | sim |  | `CREATE INDEX idx_notification_history_source ON public.notification_history USING btree (source, source_ref)` |
| idx_notification_history_user_created | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_notification_history_user_created ON public.notification_history USING btree (user_id, created_at DESC)` |
| idx_notification_history_user_unread | btree | user_id, read_at | não | sim | `(read_at IS NULL)` | `CREATE INDEX idx_notification_history_user_unread ON public.notification_history USING btree (user_id, read_at) WHERE (read_at IS NULL)` |
| notification_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX notification_history_pkey ON public.notification_history USING btree (id)` |


## Policies (RLS)

### `notification_history_owner`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

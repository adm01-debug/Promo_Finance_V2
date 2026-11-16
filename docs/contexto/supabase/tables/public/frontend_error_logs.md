# public.frontend_error_logs

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | sim |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `error_message` | `text` | sim |  |  |  |
| 4 | `error_stack` | `text` | sim |  |  |  |
| 5 | `url` | `text` | sim |  |  |  |
| 6 | `user_agent` | `text` | sim |  |  |  |
| 7 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `severity` | `text` | não | `'error'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| frontend_error_logs_payload_bounds | CHECK | `CHECK (length(COALESCE(error_message, ''::text)) <= 2000 AND length(COALESCE(error_stack, ''::text)) <= 8000 AND length(COALESCE(url, ''::text)) <= 2000 AND length(COALESCE(user_agent, ''::text)) <= 500 AND pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384)` |  |  | sim |
| frontend_error_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id, created_at)` |  |  | sim |
| frontend_error_logs_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| frontend_error_logs_pkey | btree | id, created_at | sim | sim |  | `CREATE UNIQUE INDEX frontend_error_logs_pkey ON public.frontend_error_logs USING btree (id, created_at)` |


## Policies (RLS)

### `Admins can view frontend errors`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `frontend_error_anon_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | anon |
| USING |  |
| WITH CHECK | `true` |

### `frontend_error_user_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((( SELECT auth.uid() AS uid) = user_id) OR (user_id IS NULL))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_frontend_error_logs_sanitize | BEFORE | INSERT | ROW | enabled | public.frontend_error_logs_sanitize |


## Grants

| role | privilégios |
|---|---|
| anon | INSERT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |


Grants por coluna:

| coluna | role | privilégios |
|---|---|---|
| error_message | authenticated | INSERT |
| error_stack | authenticated | INSERT |
| metadata | authenticated | INSERT |
| severity | authenticated | INSERT |
| url | authenticated | INSERT |
| user_agent | authenticated | INSERT |
| user_id | authenticated | INSERT |

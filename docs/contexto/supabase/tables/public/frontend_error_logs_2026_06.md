# public.frontend_error_logs_2026_06

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
| frontend_error_logs_2026_06_pkey | PRIMARY KEY | `PRIMARY KEY (id, created_at)` |  |  | sim |
| frontend_error_logs_payload_bounds | CHECK | `CHECK (length(COALESCE(error_message, ''::text)) <= 2000 AND length(COALESCE(error_stack, ''::text)) <= 8000 AND length(COALESCE(url, ''::text)) <= 2000 AND length(COALESCE(user_agent, ''::text)) <= 500 AND pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384)` |  |  | sim |
| frontend_error_logs_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| frontend_error_logs_2026_06_pkey | btree | id, created_at | sim | sim |  | `CREATE UNIQUE INDEX frontend_error_logs_2026_06_pkey ON public.frontend_error_logs_2026_06 USING btree (id, created_at)` |


## Policies (RLS)

### `admin_only_frontend_error_logs_2026_06`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |


## Triggers

_nenhum_


## Grants

_nenhum_

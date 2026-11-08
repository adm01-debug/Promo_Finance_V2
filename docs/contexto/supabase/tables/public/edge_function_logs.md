# public.edge_function_logs

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
| usada por views | public.vw_edge_health |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `function_name` | `text` | não |  |  |  |
| 3 | `event` | `text` | sim |  |  |  |
| 4 | `level` | `text` | não | `'info'::text` |  |  |
| 5 | `error_message` | `text` | sim |  |  |  |
| 6 | `duration_ms` | `integer` | sim |  |  |  |
| 7 | `status_code` | `integer` | sim |  |  |  |
| 8 | `user_id` | `uuid` | sim |  |  |  |
| 9 | `metadata` | `jsonb` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| edge_function_logs_level_check | CHECK | `CHECK (level = ANY (ARRAY['debug'::text, 'info'::text, 'warn'::text, 'error'::text]))` |  |  | sim |
| edge_function_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| edge_function_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX edge_function_logs_pkey ON public.edge_function_logs USING btree (id)` |
| idx_edge_logs_created | btree | created_at | não | sim |  | `CREATE INDEX idx_edge_logs_created ON public.edge_function_logs USING btree (created_at DESC)` |
| idx_edge_logs_function | btree | function_name, created_at | não | sim |  | `CREATE INDEX idx_edge_logs_function ON public.edge_function_logs USING btree (function_name, created_at DESC)` |


## Policies (RLS)

### `edge_function_logs_admin_select`

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

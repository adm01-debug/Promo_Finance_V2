# public.runtime_error_logs

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `error_id` | `text` | não |  |  |  |
| 3 | `error_name` | `text` | não |  |  |  |
| 4 | `error_message` | `text` | não |  |  |  |
| 5 | `stack_trace` | `text` | sim |  |  |  |
| 6 | `component_stack` | `text` | sim |  |  |  |
| 7 | `source` | `text` | não | `'unknown'::text` |  |  |
| 8 | `severity` | `text` | não | `'error'::text` |  |  |
| 9 | `url` | `text` | sim |  |  |  |
| 10 | `user_agent` | `text` | sim |  |  |  |
| 11 | `user_id` | `uuid` | sim |  |  |  |
| 12 | `app_version` | `text` | sim |  |  |  |
| 13 | `fingerprint` | `text` | sim |  |  |  |
| 14 | `occurrence_count` | `integer` | não | `1` |  |  |
| 15 | `first_seen_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `last_seen_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 18 | `resolved` | `boolean` | não | `false` |  |  |
| 19 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 20 | `resolved_by` | `uuid` | sim |  |  |  |
| 21 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| runtime_error_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| runtime_error_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX runtime_error_logs_pkey ON public.runtime_error_logs USING btree (id)` |


## Policies (RLS)

### `Admins can delete error logs`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can update error logs`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role))` |
| WITH CHECK |  |

### `Admins managers can view error logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role))` |
| WITH CHECK |  |

### `Authenticated can insert error logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.frontend_performance_logs

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `metric_name` | `text` | não |  |  |  |
| 4 | `value` | `double precision` | não |  |  |  |
| 5 | `rating` | `text` | sim |  |  |  |
| 6 | `url` | `text` | sim |  |  |  |
| 7 | `user_agent` | `text` | sim |  |  |  |
| 8 | `navigation_type` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| frontend_performance_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| frontend_performance_logs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| frontend_performance_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX frontend_performance_logs_pkey ON public.frontend_performance_logs USING btree (id)` |
| idx_frontend_performance_logs_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_frontend_performance_logs_user_id_fk ON public.frontend_performance_logs USING btree (user_id)` |
| idx_performance_logs_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_performance_logs_created_at ON public.frontend_performance_logs USING btree (created_at)` |


## Policies (RLS)

### `Admins can view performance logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Authenticated users can insert performance logs`

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

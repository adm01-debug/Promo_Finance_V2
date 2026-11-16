# public.audit_logs

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | sim |
| policies | 3 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `action` | `text` | não |  |  |  |
| 4 | `table_name` | `text` | sim |  |  |  |
| 5 | `record_id` | `text` | sim |  |  |  |
| 6 | `old_data` | `jsonb` | sim |  |  |  |
| 7 | `new_data` | `jsonb` | sim |  |  |  |
| 8 | `details` | `text` | sim |  |  |  |
| 9 | `ip_address` | `text` | sim |  |  |  |
| 10 | `user_agent` | `text` | sim |  |  |  |
| 11 | `user_email` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| audit_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id, created_at)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| audit_logs_pkey | btree | id, created_at | sim | sim |  | `CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id, created_at)` |
| idx_audit_logs_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC)` |
| idx_audit_logs_table | btree | table_name, created_at | não | sim |  | `CREATE INDEX idx_audit_logs_table ON public.audit_logs USING btree (table_name, created_at DESC)` |
| idx_audit_logs_user_id | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id, created_at DESC)` |


## Policies (RLS)

### `Admins can view audit logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `System can insert audit logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `true` |

### `audit_logs_insert_self_attributed`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND ((user_email IS NULL) OR (user_email = ( SELECT (auth.jwt() ->> 'email'::text)))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | INSERT, SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

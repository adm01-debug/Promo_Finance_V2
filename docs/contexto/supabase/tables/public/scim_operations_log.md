# public.scim_operations_log

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
| 2 | `operation` | `text` | não |  |  |  |
| 3 | `resource_type` | `text` | sim |  |  |  |
| 4 | `resource_id` | `text` | sim |  |  |  |
| 5 | `payload` | `jsonb` | sim |  |  |  |
| 6 | `status_code` | `integer` | sim |  |  |  |
| 7 | `error_message` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `token_id` | `uuid` | sim |  |  |  |
| 10 | `empresa_id` | `uuid` | sim |  |  |  |
| 11 | `external_id` | `text` | sim |  |  |  |
| 12 | `user_id` | `uuid` | sim |  |  |  |
| 13 | `request_body` | `jsonb` | sim |  |  |  |
| 14 | `response_body` | `jsonb` | sim |  |  |  |
| 15 | `duration_ms` | `integer` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| scim_operations_log_duration_ms_check | CHECK | `CHECK (duration_ms IS NULL OR duration_ms >= 0)` |  |  | sim |
| scim_operations_log_operation_check | CHECK | `CHECK (operation = ANY (ARRAY['create'::text, 'read'::text, 'list'::text, 'replace'::text, 'patch'::text, 'delete'::text, 'deactivate'::text, 'error'::text]))` |  |  | sim |
| scim_operations_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| scim_operations_log_resource_type_check | CHECK | `CHECK (resource_type = ANY (ARRAY['User'::text, 'Group'::text, 'Schema'::text, 'ResourceType'::text, 'ServiceProviderConfig'::text, 'Bulk'::text]))` |  |  | sim |
| scim_operations_log_status_code_check | CHECK | `CHECK (status_code >= 100 AND status_code <= 599)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_scim_operations_log_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_scim_operations_log_empresa_id ON public.scim_operations_log USING btree (empresa_id)` |
| scim_operations_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX scim_operations_log_pkey ON public.scim_operations_log USING btree (id)` |


## Policies (RLS)

### `Admins view scim logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `scim_operations_log_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

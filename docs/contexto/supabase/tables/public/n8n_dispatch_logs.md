# public.n8n_dispatch_logs

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
| 2 | `config_id` | `uuid` | sim |  |  |  |
| 3 | `event_type` | `text` | não |  |  |  |
| 4 | `risk_score` | `integer` | sim |  |  |  |
| 5 | `payload` | `jsonb` | não |  |  |  |
| 6 | `response_status` | `integer` | sim |  |  |  |
| 7 | `response_body` | `text` | sim |  |  |  |
| 8 | `success` | `boolean` | não | `false` |  |  |
| 9 | `attempt` | `integer` | não | `1` |  |  |
| 10 | `duration_ms` | `integer` | sim |  |  |  |
| 11 | `error` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| n8n_dispatch_logs_config_id_fkey | FOREIGN KEY | `FOREIGN KEY (config_id) REFERENCES n8n_workflow_configs(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| n8n_dispatch_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| n8n_dispatch_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX n8n_dispatch_logs_pkey ON public.n8n_dispatch_logs USING btree (id)` |


## Policies (RLS)

### `Admins e managers visualizam logs n8n`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_

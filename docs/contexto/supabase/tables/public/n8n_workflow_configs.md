# public.n8n_workflow_configs

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `event_type` | `text` | não |  |  |  |
| 4 | `webhook_url` | `text` | não |  |  |  |
| 5 | `enabled` | `boolean` | não | `true` |  |  |
| 6 | `min_risk_score` | `integer` | não | `0` |  |  |
| 7 | `max_risk_score` | `integer` | não | `100` |  |  |
| 8 | `filters` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 9 | `headers` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 10 | `retry_count` | `integer` | não | `3` |  |  |
| 11 | `timeout_ms` | `integer` | não | `15000` |  |  |
| 12 | `created_by` | `uuid` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| n8n_workflow_configs_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| n8n_workflow_configs_event_type_check | CHECK | `CHECK (event_type = ANY (ARRAY['driver_approval'::text, 'driver_incident'::text, 'alert_triggered'::text, 'order_status_change'::text, 'route_deviation'::text, 'driver_stopped'::text, 'late_delivery'::text, 'risk_score_high'::text, 'custom'::text]))` |  |  | sim |
| n8n_workflow_configs_max_risk_score_check | CHECK | `CHECK (max_risk_score >= 0 AND max_risk_score <= 100)` |  |  | sim |
| n8n_workflow_configs_min_risk_score_check | CHECK | `CHECK (min_risk_score >= 0 AND min_risk_score <= 100)` |  |  | sim |
| n8n_workflow_configs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.n8n_dispatch_logs | n8n_dispatch_logs_config_id_fkey | config_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_n8n_workflow_configs_created_by | btree | created_by | não | sim | `(created_by IS NOT NULL)` | `CREATE INDEX idx_n8n_workflow_configs_created_by ON public.n8n_workflow_configs USING btree (created_by) WHERE (created_by IS NOT NULL)` |
| n8n_workflow_configs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX n8n_workflow_configs_pkey ON public.n8n_workflow_configs USING btree (id)` |


## Policies (RLS)

### `Admins e managers gerenciam configs n8n`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role))` |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_n8n_cfg_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

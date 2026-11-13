# public.alert_configurations

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `alert_type` | `alert_type` | não |  |  |  |
| 3 | `channel` | `text` | não |  |  |  |
| 4 | `is_enabled` | `boolean` | sim | `true` |  |  |
| 5 | `recipients` | `text[]` | sim | `'{}'::text[]` |  |  |
| 6 | `config` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `name` | `text` | sim |  |  |  |
| 10 | `message_template` | `text` | sim |  |  |  |
| 11 | `min_interval_seconds` | `integer` | sim | `300` |  |  |
| 12 | `notify_whatsapp` | `boolean` | sim | `false` |  |  |
| 13 | `whatsapp_numbers` | `text[]` | sim |  |  |  |
| 14 | `notify_email` | `boolean` | sim | `false` |  |  |
| 15 | `email_addresses` | `text[]` | sim |  |  |  |
| 16 | `notify_slack` | `boolean` | sim | `false` |  |  |
| 17 | `slack_channels` | `text[]` | sim |  |  |  |
| 18 | `notify_sms` | `boolean` | sim | `false` |  |  |
| 19 | `sms_numbers` | `text[]` | sim |  |  |  |
| 20 | `notify_bitrix24_task` | `boolean` | sim | `false` |  |  |
| 21 | `bitrix24_user_ids` | `integer[]` | sim |  |  |  |
| 22 | `notify_n8n_webhook` | `boolean` | sim | `false` |  |  |
| 23 | `n8n_webhook_url` | `text` | sim |  |  |  |
| 24 | `conditions` | `jsonb` | sim |  |  |  |
| 25 | `created_by` | `text` | sim |  |  |  |
| 26 | `empresa_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| alert_configurations_alert_type_channel_key | UNIQUE | `UNIQUE (alert_type, channel)` |  |  | sim |
| alert_configurations_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| alert_configurations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| alert_configurations_alert_type_channel_key | btree | alert_type, channel | sim | sim |  | `CREATE UNIQUE INDEX alert_configurations_alert_type_channel_key ON public.alert_configurations USING btree (alert_type, channel)` |
| alert_configurations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX alert_configurations_pkey ON public.alert_configurations USING btree (id)` |
| idx_alert_configurations_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_alert_configurations_empresa_id ON public.alert_configurations USING btree (empresa_id)` |


## Policies (RLS)

> ⚠️ RLS habilitado **sem policies**: nenhum acesso via API (anon/authenticated).



## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_alert_configurations_set_empresa | BEFORE | INSERT | ROW | enabled | public.set_empresa_id_default |
| trg_audit_alert_configurations | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_generic |
| update_alert_config_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

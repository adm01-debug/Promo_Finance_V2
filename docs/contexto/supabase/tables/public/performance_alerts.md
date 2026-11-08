# public.performance_alerts

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.mv_performance_alerts_weekly |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `source` | `text` | não |  |  |  |
| 3 | `alert_key` | `text` | não |  |  |  |
| 4 | `alert_hour` | `timestamp with time zone` | não | `date_trunc('hour'::text, now())` |  |  |
| 5 | `severity` | `text` | não |  |  |  |
| 6 | `reason` | `text` | não |  |  |  |
| 7 | `current_value` | `numeric` | não |  |  |  |
| 8 | `baseline_value` | `numeric` | sim |  |  |  |
| 9 | `ratio` | `numeric` | sim |  |  |  |
| 10 | `sample_count` | `integer` | sim |  |  |  |
| 11 | `query_snippet` | `text` | sim |  |  |  |
| 12 | `metadata` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `resolved_reason` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| performance_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| performance_alerts_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |
| performance_alerts_source_alert_key_alert_hour_key | UNIQUE | `UNIQUE (source, alert_key, alert_hour)` |  |  | sim |
| performance_alerts_source_check | CHECK | `CHECK (source = ANY (ARRAY['query_telemetry'::text, 'pg_stat_statements'::text, 'cron'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_perf_alerts_created_severity | btree | created_at, severity | não | sim |  | `CREATE INDEX idx_perf_alerts_created_severity ON public.performance_alerts USING btree (created_at DESC, severity)` |
| performance_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX performance_alerts_pkey ON public.performance_alerts USING btree (id)` |
| performance_alerts_source_alert_key_alert_hour_key | btree | source, alert_key, alert_hour | sim | sim |  | `CREATE UNIQUE INDEX performance_alerts_source_alert_key_alert_hour_key ON public.performance_alerts USING btree (source, alert_key, alert_hour)` |


## Policies (RLS)

### `Admins podem ler alertas de performance`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| performance_alerts_notify_trigger | AFTER | INSERT | ROW | enabled | public.notify_performance_alert_trigger |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

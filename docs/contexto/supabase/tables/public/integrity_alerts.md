# public.integrity_alerts

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
| usada por views | public.v_sefaz_observability |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `domain` | `text` | não |  |  |  |
| 3 | `invariant` | `text` | não |  |  |  |
| 4 | `severity` | `text` | não |  |  |  |
| 5 | `alert_hour` | `timestamp with time zone` | não | `date_trunc('hour'::text, now())` |  |  |
| 6 | `affected_count` | `bigint` | não | `0` |  |  |
| 7 | `reason` | `text` | não |  |  |  |
| 8 | `sample_ids` | `uuid[]` | sim | `'{}'::uuid[]` |  |  |
| 9 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 10 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `resolved_by` | `uuid` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `resolved_reason` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| integrity_alerts_domain_check | CHECK | `CHECK (domain = ANY (ARRAY['entrega'::text, 'screening'::text, 'financeiro'::text, 'nfe'::text, 'nfe_sefaz'::text, 'tributario'::text]))` |  |  | sim |
| integrity_alerts_domain_invariant_alert_hour_key | UNIQUE | `UNIQUE (domain, invariant, alert_hour)` |  |  | sim |
| integrity_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| integrity_alerts_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_integrity_alerts_domain | btree | domain, severity, created_at | não | sim |  | `CREATE INDEX idx_integrity_alerts_domain ON public.integrity_alerts USING btree (domain, severity, created_at DESC)` |
| idx_integrity_alerts_open | btree | created_at | não | sim | `(resolved_at IS NULL)` | `CREATE INDEX idx_integrity_alerts_open ON public.integrity_alerts USING btree (created_at DESC) WHERE (resolved_at IS NULL)` |
| integrity_alerts_domain_invariant_alert_hour_key | btree | domain, invariant, alert_hour | sim | sim |  | `CREATE UNIQUE INDEX integrity_alerts_domain_invariant_alert_hour_key ON public.integrity_alerts USING btree (domain, invariant, alert_hour)` |
| integrity_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX integrity_alerts_pkey ON public.integrity_alerts USING btree (id)` |


## Policies (RLS)

### `integrity_alerts_admin_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `integrity_alerts_service_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_integrity_alerts_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

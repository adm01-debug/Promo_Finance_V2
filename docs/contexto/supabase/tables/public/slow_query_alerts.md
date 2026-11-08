# public.slow_query_alerts

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
| 2 | `queryid` | `bigint` | não |  |  |  |
| 3 | `query_normalized` | `text` | não |  |  |  |
| 4 | `calls` | `bigint` | não | `0` |  |  |
| 5 | `mean_exec_ms` | `numeric(12,3)` | não | `0` |  |  |
| 6 | `total_exec_ms` | `numeric(14,3)` | não | `0` |  |  |
| 7 | `max_exec_ms` | `numeric(12,3)` | não | `0` |  |  |
| 8 | `rows_returned` | `bigint` | não | `0` |  |  |
| 9 | `severity` | `text` | não | `'warning'::text` |  |  |
| 10 | `captured_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| slow_query_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| slow_query_alerts_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_slow_query_alerts_captured_at | btree | captured_at | não | sim |  | `CREATE INDEX idx_slow_query_alerts_captured_at ON public.slow_query_alerts USING btree (captured_at DESC)` |
| idx_slow_query_alerts_severity | btree | severity, captured_at | não | sim |  | `CREATE INDEX idx_slow_query_alerts_severity ON public.slow_query_alerts USING btree (severity, captured_at DESC)` |
| slow_query_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX slow_query_alerts_pkey ON public.slow_query_alerts USING btree (id)` |


## Policies (RLS)

### `Admins podem visualizar slow_query_alerts`

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

_nenhum_

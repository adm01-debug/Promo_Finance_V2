# public.slo_metrics_diarias

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
| 2 | `data` | `date` | não |  |  |  |
| 3 | `servico` | `text` | não |  |  |  |
| 4 | `disponibilidade` | `numeric(5,4)` | sim |  |  |  |
| 5 | `latencia_p50_ms` | `integer` | sim |  |  |  |
| 6 | `latencia_p95_ms` | `integer` | sim |  |  |  |
| 7 | `latencia_p99_ms` | `integer` | sim |  |  |  |
| 8 | `total_requests` | `bigint` | sim |  |  |  |
| 9 | `error_rate` | `numeric(5,4)` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `total_requisicoes` | `bigint` | não | `0` |  |  |
| 12 | `taxa_erro_pct` | `numeric` | não | `0` |  |  |
| 13 | `uptime_pct` | `numeric` | não | `100` |  |  |
| 14 | `cron_jobs_sucesso` | `integer` | não | `0` |  |  |
| 15 | `cron_jobs_falha` | `integer` | não | `0` |  |  |
| 16 | `edges_health` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 17 | `calculado_em` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| slo_metrics_diarias_data_servico_key | UNIQUE | `UNIQUE (data, servico)` |  |  | sim |
| slo_metrics_diarias_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| slo_metrics_diarias_taxa_erro_pct_check | CHECK | `CHECK (taxa_erro_pct >= 0::numeric AND taxa_erro_pct <= 100::numeric)` |  |  | sim |
| slo_metrics_diarias_uptime_pct_check | CHECK | `CHECK (uptime_pct >= 0::numeric AND uptime_pct <= 100::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| slo_metrics_diarias_data_servico_key | btree | data, servico | sim | sim |  | `CREATE UNIQUE INDEX slo_metrics_diarias_data_servico_key ON public.slo_metrics_diarias USING btree (data, servico)` |
| slo_metrics_diarias_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX slo_metrics_diarias_pkey ON public.slo_metrics_diarias USING btree (id)` |


## Policies (RLS)

### `slo_metrics_admin_select`

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

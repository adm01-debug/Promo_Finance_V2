# public.pg_stat_statements_baseline

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
| 2 | `label` | `text` | não |  |  |  |
| 3 | `queryid` | `bigint` | sim |  |  |  |
| 4 | `query` | `text` | sim |  |  |  |
| 5 | `calls` | `bigint` | sim |  |  |  |
| 6 | `total_exec_time` | `double precision` | sim |  |  |  |
| 7 | `mean_exec_time` | `double precision` | sim |  |  |  |
| 8 | `max_exec_time` | `double precision` | sim |  |  |  |
| 9 | `rows` | `bigint` | sim |  |  |  |
| 10 | `shared_blks_hit` | `bigint` | sim |  |  |  |
| 11 | `shared_blks_read` | `bigint` | sim |  |  |  |
| 12 | `captured_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pg_stat_statements_baseline_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_pgss_baseline_captured_at | btree | captured_at | não | sim |  | `CREATE INDEX idx_pgss_baseline_captured_at ON public.pg_stat_statements_baseline USING btree (captured_at DESC)` |
| idx_pgss_baseline_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_pgss_baseline_created_at ON public.pg_stat_statements_baseline USING btree (created_at DESC)` |
| idx_pgss_baseline_label | btree | label | não | sim |  | `CREATE INDEX idx_pgss_baseline_label ON public.pg_stat_statements_baseline USING btree (label)` |
| idx_pgss_baseline_label_captured | btree | label, captured_at | não | sim |  | `CREATE INDEX idx_pgss_baseline_label_captured ON public.pg_stat_statements_baseline USING btree (label, captured_at DESC)` |
| pg_stat_statements_baseline_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX pg_stat_statements_baseline_pkey ON public.pg_stat_statements_baseline USING btree (id)` |


## Policies (RLS)

### `Admins can view baselines`

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

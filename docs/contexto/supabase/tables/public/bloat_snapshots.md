# public.bloat_snapshots

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
| 2 | `snapshot_date` | `date` | não | `CURRENT_DATE` |  |  |
| 3 | `table_name` | `text` | não |  |  |  |
| 4 | `live_rows` | `bigint` | não | `0` |  |  |
| 5 | `dead_rows` | `bigint` | não | `0` |  |  |
| 6 | `dead_ratio_pct` | `numeric(6,2)` | não | `0` |  |  |
| 7 | `total_size_bytes` | `bigint` | não | `0` |  |  |
| 8 | `total_size_pretty` | `text` | sim |  |  |  |
| 9 | `last_autovacuum` | `timestamp with time zone` | sim |  |  |  |
| 10 | `last_vacuum` | `timestamp with time zone` | sim |  |  |  |
| 11 | `autovacuum_count` | `bigint` | não | `0` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bloat_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| bloat_snapshots_snapshot_date_table_name_key | UNIQUE | `UNIQUE (snapshot_date, table_name)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bloat_snapshots_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bloat_snapshots_pkey ON public.bloat_snapshots USING btree (id)` |
| bloat_snapshots_snapshot_date_table_name_key | btree | snapshot_date, table_name | sim | sim |  | `CREATE UNIQUE INDEX bloat_snapshots_snapshot_date_table_name_key ON public.bloat_snapshots USING btree (snapshot_date, table_name)` |


## Policies (RLS)

### `Admins podem consultar snapshots de bloat`

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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

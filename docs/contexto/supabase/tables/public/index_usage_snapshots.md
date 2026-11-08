# public.index_usage_snapshots

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
| 2 | `schema_name` | `text` | não |  |  |  |
| 3 | `table_name` | `text` | não |  |  |  |
| 4 | `index_name` | `text` | não |  |  |  |
| 5 | `idx_scan` | `bigint` | sim |  |  |  |
| 6 | `idx_tup_read` | `bigint` | sim |  |  |  |
| 7 | `idx_tup_fetch` | `bigint` | sim |  |  |  |
| 8 | `index_size_bytes` | `bigint` | sim |  |  |  |
| 9 | `captured_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `snapshot_date` | `date` | não | `CURRENT_DATE` |  |  |
| 11 | `size_bytes` | `bigint` | não | `0` |  |  |
| 12 | `is_unique` | `boolean` | não | `false` |  |  |
| 13 | `is_primary` | `boolean` | não | `false` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| index_usage_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| index_usage_snapshots_unico | UNIQUE | `UNIQUE (snapshot_date, schema_name, index_name)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| index_usage_snapshots_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX index_usage_snapshots_pkey ON public.index_usage_snapshots USING btree (id)` |
| index_usage_snapshots_unico | btree | snapshot_date, schema_name, index_name | sim | sim |  | `CREATE UNIQUE INDEX index_usage_snapshots_unico ON public.index_usage_snapshots USING btree (snapshot_date, schema_name, index_name)` |


## Policies (RLS)

### `Somente admins leem snapshots de índices`

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

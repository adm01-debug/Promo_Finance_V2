# public.webhook_simulation_runs

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 3 | `started_at` | `timestamp with time zone` | sim |  |  |  |
| 4 | `finished_at` | `timestamp with time zone` | sim |  |  |  |
| 5 | `status` | `text` | não | `'pending'::text` |  |  |
| 6 | `total_scenarios` | `integer` | sim | `0` |  |  |
| 7 | `success_count` | `integer` | sim | `0` |  |  |
| 8 | `failure_count` | `integer` | sim | `0` |  |  |
| 9 | `error_summary` | `jsonb` | sim |  |  |  |
| 10 | `created_by` | `uuid` | sim |  |  |  |
| 11 | `target_function` | `text` | sim |  |  |  |
| 12 | `mode` | `text` | sim | `'normal'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| webhook_simulation_runs_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| webhook_simulation_runs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.webhook_simulation_results | webhook_simulation_results_run_id_fkey | run_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_webhook_simulation_runs_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_webhook_simulation_runs_created_by_fk ON public.webhook_simulation_runs USING btree (created_by)` |
| webhook_simulation_runs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX webhook_simulation_runs_pkey ON public.webhook_simulation_runs USING btree (id)` |


## Policies (RLS)

### `Users can insert simulation runs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = created_by)` |

### `Users can view simulation runs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = created_by)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

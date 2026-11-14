# public.webhook_simulation_results

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
| 2 | `run_id` | `uuid` | sim |  |  |  |
| 3 | `scenario_name` | `text` | não |  |  |  |
| 4 | `payload` | `jsonb` | não |  |  |  |
| 5 | `response_status` | `integer` | sim |  |  |  |
| 6 | `response_body` | `jsonb` | sim |  |  |  |
| 7 | `duration_ms` | `integer` | sim |  |  |  |
| 8 | `success` | `boolean` | sim | `false` |  |  |
| 9 | `error_message` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| webhook_simulation_results_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| webhook_simulation_results_run_id_fkey | FOREIGN KEY | `FOREIGN KEY (run_id) REFERENCES webhook_simulation_runs(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_webhook_simulation_results_run_id_fk | btree | run_id | não | sim |  | `CREATE INDEX idx_webhook_simulation_results_run_id_fk ON public.webhook_simulation_results USING btree (run_id)` |
| webhook_simulation_results_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX webhook_simulation_results_pkey ON public.webhook_simulation_results USING btree (id)` |


## Policies (RLS)

### `Users can view simulation results`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM webhook_simulation_runs   WHERE ((webhook_simulation_runs.id = webhook_simulation_results.run_id) AND (webhook_simulation_runs.created_by = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.anomalia_detection_runs

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `triggered_by` | `uuid` | sim |  |  |  |
| 3 | `trigger_source` | `text` | sim |  |  |  |
| 4 | `status` | `text` | sim | `'queued'::text` |  |  |
| 5 | `inseridas` | `integer` | sim | `0` |  |  |
| 6 | `error_message` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| anomalia_detection_runs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| anomalia_detection_runs_triggered_by_fkey | FOREIGN KEY | `FOREIGN KEY (triggered_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| anomalia_detection_runs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX anomalia_detection_runs_pkey ON public.anomalia_detection_runs USING btree (id)` |
| idx_anomalia_detection_runs_triggered_by_fk | btree | triggered_by | não | sim |  | `CREATE INDEX idx_anomalia_detection_runs_triggered_by_fk ON public.anomalia_detection_runs USING btree (triggered_by)` |


## Policies (RLS)

### `anomalia_runs_owner_or_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((triggered_by = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.cron_job_logs

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
| 2 | `job_name` | `text` | não |  |  |  |
| 3 | `executed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 4 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 5 | `duration_ms` | `integer` | sim |  |  |  |
| 6 | `result` | `jsonb` | sim |  |  |  |
| 7 | `success` | `boolean` | sim | `false` |  |  |
| 8 | `error_message` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cron_job_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cron_job_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cron_job_logs_pkey ON public.cron_job_logs USING btree (id)` |
| idx_cron_job_logs_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_cron_job_logs_created_at ON public.cron_job_logs USING btree (created_at)` |
| idx_cron_job_logs_job_name | btree | job_name, executed_at | não | sim |  | `CREATE INDEX idx_cron_job_logs_job_name ON public.cron_job_logs USING btree (job_name, executed_at DESC)` |


## Policies (RLS)

### `Admins can view cron logs`

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

# public.sso_sandbox_runs

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
| 2 | `provider_id` | `uuid` | sim |  |  |  |
| 3 | `config_snapshot` | `jsonb` | sim |  |  |  |
| 4 | `test_result` | `jsonb` | sim |  |  |  |
| 5 | `status` | `text` | não | `'pending'::text` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `created_by` | `uuid` | sim |  |  |  |
| 8 | `created_by_email` | `text` | sim |  |  |  |
| 9 | `provider_nome` | `text` | sim |  |  |  |
| 10 | `use_provider_config` | `boolean` | não | `true` |  |  |
| 11 | `input` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 12 | `result` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 13 | `outcome` | `text` | não |  |  |  |
| 14 | `email_masked` | `text` | sim |  |  |  |
| 15 | `resolved_role` | `text` | sim |  |  |  |
| 16 | `matched_group` | `text` | sim |  |  |  |
| 17 | `has_errors` | `boolean` | não | `false` |  |  |
| 18 | `batch_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sso_sandbox_runs_outcome_check | CHECK | `CHECK (outcome = ANY (ARRAY['bloqueado'::text, 'seria_jit'::text, 'usuario_existente'::text, 'sem_email'::text]))` |  |  | sim |
| sso_sandbox_runs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sso_sandbox_runs_provider_id_fkey | FOREIGN KEY | `FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sso_sandbox_runs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sso_sandbox_runs_pkey ON public.sso_sandbox_runs USING btree (id)` |


## Policies (RLS)

### `sso_sandbox_runs_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) AND (created_by = auth.uid()))` |


## Triggers

_nenhum_


## Grants

_nenhum_

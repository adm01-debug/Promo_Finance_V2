# public.ci_security_gate_events

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
| 2 | `matrix` | `text` | não |  |  |  |
| 3 | `function_name` | `text` | não |  |  |  |
| 4 | `role_tested` | `text` | não |  |  |  |
| 5 | `expected_state` | `text` | não |  |  |  |
| 6 | `observed_status` | `integer` | sim |  |  |  |
| 7 | `observed_code` | `text` | sim |  |  |  |
| 8 | `observed_message` | `text` | sim |  |  |  |
| 9 | `migration_revision` | `text` | sim |  |  |  |
| 10 | `git_sha` | `text` | sim |  |  |  |
| 11 | `git_ref` | `text` | sim |  |  |  |
| 12 | `workflow_run_url` | `text` | sim |  |  |  |
| 13 | `exception_notes` | `text` | sim |  |  |  |
| 14 | `severity` | `text` | não | `'error'::text` |  |  |
| 15 | `raw` | `jsonb` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ci_security_gate_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| ci_security_gate_events_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ci_security_gate_events_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ci_security_gate_events_pkey ON public.ci_security_gate_events USING btree (id)` |


## Policies (RLS)

### `Admins can view CI security gate events`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Service role manages CI security gate events`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

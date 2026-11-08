# public.rpc_observability_metrics

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
| usada por views | public.vw_rpc_hotspots, public.vw_rpc_slow_calls |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `bigint` | não | `nextval('rpc_observability_metrics_id_seq'::regclass)` |  |  |
| 2 | `function_name` | `text` | não |  |  |  |
| 3 | `caller_user_id` | `uuid` | sim |  |  |  |
| 4 | `caller_role` | `text` | sim |  |  |  |
| 5 | `duration_ms` | `numeric` | não |  |  |  |
| 6 | `success` | `boolean` | não | `true` |  |  |
| 7 | `error_sqlstate` | `text` | sim |  |  |  |
| 8 | `error_message` | `text` | sim |  |  |  |
| 9 | `meta` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 10 | `called_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rpc_observability_metrics_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| rpc_observability_metrics_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rpc_observability_metrics_pkey ON public.rpc_observability_metrics USING btree (id)` |


## Policies (RLS)

### `admin_read_rpc_metrics`

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

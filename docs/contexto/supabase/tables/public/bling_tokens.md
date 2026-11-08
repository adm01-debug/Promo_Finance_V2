# public.bling_tokens

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
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `access_token` | `text` | não |  |  |  |
| 4 | `refresh_token` | `text` | sim |  |  |  |
| 5 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `scope` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `created_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bling_tokens_empresa_id_key | UNIQUE | `UNIQUE (empresa_id)` |  |  | sim |
| bling_tokens_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bling_tokens_empresa_id_key | btree | empresa_id | sim | sim |  | `CREATE UNIQUE INDEX bling_tokens_empresa_id_key ON public.bling_tokens USING btree (empresa_id)` |
| bling_tokens_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bling_tokens_pkey ON public.bling_tokens USING btree (id)` |


## Policies (RLS)

### `bling_tokens_service_role_only`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_bling_tokens_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

_nenhum_

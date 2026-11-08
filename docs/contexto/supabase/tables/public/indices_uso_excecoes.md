# public.indices_uso_excecoes

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
| 2 | `index_name` | `text` | não |  |  |  |
| 3 | `justificativa` | `text` | não |  |  |  |
| 4 | `aprovado_por` | `text` | sim |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `motivo` | `text` | não |  |  |  |
| 7 | `criado_por` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| indices_uso_excecoes_index_name_key | UNIQUE | `UNIQUE (index_name)` |  |  | sim |
| indices_uso_excecoes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| indices_uso_excecoes_index_name_key | btree | index_name | sim | sim |  | `CREATE UNIQUE INDEX indices_uso_excecoes_index_name_key ON public.indices_uso_excecoes USING btree (index_name)` |
| indices_uso_excecoes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX indices_uso_excecoes_pkey ON public.indices_uso_excecoes USING btree (id)` |


## Policies (RLS)

### `Somente admins gerenciam exceções de índice`

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

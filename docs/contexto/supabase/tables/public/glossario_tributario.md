# public.glossario_tributario

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
| 2 | `termo` | `text` | não |  |  |  |
| 3 | `sigla` | `text` | sim |  |  |  |
| 4 | `categoria` | `text` | sim |  |  |  |
| 5 | `significado` | `text` | não |  |  |  |
| 6 | `base_legal` | `text` | sim |  |  |  |
| 7 | `exemplo` | `text` | sim |  |  |  |
| 8 | `ordem` | `integer` | não | `0` |  |  |
| 9 | `ativo` | `boolean` | não | `true` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| glossario_tributario_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| glossario_tributario_termo_key | UNIQUE | `UNIQUE (termo)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| glossario_tributario_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX glossario_tributario_pkey ON public.glossario_tributario USING btree (id)` |
| glossario_tributario_termo_key | btree | termo | sim | sim |  | `CREATE UNIQUE INDEX glossario_tributario_termo_key ON public.glossario_tributario USING btree (termo)` |


## Policies (RLS)

### `glossario_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `glossario_leitura`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `ativo` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_glossario_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

_nenhum_

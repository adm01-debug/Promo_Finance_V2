# public.logs_conciliacao_retroativa

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não | `auth.uid()` |  |  |
| 3 | `empresa_id` | `uuid` | sim |  |  |  |
| 4 | `conta_bancaria_id` | `uuid` | sim |  |  |  |
| 5 | `data_inicio` | `date` | não |  |  |  |
| 6 | `data_fim` | `date` | não |  |  |  |
| 7 | `status` | `text` | não | `'processando'::text` |  |  |
| 8 | `progresso` | `numeric` | sim | `0` |  |  |
| 9 | `total_processado` | `integer` | sim | `0` |  |  |
| 10 | `total_conciliado` | `integer` | sim | `0` |  |  |
| 11 | `divergencias_encontradas` | `integer` | sim | `0` |  |  |
| 12 | `erro_detalhe` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| logs_conciliacao_retroativa_conta_bancaria_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| logs_conciliacao_retroativa_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| logs_conciliacao_retroativa_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX logs_conciliacao_retroativa_pkey ON public.logs_conciliacao_retroativa USING btree (id)` |


## Policies (RLS)

### `logs_retro_insert_owner`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id)` |

### `logs_retro_owner_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `logs_retro_select_owner`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_d7d66ed0673bb8a6cd90 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_

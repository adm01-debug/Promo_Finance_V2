# public.bitrix24_stage_mappings

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 3 | `bitrix_stage_id` | `text` | não |  |  |  |
| 4 | `bitrix_stage_name` | `text` | sim |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `lalamove_status` | `text` | não |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bitrix24_stage_mappings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bitrix24_stage_mappings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bitrix24_stage_mappings_pkey ON public.bitrix24_stage_mappings USING btree (id)` |


## Policies (RLS)

### `Admins can delete stage mappings`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Authorized roles can view stage mappings`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'operator'::app_role))` |
| WITH CHECK |  |

### `Managers can insert stage mappings`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role))` |

### `Managers can update stage mappings`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_

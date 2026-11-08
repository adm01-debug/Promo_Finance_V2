# public.user_active_filters

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `entity_type` | `text` | não |  |  |  |
| 4 | `payload` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 5 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_active_filters_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_active_filters_unique | UNIQUE | `UNIQUE (user_id, entity_type)` |  |  | sim |
| user_active_filters_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_active_filters_user | btree | user_id | não | sim |  | `CREATE INDEX idx_user_active_filters_user ON public.user_active_filters USING btree (user_id)` |
| user_active_filters_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_active_filters_pkey ON public.user_active_filters USING btree (id)` |
| user_active_filters_unique | btree | user_id, entity_type | sim | sim |  | `CREATE UNIQUE INDEX user_active_filters_unique ON public.user_active_filters USING btree (user_id, entity_type)` |


## Policies (RLS)

### `admins_all_user_active_filters`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM profiles p   WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |
| WITH CHECK |  |

### `user_active_filters_owner`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `users_own_filters`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_user_active_filters_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

_nenhum_

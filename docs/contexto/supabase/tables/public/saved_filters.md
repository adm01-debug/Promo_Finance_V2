# public.saved_filters

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `created_by` | `uuid` | sim |  |  |  |
| 4 | `entity_type` | `text` | não |  |  |  |
| 5 | `name` | `text` | não |  |  |  |
| 6 | `filters` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 7 | `is_default` | `boolean` | não | `false` |  |  |
| 8 | `is_shared` | `boolean` | não | `false` |  |  |
| 9 | `empresa_id` | `uuid` | sim |  |  |  |
| 10 | `shared_with_roles` | `text[]` | não | `'{}'::text[]` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| saved_filters_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| saved_filters_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| saved_filters_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| saved_filters_shared_requires_empresa | CHECK | `CHECK (NOT is_shared OR empresa_id IS NOT NULL)` |  |  | sim |
| saved_filters_unique | UNIQUE | `UNIQUE (user_id, entity_type, name)` |  |  | sim |
| saved_filters_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_saved_filters_empresa | btree | empresa_id | não | sim |  | `CREATE INDEX idx_saved_filters_empresa ON public.saved_filters USING btree (empresa_id)` |
| idx_saved_filters_user_entity | btree | user_id, entity_type | não | sim |  | `CREATE INDEX idx_saved_filters_user_entity ON public.saved_filters USING btree (user_id, entity_type)` |
| saved_filters_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX saved_filters_pkey ON public.saved_filters USING btree (id)` |
| saved_filters_unique | btree | user_id, entity_type, name | sim | sim |  | `CREATE UNIQUE INDEX saved_filters_unique ON public.saved_filters USING btree (user_id, entity_type, name)` |


## Policies (RLS)

### `saved_filters_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM profiles p   WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |
| WITH CHECK |  |

### `saved_filters_owner_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `saved_filters_owner_write`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `saved_filters_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id = ( SELECT auth.uid() AS uid)) OR (is_shared AND (empresa_id IS NOT NULL) AND empresa_acessivel(empresa_id) AND (EXISTS ( SELECT 1    FROM user_roles ur   WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND ((ur.role)::text = ANY (saved_filters.shared_with_roles)))))))` |
| WITH CHECK |  |

### `saved_filters_shared_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_shared = true)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_saved_filters_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

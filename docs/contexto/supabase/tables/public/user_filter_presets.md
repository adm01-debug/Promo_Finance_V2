# public.user_filter_presets

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `filters` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 5 | `is_default` | `boolean` | sim | `false` |  |  |
| 6 | `screen_id` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `entity_type` | `text` | sim |  |  |  |
| 10 | `empresa_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_filter_presets_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_filter_presets_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_filter_presets_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_filter_presets_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_user_filter_presets_empresa_id ON public.user_filter_presets USING btree (empresa_id)` |
| idx_user_filter_presets_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_user_filter_presets_user_id_fk ON public.user_filter_presets USING btree (user_id)` |
| user_filter_presets_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_filter_presets_pkey ON public.user_filter_presets USING btree (id)` |


## Policies (RLS)

### `Users can manage their presets`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_94b77f57a764fd8b2a8c | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

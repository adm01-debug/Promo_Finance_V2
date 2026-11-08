# public.sso_user_groups

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
| 3 | `provider_id` | `uuid` | não |  |  |  |
| 4 | `group_name` | `text` | não |  |  |  |
| 5 | `synced_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `groups` | `text[]` | não | `'{}'::text[]` |  |  |
| 8 | `matched_group` | `text` | sim |  |  |  |
| 9 | `matched_role` | `app_role` | sim |  |  |  |
| 10 | `last_synced_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sso_user_group_unico | UNIQUE | `UNIQUE (user_id, provider_id)` |  |  | sim |
| sso_user_groups_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sso_user_groups_provider_id_fkey | FOREIGN KEY | `FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sso_user_groups_user_id_provider_id_group_name_key | UNIQUE | `UNIQUE (user_id, provider_id, group_name)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sso_user_group_unico | btree | user_id, provider_id | sim | sim |  | `CREATE UNIQUE INDEX sso_user_group_unico ON public.sso_user_groups USING btree (user_id, provider_id)` |
| sso_user_groups_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sso_user_groups_pkey ON public.sso_user_groups USING btree (id)` |
| sso_user_groups_user_id_provider_id_group_name_key | btree | user_id, provider_id, group_name | sim | sim |  | `CREATE UNIQUE INDEX sso_user_groups_user_id_provider_id_group_name_key ON public.sso_user_groups USING btree (user_id, provider_id, group_name)` |


## Policies (RLS)

### `sso_user_groups_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_sso_user_groups_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

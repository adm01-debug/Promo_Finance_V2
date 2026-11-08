# public.sso_role_mappings

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
| 2 | `provider_id` | `uuid` | não |  |  |  |
| 3 | `provider_role` | `text` | não |  |  |  |
| 4 | `app_role` | `text` | não |  |  |  |
| 5 | `empresa_id` | `uuid` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `idp_group` | `text` | não |  |  |  |
| 8 | `ordem` | `integer` | não | `0` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sso_role_mappings_idp_group_check | CHECK | `CHECK (char_length(btrim(idp_group)) >= 1 AND char_length(btrim(idp_group)) <= 200)` |  |  | sim |
| sso_role_mappings_ordem_check | CHECK | `CHECK (ordem >= 0)` |  |  | sim |
| sso_role_mappings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sso_role_mappings_provider_id_fkey | FOREIGN KEY | `FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sso_role_mappings_provider_id_provider_role_app_role_key | UNIQUE | `UNIQUE (provider_id, provider_role, app_role)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sso_role_mappings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sso_role_mappings_pkey ON public.sso_role_mappings USING btree (id)` |
| sso_role_mappings_provider_id_provider_role_app_role_key | btree | provider_id, provider_role, app_role | sim | sim |  | `CREATE UNIQUE INDEX sso_role_mappings_provider_id_provider_role_app_role_key ON public.sso_role_mappings USING btree (provider_id, provider_role, app_role)` |


## Policies (RLS)

### `sso_role_mappings_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_sso_role_mappings_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

_nenhum_

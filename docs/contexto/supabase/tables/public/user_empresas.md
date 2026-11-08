# public.user_empresas

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `empresa_id` | `uuid` | não |  |  |  |
| 4 | `role` | `app_role` | não | `'visualizador'::app_role` |  |  |
| 5 | `is_default` | `boolean` | não | `false` |  |  |
| 6 | `provisioned_via` | `text` | não | `'manual'::text` |  |  |
| 7 | `scim_external_id` | `text` | sim |  |  |  |
| 8 | `ativo` | `boolean` | não | `true` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_empresas_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_empresas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_empresas_provisioned_via_check | CHECK | `CHECK (provisioned_via = ANY (ARRAY['manual'::text, 'sso'::text, 'scim'::text]))` |  |  | sim |
| user_empresas_user_id_empresa_id_key | UNIQUE | `UNIQUE (user_id, empresa_id)` |  |  | sim |
| user_empresas_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_empresas_empresa_ativo | btree | empresa_id, ativo | não | sim |  | `CREATE INDEX idx_user_empresas_empresa_ativo ON public.user_empresas USING btree (empresa_id, ativo)` |
| idx_user_empresas_user_ativo_empresa | btree | user_id, ativo, empresa_id | não | sim |  | `CREATE INDEX idx_user_empresas_user_ativo_empresa ON public.user_empresas USING btree (user_id, ativo, empresa_id)` |
| user_empresas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_empresas_pkey ON public.user_empresas USING btree (id)` |
| user_empresas_user_id_empresa_id_key | btree | user_id, empresa_id | sim | sim |  | `CREATE UNIQUE INDEX user_empresas_user_id_empresa_id_key ON public.user_empresas USING btree (user_id, empresa_id)` |


## Policies (RLS)

### `Admins manage user_empresas`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `Users view own empresa links`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_09910d2394bcdefb9694 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_

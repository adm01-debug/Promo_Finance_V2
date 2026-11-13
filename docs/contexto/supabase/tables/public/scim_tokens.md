# public.scim_tokens

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
| 2 | `provider_id` | `uuid` | sim |  |  |  |
| 3 | `empresa_id` | `uuid` | não |  |  |  |
| 4 | `token_hash` | `text` | não |  |  |  |
| 5 | `token_prefix` | `text` | não |  |  |  |
| 6 | `nome` | `text` | não |  |  |  |
| 7 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `last_used_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `ativo` | `boolean` | não | `true` |  |  |
| 10 | `created_by` | `uuid` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `default_role` | `app_role` | sim | `'visualizador'::app_role` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| scim_tokens_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| scim_tokens_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| scim_tokens_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| scim_tokens_provider_id_fkey | FOREIGN KEY | `FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| scim_tokens_token_hash_key | UNIQUE | `UNIQUE (token_hash)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_scim_tokens_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_scim_tokens_created_by_fk ON public.scim_tokens USING btree (created_by)` |
| idx_scim_tokens_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_scim_tokens_empresa_id ON public.scim_tokens USING btree (empresa_id)` |
| scim_tokens_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX scim_tokens_pkey ON public.scim_tokens USING btree (id)` |
| scim_tokens_token_hash_key | btree | token_hash | sim | sim |  | `CREATE UNIQUE INDEX scim_tokens_token_hash_key ON public.scim_tokens USING btree (token_hash)` |


## Policies (RLS)

### `Admins manage scim_tokens`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

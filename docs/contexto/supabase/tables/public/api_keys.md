# public.api_keys

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
| 2 | `nome` | `text` | não |  |  |  |
| 3 | `chave` | `text` | não |  |  |  |
| 4 | `empresa_id` | `uuid` | sim |  |  |  |
| 5 | `scopes` | `text[]` | sim |  |  |  |
| 6 | `ativo` | `boolean` | não | `true` |  |  |
| 7 | `expira_em` | `timestamp with time zone` | sim |  |  |  |
| 8 | `ultimo_uso` | `timestamp with time zone` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `key_hash` | `text` | sim |  |  |  |
| 11 | `key_prefix` | `text` | sim |  |  |  |
| 12 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `last_used_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `revoked_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `created_by` | `uuid` | sim |  |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `name` | `text` | não |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| api_keys_chave_key | UNIQUE | `UNIQUE (chave)` |  |  | sim |
| api_keys_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| api_keys_hash_unico | UNIQUE | `UNIQUE (key_hash)` |  |  | sim |
| api_keys_key_prefix_check | CHECK | `CHECK (key_prefix ~ '^[A-Za-z0-9_-]{4,16}$'::text)` |  |  | sim |
| api_keys_name_check | CHECK | `CHECK (char_length(name) >= 2 AND char_length(name) <= 120)` |  |  | sim |
| api_keys_nome_unico_por_empresa | UNIQUE | `UNIQUE (empresa_id, name)` |  |  | sim |
| api_keys_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| api_keys_chave_key | btree | chave | sim | sim |  | `CREATE UNIQUE INDEX api_keys_chave_key ON public.api_keys USING btree (chave)` |
| api_keys_hash_unico | btree | key_hash | sim | sim |  | `CREATE UNIQUE INDEX api_keys_hash_unico ON public.api_keys USING btree (key_hash)` |
| api_keys_nome_unico_por_empresa | btree | empresa_id, name | sim | sim |  | `CREATE UNIQUE INDEX api_keys_nome_unico_por_empresa ON public.api_keys USING btree (empresa_id, name)` |
| api_keys_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX api_keys_pkey ON public.api_keys USING btree (id)` |
| idx_api_keys_empresa | btree | empresa_id, created_at | não | sim |  | `CREATE INDEX idx_api_keys_empresa ON public.api_keys USING btree (empresa_id, created_at DESC)` |


## Policies (RLS)

### `api_keys_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `api_keys_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_api_keys_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

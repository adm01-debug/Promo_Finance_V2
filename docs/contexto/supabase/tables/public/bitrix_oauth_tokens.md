# public.bitrix_oauth_tokens

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
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `access_token` | `text` | sim |  |  |  |
| 5 | `refresh_token` | `text` | sim |  |  |  |
| 6 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `scope` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `domain` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bitrix_oauth_tokens_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bitrix_oauth_tokens_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bitrix_oauth_tokens_pkey ON public.bitrix_oauth_tokens USING btree (id)` |
| idx_bitrix_oauth_tokens_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_bitrix_oauth_tokens_empresa_id ON public.bitrix_oauth_tokens USING btree (empresa_id)` |


## Policies (RLS)

### `bitrix_oauth_tokens_service_role_only`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_bitrix_tokens_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

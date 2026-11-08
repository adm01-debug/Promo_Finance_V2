# public.integration_secrets

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
| 2 | `nome` | `text` | não |  |  |  |
| 3 | `valor` | `text` | não |  |  |  |
| 4 | `descricao` | `text` | sim |  |  |  |
| 5 | `empresa_id` | `uuid` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `chave` | `text` | não |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| integration_secrets_chave_key | UNIQUE | `UNIQUE (chave)` |  |  | sim |
| integration_secrets_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| integration_secrets_chave_key | btree | chave | sim | sim |  | `CREATE UNIQUE INDEX integration_secrets_chave_key ON public.integration_secrets USING btree (chave)` |
| integration_secrets_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX integration_secrets_pkey ON public.integration_secrets USING btree (id)` |


## Policies (RLS)

### `integration_secrets_no_client_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | anon, authenticated |
| USING | `false` |
| WITH CHECK | `false` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_integration_secrets_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_sync_integration_secret_identifier | BEFORE | INSERT OR UPDATE | ROW | enabled | public.sync_integration_secret_identifier |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

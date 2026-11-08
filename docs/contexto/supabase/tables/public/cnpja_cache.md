# public.cnpja_cache

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
| 1 | `cnpj` | `text` | não |  |  |  |
| 2 | `data` | `jsonb` | não |  |  |  |
| 3 | `cached_at` | `timestamp with time zone` | não | `now()` |  |  |
| 4 | `expires_at` | `timestamp with time zone` | não | `(now() + '30 days'::interval)` |  |  |
| 5 | `situacao_cadastral` | `text` | sim |  |  |  |
| 6 | `fetched_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cnpja_cache_cnpj_check | CHECK | `CHECK (cnpj ~ '^[0-9]{14}$'::text)` |  |  | sim |
| cnpja_cache_pkey | PRIMARY KEY | `PRIMARY KEY (cnpj)` |  |  | sim |
| cnpja_cache_validade | CHECK | `CHECK (expires_at > fetched_at)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cnpja_cache_pkey | btree | cnpj | sim | sim |  | `CREATE UNIQUE INDEX cnpja_cache_pkey ON public.cnpja_cache USING btree (cnpj)` |


## Policies (RLS)

### `cnpja_cache_service_role_only`

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
| trg_cnpja_cache_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

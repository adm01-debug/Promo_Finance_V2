# public.email_verifications

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `email` | `text` | não |  |  |  |
| 4 | `token_hash` | `text` | não |  |  |  |
| 5 | `verified_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `expires_at` | `timestamp with time zone` | não |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| email_verifications_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| email_verifications_token_hash_key | UNIQUE | `UNIQUE (token_hash)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| email_verifications_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX email_verifications_pkey ON public.email_verifications USING btree (id)` |
| email_verifications_token_hash_key | btree | token_hash | sim | sim |  | `CREATE UNIQUE INDEX email_verifications_token_hash_key ON public.email_verifications USING btree (token_hash)` |


## Policies (RLS)

### `Admins can delete verifications`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Users can insert own verifications`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their verifications`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Users can view own verifications`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_

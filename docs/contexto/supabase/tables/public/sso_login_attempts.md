# public.sso_login_attempts

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | sim |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `email` | `text` | sim |  |  |  |
| 3 | `provider_id` | `text` | sim |  |  |  |
| 4 | `event_type` | `text` | não |  |  |  |
| 5 | `success` | `boolean` | sim | `true` |  |  |
| 6 | `error_code` | `text` | sim |  |  |  |
| 7 | `error_message` | `text` | sim |  |  |  |
| 8 | `context` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `app_redirect` | `text` | sim |  |  |  |
| 11 | `code_verifier_hash` | `text` | sim |  |  |  |
| 12 | `duration_ms` | `integer` | sim |  |  |  |
| 13 | `empresa_id` | `uuid` | sim |  |  |  |
| 14 | `state` | `text` | sim |  |  |  |
| 15 | `expires_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sso_login_attempts_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| sso_login_attempts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sso_attempts_state | btree | state | não | sim | `(state IS NOT NULL)` | `CREATE INDEX idx_sso_attempts_state ON public.sso_login_attempts USING btree (state) WHERE (state IS NOT NULL)` |
| sso_login_attempts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sso_login_attempts_pkey ON public.sso_login_attempts USING btree (id)` |


## Policies (RLS)

### `Admins can view SSO login attempts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(( SELECT sp.empresa_id    FROM sso_providers sp   WHERE ((sp.id)::text = sso_login_attempts.provider_id))))` |
| WITH CHECK |  |

### `Admins veem tentativas SSO`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(( SELECT sp.empresa_id    FROM sso_providers sp   WHERE ((sp.id)::text = sso_login_attempts.provider_id))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

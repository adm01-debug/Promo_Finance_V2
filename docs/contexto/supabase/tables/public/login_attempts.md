# public.login_attempts

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | sim |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `email` | `text` | não |  |  |  |
| 3 | `ip_address` | `inet` | sim |  |  |  |
| 4 | `attempt_count` | `integer` | não | `1` |  |  |
| 5 | `first_attempt_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `last_attempt_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `locked_until` | `timestamp with time zone` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `user_agent` | `text` | sim |  |  |  |
| 10 | `is_suspicious` | `boolean` | sim | `false` |  |  |
| 11 | `block_reason` | `text` | sim |  |  |  |
| 12 | `user_email` | `text` | sim |  |  |  |
| 13 | `success` | `boolean` | sim | `false` |  |  |
| 14 | `blocked_reason` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| login_attempts_email_lowercase_chk | CHECK | `CHECK (email IS NULL OR email = lower(email))` |  |  | sim |
| login_attempts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_login_attempts_email | btree | email | não | sim |  | `CREATE INDEX idx_login_attempts_email ON public.login_attempts USING btree (email)` |
| idx_login_attempts_email_last | btree | last_attempt_at | não | sim |  | `CREATE INDEX idx_login_attempts_email_last ON public.login_attempts USING btree (lower(email), last_attempt_at DESC)` |
| idx_login_attempts_locked_until | btree | locked_until | não | sim |  | `CREATE INDEX idx_login_attempts_locked_until ON public.login_attempts USING btree (locked_until)` |
| login_attempts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX login_attempts_pkey ON public.login_attempts USING btree (id)` |


## Policies (RLS)

### `Admins can delete login attempts`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert login attempts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role))` |

### `Admins can update login attempts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `Admins can view login attempts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

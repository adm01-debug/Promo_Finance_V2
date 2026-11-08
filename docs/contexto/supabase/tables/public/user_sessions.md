# public.user_sessions

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | sim |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `ip_address` | `inet` | sim |  |  |  |
| 4 | `user_agent` | `text` | sim |  |  |  |
| 5 | `revoked` | `boolean` | sim | `false` |  |  |
| 6 | `last_activity` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `last_active` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `device_info` | `text` | sim |  |  |  |
| 10 | `is_current` | `boolean` | não | `false` |  |  |
| 11 | `revoked_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_sessions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_sessions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_sessions_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_user_sessions_user_id_fk ON public.user_sessions USING btree (user_id)` |
| user_sessions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_sessions_pkey ON public.user_sessions USING btree (id)` |


## Policies (RLS)

### `Users see own sessions`

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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

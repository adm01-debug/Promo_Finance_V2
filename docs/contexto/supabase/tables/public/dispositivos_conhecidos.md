# public.dispositivos_conhecidos

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `device_name` | `text` | sim |  |  |  |
| 4 | `browser` | `text` | sim |  |  |  |
| 5 | `last_login` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `is_trusted` | `boolean` | sim | `false` |  |  |
| 7 | `device_fingerprint` | `text` | sim |  |  |  |
| 8 | `last_seen_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `user_agent` | `text` | sim |  |  |  |
| 10 | `os` | `text` | sim |  |  |  |
| 11 | `device_type` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| dispositivos_conhecidos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| dispositivos_conhecidos_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| dispositivos_conhecidos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX dispositivos_conhecidos_pkey ON public.dispositivos_conhecidos USING btree (id)` |
| idx_dispositivos_conhecidos_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_dispositivos_conhecidos_user_id_fk ON public.dispositivos_conhecidos USING btree (user_id)` |


## Policies (RLS)

### `User-based access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_

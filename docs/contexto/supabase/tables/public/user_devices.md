# public.user_devices

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `device_fingerprint` | `text` | não |  |  |  |
| 4 | `ip_address` | `inet` | sim |  |  |  |
| 5 | `user_agent` | `text` | sim |  |  |  |
| 6 | `browser` | `text` | sim |  |  |  |
| 7 | `os` | `text` | sim |  |  |  |
| 8 | `device_name` | `text` | sim |  |  |  |
| 9 | `is_trusted` | `boolean` | sim | `false` |  |  |
| 10 | `first_seen_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `last_seen_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `location_city` | `text` | sim |  |  |  |
| 13 | `location_country` | `text` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_devices_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_devices_user_id_device_fingerprint_key | UNIQUE | `UNIQUE (user_id, device_fingerprint)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.new_device_alerts | new_device_alerts_device_id_fkey | device_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| user_devices_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_devices_pkey ON public.user_devices USING btree (id)` |
| user_devices_user_id_device_fingerprint_key | btree | user_id, device_fingerprint | sim | sim |  | `CREATE UNIQUE INDEX user_devices_user_id_device_fingerprint_key ON public.user_devices USING btree (user_id, device_fingerprint)` |


## Policies (RLS)

### `Users can delete their devices`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Users can insert their devices`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can manage own devices`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their devices`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Users can view own devices`

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

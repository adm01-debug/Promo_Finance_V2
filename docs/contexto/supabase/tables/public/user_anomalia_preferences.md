# public.user_anomalia_preferences

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `toast_enabled` | `boolean` | não | `true` |  |  |
| 4 | `toast_min_severidade` | `text` | não | `'critica'::text` |  |  |
| 5 | `toast_severidades_ativas` | `text[]` | não | `'{critica,alta}'::text[]` |  |  |
| 6 | `toast_duracao_segundos` | `integer` | não | `12` |  |  |
| 7 | `toast_acoes` | `jsonb` | não | `'{"copiar_id": false, "drill_down": true, "marcar_lida": false, "abrir_pagina": true}'::jsonb` |  |  |
| 8 | `drawer_acoes` | `jsonb` | não | `'{"copiar_id": false, "marcar_lida": false, "abrir_entidade": true, "pagina_completa": true}'::jsonb` |  |  |
| 9 | `silenciar_ate` | `timestamp with time zone` | sim |  |  |  |
| 10 | `centros_custo_silenciados` | `uuid[]` | não | `'{}'::uuid[]` |  |  |
| 11 | `tipos_silenciados` | `text[]` | não | `'{}'::text[]` |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_anomalia_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_anomalia_preferences_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_anomalia_preferences_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| user_anomalia_preferences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_anomalia_preferences_pkey ON public.user_anomalia_preferences USING btree (id)` |
| user_anomalia_preferences_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX user_anomalia_preferences_user_id_key ON public.user_anomalia_preferences USING btree (user_id)` |


## Policies (RLS)

### `Users can manage their own preferences`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_7c3e342523c10fdce4a8 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| tr_user_anomalia_preferences_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

_nenhum_

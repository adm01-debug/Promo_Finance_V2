# public.user_digest_preferences

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `ativo` | `boolean` | não | `true` |  |  |
| 4 | `frequencia` | `text` | não | `'diaria'::text` |  |  |
| 5 | `dia_semana` | `integer` | não | `1` |  |  |
| 6 | `dia_mes` | `integer` | não | `1` |  |  |
| 7 | `hora_envio` | `integer` | não | `8` |  | Hora preferida para envio do resumo, representada por inteiro. O banco restringe o valor ao intervalo de 0 a 23; a interpretação acordada é hora local de America/Sao_Paulo. Valor padrão: 8. |
| 8 | `severidade_minima` | `text` | não | `'media'::text` |  |  |
| 9 | `tipos_ignorados` | `text[]` | não | `'{}'::text[]` |  |  |
| 10 | `empresas_filtro` | `uuid[]` | não | `'{}'::uuid[]` |  |  |
| 11 | `email_alternativo` | `text` | sim |  |  |  |
| 12 | `max_alertas` | `integer` | não | `50` |  |  |
| 13 | `ultimo_envio_em` | `timestamp with time zone` | sim |  |  |  |
| 14 | `ultimo_hash` | `text` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_digest_preferences_dia_mes_check | CHECK | `CHECK (dia_mes >= 1 AND dia_mes <= 28)` |  |  | sim |
| user_digest_preferences_dia_semana_check | CHECK | `CHECK (dia_semana >= 0 AND dia_semana <= 6)` |  |  | sim |
| user_digest_preferences_email_alternativo_check | CHECK | `CHECK (email_alternativo IS NULL OR email_alternativo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text)` |  |  | sim |
| user_digest_preferences_frequencia_check | CHECK | `CHECK (frequencia = ANY (ARRAY['diaria'::text, 'semanal'::text, 'mensal'::text]))` |  |  | sim |
| user_digest_preferences_hora_envio_check | CHECK | `CHECK (hora_envio >= 0 AND hora_envio <= 23)` |  |  | sim |
| user_digest_preferences_max_alertas_check | CHECK | `CHECK (max_alertas >= 1 AND max_alertas <= 500)` |  |  | sim |
| user_digest_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_digest_preferences_severidade_minima_check | CHECK | `CHECK (severidade_minima = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text]))` |  |  | sim |
| user_digest_preferences_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_digest_preferences_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| user_digest_preferences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_digest_preferences_pkey ON public.user_digest_preferences USING btree (id)` |
| user_digest_preferences_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX user_digest_preferences_user_id_key ON public.user_digest_preferences USING btree (user_id)` |


## Policies (RLS)

### `Admins visualizam preferencias de digest`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Usuarios gerenciam suas preferencias de digest`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id)` |
| WITH CHECK | `(( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| tr_user_digest_preferences_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

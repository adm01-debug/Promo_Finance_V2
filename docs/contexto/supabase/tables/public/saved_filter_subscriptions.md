# public.saved_filter_subscriptions

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
| 2 | `filter_id` | `uuid` | sim |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `canal` | `text` | sim |  |  |  |
| 5 | `frequencia` | `subscription_frequencia` | não | `'imediata'::subscription_frequencia` |  |  |
| 6 | `ativo` | `boolean` | não | `true` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `saved_filter_id` | `uuid` | não |  |  |  |
| 9 | `ultimo_envio_em` | `timestamp with time zone` | sim |  |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `notify_inapp` | `boolean` | não | `true` |  |  |
| 12 | `notify_push` | `boolean` | não | `false` |  |  |
| 13 | `notify_email` | `boolean` | não | `false` |  |  |
| 14 | `horario_preferido` | `time without time zone` | não | `'09:00:00'::time without time zone` |  |  |
| 15 | `severidades_criticas` | `text[]` | não | `ARRAY['critica'::text]` |  |  |
| 16 | `tipos_eventos_ativos` | `text[]` | não | `ARRAY[]::text[]` |  |  |
| 17 | `rate_limit_max` | `integer` | não | `5` |  |  |
| 18 | `rate_limit_window_min` | `integer` | não | `10` |  |  |
| 19 | `last_seen_at` | `timestamp with time zone` | não | `now()` |  |  |
| 20 | `next_dispatch_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| saved_filter_subscriptions_canal_check | CHECK | `CHECK (canal = ANY (ARRAY['email'::text, 'push'::text, 'whatsapp'::text]))` |  |  | sim |
| saved_filter_subscriptions_filter_id_user_id_canal_key | UNIQUE | `UNIQUE (filter_id, user_id, canal)` |  |  | sim |
| saved_filter_subscriptions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| saved_filter_subscriptions_user_id_saved_filter_id_key | UNIQUE | `UNIQUE (user_id, saved_filter_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sfs_filter | btree | saved_filter_id | não | sim |  | `CREATE INDEX idx_sfs_filter ON public.saved_filter_subscriptions USING btree (saved_filter_id)` |
| idx_sfs_user | btree | user_id | não | sim |  | `CREATE INDEX idx_sfs_user ON public.saved_filter_subscriptions USING btree (user_id)` |
| saved_filter_subscriptions_filter_id_user_id_canal_key | btree | filter_id, user_id, canal | sim | sim |  | `CREATE UNIQUE INDEX saved_filter_subscriptions_filter_id_user_id_canal_key ON public.saved_filter_subscriptions USING btree (filter_id, user_id, canal)` |
| saved_filter_subscriptions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX saved_filter_subscriptions_pkey ON public.saved_filter_subscriptions USING btree (id)` |
| saved_filter_subscriptions_user_id_saved_filter_id_key | btree | user_id, saved_filter_id | sim | sim |  | `CREATE UNIQUE INDEX saved_filter_subscriptions_user_id_saved_filter_id_key ON public.saved_filter_subscriptions USING btree (user_id, saved_filter_id)` |


## Policies (RLS)

### `saved_filter_subscriptions_owner`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_saved_filter_subs_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

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
| 2 | `filter_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `canal` | `text` | não | `'inapp'::text` |  |  |
| 5 | `frequencia` | `text` | não | `'diario'::text` |  |  |
| 6 | `ativo` | `boolean` | não | `true` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `saved_filter_id` | `uuid` | não |  |  |  |
| 9 | `ultimo_envio_em` | `timestamp with time zone` | sim |  |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| saved_filter_subscriptions_canal_check | CHECK | `CHECK (canal = ANY (ARRAY['email'::text, 'push'::text, 'whatsapp'::text]))` |  |  | sim |
| saved_filter_subscriptions_filter_id_user_id_canal_key | UNIQUE | `UNIQUE (filter_id, user_id, canal)` |  |  | sim |
| saved_filter_subscriptions_frequencia_check | CHECK | `CHECK (frequencia = ANY (ARRAY['diaria'::text, 'semanal'::text, 'mensal'::text]))` |  |  | sim |
| saved_filter_subscriptions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| saved_filter_subscriptions_filter_id_user_id_canal_key | btree | filter_id, user_id, canal | sim | sim |  | `CREATE UNIQUE INDEX saved_filter_subscriptions_filter_id_user_id_canal_key ON public.saved_filter_subscriptions USING btree (filter_id, user_id, canal)` |
| saved_filter_subscriptions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX saved_filter_subscriptions_pkey ON public.saved_filter_subscriptions USING btree (id)` |


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

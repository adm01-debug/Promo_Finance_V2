# public.catalogos_fiscais_cargas

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
| 2 | `origem` | `text` | não | `'cron'::text` |  |  |
| 3 | `status` | `text` | não | `'ok'::text` |  |  |
| 4 | `checksum` | `text` | sim |  |  |  |
| 5 | `contagens` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 6 | `houve_alteracao` | `boolean` | não | `false` |  |  |
| 7 | `vinculos_normalizados` | `integer` | não | `0` |  |  |
| 8 | `criticos` | `integer` | não | `0` |  |  |
| 9 | `duracao_ms` | `integer` | não | `0` |  |  |
| 10 | `mensagem` | `text` | sim |  |  |  |
| 11 | `last_updated` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| catalogos_fiscais_cargas_origem_check | CHECK | `CHECK (origem = ANY (ARRAY['cron'::text, 'manual'::text, 'ci'::text, 'migration'::text]))` |  |  | sim |
| catalogos_fiscais_cargas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| catalogos_fiscais_cargas_status_check | CHECK | `CHECK (status = ANY (ARRAY['ok'::text, 'erro'::text, 'sem_alteracao'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| catalogos_fiscais_cargas_checksum_key | btree | checksum | sim | sim |  | `CREATE UNIQUE INDEX catalogos_fiscais_cargas_checksum_key ON public.catalogos_fiscais_cargas USING btree (checksum)` |
| catalogos_fiscais_cargas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX catalogos_fiscais_cargas_pkey ON public.catalogos_fiscais_cargas USING btree (id)` |


## Policies (RLS)

### `Admins leem cargas de catalogos fiscais`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_catalogos_fiscais_cargas | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

_nenhum_

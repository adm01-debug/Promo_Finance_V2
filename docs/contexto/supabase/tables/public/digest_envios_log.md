# public.digest_envios_log

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
| 2 | `execucao_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `email` | `text` | não |  |  |  |
| 5 | `situacao` | `text` | não |  |  |  |
| 6 | `motivo` | `text` | sim |  |  |  |
| 7 | `erro` | `text` | sim |  |  |  |
| 8 | `total_alertas` | `integer` | não | `0` |  |  |
| 9 | `total_empresas` | `integer` | não | `0` |  |  |
| 10 | `severidade_maxima` | `text` | sim |  |  |  |
| 11 | `multa_total` | `numeric` | não | `0` |  |  |
| 12 | `hash_conteudo` | `text` | sim |  |  |  |
| 13 | `duplicado` | `boolean` | não | `false` |  |  |
| 14 | `simulado` | `boolean` | não | `false` |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| digest_envios_log_multa_total_check | CHECK | `CHECK (multa_total >= 0::numeric)` |  |  | sim |
| digest_envios_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| digest_envios_log_severidade_maxima_check | CHECK | `CHECK (severidade_maxima = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text]))` |  |  | sim |
| digest_envios_log_situacao_check | CHECK | `CHECK (situacao = ANY (ARRAY['enviado'::text, 'ignorado'::text, 'falhou'::text, 'simulado'::text]))` |  |  | sim |
| digest_envios_log_total_alertas_check | CHECK | `CHECK (total_alertas >= 0)` |  |  | sim |
| digest_envios_log_total_empresas_check | CHECK | `CHECK (total_empresas >= 0)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| digest_envios_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX digest_envios_log_pkey ON public.digest_envios_log USING btree (id)` |
| idx_digest_envios_log_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_digest_envios_log_created_at ON public.digest_envios_log USING btree (created_at DESC)` |


## Policies (RLS)

### `Admins podem consultar o log de envios do digest`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `digest_envios_log_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_user_admin()` |
| WITH CHECK | `is_user_admin()` |


## Triggers

_nenhum_


## Grants

_nenhum_

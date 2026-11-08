# public.bling_sync_logs

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
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `entity_type` | `text` | sim |  |  |  |
| 4 | `entity_id` | `text` | sim |  |  |  |
| 5 | `operation` | `text` | sim |  |  |  |
| 6 | `status` | `text` | não | `'pending'::text` |  |  |
| 7 | `error_message` | `text` | sim |  |  |  |
| 8 | `payload` | `jsonb` | sim |  |  |  |
| 9 | `response` | `jsonb` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `tipo` | `text` | não |  |  |  |
| 12 | `modulo` | `text` | não |  |  |  |
| 13 | `registros_processados` | `integer` | não | `0` |  |  |
| 14 | `registros_com_erro` | `integer` | não | `0` |  |  |
| 15 | `detalhes` | `jsonb` | sim |  |  |  |
| 16 | `mensagem_erro` | `text` | sim |  |  |  |
| 17 | `iniciado_em` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `finalizado_em` | `timestamp with time zone` | sim |  |  |  |
| 19 | `created_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bling_sync_logs_modulo_check | CHECK | `CHECK (char_length(modulo) >= 2 AND char_length(modulo) <= 80)` |  |  | sim |
| bling_sync_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| bling_sync_logs_registros_com_erro_check | CHECK | `CHECK (registros_com_erro >= 0)` |  |  | sim |
| bling_sync_logs_registros_processados_check | CHECK | `CHECK (registros_processados >= 0)` |  |  | sim |
| bling_sync_logs_status_check | CHECK | `CHECK (status = ANY (ARRAY['pendente'::text, 'executando'::text, 'sucesso'::text, 'erro'::text, 'parcial'::text]))` |  |  | sim |
| bling_sync_logs_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['manual'::text, 'automatica'::text, 'webhook'::text, 'retry'::text]))` |  |  | sim |
| bling_sync_periodo_valido | CHECK | `CHECK (finalizado_em IS NULL OR finalizado_em >= iniciado_em)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bling_sync_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bling_sync_logs_pkey ON public.bling_sync_logs USING btree (id)` |


## Policies (RLS)

### `bling_sync_logs_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role))` |

### `bling_sync_logs_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'operacional'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_

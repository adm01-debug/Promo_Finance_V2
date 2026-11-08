# public.eventos_contabilizacao_log

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
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `lancamento_id` | `uuid` | sim |  |  |  |
| 4 | `regra_id` | `uuid` | sim |  |  |  |
| 5 | `evento` | `text` | não |  |  |  |
| 6 | `status` | `text` | não | `'processado'::text` |  |  |
| 7 | `error_message` | `text` | sim |  |  |  |
| 8 | `detalhes` | `jsonb` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `tipo_evento` | `text` | não |  |  |  |
| 11 | `evento_id` | `uuid` | sim |  |  |  |
| 12 | `detalhe` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| eventos_contabilizacao_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| eventos_contabilizacao_log_regra_id_fkey | FOREIGN KEY | `FOREIGN KEY (regra_id) REFERENCES regras_contabilizacao_automatica(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| eventos_contabilizacao_log_status_check | CHECK | `CHECK (status = ANY (ARRAY['sucesso'::text, 'sem_regra'::text, 'erro'::text, 'duplicado'::text, 'simulado'::text]))` |  |  | sim |
| eventos_contabilizacao_log_tipo_evento_check | CHECK | `CHECK (tipo_evento = ANY (ARRAY['conta_pagar'::text, 'conta_receber'::text, 'movimentacao'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| eventos_contabilizacao_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX eventos_contabilizacao_log_pkey ON public.eventos_contabilizacao_log USING btree (id)` |
| uq_eventos_contab_sucesso | btree | tipo_evento, evento_id | sim | sim | `(status = 'sucesso'::text)` | `CREATE UNIQUE INDEX uq_eventos_contab_sucesso ON public.eventos_contabilizacao_log USING btree (tipo_evento, evento_id) WHERE (status = 'sucesso'::text)` |


## Policies (RLS)

### `eventos_contab_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_

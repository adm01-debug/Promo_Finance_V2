# public.execucoes_regua_cobranca

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
| 3 | `conta_receber_id` | `uuid` | sim |  |  |  |
| 4 | `etapa` | `text` | não |  |  |  |
| 5 | `canal` | `text` | sim |  |  |  |
| 6 | `status` | `text` | não |  |  |  |
| 7 | `mensagem_erro` | `text` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| execucao_falha_tem_motivo | CHECK | `CHECK (status = 'sucesso'::text OR mensagem_erro IS NOT NULL)` |  |  | sim |
| execucao_regua_status_motivo | CHECK | `CHECK ((status = ANY (ARRAY['sucesso'::text, 'processando'::text])) OR mensagem_erro IS NOT NULL)` |  |  | sim |
| execucoes_regua_cobranca_canal_check | CHECK | `CHECK (canal IS NULL OR (lower(canal) = ANY (ARRAY['email'::text, 'whatsapp'::text, 'sms'::text, 'telefone'::text])))` |  |  | sim |
| execucoes_regua_cobranca_conta_receber_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| execucoes_regua_cobranca_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| execucoes_regua_cobranca_etapa_check | CHECK | `CHECK (char_length(btrim(etapa)) >= 1 AND char_length(btrim(etapa)) <= 120)` |  |  | sim |
| execucoes_regua_cobranca_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| execucoes_regua_cobranca_status_check | CHECK | `CHECK (status = ANY (ARRAY['sucesso'::text, 'falha'::text, 'erro'::text, 'ignorado'::text, 'processando'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| execucoes_regua_cobranca_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX execucoes_regua_cobranca_pkey ON public.execucoes_regua_cobranca USING btree (id)` |
| idx_execucoes_regua_empresa | btree | empresa_id, created_at | não | sim |  | `CREATE INDEX idx_execucoes_regua_empresa ON public.execucoes_regua_cobranca USING btree (empresa_id, created_at DESC)` |
| uq_execucoes_regua_dia | btree | conta_receber_id, etapa | sim | sim | `((conta_receber_id IS NOT NULL) AND (canal IS NOT NULL))` | `CREATE UNIQUE INDEX uq_execucoes_regua_dia ON public.execucoes_regua_cobranca USING btree (conta_receber_id, etapa, lower(canal), (((created_at AT TIME ZONE 'UTC'::text))::date)) WHERE ((conta_receber_id IS NOT NULL) AND (canal IS NOT NULL))` |


## Policies (RLS)

### `execucoes_regua_select`

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

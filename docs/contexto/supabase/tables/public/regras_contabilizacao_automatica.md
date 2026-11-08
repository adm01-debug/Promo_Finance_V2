# public.regras_contabilizacao_automatica

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
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `nome` | `text` | não |  |  |  |
| 4 | `condicoes` | `jsonb` | não |  |  |  |
| 5 | `acoes` | `jsonb` | não |  |  |  |
| 6 | `ativo` | `boolean` | não | `true` |  |  |
| 7 | `prioridade` | `integer` | sim | `0` |  |  |
| 8 | `created_by` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `tipo_evento` | `text` | não |  |  |  |
| 12 | `categoria_id` | `uuid` | sim |  |  |  |
| 13 | `conta_debito_id` | `uuid` | não |  |  |  |
| 14 | `conta_credito_id` | `uuid` | não |  |  |  |
| 15 | `historico_template` | `text` | não | `''::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| regra_contas_distintas | CHECK | `CHECK (conta_debito_id <> conta_credito_id)` |  |  | sim |
| regra_nome_unico_empresa | UNIQUE | `UNIQUE (empresa_id, nome)` |  |  | sim |
| regras_contabilizacao_automatica_nome_check | CHECK | `CHECK (char_length(btrim(nome)) >= 2 AND char_length(btrim(nome)) <= 160)` |  |  | sim |
| regras_contabilizacao_automatica_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| regras_contabilizacao_automatica_prioridade_check | CHECK | `CHECK (prioridade >= 0)` |  |  | sim |
| regras_contabilizacao_automatica_tipo_evento_check | CHECK | `CHECK (tipo_evento = ANY (ARRAY['conta_pagar'::text, 'conta_receber'::text, 'movimentacao'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.eventos_contabilizacao_log | eventos_contabilizacao_log_regra_id_fkey | regra_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| regra_nome_unico_empresa | btree | empresa_id, nome | sim | sim |  | `CREATE UNIQUE INDEX regra_nome_unico_empresa ON public.regras_contabilizacao_automatica USING btree (empresa_id, nome)` |
| regras_contabilizacao_automatica_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX regras_contabilizacao_automatica_pkey ON public.regras_contabilizacao_automatica USING btree (id)` |


## Policies (RLS)

### `regras_contab_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |

### `regras_contab_write`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_acessivel(empresa_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'contador'::app_role)))` |
| WITH CHECK | `(empresa_acessivel(empresa_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'contador'::app_role)))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_regras_contab_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

_nenhum_

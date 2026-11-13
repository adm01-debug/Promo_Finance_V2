# public.operacoes_icms

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
| 3 | `uf_origem` | `text` | não |  |  |  |
| 4 | `uf_destino` | `text` | não |  |  |  |
| 5 | `ncm` | `text` | sim |  |  |  |
| 6 | `cfop` | `text` | sim |  |  |  |
| 7 | `cst` | `text` | sim |  |  |  |
| 8 | `base_calculo` | `numeric(14,2)` | sim |  |  |  |
| 9 | `aliquota` | `numeric(6,4)` | sim |  |  |  |
| 10 | `valor_icms` | `numeric(14,2)` | sim |  |  |  |
| 11 | `reducao_bc` | `numeric(5,2)` | sim |  |  |  |
| 12 | `periodo_referencia` | `date` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `valor_operacao` | `numeric(15,2)` | não |  |  |  |
| 15 | `tipo_destinatario` | `tipo_destinatario` | não |  |  |  |
| 16 | `finalidade` | `text` | sim |  |  |  |
| 17 | `tipo_operacao` | `text` | não |  |  |  |
| 18 | `tributos_aplicaveis` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 19 | `tributos_nao_aplicaveis` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 20 | `valor_total_icms` | `numeric(15,2)` | não | `0` |  |  |
| 21 | `icms_operacao_propria` | `numeric(15,2)` | não | `0` |  |  |
| 22 | `icms_st` | `numeric(15,2)` | não | `0` |  |  |
| 23 | `difal` | `numeric(15,2)` | não | `0` |  |  |
| 24 | `fcp` | `numeric(15,2)` | não | `0` |  |  |
| 25 | `data_operacao` | `date` | não | `CURRENT_DATE` |  |  |
| 26 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| operacoes_icms_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| operacoes_icms_finalidade_check | CHECK | `CHECK (finalidade IS NULL OR (finalidade = ANY (ARRAY['REVENDA'::text, 'USO_CONSUMO'::text, 'ATIVO_IMOBILIZADO'::text, 'INDUSTRIALIZACAO'::text])))` |  |  | sim |
| operacoes_icms_ncm_check | CHECK | `CHECK (ncm ~ '^[0-9]{8}$'::text)` |  |  | sim |
| operacoes_icms_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| operacoes_icms_tipo_operacao_check | CHECK | `CHECK (tipo_operacao = ANY (ARRAY['INTERNA'::text, 'INTERESTADUAL'::text]))` |  |  | sim |
| operacoes_icms_valor_operacao_check | CHECK | `CHECK (valor_operacao >= 0::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_operacoes_icms_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_operacoes_icms_empresa_id ON public.operacoes_icms USING btree (empresa_id)` |
| operacoes_icms_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX operacoes_icms_pkey ON public.operacoes_icms USING btree (id)` |


## Policies (RLS)

### `operacoes_icms_acesso`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK | `empresa_acessivel(empresa_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_operacoes_icms_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

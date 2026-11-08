# public.fornecedores

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_contas_pagar_painel |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `razao_social` | `character varying(255)` | não |  |  |  |
| 3 | `cnpj` | `character varying(20)` | sim |  |  |  |
| 4 | `user_id` | `uuid` | sim |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `nome_fantasia` | `text` | sim |  |  |  |
| 8 | `ativo` | `boolean` | não | `true` |  |  |
| 9 | `cidade` | `text` | sim |  |  |  |
| 10 | `cnpj_cpf` | `text` | sim |  |  |  |
| 11 | `contato` | `text` | sim |  |  |  |
| 12 | `email` | `text` | sim |  |  |  |
| 13 | `endereco` | `text` | sim |  |  |  |
| 14 | `estado` | `text` | sim |  |  |  |
| 15 | `limite_credito` | `numeric` | sim | `0` |  |  |
| 16 | `nome` | `text` | sim |  |  |  |
| 17 | `observacoes` | `text` | sim |  |  |  |
| 18 | `ramo_atividade` | `text` | sim |  |  |  |
| 19 | `score` | `numeric` | sim | `0` |  |  |
| 20 | `telefone` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| fornecedores_cnpj_key | UNIQUE | `UNIQUE (cnpj)` |  |  | sim |
| fornecedores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| fornecedores_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.contas_pagar | contas_pagar_fornecedor_id_fkey | fornecedor_id | SET NULL |
| public.contratos | contratos_fornecedor_id_fkey | fornecedor_id | SET NULL |
| public.pedidos_compra | pedidos_compra_fornecedor_id_fkey | fornecedor_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| fornecedores_cnpj_key | btree | cnpj | sim | sim |  | `CREATE UNIQUE INDEX fornecedores_cnpj_key ON public.fornecedores USING btree (cnpj)` |
| fornecedores_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX fornecedores_pkey ON public.fornecedores USING btree (id)` |
| idx_fornecedores_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_fornecedores_user_id_fk ON public.fornecedores USING btree (user_id)` |


## Policies (RLS)

### `fornecedores_owner_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `fornecedores_owner_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `fornecedores_owner_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `fornecedores_owner_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_d05a1e8f4af4f67d1bb5 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_

# public.pedidos_compra

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
| 2 | `fornecedor_id` | `uuid` | sim |  |  |  |
| 3 | `status` | `text` | não | `'rascunho'::text` |  |  |
| 4 | `valor_total` | `numeric` | não | `0` |  |  |
| 5 | `data_emissao` | `date` | sim | `CURRENT_DATE` |  |  |
| 6 | `previsao_entrega` | `date` | sim |  |  |  |
| 7 | `observacoes` | `text` | sim |  |  |  |
| 8 | `empresa_id` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pedidos_compra_fornecedor_id_fkey | FOREIGN KEY | `FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)` | NO ACTION | NO ACTION | sim |
| pedidos_compra_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.itens_pedido_compra | itens_pedido_compra_pedido_id_fkey | pedido_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| pedidos_compra_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX pedidos_compra_pkey ON public.pedidos_compra USING btree (id)` |


## Policies (RLS)

### `pedidos_compra_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_

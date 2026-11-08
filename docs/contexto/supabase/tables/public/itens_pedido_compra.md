# public.itens_pedido_compra

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
| 2 | `pedido_id` | `uuid` | não |  |  |  |
| 3 | `descricao` | `text` | não |  |  |  |
| 4 | `quantidade` | `numeric` | não | `1` |  |  |
| 5 | `valor_unitario` | `numeric` | não | `0` |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| itens_pedido_compra_pedido_id_fkey | FOREIGN KEY | `FOREIGN KEY (pedido_id) REFERENCES pedidos_compra(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| itens_pedido_compra_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| itens_pedido_compra_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX itens_pedido_compra_pkey ON public.itens_pedido_compra USING btree (id)` |


## Policies (RLS)

### `itens_pedido_compra_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(pedido_id IN ( SELECT pedidos_compra.id    FROM pedidos_compra   WHERE (pedidos_compra.empresa_id IN ( SELECT user_empresas.empresa_id            FROM user_empresas           WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_

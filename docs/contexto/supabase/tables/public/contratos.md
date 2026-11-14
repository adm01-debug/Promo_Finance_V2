# public.contratos

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `empresa_id` | `uuid` | sim |  |  |  |
| 4 | `descricao` | `text` | não |  |  |  |
| 5 | `numero_contrato` | `text` | sim |  |  |  |
| 6 | `status` | `text` | sim | `'ativo'::text` |  |  |
| 7 | `tipo` | `text` | sim |  |  |  |
| 8 | `data_inicio` | `date` | sim |  |  |  |
| 9 | `data_fim` | `date` | sim |  |  |  |
| 10 | `renovacao_automatica` | `boolean` | sim | `false` |  |  |
| 11 | `valor_mensal` | `numeric(15,2)` | sim |  |  |  |
| 12 | `valor_total` | `numeric(15,2)` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `cliente_id` | `uuid` | sim |  |  |  |
| 15 | `fornecedor_id` | `uuid` | sim |  |  |  |
| 16 | `created_by` | `uuid` | sim |  |  |  |
| 17 | `observacoes` | `text` | sim |  |  |  |
| 18 | `dias_aviso_renovacao` | `integer` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contratos_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contratos_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| contratos_fornecedor_id_fkey | FOREIGN KEY | `FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contratos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contratos_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contratos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contratos_pkey ON public.contratos USING btree (id)` |
| idx_contratos_cliente_id_fk | btree | cliente_id | não | sim |  | `CREATE INDEX idx_contratos_cliente_id_fk ON public.contratos USING btree (cliente_id)` |
| idx_contratos_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_contratos_empresa_id ON public.contratos USING btree (empresa_id)` |
| idx_contratos_fornecedor_id_fk | btree | fornecedor_id | não | sim |  | `CREATE INDEX idx_contratos_fornecedor_id_fk ON public.contratos USING btree (fornecedor_id)` |
| idx_contratos_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_contratos_user_id_fk ON public.contratos USING btree (user_id)` |


## Policies (RLS)

### `Empresa-based access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

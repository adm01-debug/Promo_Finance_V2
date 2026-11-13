# public.transferencias

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
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `conta_origem_id` | `uuid` | sim |  |  |  |
| 5 | `conta_destino_id` | `uuid` | sim |  |  |  |
| 6 | `valor` | `numeric(15,2)` | não |  |  |  |
| 7 | `descricao` | `text` | sim |  |  |  |
| 8 | `data_transferencia` | `date` | sim | `CURRENT_DATE` |  |  |
| 9 | `status` | `text` | sim | `'concluido'::text` |  |  |
| 10 | `chave_pix` | `text` | sim |  |  |  |
| 11 | `pix_chave_destino` | `text` | sim |  |  |  |
| 12 | `favorecido_nome` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `tipo` | `text` | sim |  |  |  |
| 15 | `movimentacao_id` | `uuid` | sim |  |  |  |
| 16 | `observacoes` | `text` | sim |  |  |  |
| 17 | `cancelado_em` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| transferencias_conta_destino_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_destino_id) REFERENCES contas_bancarias(id)` | NO ACTION | NO ACTION | sim |
| transferencias_conta_origem_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_origem_id) REFERENCES contas_bancarias(id)` | NO ACTION | NO ACTION | sim |
| transferencias_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| transferencias_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| transferencias_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_transferencias_conta_destino_id_fk | btree | conta_destino_id | não | sim |  | `CREATE INDEX idx_transferencias_conta_destino_id_fk ON public.transferencias USING btree (conta_destino_id)` |
| idx_transferencias_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_transferencias_empresa_id ON public.transferencias USING btree (empresa_id)` |
| idx_transferencias_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_transferencias_user_id_fk ON public.transferencias USING btree (user_id)` |
| transferencias_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX transferencias_pkey ON public.transferencias USING btree (id)` |


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

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_transferencia_movimentacao | AFTER | INSERT OR UPDATE | ROW | enabled | public.fn_transferencia_movimentacao |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

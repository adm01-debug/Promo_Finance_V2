# public.negativacoes

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
| 2 | `cliente_id` | `uuid` | sim |  |  |  |
| 3 | `conta_receber_id` | `uuid` | sim |  |  |  |
| 4 | `valor` | `numeric` | não |  |  |  |
| 5 | `status` | `text` | não | `'ativo'::text` |  |  |
| 6 | `bureau` | `text` | sim |  |  |  |
| 7 | `motivo` | `text` | sim |  |  |  |
| 8 | `data_negativacao` | `date` | sim | `CURRENT_DATE` |  |  |
| 9 | `data_baixa` | `date` | sim |  |  |  |
| 10 | `empresa_id` | `uuid` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `protocolo` | `text` | sim |  |  |  |
| 13 | `observacoes` | `text` | sim |  |  |  |
| 14 | `created_by` | `uuid` | sim | `auth.uid()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| negativacoes_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id)` | NO ACTION | NO ACTION | sim |
| negativacoes_conta_receber_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id)` | NO ACTION | NO ACTION | sim |
| negativacoes_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| negativacoes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_negativacoes_cliente_id_fk | btree | cliente_id | não | sim |  | `CREATE INDEX idx_negativacoes_cliente_id_fk ON public.negativacoes USING btree (cliente_id)` |
| idx_negativacoes_conta_receber_id_fk | btree | conta_receber_id | não | sim |  | `CREATE INDEX idx_negativacoes_conta_receber_id_fk ON public.negativacoes USING btree (conta_receber_id)` |
| idx_negativacoes_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_negativacoes_created_by ON public.negativacoes USING btree (created_by)` |
| idx_negativacoes_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_negativacoes_empresa_id ON public.negativacoes USING btree (empresa_id)` |
| negativacoes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX negativacoes_pkey ON public.negativacoes USING btree (id)` |


## Policies (RLS)

### `negativacoes_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `negativacoes_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

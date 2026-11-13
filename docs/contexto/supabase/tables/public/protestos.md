# public.protestos

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
| 6 | `cartorio` | `text` | sim |  |  |  |
| 7 | `numero_protesto` | `text` | sim |  |  |  |
| 8 | `data_protesto` | `date` | sim | `CURRENT_DATE` |  |  |
| 9 | `data_cancelamento` | `date` | sim |  |  |  |
| 10 | `empresa_id` | `uuid` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `cidade_cartorio` | `text` | sim |  |  |  |
| 13 | `estado_cartorio` | `text` | sim |  |  |  |
| 14 | `custas` | `numeric` | sim | `0` |  |  |
| 15 | `observacoes` | `text` | sim |  |  |  |
| 16 | `data_pagamento` | `date` | sim |  |  |  |
| 17 | `created_by` | `uuid` | sim | `auth.uid()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| protestos_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id)` | NO ACTION | NO ACTION | sim |
| protestos_conta_receber_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id)` | NO ACTION | NO ACTION | sim |
| protestos_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| protestos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_protestos_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_protestos_created_by ON public.protestos USING btree (created_by)` |
| idx_protestos_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_protestos_empresa_id ON public.protestos USING btree (empresa_id)` |
| protestos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX protestos_pkey ON public.protestos USING btree (id)` |


## Policies (RLS)

### `protestos_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `protestos_tenant_rw`

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

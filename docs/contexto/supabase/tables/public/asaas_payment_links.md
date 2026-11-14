# public.asaas_payment_links

> Espelho local de paymentLinks criados via asaas-proxy, com empresa_id — permite a listar_links_pagamento filtrar por empresa, já que a API do Asaas não amarra paymentLinks a empresa.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `asaas_link_id` | `text` | não |  |  |  |
| 3 | `empresa_id` | `uuid` | não |  |  |  |
| 4 | `nome` | `text` | não |  |  |  |
| 5 | `valor` | `numeric(14,2)` | sim |  |  |  |
| 6 | `url` | `text` | sim |  |  |  |
| 7 | `created_by` | `uuid` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| asaas_payment_links_asaas_link_id_key | UNIQUE | `UNIQUE (asaas_link_id)` |  |  | sim |
| asaas_payment_links_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| asaas_payment_links_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| asaas_payment_links_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| asaas_payment_links_asaas_link_id_key | btree | asaas_link_id | sim | sim |  | `CREATE UNIQUE INDEX asaas_payment_links_asaas_link_id_key ON public.asaas_payment_links USING btree (asaas_link_id)` |
| asaas_payment_links_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX asaas_payment_links_pkey ON public.asaas_payment_links USING btree (id)` |
| idx_asaas_payment_links_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_asaas_payment_links_created_by_fk ON public.asaas_payment_links USING btree (created_by)` |
| idx_asaas_payment_links_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_asaas_payment_links_empresa_id ON public.asaas_payment_links USING btree (empresa_id)` |


## Policies (RLS)

### `Admins e financeiro podem inserir links de pagamento ASAAS`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Admins e financeiro podem ver links de pagamento ASAAS`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Service role full access asaas_payment_links`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

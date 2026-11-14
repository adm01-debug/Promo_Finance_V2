# public.asaas_payments

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
| 3 | `asaas_id` | `text` | sim |  |  |  |
| 4 | `asaas_customer_id` | `uuid` | sim |  |  |  |
| 5 | `conta_receber_id` | `uuid` | sim |  |  |  |
| 6 | `tipo` | `text` | sim |  |  |  |
| 7 | `status` | `text` | sim | `'PENDING'::text` |  |  |
| 8 | `valor` | `numeric(14,2)` | sim | `0` |  |  |
| 9 | `valor_liquido` | `numeric(14,2)` | sim |  |  |  |
| 10 | `data_vencimento` | `date` | sim |  |  |  |
| 11 | `data_pagamento` | `date` | sim |  |  |  |
| 12 | `descricao` | `text` | sim |  |  |  |
| 13 | `invoice_url` | `text` | sim |  |  |  |
| 14 | `bank_slip_url` | `text` | sim |  |  |  |
| 15 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `nosso_numero` | `text` | sim |  |  |  |
| 19 | `codigo_barras` | `text` | sim |  |  |  |
| 20 | `linha_digitavel` | `text` | sim |  |  |  |
| 21 | `pix_qrcode` | `text` | sim |  |  |  |
| 22 | `pix_copia_cola` | `text` | sim |  |  |  |
| 23 | `link_boleto` | `text` | sim |  |  |  |
| 24 | `link_fatura` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| asaas_payments_asaas_customer_id_fkey | FOREIGN KEY | `FOREIGN KEY (asaas_customer_id) REFERENCES asaas_customers(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| asaas_payments_asaas_id_key | UNIQUE | `UNIQUE (asaas_id)` |  |  | sim |
| asaas_payments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.asaas_audit_trail | asaas_audit_trail_asaas_payment_id_fkey | asaas_payment_id | CASCADE |
| public.asaas_sync_queue | asaas_sync_queue_asaas_payment_id_fkey | asaas_payment_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| asaas_payments_asaas_id_key | btree | asaas_id | sim | sim |  | `CREATE UNIQUE INDEX asaas_payments_asaas_id_key ON public.asaas_payments USING btree (asaas_id)` |
| asaas_payments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX asaas_payments_pkey ON public.asaas_payments USING btree (id)` |
| idx_asaas_payments_asaas_customer_id_fk | btree | asaas_customer_id | não | sim |  | `CREATE INDEX idx_asaas_payments_asaas_customer_id_fk ON public.asaas_payments USING btree (asaas_customer_id)` |


## Policies (RLS)

### `asaas_payments_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `asaas_payments_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_60e90ad3dec9516f2ca9 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

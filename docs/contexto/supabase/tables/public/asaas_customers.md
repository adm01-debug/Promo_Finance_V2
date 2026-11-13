# public.asaas_customers

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
| 3 | `cliente_id` | `uuid` | sim |  |  |  |
| 4 | `asaas_id` | `text` | sim |  |  |  |
| 5 | `razao_social` | `text` | sim |  |  |  |
| 6 | `nome` | `text` | sim |  |  |  |
| 7 | `cpf_cnpj` | `text` | sim |  |  |  |
| 8 | `email` | `text` | sim |  |  |  |
| 9 | `telefone` | `text` | sim |  |  |  |
| 10 | `endereco` | `jsonb` | sim |  |  |  |
| 11 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| asaas_customers_asaas_id_key | UNIQUE | `UNIQUE (asaas_id)` |  |  | sim |
| asaas_customers_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.asaas_payments | asaas_payments_asaas_customer_id_fkey | asaas_customer_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| asaas_customers_asaas_id_key | btree | asaas_id | sim | sim |  | `CREATE UNIQUE INDEX asaas_customers_asaas_id_key ON public.asaas_customers USING btree (asaas_id)` |
| asaas_customers_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX asaas_customers_pkey ON public.asaas_customers USING btree (id)` |


## Policies (RLS)

### `asaas_customers_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `asaas_customers_tenant_rw`

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
| set_updated_at_9d8cee55d8b7c2070327 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

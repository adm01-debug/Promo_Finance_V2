# public.asaas_reconciliation_suggestions

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
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `transaction_id` | `text` | sim |  |  |  |
| 4 | `conta_receber_id` | `uuid` | sim |  |  |  |
| 5 | `score` | `numeric(5,4)` | sim | `0` |  |  |
| 6 | `status` | `text` | sim | `'PENDING'::text` |  |  |
| 7 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `contas_receber_id` | `uuid` | sim |  |  |  |
| 11 | `contas_pagar_id` | `uuid` | sim |  |  |  |
| 12 | `descricao` | `text` | sim |  |  |  |
| 13 | `valor` | `numeric` | sim |  |  |  |
| 14 | `data_vencimento` | `date` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| asaas_reconciliation_suggestions_contas_pagar_id_fkey | FOREIGN KEY | `FOREIGN KEY (contas_pagar_id) REFERENCES contas_pagar(id)` | NO ACTION | NO ACTION | sim |
| asaas_reconciliation_suggestions_contas_receber_id_fkey | FOREIGN KEY | `FOREIGN KEY (contas_receber_id) REFERENCES contas_receber(id)` | NO ACTION | NO ACTION | sim |
| asaas_reconciliation_suggestions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| asaas_reconciliation_suggestions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX asaas_reconciliation_suggestions_pkey ON public.asaas_reconciliation_suggestions USING btree (id)` |


## Policies (RLS)

### `asaas_recon_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `asaas_reconciliation_suggestions_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_4efff01553ff16302e45 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

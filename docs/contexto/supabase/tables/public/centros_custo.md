# public.centros_custo

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
| usada por views | public.vw_contas_pagar_painel, public.vw_contas_receber_painel |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `nome` | `text` | não |  |  |  |
| 3 | `codigo` | `text` | sim |  |  |  |
| 4 | `ativo` | `boolean` | sim | `true` |  |  |
| 5 | `empresa_id` | `uuid` | sim |  |  |  |
| 6 | `user_id` | `uuid` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `descricao` | `text` | sim |  |  |  |
| 9 | `responsavel` | `text` | sim |  |  |  |
| 10 | `orcamento_previsto` | `numeric(14,2)` | sim | `0` |  |  |
| 11 | `orcamento_realizado` | `numeric(14,2)` | sim | `0` |  |  |
| 12 | `parent_id` | `uuid` | sim |  |  |  |
| 13 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `tipo` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| centros_custo_parent_id_fkey | FOREIGN KEY | `FOREIGN KEY (parent_id) REFERENCES centros_custo(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| centros_custo_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| centros_custo_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.centros_custo | centros_custo_parent_id_fkey | parent_id | SET NULL |
| public.contas_pagar | contas_pagar_centro_custo_id_fkey | centro_custo_id | SET NULL |
| public.contas_receber | contas_receber_centro_custo_id_fkey | centro_custo_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| centros_custo_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX centros_custo_pkey ON public.centros_custo USING btree (id)` |
| idx_centros_custo_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_centros_custo_user_id_fk ON public.centros_custo USING btree (user_id)` |


## Policies (RLS)

### `Admins can manage centros de custo`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role))` |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role))` |

### `centros_custo_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `centros_custo_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `((has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_0d5cf71cba5e923b906a | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_

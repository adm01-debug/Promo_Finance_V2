# public.apuracoes_tributarias

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
| usada por views | public.vw_tributario_dashboard |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `tipo_tributo` | `text` | sim |  |  |  |
| 4 | `competencia` | `text` | sim |  |  |  |
| 5 | `valor_total` | `numeric` | sim |  |  |  |
| 6 | `status` | `text` | sim | `'pendente'::text` |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `ano` | `integer` | sim |  |  |  |
| 9 | `mes` | `integer` | sim |  |  |  |
| 10 | `cbs_debitos` | `numeric` | sim | `0` |  |  |
| 11 | `cbs_creditos` | `numeric` | sim | `0` |  |  |
| 12 | `cbs_a_pagar` | `numeric` | sim | `0` |  |  |
| 13 | `cbs_a_compensar` | `numeric` | sim | `0` |  |  |
| 14 | `ibs_debitos` | `numeric` | sim | `0` |  |  |
| 15 | `ibs_creditos` | `numeric` | sim | `0` |  |  |
| 16 | `ibs_a_pagar` | `numeric` | sim | `0` |  |  |
| 17 | `ibs_a_compensar` | `numeric` | sim | `0` |  |  |
| 18 | `cbs_saldo_anterior` | `numeric` | sim | `0` |  |  |
| 19 | `ibs_saldo_anterior` | `numeric` | sim | `0` |  |  |
| 20 | `is_debitos` | `numeric` | sim | `0` |  |  |
| 21 | `is_creditos` | `numeric` | sim | `0` |  |  |
| 22 | `is_a_pagar` | `numeric` | sim | `0` |  |  |
| 23 | `is_a_compensar` | `numeric` | sim | `0` |  |  |
| 24 | `icms_debitos` | `numeric` | sim | `0` |  |  |
| 25 | `icms_creditos` | `numeric` | sim | `0` |  |  |
| 26 | `icms_a_pagar` | `numeric` | sim | `0` |  |  |
| 27 | `iss_debitos` | `numeric` | sim | `0` |  |  |
| 28 | `iss_creditos` | `numeric` | sim | `0` |  |  |
| 29 | `iss_a_pagar` | `numeric` | sim | `0` |  |  |
| 30 | `icms_residual` | `numeric` | sim | `0` |  |  |
| 31 | `iss_residual` | `numeric` | sim | `0` |  |  |
| 32 | `pis_residual` | `numeric` | sim | `0` |  |  |
| 33 | `cofins_residual` | `numeric` | sim | `0` |  |  |
| 34 | `total_tributos_novos` | `numeric` | sim | `0` |  |  |
| 35 | `total_tributos_residuais` | `numeric` | sim | `0` |  |  |
| 36 | `total_geral` | `numeric` | sim | `0` |  |  |
| 37 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| apuracoes_tributarias_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| apuracoes_tributarias_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| apuracoes_tributarias_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX apuracoes_tributarias_pkey ON public.apuracoes_tributarias USING btree (id)` |
| idx_apuracoes_tributarias_empresa | btree | empresa_id | não | sim |  | `CREATE INDEX idx_apuracoes_tributarias_empresa ON public.apuracoes_tributarias USING btree (empresa_id)` |


## Policies (RLS)

### `apuracoes_tributarias_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `apuracoes_tributarias_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `apuracoes_tributarias_tenant_rw`

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
| set_updated_at_414e25aed7d9071a4748 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_

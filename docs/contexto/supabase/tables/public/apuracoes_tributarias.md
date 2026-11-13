# public.apuracoes_tributarias

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 6 |
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
| 38 | `data_transmissao` | `timestamp with time zone` | sim |  |  |  |
| 39 | `protocolo_transmissao` | `text` | sim |  |  |  |
| 40 | `created_by` | `uuid` | sim | `auth.uid()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| apuracoes_tributarias_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| apuracoes_tributarias_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| apuracoes_tributarias_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.creditos_tributarios | creditos_tributarios_apuracao_id_fkey | apuracao_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| apuracoes_tributarias_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX apuracoes_tributarias_pkey ON public.apuracoes_tributarias USING btree (id)` |
| idx_apuracoes_tributarias_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_apuracoes_tributarias_created_by ON public.apuracoes_tributarias USING btree (created_by)` |
| idx_apuracoes_tributarias_empresa | btree | empresa_id | não | sim |  | `CREATE INDEX idx_apuracoes_tributarias_empresa ON public.apuracoes_tributarias USING btree (empresa_id)` |


## Policies (RLS)

### `Admin pode deletar apuracoes_tributarias`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Financeiro+ podem atualizar apuracoes_tributarias`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem inserir apuracoes_tributarias`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem ver apuracoes_tributarias`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

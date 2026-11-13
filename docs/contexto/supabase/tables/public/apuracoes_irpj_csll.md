# public.apuracoes_irpj_csll

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `periodo_inicio` | `date` | não |  |  |  |
| 4 | `periodo_fim` | `date` | não |  |  |  |
| 5 | `lucro_antes_impostos` | `numeric` | sim | `0` |  |  |
| 6 | `irpj_valor` | `numeric` | sim | `0` |  |  |
| 7 | `csll_valor` | `numeric` | sim | `0` |  |  |
| 8 | `status` | `text` | sim | `'rascunho'::text` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `tipo_apuracao` | `text` | sim |  |  |  |
| 11 | `ano` | `integer` | sim |  |  |  |
| 12 | `lucro_contabil` | `numeric` | sim | `0` |  |  |
| 13 | `adicoes_permanentes` | `numeric` | sim | `0` |  |  |
| 14 | `adicoes_temporarias` | `numeric` | sim | `0` |  |  |
| 15 | `total_adicoes` | `numeric` | sim | `0` |  |  |
| 16 | `exclusoes_permanentes` | `numeric` | sim | `0` |  |  |
| 17 | `exclusoes_temporarias` | `numeric` | sim | `0` |  |  |
| 18 | `total_exclusoes` | `numeric` | sim | `0` |  |  |
| 19 | `irrf_retido` | `numeric` | sim | `0` |  |  |
| 20 | `csrf_retido` | `numeric` | sim | `0` |  |  |
| 21 | `saldo_negativo_anterior` | `numeric` | sim | `0` |  |  |
| 22 | `compensacao_prejuizo` | `numeric` | sim | `0` |  |  |
| 23 | `base_calculo_irpj` | `numeric` | sim | `0` |  |  |
| 24 | `base_calculo_csll` | `numeric` | sim | `0` |  |  |
| 25 | `adicional_irpj` | `numeric` | sim | `0` |  |  |
| 26 | `lucro_real_antes_compensacao` | `numeric` | sim | `0` |  |  |
| 27 | `compensacao_prejuizos` | `numeric` | sim | `0` |  |  |
| 28 | `lucro_real` | `numeric` | sim | `0` |  |  |
| 29 | `irpj_aliquota_normal` | `numeric` | sim | `15` |  |  |
| 30 | `irpj_aliquota_adicional` | `numeric` | sim | `10` |  |  |
| 31 | `csll_aliquota` | `numeric` | sim | `9` |  |  |
| 32 | `pat_deducao` | `numeric` | sim | `0` |  |  |
| 33 | `outros_incentivos` | `numeric` | sim | `0` |  |  |
| 34 | `estimativas_pagas` | `numeric` | sim | `0` |  |  |
| 35 | `created_by` | `uuid` | sim |  |  |  |
| 36 | `csll_a_pagar` | `numeric(14,2)` | não | `0` |  |  |
| 37 | `csll_base` | `numeric(14,2)` | não | `0` |  |  |
| 38 | `csll_total` | `numeric(14,2)` | não | `0` |  |  |
| 39 | `data_transmissao` | `timestamp with time zone` | sim |  |  |  |
| 40 | `irpj_a_pagar` | `numeric(14,2)` | não | `0` |  |  |
| 41 | `irpj_adicional` | `numeric(14,2)` | não | `0` |  |  |
| 42 | `irpj_adicional_base` | `numeric(14,2)` | não | `0` |  |  |
| 43 | `irpj_incentivos_deducoes` | `numeric(14,2)` | não | `0` |  |  |
| 44 | `irpj_normal` | `numeric(14,2)` | não | `0` |  |  |
| 45 | `irpj_total` | `numeric(14,2)` | não | `0` |  |  |
| 46 | `mes` | `integer` | sim |  |  |  |
| 47 | `numero_recibo` | `text` | sim |  |  |  |
| 48 | `saldo_negativo_csll` | `numeric(14,2)` | não | `0` |  |  |
| 49 | `saldo_negativo_irpj` | `numeric(14,2)` | não | `0` |  |  |
| 50 | `total_tributos` | `numeric(14,2)` | não | `0` |  |  |
| 51 | `trimestre` | `integer` | sim |  |  |  |
| 52 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| apuracoes_irpj_csll_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| apuracoes_irpj_csll_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| apuracoes_irpj_csll_mes_check | CHECK | `CHECK (mes IS NULL OR mes >= 1 AND mes <= 12)` |  |  | sim |
| apuracoes_irpj_csll_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| apuracoes_irpj_csll_trimestre_check | CHECK | `CHECK (trimestre IS NULL OR trimestre >= 1 AND trimestre <= 4)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| apuracoes_irpj_csll_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX apuracoes_irpj_csll_pkey ON public.apuracoes_irpj_csll USING btree (id)` |
| idx_apuracoes_irpj_csll_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_apuracoes_irpj_csll_created_by_fk ON public.apuracoes_irpj_csll USING btree (created_by)` |
| idx_apuracoes_irpj_csll_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_apuracoes_irpj_csll_empresa_id ON public.apuracoes_irpj_csll USING btree (empresa_id)` |


## Policies (RLS)

### `Admin pode deletar apuracoes_irpj_csll`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Empresa-based access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |

### `Financeiro+ podem atualizar apuracoes_irpj_csll`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem inserir apuracoes_irpj_csll`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem ver apuracoes_irpj_csll`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.prejuizos_fiscais

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `periodo` | `date` | não |  |  |  |
| 4 | `valor_acumulado` | `numeric` | sim | `0` |  |  |
| 5 | `valor_utilizado` | `numeric` | sim | `0` |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `tipo` | `text` | sim |  |  |  |
| 8 | `ano_origem` | `integer` | sim |  |  |  |
| 9 | `valor_original` | `numeric` | sim | `0` |  |  |
| 10 | `valor_compensado` | `numeric` | sim | `0` |  |  |
| 11 | `saldo_atual` | `numeric` | sim | `0` |  |  |
| 12 | `saldo_disponivel` | `numeric` | sim | `0` |  |  |
| 13 | `status` | `text` | sim | `'disponivel'::text` |  |  |
| 14 | `created_by` | `uuid` | sim |  |  |  |
| 15 | `trimestre_origem` | `integer` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| prejuizos_fiscais_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| prejuizos_fiscais_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| prejuizos_fiscais_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| prejuizos_fiscais_trimestre_origem_check | CHECK | `CHECK (trimestre_origem IS NULL OR trimestre_origem >= 1 AND trimestre_origem <= 4)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_prejuizos_fiscais_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_prejuizos_fiscais_created_by_fk ON public.prejuizos_fiscais USING btree (created_by)` |
| idx_prejuizos_fiscais_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_prejuizos_fiscais_empresa_id ON public.prejuizos_fiscais USING btree (empresa_id)` |
| prejuizos_fiscais_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX prejuizos_fiscais_pkey ON public.prejuizos_fiscais USING btree (id)` |


## Policies (RLS)

### `Admin pode deletar prejuizos_fiscais`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Financeiro+ podem atualizar prejuizos_fiscais`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem inserir prejuizos_fiscais`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem ver prejuizos_fiscais`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `prejuizos_fiscais_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `prejuizos_fiscais_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

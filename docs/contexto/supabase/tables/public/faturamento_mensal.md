# public.faturamento_mensal

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_dre_mensal |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `mes_referencia` | `date` | não |  |  |  |
| 4 | `valor_faturamento` | `numeric` | sim | `0` |  |  |
| 5 | `valor_impostos` | `numeric` | sim | `0` |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `ano` | `integer` | sim |  |  |  |
| 8 | `mes` | `integer` | sim |  |  |  |
| 9 | `receita_bruta` | `numeric` | sim | `0` |  |  |
| 10 | `receita_servicos` | `numeric` | sim | `0` |  |  |
| 11 | `receita_vendas` | `numeric` | sim | `0` |  |  |
| 12 | `impostos_federais` | `numeric` | sim | `0` |  |  |
| 13 | `impostos_municipais` | `numeric` | sim | `0` |  |  |
| 14 | `created_by` | `uuid` | sim |  |  |  |
| 15 | `receita_revenda` | `numeric` | sim | `0` |  |  |
| 16 | `receita_industria` | `numeric` | sim | `0` |  |  |
| 17 | `receita_exportacao` | `numeric` | sim | `0` |  |  |
| 18 | `observacoes` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| faturamento_mensal_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| faturamento_mensal_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| faturamento_mensal_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| faturamento_mensal_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX faturamento_mensal_pkey ON public.faturamento_mensal USING btree (id)` |
| idx_faturamento_mensal_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_faturamento_mensal_created_by_fk ON public.faturamento_mensal USING btree (created_by)` |
| ux_faturamento_mensal_empresa_ano_mes | btree | empresa_id, ano, mes | sim | sim |  | `CREATE UNIQUE INDEX ux_faturamento_mensal_empresa_ano_mes ON public.faturamento_mensal USING btree (empresa_id, ano, mes)` |


## Policies (RLS)

### `Empresa-based access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

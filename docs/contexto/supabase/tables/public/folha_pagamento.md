# public.folha_pagamento

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `mes_referencia` | `date` | não |  |  |  |
| 4 | `valor_total` | `numeric` | sim | `0` |  |  |
| 5 | `qtd_funcionarios` | `integer` | sim | `0` |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `ano` | `integer` | sim |  |  |  |
| 8 | `mes` | `integer` | sim |  |  |  |
| 9 | `salarios` | `numeric` | sim | `0` |  |  |
| 10 | `pro_labore` | `numeric` | sim | `0` |  |  |
| 11 | `encargos` | `numeric` | sim | `0` |  |  |
| 12 | `beneficios` | `numeric` | sim | `0` |  |  |
| 13 | `created_by` | `uuid` | sim |  |  |  |
| 14 | `total_folha` | `numeric` | sim | `0` |  |  |
| 15 | `observacoes` | `text` | sim |  |  |  |
| 16 | `numero_funcionarios` | `integer` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| folha_pagamento_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| folha_pagamento_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| folha_pagamento_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| folha_pagamento_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX folha_pagamento_pkey ON public.folha_pagamento USING btree (id)` |
| idx_folha_pagamento_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_folha_pagamento_created_by_fk ON public.folha_pagamento USING btree (created_by)` |
| ux_folha_pagamento_empresa_ano_mes | btree | empresa_id, ano, mes | sim | sim |  | `CREATE UNIQUE INDEX ux_folha_pagamento_empresa_ano_mes ON public.folha_pagamento USING btree (empresa_id, ano, mes)` |


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

_nenhum_

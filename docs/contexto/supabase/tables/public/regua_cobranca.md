# public.regua_cobranca

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `nome` | `text` | não |  |  |  |
| 3 | `ativo` | `boolean` | não | `true` |  |  |
| 4 | `empresa_id` | `uuid` | sim |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `descricao` | `text` | sim |  |  |  |
| 8 | `dias_gatilho` | `integer[]` | sim | `'{}'::integer[]` |  |  |
| 9 | `canais` | `text[]` | sim | `'{}'::text[]` |  |  |
| 10 | `auto_executar` | `boolean` | sim | `false` |  |  |
| 11 | `ordem` | `integer` | sim | `0` |  |  |
| 12 | `etapa` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| regua_cobranca_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.regua_cobranca_etapas | regua_cobranca_etapas_regua_id_fkey | regua_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| regua_cobranca_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX regua_cobranca_pkey ON public.regua_cobranca USING btree (id)` |


## Policies (RLS)

### `Admins can manage regua`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `regua_cobranca_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `regua_cobranca_tenant_rw`

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
| set_updated_at_d109c735b0fcf7754280 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_

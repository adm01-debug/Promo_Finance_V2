# public.regras_roteamento_financeiro

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
| 3 | `nome` | `text` | não |  |  |  |
| 4 | `condicoes` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 5 | `prioridade` | `integer` | sim | `0` |  |  |
| 6 | `ativo` | `boolean` | sim | `true` |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `conta_bancaria_id` | `uuid` | sim |  |  |  |
| 10 | `ativa` | `boolean` | sim | `true` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| regras_roteamento_financeiro_conta_bancaria_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id)` | NO ACTION | NO ACTION | sim |
| regras_roteamento_financeiro_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| regras_roteamento_financeiro_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| regras_roteamento_financeiro_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX regras_roteamento_financeiro_pkey ON public.regras_roteamento_financeiro USING btree (id)` |


## Policies (RLS)

### `Empresa-based access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |

### `empresa_based_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_411e7594aa600ded799f | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_audit_regras_roteamento_financeiro | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_generic |


## Grants

_nenhum_

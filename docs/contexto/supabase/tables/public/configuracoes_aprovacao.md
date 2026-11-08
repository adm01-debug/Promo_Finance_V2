# public.configuracoes_aprovacao

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
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `modulo` | `text` | sim |  |  |  |
| 4 | `valor_minimo` | `numeric` | sim |  |  |  |
| 5 | `ativo` | `boolean` | sim | `true` |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `valor_minimo_aprovacao` | `numeric` | sim | `0` |  |  |
| 8 | `aprovadores_obrigatorios` | `integer` | sim | `1` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| configuracoes_aprovacao_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| configuracoes_aprovacao_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.fluxos_aprovacao_niveis | fluxos_aprovacao_niveis_configuracao_id_fkey | configuracao_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| configuracoes_aprovacao_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX configuracoes_aprovacao_pkey ON public.configuracoes_aprovacao USING btree (id)` |


## Policies (RLS)

### `configuracoes_aprovacao_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `configuracoes_aprovacao_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `configuracoes_aprovacao_tenant_rw`

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
| set_updated_at_3a25b26abdf52bd44121 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_

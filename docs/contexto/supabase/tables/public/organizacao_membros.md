# public.organizacao_membros

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
| 2 | `organizacao_id` | `uuid` | não |  |  |  |
| 3 | `usuario_id` | `uuid` | não |  |  |  |
| 4 | `papel_na_org` | `org_papel` | não | `'MEMBRO'::org_papel` |  |  |
| 5 | `ativo` | `boolean` | não | `true` |  |  |
| 6 | `convidado_por` | `uuid` | sim |  |  |  |
| 7 | `aceito_em` | `timestamp with time zone` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| organizacao_membros_organizacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| organizacao_membros_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| uq_org_membro | UNIQUE | `UNIQUE (organizacao_id, usuario_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| organizacao_membros_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX organizacao_membros_pkey ON public.organizacao_membros USING btree (id)` |
| uq_org_membro | btree | organizacao_id, usuario_id | sim | sim |  | `CREATE UNIQUE INDEX uq_org_membro ON public.organizacao_membros USING btree (organizacao_id, usuario_id)` |


## Policies (RLS)

### `org_membros_manage_responsavel`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK | `(is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |

### `org_membros_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((usuario_id = ( SELECT auth.uid() AS uid)) OR is_org_membro(organizacao_id, ( SELECT auth.uid() AS uid)) OR is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_org_membros_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_organizacao_membros_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

_nenhum_

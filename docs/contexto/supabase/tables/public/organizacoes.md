# public.organizacoes

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `nome` | `text` | não |  |  |  |
| 3 | `cnpj` | `text` | sim |  |  |  |
| 4 | `email` | `text` | sim |  |  |  |
| 5 | `telefone` | `text` | sim |  |  |  |
| 6 | `plano` | `text` | não | `'trial'::text` |  |  |
| 7 | `max_empresas` | `integer` | não | `1` |  |  |
| 8 | `ativo` | `boolean` | não | `true` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `tipo` | `text` | não | `'OUTRO'::text` |  |  |
| 12 | `responsavel_id` | `uuid` | não |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| organizacoes_cnpj_key | UNIQUE | `UNIQUE (cnpj)` |  |  | sim |
| organizacoes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| organizacoes_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['ESCRITORIO_CONTABIL'::text, 'EMPRESA'::text, 'CONSULTORIA'::text, 'OUTRO'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.convites | convites_organizacao_id_fkey | organizacao_id | CASCADE |
| public.organizacao_membros | organizacao_membros_organizacao_id_fkey | organizacao_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| organizacoes_cnpj_key | btree | cnpj | sim | sim |  | `CREATE UNIQUE INDEX organizacoes_cnpj_key ON public.organizacoes USING btree (cnpj)` |
| organizacoes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX organizacoes_pkey ON public.organizacoes USING btree (id)` |


## Policies (RLS)

### `organizacoes_delete_responsavel`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((responsavel_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `organizacoes_insert_proprio`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(responsavel_id = ( SELECT auth.uid() AS uid))` |

### `organizacoes_select_membro_ou_admin`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((responsavel_id = ( SELECT auth.uid() AS uid)) OR is_org_membro(id, ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `organizacoes_update_responsavel`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((responsavel_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK | `((responsavel_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_organizacoes_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

_nenhum_

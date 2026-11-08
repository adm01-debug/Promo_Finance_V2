# public.recomendacoes_metas_ia

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
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `tipo` | `text` | não |  |  |  |
| 4 | `titulo` | `text` | não |  |  |  |
| 5 | `descricao` | `text` | sim |  |  |  |
| 6 | `impacto_estimado` | `numeric(12,2)` | sim |  |  |  |
| 7 | `aplicada` | `boolean` | sim | `false` |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| recomendacoes_metas_ia_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| recomendacoes_metas_ia_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| recomendacoes_metas_ia_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX recomendacoes_metas_ia_pkey ON public.recomendacoes_metas_ia USING btree (id)` |


## Policies (RLS)

### `recomendacoes_metas_ia_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_

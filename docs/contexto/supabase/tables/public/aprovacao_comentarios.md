# public.aprovacao_comentarios

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
| 2 | `solicitacao_id` | `uuid` | sim |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `comentario` | `text` | sim |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| aprovacao_comentarios_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| aprovacao_comentarios_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| aprovacao_comentarios_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX aprovacao_comentarios_pkey ON public.aprovacao_comentarios USING btree (id)` |
| idx_aprovacao_comentarios_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_aprovacao_comentarios_user_id_fk ON public.aprovacao_comentarios USING btree (user_id)` |


## Policies (RLS)

### `Users can insert their own comments`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `aprovacao_comentarios_owner_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((solicitacao_id IN ( SELECT solicitacoes_aprovacao.id    FROM solicitacoes_aprovacao   WHERE ((solicitacoes_aprovacao.solicitado_por = ( SELECT auth.uid() AS uid)) OR (solicitacoes_aprovacao.aprovado_por = ( SELECT auth.uid() AS uid))))) OR (user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_

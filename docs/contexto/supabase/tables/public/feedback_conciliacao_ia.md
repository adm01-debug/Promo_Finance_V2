# public.feedback_conciliacao_ia

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
| 2 | `transacao_id` | `uuid` | sim |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `acao` | `text` | não |  |  |  |
| 5 | `feedback_texto` | `text` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `transacao_bancaria_id` | `uuid` | sim |  |  |  |
| 8 | `score_original` | `numeric` | sim | `0` |  |  |
| 9 | `motivo_rejeicao` | `text` | sim |  |  |  |
| 10 | `transacao_descricao` | `text` | sim |  |  |  |
| 11 | `lancamento_entidade` | `text` | sim |  |  |  |
| 12 | `lancamento_descricao` | `text` | sim |  |  |  |
| 13 | `tipo_lancamento` | `text` | sim |  |  |  |
| 14 | `created_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| feedback_conciliacao_ia_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| feedback_conciliacao_ia_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| feedback_conciliacao_ia_transacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (transacao_id) REFERENCES transacoes_bancarias(id)` | NO ACTION | NO ACTION | sim |
| feedback_conciliacao_ia_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| feedback_conciliacao_ia_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX feedback_conciliacao_ia_pkey ON public.feedback_conciliacao_ia USING btree (id)` |
| idx_feedback_conciliacao_ia_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_feedback_conciliacao_ia_created_by_fk ON public.feedback_conciliacao_ia USING btree (created_by)` |
| idx_feedback_conciliacao_ia_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_feedback_conciliacao_ia_user_id_fk ON public.feedback_conciliacao_ia USING btree (user_id)` |


## Policies (RLS)

### `User-based access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |

### `Users can manage feedback`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_

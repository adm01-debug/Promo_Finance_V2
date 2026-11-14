# public.solicitacoes_aprovacao

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não | `auth.uid()` |  |  |
| 3 | `entidade_tipo` | `text` | sim | `'conta_pagar'::text` |  |  |
| 4 | `entidade_id` | `uuid` | sim |  |  |  |
| 5 | `status` | `text` | não | `'pendente'::text` |  |  |
| 6 | `motivo_rejeicao` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `aprovado_por` | `uuid` | sim |  |  |  |
| 9 | `conta_pagar_id` | `uuid` | sim |  |  |  |
| 10 | `solicitado_por` | `uuid` | sim |  |  |  |
| 11 | `observacoes` | `text` | sim |  |  |  |
| 12 | `aprovado_em` | `timestamp with time zone` | sim |  |  |  |
| 13 | `solicitado_em` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| solicitacoes_aprovacao_aprovado_por_fkey | FOREIGN KEY | `FOREIGN KEY (aprovado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| solicitacoes_aprovacao_conta_pagar_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_pagar_id) REFERENCES contas_pagar(id)` | NO ACTION | NO ACTION | sim |
| solicitacoes_aprovacao_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| solicitacoes_aprovacao_solicitado_por_fkey | FOREIGN KEY | `FOREIGN KEY (solicitado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_solicitacoes_aprovacao_aprovado_por_fk | btree | aprovado_por | não | sim |  | `CREATE INDEX idx_solicitacoes_aprovacao_aprovado_por_fk ON public.solicitacoes_aprovacao USING btree (aprovado_por)` |
| idx_solicitacoes_aprovacao_conta_pagar_id_fk | btree | conta_pagar_id | não | sim |  | `CREATE INDEX idx_solicitacoes_aprovacao_conta_pagar_id_fk ON public.solicitacoes_aprovacao USING btree (conta_pagar_id)` |
| idx_solicitacoes_aprovacao_solicitado_por_fk | btree | solicitado_por | não | sim |  | `CREATE INDEX idx_solicitacoes_aprovacao_solicitado_por_fk ON public.solicitacoes_aprovacao USING btree (solicitado_por)` |
| solicitacoes_aprovacao_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX solicitacoes_aprovacao_pkey ON public.solicitacoes_aprovacao USING btree (id)` |


## Policies (RLS)

### `Owner manage aprovacoes`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

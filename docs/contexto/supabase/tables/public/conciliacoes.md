# public.conciliacoes

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
| 2 | `user_id` | `uuid` | não | `auth.uid()` |  |  |
| 3 | `empresa_id` | `uuid` | sim |  |  |  |
| 4 | `status` | `text` | não | `'em_andamento'::text` |  |  |
| 5 | `total_conciliados` | `integer` | sim | `0` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `periodo_inicio` | `date` | sim |  |  |  |
| 8 | `periodo_fim` | `date` | sim |  |  |  |
| 9 | `conta_bancaria_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| conciliacoes_conta_bancaria_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id)` | NO ACTION | NO ACTION | sim |
| conciliacoes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| conciliacoes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX conciliacoes_pkey ON public.conciliacoes USING btree (id)` |
| idx_conciliacoes_conta_bancaria_id_fk | btree | conta_bancaria_id | não | sim |  | `CREATE INDEX idx_conciliacoes_conta_bancaria_id_fk ON public.conciliacoes USING btree (conta_bancaria_id)` |
| idx_conciliacoes_empresa_id_fk | btree | empresa_id | não | sim |  | `CREATE INDEX idx_conciliacoes_empresa_id_fk ON public.conciliacoes USING btree (empresa_id)` |
| idx_conciliacoes_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_conciliacoes_user_id_fk ON public.conciliacoes USING btree (user_id)` |


## Policies (RLS)

### `Fin users can manage conciliacoes`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Fin users can read conciliacoes`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `conciliacoes_owner_all`

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

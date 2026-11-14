# public.divergencias_conciliacao

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
| 2 | `transacao_id` | `uuid` | sim |  |  |  |
| 3 | `descricao` | `text` | sim |  |  |  |
| 4 | `valor_divergencia` | `numeric` | sim |  |  |  |
| 6 | `resolvida_por` | `uuid` | sim |  |  |  |
| 7 | `resolvida_em` | `timestamp with time zone` | sim |  |  |  |
| 8 | `empresa_id` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `tipo_divergencia` | `text` | sim |  |  |  |
| 11 | `resolvido_por` | `uuid` | sim |  |  |  |
| 12 | `resolvido_em` | `timestamp with time zone` | sim |  |  |  |
| 13 | `conta_bancaria_id` | `uuid` | sim |  |  |  |
| 14 | `status` | `text` | não | `'aberta'::text` |  |  |
| 15 | `recomendacao` | `text` | sim |  |  |  |
| 16 | `resolvido` | `boolean` | não | `false` |  |  |
| 17 | `resolvida` | `boolean` | sim | `false` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| divergencias_conciliacao_conta_bancaria_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| divergencias_conciliacao_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| divergencias_conciliacao_resolvido_por_fkey | FOREIGN KEY | `FOREIGN KEY (resolvido_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| divergencias_conciliacao_transacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (transacao_id) REFERENCES transacoes_bancarias(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| divergencias_conciliacao_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX divergencias_conciliacao_pkey ON public.divergencias_conciliacao USING btree (id)` |
| idx_divergencias_conciliacao_conta_bancaria_id_fk | btree | conta_bancaria_id | não | sim |  | `CREATE INDEX idx_divergencias_conciliacao_conta_bancaria_id_fk ON public.divergencias_conciliacao USING btree (conta_bancaria_id)` |
| idx_divergencias_conciliacao_resolvido_por_fk | btree | resolvido_por | não | sim |  | `CREATE INDEX idx_divergencias_conciliacao_resolvido_por_fk ON public.divergencias_conciliacao USING btree (resolvido_por)` |
| idx_divergencias_conciliacao_transacao_id_fk | btree | transacao_id | não | sim |  | `CREATE INDEX idx_divergencias_conciliacao_transacao_id_fk ON public.divergencias_conciliacao USING btree (transacao_id)` |


## Policies (RLS)

### `Empresa-based access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

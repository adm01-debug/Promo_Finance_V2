# public.regras_conciliacao

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
| 2 | `nome` | `text` | não |  |  |  |
| 3 | `descricao` | `text` | sim |  |  |  |
| 4 | `padrao_descricao` | `text` | sim |  |  |  |
| 5 | `valor_exato` | `numeric` | sim |  |  |  |
| 6 | `categoria_id` | `uuid` | sim |  |  |  |
| 7 | `ativo` | `boolean` | sim | `true` |  |  |
| 8 | `vezes_aplicada` | `integer` | sim | `0` |  |  |
| 9 | `empresa_id` | `uuid` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `entidade_nome` | `text` | sim |  |  |  |
| 12 | `lancamento_tipo` | `text` | sim |  |  |  |
| 13 | `user_id` | `uuid` | sim |  |  |  |
| 14 | `created_by` | `uuid` | sim |  |  |  |
| 15 | `entidade_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| regras_conciliacao_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| regras_conciliacao_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| regras_conciliacao_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.transacoes_bancarias | transacoes_bancarias_regra_id_fkey | regra_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_regras_conciliacao_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_regras_conciliacao_created_by_fk ON public.regras_conciliacao USING btree (created_by)` |
| idx_regras_conciliacao_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_regras_conciliacao_empresa_id ON public.regras_conciliacao USING btree (empresa_id)` |
| idx_regras_conciliacao_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_regras_conciliacao_user_id_fk ON public.regras_conciliacao USING btree (user_id)` |
| regras_conciliacao_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX regras_conciliacao_pkey ON public.regras_conciliacao USING btree (id)` |


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

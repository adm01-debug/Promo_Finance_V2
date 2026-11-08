# public.plano_contas

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
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `codigo` | `text` | não |  |  |  |
| 5 | `nome` | `text` | não |  |  |  |
| 6 | `descricao` | `text` | sim |  |  |  |
| 7 | `tipo` | `text` | sim |  |  |  |
| 8 | `natureza` | `text` | sim |  |  |  |
| 9 | `centro_resultado` | `text` | sim |  |  |  |
| 10 | `ativo` | `boolean` | sim | `true` |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `parent_id` | `uuid` | sim |  |  |  |
| 13 | `codigo_referencial` | `text` | sim |  |  |  |
| 14 | `nivel` | `integer` | não | `1` |  |  |
| 15 | `aceita_lancamento` | `boolean` | não | `true` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| plano_contas_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| plano_contas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| plano_contas_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.categorias | categorias_plano_conta_id_fkey | plano_conta_id | NO ACTION |
| public.partidas_contabeis | partidas_contabeis_conta_contabil_id_fkey | conta_contabil_id | RESTRICT |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_plano_contas_empresa_id_fk | btree | empresa_id | não | sim |  | `CREATE INDEX idx_plano_contas_empresa_id_fk ON public.plano_contas USING btree (empresa_id)` |
| idx_plano_contas_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_plano_contas_user_id_fk ON public.plano_contas USING btree (user_id)` |
| plano_contas_empresa_codigo_uidx | btree | empresa_id, codigo | sim | sim | `(empresa_id IS NOT NULL)` | `CREATE UNIQUE INDEX plano_contas_empresa_codigo_uidx ON public.plano_contas USING btree (empresa_id, codigo) WHERE (empresa_id IS NOT NULL)` |
| plano_contas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX plano_contas_pkey ON public.plano_contas USING btree (id)` |


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

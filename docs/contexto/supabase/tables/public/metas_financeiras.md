# public.metas_financeiras

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `empresa_id` | `uuid` | sim |  |  |  |
| 4 | `titulo` | `text` | não |  |  |  |
| 5 | `tipo` | `text` | não |  |  |  |
| 6 | `mes` | `integer` | não |  |  |  |
| 7 | `ano` | `integer` | não |  |  |  |
| 8 | `valor_meta` | `numeric(15,2)` | não |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `ativo` | `boolean` | não | `true` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| metas_financeiras_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| metas_financeiras_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| metas_financeiras_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_metas_financeiras_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_metas_financeiras_empresa_id ON public.metas_financeiras USING btree (empresa_id)` |
| idx_metas_financeiras_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_metas_financeiras_user_id_fk ON public.metas_financeiras USING btree (user_id)` |
| metas_financeiras_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX metas_financeiras_pkey ON public.metas_financeiras USING btree (id)` |


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

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_metas | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

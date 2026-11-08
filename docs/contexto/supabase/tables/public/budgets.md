# public.budgets

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
| 2 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `user_id` | `uuid` | sim |  |  |  |
| 5 | `category` | `text` | sim |  |  |  |
| 6 | `budgeted_amount` | `numeric(15,2)` | sim | `0` |  |  |
| 7 | `spent_amount` | `numeric(15,2)` | sim | `0` |  |  |
| 8 | `period` | `text` | sim |  |  |  |
| 9 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| budgets_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| budgets_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| budgets_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| budgets_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX budgets_pkey ON public.budgets USING btree (id)` |
| idx_budgets_company_user | btree | company_id, user_id | não | sim |  | `CREATE INDEX idx_budgets_company_user ON public.budgets USING btree (company_id, user_id)` |
| idx_budgets_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_budgets_user_id_fk ON public.budgets USING btree (user_id)` |


## Policies (RLS)

### `Budgets scoped by owner or empresa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (company_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))` |
| WITH CHECK | `((user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (company_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_b7d9e68ed31698bcfe97 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

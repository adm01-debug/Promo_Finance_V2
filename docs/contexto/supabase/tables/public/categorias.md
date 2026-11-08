# public.categorias

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
| 3 | `tipo` | `text` | não |  |  |  |
| 4 | `cor` | `text` | sim |  |  |  |
| 5 | `icone` | `text` | sim |  |  |  |
| 6 | `ativo` | `boolean` | sim | `true` |  |  |
| 7 | `empresa_id` | `uuid` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `plano_conta_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| categorias_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| categorias_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| categorias_plano_conta_id_fkey | FOREIGN KEY | `FOREIGN KEY (plano_conta_id) REFERENCES plano_contas(id)` | NO ACTION | NO ACTION | sim |
| categorias_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['receita'::text, 'despesa'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.contas_pagar | contas_pagar_categoria_id_fkey | categoria_id | SET NULL |
| public.contas_receber | contas_receber_categoria_id_fkey | categoria_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| categorias_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX categorias_pkey ON public.categorias USING btree (id)` |
| idx_categorias_empresa | btree | empresa_id | não | sim |  | `CREATE INDEX idx_categorias_empresa ON public.categorias USING btree (empresa_id)` |


## Policies (RLS)

### `Categorias scoped by empresa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))` |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_18e8b04fb0e329ecb61f | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

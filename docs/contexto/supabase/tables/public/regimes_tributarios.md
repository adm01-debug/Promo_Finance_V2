# public.regimes_tributarios

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
| 3 | `regime_nome` | `text` | não |  |  |  |
| 4 | `reducao_cbs` | `numeric(5,2)` | sim |  |  |  |
| 5 | `reducao_ibs` | `numeric(5,2)` | sim |  |  |  |
| 6 | `data_inicio` | `date` | sim |  |  |  |
| 7 | `ativo` | `boolean` | sim | `true` |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| regimes_tributarios_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| regimes_tributarios_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_regimes_tributarios_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_regimes_tributarios_empresa_id ON public.regimes_tributarios USING btree (empresa_id)` |
| regimes_tributarios_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX regimes_tributarios_pkey ON public.regimes_tributarios USING btree (id)` |


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
| trg_sync_regime_empresa | AFTER | INSERT OR UPDATE | ROW | enabled | public.sync_regime_tributario_empresa |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

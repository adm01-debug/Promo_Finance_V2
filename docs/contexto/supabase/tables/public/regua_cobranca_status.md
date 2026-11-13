# public.regua_cobranca_status

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
| 3 | `conta_receber_id` | `uuid` | sim |  |  |  |
| 4 | `etapa_atual` | `text` | sim |  |  |  |
| 5 | `status_cobranca` | `text` | sim |  |  |  |
| 6 | `data_ultima_acao` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `proxima_acao_data` | `date` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `titulo_id` | `uuid` | sim |  |  |  |
| 11 | `cliente_id` | `uuid` | sim |  |  |  |
| 12 | `status` | `text` | sim | `'pendente'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| regua_cobranca_status_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id)` | NO ACTION | NO ACTION | sim |
| regua_cobranca_status_conta_receber_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id)` | NO ACTION | NO ACTION | sim |
| regua_cobranca_status_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| regua_cobranca_status_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| regua_cobranca_status_titulo_id_fkey | FOREIGN KEY | `FOREIGN KEY (titulo_id) REFERENCES contas_receber(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_regua_cobranca_status_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_regua_cobranca_status_empresa_id ON public.regua_cobranca_status USING btree (empresa_id)` |
| regua_cobranca_status_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX regua_cobranca_status_pkey ON public.regua_cobranca_status USING btree (id)` |


## Policies (RLS)

### `Access by empresa_id`

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
| set_updated_at_7895f3de16aa8553d228 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

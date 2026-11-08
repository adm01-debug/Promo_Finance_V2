# public.acordos_parcelamento

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não | `auth.uid()` |  |  |
| 3 | `conta_receber_id` | `uuid` | sim |  |  |  |
| 4 | `total_parcelas` | `integer` | não | `1` |  |  |
| 5 | `valor_total` | `numeric` | não | `0` |  |  |
| 6 | `status` | `text` | sim | `'ativo'::text` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `numero_acordo` | `text` | sim |  |  |  |
| 9 | `cliente_id` | `uuid` | sim |  |  |  |
| 10 | `cliente_nome` | `text` | sim |  |  |  |
| 11 | `valor_original` | `numeric(15,2)` | sim |  |  |  |
| 12 | `valor_total_acordo` | `numeric(15,2)` | sim |  |  |  |
| 13 | `cliente_email` | `text` | sim |  |  |  |
| 14 | `cliente_telefone` | `text` | sim |  |  |  |
| 15 | `desconto_aplicado` | `numeric(15,2)` | sim | `0` |  |  |
| 16 | `juros_aplicado` | `numeric(15,2)` | sim | `0` |  |  |
| 17 | `numero_parcelas` | `integer` | sim |  |  |  |
| 18 | `valor_parcela` | `numeric(15,2)` | sim |  |  |  |
| 19 | `data_primeiro_vencimento` | `date` | sim |  |  |  |
| 20 | `dia_vencimento` | `integer` | sim |  |  |  |
| 21 | `observacoes` | `text` | sim |  |  |  |
| 22 | `contas_receber_ids` | `uuid[]` | sim |  |  |  |
| 23 | `created_by` | `uuid` | sim |  |  |  |
| 24 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 25 | `empresa_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| acordos_parcelamento_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id)` | NO ACTION | NO ACTION | sim |
| acordos_parcelamento_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| acordos_parcelamento_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| acordos_parcelamento_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.parcelas_acordo | parcelas_acordo_acordo_id_fkey | acordo_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| acordos_parcelamento_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX acordos_parcelamento_pkey ON public.acordos_parcelamento USING btree (id)` |
| idx_acordos_parcelamento_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_acordos_parcelamento_created_by_fk ON public.acordos_parcelamento USING btree (created_by)` |


## Policies (RLS)

### `Empresa-based access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |

### `Owner manage acordos`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_d9c737e24ed42de7266f | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.extrato_bancario

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
| usada por views | public.extratos_bancarios_importados |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não | `auth.uid()` |  |  |
| 3 | `conta_bancaria_id` | `uuid` | sim |  |  |  |
| 4 | `data` | `date` | não |  |  |  |
| 5 | `descricao` | `text` | não |  |  |  |
| 6 | `valor` | `numeric` | não |  |  |  |
| 7 | `tipo` | `text` | não |  |  |  |
| 8 | `numero_documento` | `text` | sim |  |  |  |
| 9 | `numero_documento_banco` | `text` | sim |  |  |  |
| 10 | `codigo_transacao` | `text` | sim |  |  |  |
| 11 | `arquivo_origem` | `text` | sim |  |  |  |
| 12 | `importado_de` | `text` | sim |  |  |  |
| 13 | `importado_em` | `timestamp with time zone` | sim |  |  |  |
| 14 | `linha_arquivo` | `integer` | sim |  |  |  |
| 15 | `hash_transacao` | `text` | sim |  |  |  |
| 16 | `saldo` | `numeric` | sim |  |  |  |
| 17 | `conciliado` | `boolean` | não | `false` |  |  |
| 18 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| extrato_bancario_conta_bancaria_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| extrato_bancario_hash_transacao_key | UNIQUE | `UNIQUE (hash_transacao)` |  |  | sim |
| extrato_bancario_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| extrato_bancario_hash_transacao_key | btree | hash_transacao | sim | sim |  | `CREATE UNIQUE INDEX extrato_bancario_hash_transacao_key ON public.extrato_bancario USING btree (hash_transacao)` |
| extrato_bancario_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX extrato_bancario_pkey ON public.extrato_bancario USING btree (id)` |
| idx_extrato_bancario_conta_bancaria_id_fk | btree | conta_bancaria_id | não | sim |  | `CREATE INDEX idx_extrato_bancario_conta_bancaria_id_fk ON public.extrato_bancario USING btree (conta_bancaria_id)` |


## Policies (RLS)

### `Users can manage their own extrato_bancario`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `extrato_owner_all`

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

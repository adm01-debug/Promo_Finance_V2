# public.execucoes_cobranca

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
| 4 | `etapa` | `text` | sim |  |  |  |
| 5 | `canal` | `text` | sim |  |  |  |
| 6 | `status` | `text` | sim | `'enviado'::text` |  |  |
| 7 | `mensagem` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `empresa_id` | `uuid` | sim |  |  |  |
| 10 | `cliente_nome` | `text` | sim |  |  |  |
| 11 | `destinatario` | `text` | sim |  |  |  |
| 12 | `provider` | `text` | sim |  |  |  |
| 13 | `cliente_id` | `uuid` | sim |  |  |  |
| 14 | `erro_mensagem` | `text` | sim |  |  |  |
| 15 | `metadata` | `jsonb` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| execucoes_cobranca_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id)` | NO ACTION | NO ACTION | sim |
| execucoes_cobranca_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| execucoes_cobranca_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| execucoes_cobranca_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX execucoes_cobranca_pkey ON public.execucoes_cobranca USING btree (id)` |
| idx_execucoes_cobranca_cliente_id | btree | cliente_id | não | sim |  | `CREATE INDEX idx_execucoes_cobranca_cliente_id ON public.execucoes_cobranca USING btree (cliente_id)` |
| idx_execucoes_cobranca_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_execucoes_cobranca_empresa_id ON public.execucoes_cobranca USING btree (empresa_id)` |


## Policies (RLS)

### `Owner manage execucoes`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `execucoes_cobranca_empresa_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

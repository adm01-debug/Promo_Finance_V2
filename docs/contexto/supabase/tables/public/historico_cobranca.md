# public.historico_cobranca

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
| 2 | `cliente_id` | `uuid` | sim |  |  |  |
| 3 | `conta_receber_id` | `uuid` | sim |  |  |  |
| 4 | `canal` | `text` | sim |  |  |  |
| 5 | `destinatario` | `text` | sim |  |  |  |
| 6 | `status` | `text` | sim |  |  |  |
| 7 | `mensagem` | `text` | sim |  |  |  |
| 8 | `evento` | `text` | sim |  |  |  |
| 9 | `metadata` | `jsonb` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `empresa_id` | `uuid` | sim |  |  |  |
| 12 | `fila_id` | `uuid` | sim |  |  |  |
| 13 | `etapa` | `text` | sim |  |  |  |
| 14 | `provider` | `text` | sim |  |  |  |
| 15 | `provider_message_id` | `text` | sim |  |  |  |
| 16 | `etapa_anterior` | `text` | sim |  |  |  |
| 17 | `etapa_nova` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| historico_cobranca_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id)` | NO ACTION | NO ACTION | sim |
| historico_cobranca_conta_receber_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id)` | NO ACTION | NO ACTION | sim |
| historico_cobranca_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| historico_cobranca_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| historico_cobranca_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX historico_cobranca_pkey ON public.historico_cobranca USING btree (id)` |
| idx_historico_cobranca_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_historico_cobranca_empresa_id ON public.historico_cobranca USING btree (empresa_id)` |


## Policies (RLS)

### `historico_cobranca_empresa_all`

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

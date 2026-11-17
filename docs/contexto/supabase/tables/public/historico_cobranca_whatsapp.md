# public.historico_cobranca_whatsapp

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
| 3 | `mensagem` | `text` | não |  |  |  |
| 4 | `status` | `text` | sim | `'enviado'::text` |  |  |
| 5 | `lido_em` | `timestamp with time zone` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `empresa_id` | `uuid` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | sim |  |  |  |
| 9 | `created_by` | `uuid` | sim |  |  |  |
| 10 | `enviado_em` | `timestamp with time zone` | sim |  |  |  |
| 11 | `ia_proxima_acao` | `text` | sim |  |  |  |
| 12 | `ia_resumo` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| historico_cobranca_whatsapp_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id)` | NO ACTION | NO ACTION | sim |
| historico_cobranca_whatsapp_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| historico_cobranca_whatsapp_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| historico_cobranca_whatsapp_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX historico_cobranca_whatsapp_pkey ON public.historico_cobranca_whatsapp USING btree (id)` |
| idx_historico_cobranca_whatsapp_cliente_id_fk | btree | cliente_id | não | sim |  | `CREATE INDEX idx_historico_cobranca_whatsapp_cliente_id_fk ON public.historico_cobranca_whatsapp USING btree (cliente_id)` |
| idx_historico_cobranca_whatsapp_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_historico_cobranca_whatsapp_empresa_id ON public.historico_cobranca_whatsapp USING btree (empresa_id)` |


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
| on_whatsapp_message_inserted | AFTER | INSERT | ROW | enabled | public.trigger_whatsapp_ai_analysis |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

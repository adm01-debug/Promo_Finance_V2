# public.notification_history

> Dicionário estrutural de public.notification_history (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (channel = ANY (ARRAY['inapp'::text, 'push'::text, 'email'::text])); PRIMARY KEY (id); CHECK (status = ANY (ARRAY['sent'::text, 'failed'::text, 'queued'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.notification_history. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | não |  |  | Dicionário estrutural da coluna user_id em public.notification_history. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `title` | `text` | não |  |  | Dicionário estrutural da coluna title em public.notification_history. Papel funcional indicado pelo identificador: title; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `body` | `text` | sim |  |  | Dicionário estrutural da coluna body em public.notification_history. Papel funcional indicado pelo identificador: body; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `channel` | `text` | não | `'inapp'::text` |  | Dicionário estrutural da coluna channel em public.notification_history. Papel funcional indicado pelo identificador: channel; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'inapp'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (channel = ANY (ARRAY['inapp'::text, 'push'::text, 'email'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `status` | `text` | não | `'sent'::text` |  | Dicionário estrutural da coluna status em public.notification_history. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'sent'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = ANY (ARRAY['sent'::text, 'failed'::text, 'queued'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `error_message` | `text` | sim |  |  | Dicionário estrutural da coluna error_message em public.notification_history. Papel funcional indicado pelo identificador: error_message; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `metadata` | `jsonb` | sim |  |  | Dicionário estrutural da coluna metadata em public.notification_history. Papel funcional indicado pelo identificador: metadata; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 9 | `source_ref` | `text` | sim |  |  | Dicionário estrutural da coluna source_ref em public.notification_history. Papel funcional indicado pelo identificador: source_ref; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `read_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna read_at em public.notification_history. Papel funcional indicado pelo identificador: read_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.notification_history. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 12 | `source` | `text` | não | `'saved_filter_subscription'::text` |  | Dicionário estrutural da coluna source em public.notification_history. Papel funcional indicado pelo identificador: source; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'saved_filter_subscription'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notification_history_channel_check | CHECK | `CHECK (channel = ANY (ARRAY['inapp'::text, 'push'::text, 'email'::text]))` |  |  | sim |
| notification_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| notification_history_status_check | CHECK | `CHECK (status = ANY (ARRAY['sent'::text, 'failed'::text, 'queued'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_notification_history_source | btree | source, source_ref | não | sim |  | `CREATE INDEX idx_notification_history_source ON public.notification_history USING btree (source, source_ref)` |
| idx_notification_history_user_created | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_notification_history_user_created ON public.notification_history USING btree (user_id, created_at DESC)` |
| idx_notification_history_user_unread | btree | user_id, read_at | não | sim | `(read_at IS NULL)` | `CREATE INDEX idx_notification_history_user_unread ON public.notification_history USING btree (user_id, read_at) WHERE (read_at IS NULL)` |
| notification_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX notification_history_pkey ON public.notification_history USING btree (id)` |


## Policies (RLS)

### `notification_history_owner`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

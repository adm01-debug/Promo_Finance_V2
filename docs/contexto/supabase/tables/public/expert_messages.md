# public.expert_messages

> Dicionário estrutural de public.expert_messages (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (conversation_id) REFERENCES expert_conversations(id) ON DELETE CASCADE; PRIMARY KEY (id); CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.expert_messages. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `conversation_id` | `uuid` | não |  |  | Dicionário estrutural da coluna conversation_id em public.expert_messages. Papel funcional indicado pelo identificador: conversation_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (conversation_id) REFERENCES expert_conversations(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `role` | `text` | não |  |  | Dicionário estrutural da coluna role em public.expert_messages. Papel funcional indicado pelo identificador: role; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `content` | `text` | não |  |  | Dicionário estrutural da coluna content em public.expert_messages. Papel funcional indicado pelo identificador: content; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  | Dicionário estrutural da coluna metadata em public.expert_messages. Papel funcional indicado pelo identificador: metadata; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.expert_messages. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `actions_executed` | `boolean` | sim | `false` |  | Dicionário estrutural da coluna actions_executed em public.expert_messages. Papel funcional indicado pelo identificador: actions_executed; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `actions` | `jsonb` | sim | `'[]'::jsonb` |  | Dicionário estrutural da coluna actions em public.expert_messages. Papel funcional indicado pelo identificador: actions; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: '[]'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| expert_messages_conversation_id_fkey | FOREIGN KEY | `FOREIGN KEY (conversation_id) REFERENCES expert_conversations(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| expert_messages_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| expert_messages_role_check | CHECK | `CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| expert_messages_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX expert_messages_pkey ON public.expert_messages USING btree (id)` |
| idx_expert_messages_conversation_id_fk | btree | conversation_id | não | sim |  | `CREATE INDEX idx_expert_messages_conversation_id_fk ON public.expert_messages USING btree (conversation_id)` |


## Policies (RLS)

### `Users can insert messages to their conversations`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM expert_conversations   WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_conversations.user_id = ( SELECT auth.uid() AS uid)))))` |

### `Users can view messages from their conversations`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM expert_conversations   WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_conversations.user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |

### `Usuários veem mensagens de suas conversas`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM expert_conversations   WHERE ((expert_conversations.id = expert_messages.conversation_id) AND (expert_conversations.user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.expert_messages

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `conversation_id` | `uuid` | não |  |  |  |
| 3 | `role` | `text` | não |  |  |  |
| 4 | `content` | `text` | não |  |  |  |
| 5 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `actions_executed` | `boolean` | sim | `false` |  |  |
| 8 | `actions` | `jsonb` | sim | `'[]'::jsonb` |  |  |


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

_nenhum_

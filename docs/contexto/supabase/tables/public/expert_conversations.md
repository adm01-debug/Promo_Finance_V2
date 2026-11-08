# public.expert_conversations

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `empresa_id` | `uuid` | sim |  |  |  |
| 4 | `titulo` | `text` | sim |  |  |  |
| 5 | `resumo` | `text` | sim |  |  |  |
| 6 | `status` | `text` | sim | `'active'::text` |  |  |
| 7 | `last_message_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| expert_conversations_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| expert_conversations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| expert_conversations_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.expert_messages | expert_messages_conversation_id_fkey | conversation_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| expert_conversations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX expert_conversations_pkey ON public.expert_conversations USING btree (id)` |
| idx_expert_conversations_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_expert_conversations_user_id_fk ON public.expert_conversations USING btree (user_id)` |


## Policies (RLS)

### `Users can manage their own conversations`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Usuários veem suas próprias conversas`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_a78c869af115da2c0dbe | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_

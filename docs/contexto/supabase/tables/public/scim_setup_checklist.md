# public.scim_setup_checklist

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
| 2 | `organizacao_id` | `uuid` | sim |  |  |  |
| 3 | `etapa` | `text` | não |  |  |  |
| 4 | `status` | `text` | não | `'pendente'::text` |  |  |
| 5 | `mensagem_erro` | `text` | sim |  |  |  |
| 6 | `concluido_em` | `timestamp with time zone` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `user_id` | `uuid` | não |  |  |  |
| 9 | `item_key` | `text` | não |  |  |  |
| 10 | `confirmed` | `boolean` | não | `false` |  |  |
| 11 | `confirmed_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| scim_setup_checklist_item_key_check | CHECK | `CHECK (char_length(item_key) >= 1 AND char_length(item_key) <= 120)` |  |  | sim |
| scim_setup_checklist_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| scim_setup_checklist_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX scim_setup_checklist_pkey ON public.scim_setup_checklist USING btree (id)` |


## Policies (RLS)

### `scim_checklist_own`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = auth.uid())` |
| WITH CHECK | `(user_id = auth.uid())` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_scim_checklist_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

_nenhum_

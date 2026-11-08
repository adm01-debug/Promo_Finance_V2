# public.anomalia_toast_eventos

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
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `anomalia_id` | `uuid` | sim |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `dispatched_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 5 | `severidade` | `text` | sim |  |  |  |
| 6 | `tipo_anomalia` | `text` | sim |  |  |  |
| 7 | `titulo` | `text` | sim |  |  |  |
| 8 | `descricao` | `text` | sim |  |  |  |
| 9 | `centro_custo_nome` | `text` | sim |  |  |  |
| 10 | `acoes_disponiveis` | `text[]` | sim | `'{}'::text[]` |  |  |
| 11 | `duracao_segundos` | `integer` | sim | `8` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| anomalia_toast_eventos_anomalia_id_fkey | FOREIGN KEY | `FOREIGN KEY (anomalia_id) REFERENCES anomalias_detectadas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| anomalia_toast_eventos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| anomalia_toast_eventos_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| anomalia_toast_eventos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX anomalia_toast_eventos_pkey ON public.anomalia_toast_eventos USING btree (id)` |
| idx_anomalia_toast_eventos_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_anomalia_toast_eventos_user_id_fk ON public.anomalia_toast_eventos USING btree (user_id)` |


## Policies (RLS)

### `Users can insert toast events`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can view their own toast events`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_

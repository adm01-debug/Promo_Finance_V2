# public.user_demonstrativo_preferences

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `modo_padrao` | `text` | não | `'dre'::text` |  |  |
| 4 | `fonte_padrao` | `text` | não | `'competencia'::text` |  |  |
| 5 | `filtros_por_empresa` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 6 | `drill_down_estado` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_demonstrativo_preferences_fonte_padrao_check | CHECK | `CHECK (fonte_padrao = ANY (ARRAY['competencia'::text, 'caixa'::text]))` |  |  | sim |
| user_demonstrativo_preferences_modo_padrao_check | CHECK | `CHECK (modo_padrao = ANY (ARRAY['dre'::text, 'balanco'::text]))` |  |  | sim |
| user_demonstrativo_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_demonstrativo_preferences_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_demonstrativo_preferences_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| user_demonstrativo_preferences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_demonstrativo_preferences_pkey ON public.user_demonstrativo_preferences USING btree (id)` |
| user_demonstrativo_preferences_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX user_demonstrativo_preferences_user_id_key ON public.user_demonstrativo_preferences USING btree (user_id)` |


## Policies (RLS)

### `Users can manage their own preferences`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_user_demonstrativo_preferences_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_

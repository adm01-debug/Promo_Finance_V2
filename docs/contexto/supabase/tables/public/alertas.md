# public.alertas

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
| 2 | `user_id` | `uuid` | não | `auth.uid()` |  |  |
| 3 | `tipo` | `text` | não |  |  |  |
| 4 | `titulo` | `text` | não |  |  |  |
| 5 | `mensagem` | `text` | sim |  |  |  |
| 6 | `prioridade` | `text` | sim | `'media'::text` |  |  |
| 7 | `lido` | `boolean` | sim | `false` |  |  |
| 8 | `entidade_id` | `uuid` | sim |  |  |  |
| 9 | `entidade_tipo` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `acao_url` | `text` | sim |  |  |  |
| 12 | `empresa_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| alertas_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| alertas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| alertas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX alertas_pkey ON public.alertas USING btree (id)` |
| idx_alertas_empresa_id | btree | empresa_id, created_at | não | sim |  | `CREATE INDEX idx_alertas_empresa_id ON public.alertas USING btree (empresa_id, created_at DESC)` |


## Policies (RLS)

### `Owner manage alertas`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `alertas_owner_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id)` |
| WITH CHECK |  |

### `alertas_owner_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_alertas_set_empresa | BEFORE | INSERT | ROW | enabled | public.set_empresa_id_from_profile |
| trg_notificar_alerta_critico_push | AFTER | INSERT | ROW | enabled | public.fn_notificar_alerta_critico_push |


## Grants

_nenhum_

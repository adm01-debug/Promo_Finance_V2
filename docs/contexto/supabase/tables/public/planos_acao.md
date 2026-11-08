# public.planos_acao

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
| 3 | `titulo` | `text` | não |  |  |  |
| 4 | `descricao` | `text` | sim |  |  |  |
| 5 | `prioridade` | `text` | não | `'media'::text` |  |  |
| 6 | `status` | `text` | não | `'pendente'::text` |  |  |
| 7 | `prazo` | `date` | sim |  |  |  |
| 8 | `responsavel` | `text` | sim |  |  |  |
| 9 | `categoria` | `text` | sim |  |  |  |
| 10 | `origem` | `text` | sim |  |  |  |
| 11 | `progresso` | `integer` | não | `0` |  |  |
| 12 | `tags` | `text[]` | sim |  |  |  |
| 13 | `impacto` | `numeric(14,2)` | sim |  |  |  |
| 14 | `esforco` | `numeric(14,2)` | sim |  |  |  |
| 15 | `metadata` | `jsonb` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| planos_acao_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| planos_acao_prioridade_check | CHECK | `CHECK (prioridade = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text]))` |  |  | sim |
| planos_acao_progresso_check | CHECK | `CHECK (progresso >= 0 AND progresso <= 100)` |  |  | sim |
| planos_acao_status_check | CHECK | `CHECK (status = ANY (ARRAY['pendente'::text, 'em_andamento'::text, 'concluido'::text, 'cancelado'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_planos_acao_user | btree | user_id | não | sim |  | `CREATE INDEX idx_planos_acao_user ON public.planos_acao USING btree (user_id)` |
| planos_acao_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX planos_acao_pkey ON public.planos_acao USING btree (id)` |


## Policies (RLS)

### `planos_acao_owner`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_planos_acao_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

_nenhum_

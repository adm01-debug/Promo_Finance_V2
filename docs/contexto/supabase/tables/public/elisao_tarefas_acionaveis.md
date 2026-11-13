# public.elisao_tarefas_acionaveis

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
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `titulo` | `text` | não |  |  |  |
| 4 | `descricao` | `text` | sim |  |  |  |
| 5 | `tipo` | `text` | não | `'geral'::text` |  |  |
| 6 | `status` | `text` | não | `'pendente'::text` |  |  |
| 7 | `responsavel_id` | `uuid` | sim |  |  |  |
| 8 | `data_vencimento` | `date` | sim |  |  |  |
| 9 | `economia_associada` | `numeric` | sim | `0` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `valor_envolvido` | `numeric` | sim | `0` |  |  |
| 13 | `bitrix_task_id` | `text` | sim |  |  |  |
| 14 | `bitrix_sync_status` | `text` | sim | `'pendente'::text` |  |  |
| 15 | `tipo_oportunidade` | `text` | não | `'credito_tributario'::text` |  |  |
| 16 | `prazo` | `date` | sim |  |  |  |
| 17 | `bitrix_sync_erro` | `text` | sim |  |  |  |
| 18 | `sincronizado_em` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| elisao_tarefas_acionaveis_bitrix_sync_status_check | CHECK | `CHECK (bitrix_sync_status = ANY (ARRAY['nao_sincronizado'::text, 'sincronizando'::text, 'sincronizado'::text, 'erro'::text, 'pendente'::text]))` |  |  | sim |
| elisao_tarefas_acionaveis_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| elisao_tarefas_acionaveis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| elisao_tarefas_acionaveis_status_check | CHECK | `CHECK (status = ANY (ARRAY['pendente'::text, 'em_andamento'::text, 'concluida'::text, 'cancelada'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| elisao_tarefas_acionaveis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX elisao_tarefas_acionaveis_pkey ON public.elisao_tarefas_acionaveis USING btree (id)` |
| idx_elisao_tarefas_acionaveis_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_elisao_tarefas_acionaveis_empresa_id ON public.elisao_tarefas_acionaveis USING btree (empresa_id)` |


## Policies (RLS)

### `Users can manage company action tasks`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |

### `tarefas_elisao_acesso`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK | `empresa_acessivel(empresa_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_tarefas_elisao_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

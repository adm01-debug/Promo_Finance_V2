# public.simulacoes

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
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `tipo` | `text` | não |  |  |  |
| 4 | `parametros` | `jsonb` | não |  |  |  |
| 5 | `resultado` | `jsonb` | sim |  |  |  |
| 6 | `status` | `text` | não | `'pendente'::text` |  |  |
| 7 | `created_by` | `uuid` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `periodo_inicio` | `date` | não |  |  |  |
| 11 | `periodo_fim` | `date` | não |  |  |  |
| 12 | `inputs` | `jsonb` | não |  |  |  |
| 13 | `hash_inputs` | `text` | não |  |  |  |
| 14 | `resultado_simples` | `jsonb` | sim |  |  |  |
| 15 | `resultado_presumido` | `jsonb` | sim |  |  |  |
| 16 | `resultado_real` | `jsonb` | sim |  |  |  |
| 17 | `regime_recomendado` | `regime_tributario_enum` | sim |  |  |  |
| 18 | `economia_anual_estimada` | `numeric(15,2)` | sim |  |  |  |
| 19 | `carga_tributaria_recomendada` | `numeric(7,4)` | sim |  |  |  |
| 20 | `motivo_recomendacao` | `text` | sim |  |  |  |
| 21 | `base_legal_decisao` | `text` | sim |  |  |  |
| 22 | `versao_motor` | `text` | não | `'3.9.0'::text` |  |  |
| 23 | `tempo_execucao_ms` | `integer` | sim |  |  |  |
| 24 | `executada_por` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| simulacoes_carga_chk | CHECK | `CHECK (carga_tributaria_recomendada IS NULL OR carga_tributaria_recomendada >= 0::numeric AND carga_tributaria_recomendada <= 2::numeric)` |  |  | sim |
| simulacoes_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| simulacoes_periodo_chk | CHECK | `CHECK (periodo_fim >= periodo_inicio)` |  |  | sim |
| simulacoes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| simulacoes_tempo_execucao_ms_check | CHECK | `CHECK (tempo_execucao_ms IS NULL OR tempo_execucao_ms >= 0)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sim_empresa_data | btree | empresa_id, created_at | não | sim |  | `CREATE INDEX idx_sim_empresa_data ON public.simulacoes USING btree (empresa_id, created_at DESC)` |
| simulacoes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX simulacoes_pkey ON public.simulacoes USING btree (id)` |


## Policies (RLS)

### `simulacoes_acesso`

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
| trg_simulacoes_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

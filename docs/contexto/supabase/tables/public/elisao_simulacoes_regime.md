# public.elisao_simulacoes_regime

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
| 3 | `ano_referencia` | `integer` | sim |  |  |  |
| 4 | `regime_atual` | `text` | sim |  |  |  |
| 5 | `regime_simulado` | `text` | sim |  |  |  |
| 6 | `economia_estimada` | `numeric(14,2)` | sim |  |  |  |
| 7 | `detalhes` | `jsonb` | sim |  |  |  |
| 8 | `created_by` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `carga_atual` | `numeric(15,2)` | não | `0` |  |  |
| 11 | `carga_simulada` | `numeric(15,2)` | não | `0` |  |  |
| 12 | `premissas` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| elisao_simulacoes_regime_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| elisao_simulacoes_regime_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| elisao_simulacoes_regime_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX elisao_simulacoes_regime_pkey ON public.elisao_simulacoes_regime USING btree (id)` |
| idx_elisao_sim_empresa | btree | empresa_id, created_at | não | sim |  | `CREATE INDEX idx_elisao_sim_empresa ON public.elisao_simulacoes_regime USING btree (empresa_id, created_at DESC)` |


## Policies (RLS)

### `elisao_sim_regime_acesso`

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
| trg_elisao_sim_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.regime_decision_cache

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
| 3 | `ano` | `integer` | não |  |  |  |
| 4 | `mes` | `integer` | não |  |  |  |
| 5 | `decisao` | `jsonb` | não |  |  |  |
| 6 | `expires_at` | `timestamp with time zone` | não |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| regime_cache_unico | UNIQUE | `UNIQUE (empresa_id, ano, mes)` |  |  | sim |
| regime_decision_cache_ano_check | CHECK | `CHECK (ano >= 2000 AND ano <= 2100)` |  |  | sim |
| regime_decision_cache_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| regime_decision_cache_mes_check | CHECK | `CHECK (mes >= 1 AND mes <= 12)` |  |  | sim |
| regime_decision_cache_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_regime_cache_exp | btree | expires_at | não | sim |  | `CREATE INDEX idx_regime_cache_exp ON public.regime_decision_cache USING btree (expires_at DESC)` |
| regime_cache_unico | btree | empresa_id, ano, mes | sim | sim |  | `CREATE UNIQUE INDEX regime_cache_unico ON public.regime_decision_cache USING btree (empresa_id, ano, mes)` |
| regime_decision_cache_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX regime_decision_cache_pkey ON public.regime_decision_cache USING btree (id)` |


## Policies (RLS)

### `regime_cache_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_regime_cache_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

_nenhum_

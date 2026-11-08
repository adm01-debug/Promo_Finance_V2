# public.regimes_simulados

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
| 3 | `ano_referencia` | `integer` | não |  |  |  |
| 4 | `rbt12` | `numeric(15,2)` | sim |  |  |  |
| 5 | `folha_12m` | `numeric(15,2)` | sim |  |  |  |
| 6 | `fator_r` | `numeric(5,4)` | sim |  |  |  |
| 7 | `regime_atual` | `text` | sim |  |  |  |
| 8 | `regime_recomendado` | `text` | não |  |  |  |
| 9 | `cenarios` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 10 | `alertas` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 11 | `justificativa` | `text` | sim |  |  |  |
| 12 | `economia_anual_estimada` | `numeric(15,2)` | sim |  |  |  |
| 13 | `parametros` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 14 | `audit_log_id` | `uuid` | sim |  |  |  |
| 15 | `created_by` | `uuid` | sim |  |  |  |
| 16 | `data_simulacao` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `versao_motor` | `text` | sim |  |  |  |
| 19 | `ajustes_aplicados` | `jsonb` | não | `'[]'::jsonb` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| regimes_simulados_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| regimes_simulados_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| regimes_simulados_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_regimes_simulados_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_regimes_simulados_created_by_fk ON public.regimes_simulados USING btree (created_by)` |
| regimes_simulados_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX regimes_simulados_pkey ON public.regimes_simulados USING btree (id)` |


## Policies (RLS)

### `regimes_simulados_empresa_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |

### `regimes_simulados_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_3f1eaae3a0a07aa516a5 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

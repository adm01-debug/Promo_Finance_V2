# public.estrategias_elisao

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
| 2 | `codigo` | `text` | não |  |  |  |
| 3 | `nome` | `text` | não |  |  |  |
| 4 | `categoria` | `text` | sim |  |  |  |
| 5 | `descricao` | `text` | sim |  |  |  |
| 6 | `regimes_aplicaveis` | `text[]` | não | `'{}'::text[]` |  |  |
| 7 | `economia_estimada_percentual` | `numeric(6,4)` | sim |  |  |  |
| 8 | `risco` | `nivel_risco` | não | `'MEDIO'::nivel_risco` |  |  |
| 9 | `base_legal` | `text` | sim |  |  |  |
| 10 | `requisitos` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 11 | `ativo` | `boolean` | não | `true` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| estrategias_economia_range_chk | CHECK | `CHECK (economia_estimada_percentual IS NULL OR economia_estimada_percentual >= 0::numeric AND economia_estimada_percentual <= 1::numeric)` |  |  | sim |
| estrategias_elisao_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| estrategias_elisao_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| estrategias_regimes_chk | CHECK | `CHECK (regimes_aplicaveis <@ ARRAY['MEI'::text, 'SIMPLES'::text, 'PRESUMIDO'::text, 'REAL'::text, 'ARBITRADO'::text])` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| estrategias_elisao_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX estrategias_elisao_codigo_key ON public.estrategias_elisao USING btree (codigo)` |
| estrategias_elisao_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX estrategias_elisao_pkey ON public.estrategias_elisao USING btree (id)` |


## Policies (RLS)

### `estrategias_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `estrategias_write_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_estrategias_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

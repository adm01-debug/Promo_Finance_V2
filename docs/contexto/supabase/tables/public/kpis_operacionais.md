# public.kpis_operacionais

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
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `nome` | `text` | não |  |  |  |
| 4 | `valor` | `numeric(15,4)` | não | `0` |  |  |
| 5 | `unidade` | `text` | sim | `'unidade'::text` |  |  |
| 6 | `periodo` | `text` | sim |  |  |  |
| 7 | `referencia` | `date` | sim |  |  |  |
| 8 | `meta` | `numeric(15,4)` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `user_id` | `uuid` | não |  |  |  |
| 11 | `valor_atual` | `numeric` | não | `0` |  |  |
| 12 | `tendencia` | `text` | sim |  |  |  |
| 13 | `categoria` | `text` | sim |  |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| kpis_operacionais_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| kpis_operacionais_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| kpis_operacionais_tendencia_check | CHECK | `CHECK (tendencia = ANY (ARRAY['subindo'::text, 'descendo'::text, 'estavel'::text]))` |  |  | sim |
| kpis_operacionais_unique | UNIQUE | `UNIQUE (user_id, nome)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| kpis_operacionais_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX kpis_operacionais_pkey ON public.kpis_operacionais USING btree (id)` |
| kpis_operacionais_unique | btree | user_id, nome | sim | sim |  | `CREATE UNIQUE INDEX kpis_operacionais_unique ON public.kpis_operacionais USING btree (user_id, nome)` |


## Policies (RLS)

### `kpis_operacionais_owner`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = auth.uid())` |
| WITH CHECK | `(user_id = auth.uid())` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_kpis_operacionais_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

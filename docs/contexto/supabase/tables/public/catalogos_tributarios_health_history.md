# public.catalogos_tributarios_health_history

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
| 2 | `score` | `numeric(5,2)` | sim |  |  |  |
| 3 | `status` | `text` | sim |  |  |  |
| 4 | `criticos` | `integer` | sim | `0` |  |  |
| 5 | `avisos` | `integer` | sim | `0` |  |  |
| 6 | `detalhes` | `jsonb` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `dia` | `date` | não |  |  |  |
| 9 | `infos` | `integer` | não | `0` |  |  |
| 10 | `total_invariantes` | `integer` | não | `0` |  |  |
| 11 | `saudavel` | `boolean` | não | `true` |  |  |
| 12 | `achados` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| catalogos_health_history_dia_key | UNIQUE | `UNIQUE (dia)` |  |  | sim |
| catalogos_tributarios_health_history_avisos_check | CHECK | `CHECK (avisos >= 0)` |  |  | sim |
| catalogos_tributarios_health_history_criticos_check | CHECK | `CHECK (criticos >= 0)` |  |  | sim |
| catalogos_tributarios_health_history_infos_check | CHECK | `CHECK (infos >= 0)` |  |  | sim |
| catalogos_tributarios_health_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| catalogos_tributarios_health_history_total_invariantes_check | CHECK | `CHECK (total_invariantes >= 0)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| catalogos_health_history_dia_key | btree | dia | sim | sim |  | `CREATE UNIQUE INDEX catalogos_health_history_dia_key ON public.catalogos_tributarios_health_history USING btree (dia)` |
| catalogos_tributarios_health_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX catalogos_tributarios_health_history_pkey ON public.catalogos_tributarios_health_history USING btree (id)` |


## Policies (RLS)

### `admins leem historico saude fiscal`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_catalogos_health_history_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

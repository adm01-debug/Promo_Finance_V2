# public.cnaes

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
| 3 | `descricao` | `text` | não |  |  |  |
| 4 | `anexo_simples` | `text` | sim |  |  |  |
| 5 | `sujeito_fator_r` | `boolean` | não | `false` |  |  |
| 6 | `vedado_simples` | `boolean` | não | `false` |  |  |
| 7 | `presuncao_irpj` | `numeric` | não | `0.08` |  |  |
| 8 | `presuncao_csll` | `numeric` | não | `0.12` |  |  |
| 9 | `rat_padrao` | `numeric` | não | `0.02` |  |  |
| 10 | `terceiros_padrao` | `numeric` | não | `0.058` |  |  |
| 11 | `atividade` | `atividade_economica` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cnaes_anexo_simples_check | CHECK | `CHECK (anexo_simples = ANY (ARRAY['I'::text, 'II'::text, 'III'::text, 'IV'::text, 'V'::text]))` |  |  | sim |
| cnaes_codigo_formato_chk | CHECK | `CHECK (codigo ~ '^[0-9]{4}-[0-9]/[0-9]{2}$'::text)` |  |  | sim |
| cnaes_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| cnaes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| cnaes_presuncoes_range_chk | CHECK | `CHECK (presuncao_irpj > 0::numeric AND presuncao_irpj <= 1::numeric AND presuncao_csll > 0::numeric AND presuncao_csll <= 1::numeric)` |  |  | sim |
| cnaes_rat_valores_chk | CHECK | `CHECK (rat_padrao = ANY (ARRAY[0.01, 0.02, 0.03]))` |  |  | sim |
| cnaes_terceiros_range_chk | CHECK | `CHECK (terceiros_padrao >= 0::numeric AND terceiros_padrao <= 0.1)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cnaes_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX cnaes_codigo_key ON public.cnaes USING btree (codigo)` |
| cnaes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cnaes_pkey ON public.cnaes USING btree (id)` |


## Policies (RLS)

### `cnaes_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `cnaes_write_admin`

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
| trg_cnaes_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

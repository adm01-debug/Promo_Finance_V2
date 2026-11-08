# public.beneficios_fiscais

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
| 4 | `uf` | `uf_brasil` | sim |  |  |  |
| 5 | `tipo` | `text` | não | `'CREDITO_PRESUMIDO'::text` |  |  |
| 6 | `descricao` | `text` | sim |  |  |  |
| 7 | `percentual` | `numeric` | sim |  |  |  |
| 8 | `criterios` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 9 | `base_legal` | `text` | sim |  |  |  |
| 10 | `vigente_de` | `date` | não | `'2024-01-01'::date` |  |  |
| 11 | `vigente_ate` | `date` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| beneficios_fiscais_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| beneficios_fiscais_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| beneficios_fiscais_vigencia_chk | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |
| beneficios_percentual_range_chk | CHECK | `CHECK (percentual IS NULL OR percentual >= 0::numeric AND percentual <= 1::numeric)` |  |  | sim |
| beneficios_tipo_chk | CHECK | `CHECK (tipo = ANY (ARRAY['CREDITO_PRESUMIDO'::text, 'CREDITO_OUTORGADO'::text, 'REDUCAO_BASE'::text, 'ISENCAO'::text, 'DIFERIMENTO'::text, 'ALIQUOTA_ZERO'::text, 'SUSPENSAO'::text, 'FINANCIAMENTO'::text, 'INCENTIVO_MUNICIPAL'::text, 'OUTRO'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| beneficios_fiscais_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX beneficios_fiscais_codigo_key ON public.beneficios_fiscais USING btree (codigo)` |
| beneficios_fiscais_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX beneficios_fiscais_pkey ON public.beneficios_fiscais USING btree (id)` |


## Policies (RLS)

### `beneficios_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `beneficios_write_admin`

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
| trg_beneficios_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.ncms

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
| 4 | `aliquota_ipi` | `numeric` | não | `0` |  |  |
| 5 | `cest` | `text` | sim |  |  |  |
| 6 | `monofasico_pis_cofins` | `boolean` | não | `false` |  |  |
| 7 | `sujeito_st` | `boolean` | não | `false` |  |  |
| 8 | `mva_padrao` | `numeric` | sim |  |  |  |
| 9 | `observacoes` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `vigente_de` | `date` | não | `'2022-01-01'::date` |  |  |
| 13 | `vigente_ate` | `date` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ncms_cest_formato_chk | CHECK | `CHECK (cest IS NULL OR cest ~ '^[0-9]{7}$'::text OR cest ~ '^[0-9]{2}\.[0-9]{3}\.[0-9]{2}$'::text)` |  |  | sim |
| ncms_codigo_formato_chk | CHECK | `CHECK (codigo ~ '^[0-9]{8}$'::text)` |  |  | sim |
| ncms_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| ncms_ipi_range_chk | CHECK | `CHECK (aliquota_ipi >= 0::numeric AND aliquota_ipi <= 1::numeric)` |  |  | sim |
| ncms_mva_range_chk | CHECK | `CHECK (mva_padrao IS NULL OR mva_padrao >= 0::numeric AND mva_padrao <= 3::numeric)` |  |  | sim |
| ncms_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| ncms_vigencia_coerente | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.protocolos_st_ncms | protocolos_st_ncms_ncm_id_fkey | ncm_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_ncms_vigencia | btree | vigente_de, vigente_ate | não | sim |  | `CREATE INDEX idx_ncms_vigencia ON public.ncms USING btree (vigente_de, vigente_ate)` |
| ncms_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX ncms_codigo_key ON public.ncms USING btree (codigo)` |
| ncms_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ncms_pkey ON public.ncms USING btree (id)` |


## Policies (RLS)

### `ncms_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `ncms_write_admin`

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
| trg_ncms_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

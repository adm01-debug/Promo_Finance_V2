# public.aliquotas_internas_uf

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
| 2 | `uf` | `uf_brasil` | não |  |  |  |
| 3 | `categoria_produto` | `text` | não | `'GERAL'::text` |  |  |
| 4 | `aliquota` | `numeric(6,4)` | não |  |  |  |
| 5 | `aliquota_fcp` | `numeric` | não | `0` |  |  |
| 6 | `base_legal` | `text` | sim |  |  |  |
| 7 | `vigente_de` | `date` | não | `'2024-01-01'::date` |  |  |
| 8 | `vigente_ate` | `date` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| aliq_internas_range_chk | CHECK | `CHECK (aliquota >= 0::numeric AND aliquota <= 0.35 AND aliquota_fcp >= 0::numeric AND aliquota_fcp <= 0.05)` |  |  | sim |
| aliquotas_internas_uf_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| aliquotas_internas_uf_unique | UNIQUE | `UNIQUE (uf, categoria_produto, vigente_de)` |  |  | sim |
| aliquotas_internas_uf_vigencia_chk | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| aliquotas_internas_uf_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX aliquotas_internas_uf_pkey ON public.aliquotas_internas_uf USING btree (id)` |
| aliquotas_internas_uf_unique | btree | uf, categoria_produto, vigente_de | sim | sim |  | `CREATE UNIQUE INDEX aliquotas_internas_uf_unique ON public.aliquotas_internas_uf USING btree (uf, categoria_produto, vigente_de)` |


## Policies (RLS)

### `aliq_internas_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `aliq_internas_write_admin`

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
| trg_aliq_internas_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_aliquotas_internas_uf_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

_nenhum_

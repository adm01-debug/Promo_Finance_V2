# public.aliquotas_interestaduais

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
| 2 | `uf_origem` | `uf_brasil` | não |  |  |  |
| 3 | `uf_destino` | `uf_brasil` | não |  |  |  |
| 4 | `aliquota` | `numeric(6,4)` | não |  |  |  |
| 5 | `aliquota_importado` | `numeric` | não | `0.04` |  |  |
| 6 | `vigente_de` | `date` | não | `'2016-01-01'::date` |  |  |
| 7 | `vigente_ate` | `date` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| aliq_inter_importado_range_chk | CHECK | `CHECK (aliquota_importado >= 0::numeric AND aliquota_importado <= 0.12)` |  |  | sim |
| aliq_inter_ufs_distintas_chk | CHECK | `CHECK (uf_origem <> uf_destino)` |  |  | sim |
| aliq_inter_valores_chk | CHECK | `CHECK (aliquota = ANY (ARRAY[0.04, 0.07, 0.12]))` |  |  | sim |
| aliquotas_interestaduais_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| aliquotas_interestaduais_unique | UNIQUE | `UNIQUE (uf_origem, uf_destino, vigente_de)` |  |  | sim |
| aliquotas_interestaduais_vigencia_chk | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| aliquotas_interestaduais_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX aliquotas_interestaduais_pkey ON public.aliquotas_interestaduais USING btree (id)` |
| aliquotas_interestaduais_unique | btree | uf_origem, uf_destino, vigente_de | sim | sim |  | `CREATE UNIQUE INDEX aliquotas_interestaduais_unique ON public.aliquotas_interestaduais USING btree (uf_origem, uf_destino, vigente_de)` |


## Policies (RLS)

### `aliq_inter_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `aliq_inter_write_admin`

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
| trg_aliq_inter_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_aliquotas_interestaduais_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

_nenhum_

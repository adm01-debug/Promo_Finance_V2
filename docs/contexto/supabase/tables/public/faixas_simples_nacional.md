# public.faixas_simples_nacional

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
| 2 | `anexo` | `text` | não |  |  |  |
| 3 | `faixa` | `smallint` | não |  |  |  |
| 4 | `rbt12_de` | `numeric` | não |  |  |  |
| 5 | `rbt12_ate` | `numeric` | não |  |  |  |
| 6 | `aliquota` | `numeric` | não |  |  |  |
| 7 | `parcela_deduzir` | `numeric` | não | `0` |  |  |
| 8 | `reparticao` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 9 | `vigente_de` | `date` | não | `'2018-01-01'::date` |  |  |
| 10 | `vigente_ate` | `date` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| faixas_simples_aliquota_range_chk | CHECK | `CHECK (aliquota > 0::numeric AND aliquota <= 1::numeric AND parcela_deduzir >= 0::numeric)` |  |  | sim |
| faixas_simples_anexo_faixa_key | UNIQUE | `UNIQUE (anexo, faixa, vigente_de)` |  |  | sim |
| faixas_simples_intervalo_chk | CHECK | `CHECK (rbt12_ate > rbt12_de)` |  |  | sim |
| faixas_simples_nacional_anexo_check | CHECK | `CHECK (anexo = ANY (ARRAY['I'::text, 'II'::text, 'III'::text, 'IV'::text, 'V'::text]))` |  |  | sim |
| faixas_simples_nacional_faixa_check | CHECK | `CHECK (faixa >= 1 AND faixa <= 6)` |  |  | sim |
| faixas_simples_nacional_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| faixas_simples_reparticao_soma_chk | CHECK | `CHECK (faixa_simples_reparticao_valida(reparticao)) NOT VALID` |  |  | não |
| faixas_simples_vigencia_chk | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| faixas_simples_anexo_faixa_key | btree | anexo, faixa, vigente_de | sim | sim |  | `CREATE UNIQUE INDEX faixas_simples_anexo_faixa_key ON public.faixas_simples_nacional USING btree (anexo, faixa, vigente_de)` |
| faixas_simples_nacional_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX faixas_simples_nacional_pkey ON public.faixas_simples_nacional USING btree (id)` |


## Policies (RLS)

### `faixas_simples_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `faixas_simples_write_admin`

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
| trg_faixas_simples_nacional_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_faixas_simples_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

_nenhum_

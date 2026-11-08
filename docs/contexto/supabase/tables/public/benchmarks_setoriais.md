# public.benchmarks_setoriais

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
| 2 | `cnae` | `text` | sim |  |  |  |
| 3 | `porte_empresa` | `text` | sim |  |  |  |
| 4 | `regime_tributario` | `text` | sim |  |  |  |
| 5 | `indicador` | `text` | não |  |  |  |
| 6 | `valor` | `numeric` | sim |  |  |  |
| 7 | `percentil_25` | `numeric` | sim |  |  |  |
| 8 | `mediana` | `numeric` | sim |  |  |  |
| 9 | `percentil_75` | `numeric` | sim |  |  |  |
| 10 | `ano` | `integer` | sim |  |  |  |
| 11 | `fonte` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `setor` | `text` | não |  |  |  |
| 14 | `cnae_prefix` | `text` | não |  |  |  |
| 15 | `regime` | `text` | não |  |  |  |
| 16 | `carga_media_pct` | `numeric(6,3)` | não |  |  |  |
| 17 | `carga_p25_pct` | `numeric(6,3)` | sim |  |  |  |
| 18 | `carga_p75_pct` | `numeric(6,3)` | sim |  |  |  |
| 19 | `vigencia_inicio` | `date` | não | `CURRENT_DATE` |  |  |
| 20 | `vigencia_fim` | `date` | sim |  |  |  |
| 21 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| benchmark_percentis_coerentes | CHECK | `CHECK (carga_p25_pct IS NULL OR carga_p75_pct IS NULL OR carga_p75_pct >= carga_p25_pct)` |  |  | sim |
| benchmark_unico | UNIQUE | `UNIQUE (cnae_prefix, regime, vigencia_inicio)` |  |  | sim |
| benchmark_vigencia_valida | CHECK | `CHECK (vigencia_fim IS NULL OR vigencia_fim >= vigencia_inicio)` |  |  | sim |
| benchmarks_setoriais_carga_media_pct_check | CHECK | `CHECK (carga_media_pct >= 0::numeric AND carga_media_pct <= 100::numeric)` |  |  | sim |
| benchmarks_setoriais_carga_p25_pct_check | CHECK | `CHECK (carga_p25_pct IS NULL OR carga_p25_pct >= 0::numeric AND carga_p25_pct <= 100::numeric)` |  |  | sim |
| benchmarks_setoriais_carga_p75_pct_check | CHECK | `CHECK (carga_p75_pct IS NULL OR carga_p75_pct >= 0::numeric AND carga_p75_pct <= 100::numeric)` |  |  | sim |
| benchmarks_setoriais_cnae_prefix_check | CHECK | `CHECK (cnae_prefix ~ '^[0-9]{2,7}$'::text)` |  |  | sim |
| benchmarks_setoriais_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| benchmarks_setoriais_regime_check | CHECK | `CHECK (regime = ANY (ARRAY['simples_nacional'::text, 'lucro_presumido'::text, 'lucro_real'::text, 'mei'::text, 'arbitrado'::text]))` |  |  | sim |
| benchmarks_setoriais_setor_check | CHECK | `CHECK (char_length(setor) >= 2 AND char_length(setor) <= 160)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| benchmark_unico | btree | cnae_prefix, regime, vigencia_inicio | sim | sim |  | `CREATE UNIQUE INDEX benchmark_unico ON public.benchmarks_setoriais USING btree (cnae_prefix, regime, vigencia_inicio)` |
| benchmarks_setoriais_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX benchmarks_setoriais_pkey ON public.benchmarks_setoriais USING btree (id)` |


## Policies (RLS)

### `benchmarks_admin_write`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `benchmarks_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_benchmarks_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

_nenhum_

# public.catalogo_aliquota_referencia

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
| 2 | `ano` | `integer` | não |  |  |  |
| 3 | `tributo` | `text` | não |  |  |  |
| 4 | `uf` | `character(2)` | sim |  |  |  |
| 5 | `municipio_ibge` | `character varying(7)` | sim |  |  |  |
| 6 | `aliquota` | `numeric(5,4)` | não |  |  |  |
| 7 | `fonte` | `text` | não | `'RFB'::text` |  |  |
| 8 | `carregado_em` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| catalogo_aliquota_referencia_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| catalogo_aliquota_referencia_tributo_check | CHECK | `CHECK (tributo = ANY (ARRAY['cbs'::text, 'ibs_uf'::text, 'ibs_mun'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| catalogo_aliquota_referencia_cbs_uk | btree | ano | sim | sim | `(tributo = 'cbs'::text)` | `CREATE UNIQUE INDEX catalogo_aliquota_referencia_cbs_uk ON public.catalogo_aliquota_referencia USING btree (ano) WHERE (tributo = 'cbs'::text)` |
| catalogo_aliquota_referencia_ibs_mun_uk | btree | ano, municipio_ibge | sim | sim | `(tributo = 'ibs_mun'::text)` | `CREATE UNIQUE INDEX catalogo_aliquota_referencia_ibs_mun_uk ON public.catalogo_aliquota_referencia USING btree (ano, municipio_ibge) WHERE (tributo = 'ibs_mun'::text)` |
| catalogo_aliquota_referencia_ibs_uf_uk | btree | ano, uf | sim | sim | `(tributo = 'ibs_uf'::text)` | `CREATE UNIQUE INDEX catalogo_aliquota_referencia_ibs_uf_uk ON public.catalogo_aliquota_referencia USING btree (ano, uf) WHERE (tributo = 'ibs_uf'::text)` |
| catalogo_aliquota_referencia_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX catalogo_aliquota_referencia_pkey ON public.catalogo_aliquota_referencia USING btree (id)` |


## Policies (RLS)

### `catalogo_aliquota_referencia_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `catalogo_aliquota_referencia_service_role_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

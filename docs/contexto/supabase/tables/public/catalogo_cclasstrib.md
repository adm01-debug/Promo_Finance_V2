# public.catalogo_cclasstrib

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
| 1 | `cclasstrib` | `character(6)` | não |  |  |  |
| 2 | `cst` | `character(3)` | não |  |  |  |
| 3 | `descricao` | `text` | não |  |  |  |
| 4 | `p_red_cbs` | `numeric(5,4)` | não | `0` |  |  |
| 5 | `p_red_ibs_uf` | `numeric(5,4)` | não | `0` |  |  |
| 6 | `p_red_ibs_mun` | `numeric(5,4)` | não | `0` |  |  |
| 7 | `exige_gibscbs` | `boolean` | não | `false` |  |  |
| 8 | `ind_dir` | `smallint` | sim |  |  |  |
| 9 | `inicio_vigencia` | `date` | não |  |  |  |
| 10 | `fim_vigencia` | `date` | sim |  |  |  |
| 11 | `versao_it` | `text` | não |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| catalogo_cclasstrib_pkey | PRIMARY KEY | `PRIMARY KEY (cclasstrib, inicio_vigencia)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| catalogo_cclasstrib_pkey | btree | cclasstrib, inicio_vigencia | sim | sim |  | `CREATE UNIQUE INDEX catalogo_cclasstrib_pkey ON public.catalogo_cclasstrib USING btree (cclasstrib, inicio_vigencia)` |


## Policies (RLS)

### `catalogo_cclasstrib_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `catalogo_cclasstrib_service_role_all`

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

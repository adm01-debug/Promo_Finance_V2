# public.catalogo_fundamentacao

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
| 3 | `conjunto_tributo` | `text` | não |  |  |  |
| 4 | `descricao_cclasstrib` | `text` | sim |  |  |  |
| 5 | `descricao_cst` | `text` | sim |  |  |  |
| 6 | `texto` | `text` | sim |  |  |  |
| 7 | `texto_curto` | `text` | sim |  |  |  |
| 8 | `referencia_normativa` | `text` | sim |  |  |  |
| 9 | `inicio_vigencia` | `date` | não |  |  |  |
| 10 | `fim_vigencia` | `date` | sim |  |  |  |
| 11 | `versao_it` | `text` | não |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| catalogo_fundamentacao_pkey | PRIMARY KEY | `PRIMARY KEY (cclasstrib, cst, conjunto_tributo, inicio_vigencia)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| catalogo_fundamentacao_pkey | btree | cclasstrib, cst, conjunto_tributo, inicio_vigencia | sim | sim |  | `CREATE UNIQUE INDEX catalogo_fundamentacao_pkey ON public.catalogo_fundamentacao USING btree (cclasstrib, cst, conjunto_tributo, inicio_vigencia)` |
| catalogo_fundamentacao_vigencia_idx | btree | inicio_vigencia, fim_vigencia | não | sim |  | `CREATE INDEX catalogo_fundamentacao_vigencia_idx ON public.catalogo_fundamentacao USING btree (inicio_vigencia, fim_vigencia)` |


## Policies (RLS)

### `catalogo_fundamentacao_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `catalogo_fundamentacao_service_role_all`

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

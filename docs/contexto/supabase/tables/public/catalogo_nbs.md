# public.catalogo_nbs

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
| 1 | `nbs` | `text` | não |  |  |  |
| 2 | `descricao` | `text` | não |  |  |  |
| 3 | `inicio_vigencia` | `date` | não |  |  |  |
| 4 | `fim_vigencia` | `date` | sim |  |  |  |
| 5 | `fonte` | `text` | não | `'RFB'::text` |  |  |
| 6 | `carregado_em` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| catalogo_nbs_pkey | PRIMARY KEY | `PRIMARY KEY (nbs, inicio_vigencia)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| catalogo_nbs_pkey | btree | nbs, inicio_vigencia | sim | sim |  | `CREATE UNIQUE INDEX catalogo_nbs_pkey ON public.catalogo_nbs USING btree (nbs, inicio_vigencia)` |


## Policies (RLS)

### `catalogo_nbs_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `catalogo_nbs_service_role_all`

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

# public.produto_cclasstrib_padrao

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `produto_id` | `text` | não |  |  |  |
| 2 | `codigo` | `text` | sim |  |  |  |
| 3 | `ncm` | `character(8)` | sim |  |  |  |
| 4 | `cst` | `character(3)` | não |  |  |  |
| 5 | `cclasstrib` | `character(6)` | não |  |  |  |
| 6 | `atualizado_em` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `atualizado_por` | `uuid` | sim | `auth.uid()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| produto_cclasstrib_padrao_cclasstrib_chk | CHECK | `CHECK (cclasstrib ~ '^[0-9]{6}$'::text)` |  |  | sim |
| produto_cclasstrib_padrao_cst_chk | CHECK | `CHECK (cst ~ '^[0-9]{3}$'::text)` |  |  | sim |
| produto_cclasstrib_padrao_ncm_chk | CHECK | `CHECK (ncm IS NULL OR ncm ~ '^[0-9]{8}$'::text)` |  |  | sim |
| produto_cclasstrib_padrao_pkey | PRIMARY KEY | `PRIMARY KEY (produto_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| produto_cclasstrib_padrao_codigo_idx | btree | codigo | não | sim |  | `CREATE INDEX produto_cclasstrib_padrao_codigo_idx ON public.produto_cclasstrib_padrao USING btree (codigo)` |
| produto_cclasstrib_padrao_ncm_idx | btree | ncm | não | sim |  | `CREATE INDEX produto_cclasstrib_padrao_ncm_idx ON public.produto_cclasstrib_padrao USING btree (ncm)` |
| produto_cclasstrib_padrao_pkey | btree | produto_id | sim | sim |  | `CREATE UNIQUE INDEX produto_cclasstrib_padrao_pkey ON public.produto_cclasstrib_padrao USING btree (produto_id)` |


## Policies (RLS)

### `produto_cclasstrib_padrao_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])` |
| WITH CHECK | `has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

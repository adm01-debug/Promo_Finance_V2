# public.notas_fiscais_itens

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
| 2 | `nota_fiscal_id` | `uuid` | não |  |  |  |
| 3 | `n_item` | `integer` | não |  |  |  |
| 4 | `c_prod` | `text` | não |  |  |  |
| 5 | `ncm` | `character varying(8)` | não |  |  |  |
| 6 | `cfop` | `character varying(4)` | não |  |  |  |
| 7 | `q_com` | `numeric(15,4)` | não | `0` |  |  |
| 8 | `v_un_com` | `numeric(21,10)` | não | `0` |  |  |
| 9 | `v_prod` | `numeric(15,2)` | não | `0` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `cst_ibscbs` | `character(3)` | sim |  |  |  |
| 12 | `cclasstrib` | `character(6)` | sim |  |  |  |
| 13 | `v_bc_ibscbs` | `numeric(15,2)` | sim |  |  |  |
| 14 | `p_ibs_uf` | `numeric(5,4)` | sim |  |  |  |
| 15 | `v_ibs_uf` | `numeric(15,2)` | sim |  |  |  |
| 16 | `p_ibs_mun` | `numeric(5,4)` | sim |  |  |  |
| 17 | `v_ibs_mun` | `numeric(15,2)` | sim |  |  |  |
| 18 | `p_cbs` | `numeric(5,4)` | sim |  |  |  |
| 19 | `v_cbs` | `numeric(15,2)` | sim |  |  |  |
| 20 | `v_ibs` | `numeric(15,2)` | sim |  |  |  |
| 21 | `p_red_aliq` | `numeric(5,4)` | sim |  |  |  |
| 22 | `p_aliq_efet` | `numeric(5,4)` | sim |  |  |  |
| 23 | `cst_is` | `character(3)` | sim |  |  |  |
| 24 | `cclasstrib_is` | `character(6)` | sim |  |  |  |
| 25 | `v_bc_is` | `numeric(15,2)` | sim |  |  |  |
| 26 | `p_is` | `numeric(5,4)` | sim |  |  |  |
| 27 | `ad_rem_is` | `numeric(15,4)` | sim |  |  |  |
| 28 | `v_is` | `numeric(15,2)` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notas_fiscais_itens_nota_fiscal_id_fkey | FOREIGN KEY | `FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| notas_fiscais_itens_nota_item_uk | UNIQUE | `UNIQUE (nota_fiscal_id, n_item)` |  |  | sim |
| notas_fiscais_itens_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| notas_fiscais_itens_v_ibs_soma_ck | CHECK | `CHECK (v_ibs IS NULL OR v_ibs_uf IS NOT NULL AND v_ibs_mun IS NOT NULL AND v_ibs = (v_ibs_uf + v_ibs_mun))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| notas_fiscais_itens_nota_item_uk | btree | nota_fiscal_id, n_item | sim | sim |  | `CREATE UNIQUE INDEX notas_fiscais_itens_nota_item_uk ON public.notas_fiscais_itens USING btree (nota_fiscal_id, n_item)` |
| notas_fiscais_itens_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX notas_fiscais_itens_pkey ON public.notas_fiscais_itens USING btree (id)` |


## Policies (RLS)

### `notas_fiscais_itens_mutate`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM notas_fiscais nf   WHERE ((nf.id = notas_fiscais_itens.nota_fiscal_id) AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_membro_ativo(nf.empresa_id))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM notas_fiscais nf   WHERE ((nf.id = notas_fiscais_itens.nota_fiscal_id) AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_membro_ativo(nf.empresa_id))))` |

### `notas_fiscais_itens_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM notas_fiscais nf   WHERE ((nf.id = notas_fiscais_itens.nota_fiscal_id) AND empresa_acessivel(nf.empresa_id))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| notas_fiscais_itens_verifica_totais_ibscbs | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.verificar_totais_ibscbs_item |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

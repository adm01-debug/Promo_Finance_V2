# public.notas_fiscais_itens

> Dicionário estrutural de public.notas_fiscais_itens (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE; UNIQUE (nota_fiscal_id, n_item); PRIMARY KEY (id); CHECK (v_ibs IS NULL OR v_ibs_uf IS NOT NULL AND v_ibs_mun IS NOT NULL AND v_ibs = (v_ibs_uf + v_ibs_mun)). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `nota_fiscal_id` | `uuid` | não |  |  | Dicionário estrutural da coluna nota_fiscal_id em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: nota_fiscal_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id) ON DELETE CASCADE; UNIQUE (nota_fiscal_id, n_item). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `n_item` | `integer` | não |  |  | Dicionário estrutural da coluna n_item em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: n_item; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (nota_fiscal_id, n_item). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 4 | `c_prod` | `text` | não |  |  | Dicionário estrutural da coluna c_prod em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: c_prod; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `ncm` | `character varying(8)` | não |  |  | Dicionário estrutural da coluna ncm em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: ncm; o catálogo não especifica significado adicional. Tipo: character varying(8). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `cfop` | `character varying(4)` | não |  |  | Dicionário estrutural da coluna cfop em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: cfop; o catálogo não especifica significado adicional. Tipo: character varying(4). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `q_com` | `numeric(15,4)` | não | `0` |  | Dicionário estrutural da coluna q_com em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: q_com; o catálogo não especifica significado adicional. Tipo: numeric(15,4). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `v_un_com` | `numeric(21,10)` | não | `0` |  | Dicionário estrutural da coluna v_un_com em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: v_un_com; o catálogo não especifica significado adicional. Tipo: numeric(21,10). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `v_prod` | `numeric(15,2)` | não | `0` |  | Dicionário estrutural da coluna v_prod em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: v_prod; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `cst_ibscbs` | `character(3)` | sim |  |  | Dicionário estrutural da coluna cst_ibscbs em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: cst_ibscbs; o catálogo não especifica significado adicional. Tipo: character(3). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `cclasstrib` | `character(6)` | sim |  |  | Dicionário estrutural da coluna cclasstrib em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: cclasstrib; o catálogo não especifica significado adicional. Tipo: character(6). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `v_bc_ibscbs` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna v_bc_ibscbs em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: v_bc_ibscbs; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `p_ibs_uf` | `numeric(7,6)` | sim |  |  | Dicionário estrutural da coluna p_ibs_uf em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: p_ibs_uf; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `v_ibs_uf` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna v_ibs_uf em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: v_ibs_uf; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (v_ibs IS NULL OR v_ibs_uf IS NOT NULL AND v_ibs_mun IS NOT NULL AND v_ibs = (v_ibs_uf + v_ibs_mun)). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `p_ibs_mun` | `numeric(7,6)` | sim |  |  | Dicionário estrutural da coluna p_ibs_mun em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: p_ibs_mun; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `v_ibs_mun` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna v_ibs_mun em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: v_ibs_mun; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (v_ibs IS NULL OR v_ibs_uf IS NOT NULL AND v_ibs_mun IS NOT NULL AND v_ibs = (v_ibs_uf + v_ibs_mun)). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 18 | `p_cbs` | `numeric(7,6)` | sim |  |  | Dicionário estrutural da coluna p_cbs em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: p_cbs; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `v_cbs` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna v_cbs em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: v_cbs; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 20 | `v_ibs` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna v_ibs em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: v_ibs; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (v_ibs IS NULL OR v_ibs_uf IS NOT NULL AND v_ibs_mun IS NOT NULL AND v_ibs = (v_ibs_uf + v_ibs_mun)). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `p_red_aliq` | `numeric(7,6)` | sim |  |  | Dicionário estrutural da coluna p_red_aliq em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: p_red_aliq; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 22 | `p_aliq_efet` | `numeric(7,6)` | sim |  |  | Dicionário estrutural da coluna p_aliq_efet em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: p_aliq_efet; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 23 | `cst_is` | `character(3)` | sim |  |  | Dicionário estrutural da coluna cst_is em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: cst_is; o catálogo não especifica significado adicional. Tipo: character(3). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 24 | `cclasstrib_is` | `character(6)` | sim |  |  | Dicionário estrutural da coluna cclasstrib_is em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: cclasstrib_is; o catálogo não especifica significado adicional. Tipo: character(6). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 25 | `v_bc_is` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna v_bc_is em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: v_bc_is; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 26 | `p_is` | `numeric(7,6)` | sim |  |  | Dicionário estrutural da coluna p_is em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: p_is; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 27 | `ad_rem_is` | `numeric(15,4)` | sim |  |  | Dicionário estrutural da coluna ad_rem_is em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: ad_rem_is; o catálogo não especifica significado adicional. Tipo: numeric(15,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 28 | `v_is` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna v_is em public.notas_fiscais_itens. Papel funcional indicado pelo identificador: v_is; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 29 | `x_prod` | `text` | sim |  |  |  |


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

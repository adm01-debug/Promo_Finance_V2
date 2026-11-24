# public.catalogo_cclasstrib

> Dicionário estrutural de public.catalogo_cclasstrib (tabela). Chave primária declarada: cclasstrib, inicio_vigencia. Restrições declaradas no catálogo: PRIMARY KEY (cclasstrib, inicio_vigencia). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `cclasstrib` | `character(6)` | não |  |  | Dicionário estrutural da coluna cclasstrib em public.catalogo_cclasstrib. Papel funcional indicado pelo identificador: cclasstrib; o catálogo não especifica significado adicional. Tipo: character(6). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (cclasstrib, inicio_vigencia). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `cst` | `character(3)` | não |  |  | Dicionário estrutural da coluna cst em public.catalogo_cclasstrib. Papel funcional indicado pelo identificador: cst; o catálogo não especifica significado adicional. Tipo: character(3). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `descricao` | `text` | não |  |  | Dicionário estrutural da coluna descricao em public.catalogo_cclasstrib. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `p_red_cbs` | `numeric(5,4)` | não | `0` |  | Dicionário estrutural da coluna p_red_cbs em public.catalogo_cclasstrib. Papel funcional indicado pelo identificador: p_red_cbs; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `p_red_ibs_uf` | `numeric(5,4)` | não | `0` |  | Dicionário estrutural da coluna p_red_ibs_uf em public.catalogo_cclasstrib. Papel funcional indicado pelo identificador: p_red_ibs_uf; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `p_red_ibs_mun` | `numeric(5,4)` | não | `0` |  | Dicionário estrutural da coluna p_red_ibs_mun em public.catalogo_cclasstrib. Papel funcional indicado pelo identificador: p_red_ibs_mun; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `exige_gibscbs` | `boolean` | não | `false` |  | Dicionário estrutural da coluna exige_gibscbs em public.catalogo_cclasstrib. Papel funcional indicado pelo identificador: exige_gibscbs; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `ind_dir` | `smallint` | sim |  |  | Dicionário estrutural da coluna ind_dir em public.catalogo_cclasstrib. Papel funcional indicado pelo identificador: ind_dir; o catálogo não especifica significado adicional. Tipo: smallint. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `inicio_vigencia` | `date` | não |  |  | Dicionário estrutural da coluna inicio_vigencia em public.catalogo_cclasstrib. Papel funcional indicado pelo identificador: inicio_vigencia; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (cclasstrib, inicio_vigencia). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `fim_vigencia` | `date` | sim |  |  | Dicionário estrutural da coluna fim_vigencia em public.catalogo_cclasstrib. Papel funcional indicado pelo identificador: fim_vigencia; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `versao_it` | `text` | não |  |  | Dicionário estrutural da coluna versao_it em public.catalogo_cclasstrib. Papel funcional indicado pelo identificador: versao_it; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.catalogo_cclasstrib. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


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

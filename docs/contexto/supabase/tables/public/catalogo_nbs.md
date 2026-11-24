# public.catalogo_nbs

> Dicionário estrutural de public.catalogo_nbs (tabela). Chave primária declarada: nbs, inicio_vigencia. Restrições declaradas no catálogo: PRIMARY KEY (nbs, inicio_vigencia). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `nbs` | `text` | não |  |  | Dicionário estrutural da coluna nbs em public.catalogo_nbs. Papel funcional indicado pelo identificador: nbs; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (nbs, inicio_vigencia). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `descricao` | `text` | não |  |  | Dicionário estrutural da coluna descricao em public.catalogo_nbs. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `inicio_vigencia` | `date` | não |  |  | Dicionário estrutural da coluna inicio_vigencia em public.catalogo_nbs. Papel funcional indicado pelo identificador: inicio_vigencia; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (nbs, inicio_vigencia). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `fim_vigencia` | `date` | sim |  |  | Dicionário estrutural da coluna fim_vigencia em public.catalogo_nbs. Papel funcional indicado pelo identificador: fim_vigencia; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `fonte` | `text` | não | `'RFB'::text` |  | Dicionário estrutural da coluna fonte em public.catalogo_nbs. Papel funcional indicado pelo identificador: fonte; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'RFB'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `carregado_em` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna carregado_em em public.catalogo_nbs. Papel funcional indicado pelo identificador: carregado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


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

# public.catalogo_aliquota_referencia

> Dicionário estrutural de public.catalogo_aliquota_referencia (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id); CHECK (tributo = ANY (ARRAY['cbs'::text, 'ibs_uf'::text, 'ibs_mun'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.catalogo_aliquota_referencia. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `ano` | `integer` | não |  |  | Dicionário estrutural da coluna ano em public.catalogo_aliquota_referencia. Papel funcional indicado pelo identificador: ano; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 3 | `tributo` | `text` | não |  |  | Dicionário estrutural da coluna tributo em public.catalogo_aliquota_referencia. Papel funcional indicado pelo identificador: tributo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tributo = ANY (ARRAY['cbs'::text, 'ibs_uf'::text, 'ibs_mun'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `uf` | `character(2)` | sim |  |  | Dicionário estrutural da coluna uf em public.catalogo_aliquota_referencia. Papel funcional indicado pelo identificador: uf; o catálogo não especifica significado adicional. Tipo: character(2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `municipio_ibge` | `character varying(7)` | sim |  |  | Dicionário estrutural da coluna municipio_ibge em public.catalogo_aliquota_referencia. Papel funcional indicado pelo identificador: municipio_ibge; o catálogo não especifica significado adicional. Tipo: character varying(7). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `aliquota` | `numeric(5,4)` | não |  |  | Dicionário estrutural da coluna aliquota em public.catalogo_aliquota_referencia. Papel funcional indicado pelo identificador: aliquota; o catálogo não especifica significado adicional. Tipo: numeric(5,4). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `fonte` | `text` | não | `'RFB'::text` |  | Dicionário estrutural da coluna fonte em public.catalogo_aliquota_referencia. Papel funcional indicado pelo identificador: fonte; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'RFB'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `carregado_em` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna carregado_em em public.catalogo_aliquota_referencia. Papel funcional indicado pelo identificador: carregado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


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

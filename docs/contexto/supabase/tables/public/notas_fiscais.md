# public.notas_fiscais

> Dicionário estrutural de public.notas_fiscais (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: UNIQUE (chave_acesso); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.notas_fiscais. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.notas_fiscais. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `numero` | `text` | sim |  |  | Dicionário estrutural da coluna numero em public.notas_fiscais. Papel funcional indicado pelo identificador: numero; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `serie` | `text` | sim |  |  | Dicionário estrutural da coluna serie em public.notas_fiscais. Papel funcional indicado pelo identificador: serie; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `chave_acesso` | `text` | sim |  |  | Dicionário estrutural da coluna chave_acesso em public.notas_fiscais. Papel funcional indicado pelo identificador: chave_acesso; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (chave_acesso). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `valor_total` | `numeric` | sim | `0` |  | Dicionário estrutural da coluna valor_total em public.notas_fiscais. Papel funcional indicado pelo identificador: valor_total; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 7 | `valor_icms` | `numeric` | sim | `0` |  | Dicionário estrutural da coluna valor_icms em public.notas_fiscais. Papel funcional indicado pelo identificador: valor_icms; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 8 | `status` | `text` | sim | `'emitida'::text` |  | Dicionário estrutural da coluna status em public.notas_fiscais. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'emitida'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `xml_url` | `text` | sim |  |  | Dicionário estrutural da coluna xml_url em public.notas_fiscais. Papel funcional indicado pelo identificador: xml_url; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `data_emissao` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna data_emissao em public.notas_fiscais. Papel funcional indicado pelo identificador: data_emissao; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.notas_fiscais. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 12 | `valor_produtos` | `numeric` | sim | `0` |  | Dicionário estrutural da coluna valor_produtos em public.notas_fiscais. Papel funcional indicado pelo identificador: valor_produtos; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 13 | `cliente_cnpj` | `text` | sim |  |  | Dicionário estrutural da coluna cliente_cnpj em public.notas_fiscais. Papel funcional indicado pelo identificador: cliente_cnpj; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `cliente_nome` | `text` | sim |  |  | Dicionário estrutural da coluna cliente_nome em public.notas_fiscais. Papel funcional indicado pelo identificador: cliente_nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `valor_desconto` | `numeric` | não | `0` |  | Dicionário estrutural da coluna valor_desconto em public.notas_fiscais. Papel funcional indicado pelo identificador: valor_desconto; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 16 | `valor_frete` | `numeric` | não | `0` |  | Dicionário estrutural da coluna valor_frete em public.notas_fiscais. Papel funcional indicado pelo identificador: valor_frete; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 17 | `v_bc_ibscbs` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna v_bc_ibscbs em public.notas_fiscais. Papel funcional indicado pelo identificador: v_bc_ibscbs; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 18 | `v_ibs` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna v_ibs em public.notas_fiscais. Papel funcional indicado pelo identificador: v_ibs; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `v_ibs_uf` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna v_ibs_uf em public.notas_fiscais. Papel funcional indicado pelo identificador: v_ibs_uf; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 20 | `v_ibs_mun` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna v_ibs_mun em public.notas_fiscais. Papel funcional indicado pelo identificador: v_ibs_mun; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `v_cbs` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna v_cbs em public.notas_fiscais. Papel funcional indicado pelo identificador: v_cbs; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 22 | `v_is` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna v_is em public.notas_fiscais. Papel funcional indicado pelo identificador: v_is; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notas_fiscais_chave_acesso_key | UNIQUE | `UNIQUE (chave_acesso)` |  |  | sim |
| notas_fiscais_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| notas_fiscais_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.creditos_tributarios | creditos_tributarios_nota_fiscal_id_fkey | nota_fiscal_id | NO ACTION |
| public.notas_fiscais_itens | notas_fiscais_itens_nota_fiscal_id_fkey | nota_fiscal_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_nfe_data_emissao | btree | data_emissao | não | sim |  | `CREATE INDEX idx_nfe_data_emissao ON public.notas_fiscais USING btree (data_emissao)` |
| idx_nfe_numero | btree | numero | não | sim |  | `CREATE INDEX idx_nfe_numero ON public.notas_fiscais USING btree (numero)` |
| idx_notas_fiscais_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_notas_fiscais_empresa_id ON public.notas_fiscais USING btree (empresa_id)` |
| idx_notas_fiscais_status | btree | status | não | sim |  | `CREATE INDEX idx_notas_fiscais_status ON public.notas_fiscais USING btree (status)` |
| notas_fiscais_chave_acesso_key | btree | chave_acesso | sim | sim |  | `CREATE UNIQUE INDEX notas_fiscais_chave_acesso_key ON public.notas_fiscais USING btree (chave_acesso)` |
| notas_fiscais_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX notas_fiscais_pkey ON public.notas_fiscais USING btree (id)` |


## Policies (RLS)

### `Operacional+ can manage notas_fiscais`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_membro_ativo(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_membro_ativo(empresa_id))` |

### `notas_fiscais_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `notas_fiscais_tenant_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_membro_ativo(empresa_id) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| notas_fiscais_verifica_totais_ibscbs | BEFORE | INSERT OR UPDATE | ROW | enabled | public.verificar_totais_ibscbs_nota |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

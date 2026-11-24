# public.creditos_tributarios

> Dicionário estrutural de public.creditos_tributarios (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (apuracao_id) REFERENCES apuracoes_tributarias(id) ON DELETE SET NULL; FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL; FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id); PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.creditos_tributarios. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.creditos_tributarios. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `tipo_tributo` | `text` | não |  |  | Dicionário estrutural da coluna tipo_tributo em public.creditos_tributarios. Papel funcional indicado pelo identificador: tipo_tributo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `saldo_disponivel` | `numeric` | não | `0` |  | Dicionário estrutural da coluna saldo_disponivel em public.creditos_tributarios. Papel funcional indicado pelo identificador: saldo_disponivel; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 5 | `data_origem` | `date` | não | `CURRENT_DATE` |  | Dicionário estrutural da coluna data_origem em public.creditos_tributarios. Papel funcional indicado pelo identificador: data_origem; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: CURRENT_DATE. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `competencia_origem` | `text` | sim |  |  | Dicionário estrutural da coluna competencia_origem em public.creditos_tributarios. Papel funcional indicado pelo identificador: competencia_origem; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `status` | `text` | sim | `'disponivel'::text` |  | Dicionário estrutural da coluna status em public.creditos_tributarios. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'disponivel'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.creditos_tributarios. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `nota_fiscal_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna nota_fiscal_id em public.creditos_tributarios. Papel funcional indicado pelo identificador: nota_fiscal_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `valor_credito` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna valor_credito em public.creditos_tributarios. Papel funcional indicado pelo identificador: valor_credito; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `valor_utilizado` | `numeric` | sim | `0` |  | Dicionário estrutural da coluna valor_utilizado em public.creditos_tributarios. Papel funcional indicado pelo identificador: valor_utilizado; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 12 | `tipo_credito` | `text` | sim |  |  | Dicionário estrutural da coluna tipo_credito em public.creditos_tributarios. Papel funcional indicado pelo identificador: tipo_credito; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `documento_tipo` | `text` | sim |  |  | Dicionário estrutural da coluna documento_tipo em public.creditos_tributarios. Papel funcional indicado pelo identificador: documento_tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `documento_numero` | `text` | sim |  |  | Dicionário estrutural da coluna documento_numero em public.creditos_tributarios. Papel funcional indicado pelo identificador: documento_numero; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `documento_chave` | `text` | sim |  |  | Dicionário estrutural da coluna documento_chave em public.creditos_tributarios. Papel funcional indicado pelo identificador: documento_chave; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `fornecedor_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna fornecedor_id em public.creditos_tributarios. Papel funcional indicado pelo identificador: fornecedor_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `fornecedor_cnpj` | `text` | sim |  |  | Dicionário estrutural da coluna fornecedor_cnpj em public.creditos_tributarios. Papel funcional indicado pelo identificador: fornecedor_cnpj; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 18 | `fornecedor_nome` | `text` | sim |  |  | Dicionário estrutural da coluna fornecedor_nome em public.creditos_tributarios. Papel funcional indicado pelo identificador: fornecedor_nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `valor_base` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna valor_base em public.creditos_tributarios. Papel funcional indicado pelo identificador: valor_base; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 20 | `aliquota` | `numeric(9,6)` | sim |  |  | Dicionário estrutural da coluna aliquota em public.creditos_tributarios. Papel funcional indicado pelo identificador: aliquota; o catálogo não especifica significado adicional. Tipo: numeric(9,6). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.creditos_tributarios. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 22 | `apuracao_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna apuracao_id em public.creditos_tributarios. Papel funcional indicado pelo identificador: apuracao_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (apuracao_id) REFERENCES apuracoes_tributarias(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 23 | `competencia_utilizacao` | `text` | sim |  |  | Dicionário estrutural da coluna competencia_utilizacao em public.creditos_tributarios. Papel funcional indicado pelo identificador: competencia_utilizacao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 24 | `origem` | `origem_credito_tributario` | não | `'estimado'::origem_credito_tributario` |  | Dicionário estrutural da coluna origem em public.creditos_tributarios. Papel funcional indicado pelo identificador: origem; o catálogo não especifica significado adicional. Tipo: origem_credito_tributario. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'estimado'::origem_credito_tributario. Valores de enum: xml_destacado, estimado, manual. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 25 | `efeito_tributario` | `boolean` | não | `false` |  | Dicionário estrutural da coluna efeito_tributario em public.creditos_tributarios. Papel funcional indicado pelo identificador: efeito_tributario; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 26 | `ano_fato_gerador` | `integer` | sim |  |  | Dicionário estrutural da coluna ano_fato_gerador em public.creditos_tributarios. Papel funcional indicado pelo identificador: ano_fato_gerador; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| creditos_tributarios_apuracao_id_fkey | FOREIGN KEY | `FOREIGN KEY (apuracao_id) REFERENCES apuracoes_tributarias(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| creditos_tributarios_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| creditos_tributarios_fornecedor_id_fkey | FOREIGN KEY | `FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| creditos_tributarios_nota_fiscal_id_fkey | FOREIGN KEY | `FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais(id)` | NO ACTION | NO ACTION | sim |
| creditos_tributarios_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| creditos_tributarios_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX creditos_tributarios_pkey ON public.creditos_tributarios USING btree (id)` |
| idx_creditos_tributarios_apuracao_id | btree | apuracao_id | não | sim |  | `CREATE INDEX idx_creditos_tributarios_apuracao_id ON public.creditos_tributarios USING btree (apuracao_id)` |
| idx_creditos_tributarios_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_creditos_tributarios_empresa_id ON public.creditos_tributarios USING btree (empresa_id)` |
| idx_creditos_tributarios_fornecedor_id | btree | fornecedor_id | não | sim |  | `CREATE INDEX idx_creditos_tributarios_fornecedor_id ON public.creditos_tributarios USING btree (fornecedor_id)` |
| idx_creditos_tributarios_nota_fiscal_id_fk | btree | nota_fiscal_id | não | sim |  | `CREATE INDEX idx_creditos_tributarios_nota_fiscal_id_fk ON public.creditos_tributarios USING btree (nota_fiscal_id)` |


## Policies (RLS)

### `Admin pode deletar creditos_tributarios`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Financeiro+ podem atualizar creditos_tributarios`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem inserir creditos_tributarios`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem ver creditos_tributarios`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

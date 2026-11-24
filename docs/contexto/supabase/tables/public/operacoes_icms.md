# public.operacoes_icms

> Dicionário estrutural de public.operacoes_icms (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; CHECK (finalidade IS NULL OR (finalidade = ANY (ARRAY['REVENDA'::text, 'USO_CONSUMO'::text, 'ATIVO_IMOBILIZADO'::text, 'INDUSTRIALIZACAO'::text]))); CHECK (ncm ~ '^[0-9]{8}$'::text); PRIMARY KEY (id); CHECK (tipo_operacao = ANY (ARRAY['INTERNA'::text, 'INTERESTADUAL'::text])); CHECK (valor_operacao >= 0::numeric). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.operacoes_icms. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.operacoes_icms. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `uf_origem` | `text` | não |  |  | Dicionário estrutural da coluna uf_origem em public.operacoes_icms. Papel funcional indicado pelo identificador: uf_origem; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `uf_destino` | `text` | não |  |  | Dicionário estrutural da coluna uf_destino em public.operacoes_icms. Papel funcional indicado pelo identificador: uf_destino; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `ncm` | `text` | sim |  |  | Dicionário estrutural da coluna ncm em public.operacoes_icms. Papel funcional indicado pelo identificador: ncm; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (ncm ~ '^[0-9]{8}$'::text). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `cfop` | `text` | sim |  |  | Dicionário estrutural da coluna cfop em public.operacoes_icms. Papel funcional indicado pelo identificador: cfop; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `cst` | `text` | sim |  |  | Dicionário estrutural da coluna cst em public.operacoes_icms. Papel funcional indicado pelo identificador: cst; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `base_calculo` | `numeric(14,2)` | sim |  |  | Dicionário estrutural da coluna base_calculo em public.operacoes_icms. Papel funcional indicado pelo identificador: base_calculo; o catálogo não especifica significado adicional. Tipo: numeric(14,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `aliquota` | `numeric(6,4)` | sim |  |  | Dicionário estrutural da coluna aliquota em public.operacoes_icms. Papel funcional indicado pelo identificador: aliquota; o catálogo não especifica significado adicional. Tipo: numeric(6,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `valor_icms` | `numeric(14,2)` | sim |  |  | Dicionário estrutural da coluna valor_icms em public.operacoes_icms. Papel funcional indicado pelo identificador: valor_icms; o catálogo não especifica significado adicional. Tipo: numeric(14,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `reducao_bc` | `numeric(5,2)` | sim |  |  | Dicionário estrutural da coluna reducao_bc em public.operacoes_icms. Papel funcional indicado pelo identificador: reducao_bc; o catálogo não especifica significado adicional. Tipo: numeric(5,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `periodo_referencia` | `date` | sim |  |  | Dicionário estrutural da coluna periodo_referencia em public.operacoes_icms. Papel funcional indicado pelo identificador: periodo_referencia; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.operacoes_icms. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `valor_operacao` | `numeric(15,2)` | não |  |  | Dicionário estrutural da coluna valor_operacao em public.operacoes_icms. Papel funcional indicado pelo identificador: valor_operacao; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (valor_operacao >= 0::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `tipo_destinatario` | `tipo_destinatario` | não |  |  | Dicionário estrutural da coluna tipo_destinatario em public.operacoes_icms. Papel funcional indicado pelo identificador: tipo_destinatario; o catálogo não especifica significado adicional. Tipo: tipo_destinatario. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: CONTRIBUINTE_REVENDA, CONTRIBUINTE_USO_CONSUMO, NAO_CONTRIBUINTE, EXTERIOR. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `finalidade` | `text` | sim |  |  | Dicionário estrutural da coluna finalidade em public.operacoes_icms. Papel funcional indicado pelo identificador: finalidade; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (finalidade IS NULL OR (finalidade = ANY (ARRAY['REVENDA'::text, 'USO_CONSUMO'::text, 'ATIVO_IMOBILIZADO'::text, 'INDUSTRIALIZACAO'::text]))). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `tipo_operacao` | `text` | não |  |  | Dicionário estrutural da coluna tipo_operacao em public.operacoes_icms. Papel funcional indicado pelo identificador: tipo_operacao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tipo_operacao = ANY (ARRAY['INTERNA'::text, 'INTERESTADUAL'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 18 | `tributos_aplicaveis` | `jsonb` | não | `'[]'::jsonb` |  | Dicionário estrutural da coluna tributos_aplicaveis em public.operacoes_icms. Papel funcional indicado pelo identificador: tributos_aplicaveis; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '[]'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 19 | `tributos_nao_aplicaveis` | `jsonb` | não | `'[]'::jsonb` |  | Dicionário estrutural da coluna tributos_nao_aplicaveis em public.operacoes_icms. Papel funcional indicado pelo identificador: tributos_nao_aplicaveis; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '[]'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 20 | `valor_total_icms` | `numeric(15,2)` | não | `0` |  | Dicionário estrutural da coluna valor_total_icms em public.operacoes_icms. Papel funcional indicado pelo identificador: valor_total_icms; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `icms_operacao_propria` | `numeric(15,2)` | não | `0` |  | Dicionário estrutural da coluna icms_operacao_propria em public.operacoes_icms. Papel funcional indicado pelo identificador: icms_operacao_propria; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 22 | `icms_st` | `numeric(15,2)` | não | `0` |  | Dicionário estrutural da coluna icms_st em public.operacoes_icms. Papel funcional indicado pelo identificador: icms_st; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 23 | `difal` | `numeric(15,2)` | não | `0` |  | Dicionário estrutural da coluna difal em public.operacoes_icms. Papel funcional indicado pelo identificador: difal; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 24 | `fcp` | `numeric(15,2)` | não | `0` |  | Dicionário estrutural da coluna fcp em public.operacoes_icms. Papel funcional indicado pelo identificador: fcp; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 25 | `data_operacao` | `date` | não | `CURRENT_DATE` |  | Dicionário estrutural da coluna data_operacao em public.operacoes_icms. Papel funcional indicado pelo identificador: data_operacao; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: CURRENT_DATE. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 26 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.operacoes_icms. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| operacoes_icms_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| operacoes_icms_finalidade_check | CHECK | `CHECK (finalidade IS NULL OR (finalidade = ANY (ARRAY['REVENDA'::text, 'USO_CONSUMO'::text, 'ATIVO_IMOBILIZADO'::text, 'INDUSTRIALIZACAO'::text])))` |  |  | sim |
| operacoes_icms_ncm_check | CHECK | `CHECK (ncm ~ '^[0-9]{8}$'::text)` |  |  | sim |
| operacoes_icms_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| operacoes_icms_tipo_operacao_check | CHECK | `CHECK (tipo_operacao = ANY (ARRAY['INTERNA'::text, 'INTERESTADUAL'::text]))` |  |  | sim |
| operacoes_icms_valor_operacao_check | CHECK | `CHECK (valor_operacao >= 0::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_operacoes_icms_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_operacoes_icms_empresa_id ON public.operacoes_icms USING btree (empresa_id)` |
| operacoes_icms_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX operacoes_icms_pkey ON public.operacoes_icms USING btree (id)` |


## Policies (RLS)

### `operacoes_icms_acesso`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK | `empresa_acessivel(empresa_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_operacoes_icms_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

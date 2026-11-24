# public.simulacao_tributos_detalhados

> Dicionário estrutural de public.simulacao_tributos_detalhados (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (aliquota >= 0::numeric AND aliquota <= 1::numeric); PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `periodo_referencia` | `date` | sim |  |  | Dicionário estrutural da coluna periodo_referencia em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: periodo_referencia; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `regime_tributario` | `text` | sim |  |  | Dicionário estrutural da coluna regime_tributario em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: regime_tributario; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `simples_nacional` | `numeric(14,2)` | sim |  |  | Dicionário estrutural da coluna simples_nacional em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: simples_nacional; o catálogo não especifica significado adicional. Tipo: numeric(14,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `lucro_presumido` | `numeric(14,2)` | sim |  |  | Dicionário estrutural da coluna lucro_presumido em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: lucro_presumido; o catálogo não especifica significado adicional. Tipo: numeric(14,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `lucro_real` | `numeric(14,2)` | sim |  |  | Dicionário estrutural da coluna lucro_real em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: lucro_real; o catálogo não especifica significado adicional. Tipo: numeric(14,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `mei` | `numeric(14,2)` | sim |  |  | Dicionário estrutural da coluna mei em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: mei; o catálogo não especifica significado adicional. Tipo: numeric(14,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `detalhes` | `jsonb` | sim |  |  | Dicionário estrutural da coluna detalhes em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: detalhes; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `simulacao_id` | `uuid` | não |  |  | Dicionário estrutural da coluna simulacao_id em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: simulacao_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `regime` | `regime_tributario_enum` | não |  |  | Dicionário estrutural da coluna regime em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: regime; o catálogo não especifica significado adicional. Tipo: regime_tributario_enum. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: MEI, SIMPLES, PRESUMIDO, REAL, ARBITRADO. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `tributo` | `text` | não |  |  | Dicionário estrutural da coluna tributo em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: tributo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `base_calculo` | `numeric(15,2)` | não |  |  | Dicionário estrutural da coluna base_calculo em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: base_calculo; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `aliquota` | `numeric(9,6)` | não |  |  | Dicionário estrutural da coluna aliquota em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: aliquota; o catálogo não especifica significado adicional. Tipo: numeric(9,6). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota >= 0::numeric AND aliquota <= 1::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `valor_apurado` | `numeric(15,2)` | não |  |  | Dicionário estrutural da coluna valor_apurado em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: valor_apurado; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `memoria_calculo` | `jsonb` | sim |  |  | Dicionário estrutural da coluna memoria_calculo em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: memoria_calculo; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 18 | `base_legal` | `text` | não |  |  | Dicionário estrutural da coluna base_legal em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: base_legal; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `adicional` | `numeric(15,2)` | não | `0` |  | Dicionário estrutural da coluna adicional em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: adicional; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 20 | `fcp` | `numeric(15,2)` | não | `0` |  | Dicionário estrutural da coluna fcp em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: fcp; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `retencoes` | `numeric(15,2)` | não | `0` |  | Dicionário estrutural da coluna retencoes em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: retencoes; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 22 | `creditos` | `numeric(15,2)` | não | `0` |  | Dicionário estrutural da coluna creditos em public.simulacao_tributos_detalhados. Papel funcional indicado pelo identificador: creditos; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| simulacao_tributos_detalhados_aliquota_check | CHECK | `CHECK (aliquota >= 0::numeric AND aliquota <= 1::numeric)` |  |  | sim |
| simulacao_tributos_detalhados_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_simulacao_tributos_detalhados_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_simulacao_tributos_detalhados_empresa_id ON public.simulacao_tributos_detalhados USING btree (empresa_id)` |
| simulacao_tributos_detalhados_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX simulacao_tributos_detalhados_pkey ON public.simulacao_tributos_detalhados USING btree (id)` |


## Policies (RLS)

### `sim_trib_acesso`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM simulacoes s   WHERE ((s.id = simulacao_tributos_detalhados.simulacao_id) AND empresa_acessivel(s.empresa_id))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM simulacoes s   WHERE ((s.id = simulacao_tributos_detalhados.simulacao_id) AND empresa_acessivel(s.empresa_id))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

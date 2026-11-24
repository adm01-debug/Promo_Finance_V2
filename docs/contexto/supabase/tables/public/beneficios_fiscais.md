# public.beneficios_fiscais

> Dicionário estrutural de public.beneficios_fiscais (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: UNIQUE (codigo); PRIMARY KEY (id); CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de); CHECK (percentual IS NULL OR percentual >= 0::numeric AND percentual <= 1::numeric); CHECK (tipo = ANY (ARRAY['CREDITO_PRESUMIDO'::text, 'CREDITO_OUTORGADO'::text, 'REDUCAO_BASE'::text, 'ISENCAO'::text, 'DIFERIMENTO'::text, 'ALIQUOTA_ZERO'::text, 'SUSPENSAO'::text, 'FINANCIAMENTO'::text, 'INCENTIVO_MUNICIPAL'::text, 'OUTRO'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.beneficios_fiscais. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `codigo` | `text` | não |  |  | Dicionário estrutural da coluna codigo em public.beneficios_fiscais. Papel funcional indicado pelo identificador: codigo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (codigo). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `nome` | `text` | não |  |  | Dicionário estrutural da coluna nome em public.beneficios_fiscais. Papel funcional indicado pelo identificador: nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `uf` | `uf_brasil` | sim |  |  | Dicionário estrutural da coluna uf em public.beneficios_fiscais. Papel funcional indicado pelo identificador: uf; o catálogo não especifica significado adicional. Tipo: uf_brasil. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `tipo` | `text` | não | `'CREDITO_PRESUMIDO'::text` |  | Dicionário estrutural da coluna tipo em public.beneficios_fiscais. Papel funcional indicado pelo identificador: tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'CREDITO_PRESUMIDO'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tipo = ANY (ARRAY['CREDITO_PRESUMIDO'::text, 'CREDITO_OUTORGADO'::text, 'REDUCAO_BASE'::text, 'ISENCAO'::text, 'DIFERIMENTO'::text, 'ALIQUOTA_ZERO'::text, 'SUSPENSAO'::text, 'FINANCIAMENTO'::text, 'INCENTIVO_MUNICIPAL'::text, 'OUTRO'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `descricao` | `text` | sim |  |  | Dicionário estrutural da coluna descricao em public.beneficios_fiscais. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `percentual` | `numeric` | sim |  |  | Dicionário estrutural da coluna percentual em public.beneficios_fiscais. Papel funcional indicado pelo identificador: percentual; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (percentual IS NULL OR percentual >= 0::numeric AND percentual <= 1::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 8 | `criterios` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna criterios em public.beneficios_fiscais. Papel funcional indicado pelo identificador: criterios; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 9 | `base_legal` | `text` | sim |  |  | Dicionário estrutural da coluna base_legal em public.beneficios_fiscais. Papel funcional indicado pelo identificador: base_legal; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `vigente_de` | `date` | não | `'2024-01-01'::date` |  | Dicionário estrutural da coluna vigente_de em public.beneficios_fiscais. Papel funcional indicado pelo identificador: vigente_de; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '2024-01-01'::date. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `vigente_ate` | `date` | sim |  |  | Dicionário estrutural da coluna vigente_ate em public.beneficios_fiscais. Papel funcional indicado pelo identificador: vigente_ate; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.beneficios_fiscais. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.beneficios_fiscais. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| beneficios_fiscais_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| beneficios_fiscais_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| beneficios_fiscais_vigencia_chk | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |
| beneficios_percentual_range_chk | CHECK | `CHECK (percentual IS NULL OR percentual >= 0::numeric AND percentual <= 1::numeric)` |  |  | sim |
| beneficios_tipo_chk | CHECK | `CHECK (tipo = ANY (ARRAY['CREDITO_PRESUMIDO'::text, 'CREDITO_OUTORGADO'::text, 'REDUCAO_BASE'::text, 'ISENCAO'::text, 'DIFERIMENTO'::text, 'ALIQUOTA_ZERO'::text, 'SUSPENSAO'::text, 'FINANCIAMENTO'::text, 'INCENTIVO_MUNICIPAL'::text, 'OUTRO'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| beneficios_fiscais_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX beneficios_fiscais_codigo_key ON public.beneficios_fiscais USING btree (codigo)` |
| beneficios_fiscais_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX beneficios_fiscais_pkey ON public.beneficios_fiscais USING btree (id)` |


## Policies (RLS)

### `beneficios_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `beneficios_write_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_beneficios_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

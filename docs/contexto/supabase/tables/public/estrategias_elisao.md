# public.estrategias_elisao

> Dicionário estrutural de public.estrategias_elisao (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (economia_estimada_percentual IS NULL OR economia_estimada_percentual >= 0::numeric AND economia_estimada_percentual <= 1::numeric); UNIQUE (codigo); PRIMARY KEY (id); CHECK (regimes_aplicaveis <@ ARRAY['MEI'::text, 'SIMPLES'::text, 'PRESUMIDO'::text, 'REAL'::text, 'ARBITRADO'::text]). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.estrategias_elisao. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `codigo` | `text` | não |  |  | Dicionário estrutural da coluna codigo em public.estrategias_elisao. Papel funcional indicado pelo identificador: codigo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (codigo). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `nome` | `text` | não |  |  | Dicionário estrutural da coluna nome em public.estrategias_elisao. Papel funcional indicado pelo identificador: nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `categoria` | `text` | sim |  |  | Dicionário estrutural da coluna categoria em public.estrategias_elisao. Papel funcional indicado pelo identificador: categoria; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `descricao` | `text` | sim |  |  | Dicionário estrutural da coluna descricao em public.estrategias_elisao. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `regimes_aplicaveis` | `text[]` | não | `'{}'::text[]` |  | Dicionário estrutural da coluna regimes_aplicaveis em public.estrategias_elisao. Papel funcional indicado pelo identificador: regimes_aplicaveis; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::text[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (regimes_aplicaveis <@ ARRAY['MEI'::text, 'SIMPLES'::text, 'PRESUMIDO'::text, 'REAL'::text, 'ARBITRADO'::text]). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 7 | `economia_estimada_percentual` | `numeric(6,4)` | sim |  |  | Dicionário estrutural da coluna economia_estimada_percentual em public.estrategias_elisao. Papel funcional indicado pelo identificador: economia_estimada_percentual; o catálogo não especifica significado adicional. Tipo: numeric(6,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (economia_estimada_percentual IS NULL OR economia_estimada_percentual >= 0::numeric AND economia_estimada_percentual <= 1::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `risco` | `nivel_risco` | não | `'MEDIO'::nivel_risco` |  | Dicionário estrutural da coluna risco em public.estrategias_elisao. Papel funcional indicado pelo identificador: risco; o catálogo não especifica significado adicional. Tipo: nivel_risco. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'MEDIO'::nivel_risco. Valores de enum: BAIXO, MEDIO, ALTO. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `base_legal` | `text` | sim |  |  | Dicionário estrutural da coluna base_legal em public.estrategias_elisao. Papel funcional indicado pelo identificador: base_legal; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `requisitos` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna requisitos em public.estrategias_elisao. Papel funcional indicado pelo identificador: requisitos; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 11 | `ativo` | `boolean` | não | `true` |  | Dicionário estrutural da coluna ativo em public.estrategias_elisao. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.estrategias_elisao. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.estrategias_elisao. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| estrategias_economia_range_chk | CHECK | `CHECK (economia_estimada_percentual IS NULL OR economia_estimada_percentual >= 0::numeric AND economia_estimada_percentual <= 1::numeric)` |  |  | sim |
| estrategias_elisao_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| estrategias_elisao_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| estrategias_regimes_chk | CHECK | `CHECK (regimes_aplicaveis <@ ARRAY['MEI'::text, 'SIMPLES'::text, 'PRESUMIDO'::text, 'REAL'::text, 'ARBITRADO'::text])` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| estrategias_elisao_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX estrategias_elisao_codigo_key ON public.estrategias_elisao USING btree (codigo)` |
| estrategias_elisao_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX estrategias_elisao_pkey ON public.estrategias_elisao USING btree (id)` |


## Policies (RLS)

### `estrategias_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `estrategias_write_admin`

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
| trg_estrategias_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

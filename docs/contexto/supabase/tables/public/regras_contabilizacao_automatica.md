# public.regras_contabilizacao_automatica

> Dicionário estrutural de public.regras_contabilizacao_automatica (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (conta_debito_id <> conta_credito_id); UNIQUE (empresa_id, nome); CHECK (char_length(btrim(nome)) >= 2 AND char_length(btrim(nome)) <= 160); PRIMARY KEY (id); CHECK (prioridade >= 0); CHECK (tipo_evento = ANY (ARRAY['conta_pagar'::text, 'conta_receber'::text, 'movimentacao'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (empresa_id, nome). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `nome` | `text` | não |  |  | Dicionário estrutural da coluna nome em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (empresa_id, nome); CHECK (char_length(btrim(nome)) >= 2 AND char_length(btrim(nome)) <= 160). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `condicoes` | `jsonb` | não |  |  | Dicionário estrutural da coluna condicoes em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: condicoes; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 5 | `acoes` | `jsonb` | não |  |  | Dicionário estrutural da coluna acoes em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: acoes; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 6 | `ativo` | `boolean` | não | `true` |  | Dicionário estrutural da coluna ativo em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `prioridade` | `integer` | sim | `0` |  | Dicionário estrutural da coluna prioridade em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: prioridade; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (prioridade >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 8 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `tipo_evento` | `text` | não |  |  | Dicionário estrutural da coluna tipo_evento em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: tipo_evento; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tipo_evento = ANY (ARRAY['conta_pagar'::text, 'conta_receber'::text, 'movimentacao'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `categoria_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna categoria_id em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: categoria_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `conta_debito_id` | `uuid` | não |  |  | Dicionário estrutural da coluna conta_debito_id em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: conta_debito_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (conta_debito_id <> conta_credito_id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `conta_credito_id` | `uuid` | não |  |  | Dicionário estrutural da coluna conta_credito_id em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: conta_credito_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (conta_debito_id <> conta_credito_id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `historico_template` | `text` | não | `''::text` |  | Dicionário estrutural da coluna historico_template em public.regras_contabilizacao_automatica. Papel funcional indicado pelo identificador: historico_template; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: ''::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| regra_contas_distintas | CHECK | `CHECK (conta_debito_id <> conta_credito_id)` |  |  | sim |
| regra_nome_unico_empresa | UNIQUE | `UNIQUE (empresa_id, nome)` |  |  | sim |
| regras_contabilizacao_automatica_nome_check | CHECK | `CHECK (char_length(btrim(nome)) >= 2 AND char_length(btrim(nome)) <= 160)` |  |  | sim |
| regras_contabilizacao_automatica_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| regras_contabilizacao_automatica_prioridade_check | CHECK | `CHECK (prioridade >= 0)` |  |  | sim |
| regras_contabilizacao_automatica_tipo_evento_check | CHECK | `CHECK (tipo_evento = ANY (ARRAY['conta_pagar'::text, 'conta_receber'::text, 'movimentacao'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.eventos_contabilizacao_log | eventos_contabilizacao_log_regra_id_fkey | regra_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| regra_nome_unico_empresa | btree | empresa_id, nome | sim | sim |  | `CREATE UNIQUE INDEX regra_nome_unico_empresa ON public.regras_contabilizacao_automatica USING btree (empresa_id, nome)` |
| regras_contabilizacao_automatica_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX regras_contabilizacao_automatica_pkey ON public.regras_contabilizacao_automatica USING btree (id)` |


## Policies (RLS)

### `regras_contab_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |

### `regras_contab_write`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_acessivel(empresa_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'contador'::app_role)))` |
| WITH CHECK | `(empresa_acessivel(empresa_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'contador'::app_role)))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_regras_contab_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.elisao_creditos_auditoria

> Dicionário estrutural de public.elisao_creditos_auditoria (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais_ocr(id) ON DELETE SET NULL; PRIMARY KEY (id); FOREIGN KEY (regra_id) REFERENCES elisao_regras_creditos(id) ON DELETE SET NULL; CHECK (score_confianca IS NULL OR score_confianca >= 0 AND score_confianca <= 100); CHECK (status_aprovacao = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text, 'em_revisao'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `nota_fiscal_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna nota_fiscal_id em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: nota_fiscal_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais_ocr(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `regra_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna regra_id em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: regra_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (regra_id) REFERENCES elisao_regras_creditos(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `ncm` | `text` | sim |  |  | Dicionário estrutural da coluna ncm em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: ncm; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `valor_credito` | `numeric` | não | `0` |  | Dicionário estrutural da coluna valor_credito em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: valor_credito; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 7 | `status_aprovacao` | `text` | não | `'pendente'::text` |  | Dicionário estrutural da coluna status_aprovacao em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: status_aprovacao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'pendente'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status_aprovacao = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text, 'em_revisao'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `nota_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna nota_id em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: nota_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `cst_csosn` | `text` | sim |  |  | Dicionário estrutural da coluna cst_csosn em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: cst_csosn; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `valor_base` | `numeric(15,2)` | não | `0` |  | Dicionário estrutural da coluna valor_base em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: valor_base; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `valor_credito_calculado` | `numeric(15,2)` | não | `0` |  | Dicionário estrutural da coluna valor_credito_calculado em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: valor_credito_calculado; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `metodologia_aplicada` | `text` | sim |  |  | Dicionário estrutural da coluna metodologia_aplicada em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: metodologia_aplicada; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `score_confianca` | `integer` | sim |  |  | Dicionário estrutural da coluna score_confianca em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: score_confianca; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (score_confianca IS NULL OR score_confianca >= 0 AND score_confianca <= 100). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 17 | `divergencias_detectadas` | `jsonb` | não | `'[]'::jsonb` |  | Dicionário estrutural da coluna divergencias_detectadas em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: divergencias_detectadas; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '[]'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 18 | `historico_decisoes` | `jsonb` | não | `'[]'::jsonb` |  | Dicionário estrutural da coluna historico_decisoes em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: historico_decisoes; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '[]'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 19 | `motivo_rejeicao` | `text` | sim |  |  | Dicionário estrutural da coluna motivo_rejeicao em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: motivo_rejeicao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 20 | `aprovador_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna aprovador_id em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: aprovador_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `data_aprovacao` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna data_aprovacao em public.elisao_creditos_auditoria. Papel funcional indicado pelo identificador: data_aprovacao; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| elisao_creditos_auditoria_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| elisao_creditos_auditoria_nota_fiscal_id_fkey | FOREIGN KEY | `FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais_ocr(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| elisao_creditos_auditoria_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| elisao_creditos_auditoria_regra_id_fkey | FOREIGN KEY | `FOREIGN KEY (regra_id) REFERENCES elisao_regras_creditos(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| elisao_creditos_auditoria_score_confianca_check | CHECK | `CHECK (score_confianca IS NULL OR score_confianca >= 0 AND score_confianca <= 100)` |  |  | sim |
| elisao_creditos_auditoria_status_aprovacao_check | CHECK | `CHECK (status_aprovacao = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text, 'em_revisao'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| elisao_creditos_auditoria_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX elisao_creditos_auditoria_pkey ON public.elisao_creditos_auditoria USING btree (id)` |
| idx_elisao_creditos_auditoria_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_elisao_creditos_auditoria_empresa_id ON public.elisao_creditos_auditoria USING btree (empresa_id)` |
| idx_elisao_creditos_auditoria_nota_fiscal_id_fk | btree | nota_fiscal_id | não | sim |  | `CREATE INDEX idx_elisao_creditos_auditoria_nota_fiscal_id_fk ON public.elisao_creditos_auditoria USING btree (nota_fiscal_id)` |
| idx_elisao_creditos_auditoria_regra_id_fk | btree | regra_id | não | sim |  | `CREATE INDEX idx_elisao_creditos_auditoria_regra_id_fk ON public.elisao_creditos_auditoria USING btree (regra_id)` |


## Policies (RLS)

### `creditos_auditoria_delete_admin`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `creditos_auditoria_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `empresa_acessivel(empresa_id)` |

### `creditos_auditoria_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_cred_aud_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

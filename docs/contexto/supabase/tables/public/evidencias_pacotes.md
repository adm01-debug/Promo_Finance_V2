# public.evidencias_pacotes

> Dicionário estrutural de public.evidencias_pacotes (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id); FOREIGN KEY (verificacao_id) REFERENCES verificacoes_conformidade(id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.evidencias_pacotes. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `verificacao_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna verificacao_id em public.evidencias_pacotes. Papel funcional indicado pelo identificador: verificacao_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (verificacao_id) REFERENCES verificacoes_conformidade(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `url` | `text` | sim |  |  | Dicionário estrutural da coluna url em public.evidencias_pacotes. Papel funcional indicado pelo identificador: url; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.evidencias_pacotes. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 5 | `gerado_por_email` | `text` | sim |  |  | Dicionário estrutural da coluna gerado_por_email em public.evidencias_pacotes. Papel funcional indicado pelo identificador: gerado_por_email; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `periodo_inicio` | `date` | sim |  |  | Dicionário estrutural da coluna periodo_inicio em public.evidencias_pacotes. Papel funcional indicado pelo identificador: periodo_inicio; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `periodo_fim` | `date` | sim |  |  | Dicionário estrutural da coluna periodo_fim em public.evidencias_pacotes. Papel funcional indicado pelo identificador: periodo_fim; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `escopos` | `text[]` | não | `'{}'::text[]` |  | Dicionário estrutural da coluna escopos em public.evidencias_pacotes. Papel funcional indicado pelo identificador: escopos; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::text[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 9 | `storage_path` | `text` | sim |  |  | Dicionário estrutural da coluna storage_path em public.evidencias_pacotes. Papel funcional indicado pelo identificador: storage_path; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `tamanho_bytes` | `bigint` | sim |  |  | Dicionário estrutural da coluna tamanho_bytes em public.evidencias_pacotes. Papel funcional indicado pelo identificador: tamanho_bytes; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 11 | `manifest` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna manifest em public.evidencias_pacotes. Papel funcional indicado pelo identificador: manifest; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| evidencias_pacotes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| evidencias_pacotes_verificacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (verificacao_id) REFERENCES verificacoes_conformidade(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| evidencias_pacotes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX evidencias_pacotes_pkey ON public.evidencias_pacotes USING btree (id)` |
| idx_evidencias_pacotes_verificacao_id_fk | btree | verificacao_id | não | sim |  | `CREATE INDEX idx_evidencias_pacotes_verificacao_id_fk ON public.evidencias_pacotes USING btree (verificacao_id)` |


## Policies (RLS)

### `Evidencias scoped by verificacao`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM verificacoes_conformidade vc   WHERE ((vc.id = evidencias_pacotes.verificacao_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (vc.empresa_id IN ( SELECT ue.empresa_id            FROM user_empresas ue           WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM verificacoes_conformidade vc   WHERE ((vc.id = evidencias_pacotes.verificacao_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (vc.empresa_id IN ( SELECT ue.empresa_id            FROM user_empresas ue           WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

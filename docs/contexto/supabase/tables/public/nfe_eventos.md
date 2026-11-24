# public.nfe_eventos

> Dicionário estrutural de public.nfe_eventos (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (created_by) REFERENCES auth.users(id); PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.nfe_eventos. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `chave_acesso` | `text` | não |  |  | Dicionário estrutural da coluna chave_acesso em public.nfe_eventos. Papel funcional indicado pelo identificador: chave_acesso; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `tipo_evento` | `text` | não |  |  | Dicionário estrutural da coluna tipo_evento em public.nfe_eventos. Papel funcional indicado pelo identificador: tipo_evento; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `codigo_evento` | `text` | sim |  |  | Dicionário estrutural da coluna codigo_evento em public.nfe_eventos. Papel funcional indicado pelo identificador: codigo_evento; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `sequencial` | `integer` | não | `1` |  | Dicionário estrutural da coluna sequencial em public.nfe_eventos. Papel funcional indicado pelo identificador: sequencial; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 1. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `data_evento` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna data_evento em public.nfe_eventos. Papel funcional indicado pelo identificador: data_evento; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `protocolo` | `text` | sim |  |  | Dicionário estrutural da coluna protocolo em public.nfe_eventos. Papel funcional indicado pelo identificador: protocolo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `justificativa` | `text` | sim |  |  | Dicionário estrutural da coluna justificativa em public.nfe_eventos. Papel funcional indicado pelo identificador: justificativa; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `status_retorno` | `text` | sim |  |  | Dicionário estrutural da coluna status_retorno em public.nfe_eventos. Papel funcional indicado pelo identificador: status_retorno; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `motivo_retorno` | `text` | sim |  |  | Dicionário estrutural da coluna motivo_retorno em public.nfe_eventos. Papel funcional indicado pelo identificador: motivo_retorno; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `xml_path` | `text` | sim |  |  | Dicionário estrutural da coluna xml_path em public.nfe_eventos. Papel funcional indicado pelo identificador: xml_path; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `raw_payload` | `jsonb` | sim |  |  | Dicionário estrutural da coluna raw_payload em public.nfe_eventos. Papel funcional indicado pelo identificador: raw_payload; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 13 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.nfe_eventos. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (created_by) REFERENCES auth.users(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.nfe_eventos. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| nfe_eventos_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| nfe_eventos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_nfe_eventos_created_by | btree | created_by | não | sim | `(created_by IS NOT NULL)` | `CREATE INDEX idx_nfe_eventos_created_by ON public.nfe_eventos USING btree (created_by) WHERE (created_by IS NOT NULL)` |
| idx_nfe_eventos_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_nfe_eventos_created_by_fk ON public.nfe_eventos USING btree (created_by)` |
| nfe_eventos_chave_tipo_seq_uk | btree | chave_acesso, tipo_evento, sequencial | sim | sim |  | `CREATE UNIQUE INDEX nfe_eventos_chave_tipo_seq_uk ON public.nfe_eventos USING btree (chave_acesso, tipo_evento, sequencial)` |
| nfe_eventos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX nfe_eventos_pkey ON public.nfe_eventos USING btree (id)` |


## Policies (RLS)

### `nfe_ev_read_via_nfe`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (EXISTS ( SELECT 1    FROM (nfe_recebidas r      JOIN user_empresas ue ON ((ue.empresa_id = r.empresa_id)))   WHERE ((r.chave_acesso = nfe_eventos.chave_acesso) AND (ue.user_id = ( SELECT auth.uid() AS uid))))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.auditoria_tributaria

> Dicionário estrutural de public.auditoria_tributaria (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (acao = ANY (ARRAY['insert'::text, 'update'::text, 'delete'::text])); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL; CHECK (char_length(entidade_tipo) >= 1 AND char_length(entidade_tipo) <= 120); PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| usada por views | public.vw_auditoria_tributaria_recente |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.auditoria_tributaria. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.auditoria_tributaria. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `periodo_referencia` | `date` | sim |  |  | Dicionário estrutural da coluna periodo_referencia em public.auditoria_tributaria. Papel funcional indicado pelo identificador: periodo_referencia; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `tipo_auditoria` | `text` | sim |  |  | Dicionário estrutural da coluna tipo_auditoria em public.auditoria_tributaria. Papel funcional indicado pelo identificador: tipo_auditoria; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `resultado` | `jsonb` | sim |  |  | Dicionário estrutural da coluna resultado em public.auditoria_tributaria. Papel funcional indicado pelo identificador: resultado; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 6 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.auditoria_tributaria. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.auditoria_tributaria. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.auditoria_tributaria. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.auditoria_tributaria. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `user_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna user_id em public.auditoria_tributaria. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `user_email` | `text` | sim |  |  | Dicionário estrutural da coluna user_email em public.auditoria_tributaria. Papel funcional indicado pelo identificador: user_email; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `acao` | `text` | não |  |  | Dicionário estrutural da coluna acao em public.auditoria_tributaria. Papel funcional indicado pelo identificador: acao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (acao = ANY (ARRAY['insert'::text, 'update'::text, 'delete'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `entidade_tipo` | `text` | não |  |  | Dicionário estrutural da coluna entidade_tipo em public.auditoria_tributaria. Papel funcional indicado pelo identificador: entidade_tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (char_length(entidade_tipo) >= 1 AND char_length(entidade_tipo) <= 120). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `entidade_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna entidade_id em public.auditoria_tributaria. Papel funcional indicado pelo identificador: entidade_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `payload_anterior` | `jsonb` | sim |  |  | Dicionário estrutural da coluna payload_anterior em public.auditoria_tributaria. Papel funcional indicado pelo identificador: payload_anterior; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 16 | `payload_novo` | `jsonb` | sim |  |  | Dicionário estrutural da coluna payload_novo em public.auditoria_tributaria. Papel funcional indicado pelo identificador: payload_novo; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 17 | `criado_em` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna criado_em em public.auditoria_tributaria. Papel funcional indicado pelo identificador: criado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| auditoria_tributaria_acao_check | CHECK | `CHECK (acao = ANY (ARRAY['insert'::text, 'update'::text, 'delete'::text]))` |  |  | sim |
| auditoria_tributaria_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| auditoria_tributaria_entidade_tipo_check | CHECK | `CHECK (char_length(entidade_tipo) >= 1 AND char_length(entidade_tipo) <= 120)` |  |  | sim |
| auditoria_tributaria_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| auditoria_tributaria_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX auditoria_tributaria_pkey ON public.auditoria_tributaria USING btree (id)` |
| idx_auditoria_trib_criado | btree | criado_em | não | sim |  | `CREATE INDEX idx_auditoria_trib_criado ON public.auditoria_tributaria USING btree (criado_em DESC)` |
| idx_auditoria_tributaria_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_auditoria_tributaria_empresa_id ON public.auditoria_tributaria USING btree (empresa_id)` |


## Policies (RLS)

### `auditoria_trib_select_tenant`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

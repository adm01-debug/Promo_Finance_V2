# public.execucoes_regua_cobranca

> Dicionário estrutural de public.execucoes_regua_cobranca (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (status = 'sucesso'::text OR mensagem_erro IS NOT NULL); CHECK ((status = ANY (ARRAY['sucesso'::text, 'processando'::text])) OR mensagem_erro IS NOT NULL); CHECK (canal IS NULL OR (lower(canal) = ANY (ARRAY['email'::text, 'whatsapp'::text, 'sms'::text, 'telefone'::text]))); FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id) ON DELETE CASCADE; FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; CHECK (char_length(btrim(etapa)) >= 1 AND char_length(btrim(etapa)) <= 120); PRIMARY KEY (id); CHECK (status = ANY (ARRAY['sucesso'::text, 'falha'::text, 'erro'::text, 'ignorado'::text, 'processando'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.execucoes_regua_cobranca. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.execucoes_regua_cobranca. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `conta_receber_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_receber_id em public.execucoes_regua_cobranca. Papel funcional indicado pelo identificador: conta_receber_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `etapa` | `text` | não |  |  | Dicionário estrutural da coluna etapa em public.execucoes_regua_cobranca. Papel funcional indicado pelo identificador: etapa; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (char_length(btrim(etapa)) >= 1 AND char_length(btrim(etapa)) <= 120). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `canal` | `text` | sim |  |  | Dicionário estrutural da coluna canal em public.execucoes_regua_cobranca. Papel funcional indicado pelo identificador: canal; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (canal IS NULL OR (lower(canal) = ANY (ARRAY['email'::text, 'whatsapp'::text, 'sms'::text, 'telefone'::text]))). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `status` | `text` | não |  |  | Dicionário estrutural da coluna status em public.execucoes_regua_cobranca. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = 'sucesso'::text OR mensagem_erro IS NOT NULL); CHECK ((status = ANY (ARRAY['sucesso'::text, 'processando'::text])) OR mensagem_erro IS NOT NULL); CHECK (status = ANY (ARRAY['sucesso'::text, 'falha'::text, 'erro'::text, 'ignorado'::text, 'processando'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `mensagem_erro` | `text` | sim |  |  | Dicionário estrutural da coluna mensagem_erro em public.execucoes_regua_cobranca. Papel funcional indicado pelo identificador: mensagem_erro; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = 'sucesso'::text OR mensagem_erro IS NOT NULL); CHECK ((status = ANY (ARRAY['sucesso'::text, 'processando'::text])) OR mensagem_erro IS NOT NULL). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `metadata` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna metadata em public.execucoes_regua_cobranca. Papel funcional indicado pelo identificador: metadata; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.execucoes_regua_cobranca. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| execucao_falha_tem_motivo | CHECK | `CHECK (status = 'sucesso'::text OR mensagem_erro IS NOT NULL)` |  |  | sim |
| execucao_regua_status_motivo | CHECK | `CHECK ((status = ANY (ARRAY['sucesso'::text, 'processando'::text])) OR mensagem_erro IS NOT NULL)` |  |  | sim |
| execucoes_regua_cobranca_canal_check | CHECK | `CHECK (canal IS NULL OR (lower(canal) = ANY (ARRAY['email'::text, 'whatsapp'::text, 'sms'::text, 'telefone'::text])))` |  |  | sim |
| execucoes_regua_cobranca_conta_receber_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| execucoes_regua_cobranca_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| execucoes_regua_cobranca_etapa_check | CHECK | `CHECK (char_length(btrim(etapa)) >= 1 AND char_length(btrim(etapa)) <= 120)` |  |  | sim |
| execucoes_regua_cobranca_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| execucoes_regua_cobranca_status_check | CHECK | `CHECK (status = ANY (ARRAY['sucesso'::text, 'falha'::text, 'erro'::text, 'ignorado'::text, 'processando'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| execucoes_regua_cobranca_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX execucoes_regua_cobranca_pkey ON public.execucoes_regua_cobranca USING btree (id)` |
| idx_execucoes_regua_empresa | btree | empresa_id, created_at | não | sim |  | `CREATE INDEX idx_execucoes_regua_empresa ON public.execucoes_regua_cobranca USING btree (empresa_id, created_at DESC)` |
| uq_execucoes_regua_dia | btree | conta_receber_id, etapa | sim | sim | `((conta_receber_id IS NOT NULL) AND (canal IS NOT NULL))` | `CREATE UNIQUE INDEX uq_execucoes_regua_dia ON public.execucoes_regua_cobranca USING btree (conta_receber_id, etapa, lower(canal), (((created_at AT TIME ZONE 'UTC'::text))::date)) WHERE ((conta_receber_id IS NOT NULL) AND (canal IS NOT NULL))` |


## Policies (RLS)

### `execucoes_regua_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

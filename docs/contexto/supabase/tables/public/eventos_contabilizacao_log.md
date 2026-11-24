# public.eventos_contabilizacao_log

> Dicionário estrutural de public.eventos_contabilizacao_log (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id); FOREIGN KEY (regra_id) REFERENCES regras_contabilizacao_automatica(id) ON DELETE SET NULL; CHECK (status = ANY (ARRAY['sucesso'::text, 'sem_regra'::text, 'erro'::text, 'duplicado'::text, 'simulado'::text])); CHECK (tipo_evento = ANY (ARRAY['conta_pagar'::text, 'conta_receber'::text, 'movimentacao'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.eventos_contabilizacao_log. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.eventos_contabilizacao_log. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `lancamento_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna lancamento_id em public.eventos_contabilizacao_log. Papel funcional indicado pelo identificador: lancamento_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `regra_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna regra_id em public.eventos_contabilizacao_log. Papel funcional indicado pelo identificador: regra_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (regra_id) REFERENCES regras_contabilizacao_automatica(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `evento` | `text` | não |  |  | Dicionário estrutural da coluna evento em public.eventos_contabilizacao_log. Papel funcional indicado pelo identificador: evento; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `status` | `text` | não | `'processado'::text` |  | Dicionário estrutural da coluna status em public.eventos_contabilizacao_log. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'processado'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = ANY (ARRAY['sucesso'::text, 'sem_regra'::text, 'erro'::text, 'duplicado'::text, 'simulado'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `error_message` | `text` | sim |  |  | Dicionário estrutural da coluna error_message em public.eventos_contabilizacao_log. Papel funcional indicado pelo identificador: error_message; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `detalhes` | `jsonb` | sim |  |  | Dicionário estrutural da coluna detalhes em public.eventos_contabilizacao_log. Papel funcional indicado pelo identificador: detalhes; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.eventos_contabilizacao_log. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `tipo_evento` | `text` | não |  |  | Dicionário estrutural da coluna tipo_evento em public.eventos_contabilizacao_log. Papel funcional indicado pelo identificador: tipo_evento; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tipo_evento = ANY (ARRAY['conta_pagar'::text, 'conta_receber'::text, 'movimentacao'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `evento_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna evento_id em public.eventos_contabilizacao_log. Papel funcional indicado pelo identificador: evento_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `detalhe` | `text` | sim |  |  | Dicionário estrutural da coluna detalhe em public.eventos_contabilizacao_log. Papel funcional indicado pelo identificador: detalhe; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| eventos_contabilizacao_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| eventos_contabilizacao_log_regra_id_fkey | FOREIGN KEY | `FOREIGN KEY (regra_id) REFERENCES regras_contabilizacao_automatica(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| eventos_contabilizacao_log_status_check | CHECK | `CHECK (status = ANY (ARRAY['sucesso'::text, 'sem_regra'::text, 'erro'::text, 'duplicado'::text, 'simulado'::text]))` |  |  | sim |
| eventos_contabilizacao_log_tipo_evento_check | CHECK | `CHECK (tipo_evento = ANY (ARRAY['conta_pagar'::text, 'conta_receber'::text, 'movimentacao'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| eventos_contabilizacao_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX eventos_contabilizacao_log_pkey ON public.eventos_contabilizacao_log USING btree (id)` |
| idx_eventos_contabilizacao_log_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_eventos_contabilizacao_log_empresa_id ON public.eventos_contabilizacao_log USING btree (empresa_id)` |
| idx_eventos_contabilizacao_log_regra_id_fk | btree | regra_id | não | sim |  | `CREATE INDEX idx_eventos_contabilizacao_log_regra_id_fk ON public.eventos_contabilizacao_log USING btree (regra_id)` |
| uq_eventos_contab_sucesso | btree | tipo_evento, evento_id | sim | sim | `(status = 'sucesso'::text)` | `CREATE UNIQUE INDEX uq_eventos_contab_sucesso ON public.eventos_contabilizacao_log USING btree (tipo_evento, evento_id) WHERE (status = 'sucesso'::text)` |


## Policies (RLS)

### `eventos_contab_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `eventos_contab_select`

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

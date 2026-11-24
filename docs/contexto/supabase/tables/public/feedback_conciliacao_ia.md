# public.feedback_conciliacao_ia

> Dicionário estrutural de public.feedback_conciliacao_ia (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (created_by) REFERENCES auth.users(id); PRIMARY KEY (id); FOREIGN KEY (transacao_id) REFERENCES transacoes_bancarias(id); FOREIGN KEY (user_id) REFERENCES auth.users(id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.feedback_conciliacao_ia. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `transacao_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna transacao_id em public.feedback_conciliacao_ia. Papel funcional indicado pelo identificador: transacao_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (transacao_id) REFERENCES transacoes_bancarias(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `user_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna user_id em public.feedback_conciliacao_ia. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (user_id) REFERENCES auth.users(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `acao` | `text` | não |  |  | Dicionário estrutural da coluna acao em public.feedback_conciliacao_ia. Papel funcional indicado pelo identificador: acao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `feedback_texto` | `text` | sim |  |  | Dicionário estrutural da coluna feedback_texto em public.feedback_conciliacao_ia. Papel funcional indicado pelo identificador: feedback_texto; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.feedback_conciliacao_ia. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `transacao_bancaria_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna transacao_bancaria_id em public.feedback_conciliacao_ia. Papel funcional indicado pelo identificador: transacao_bancaria_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `score_original` | `numeric` | sim | `0` |  | Dicionário estrutural da coluna score_original em public.feedback_conciliacao_ia. Papel funcional indicado pelo identificador: score_original; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `motivo_rejeicao` | `text` | sim |  |  | Dicionário estrutural da coluna motivo_rejeicao em public.feedback_conciliacao_ia. Papel funcional indicado pelo identificador: motivo_rejeicao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `transacao_descricao` | `text` | sim |  |  | Dicionário estrutural da coluna transacao_descricao em public.feedback_conciliacao_ia. Papel funcional indicado pelo identificador: transacao_descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `lancamento_entidade` | `text` | sim |  |  | Dicionário estrutural da coluna lancamento_entidade em public.feedback_conciliacao_ia. Papel funcional indicado pelo identificador: lancamento_entidade; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `lancamento_descricao` | `text` | sim |  |  | Dicionário estrutural da coluna lancamento_descricao em public.feedback_conciliacao_ia. Papel funcional indicado pelo identificador: lancamento_descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `tipo_lancamento` | `text` | sim |  |  | Dicionário estrutural da coluna tipo_lancamento em public.feedback_conciliacao_ia. Papel funcional indicado pelo identificador: tipo_lancamento; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.feedback_conciliacao_ia. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (created_by) REFERENCES auth.users(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| feedback_conciliacao_ia_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| feedback_conciliacao_ia_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| feedback_conciliacao_ia_transacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (transacao_id) REFERENCES transacoes_bancarias(id)` | NO ACTION | NO ACTION | sim |
| feedback_conciliacao_ia_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| feedback_conciliacao_ia_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX feedback_conciliacao_ia_pkey ON public.feedback_conciliacao_ia USING btree (id)` |
| idx_feedback_conciliacao_ia_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_feedback_conciliacao_ia_created_by_fk ON public.feedback_conciliacao_ia USING btree (created_by)` |
| idx_feedback_conciliacao_ia_transacao_id_fk | btree | transacao_id | não | sim |  | `CREATE INDEX idx_feedback_conciliacao_ia_transacao_id_fk ON public.feedback_conciliacao_ia USING btree (transacao_id)` |
| idx_feedback_conciliacao_ia_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_feedback_conciliacao_ia_user_id_fk ON public.feedback_conciliacao_ia USING btree (user_id)` |


## Policies (RLS)

### `User-based access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |

### `Users can manage feedback`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

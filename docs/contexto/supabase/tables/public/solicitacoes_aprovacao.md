# public.solicitacoes_aprovacao

> Dicionário estrutural de public.solicitacoes_aprovacao (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (aprovado_por) REFERENCES auth.users(id); FOREIGN KEY (conta_pagar_id) REFERENCES contas_pagar(id); PRIMARY KEY (id); FOREIGN KEY (solicitado_por) REFERENCES auth.users(id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.solicitacoes_aprovacao. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | não | `auth.uid()` |  | Dicionário estrutural da coluna user_id em public.solicitacoes_aprovacao. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: auth.uid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `entidade_tipo` | `text` | sim | `'conta_pagar'::text` |  | Dicionário estrutural da coluna entidade_tipo em public.solicitacoes_aprovacao. Papel funcional indicado pelo identificador: entidade_tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'conta_pagar'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `entidade_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna entidade_id em public.solicitacoes_aprovacao. Papel funcional indicado pelo identificador: entidade_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `status` | `text` | não | `'pendente'::text` |  | Dicionário estrutural da coluna status em public.solicitacoes_aprovacao. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'pendente'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `motivo_rejeicao` | `text` | sim |  |  | Dicionário estrutural da coluna motivo_rejeicao em public.solicitacoes_aprovacao. Papel funcional indicado pelo identificador: motivo_rejeicao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.solicitacoes_aprovacao. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `aprovado_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna aprovado_por em public.solicitacoes_aprovacao. Papel funcional indicado pelo identificador: aprovado_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (aprovado_por) REFERENCES auth.users(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `conta_pagar_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_pagar_id em public.solicitacoes_aprovacao. Papel funcional indicado pelo identificador: conta_pagar_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (conta_pagar_id) REFERENCES contas_pagar(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `solicitado_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna solicitado_por em public.solicitacoes_aprovacao. Papel funcional indicado pelo identificador: solicitado_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (solicitado_por) REFERENCES auth.users(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.solicitacoes_aprovacao. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `aprovado_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna aprovado_em em public.solicitacoes_aprovacao. Papel funcional indicado pelo identificador: aprovado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `solicitado_em` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna solicitado_em em public.solicitacoes_aprovacao. Papel funcional indicado pelo identificador: solicitado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| solicitacoes_aprovacao_aprovado_por_fkey | FOREIGN KEY | `FOREIGN KEY (aprovado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| solicitacoes_aprovacao_conta_pagar_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_pagar_id) REFERENCES contas_pagar(id)` | NO ACTION | NO ACTION | sim |
| solicitacoes_aprovacao_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| solicitacoes_aprovacao_solicitado_por_fkey | FOREIGN KEY | `FOREIGN KEY (solicitado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.aprovacao_assinaturas | aprovacao_assinaturas_solicitacao_id_fkey | solicitacao_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_solicitacoes_aprovacao_aprovado_por_fk | btree | aprovado_por | não | sim |  | `CREATE INDEX idx_solicitacoes_aprovacao_aprovado_por_fk ON public.solicitacoes_aprovacao USING btree (aprovado_por)` |
| idx_solicitacoes_aprovacao_conta_pagar_id_fk | btree | conta_pagar_id | não | sim |  | `CREATE INDEX idx_solicitacoes_aprovacao_conta_pagar_id_fk ON public.solicitacoes_aprovacao USING btree (conta_pagar_id)` |
| idx_solicitacoes_aprovacao_solicitado_por_fk | btree | solicitado_por | não | sim |  | `CREATE INDEX idx_solicitacoes_aprovacao_solicitado_por_fk ON public.solicitacoes_aprovacao USING btree (solicitado_por)` |
| solicitacoes_aprovacao_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX solicitacoes_aprovacao_pkey ON public.solicitacoes_aprovacao USING btree (id)` |


## Policies (RLS)

### `Owner manage aprovacoes`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

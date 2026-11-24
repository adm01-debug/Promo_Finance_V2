# public.transferencias

> Dicionário estrutural de public.transferencias (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (conta_destino_id) REFERENCES contas_bancarias(id); FOREIGN KEY (conta_origem_id) REFERENCES contas_bancarias(id); FOREIGN KEY (empresa_id) REFERENCES empresas(id); PRIMARY KEY (id); FOREIGN KEY (user_id) REFERENCES auth.users(id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.transferencias. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.transferencias. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `user_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna user_id em public.transferencias. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (user_id) REFERENCES auth.users(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `conta_origem_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_origem_id em public.transferencias. Papel funcional indicado pelo identificador: conta_origem_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (conta_origem_id) REFERENCES contas_bancarias(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `conta_destino_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_destino_id em public.transferencias. Papel funcional indicado pelo identificador: conta_destino_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (conta_destino_id) REFERENCES contas_bancarias(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `valor` | `numeric(15,2)` | não |  |  | Dicionário estrutural da coluna valor em public.transferencias. Papel funcional indicado pelo identificador: valor; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `descricao` | `text` | sim |  |  | Dicionário estrutural da coluna descricao em public.transferencias. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `data_transferencia` | `date` | sim | `CURRENT_DATE` |  | Dicionário estrutural da coluna data_transferencia em public.transferencias. Papel funcional indicado pelo identificador: data_transferencia; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: CURRENT_DATE. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `status` | `text` | sim | `'concluido'::text` |  | Dicionário estrutural da coluna status em public.transferencias. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'concluido'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `chave_pix` | `text` | sim |  |  | Dicionário estrutural da coluna chave_pix em public.transferencias. Papel funcional indicado pelo identificador: chave_pix; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `pix_chave_destino` | `text` | sim |  |  | Dicionário estrutural da coluna pix_chave_destino em public.transferencias. Papel funcional indicado pelo identificador: pix_chave_destino; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `favorecido_nome` | `text` | sim |  |  | Dicionário estrutural da coluna favorecido_nome em public.transferencias. Papel funcional indicado pelo identificador: favorecido_nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.transferencias. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `tipo` | `text` | sim |  |  | Dicionário estrutural da coluna tipo em public.transferencias. Papel funcional indicado pelo identificador: tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `movimentacao_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna movimentacao_id em public.transferencias. Papel funcional indicado pelo identificador: movimentacao_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.transferencias. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `cancelado_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna cancelado_em em public.transferencias. Papel funcional indicado pelo identificador: cancelado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| transferencias_conta_destino_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_destino_id) REFERENCES contas_bancarias(id)` | NO ACTION | NO ACTION | sim |
| transferencias_conta_origem_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_origem_id) REFERENCES contas_bancarias(id)` | NO ACTION | NO ACTION | sim |
| transferencias_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| transferencias_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| transferencias_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_transferencias_conta_destino_id_fk | btree | conta_destino_id | não | sim |  | `CREATE INDEX idx_transferencias_conta_destino_id_fk ON public.transferencias USING btree (conta_destino_id)` |
| idx_transferencias_conta_origem_id_fk | btree | conta_origem_id | não | sim |  | `CREATE INDEX idx_transferencias_conta_origem_id_fk ON public.transferencias USING btree (conta_origem_id)` |
| idx_transferencias_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_transferencias_empresa_id ON public.transferencias USING btree (empresa_id)` |
| idx_transferencias_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_transferencias_user_id_fk ON public.transferencias USING btree (user_id)` |
| transferencias_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX transferencias_pkey ON public.transferencias USING btree (id)` |


## Policies (RLS)

### `Empresa-based access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_transferencia_movimentacao | AFTER | INSERT OR UPDATE | ROW | enabled | public.fn_transferencia_movimentacao |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

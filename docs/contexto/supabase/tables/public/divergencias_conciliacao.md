# public.divergencias_conciliacao

> Dicionário estrutural de public.divergencias_conciliacao (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id) ON DELETE SET NULL; PRIMARY KEY (id); FOREIGN KEY (resolvido_por) REFERENCES auth.users(id); FOREIGN KEY (transacao_id) REFERENCES transacoes_bancarias(id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `transacao_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna transacao_id em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: transacao_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (transacao_id) REFERENCES transacoes_bancarias(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `descricao` | `text` | sim |  |  | Dicionário estrutural da coluna descricao em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `valor_divergencia` | `numeric` | sim |  |  | Dicionário estrutural da coluna valor_divergencia em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: valor_divergencia; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 6 | `resolvida_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna resolvida_por em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: resolvida_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `resolvida_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna resolvida_em em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: resolvida_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `tipo_divergencia` | `text` | sim |  |  | Dicionário estrutural da coluna tipo_divergencia em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: tipo_divergencia; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `resolvido_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna resolvido_por em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: resolvido_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (resolvido_por) REFERENCES auth.users(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `resolvido_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna resolvido_em em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: resolvido_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `conta_bancaria_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_bancaria_id em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: conta_bancaria_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `status` | `text` | não | `'aberta'::text` |  | Dicionário estrutural da coluna status em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'aberta'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `recomendacao` | `text` | sim |  |  | Dicionário estrutural da coluna recomendacao em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: recomendacao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `resolvido` | `boolean` | não | `false` |  | Dicionário estrutural da coluna resolvido em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: resolvido; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `resolvida` | `boolean` | sim | `false` |  | Dicionário estrutural da coluna resolvida em public.divergencias_conciliacao. Papel funcional indicado pelo identificador: resolvida; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| divergencias_conciliacao_conta_bancaria_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| divergencias_conciliacao_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| divergencias_conciliacao_resolvido_por_fkey | FOREIGN KEY | `FOREIGN KEY (resolvido_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| divergencias_conciliacao_transacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (transacao_id) REFERENCES transacoes_bancarias(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| divergencias_conciliacao_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX divergencias_conciliacao_pkey ON public.divergencias_conciliacao USING btree (id)` |
| idx_divergencias_conciliacao_conta_bancaria_id_fk | btree | conta_bancaria_id | não | sim |  | `CREATE INDEX idx_divergencias_conciliacao_conta_bancaria_id_fk ON public.divergencias_conciliacao USING btree (conta_bancaria_id)` |
| idx_divergencias_conciliacao_resolvido_por_fk | btree | resolvido_por | não | sim |  | `CREATE INDEX idx_divergencias_conciliacao_resolvido_por_fk ON public.divergencias_conciliacao USING btree (resolvido_por)` |
| idx_divergencias_conciliacao_transacao_id_fk | btree | transacao_id | não | sim |  | `CREATE INDEX idx_divergencias_conciliacao_transacao_id_fk ON public.divergencias_conciliacao USING btree (transacao_id)` |


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

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

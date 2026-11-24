# public.protestos

> Dicionário estrutural de public.protestos (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (cliente_id) REFERENCES clientes(id); FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id); FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL; PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.protestos. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `cliente_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna cliente_id em public.protestos. Papel funcional indicado pelo identificador: cliente_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (cliente_id) REFERENCES clientes(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `conta_receber_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_receber_id em public.protestos. Papel funcional indicado pelo identificador: conta_receber_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `valor` | `numeric` | não |  |  | Dicionário estrutural da coluna valor em public.protestos. Papel funcional indicado pelo identificador: valor; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 5 | `status` | `text` | não | `'ativo'::text` |  | Dicionário estrutural da coluna status em public.protestos. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'ativo'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `cartorio` | `text` | sim |  |  | Dicionário estrutural da coluna cartorio em public.protestos. Papel funcional indicado pelo identificador: cartorio; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `numero_protesto` | `text` | sim |  |  | Dicionário estrutural da coluna numero_protesto em public.protestos. Papel funcional indicado pelo identificador: numero_protesto; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `data_protesto` | `date` | sim | `CURRENT_DATE` |  | Dicionário estrutural da coluna data_protesto em public.protestos. Papel funcional indicado pelo identificador: data_protesto; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: CURRENT_DATE. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `data_cancelamento` | `date` | sim |  |  | Dicionário estrutural da coluna data_cancelamento em public.protestos. Papel funcional indicado pelo identificador: data_cancelamento; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.protestos. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.protestos. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 12 | `cidade_cartorio` | `text` | sim |  |  | Dicionário estrutural da coluna cidade_cartorio em public.protestos. Papel funcional indicado pelo identificador: cidade_cartorio; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `estado_cartorio` | `text` | sim |  |  | Dicionário estrutural da coluna estado_cartorio em public.protestos. Papel funcional indicado pelo identificador: estado_cartorio; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `custas` | `numeric` | sim | `0` |  | Dicionário estrutural da coluna custas em public.protestos. Papel funcional indicado pelo identificador: custas; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 15 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.protestos. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `data_pagamento` | `date` | sim |  |  | Dicionário estrutural da coluna data_pagamento em public.protestos. Papel funcional indicado pelo identificador: data_pagamento; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `created_by` | `uuid` | sim | `auth.uid()` |  | Dicionário estrutural da coluna created_by em public.protestos. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: auth.uid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| protestos_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id)` | NO ACTION | NO ACTION | sim |
| protestos_conta_receber_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id)` | NO ACTION | NO ACTION | sim |
| protestos_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| protestos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_protestos_cliente_id_fk | btree | cliente_id | não | sim |  | `CREATE INDEX idx_protestos_cliente_id_fk ON public.protestos USING btree (cliente_id)` |
| idx_protestos_conta_receber_id_fk | btree | conta_receber_id | não | sim |  | `CREATE INDEX idx_protestos_conta_receber_id_fk ON public.protestos USING btree (conta_receber_id)` |
| idx_protestos_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_protestos_created_by ON public.protestos USING btree (created_by)` |
| idx_protestos_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_protestos_empresa_id ON public.protestos USING btree (empresa_id)` |
| protestos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX protestos_pkey ON public.protestos USING btree (id)` |


## Policies (RLS)

### `protestos_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `protestos_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.fila_cobrancas

> Dicionário estrutural de public.fila_cobrancas (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (status = ANY (ARRAY['pendente'::text, 'enviado'::text, 'falhou'::text, 'cancelado'::text])); FOREIGN KEY (cliente_id) REFERENCES clientes(id); FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id); FOREIGN KEY (etapa_id) REFERENCES regua_cobranca_etapas(id); PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.fila_cobrancas. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `cliente_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna cliente_id em public.fila_cobrancas. Papel funcional indicado pelo identificador: cliente_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (cliente_id) REFERENCES clientes(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `cliente_nome` | `text` | sim |  |  | Dicionário estrutural da coluna cliente_nome em public.fila_cobrancas. Papel funcional indicado pelo identificador: cliente_nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `conta_receber_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_receber_id em public.fila_cobrancas. Papel funcional indicado pelo identificador: conta_receber_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `etapa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna etapa_id em public.fila_cobrancas. Papel funcional indicado pelo identificador: etapa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (etapa_id) REFERENCES regua_cobranca_etapas(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `etapa` | `text` | sim |  |  | Dicionário estrutural da coluna etapa em public.fila_cobrancas. Papel funcional indicado pelo identificador: etapa; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `canal` | `text` | sim |  |  | Dicionário estrutural da coluna canal em public.fila_cobrancas. Papel funcional indicado pelo identificador: canal; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `destinatario` | `text` | sim |  |  | Dicionário estrutural da coluna destinatario em public.fila_cobrancas. Papel funcional indicado pelo identificador: destinatario; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `status` | `text` | não | `'pendente'::text` |  | Dicionário estrutural da coluna status em public.fila_cobrancas. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'pendente'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = ANY (ARRAY['pendente'::text, 'enviado'::text, 'falhou'::text, 'cancelado'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `tentativas` | `integer` | não | `0` |  | Dicionário estrutural da coluna tentativas em public.fila_cobrancas. Papel funcional indicado pelo identificador: tentativas; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 11 | `max_tentativas` | `integer` | não | `3` |  | Dicionário estrutural da coluna max_tentativas em public.fila_cobrancas. Papel funcional indicado pelo identificador: max_tentativas; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 3. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 12 | `last_error` | `text` | sim |  |  | Dicionário estrutural da coluna last_error em public.fila_cobrancas. Papel funcional indicado pelo identificador: last_error; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `scheduled_for` | `timestamp with time zone` | não |  |  | Dicionário estrutural da coluna scheduled_for em public.fila_cobrancas. Papel funcional indicado pelo identificador: scheduled_for; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `sent_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna sent_at em public.fila_cobrancas. Papel funcional indicado pelo identificador: sent_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 15 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.fila_cobrancas. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.fila_cobrancas. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 17 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna updated_at em public.fila_cobrancas. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 18 | `provider` | `text` | sim |  |  | Dicionário estrutural da coluna provider em public.fila_cobrancas. Papel funcional indicado pelo identificador: provider; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `erro_mensagem` | `text` | sim |  |  | Dicionário estrutural da coluna erro_mensagem em public.fila_cobrancas. Papel funcional indicado pelo identificador: erro_mensagem; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_fila_cobrancas_status | CHECK | `CHECK (status = ANY (ARRAY['pendente'::text, 'enviado'::text, 'falhou'::text, 'cancelado'::text]))` |  |  | sim |
| fila_cobrancas_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id)` | NO ACTION | NO ACTION | sim |
| fila_cobrancas_conta_receber_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id)` | NO ACTION | NO ACTION | sim |
| fila_cobrancas_etapa_id_fkey | FOREIGN KEY | `FOREIGN KEY (etapa_id) REFERENCES regua_cobranca_etapas(id)` | NO ACTION | NO ACTION | sim |
| fila_cobrancas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| fila_cobrancas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX fila_cobrancas_pkey ON public.fila_cobrancas USING btree (id)` |
| idx_fila_cobrancas_cliente_id_fk | btree | cliente_id | não | sim |  | `CREATE INDEX idx_fila_cobrancas_cliente_id_fk ON public.fila_cobrancas USING btree (cliente_id)` |
| idx_fila_cobrancas_conta_receber_id_fk | btree | conta_receber_id | não | sim |  | `CREATE INDEX idx_fila_cobrancas_conta_receber_id_fk ON public.fila_cobrancas USING btree (conta_receber_id)` |
| idx_fila_cobrancas_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_fila_cobrancas_empresa_id ON public.fila_cobrancas USING btree (empresa_id)` |
| idx_fila_cobrancas_etapa_id_fk | btree | etapa_id | não | sim |  | `CREATE INDEX idx_fila_cobrancas_etapa_id_fk ON public.fila_cobrancas USING btree (etapa_id)` |


## Policies (RLS)

### `fila_cobrancas_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `fila_cobrancas_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_24d30bafb2eecf05024f | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
